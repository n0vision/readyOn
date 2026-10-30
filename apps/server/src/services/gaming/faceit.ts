import { redis } from "../../db/redis.js";

/**
 * FACEIT Open Data API v4 Client
 * Docs: https://developers.faceit.com/docs/tools/data-api
 */

export interface FaceitPlayerSummary {
  playerId: string;
  nickname: string;
  avatarUrl: string | null;
  elo: number | null;
  level: number | null;
  status: "available" | "in_match" | "offline";
}

export interface FaceitRecentMatch {
  matchId: string;
  result: "W" | "L";
  map: string;
  score: string;
  kd: number;
  kills: number;
  deaths: number;
  headshotsPercent: number;
  finishedAt: number;
}

export interface FaceitDetailedStats {
  playerId: string;
  nickname: string;
  avatarUrl: string | null;
  elo: number | null;
  level: number | null;
  faceitRating: number;
  matchesCount: number;
  last5: FaceitRecentMatch[];
  stats30: {
    winrate: number;
    kd: number;
    hsPercent: number;
    wins: number;
    losses: number;
    totalKills: number;
    totalDeaths: number;
  };
}

export class FaceitService {
  private explicitApiKey: string | null = null;

  constructor(apiKey?: string) {
    if (apiKey) this.explicitApiKey = apiKey;
  }

  private get apiKey(): string | null {
    return this.explicitApiKey || process.env.FACEIT_API_KEY || null;
  }

  public isConfigured(): boolean {
    const key = this.apiKey;
    return Boolean(key && key.trim().length > 0);
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
        avatarUrl: data.avatar || null,
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
   * Get player stats by SteamID64 (CS2 or CS:GO)
   */
  async getPlayerBySteamId(steamId: string): Promise<FaceitPlayerSummary | null> {
    if (!this.apiKey) return null;

    try {
      // Try CS2 first, then fallback to CS:GO
      let url = `https://open.faceit.com/data/v4/players?game=cs2&game_player_id=${encodeURIComponent(steamId.trim())}`;
      let res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        url = `https://open.faceit.com/data/v4/players?game=csgo&game_player_id=${encodeURIComponent(steamId.trim())}`;
        res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
        });
      }

      if (!res.ok) return null;

      const data: any = await res.json();
      const cs2 = data.games?.cs2 || data.games?.csgo;

