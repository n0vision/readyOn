import { Bot, InlineKeyboard } from "grammy";
import cron from "node-cron";
import { prisma } from "../../db/prisma.js";
import { getToday, STATUS_EMOJI, STATUS_TEXT } from "../../bot/commands/status.js";
import type { BotContext } from "../../bot/index.js";

export class NotificationEngine {
  private bot: Bot<BotContext> | null = null;
  private cronTask: cron.ScheduledTask | null = null;

  setBot(bot: Bot<BotContext>) {
    this.bot = bot;
  }

  start() {
    console.log("🔔 Notification engine started");

    // Check hourly on minute 0 for group reminders
    this.cronTask = cron.schedule("0 * * * *", () => {
      this.checkHourlyReminders().catch((err) =>
        console.error("Hourly reminder check error:", err)
      );
    });
  }

  stop() {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }
  }

  /**
   * Safely send a message to a user by telegramId
   */
  async sendToUser(
    telegramId: bigint | number | string,
    text: string,
    keyboard?: InlineKeyboard
  ): Promise<boolean> {
    if (!this.bot) return false;

    try {
      await this.bot.api.sendMessage(Number(telegramId), text, {
        parse_mode: "Markdown",
        reply_markup: keyboard,
      });
      return true;
    } catch (err: any) {
      console.warn(`Failed to send notification to ${telegramId}:`, err.message);
      return false;
    }
  }

  /**
   * Check hourly and trigger reminders for groups whose reminderHour matches current hour
   */
  async checkHourlyReminders() {
    const currentHour = new Date().getHours();
    const today = getToday();

    const groups = await prisma.group.findMany({
      where: { reminderHour: currentHour },
      include: {
        members: {
          include: {
            user: {
              include: {
                dailyStatuses: { where: { date: today }, take: 1 },
              },
            },
          },
        },
      },
    });

    for (const group of groups) {
      await this.sendDailyPollForGroup(group);
    }
  }

  /**
   * Send daily poll to all members of a group who haven't set their status yet
   */
  async sendDailyPollForGroup(group: any): Promise<number> {
    const today = getToday();
    let sentCount = 0;

    const keyboard = new InlineKeyboard()
      .text("🟢 Готов", "status:READY")
      .text("🟡 Может быть", "status:UNLIKELY")
      .text("🔴 Не сегодня", "status:UNAVAILABLE");

    for (const member of group.members) {
      const user = member.user;
      const ds = user.dailyStatuses?.[0];

      // If user hasn't set status today (or UNSET)
      if (!ds || ds.status === "UNSET") {
        // Check if reminder was already sent today
        const existing = await prisma.notificationLog.findFirst({
          where: {
            userId: user.id,
            type: `reminder_group_${group.id}`,
            createdAt: { gte: today },
          },
        });

        if (!existing) {
          const text =
            `🎮 **Планы на вечер в CS?**\n\n` +
            `Привет, ${user.displayName}! В группе **«${group.name}»** собирается пати на вечер.\n` +
            `Поставь свой статус готовности:`;

          const sent = await this.sendToUser(user.telegramId, text, keyboard);
          if (sent) {
            sentCount++;
            await prisma.notificationLog.create({
              data: {
                userId: user.id,
                type: `reminder_group_${group.id}`,
                message: text,
                sent: true,
              },
            });
          }
        }
      }
    }

    return sentCount;
  }

  /**
   * Check if group reached target size (e.g. 5 ready players) and send celebration alert
   */
  async checkGroupFullStack(groupId: number) {
    const today = getToday();

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              include: {
                dailyStatuses: { where: { date: today }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!group) return;

    // Filter ready members
    const readyMembers = group.members.filter(
      (m) => m.user.dailyStatuses?.[0]?.status === "READY"
    );

    // Target threshold: minimum of group.targetSize or total members if group is small
    const threshold = Math.min(group.targetSize, group.members.length);

    if (readyMembers.length >= threshold && threshold >= 2) {
      // Check if alert was already broadcast today
      const alreadySent = await prisma.notificationLog.findFirst({
        where: {
          type: `full_stack_group_${group.id}`,
          createdAt: { gte: today },
        },
      });

      if (!alreadySent) {
        let text =
          `🔥 **ФУЛЛ СТАК ГОТОВ! [${readyMembers.length}/${threshold}]**\n\n` +
          `В группе **«${group.name}»** все в сборе для катки в CS2:\n\n`;

        for (const m of readyMembers) {
          const ds = m.user.dailyStatuses[0];
          text += `• **${m.user.displayName}**`;
          if (ds.availableFrom) text += ` (готов с ${ds.availableFrom})`;
          text += `\n`;
        }

        text += `\n🎮 Залетаем в игру и голосовой чат!`;

        const keyboard = new InlineKeyboard().text("📱 Открыть readyOn", "open:miniapp");

        // Broadcast to all group members
        for (const member of group.members) {
          await this.sendToUser(member.user.telegramId, text, keyboard);
        }

        // Log broadcast
        await prisma.notificationLog.create({
          data: {
            userId: group.ownerId,
            type: `full_stack_group_${group.id}`,
            message: text,
            sent: true,
          },
        });
      }
    }
  }

  /**
   * Notify friends when someone starts Counter-Strike 2
   */
  async notifyFriendStartedCS(userId: number, gameName: string) {
    // Only alert for CS
    if (!gameName.toLowerCase().includes("counter-strike")) return;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupMembers: {
          include: {
            group: {
              include: {
                members: {
                  include: {
                    user: {
                      include: {
                        dailyStatuses: { where: { date: getToday() }, take: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return;

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // Collect friends who are marked READY today across user's groups
    const notifiedUserIds = new Set<number>();
    notifiedUserIds.add(user.id);

    for (const gm of user.groupMembers) {
      for (const m of gm.group.members) {
        const friend = m.user;
        if (notifiedUserIds.has(friend.id)) continue;

        const isReadyToday = friend.dailyStatuses?.[0]?.status === "READY";
        if (!isReadyToday) continue;

        // Check debounce
        const recentAlert = await prisma.notificationLog.findFirst({
          where: {
            userId: friend.id,
            type: `friend_in_cs_${user.id}`,
            createdAt: { gte: twoHoursAgo },
          },
        });

        if (!recentAlert) {
          notifiedUserIds.add(friend.id);

          const text =
            `🎮 **${user.displayName} зашёл в Counter-Strike 2!**\n\n` +
            `Ты сегодня отметил статус 🟢 Готов — пора заходить в катку!`;

          const keyboard = new InlineKeyboard()
            .text("📊 Статусы группы", "groups:status_all")
            .text("📱 Mini App", "open:miniapp");

          const sent = await this.sendToUser(friend.telegramId, text, keyboard);
          if (sent) {
            await prisma.notificationLog.create({
              data: {
                userId: friend.id,
                type: `friend_in_cs_${user.id}`,
                message: text,
                sent: true,
              },
            });
          }
        }
      }
    }
  }
}

export const notificationEngine = new NotificationEngine();
