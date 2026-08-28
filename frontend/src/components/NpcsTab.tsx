import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { UserCheck, Plus, EyeOff, MapPin, Trash2, X } from 'lucide-react';

interface NPC {
  id: string;
  name: string;
  role?: string;
  faction?: string;
  attitude?: string;
  secrets?: string;
  portraitUrl?: string;
  location?: { id: string; name: string };
}

export const NpcsTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [faction, setFaction] = useState('');
  const [attitude, setAttitude] = useState('Neutrale');
  const [secrets, setSecrets] = useState('');
  const [portraitUrl, setPortraitUrl] = useState('');
  const [locationId, setLocationId] = useState('');

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

  const handleCreateNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;
    try {
      const res = await apiFetch('/npcs', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          name,
          role,
          faction,
          attitude,
          secrets: secrets || undefined,
          portraitUrl: portraitUrl || undefined,
          locationId: locationId || undefined,
        })
      });
      setNpcs(prev => [...prev, res.npc]);
      setShowAddModal(false);
      setName('');
      setRole('');
      setFaction('');
      setSecrets('');
      setPortraitUrl('');
      setLocationId('');
    } catch (err: any) {
      alert(err.message || 'Errore creazione NPC');
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
            Alleati, nemici, mercanti, fazioni e segreti riservati al Dungeon Master.
          </p>
        </div>

        {isMaster && (
          <button onClick={() => setShowAddModal(true)} className="grimoire-btn grimoire-btn-primary">
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
                  overflow: 'hidden'
                }}>
                  {npc.portraitUrl ? (
                    <img src={npc.portraitUrl} alt={npc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{npc.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-gold)' }}>{npc.role || 'Personaggio'}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
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
                <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244, 63, 94, 0.25)', marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#fda4af', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                    <EyeOff size={12} /> Segreti del Master (Nascosti ai Player):
                  </div>
                  <p style={{ color: '#fecdd3', fontSize: '0.85rem', lineHeight: '1.4' }}>
                    {npc.secrets}
                  </p>
                </div>
              )}
            </div>

            {isMaster && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: '14px' }}>
                <button onClick={() => handleDeleteNpc(npc.id)} className="grimoire-btn grimoire-btn-danger" style={{ padding: '6px 10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add NPC Modal */}
      {showAddModal && (
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Nuovo NPC</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateNpc} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>URL Ritratto / Immagine</label>
                <input className="grimoire-input" value={portraitUrl} onChange={e => setPortraitUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#fda4af', marginBottom: '4px' }}>Segreti Riservati al Master</label>
                <textarea className="grimoire-textarea" rows={3} value={secrets} onChange={e => setSecrets(e.target.value)} placeholder="In realtà lavora per il culto del drago..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">Salva NPC</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
