import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Map, Plus, MapPin, Trash2, X } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  description?: string;
  mapImageUrl?: string;
  parent?: { id: string; name: string };
  children?: Array<{ id: string; name: string }>;
  npcs?: Array<{ id: string; name: string; role?: string }>;
}

export const LocationsTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [parentId, setParentId] = useState('');

  const fetchLocations = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/locations?campaignId=${activeCampaign.id}`);
      setLocations(res.locations || []);
    } catch (err) {
      console.error('Failed to load locations', err);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [activeCampaign?.id]);

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;
    try {
      const res = await apiFetch('/locations', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          name,
          description,
          mapImageUrl: mapImageUrl || undefined,
          parentId: parentId || undefined,
        })
      });
      setLocations(prev => [...prev, res.location]);
      setShowAddModal(false);
      setName('');
      setDescription('');
      setMapImageUrl('');
      setParentId('');
    } catch (err: any) {
      alert(err.message || 'Errore creazione luogo');
    }
  };

  const handleDeleteLocation = async (locId: string) => {
    if (!confirm('Eliminare questo luogo dall\'atlante?')) return;
    try {
      await apiFetch(`/locations/${locId}`, { method: 'DELETE' });
      setLocations(prev => prev.filter(l => l.id !== locId));
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
            <Map color="var(--accent-cyan)" /> Atlante del Mondo & Mappe
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Regioni, città, rovine, dungeon e punti d'interesse esplorati durante la campagna.
          </p>
        </div>

        {isMaster && (
          <button onClick={() => setShowAddModal(true)} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Nuovo Luogo / Mappa
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {locations.map(loc => (
          <div key={loc.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {loc.mapImageUrl && (
                <div style={{ height: '160px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
                  <img src={loc.mapImageUrl} alt={loc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={18} color="var(--accent-cyan)" /> {loc.name}
                  </h3>
                  {loc.parent && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      All'interno di: <strong>{loc.parent.name}</strong>
                    </span>
                  )}
                </div>
              </div>

              {loc.description && (
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.4', margin: '10px 0 14px 0' }}>
                  {loc.description}
                </p>
              )}

              {/* NPCs located here */}
              {loc.npcs && loc.npcs.length > 0 && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Abitanti & NPC presenti:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {loc.npcs.map(npc => (
                      <span key={npc.id} className="badge badge-player" style={{ fontSize: '0.75rem' }}>
                        {npc.name} ({npc.role || 'NPC'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {isMaster && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                <button onClick={() => handleDeleteLocation(loc.id)} className="grimoire-btn grimoire-btn-danger" style={{ padding: '6px 10px' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Location Modal */}
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
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Aggiungi Luogo all'Atlante</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateLocation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome del Luogo</label>
                <input className="grimoire-input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Taverna del Cinghiale Ubriaco, Foresta Sussurrante" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Luogo Superiore (Opzionale)</label>
                <select className="grimoire-select" value={parentId} onChange={e => setParentId(e.target.value)}>
                  <option value="">Nessuno (Territorio Principale)</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>URL Mappa / Immagine (Opzionale)</label>
                <input className="grimoire-input" value={mapImageUrl} onChange={e => setMapImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descrizione e Punti d'Interesse</label>
                <textarea className="grimoire-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Atmosfera, pericoli, botteghe..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">Salva Luogo</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
