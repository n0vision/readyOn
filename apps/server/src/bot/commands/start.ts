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
        `🎉 Привет, ${user.displayName}!\n\n` +
          `Ты успешно присоединился к группе **«${group.name}»**!\n\n` +
          `Открой /menu чтобы выставить свой статус готовности на сегодня.`,
        {
          parse_mode: "Markdown",
          reply_markup: new InlineKeyboard().text("🎮 Открыть меню", "nav:menu"),
        }
      );
      return;
    }
  }

  // Pure start command: welcomes and introduces the bot without giant keyboard
  await ctx.reply(
    `👋 Привет, ${user.displayName}!\n\n` +
      `**readyOn** — приложение для гейминг-компаний.\n` +
      `Больше не нужно спамить «кс?» в чат — здесь всегда видно, кто готов играть, со скольки и откуда.\n\n` +
      `📌 **Доступные команды:**\n` +
      `• /menu — Главное меню со всеми кнопками\n` +
      `• /status — Кто сейчас готов играть\n` +
      `• /group — Твоя группа и ссылка-инвайт\n` +
      `• /ready, /maybe, /busy — Быстрая смена статуса\n\n` +
      `Используй /menu или нажми кнопку ниже, чтобы начать!`,
    {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text("🎮 Открыть меню", "nav:menu"),
    }
  );
}
