import { useState, useEffect, useCallback } from "react";
import { StatusSelector } from "../components/StatusSelector.js";
import { MemberCard } from "../components/MemberCard.js";
import type { ReadyStatusType, GroupView } from "@readyon/shared";
import {
  Crosshair,
  RefreshCw,
  Users,
  ChevronDown,
  Flame,
  Share2,
  Check,
} from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";
import {
  getCurrentTelegramId,
  fetchUserStatus,
  updateUserStatus,
  fetchUserGroups,
  fetchGroupStatus,
} from "../services/api.js";

const TIME_OPTIONS = ["Сейчас", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

export function Dashboard() {
  const telegramId = getCurrentTelegramId();

  const [currentStatus, setCurrentStatus] = useState<ReadyStatusType>("UNSET");
  const [availableFrom, setAvailableFrom] = useState<string | null>("20:00");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupView | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    try {
      window.Telegram?.WebApp?.ready();
      window.Telegram?.WebApp?.expand();
    } catch (e) {
      // Browser mode
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load user status
      const statusData = await fetchUserStatus(telegramId);
      if (statusData?.dailyStatus) {
        setCurrentStatus(statusData.dailyStatus.status as ReadyStatusType);
        if (statusData.dailyStatus.availableFrom) {
          setAvailableFrom(statusData.dailyStatus.availableFrom);
        }
      }

      // Load user groups
      const userGroups = await fetchUserGroups(telegramId);
      setGroups(userGroups);

      if (userGroups && userGroups.length > 0) {
        const firstGroup = await fetchGroupStatus(userGroups[0].id);
        setSelectedGroup(firstGroup);
      } else {
        setSelectedGroup(null);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [telegramId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (status: ReadyStatusType) => {
    setCurrentStatus(status);

    try {
      setUpdating(true);
      const timeToSet = status === "READY" ? availableFrom || "20:00" : null;
      await updateUserStatus(telegramId, status, timeToSet, null);
      if (selectedGroup) {
        const updated = await fetchGroupStatus(selectedGroup.group.id);
        setSelectedGroup(updated);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleSelectTime = async (time: string) => {
    const formatted =
      time === "Сейчас"
        ? new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })
        : time;

    setAvailableFrom(formatted);
    setCurrentStatus("READY");
    setShowTimePicker(false);

    try {
      setUpdating(true);
      await updateUserStatus(telegramId, "READY", formatted, null);
      if (selectedGroup) {
        const updated = await fetchGroupStatus(selectedGroup.group.id);
        setSelectedGroup(updated);
      }
    } catch (err) {
      console.error("Failed to update status time:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleShareInvite = () => {
    if (!selectedGroup) return;
    triggerHaptic("success");
    const inviteUrl = `https://t.me/readyOnCS_bot?start=group_${selectedGroup.group.inviteCode}`;
    const text = `Го в CS2! Заходи в пати в readyOn 🎯:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  const readyCount =
    selectedGroup?.members.filter((m) => m.dailyStatus?.status === "READY").length || 0;
  const totalCount = selectedGroup?.members.length || 0;
  const targetSize = (selectedGroup as any)?.group?.targetSize || 5;
  const neededCount = Math.max(0, targetSize - readyCount);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-44">
      {/* Top Header: Logo + Refresh */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          {/* Tactical Crosshair Icon */}
          <div className="w-10 h-10 rounded-xl bg-[#00f076]/15 border border-[#00f076]/30 flex items-center justify-center text-[#00f076] shadow-[0_0_16px_rgba(0,240,118,0.3)]">
            <Crosshair className="w-5 h-5 text-[#00f076]" />
          </div>
          <div>
            <h1 className="font-hud text-xl font-black tracking-tight text-white flex items-center">
              <span>ready</span>
              <span className="text-[#00f076] drop-shadow-[0_0_10px_rgba(0,240,118,0.7)]">On</span>
            </h1>
            <p className="font-hud text-[9px] uppercase font-bold tracking-widest text-white/40">
              CS2 КООРДИНАТОР СКВАДА
            </p>
          </div>
        </div>

        {/* Refresh button with micro-spin */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            loadData();
          }}
          disabled={loading || updating}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer shadow-sm"
          title="Обновить"
        >
          <RefreshCw
            className={`w-4 h-4 transition-all ${
              loading || updating ? "animate-spin text-[#00f076]" : "text-white/75"
            }`}
          />
        </button>
      </div>

      {/* Group Selector Pill & Ready Counter */}
      <div className="flex items-center justify-between gap-2">
        <div className="relative">
          {groups.length > 1 ? (
            <div className="relative">
              <select
                value={selectedGroup?.group.id || ""}
                onChange={(e) => {
                  triggerHaptic("selection");
                  const gId = Number(e.target.value);
                  fetchGroupStatus(gId).then(setSelectedGroup);
                }}
                className="appearance-none bg-[#161c28] border border-white/10 rounded-xl px-3.5 py-2 pr-9 text-xs font-bold text-white cursor-pointer focus:outline-none focus:border-[#00f076]/50 transition-all font-hud tracking-wide"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="bg-[#161c28] border border-white/10 rounded-xl px-3.5 py-2 flex items-center gap-2 text-xs font-bold text-white font-hud tracking-wide shadow-sm">
              <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>{selectedGroup ? selectedGroup.group.name : "CS Пацаны"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/40" />
            </div>
          )}
        </div>

        {/* Ready Counter Pill with Pulsing Live Dot */}
        <div className="bg-[#00f076]/15 border border-[#00f076]/35 text-[#00f076] font-hud font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-[0_0_14px_rgba(0,240,118,0.25)] flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00f076] shadow-[0_0_8px_#00f076] animate-pulse"></span>
          <span>{readyCount}/{targetSize} ГОТОВЫ</span>
        </div>
      </div>

      {/* Hero Status Card (ГОТОВ / ПОПОЗЖЕ / НЕ СЕГОДНЯ with 2.5x height) */}
      <StatusSelector
        value={currentStatus}
        availableFrom={availableFrom}
        onChange={handleStatusChange}
        onOpenTimePicker={() => setShowTimePicker(!showTimePicker)}
      />

      {/* Time Picker Dropdown (2.5x taller buttons) */}
      {showTimePicker && (
        <div className="hud-card p-4 rounded-3xl border border-[#00f076]/40 space-y-3 animate-in fade-in duration-200 shadow-xl">
          <div className="font-hud text-xs font-black uppercase tracking-wider text-[#00f076]">
            Во сколько сможешь играть?
          </div>
          <div className="grid grid-cols-4 gap-2">
            {TIME_OPTIONS.map((time) => (
              <button
                key={time}
                onClick={() => handleSelectTime(time)}
                className={`h-12 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center font-hud tracking-wide ${
                  availableFrom === time
                    ? "bg-[#00f076] text-black shadow-[0_0_14px_rgba(0,240,118,0.5)] font-black"
                    : "bg-white/5 hover:bg-white/10 text-white/80 border border-white/5"
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Squad Roster */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-hud text-[11px] font-extrabold uppercase tracking-widest text-white/50 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#00f076]" />
            <span>{selectedGroup ? `Состав ${selectedGroup.group.name}` : "Состав сквада"}</span>
          </h2>
          <span className="font-hud text-[11px] text-white/40 font-semibold tracking-wider">
            {totalCount} ЧЕЛ.
          </span>
        </div>

        {loading ? (
          <div className="hud-card rounded-2xl p-6 text-center text-xs text-white/40 animate-pulse font-hud tracking-wide">
            Синхронизация статусов с сервером...
          </div>
        ) : selectedGroup && selectedGroup.members.length > 0 ? (
          <div className="space-y-3">
            {selectedGroup.members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelf={String(member.id) === "1" || member.displayName.includes("Никита")}
              />
            ))}
          </div>
        ) : (
          <div className="hud-card rounded-2xl p-6 text-center text-white/50 space-y-2">
            <Users className="w-8 h-8 text-white/40 mx-auto" />
            <p className="font-bold text-sm text-white">У тебя пока нет групп</p>
            <p className="text-xs text-white/60">
              Создай группу в боте командой:
              <br />
              <code className="inline-block mt-2 px-2 py-1 rounded bg-black/50 text-[#00f076] font-mono text-xs border border-white/10">
                /group create CS Пацаны
              </code>
            </p>
          </div>
        )}
      </section>

      {/* Floating Bottom Banner: "ЕЩЁ N ДО ФУЛЛ-СТАКА" with perfectly aligned & sized INVITE button */}
      {selectedGroup && (
        <div className="fixed bottom-20 left-0 right-0 px-4 max-w-lg mx-auto z-40 pointer-events-none">
          <div
            className={`hud-card rounded-full py-2 pl-5 pr-3 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-xl pointer-events-auto transition-all ${
              neededCount === 0
                ? "border border-[#00f076]/50 shadow-[0_0_28px_rgba(0,240,118,0.35)]"
                : "border border-white/20"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Flame
                className={`w-5 h-5 flex-shrink-0 ${
                  neededCount === 0 ? "text-[#00f076] animate-bounce" : "text-amber-400"
                }`}
              />
              <span className="font-hud text-xs font-black uppercase tracking-wider text-white truncate">
                {neededCount > 0
                  ? `ЕЩЁ ${neededCount} ДО ФУЛЛ-СТАКА`
                  : "ФУЛЛ-СТАК В СБОРЕ!"}
              </span>
            </div>
            <button
              onClick={handleShareInvite}
              className="flex-shrink-0 h-10 px-5 rounded-full bg-white text-black font-hud font-black text-xs uppercase tracking-wider hover:bg-white/90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>СКОПИРОВАНО</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>ИНВАЙТ</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
