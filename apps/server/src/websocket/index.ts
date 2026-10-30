import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: SocketIOServer | null = null;

export function initSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH"],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.on("connection", (socket) => {
    socket.on("join:group", (groupId: number) => {
      socket.join(`group:${groupId}`);
    });

    socket.on("leave:group", (groupId: number) => {
      socket.leave(`group:${groupId}`);
    });
  });

  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

/**
 * Broadcast an updated group state or status change to all connected clients in real time
 */
export function broadcastGroupUpdate(groupId: number) {
  if (!io) return;

  try {
    io.to(`group:${groupId}`).emit("group:updated", { groupId, timestamp: Date.now() });
    io.emit("status:updated", { groupId, timestamp: Date.now() });
  } catch (err) {
    console.error("Failed to broadcast group update:", err);
  }
}
