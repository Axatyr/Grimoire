import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { Visibility } from '@prisma/client';
import { getParam, getQueryParam } from '../utils/params.js';
import { sanitizeEntity, sanitizeList } from '../utils/sanitize.js';

export const characterSchema = z.object({
  campaignId: z.string().uuid(),
  userId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(100),
  race: z.string().optional(),
  class: z.string().optional(),
  level: z.number().int().min(1).default(1),
  hpMax: z.number().int().default(10),
  hpCurrent: z.number().int().default(10),
  ac: z.number().int().default(10),
  stats: z.record(z.any()).optional(),
  customProperties: z.array(z.object({
    id: z.string().optional(),
    key: z.string(),
    value: z.string(),
    isSecret: z.boolean().default(false)
  })).optional(),
  inventoryNotes: z.string().optional(),
  avatarUrl: z.string().optional().nullable(),
  isNpc: z.boolean().default(false),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC_PLAYERS),
});

export const getCharacters = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const characters = await prisma.character.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
      },
      include: {
        user: { select: { id: true, username: true } },
        items: { where: { deletedAt: null } },
      },
      orderBy: { name: 'asc' }
    });

    res.json({ characters: sanitizeList(characters, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const getCharacterById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const character = await prisma.character.findFirst({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, username: true } },
        items: { where: { deletedAt: null } },
        campaign: { select: { id: true, title: true, masterId: true } }
      }
    });

    if (!character) {
      res.status(404).json({ error: 'Character not found' });
      return;
    }

    res.json({ character: sanitizeEntity(character, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const createCharacter = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const userId = req.user!.userId;

    const character = await prisma.character.create({
      data: {
        ...data,
        userId: data.userId || (data.isNpc ? null : userId)
      }
    });

    res.status(201).json({ character });
  } catch (error) {
    next(error);
  }
};

export const updateCharacter = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const data = req.body;

    const updated = await prisma.character.update({
      where: { id },
      data
    });

    res.json({ character: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCharacter = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    await prisma.character.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    next(error);
  }
};
