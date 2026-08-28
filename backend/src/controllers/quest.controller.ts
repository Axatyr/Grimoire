import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { QuestStatus, Visibility } from '@prisma/client';
import { getParam, getQueryParam } from '../utils/params.js';

export const questSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().min(1).max(100),
  objective: z.string().min(1),
  description: z.string().optional(),
  status: z.nativeEnum(QuestStatus).default(QuestStatus.ACTIVE),
  rewards: z.any().optional(),
  linkedNpcId: z.string().uuid().optional().nullable(),
  linkedLocationId: z.string().uuid().optional().nullable(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC_PLAYERS),
});

export const getQuests = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const status = getQueryParam(req, 'status');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const quests = await prisma.quest.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(status ? { status: status as QuestStatus } : {}),
        ...(!isMaster ? { visibility: Visibility.PUBLIC_PLAYERS } : {}),
      },
      include: {
        linkedNpc: { select: { id: true, name: true } },
        linkedLocation: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ quests });
  } catch (error) {
    next(error);
  }
};

export const getQuestById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const quest = await prisma.quest.findFirst({
      where: { id, deletedAt: null },
      include: {
        linkedNpc: true,
        linkedLocation: true,
      }
    });

    if (!quest) {
      res.status(404).json({ error: 'Quest not found' });
      return;
    }

    res.json({ quest });
  } catch (error) {
    next(error);
  }
};

export const createQuest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const quest = await prisma.quest.create({ data });
    res.status(201).json({ quest });
  } catch (error) {
    next(error);
  }
};

export const updateQuest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const data = req.body;

    const updated = await prisma.quest.update({
      where: { id },
      data
    });

    res.json({ quest: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteQuest = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    await prisma.quest.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    next(error);
  }
};
