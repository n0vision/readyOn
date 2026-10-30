import { useState, useEffect, useCallback } from "react";
import { StatusSelector } from "../components/StatusSelector.js";
import { MemberCard } from "../components/MemberCard.js";
import type { ReadyStatusType, GroupView, GroupMemberView } from "@readyon/shared";
import {
  getCurrentTelegramId,
  fetchUserStatus,
  updateUserStatus,
  fetchUserGroups,
  fetchGroupStatus,
} from "../services/api.js";

const TIME_OPTIONS = ["Сейчас", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

export function Dashboard() {
  const telegramId = getCurrentTelegramId();

  const [currentStatus, setCurrentStatus] = useState<ReadyStatusType>("UNSET");
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupView | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
        setAvailableFrom(statusData.dailyStatus.availableFrom);
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
    if (status === "READY") {
      setShowTimePicker(true);
      return;
    }

    setShowTimePicker(false);
    setAvailableFrom(null);
    setCurrentStatus(status);

    try {
      setUpdating(true);
      await updateUserStatus(telegramId, status, null, null);
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
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const readyCount =
    selectedGroup?.members.filter((m) => m.dailyStatus?.status === "READY").length || 0;
  const totalCount = selectedGroup?.members.length || 0;
  const targetSize = (selectedGroup as any)?.group?.targetSize || 5;

  const handleShareInvite = () => {
    if (!selectedGroup) return;
    const inviteUrl = `https://t.me/readyOnCS_bot?start=group_${selectedGroup.group.inviteCode}`;
    const text = `Го в CS2! Заходи в пати в readyOn:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Tactical Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00e676]/15 border border-[#00e676]/30 flex items-center justify-center text-[#00e676] text-lg font-bold shadow-[0_0_12px_rgba(0,230,118,0.25)]">
            ⌖
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white">readyOn</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-white/40">
              CS2 Squad Coordinator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedGroup && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#00e676]/15 text-[#00e676] border border-[#00e676]/30 shadow-[0_0_10px_rgba(0,230,118,0.2)]">
              {readyCount}/{totalCount} готовы
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading || updating}
            className="w-8 h-8 rounded-xl glass-panel flex items-center justify-center text-xs text-white/70 hover:text-white transition-all cursor-pointer"
            title="Обновить"
          >
            <span className={loading || updating ? "animate-spin" : ""}>🔄</span>
          </button>
        </div>
      </div>

      {/* Hero Status Card */}
      <section className="glass-panel p-4 rounded-3xl space-y-3 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-white/50">
            Твой статус
          </h2>
          {availableFrom && currentStatus === "READY" && (
            <span className="text-[11px] font-bold text-[#00e676] bg-[#00e676]/10 px-2 py-0.5 rounded-full border border-[#00e676]/20">
              с {availableFrom}
            </span>
          )}
        </div>

        <StatusSelector value={currentStatus} onChange={handleStatusChange} />

        {/* Time chips */}
        {showTimePicker && (
          <div className="p-3 rounded-2xl bg-black/40 border border-[#00e676]/30 space-y-2 animate-in fade-in duration-200">
            <div className="text-[11px] font-bold text-[#00e676]">Во сколько готов играть?</div>
            <div className="grid grid-cols-4 gap-1.5">
              {TIME_OPTIONS.map((time) => (
                <button
                  key={time}
                  onClick={() => handleSelectTime(time)}
                  className={`py-1.5 text-xs rounded-xl font-bold transition-all ${
                    availableFrom === time
                      ? "bg-[#00e676] text-black shadow-[0_0_12px_rgba(0,230,118,0.4)]"
                      : "bg-white/5 hover:bg-white/10 text-white/80"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Floating Squad Status / Action Banner */}
      {selectedGroup && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#151922] to-emerald-500/15 border border-amber-500/30 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🔥</span>
            <div>
              <div className="text-xs font-bold text-white">
                {targetSize - readyCount > 0
                  ? `Ещё ${targetSize - readyCount} чел. до фулл-стака!`
                  : "Фулл-стак в сборе!"}
              </div>
              <div className="text-[10px] text-white/50">
                {selectedGroup.group.name} ({readyCount}/{totalCount} готовы)
              </div>
            </div>
          </div>
          <button
            onClick={handleShareInvite}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 transition-all flex items-center gap-1 shadow-md cursor-pointer"
          >
            <span>↗️</span>
            <span>Инвайт</span>
          </button>
        </div>
      )}

      {/* Group Selector (if multiple) */}
      {groups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => fetchGroupStatus(g.id).then(setSelectedGroup)}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                selectedGroup?.group.id === g.id
                  ? "bg-[#00e676] text-black shadow-[0_0_12px_rgba(0,230,118,0.3)]"
                  : "glass-panel text-white/60 hover:text-white"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Squad Roster */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-white/50">
            {selectedGroup ? `👥 Состав ${selectedGroup.group.name}` : "👥 Состав сквада"}
          </h2>
          <span className="text-[11px] text-white/40 font-medium">
            {totalCount} чел.
          </span>
        </div>

        {loading ? (
          <div className="glass-panel rounded-2xl p-6 text-center text-xs text-white/40 animate-pulse">
            Синхронизация статусов с сервером...
          </div>
        ) : selectedGroup && selectedGroup.members.length > 0 ? (
          <div className="space-y-2">
            {selectedGroup.members.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelf={String(member.id) === "1" || member.displayName.includes("Никита")}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-6 text-center text-white/50 space-y-2">
            <p className="text-3xl">👥</p>
            <p className="font-bold text-sm text-white">У тебя пока нет групп</p>
            <p className="text-xs text-white/60">
              Создай группу командой в боте:
              <br />
              <code className="inline-block mt-2 px-2 py-1 rounded bg-black/50 text-[#00e676] font-mono text-xs border border-white/10">
                /group create CS Пацаны
              </code>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
