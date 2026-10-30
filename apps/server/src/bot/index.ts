import { Bot, session, GrammyError, HttpError } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import { startCommand } from "./commands/start.js";
import { statusCommand } from "./commands/status.js";
import { groupCommand } from "./commands/group.js";
import { handleStatusCallback } from "./callbacks/status.js";
import { handleLocationUpdate } from "./handlers/location.js";

// Session data
interface SessionData {
  step?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export function createBot(): Bot<BotContext> | null {
  const token = process.env.BOT_TOKEN;
  if (!token || token === "YOUR_BOT_TOKEN_HERE") {
    console.warn("⚠️  BOT_TOKEN not set! Bot is disabled.");
    console.warn("   Get a token from @BotFather on Telegram and put it in .env");
    return null;
  }

  const bot = new Bot<BotContext>(token);

  // Session middleware
  bot.use(
    session({
      initial: (): SessionData => ({}),
    })
  );

  // Commands
  bot.command("start", startCommand);
  bot.command("ready", (ctx) => statusCommand(ctx, "READY"));
  bot.command("busy", (ctx) => statusCommand(ctx, "UNAVAILABLE"));
  bot.command("maybe", (ctx) => statusCommand(ctx, "UNLIKELY"));
  bot.command("status", (ctx) => statusCommand(ctx, "VIEW"));
  bot.command("group", groupCommand);

  // Inline keyboard callbacks
  bot.callbackQuery(/^status:/, handleStatusCallback);

  // Location updates (Live Location)
  bot.on("message:location", handleLocationUpdate);
  bot.on("edited_message:location", handleLocationUpdate);

  // Error handling
  bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof GrammyError) {
      console.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
      console.error("Could not contact Telegram:", e);
    } else {
      console.error("Unknown error:", e);
    }
  });

  return bot;
}
