import ICAL from "ical.js";
import { prisma } from "../../db/prisma.js";
import { getToday } from "../../bot/commands/status.js";
import { broadcastGroupUpdate } from "../../websocket/index.js";

export interface ParsedCalendarEvent {
  externalId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  isBusy: boolean;
}

export class CalendarService {
  /**
   * Parse standard ICS format string into structured events
   */
  parseIcs(icsData: string): ParsedCalendarEvent[] {
    const events: ParsedCalendarEvent[] = [];

    try {
      const jcalData = ICAL.parse(icsData);
      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents("vevent");

      for (const vevent of vevents) {
        try {
          const event = new ICAL.Event(vevent);
          const externalId = event.uid || `${event.summary}_${event.startDate.toUnixTime()}`;
          const title = event.summary || "Занятость";
          const startTime = event.startDate.toJSDate();
          const endTime = event.endDate ? event.endDate.toJSDate() : startTime;

          // By default, calendar events mark busy unless TRANSP is TRANSPARENT
          const transpProp = vevent.getFirstPropertyValue("transp");
          const isBusy = transpProp !== "TRANSPARENT";

          events.push({
            externalId,
            title,
            startTime,
            endTime,
            isBusy,
          });
        } catch (innerErr) {
          // Skip malformed single event
        }
      }
    } catch (err: any) {
      console.error("Failed to parse ICS data:", err.message);
      throw new Error("Неверный формат .ics файла или ссылки");
    }

    return events;
  }

  /**
   * Sync a specific CalendarSource by ID
   */
  async syncSource(sourceId: number): Promise<{ count: number }> {
    const source = await prisma.calendarSource.findUnique({
      where: { id: sourceId },
    });

    if (!source || !source.isActive) {
      return { count: 0 };
    }

    let icsContent = source.icsData;

    // If source is a URL, fetch latest content
    if (source.type === "ICS_URL" && source.url) {
      try {
        const res = await fetch(source.url, {
          headers: { "User-Agent": "readyOn-Calendar-Sync/1.0" },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        icsContent = await res.text();
      } catch (err: any) {
        console.error(`Failed to fetch ICS URL for source ${source.id}:`, err.message);
        throw new Error(`Не удалось скачать календарь по ссылке: ${err.message}`);
      }
    }

    if (!icsContent) {
      return { count: 0 };
    }

    const parsedEvents = this.parseIcs(icsContent);

    // Save events in DB
    let syncedCount = 0;
    for (const ev of parsedEvents) {
      await prisma.calendarEvent.upsert({
        where: {
          sourceId_externalId: {
            sourceId: source.id,
            externalId: ev.externalId,
          },
        },
        update: {
          title: ev.title,
          startTime: ev.startTime,
          endTime: ev.endTime,
          isBusy: ev.isBusy,
        },
        create: {
          userId: source.userId,
          sourceId: source.id,
          externalId: ev.externalId,
          title: ev.title,
          startTime: ev.startTime,
          endTime: ev.endTime,
          isBusy: ev.isBusy,
        },
      });
      syncedCount++;
    }

    // Update lastSynced timestamp and stored icsData if fetched via URL
    await prisma.calendarSource.update({
      where: { id: source.id },
      data: {
        lastSynced: new Date(),
        ...(source.type === "ICS_URL" && { icsData: icsContent }),
      },
    });

    return { count: syncedCount };
  }

  /**
   * Calculate smart status for a user based on today's calendar events
   */
  async calculateDailyStatus(
    userId: number,
    targetDate: Date = getToday()
  ): Promise<{
    status: "READY" | "UNAVAILABLE" | "UNSET";
    availableFrom: string | null;
    comment: string | null;
  } | null> {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId,
        isBusy: true,
        startTime: { lte: endOfDay },
        endTime: { gte: startOfDay },
      },
      orderBy: { endTime: "asc" },
    });

    if (events.length === 0) {
      return null;
    }

    // Filter events that extend into the afternoon/evening (>= 15:00)
    const lateEvents = events.filter((e) => {
      const endH = e.endTime.getHours();
      return endH >= 15;
    });

    if (lateEvents.length === 0) {
      // User is free for normal evening game (default 19:00)
      return {
        status: "READY",
        availableFrom: "19:00",
        comment: "Авто-календарь: свободен вечером",
      };
    }

    // Find the latest busy event
    const lastEvent = lateEvents[lateEvents.length - 1];
    const endH = lastEvent.endTime.getHours();
    const endM = lastEvent.endTime.getMinutes();

    // If busy late into the night (e.g. after 23:00)
    if (endH >= 23 || (endH === 22 && endM >= 30)) {
      return {
        status: "UNAVAILABLE",
        availableFrom: null,
        comment: `Авто-календарь: занят (${lastEvent.title || "мероприятие"})`,
      };
    }

    // Add ~30-40 min buffer to get home and prepare
    let readyH = endH;
    let readyM = endM <= 20 ? 30 : 0;
    if (endM > 20) readyH += 1;

    const formattedTime = `${String(readyH).padStart(2, "0")}:${String(readyM).padStart(2, "0")}`;

    return {
      status: "READY",
      availableFrom: formattedTime,
      comment: `Авто-календарь: после «${lastEvent.title || "дел"}»`,
    };
  }

  /**
   * Apply auto-status to user if their status is currently UNSET
   */
  async applyAutoStatusIfUnset(userId: number) {
    const today = getToday();

    const currentStatus = await prisma.dailyStatus.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    // Only apply if user hasn't explicitly set their status today
    if (!currentStatus || currentStatus.status === "UNSET") {
      const calculated = await this.calculateDailyStatus(userId, today);
      if (calculated) {
        await prisma.dailyStatus.upsert({
          where: { userId_date: { userId, date: today } },
          update: {
            status: calculated.status,
            availableFrom: calculated.availableFrom,
            comment: calculated.comment,
          },
          create: {
            userId,
            date: today,
            status: calculated.status,
            availableFrom: calculated.availableFrom,
            comment: calculated.comment,
          },
        });

        // Broadcast to group members via WebSocket
        const userGroups = await prisma.groupMember.findMany({
          where: { userId },
          select: { groupId: true },
        });
        for (const g of userGroups) {
          broadcastGroupUpdate(g.groupId);
        }
      }
    }
  }
}

export const calendarService = new CalendarService();
