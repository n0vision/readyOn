import type { BotContext } from "../index.js";
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
    await showGroupList(ctx, user.id);
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
      await showInviteLink(ctx, user.id);
      break;
    }

    default:
      await ctx.reply(
        "Доступные команды:\n" +
          "`/group` — список групп\n" +
          "`/group create Название` — создать группу\n" +
          "`/group invite` — ссылка-инвайт",
        { parse_mode: "Markdown" }
      );
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

  const botInfo = ctx.me;
  const inviteLink = `https://t.me/${botInfo.username}?start=group_${inviteCode}`;

  await ctx.reply(
    `✅ Группа «${name}» создана!\n\n` +
      `🔗 Пригласи друзей:\n${inviteLink}\n\n` +
      `Отправь ссылку в чат — друзья перейдут и присоединятся автоматически!`
  );
}

async function showGroupList(ctx: BotContext, userId: number) {
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

  if (memberships.length === 0) {
    await ctx.reply(
      "У тебя пока нет групп.\n\n" +
        "Создай: `/group create CS Пацаны`\n" +
        "Или попроси друга прислать инвайт-ссылку!",
      { parse_mode: "Markdown" }
    );
    return;
  }

  let text = "👥 **Твои группы:**\n\n";
  for (const m of memberships) {
    const role = m.role === "OWNER" ? "👑" : m.role === "ADMIN" ? "⭐" : "";
    text += `${role} **${m.group.name}** — ${m.group._count.members} участников\n`;
  }

  await ctx.reply(text, { parse_mode: "Markdown" });
}

async function showInviteLink(ctx: BotContext, userId: number) {
  const memberships = await prisma.groupMember.findMany({
    where: { userId, role: { in: ["OWNER", "ADMIN"] } },
    include: { group: true },
  });

  if (memberships.length === 0) {
    await ctx.reply("У тебя нет групп, в которые ты можешь приглашать.");
    return;
  }

  const botInfo = ctx.me;
  let text = "🔗 **Ссылки-инвайты:**\n\n";
  for (const m of memberships) {
    const link = `https://t.me/${botInfo.username}?start=group_${m.group.inviteCode}`;
    text += `**${m.group.name}:** ${link}\n`;
  }

  await ctx.reply(text, { parse_mode: "Markdown" });
}
