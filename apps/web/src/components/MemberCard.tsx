import type { GroupMemberView, ReadyStatusType } from "@readyon/shared";
import { SteamIcon, FaceitIcon } from "./Icons.js";
import { Car, MapPin } from "lucide-react";

interface Props {
  member: GroupMemberView;
  isSelf?: boolean;
}

export function MemberCard({ member, isSelf }: Props) {
  const status = (member.dailyStatus?.status || "UNSET") as ReadyStatusType;
  const os = member.onlineStatus;

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

  return (
    <div
      className={`bg-[#2B2D31] rounded-2xl p-3 flex items-center gap-3.5 transition-all duration-200 ${
        isSelf ? "border border-[#3F5F96]/40" : "border border-white/5"
      } ${status === "UNSET" || status === "UNAVAILABLE" ? "opacity-75" : ""}`}
    >
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
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-sm text-white truncate">
            {member.displayName}
          </span>
          {isSelf && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-semibold tracking-wider">
              Вы
            </span>
          )}
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
  );
}
