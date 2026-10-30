import { useState, useEffect, useCallback } from "react";
import { StatusSelector } from "../components/StatusSelector.js";
import { MemberCard } from "../components/MemberCard.js";
import type { ReadyStatusType, GroupView } from "@readyon/shared";
import {
  getCurrentTelegramId,
  fetchUserStatus,
  updateUserStatus,
  fetchUserGroups,
  fetchGroupStatus,
} from "../services/api.js";

const TIME_OPTIONS = ["Now", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"];

export function Dashboard() {
  const telegramId = getCurrentTelegramId();

  const [currentStatus, setCurrentStatus] = useState<ReadyStatusType>("UNSET");
  const [availableFrom, setAvailableFrom] = useState<string | null>("20:00");
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
      time === "Now"
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
    const inviteUrl = `https://t.me/readyOnCS_bot?start=group_${selectedGroup.group.inviteCode}`;
    const text = `Го в CS2! Заходи в пати в readyOn:`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}&text=${encodeURIComponent(text)}`;
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
    <div className="p-4 space-y-4 max-w-lg mx-auto pb-36">
      {/* Top Header: Logo + Bell */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Tactical Crosshair Icon */}
          <div className="text-[#00f076] text-2xl font-bold leading-none drop-shadow-[0_0_10px_rgba(0,240,118,0.7)]">
            ⌖
          </div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center">
            <span>ready</span>
            <span className="text-[#00f076]">On</span>
          </h1>
        </div>

        {/* Bell / Refresh icon */}
        <button
          onClick={loadData}
          disabled={loading || updating}
          className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          title="Refresh"
        >
          <span className={loading || updating ? "animate-spin text-sm" : "text-sm"}>
            {loading || updating ? "🔄" : "🔔"}
          </span>
        </button>
      </div>

      {/* Group Selector Pill & Ready Counter */}
      <div className="flex items-center justify-between">
        <div className="relative">
          {groups.length > 1 ? (
            <select
              value={selectedGroup?.group.id || ""}
              onChange={(e) => {
                const gId = Number(e.target.value);
                fetchGroupStatus(gId).then(setSelectedGroup);
              }}
              className="appearance-none bg-[#161c28] border border-white/10 rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-white cursor-pointer focus:outline-none"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  👥 {g.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="bg-[#161c28] border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-white">
              <span>👥</span>
              <span>{selectedGroup ? selectedGroup.group.name : "CS Пацаны"}</span>
              <span className="text-[10px] text-white/50">⌵</span>
            </div>
          )}
        </div>

        {/* Ready Counter Pill */}
        <div className="bg-[#00f076]/20 border border-[#00f076]/35 text-[#00f076] font-bold text-xs px-3 py-1.5 rounded-xl shadow-[0_0_14px_rgba(0,240,118,0.25)] flex items-center gap-1.5">
          <span>{readyCount}/{targetSize} Ready</span>
        </div>
      </div>

      {/* Hero Status Card (READY / MAYBE / BUSY) */}
      <StatusSelector
        value={currentStatus}
        availableFrom={availableFrom}
        onChange={handleStatusChange}
        onOpenTimePicker={() => setShowTimePicker(!showTimePicker)}
      />

      {/* Time Picker Dropdown */}
      {showTimePicker && (
        <div className="hud-card p-3 rounded-2xl border border-[#00f076]/40 space-y-2 animate-in fade-in duration-200">
          <div className="text-xs font-bold text-[#00f076]">Select ready time:</div>
          <div className="grid grid-cols-4 gap-1.5">
            {TIME_OPTIONS.map((time) => (
              <button
                key={time}
                onClick={() => handleSelectTime(time)}
                className={`py-1.5 text-xs rounded-xl font-bold transition-all ${
                  availableFrom === time
                    ? "bg-[#00f076] text-black shadow-[0_0_12px_rgba(0,240,118,0.5)]"
                    : "bg-white/5 hover:bg-white/10 text-white/80"
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
        {loading ? (
          <div className="hud-card rounded-2xl p-6 text-center text-xs text-white/40 animate-pulse">
            Loading squad roster...
          </div>
        ) : selectedGroup && selectedGroup.members.length > 0 ? (
          <div className="space-y-3.5">
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
            <p className="text-3xl">👥</p>
            <p className="font-bold text-sm text-white">No squad groups yet</p>
            <p className="text-xs text-white/60">
              Create a group in bot:
              <br />
              <code className="inline-block mt-2 px-2 py-1 rounded bg-black/50 text-[#00f076] font-mono text-xs border border-white/10">
                /group create CS Пацаны
              </code>
            </p>
          </div>
        )}
      </section>

      {/* Floating Bottom Banner: "2 MORE NEEDED FOR FULL STACK" */}
      {selectedGroup && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40">
          <div className="hud-card rounded-2xl p-2.5 px-3.5 flex items-center justify-between border border-white/15 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span className="text-xs font-extrabold uppercase tracking-wide text-white">
                {neededCount > 0
                  ? `${neededCount} MORE NEEDED FOR FULL STACK`
                  : "FULL STACK READY TO PLAY!"}
              </span>
            </div>
            <button
              onClick={handleShareInvite}
              className="text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 transition-all cursor-pointer shadow-md"
            >
              INVITE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
