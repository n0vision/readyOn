export type PatchnoteChangeType = "new" | "improved" | "fix";

export interface PatchnoteChange {
  type: PatchnoteChangeType;
  title: string;
  description: string;
}

export interface Patchnote {
  id: string; // Unique id for read-tracking, e.g. "v1.3.0"
  version: string;
  date: string;
  title: string;
  summary: string;
  badge?: "LATEST" | "MAJOR" | "HOTFIX";
  bannerUrl?: string; // Relative URL for web (e.g. /banners/v1.3.0.png)
  bannerFilePath?: string; // Local path on server for Telegram sendPhoto
  changes: PatchnoteChange[];
}

/**
 * Business Rule:
 * Minor changes (fixes, UI adjustments, tweaks) must accumulate up to 5 items
 * before a new patchnote is published and broadcast to Telegram users.
 * Major features can be released immediately with an accompanying generated banner.
 */
export const MINOR_CHANGES_BATCH_THRESHOLD = 5;

export const PATCHNOTES: Patchnote[] = [
  {
    id: "v1.3.0",
    version: "v1.3.0",
    date: "31 октября 2026",
    title: "Большое обновление: Аналитика CS2, Рейтинг и Onboarding",
    summary:
      "Раскрывающаяся карточка игрока, динамический FACEIT рейтинг, геолокация с ETA до дома, интерактивный гид и центр обновлений.",
    badge: "LATEST",
    bannerUrl: "/banners/v1.3.0.png",
    bannerFilePath: "apps/server/assets/banners/v1.3.0.png",
    changes: [
      {
        type: "new",
        title: "Детализированная карточка игрока",
        description:
          "Тапни по любой карточке в блоке «СОСТАВ КОМАНДЫ», чтобы увидеть винрейт, K/D, % хедшотов за 30 игр и историю последних 5 матчей (W/L) с картой и счетом.",
      },
      {
        type: "new",
        title: "Динамический FACEIT Рейтинг",
        description:
          "Честный расчет персонального рейтинга результативности и импакта строго за последние 30 матчей (HLTV 2.0 модель).",
      },
      {
        type: "new",
        title: "Геолокация и расчет Live ETA",
        description:
          "Задай домашнюю точку через /sethome или Mini App. Отправляй Live Location боту при выезде с работы, и сквад увидит точный ETA (время до дома в минутах). 100% приватность: точные координаты никому не видны.",
      },
      {
        type: "new",
        title: "Интерактивный Onboarding для новичков",
        description:
          "Быстрый 5-шаговый тур по всем возможностям сервиса с тактильным откликом Telegram Haptics. Запустить можно в любой момент из профиля или центра новостей.",
      },
      {
        type: "improved",
        title: "Колокольчик новостей и патчноутов",
        description:
          "Никаких всплывающих окон при входе: колокольчик в шапке покажет количество свежих непрочитанных постов.",
      },
      {
        type: "improved",
        title: "Команды /help, /patchnotes и /newson в боте",
        description:
          "Полная инструкция в боте, просмотр чейнджлога в чате и подписка на рассылку будущих обновлений через /newson.",
      },
    ],
  },
  {
    id: "v1.2.0",
    version: "v1.2.0",
    date: "28 октября 2026",
    title: "Игровые интеграции Steam & FACEIT",
    summary:
      "Автоматическое отслеживание захода в CS2, показ ELO и уровней тиммейтов на дашборде.",
    changes: [
      {
        type: "new",
        title: "Live-статус CS2 в реальном времени",
        description:
          "Бот и Mini App мгновенно видят, когда кто-то из сквада запустил Counter-Strike 2 или сидит в TeamSpeak.",
      },
      {
        type: "new",
        title: "Отображение FACEIT Level & ELO",
        description:
          "На карточках тиммейтов выводятся их текущие уровни и точное количество ELO.",
      },
      {
        type: "improved",
        title: "Discord Slate дизайн",
        description:
          "Премиальная темная цветовая гамма, адаптированная под мобильные экраны и свайпы.",
      },
    ],
  },
  {
    id: "v1.1.0",
    version: "v1.1.0",
    date: "25 октября 2026",
    title: "Выбор времени старта и синхронизация календарей",
    summary:
      "Скролл выбора времени «Готов с...» и авто-статус на основе рабочих календарей iCal.",
    changes: [
      {
        type: "new",
        title: "Скролл выбора часа старта",
        description:
          "Укажи время готовности в один тап (19:00, 20:30, 21:00 или «Сейчас»).",
      },
      {
        type: "new",
        title: "Календари iCal / Webcal",
        description:
          "Подключи рабочий календарь, и бот сам определит, свободен ли ты сегодня вечером.",
      },
      {
        type: "fix",
        title: "Мгновенная синхронизация через WebSockets",
        description:
          "Смена статуса у любого игрока моментально отображается на экранах всего сквада без задержек.",
      },
    ],
  },
];

export function getLatestPatchnote(): Patchnote {
  return PATCHNOTES[0];
}
