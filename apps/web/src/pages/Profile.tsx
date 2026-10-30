export function Profile() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">⚙️ Профиль</h1>

      {/* Integrations */}
      <section className="space-y-2">
        <h2 className="text-sm text-[var(--tg-theme-hint-color)]">Привязки</h2>

        <IntegrationCard
          icon="🎮"
          name="Steam"
          description="Показывать онлайн-статус и текущую игру"
          connected={false}
        />
        <IntegrationCard
          icon="🎯"
          name="FACEIT"
          description="Статус матча, ELO и уровень"
          connected={false}
        />
        <IntegrationCard
          icon="🎧"
          name="TeamSpeak"
          description="Подключение к серверу и канал"
          connected={false}
        />
        <IntegrationCard
          icon="📅"
          name="Календарь"
          description="ICS-файл или подписка по URL"
          connected={false}
        />
        <IntegrationCard
          icon="📍"
          name="Геолокация"
          description="Дома / не дома / в пути (через Telegram)"
          connected={false}
        />
      </section>

      {/* Notifications */}
      <section className="space-y-2">
        <h2 className="text-sm text-[var(--tg-theme-hint-color)]">Уведомления</h2>

        <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-3 space-y-3">
          <NotificationToggle label="Ремайндер поставить статус" defaultOn={true} />
          <NotificationToggle label="Друг готов играть" defaultOn={true} />
          <NotificationToggle label="Все в группе готовы" defaultOn={true} />
          <NotificationToggle label="Друг зашёл в CS2" defaultOn={false} />
          <NotificationToggle label="Друг в TeamSpeak" defaultOn={false} />
        </div>
      </section>
    </div>
  );
}

function IntegrationCard({
  icon,
  name,
  description,
  connected,
}: {
  icon: string;
  name: string;
  description: string;
  connected: boolean;
}) {
  return (
    <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-3 flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <div className="font-medium text-sm">{name}</div>
        <div className="text-xs text-[var(--tg-theme-hint-color)]">{description}</div>
      </div>
      <button
        className={`text-xs px-3 py-1.5 rounded-lg ${
          connected
            ? "bg-green-500/20 text-green-400"
            : "bg-[var(--tg-theme-button-color)] text-white"
        }`}
      >
        {connected ? "✓ Подключено" : "Подключить"}
      </button>
    </div>
  );
}

function NotificationToggle({
  label,
  defaultOn,
}: {
  label: string;
  defaultOn: boolean;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm">{label}</span>
      <input
        type="checkbox"
        defaultChecked={defaultOn}
        className="w-10 h-5 rounded-full appearance-none bg-white/20 checked:bg-[var(--tg-theme-button-color)] transition-colors relative
          before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform
          checked:before:translate-x-5"
      />
    </label>
  );
}
