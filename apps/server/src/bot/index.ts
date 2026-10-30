import { Bot, session, GrammyError, HttpError, InlineKeyboard } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import { startCommand } from "./commands/start.js";
import { menuCommand } from "./commands/menu.js";
import { statusCommand } from "./commands/status.js";
import { groupCommand, showGroupsWithInvites } from "./commands/group.js";
import { linkCommand, unlinkCommand } from "./commands/link.js";
import { pollCommand, handlePollCallback } from "./commands/poll.js";
import { settingsCommand, handleSettingsCallback } from "./commands/settings.js";
import { handleStatusCallback, handleGroupStatusRefresh } from "./callbacks/status.js";
import { handleLocationUpdate } from "./handlers/location.js";
import { prisma } from "../db/prisma.js";

// Session data
interface SessionData {
  step?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export const BOT_COMMANDS = [
  { command: "menu", description: "Главное меню с кнопками" },
  { command: "status", description: "Кто сегодня готов играть" },
  { command: "poll", description: "Разослать опросник готовности пацанам" },
  { command: "group", description: "Твоя группа и ссылка-инвайт" },
  { command: "settings", description: "Настройки группы и напоминалок" },
  { command: "link", description: "Привязать Steam / FACEIT" },
  { command: "ready", description: "Отметить готовность (🟢)" },
  { command: "maybe", description: "Маловероятно / попозже (🟡)" },
  { command: "busy", description: "Сегодня никак не могу (🔴)" },
  { command: "start", description: "Перезапуск и информация" },
];

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
  bot.command("menu", menuCommand);
  bot.command("ready", (ctx) => statusCommand(ctx, "READY"));
  bot.command("busy", (ctx) => statusCommand(ctx, "UNAVAILABLE"));
  bot.command("maybe", (ctx) => statusCommand(ctx, "UNLIKELY"));
  bot.command("status", (ctx) => statusCommand(ctx, "VIEW"));
  bot.command("group", groupCommand);
  bot.command("link", linkCommand);
  bot.command("unlink", unlinkCommand);
  bot.command("poll", pollCommand);
  bot.command("settings", settingsCommand);

  // Inline keyboard callbacks
  bot.callbackQuery(/^status:/, handleStatusCallback);
  bot.callbackQuery(/^groups:status:/, handleGroupStatusRefresh);
  bot.callbackQuery(/^poll:/, handlePollCallback);
  bot.callbackQuery(/^set:/, handleSettingsCallback);

  bot.callbackQuery("nav:menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await menuCommand(ctx);
  });

  bot.callbackQuery("groups:status_all", async (ctx) => {
    await ctx.answerCallbackQuery();
    await statusCommand(ctx, "VIEW");
  });

  bot.callbackQuery("groups:quick_invite", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    if (!user) return;
    await showGroupsWithInvites(ctx, user.id);
  });

  bot.callbackQuery("groups:list", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    if (!user) return;
    await showGroupsWithInvites(ctx, user.id);
  });

  bot.callbackQuery("friends:list", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      "🤝 Список друзей синхронизируется через группы и Telegram.\n" +
        "Используй /group чтобы получить инвайт-ссылку для отправки друзьям!"
    );
  });

  bot.callbackQuery("open:miniapp", async (ctx) => {
    const miniAppUrl = process.env.MINI_APP_URL || "https://soft-autumn-tells-yesterday.trycloudflare.com";
    const keyboard = new InlineKeyboard();
    if (miniAppUrl.startsWith("https://")) {
      keyboard.webApp("📱 Открыть readyOn", miniAppUrl);
    } else {
      keyboard.url("📱 Открыть readyOn", miniAppUrl);
    }
    await ctx.answerCallbackQuery({ text: "Открываем Mini App..." });
    await ctx.reply("Нажми кнопку ниже, чтобы открыть Mini App:", { reply_markup: keyboard });
  });

  // Fallback for any other callback query
  bot.on("callback_query", async (ctx) => {
    await ctx.answerCallbackQuery();
  });

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
