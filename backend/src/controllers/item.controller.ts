import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { Visibility } from '@prisma/client';
import { getParam, getQueryParam } from '../utils/params.js';
import { sanitizeEntity, sanitizeList } from '../utils/sanitize.js';

export const itemSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  rarity: z.string().optional(),
  type: z.string().optional(),
  value: z.string().optional(),
  weight: z.number().optional().nullable(),
  properties: z.record(z.any()).optional(),
  customProperties: z.array(z.object({
    id: z.string().optional(),
    key: z.string(),
    value: z.string(),
    isSecret: z.boolean().default(false)
  })).optional(),
  lootGroup: z.string().optional().nullable(),
  assignedCharacterId: z.string().uuid().optional().nullable(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC_PLAYERS),
});

export const transferItemSchema = z.object({
  targetCharacterId: z.string().uuid().optional().nullable(), // null means drop/unassign
});

export const batchRevealSchema = z.object({
  campaignId: z.string().uuid(),
  lootGroup: z.string().optional(),
  itemIds: z.array(z.string().uuid()).optional(),
});

export const getItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const characterId = getQueryParam(req, 'characterId');
    const lootGroup = getQueryParam(req, 'lootGroup');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const items = await prisma.item.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(characterId ? { assignedCharacterId: characterId } : {}),
        ...(lootGroup ? { lootGroup } : {}),
        ...(!isMaster ? { visibility: Visibility.PUBLIC_PLAYERS } : {}),
      },
      include: {
        assignedCharacter: { select: { id: true, name: true, userId: true } }
      },
      orderBy: [{ lootGroup: 'asc' }, { name: 'asc' }]
    });

    res.json({ items: sanitizeList(items, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const item = await prisma.item.findFirst({
      where: { id, deletedAt: null },
      include: {
        assignedCharacter: { select: { id: true, name: true, userId: true } }
      }
    });

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (!isMaster && item.visibility === Visibility.PRIVATE_MASTER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ item: sanitizeEntity(item, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const createItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const item = await prisma.item.create({ data });
    res.status(201).json({ item });
  } catch (error) {
    next(error);
  }
};

export const updateItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const data = req.body;

    const updated = await prisma.item.update({
      where: { id },
      data,
      include: {
        assignedCharacter: { select: { id: true, name: true, userId: true } }
      }
    });

    res.json({ item: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    await prisma.item.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const transferItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const { targetCharacterId } = req.body;

    const item = await prisma.item.findFirst({
      where: { id, deletedAt: null }
    });

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    const updated = await prisma.item.update({
      where: { id },
      data: {
        assignedCharacterId: targetCharacterId || null
      },
      include: {
        assignedCharacter: { select: { id: true, name: true, userId: true } }
      }
    });

    res.json({ item: updated, message: 'Item assigned/transferred successfully' });
  } catch (error) {
    next(error);
  }
};

export const batchRevealLoot = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId, lootGroup, itemIds } = req.body;

    await prisma.item.updateMany({
      where: {
        campaignId,
        deletedAt: null,
        ...(lootGroup ? { lootGroup } : {}),
        ...(itemIds && itemIds.length > 0 ? { id: { in: itemIds } } : {}),
      },
      data: {
        visibility: Visibility.PUBLIC_PLAYERS
      }
    });

    res.json({ message: 'Loot revealed to party successfully' });
  } catch (error) {
    next(error);
  }
};
