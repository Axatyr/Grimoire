import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import {
  Users,
  UserCheck,
  Plus,
  Heart,
  Shield,
  Award,
  Trash2,
  Edit2,
  X,
  Eye,
  EyeOff,
  Maximize2,
  Sparkles,
  Activity,
  Compass,
  Zap,
  Search,
  Package,
  Lock,
  User,
  Coins as CoinsIcon,
  BookOpen,
  Sword,
  Save,
  RotateCcw,
  Crosshair,
  CheckCircle,
  Circle
} from 'lucide-react';
import { CustomPropertiesEditor, CustomPropertiesView } from './CustomPropertiesEditor';
import type {
  Character,
  CharacterStats,
  CharacterTrait,
  CustomProperty,
  SkillProficiencyLevel,
  Coins
} from '../types/character';
import {
  ABILITY_SCORES,
  DND_5_5_SKILLS,
  getAbilityModifier,
  formatModifier,
  getProficiencyBonus,
  getSkillTotal,
  getSavingThrowBonus,
  calculateTotalGold,
  applyDamageWithTempHp,
  applyHeal
} from '../utils/dnd5e';

export const CharactersTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [characters, setCharacters] = useState<Character[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDetailChar, setSelectedDetailChar] = useState<Character | null>(null);
  const [charSearch, setCharSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'PG' | 'NPC'>('ALL');

  // Active section tab in Detail Modal ('stats' | 'inventory' | 'bio' | 'dm')
  const [detailTab, setDetailTab] = useState<'stats' | 'inventory' | 'bio' | 'dm'>('stats');

  // Inline edit mode in detail view
  const [detailEditMode, setDetailEditMode] = useState(false);

  // Editable fields for Character Sheet
  const [editName, setEditName] = useState('');
  const [editRace, setEditRace] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editLevel, setEditLevel] = useState(1);
  const [editHpMax, setEditHpMax] = useState(10);
  const [editAc, setEditAc] = useState(10);
  const [editSpeed, setEditSpeed] = useState(9);
  const [editHitDice, setEditHitDice] = useState('1d8');
  const [editStr, setEditStr] = useState(10);
  const [editDex, setEditDex] = useState(10);
  const [editCon, setEditCon] = useState(10);
  const [editInt, setEditInt] = useState(10);
  const [editWis, setEditWis] = useState(10);
  const [editCha, setEditCha] = useState(10);
  const [editBackground, setEditBackground] = useState('');
  const [editAlignment, setEditAlignment] = useState('Neutrale');
  const [editFaction, setEditFaction] = useState('');
  const [editAttitude, setEditAttitude] = useState('Neutrale');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editSecrets, setEditSecrets] = useState('');
  const [editPersonalityTraits, setEditPersonalityTraits] = useState('');
  const [editIdeals, setEditIdeals] = useState('');
  const [editBonds, setEditBonds] = useState('');
  const [editFlaws, setEditFlaws] = useState('');
  const [editBackstory, setEditBackstory] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editEyes, setEditEyes] = useState('');
  const [editSkin, setEditSkin] = useState('');
  const [editHair, setEditHair] = useState('');
  const [editAppearance, setEditAppearance] = useState('');
  const [editInventoryNotes, setEditInventoryNotes] = useState('');
  const [editSavingThrows, setEditSavingThrows] = useState<Record<string, boolean>>({});
  const [editSkills, setEditSkills] = useState<Record<string, SkillProficiencyLevel>>({});
  const [editCoins, setEditCoins] = useState<Coins>({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
  const [editCustomProperties, setEditCustomProperties] = useState<CustomProperty[]>([]);
  const [editVisibility, setEditVisibility] = useState<'PUBLIC_PLAYERS' | 'PRIVATE_MASTER'>('PUBLIC_PLAYERS');
  const [editIsNpc, setEditIsNpc] = useState(false);
  const [editDmNotes, setEditDmNotes] = useState('');

  // Mini-tab for HP controls in Detail Modal ('hp' | 'temp')
  const [hpMiniTab, setHpMiniTab] = useState<'hp' | 'temp'>('hp');
  const [hpDeltaInput, setHpDeltaInput] = useState('');

  // Creation Form Tab ('stats' | 'inventory' | 'bio')
  const [formTab, setFormTab] = useState<'stats' | 'inventory' | 'bio'>('stats');

  // Search filter for skills in Detail View
  const [skillFilter, setSkillFilter] = useState('');

  // Inline trait creation in Detail View
  const [showAddTrait, setShowAddTrait] = useState(false);
  const [traitName, setTraitName] = useState('');
  const [traitSource, setTraitSource] = useState('Classe');
  const [traitDesc, setTraitDesc] = useState('');

  // Create modal form state
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [charClass, setCharClass] = useState('');
  const [role, setRole] = useState('');
  const [faction, setFaction] = useState('');
  const [attitude, setAttitude] = useState('Neutrale');
  const [secrets, setSecrets] = useState('');
  const [level, setLevel] = useState(1);
  const [hpMax, setHpMax] = useState(10);
  const [hpCurrent, setHpCurrent] = useState(10);
  const [hpTemp, setHpTemp] = useState(0);
  const [ac, setAc] = useState(10);
  const [speed, setSpeed] = useState(9);
  const [hitDice, setHitDice] = useState('1d8');
  const [inspiration, setInspiration] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isNpc, setIsNpc] = useState(false);
  const [visibility, setVisibility] = useState<'PUBLIC_PLAYERS' | 'PRIVATE_MASTER'>('PUBLIC_PLAYERS');
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([]);
  const [str, setStr] = useState(10);
  const [dex, setDex] = useState(10);
  const [con, setCon] = useState(10);
  const [intScore, setIntScore] = useState(10);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(10);
  const [savingThrows, setSavingThrows] = useState<Record<string, boolean>>({});
  const [skills, setSkills] = useState<Record<string, SkillProficiencyLevel>>({});
  const [coins, setCoins] = useState<Coins>({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
  const [inventoryNotes, setInventoryNotes] = useState('');
  const [background, setBackground] = useState('');
  const [alignment, setAlignment] = useState('Neutrale');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [eyes, setEyes] = useState('');
  const [skin, setSkin] = useState('');
  const [hair, setHair] = useState('');
  const [appearance, setAppearance] = useState('');
  const [personalityTraits, setPersonalityTraits] = useState('');
  const [ideals, setIdeals] = useState('');
  const [bonds, setBonds] = useState('');
  const [flaws, setFlaws] = useState('');
  const [backstory, setBackstory] = useState('');

  const fetchCharacters = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/characters?campaignId=${activeCampaign.id}`);
      setCharacters(res.characters || []);
    } catch (err) {
      console.error('Failed to load characters', err);
    }
  };

  const fetchCharacterDetail = async (charId: string) => {
    try {
      const res = await apiFetch(`/characters/${charId}`);
      if (res.character) {
        setSelectedDetailChar(res.character);
        setCharacters(prev => prev.map(c => c.id === charId ? { ...c, items: res.character.items } : c));
      }
    } catch (err) {
      console.error('Failed to fetch character detail', err);
    }
  };

  // Pre-fill editable state from a character
  const populateEditState = (char: Character) => {
    const st = char.stats || {};
    const phys = st.physical || {};
    const pers = st.personality || {};
    setEditName(char.name);
    setEditRace(char.race || '');
    setEditClass(char.class || '');
    setEditLevel(char.level);
    setEditHpMax(char.hpMax);
    setEditAc(char.ac);
    setEditSpeed(Number(st.speed || 9));
    setEditHitDice(st.hitDice || '1d8');
    setEditStr(st.str ?? 10);
    setEditDex(st.dex ?? 10);
    setEditCon(st.con ?? 10);
    setEditInt(st.int ?? 10);
    setEditWis(st.wis ?? 10);
    setEditCha(st.cha ?? 10);
    setEditBackground(st.background || '');
    setEditAlignment(st.alignment || 'Neutrale');
    setEditFaction(char.faction || '');
    setEditAttitude(char.attitude || 'Neutrale');
    setEditAvatarUrl(char.avatarUrl || '');
    setEditSecrets(char.secrets || '');
    setEditPersonalityTraits(pers.traits || '');
    setEditIdeals(pers.ideals || '');
    setEditBonds(pers.bonds || '');
    setEditFlaws(pers.flaws || '');
    setEditBackstory(pers.backstory || '');
    setEditAge(phys.age || '');
    setEditHeight(phys.height || '');
    setEditWeight(phys.weight || '');
    setEditEyes(phys.eyes || '');
    setEditSkin(phys.skin || '');
    setEditHair(phys.hair || '');
    setEditAppearance(phys.appearance || '');
    setEditInventoryNotes(char.inventoryNotes || '');
    setEditSavingThrows(st.savingThrows || {});
    setEditSkills(st.skills || {});
    setEditCoins(st.coins || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
    setEditCustomProperties(Array.isArray(char.customProperties) ? char.customProperties : []);
    setEditVisibility(char.visibility || 'PUBLIC_PLAYERS');
    setEditIsNpc(Boolean(char.isNpc));
    setEditDmNotes((st as any).dmNotes || '');
  };

  const openDetailEdit = (char: Character) => {
    populateEditState(char);
    setDetailEditMode(true);
  };

  const handleSaveDetailEdit = async () => {
    if (!selectedDetailChar || !editName.trim()) return;
    const char = selectedDetailChar;
    const updatedStats: CharacterStats = {
      ...(char.stats || {}),
      str: Number(editStr),
      dex: Number(editDex),
      con: Number(editCon),
      int: Number(editInt),
      wis: Number(editWis),
      cha: Number(editCha),
      speed: Number(editSpeed),
      hitDice: editHitDice,
      background: editBackground,
      alignment: editAlignment,
      savingThrows: editSavingThrows,
      skills: editSkills,
      coins: editCoins,
      physical: {
        age: editAge,
        height: editHeight,
        weight: editWeight,
        eyes: editEyes,
        skin: editSkin,
        hair: editHair,
        appearance: editAppearance
      },
      personality: {
        traits: editPersonalityTraits,
        ideals: editIdeals,
        bonds: editBonds,
        flaws: editFlaws,
        backstory: editBackstory
      },
      dmNotes: editDmNotes,
    } as any;

    try {
      const res = await apiFetch(`/characters/${char.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          race: editRace,
          class: editClass,
          role: editClass,
          level: Number(editLevel),
          hpMax: Number(editHpMax),
          hpCurrent: Math.min(char.hpCurrent, Number(editHpMax)),
          ac: Number(editAc),
          faction: editFaction,
          attitude: editAttitude,
          secrets: editSecrets,
          avatarUrl: editAvatarUrl || undefined,
          visibility: editVisibility,
          isNpc: Boolean(editIsNpc),
          customProperties: editCustomProperties,
          inventoryNotes: editInventoryNotes,
          stats: updatedStats,
        })
      });
      setCharacters(prev => prev.map(c => c.id === char.id ? res.character : c));
      setSelectedDetailChar(res.character);
      setDetailEditMode(false);
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio');
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [activeCampaign?.id]);

  const resetCreateForm = () => {
    setName('');
    setRace('');
    setCharClass('');
    setRole('');
    setFaction('');
    setAttitude('Neutrale');
    setSecrets('');
    setLevel(1);
    setHpMax(10);
    setHpCurrent(10);
    setHpTemp(0);
    setAc(10);
    setSpeed(9);
    setHitDice('1d8');
    setInspiration(0);
    setAvatarUrl('');
    setIsNpc(false);
    setVisibility('PUBLIC_PLAYERS');
    setCustomProperties([]);
    setStr(10);
    setDex(10);
    setCon(10);
    setIntScore(10);
    setWis(10);
    setCha(10);
    setSavingThrows({});
    setSkills({});
    setCoins({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 });
    setInventoryNotes('');
    setBackground('');
    setAlignment('Neutrale');
    setAge('');
    setHeight('');
    setWeight('');
    setEyes('');
    setSkin('');
    setHair('');
    setAppearance('');
    setPersonalityTraits('');
    setIdeals('');
    setBonds('');
    setFlaws('');
    setBackstory('');
    setShowAddModal(false);
    setFormTab('stats');
  };

  const openCreateModal = (defaultNpc: boolean = false) => {
    resetCreateForm();
    setIsNpc(defaultNpc);
    setShowAddModal(true);
  };

  const handleCreateNewCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;

    const payload = {
      campaignId: activeCampaign.id,
      name,
      race,
      class: charClass || role,
      role: role || charClass,
      faction,
      attitude,
      secrets,
      level: Number(level),
      hpMax: Number(hpMax),
      hpCurrent: Number(hpCurrent),
      ac: Number(ac),
      avatarUrl: avatarUrl || undefined,
      visibility,
      customProperties,
      stats: {
        str: Number(str),
        dex: Number(dex),
        con: Number(con),
        int: Number(intScore),
        wis: Number(wis),
        cha: Number(cha),
        hpTemp: Number(hpTemp),
        speed: Number(speed),
        hitDice,
        inspiration: Number(inspiration),
        savingThrows,
        skills,
        coins,
        background,
        alignment,
        physical: { age, height, weight, eyes, skin, hair, appearance },
        personality: { traits: personalityTraits, ideals, bonds, flaws, backstory },
      },
      inventoryNotes,
      isNpc: Boolean(isNpc)
    };

    try {
      const res = await apiFetch('/characters', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setCharacters(prev => [...prev, res.character]);
      setShowAddModal(false);
      resetCreateForm();
    } catch (err: any) {
      alert(err.message || 'Errore creazione personaggio');
    }
  };

  const handleApplyDamage = async (charId: string, damageAmount: number) => {
    const char = characters.find(c => c.id === charId);
    if (!char || damageAmount <= 0) return;

    const currentTemp = Number(char.stats?.hpTemp || 0);
    const result = applyDamageWithTempHp(char.hpCurrent, currentTemp, damageAmount);

    const updatedStats: CharacterStats = {
      ...(char.stats || {}),
      hpTemp: result.newHpTemp
    };

    try {
      const res = await apiFetch(`/characters/${charId}`, {
        method: 'PUT',
        body: JSON.stringify({
          hpCurrent: result.newHpCurrent,
          stats: updatedStats
        })
      });
      setCharacters(prev => prev.map(c => (c.id === charId ? res.character : c)));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(res.character);
      }
    } catch (err) {
      console.error('Failed to apply damage', err);
    }
  };

  const handleApplyHeal = async (charId: string, healAmount: number) => {
    const char = characters.find(c => c.id === charId);
    if (!char || healAmount <= 0) return;

    const newHp = applyHeal(char.hpCurrent, char.hpMax, healAmount);

    try {
      const res = await apiFetch(`/characters/${charId}`, {
        method: 'PUT',
        body: JSON.stringify({ hpCurrent: newHp })
      });
      setCharacters(prev => prev.map(c => (c.id === charId ? res.character : c)));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(res.character);
      }
    } catch (err) {
      console.error('Failed to heal', err);
    }
  };

  const handleSetTempHp = async (charId: string, newTemp: number) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const clampedTemp = Math.max(0, newTemp);
    const updatedStats: CharacterStats = {
      ...(char.stats || {}),
      hpTemp: clampedTemp
    };

    try {
      const res = await apiFetch(`/characters/${charId}`, {
        method: 'PUT',
        body: JSON.stringify({ stats: updatedStats })
      });
      setCharacters(prev => prev.map(c => (c.id === charId ? res.character : c)));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(res.character);
      }
    } catch (err) {
      console.error('Failed to set temp HP', err);
    }
  };

  const handleSetInspiration = async (charId: string, points: number) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const clamped = Math.max(0, Math.min(4, points));
    const updatedStats: CharacterStats = {
      ...(char.stats || {}),
      inspiration: clamped
    };

    try {
      const res = await apiFetch(`/characters/${charId}`, {
        method: 'PUT',
        body: JSON.stringify({ stats: updatedStats })
      });
      setCharacters(prev => prev.map(c => (c.id === charId ? res.character : c)));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(res.character);
      }
    } catch (err) {
      console.error('Failed to update inspiration', err);
    }
  };

  const handleToggleEquipItem = async (charId: string, itemId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const currentEquipped = char.stats?.equippedItemIds || [];
    const isAlreadyEquipped = currentEquipped.includes(itemId);
    const nextEquipped = isAlreadyEquipped
      ? currentEquipped.filter(id => id !== itemId)
      : [...currentEquipped, itemId];

    const updatedStats: CharacterStats = {
      ...(char.stats || {}),
      equippedItemIds: nextEquipped
    };

    try {
      const res = await apiFetch(`/characters/${charId}`, {
        method: 'PUT',
        body: JSON.stringify({ stats: updatedStats })
      });
      setCharacters(prev => prev.map(c => (c.id === charId ? res.character : c)));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(res.character);
      }
    } catch (err) {
      console.error('Failed to toggle equip item', err);
    }
  };

  const handleAddTrait = async (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char || !traitName.trim()) return;

    const newTrait: CharacterTrait = {
      id: Date.now().toString(),
      name: traitName.trim(),
      source: traitSource.trim() || 'Altro',
      description: traitDesc.trim()
    };

    const currentTraits = char.stats?.traitsAndFeatures || [];
    const updatedStats: CharacterStats = {
      ...(char.stats || {}),
      traitsAndFeatures: [...currentTraits, newTrait]
    };

    try {
      const res = await apiFetch(`/characters/${charId}`, {
        method: 'PUT',
        body: JSON.stringify({ stats: updatedStats })
      });
      setCharacters(prev => prev.map(c => (c.id === charId ? res.character : c)));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(res.character);
      }
      setTraitName('');
      setTraitDesc('');
      setShowAddTrait(false);
    } catch (err) {
      console.error('Failed to add trait', err);
    }
  };

  const handleDeleteTrait = async (charId: string, traitId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    const currentTraits = char.stats?.traitsAndFeatures || [];
    const updatedStats: CharacterStats = {
      ...(char.stats || {}),
      traitsAndFeatures: currentTraits.filter(t => t.id !== traitId)
    };

    try {
      const res = await apiFetch(`/characters/${charId}`, {
        method: 'PUT',
        body: JSON.stringify({ stats: updatedStats })
      });
      setCharacters(prev => prev.map(c => (c.id === charId ? res.character : c)));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(res.character);
      }
    } catch (err) {
      console.error('Failed to delete trait', err);
    }
  };

  const handleToggleSkillInDetail = async (skillKey: string) => {
    if (!selectedDetailChar) return;
    const canEdit = isMaster || selectedDetailChar.user?.id === user?.id;
    if (!canEdit) return;

    if (detailEditMode) {
      const currentLevel: SkillProficiencyLevel = editSkills[skillKey] || 0;
      const nextLevel: SkillProficiencyLevel = currentLevel === 0 ? 1 : currentLevel === 1 ? 2 : 0;
      setEditSkills(prev => ({ ...prev, [skillKey]: nextLevel }));
      return;
    }

    const currentSkills = selectedDetailChar.stats?.skills || {};
    const currentLevel: SkillProficiencyLevel = currentSkills[skillKey] || 0;
    const nextLevel: SkillProficiencyLevel = currentLevel === 0 ? 1 : currentLevel === 1 ? 2 : 0;
    const updatedSkills = { ...currentSkills, [skillKey]: nextLevel };
    const updatedStats: CharacterStats = {
      ...(selectedDetailChar.stats || {}),
      skills: updatedSkills
    };

    try {
      const res = await apiFetch(`/characters/${selectedDetailChar.id}`, {
        method: 'PUT',
        body: JSON.stringify({ stats: updatedStats })
      });
      setCharacters(prev => prev.map(c => (c.id === selectedDetailChar.id ? res.character : c)));
      setSelectedDetailChar(res.character);
    } catch (err) {
      console.error('Failed to update skill proficiency', err);
    }
  };

  const handleToggleSaveInDetail = async (abilityKey: string) => {
    if (!selectedDetailChar) return;
    const canEdit = isMaster || selectedDetailChar.user?.id === user?.id;
    if (!canEdit) return;

    if (detailEditMode) {
      setEditSavingThrows(prev => ({ ...prev, [abilityKey]: !prev[abilityKey] }));
      return;
    }

    const currentSaves = selectedDetailChar.stats?.savingThrows || {};
    const updatedSaves = { ...currentSaves, [abilityKey]: !currentSaves[abilityKey] };
    const updatedStats: CharacterStats = {
      ...(selectedDetailChar.stats || {}),
      savingThrows: updatedSaves
    };

    try {
      const res = await apiFetch(`/characters/${selectedDetailChar.id}`, {
        method: 'PUT',
        body: JSON.stringify({ stats: updatedStats })
      });
      setCharacters(prev => prev.map(c => (c.id === selectedDetailChar.id ? res.character : c)));
      setSelectedDetailChar(res.character);
    } catch (err) {
      console.error('Failed to update saving throw', err);
    }
  };

  const handleAdjustCoinsInDetail = async (coinType: keyof Coins, delta: number) => {
    if (!selectedDetailChar) return;
    const canEdit = isMaster || selectedDetailChar.user?.id === user?.id;
    if (!canEdit) return;

    if (detailEditMode) {
      const newAmount = Math.max(0, (Number(editCoins[coinType]) || 0) + delta);
      setEditCoins(prev => ({ ...prev, [coinType]: newAmount }));
      return;
    }

    const currentCoins: Coins = selectedDetailChar.stats?.coins || { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    const newAmount = Math.max(0, (Number(currentCoins[coinType]) || 0) + delta);
    const updatedCoins = { ...currentCoins, [coinType]: newAmount };

    const updatedStats: CharacterStats = {
      ...(selectedDetailChar.stats || {}),
      coins: updatedCoins
    };

    try {
      const res = await apiFetch(`/characters/${selectedDetailChar.id}`, {
        method: 'PUT',
        body: JSON.stringify({ stats: updatedStats })
      });
      setCharacters(prev => prev.map(c => (c.id === selectedDetailChar.id ? res.character : c)));
      setSelectedDetailChar(res.character);
    } catch (err) {
      console.error('Failed to adjust coins', err);
    }
  };

  const handleToggleVisibility = async (char: Character) => {
    if (!isMaster) return;
    const nextVis = char.visibility === 'PUBLIC_PLAYERS' ? 'PRIVATE_MASTER' : 'PUBLIC_PLAYERS';
    try {
      const res = await apiFetch(`/characters/${char.id}`, {
        method: 'PUT',
        body: JSON.stringify({ visibility: nextVis })
      });
      setCharacters(prev => prev.map(c => (c.id === char.id ? res.character : c)));
      if (selectedDetailChar?.id === char.id) {
        setSelectedDetailChar(res.character);
      }
    } catch (err: any) {
      alert(err.message || 'Errore modifica visibilità');
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (!confirm('Eliminare definitivamente questo personaggio?')) return;
    try {
      await apiFetch(`/characters/${charId}`, { method: 'DELETE' });
      setCharacters(prev => prev.filter(c => c.id !== charId));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(null);
        setDetailEditMode(false);
      }
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione');
    }
  };

  const pgCount = characters.filter(c => !c.isNpc).length;
  const npcCount = characters.filter(c => c.isNpc).length;

  const filteredCharacters = characters.filter(c => {
    if (typeFilter === 'PG' && c.isNpc) return false;
    if (typeFilter === 'NPC' && !c.isNpc) return false;
    if (!charSearch.trim()) return true;
    const q = charSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.race?.toLowerCase().includes(q) ||
      c.class?.toLowerCase().includes(q) ||
      c.user?.username?.toLowerCase().includes(q) ||
      c.inventoryNotes?.toLowerCase().includes(q) ||
      c.stats?.background?.toLowerCase().includes(q)
    );
  });

  if (!activeCampaign) return null;

  return (
    <div className="grimoire-container">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users color="var(--primary)" /> Personaggi & NPC di Campagna
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Schede eroi dei giocatori (PG), alleati e figure chiave (NPC) con regole D&D 5.5, abilità, ispirazione, armi equipaggiate e note DM riservate.
          </p>
        </div>
        {isMaster && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => openCreateModal(false)} className="grimoire-btn grimoire-btn-primary">
              <Plus size={16} /> Nuovo PG
            </button>
            <button onClick={() => openCreateModal(true)} className="grimoire-btn grimoire-btn-gold">
              <Plus size={16} /> Nuovo NPC
            </button>
          </div>
        )}
      </div>

      {/* Toolbar: Category Filters & Search */}
      <div className="toolbar-responsive">
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`grimoire-btn ${typeFilter === 'ALL' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Tutti ({characters.length})
          </button>
          <button
            onClick={() => setTypeFilter('PG')}
            className={`grimoire-btn ${typeFilter === 'PG' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '5px' }}
          >
            <Shield size={13} /> PG Giocatori ({pgCount})
          </button>
          <button
            onClick={() => setTypeFilter('NPC')}
            className={`grimoire-btn ${typeFilter === 'NPC' ? 'grimoire-btn-gold' : 'grimoire-btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '5px' }}
          >
            <UserCheck size={13} /> NPC ({npcCount})
          </button>
        </div>

        <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="grimoire-input"
            value={charSearch}
            onChange={e => setCharSearch(e.target.value)}
            placeholder="Cerca per nome, razza, classe, background..."
            style={{ paddingLeft: '36px', paddingRight: charSearch ? '30px' : '10px', height: '36px', fontSize: '0.85rem', width: '100%' }}
          />
          {charSearch && (
            <button
              onClick={() => setCharSearch('')}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Characters Cards Grid */}
      <div className="characters-card-grid">
        {filteredCharacters.map(char => {
          const charTempHp = Number(char.stats?.hpTemp || 0);
          const charInspiration = Number(char.stats?.inspiration || 0);
          const effectiveTotal = Math.max(char.hpMax, char.hpCurrent + charTempHp);
          const basePct = effectiveTotal > 0 ? Math.min(100, Math.max(0, (char.hpCurrent / effectiveTotal) * 100)) : 0;
          const shieldPct = effectiveTotal > 0 ? Math.min(100 - basePct, Math.max(0, (charTempHp / effectiveTotal) * 100)) : 0;

          const hpRatio = char.hpMax > 0 ? Math.max(0, Math.min(100, (char.hpCurrent / char.hpMax) * 100)) : 0;
          const hpColor = hpRatio > 50 ? 'var(--accent-emerald)' : hpRatio > 25 ? 'var(--accent-gold)' : 'var(--accent-crimson)';

          return (
            <div key={char.id} className="character-card">
              {/* Header card */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', minWidth: 0 }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: char.isNpc
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(236, 72, 153, 0.2))'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))',
                  border: char.isNpc ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {char.avatarUrl ? (
                    <img src={char.avatarUrl} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.35rem' }}>{char.isNpc ? '👤' : '🧙‍♂️'}</span>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {char.name}
                    </h3>

                    {/* PG vs NPC Badge */}
                    <span className={`badge ${char.isNpc ? 'badge-rarity-rare' : 'badge-rarity-uncommon'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                      {char.isNpc ? <><UserCheck size={10} /> NPC</> : <><Shield size={10} /> PG</>}
                    </span>

                    {/* Temp HP Badge */}
                    {charTempHp > 0 && (
                      <span className="hp-temp-badge" title="Punti Ferita Temporanei (Scudo Blu)">
                        🛡️ +{charTempHp} Scudo
                      </span>
                    )}

                    {/* Heroic Inspiration Badge */}
                    {charInspiration > 0 && (
                      <span className="badge badge-rarity-legendary" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', padding: '1px 6px' }} title="Punti Ispirazione Eroica">
                        ✨ Isp: {charInspiration}
                      </span>
                    )}

                    {isMaster && (
                      <button
                        onClick={() => handleToggleVisibility(char)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={char.visibility === 'PRIVATE_MASTER' ? 'Privato al Master (clicca per rendere pubblico)' : 'Pubblico per tutti i player (clicca per nascondere)'}
                      >
                        {char.visibility === 'PRIVATE_MASTER' ? (
                          <span className="badge badge-rarity-legendary" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', padding: '1px 5px' }}>
                            <EyeOff size={10} /> DM
                          </span>
                        ) : (
                          <span className="badge badge-rarity-common" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', padding: '1px 5px' }}>
                            <Eye size={10} /> Pubblico
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '4px' }}>
                    {char.race || (char.isNpc ? 'NPC' : 'Eroe')} {char.class ? `• ${char.class}` : ''} • Liv. {char.level}
                  </p>

                  {(char.faction || char.attitude || (isMaster && char.secrets)) && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {char.faction && (
                        <span className="badge badge-rarity-uncommon" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                          🏛️ {char.faction}
                        </span>
                      )}
                      {char.attitude && (
                        <span className="badge badge-rarity-common" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                          {char.attitude}
                        </span>
                      )}
                      {isMaster && char.secrets && (
                        <span className="badge badge-rarity-legendary" style={{ fontSize: '0.65rem', padding: '1px 5px', display: 'inline-flex', alignItems: 'center', gap: '2px' }} title="Contiene segreti per il DM">
                          <Lock size={9} /> Segreti DM
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isMaster && (
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {/* SPRINT 1: Modifica direttamente la scheda identica */}
                    <button
                      onClick={() => {
                        setSelectedDetailChar(char);
                        openDetailEdit(char);
                        fetchCharacterDetail(char.id);
                      }}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '6px' }}
                      title="Modifica Scheda"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteCharacter(char.id)}
                      className="grimoire-btn grimoire-btn-danger"
                      style={{ padding: '6px', fontSize: '0.75rem', borderRadius: '6px' }}
                      title="Elimina"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* Vitals Strip */}
              <div className="character-vitals-strip">
                <div className="character-ac-badge">
                  <Shield size={16} color="var(--primary)" style={{ marginBottom: '2px' }} />
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{char.ac}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '2px' }}>CA</div>
                </div>

                <div className="character-hp-monitor">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                      <Heart size={13} color={hpColor} /> Punti Ferita
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {charTempHp > 0 && (
                        <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700 }} title="Scudo Temporaneo">
                          +{charTempHp} Scudo
                        </span>
                      )}
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: hpColor }}>
                        {char.hpCurrent} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {char.hpMax}</span>
                      </span>
                    </div>
                  </div>

                  <div className="hp-unified-bar-track" style={{ height: '8px', margin: '4px 0 8px 0' }}>
                    <div
                      className="hp-unified-bar-base"
                      style={{
                        width: `${basePct}%`,
                        background: hpColor
                      }}
                    />
                    {charTempHp > 0 && (
                      <div
                        className="hp-unified-bar-shield"
                        style={{
                          width: `${shieldPct}%`
                        }}
                      />
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px' }}>
                    <button
                      onClick={() => handleApplyDamage(char.id, 5)}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}
                      title="Subisci 5 danni"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => handleApplyDamage(char.id, 1)}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}
                      title="Subisci 1 danno"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => handleApplyHeal(char.id, 1)}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}
                      title="Cura 1 HP"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleApplyHeal(char.id, 5)}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ padding: '2px 6px', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}
                      title="Cura 5 HP"
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>

              {/* 6 Ability Scores Preview */}
              <div className="dnd-stats-grid" style={{ gap: '6px' }}>
                {ABILITY_SCORES.map(s => {
                  const score = char.stats?.[s.key] ?? 10;
                  return (
                    <div key={s.key} className="dnd-compact-stat">
                      <div style={{ fontSize: '0.62rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.5px' }}>{s.short}</div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', margin: '1px 0' }}>{formatModifier(getAbilityModifier(score))}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{score}</div>
                    </div>
                  );
                })}
              </div>

              {/* Controller Info */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '2px 2px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <User size={12} /> Controllo:
                </span>
                <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
                  {char.isNpc ? 'Dungeon Master' : (char.user?.username || 'Non assegnato')}
                </span>
              </div>

              {/* Custom Properties */}
              <CustomPropertiesView properties={char.customProperties} isMaster={isMaster} />

              {/* Expand Sheet Button */}
              <button
                onClick={() => {
                  setSelectedDetailChar(char);
                  setDetailTab('stats');
                  setHpMiniTab('hp');
                  setHpDeltaInput('');
                  setShowAddTrait(false);
                  setDetailEditMode(false);
                  fetchCharacterDetail(char.id);
                }}
                className="grimoire-btn grimoire-btn-primary"
                style={{
                  width: '100%',
                  marginTop: 'auto',
                  gap: '8px',
                  padding: '9px',
                  fontSize: '0.84rem',
                  justifyContent: 'center',
                  background: char.isNpc ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, var(--primary), #7c3aed)'
                }}
              >
                <Maximize2 size={14} /> Espandi Scheda Completa
              </button>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: SCHEDA PERSONAGGIO COMPLETA ED IDENTICA CON EDIT INLINE            */}
      {/* ========================================================================= */}
      {selectedDetailChar && (
        <div className="modal-responsive-backdrop">
          <div
            className="glass-panel modal-responsive-content animate-fade-in"
            style={{
              maxWidth: '960px',
              border: selectedDetailChar.isNpc ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-glow)'
            }}
          >
            {/* Edit Mode Alert Banner */}
            {detailEditMode && (
              <div style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))',
                border: '1px solid rgba(139, 92, 246, 0.4)',
                borderRadius: '10px',
                padding: '8px 14px',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ fontSize: '0.82rem', color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Edit2 size={14} color="#fbbf24" /> Modalità Modifica attiva: modifica ogni singolo valore direttamente nella scheda.
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setDetailEditMode(false)} className="grimoire-btn grimoire-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }}>
                    Annulla
                  </button>
                  <button onClick={handleSaveDetailEdit} className="grimoire-btn grimoire-btn-primary" style={{ padding: '4px 14px', fontSize: '0.78rem', gap: '4px' }}>
                    <Save size={13} /> Salva Modifiche
                  </button>
                </div>
              </div>
            )}

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: selectedDetailChar.isNpc
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(236, 72, 153, 0.2))'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))',
                  border: selectedDetailChar.isNpc ? '2px solid rgba(245, 158, 11, 0.5)' : '2px solid var(--border-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {detailEditMode ? (
                    editAvatarUrl ? (
                      <img src={editAvatarUrl} alt={editName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.8rem' }}>{editIsNpc ? '👤' : '🧙‍♂️'}</span>
                    )
                  ) : selectedDetailChar.avatarUrl ? (
                    <img src={selectedDetailChar.avatarUrl} alt={selectedDetailChar.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.8rem' }}>{selectedDetailChar.isNpc ? '👤' : '🧙‍♂️'}</span>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  {detailEditMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          className="grimoire-input"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          placeholder="Nome personaggio"
                          style={{ fontWeight: 700, fontSize: '1.1rem', flex: '2 1 180px', height: '36px' }}
                        />
                        <input
                          className="grimoire-input"
                          value={editRace}
                          onChange={e => setEditRace(e.target.value)}
                          placeholder="Razza / Specie"
                          style={{ flex: '1 1 120px', height: '36px', fontSize: '0.88rem' }}
                        />
                        <input
                          className="grimoire-input"
                          value={editClass}
                          onChange={e => setEditClass(e.target.value)}
                          placeholder="Classe"
                          style={{ flex: '1 1 120px', height: '36px', fontSize: '0.88rem' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Liv.
                          <input
                            type="number"
                            min={1}
                            max={30}
                            className="grimoire-input"
                            value={editLevel}
                            onChange={e => setEditLevel(Number(e.target.value))}
                            style={{ width: '52px', height: '36px', textAlign: 'center', fontSize: '0.88rem', fontWeight: 700 }}
                          />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 700, margin: 0 }}>
                          {selectedDetailChar.name}
                        </h2>
                        <span className={`badge ${selectedDetailChar.isNpc ? 'badge-rarity-rare' : 'badge-rarity-uncommon'}`} style={{ fontSize: '0.75rem' }}>
                          {selectedDetailChar.isNpc ? 'NPC' : 'Personaggio Giocatore (PG)'}
                        </span>
                        {Number(selectedDetailChar.stats?.hpTemp || 0) > 0 && (
                          <span className="hp-temp-badge">
                            🛡️ Scudo: +{Number(selectedDetailChar.stats?.hpTemp)}
                          </span>
                        )}
                        {Number(selectedDetailChar.stats?.inspiration || 0) > 0 && (
                          <span className="badge badge-rarity-legendary" style={{ fontSize: '0.75rem' }}>
                            ✨ Ispirazione: {selectedDetailChar.stats?.inspiration}
                          </span>
                        )}
                      </div>

                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '2px' }}>
                        {selectedDetailChar.race || (selectedDetailChar.isNpc ? 'NPC' : 'Eroe')} {selectedDetailChar.class ? `• ${selectedDetailChar.class}` : ''} • Livello {selectedDetailChar.level}
                        {selectedDetailChar.stats?.alignment ? ` • ${selectedDetailChar.stats.alignment}` : ''}
                        {selectedDetailChar.stats?.background ? ` • ${selectedDetailChar.stats.background}` : ''}
                      </p>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {selectedDetailChar.faction && (
                          <span className="badge badge-rarity-uncommon" style={{ fontSize: '0.72rem' }}>
                            🏛️ {selectedDetailChar.faction}
                          </span>
                        )}
                        {selectedDetailChar.attitude && (
                          <span className="badge badge-rarity-common" style={{ fontSize: '0.72rem' }}>
                            Atteggiamento: {selectedDetailChar.attitude}
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} /> Controllo: <strong>{selectedDetailChar.isNpc ? 'Dungeon Master' : (selectedDetailChar.user?.username || 'Non assegnato')}</strong>
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Header Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(isMaster || selectedDetailChar.user?.id === user?.id) && (
                  detailEditMode ? (
                    <>
                      <button
                        onClick={handleSaveDetailEdit}
                        className="grimoire-btn grimoire-btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px' }}
                      >
                        <Save size={15} /> Salva Modifiche
                      </button>
                      <button
                        onClick={() => setDetailEditMode(false)}
                        className="grimoire-btn grimoire-btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px' }}
                      >
                        <RotateCcw size={14} /> Annulla
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => openDetailEdit(selectedDetailChar)}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px' }}
                    >
                      <Edit2 size={15} /> Modifica Scheda
                    </button>
                  )
                )}
                <button
                  onClick={() => { setSelectedDetailChar(null); setDetailEditMode(false); }}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '7px' }}
                  title="Chiudi"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* TAB NAVIGATION: 4 SEZIONI ORDINATE E DISTINTE */}
            <div className="sheet-tabs-container">
              <button
                type="button"
                onClick={() => setDetailTab('stats')}
                className={`sheet-tab-button ${detailTab === 'stats' ? 'active' : ''}`}
              >
                <Sword size={16} /> 1. Statistiche & Combattimento
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('inventory')}
                className={`sheet-tab-button ${detailTab === 'inventory' ? 'active' : ''}`}
              >
                <Package size={16} /> 2. Possedimenti & Equipaggiamento
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('bio')}
                className={`sheet-tab-button ${detailTab === 'bio' ? 'active' : ''}`}
              >
                <BookOpen size={16} /> 3. Profilo & Background
              </button>
              {isMaster && (
                <button
                  type="button"
                  onClick={() => setDetailTab('dm')}
                  className={`sheet-tab-button ${detailTab === 'dm' ? 'active' : ''}`}
                  style={detailTab === 'dm' ? { borderColor: 'rgba(239,68,68,0.6)', color: '#f87171' } : { color: '#f87171', opacity: 0.8 }}
                >
                  <Lock size={16} /> 4. Note DM (Riservato)
                </button>
              )}
            </div>

            {/* ========================================================================= */}
            {/* SEZIONE 1: STATISTICHE BASE & COMBATTIMENTO                               */}
            {/* ========================================================================= */}
            {detailTab === 'stats' && (
              <div>
                {/* Core Vitals HUD */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))',
                  gap: '12px',
                  marginBottom: '20px'
                }}>
                  {/* CA */}
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Shield size={20} color="#60a5fa" style={{ marginBottom: '2px' }} />
                    {detailEditMode ? (
                      <input
                        type="number"
                        min={1}
                        className="grimoire-input"
                        value={editAc}
                        onChange={e => setEditAc(Number(e.target.value))}
                        style={{ width: '60px', height: '32px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 800 }}
                      />
                    ) : (
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{selectedDetailChar.ac}</div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600, marginTop: '2px' }}>CLASSE ARMATURA</div>
                  </div>

                  {/* Iniziativa */}
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Zap size={20} color="#fbbf24" style={{ marginBottom: '2px' }} />
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                      {formatModifier(getAbilityModifier(detailEditMode ? editDex : (selectedDetailChar.stats?.dex ?? 10)))}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 600, marginTop: '2px' }}>INIZIATIVA (DES)</div>
                  </div>

                  {/* Bonus Competenza */}
                  <div style={{
                    background: 'rgba(168, 85, 247, 0.08)',
                    border: '1px solid rgba(168, 85, 247, 0.25)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Award size={20} color="#c084fc" style={{ marginBottom: '2px' }} />
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                      +{getProficiencyBonus(detailEditMode ? editLevel : selectedDetailChar.level)}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#e9d5ff', fontWeight: 600, marginTop: '2px' }}>BONUS COMPETENZA</div>
                  </div>

                  {/* Velocità */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Compass size={20} color="#34d399" style={{ marginBottom: '2px' }} />
                    {detailEditMode ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <input
                          type="number"
                          min={0}
                          className="grimoire-input"
                          value={editSpeed}
                          onChange={e => setEditSpeed(Number(e.target.value))}
                          style={{ width: '50px', height: '32px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 800 }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>m</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                        {selectedDetailChar.stats?.speed ?? 9} m
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 600, marginTop: '2px' }}>VELOCITÀ</div>
                  </div>

                  {/* Dadi Vita */}
                  <div style={{
                    background: 'rgba(236, 72, 153, 0.08)',
                    border: '1px solid rgba(236, 72, 153, 0.25)',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Heart size={20} color="#f472b6" style={{ marginBottom: '2px' }} />
                    {detailEditMode ? (
                      <input
                        className="grimoire-input"
                        value={editHitDice}
                        onChange={e => setEditHitDice(e.target.value)}
                        placeholder="1d8"
                        style={{ width: '64px', height: '32px', textAlign: 'center', fontSize: '1rem', fontWeight: 800 }}
                      />
                    ) : (
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                        {selectedDetailChar.level}{selectedDetailChar.stats?.hitDice || 'd8'}
                      </div>
                    )}
                    <div style={{ fontSize: '0.72rem', color: '#fbcfe8', fontWeight: 600, marginTop: '2px' }}>DADI VITA</div>
                  </div>

                  {/* Ispirazione */}
                  {(() => {
                    const currentInsp = Number(selectedDetailChar.stats?.inspiration || 0);
                    const canEdit = isMaster || selectedDetailChar.user?.id === user?.id;

                    return (
                      <div style={{
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '12px',
                        padding: '10px 8px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: currentInsp > 0 ? '0 0 15px rgba(245, 158, 11, 0.15)' : 'none'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          <Sparkles size={18} color="#fbbf24" />
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                            {currentInsp}/4
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#fde68a', fontWeight: 700, letterSpacing: '0.3px', textTransform: 'uppercase' }}>
                          ISPIRAZIONE
                        </div>

                        <div className="inspiration-token-row">
                          {[1, 2, 3, 4].map(idx => {
                            const isActive = currentInsp >= idx;
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  if (!canEdit) return;
                                  const nextVal = currentInsp === idx ? idx - 1 : idx;
                                  handleSetInspiration(selectedDetailChar.id, nextVal);
                                }}
                                className={`inspiration-dot ${isActive ? 'active' : ''}`}
                                title={`Punto Ispirazione ${idx} (Clicca per impostare)`}
                                style={{ cursor: canEdit ? 'pointer' : 'default' }}
                              >
                                {isActive ? '★' : ''}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* HP & Scudo HUD */}
                {(() => {
                  const charTempHp = Number(selectedDetailChar.stats?.hpTemp || 0);
                  const effectiveTotal = Math.max(detailEditMode ? editHpMax : selectedDetailChar.hpMax, selectedDetailChar.hpCurrent + charTempHp);
                  const basePct = effectiveTotal > 0 ? Math.min(100, Math.max(0, (selectedDetailChar.hpCurrent / effectiveTotal) * 100)) : 0;
                  const shieldPct = effectiveTotal > 0 ? Math.min(100 - basePct, Math.max(0, (charTempHp / effectiveTotal) * 100)) : 0;

                  const maxHpVal = detailEditMode ? editHpMax : selectedDetailChar.hpMax;
                  const hpRatio = maxHpVal > 0 ? Math.max(0, Math.min(100, (selectedDetailChar.hpCurrent / maxHpVal) * 100)) : 0;
                  const hpColor = hpRatio > 50 ? '#10b981' : hpRatio > 25 ? '#f59e0b' : '#ef4444';

                  return (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(148, 163, 184, 0.15)',
                      borderRadius: '14px',
                      padding: '16px',
                      marginBottom: '22px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ❤️ {selectedDetailChar.hpCurrent}
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>/</span>
                            {detailEditMode ? (
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                HP Max:
                                <input
                                  type="number"
                                  min={1}
                                  className="grimoire-input"
                                  value={editHpMax}
                                  onChange={e => setEditHpMax(Number(e.target.value))}
                                  style={{ width: '64px', height: '30px', textAlign: 'center', fontSize: '0.95rem', fontWeight: 700 }}
                                />
                              </label>
                            ) : (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 400 }}>{selectedDetailChar.hpMax} HP</span>
                            )}
                          </span>
                          {charTempHp > 0 && (
                            <span className="hp-temp-badge" style={{ fontSize: '0.82rem', padding: '3px 10px' }}>
                              🛡️ +{charTempHp} Scudo Blu
                            </span>
                          )}
                        </div>

                        <div className="hp-mini-tabs">
                          <button
                            type="button"
                            onClick={() => {
                              setHpMiniTab('hp');
                              setHpDeltaInput('');
                            }}
                            className={`hp-mini-tab-btn ${hpMiniTab === 'hp' ? 'active-hp' : ''}`}
                          >
                            <Heart size={13} fill="#ef4444" color="#ef4444" /> Punti Ferita
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setHpMiniTab('temp');
                              setHpDeltaInput('');
                            }}
                            className={`hp-mini-tab-btn ${hpMiniTab === 'temp' ? 'active-temp' : ''}`}
                          >
                            <Shield size={13} color="#38bdf8" /> Scudo Temporaneo ({charTempHp})
                          </button>
                        </div>
                      </div>

                      <div className="hp-unified-bar-wrap" style={{ marginBottom: '14px' }}>
                        <div className="hp-unified-bar-track" style={{ height: '16px' }}>
                          <div
                            className="hp-unified-bar-base"
                            style={{
                              width: `${basePct}%`,
                              background: hpColor
                            }}
                            title={`HP Base: ${selectedDetailChar.hpCurrent}/${maxHpVal}`}
                          />
                          {charTempHp > 0 && (
                            <div
                              className="hp-unified-bar-shield"
                              style={{
                                width: `${shieldPct}%`
                              }}
                              title={`Scudo Temporaneo: +${charTempHp}`}
                            />
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          <span>0 HP</span>
                          <span style={{ display: 'flex', gap: '10px' }}>
                            <span style={{ color: hpColor, fontWeight: 600 }}>● {selectedDetailChar.hpCurrent} HP Base</span>
                            {charTempHp > 0 && <span style={{ color: '#38bdf8', fontWeight: 600 }}>🛡️ +{charTempHp} Scudo Blu</span>}
                          </span>
                          <span>{effectiveTotal} Max</span>
                        </div>
                      </div>

                      <div className="hp-action-box">
                        {hpMiniTab === 'hp' ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                                Modifica Punti Ferita
                              </span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                *In caso di danno, viene <strong>assorbito prima lo Scudo Blu</strong>
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                type="number"
                                min="1"
                                placeholder="Inserisci valore (es. 5)..."
                                value={hpDeltaInput}
                                onChange={e => setHpDeltaInput(e.target.value)}
                                className="grimoire-input"
                                style={{ flex: '1 1 180px', height: '38px', fontSize: '0.9rem' }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    const val = parseInt(hpDeltaInput, 10);
                                    if (val > 0) {
                                      handleApplyDamage(selectedDetailChar.id, val);
                                      setHpDeltaInput('');
                                    }
                                  }
                                }}
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  const val = parseInt(hpDeltaInput, 10);
                                  if (val > 0) {
                                    handleApplyDamage(selectedDetailChar.id, val);
                                    setHpDeltaInput('');
                                  }
                                }}
                                className="grimoire-btn grimoire-btn-danger"
                                style={{ height: '38px', padding: '0 16px', gap: '6px', fontSize: '0.85rem', fontWeight: 700 }}
                              >
                                - Togli (Danno)
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const val = parseInt(hpDeltaInput, 10);
                                  if (val > 0) {
                                    handleApplyHeal(selectedDetailChar.id, val);
                                    setHpDeltaInput('');
                                  }
                                }}
                                className="grimoire-btn"
                                style={{ height: '38px', padding: '0 16px', gap: '6px', fontSize: '0.85rem', fontWeight: 700, background: '#10b981', color: '#fff' }}
                              >
                                + Aggiungi (Cura)
                              </button>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '4px' }}>Rapidi:</span>
                              {[-10, -5, -1].map(d => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => handleApplyDamage(selectedDetailChar.id, Math.abs(d))}
                                  className="grimoire-btn grimoire-btn-secondary"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#f87171' }}
                                >
                                  {d}
                                </button>
                              ))}
                              {[+1, +5, +10].map(d => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => handleApplyHeal(selectedDetailChar.id, d)}
                                  className="grimoire-btn grimoire-btn-secondary"
                                  style={{ padding: '3px 8px', fontSize: '0.75rem', color: '#34d399' }}
                                >
                                  +{d}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                🛡️ Gestione Scudo Punti Ferita Temporanei
                              </span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                                Scudo attuale: <strong style={{ color: '#38bdf8' }}>+{charTempHp}</strong>
                              </span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                              <input
                                type="number"
                                min="0"
                                placeholder="Quantità scudo..."
                                value={hpDeltaInput}
                                onChange={e => setHpDeltaInput(e.target.value)}
                                className="grimoire-input"
                                style={{ flex: '1 1 180px', height: '38px', fontSize: '0.9rem', borderColor: 'rgba(6, 182, 212, 0.4)' }}
                              />

                              <button
                                type="button"
                                onClick={() => {
                                  const val = parseInt(hpDeltaInput, 10);
                                  if (!isNaN(val)) {
                                    handleSetTempHp(selectedDetailChar.id, val);
                                    setHpDeltaInput('');
                                  }
                                }}
                                className="grimoire-btn"
                                style={{ height: '38px', padding: '0 16px', gap: '6px', fontSize: '0.85rem', fontWeight: 700, background: '#0284c7', color: '#fff' }}
                              >
                                🛡️ Imposta Scudo
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const val = parseInt(hpDeltaInput, 10);
                                  if (val > 0) {
                                    handleSetTempHp(selectedDetailChar.id, charTempHp + val);
                                    setHpDeltaInput('');
                                  }
                                }}
                                className="grimoire-btn grimoire-btn-secondary"
                                style={{ height: '38px', padding: '0 14px', gap: '4px', fontSize: '0.82rem' }}
                              >
                                + Aggiungi
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetTempHp(selectedDetailChar.id, 0)}
                                className="grimoire-btn grimoire-btn-secondary"
                                style={{ height: '38px', padding: '0 12px', fontSize: '0.78rem', color: 'var(--accent-crimson)', gap: '4px' }}
                                title="Azzera Scudo Temporaneo"
                              >
                                <RotateCcw size={13} /> Azzera Scudo
                              </button>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '4px' }}>Rapidi Scudo:</span>
                              {[5, 10, 15].map(d => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => handleSetTempHp(selectedDetailChar.id, d)}
                                  className="grimoire-btn grimoire-btn-secondary"
                                  style={{ padding: '3px 10px', fontSize: '0.75rem', color: '#38bdf8' }}
                                >
                                  Imposta {d}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Armi Equipaggiate & Combattimento */}
                {(() => {
                  const equippedIds = selectedDetailChar.stats?.equippedItemIds || [];
                  const equippedWeapons = (selectedDetailChar.items || []).filter(item => equippedIds.includes(item.id));
                  const pb = getProficiencyBonus(detailEditMode ? editLevel : selectedDetailChar.level);
                  const strVal = detailEditMode ? editStr : (selectedDetailChar.stats?.str ?? 10);
                  const dexVal = detailEditMode ? editDex : (selectedDetailChar.stats?.dex ?? 10);
                  const strMod = getAbilityModifier(strVal);
                  const dexMod = getAbilityModifier(dexVal);

                  return (
                    <div style={{
                      background: 'rgba(15, 23, 42, 0.85)',
                      border: '1px solid rgba(139, 92, 246, 0.25)',
                      borderRadius: '14px',
                      padding: '16px',
                      marginBottom: '22px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Sword size={18} color="var(--primary)" />
                          <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                            Combattimento & Armi Equipaggiate
                          </h4>
                          <span className="badge badge-rarity-rare" style={{ fontSize: '0.72rem' }}>
                            {equippedWeapons.length} {equippedWeapons.length === 1 ? 'Arma' : 'Armi'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDetailTab('inventory')}
                          className="grimoire-btn grimoire-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
                        >
                          <Package size={12} /> Gestisci nei Possedimenti
                        </button>
                      </div>

                      {equippedWeapons.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                          {equippedWeapons.map(weapon => {
                            const isRangedOrFinesse =
                              weapon.type?.toLowerCase().includes('distanza') ||
                              weapon.type?.toLowerCase().includes('arco') ||
                              weapon.name.toLowerCase().includes('arco') ||
                              weapon.name.toLowerCase().includes('balestra') ||
                              weapon.name.toLowerCase().includes('pugnale') ||
                              weapon.name.toLowerCase().includes('stocco') ||
                              weapon.description?.toLowerCase().includes('accurata') ||
                              weapon.description?.toLowerCase().includes('finesse');

                            const attackMod = isRangedOrFinesse ? Math.max(strMod, dexMod) : strMod;
                            const attackBonus = attackMod + pb;

                            return (
                              <div key={weapon.id} className="equipped-weapon-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                  <div>
                                    <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                                      {weapon.name}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                                      {weapon.type || 'Arma'} {weapon.rarity ? `• ${weapon.rarity}` : ''}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleEquipItem(selectedDetailChar.id, weapon.id)}
                                    className="grimoire-btn grimoire-btn-secondary"
                                    style={{ padding: '3px 8px', fontSize: '0.7rem', color: '#f87171' }}
                                    title="Riponi nello zaino"
                                  >
                                    Riponi
                                  </button>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  <span className="weapon-attack-badge" title="Tiro per colpire (Attacco)">
                                    <Crosshair size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                    {formatModifier(attackBonus)} TXC
                                  </span>

                                  <span className="weapon-damage-badge" title="Danno stimato con caratteristica">
                                    ⚔️ Danno: {formatModifier(attackMod)}
                                  </span>
                                </div>

                                {weapon.description && (
                                  <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                                    {weapon.description}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px dashed rgba(255,255,255,0.12)',
                          borderRadius: '10px',
                          padding: '16px',
                          textAlign: 'center'
                        }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 10px 0' }}>
                            Nessuna arma attualmente equipaggiata per il combattimento.
                          </p>
                          <button
                            type="button"
                            onClick={() => setDetailTab('inventory')}
                            className="grimoire-btn grimoire-btn-primary"
                            style={{ fontSize: '0.8rem', padding: '6px 14px', gap: '6px' }}
                          >
                            <Package size={14} /> Vai a Possedimenti & Equipaggia un'Arma
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 6 Caratteristiche & Tiri Salvezza */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={18} color="var(--primary)" /> 6 Caratteristiche & Tiri Salvezza D&D 5.5
                  </h4>

                  <div className="dnd-stats-grid" style={{ marginBottom: '12px' }}>
                    {ABILITY_SCORES.map(stat => {
                      const score = detailEditMode
                        ? (stat.key === 'str' ? editStr :
                           stat.key === 'dex' ? editDex :
                           stat.key === 'con' ? editCon :
                           stat.key === 'int' ? editInt :
                           stat.key === 'wis' ? editWis : editCha)
                        : (selectedDetailChar.stats?.[stat.key] ?? 10);

                      const setScore = (val: number) => {
                        if (stat.key === 'str') setEditStr(val);
                        else if (stat.key === 'dex') setEditDex(val);
                        else if (stat.key === 'con') setEditCon(val);
                        else if (stat.key === 'int') setEditInt(val);
                        else if (stat.key === 'wis') setEditWis(val);
                        else setEditCha(val);
                      };

                      const mod = getAbilityModifier(score);
                      const isSaveProf = detailEditMode
                        ? Boolean(editSavingThrows[stat.key])
                        : Boolean(selectedDetailChar.stats?.savingThrows?.[stat.key]);

                      const pb = getProficiencyBonus(detailEditMode ? editLevel : selectedDetailChar.level);
                      const saveBonus = getSavingThrowBonus(score, isSaveProf, pb);

                      return (
                        <div
                          key={stat.key}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '12px',
                            padding: '12px 8px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                            {stat.short}
                          </span>
                          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                            {formatModifier(mod)}
                          </span>

                          {detailEditMode ? (
                            <input
                              type="number"
                              min={1}
                              max={30}
                              className="grimoire-input"
                              value={score}
                              onChange={e => setScore(Number(e.target.value))}
                              style={{ width: '48px', height: '28px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 700, padding: 0 }}
                            />
                          ) : (
                            <span style={{
                              fontSize: '0.8rem',
                              color: 'var(--text-muted)',
                              background: 'rgba(255,255,255,0.06)',
                              borderRadius: '12px',
                              padding: '1px 8px'
                            }}>
                              {score}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleToggleSaveInDetail(stat.key)}
                            className={`dnd-save-chip ${isSaveProf ? 'proficient' : ''}`}
                            style={{
                              width: '100%',
                              marginTop: '6px',
                              cursor: (isMaster || selectedDetailChar.user?.id === user?.id) ? 'pointer' : 'default',
                              border: isSaveProf ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)'
                            }}
                            title={`Tiro Salvezza ${stat.label} (Clicca per alternare competenza)`}
                          >
                            <span style={{ fontSize: '0.68rem', color: isSaveProf ? '#c084fc' : 'var(--text-muted)' }}>
                              Salvezza:
                            </span>
                            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isSaveProf ? '#fff' : 'var(--text-muted)' }}>
                              {formatModifier(saveBonus)}
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sensi Passivi */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '10px',
                  marginBottom: '24px'
                }}>
                  {(() => {
                    const pb = getProficiencyBonus(detailEditMode ? editLevel : selectedDetailChar.level);
                    const wisScore = detailEditMode ? editWis : (selectedDetailChar.stats?.wis ?? 10);
                    const intSc = detailEditMode ? editInt : (selectedDetailChar.stats?.int ?? 10);
                    const charSkills = detailEditMode ? editSkills : (selectedDetailChar.stats?.skills || {});

                    const percBonus = getSkillTotal(wisScore, charSkills['perception'] || 0, pb);
                    const insBonus = getSkillTotal(wisScore, charSkills['insight'] || 0, pb);
                    const invBonus = getSkillTotal(intSc, charSkills['investigation'] || 0, pb);

                    return (
                      <>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>👁️ Percezione Passiva:</span>
                          <strong style={{ fontSize: '1rem', color: '#fff' }}>{10 + percBonus}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>💡 Intuizione Passiva:</span>
                          <strong style={{ fontSize: '1rem', color: '#fff' }}>{10 + insBonus}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🔍 Indagare Passivo:</span>
                          <strong style={{ fontSize: '1rem', color: '#fff' }}>{10 + invBonus}</strong>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Tratti & Privilegi */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '22px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={18} color="#a855f7" />
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                        Tratti & Privilegi (Features & Traits)
                      </h4>
                      <span className="badge badge-rarity-uncommon" style={{ fontSize: '0.72rem' }}>
                        {(selectedDetailChar.stats?.traitsAndFeatures || []).length} Tratti
                      </span>
                    </div>

                    {(isMaster || selectedDetailChar.user?.id === user?.id) && (
                      <button
                        type="button"
                        onClick={() => setShowAddTrait(!showAddTrait)}
                        className="grimoire-btn grimoire-btn-primary"
                        style={{ padding: '5px 12px', fontSize: '0.78rem', gap: '5px' }}
                      >
                        <Plus size={14} /> {showAddTrait ? 'Chiudi' : 'Nuovo Tratto'}
                      </button>
                    )}
                  </div>

                  {showAddTrait && (
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <div className="responsive-form-row-2">
                        <input
                          className="grimoire-input"
                          placeholder="Nome privilegio (es. Azione Impetuosa, Scurovisione)..."
                          value={traitName}
                          onChange={e => setTraitName(e.target.value)}
                          style={{ height: '34px', fontSize: '0.85rem' }}
                        />
                        <select
                          className="grimoire-input"
                          value={traitSource}
                          onChange={e => setTraitSource(e.target.value)}
                          style={{ height: '34px', fontSize: '0.85rem' }}
                        >
                          <option value="Classe">Privilegio di Classe</option>
                          <option value="Razza">Tratto Razziale</option>
                          <option value="Background">Tratto di Background</option>
                          <option value="Talento">Talento / Feat</option>
                          <option value="Altro">Altro / Magico</option>
                        </select>
                      </div>

                      <textarea
                        className="grimoire-input"
                        rows={2}
                        placeholder="Descrizione ed effetti delle regole..."
                        value={traitDesc}
                        onChange={e => setTraitDesc(e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => setShowAddTrait(false)}
                          className="grimoire-btn grimoire-btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddTrait(selectedDetailChar.id)}
                          className="grimoire-btn grimoire-btn-primary"
                          style={{ padding: '4px 12px', fontSize: '0.78rem', gap: '4px' }}
                        >
                          <Save size={13} /> Salva Tratto
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedDetailChar.stats?.traitsAndFeatures && selectedDetailChar.stats.traitsAndFeatures.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedDetailChar.stats.traitsAndFeatures.map(trait => (
                        <div key={trait.id} className="trait-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '0.92rem', color: '#fff' }}>{trait.name}</strong>
                              {trait.source && (
                                <span className="badge badge-rarity-rare" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                                  {trait.source}
                                </span>
                              )}
                            </div>

                            {(isMaster || selectedDetailChar.user?.id === user?.id) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteTrait(selectedDetailChar.id, trait.id)}
                                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
                                title="Elimina tratto"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>

                          {trait.description && (
                            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {trait.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                      Nessun tratto o privilegio registrato.
                    </p>
                  )}
                </div>

                {/* Abilità Base D&D 5.5 */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={18} color="var(--accent-gold)" /> Abilità Base Dungeons & Dragons 5.5
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
                        Legenda: <span style={{ opacity: 0.6 }}>○ Nessuna</span> • <span style={{ color: '#c084fc' }}>● Competente (+PB)</span> • <span style={{ color: '#fbbf24' }}>★ Maestria (+2*PB)</span>. Clicca sul pallino per cambiare.
                      </p>
                    </div>

                    <div style={{ position: 'relative', width: '220px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                      <input
                        className="grimoire-input"
                        placeholder="Filtra abilità..."
                        value={skillFilter}
                        onChange={e => setSkillFilter(e.target.value)}
                        style={{ height: '32px', fontSize: '0.8rem', paddingLeft: '30px' }}
                      />
                    </div>
                  </div>

                  <div className="sheet-skills-container" style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
                    {DND_5_5_SKILLS.filter(s =>
                      s.name.toLowerCase().includes(skillFilter.toLowerCase()) ||
                      s.nameEn.toLowerCase().includes(skillFilter.toLowerCase()) ||
                      s.abilityLabel.toLowerCase().includes(skillFilter.toLowerCase())
                    ).map(skill => {
                      const pb = getProficiencyBonus(detailEditMode ? editLevel : selectedDetailChar.level);
                      const abilityScore = detailEditMode
                        ? (skill.ability === 'str' ? editStr :
                           skill.ability === 'dex' ? editDex :
                           skill.ability === 'con' ? editCon :
                           skill.ability === 'int' ? editInt :
                           skill.ability === 'wis' ? editWis : editCha)
                        : (selectedDetailChar.stats?.[skill.ability] ?? 10);

                      const charSkillProf = detailEditMode
                        ? (editSkills[skill.key] || 0)
                        : (selectedDetailChar.stats?.skills?.[skill.key] || 0);

                      const skillTotal = getSkillTotal(abilityScore, charSkillProf, pb);

                      return (
                        <div key={skill.key} className="sheet-skill-row">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              onClick={() => handleToggleSkillInDetail(skill.key)}
                              className={`skill-prof-dot ${
                                charSkillProf === 2
                                  ? 'skill-prof-expertise'
                                  : charSkillProf === 1
                                  ? 'skill-prof-proficient'
                                  : 'skill-prof-none'
                              }`}
                              style={{
                                cursor: (isMaster || selectedDetailChar.user?.id === user?.id) ? 'pointer' : 'default'
                              }}
                              title={
                                charSkillProf === 2
                                  ? 'Maestria / Expertise (+2x PB)'
                                  : charSkillProf === 1
                                  ? 'Competente (+PB)'
                                  : 'Nessuna competenza (clicca per impostare)'
                              }
                            >
                              {charSkillProf === 2 ? '★' : charSkillProf === 1 ? '●' : ''}
                            </div>

                            <div>
                              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                                {skill.name}
                              </span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                                ({skill.abilityLabel})
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: charSkillProf === 2
                                ? 'rgba(245, 158, 11, 0.15)'
                                : charSkillProf === 1
                                ? 'rgba(139, 92, 246, 0.15)'
                                : 'transparent',
                              color: charSkillProf === 2
                                ? '#fbbf24'
                                : charSkillProf === 1
                                ? '#c084fc'
                                : 'var(--text-muted)'
                            }}>
                              {charSkillProf === 2 ? 'Maestria' : charSkillProf === 1 ? 'Competente' : 'Base'}
                            </span>

                            <span style={{
                              fontSize: '1rem',
                              fontWeight: 800,
                              color: skillTotal > 0 ? '#34d399' : skillTotal < 0 ? '#f87171' : '#fff',
                              minWidth: '32px',
                              textAlign: 'right'
                            }}>
                              {formatModifier(skillTotal)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SEZIONE 2: POSSEDIMENTI, EQUIPAGGIAMENTO & MONETE                         */}
            {/* ========================================================================= */}
            {detailTab === 'inventory' && (
              <div>
                {/* Portamonete */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '22px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CoinsIcon size={20} color="#f59e0b" />
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '1.05rem', fontWeight: 700 }}>
                        Portamonete & Valute D&D
                      </h4>
                    </div>

                    <div style={{
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      color: '#fbbf24',
                      fontWeight: 700,
                      fontSize: '0.9rem'
                    }}>
                      🪙 Valore Complessivo: {calculateTotalGold(detailEditMode ? editCoins : selectedDetailChar.stats?.coins)} MO
                    </div>
                  </div>

                  <div className="dnd-coins-grid">
                    {[
                      { key: 'cp' as const, name: 'Rame (MR)', desc: '100 MR = 1 MO' },
                      { key: 'sp' as const, name: 'Argento (MA)', desc: '10 MA = 1 MO' },
                      { key: 'ep' as const, name: 'Electrum (ME)', desc: '2 ME = 1 MO' },
                      { key: 'gp' as const, name: 'Oro (MO)', desc: 'Moneta Standard' },
                      { key: 'pp' as const, name: 'Platino (MP)', desc: '1 MP = 10 MO' },
                    ].map(coin => {
                      const coinVal = detailEditMode
                        ? (editCoins[coin.key] || 0)
                        : (selectedDetailChar.stats?.coins?.[coin.key] || 0);

                      return (
                        <div key={coin.key} className={`dnd-coin-card ${coin.key}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{coin.name}</span>
                          </div>

                          {detailEditMode ? (
                            <input
                              type="number"
                              min="0"
                              className="grimoire-input"
                              value={editCoins[coin.key]}
                              onChange={e => setEditCoins(prev => ({ ...prev, [coin.key]: Math.max(0, Number(e.target.value)) }))}
                              style={{ margin: '4px 0', fontSize: '1.2rem', fontWeight: 800, textAlign: 'center' }}
                            />
                          ) : (
                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                              {coinVal}
                            </div>
                          )}

                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                            {coin.desc}
                          </div>

                          {(isMaster || selectedDetailChar.user?.id === user?.id) && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                type="button"
                                onClick={() => handleAdjustCoinsInDetail(coin.key, -1)}
                                className="grimoire-btn grimoire-btn-secondary"
                                style={{ padding: '2px', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}
                              >
                                -1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustCoinsInDetail(coin.key, +1)}
                                className="grimoire-btn grimoire-btn-secondary"
                                style={{ padding: '2px', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}
                              >
                                +1
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustCoinsInDetail(coin.key, +10)}
                                className="grimoire-btn grimoire-btn-secondary"
                                style={{ padding: '2px', fontSize: '0.7rem', flex: 1, justifyContent: 'center' }}
                              >
                                +10
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Oggetti in Dotazione */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={18} color="#f59e0b" /> Oggetti in Dotazione (Inventario Campagna)
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Spunta come "Equipaggiato" per abilitare nel tab Combattimento
                    </span>
                  </div>

                  {selectedDetailChar.items && selectedDetailChar.items.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
                      {selectedDetailChar.items.map(item => {
                        const isEquipped = (selectedDetailChar.stats?.equippedItemIds || []).includes(item.id);
                        const canEdit = isMaster || selectedDetailChar.user?.id === user?.id;

                        return (
                          <div
                            key={item.id}
                            style={{
                              background: isEquipped ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255,255,255,0.03)',
                              border: isEquipped ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                              borderRadius: '10px',
                              padding: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <span style={{ fontWeight: 700, color: '#fff', fontSize: '0.94rem' }}>{item.name}</span>
                              {item.rarity && (
                                <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                                  {item.rarity}
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                                {item.description}
                              </div>
                            )}

                            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem', color: '#94a3b8' }}>
                              {item.type && <span>🏷️ {item.type}</span>}
                              {item.weight != null && <span>⚖️ {item.weight} kg</span>}
                              {item.value && <span>🪙 {item.value}</span>}
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!canEdit) return;
                                  handleToggleEquipItem(selectedDetailChar.id, item.id);
                                }}
                                className={`grimoire-btn ${isEquipped ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                                style={{
                                  width: '100%',
                                  padding: '5px 10px',
                                  fontSize: '0.78rem',
                                  gap: '6px',
                                  justifyContent: 'center',
                                  cursor: canEdit ? 'pointer' : 'default'
                                }}
                                title="Alterna stato equipaggiato"
                              >
                                {isEquipped ? (
                                  <>
                                    <CheckCircle size={13} color="#34d399" />
                                    <span>⚔️ Equipaggiato</span>
                                  </>
                                ) : (
                                  <>
                                    <Circle size={13} />
                                    <span>Nello Zaino (Clicca per Equipaggiare)</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Nessun oggetto assegnato dall'inventario di campagna a questo eroe.
                    </p>
                  )}
                </div>

                {/* Note Libere Equipaggiamento */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '6px' }}>
                    NOTE LIBERE EQUIPAGGIAMENTO & ZAINO
                  </div>
                  {detailEditMode ? (
                    <textarea
                      className="grimoire-input"
                      rows={5}
                      value={editInventoryNotes}
                      onChange={e => setEditInventoryNotes(e.target.value)}
                      placeholder="Armature, abiti, strumenti speciali, pozioni, razioni, materiali per incantesimi..."
                      style={{ resize: 'vertical', width: '100%' }}
                    />
                  ) : selectedDetailChar.inventoryNotes ? (
                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                      {selectedDetailChar.inventoryNotes}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Nessuna nota aggiuntiva registrata.
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SEZIONE 3: PROFILO, BACKGROUND & DESCRIZIONE FISICA                       */}
            {/* ========================================================================= */}
            {detailTab === 'bio' && (
              <div>
                {/* Roleplay Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Background</div>
                    {detailEditMode ? (
                      <input
                        className="grimoire-input"
                        value={editBackground}
                        onChange={e => setEditBackground(e.target.value)}
                        placeholder="Accolito, Nobile, Soldato..."
                        style={{ marginTop: '4px', height: '32px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                        {selectedDetailChar.stats?.background || 'Non specificato'}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Allineamento</div>
                    {detailEditMode ? (
                      <input
                        className="grimoire-input"
                        value={editAlignment}
                        onChange={e => setEditAlignment(e.target.value)}
                        placeholder="Legale Buono, Caotico Neutrale..."
                        style={{ marginTop: '4px', height: '32px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                        {selectedDetailChar.stats?.alignment || 'Neutrale'}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Fazione / Organizzazione</div>
                    {detailEditMode ? (
                      <input
                        className="grimoire-input"
                        value={editFaction}
                        onChange={e => setEditFaction(e.target.value)}
                        placeholder="Gilda dei Ladri, Ordine dei Cavalieri..."
                        style={{ marginTop: '4px', height: '32px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                        {selectedDetailChar.faction || 'Nessuna'}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Attitudine</div>
                    {detailEditMode ? (
                      <input
                        className="grimoire-input"
                        value={editAttitude}
                        onChange={e => setEditAttitude(e.target.value)}
                        placeholder="Amichevole, Neutrale, Ostile..."
                        style={{ marginTop: '4px', height: '32px' }}
                      />
                    ) : (
                      <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 600, marginTop: '2px' }}>
                        {selectedDetailChar.attitude || 'Neutrale'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Descrizione Fisica */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(148, 163, 184, 0.15)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ color: '#fff', fontSize: '1.05rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={18} color="var(--primary)" /> Descrizione Fisica & Aspetto
                  </h4>

                  {detailEditMode ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="responsive-form-row-3">
                        <input className="grimoire-input" placeholder="Età" value={editAge} onChange={e => setEditAge(e.target.value)} />
                        <input className="grimoire-input" placeholder="Altezza" value={editHeight} onChange={e => setEditHeight(e.target.value)} />
                        <input className="grimoire-input" placeholder="Peso" value={editWeight} onChange={e => setEditWeight(e.target.value)} />
                      </div>
                      <div className="responsive-form-row-3">
                        <input className="grimoire-input" placeholder="Occhi" value={editEyes} onChange={e => setEditEyes(e.target.value)} />
                        <input className="grimoire-input" placeholder="Carnagione" value={editSkin} onChange={e => setEditSkin(e.target.value)} />
                        <input className="grimoire-input" placeholder="Capelli" value={editHair} onChange={e => setEditHair(e.target.value)} />
                      </div>
                      <textarea
                        className="grimoire-input"
                        rows={2}
                        placeholder="Descrizione visiva, cicatrici, tatuaggi, portamento..."
                        value={editAppearance}
                        onChange={e => setEditAppearance(e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Età</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedDetailChar.stats?.physical?.age || '—'}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Altezza</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedDetailChar.stats?.physical?.height || '—'}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Peso</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedDetailChar.stats?.physical?.weight || '—'}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Occhi</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedDetailChar.stats?.physical?.eyes || '—'}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Capelli</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedDetailChar.stats?.physical?.hair || '—'}</strong>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Carnagione</span>
                          <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{selectedDetailChar.stats?.physical?.skin || '—'}</strong>
                        </div>
                      </div>

                      {selectedDetailChar.stats?.physical?.appearance && (
                        <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '10px 12px', borderRadius: '8px' }}>
                          {selectedDetailChar.stats.physical.appearance}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 4 Pilastri di Gioco */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#c084fc', marginBottom: '6px' }}>🎭 TRATTI DELLA PERSONALITÀ</div>
                    {detailEditMode ? (
                      <textarea
                        className="grimoire-input"
                        rows={3}
                        value={editPersonalityTraits}
                        onChange={e => setEditPersonalityTraits(e.target.value)}
                        placeholder="Modo di parlare, abitudini, manie..."
                      />
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                        {selectedDetailChar.stats?.personality?.traits || 'Nessun tratto specificato.'}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px' }}>⚖️ IDEALI</div>
                    {detailEditMode ? (
                      <textarea
                        className="grimoire-input"
                        rows={3}
                        value={editIdeals}
                        onChange={e => setEditIdeals(e.target.value)}
                        placeholder="Ciò in cui crede fermamente..."
                      />
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                        {selectedDetailChar.stats?.personality?.ideals || 'Nessun ideale specificato.'}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', marginBottom: '6px' }}>🔗 LEGAMI</div>
                    {detailEditMode ? (
                      <textarea
                        className="grimoire-input"
                        rows={3}
                        value={editBonds}
                        onChange={e => setEditBonds(e.target.value)}
                        placeholder="Persone care, luoghi natii, debiti..."
                      />
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                        {selectedDetailChar.stats?.personality?.bonds || 'Nessun legame specificato.'}
                      </div>
                    )}
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', marginBottom: '6px' }}>💥 DIFETTI</div>
                    {detailEditMode ? (
                      <textarea
                        className="grimoire-input"
                        rows={3}
                        value={editFlaws}
                        onChange={e => setEditFlaws(e.target.value)}
                        placeholder="Vizi, debolezze, paure segrete..."
                      />
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                        {selectedDetailChar.stats?.personality?.flaws || 'Nessun difetto specificato.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Backstory */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    📖 BIOGRAFIA & STORIA DEL PERSONAGGIO
                  </div>
                  {detailEditMode ? (
                    <textarea
                      className="grimoire-input"
                      rows={5}
                      value={editBackstory}
                      onChange={e => setEditBackstory(e.target.value)}
                      placeholder="Origini, trascorsi, eventi chiave passati..."
                      style={{ width: '100%', resize: 'vertical' }}
                    />
                  ) : selectedDetailChar.stats?.personality?.backstory ? (
                    <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {selectedDetailChar.stats.personality.backstory}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Nessuna biografia registrata.
                    </span>
                  )}
                </div>

                {/* Custom Properties */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="#a855f7" /> Proprietà Custom
                  </h4>
                  {detailEditMode ? (
                    <CustomPropertiesEditor
                      properties={editCustomProperties}
                      onChange={setEditCustomProperties}
                      isMaster={isMaster}
                    />
                  ) : (
                    <CustomPropertiesView
                      properties={selectedDetailChar.customProperties}
                      isMaster={isMaster}
                    />
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* SEZIONE 4 (SOLO MASTER): NOTE DM, SEGRETI & RISERVATE                     */}
            {/* ========================================================================= */}
            {detailTab === 'dm' && isMaster && (
              <div>
                {/* Banner Riservato DM */}
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <Lock size={18} color="#f87171" />
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f87171' }}>SEZIONE RISERVATA AL DUNGEON MASTER</div>
                    <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '2px' }}>
                      Queste informazioni NON sono visibili ai giocatori. Usa questa sezione per segreti di trama, motivazioni nascoste, note di sessione e visibilità.
                    </div>
                  </div>
                </div>

                {/* Segreti di Trama */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ color: '#f87171', fontSize: '1.05rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🔴 Segreti di Trama
                  </h4>
                  {detailEditMode ? (
                    <textarea
                      className="grimoire-input"
                      rows={4}
                      value={editSecrets}
                      onChange={e => setEditSecrets(e.target.value)}
                      placeholder="Verità celata, doppie identità, legami con il cattivo, colpi di scena..."
                      style={{ fontSize: '0.88rem', borderColor: 'rgba(239, 68, 68, 0.4)', resize: 'vertical' }}
                    />
                  ) : (
                    <div style={{ fontSize: '0.9rem', color: '#fca5a5', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {selectedDetailChar.secrets || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Nessun segreto registrato. Clicca ✏️ Modifica per aggiungerne.</span>}
                    </div>
                  )}
                </div>

                {/* Note Libere DM */}
                <div style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ color: '#fbbf24', fontSize: '1.05rem', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📋 Note Libere DM
                  </h4>
                  {detailEditMode ? (
                    <textarea
                      className="grimoire-input"
                      rows={5}
                      value={editDmNotes}
                      onChange={e => setEditDmNotes(e.target.value)}
                      placeholder="Appunti di sessione, comportamenti, obiettivi nascosti, memo di trama..."
                      style={{ fontSize: '0.88rem', resize: 'vertical' }}
                    />
                  ) : (
                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {(selectedDetailChar.stats as any)?.dmNotes || <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Nessuna nota DM registrata. Clicca ✏️ Modifica per aggiungerne.</span>}
                    </div>
                  )}
                </div>

                {/* Impostazioni Master in Edit Mode: Avatar & Visibilità */}
                {detailEditMode && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(148, 163, 184, 0.15)',
                    borderRadius: '14px',
                    padding: '16px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <h4 style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>⚙️ Opzioni Master & Visibilità</h4>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Avatar URL</label>
                      <input
                        className="grimoire-input"
                        value={editAvatarUrl}
                        onChange={e => setEditAvatarUrl(e.target.value)}
                        placeholder="https://esempio.com/ritratto.jpg"
                        style={{ fontSize: '0.88rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editIsNpc}
                          onChange={e => setEditIsNpc(e.target.checked)}
                        />
                        Segna come NPC (Personaggio non giocante del Master)
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#fff', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editVisibility === 'PRIVATE_MASTER'}
                          onChange={e => setEditVisibility(e.target.checked ? 'PRIVATE_MASTER' : 'PUBLIC_PLAYERS')}
                        />
                        Nascondi scheda ai giocatori (Riservata al DM)
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Footer Action Bar in Edit Mode */}
            {detailEditMode && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <button type="button" onClick={() => setDetailEditMode(false)} className="grimoire-btn grimoire-btn-secondary" style={{ gap: '6px' }}>
                  <RotateCcw size={14} /> Annulla
                </button>
                <button type="button" onClick={handleSaveDetailEdit} className="grimoire-btn grimoire-btn-primary" style={{ gap: '6px' }}>
                  <Save size={15} /> Salva Modifiche Scheda
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FORM CREAZIONE NUOVO PERSONAGGIO                                   */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '780px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isNpc ? 'Nuova Scheda NPC' : 'Nuovo Personaggio Giocatore (PG)'}
              </h3>
              <button onClick={resetCreateForm} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewCharacter} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Type Switcher */}
              <div className="responsive-form-row-2">
                <button
                  type="button"
                  onClick={() => setIsNpc(false)}
                  className={`grimoire-btn ${!isNpc ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                  style={{ justifyContent: 'center', fontSize: '0.85rem', padding: '8px' }}
                >
                  <Shield size={15} /> PG Giocatore
                </button>
                <button
                  type="button"
                  onClick={() => setIsNpc(true)}
                  className={`grimoire-btn ${isNpc ? 'grimoire-btn-gold' : 'grimoire-btn-secondary'}`}
                  style={{ justifyContent: 'center', fontSize: '0.85rem', padding: '8px' }}
                >
                  <UserCheck size={15} /> NPC
                </button>
              </div>

              {/* Form Tab Switcher */}
              <div className="sheet-tabs-container" style={{ marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => setFormTab('stats')}
                  className={`sheet-tab-button ${formTab === 'stats' ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <Sword size={14} /> 1. Statistiche & D&D 5.5
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('inventory')}
                  className={`sheet-tab-button ${formTab === 'inventory' ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <Package size={14} /> 2. Monete & Inventario
                </button>
                <button
                  type="button"
                  onClick={() => setFormTab('bio')}
                  className={`sheet-tab-button ${formTab === 'bio' ? 'active' : ''}`}
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <BookOpen size={14} /> 3. Background & Descrizione
                </button>
              </div>

              {/* FORM TAB 1 */}
              {formTab === 'stats' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="responsive-form-row-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome *</label>
                      <input
                        className="grimoire-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Nome eroe o NPC"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Razza / Specie</label>
                      <input
                        className="grimoire-input"
                        value={race}
                        onChange={e => setRace(e.target.value)}
                        placeholder="Umano, Elfo, Nano, Tiefling..."
                      />
                    </div>
                  </div>

                  <div className="responsive-form-row-3">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Classe / Archetipo</label>
                      <input
                        className="grimoire-input"
                        value={charClass}
                        onChange={e => setCharClass(e.target.value)}
                        placeholder="Guerriero, Mago, Ladro..."
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Livello</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className="grimoire-input"
                        value={level}
                        onChange={e => setLevel(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Classe Armatura (CA)</label>
                      <input
                        type="number"
                        min="1"
                        className="grimoire-input"
                        value={ac}
                        onChange={e => setAc(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="responsive-form-row-4">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>HP Massimi</label>
                      <input
                        type="number"
                        min="1"
                        className="grimoire-input"
                        value={hpMax}
                        onChange={e => setHpMax(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>HP Attuali</label>
                      <input
                        type="number"
                        min="0"
                        className="grimoire-input"
                        value={hpCurrent}
                        onChange={e => setHpCurrent(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#38bdf8', marginBottom: '4px', fontWeight: 600 }}>
                        Temp HP (Scudo Blu)
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="grimoire-input"
                        value={hpTemp}
                        onChange={e => setHpTemp(Number(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#fbbf24', marginBottom: '4px', fontWeight: 600 }}>
                        Ispirazione (0-4)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="4"
                        className="grimoire-input"
                        value={inspiration}
                        onChange={e => setInspiration(Math.max(0, Math.min(4, Number(e.target.value))))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '6px' }}>
                      Punteggi Caratteristica (1 - 30) & Competenze Salvezza
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '8px' }}>
                      {[
                        { label: 'FOR', val: str, setVal: setStr, key: 'str' },
                        { label: 'DES', val: dex, setVal: setDex, key: 'dex' },
                        { label: 'COS', val: con, setVal: setCon, key: 'con' },
                        { label: 'INT', val: intScore, setVal: setIntScore, key: 'int' },
                        { label: 'SAG', val: wis, setVal: setWis, key: 'wis' },
                        { label: 'CAR', val: cha, setVal: setCha, key: 'cha' },
                      ].map(item => (
                        <div key={item.key} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>{item.label}</span>
                          <input
                            type="number"
                            min="1"
                            max="30"
                            className="grimoire-input"
                            value={item.val}
                            onChange={e => item.setVal(Number(e.target.value))}
                            style={{ textAlign: 'center', height: '32px', margin: '4px 0', fontSize: '0.95rem', fontWeight: 700 }}
                          />
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.68rem', color: savingThrows[item.key] ? '#c084fc' : 'var(--text-muted)', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(savingThrows[item.key])}
                              onChange={e => setSavingThrows(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            />
                            TS Prof
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        Competenze Abilità D&D 5.5
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Clicca sul badge per alternare: Nessuna ➔ Competente ➔ Maestria
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                      {DND_5_5_SKILLS.map(skill => {
                        const current = skills[skill.key] || 0;
                        return (
                          <div
                            key={skill.key}
                            onClick={() => {
                              const next: SkillProficiencyLevel = current === 0 ? 1 : current === 1 ? 2 : 0;
                              setSkills(prev => ({ ...prev, [skill.key]: next }));
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              background: current > 0 ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255,255,255,0.02)',
                              border: current === 2 ? '1px solid #f59e0b' : current === 1 ? '1px solid #8b5cf6' : '1px solid rgba(255,255,255,0.05)',
                              cursor: 'pointer'
                            }}
                          >
                            <span style={{ fontSize: '0.78rem', color: '#fff' }}>{skill.name}</span>
                            <span style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: current === 2 ? '#fbbf24' : current === 1 ? '#c084fc' : 'var(--text-muted)'
                            }}>
                              {current === 2 ? '★ Maestria' : current === 1 ? '● Comp' : '—'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* FORM TAB 2 */}
              {formTab === 'inventory' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '8px' }}>
                      Monete & Valute Personali
                    </label>
                    <div className="dnd-coins-grid">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Rame (MR)</label>
                        <input
                          type="number"
                          min="0"
                          className="grimoire-input"
                          value={coins.cp}
                          onChange={e => setCoins(prev => ({ ...prev, cp: Math.max(0, Number(e.target.value)) }))}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Argento (MA)</label>
                        <input
                          type="number"
                          min="0"
                          className="grimoire-input"
                          value={coins.sp}
                          onChange={e => setCoins(prev => ({ ...prev, sp: Math.max(0, Number(e.target.value)) }))}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Electrum (ME)</label>
                        <input
                          type="number"
                          min="0"
                          className="grimoire-input"
                          value={coins.ep}
                          onChange={e => setCoins(prev => ({ ...prev, ep: Math.max(0, Number(e.target.value)) }))}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#fbbf24', marginBottom: '3px', fontWeight: 600 }}>Oro (MO)</label>
                        <input
                          type="number"
                          min="0"
                          className="grimoire-input"
                          value={coins.gp}
                          onChange={e => setCoins(prev => ({ ...prev, gp: Math.max(0, Number(e.target.value)) }))}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: '#c084fc', marginBottom: '3px', fontWeight: 600 }}>Platino (MP)</label>
                        <input
                          type="number"
                          min="0"
                          className="grimoire-input"
                          value={coins.pp}
                          onChange={e => setCoins(prev => ({ ...prev, pp: Math.max(0, Number(e.target.value)) }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Note Equipaggiamento & Zaino
                    </label>
                    <textarea
                      className="grimoire-input"
                      rows={5}
                      value={inventoryNotes}
                      onChange={e => setInventoryNotes(e.target.value)}
                      placeholder="Armi equipaggiate, armature, strumenti da scasso, pozioni, razioni..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* FORM TAB 3 */}
              {formTab === 'bio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="responsive-form-row-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Background D&D</label>
                      <input
                        className="grimoire-input"
                        value={background}
                        onChange={e => setBackground(e.target.value)}
                        placeholder="Accolito, Nobile, Soldato, Criminale..."
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Allineamento</label>
                      <input
                        className="grimoire-input"
                        value={alignment}
                        onChange={e => setAlignment(e.target.value)}
                        placeholder="Legale Buono, Caotico Buono, Neutrale..."
                      />
                    </div>
                  </div>

                  <div className="responsive-form-row-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Fazione / Organizzazione</label>
                      <input
                        className="grimoire-input"
                        value={faction}
                        onChange={e => setFaction(e.target.value)}
                        placeholder="Es. Gilda dei Ladri, Guardie Cittadine..."
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Attitudine</label>
                      <input
                        className="grimoire-input"
                        value={attitude}
                        onChange={e => setAttitude(e.target.value)}
                        placeholder="Amichevole, Neutrale, Ostile..."
                      />
                    </div>
                  </div>

                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-cyan)', marginTop: '4px' }}>
                    Dettagli Fisici
                  </label>
                  <div className="responsive-form-row-3">
                    <input className="grimoire-input" value={age} onChange={e => setAge(e.target.value)} placeholder="Età" />
                    <input className="grimoire-input" value={height} onChange={e => setHeight(e.target.value)} placeholder="Altezza" />
                    <input className="grimoire-input" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Peso" />
                  </div>
                  <div className="responsive-form-row-3">
                    <input className="grimoire-input" value={eyes} onChange={e => setEyes(e.target.value)} placeholder="Occhi" />
                    <input className="grimoire-input" value={skin} onChange={e => setSkin(e.target.value)} placeholder="Carnagione" />
                    <input className="grimoire-input" value={hair} onChange={e => setHair(e.target.value)} placeholder="Capelli" />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descrizione Visiva / Aspetto</label>
                    <textarea
                      className="grimoire-input"
                      rows={2}
                      value={appearance}
                      onChange={e => setAppearance(e.target.value)}
                      placeholder="Cicatrici, tatuaggi, portamento, vestiario caratteristico..."
                    />
                  </div>

                  <div className="responsive-form-row-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Tratti della Personalità</label>
                      <textarea
                        className="grimoire-input"
                        rows={2}
                        value={personalityTraits}
                        onChange={e => setPersonalityTraits(e.target.value)}
                        placeholder="Modo di parlare, abitudini..."
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Ideali</label>
                      <textarea
                        className="grimoire-input"
                        rows={2}
                        value={ideals}
                        onChange={e => setIdeals(e.target.value)}
                        placeholder="Ciò in cui crede fermamente..."
                      />
                    </div>
                  </div>

                  <div className="responsive-form-row-2">
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Legami</label>
                      <textarea
                        className="grimoire-input"
                        rows={2}
                        value={bonds}
                        onChange={e => setBonds(e.target.value)}
                        placeholder="Persone care, debiti morali..."
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '3px' }}>Difetti</label>
                      <textarea
                        className="grimoire-input"
                        rows={2}
                        value={flaws}
                        onChange={e => setFlaws(e.target.value)}
                        placeholder="Vizi, debolezze..."
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Biografia / Backstory Completa</label>
                    <textarea
                      className="grimoire-input"
                      rows={3}
                      value={backstory}
                      onChange={e => setBackstory(e.target.value)}
                      placeholder="Origini del personaggio, eventi chiave passati..."
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Avatar URL</label>
                    <input
                      className="grimoire-input"
                      value={avatarUrl}
                      onChange={e => setAvatarUrl(e.target.value)}
                      placeholder="https://esempio.com/ritratto.jpg"
                    />
                  </div>

                  {isMaster && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#f87171', marginBottom: '4px', fontWeight: 600 }}>
                        Segreti Riservati al Master (Non visibili ai giocatori)
                      </label>
                      <textarea
                        className="grimoire-input"
                        rows={2}
                        value={secrets}
                        onChange={e => setSecrets(e.target.value)}
                        placeholder="Verità celata, doppie identità, legami con il cattivo di trama..."
                        style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}
                      />
                    </div>
                  )}

                  <CustomPropertiesEditor
                    properties={customProperties}
                    onChange={setCustomProperties}
                    isMaster={isMaster}
                  />
                </div>
              )}

              {/* Form Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <button type="button" onClick={resetCreateForm} className="grimoire-btn grimoire-btn-secondary">
                  Annulla
                </button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary" style={{ gap: '6px' }}>
                  <Save size={16} /> Crea Personaggio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
