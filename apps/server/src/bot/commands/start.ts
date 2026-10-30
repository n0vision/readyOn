import type { BotContext } from "../index.js";
import { InlineKeyboard } from "grammy";
import { prisma } from "../../db/prisma.js";

export async function startCommand(ctx: BotContext) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);

  // Upsert user
  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      username: ctx.from.username || null,
      displayName: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ""),
    },
    create: {
      telegramId,
      username: ctx.from.username || null,
      displayName: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ""),
    },
  });

  // Check if joining a group via deep link
  const payload = ctx.match;
  if (typeof payload === "string" && payload.startsWith("group_")) {
    const inviteCode = payload.replace("group_", "");
    const group = await prisma.group.findUnique({ where: { inviteCode } });

    if (group) {
      // Add to group if not already a member
      await prisma.groupMember.upsert({
        where: {
          groupId_userId: { groupId: group.id, userId: user.id },
        },
        update: {},
        create: {
          groupId: group.id,
          userId: user.id,
          role: "MEMBER",
        },
      });

      await ctx.reply(
        `👋 Привет, ${user.displayName}!\n\n` +
          `Ты присоединился к группе «${group.name}»!\n\n` +
          `Поставь статус на сегодня:`,
        { reply_markup: getStatusKeyboard() }
      );
      return;
    }
  }

  // Regular start
  const keyboard = new InlineKeyboard()
    .text("🟢 Готов", "status:READY")
    .text("🟡 Может быть", "status:UNLIKELY")
    .text("🔴 Не сегодня", "status:UNAVAILABLE")
    .row()
    .text("👥 Мои группы", "groups:list")
    .text("👤 Друзья", "friends:list");

  await ctx.reply(
    `👋 Привет, ${user.displayName}!\n\n` +
      `**readyOn** — покажи друзьям, когда ты готов играть.\n\n` +
      `🎮 Поставь статус на сегодня:`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

export function getStatusKeyboard() {
  return new InlineKeyboard()
    .text("🟢 Готов", "status:READY")
    .text("🟡 Может быть", "status:UNLIKELY")
    .text("🔴 Не сегодня", "status:UNAVAILABLE");
}
