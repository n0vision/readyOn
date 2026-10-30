import type { BotContext } from "../index.js";
import { prisma } from "../../db/prisma.js";
import type { ReadyStatus } from "@prisma/client";
import { getStatusKeyboard } from "../commands/start.js";

export async function handleStatusCallback(ctx: BotContext) {
  if (!ctx.from || !ctx.callbackQuery?.data) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    await ctx.answerCallbackQuery("Сначала нажми /start!");
    return;
  }

  const parts = ctx.callbackQuery.data.split(":");
  // "status:READY", "status:READY:19:00", "status:UNAVAILABLE", etc.
  const status = parts[1] as ReadyStatus;
  const time = parts.length >= 4 ? `${parts[2]}:${parts[3]}` : parts[2] || null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableFrom = time === "now" ? new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) : time;

  await prisma.dailyStatus.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: { status, availableFrom },
    create: {
      userId: user.id,
      date: today,
      status,
      availableFrom,
    },
  });

  const emoji: Record<string, string> = {
    READY: "🟢",
    UNAVAILABLE: "🔴",
    UNLIKELY: "🟡",
  };

  const label: Record<string, string> = {
    READY: "Готов",
    UNAVAILABLE: "Не сегодня",
    UNLIKELY: "Маловероятно",
  };

  let reply = `${emoji[status]} Статус: **${label[status]}**`;
  if (availableFrom) {
    reply += ` с ${availableFrom}`;
  }

  await ctx.answerCallbackQuery(reply.replace(/\*/g, ""));

  await ctx.editMessageText(reply + "\n\nИспользуй /status чтобы увидеть статусы группы.", {
    parse_mode: "Markdown",
  });
}
