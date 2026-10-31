import "dotenv/config";
import { createServer } from "./server.js";
import { createBot, BOT_COMMANDS } from "./bot/index.js";
import { prisma } from "./db/prisma.js";
import { redis } from "./db/redis.js";
import { gamingPoller } from "./services/gaming/poller.js";
import { calendarPoller } from "./services/calendar/poller.js";
import { notificationEngine } from "./services/notification/engine.js";
import { initSocketServer } from "./websocket/index.js";

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

  // Initialize Socket.IO real-time server
  initSocketServer(server.server);
  console.log("✅ Socket.IO real-time server initialized");

  // Start background gaming poller (Steam, FACEIT, TeamSpeak)
  gamingPoller.start();

  // Start background calendar poller
  calendarPoller.start();

  // Start Telegram bot (if configured)
  const bot = createBot();
  if (bot) {
    notificationEngine.setBot(bot);
    notificationEngine.start();

    bot.start({
      onStart: async (botInfo) => {
        console.log(`✅ Bot started as @${botInfo.username}`);
        try {
          await bot.api.setMyCommands(BOT_COMMANDS);
          console.log("✅ Telegram bot commands registered for '/' menu");

          const miniAppUrl = process.env.MINI_APP_URL;
          if (miniAppUrl && miniAppUrl.startsWith("https://")) {
            await bot.api.setChatMenuButton({
              menu_button: {
                type: "web_app",
                text: "readyOn",
                web_app: { url: miniAppUrl },
              },
            });
            console.log(`✅ Telegram bot menu button set to ${miniAppUrl}`);
          }

          // One-time initial patchnote broadcast to all registered users
          try {
            const alreadySent = await redis.get("patchnote_initial_broadcast_v1.3.0");
            if (!alreadySent) {
              console.log("📢 Sending initial v1.3.0 patchnotes announcement to all users in bot...");
              const result = await notificationEngine.broadcastPatchnote(undefined, true);
              console.log(
                `📢 Initial patchnotes broadcast finished: ${result.sent} sent, ${result.failed} failed out of ${result.total}`
              );
              await redis.set("patchnote_initial_broadcast_v1.3.0", "true");
            }
          } catch (err: any) {
            console.warn("⚠️ Initial patchnotes broadcast error:", err.message);
          }
        } catch (e: any) {
          console.warn("⚠️ Failed to set bot commands/menu:", e.message);
        }
      },
    });
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Shutting down...");
    gamingPoller.stop();
    calendarPoller.stop();
    notificationEngine.stop();
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
