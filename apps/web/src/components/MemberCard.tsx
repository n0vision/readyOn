import { useState } from "react";
import type { GroupMemberView, ReadyStatusType } from "@readyon/shared";
import { SteamIcon, FaceitIcon } from "./Icons.js";
import {
  Car,
  MapPin,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { fetchMemberGamingStats } from "../services/api.js";
import { triggerHaptic } from "../utils/haptics.js";

interface Props {
  member: GroupMemberView;
  isSelf?: boolean;
}

export function MemberCard({ member, isSelf }: Props) {
  const status = (member.dailyStatus?.status || "UNSET") as ReadyStatusType;
  const os = member.onlineStatus;

  const [expanded, setExpanded] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Status dot color for the Discord-style avatar badge
  const getStatusDotColor = () => {
    switch (status) {
      case "READY":
        return "bg-[#23A55A]";
      case "UNLIKELY":
        return "bg-[#F0B232]";
      case "UNAVAILABLE":
        return "bg-[#F23F43]";
      default:
        return "bg-[#80848E]";
    }
  };

  // Subtitle text: all statuses are cleanly color-coded to match their status dots
  const renderSubtitle = () => {
    switch (status) {
      case "READY":
        return (
          <span className="text-[#23A55A] font-semibold">
            {member.dailyStatus?.availableFrom
              ? `Готов с ${member.dailyStatus.availableFrom}`
              : "Готов прямо сейчас"}
          </span>
        );
      case "UNLIKELY":
        return <span className="text-[#F0B232] font-semibold">Возможно</span>;
      case "UNAVAILABLE":
        return <span className="text-[#F23F43] font-semibold">Не смогу</span>;
      default:
        return <span className="text-[#80848E] font-medium">Не в сети</span>;
    }
  };

  const handleToggleExpand = async () => {
    triggerHaptic("selection");
    const nextState = !expanded;
    setExpanded(nextState);

    if (nextState && !stats && !loadingStats) {
      try {
        setLoadingStats(true);
        // Request stats using telegramId or userId
        const identifier = member.telegramId || member.id;
        const data = await fetchMemberGamingStats(identifier);
        setStats(data);
      } catch (err) {
        console.error("Failed to load member stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
  };

  return (
    <div
      onClick={handleToggleExpand}
      className={`bg-[#2B2D31] rounded-2xl p-3 cursor-pointer transition-all duration-200 select-none ${
        isSelf ? "border border-[#3F5F96]/40" : "border border-white/5"
      } ${status === "UNSET" || status === "UNAVAILABLE" ? "opacity-85" : ""} hover:border-[#8BA4CC]/20 active:scale-[0.99]`}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3.5">
        {/* Discord-style Avatar with corner status indicator dot */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full bg-[#323336] flex items-center justify-center font-bold text-sm text-white border border-white/10 overflow-hidden">
            {member.avatarUrl ? (
              <img
                src={member.avatarUrl}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              member.displayName[0]
            )}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full ${getStatusDotColor()} border-2 border-[#2B2D31]`}
          ></span>
        </div>

        {/* Info & Badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-sm text-white truncate">
                {member.displayName}
              </span>
              {isSelf && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-semibold tracking-wider shrink-0">
                  Вы
                </span>
              )}
            </div>

            {/* Expand / Collapse Chevron */}
            <div className="text-[#949BA4] hover:text-white transition-colors p-1 shrink-0">
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </div>

          <div className="text-xs mt-0.5">{renderSubtitle()}</div>

          {/* Gaming Chips */}
          {os && (
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {/* Steam badge with brand icon and crisp white text */}
              {os.steamStatus === "in_game" || os.steamGame ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1E1F22] border border-white/5 text-[11px] font-semibold text-white/90">
                  <SteamIcon className="w-3 h-3" />
                  <span>{os.steamGame || "В CS2"}</span>
                </span>
              ) : os.steamStatus === "online" ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1E1F22] border border-white/5 text-[11px] font-medium text-white/90">
                  <SteamIcon className="w-3 h-3" />
                  <span>В сети</span>
                </span>
              ) : null}

              {/* FACEIT badge with brand orange chevron and white text */}
              {os.faceitStatus === "in_match" ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1E1F22] border border-white/5 text-[11px] font-bold text-[#FF5500]">
                  <FaceitIcon className="w-2.5 h-2.5" />
                  <span>В матче FACEIT</span>
                </span>
              ) : os.faceitElo ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#1E1F22] border border-white/5 text-[11px] font-bold text-[#FF5500]">
                  <FaceitIcon className="w-2.5 h-2.5" />
                  <span className="text-white/90 font-medium">
                    Lvl {os.faceitLevel || 3} · {os.faceitElo} ELO
                  </span>
                </span>
              ) : null}

              {/* Location status chips */}
              {os.locationStatus === "home" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                  <span>🏠 Дома</span>
                </span>
              )}
              {os.locationStatus === "transit" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium">
                  <Car className="w-3 h-3" />
                  <span>{os.etaMinutes ? `~${os.etaMinutes} мин` : "В пути"}</span>
                </span>
              )}
              {os.locationStatus === "away" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#949BA4] text-[11px] font-medium">
                  <MapPin className="w-3 h-3" />
                  <span>Не дома</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Expanded Detailed Stats Section */}
      {expanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 pt-3 border-t border-white/5 space-y-3 cursor-default animate-fadeIn"
        >
          {loadingStats ? (
            <div className="flex items-center justify-center py-4 text-xs text-[#8BA4CC] gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Загрузка FACEIT статистики...</span>
            </div>
          ) : stats?.faceit ? (
            <>
              {/* 30 Games Stats Banner */}
              <div>
                <div className="flex items-center justify-between text-[10px] font-bold text-[#949BA4] uppercase tracking-wider mb-1.5">
                  <span>За последние {stats.faceit.matchesCount} игр</span>
                  <span className="text-[#FF5500] font-bold tracking-wider flex items-center gap-1">
                    <FaceitIcon className="w-2.5 h-2.5" />
                    <span>FACEIT RATING</span>
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {/* Winrate */}
                  <div className="p-2 rounded-xl bg-[#1E1F22] border border-white/5 text-center">
                    <span className="text-[10px] text-[#949BA4] block font-medium">Винрейт</span>
                    <span
                      className={`text-sm font-extrabold ${
                        stats.faceit.stats30.winrate >= 50 ? "text-[#23A55A]" : "text-white"
                      }`}
                    >
                      {stats.faceit.stats30.winrate}%
                    </span>
                    <span className="text-[9px] text-[#949BA4] block mt-0.5 font-mono">
                      {stats.faceit.stats30.wins}В / {stats.faceit.stats30.losses}П
                    </span>
                  </div>

                  {/* K/D */}
                  <div className="p-2 rounded-xl bg-[#1E1F22] border border-white/5 text-center">
                    <span className="text-[10px] text-[#949BA4] block font-medium">K/D</span>
                    <span
                      className={`text-sm font-extrabold ${
                        stats.faceit.stats30.kd >= 1.0 ? "text-[#23A55A]" : "text-[#F23F43]"
                      }`}
                    >
                      {stats.faceit.stats30.kd}
                    </span>
                    <span className="text-[9px] text-[#949BA4] block mt-0.5 font-mono">
                      {stats.faceit.stats30.totalKills}K / {stats.faceit.stats30.totalDeaths}D
                    </span>
                  </div>

                  {/* % HS */}
                  <div className="p-2 rounded-xl bg-[#1E1F22] border border-white/5 text-center">
                    <span className="text-[10px] text-[#949BA4] block font-medium">% HS</span>
                    <span className="text-sm font-extrabold text-[#8BA4CC]">
                      {stats.faceit.stats30.hsPercent}%
                    </span>
                    <span className="text-[9px] text-[#949BA4] block mt-0.5 font-mono">
                      Хедшоты
                    </span>
                  </div>
                </div>
              </div>

              {/* Last 5 Matches (W/L) */}
              <div>
                <div className="text-[10px] font-bold text-[#949BA4] uppercase tracking-wider mb-1.5">
                  Последние 5 игр (W/L)
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {stats.faceit.last5.map((m: any, idx: number) => (
                    <div
                      key={m.matchId || idx}
                      className={`p-1.5 rounded-xl border flex flex-col items-center justify-between text-center ${
                        m.result === "W"
                          ? "bg-[#23A55A]/10 border-[#23A55A]/30 text-[#23A55A]"
                          : "bg-[#F23F43]/10 border-[#F23F43]/30 text-[#F23F43]"
                      }`}
                    >
                      <span className="font-extrabold text-xs leading-none">
                        {m.result}
                      </span>
                      <span className="text-[9px] font-bold text-white/90 truncate max-w-[50px] mt-1 uppercase">
                        {m.map}
                      </span>
                      <span className="text-[8px] text-[#949BA4] font-mono mt-0.5">
                        {m.score}
                      </span>
                      <span className="text-[8px] text-white/70 font-mono mt-0.5">
                        {m.kd} KD
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Profile Links */}
              <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                {stats.faceit.nickname && (
                  <a
                    href={`https://www.faceit.com/ru/players/${encodeURIComponent(stats.faceit.nickname)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[11px] font-semibold text-[#FF5500] border border-white/5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FaceitIcon className="w-2.5 h-2.5" />
                    <span>Профиль FACEIT</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                )}
                {stats.steam?.profileUrl && (
                  <a
                    href={stats.steam.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 rounded-lg bg-[#1E1F22] hover:bg-[#323336] text-[11px] font-semibold text-white/90 border border-white/5 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <SteamIcon className="w-2.5 h-2.5" />
                    <span>Профиль Steam</span>
                    <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-2.5 text-xs text-[#949BA4] space-y-1">
              <p>FACEIT статистика не найдена</p>
              {isSelf && (
                <p className="text-[11px] text-[#8BA4CC]">
                  Привяжи свой FACEIT никнейм во вкладке «Профиль»
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
