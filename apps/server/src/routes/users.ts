import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

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
    Body: { steamId?: string; faceitId?: string; tsIdentity?: string };
  }>("/:telegramId/integrations", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const { steamId, faceitId, tsIdentity } = req.body;

    const user = await prisma.user.update({
      where: { telegramId },
      data: {
        ...(steamId !== undefined && { steamId }),
        ...(faceitId !== undefined && { faceitId }),
        ...(tsIdentity !== undefined && { tsIdentity }),
      },
    });

    return { success: true };
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
