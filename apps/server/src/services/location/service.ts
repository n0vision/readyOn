import { prisma } from "../../db/prisma.js";
import { broadcastGroupUpdate } from "../../websocket/index.js";
import { notificationEngine } from "../notification/engine.js";

// Радиус "дома" в метрах
export const HOME_RADIUS_METERS = 250;

// Средняя городская скорость в км/ч для расчета ориентировочного ETA
export const URBAN_SPEED_KMH = 30;

export interface LocationCalculation {
  status: "home" | "transit" | "away";
  distanceMeters: number;
  etaMinutes: number | null;
}

export class LocationService {
  /**
   * Haversine formula — расстояние между двумя точками на сфере (в метрах)
   */
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // радиус Земли в метрах
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Расчет статуса и ETA относительно домашней точки
   */
  calculateStatus(
    currentLat: number,
    currentLon: number,
    homeLat: number,
    homeLon: number,
    isMoving: boolean = false
  ): LocationCalculation {
    const distanceMeters = this.haversineDistance(currentLat, currentLon, homeLat, homeLon);

    if (distanceMeters <= HOME_RADIUS_METERS) {
      return {
        status: "home",
        distanceMeters,
        etaMinutes: null,
      };
    }

    // Расчет ETA: время = расстояние (км) / скорость (км/ч)
    const distanceKm = distanceMeters / 1000;
    const etaMinutes = Math.max(1, Math.round((distanceKm / URBAN_SPEED_KMH) * 60));

    return {
      status: isMoving ? "transit" : "away",
      distanceMeters,
      etaMinutes,
    };
  }

  /**
   * Установить или сбросить домашнюю точку пользователя
   */
  async setHomeLocation(userId: number, lat: number | null, lon: number | null) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        homeLatitude: lat,
        homeLongitude: lon,
      },
    });

    if (lat === null || lon === null) {
      // Сброс статуса
      await prisma.onlineStatus.upsert({
        where: { userId },
        update: { locationStatus: null, etaMinutes: null, lastUpdated: new Date() },
        create: { userId, locationStatus: null, etaMinutes: null },
      });
    } else {
      // По умолчанию при сохранении точки мы находимся дома
      await prisma.onlineStatus.upsert({
        where: { userId },
        update: { locationStatus: "home", etaMinutes: null, lastUpdated: new Date() },
        create: { userId, locationStatus: "home", etaMinutes: null },
      });
    }

    await this.broadcastUserGroups(userId);
    return user;
  }

  /**
   * Обновить текущие координаты пользователя
   */
  async updateCurrentLocation(
    userId: number,
    lat: number,
    lon: number,
    options?: { heading?: number; speed?: number; isLive?: boolean }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { onlineStatus: true },
    });

    if (!user) return null;

    // Если домашняя точка ещё не задана, первая переданная точка становится домом
    if (user.homeLatitude === null || user.homeLongitude === null) {
      await this.setHomeLocation(userId, lat, lon);
      return {
        status: "home",
        distanceMeters: 0,
        etaMinutes: null,
        isHomeSet: true,
      };
    }

    const isMoving = Boolean(
      (options?.speed && options.speed > 1.5) || // > 5.4 км/ч
      options?.heading !== undefined ||
      options?.isLive
    );

    const calc = this.calculateStatus(
      lat,
      lon,
      user.homeLatitude,
      user.homeLongitude,
      isMoving
    );

    const prevStatus = user.onlineStatus?.locationStatus;

    // Обновляем статус в базе данных
    await prisma.onlineStatus.upsert({
      where: { userId },
      update: {
        locationStatus: calc.status,
        etaMinutes: calc.etaMinutes,
        lastUpdated: new Date(),
      },
      create: {
        userId,
        locationStatus: calc.status,
        etaMinutes: calc.etaMinutes,
      },
    });

    // Отправляем real-time обновление через Socket.IO в сквады
    await this.broadcastUserGroups(userId);

    // Если игрок только что приехал домой (был в пути/не дома -> стал дома)
    if (prevStatus && prevStatus !== "home" && calc.status === "home") {
      notificationEngine.notifyFriendArrivedHome(userId).catch(() => {});
    }

    return {
      ...calc,
      isHomeSet: true,
    };
  }

  /**
   * Отправка WebSocket обновления во все группы пользователя
   */
  private async broadcastUserGroups(userId: number) {
    const userGroups = await prisma.groupMember.findMany({
      where: { userId },
      select: { groupId: true },
    });
    for (const g of userGroups) {
      broadcastGroupUpdate(g.groupId);
    }
  }
}

export const locationService = new LocationService();
