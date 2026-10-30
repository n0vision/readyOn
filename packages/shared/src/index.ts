// Status types shared between server and web
export type ReadyStatusType = "READY" | "UNAVAILABLE" | "UNLIKELY" | "UNSET";

export interface UserProfile {
  id: number;
  telegramId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  steamId: string | null;
  faceitId: string | null;
  tsIdentity: string | null;
  hasHomeLocation: boolean;
}

export interface DailyStatusData {
  status: ReadyStatusType;
  availableFrom: string | null;
  availableUntil: string | null;
  comment: string | null;
}

export interface OnlineStatusData {
  steamStatus: string | null;
  steamGame: string | null;
  faceitStatus: string | null;
  faceitElo: number | null;
  faceitLevel: number | null;
  tsStatus: string | null;
  tsChannel: string | null;
  locationStatus: string | null;
  etaMinutes: number | null;
}

export interface GroupMemberView {
  id: number;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  role: string;
  dailyStatus: DailyStatusData;
  onlineStatus: OnlineStatusData | null;
}

export interface GroupView {
  group: {
    id: number;
    name: string;
    inviteCode: string;
  };
  members: GroupMemberView[];
}

export const STATUS_EMOJI: Record<ReadyStatusType, string> = {
  READY: "🟢",
  UNAVAILABLE: "🔴",
  UNLIKELY: "🟡",
  UNSET: "⚪",
};

export const STATUS_LABEL: Record<ReadyStatusType, string> = {
  READY: "Готов",
  UNAVAILABLE: "Не сегодня",
  UNLIKELY: "Маловероятно",
  UNSET: "Не выставлен",
};

export const STATUS_LABEL_EN: Record<ReadyStatusType, string> = {
  READY: "Ready",
  UNAVAILABLE: "Unavailable",
  UNLIKELY: "Unlikely",
  UNSET: "Not set",
};
