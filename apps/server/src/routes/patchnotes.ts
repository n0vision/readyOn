import type { FastifyPluginAsync } from "fastify";
import { PATCHNOTES, getLatestPatchnote } from "@readyon/shared";
import { notificationEngine } from "../services/notification/engine.js";

export const patchnotesRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/patchnotes — список всех патчноутов
  app.get("/", async () => {
    return {
      patchnotes: PATCHNOTES,
      latest: getLatestPatchnote(),
    };
  });

  // POST /api/patchnotes/broadcast — рассылка патчноута пользователям
  app.post<{
    Body?: { first?: boolean; patchId?: string; dryRun?: boolean };
    Querystring?: { first?: string; dryRun?: string };
  }>("/broadcast", async (req, reply) => {
    const isFirst = req.body?.first === true || req.query.first === "true";
    const dryRun = req.body?.dryRun === true || req.query.dryRun === "true";
    const patchId = req.body?.patchId;

    const patch = patchId
      ? PATCHNOTES.find((p) => p.id === patchId) || getLatestPatchnote()
      : getLatestPatchnote();

    const result = await notificationEngine.broadcastPatchnote(patch, isFirst, dryRun);
    return {
      success: true,
      patchId: patch.id,
      dryRun,
      broadcast: result,
    };
  });
};
