import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { getSocket } from '../services/socket';
import { Briefcase, Plus, ArrowRightLeft, Trash2, X } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  description?: string;
  rarity?: string;
  type?: string;
  value?: string;
  weight?: number;
  assignedCharacterId?: string | null;
  assignedCharacter?: { id: string; name: string; userId?: string } | null;
}

interface CharacterOption {
  id: string;
  name: string;
}

export const InventoryTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [items, setItems] = useState<Item[]>([]);
  const [characters, setCharacters] = useState<CharacterOption[]>([]);
  const [filterCharId, setFilterCharId] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Transfer item modal
  const [transferModalItem, setTransferModalItem] = useState<Item | null>(null);
  const [targetCharId, setTargetCharId] = useState<string>('');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rarity, setRarity] = useState('Common');
  const [itemType, setItemType] = useState('Arma');
  const [value, setValue] = useState('');
  const [weight, setWeight] = useState('');
  const [initialAssignedId, setInitialAssignedId] = useState('');

  const fetchItems = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/items?campaignId=${activeCampaign.id}`);
      setItems(res.items || []);
    } catch (err) {
      console.error('Failed to load items', err);
    }
  };

  const fetchCharacters = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/characters?campaignId=${activeCampaign.id}`);
      setCharacters(res.characters?.map((c: any) => ({ id: c.id, name: c.name })) || []);
    } catch (err) {
      console.error('Failed to load characters', err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCharacters();
  }, [activeCampaign?.id]);

  // Realtime Loot Updates
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !activeCampaign) return;

    const handleLootSync = () => {
      fetchItems();
    };

    socket.on('loot_updated', handleLootSync);
    return () => {
      socket.off('loot_updated', handleLootSync);
    };
  }, [activeCampaign?.id]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;
    try {
      const res = await apiFetch('/items', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          name,
          description,
          rarity,
          type: itemType,
          value,
          weight: weight ? parseFloat(weight) : undefined,
          assignedCharacterId: initialAssignedId || null,
        })
      });
      setItems(prev => [...prev, res.item]);
      setShowAddModal(false);
      setName('');
      setDescription('');
      setValue('');
      setWeight('');
      setInitialAssignedId('');

      // Emit realtime sync
      const socket = getSocket();
      if (socket) {
        socket.emit('loot_transferred', {
          campaignId: activeCampaign.id,
          itemId: res.item.id,
          targetCharacterId: initialAssignedId,
          itemName: res.item.name
        });
      }
    } catch (err: any) {
      alert(err.message || 'Errore creazione oggetto');
    }
  };

  const handleTransferItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalItem) return;

    try {
      const res = await apiFetch(`/items/${transferModalItem.id}/transfer`, {
        method: 'POST',
        body: JSON.stringify({ targetCharacterId: targetCharId || null })
      });
      setItems(prev => prev.map(it => it.id === transferModalItem.id ? res.item : it));
      
      // Emit realtime event
      const socket = getSocket();
      if (socket && activeCampaign) {
        socket.emit('loot_transferred', {
          campaignId: activeCampaign.id,
          itemId: transferModalItem.id,
          targetCharacterId: targetCharId,
          itemName: transferModalItem.name
        });
      }

      setTransferModalItem(null);
    } catch (err: any) {
      alert(err.message || 'Errore trasferimento oggetto');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Rimuovere questo oggetto dal database?')) return;
    try {
      await apiFetch(`/items/${itemId}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err: any) {
      alert(err.message || 'Errore cancellazione');
    }
  };

  const filteredItems = items.filter(item => {
    if (filterCharId === 'ALL') return true;
    if (filterCharId === 'UNASSIGNED') return !item.assignedCharacterId;
    return item.assignedCharacterId === filterCharId;
  });

  const getRarityBadge = (r?: string) => {
    const lower = (r || 'common').toLowerCase().replace(' ', '-');
    return <span className={`badge badge-rarity-${lower}`}>{r || 'Comune'}</span>;
  };

  if (!activeCampaign) return null;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase color="var(--accent-gold)" /> Inventario & Distribuzione Loot
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Assegna tesori ai personaggi in tempo reale, scambia oggetti nel party o consulta il bottino.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="grimoire-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={filterCharId}
            onChange={e => setFilterCharId(e.target.value)}
          >
            <option value="ALL">📦 Tutti gli oggetti ({items.length})</option>
            <option value="UNASSIGNED">💎 Loot non assegnato ({items.filter(i => !i.assignedCharacterId).length})</option>
            {characters.map(c => (
              <option key={c.id} value={c.id}>
                👤 {c.name} ({items.filter(i => i.assignedCharacterId === c.id).length})
              </option>
            ))}
          </select>

          <button onClick={() => setShowAddModal(true)} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Aggiungi Oggetto / Loot
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredItems.map(item => (
          <div key={item.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{item.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.type || 'Oggetto'}</span>
                </div>
                {getRarityBadge(item.rarity)}
              </div>

              {item.description && (
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.4', margin: '10px 0 14px 0' }}>
                  {item.description}
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '14px' }}>
                {item.value && <span>Valore: <strong style={{ color: '#fde68a' }}>{item.value}</strong></span>}
                {item.weight && <span>Peso: <strong style={{ color: '#cbd5e1' }}>{item.weight} kg</strong></span>}
              </div>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Posseduto da:</span>
                {item.assignedCharacter ? (
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
                    👤 {item.assignedCharacter.name}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Bottino libero nel forziere
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    setTransferModalItem(item);
                    setTargetCharId(item.assignedCharacterId || '');
                  }}
                  className="grimoire-btn grimoire-btn-secondary"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem' }}
                >
                  <ArrowRightLeft size={14} /> Assegna / Passa
                </button>

                {isMaster && (
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="grimoire-btn grimoire-btn-danger"
                    style={{ padding: '7px 10px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Aggiungi Nuovo Oggetto</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome Oggetto</label>
                <input className="grimoire-input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Spada Fiammeggiante +1" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Rarità</label>
                  <select className="grimoire-select" value={rarity} onChange={e => setRarity(e.target.value)}>
                    <option value="Common">Comune</option>
                    <option value="Uncommon">Non Comune</option>
                    <option value="Rare">Raro</option>
                    <option value="Very Rare">Molto Raro</option>
                    <option value="Legendary">Leggendario</option>
                    <option value="Artifact">Artefatto</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tipo</label>
                  <input className="grimoire-input" value={itemType} onChange={e => setItemType(e.target.value)} placeholder="Arma, Armatura, Pozione" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Valore</label>
                  <input className="grimoire-input" value={value} onChange={e => setValue(e.target.value)} placeholder="es. 150 mo" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Assegna subito a:</label>
                  <select className="grimoire-select" value={initialAssignedId} onChange={e => setInitialAssignedId(e.target.value)}>
                    <option value="">Nessuno (Loot Libero)</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descrizione e Proprietà Magiche</label>
                <textarea className="grimoire-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Effetti, danni extra, bonus CA..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">Aggiungi al Forziere</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {transferModalItem && (
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '26px' }}>
            <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '8px' }}>
              Assegna o Passa "{transferModalItem.name}"
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Seleziona l'avventuriero che riceverà l'oggetto nell'inventario in tempo reale.
            </p>
            <form onSubmit={handleTransferItem} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Destinatario:
                </label>
                <select
                  className="grimoire-select"
                  value={targetCharId}
                  onChange={e => setTargetCharId(e.target.value)}
                >
                  <option value="">📦 Rimetti nel forziere comune (Loot libero)</option>
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>👤 {c.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setTransferModalItem(null)} className="grimoire-btn grimoire-btn-secondary">
                  Annulla
                </button>
                <button type="submit" className="grimoire-btn grimoire-btn-gold">
                  Conferma Assegnazione
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
