import cron from "node-cron";
import { prisma } from "../../db/prisma.js";
import { steamService } from "./steam.js";
import { faceitService } from "./faceit.js";
import { teamspeakService } from "./teamspeak.js";
import { notificationEngine } from "../notification/engine.js";

export class GamingStatusPoller {
  private isRunning: boolean = false;
  private task: cron.ScheduledTask | null = null;

  start() {
    console.log("🎮 Gaming status poller starting (every 45s)...");

    // Run immediate first check
    this.poll().catch((err) => console.error("Initial gaming poll error:", err));

    // Schedule every 45 seconds
    this.task = cron.schedule("*/45 * * * * *", () => {
      this.poll().catch((err) => console.error("Gaming poll error:", err));
    });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }

  async poll() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { steamId: { not: null } },
            { faceitId: { not: null } },
            { tsIdentity: { not: null } },
          ],
        },
      });

      if (users.length === 0) {
        this.isRunning = false;
        return;
      }

      // Query external APIs concurrently with error boundaries
      const steamUsers = users.filter((u) => u.steamId);
      const steamPromise =
        steamService.isConfigured() && steamUsers.length > 0
          ? steamService.getPlayerSummaries(steamUsers.map((u) => u.steamId as string))
          : Promise.resolve(new Map());

      const tsPromise = teamspeakService.isConfigured()
        ? teamspeakService.getConnectedClients()
        : Promise.resolve([]);

      const [steamResult, tsResult] = await Promise.allSettled([steamPromise, tsPromise]);

      const steamSummaries =
        steamResult.status === "fulfilled" ? steamResult.value : new Map();
      const tsClients = tsResult.status === "fulfilled" ? tsResult.value : [];

      // Process each user
      for (const user of users) {
        let steamStatus: string | null = null;
        let steamGame: string | null = null;
        let faceitStatus: string | null = null;
        let faceitElo: number | null = null;
        let faceitLevel: number | null = null;
        let tsStatus: string | null = null;
        let tsChannel: string | null = null;

        // Process Steam
        if (user.steamId && steamSummaries.has(user.steamId)) {
          const summary = steamSummaries.get(user.steamId)!;
          steamStatus = summary.status;
          steamGame = summary.gameName;
        }

        // Process FACEIT (if configured and linked)
        if (user.faceitId && faceitService.isConfigured()) {
          try {
            const faceitData = await faceitService.getPlayerByNickname(user.faceitId);
            if (faceitData) {
              faceitElo = faceitData.elo;
              faceitLevel = faceitData.level;
              const inMatch = await faceitService.getActiveMatch(faceitData.playerId);
              faceitStatus = inMatch ? "in_match" : faceitData.status;
            }
          } catch (e) {
            // Ignore Faceit timeout/error
          }
        }

        // Process TeamSpeak
        if (user.tsIdentity && tsClients.length > 0) {
          const matched = tsClients.find(
            (c) =>
              c.nickname.toLowerCase() === user.tsIdentity?.toLowerCase() ||
              c.nickname.toLowerCase().includes(user.tsIdentity?.toLowerCase() || "")
          );
          if (matched) {
            tsStatus = "connected";
            tsChannel = matched.channelName;
          } else {
            tsStatus = "offline";
          }
        }

        // Update database
        await prisma.onlineStatus.upsert({
          where: { userId: user.id },
          update: {
            ...(user.steamId && { steamStatus, steamGame }),
            ...(user.faceitId && { faceitStatus, faceitElo, faceitLevel }),
            ...(user.tsIdentity && { tsStatus, tsChannel }),
            lastUpdated: new Date(),
          },
          create: {
            userId: user.id,
            steamStatus,
            steamGame,
            faceitStatus,
            faceitElo,
            faceitLevel,
            tsStatus,
            tsChannel,
          },
        });

        // Notify friends if user started CS2
        if (steamGame && steamGame.toLowerCase().includes("counter-strike")) {
          notificationEngine.notifyFriendStartedCS(user.id, steamGame).catch(() => {});
        }
      }
    } catch (err) {
      console.error("Error during gaming poll cycle:", err);
    } finally {
      this.isRunning = false;
    }
  }
}

export const gamingPoller = new GamingStatusPoller();
