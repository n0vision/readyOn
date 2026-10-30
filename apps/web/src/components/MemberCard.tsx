import type { GroupMemberView, ReadyStatusType } from "@readyon/shared";
import { STATUS_EMOJI } from "@readyon/shared";

interface Props {
  member: GroupMemberView;
}

export function MemberCard({ member }: Props) {
  const status = (member.dailyStatus?.status || "UNSET") as ReadyStatusType;
  const emoji = STATUS_EMOJI[status];
  const os = member.onlineStatus;

  return (
    <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-3 flex items-start gap-3">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-[var(--tg-theme-button-color)]/20 flex items-center justify-center text-lg flex-shrink-0">
        {member.avatarUrl ? (
          <img src={member.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
        ) : (
          member.displayName[0]
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{member.displayName}</span>
          <span className="text-sm">{emoji}</span>
        </div>

        {/* Status details */}
        <div className="text-xs text-[var(--tg-theme-hint-color)] mt-0.5">
          {status === "READY" && member.dailyStatus?.availableFrom && (
            <span>Готов с {member.dailyStatus.availableFrom}</span>
          )}
          {status === "UNAVAILABLE" && <span>Не сегодня</span>}
          {status === "UNLIKELY" && <span>Маловероятно</span>}
          {status === "UNSET" && <span>Не выставил статус</span>}
          {member.dailyStatus?.comment && (
            <span className="ml-1 italic">— {member.dailyStatus.comment}</span>
          )}
        </div>

        {/* Online indicators */}
        {os && (
          <div className="flex flex-wrap gap-2 mt-1.5 text-xs">
            {os.steamStatus === "in_game" && os.steamGame && (
              <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                🎮 {os.steamGame}
              </span>
            )}
            {os.steamStatus === "online" && !os.steamGame && (
              <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                🎮 Steam
              </span>
            )}
            {os.tsStatus === "connected" && (
              <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
                🎧 {os.tsChannel || "TS"}
              </span>
            )}
            {os.locationStatus === "transit" && os.etaMinutes && (
              <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                📍 ~{os.etaMinutes} мин
              </span>
            )}
            {os.locationStatus === "away" && (
              <span className="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">
                📍 не дома
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
