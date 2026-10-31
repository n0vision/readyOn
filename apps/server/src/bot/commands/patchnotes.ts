import { InlineKeyboard, InputFile } from "grammy";
import fs from "fs";
import path from "path";
import type { BotContext } from "../index.js";
import { getLatestPatchnote } from "@readyon/shared";
import { prisma } from "../../db/prisma.js";
import { getBannerFilePath } from "../../services/patchnotes/banner.js";

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

  // Format the complete changelog to fit strictly within 1010 characters so photo + text are in ONE single message
  const header =
    `📜 *readyOn Patchnotes — ${patch.version}*\n` +
    `_${patch.date}_\n\n` +
    `*${patch.title}*\n\n`;

  const footer =
    `\n───────────────\n` +
    (isSubscribed
      ? `✅ _Вы подписаны на рассылку (/newsoff для отключения)_`
      : `🔔 _Подписка на обновления: /newson_`);

  const maxChangesLength = 1010 - header.length - footer.length;
  let changesList = "";

  for (const c of patch.changes) {
    const emoji = c.type === "new" ? "✨" : c.type === "improved" ? "⚡️" : "🛠";
    const line = `${emoji} *${c.title}*\n${c.description}\n\n`;
    if ((changesList + line).length <= maxChangesLength) {
      changesList += line;
    } else {
      const shortDesc = c.highlight || c.description.slice(0, 70);
      const shortLine = `${emoji} *${c.title}* — ${shortDesc}\n`;
      if ((changesList + shortLine).length <= maxChangesLength) {
        changesList += shortLine;
      }
    }
  }

  const messageText = header + changesList.trim() + footer;

  const keyboard = new InlineKeyboard();
  if (miniAppUrl.startsWith("https://")) {
    keyboard.webApp("📱 Открыть Mini App", miniAppUrl).row();
  }

  if (isSubscribed) {
    keyboard.text("🔕 Отключить рассылку", "news:unsubscribe");
  } else {
    keyboard.text("🔔 Подписаться на новости", "news:subscribe");
  }

  // Check if banner photo exists on disk for visual preview
  const bannerFile = getBannerFilePath(patch.id);
  if (bannerFile && fs.existsSync(bannerFile)) {
    try {
      await ctx.replyWithPhoto(new InputFile(bannerFile), {
        caption: messageText,
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
      return;
    } catch (e: any) {
      console.warn("replyWithPhoto failed, fallback to plain text:", e.message);
    }
  }

  await ctx.reply(messageText, {
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
