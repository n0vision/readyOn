import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { steamService } from "../services/gaming/steam.js";
import { FaceitService } from "../services/gaming/faceit.js";
import { gamingPoller } from "../services/gaming/poller.js";
import { notificationEngine } from "../services/notification/engine.js";
import { locationService } from "../services/location/service.js";

const faceitService = new FaceitService();

export const userRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/users/:telegramId — профиль пользователя
  app.get<{ Params: { telegramId: string } }>("/:telegramId", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);

    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        calendarSources: { select: { id: true, type: true, name: true, isActive: true } },
      },
    });

    if (!user) return reply.status(404).send({ error: "User not found" });

    return {
      id: user.id,
      telegramId: user.telegramId.toString(),
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl,
      steamId: user.steamId,
      faceitId: user.faceitId,
      tsIdentity: user.tsIdentity,
      hasHomeLocation: user.homeLatitude !== null,
      notificationSettings: user.notificationSettings,
      calendarSources: user.calendarSources,
      createdAt: user.createdAt,
    };
  });

  // PUT /api/users/:telegramId/profile — обновить имя и аватарку
  app.put<{
    Params: { telegramId: string };
    Body: { displayName?: string; avatarUrl?: string | null };
  }>("/:telegramId/profile", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const { displayName, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { telegramId },
      data: {
        ...(displayName && { displayName: displayName.trim() }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl?.trim() || null }),
      },
    });

    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };
  });

  // PUT /api/users/:telegramId/integrations — обновить привязки
  app.put<{
    Params: { telegramId: string };
    Body: { steamId?: string | null; faceitId?: string | null; tsIdentity?: string | null };
  }>("/:telegramId/integrations", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    let { steamId, faceitId, tsIdentity } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { telegramId } });
    let autoAvatarUrl: string | null = null;

    if (steamId) {
      const resolved = await steamService.resolveSteamId(steamId);
      if (resolved) {
        steamId = resolved;
        const summaries = await steamService.getPlayerSummaries([resolved]);
        const summary = summaries.get(resolved);
        if (summary?.avatarUrl && !existingUser?.avatarUrl) {
          autoAvatarUrl = summary.avatarUrl;
        }
      }
    }

    if (faceitId && !autoAvatarUrl && !existingUser?.avatarUrl) {
      const fSummary = await faceitService.getPlayerByNickname(faceitId);
      if (fSummary?.avatarUrl) {
        autoAvatarUrl = fSummary.avatarUrl;
      }
    }

    await prisma.user.update({
      where: { telegramId },
      data: {
        ...(steamId !== undefined && { steamId: steamId || null }),
        ...(faceitId !== undefined && { faceitId: faceitId || null }),
        ...(tsIdentity !== undefined && { tsIdentity: tsIdentity || null }),
        ...(autoAvatarUrl && { avatarUrl: autoAvatarUrl }),
      },
    });

    // Trigger instant check
    gamingPoller.poll().catch(() => {});

    return { success: true, steamId, faceitId, tsIdentity, avatarUrl: autoAvatarUrl };
  });

  // PUT /api/users/:telegramId/notifications — настройки уведомлений
  app.put<{
    Params: { telegramId: string };
    Body: { settings: Record<string, any> };
  }>("/:telegramId/notifications", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);

    await prisma.user.update({
      where: { telegramId },
      data: { notificationSettings: req.body.settings },
    });

    return { success: true };
  });

  // POST /api/users/:telegramId/test-notification — отправить тестовое уведомление в Telegram бот
  app.post<{
    Params: { telegramId: string };
    Body?: { dryRun?: boolean };
    Querystring?: { dryRun?: string };
  }>("/:telegramId/test-notification", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const dryRun = req.body?.dryRun === true || req.query.dryRun === "true";
    const result = await notificationEngine.sendTestNotification(telegramId, dryRun);
    if (!result.success) {
      return reply.status(400).send({ error: result.error || "Failed to send test notification" });
    }
    return { success: true, dryRun };
  });

  // POST /api/users/:telegramId/home — сохранить или сбросить точку «Дом»
  app.post<{
    Params: { telegramId: string };
    Body: { latitude?: number; longitude?: number; clear?: boolean };
  }>("/:telegramId/home", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    if (req.body.clear) {
      await locationService.setHomeLocation(user.id, null, null);
      return { success: true, hasHomeLocation: false };
    }

    const { latitude, longitude } = req.body;
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return reply.status(400).send({ error: "Некорректные координаты" });
    }

    await locationService.setHomeLocation(user.id, latitude, longitude);
    return { success: true, hasHomeLocation: true };
  });

  // POST /api/users/:telegramId/location — передать текущую геопозицию пользователя
  app.post<{
    Params: { telegramId: string };
    Body: { latitude: number; longitude: number; heading?: number; speed?: number; isLive?: boolean };
  }>("/:telegramId/location", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const { latitude, longitude, heading, speed, isLive } = req.body;
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return reply.status(400).send({ error: "Некорректные координаты" });
    }

    const result = await locationService.updateCurrentLocation(user.id, latitude, longitude, {
      heading,
      speed,
      isLive,
    });

    return {
      success: true,
      locationStatus: result?.status || null,
      etaMinutes: result?.etaMinutes || null,
      isHomeSet: result?.isHomeSet || false,
    };
  });

  // GET /api/users/:identifier/gaming-stats — расширенная игровая статистика (FACEIT 30 матчей, W/L, K/D, %HS)
  app.get<{ Params: { identifier: string } }>("/:identifier/gaming-stats", async (req, reply) => {
    const raw = req.params.identifier;
    let user = null;

    if (/^\d{6,15}$/.test(raw)) {
      // Telegram ID
      user = await prisma.user.findUnique({
        where: { telegramId: BigInt(raw) },
        include: { onlineStatus: true },
      });
    }

    if (!user && /^\d+$/.test(raw)) {
      // User ID
      user = await prisma.user.findUnique({
        where: { id: parseInt(raw, 10) },
        include: { onlineStatus: true },
      });
    }

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    let faceitStats = null;
    if (user.faceitId) {
      faceitStats = await faceitService.getDetailedStats(user.faceitId);
    } else if (user.steamId) {
      // Попробовать найти по SteamID
      const fSummary = await faceitService.getPlayerBySteamId(user.steamId);
      if (fSummary?.playerId) {
        faceitStats = await faceitService.getDetailedStats(fSummary.playerId);
      }
    }

    const steamProfileUrl = user.steamId
      ? `https://steamcommunity.com/profiles/${user.steamId}`
      : null;

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
        steamId: user.steamId,
        faceitId: user.faceitId,
        tsIdentity: user.tsIdentity,
      },
      onlineStatus: user.onlineStatus,
      faceit: faceitStats,
      steam: {
        steamId: user.steamId,
        profileUrl: steamProfileUrl,
      },
    };
  });
};
