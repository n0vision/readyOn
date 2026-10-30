# readyOn 🎮

> Покажи друзьям, когда ты готов играть

**readyOn** — приложение для гейминг-компании. Показывает кто готов играть, когда и откуда — без спама "кс?" в чат.

## Возможности

- 🟢 **Статус готовности** — готов / не могу / маловероятно + время
- 👥 **Группы и друзья** — создай группу, пригласи по ссылке
- 🎮 **Игровые интеграции** — Steam, FACEIT, TeamSpeak (в разработке)
- 📅 **Календарь** — ICS-файл, подписка по URL, Google Calendar (в разработке)
- 📍 **Геолокация** — дома / не дома / в пути (через Telegram Live Location)
- 🔔 **Уведомления** — настраиваемые напоминания

## Стек

- **Frontend:** React + TypeScript + Vite + Tailwind (Telegram Mini App)
- **Backend:** Node.js + Fastify + Grammy + Socket.IO
- **Database:** PostgreSQL + Prisma
- **Cache:** Redis

## Быстрый старт

```bash
# 1. Поднять БД и Redis
docker compose -f docker-compose.dev.yml up -d

# 2. Установить зависимости
pnpm install

# 3. Создать .env (скопировать из .env.example и заполнить BOT_TOKEN)
cp .env.example .env

# 4. Применить миграции
pnpm db:push

# 5. Запустить в режиме разработки
pnpm dev
```

## Получение BOT_TOKEN

1. Открой [@BotFather](https://t.me/BotFather) в Telegram
2. Отправь `/newbot`
3. Выбери имя и username для бота
4. Скопируй токен в `.env`

## Лицензия

MIT
