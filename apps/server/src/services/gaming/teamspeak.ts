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
  get host(): string | null {
    return process.env.TS3_HOST || null;
  }
  get queryPort(): number {
    return parseInt(process.env.TS3_QUERY_PORT || "10011", 10);
  }
  get serverPort(): number {
    return parseInt(process.env.TS3_SERVER_PORT || "9987", 10);
  }
  get queryUser(): string | null {
    return process.env.TS3_QUERY_USER || null;
  }
  get queryPass(): string | null {
    return process.env.TS3_QUERY_PASSWORD || null;
  }

  public isConfigured(): boolean {
    const h = this.host;
    return Boolean(h && h.trim().length > 0);
  }

  /**
   * Fetches list of active clients on the TS3 server
   */
  async getConnectedClients(): Promise<TS3Client[]> {
    if (!this.isConfigured() || !this.host) return [];

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);

      let buffer = "";
      const clients: TS3Client[] = [];
      const channels = new Map<number, string>();

      let step = "WAIT_BANNER"; // WAIT_BANNER -> WAIT_USE -> WAIT_CHANNELS -> WAIT_CLIENTS -> DONE

      const cleanup = () => {
        try {
          socket.destroy();
        } catch {}
        resolve(clients);
      };

      socket.on("timeout", cleanup);
      socket.on("error", (err) => {
        console.warn("TS3 ServerQuery error:", err.message);
        cleanup();
      });

      socket.connect(this.queryPort, this.host!, () => {
        // Connected
      });

      socket.on("data", (chunk) => {
        buffer += chunk.toString("utf-8");

        // Process line by line
        while (buffer.includes("\n")) {
          const newlineIdx = buffer.indexOf("\n");
          const line = buffer.slice(0, newlineIdx).replace(/\r$/, "");
          buffer = buffer.slice(newlineIdx + 1);

          if (!line.trim()) continue;

          if (step === "WAIT_BANNER") {
            if (line.includes("Welcome to the TeamSpeak 3")) {
              step = "WAIT_USE";
              socket.write(`use port=${this.serverPort}\n\r`);
            }
          } else if (step === "WAIT_USE") {
            if (line.startsWith("error id=")) {
              if (line.includes("id=0")) {
                step = "WAIT_CHANNELS";
                socket.write("channellist\n\r");
              } else {
                console.warn("TS3 select server error:", line);
                cleanup();
                return;
              }
            }
          } else if (step === "WAIT_CHANNELS") {
            if (line.includes("cid=") && line.includes("channel_name=")) {
              const entries = line.split("|");
              for (const entry of entries) {
                const cidMatch = entry.match(/cid=(\d+)/);
                const nameMatch = entry.match(/channel_name=([^\s]+)/);
                if (cidMatch && nameMatch) {
                  channels.set(parseInt(cidMatch[1], 10), decodeTS(nameMatch[1]));
                }
              }
            } else if (line.startsWith("error id=")) {
              step = "WAIT_CLIENTS";
              socket.write("clientlist -voice\n\r");
            }
          } else if (step === "WAIT_CLIENTS") {
            if (line.includes("clid=") && line.includes("client_nickname=")) {
              const entries = line.split("|");
              for (const entry of entries) {
                const typeMatch = entry.match(/client_type=(\d+)/);
                // client_type=0 is normal user (not query)
                if (!typeMatch || typeMatch[1] === "0") {
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
            } else if (line.startsWith("error id=")) {
              step = "DONE";
              socket.write("quit\n\r");
              cleanup();
              return;
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
