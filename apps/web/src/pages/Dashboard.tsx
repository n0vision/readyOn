import { useState } from "react";
import { StatusSelector } from "../components/StatusSelector.js";
import { MemberCard } from "../components/MemberCard.js";
import type { ReadyStatusType } from "@readyon/shared";

// Mock data for initial UI
const mockMembers = [
  {
    id: 1,
    displayName: "Ты",
    username: null,
    avatarUrl: null,
    role: "OWNER",
    dailyStatus: { status: "UNSET" as ReadyStatusType, availableFrom: null, availableUntil: null, comment: null },
    onlineStatus: null,
  },
];

export function Dashboard() {
  const [currentStatus, setCurrentStatus] = useState<ReadyStatusType>("UNSET");

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">readyOn</h1>
        <span className="text-sm text-[var(--tg-theme-hint-color)]">
          {new Date().toLocaleDateString("ru", { weekday: "long", day: "numeric", month: "long" })}
        </span>
      </div>

      {/* Status selector */}
      <section>
        <h2 className="text-sm text-[var(--tg-theme-hint-color)] mb-2">Твой статус сегодня</h2>
        <StatusSelector value={currentStatus} onChange={setCurrentStatus} />
      </section>

      {/* Group members */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-[var(--tg-theme-hint-color)]">
            👥 Группа (0 готовы)
          </h2>
          <button className="text-xs text-[var(--tg-theme-link-color)]">+ Создать</button>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 text-center text-[var(--tg-theme-hint-color)]">
            <p>Создай группу и пригласи друзей</p>
            <p className="text-xs mt-1">Используй /group create в боте</p>
          </div>
        </div>
      </section>
    </div>
  );
}
