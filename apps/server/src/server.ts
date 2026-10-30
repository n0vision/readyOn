import Fastify from "fastify";
import cors from "@fastify/cors";
import { statusRoutes } from "./routes/status.js";
import { groupRoutes } from "./routes/groups.js";
import { friendRoutes } from "./routes/friends.js";
import { userRoutes } from "./routes/users.js";
import { calendarRoutes } from "./routes/calendar.js";

export async function createServer() {
  const app = Fastify({
    logger: {
      level: "info",
      transport: {
        target: "pino-pretty",
        options: { colorize: true },
      },
    },
  });

  // CORS for Mini App
  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  // Health check
  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // API routes
  await app.register(statusRoutes, { prefix: "/api/status" });
  await app.register(groupRoutes, { prefix: "/api/groups" });
  await app.register(friendRoutes, { prefix: "/api/friends" });
  await app.register(userRoutes, { prefix: "/api/users" });
  await app.register(calendarRoutes, { prefix: "/api/calendar" });

  return app;
}
