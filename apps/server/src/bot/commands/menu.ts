import type { BotContext } from "../index.js";
import { InlineKeyboard } from "grammy";
import { prisma } from "../../db/prisma.js";
import { STATUS_EMOJI, STATUS_TEXT, getToday } from "./status.js";

export async function menuCommand(ctx: BotContext) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    await ctx.reply("Сначала нажми /start чтобы зарегистрироваться!");
    return;
  }

  // Get user's today status
  const today = getToday();
  const ds = await prisma.dailyStatus.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });

  const currentStatusEmoji = ds ? STATUS_EMOJI[ds.status] || "⚪" : "⚪";
  const currentStatusText = ds ? STATUS_TEXT[ds.status] || "Не выставлен" : "Не выставлен";

  let statusLine = `${currentStatusEmoji} Твой статус: **${currentStatusText}**`;
  if (ds?.availableFrom) {
    statusLine += ` с ${ds.availableFrom}`;
  }

  const keyboard = new InlineKeyboard()
    .text("🟢 Готов", "status:READY")
    .text("🟡 Может быть", "status:UNLIKELY")
    .text("🔴 Не сегодня", "status:UNAVAILABLE")
    .row()
    .text("📊 Статусы пацанов", "groups:status_all")
    .text("🔗 Инвайт-ссылка", "groups:quick_invite")
    .row();

  const miniAppUrl = process.env.MINI_APP_URL || "https://soft-autumn-tells-yesterday.trycloudflare.com";
  if (miniAppUrl.startsWith("https://")) {
    keyboard.webApp("📱 Открыть Mini App", miniAppUrl);
  } else {
    keyboard.url("📱 Открыть Mini App", miniAppUrl);
  }

  await ctx.reply(
    `🎮 **Панель управления readyOn**\n\n` +
      `${statusLine}\n\n` +
      `Выбери статус на сегодня или действие:`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}
