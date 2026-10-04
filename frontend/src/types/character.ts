export interface CustomProperty {
  id?: string;
  key: string;
  value: string;
  isSecret: boolean;
}

export type SkillProficiencyLevel = 0 | 1 | 2; // 0: None, 1: Proficient, 2: Expertise

export interface Coins {
  cp: number; // Monete di Rame (MR)
  sp: number; // Monete d'Argento (MA)
  ep: number; // Monete d'Electrum (ME)
  gp: number; // Monete d'Oro (MO)
  pp: number; // Monete di Platino (MP)
}

export interface CharacterPhysical {
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  appearance?: string;
}

export interface CharacterPersonality {
  traits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  backstory?: string;
}

export interface CharacterTrait {
  id: string;
  name: string;
  source?: string;
  description: string;
}

export interface CharacterStats {
  str?: number;
  dex?: number;
  con?: number;
  int?: number;
  wis?: number;
  cha?: number;
  hpTemp?: number;
  speed?: number; // default 9 (30ft)
  hitDice?: string; // e.g. "1d10"
  inspiration?: number; // 0 to 4
  equippedItemIds?: string[]; // IDs of equipped items (weapons, armor, shields)
  traitsAndFeatures?: CharacterTrait[]; // Class features, racial traits, feats
  savingThrows?: Record<string, boolean>; // key: 'str' | 'dex' ...
  skills?: Record<string, SkillProficiencyLevel>; // key: 'athletics' ...
  coins?: Coins;
  background?: string;
  alignment?: string;
  physical?: CharacterPhysical;
  personality?: CharacterPersonality;
  [key: string]: any;
}

export interface CharacterItem {
  id: string;
  name: string;
  rarity?: string;
  type?: string;
  value?: string;
  weight?: number;
  description?: string;
}

export interface Character {
  id: string;
  campaignId: string;
  name: string;
  race?: string;
  class?: string;
  role?: string;
  faction?: string;
  attitude?: string;
  secrets?: string;
  level: number;
  hpMax: number;
  hpCurrent: number;
  ac: number;
  stats?: CharacterStats;
  customProperties?: CustomProperty[];
  inventoryNotes?: string;
  avatarUrl?: string;
  isNpc: boolean;
  visibility: 'PUBLIC_PLAYERS' | 'PRIVATE_MASTER';
  user?: { id: string; username: string };
  items?: CharacterItem[];
  locationId?: string | null;
  location?: { id: string; name: string } | null;
}
