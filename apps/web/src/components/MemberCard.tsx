import type { GroupMemberView, ReadyStatusType } from "@readyon/shared";
import { THEME } from "../styles/theme.js";

interface Props {
  member: GroupMemberView;
  isSelf?: boolean;
}

export function MemberCard({ member, isSelf }: Props) {
  const status = (member.dailyStatus?.status || "UNSET") as ReadyStatusType;
  const theme = THEME.status[status] || THEME.status.UNSET;
  const os = member.onlineStatus;

  return (
    <div className="glass-panel rounded-2xl p-3.5 flex items-start gap-3.5 transition-all duration-200 hover:border-white/15">
      {/* Avatar with radiant glowing status ring */}
      <div className="relative flex-shrink-0">
        <div
          className={`w-11 h-11 rounded-full bg-black/40 flex items-center justify-center text-sm font-bold text-white transition-all duration-300 ${theme.avatarRing}`}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-sm text-white truncate">
              {member.displayName}
            </span>
            {isSelf && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/10 text-white/60">
                Вы
              </span>
            )}
          </div>

          {/* Status text pill */}
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${theme.bgClass}/10 ${theme.textClass} border ${theme.borderClass}/30`}
          >
            {status === "READY" && member.dailyStatus?.availableFrom
              ? `с ${member.dailyStatus.availableFrom}`
              : theme.label}
          </span>
        </div>

        {/* Comment if any */}
        {member.dailyStatus?.comment && (
          <p className="text-xs text-white/50 italic mt-0.5 truncate">
            «{member.dailyStatus.comment}»
          </p>
        )}

        {/* Gaming & Live indicators */}
        {os && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {/* Steam status */}
            {os.steamStatus === "in_game" && os.steamGame && (
              <span className="bg-[#0284c7]/20 border border-[#0284c7]/30 text-[#38bdf8] text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38bdf8] animate-pulse"></span>
                <span>{os.steamGame}</span>
              </span>
            )}
            {os.steamStatus === "online" && !os.steamGame && (
              <span className="bg-[#0284c7]/15 border border-[#0284c7]/25 text-[#38bdf8]/90 text-[10px] font-medium px-2 py-0.5 rounded-full">
                Steam
              </span>
            )}

            {/* FACEIT status */}
            {os.faceitStatus === "in_match" && (
              <span className="bg-[#ea580c]/25 border border-[#ea580c]/40 text-[#fb923c] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-ping"></span>
                <span>В матче FACEIT</span>
              </span>
            )}
            {os.faceitElo && (
              <span className="bg-[#ea580c]/15 border border-[#ea580c]/30 text-[#fb923c] text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-[#f97316] text-black text-[9px] font-black flex items-center justify-center">
                  {os.faceitLevel || "?"}
                </span>
                <span>{os.faceitElo} ELO</span>
              </span>
            )}

            {/* TeamSpeak status */}
            {os.tsStatus === "connected" && (
              <span className="bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
                🎧 {os.tsChannel || "TS3"}
              </span>
            )}

            {/* ETA / Location status */}
            {os.locationStatus === "transit" && os.etaMinutes && (
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-medium px-2 py-0.5 rounded-full">
                🚗 ~{os.etaMinutes} мин
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
