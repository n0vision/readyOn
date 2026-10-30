import { Bot, session, GrammyError, HttpError, InlineKeyboard } from "grammy";
import type { Context, SessionFlavor } from "grammy";
import { startCommand } from "./commands/start.js";
import { statusCommand } from "./commands/status.js";
import { groupCommand } from "./commands/group.js";
import { handleStatusCallback, handleGroupStatusRefresh } from "./callbacks/status.js";
import { handleLocationUpdate } from "./handlers/location.js";
import { prisma } from "../db/prisma.js";

// Session data
interface SessionData {
  step?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;

export const BOT_COMMANDS = [
  { command: "status", description: "Посмотреть кто сегодня готов играть" },
  { command: "ready", description: "Отметить готовность (🟢)" },
  { command: "maybe", description: "Маловероятно / попозже (🟡)" },
  { command: "busy", description: "Сегодня никак не могу (🔴)" },
  { command: "group", description: "Управление группами и инвайты" },
  { command: "start", description: "Главное меню и регистрация" },
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
  bot.command("ready", (ctx) => statusCommand(ctx, "READY"));
  bot.command("busy", (ctx) => statusCommand(ctx, "UNAVAILABLE"));
  bot.command("maybe", (ctx) => statusCommand(ctx, "UNLIKELY"));
  bot.command("status", (ctx) => statusCommand(ctx, "VIEW"));
  bot.command("group", groupCommand);

  // Inline keyboard callbacks
  bot.callbackQuery(/^status:/, handleStatusCallback);
  bot.callbackQuery(/^groups:status:/, handleGroupStatusRefresh);

  bot.callbackQuery("groups:list", async (ctx) => {
    await ctx.answerCallbackQuery();
    if (!ctx.from) return;
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    if (!user) return;
    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      include: { group: { include: { _count: { select: { members: true } } } } },
    });
    if (memberships.length === 0) {
      await ctx.reply("У тебя пока нет групп.\nСоздай группу: `/group create Название`", {
        parse_mode: "Markdown",
      });
      return;
    }
    let text = "👥 **Твои группы:**\n\n";
    for (const m of memberships) {
      text += `• **${m.group.name}** — ${m.group._count.members} участников\n`;
    }
    await ctx.reply(text, { parse_mode: "Markdown" });
  });

  bot.callbackQuery("friends:list", async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      "🤝 Список друзей синхронизируется через группы и Telegram.\n" +
        "Пригласи друзей в бота или группу по инвайт-ссылке из `/group`!"
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

  // Fallback for any other callback query (to prevent infinite button loading)
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
