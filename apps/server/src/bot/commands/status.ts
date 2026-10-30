import type { BotContext } from "../index.js";
import { InlineKeyboard } from "grammy";
import { prisma } from "../../db/prisma.js";
import type { ReadyStatus } from "@prisma/client";

const STATUS_EMOJI: Record<string, string> = {
  READY: "🟢",
  UNAVAILABLE: "🔴",
  UNLIKELY: "🟡",
  UNSET: "⚪",
};

const STATUS_TEXT: Record<string, string> = {
  READY: "Готов",
  UNAVAILABLE: "Не сегодня",
  UNLIKELY: "Маловероятно",
  UNSET: "Не выставлен",
};

export async function statusCommand(ctx: BotContext, action: string) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user) {
    await ctx.reply("Сначала нажми /start чтобы зарегистрироваться!");
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // VIEW — показать статусы группы
  if (action === "VIEW") {
    return showGroupStatuses(ctx, user.id);
  }

  // SET — установить статус
  const status = action as ReadyStatus;

  // If READY, ask for time
  if (status === "READY") {
    const timeKeyboard = new InlineKeyboard()
      .text("17:00", "status:READY:17:00")
      .text("18:00", "status:READY:18:00")
      .text("19:00", "status:READY:19:00")
      .row()
      .text("20:00", "status:READY:20:00")
      .text("21:00", "status:READY:21:00")
      .text("22:00", "status:READY:22:00")
      .row()
      .text("Сейчас!", "status:READY:now");

    await ctx.reply("🟢 Во сколько будешь готов?", {
      reply_markup: timeKeyboard,
    });
    return;
  }

  // Set status directly for UNAVAILABLE / UNLIKELY
  await prisma.dailyStatus.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    update: { status, availableFrom: null, comment: null },
    create: { userId: user.id, date: today, status },
  });

  await ctx.reply(
    `${STATUS_EMOJI[status]} Статус обновлён: **${STATUS_TEXT[status]}**`,
    { parse_mode: "Markdown" }
  );

  // Show group statuses after setting
  await showGroupStatuses(ctx, user.id);
}

async function showGroupStatuses(ctx: BotContext, userId: number) {
  // Get user's groups
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
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
      },
    },
  });

  if (memberships.length === 0) {
    await ctx.reply(
      "У тебя пока нет групп. Создай одну: /group create Название\n" +
        "Или присоединись по ссылке-инвайту!"
    );
    return;
  }

  for (const membership of memberships) {
    const group = membership.group;
    let text = `👥 **${group.name}**\n\n`;

    for (const member of group.members) {
      const ds = member.user.dailyStatuses[0];
      const status = ds?.status || "UNSET";
      const emoji = STATUS_EMOJI[status];
      const label = STATUS_TEXT[status];

      let line = `${emoji} **${member.user.displayName}** — ${label}`;

      if (ds?.availableFrom) {
        line += ` с ${ds.availableFrom}`;
      }
      if (ds?.comment) {
        line += ` _(${ds.comment})_`;
      }

      // Online indicators
      const os = member.user.onlineStatus;
      if (os) {
        const indicators: string[] = [];
        if (os.steamStatus === "in_game" && os.steamGame) {
          indicators.push(`🎮 ${os.steamGame}`);
        } else if (os.steamStatus === "online") {
          indicators.push("🎮 Steam онлайн");
        }
        if (os.tsStatus === "connected") {
          indicators.push(`🎧 TS: ${os.tsChannel || "подключён"}`);
        }
        if (os.locationStatus === "transit" && os.etaMinutes) {
          indicators.push(`📍 в пути ~${os.etaMinutes} мин`);
        } else if (os.locationStatus === "away") {
          indicators.push("📍 не дома");
        }
        if (indicators.length > 0) {
          line += "\n     " + indicators.join(" · ");
        }
      }

      text += line + "\n";
    }

    const keyboard = new InlineKeyboard()
      .text("🔄 Обновить", `groups:status:${group.id}`)
      .text("📱 Mini App", "open:miniapp");

    await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
  }
}

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
