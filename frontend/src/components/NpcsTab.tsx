import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { UserCheck, Plus, Eye, EyeOff, MapPin, Trash2, Edit2, X } from 'lucide-react';
import { CustomPropertiesEditor, CustomPropertiesView, type CustomProperty } from './CustomPropertiesEditor';

interface NPC {
  id: string;
  name: string;
  role?: string;
  faction?: string;
  attitude?: string;
  secrets?: string;
  portraitUrl?: string;
  locationId?: string | null;
  location?: { id: string; name: string };
  visibility: 'PRIVATE_MASTER' | 'PUBLIC_PLAYERS';
  customProperties?: CustomProperty[];
}

export const NpcsTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNpc, setEditingNpc] = useState<NPC | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [faction, setFaction] = useState('');
  const [attitude, setAttitude] = useState('Neutrale');
  const [secrets, setSecrets] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [locationId, setLocationId] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC_PLAYERS' | 'PRIVATE_MASTER'>('PUBLIC_PLAYERS');
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([]);

  const fetchNpcs = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/npcs?campaignId=${activeCampaign.id}`);
      setNpcs(res.npcs || []);
    } catch (err) {
      console.error('Failed to load NPCs', err);
    }
  };

  const fetchLocations = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/locations?campaignId=${activeCampaign.id}`);
      setLocations(res.locations?.map((l: any) => ({ id: l.id, name: l.name })) || []);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  useEffect(() => {
    fetchNpcs();
    fetchLocations();
  }, [activeCampaign?.id]);

  const resetForm = () => {
    setName('');
    setRole('');
    setFaction('');
    setAttitude('Neutrale');
    setSecrets('');
    setPortraitUrl('');
    setLocationId('');
    setVisibility('PUBLIC_PLAYERS');
    setCustomProperties([]);
    setEditingNpc(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (npc: NPC) => {
    setEditingNpc(npc);
    setName(npc.name);
    setRole(npc.role || '');
    setFaction(npc.faction || '');
    setAttitude(npc.attitude || 'Neutrale');
    setSecrets(npc.secrets || '');
    setPortraitUrl(npc.portraitUrl || '');
    setLocationId(npc.locationId || (npc.location ? npc.location.id : ''));
    setVisibility(npc.visibility || 'PUBLIC_PLAYERS');
    setCustomProperties(Array.isArray(npc.customProperties) ? npc.customProperties : []);
    setShowAddModal(false);
  };

  const handleSaveNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;

    const payload = {
      campaignId: activeCampaign.id,
      name,
      role,
      faction,
      attitude,
      secrets: secrets || undefined,
      portraitUrl: portraitUrl || undefined,
      locationId: locationId || null,
      visibility,
      customProperties
    };

    try {
      if (editingNpc) {
        const res = await apiFetch(`/npcs/${editingNpc.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setNpcs(prev => prev.map(n => n.id === editingNpc.id ? res.npc : n));
        setEditingNpc(null);
      } else {
        const res = await apiFetch('/npcs', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setNpcs(prev => [...prev, res.npc]);
        setShowAddModal(false);
      }
      resetForm();
      fetchNpcs();
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio NPC');
    }
  };

  const handleToggleVisibility = async (npc: NPC) => {
    if (!isMaster) return;
    const nextVis = npc.visibility === 'PUBLIC_PLAYERS' ? 'PRIVATE_MASTER' : 'PUBLIC_PLAYERS';
    try {
      const res = await apiFetch(`/npcs/${npc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ visibility: nextVis })
      });
      setNpcs(prev => prev.map(n => n.id === npc.id ? res.npc : n));
    } catch (err: any) {
      alert(err.message || 'Errore modifica visibilità');
    }
  };

  const handleDeleteNpc = async (npcId: string) => {
    if (!confirm('Eliminare questo NPC?')) return;
    try {
      await apiFetch(`/npcs/${npcId}`, { method: 'DELETE' });
      setNpcs(prev => prev.filter(n => n.id !== npcId));
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
            <UserCheck color="var(--primary)" /> Personaggi Non Giocanti (NPC)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Alleati, nemici, mercanti, fazioni, proprietà custom e segreti riservati al Dungeon Master.
          </p>
        </div>

        {isMaster && (
          <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Aggiungi NPC
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {npcs.map(npc => (
          <div key={npc.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid var(--border-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  {npc.portraitUrl ? (
                    <img src={npc.portraitUrl} alt={npc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{npc.name}</h3>
                    {isMaster && (
                      <button
                        onClick={() => handleToggleVisibility(npc)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={npc.visibility === 'PRIVATE_MASTER' ? 'Privato DM (clicca per rendere visibile)' : 'Visibile ai giocatori'}
                      >
                        {npc.visibility === 'PRIVATE_MASTER' ? (
                          <span className="badge badge-rarity-legendary" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}>
                            <EyeOff size={10} /> DM
                          </span>
                        ) : (
                          <span className="badge badge-rarity-uncommon" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}>
                            <Eye size={10} /> Pubblico
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>{npc.role || 'Personaggio'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {npc.faction && <span className="badge badge-player">🏛️ {npc.faction}</span>}
                {npc.attitude && <span className="badge badge-rarity-rare">Attitudine: {npc.attitude}</span>}
                {npc.location && (
                  <span className="badge badge-rarity-uncommon">
                    <MapPin size={10} /> {npc.location.name}
                  </span>
                )}
              </div>

              {/* Master Secrets Field */}
              {isMaster && npc.secrets && (
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.25)', marginTop: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#fda4af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    <EyeOff size={12} /> Segreti del Master:
                  </div>
                  <p style={{ color: '#fecdd3', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {npc.secrets}
                  </p>
                </div>
              )}

              {/* Custom Properties */}
              <CustomPropertiesView properties={npc.customProperties} isMaster={isMaster} />
            </div>

            {isMaster && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: '12px' }}>
                <button
                  onClick={() => openEditModal(npc)}
                  className="grimoire-btn grimoire-btn-secondary"
                  style={{ padding: '6px 10px' }}
                  title="Modifica NPC"
                >
                  <Edit2 size={14} /> Modifica
                </button>
                <button
                  onClick={() => handleDeleteNpc(npc.id)}
                  className="grimoire-btn grimoire-btn-danger"
                  style={{ padding: '6px 10px' }}
                  title="Elimina NPC"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit NPC Modal */}
      {(showAddModal || editingNpc) && (
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>
                {editingNpc ? 'Modifica NPC' : 'Nuovo NPC'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveNpc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome NPC</label>
                <input className="grimoire-input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Gundren Rockseeker" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Ruolo / Professione</label>
                  <input className="grimoire-input" value={role} onChange={e => setRole(e.target.value)} placeholder="Locandiere, Nobile, Spia" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Fazione</label>
                  <input className="grimoire-input" value={faction} onChange={e => setFaction(e.target.value)} placeholder="Arpisti, Zhentarim..." />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Attitudine</label>
                  <select className="grimoire-select" value={attitude} onChange={e => setAttitude(e.target.value)}>
                    <option value="Amichevole">Amichevole</option>
                    <option value="Neutrale">Neutrale</option>
                    <option value="Diffidente">Diffidente</option>
                    <option value="Ostile">Ostile</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Luogo Abituale</label>
                  <select className="grimoire-select" value={locationId} onChange={e => setLocationId(e.target.value)}>
                    <option value="">Nessuno</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>URL Ritratto</label>
                  <input className="grimoire-input" value={portraitUrl} onChange={e => setPortraitUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Visibilità</label>
                  <select
                    className="grimoire-select"
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as any)}
                  >
                    <option value="PUBLIC_PLAYERS">🌐 Pubblico</option>
                    <option value="PRIVATE_MASTER">🔒 DM Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#fda4af', marginBottom: '4px' }}>Segreti Riservati al Master</label>
                <textarea className="grimoire-textarea" rows={2} value={secrets} onChange={e => setSecrets(e.target.value)} placeholder="In realtà lavora per il culto del drago..." />
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
                  {editingNpc ? 'Salva Modifiche' : 'Salva NPC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
