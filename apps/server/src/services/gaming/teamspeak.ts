import net from "node:net";

/**
 * TeamSpeak 3 ServerQuery Client (TCP)
 * Queries TS3 server for connected clients and channels
 */

export interface TS3Client {
  nickname: string;
  channelId: number;
  channelName: string;
  isMuted: boolean;
}

export class TeamSpeakService {
  private host: string | null;
  private queryPort: number;
  private serverPort: number;
  private queryUser: string | null;
  private queryPass: string | null;

  constructor() {
    this.host = process.env.TS3_HOST || null;
    this.queryPort = parseInt(process.env.TS3_QUERY_PORT || "10011", 10);
    this.serverPort = parseInt(process.env.TS3_SERVER_PORT || "9987", 10);
    this.queryUser = process.env.TS3_QUERY_USER || null;
    this.queryPass = process.env.TS3_QUERY_PASSWORD || null;
  }

  public isConfigured(): boolean {
    return Boolean(this.host && this.host.trim().length > 0);
  }

  /**
   * Fetches list of active clients on the TS3 server
   */
  async getConnectedClients(): Promise<TS3Client[]> {
    if (!this.isConfigured() || !this.host) return [];

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(4000);

      let buffer = "";
      const clients: TS3Client[] = [];
      const channels = new Map<number, string>();

      const cleanup = () => {
        socket.destroy();
      };

      socket.on("timeout", () => {
        cleanup();
        resolve(clients);
      });

      socket.on("error", (err) => {
        console.warn("TS3 ServerQuery connection error:", err.message);
        cleanup();
        resolve(clients);
      });

      let state = 0; // 0 = welcome, 1 = login/select, 2 = channellist, 3 = clientlist

      socket.connect(this.queryPort, this.host!, () => {
        // Connected
      });

      socket.on("data", (data) => {
        buffer += data.toString("utf-8");

        if (buffer.includes("TS3\n\r") || buffer.includes("Welcome to the TeamSpeak 3")) {
          if (state === 0) {
            state = 1;
            // Select virtual server
            socket.write(`use port=${this.serverPort}\n`);
            if (this.queryUser && this.queryPass) {
              socket.write(`login ${this.queryUser} ${this.queryPass}\n`);
            }
            socket.write("channellist\n");
            socket.write("clientlist -voice\n");
            socket.write("quit\n");
          }
        }

        // Parse channels
        if (buffer.includes("cid=")) {
          const lines = buffer.split("\n\r");
          for (const line of lines) {
            if (line.includes("cid=") && line.includes("channel_name=")) {
              const entries = line.split("|");
              for (const entry of entries) {
                const cidMatch = entry.match(/cid=(\d+)/);
                const nameMatch = entry.match(/channel_name=([^\s]+)/);
                if (cidMatch && nameMatch) {
                  channels.set(parseInt(cidMatch[1], 10), decodeTS(nameMatch[1]));
                }
              }
            }

            // Parse clients
            if (line.includes("clid=") && line.includes("client_nickname=")) {
              const entries = line.split("|");
              for (const entry of entries) {
                const typeMatch = entry.match(/client_type=(\d+)/);
                // client_type=0 is human player (not serverquery)
                if (typeMatch && typeMatch[1] === "0") {
                  const nickMatch = entry.match(/client_nickname=([^\s]+)/);
                  const cidMatch = entry.match(/cid=(\d+)/);
                  const muteMatch = entry.match(/client_input_muted=(\d+)/);

                  if (nickMatch && cidMatch) {
                    const cid = parseInt(cidMatch[1], 10);
                    clients.push({
                      nickname: decodeTS(nickMatch[1]),
                      channelId: cid,
                      channelName: channels.get(cid) || "Канал",
                      isMuted: muteMatch ? muteMatch[1] === "1" : false,
                    });
                  }
                }
              }
            }
          }
        }
      });

      socket.on("close", () => {
        resolve(clients);
      });
    });
  }
}

/**
 * TeamSpeak escapes backslashes, spaces (\s), pipes (\p), slashes (/)
 */
function decodeTS(str: string): string {
  return str
    .replace(/\\s/g, " ")
    .replace(/\\p/g, "|")
    .replace(/\\\//g, "/")
    .replace(/\\\\/g, "\\");
}

export const teamspeakService = new TeamSpeakService();
