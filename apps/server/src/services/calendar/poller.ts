import cron from "node-cron";
import { prisma } from "../../db/prisma.js";
import { calendarService } from "./service.js";

export class CalendarPoller {
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  start() {
    console.log("📅 Calendar poller started (sync every 30m)...");

    // Run first sync shortly after startup
    setTimeout(() => {
      this.syncAll().catch((err) => console.error("Initial calendar sync error:", err));
    }, 5000);

    // Run every 30 minutes
    this.task = cron.schedule("*/30 * * * *", () => {
      this.syncAll().catch((err) => console.error("Periodic calendar sync error:", err));
    });
  }

  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
  }

  async syncAll() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const sources = await prisma.calendarSource.findMany({
        where: { isActive: true },
      });

      for (const source of sources) {
        try {
          if (source.type === "ICS_URL") {
            await calendarService.syncSource(source.id);
          }
          // Check if auto status should be applied today
          await calendarService.applyAutoStatusIfUnset(source.userId);
        } catch (err: any) {
          console.warn(`Failed to sync calendar source ${source.id}:`, err.message);
        }
      }
    } catch (err: any) {
      console.error("Calendar poller cycle error:", err.message);
    } finally {
      this.isRunning = false;
    }
  }
}

export const calendarPoller = new CalendarPoller();
