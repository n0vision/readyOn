/**
 * Steam Web API Client
 * Docs: https://partner.steamgames.com/doc/webapi/ISteamUser
 */

export interface SteamPlayerSummary {
  steamId: string;
  personaName: string;
  status: "online" | "in_game" | "offline";
  gameName: string | null;
  avatarUrl: string | null;
}

export class SteamService {
  private explicitKey: string | null;

  constructor(apiKey?: string) {
    this.explicitKey = apiKey || null;
  }

  get key(): string | null {
    return this.explicitKey || process.env.STEAM_API_KEY || null;
  }

  public isConfigured(): boolean {
    const k = this.key;
    return Boolean(k && k.trim().length > 0);
  }

  /**
   * Resolves a Steam ID from a numeric SteamID64, profile URL or custom vanity URL
   * E.g.: "76561198000000000", "https://steamcommunity.com/id/n0vision/", "n0vision"
   */
  async resolveSteamId(input: string): Promise<string | null> {
    const clean = input.trim().replace(/\/$/, "");

    // 1. Direct SteamID64 (17 digits starting with 7656)
    if (/^7656\d{13}$/.test(clean)) {
      return clean;
    }

    // 2. URL like steamcommunity.com/profiles/7656...
    const profileMatch = clean.match(/\/profiles\/(7656\d{13})/);
    if (profileMatch) {
      return profileMatch[1];
    }

    // 3. Vanity URL like steamcommunity.com/id/nickname/
    let vanity = clean;
    const idMatch = clean.match(/\/id\/([^\/]+)/);
    if (idMatch) {
      vanity = idMatch[1];
    }

    const k = this.key;
    if (!k) {
      // Without API key, can only accept pure 17-digit SteamID64
      return /^7656\d{13}$/.test(vanity) ? vanity : null;
    }

    try {
      const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${k}&vanityurl=${encodeURIComponent(
        vanity
      )}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data: any = await res.json();
      if (data.response?.success === 1 && data.response?.steamid) {
        return data.response.steamid;
      }
    } catch (err) {
      console.error("Steam ResolveVanityURL error:", err);
    }

    return null;
  }

  /**
   * Get player summaries for multiple Steam IDs
   */
  async getPlayerSummaries(steamIds: string[]): Promise<Map<string, SteamPlayerSummary>> {
    const result = new Map<string, SteamPlayerSummary>();
    const k = this.key;
    if (!k || steamIds.length === 0) return result;

    try {
      const idsParam = steamIds.join(",");
      const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${k}&steamids=${idsParam}`;
      const res = await fetch(url);
      if (!res.ok) return result;

      const data: any = await res.json();
      const players = data.response?.players || [];

      for (const p of players) {
        let status: "online" | "in_game" | "offline" = "offline";
        let gameName: string | null = null;

        if (p.gameextrainfo) {
          status = "in_game";
          gameName = p.gameextrainfo;
        } else if (p.personastate && p.personastate > 0) {
          status = "online";
        }

        result.set(p.steamid, {
          steamId: p.steamid,
          personaName: p.personaname,
          status,
          gameName,
          avatarUrl: p.avatarfull || p.avatarmedium,
        });
      }
    } catch (err) {
      console.error("Steam GetPlayerSummaries error:", err);
    }

    return result;
  }
}

export const steamService = new SteamService();
