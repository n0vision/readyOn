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
   * Helper to build a Mini App inline button
   */
  getMiniAppKeyboard(primaryBtn?: { text: string; data: string }): InlineKeyboard {
    const keyboard = new InlineKeyboard();
    if (primaryBtn) {
      keyboard.text(primaryBtn.text, primaryBtn.data).row();
    }
    const miniAppUrl = process.env.MINI_APP_URL || "https://soft-autumn-tells-yesterday.trycloudflare.com";
    if (miniAppUrl.startsWith("https://")) {
      keyboard.webApp("📱 Открыть readyOn", miniAppUrl);
    } else {
      keyboard.text("📱 Открыть readyOn", "open:miniapp");
    }
    return keyboard;
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
      // Fallback: retry without markdown formatting in case of syntax issue
      try {
        const plainText = text.replace(/[*_`]/g, "");
        await this.bot.api.sendMessage(Number(telegramId), plainText, {
          reply_markup: keyboard,
        });
        return true;
      } catch (retryErr: any) {
        console.warn(`Retry plain text failed for ${telegramId}:`, retryErr.message);
        return false;
      }
    }
  }

  /**
   * Send an instant test notification to a user to verify delivery
   */
  async sendTestNotification(telegramId: bigint | number | string): Promise<{ success: boolean; error?: string }> {
    if (!this.bot) {
      return { success: false, error: "Bot is not initialized" };
    }

    const text =
      `🔔 **Тестовое уведомление readyOn**\n\n` +
      `Всё работает отлично! Бот присылает уведомления о:\n` +
      `• Готовности тиммейтов к игре\n` +
      `• Сборе полного сквада (фулл стак)\n` +
      `• Вечернем опросе о планах на игру\n` +
      `• Заходе друзей в CS2 / TeamSpeak`;

    const keyboard = this.getMiniAppKeyboard({
      text: "🟢 Я готов играть",
      data: "status:READY:now",
    });

    const sent = await this.sendToUser(telegramId, text, keyboard);
    if (!sent) {
      return {
        success: false,
        error: "Не удалось отправить сообщение. Убедись, что нажал /start в диалоге с @readyOnCS_bot",
      };
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });
    if (user) {
      await prisma.notificationLog.create({
        data: {
          userId: user.id,
          type: "test_notification",
          message: text,
          sent: true,
        },
      });
    }

    return { success: true };
  }

  /**
   * Notify squad members when a player sets their status to READY
   */
  async notifyFriendReady(userId: number, availableFrom?: string | null) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        groupMembers: {
          include: {
            group: {
              include: {
                members: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) return;

    // 15-minute debounce per friend pair
    const debounceLimit = new Date(Date.now() - 15 * 60 * 1000);
    const notifiedUserIds = new Set<number>();
    notifiedUserIds.add(user.id);

    const timeStr = availableFrom ? ` с ${availableFrom}` : "";

    for (const gm of user.groupMembers) {
      const group = gm.group;
      for (const m of group.members) {
        const friend = m.user;
        if (notifiedUserIds.has(friend.id)) continue;

        // Check friend's notification preferences (default true)
        const settings = (friend.notificationSettings as Record<string, any>) || {};
        if (settings.friend_ready === false) continue;

        // Check debounce log
        const recentAlert = await prisma.notificationLog.findFirst({
          where: {
            userId: friend.id,
            type: `friend_ready_${user.id}`,
            createdAt: { gte: debounceLimit },
          },
        });

        if (recentAlert) continue;

        notifiedUserIds.add(friend.id);

        const text =
          `🟢 **${user.displayName} готов к катке!**\n\n` +
          `В скваде **«${group.name}»** движ${timeStr ? `: готов играть${timeStr}` : ""}.\n` +
          `Собираемся?`;

        const keyboard = this.getMiniAppKeyboard({
          text: "🟢 Я тоже готов!",
          data: "status:READY:now",
        });

        const sent = await this.sendToUser(friend.telegramId, text, keyboard);
        if (sent) {
          await prisma.notificationLog.create({
            data: {
              userId: friend.id,
              type: `friend_ready_${user.id}`,
              message: text,
              sent: true,
            },
          });
        }
      }
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
      .text("🟢 Готов", "status:READY:now")
      .text("🟡 Возможно", "status:UNLIKELY")
      .text("🔴 Не смогу", "status:UNAVAILABLE");

    for (const member of group.members) {
      const user = member.user;
      const ds = user.dailyStatuses?.[0];

      // Check user preferences (default true)
      const settings = (user.notificationSettings as Record<string, any>) || {};
      if (settings.reminder === false) continue;

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
            `🎮 **Планы на вечер в CS2?**\n\n` +
            `Привет, ${user.displayName}! В скваде **«${group.name}»** собирается пати на вечер.\n` +
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
          `В скваде **«${group.name}»** все в сборе для катки в CS2:\n\n`;

        for (const m of readyMembers) {
          const ds = m.user.dailyStatuses[0];
          text += `• **${m.user.displayName}**`;
          if (ds.availableFrom) text += ` (готов с ${ds.availableFrom})`;
          text += `\n`;
        }

        text += `\n🎮 Залетаем в игру и голосовой чат!`;

        const keyboard = this.getMiniAppKeyboard();

        // Broadcast to all group members who haven't disabled squad_full
        for (const member of group.members) {
          const settings = (member.user.notificationSettings as Record<string, any>) || {};
          if (settings.squad_full === false) continue;

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

        const settings = (friend.notificationSettings as Record<string, any>) || {};
        if (settings.friend_cs2 === false) continue;

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

          const keyboard = this.getMiniAppKeyboard({
            text: "📊 Статусы сквада",
            data: "groups:status_all",
          });

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

  /**
   * Уведомить готовых друзей, что игрок вернулся домой
   */
  async notifyFriendArrivedHome(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        dailyStatuses: { where: { date: getToday() }, take: 1 },
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

    // Уведомляем только если сам игрок сегодня планировал играть (READY / UNLIKELY)
    const userTodayStatus = user.dailyStatuses?.[0]?.status;
    if (userTodayStatus !== "READY" && userTodayStatus !== "UNLIKELY") return;

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const notifiedUserIds = new Set<number>();
    notifiedUserIds.add(user.id);

    for (const gm of user.groupMembers) {
      for (const m of gm.group.members) {
        const friend = m.user;
        if (notifiedUserIds.has(friend.id)) continue;

        const isFriendReady = friend.dailyStatuses?.[0]?.status === "READY";
        if (!isFriendReady) continue;

        // Check debounce
        const recentAlert = await prisma.notificationLog.findFirst({
          where: {
            userId: friend.id,
            type: `friend_arrived_home_${user.id}`,
            createdAt: { gte: twoHoursAgo },
          },
        });

        if (!recentAlert) {
          notifiedUserIds.add(friend.id);

          const text =
            `🏠 **${user.displayName} добрался домой!**\n\n` +
            `Готовьте лобби, скоро стартуем катку!`;

          const keyboard = this.getMiniAppKeyboard({
            text: "📊 Статусы сквада",
            data: "groups:status_all",
          });

          const sent = await this.sendToUser(friend.telegramId, text, keyboard);
          if (sent) {
            await prisma.notificationLog.create({
              data: {
                userId: friend.id,
                type: `friend_arrived_home_${user.id}`,
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
