import type { GroupMemberView, ReadyStatusType } from "@readyon/shared";
import { SteamIcon, FaceitIcon } from "./Icons.js";

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
          <span className="text-[#94a3b8]">
            {member.dailyStatus?.availableFrom
              ? `Готов с ${member.dailyStatus.availableFrom}`
              : "Готов прямо сейчас"}
          </span>
        );
      case "UNLIKELY":
        return (
          <span className="text-[#f59e0b]">
            {member.dailyStatus?.availableFrom
              ? `Будет позже (с ${member.dailyStatus.availableFrom})`
              : "Попозже"}
          </span>
        );
      case "UNAVAILABLE":
        return <span className="text-[#ef4444]">Не сегодня</span>;
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
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-white truncate">
            {member.displayName}
          </span>
          {isSelf && (
            <span className="text-xs font-semibold text-white/50">(Вы)</span>
          )}
        </div>

        <p className="text-xs font-medium mt-0.5">{renderSubtitle()}</p>

        {/* Gaming Chips */}
        {os && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Steam badge with monochrome Steam icon */}
            {os.steamStatus === "in_game" || os.steamGame ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0284c7]/20 border border-[#0284c7]/40 text-[#38bdf8] text-[11px] font-semibold">
                <SteamIcon className="w-3.5 h-3.5 fill-current" />
                <span>{os.steamGame || "В CS2"}</span>
              </span>
            ) : os.steamStatus === "online" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0284c7]/15 border border-[#0284c7]/30 text-[#38bdf8]/90 text-[11px] font-medium">
                <SteamIcon className="w-3.5 h-3.5 fill-current" />
                <span>Steam онлайн</span>
              </span>
            ) : null}

            {/* FACEIT badge with monochrome FACEIT icon */}
            {os.faceitStatus === "in_match" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ea580c]/25 border border-[#ea580c]/40 text-[#fb923c] text-[11px] font-bold">
                <FaceitIcon className="w-3.5 h-3.5 fill-current" />
                <span>В матче FACEIT</span>
              </span>
            ) : os.faceitElo ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#ea580c]/20 border border-[#ea580c]/40 text-[#fb923c] text-[11px] font-semibold">
                <FaceitIcon className="w-3.5 h-3.5 fill-current" />
                <span>
                  Lvl {os.faceitLevel || 3} · {os.faceitElo} ELO
                </span>
              </span>
            ) : null}

            {/* ETA chip */}
            {os.locationStatus === "transit" && os.etaMinutes && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-medium">
                <span>🚗</span>
                <span>~{os.etaMinutes} мин до дома</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
