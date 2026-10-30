import type { ReadyStatusType, GroupView, GroupMemberView } from "@readyon/shared";

// Base API URL: relative for both localhost and Cloudflare tunnel
const API_BASE = "";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        openTelegramLink?: (url: string) => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
        };
        themeParams?: Record<string, string>;
      };
    };
  }
}

/**
 * Get current user's Telegram ID.
 * Priority: Telegram WebApp context -> URL param '?userId=...' -> default fallback user.
 */
export function getCurrentTelegramId(): string {
  if (typeof window !== "undefined") {
    // 1. From Telegram WebApp
    const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (tgId) {
      return String(tgId);
    }

    // 2. From URL query ?userId=...
    const urlParams = new URLSearchParams(window.location.search);
    const paramId = urlParams.get("userId");
    if (paramId) {
      return paramId;
    }
  }

  // 3. Fallback to primary owner (Никита) for browser testing
  return "619219842";
}

export function getTelegramUser() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user;
}

export async function fetchUserStatus(telegramId: string) {
  const res = await fetch(`${API_BASE}/api/status/${telegramId}`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function updateUserStatus(
  telegramId: string,
  status: ReadyStatusType,
  availableFrom?: string | null,
  comment?: string | null
) {
  const res = await fetch(`${API_BASE}/api/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      telegramId,
      status,
      availableFrom: availableFrom || undefined,
      comment: comment || undefined,
    }),
  });
  if (!res.ok) throw new Error("Failed to update status");
  return res.json();
}

export async function fetchUserGroups(telegramId: string) {
  const res = await fetch(`${API_BASE}/api/groups/${telegramId}`);
  if (!res.ok) throw new Error("Failed to fetch groups");
  return res.json();
}

export async function fetchGroupStatus(groupId: number): Promise<GroupView> {
  const res = await fetch(`${API_BASE}/api/status/group/${groupId}`);
  if (!res.ok) throw new Error("Failed to fetch group status");
  return res.json();
}

export async function fetchFriends(telegramId: string) {
  const res = await fetch(`${API_BASE}/api/friends/${telegramId}`);
  if (!res.ok) throw new Error("Failed to fetch friends");
  return res.json();
}

export async function createGroup(telegramId: string, name: string) {
  const res = await fetch(`${API_BASE}/api/groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId, name }),
  });
  if (!res.ok) throw new Error("Failed to create group");
  return res.json();
}

export async function joinGroup(telegramId: string, inviteCode: string) {
  const res = await fetch(`${API_BASE}/api/groups/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegramId, inviteCode }),
  });
  if (!res.ok) throw new Error("Failed to join group");
  return res.json();
}

export async function fetchUserProfile(telegramId: string) {
  const res = await fetch(`${API_BASE}/api/users/${telegramId}`);
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateUserIntegrations(
  telegramId: string,
  data: { steamId?: string | null; faceitId?: string | null; tsIdentity?: string | null }
) {
  const res = await fetch(`${API_BASE}/api/users/${telegramId}/integrations`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update integrations");
  return res.json();
}

export async function updateGroupSettings(
  groupId: number,
  data: { targetSize?: number; reminderHour?: number }
) {
  const res = await fetch(`${API_BASE}/api/groups/${groupId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update group settings");
  return res.json();
}

export async function updateUserProfile(
  telegramId: string,
  data: { displayName?: string; avatarUrl?: string | null }
) {
  const res = await fetch(`${API_BASE}/api/users/${telegramId}/profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}
