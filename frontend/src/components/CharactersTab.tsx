import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Users, Plus, Heart, Shield, Award, Trash2, Edit2, X, Eye, EyeOff } from 'lucide-react';
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
  stats?: Record<string, any>;
  customProperties?: CustomProperty[];
  inventoryNotes?: string;
  avatarUrl?: string;
  isNpc: boolean;
  visibility: 'PUBLIC_PLAYERS' | 'PRIVATE_MASTER';
  user?: { id: string; username: string };
  items?: Array<{ id: string; name: string; rarity?: string }>;
}

export const CharactersTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [characters, setCharacters] = useState<Character[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

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
      isNpc: false
    };

    try {
      if (editingCharacter) {
        const res = await apiFetch(`/characters/${editingCharacter.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setCharacters(prev => prev.map(c => c.id === editingCharacter.id ? res.character : c));
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
    } catch (err: any) {
      alert(err.message || 'Errore aggiornamento HP');
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

  if (!activeCampaign) return null;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users color="var(--primary)" /> Personaggi del Party
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Schede eroi, punti ferita, classe, livello, proprietà customizzate ed equipaggiamento.
          </p>
        </div>
        {isMaster && (
          <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Nuovo Personaggio
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {characters.map(char => {
          const hpRatio = (char.hpCurrent / char.hpMax) * 100;
          const hpColor = hpRatio > 50 ? 'var(--accent-emerald)' : hpRatio > 25 ? 'var(--accent-gold)' : 'var(--accent-crimson)';

          return (
            <div key={char.id} className="glass-panel glass-panel-hover" style={{ padding: '22px', position: 'relative' }}>
              {/* Header card */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{char.name}</h3>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
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
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Character */}
      {(showAddModal || editingCharacter) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 15, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '560px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
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
    </div>
  );
};
