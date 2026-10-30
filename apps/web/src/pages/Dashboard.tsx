import { useState, useEffect, useCallback } from "react";
import type { GroupView, GroupMemberView, ReadyStatusType } from "@readyon/shared";
import {
  getCurrentTelegramId,
  fetchUserGroups,
  fetchGroupStatus,
  updateUserStatus,
} from "../services/api.js";
import { StatusSelector } from "../components/StatusSelector.js";
import { MemberCard } from "../components/MemberCard.js";
import { Crosshair, Users, ChevronDown, RefreshCw, Flame, Share2, Check } from "lucide-react";
import { triggerHaptic } from "../utils/haptics.js";

export function Dashboard() {
  const telegramId = getCurrentTelegramId();
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ReadyStatusType>("UNSET");
  const [availableFrom, setAvailableFrom] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load user groups
      const userGroups = await fetchUserGroups(telegramId);
      setGroups(userGroups);

      if (userGroups && userGroups.length > 0) {
        const firstGroup = await fetchGroupStatus(userGroups[0].id);
        setSelectedGroup(firstGroup);

        // Find self status in the group
        const selfMember = firstGroup.members.find(
          (m: any) => String(m.id) === "1" || m.displayName.includes("Никита")
        );
        if (selfMember?.dailyStatus) {
          setCurrentStatus(selfMember.dailyStatus.status as ReadyStatusType);
          setAvailableFrom(selfMember.dailyStatus.availableFrom || null);
        }
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
      // Time can ONLY be set when status is READY. When UNLIKELY ("Возможно") or UNAVAILABLE, time is null.
      const timeToSet = status === "READY" ? availableFrom || "19:00" : null;
      if (status !== "READY") {
        setAvailableFrom(null);
      } else if (!availableFrom) {
        setAvailableFrom("19:00");
      }

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
    const text = `Го в CS2! Заходи в сквад в readyOn 🎯:`;
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
    selectedGroup?.members.filter((m: any) => m.dailyStatus?.status === "READY").length || 0;
  const targetSize = selectedGroup?.group.targetSize || 5;
  const neededCount = Math.max(0, targetSize - readyCount);
  const totalCount = selectedGroup?.members.length || 0;

  return (
    <div className="p-4 space-y-3.5 max-w-lg mx-auto pb-40">
      {/* Top Header: Logo + Refresh */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2B2D31] border border-white/10 flex items-center justify-center">
            <Crosshair className="w-5 h-5 text-[#8BA4CC]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white leading-none">
              <span>ready</span>
              <span className="text-[#8BA4CC]">On</span>
            </h1>
            <p className="text-[10px] text-[#949BA4] font-medium tracking-wider uppercase mt-0.5">
              CS2 координатор
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => {
            triggerHaptic("selection");
            loadData();
          }}
          disabled={loading || updating}
          className="w-9 h-9 rounded-xl bg-[#2B2D31] border border-white/5 flex items-center justify-center text-[#949BA4] hover:text-white hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
          title="Обновить"
        >
          <RefreshCw
            className={`w-4 h-4 transition-all ${
              loading || updating ? "animate-spin text-[#8BA4CC]" : "text-[#949BA4]"
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
                className="appearance-none bg-[#2B2D31] border border-white/5 rounded-xl px-3 py-2 pr-8 text-xs font-semibold text-white cursor-pointer focus:outline-none focus:border-[#3F5F96] transition-all"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id} className="bg-[#2B2D31] text-white">
                    {g.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#949BA4] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : (
            <div className="bg-[#2B2D31] border border-white/5 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-semibold text-white">
              <Users className="w-3.5 h-3.5 text-[#8BA4CC]" />
              <span>{selectedGroup ? selectedGroup.group.name : "CS Пацаны"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#949BA4]" />
            </div>
          )}
        </div>

        {/* Ready Counter Pill */}
        <div className="bg-[#2B2D31] border border-white/5 px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#23A55A]"></span>
          <span>{readyCount}/{targetSize} готовы</span>
        </div>
      </div>

      {/* Hero Status Card */}
      <StatusSelector
        value={currentStatus}
        availableFrom={availableFrom}
        onChange={handleStatusChange}
        onSelectTime={handleSelectTime}
      />

      {/* Squad Roster */}
      <section className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-[#949BA4] uppercase tracking-wider">
            <span>Состав команды</span>
          </h2>
          <span className="text-[11px] text-[#DBDEE1]/50 font-semibold">
            {totalCount} игрока
          </span>
        </div>

        {loading ? (
          <div className="bg-[#2B2D31] border border-white/5 rounded-2xl p-6 text-center text-xs text-[#949BA4] animate-pulse">
            Синхронизация статусов с сервером...
          </div>
        ) : selectedGroup && selectedGroup.members.length > 0 ? (
          <div className="space-y-2">
            {selectedGroup.members.map((member: any) => (
              <MemberCard
                key={member.id}
                member={member}
                isSelf={String(member.id) === "1" || member.displayName.includes("Никита")}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#2B2D31] border border-white/5 rounded-2xl p-6 text-center text-[#949BA4] space-y-2">
            <Users className="w-8 h-8 text-white/40 mx-auto" />
            <p className="font-bold text-sm text-white">У тебя пока нет групп</p>
            <p className="text-xs text-[#949BA4]">
              Создай группу на вкладке «Группа» или в боте!
            </p>
          </div>
        )}
      </section>

      {/* Floating Bottom Banner: "Нужно ещё N игрока" + [ Пригласить ] */}
      {selectedGroup && (
        <div className="fixed bottom-20 left-0 right-0 px-3 max-w-lg mx-auto z-40 pointer-events-none">
          <div className="bg-[#2B2D31]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 px-3.5 shadow-xl flex items-center justify-between gap-2.5 pointer-events-auto">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  {neededCount > 0 ? `Нужно ещё ${neededCount} игрока` : "Сквад в сборе!"}
                </span>
              </div>
              <div className="text-[11px] text-[#949BA4] mt-0.5 whitespace-nowrap">
                {neededCount > 0 ? "Для полного сбора команды" : "Можно запускать CS2"}
              </div>
            </div>

            <button
              onClick={handleShareInvite}
              className="h-9 px-4 rounded-xl bg-[#3F5F96] hover:bg-[#4D72B0] text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                  <span>Скопировано</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Пригласить</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
