import { InlineKeyboard } from "grammy";
import type { BotContext } from "../index.js";
import { getLatestPatchnote } from "@readyon/shared";
import { prisma } from "../../db/prisma.js";

export async function patchnotesCommand(ctx: BotContext) {
  const patch = getLatestPatchnote();
  const miniAppUrl =
    process.env.MINI_APP_URL || "https://connectors-comparisons-divine-quilt.trycloudflare.com";

  let isSubscribed = false;
  if (ctx.from?.id) {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(ctx.from.id) },
    });
    const settings = (user?.notificationSettings as Record<string, any>) || {};
    isSubscribed = settings.news === true;
  }

  const changesList = patch.changes
    .map((c) => {
      const emoji = c.type === "new" ? "✨" : c.type === "improved" ? "⚡️" : "🛠";
      return `${emoji} *${c.title}*\n${c.description}`;
    })
    .join("\n\n");

  const text =
    `📜 *readyOn Patchnotes — ${patch.version}*\n` +
    `_${patch.date}_\n\n` +
    `*${patch.title}*\n` +
    `${patch.summary}\n\n` +
    `───────────────\n` +
    `${changesList}\n\n` +
    `───────────────\n` +
    (isSubscribed
      ? `✅ _Вы подписаны на рассылку будущих обновлений (/newsoff для отключения)_`
      : `🔔 _Хотите получать новости о будущих обновлениях? Отправьте команду /newson_`);

  const keyboard = new InlineKeyboard();
  if (miniAppUrl.startsWith("https://")) {
    keyboard.webApp("📱 Открыть Mini App", miniAppUrl).row();
  }

  if (isSubscribed) {
    keyboard.text("🔕 Отключить рассылку", "news:unsubscribe");
  } else {
    keyboard.text("🔔 Подписаться на новости", "news:subscribe");
  }

  await ctx.reply(text, {
    parse_mode: "Markdown",
    reply_markup: keyboard,
  });
}

export async function newsonCommand(ctx: BotContext) {
  if (!ctx.from?.id) return;
  const telegramId = BigInt(ctx.from.id);

  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  const settings = (user?.notificationSettings as Record<string, any>) || {};
  settings.news = true;

  await prisma.user.update({
    where: { telegramId },
    data: { notificationSettings: settings },
  });

  const miniAppUrl =
    process.env.MINI_APP_URL || "https://connectors-comparisons-divine-quilt.trycloudflare.com";
  const keyboard = new InlineKeyboard();
  if (miniAppUrl.startsWith("https://")) {
    keyboard.webApp("📱 Открыть Mini App", miniAppUrl).row();
  }
  keyboard.text("📜 Посмотреть патчноут", "news:view_patchnotes");

  await ctx.reply(
    `🔔 *Рассылка новостей и обновлений включена!*\n\n` +
      `Теперь ты будешь первым узнавать о выходе новых фичей, улучшений и интеграций в readyOn.\n\n` +
      `_Отключить рассылку можно в любой момент командой /newsoff или в настройках профиля Mini App._`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

export async function newsoffCommand(ctx: BotContext) {
  if (!ctx.from?.id) return;
  const telegramId = BigInt(ctx.from.id);

  const user = await prisma.user.findUnique({
    where: { telegramId },
  });

  const settings = (user?.notificationSettings as Record<string, any>) || {};
  settings.news = false;

  await prisma.user.update({
    where: { telegramId },
    data: { notificationSettings: settings },
  });

  await ctx.reply(
    `🔕 *Рассылка обновлений выключена.*\n\n` +
      `Бот больше не будет присылать уведомления о новых версиях. Ты всегда можешь посмотреть их вручную командой /patchnotes или по колокольчику 🔔 в Mini App.\n\n` +
      `Включить обратно: /newson`,
    {
      parse_mode: "Markdown",
    }
  );
}
