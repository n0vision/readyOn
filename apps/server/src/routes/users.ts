import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { steamService } from "../services/gaming/steam.js";
import { gamingPoller } from "../services/gaming/poller.js";

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

  // PUT /api/users/:telegramId/integrations — обновить привязки
  app.put<{
    Params: { telegramId: string };
    Body: { steamId?: string | null; faceitId?: string | null; tsIdentity?: string | null };
  }>("/:telegramId/integrations", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    let { steamId, faceitId, tsIdentity } = req.body;

    if (steamId) {
      const resolved = await steamService.resolveSteamId(steamId);
      if (resolved) steamId = resolved;
    }

    const user = await prisma.user.update({
      where: { telegramId },
      data: {
        ...(steamId !== undefined && { steamId: steamId || null }),
        ...(faceitId !== undefined && { faceitId: faceitId || null }),
        ...(tsIdentity !== undefined && { tsIdentity: tsIdentity || null }),
      },
    });

    // Trigger instant check
    gamingPoller.poll().catch(() => {});

    return { success: true, steamId, faceitId, tsIdentity };
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
};
