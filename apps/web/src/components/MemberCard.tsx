import type { GroupMemberView, ReadyStatusType } from "@readyon/shared";
import { SteamIcon, FaceitIcon } from "./Icons.js";
import { Car } from "lucide-react";

interface Props {
  member: GroupMemberView;
  isSelf?: boolean;
}

export function MemberCard({ member, isSelf }: Props) {
  const status = (member.dailyStatus?.status || "UNSET") as ReadyStatusType;
  const os = member.onlineStatus;

  // Avatar glow border
  const getAvatarGlow = () => {
    switch (status) {
      case "READY":
        return "border-2 border-[#00f076] glow-ready";
      case "UNLIKELY":
        return "border-2 border-[#f59e0b] glow-maybe";
      default:
        return "border border-white/15 glow-offline opacity-70";
    }
  };

  // Subtitle text styling in Russian
  const renderSubtitle = () => {
    switch (status) {
      case "READY":
        return (
          <span className="text-white/80 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f076] shadow-[0_0_6px_#00f076]"></span>
            <span>
              {member.dailyStatus?.availableFrom
                ? `Готов с ${member.dailyStatus.availableFrom}`
                : "Готов прямо сейчас"}
            </span>
          </span>
        );
      case "UNLIKELY":
        return (
          <span className="text-[#f59e0b] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
            <span>
              {member.dailyStatus?.availableFrom
                ? `Будет позже (с ${member.dailyStatus.availableFrom})`
                : "Попозже"}
            </span>
          </span>
        );
      case "UNAVAILABLE":
        return (
          <span className="text-[#ef4444] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></span>
            <span>Не сегодня</span>
          </span>
        );
      default:
        return <span className="text-[#64748b]">Не в сети</span>;
    }
  };

  return (
    <div className="hud-card rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-200 hover:border-white/20">
      {/* Avatar with radiant glowing ring */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-12 h-12 rounded-full bg-[#1e2535] flex items-center justify-center text-base font-bold text-white transition-all duration-300 ${getAvatarGlow()}`}
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              className="w-full h-full rounded-full object-cover"
              alt=""
            />
          ) : (
            member.displayName[0]
          )}
        </div>
      </div>

      {/* Info & Badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-white truncate">
            {member.displayName}
          </span>
          {isSelf && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/70 border border-white/10 tracking-wider">
              ВЫ
            </span>
          )}
        </div>

        <div className="text-xs font-medium mt-0.5">{renderSubtitle()}</div>

        {/* Gaming Chips */}
        {os && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Steam badge with monochrome Steam icon */}
            {os.steamStatus === "in_game" || os.steamGame ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#38bdf8] text-[11px] font-semibold">
                <SteamIcon className="w-3.5 h-3.5" />
                <span>{os.steamGame || "В CS2"}</span>
              </span>
            ) : os.steamStatus === "online" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0284c7]/15 border border-[#0284c7]/30 text-[#38bdf8]/90 text-[11px] font-medium">
                <SteamIcon className="w-3.5 h-3.5" />
                <span>Steam онлайн</span>
              </span>
            ) : null}

            {/* FACEIT badge with official polygon vector */}
            {os.faceitStatus === "in_match" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ea580c]/25 border border-[#ea580c]/40 text-[#fb923c] text-[11px] font-bold">
                <FaceitIcon className="w-3.5 h-3.5 fill-current" />
                <span>В матче FACEIT</span>
              </span>
            ) : os.faceitElo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ea580c]/20 border border-[#ea580c]/40 text-[#fb923c] text-[11px] font-semibold">
                <FaceitIcon className="w-3.5 h-3.5 fill-current" />
                <span className="font-hud tracking-wide">
                  Lvl {os.faceitLevel || 3} · {os.faceitElo} ELO
                </span>
              </span>
            ) : null}

            {/* ETA chip */}
            {os.locationStatus === "transit" && os.etaMinutes && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                <Car className="w-3.5 h-3.5" />
                <span>~{os.etaMinutes} мин до дома</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
