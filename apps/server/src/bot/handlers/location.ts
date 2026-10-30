import type { BotContext } from "../index.js";
import { prisma } from "../../db/prisma.js";

// Радиус "дома" в метрах
const HOME_RADIUS_METERS = 200;

export async function handleLocationUpdate(ctx: BotContext) {
  if (!ctx.from) return;

  const location = ctx.message?.location || ctx.editedMessage?.location;
  if (!location) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return;

  // Если дом не задан — предложить сохранить текущую точку как "дом"
  if (user.homeLatitude === null || user.homeLongitude === null) {
    // Сохраняем как дом
    await prisma.user.update({
      where: { id: user.id },
      data: {
        homeLatitude: location.latitude,
        homeLongitude: location.longitude,
      },
    });

    await prisma.onlineStatus.upsert({
      where: { userId: user.id },
      update: { locationStatus: "home", etaMinutes: null },
      create: { userId: user.id, locationStatus: "home", etaMinutes: null },
    });

    await ctx.reply(
      "🏠 Твоя текущая геопозиция сохранена как «дом».\n\n" +
        "Теперь я буду определять: дома ты, не дома, или в пути.\n" +
        "Чтобы обновить, отправь /sethome с нового места."
    );
    return;
  }

  // Вычислить расстояние до дома
  const distance = haversineDistance(
    location.latitude,
    location.longitude,
    user.homeLatitude,
    user.homeLongitude
  );

  let locationStatus: string;
  let etaMinutes: number | null = null;

  if (distance <= HOME_RADIUS_METERS) {
    locationStatus = "home";
  } else {
    // Грубая оценка ETA: средняя скорость в городе ~30 км/ч
    etaMinutes = Math.round((distance / 1000 / 30) * 60);
    if (etaMinutes < 1) etaMinutes = 1;

    // Если "живая" локация и есть heading — значит в движении
    if (location.heading || (location.live_period && location.live_period > 0)) {
      locationStatus = "transit";
    } else {
      locationStatus = "away";
    }
  }

  await prisma.onlineStatus.upsert({
    where: { userId: user.id },
    update: { locationStatus, etaMinutes, lastUpdated: new Date() },
    create: { userId: user.id, locationStatus, etaMinutes },
  });
}

/**
 * Haversine formula — расстояние между двумя точками на сфере (в метрах)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // радиус Земли в метрах
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
