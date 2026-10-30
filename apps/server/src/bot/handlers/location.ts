import type { BotContext } from "../index.js";
import { prisma } from "../../db/prisma.js";
import { locationService } from "../../services/location/service.js";

/**
 * Обработка входящей геопозиции (обычная точка или Live Location)
 */
export async function handleLocationUpdate(ctx: BotContext) {
  if (!ctx.from) return;

  const location = ctx.message?.location || ctx.editedMessage?.location;
  if (!location) return;

  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({ where: { telegramId } });
  if (!user) return;

  const isLive = Boolean(location.live_period && location.live_period > 0);
  const isMoving = Boolean(
    location.heading !== undefined ||
    (location.horizontal_accuracy && location.horizontal_accuracy > 0 && isLive)
  );

  const isFirstHome = user.homeLatitude === null || user.homeLongitude === null;

  const result = await locationService.updateCurrentLocation(
    user.id,
    location.latitude,
    location.longitude,
    {
      heading: location.heading,
      isLive,
    }
  );

  if (!result) return;

  // Если это первое сохранение дома
  if (isFirstHome) {
    await ctx.reply(
      "🏠 **Точка «Дом» успешно сохранена!**\n\n" +
        "Теперь readyOn автоматически понимает твой статус:\n" +
        "• 🏠 **Дома** — когда ты в радиусе 250м\n" +
        "• 🚗 **В пути (~N мин)** — когда включена трансляция геопозиции\n" +
        "• 📍 **Не дома** — когда ты по делам\n\n" +
        "Команда `/sethome` позволит перезаписать домашнюю точку в любое время."
    );
    return;
  }

  // Для обычного одиночного сообщения с локацией (не Live Location трансляция) отправляем ответ
  if (!ctx.editedMessage) {
    if (result.status === "home") {
      await ctx.reply("🏠 **Ты дома!** Статус в скваде обновлён: готов к каткам.");
    } else if (result.status === "transit") {
      await ctx.reply(
        `🚗 **Ты в пути домой!**\nОриентировочное время прибытия: **~${result.etaMinutes} мин** (расстояние ${(result.distanceMeters / 1000).toFixed(1)} км).`
      );
    } else {
      await ctx.reply(
        `📍 **Ты не дома** (расстояние до дома: ${(result.distanceMeters / 1000).toFixed(1)} км).\n` +
          `Чтобы команда видела твой ETA, включи «Транслировать геопозицию» (Live Location).`
      );
    }
  }
}

/**
 * Команда /sethome — задать домашнюю точку
 */
export async function setHomeCommand(ctx: BotContext) {
  await ctx.reply(
    "📍 **Настройка домашней точки**\n\n" +
      "Чтобы бот автоматически рассчитывал, дома ты или сколько тебе ехать:\n" +
      "1. Нажми на скрепку 📎 (или значок «+»)\n" +
      "2. Выбери **«Геопозиция»** (Location)\n" +
      "3. Отправь **«Отправить свою геопозицию»** прямо из дома.\n\n" +
      "Либо открой Mini App → вкладка **«Профиль»** → кнопка **«Задать текущую геопозицию как Дом»**."
  );
}

/**
 * Команда /location — проверить текущий статус геолокации
 */
export async function locationStatusCommand(ctx: BotContext) {
  if (!ctx.from) return;
  const telegramId = BigInt(ctx.from.id);
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: { onlineStatus: true },
  });

  if (!user) return;

  if (user.homeLatitude === null || user.homeLongitude === null) {
    await ctx.reply(
      "📍 Точка «Дом» пока не настроена.\nИспользуй /sethome или настрой в Mini App (вкладка «Профиль»)."
    );
    return;
  }

  const os = user.onlineStatus;
  if (!os?.locationStatus) {
    await ctx.reply(
      "🏠 Точка «Дом» сохранена!\n" +
        "Отправь боту геопозицию 📎, чтобы обновить свой статус: дома ты или в пути."
    );
    return;
  }

  if (os.locationStatus === "home") {
    await ctx.reply("🏠 Текущий статус: **Дома**.");
  } else if (os.locationStatus === "transit") {
    await ctx.reply(`🚗 Текущий статус: **В пути** (~${os.etaMinutes || 15} мин).`);
  } else {
    await ctx.reply("📍 Текущий статус: **Не дома**.");
  }
}
