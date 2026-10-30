import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";

export const friendRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/friends/:telegramId — список друзей
  app.get<{ Params: { telegramId: string } }>("/:telegramId", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sent, received] = await Promise.all([
      prisma.friendship.findMany({
        where: { userId: user.id, status: "ACCEPTED" },
        include: {
          friend: {
            include: {
              dailyStatuses: { where: { date: today }, take: 1 },
              onlineStatus: true,
            },
          },
        },
      }),
      prisma.friendship.findMany({
        where: { friendId: user.id, status: "ACCEPTED" },
        include: {
          user: {
            include: {
              dailyStatuses: { where: { date: today }, take: 1 },
              onlineStatus: true,
            },
          },
        },
      }),
    ]);

    const friends = [
      ...sent.map((f) => formatFriend(f.friend)),
      ...received.map((f) => formatFriend(f.user)),
    ];

    return friends;
  });

  // POST /api/friends/request — отправить запрос дружбы
  app.post<{
    Body: { telegramId: string; friendUsername: string };
  }>("/request", async (req, reply) => {
    const { telegramId: tgIdStr, friendUsername } = req.body;
    const telegramId = BigInt(tgIdStr);

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const friend = await prisma.user.findFirst({
      where: { username: friendUsername },
    });
    if (!friend) return reply.status(404).send({ error: "User not found by username" });
    if (friend.id === user.id) return reply.status(400).send({ error: "Cannot add yourself" });

    const friendship = await prisma.friendship.upsert({
      where: { userId_friendId: { userId: user.id, friendId: friend.id } },
      update: {},
      create: { userId: user.id, friendId: friend.id, status: "PENDING" },
    });

    return { status: friendship.status, friendDisplayName: friend.displayName };
  });

  // POST /api/friends/accept — принять запрос
  app.post<{
    Body: { telegramId: string; friendId: number };
  }>("/accept", async (req, reply) => {
    const { telegramId: tgIdStr, friendId } = req.body;
    const telegramId = BigInt(tgIdStr);

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const friendship = await prisma.friendship.updateMany({
      where: { userId: friendId, friendId: user.id, status: "PENDING" },
      data: { status: "ACCEPTED" },
    });

    if (friendship.count === 0) {
      return reply.status(404).send({ error: "No pending request found" });
    }

    return { status: "ACCEPTED" };
  });

  // GET /api/friends/pending/:telegramId — входящие запросы
  app.get<{ Params: { telegramId: string } }>("/pending/:telegramId", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const pending = await prisma.friendship.findMany({
      where: { friendId: user.id, status: "PENDING" },
      include: { user: true },
    });

    return pending.map((f) => ({
      id: f.id,
      from: {
        id: f.user.id,
        displayName: f.user.displayName,
        username: f.user.username,
      },
      createdAt: f.createdAt,
    }));
  });
};

function formatFriend(user: any) {
  return {
    id: user.id,
    displayName: user.displayName,
    username: user.username,
    avatarUrl: user.avatarUrl,
    dailyStatus: user.dailyStatuses?.[0] || { status: "UNSET" },
    onlineStatus: user.onlineStatus,
  };
}
