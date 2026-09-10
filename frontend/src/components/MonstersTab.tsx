import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Plus, Sparkles, Trash2, Skull, Edit2, X, Eye, EyeOff, Search, RotateCcw } from 'lucide-react';
import { CustomPropertiesEditor, CustomPropertiesView, type CustomProperty } from './CustomPropertiesEditor';
import { ShareModal } from './ShareModal';

interface Monster {
  id: string;
  name: string;
  cr?: string;
  type?: string;
  hp: number;
  ac: number;
  description?: string;
  imageUrl?: string;
  visibility: 'PRIVATE_MASTER' | 'PUBLIC_PLAYERS';
  customProperties?: CustomProperty[];
}

export const MonstersTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMonster, setEditingMonster] = useState<Monster | null>(null);
  const [sharingMonster, setSharingMonster] = useState<Monster | null>(null);

  // Wiki Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCr, setFilterCr] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterVisibility, setFilterVisibility] = useState('ALL');

  // Form state
  const [name, setName] = useState('');
  const [cr, setCr] = useState('1/2');
  const [monsterType, setMonsterType] = useState('Bestia');
  const [hp, setHp] = useState(20);
  const [ac, setAc] = useState(13);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE_MASTER' | 'PUBLIC_PLAYERS'>('PRIVATE_MASTER');
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([]);

  const fetchMonsters = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/monsters?campaignId=${activeCampaign.id}`);
      setMonsters(res.monsters || []);
    } catch (err) {
      console.error('Failed to load monsters', err);
    }
  };

  useEffect(() => {
    fetchMonsters();
  }, [activeCampaign?.id]);

  const resetForm = () => {
    setName('');
    setCr('1/2');
    setMonsterType('Bestia');
    setHp(20);
    setAc(13);
    setDescription('');
    setImageUrl('');
    setVisibility('PRIVATE_MASTER');
    setCustomProperties([]);
    setEditingMonster(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (monster: Monster) => {
    setEditingMonster(monster);
    setName(monster.name);
    setCr(monster.cr || '1/2');
    setMonsterType(monster.type || 'Bestia');
    setHp(monster.hp);
    setAc(monster.ac);
    setDescription(monster.description || '');
    setImageUrl(monster.imageUrl || '');
    setVisibility(monster.visibility || 'PRIVATE_MASTER');
    setCustomProperties(Array.isArray(monster.customProperties) ? monster.customProperties : []);
    setShowAddModal(false);
  };

  const handleSaveMonster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;

    const payload = {
      campaignId: activeCampaign.id,
      name,
      cr,
      type: monsterType,
      hp: Number(hp),
      ac: Number(ac),
      description,
      imageUrl: imageUrl || undefined,
      visibility,
      customProperties
    };

    try {
      if (editingMonster) {
        const res = await apiFetch(`/monsters/${editingMonster.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setMonsters(prev => prev.map(m => m.id === editingMonster.id ? res.monster : m));
        setEditingMonster(null);
      } else {
        const res = await apiFetch('/monsters', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setMonsters(prev => [...prev, res.monster]);
        setShowAddModal(false);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio creatura');
    }
  };

  const handleToggleVisibility = async (monster: Monster) => {
    if (!isMaster) return;
    const nextVis = monster.visibility === 'PUBLIC_PLAYERS' ? 'PRIVATE_MASTER' : 'PUBLIC_PLAYERS';
    try {
      const res = await apiFetch(`/monsters/${monster.id}`, {
        method: 'PUT',
        body: JSON.stringify({ visibility: nextVis })
      });
      setMonsters(prev => prev.map(m => m.id === monster.id ? res.monster : m));
    } catch (err: any) {
      alert(err.message || 'Errore modifica visibilità');
    }
  };

  const handleDeleteMonster = async (monsterId: string) => {
    if (!confirm('Eliminare questa creatura dal bestiario?')) return;
    try {
      await apiFetch(`/monsters/${monsterId}`, { method: 'DELETE' });
      setMonsters(prev => prev.filter(m => m.id !== monsterId));
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione');
    }
  };

  const availableTypes = Array.from(new Set([
    'Bestia', 'Non Morto', 'Drago', 'Umanoide', 'Aberrazione', 'Costrutto',
    'Elementale', 'Fata', 'Immondo', 'Gigante', 'Mostruosità', 'Pianta',
    ...monsters.map(m => m.type).filter(Boolean) as string[]
  ])).sort();

  const filteredMonsters = monsters.filter(monster => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = monster.name.toLowerCase().includes(q);
      const matchType = monster.type?.toLowerCase().includes(q);
      const matchDesc = monster.description?.toLowerCase().includes(q);
      if (!matchName && !matchType && !matchDesc) return false;
    }

    if (filterType !== 'ALL' && monster.type !== filterType) return false;

    if (filterCr !== 'ALL') {
      if (filterCr === '10+') {
        const numCr = parseFloat(monster.cr || '0');
        if (isNaN(numCr) || numCr < 10) return false;
      } else if (monster.cr !== filterCr) {
        return false;
      }
    }

    if (filterVisibility !== 'ALL' && monster.visibility !== filterVisibility) return false;

    return true;
  });

  const isFiltered = searchQuery.trim() !== '' || filterCr !== 'ALL' || filterType !== 'ALL' || filterVisibility !== 'ALL';
  const resetFilters = () => {
    setSearchQuery('');
    setFilterCr('ALL');
    setFilterType('ALL');
    setFilterVisibility('ALL');
  };

  if (!activeCampaign) return null;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Skull color="var(--accent-crimson)" /> Bestiario & Creature
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Mostri, nemici, statistiche di combattimento, proprietà custom e trasmissione live ai giocatori.
          </p>
        </div>

        {isMaster && (
          <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Aggiungi Mostro al Bestiario
          </button>
        )}
      </div>

      {/* Wiki Search & Filters Toolbar */}
      <div className="glass-panel" style={{
        padding: '14px 18px',
        marginBottom: '22px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', flex: 1 }}>
          {/* Text Search */}
          <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="grimoire-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca mostro per nome, tipo o descrizione..."
              style={{ paddingLeft: '36px', paddingRight: searchQuery ? '32px' : '12px', height: '38px', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* CR Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Grado (CR):</span>
            <select
              className="grimoire-select"
              value={filterCr}
              onChange={e => setFilterCr(e.target.value)}
              style={{ height: '38px', fontSize: '0.82rem', minWidth: '100px' }}
            >
              <option value="ALL">Tutti i CR</option>
              <option value="0">CR 0</option>
              <option value="1/8">CR 1/8</option>
              <option value="1/4">CR 1/4</option>
              <option value="1/2">CR 1/2</option>
              <option value="1">CR 1</option>
              <option value="2">CR 2</option>
              <option value="3">CR 3</option>
              <option value="4">CR 4</option>
              <option value="5">CR 5</option>
              <option value="6">CR 6</option>
              <option value="7">CR 7</option>
              <option value="8">CR 8</option>
              <option value="9">CR 9</option>
              <option value="10+">CR 10+</option>
            </select>
          </div>

          {/* Monster Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Tipo:</span>
            <select
              className="grimoire-select"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ height: '38px', fontSize: '0.82rem', minWidth: '130px' }}
            >
              <option value="ALL">Tutti i Tipi</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Visibility Filter (Master Only) */}
          {isMaster && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Visibilità:</span>
              <select
                className="grimoire-select"
                value={filterVisibility}
                onChange={e => setFilterVisibility(e.target.value)}
                style={{ height: '38px', fontSize: '0.82rem', minWidth: '120px' }}
              >
                <option value="ALL">Tutti</option>
                <option value="PUBLIC_PLAYERS">Pubblici (Player)</option>
                <option value="PRIVATE_MASTER">Privati (Solo DM)</option>
              </select>
            </div>
          )}
        </div>

        {/* Results Info & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <strong>{filteredMonsters.length}</strong> {filteredMonsters.length === 1 ? 'creatura' : 'creature'}
          </span>
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="grimoire-btn grimoire-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
            >
              <RotateCcw size={13} /> Azzera Filtri
            </button>
          )}
        </div>
      </div>

      {filteredMonsters.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Skull size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>Nessuna creatura trovata</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
            {isFiltered
              ? 'Nessun mostro corrisponde ai criteri di ricerca o ai filtri impostati.'
              : 'Il bestiario è attualmente vuoto.'}
          </p>
          {isFiltered ? (
            <button onClick={resetFilters} className="grimoire-btn grimoire-btn-secondary">
              <RotateCcw size={14} /> Mostra Tutte le Creature
            </button>
          ) : isMaster ? (
            <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
              <Plus size={16} /> Aggiungi Primo Mostro
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredMonsters.map(monster => (
          <div key={monster.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {monster.imageUrl && (
                <div style={{ height: '160px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
                  <img src={monster.imageUrl} alt={monster.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>{monster.name}</h3>
                    {isMaster && (
                      <button
                        onClick={() => handleToggleVisibility(monster)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={monster.visibility === 'PRIVATE_MASTER' ? 'Privato al Master (clicca per rendere pubblico ai player)' : 'Visibile ai giocatori (clicca per nascondere)'}
                      >
                        {monster.visibility === 'PRIVATE_MASTER' ? (
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
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{monster.type || 'Creatura'} • Grado: {monster.cr || '1'}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="badge badge-rarity-artifact">HP {monster.hp}</span>
                  <span className="badge badge-rarity-rare">CA {monster.ac}</span>
                </div>
              </div>

              {monster.description && (
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.4', margin: '10px 0 12px 0', whiteSpace: 'pre-wrap' }}>
                  {monster.description}
                </p>
              )}

              {/* Custom Properties */}
              <CustomPropertiesView properties={monster.customProperties} isMaster={isMaster} />
            </div>

            {isMaster && (
              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: '12px' }}>
                <button
                  onClick={() => setSharingMonster(monster)}
                  className="grimoire-btn grimoire-btn-gold"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem' }}
                >
                  <Sparkles size={14} /> Mostra ai Giocatori...
                </button>
                <button
                  onClick={() => openEditModal(monster)}
                  className="grimoire-btn grimoire-btn-secondary"
                  style={{ padding: '7px 10px' }}
                  title="Modifica Mostro"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeleteMonster(monster.id)}
                  className="grimoire-btn grimoire-btn-danger"
                  style={{ padding: '7px 10px' }}
                  title="Elimina Mostro"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Share Modal */}
      {sharingMonster && (
        <ShareModal
          isOpen={true}
          onClose={() => setSharingMonster(null)}
          type="MONSTER"
          title={sharingMonster.name}
          payload={sharingMonster}
        />
      )}

      {/* Create / Edit Monster Modal */}
      {(showAddModal || editingMonster) && (
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>
                {editingMonster ? 'Modifica Creatura' : 'Aggiungi Creatura al Bestiario'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveMonster} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome Mostro</label>
                <input className="grimoire-input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Drago Rosso Adulto" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tipo Creatura</label>
                  <input className="grimoire-input" value={monsterType} onChange={e => setMonsterType(e.target.value)} placeholder="Drago, Non Morto, Bestia" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Grado di Sfida (CR)</label>
                  <input className="grimoire-input" value={cr} onChange={e => setCr(e.target.value)} placeholder="es. 1/4, 5, 17" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Punti Ferita (HP)</label>
                  <input type="number" min="1" className="grimoire-input" value={hp} onChange={e => setHp(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Classe Armatura (CA)</label>
                  <input type="number" min="1" className="grimoire-input" value={ac} onChange={e => setAc(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Visibilità</label>
                  <select
                    className="grimoire-select"
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as any)}
                  >
                    <option value="PRIVATE_MASTER">🔒 DM Only</option>
                    <option value="PUBLIC_PLAYERS">🌐 Pubblico</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>URL Immagine</label>
                <input className="grimoire-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Azioni & Descrizione</label>
                <textarea className="grimoire-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Attacchi speciali, soffio di fuoco, resistenze..." />
              </div>

              {/* Custom Properties Editor */}
              <CustomPropertiesEditor
                properties={customProperties}
                onChange={setCustomProperties}
                isMaster={isMaster}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={resetForm} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">
                  {editingMonster ? 'Salva Modifiche' : 'Salva Creatura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
