import type { BotContext } from "../index.js";
import { prisma } from "../../db/prisma.js";
import { steamService } from "../../services/gaming/steam.js";
import { gamingPoller } from "../../services/gaming/poller.js";

export async function linkCommand(ctx: BotContext) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) {
    await ctx.reply("Сначала нажми /start!");
    return;
  }

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter(Boolean);

  // If no args: show current links
  if (parts.length < 2) {
    const steamBadge = user.steamId ? `✅ \`${user.steamId}\`` : "❌ Не привязан";
    const faceitBadge = user.faceitId ? `✅ \`${user.faceitId}\`` : "❌ Не привязан";
    const tsBadge = user.tsIdentity ? `✅ \`${user.tsIdentity}\`` : "❌ Не привязан";

    await ctx.reply(
      `🎮 **Твои игровые привязки:**\n\n` +
        `• **Steam:** ${steamBadge}\n` +
        `• **FACEIT:** ${faceitBadge}\n` +
        `• **TeamSpeak:** ${tsBadge}\n\n` +
        `📌 **Как привязать:**\n` +
        `• \`/link steam <ID или ссылка>\` — привязать Steam\n` +
        `• \`/link faceit <никнейм>\` — привязать FACEIT\n` +
        `• \`/link ts <ник в TeamSpeak>\` — привязать TeamSpeak\n` +
        `• \`/unlink <steam|faceit|ts>\` — отвязать платформу`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const platform = parts[1].toLowerCase();
  const value = parts.slice(2).join(" ").trim();

  if (!value) {
    await ctx.reply(`Укажи значение: \`/link ${platform} <значение>\``, {
      parse_mode: "Markdown",
    });
    return;
  }

  switch (platform) {
    case "steam": {
      await ctx.reply("🔍 Проверяю Steam ID...");
      const steamId = await steamService.resolveSteamId(value);

      if (!steamId) {
        await ctx.reply(
          "❌ Не удалось определить SteamID64.\n" +
            "Укажи 17-значный цифровой ID (начинается с 7656...) или ссылку на профиль: `https://steamcommunity.com/id/...`",
          { parse_mode: "Markdown" }
        );
        return;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { steamId },
      });

      // Trigger instant poll
      gamingPoller.poll().catch(() => {});

      await ctx.reply(
        `✅ **Steam успешно привязан!**\nSteamID: \`${steamId}\`\n\nТеперь бот будет автоматически видеть, когда ты в игре!`,
        { parse_mode: "Markdown" }
      );
      break;
    }

    case "faceit": {
      const cleanNick = value.replace(/^@/, "");
      await prisma.user.update({
        where: { id: user.id },
        data: { faceitId: cleanNick },
      });

      gamingPoller.poll().catch(() => {});

      await ctx.reply(
        `✅ **FACEIT никнейм сохранён:** \`${cleanNick}\`\n\nБот будет отслеживать ELO и матчи!`,
        { parse_mode: "Markdown" }
      );
      break;
    }

    case "ts":
    case "teamspeak": {
      await prisma.user.update({
        where: { id: user.id },
        data: { tsIdentity: value },
      });

      gamingPoller.poll().catch(() => {});

      await ctx.reply(
        `✅ **Никнейм в TeamSpeak сохранён:** \`${value}\`\n\nБот определит твой вход на сервер!`,
        { parse_mode: "Markdown" }
      );
      break;
    }

    default:
      await ctx.reply(
        "Неизвестная платформа. Доступно: `steam`, `faceit`, `ts`.\n" +
          "Пример: `/link steam https://steamcommunity.com/id/n0vision`",
        { parse_mode: "Markdown" }
      );
  }
}

export async function unlinkCommand(ctx: BotContext) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return;

  const text = ctx.message?.text || "";
  const parts = text.split(" ").filter(Boolean);

  if (parts.length < 2) {
    await ctx.reply("Укажи платформу: `/unlink steam`, `/unlink faceit` или `/unlink ts`", {
      parse_mode: "Markdown",
    });
    return;
  }

  const platform = parts[1].toLowerCase();

  switch (platform) {
    case "steam":
      await prisma.user.update({ where: { id: user.id }, data: { steamId: null } });
      await prisma.onlineStatus.updateMany({
        where: { userId: user.id },
        data: { steamStatus: null, steamGame: null },
      });
      await ctx.reply("✅ Steam отвязан.");
      break;
    case "faceit":
      await prisma.user.update({ where: { id: user.id }, data: { faceitId: null } });
      await prisma.onlineStatus.updateMany({
        where: { userId: user.id },
        data: { faceitStatus: null, faceitElo: null, faceitLevel: null },
      });
      await ctx.reply("✅ FACEIT отвязан.");
      break;
    case "ts":
    case "teamspeak":
      await prisma.user.update({ where: { id: user.id }, data: { tsIdentity: null } });
      await prisma.onlineStatus.updateMany({
        where: { userId: user.id },
        data: { tsStatus: null, tsChannel: null },
      });
      await ctx.reply("✅ TeamSpeak отвязан.");
      break;
    default:
      await ctx.reply("Доступно для отвязки: `steam`, `faceit`, `ts`", { parse_mode: "Markdown" });
  }
}
