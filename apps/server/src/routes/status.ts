import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import type { ReadyStatus } from "@prisma/client";

export const statusRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/status/:telegramId — получить статус пользователя на сегодня
  app.get<{ Params: { telegramId: string } }>("/:telegramId", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const status = await prisma.dailyStatus.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });

    const online = await prisma.onlineStatus.findUnique({
      where: { userId: user.id },
    });

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        displayName: user.displayName,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
      dailyStatus: status || { status: "UNSET", availableFrom: null, comment: null },
      onlineStatus: online,
    };
  });

  // PUT /api/status — обновить свой статус
  app.put<{
    Body: {
      telegramId: string;
      status: ReadyStatus;
      availableFrom?: string;
      availableUntil?: string;
      comment?: string;
    };
  }>("/", async (req, reply) => {
    const { telegramId: tgIdStr, status, availableFrom, availableUntil, comment } = req.body;
    const telegramId = BigInt(tgIdStr);

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyStatus = await prisma.dailyStatus.upsert({
      where: { userId_date: { userId: user.id, date: today } },
      update: { status, availableFrom, availableUntil, comment },
      create: { userId: user.id, date: today, status, availableFrom, availableUntil, comment },
    });

    return dailyStatus;
  });

  // GET /api/status/group/:groupId — получить статусы всех в группе
  app.get<{ Params: { groupId: string } }>("/group/:groupId", async (req, reply) => {
    const groupId = parseInt(req.params.groupId, 10);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              include: {
                dailyStatuses: {
                  where: { date: getToday() },
                  take: 1,
                },
                onlineStatus: true,
              },
            },
          },
        },
      },
    });

    if (!group) return reply.status(404).send({ error: "Group not found" });

    return {
      group: {
        id: group.id,
        name: group.name,
        inviteCode: group.inviteCode,
      },
      members: group.members.map((m) => ({
        id: m.user.id,
        displayName: m.user.displayName,
        username: m.user.username,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        dailyStatus: m.user.dailyStatuses[0] || { status: "UNSET" },
        onlineStatus: m.user.onlineStatus,
      })),
    };
  });
};

function getToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
