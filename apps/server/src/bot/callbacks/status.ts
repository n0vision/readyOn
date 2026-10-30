import type { BotContext } from "../index.js";
import { prisma } from "../../db/prisma.js";
import type { ReadyStatus } from "@prisma/client";
import {
  STATUS_EMOJI,
  STATUS_TEXT,
  getToday,
  buildGroupKeyboard,
  formatGroupText,
} from "../commands/status.js";

export async function handleStatusCallback(ctx: BotContext) {
  if (!ctx.from || !ctx.callbackQuery?.data) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    await ctx.answerCallbackQuery({ text: "Сначала нажми /start!" });
    return;
  }

  const parts = ctx.callbackQuery.data.split(":");
  const status = parts[1] as ReadyStatus;
  const time = parts.length >= 4 ? `${parts[2]}:${parts[3]}` : parts[2] || null;

  const today = getToday();
  const availableFrom =
    time === "now"
      ? new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
      : time;

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

  const emoji = STATUS_EMOJI[status] || "🟢";
  const label = STATUS_TEXT[status] || "Готов";
  let toastText = `${emoji} ${label}`;
  if (availableFrom) {
    toastText += ` c ${availableFrom}`;
  }

  // Answer callback query immediately with notification popup
  await ctx.answerCallbackQuery({ text: toastText });

  let reply = `${emoji} Статус обновлён: **${label}**`;
  if (availableFrom) {
    reply += ` с ${availableFrom}`;
  }

  try {
    await ctx.editMessageText(reply + "\n\nИспользуй /status чтобы увидеть статусы группы.", {
      parse_mode: "Markdown",
    });
  } catch (err) {
    // If message is not modified, ignore
  }
}

export async function handleGroupStatusRefresh(ctx: BotContext) {
  if (!ctx.from || !ctx.callbackQuery?.data) return;

  const parts = ctx.callbackQuery.data.split(":");
  const groupId = parseInt(parts[2], 10);

  if (!groupId) {
    await ctx.answerCallbackQuery({ text: "Группа не найдена" });
    return;
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            include: {
              dailyStatuses: {
                where: { date: getToday() },
                take: 1,
              },
              onlineStatus: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    await ctx.answerCallbackQuery({ text: "Группа не найдена" });
    return;
  }

  const updatedText = formatGroupText(group);
  const keyboard = buildGroupKeyboard(group.id);

  await ctx.answerCallbackQuery({ text: "Статусы обновлены! 🔄" });

  try {
    await ctx.editMessageText(updatedText, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  } catch (err: any) {
    // If text hasn't changed, Telegram returns 400 'message is not modified', which is fine
  }
}
