import "dotenv/config";
import { createServer } from "./server.js";
import { createBot } from "./bot/index.js";
import { prisma } from "./db/prisma.js";
import { redis } from "./db/redis.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

async function main() {
  console.log("🚀 Starting readyOn server...");

  // Initialize database
  await prisma.$connect();
  console.log("✅ Database connected");

  // Check Redis
  await redis.ping();
  console.log("✅ Redis connected");

  // Create and start Fastify server
  const server = await createServer();
  await server.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`✅ API server running on http://localhost:${PORT}`);

  // Start Telegram bot (if configured)
  const bot = createBot();
  if (bot) {
    bot.start({
      onStart: (botInfo) => {
        console.log(`✅ Bot started as @${botInfo.username}`);
      },
    });
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Shutting down...");
    if (bot) bot.stop();
    await server.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});
