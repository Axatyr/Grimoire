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
    entityType: z.enum(['NPC', 'MONSTER', 'ITEM', 'LOCATION', 'QUEST', 'CHARACTER']),
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

// Helper to resolve linked entity titles & badges
const resolveNodeLinks = async (links: Array<{ id: string; storyNodeId: string; entityType: string; entityId: string }>) => {
  if (!links || links.length === 0) return [];

  const resolved = await Promise.all(
    links.map(async (link) => {
      let entityName = 'Entità';
      let extraInfo: Record<string, any> = {};

      try {
        switch (link.entityType) {
          case 'NPC':
          case 'CHARACTER': {
            const char = await prisma.character.findUnique({ where: { id: link.entityId }, select: { name: true, role: true, class: true, faction: true, level: true, isNpc: true } });
            if (char) {
              entityName = char.name;
              extraInfo = { role: char.role || char.class, faction: char.faction, level: char.level, isNpc: char.isNpc };
            }
            break;
          }
          case 'MONSTER': {
            const monster = await prisma.monster.findUnique({ where: { id: link.entityId }, select: { name: true, cr: true, hp: true, ac: true } });
            if (monster) {
              entityName = monster.name;
              extraInfo = { cr: monster.cr, hp: monster.hp, ac: monster.ac };
            }
            break;
          }
          case 'LOCATION': {
            const loc = await prisma.location.findUnique({ where: { id: link.entityId }, select: { name: true } });
            if (loc) {
              entityName = loc.name;
            }
            break;
          }
          case 'ITEM': {
            const item = await prisma.item.findUnique({ where: { id: link.entityId }, select: { name: true, rarity: true, type: true } });
            if (item) {
              entityName = item.name;
              extraInfo = { rarity: item.rarity, type: item.type };
            }
            break;
          }
          case 'QUEST': {
            const quest = await prisma.quest.findUnique({ where: { id: link.entityId }, select: { title: true, status: true, objective: true } });
            if (quest) {
              entityName = quest.title;
              extraInfo = { status: quest.status, objective: quest.objective };
            }
            break;
          }
        }
      } catch (err) {
        console.error(`Failed to resolve link ${link.entityType} ${link.entityId}`, err);
      }

      return {
        ...link,
        entityName,
        extraInfo
      };
    })
  );

  return resolved;
};

export const getStoryGraph = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getParam(req, 'campaignId');
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    // Players only see in_progress, reached or altered nodes
    const nodeFilter: any = {
      campaignId,
      deletedAt: null,
      ...(!isMaster ? { status: { in: [StoryNodeStatus.IN_PROGRESS, StoryNodeStatus.REACHED, StoryNodeStatus.ALTERED] } } : {})
    };

    const rawNodes = await prisma.storyNode.findMany({
      where: nodeFilter,
      include: {
        links: true,
      },
      orderBy: { createdAt: 'asc' }
    });

    // Resolve link titles & details
    const nodes = await Promise.all(
      rawNodes.map(async (node) => {
        const resolvedLinks = await resolveNodeLinks(node.links);
        return {
          ...node,
          // Hide sensitive DM preparation details from player view if not Master
          ...(!isMaster ? { content: undefined } : {}),
          links: resolvedLinks
        };
      })
    );

    const visibleNodeIds = new Set(nodes.map(n => n.id));

    // Filter edges to only those connecting visible nodes
    const edges = await prisma.storyEdge.findMany({
      where: {
        campaignId,
        fromNodeId: { in: Array.from(visibleNodeIds) },
        toNodeId: { in: Array.from(visibleNodeIds) },
      },
      include: {
        fromNode: { select: { id: true, title: true } },
        toNode: { select: { id: true, title: true } },
      }
    });

    res.json({ nodes, edges, isMaster });
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
          create: links.map((l: any) => ({
            entityType: l.entityType,
            entityId: l.entityId
          }))
        } : undefined
      },
      include: { links: true }
    });

    const resolvedLinks = await resolveNodeLinks(node.links);

    res.status(201).json({ node: { ...node, links: resolvedLinks } });
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
        ...(links !== undefined ? {
          links: {
            deleteMany: {},
            create: links.map((l: any) => ({
              entityType: l.entityType,
              entityId: l.entityId
            }))
          }
        } : {})
      },
      include: { links: true }
    });

    const resolvedLinks = await resolveNodeLinks(updated.links);

    res.json({ node: { ...updated, links: resolvedLinks } });
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
        status: { in: ['IN_PROGRESS', 'REACHED', 'ALTERED'] },
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
