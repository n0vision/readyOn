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

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">readyOn 🎮</h1>
          <p className="text-xs text-[var(--tg-theme-hint-color)]">
            {new Date().toLocaleDateString("ru", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading || updating}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--tg-theme-secondary-bg-color)] border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
        >
          <span className={loading || updating ? "animate-spin" : ""}>🔄</span>
          <span>Обновить</span>
        </button>
      </div>

      {/* Status selector */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--tg-theme-hint-color)]">
            Твой статус сегодня
          </h2>
          {availableFrom && currentStatus === "READY" && (
            <span className="text-xs text-green-400 font-medium">Готов с {availableFrom}</span>
          )}
        </div>

        <StatusSelector value={currentStatus} onChange={handleStatusChange} />

        {/* Time picker modal / options */}
        {showTimePicker && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] border border-green-500/30 space-y-2 animate-in fade-in duration-200">
            <div className="text-xs text-green-400 font-medium">Во сколько сможешь играть?</div>
            <div className="grid grid-cols-4 gap-1.5">
              {TIME_OPTIONS.map((time) => (
                <button
                  key={time}
                  onClick={() => handleSelectTime(time)}
                  className={`py-1.5 text-xs rounded-lg transition-colors ${
                    availableFrom === time
                      ? "bg-green-600 text-white font-bold"
                      : "bg-white/5 hover:bg-white/10 text-[var(--tg-theme-text-color)]"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Group Selector (if multiple) */}
      {groups.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => fetchGroupStatus(g.id).then(setSelectedGroup)}
              className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                selectedGroup?.group.id === g.id
                  ? "bg-[var(--tg-theme-button-color)] text-white"
                  : "bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-hint-color)]"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {/* Group members list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--tg-theme-hint-color)]">
            {selectedGroup ? `👥 ${selectedGroup.group.name}` : "👥 Группа"}
          </h2>
          {selectedGroup && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 font-medium border border-green-500/20">
              {readyCount} из {totalCount} готовы
            </span>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-6 text-center text-[var(--tg-theme-hint-color)] animate-pulse">
            Загрузка статусов...
          </div>
        ) : selectedGroup && selectedGroup.members.length > 0 ? (
          <div className="space-y-2">
            {selectedGroup.members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-5 text-center text-[var(--tg-theme-hint-color)] space-y-2">
            <p className="text-2xl">👥</p>
            <p className="font-medium text-sm text-[var(--tg-theme-text-color)]">
              У тебя пока нет групп
            </p>
            <p className="text-xs">
              Создай группу в боте командой:
              <br />
              <code className="inline-block mt-1.5 px-2 py-1 rounded bg-black/30 text-white font-mono">
                /group create CS Пацаны
              </code>
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
