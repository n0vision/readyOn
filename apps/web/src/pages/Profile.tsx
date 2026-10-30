import { useState, useEffect } from "react";
import {
  getCurrentTelegramId,
  fetchUserProfile,
  updateUserIntegrations,
  updateUserProfile,
  updateUserNotifications,
  sendTestNotification,
  fetchUserCalendar,
  uploadCalendarFile,
  subscribeCalendarUrl,
  deleteCalendarSource,
  syncUserCalendar,
  setUserHomeLocation,
  sendUserLocation,
} from "../services/api.js";
import { SteamIcon, FaceitIcon, TeamSpeakIcon } from "../components/Icons.js";
import {
  User,
  Calendar,
  MapPin,
  Car,
  Navigation,
  X,
  Edit3,
  Camera,
  Bell,
  Trash2,
  Plus,
  RefreshCw,
  Upload,
  Link2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

type EditPlatform = "steam" | "faceit" | "ts" | null;

interface NotificationSettings {
  reminder: boolean;
  friend_ready: boolean;
  squad_full: boolean;
  friend_cs2: boolean;
  friend_ts: boolean;
}

const defaultSettings: NotificationSettings = {
  reminder: true,
  friend_ready: true,
  squad_full: true,
  friend_cs2: false,
  friend_ts: false,
};

export function Profile() {
  const telegramId = getCurrentTelegramId();
  const [profile, setProfile] = useState<any>(null);
  const [, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditPlatform>(null);
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Notification settings state
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(defaultSettings);
  const [testingNotif, setTestingNotif] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  // Calendar integration state
  const [calendarData, setCalendarData] = useState<any>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [calendarTab, setCalendarTab] = useState<"url" | "file">("url");
  const [calName, setCalName] = useState("");
  const [calUrl, setCalUrl] = useState("");
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Location state
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [locSuccess, setLocSuccess] = useState<string | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  // Profile editing state (Name and Avatar)
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState("");

  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;

  const loadCalendar = async () => {
    try {
      const data = await fetchUserCalendar(telegramId);
      setCalendarData(data);
    } catch (err) {
      console.error("Failed to load calendar:", err);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchUserProfile(telegramId);
      setProfile(data);
      await loadCalendar();

      if (data.notificationSettings && typeof data.notificationSettings === "object") {
        setNotifSettings({
          ...defaultSettings,
          ...data.notificationSettings,
        });
      }

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

  const handleToggleNotification = async (key: keyof NotificationSettings) => {
    triggerHaptic("selection");
    const updated = {
      ...notifSettings,
      [key]: !notifSettings[key],
    };
    setNotifSettings(updated);
    try {
      await updateUserNotifications(telegramId, updated);
    } catch (err) {
      console.error("Failed to save notification settings:", err);
    }
  };

  const handleSendTestNotification = async () => {
    triggerHaptic("selection");
    setTestingNotif(true);
    setTestSuccess(null);
    try {
      await sendTestNotification(telegramId);
      triggerHaptic("success");
      setTestSuccess("🔔 Уведомление отправлено! Проверь бота @readyOnCS_bot");
      setTimeout(() => setTestSuccess(null), 5000);
    } catch (err: any) {
      triggerHaptic("error");
      setTestSuccess(err.message || "Ошибка отправки в бота");
      setTimeout(() => setTestSuccess(null), 5000);
    } finally {
      setTestingNotif(false);
    }
  };

  const handleSubscribeUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calUrl.trim()) return;
    try {
      setCalendarLoading(true);
      setCalendarError(null);
      triggerHaptic("selection");
      await subscribeCalendarUrl(telegramId, calName.trim() || "Календарь", calUrl.trim());
      triggerHaptic("success");
      setCalUrl("");
      setCalName("");
      await loadCalendar();
    } catch (err: any) {
      triggerHaptic("error");
      setCalendarError(err.message || "Ошибка подключения календаря");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCalendarLoading(true);
      setCalendarError(null);
      triggerHaptic("selection");
      const text = await file.text();
      const fileName = file.name.replace(/\.ics$/i, "");
      await uploadCalendarFile(telegramId, fileName || "Загруженный календарь", text);
      triggerHaptic("success");
      await loadCalendar();
    } catch (err: any) {
      triggerHaptic("error");
      setCalendarError(err.message || "Ошибка загрузки .ics файла");
    } finally {
      setCalendarLoading(false);
      e.target.value = "";
    }
  };

  const handleDeleteCalendar = async (sourceId: number) => {
    try {
      triggerHaptic("selection");
      await deleteCalendarSource(telegramId, sourceId);
      await loadCalendar();
    } catch (err) {
      console.error("Failed to delete calendar source:", err);
    }
  };

  const handleSyncNow = async () => {
    try {
      setCalendarLoading(true);
      triggerHaptic("selection");
      await syncUserCalendar(telegramId);
      triggerHaptic("success");
      await loadCalendar();
    } catch (err: any) {
      triggerHaptic("error");
      setCalendarError(err.message || "Ошибка синхронизации");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleSetCurrentAsHome = () => {
    if (!navigator.geolocation) {
      setLocError("Геолокация не поддерживается вашим браузером");
      return;
    }
    setLocLoading(true);
    setLocError(null);
    setLocSuccess(null);
    triggerHaptic("selection");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await setUserHomeLocation(telegramId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          triggerHaptic("success");
          setLocSuccess("🏠 Точка «Дом» успешно сохранена!");
          setProfile((prev: any) => ({ ...prev, hasHomeLocation: true }));
          setTimeout(() => setLocSuccess(null), 4000);
        } catch (err: any) {
          triggerHaptic("error");
          setLocError(err.message || "Ошибка сохранения точки");
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocLoading(false);
        triggerHaptic("error");
        setLocError("Не удалось получить геопозицию: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleUpdateCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Геолокация не поддерживается вашим браузером");
      return;
    }
    setLocLoading(true);
    setLocError(null);
    setLocSuccess(null);
    triggerHaptic("selection");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await sendUserLocation(telegramId, {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading || undefined,
            speed: pos.coords.speed || undefined,
          });
          triggerHaptic("success");
          const msg =
            res.locationStatus === "home"
              ? "🏠 Статус обновлён: Вы дома!"
              : res.locationStatus === "transit"
              ? `🚗 Статус обновлён: В пути (~${res.etaMinutes || 15} мин)`
              : "📍 Статус обновлён: Не дома";
          setLocSuccess(msg);
          setTimeout(() => setLocSuccess(null), 4000);
        } catch (err: any) {
          triggerHaptic("error");
          setLocError(err.message || "Ошибка отправки геопозиции");
        } finally {
          setLocLoading(false);
        }
      },
      (err) => {
        setLocLoading(false);
        triggerHaptic("error");
        setLocError("Не удалось получить геопозицию: " + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleClearHome = async () => {
    try {
      setLocLoading(true);
      setLocError(null);
      triggerHaptic("selection");
      await setUserHomeLocation(telegramId, { clear: true });
      triggerHaptic("success");
      setProfile((prev: any) => ({ ...prev, hasHomeLocation: false }));
      setLocSuccess("Точка «Дом» удалена.");
      setTimeout(() => setLocSuccess(null), 4000);
    } catch (err: any) {
      triggerHaptic("error");
      setLocError(err.message || "Ошибка сброса");
    } finally {
      setLocLoading(false);
    }
  };

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

        {/* Calendar Card (Smart Auto-Status) */}
        <div
          onClick={() => {
            triggerHaptic("selection");
            setCalendarModalOpen(true);
          }}
          className="bg-[#2B2D31] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:border-white/10 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1E1F22] border border-white/5 flex items-center justify-center shrink-0 text-[#8BA4CC]">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Календарь и расписание</span>
                {calendarData?.sources?.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#23A55A]"></span>
                )}
              </div>
              <div className="text-xs text-[#949BA4] truncate mt-0.5 font-medium">
                {calendarData?.calculatedStatus?.comment
                  ? calendarData.calculatedStatus.comment
                  : calendarData?.sources?.length > 0
                  ? `${calendarData.sources.length} подключен(о) · Авто-статус активен`
                  : "Автоматический статус из расписания (ICS)"}
              </div>
            </div>
          </div>
          <button className="px-2.5 py-1.5 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[11px] font-semibold text-[#8BA4CC] border border-white/5 shrink-0 transition-all pointer-events-none">
            {calendarData?.sources?.length > 0 ? "Настроить" : "Подключить"}
          </button>
        </div>

        {/* Geolocation Card */}
        <div
          onClick={() => {
            triggerHaptic("selection");
            setLocationModalOpen(true);
          }}
          className="bg-[#2B2D31] border border-white/5 hover:border-[#8BA4CC]/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#1E1F22] border border-white/5 flex items-center justify-center shrink-0 text-[#8BA4CC]">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Геолокация и статус «Дома»</span>
                {profile?.hasHomeLocation && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#23A55A]"></span>
                )}
              </div>
              <div className="text-xs text-[#949BA4] truncate mt-0.5 font-medium">
                {profile?.hasHomeLocation
                  ? "Точка «Дом» сохранена · Авто-статус активен"
                  : "Нажми для сохранения точки «Дом»"}
              </div>
            </div>
          </div>
          <button className="px-2.5 py-1.5 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[11px] font-semibold text-[#8BA4CC] border border-white/5 shrink-0 transition-all pointer-events-none">
            {profile?.hasHomeLocation ? "Настроить" : "Задать"}
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[#949BA4] uppercase tracking-wider">
            Уведомления бота
          </h2>
          <span className="text-[11px] text-[#8BA4CC] font-medium">@readyOnCS_bot</span>
        </div>

        <div className="rounded-2xl bg-[#2B2D31] p-3.5 space-y-2.5 border border-white/5 shadow-sm">
          <NotificationToggle
            label="Ремайндер поставить статус"
            checked={notifSettings.reminder}
            onChange={() => handleToggleNotification("reminder")}
          />
          <NotificationToggle
            label="Друг готов играть"
            checked={notifSettings.friend_ready}
            onChange={() => handleToggleNotification("friend_ready")}
          />
          <NotificationToggle
            label="Все в скваде готовы (фулл стак)"
            checked={notifSettings.squad_full}
            onChange={() => handleToggleNotification("squad_full")}
          />
          <NotificationToggle
            label="Друг зашёл в CS2"
            checked={notifSettings.friend_cs2}
            onChange={() => handleToggleNotification("friend_cs2")}
          />
          <NotificationToggle
            label="Друг в TeamSpeak"
            checked={notifSettings.friend_ts}
            onChange={() => handleToggleNotification("friend_ts")}
          />

          <div className="pt-2 border-t border-white/5 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleSendTestNotification}
              disabled={testingNotif}
              className="w-full py-2.5 px-3 rounded-xl bg-[#1E1F22] hover:bg-[#323336] active:scale-[0.98] border border-white/10 text-xs font-semibold text-[#DBDEE1] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-[#5865F2]" />
              <span>{testingNotif ? "Отправка..." : "Отправить тестовое уведомление"}</span>
            </button>
            {testSuccess && (
              <p className="text-[11px] text-center text-[#23A55A] font-medium animate-fade-in">
                {testSuccess}
              </p>
            )}
          </div>
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

      {/* Calendar Management Modal */}
      {calendarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#2B2D31] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#8BA4CC]" />
                <h3 className="text-sm font-bold text-white">Календарь и авто-статус</h3>
              </div>
              <button
                onClick={() => setCalendarModalOpen(false)}
                className="text-[#949BA4] hover:text-white text-lg font-bold px-2 py-0.5 rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Smart calculation card */}
            {calendarData?.calculatedStatus && (
              <div className="p-3 rounded-xl bg-[#23A55A]/10 border border-[#23A55A]/30 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#23A55A]">
                  <span className="w-2 h-2 rounded-full bg-[#23A55A] animate-pulse" />
                  <span>
                    {calendarData.calculatedStatus.status === "READY"
                      ? `Авто-статус: Готов с ${calendarData.calculatedStatus.availableFrom}`
                      : "Авто-статус: Сегодня занят"}
                  </span>
                </div>
                <p className="text-[11px] text-[#DBDEE1]">
                  {calendarData.calculatedStatus.comment}
                </p>
              </div>
            )}

            {/* Today's events */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#949BA4] uppercase tracking-wider">
                  События на сегодня ({calendarData?.todayEvents?.length || 0})
                </span>
                {calendarData?.sources?.length > 0 && (
                  <button
                    onClick={handleSyncNow}
                    disabled={calendarLoading}
                    className="text-[11px] text-[#8BA4CC] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${calendarLoading ? "animate-spin" : ""}`} />
                    <span>Обновить</span>
                  </button>
                )}
              </div>

              {calendarData?.todayEvents?.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {calendarData.todayEvents.map((ev: any) => {
                    const start = new Date(ev.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const end = new Date(ev.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={ev.id}
                        className="p-2 rounded-lg bg-[#1E1F22] border border-white/5 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-white truncate max-w-[170px]">
                          {ev.title}
                        </span>
                        <span className="text-[11px] text-[#949BA4] shrink-0 font-mono">
                          {start} – {end}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-[#949BA4] py-1 italic">
                  На сегодня дел нет — готов катать в любое время!
                </p>
              )}
            </div>

            {/* Connected sources */}
            {calendarData?.sources?.length > 0 && (
              <div className="pt-1 border-t border-white/5">
                <span className="text-xs font-semibold text-[#949BA4] uppercase tracking-wider block mb-2">
                  Подключенные календари
                </span>
                <div className="space-y-1.5">
                  {calendarData.sources.map((src: any) => (
                    <div
                      key={src.id}
                      className="p-2 rounded-lg bg-[#1E1F22] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="truncate max-w-[190px]">
                        <p className="font-semibold text-white truncate">{src.name}</p>
                        <p className="text-[10px] text-[#949BA4]">
                          {src.type === "ICS_FILE" ? "Файл .ics" : "Webcal / Ссылка"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteCalendar(src.id)}
                        className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-400/10 cursor-pointer"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new calendar tab */}
            <div className="pt-2 border-t border-white/5 space-y-3">
              <span className="text-xs font-semibold text-[#949BA4] uppercase tracking-wider block">
                Добавить календарь
              </span>

              {/* Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#1E1F22] rounded-xl border border-white/5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setCalendarTab("url")}
                  className={`py-1.5 rounded-lg transition-all ${
                    calendarTab === "url"
                      ? "bg-[#3F5F96] text-white shadow-sm"
                      : "text-[#949BA4] hover:text-white"
                  }`}
                >
                  По ссылке (URL)
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarTab("file")}
                  className={`py-1.5 rounded-lg transition-all ${
                    calendarTab === "file"
                      ? "bg-[#3F5F96] text-white shadow-sm"
                      : "text-[#949BA4] hover:text-white"
                  }`}
                >
                  Файл .ics
                </button>
              </div>

              {calendarError && (
                <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                  {calendarError}
                </p>
              )}

              {calendarTab === "url" ? (
                <form onSubmit={handleSubscribeUrl} className="space-y-2">
                  <input
                    type="text"
                    value={calName}
                    onChange={(e) => setCalName(e.target.value)}
                    placeholder="Название (напр. Работа, Google)"
                    className="w-full bg-[#1E1F22] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#949BA4]/50 focus:outline-none focus:border-[#3F5F96]"
                  />
                  <input
                    type="url"
                    value={calUrl}
                    onChange={(e) => setCalUrl(e.target.value)}
                    placeholder="https://... или webcal://..."
                    required
                    className="w-full bg-[#1E1F22] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#949BA4]/50 focus:outline-none focus:border-[#3F5F96]"
                  />
                  <p className="text-[10px] text-[#949BA4]">
                    Подходит «Секретный адрес в формате iCal» из настроек Google Calendar, Apple Calendar или Яндекс.
                  </p>
                  <button
                    type="submit"
                    disabled={calendarLoading || !calUrl.trim()}
                    className="w-full py-2.5 rounded-xl text-xs bg-[#3F5F96] hover:bg-[#4D72B0] text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {calendarLoading ? "Подключение..." : "Подключить по ссылке"}
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <label className="block w-full border-2 border-dashed border-white/15 hover:border-[#8BA4CC]/40 rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#1E1F22]/50 hover:bg-[#1E1F22]">
                    <Upload className="w-5 h-5 text-[#8BA4CC] mx-auto mb-1.5" />
                    <span className="text-xs font-semibold text-white block">
                      Выберите .ics файл
                    </span>
                    <span className="text-[10px] text-[#949BA4]">
                      Экспортированный файл календаря
                    </span>
                    <input
                      type="file"
                      accept=".ics,text/calendar"
                      onChange={handleFileUpload}
                      disabled={calendarLoading}
                      className="hidden"
                    />
                  </label>
                  {calendarLoading && (
                    <p className="text-xs text-center text-[#8BA4CC] animate-pulse">
                      Загрузка и парсинг...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Geolocation Management Modal */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#2B2D31] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#8BA4CC]" />
                <h3 className="text-sm font-bold text-white">Геолокация и статус «Дома»</h3>
              </div>
              <button
                onClick={() => setLocationModalOpen(false)}
                className="text-[#949BA4] hover:text-white text-lg font-bold px-2 py-0.5 rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Status card */}
            <div
              className={`p-3 rounded-xl border space-y-1 ${
                profile?.hasHomeLocation
                  ? "bg-[#23A55A]/10 border-[#23A55A]/30 text-[#23A55A]"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className={`w-2 h-2 rounded-full ${
                    profile?.hasHomeLocation ? "bg-[#23A55A]" : "bg-amber-500"
                  }`}
                />
                <span>
                  {profile?.hasHomeLocation
                    ? "Точка «Дом» настроена"
                    : "Точка «Дом» не сохранена"}
                </span>
              </div>
              <p className="text-[11px] text-[#DBDEE1]">
                {profile?.hasHomeLocation
                  ? "В радиусе 250м от этой точки ваш статус автоматически становится «Дома». При движении домой отображается ETA."
                  : "Сохраните координаты дома, чтобы бот рассчитывал статус «Дома» и время в пути."}
              </p>
            </div>

            {/* Success and error alerts */}
            {locSuccess && (
              <p className="text-xs text-[#23A55A] bg-[#23A55A]/10 p-2 rounded-lg border border-[#23A55A]/20 font-medium">
                {locSuccess}
              </p>
            )}
            {locError && (
              <p className="text-xs text-red-400 bg-red-400/10 p-2 rounded-lg border border-red-400/20 font-medium">
                {locError}
              </p>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleSetCurrentAsHome}
                disabled={locLoading}
                className="w-full py-2.5 px-3 rounded-xl text-xs bg-[#3F5F96] hover:bg-[#4D72B0] text-white font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <MapPin className="w-4 h-4" />
                <span>
                  {locLoading
                    ? "Определение координат..."
                    : profile?.hasHomeLocation
                    ? "Перезаписать текущую точку как «Дом»"
                    : "Задать текущую геопозицию как «Дом»"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleUpdateCurrentLocation}
                disabled={locLoading}
                className="w-full py-2.5 px-3 rounded-xl text-xs bg-[#1E1F22] hover:bg-[#323336] text-[#DBDEE1] hover:text-white font-semibold transition-all border border-white/5 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4 text-[#8BA4CC]" />
                <span>Обновить текущую локацию</span>
              </button>

              {profile?.hasHomeLocation && (
                <button
                  type="button"
                  onClick={handleClearHome}
                  disabled={locLoading}
                  className="w-full py-2 px-3 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-all font-medium cursor-pointer"
                >
                  Сбросить точку «Дом»
                </button>
              )}
            </div>

            {/* Telegram Bot Live Location hint */}
            <div className="p-2.5 rounded-xl bg-[#1E1F22] border border-white/5 space-y-1 text-xs">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <span>📱 Через Telegram бот</span>
              </p>
              <p className="text-[11px] text-[#949BA4] leading-relaxed">
                Вы также можете нажать на скрепку 📎 в диалоге с ботом и выбрать <b>«Геопозиция»</b> или <b>«Транслировать геопозицию»</b> (Live Location на 1 час при выезде домой).
              </p>
            </div>

            {/* Privacy note */}
            <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-[#949BA4] space-y-1">
              <span className="font-semibold text-[#DBDEE1] block">🔒 100% приватность</span>
              <p className="leading-relaxed">
                Ваши точные координаты никому не видны. Друзья в команде видят только абстрактный статус: «Дома», «В пути ~15 мин» или «Не дома».
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none py-1">
      <span className="text-xs text-[#DBDEE1]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-10 h-6 rounded-full appearance-none bg-[#1E1F22] border border-white/10 checked:bg-[#3F5F96] checked:border-[#3F5F96] transition-colors relative
          before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-1 before:transition-transform
          checked:before:translate-x-3.5 cursor-pointer shadow-inner"
      />
    </label>
  );
}
