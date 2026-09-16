import { Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { AuthRequest } from '../types/index.js';
import { getQueryParam } from '../utils/params.js';
import { Visibility } from '@prisma/client';

export interface SearchResultItem {
  id: string;
  type: 'story' | 'quests' | 'locations' | 'characters' | 'npcs' | 'monsters' | 'inventory' | 'notes';
  typeLabel: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  visibility?: string;
}

export const globalSearch = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaignId = getQueryParam(req, 'campaignId');
    const query = (getQueryParam(req, 'q') || '').trim();
    const userId = req.user?.userId;
    const isMaster = req.user?.role === 'MASTER' || req.user?.role === 'ADMIN';

    if (!campaignId || !query) {
      res.json({ results: [], total: 0 });
      return;
    }

    // 1. Story Nodes
    const storyPromise = prisma.storyNode.findMany({
      where: {
        campaignId,
        deletedAt: null,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { summary: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 6,
      select: { id: true, title: true, summary: true, status: true }
    });

    // 2. Quests
    const questsPromise = prisma.quest.findMany({
      where: {
        campaignId,
        deletedAt: null,
        ...(isMaster ? {} : { visibility: Visibility.PUBLIC_PLAYERS }),
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { objective: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 6,
      select: { id: true, title: true, objective: true, status: true, visibility: true }
    });

    // 3. Locations
    const locationsPromise = prisma.location.findMany({
      where: {
        campaignId,
        deletedAt: null,
        ...(isMaster ? {} : { visibility: Visibility.PUBLIC_PLAYERS }),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 6,
      select: { id: true, name: true, description: true, visibility: true }
    });

    // 4. Characters & NPCs
    const charactersPromise = prisma.character.findMany({
      where: {
        campaignId,
        deletedAt: null,
        ...(isMaster ? {} : {
          OR: [
            { visibility: Visibility.PUBLIC_PLAYERS },
            ...(userId ? [{ userId }] : [])
          ]
        }),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { race: { contains: query, mode: 'insensitive' } },
          { class: { contains: query, mode: 'insensitive' } },
          { role: { contains: query, mode: 'insensitive' } },
          { faction: { contains: query, mode: 'insensitive' } },
          { attitude: { contains: query, mode: 'insensitive' } },
          { inventoryNotes: { contains: query, mode: 'insensitive' } },
          ...(isMaster ? [{ secrets: { contains: query, mode: 'insensitive' as const } }] : []),
        ]
      },
      take: 8,
      select: { id: true, name: true, race: true, class: true, role: true, faction: true, level: true, isNpc: true, visibility: true }
    });

    // 5. Monsters
    const monstersPromise = prisma.monster.findMany({
      where: {
        campaignId,
        deletedAt: null,
        ...(isMaster ? {} : { visibility: Visibility.PUBLIC_PLAYERS }),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 6,
      select: { id: true, name: true, type: true, cr: true, hp: true, ac: true, visibility: true }
    });

    // 6. Items / Inventory
    const itemsPromise = prisma.item.findMany({
      where: {
        campaignId,
        deletedAt: null,
        ...(isMaster ? {} : { visibility: Visibility.PUBLIC_PLAYERS }),
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { type: { contains: query, mode: 'insensitive' } },
          { rarity: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { lootGroup: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 6,
      select: { id: true, name: true, type: true, rarity: true, value: true, visibility: true }
    });

    // 7. Notes & Logs
    const notesPromise = prisma.note.findMany({
      where: {
        campaignId,
        deletedAt: null,
        ...(isMaster ? {} : {
          OR: [
            { isPublic: true },
            ...(userId ? [{ authorId: userId }] : [])
          ]
        }),
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ]
      },
      take: 6,
      select: { id: true, title: true, content: true, isPublic: true, author: { select: { username: true } } }
    });

    const [storyNodes, quests, locations, characters, monsters, items, notes] = await Promise.all([
      storyPromise,
      questsPromise,
      locationsPromise,
      charactersPromise,
      monstersPromise,
      itemsPromise,
      notesPromise,
    ]);

    const results: SearchResultItem[] = [];

    // Format results
    storyNodes.forEach(s => {
      results.push({
        id: s.id,
        type: 'story',
        typeLabel: 'Story Path',
        title: s.title,
        subtitle: `Stato: ${s.status}`,
        snippet: s.summary || undefined
      });
    });

    quests.forEach(q => {
      results.push({
        id: q.id,
        type: 'quests',
        typeLabel: 'Quest',
        title: q.title,
        subtitle: `Obiettivo: ${q.objective}`,
        visibility: q.visibility
      });
    });

    locations.forEach(l => {
      results.push({
        id: l.id,
        type: 'locations',
        typeLabel: 'Atlante',
        title: l.name,
        snippet: l.description || undefined,
        visibility: l.visibility
      });
    });

    characters.forEach(c => {
      const subtitle = c.isNpc
        ? [c.role || c.class, c.faction].filter(Boolean).join(' • ') || 'NPC'
        : `${c.race || ''} ${c.class || ''} (Livello ${c.level})`.trim();
      results.push({
        id: c.id,
        type: 'characters',
        typeLabel: c.isNpc ? 'NPC' : 'Personaggi',
        title: c.name,
        subtitle,
        visibility: c.visibility
      });
    });

    monsters.forEach(m => {
      results.push({
        id: m.id,
        type: 'monsters',
        typeLabel: 'Bestiario',
        title: m.name,
        subtitle: `${m.type || 'Creatura'} ${m.cr ? `• CR ${m.cr}` : ''} • HP: ${m.hp}, CA: ${m.ac}`,
        visibility: m.visibility
      });
    });

    items.forEach(i => {
      results.push({
        id: i.id,
        type: 'inventory',
        typeLabel: 'Loot & Oggetti',
        title: i.name,
        subtitle: [i.type, i.rarity, i.value].filter(Boolean).join(' • '),
        visibility: i.visibility
      });
    });

    notes.forEach(n => {
      results.push({
        id: n.id,
        type: 'notes',
        typeLabel: 'Note',
        title: n.title,
        subtitle: `Autore: ${n.author?.username || 'Anonimo'} • ${n.isPublic ? 'Pubblica' : 'Privata'}`,
        snippet: n.content ? n.content.substring(0, 100) : undefined
      });
    });

    res.json({ results, total: results.length });
  } catch (error) {
    next(error);
  }
};
