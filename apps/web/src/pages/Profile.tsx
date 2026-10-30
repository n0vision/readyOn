import { useState, useEffect } from "react";
import {
  getCurrentTelegramId,
  fetchUserProfile,
  updateUserIntegrations,
  updateUserProfile,
} from "../services/api.js";
import { SteamIcon, FaceitIcon, TeamSpeakIcon } from "../components/Icons.js";
import { User, Calendar, MapPin, X, Edit3, Camera } from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

type EditPlatform = "steam" | "faceit" | "ts" | null;

export function Profile() {
  const telegramId = getCurrentTelegramId();
  const [profile, setProfile] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditPlatform>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Profile editing state (Name and Avatar)
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");

  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchUserProfile(telegramId);
      setProfile(data);

      // Auto-sync Telegram avatar if user doesn't have one yet
      if (!data.avatarUrl && tgUser?.photo_url) {
        updateUserProfile(telegramId, { avatarUrl: tgUser.photo_url })
          .then((res) => {
            setProfile((prev: any) => ({ ...prev, avatarUrl: res.avatarUrl }));
          })
          .catch(() => {});
      }
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
    triggerHaptic("selection");
    setEditing(platform);
    if (platform === "steam") setInputValue(profile?.steamId || "");
    else if (platform === "faceit") setInputValue(profile?.faceitId || "");
    else if (platform === "ts") setInputValue(profile?.tsIdentity || "");
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    try {
      setSaving(true);
      triggerHaptic("success");
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

  const handleOpenEditProfile = () => {
    triggerHaptic("selection");
    setNewDisplayName(profile?.displayName || "");
    setNewAvatarUrl(profile?.avatarUrl || "");
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      triggerHaptic("success");
      await updateUserProfile(telegramId, {
        displayName: newDisplayName.trim() || profile?.displayName,
        avatarUrl: newAvatarUrl.trim() || null,
      });
      setEditProfileOpen(false);
      await loadProfile();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        paddingBottom: "calc(80px + max(env(safe-area-inset-bottom, 0px), var(--app-safe-bottom, 0px)))",
      }}
      className="p-4 space-y-4 max-w-lg mx-auto"
    >
      {/* Header Profile Card */}
      <div className="bg-[#2B2D31] border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-[#323336] border border-white/10 flex items-center justify-center text-lg font-extrabold text-white overflow-hidden">
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                profile?.displayName?.[0] || <User className="w-6 h-6 text-white/70" />
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#23A55A] border-2 border-[#2B2D31]"></span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-extrabold text-white leading-tight truncate">
              {profile?.displayName || "Профиль"}
            </h1>
            <p className="text-xs text-[#8BA4CC] mt-0.5 font-medium truncate">
              {profile?.username ? `@${profile.username}` : `ID: ${telegramId}`}
            </p>
            <p className="text-[11px] text-[#949BA4] mt-0.5">
              Telegram ID: {telegramId}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenEditProfile}
          className="p-2.5 rounded-xl bg-[#1E1F22] hover:bg-[#323336] text-[#8BA4CC] border border-white/5 transition-all cursor-pointer shrink-0 active:scale-95"
          title="Редактировать профиль"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Gaming Integrations */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-[#949BA4] px-1 uppercase tracking-wider">
          Игровые привязки
        </h2>

        {/* Steam Card */}
        <div
          onClick={() => openEdit("steam")}
          className="bg-[#2B2D31] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-white/10 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1E1F22] border border-white/5 flex items-center justify-center shrink-0 text-[#66C0F4]">
              <SteamIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Steam</span>
                {profile?.steamId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#23A55A]"></span>
                )}
              </div>
              <div className="text-xs text-[#949BA4] truncate mt-0.5 font-medium">
                {profile?.steamId ? `ID: ${profile.steamId} · В CS2` : "Показывать игру и онлайн-статус"}
              </div>
            </div>
          </div>
          <button className="px-2.5 py-1.5 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[11px] font-semibold text-[#8BA4CC] border border-white/5 shrink-0 transition-all">
            {profile?.steamId ? "Изменить" : "Привязать"}
          </button>
        </div>

        {/* FACEIT Card */}
        <div
          onClick={() => openEdit("faceit")}
          className="bg-[#2B2D31] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-white/10 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1E1F22] border border-white/5 flex items-center justify-center shrink-0 text-[#FF5500]">
              <FaceitIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>FACEIT</span>
                {profile?.faceitId && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#23A55A]"></span>
                )}
              </div>
              <div className="text-xs text-[#949BA4] truncate mt-0.5 font-medium">
                {profile?.faceitId ? `Ник: ${profile.faceitId} · ELO и уровень` : "Матчи, ELO и уровень"}
              </div>
            </div>
          </div>
          <button className="px-2.5 py-1.5 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[11px] font-semibold text-[#8BA4CC] border border-white/5 shrink-0 transition-all">
            {profile?.faceitId ? "Изменить" : "Привязать"}
          </button>
        </div>

        {/* TeamSpeak Card */}
        <div
          onClick={() => openEdit("ts")}
          className="bg-[#2B2D31] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-white/10 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1E1F22] border border-white/5 flex items-center justify-center shrink-0 text-[#2580C3]">
              <TeamSpeakIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>TeamSpeak</span>
                {profile?.tsIdentity && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#23A55A]"></span>
                )}
              </div>
              <div className="text-xs text-[#949BA4] truncate mt-0.5 font-medium">
                {profile?.tsIdentity ? `Ник: ${profile.tsIdentity} · В канале` : "Статус в голосовом канале"}
              </div>
            </div>
          </div>
          <button className="px-2.5 py-1.5 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[11px] font-semibold text-[#8BA4CC] border border-white/5 shrink-0 transition-all">
            {profile?.tsIdentity ? "Изменить" : "Привязать"}
          </button>
        </div>

        {/* Calendar Card */}
        <div className="bg-[#2B2D31] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1E1F22] border border-white/5 flex items-center justify-center shrink-0 text-[#949BA4]">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white">Календарь (ICS)</div>
              <div className="text-xs text-[#949BA4] truncate mt-0.5 font-medium">
                Авто-статус занятости
              </div>
            </div>
          </div>
          <span className="text-[11px] text-[#949BA4]/70 px-2 py-1 rounded-lg bg-[#1E1F22] border border-white/5">
            {profile?.calendarSources?.length > 0 ? "Включен" : "Не подключен"}
          </span>
        </div>

        {/* Geolocation Card */}
        <div className="bg-[#2B2D31] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1E1F22] border border-white/5 flex items-center justify-center shrink-0 text-[#8BA4CC]">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white">Геолокация</div>
              <div className="text-xs text-[#949BA4] truncate mt-0.5 font-medium">
                {profile?.hasHomeLocation ? "Точка дома сохранена" : "Отправь локацию боту"}
              </div>
            </div>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${
              profile?.hasHomeLocation
                ? "bg-[#23A55A]/10 text-[#23A55A] border-[#23A55A]/20"
                : "bg-[#1E1F22] text-[#949BA4] border-white/5"
            }`}
          >
            {profile?.hasHomeLocation ? "Активна" : "Не задана"}
          </span>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-2">
        <h2 className="text-xs font-bold text-[#949BA4] px-1 uppercase tracking-wider">
          Уведомления
        </h2>

        <div className="rounded-2xl bg-[#2B2D31] p-3.5 space-y-2.5 border border-white/5">
          <NotificationToggle label="Ремайндер поставить статус" defaultOn={true} />
          <NotificationToggle label="Друг готов играть" defaultOn={true} />
          <NotificationToggle label="Все в скваде готовы" defaultOn={true} />
          <NotificationToggle label="Друг зашёл в CS2" defaultOn={false} />
          <NotificationToggle label="Друг в TeamSpeak" defaultOn={false} />
        </div>
      </section>

      {/* Profile Edit Modal (Name & Avatar Source) */}
      {editProfileOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#2B2D31] border border-white/10 rounded-2xl p-4 w-full max-w-sm space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#8BA4CC]" />
                <span>Настройка профиля</span>
              </h3>
              <button
                onClick={() => setEditProfileOpen(false)}
                className="text-[#949BA4] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[#949BA4] uppercase tracking-wider">
                  Имя в скваде
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Твой никнейм"
                  className="w-full bg-[#1E1F22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#949BA4]/50 focus:outline-none focus:border-[#3F5F96] transition-colors"
                />
              </div>

              {/* Avatar Preview & Source buttons */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-[#949BA4] uppercase tracking-wider flex items-center justify-between">
                  <span>Аватарка</span>
                  {newAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setNewAvatarUrl("")}
                      className="text-[#949BA4] hover:text-[#F23F43] text-[10px]"
                    >
                      Сбросить
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-3 p-2 rounded-xl bg-[#1E1F22] border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-[#323336] border border-white/10 flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0">
                    {newAvatarUrl ? (
                      <img src={newAvatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      newDisplayName?.[0] || "U"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={newAvatarUrl}
                      onChange={(e) => setNewAvatarUrl(e.target.value)}
                      placeholder="Ссылка на картинку (https://...)"
                      className="w-full bg-transparent text-xs text-white placeholder-[#949BA4]/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Quick Avatar Source Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tgUser?.photo_url && (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic("selection");
                        setNewAvatarUrl(tgUser.photo_url);
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[#8BA4CC] border border-white/5 flex items-center gap-1 transition-all"
                    >
                      <Camera className="w-3 h-3" />
                      <span>Из Telegram</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[#949BA4] hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs bg-[#3F5F96] hover:bg-[#4D72B0] text-white font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Integration Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#2B2D31] border border-white/10 rounded-2xl p-4 w-full max-w-sm space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                {editing === "steam" && "Привязать Steam"}
                {editing === "faceit" && "Привязать FACEIT"}
                {editing === "ts" && "Привязать TeamSpeak"}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="text-[#949BA4] hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIntegration} className="space-y-3">
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
                className="w-full bg-[#1E1F22] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#949BA4]/50 focus:outline-none focus:border-[#3F5F96] transition-colors"
              />

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-3.5 py-2 rounded-xl text-xs text-[#949BA4] hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-xs bg-[#3F5F96] hover:bg-[#4D72B0] text-white font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  {saving ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationToggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [checked, setChecked] = useState(defaultOn);
  return (
    <label className="flex items-center justify-between cursor-pointer select-none py-1">
      <span className="text-xs text-[#DBDEE1]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          triggerHaptic("selection");
          setChecked(e.target.checked);
        }}
        className="w-10 h-6 rounded-full appearance-none bg-[#1E1F22] border border-white/10 checked:bg-[#3F5F96] checked:border-[#3F5F96] transition-colors relative
          before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-1 before:transition-transform
          checked:before:translate-x-3.5 cursor-pointer shadow-inner"
      />
    </label>
  );
}
