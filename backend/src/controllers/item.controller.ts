import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { Visibility } from '@prisma/client';
import { getParam, getQueryParam } from '../utils/params.js';

export const itemSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  rarity: z.string().optional(),
  type: z.string().optional(),
  value: z.string().optional(),
  weight: z.number().optional().nullable(),
  properties: z.record(z.any()).optional(),
  assignedCharacterId: z.string().uuid().optional().nullable(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC_PLAYERS),
});

export const transferItemSchema = z.object({
  targetCharacterId: z.string().uuid().optional().nullable(), // null means drop/unassign
});

export const getItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const characterId = getQueryParam(req, 'characterId');

    const items = await prisma.item.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(characterId ? { assignedCharacterId: characterId } : {}),
      },
      include: {
        assignedCharacter: { select: { id: true, name: true, userId: true } }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ items });
  } catch (error) {
    next(error);
  }
};

export const getItemById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
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

    res.json({ item });
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
      data
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
