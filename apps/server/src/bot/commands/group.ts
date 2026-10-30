import type { BotContext } from "../index.js";
import { InlineKeyboard } from "grammy";
import { prisma } from "../../db/prisma.js";
import { nanoid } from "../../utils/nanoid.js";

export async function groupCommand(ctx: BotContext) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    await ctx.reply("Сначала нажми /start!");
    return;
  }

  const text = ctx.message?.text || "";
  const args = text.split(" ").slice(1);

  if (args.length === 0) {
    await showGroupsWithInvites(ctx, user.id);
    return;
  }

  const subcommand = args[0].toLowerCase();

  switch (subcommand) {
    case "create": {
      const name = args.slice(1).join(" ");
      if (!name) {
        await ctx.reply("Укажи название: `/group create Название группы`", {
          parse_mode: "Markdown",
        });
        return;
      }
      await createGroup(ctx, user.id, name);
      break;
    }

    case "invite": {
      await showGroupsWithInvites(ctx, user.id);
      break;
    }

    default:
      await ctx.reply(
        "Доступные команды групп:\n" +
          "• `/group` — показать группы и инвайт-ссылки\n" +
          "• `/group create <Имя>` — создать новую группу",
        { parse_mode: "Markdown" }
      );
  }
}

export async function showGroupsWithInvites(ctx: BotContext, userId: number) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  const botUsername = ctx.me?.username || "readyOnCS_bot";

  if (memberships.length === 0) {
    await ctx.reply(
      "У тебя пока нет групп.\n\n" +
        "Создай группу командой:\n" +
        "`/group create CS Пацаны`\n\n" +
        "Или перейди по ссылке-инвайту от друга!",
      { parse_mode: "Markdown" }
    );
    return;
  }

  for (const m of memberships) {
    const group = m.group;
    const inviteLink = `https://t.me/${botUsername}?start=group_${group.inviteCode}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(
      `Залетай в группу «${group.name}» в readyOn, чтобы договариваться об играх!`
    )}`;

    const keyboard = new InlineKeyboard()
      .url("📤 Переслать друзьям", shareUrl)
      .text("📊 Статусы", `groups:status:${group.id}`);

    const roleBadge = m.role === "OWNER" ? "👑 Владелец" : "⭐ Участник";

    const text =
      `👥 **Группа «${group.name}»** (${group._count.members} участников)\n` +
      `${roleBadge}\n\n` +
      `🔗 **Ссылка-инвайт для друзей:**\n` +
      `\`${inviteLink}\`\n\n` +
      `_Отправь эту ссылку друзьям — они перейдут и автоматически добавятся в группу._`;

    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    });
  }
}

async function createGroup(ctx: BotContext, userId: number, name: string) {
  const inviteCode = nanoid(8);

  const group = await prisma.group.create({
    data: {
      name,
      inviteCode,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: "OWNER",
        },
      },
    },
  });

  const botUsername = ctx.me?.username || "readyOnCS_bot";
  const inviteLink = `https://t.me/${botUsername}?start=group_${inviteCode}`;
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(
    `Залетай в группу «${name}» в readyOn!`
  )}`;

  const keyboard = new InlineKeyboard().url("📤 Переслать ссылку", shareUrl);

  await ctx.reply(
    `✅ Группа **«${name}»** успешно создана!\n\n` +
      `🔗 **Ссылка-инвайт:**\n` +
      `\`${inviteLink}\`\n\n` +
      `Перешли её друзьям в чат!`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}
