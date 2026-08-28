import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { getParam, getQueryParam } from '../utils/params.js';
import { sanitizeList } from '../utils/sanitize.js';

export const noteSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().min(1).max(150),
  content: z.string(),
  isPublic: z.boolean().default(false),
  sessionDate: z.string().optional().nullable(),
  customProperties: z.array(z.object({
    id: z.string().optional(),
    key: z.string(),
    value: z.string(),
    isSecret: z.boolean().default(false)
  })).optional(),
});

export const getNotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const userId = req.user!.userId;
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    const notes = await prisma.note.findMany({
      where: {
        deletedAt: null,
        ...(campaignId ? { campaignId } : {}),
        ...(!isMaster ? {
          OR: [
            { isPublic: true },
            { authorId: userId }
          ]
        } : {})
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ notes: sanitizeList(notes, isMaster) });
  } catch (error) {
    next(error);
  }
};

export const getNoteById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const note = await prisma.note.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    res.json({ note });
  } catch (error) {
    next(error);
  }
};

export const createNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = req.body;
    const authorId = req.user!.userId;

    const note = await prisma.note.create({
      data: {
        ...data,
        sessionDate: data.sessionDate ? new Date(data.sessionDate) : null,
        authorId
      },
      include: {
        author: { select: { id: true, username: true, avatarUrl: true } }
      }
    });

    res.status(201).json({ note });
  } catch (error) {
    next(error);
  }
};

export const updateNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const data = req.body;

    const updated = await prisma.note.update({
      where: { id },
      data: {
        ...data,
        sessionDate: data.sessionDate ? new Date(data.sessionDate) : undefined,
      }
    });

    res.json({ note: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteNote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    await prisma.note.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
};