      return {
        playerId: data.player_id,
        nickname: data.nickname,
        avatarUrl: data.avatar || null,
        elo: cs2?.faceit_elo || null,
        level: cs2?.skill_level || null,
        status: data.status === "ONLINE" ? "available" : "offline",
      };
    } catch (err) {
      console.error("FACEIT getPlayerBySteamId error:", err);
      return null;
    }
  }

  /**
   * Check if player is currently in an ongoing match
   */
  async getActiveMatch(playerId: string): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const url = `https://open.faceit.com/data/v4/players/${playerId}/history?limit=1`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) return false;
      const data: any = await res.json();
      const lastMatch = data.items?.[0];

      if (
        lastMatch &&
        (lastMatch.status === "ONGOING" ||
          lastMatch.status === "VOTING" ||
          lastMatch.status === "CHECK_IN")
      ) {
        return true;
      }
    } catch {
      // Ignore
    }

    return false;
  }

  /**
   * Получить детальную статистику за последние 30 игр (Winrate, K/D, %HS) и последние 5 матчей
   */
  async getDetailedStats(playerIdOrNickname: string): Promise<FaceitDetailedStats | null> {
    if (!this.apiKey) return null;

    let playerId = playerIdOrNickname;
    let baseSummary: FaceitPlayerSummary | null = null;

    // Если передан никнейм (не UUID), находим playerId
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playerId)) {
      baseSummary = await this.getPlayerByNickname(playerIdOrNickname);
      if (!baseSummary?.playerId) return null;
      playerId = baseSummary.playerId;
    }

    const cacheKey = `faceit:detailed:${playerId}`;
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Redis fallback
    }

    try {
      if (!baseSummary) {
        // Загрузить базовую инфу об игроке
        const pUrl = `https://open.faceit.com/data/v4/players/${playerId}`;
        const pRes = await fetch(pUrl, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
        });
        if (pRes.ok) {
          const pData: any = await pRes.json();
          const cs2 = pData.games?.cs2 || pData.games?.csgo;
          baseSummary = {
            playerId: pData.player_id,
            nickname: pData.nickname,
            avatarUrl: pData.avatar || null,
            elo: cs2?.faceit_elo || null,
            level: cs2?.skill_level || null,
            status: "available",
          };
        }
      }

      // Загрузить последние 30 игр CS2
      let statsUrl = `https://open.faceit.com/data/v4/players/${playerId}/games/cs2/stats?limit=30`;
      let res = await fetch(statsUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        // Fallback на CS:GO если CS2 матчей нет
        statsUrl = `https://open.faceit.com/data/v4/players/${playerId}/games/csgo/stats?limit=30`;
        res = await fetch(statsUrl, {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
          },
        });
      }

      if (!res.ok) return null;

      const data: any = await res.json();
      const items: any[] = data.items || [];

      // Последние 5 игр (W / L)
      const last5: FaceitRecentMatch[] = items.slice(0, 5).map((m: any) => {
        const s = m.stats || {};
        return {
          matchId: s["Match Id"] || m.match_id || "",
          result: s.Result === "1" ? ("W" as const) : ("L" as const),
          map: (s.Map || "cs2").replace(/^de_/, "").toUpperCase(),
          score: s.Score || s["Final Score"] || "-",
          kd: parseFloat(s["K/D Ratio"] || "1"),
          kills: parseInt(s.Kills || "0", 10),
          deaths: parseInt(s.Deaths || "0", 10),
          headshotsPercent: parseInt(s["Headshots %"] || "0", 10),
          finishedAt: s["Match Finished At"] || Date.now(),
        };
      });

      // Расчет за последние 30 игр
      const totalMatches = items.length;
      const wins = items.filter((m: any) => m.stats?.Result === "1").length;
      const losses = totalMatches - wins;
      const winrate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

      const totalKills = items.reduce(
        (acc: number, m: any) => acc + parseInt(m.stats?.Kills || "0", 10),
        0
      );
      const totalDeaths = items.reduce(
        (acc: number, m: any) => acc + parseInt(m.stats?.Deaths || "0", 10),
        0
      );
      const totalHs = items.reduce(
        (acc: number, m: any) => acc + parseInt(m.stats?.Headshots || "0", 10),
        0
      );

      const kd = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : totalKills;
      const hsPercent = totalKills > 0 ? Math.round((totalHs / totalKills) * 100) : 0;

      // Расчет динамического FACEIT Rating строго за эти матчи (HLTV 2.0 / Performance)
      let totalRounds = 0;
      let totalDamage = 0;
      let totalAssists = 0;

      for (const m of items) {
        const s = m.stats || {};
        totalRounds += parseInt(s.Rounds || "0", 10);
        totalDamage += parseFloat(s.Damage || "0");
        totalAssists += parseInt(s.Assists || "0", 10);
      }

      let faceitRating = 1.0;
      if (totalRounds > 0 && totalKills > 0) {
        const kpr = totalKills / totalRounds;
        const dpr = totalDeaths / totalRounds;
        const apr = totalAssists / totalRounds;
        const adr = totalDamage / totalRounds;
        const impact = 2.13 * kpr + 0.42 * apr - 0.41;
        const kast = Math.min(90, Math.max(50, 68 + (kpr - dpr) * 35));
        faceitRating = parseFloat(
          (
            0.0073877 * kast +
            0.3591 * kpr -
            0.53295 * dpr +
            0.23726 * impact +
            0.0032 * adr +
            0.1587
          ).toFixed(2)
        );
      } else if (totalMatches > 0) {
        faceitRating = parseFloat((kd * 0.55 + 0.55).toFixed(2));
      }

      const result: FaceitDetailedStats = {
        playerId,
        nickname: baseSummary?.nickname || "Игрок",
        avatarUrl: baseSummary?.avatarUrl || null,
        elo: baseSummary?.elo || null,
        level: baseSummary?.level || null,
        faceitRating,
        matchesCount: totalMatches,
        last5,
        stats30: {
          winrate,
          kd,
          hsPercent,
          wins,
          losses,
          totalKills,
          totalDeaths,
        },
      };

      // Сохраняем в кэш на 5 минут (300 сек)
      await redis.set(cacheKey, JSON.stringify(result), "EX", 300).catch(() => {});

      return result;
    } catch (err) {
      console.error("FACEIT getDetailedStats error:", err);
      return null;
    }
  }
}

export const faceitService = new FaceitService();
