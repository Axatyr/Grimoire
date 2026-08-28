import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { Visibility } from '@prisma/client';
import { getParam, getQueryParam } from '../utils/params.js';
import { sanitizeEntity, sanitizeList } from '../utils/sanitize.js';

export const locationSchema = z.object({
  campaignId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  mapImageUrl: z.string().optional().nullable(),
  pointsOfInterest: z.any().optional(),
  customProperties: z.array(z.object({
    id: z.string().optional(),
    key: z.string(),
    value: z.string(),
    isSecret: z.boolean().default(false)
  })).optional(),
  visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC_PLAYERS),
});

export const getLocations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const locations = await prisma.location.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(!isMaster ? { visibility: Visibility.PUBLIC_PLAYERS } : {}),
      },
      include: {
        parent: { select: { id: true, name: true } },
        children: { where: { deletedAt: null }, select: { id: true, name: true } },
        npcs: { where: { deletedAt: null }, select: { id: true, name: true, role: true } },
      },
      orderBy: { name: 'asc' }
    });

    res.json({ locations: sanitizeList(locations, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const getLocationById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const location = await prisma.location.findFirst({
      where: { id, deletedAt: null },
      include: {
        parent: true,
        children: { where: { deletedAt: null } },
        npcs: { where: { deletedAt: null } },
        quests: { where: { deletedAt: null } },
      }
    });

    if (!location) {
      res.status(404).json({ error: 'Location not found' });
      return;
    }

    if (!isMaster && location.visibility === Visibility.PRIVATE_MASTER) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ location: sanitizeEntity(location, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const location = await prisma.location.create({ data });
    res.status(201).json({ location });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const data = req.body;

    const updated = await prisma.location.update({
      where: { id },
      data
    });

    res.json({ location: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');

    // Unlink all child locations
    const unlinkedResult = await prisma.location.updateMany({
      where: { parentId: id, deletedAt: null },
      data: { parentId: null }
    });

    await prisma.location.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({
      message: 'Location deleted successfully',
      unlinkedCount: unlinkedResult.count
    });
  } catch (error) {
    next(error);
  }
};
