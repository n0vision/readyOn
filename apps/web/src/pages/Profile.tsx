import { useState, useEffect } from "react";
import { getCurrentTelegramId, fetchUserProfile, updateUserIntegrations } from "../services/api.js";
import { SteamIcon, FaceitIcon } from "../components/Icons.js";

type EditPlatform = "steam" | "faceit" | "ts" | null;

export function Profile() {
  const telegramId = getCurrentTelegramId();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditPlatform>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchUserProfile(telegramId);
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [telegramId]);

  const openEdit = (platform: EditPlatform) => {
    setEditing(platform);
    if (platform === "steam") setInputValue(profile?.steamId || "");
    else if (platform === "faceit") setInputValue(profile?.faceitId || "");
    else if (platform === "ts") setInputValue(profile?.tsIdentity || "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    try {
      setSaving(true);
      const payload: any = {};
      if (editing === "steam") payload.steamId = inputValue.trim() || null;
      if (editing === "faceit") payload.faceitId = inputValue.trim() || null;
      if (editing === "ts") payload.tsIdentity = inputValue.trim() || null;

      await updateUserIntegrations(telegramId, payload);
      setEditing(null);
      await loadProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      {/* Header */}
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
          icon={<SteamIcon className="w-6 h-6 fill-[#38bdf8]" />}
          name="Steam"
          description={profile?.steamId ? `ID: ${profile.steamId}` : "Показывать игру и онлайн-статус"}
          connected={Boolean(profile?.steamId)}
          onClick={() => openEdit("steam")}
        />
        <IntegrationCard
          icon={<FaceitIcon className="w-6 h-6 fill-[#fb923c]" />}
          name="FACEIT"
          description={profile?.faceitId ? `Ник: ${profile.faceitId}` : "Матчи, ELO и уровень"}
          connected={Boolean(profile?.faceitId)}
          onClick={() => openEdit("faceit")}
        />
        <IntegrationCard
          icon="🎧"
          name="TeamSpeak"
          description={profile?.tsIdentity ? `Ник: ${profile.tsIdentity}` : "Статус в голосовом канале"}
          connected={Boolean(profile?.tsIdentity)}
          onClick={() => openEdit("ts")}
        />
        <IntegrationCard
          icon="📅"
          name="Календарь (ICS)"
          description="Автоматический статус занятости"
          connected={profile?.calendarSources?.length > 0}
          readOnly
        />
        <IntegrationCard
          icon="📍"
          name="Геолокация"
          description={profile?.hasHomeLocation ? "Точка дома сохранена" : "Отправь локацию боту"}
          connected={Boolean(profile?.hasHomeLocation)}
          readOnly
        />
      </section>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--tg-theme-secondary-bg-color)] border border-white/10 rounded-2xl p-4 w-full max-w-sm space-y-3">
            <h3 className="font-semibold text-sm">
              {editing === "steam" && "Привязать Steam"}
              {editing === "faceit" && "Привязать FACEIT"}
              {editing === "ts" && "Привязать TeamSpeak"}
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  editing === "steam"
                    ? "SteamID64 или ссылка на профиль"
                    : editing === "faceit"
                    ? "Никнейм на FACEIT"
                    : "Никнейм на сервере TS"
                }
                autoFocus
                className="w-full bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[var(--tg-theme-hint-color)] focus:outline-none focus:border-[var(--tg-theme-button-color)]"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[var(--tg-theme-hint-color)] hover:text-white"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3.5 py-1.5 rounded-lg text-xs bg-[var(--tg-theme-button-color)] text-white font-medium hover:opacity-90 transition-opacity"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
  readOnly,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  readOnly?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={!readOnly ? onClick : undefined}
      className={`rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-3 flex items-center gap-3 border border-white/5 transition-all ${
        !readOnly ? "cursor-pointer hover:border-white/20 active:scale-[0.99]" : ""
      }`}
    >
      <span className="text-2xl flex items-center justify-center w-8 h-8 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs text-[var(--tg-theme-text-color)]">{name}</div>
        <div className="text-[11px] text-[var(--tg-theme-hint-color)] truncate">{description}</div>
      </div>
      <span
        className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
          connected
            ? "bg-green-500/15 text-green-400 border border-green-500/20"
            : "bg-[var(--tg-theme-button-color)]/20 text-[var(--tg-theme-button-color)] border border-[var(--tg-theme-button-color)]/30"
        }`}
      >
        {connected ? "✓ Вкл" : readOnly ? "В боте" : "Настроить"}
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
