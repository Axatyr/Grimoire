import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { StoryNodeStatus } from '@prisma/client';
import { getParam } from '../utils/params.js';

export const storyNodeSchema = z.object({
  campaignId: z.string().uuid(),
  title: z.string().min(1).max(150),
  summary: z.string().optional(),
  status: z.nativeEnum(StoryNodeStatus).default(StoryNodeStatus.PLANNED),
  content: z.string().optional(),
  positionX: z.number().optional().default(0),
  positionY: z.number().optional().default(0),
  links: z.array(z.object({
    entityType: z.enum(['NPC', 'MONSTER', 'ITEM', 'LOCATION', 'QUEST']),
    entityId: z.string().uuid(),
  })).optional(),
});

export const storyEdgeSchema = z.object({
  campaignId: z.string().uuid(),
  fromNodeId: z.string().uuid(),
  toNodeId: z.string().uuid(),
  choiceLabel: z.string().optional(),
  condition: z.string().optional(),
});

export const getStoryGraph = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getParam(req, 'campaignId');

    const nodes = await prisma.storyNode.findMany({
      where: { campaignId, deletedAt: null },
      include: {
        links: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    const edges = await prisma.storyEdge.findMany({
      where: { campaignId },
      include: {
        fromNode: { select: { id: true, title: true } },
        toNode: { select: { id: true, title: true } },
      }
    });

    res.json({ nodes, edges });
  } catch (error) {
    next(error);
  }
};

export const createStoryNode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { links, ...nodeData } = req.body;

    const node = await prisma.storyNode.create({
      data: {
        ...nodeData,
        links: links && links.length > 0 ? {
          create: links
        } : undefined
      },
      include: { links: true }
    });

    res.status(201).json({ node });
  } catch (error) {
    next(error);
  }
};

export const updateStoryNode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    const { links, ...nodeData } = req.body;

    const updated = await prisma.storyNode.update({
      where: { id },
      data: {
        ...nodeData,
        ...(links ? {
          links: {
            deleteMany: {},
            create: links
          }
        } : {})
      },
      include: { links: true }
    });

    res.json({ node: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteStoryNode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    await prisma.storyNode.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    res.json({ message: 'Story node deleted' });
  } catch (error) {
    next(error);
  }
};

export const createStoryEdge = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const edge = await prisma.storyEdge.create({
      data: req.body,
      include: {
        fromNode: { select: { id: true, title: true } },
        toNode: { select: { id: true, title: true } },
      }
    });

    res.status(201).json({ edge });
  } catch (error) {
    next(error);
  }
};

export const deleteStoryEdge = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParam(req, 'id');
    await prisma.storyEdge.delete({
      where: { id }
    });

    res.json({ message: 'Story edge deleted' });
  } catch (error) {
    next(error);
  }
};

export const generateSessionRecap = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getParam(req, 'campaignId');

    const reachedNodes = await prisma.storyNode.findMany({
      where: {
        campaignId,
        status: { in: ['REACHED', 'ALTERED'] },
        deletedAt: null,
      },
      include: { links: true },
      orderBy: { updatedAt: 'asc' }
    });

    const recapMarkdown = [
      `# Riepilogo di Sessione - Campagna ${campaignId}`,
      `*Generato il ${new Date().toLocaleDateString('it-IT')}*\n`,
      `## Percorso intrapreso dai Giocatori:`,
      ...reachedNodes.map((n, idx) => {
        return `${idx + 1}. **${n.title}** (${n.status})\n   ${n.summary || n.content || 'Nessun dettaglio registrato.'}`;
      }),
      `\n## Prossimi passi / Nodi da preparare:`
    ].join('\n\n');

    res.json({
      reachedCount: reachedNodes.length,
      recapMarkdown,
      nodes: reachedNodes
    });
  } catch (error) {
    next(error);
  }
};
