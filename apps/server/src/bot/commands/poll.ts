import type { BotContext } from "../index.js";
import { InlineKeyboard } from "grammy";
import { prisma } from "../../db/prisma.js";
import { notificationEngine } from "../../services/notification/engine.js";
import { getToday } from "./status.js";

export async function pollCommand(ctx: BotContext) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    await ctx.reply("Сначала нажми /start!");
    return;
  }

  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true },
  });

  if (memberships.length === 0) {
    await ctx.reply("У тебя пока нет групп. Создай группу: `/group create CS Пацаны`", {
      parse_mode: "Markdown",
    });
    return;
  }

  // If 1 group, trigger directly
  if (memberships.length === 1) {
    const group = memberships[0].group;
    await sendPollPrompt(ctx, group.id, group.name);
    return;
  }

  // If multiple groups, choose which group to poll
  const keyboard = new InlineKeyboard();
  for (const m of memberships) {
    keyboard.text(m.group.name, `poll:send:${m.group.id}`).row();
  }

  await ctx.reply("В какую группу разослать вечерний опросник?", {
    reply_markup: keyboard,
  });
}

export async function sendPollPrompt(ctx: BotContext, groupId: number, groupName: string) {
  const keyboard = new InlineKeyboard()
    .text("🚀 Да, разослать сейчас!", `poll:confirm:${groupId}`)
    .row()
    .text("Отмена", "poll:cancel");

  await ctx.reply(
    `📢 **Опрос готовности на вечер**\n\n` +
      `Разослать опросник всем участникам группы **«${groupName}»**, кто ещё не выставил статус?`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

export async function handlePollCallback(ctx: BotContext) {
  if (!ctx.callbackQuery?.data) return;

  const parts = ctx.callbackQuery.data.split(":");
  const action = parts[1];
  const groupId = parseInt(parts[2], 10);

  if (action === "send") {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return;
    await ctx.answerCallbackQuery();
    await sendPollPrompt(ctx, group.id, group.name);
    return;
  }

  if (action === "cancel") {
    await ctx.answerCallbackQuery({ text: "Отменено" });
    await ctx.editMessageText("Рассылка опросника отменена.");
    return;
  }

  if (action === "confirm") {
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              include: {
                dailyStatuses: { where: { date: getToday() }, take: 1 },
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

    await ctx.answerCallbackQuery({ text: "Рассылаем опросник... 📨" });
    const count = await notificationEngine.sendDailyPollForGroup(group);

    await ctx.editMessageText(
      `✅ **Опросник разослан!**\n\n` +
        `Отправлено участникам: **${count} чел.**\n` +
        `Им в личку пришли кнопки выбора статуса готовности на вечер.`,
      { parse_mode: "Markdown" }
    );
  }
}
