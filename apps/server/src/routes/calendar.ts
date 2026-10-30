import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { calendarService } from "../services/calendar/service.js";
import { getToday } from "../bot/commands/status.js";

export const calendarRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/calendar/:telegramId — получить подключенные календари и события на сегодня
  app.get<{ Params: { telegramId: string } }>("/:telegramId", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const today = getToday();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const [sources, todayEvents, calculatedStatus] = await Promise.all([
      prisma.calendarSource.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          type: true,
          name: true,
          url: true,
          isActive: true,
          lastSynced: true,
          createdAt: true,
          _count: { select: { events: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.calendarEvent.findMany({
        where: {
          userId: user.id,
          startTime: { lte: endOfDay },
          endTime: { gte: startOfDay },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          isBusy: true,
        },
        orderBy: { startTime: "asc" },
      }),
      calendarService.calculateDailyStatus(user.id, today),
    ]);

    return {
      sources: sources.map((s) => ({
        id: s.id,
        type: s.type,
        name: s.name,
        url: s.url,
        isActive: s.isActive,
        lastSynced: s.lastSynced,
        eventsCount: s._count.events,
      })),
      todayEvents: todayEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
        endTime: e.endTime.toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }),
        isBusy: e.isBusy,
      })),
      calculatedStatus,
    };
  });

  // POST /api/calendar/:telegramId/upload — загрузить .ics файл
  app.post<{
    Params: { telegramId: string };
    Body: { name: string; icsContent: string };
  }>("/:telegramId/upload", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const { name, icsContent } = req.body;
    if (!icsContent || !icsContent.trim()) {
      return reply.status(400).send({ error: "Содержимое .ics файла не может быть пустым" });
    }

    try {
      // Validate parsing
      calendarService.parseIcs(icsContent);

      const source = await prisma.calendarSource.create({
        data: {
          userId: user.id,
          type: "ICS_FILE",
          name: name.trim() || "Загруженный календарь",
          icsData: icsContent,
          isActive: true,
        },
      });

      // Sync events immediately
      const syncResult = await calendarService.syncSource(source.id);

      // Auto-apply if status is currently unset
      await calendarService.applyAutoStatusIfUnset(user.id);

      return { success: true, sourceId: source.id, eventsSynced: syncResult.count };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || "Ошибка обработки календаря" });
    }
  });

  // POST /api/calendar/:telegramId/url — подписаться на календарь по ссылке
  app.post<{
    Params: { telegramId: string };
    Body: { name: string; url: string };
  }>("/:telegramId/url", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    let { name, url } = req.body;
    if (!url || !url.trim()) {
      return reply.status(400).send({ error: "Укажи ссылку на календарь" });
    }

    url = url.trim();
    // Convert webcal:// to https://
    if (url.startsWith("webcal://")) {
      url = "https://" + url.slice(9);
    }

    try {
      const source = await prisma.calendarSource.create({
        data: {
          userId: user.id,
          type: "ICS_URL",
          name: name?.trim() || "Календарь по ссылке",
          url,
          isActive: true,
        },
      });

      // Sync immediately
      const syncResult = await calendarService.syncSource(source.id);

      // Auto-apply if status is currently unset
      await calendarService.applyAutoStatusIfUnset(user.id);

      return { success: true, sourceId: source.id, eventsSynced: syncResult.count };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message || "Ошибка подключения по ссылке" });
    }
  });

  // DELETE /api/calendar/:telegramId/:sourceId — удалить подключение календаря
  app.delete<{
    Params: { telegramId: string; sourceId: string };
  }>("/:telegramId/:sourceId", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const sourceId = parseInt(req.params.sourceId, 10);
    const source = await prisma.calendarSource.findUnique({
      where: { id: sourceId },
    });

    if (!source || source.userId !== user.id) {
      return reply.status(404).send({ error: "Календарь не найден" });
    }

    await prisma.calendarSource.delete({ where: { id: sourceId } });

    return { success: true };
  });

  // POST /api/calendar/:telegramId/sync — принудительно синхронизировать и применить авто-статус
  app.post<{
    Params: { telegramId: string };
  }>("/:telegramId/sync", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const sources = await prisma.calendarSource.findMany({
      where: { userId: user.id, isActive: true },
    });

    let totalSynced = 0;
    for (const s of sources) {
      const res = await calendarService.syncSource(s.id);
      totalSynced += res.count;
    }

    // Force recalculate and apply
    const calculated = await calendarService.calculateDailyStatus(user.id);
    if (calculated) {
      await prisma.dailyStatus.upsert({
        where: { userId_date: { userId: user.id, date: getToday() } },
        update: {
          status: calculated.status,
          availableFrom: calculated.availableFrom,
          comment: calculated.comment,
        },
        create: {
          userId: user.id,
          date: getToday(),
          status: calculated.status,
          availableFrom: calculated.availableFrom,
          comment: calculated.comment,
        },
      });
    }

    return { success: true, totalSynced, calculatedStatus: calculated };
  });
};
