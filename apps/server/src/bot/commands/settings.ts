import type { BotContext } from "../index.js";
import { InlineKeyboard } from "grammy";
import { prisma } from "../../db/prisma.js";

export async function settingsCommand(ctx: BotContext) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    await ctx.reply("Сначала нажми /start!");
    return;
  }

  const membership = await prisma.groupMember.findFirst({
    where: { userId: user.id },
    include: { group: true },
  });

  if (!membership) {
    await ctx.reply("У тебя пока нет групп для настройки.\nСоздай группу: `/group create CS Пацаны`", {
      parse_mode: "Markdown",
    });
    return;
  }

  const group = membership.group;
  const keyboard = new InlineKeyboard()
    .text("⏰ 16:00", `set:hour:${group.id}:16`)
    .text("⏰ 17:00", `set:hour:${group.id}:17`)
    .text("⏰ 18:00", `set:hour:${group.id}:18`)
    .text("⏰ 19:00", `set:hour:${group.id}:19`)
    .row()
    .text("🎯 3 игрока", `set:size:${group.id}:3`)
    .text("🎯 4 игрока", `set:size:${group.id}:4`)
    .text("🎯 5 игроков", `set:size:${group.id}:5`)
    .row()
    .text("📱 Открыть настройки в Mini App", "open:miniapp");

  await ctx.reply(
    `⚙️ **Настройки группы «${group.name}»**\n\n` +
      `• ⏰ **Время вечернего опросника:** каждый день в \`${group.reminderHour}:00\`\n` +
      `• 🎯 **Порог сбора команды:** \`${group.targetSize} игроков\` (при наборе сработает алерт «Фулл-стак»)\n\n` +
      `Выбери параметр для изменения:`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

export async function handleSettingsCallback(ctx: BotContext) {
  if (!ctx.callbackQuery?.data) return;

  const parts = ctx.callbackQuery.data.split(":");
  const param = parts[1]; // "hour" | "size"
  const groupId = parseInt(parts[2], 10);
  const val = parseInt(parts[3], 10);

  if (param === "hour") {
    await prisma.group.update({
      where: { id: groupId },
      data: { reminderHour: val },
    });
    await ctx.answerCallbackQuery({ text: `Время опросника изменено на ${val}:00! ⏰` });
  } else if (param === "size") {
    await prisma.group.update({
      where: { id: groupId },
      data: { targetSize: val },
    });
    await ctx.answerCallbackQuery({ text: `Порог команды изменён на ${val} игроков! 🎯` });
  }

  await settingsCommand(ctx);
}
