import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { getParam } from '../utils/params.js';

export const campaignSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  system: z.string().default('D&D 5e'),
  bannerUrl: z.string().url().optional().or(z.literal('')),
});

export const getCampaigns = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const campaigns = await prisma.campaign.findMany({
      where: {
        deletedAt: null,
        OR: [
          { masterId: userId },
          { members: { some: { userId } } }
        ]
      },
      include: {
        master: { select: { id: true, username: true, avatarUrl: true } },
        members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        _count: {
          select: {
            characters: true,
            monsters: true,
            items: true,
            locations: true,
            quests: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
};

export const getAvailableCampaigns = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const campaigns = await prisma.campaign.findMany({
      where: {
        deletedAt: null,
        NOT: {
          members: { some: { userId } }
        }
      },
      include: {
        master: { select: { id: true, username: true } },
        _count: { select: { members: true, characters: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const campaign = await prisma.campaign.findFirst({
      where: { id, deletedAt: null },
      include: {
        master: { select: { id: true, username: true, avatarUrl: true } },
        members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
        characters: { where: { deletedAt: null } },
        locations: { where: { deletedAt: null } },
        quests: { where: { deletedAt: null } },
        tags: true,
      }
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campaign not found' });
      return;
    }

    res.json({ campaign });
  } catch (error) {
    next(error);
  }
};

export const createCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.role !== 'MASTER' && req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Solo i Dungeon Master possono creare nuove campagne. I giocatori possono partecipare a quelle esistenti.' });
      return;
    }

    const { title, description, system, bannerUrl } = req.body;
    const masterId = req.user.userId;

    const campaign = await prisma.campaign.create({
      data: {
        title,
        description,
        system: system || 'D&D 5e',
        bannerUrl,
        masterId,
        members: {
          create: {
            userId: masterId,
            role: 'MASTER'
          }
        }
      },
      include: {
        master: { select: { id: true, username: true } },
        members: true
      }
    });

    res.status(201).json({ campaign });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const { title, description, system, bannerUrl } = req.body;
    const userId = req.user!.userId;

    const campaign = await prisma.campaign.findFirst({
      where: { id, masterId: userId, deletedAt: null }
    });

    if (!campaign) {
      res.status(403).json({ error: 'Only the campaign master can edit this campaign' });
      return;
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(system && { system }),
        ...(bannerUrl !== undefined && { bannerUrl }),
      }
    });

    res.json({ campaign: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const userId = req.user!.userId;

    const campaign = await prisma.campaign.findFirst({
      where: { id, masterId: userId, deletedAt: null }
    });

    if (!campaign) {
      res.status(403).json({ error: 'Only the campaign master can delete this campaign' });
      return;
    }

    await prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const joinCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { campaignId } = req.body;
    const userId = req.user!.userId;

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, deletedAt: null }
    });

    if (!campaign) {
      res.status(404).json({ error: 'Campagna non trovata' });
      return;
    }

    const membership = await prisma.campaignMember.upsert({
      where: { campaignId_userId: { campaignId, userId } },
      update: {},
      create: { campaignId, userId, role: 'PLAYER' }
    });

    res.status(201).json({ message: 'Partecipazione alla campagna completata', membership, campaign });
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const { username } = req.body;
    const userId = req.user!.userId;

    const campaign = await prisma.campaign.findFirst({
      where: { id, masterId: userId, deletedAt: null }
    });

    if (!campaign) {
      res.status(403).json({ error: 'Only the campaign master can add members' });
      return;
    }

    const userToAdd = await prisma.user.findUnique({ where: { username } });
    if (!userToAdd) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const membership = await prisma.campaignMember.upsert({
      where: { campaignId_userId: { campaignId: id, userId: userToAdd.id } },
      update: {},
      create: { campaignId: id, userId: userToAdd.id, role: 'PLAYER' }
    });

    res.status(201).json({ membership });
  } catch (error) {
    next(error);
  }
};
