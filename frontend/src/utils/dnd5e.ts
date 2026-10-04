import type { SkillProficiencyLevel, Coins } from '../types/character';

export interface AbilityScoreDef {
  key: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  label: string;
  short: string;
}

export const ABILITY_SCORES: AbilityScoreDef[] = [
  { key: 'str', label: 'FORZA', short: 'FOR' },
  { key: 'dex', label: 'DESTREZZA', short: 'DES' },
  { key: 'con', label: 'COSTITUZIONE', short: 'COS' },
  { key: 'int', label: 'INTELLIGENZA', short: 'INT' },
  { key: 'wis', label: 'SAGGEZZA', short: 'SAG' },
  { key: 'cha', label: 'CARISMA', short: 'CAR' },
];

export interface DndSkillDef {
  key: string;
  name: string;
  nameEn: string;
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  abilityLabel: string;
}

export const DND_5_5_SKILLS: DndSkillDef[] = [
  { key: 'acrobatics', name: 'Acrobazia', nameEn: 'Acrobatics', ability: 'dex', abilityLabel: 'DES' },
  { key: 'animalHandling', name: 'Addestrare Animali', nameEn: 'Animal Handling', ability: 'wis', abilityLabel: 'SAG' },
  { key: 'arcana', name: 'Arcano', nameEn: 'Arcana', ability: 'int', abilityLabel: 'INT' },
  { key: 'athletics', name: 'Atletica', nameEn: 'Athletics', ability: 'str', abilityLabel: 'FOR' },
  { key: 'stealth', name: 'Furtività', nameEn: 'Stealth', ability: 'dex', abilityLabel: 'DES' },
  { key: 'investigation', name: 'Indagare', nameEn: 'Investigation', ability: 'int', abilityLabel: 'INT' },
  { key: 'deception', name: 'Inganno', nameEn: 'Deception', ability: 'cha', abilityLabel: 'CAR' },
  { key: 'intimidation', name: 'Intimidire', nameEn: 'Intimidation', ability: 'cha', abilityLabel: 'CAR' },
  { key: 'performance', name: 'Intrattenere', nameEn: 'Performance', ability: 'cha', abilityLabel: 'CAR' },
  { key: 'insight', name: 'Intuizione', nameEn: 'Insight', ability: 'wis', abilityLabel: 'SAG' },
  { key: 'medicine', name: 'Medicina', nameEn: 'Medicine', ability: 'wis', abilityLabel: 'SAG' },
  { key: 'nature', name: 'Natura', nameEn: 'Nature', ability: 'int', abilityLabel: 'INT' },
  { key: 'perception', name: 'Percezione', nameEn: 'Perception', ability: 'wis', abilityLabel: 'SAG' },
  { key: 'persuasion', name: 'Persuasione', nameEn: 'Persuasion', ability: 'cha', abilityLabel: 'CAR' },
  { key: 'sleightOfHand', name: 'Rapidità di Mano', nameEn: 'Sleight of Hand', ability: 'dex', abilityLabel: 'DES' },
  { key: 'religion', name: 'Religione', nameEn: 'Religion', ability: 'int', abilityLabel: 'INT' },
  { key: 'survival', name: 'Sopravvivenza', nameEn: 'Survival', ability: 'wis', abilityLabel: 'SAG' },
  { key: 'history', name: 'Storia', nameEn: 'History', ability: 'int', abilityLabel: 'INT' },
];

/** Calcola il modificatore di caratteristica D&D (es. 10 -> 0, 14 -> +2) */
export const getAbilityModifier = (score: number = 10): number => {
  return Math.floor((score - 10) / 2);
};

export const formatModifier = (mod: number): string => {
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

/** Calcola il Bonus di Competenza in base al livello */
export const getProficiencyBonus = (level: number = 1): number => {
  const lvl = Math.max(1, Math.min(30, Number(level) || 1));
  return Math.floor((lvl - 1) / 4) + 2;
};

/** Calcola il bonus totale di un'abilità D&D 5.5 */
export const getSkillTotal = (
  abilityScore: number = 10,
  proficiency: SkillProficiencyLevel = 0,
  proficiencyBonus: number = 2
): number => {
  const mod = getAbilityModifier(abilityScore);
  if (proficiency === 2) {
    return mod + (proficiencyBonus * 2); // Maestria (Expertise)
  }
  if (proficiency === 1) {
    return mod + proficiencyBonus; // Competente
  }
  return mod; // Nessuna competenza
};

/** Calcola il bonus per il Tiro Salvezza */
export const getSavingThrowBonus = (
  abilityScore: number = 10,
  isProficient: boolean = false,
  proficiencyBonus: number = 2
): number => {
  const mod = getAbilityModifier(abilityScore);
  return mod + (isProficient ? proficiencyBonus : 0);
};

/** Converte tutte le monete D&D in controvalore totale Monete d'Oro (MO / GP) */
export const calculateTotalGold = (coins?: Coins): number => {
  if (!coins) return 0;
  const cp = Number(coins.cp || 0);
  const sp = Number(coins.sp || 0);
  const ep = Number(coins.ep || 0);
  const gp = Number(coins.gp || 0);
  const pp = Number(coins.pp || 0);

  // 100 CP = 1 GP, 10 SP = 1 GP, 2 EP = 1 GP, 1 PP = 10 GP
  const total = (cp / 100) + (sp / 10) + (ep / 2) + gp + (pp * 10);
  return Math.round(total * 100) / 100;
};

/**
 * Logica D&D 5e / 5.5 per l'assorbimento del danno con Punti Ferita Temporanei:
 * I Temp HP assorbono per primi il danno.
 * Il danno residuo eccedente i Temp HP riduce gli HP attuali.
 */
export const applyDamageWithTempHp = (
  hpCurrent: number,
  hpTemp: number,
  damage: number
): { newHpCurrent: number; newHpTemp: number; absorbedByTemp: number } => {
  const current = Math.max(0, Number(hpCurrent) || 0);
  const temp = Math.max(0, Number(hpTemp) || 0);
  const dmg = Math.max(0, Number(damage) || 0);

  if (dmg === 0) {
    return { newHpCurrent: current, newHpTemp: temp, absorbedByTemp: 0 };
  }

  if (temp > 0) {
    if (dmg <= temp) {
      return {
        newHpCurrent: current,
        newHpTemp: temp - dmg,
        absorbedByTemp: dmg
      };
    } else {
      const remainingDmg = dmg - temp;
      return {
        newHpCurrent: Math.max(0, current - remainingDmg),
        newHpTemp: 0,
        absorbedByTemp: temp
      };
    }
  }

  return {
    newHpCurrent: Math.max(0, current - dmg),
    newHpTemp: 0,
    absorbedByTemp: 0
  };
};

/**
 * Logica di cura:
 * Cura hpCurrent fino a hpMax. I punti ferita temporanei non vengono alterati.
 */
export const applyHeal = (
  hpCurrent: number,
  hpMax: number,
  heal: number
): number => {
  const current = Math.max(0, Number(hpCurrent) || 0);
  const max = Math.max(1, Number(hpMax) || 1);
  const amount = Math.max(0, Number(heal) || 0);

  return Math.min(max, current + amount);
};
