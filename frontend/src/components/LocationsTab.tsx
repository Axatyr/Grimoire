import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Map, Plus, MapPin, Trash2, Edit2, X, Eye, EyeOff, AlertTriangle, Search, RotateCcw } from 'lucide-react';
import { CustomPropertiesEditor, CustomPropertiesView, type CustomProperty } from './CustomPropertiesEditor';

interface Location {
  id: string;
  name: string;
  description?: string;
  mapImageUrl?: string;
  parentId?: string | null;
  parent?: { id: string; name: string };
  children?: Array<{ id: string; name: string }>;
  npcs?: Array<{ id: string; name: string; role?: string }>;
  visibility: 'PRIVATE_MASTER' | 'PUBLIC_PLAYERS';
  customProperties?: CustomProperty[];
}

export const LocationsTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [locations, setLocations] = useState<Location[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Delete confirmation modal state
  const [deleteConfirmLocation, setDeleteConfirmLocation] = useState<Location | null>(null);

  // Wiki Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHierarchy, setFilterHierarchy] = useState<'ALL' | 'ROOT' | 'SUB'>('ALL');
  const [filterVisibility, setFilterVisibility] = useState('ALL');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [parentId, setParentId] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC_PLAYERS' | 'PRIVATE_MASTER'>('PUBLIC_PLAYERS');
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([]);

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

  const resetForm = () => {
    setName('');
    setDescription('');
    setMapImageUrl('');
    setParentId('');
    setVisibility('PUBLIC_PLAYERS');
    setCustomProperties([]);
    setEditingLocation(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingLocation(loc);
    setName(loc.name);
    setDescription(loc.description || '');
    setMapImageUrl(loc.mapImageUrl || '');
    setParentId(loc.parentId || (loc.parent ? loc.parent.id : ''));
    setVisibility(loc.visibility || 'PUBLIC_PLAYERS');
    setCustomProperties(Array.isArray(loc.customProperties) ? loc.customProperties : []);
    setShowAddModal(false);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;

    const payload = {
      campaignId: activeCampaign.id,
      name,
      description,
      mapImageUrl: mapImageUrl || undefined,
      parentId: parentId || null,
      visibility,
      customProperties
    };

    try {
      if (editingLocation) {
        const res = await apiFetch(`/locations/${editingLocation.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setLocations(prev => prev.map(l => l.id === editingLocation.id ? res.location : l));
        setEditingLocation(null);
      } else {
        const res = await apiFetch('/locations', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setLocations(prev => [...prev, res.location]);
        setShowAddModal(false);
      }
      resetForm();
      fetchLocations(); // Refresh hierarchy
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio luogo');
    }
  };

  const handleToggleVisibility = async (loc: Location) => {
    if (!isMaster) return;
    const nextVis = loc.visibility === 'PUBLIC_PLAYERS' ? 'PRIVATE_MASTER' : 'PUBLIC_PLAYERS';
    try {
      const res = await apiFetch(`/locations/${loc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ visibility: nextVis })
      });
      setLocations(prev => prev.map(l => l.id === loc.id ? res.location : l));
    } catch (err: any) {
      alert(err.message || 'Errore modifica visibilità');
    }
  };

  const handleDeleteLocationClick = (loc: Location) => {
    setDeleteConfirmLocation(loc);
  };

  const confirmDeleteLocation = async () => {
    if (!deleteConfirmLocation) return;
    try {
      const res = await apiFetch(`/locations/${deleteConfirmLocation.id}`, { method: 'DELETE' });
      if (res.unlinkedCount > 0) {
        alert(`Luogo eliminato. ${res.unlinkedCount} sotto-luoghi collegati sono stati svincolati e promossi al livello principale.`);
      }
      setLocations(prev => prev.filter(l => l.id !== deleteConfirmLocation.id));
      setDeleteConfirmLocation(null);
      fetchLocations();
    } catch (err: any) {
      alert(err.message || 'Errore eliminazione');
    }
  };

  const filteredLocations = locations.filter(loc => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = loc.name.toLowerCase().includes(q);
      const matchDesc = loc.description?.toLowerCase().includes(q);
      const matchParent = loc.parent?.name?.toLowerCase().includes(q);
      const matchChildren = loc.children?.some(c => c.name.toLowerCase().includes(q));
      const matchNpcs = loc.npcs?.some(n => n.name.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchParent && !matchChildren && !matchNpcs) return false;
    }

    if (filterHierarchy === 'ROOT' && loc.parentId) return false;
    if (filterHierarchy === 'SUB' && !loc.parentId) return false;

    if (filterVisibility !== 'ALL' && loc.visibility !== filterVisibility) return false;

    return true;
  });

  const isLocFiltered = searchQuery.trim() !== '' || filterHierarchy !== 'ALL' || filterVisibility !== 'ALL';
  const resetLocFilters = () => {
    setSearchQuery('');
    setFilterHierarchy('ALL');
    setFilterVisibility('ALL');
  };

  if (!activeCampaign) return null;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Map color="var(--accent-cyan)" /> Atlante del Mondo & Mappe
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Regioni, città, rovine, dungeon, punti d'interesse e gerarchia geografica.
          </p>
        </div>

        {isMaster && (
          <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Nuovo Luogo / Mappa
          </button>
        )}
      </div>

      {/* Wiki Search & Filter Toolbar */}
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
              placeholder="Cerca luogo per nome, descrizione, PNG o sotto-aree..."
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

          {/* Hierarchy Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Gerarchia:</span>
            <select
              className="grimoire-select"
              value={filterHierarchy}
              onChange={e => setFilterHierarchy(e.target.value as any)}
              style={{ height: '38px', fontSize: '0.82rem', minWidth: '130px' }}
            >
              <option value="ALL">Tutti i Luoghi</option>
              <option value="ROOT">Solo Macro-Aree / Regioni</option>
              <option value="SUB">Solo Sotto-Aree / Stanze</option>
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
            <strong>{filteredLocations.length}</strong> {filteredLocations.length === 1 ? 'luogo' : 'luoghi'}
          </span>
          {isLocFiltered && (
            <button
              onClick={resetLocFilters}
              className="grimoire-btn grimoire-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
            >
              <RotateCcw size={13} /> Azzera Filtri
            </button>
          )}
        </div>
      </div>

      {filteredLocations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <MapPin size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <h3 style={{ color: '#fff', marginBottom: '8px' }}>Nessun luogo trovato</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
            {isLocFiltered
              ? 'Nessun luogo corrisponde ai criteri di ricerca o ai filtri impostati.'
              : 'L\'atlante è attualmente vuoto.'}
          </p>
          {isLocFiltered ? (
            <button onClick={resetLocFilters} className="grimoire-btn grimoire-btn-secondary">
              <RotateCcw size={14} /> Mostra Tutti i Luoghi
            </button>
          ) : isMaster ? (
            <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
              <Plus size={16} /> Crea Primo Luogo
            </button>
          ) : null}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredLocations.map(loc => (
          <div key={loc.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {loc.mapImageUrl && (
                <div style={{ height: '160px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
                  <img src={loc.mapImageUrl} alt={loc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <h3 style={{ fontSize: '1.25rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={18} color="var(--accent-cyan)" /> {loc.name}
                    </h3>
                    {isMaster && (
                      <button
                        onClick={() => handleToggleVisibility(loc)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title={loc.visibility === 'PRIVATE_MASTER' ? 'Privato DM (clicca per rendere visibile)' : 'Visibile ai giocatori'}
                      >
                        {loc.visibility === 'PRIVATE_MASTER' ? (
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
                  {loc.parent && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      All'interno di: <strong>{loc.parent.name}</strong>
                    </span>
                  )}
                </div>
              </div>

              {loc.description && (
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.4', margin: '10px 0 12px 0' }}>
                  {loc.description}
                </p>
              )}

              {/* Sub-locations (children) */}
              {loc.children && loc.children.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Sotto-luoghi inclusi ({loc.children.length}):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {loc.children.map(ch => (
                      <span key={ch.id} className="badge badge-rarity-uncommon" style={{ fontSize: '0.75rem' }}>
                        📍 {ch.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* NPCs located here */}
              {loc.npcs && loc.npcs.length > 0 && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
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

              {/* Custom Properties */}
              <CustomPropertiesView properties={loc.customProperties} isMaster={isMaster} />
            </div>

            {isMaster && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: '10px' }}>
                <button
                  onClick={() => openEditModal(loc)}
                  className="grimoire-btn grimoire-btn-secondary"
                  style={{ padding: '6px 10px' }}
                  title="Modifica Luogo"
                >
                  <Edit2 size={14} /> Modifica
                </button>
                <button
                  onClick={() => handleDeleteLocationClick(loc)}
                  className="grimoire-btn grimoire-btn-danger"
                  style={{ padding: '6px 10px' }}
                  title="Elimina Luogo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Create / Edit Location Modal */}
      {(showAddModal || editingLocation) && (
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
                {editingLocation ? 'Modifica Luogo' : 'Aggiungi Luogo all\'Atlante'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveLocation} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome del Luogo</label>
                <input className="grimoire-input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Taverna del Cinghiale Ubriaco, Foresta Sussurrante" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Luogo Superiore (Padre)</label>
                  <select className="grimoire-select" value={parentId} onChange={e => setParentId(e.target.value)}>
                    <option value="">Nessuno (Territorio Principale)</option>
                    {locations.filter(l => editingLocation ? l.id !== editingLocation.id : true).map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Visibilità</label>
                  <select
                    className="grimoire-select"
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as any)}
                  >
                    <option value="PUBLIC_PLAYERS">🌐 Pubblico ai Giocatori</option>
                    <option value="PRIVATE_MASTER">🔒 DM Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>URL Mappa / Immagine (Opzionale)</label>
                <input className="grimoire-input" value={mapImageUrl} onChange={e => setMapImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descrizione e Punti d'Interesse</label>
                <textarea className="grimoire-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Atmosfera, pericoli, botteghe..." />
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
                  {editingLocation ? 'Salva Modifiche' : 'Salva Luogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Warning & Confirmation Modal */}
      {deleteConfirmLocation && (
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '460px', width: '100%', padding: '24px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.25rem' }}>Eliminare "{deleteConfirmLocation.name}"?</h3>
            </div>

            {deleteConfirmLocation.children && deleteConfirmLocation.children.length > 0 ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <p style={{ fontSize: '0.85rem', color: '#fecaca', marginBottom: '6px', fontWeight: 600 }}>
                  ⚠️ Attenzione: Questo luogo contiene {deleteConfirmLocation.children.length} sotto-luoghi:
                </p>
                <ul style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '20px', margin: 0 }}>
                  {deleteConfirmLocation.children.map(ch => (
                    <li key={ch.id}>{ch.name}</li>
                  ))}
                </ul>
                <p style={{ fontSize: '0.8rem', color: '#fde047', marginTop: '8px' }}>
                  I sotto-luoghi NON verranno cancellati, ma verranno <strong>svincolati</strong> e promossi a luoghi principali indipendenti.
                </p>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Sei sicuro di voler rimuovere questo luogo dall'atlante della campagna?
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmLocation(null)}
                className="grimoire-btn grimoire-btn-secondary"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={confirmDeleteLocation}
                className="grimoire-btn grimoire-btn-danger"
              >
                Elimina e Svincola Figli
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
