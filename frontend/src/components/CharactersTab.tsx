import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import {
  Users,
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
  Package
} from 'lucide-react';
import { CustomPropertiesEditor, CustomPropertiesView, type CustomProperty } from './CustomPropertiesEditor';

interface Character {
  id: string;
  name: string;
  race?: string;
  class?: string;
  level: number;
  hpMax: number;
  hpCurrent: number;
  ac: number;
  stats?: {
    str?: number;
    dex?: number;
    con?: number;
    int?: number;
    wis?: number;
    cha?: number;
  } | Record<string, any>;
  customProperties?: CustomProperty[];
  inventoryNotes?: string;
  avatarUrl?: string;
  isNpc: boolean;
  visibility: 'PUBLIC_PLAYERS' | 'PRIVATE_MASTER';
  user?: { id: string; username: string };
  items?: Array<{
    id: string;
    name: string;
    rarity?: string;
    type?: string;
    value?: string;
    weight?: number;
    description?: string;
  }>;
}

export const CharactersTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [characters, setCharacters] = useState<Character[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [selectedDetailChar, setSelectedDetailChar] = useState<Character | null>(null);
  const [charSearch, setCharSearch] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [race, setRace] = useState('');
  const [charClass, setCharClass] = useState('');
  const [level, setLevel] = useState(1);
  const [hpMax, setHpMax] = useState(10);
  const [hpCurrent, setHpCurrent] = useState(10);
  const [ac, setAc] = useState(10);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC_PLAYERS' | 'PRIVATE_MASTER'>('PUBLIC_PLAYERS');
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([]);

  // 6 Core Ability Scores & Inventory Notes
  const [str, setStr] = useState(10);
  const [dex, setDex] = useState(10);
  const [con, setCon] = useState(10);
  const [intScore, setIntScore] = useState(10);
  const [wis, setWis] = useState(10);
  const [cha, setCha] = useState(10);
  const [inventoryNotes, setInventoryNotes] = useState('');

  const fetchCharacters = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/characters?campaignId=${activeCampaign.id}`);
      setCharacters(res.characters || []);
    } catch (err) {
      console.error('Failed to load characters', err);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [activeCampaign?.id]);

  const getModifier = (val: number = 10) => {
    const mod = Math.floor((val - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const getProficiencyBonus = (lvl: number = 1) => {
    return Math.floor((lvl - 1) / 4) + 2;
  };

  const resetForm = () => {
    setName('');
    setRace('');
    setCharClass('');
    setLevel(1);
    setHpMax(10);
    setHpCurrent(10);
    setAc(10);
    setAvatarUrl('');
    setVisibility('PUBLIC_PLAYERS');
    setCustomProperties([]);
    setStr(10);
    setDex(10);
    setCon(10);
    setIntScore(10);
    setWis(10);
    setCha(10);
    setInventoryNotes('');
    setEditingCharacter(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (char: Character) => {
    setEditingCharacter(char);
    setName(char.name);
    setRace(char.race || '');
    setCharClass(char.class || '');
    setLevel(char.level);
    setHpMax(char.hpMax);
    setHpCurrent(char.hpCurrent);
    setAc(char.ac);
    setAvatarUrl(char.avatarUrl || '');
    setVisibility(char.visibility || 'PUBLIC_PLAYERS');
    setCustomProperties(Array.isArray(char.customProperties) ? char.customProperties : []);
    const st = char.stats || {};
    setStr(st.str ?? 10);
    setDex(st.dex ?? 10);
    setCon(st.con ?? 10);
    setIntScore(st.int ?? 10);
    setWis(st.wis ?? 10);
    setCha(st.cha ?? 10);
    setInventoryNotes(char.inventoryNotes || '');
    setShowAddModal(false);
  };

  const handleSaveCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;

    const payload = {
      campaignId: activeCampaign.id,
      name,
      race,
      class: charClass,
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
        cha: Number(cha)
      },
      inventoryNotes,
      isNpc: false
    };

    try {
      if (editingCharacter) {
        const res = await apiFetch(`/characters/${editingCharacter.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setCharacters(prev => prev.map(c => c.id === editingCharacter.id ? res.character : c));
        if (selectedDetailChar?.id === editingCharacter.id) {
          setSelectedDetailChar(res.character);
        }
        setEditingCharacter(null);
      } else {
        const res = await apiFetch('/characters', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setCharacters(prev => [...prev, res.character]);
        setShowAddModal(false);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio personaggio');
    }
  };

  const handleAdjustHp = async (charId: string, delta: number) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;
    const newHp = Math.max(0, Math.min(char.hpMax, char.hpCurrent + delta));
    try {
      const res = await apiFetch(`/characters/${charId}`, {
        method: 'PUT',
        body: JSON.stringify({ hpCurrent: newHp })
      });
      setCharacters(prev => prev.map(c => c.id === charId ? res.character : c));
      if (selectedDetailChar?.id === charId) {
        setSelectedDetailChar(res.character);
      }
    } catch (err) {
      console.error('Failed to adjust HP', err);
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
      setCharacters(prev => prev.map(c => c.id === char.id ? res.character : c));
    } catch (err: any) {
      alert(err.message || 'Errore modifica visibilità');
    }
  };

  const handleDeleteCharacter = async (charId: string) => {
    if (!confirm('Eliminare definitivamente questo personaggio?')) return;
    try {
      await apiFetch(`/characters/${charId}`, { method: 'DELETE' });
      setCharacters(prev => prev.filter(c => c.id !== charId));
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione');
    }
  };

  const filteredCharacters = characters.filter(c => {
    if (!charSearch.trim()) return true;
    const q = charSearch.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
      c.race?.toLowerCase().includes(q) ||
      c.class?.toLowerCase().includes(q) ||
      c.user?.username?.toLowerCase().includes(q);
  });

  if (!activeCampaign) return null;

  return (
    <div className="grimoire-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users color="var(--primary)" /> Personaggi del Party
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Schede eroi, punti ferita, caratteristiche D&D, classe, livello, proprietà customizzate ed equipaggiamento.
          </p>
        </div>
        {isMaster && (
          <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Nuovo Personaggio
          </button>
        )}
      </div>

      {/* Characters Search & Count Toolbar */}
      <div className="toolbar-responsive">
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="grimoire-input"
            value={charSearch}
            onChange={e => setCharSearch(e.target.value)}
            placeholder="Cerca eroe per nome, razza, classe o giocatore..."
            style={{ paddingLeft: '36px', paddingRight: charSearch ? '30px' : '10px', height: '38px', fontSize: '0.9rem', width: '100%' }}
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
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          <strong>{filteredCharacters.length}</strong> {filteredCharacters.length === 1 ? 'personaggio trovato' : 'personaggi trovati'}
        </div>
      </div>

      <div className="responsive-grid-cards">
        {filteredCharacters.map(char => {
          const hpRatio = (char.hpCurrent / char.hpMax) * 100;
          const hpColor = hpRatio > 50 ? 'var(--accent-emerald)' : hpRatio > 25 ? 'var(--accent-gold)' : 'var(--accent-crimson)';

          return (
            <div key={char.id} className="glass-panel glass-panel-hover" style={{ position: 'relative', overflow: 'hidden' }}>
              {/* Header card */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', minWidth: 0 }}>
                <div style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))',
                  border: '1px solid var(--border-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {char.avatarUrl ? (
                    <img src={char.avatarUrl} alt={char.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.4rem' }}>🧙‍♂️</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name}</h3>
                    {isMaster && (
                      <button
                        onClick={() => handleToggleVisibility(char)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={char.visibility === 'PRIVATE_MASTER' ? 'Privato al Master (clicca per rendere pubblico)' : 'Pubblico per tutti i player (clicca per nascondere)'}
                      >
                        {char.visibility === 'PRIVATE_MASTER' ? (
                          <span className="badge badge-rarity-legendary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <EyeOff size={11} /> DM Only
                          </span>
                        ) : (
                          <span className="badge badge-rarity-uncommon" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Eye size={11} /> Pubblico
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {char.race || 'Eroe'} {char.class || 'Avventuriero'} • Liv. {char.level}
                  </p>
                </div>
                {isMaster && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openEditModal(char)}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ padding: '6px', fontSize: '0.8rem' }}
                      title="Modifica Personaggio"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCharacter(char.id)}
                      className="grimoire-btn grimoire-btn-danger"
                      style={{ padding: '6px', fontSize: '0.8rem' }}
                      title="Elimina Personaggio"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Stats & Armor Class */}
              <div className="responsive-form-row-2" style={{ gap: '8px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={16} color="var(--primary)" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Classe Armatura</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{char.ac}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={16} color="var(--accent-gold)" />
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Giocatore</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{char.user?.username || 'Non assegnato'}</div>
                  </div>
                </div>
              </div>

              {/* HP Bar & Interactive Controls */}
              <div style={{ background: 'rgba(10, 14, 24, 0.8)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Heart size={14} color={hpColor} /> Punti Ferita (HP)
                  </span>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: hpColor }}>
                    {char.hpCurrent} / {char.hpMax}
                  </span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div style={{ height: '100%', width: `${hpRatio}%`, background: hpColor, transition: 'width 0.3s ease' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button onClick={() => handleAdjustHp(char.id, -5)} className="grimoire-btn grimoire-btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>-5</button>
                  <button onClick={() => handleAdjustHp(char.id, -1)} className="grimoire-btn grimoire-btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>-1</button>
                  <button onClick={() => handleAdjustHp(char.id, +1)} className="grimoire-btn grimoire-btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>+1</button>
                  <button onClick={() => handleAdjustHp(char.id, +5)} className="grimoire-btn grimoire-btn-secondary" style={{ padding: '3px 8px', fontSize: '0.75rem' }}>+5</button>
                </div>
              </div>

              {/* Mini 6-Ability Scores Strip */}
              <div
                className="dnd-stats-grid"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '14px',
                  textAlign: 'center'
                }}
              >
                {[
                  { label: 'FOR', val: char.stats?.str ?? 10 },
                  { label: 'DES', val: char.stats?.dex ?? 10 },
                  { label: 'COS', val: char.stats?.con ?? 10 },
                  { label: 'INT', val: char.stats?.int ?? 10 },
                  { label: 'SAG', val: char.stats?.wis ?? 10 },
                  { label: 'CAR', val: char.stats?.cha ?? 10 }
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--accent-gold)', fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{s.val}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{getModifier(s.val)}</div>
                  </div>
                ))}
              </div>

              {/* Custom Properties */}
              <CustomPropertiesView properties={char.customProperties} isMaster={isMaster} />

              {/* Inventory items preview */}
              {char.items && char.items.length > 0 && (
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Oggetti in dotazione ({char.items.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {char.items.map(item => (
                      <span key={item.id} className="badge badge-rarity-uncommon" style={{ fontSize: '0.75rem' }}>
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Expand Full Sheet Button */}
              <button
                onClick={() => setSelectedDetailChar(char)}
                className="grimoire-btn grimoire-btn-primary"
                style={{
                  width: '100%',
                  marginTop: '16px',
                  gap: '8px',
                  padding: '9px',
                  fontSize: '0.85rem',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, var(--primary), #7c3aed)'
                }}
              >
                <Maximize2 size={15} /> Espandi Scheda Completa
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Character */}
      {(showAddModal || editingCharacter) && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>
                {editingCharacter ? 'Modifica Personaggio' : 'Crea Scheda Personaggio'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCharacter} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome Personaggio</label>
                <input className="grimoire-input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Elidor delle Ombre" required />
              </div>
              <div className="responsive-form-row-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Razza</label>
                  <input className="grimoire-input" value={race} onChange={e => setRace(e.target.value)} placeholder="es. Elfo, Umano, Tiefling" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Classe</label>
                  <input className="grimoire-input" value={charClass} onChange={e => setCharClass(e.target.value)} placeholder="es. Mago, Guerriero, Ladro" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Livello</label>
                  <input type="number" min="1" className="grimoire-input" value={level} onChange={e => setLevel(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>HP Max</label>
                  <input type="number" min="1" className="grimoire-input" value={hpMax} onChange={e => setHpMax(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>HP Attuali</label>
                  <input type="number" min="0" className="grimoire-input" value={hpCurrent} onChange={e => setHpCurrent(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>CA</label>
                  <input type="number" min="1" className="grimoire-input" value={ac} onChange={e => setAc(Number(e.target.value))} />
                </div>
              </div>
              <div className="responsive-form-row-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Avatar URL (opzionale)</label>
                  <input className="grimoire-input" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Visibilità</label>
                  <select
                    className="grimoire-select"
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as any)}
                  >
                    <option value="PUBLIC_PLAYERS">Pubblico ai Giocatori</option>
                    <option value="PRIVATE_MASTER">Segreto DM (Privato)</option>
                  </select>
                </div>
              </div>

              {/* Caratteristiche RPG (Ability Scores) */}
              <div style={{ marginTop: '6px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Caratteristiche & Modificatori
                </label>
                <div className="dnd-stats-grid" style={{ textAlign: 'center' }}>
                  {[
                    { label: 'FOR', val: str, setter: setStr },
                    { label: 'DES', val: dex, setter: setDex },
                    { label: 'COS', val: con, setter: setCon },
                    { label: 'INT', val: intScore, setter: setIntScore },
                    { label: 'SAG', val: wis, setter: setWis },
                    { label: 'CAR', val: cha, setter: setCha }
                  ].map(stat => (
                    <div key={stat.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '6px 4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>{stat.label}</div>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        className="grimoire-input"
                        style={{ textAlign: 'center', padding: '4px 2px', fontSize: '0.9rem', marginTop: '3px' }}
                        value={stat.val}
                        onChange={e => stat.setter(Number(e.target.value))}
                      />
                      <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary, #6366f1)', fontWeight: 600, marginTop: '2px' }}>
                        {getModifier(stat.val)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Note Inventario & Monete */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Note Inventario & Monete
                </label>
                <textarea
                  className="grimoire-input"
                  style={{ minHeight: '60px', resize: 'vertical' }}
                  value={inventoryNotes}
                  onChange={e => setInventoryNotes(e.target.value)}
                  placeholder="Monete d'oro, equipaggiamento speciale, zaino..."
                />
              </div>

              {/* Custom Properties Editor */}
              <CustomPropertiesEditor
                properties={customProperties}
                onChange={setCustomProperties}
                isMaster={isMaster}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={resetForm} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">
                  {editingCharacter ? 'Salva Modifiche' : 'Crea Personaggio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE SCHEDA DETTAGLIATA (EXPANDED CHARACTER SHEET) */}
      {selectedDetailChar && (
        <div
          className="modal-responsive-backdrop animate-fade-in"
          onClick={() => setSelectedDetailChar(null)}
        >
          <div
            className="glass-panel modal-responsive-content"
            style={{
              maxWidth: '880px',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header Personaggio */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {selectedDetailChar.avatarUrl ? (
                  <img
                    src={selectedDetailChar.avatarUrl}
                    alt={selectedDetailChar.name}
                    style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-primary, #6366f1)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '2px solid rgba(99, 102, 241, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-primary, #6366f1)'
                    }}
                  >
                    <Users size={36} />
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {selectedDetailChar.name}
                    </h2>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      background: selectedDetailChar.visibility === 'PUBLIC_PLAYERS' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: selectedDetailChar.visibility === 'PUBLIC_PLAYERS' ? '#10b981' : '#ef4444',
                      border: `1px solid ${selectedDetailChar.visibility === 'PUBLIC_PLAYERS' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`
                    }}>
                      {selectedDetailChar.visibility === 'PUBLIC_PLAYERS' ? 'Pubblico' : 'Privato DM'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '1rem' }}>
                    {selectedDetailChar.race || 'Razza N/D'} • {selectedDetailChar.class || 'Classe N/D'} • <strong>Livello {selectedDetailChar.level}</strong>
                  </p>
                  {selectedDetailChar.user && (
                    <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                      Giocatore: <strong>{selectedDetailChar.user.username}</strong>
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(isMaster || selectedDetailChar.user?.id === user?.id) && (
                  <button
                    onClick={() => {
                      const charToEdit = selectedDetailChar;
                      setSelectedDetailChar(null);
                      openEditModal(charToEdit);
                    }}
                    className="grimoire-btn grimoire-btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                  >
                    <Edit2 size={15} /> Modifica
                  </button>
                )}
                <button
                  onClick={() => setSelectedDetailChar(null)}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Combat & Vitality HUD */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {/* Box HP con controlli rapidi */}
              <div style={{
                gridColumn: 'span 2',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                    <Heart size={16} fill="#ef4444" color="#ef4444" /> PUNTI FERITA (HP)
                  </span>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
                    {selectedDetailChar.hpCurrent} <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ {selectedDetailChar.hpMax}</span>
                  </span>
                </div>
                {/* HP Bar */}
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', margin: '8px 0' }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, (selectedDetailChar.hpCurrent / selectedDetailChar.hpMax) * 100))}%`,
                    height: '100%',
                    background: (selectedDetailChar.hpCurrent / selectedDetailChar.hpMax) > 0.5 ? '#10b981' : (selectedDetailChar.hpCurrent / selectedDetailChar.hpMax) > 0.2 ? '#f59e0b' : '#ef4444',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                {/* Controlli rapidi HP */}
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '2px' }}>
                  {[-5, -1, 1, 5].map(d => (
                    <button
                      key={d}
                      onClick={() => handleAdjustHp(selectedDetailChar.id, d)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: '1px solid rgba(255,255,255,0.12)',
                        background: d > 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: d > 0 ? '#10b981' : '#f87171',
                        cursor: 'pointer'
                      }}
                    >
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Classe Armatura */}
              <div style={{
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Shield size={22} color="#60a5fa" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>{selectedDetailChar.ac}</div>
                <div style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 600 }}>CLASSE ARMATURA</div>
              </div>

              {/* Iniziativa */}
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Zap size={22} color="#fbbf24" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  {getModifier(selectedDetailChar.stats?.dex ?? 10)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: 600 }}>INIZIATIVA</div>
              </div>

              {/* Bonus Competenza */}
              <div style={{
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Award size={22} color="#c084fc" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  {getProficiencyBonus(selectedDetailChar.level)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#e9d5ff', fontWeight: 600 }}>COMPETENZA</div>
              </div>

              {/* Percezione Passiva */}
              <div style={{
                background: 'rgba(20, 184, 166, 0.08)',
                border: '1px solid rgba(20, 184, 166, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Eye size={22} color="#2dd4bf" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
                  {10 + Math.floor(((selectedDetailChar.stats?.wis ?? 10) - 10) / 2)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#99f6e4', fontWeight: 600 }}>PERCEZ. PASSIVA</div>
              </div>

              {/* Velocità */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Compass size={22} color="#34d399" style={{ marginBottom: '4px' }} />
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>9 m</div>
                <div style={{ fontSize: '0.72rem', color: '#a7f3d0', fontWeight: 600 }}>VELOCITÀ (30ft)</div>
              </div>
            </div>

            {/* Caratteristiche RPG (6 punteggi con grandi modificatori) */}
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} color="var(--accent-primary, #6366f1)" /> Caratteristiche di Base
              </h4>
              <div className="dnd-stats-grid">
                {[
                  { key: 'str', label: 'FORZA', short: 'FOR', score: selectedDetailChar.stats?.str ?? 10 },
                  { key: 'dex', label: 'DESTREZZA', short: 'DES', score: selectedDetailChar.stats?.dex ?? 10 },
                  { key: 'con', label: 'COSTITUZIONE', short: 'COS', score: selectedDetailChar.stats?.con ?? 10 },
                  { key: 'int', label: 'INTELLIGENZA', short: 'INT', score: selectedDetailChar.stats?.int ?? 10 },
                  { key: 'wis', label: 'SAGGEZZA', short: 'SAG', score: selectedDetailChar.stats?.wis ?? 10 },
                  { key: 'cha', label: 'CARISMA', short: 'CAR', score: selectedDetailChar.stats?.cha ?? 10 }
                ].map(stat => (
                  <div
                    key={stat.key}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      padding: '12px 6px',
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
                      {getModifier(stat.score)}
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      padding: '1px 8px'
                    }}>
                      {stat.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipaggiamento & Note Inventario */}
            <div style={{ marginBottom: '28px' }}>
              <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="#f59e0b" /> Equipaggiamento & Oggetti
              </h4>

              {selectedDetailChar.items && selectedDetailChar.items.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {selectedDetailChar.items.map(item => (
                    <div
                      key={item.id}
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '10px 12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{item.name}</span>
                        {item.rarity && (
                          <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                            {item.rarity}
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {item.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
                        {item.type && <span>{item.type}</span>}
                        {item.weight != null && <span>⚖️ {item.weight} kg</span>}
                        {item.value && <span>🪙 {item.value}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Note Libere Inventario */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  NOTE INVENTARIO & MONETE
                </div>
                {selectedDetailChar.inventoryNotes ? (
                  <div style={{ fontSize: '0.88rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {selectedDetailChar.inventoryNotes}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nessuna nota sull'inventario o monete salvata.
                  </span>
                )}
              </div>
            </div>

            {/* Tratti & Proprietà Aggiuntive */}
            {selectedDetailChar.customProperties && selectedDetailChar.customProperties.length > 0 && (
              <div>
                <h4 style={{ color: '#fff', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#a855f7" /> Tratti & Proprietà Personalizzate
                </h4>
                <CustomPropertiesView
                  properties={selectedDetailChar.customProperties}
                  isMaster={isMaster}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
