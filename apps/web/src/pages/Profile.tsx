import { useState, useEffect } from "react";
import { getCurrentTelegramId, fetchUserProfile } from "../services/api.js";

export function Profile() {
  const telegramId = getCurrentTelegramId();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile(telegramId)
      .then(setProfile)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [telegramId]);

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[var(--tg-theme-button-color)] flex items-center justify-center text-lg font-bold">
          {profile?.displayName?.[0] || "👤"}
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">{profile?.displayName || "Профиль"}</h1>
          <p className="text-xs text-[var(--tg-theme-hint-color)]">
            {profile?.username ? `@${profile.username}` : `ID: ${telegramId}`}
          </p>
        </div>
      </div>

      {/* Integrations */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--tg-theme-hint-color)]">
          Игровые привязки
        </h2>

        <IntegrationCard
          icon="🎮"
          name="Steam"
          description={profile?.steamId ? `ID: ${profile.steamId}` : "Показывать игру и статус онлайн"}
          connected={Boolean(profile?.steamId)}
        />
        <IntegrationCard
          icon="🎯"
          name="FACEIT"
          description={profile?.faceitId ? `ID: ${profile.faceitId}` : "Матчи, ELO и уровень"}
          connected={Boolean(profile?.faceitId)}
        />
        <IntegrationCard
          icon="🎧"
          name="TeamSpeak"
          description={profile?.tsIdentity ? "Подключён" : "Статус в голосовом канале"}
          connected={Boolean(profile?.tsIdentity)}
        />
        <IntegrationCard
          icon="📅"
          name="Календарь (ICS)"
          description="Автоматический статус занятости"
          connected={profile?.calendarSources?.length > 0}
        />
        <IntegrationCard
          icon="📍"
          name="Геолокация"
          description={profile?.hasHomeLocation ? "Точка дома сохранена" : "Отправь локацию боту"}
          connected={Boolean(profile?.hasHomeLocation)}
        />
      </section>

      {/* Notifications */}
      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--tg-theme-hint-color)]">
          Уведомления
        </h2>

        <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-3.5 space-y-3 border border-white/5">
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
    <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-3 flex items-center gap-3 border border-white/5">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs text-[var(--tg-theme-text-color)]">{name}</div>
        <div className="text-[11px] text-[var(--tg-theme-hint-color)] truncate">{description}</div>
      </div>
      <span
        className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
          connected
            ? "bg-green-500/15 text-green-400 border border-green-500/20"
            : "bg-white/5 text-[var(--tg-theme-hint-color)] border border-white/10"
        }`}
      >
        {connected ? "✓ Вкл" : "Скоро"}
      </span>
    </div>
  );
}

function NotificationToggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [checked, setChecked] = useState(defaultOn);
  return (
    <label className="flex items-center justify-between cursor-pointer select-none">
      <span className="text-xs text-[var(--tg-theme-text-color)]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        className="w-9 h-5 rounded-full appearance-none bg-white/20 checked:bg-[var(--tg-theme-button-color)] transition-colors relative
          before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 before:transition-transform
          checked:before:translate-x-4 cursor-pointer"
      />
    </label>
  );
}
