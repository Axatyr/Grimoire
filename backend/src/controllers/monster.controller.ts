import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { Visibility } from '@prisma/client';
import { getParam, getQueryParam } from '../utils/params.js';

export const monsterSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(100),
  cr: z.string().optional(),
  type: z.string().optional(),
  hp: z.number().int().default(10),
  ac: z.number().int().default(10),
  stats: z.record(z.any()).optional(),
  actions: z.any().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PRIVATE_MASTER),
});

export const getMonsters = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const monsters = await prisma.monster.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(!isMaster ? { visibility: Visibility.PUBLIC_PLAYERS } : {}),
      },
      orderBy: { name: 'asc' }
    });

    res.json({ monsters });
  } catch (error) {
    next(error);
  }
};

export const getMonsterById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const monster = await prisma.monster.findFirst({
      where: { id, deletedAt: null }
    });

    if (!monster) {
      res.status(404).json({ error: 'Monster not found' });
      return;
    }

    res.json({ monster });
  } catch (error) {
    next(error);
  }
};

export const createMonster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const monster = await prisma.monster.create({ data });
    res.status(201).json({ monster });
  } catch (error) {
    next(error);
  }
};

export const updateMonster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const data = req.body;

    const updated = await prisma.monster.update({
      where: { id },
      data
    });

    res.json({ monster: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteMonster = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    await prisma.monster.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Monster deleted successfully' });
  } catch (error) {
    next(error);
  }
};
