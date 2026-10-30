/**
 * FACEIT Open Data API v4 Client
 * Docs: https://developers.faceit.com/docs/tools/data-api
 */

export interface FaceitPlayerSummary {
  playerId: string;
  nickname: string;
  elo: number | null;
  level: number | null;
  status: "available" | "in_match" | "offline";
}

export class FaceitService {
  private apiKey: string | null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FACEIT_API_KEY || null;
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  /**
   * Get player stats by nickname
   */
  async getPlayerByNickname(nickname: string): Promise<FaceitPlayerSummary | null> {
    if (!this.apiKey) return null;

    try {
      const url = `https://open.faceit.com/data/v4/players?nickname=${encodeURIComponent(nickname.trim())}`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return null;

      const data: any = await res.json();
      const cs2 = data.games?.cs2 || data.games?.csgo;

      return {
        playerId: data.player_id,
        nickname: data.nickname,
        elo: cs2?.faceit_elo || null,
        level: cs2?.skill_level || null,
        status: data.status === "ONLINE" ? "available" : "offline",
      };
    } catch (err) {
      console.error("FACEIT getPlayerByNickname error:", err);
      return null;
    }
  }

  /**
   * Check if player is currently in an ongoing match
   */
  async getActiveMatch(playerId: string): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const url = `https://open.faceit.com/data/v4/players/${playerId}/history?game=cs2&limit=1`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return false;
      const data: any = await res.json();
      const lastMatch = data.items?.[0];

      if (lastMatch && (lastMatch.status === "ONGOING" || lastMatch.status === "VOTING")) {
        return true;
      }
    } catch {
      // Ignore
    }

    return false;
  }
}

export const faceitService = new FaceitService();
