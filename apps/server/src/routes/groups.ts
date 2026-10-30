import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../db/prisma.js";
import { nanoid } from "../utils/nanoid.js";

export const groupRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/groups/:telegramId — группы пользователя
  app.get<{ Params: { telegramId: string } }>("/:telegramId", async (req, reply) => {
    const telegramId = BigInt(req.params.telegramId);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: { _count: { select: { members: true } } },
        },
      },
    });

    return memberships.map((m) => ({
      id: m.group.id,
      name: m.group.name,
      inviteCode: m.group.inviteCode,
      role: m.role,
      memberCount: m.group._count.members,
      targetSize: m.group.targetSize,
      reminderHour: m.group.reminderHour,
    }));
  });

  // POST /api/groups — создать группу
  app.post<{
    Body: { telegramId: string; name: string };
  }>("/", async (req, reply) => {
    const { telegramId: tgIdStr, name } = req.body;
    const telegramId = BigInt(tgIdStr);

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const inviteCode = nanoid(8);

    const group = await prisma.group.create({
      data: {
        name,
        inviteCode,
        ownerId: user.id,
        members: {
          create: { userId: user.id, role: "OWNER" },
        },
      },
    });

    return { id: group.id, name: group.name, inviteCode: group.inviteCode };
  });

  // POST /api/groups/join — присоединиться по инвайту
  app.post<{
    Body: { telegramId: string; inviteCode: string };
  }>("/join", async (req, reply) => {
    const { telegramId: tgIdStr, inviteCode } = req.body;
    const telegramId = BigInt(tgIdStr);

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return reply.status(404).send({ error: "User not found" });

    const group = await prisma.group.findUnique({ where: { inviteCode } });
    if (!group) return reply.status(404).send({ error: "Group not found" });

    const memberCount = await prisma.groupMember.count({ where: { groupId: group.id } });
    if (memberCount >= group.maxMembers) {
      return reply.status(400).send({ error: "Group is full" });
    }

    const member = await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: group.id, userId: user.id } },
      update: {},
      create: { groupId: group.id, userId: user.id, role: "MEMBER" },
    });

    return { groupId: group.id, groupName: group.name, role: member.role };
  });

  // PATCH /api/groups/:groupId/settings — обновить настройки группы (размер пати, время опросника)
  app.patch<{
    Params: { groupId: string };
    Body: { targetSize?: number; reminderHour?: number };
  }>("/:groupId/settings", async (req, reply) => {
    const groupId = parseInt(req.params.groupId, 10);
    const { targetSize, reminderHour } = req.body;

    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(targetSize !== undefined && { targetSize }),
        ...(reminderHour !== undefined && { reminderHour }),
      },
    });

    return {
      id: group.id,
      name: group.name,
      targetSize: group.targetSize,
      reminderHour: group.reminderHour,
    };
  });
};
