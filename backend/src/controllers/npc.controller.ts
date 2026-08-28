import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { Visibility } from '@prisma/client';
import { getParam, getQueryParam } from '../utils/params.js';
import { sanitizeEntity, sanitizeList } from '../utils/sanitize.js';

export const npcSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(100),
  role: z.string().optional(),
  faction: z.string().optional(),
  attitude: z.string().optional(),
  secrets: z.string().optional(),
  portraitUrl: z.string().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  customProperties: z.array(z.object({
    id: z.string().optional(),
    key: z.string(),
    value: z.string(),
    isSecret: z.boolean().default(false)
  })).optional(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC_PLAYERS),
});

export const getNpcs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const locationId = getQueryParam(req, 'locationId');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const npcs = await prisma.nPC.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(locationId ? { locationId } : {}),
        ...(!isMaster ? { visibility: Visibility.PUBLIC_PLAYERS } : {}),
      },
      include: {
        location: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' }
    });

    res.json({ npcs: sanitizeList(npcs, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const getNpcById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const npc = await prisma.nPC.findFirst({
      where: { id, deletedAt: null },
      include: {
        location: true,
        quests: { where: { deletedAt: null } }
      }
    });

    if (!npc) {
      res.status(404).json({ error: 'NPC not found' });
      return;
    }

    if (!isMaster && npc.visibility === Visibility.PRIVATE_MASTER) {
      res.status(403).json({ error: 'Access denied to this NPC' });
      return;
    }

    res.json({ npc: sanitizeEntity(npc, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const createNpc = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const npc = await prisma.nPC.create({ data });
    res.status(201).json({ npc });
  } catch (error) {
    next(error);
  }
};

export const updateNpc = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const data = req.body;

    const updated = await prisma.nPC.update({
      where: { id },
      data
    });

    res.json({ npc: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteNpc = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    await prisma.nPC.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'NPC deleted successfully' });
  } catch (error) {
    next(error);
  }
};
