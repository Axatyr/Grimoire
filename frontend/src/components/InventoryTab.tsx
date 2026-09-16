import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { getSocket } from '../services/socket';
import {
  Briefcase,
  Plus,
  ArrowRightLeft,
  Trash2,
  Edit2,
  X,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Package,
  Shield,
  Layers,
  Search,
  RotateCcw
} from 'lucide-react';
import { CustomPropertiesEditor, CustomPropertiesView, type CustomProperty } from './CustomPropertiesEditor';

interface Item {
  id: string;
  name: string;
  description?: string;
  rarity?: string;
  type?: string;
  value?: string;
  weight?: number;
  lootGroup?: string | null;
  assignedCharacterId?: string | null;
  visibility: 'PRIVATE_MASTER' | 'PUBLIC_PLAYERS';
  customProperties?: CustomProperty[];
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
  
  // Section view filter: 'PARTY_INV' | 'PARTY_LOOT' | 'DM_STASH'
  const [activeSection, setActiveSection] = useState<'PARTY_INV' | 'PARTY_LOOT' | 'DM_STASH'>('PARTY_LOOT');
  const [selectedCharacterFilter, setSelectedCharacterFilter] = useState<string>('ALL');

  // Wiki Search & Filters
  const [itemSearch, setItemSearch] = useState('');
  const [rarityFilter, setRarityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

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
  const [lootGroup, setLootGroup] = useState('');
  const [initialAssignedId, setInitialAssignedId] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC_PLAYERS' | 'PRIVATE_MASTER'>('PUBLIC_PLAYERS');
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([]);

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

  const resetForm = () => {
    setName('');
    setDescription('');
    setRarity('Common');
    setItemType('Arma');
    setValue('');
    setWeight('');
    setLootGroup('');
    setInitialAssignedId('');
    setVisibility(activeSection === 'DM_STASH' ? 'PRIVATE_MASTER' : 'PUBLIC_PLAYERS');
    setCustomProperties([]);
    setEditingItem(null);
    setShowAddModal(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setRarity(item.rarity || 'Common');
    setItemType(item.type || 'Arma');
    setValue(item.value || '');
    setWeight(item.weight ? item.weight.toString() : '');
    setLootGroup(item.lootGroup || '');
    setInitialAssignedId(item.assignedCharacterId || '');
    setVisibility(item.visibility || 'PUBLIC_PLAYERS');
    setCustomProperties(Array.isArray(item.customProperties) ? item.customProperties : []);
    setShowAddModal(false);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;

    const payload = {
      campaignId: activeCampaign.id,
      name,
      description,
      rarity,
      type: itemType,
      value,
      weight: weight ? parseFloat(weight) : undefined,
      lootGroup: lootGroup.trim() || null,
      assignedCharacterId: initialAssignedId || null,
      visibility,
      customProperties
    };

    try {
      if (editingItem) {
        const res = await apiFetch(`/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setItems(prev => prev.map(i => i.id === editingItem.id ? res.item : i));
        setEditingItem(null);
      } else {
        const res = await apiFetch('/items', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setItems(prev => [...prev, res.item]);
        setShowAddModal(false);
      }
      resetForm();

      // Emit realtime sync
      const socket = getSocket();
      if (socket) {
        socket.emit('loot_transferred', {
          campaignId: activeCampaign.id,
          itemName: name
        });
      }
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio oggetto');
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

  const handleToggleVisibility = async (item: Item) => {
    if (!isMaster) return;
    const nextVis = item.visibility === 'PUBLIC_PLAYERS' ? 'PRIVATE_MASTER' : 'PUBLIC_PLAYERS';
    try {
      const res = await apiFetch(`/items/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ visibility: nextVis })
      });
      setItems(prev => prev.map(i => i.id === item.id ? res.item : i));

      const socket = getSocket();
      if (socket && activeCampaign) {
        socket.emit('loot_transferred', { campaignId: activeCampaign.id, itemId: item.id });
      }
    } catch (err: any) {
      alert(err.message || 'Errore modifica visibilità');
    }
  };

  // Batch reveal an entire loot group to players
  const handleRevealLootGroup = async (groupName: string) => {
    if (!activeCampaign) return;
    if (!confirm(`Rivelare tutto il bottino del gruppo "${groupName}" a tutti i giocatori?`)) return;

    try {
      await apiFetch('/items/batch-reveal', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          lootGroup: groupName
        })
      });
      await fetchItems();

      const socket = getSocket();
      if (socket) {
        socket.emit('loot_transferred', { campaignId: activeCampaign.id, groupName });
      }
    } catch (err: any) {
      alert(err.message || 'Errore reveal loot');
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



  if (!activeCampaign) return null;

  // Split items into categories with search & filter support
  const filterItem = (item: Item) => {
    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description?.toLowerCase().includes(q);
      const matchGroup = item.lootGroup?.toLowerCase().includes(q);
      const matchType = item.type?.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchGroup && !matchType) return false;
    }
    if (rarityFilter !== 'ALL' && item.rarity !== rarityFilter) return false;
    if (typeFilter !== 'ALL' && item.type !== typeFilter) return false;
    return true;
  };

  const isItemFiltered = itemSearch.trim() !== '' || rarityFilter !== 'ALL' || typeFilter !== 'ALL';
  const resetItemFilters = () => {
    setItemSearch('');
    setRarityFilter('ALL');
    setTypeFilter('ALL');
  };

  const dmStashItems = items.filter(i => i.visibility === 'PRIVATE_MASTER');
  const partyLootItems = items.filter(i => i.visibility === 'PUBLIC_PLAYERS' && !i.assignedCharacterId);
  const partyInventoryItems = items.filter(i => i.assignedCharacterId);

  const displayedDmStashItems = dmStashItems.filter(filterItem);
  const displayedPartyLootItems = partyLootItems.filter(filterItem);
  const displayedPartyInventoryItems = partyInventoryItems.filter(filterItem);

  // Group DM Stash by lootGroup
  const dmStashGroups: Record<string, Item[]> = {};
  displayedDmStashItems.forEach(item => {
    const grp = item.lootGroup?.trim() || 'Bottino Senza Nome';
    if (!dmStashGroups[grp]) dmStashGroups[grp] = [];
    dmStashGroups[grp].push(item);
  });

  return (
    <div className="grimoire-container">
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase color="var(--accent-gold)" /> Inventario & Distribuzione Loot
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Gestione bottini del party, forziere segreto del Master e distribuzione in tempo reale.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isMaster && (
            <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
              <Plus size={16} /> Aggiungi Oggetto / Loot
            </button>
          )}
        </div>
      </div>

      {/* 3 Sections Tabs Bar */}
      <div
        className="hide-scrollbar touch-scroll"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '20px'
        }}
      >
        <button
          onClick={() => setActiveSection('PARTY_LOOT')}
          className="grimoire-btn"
          style={{
            background: activeSection === 'PARTY_LOOT' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.03)',
            border: activeSection === 'PARTY_LOOT' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
            color: activeSection === 'PARTY_LOOT' ? 'var(--accent-gold)' : 'var(--text-muted)',
            fontWeight: activeSection === 'PARTY_LOOT' ? 600 : 400,
            fontSize: '0.85rem',
            padding: '8px 14px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Package size={16} /> Bottino Rivelato ({partyLootItems.length})
        </button>

        <button
          onClick={() => setActiveSection('PARTY_INV')}
          className="grimoire-btn"
          style={{
            background: activeSection === 'PARTY_INV' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
            border: activeSection === 'PARTY_INV' ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
            color: activeSection === 'PARTY_INV' ? '#c4b5fd' : 'var(--text-muted)',
            fontWeight: activeSection === 'PARTY_INV' ? 600 : 400,
            fontSize: '0.85rem',
            padding: '8px 14px',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <Shield size={16} /> Inventario Eroi ({partyInventoryItems.length})
        </button>

        {isMaster && (
          <button
            onClick={() => setActiveSection('DM_STASH')}
            className="grimoire-btn"
            style={{
              background: activeSection === 'DM_STASH' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255,255,255,0.03)',
              border: activeSection === 'DM_STASH' ? '1px solid var(--accent-crimson)' : '1px solid var(--border-subtle)',
              color: activeSection === 'DM_STASH' ? '#fca5a5' : 'var(--text-muted)',
              fontWeight: activeSection === 'DM_STASH' ? 600 : 400,
              fontSize: '0.85rem',
              padding: '8px 14px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            <Lock size={16} /> 🔒 Forziere DM ({dmStashItems.length})
          </button>
        )}
      </div>

      {/* Wiki Search & Filter Toolbar for Items */}
      <div className="glass-panel toolbar-responsive">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1, width: '100%', minWidth: 0 }}>
          <div style={{ position: 'relative', width: '100%', minWidth: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="grimoire-input"
              value={itemSearch}
              onChange={e => setItemSearch(e.target.value)}
              placeholder="Cerca oggetto per nome, descrizione, forziere..."
              style={{ paddingLeft: '36px', paddingRight: itemSearch ? '32px' : '12px', height: '38px', fontSize: '0.85rem' }}
            />
            {itemSearch && (
              <button
                onClick={() => setItemSearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rarità:</span>
            <select
              className="grimoire-select"
              value={rarityFilter}
              onChange={e => setRarityFilter(e.target.value)}
              style={{ height: '38px', fontSize: '0.82rem', minWidth: '120px' }}
            >
              <option value="ALL">Tutte le Rarità</option>
              <option value="Common">Comune (Common)</option>
              <option value="Uncommon">Non Comune (Uncommon)</option>
              <option value="Rare">Raro (Rare)</option>
              <option value="Very Rare">Molto Raro (Very Rare)</option>
              <option value="Legendary">Leggendario (Legendary)</option>
              <option value="Artifact">Artefatto (Artifact)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tipo:</span>
            <select
              className="grimoire-select"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              style={{ height: '38px', fontSize: '0.82rem', minWidth: '120px' }}
            >
              <option value="ALL">Tutti i Tipi</option>
              <option value="Arma">Arma</option>
              <option value="Armatura">Armatura</option>
              <option value="Pozione">Pozione</option>
              <option value="Pergamena">Pergamena</option>
              <option value="Strumento">Strumento</option>
              <option value="Anello">Anello</option>
              <option value="Bacchetta">Bacchetta</option>
              <option value="Tesoro">Tesoro</option>
              <option value="Altro">Altro</option>
            </select>
          </div>
        </div>

        {isItemFiltered && (
          <button
            onClick={resetItemFilters}
            className="grimoire-btn grimoire-btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '6px' }}
          >
            <RotateCcw size={13} /> Azzera Filtri
          </button>
        )}
      </div>

      {/* SECTION 1: PARTY LOOT (Bottino Libero) */}
      {activeSection === 'PARTY_LOOT' && (
        <div>
          {displayedPartyLootItems.length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <p style={{ fontSize: '1.1rem' }}>
                {isItemFiltered ? 'Nessun oggetto trovato con i filtri selezionati.' : 'Nessun bottino libero nel forziere comune.'}
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                {isItemFiltered ? 'Prova a modificare i termini di ricerca o la rarità.' : 'Gli oggetti non assegnati e visibili ai giocatori appariranno qui.'}
              </p>
              {isItemFiltered && (
                <button onClick={resetItemFilters} className="grimoire-btn grimoire-btn-secondary" style={{ marginTop: '12px' }}>
                  <RotateCcw size={14} /> Mostra Tutto il Bottino
                </button>
              )}
            </div>
          ) : (
            <div className="responsive-grid-cards">
              {displayedPartyLootItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  isMaster={isMaster}
                  onTransfer={() => {
                    setTransferModalItem(item);
                    setTargetCharId(item.assignedCharacterId || '');
                  }}
                  onEdit={() => openEditModal(item)}
                  onDelete={() => handleDeleteItem(item.id)}
                  onToggleVisibility={() => handleToggleVisibility(item)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PARTY INVENTORY */}
      {activeSection === 'PARTY_INV' && (
        <div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Filtra per Eroe:</span>
            <select
              className="grimoire-select"
              style={{ width: 'auto', minWidth: '200px' }}
              value={selectedCharacterFilter}
              onChange={e => setSelectedCharacterFilter(e.target.value)}
            >
              <option value="ALL">Tutti gli eroi ({displayedPartyInventoryItems.length} oggetti)</option>
              {characters.map(c => (
                <option key={c.id} value={c.id}>
                  👤 {c.name} ({displayedPartyInventoryItems.filter(i => i.assignedCharacterId === c.id).length})
                </option>
              ))}
            </select>
          </div>

          {displayedPartyInventoryItems.length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Package size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <p style={{ fontSize: '1.1rem' }}>
                {isItemFiltered ? 'Nessun oggetto trovato per l\'eroe o i criteri selezionati.' : 'Nessun oggetto assegnato agli eroi.'}
              </p>
            </div>
          ) : (
            <div className="responsive-grid-cards">
              {displayedPartyInventoryItems
                .filter(i => selectedCharacterFilter === 'ALL' || i.assignedCharacterId === selectedCharacterFilter)
                .map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isMaster={isMaster}
                    onTransfer={() => {
                      setTransferModalItem(item);
                      setTargetCharId(item.assignedCharacterId || '');
                    }}
                    onEdit={() => openEditModal(item)}
                    onDelete={() => handleDeleteItem(item.id)}
                    onToggleVisibility={() => handleToggleVisibility(item)}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: DM STASH (Forziere Segreto del Master con Gruppi Loot) */}
      {activeSection === 'DM_STASH' && isMaster && (
        <div>
          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
            <h4 style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Lock size={16} /> Forziere Segreto del DM
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Questi oggetti sono completamente invisibili ai giocatori. Puoi prepararli, raggrupparli per forziere (es. <em>"Tesoro del Boss"</em>) e sbloccarli al momento opportuno con <strong>"Rivela al Party"</strong>.
            </p>
          </div>

          {Object.keys(dmStashGroups).length === 0 ? (
            <div className="glass-panel" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Lock size={40} style={{ opacity: 0.4, marginBottom: '10px' }} />
              <p style={{ fontSize: '1.1rem' }}>Il forziere del DM è vuoto.</p>
              <p style={{ fontSize: '0.85rem' }}>Crea nuovi oggetti impostando la visibilità su <em>"DM Only"</em>.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {Object.entries(dmStashGroups).map(([groupName, groupItems]) => (
                <div key={groupName} className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Layers color="#fca5a5" size={20} />
                      <div>
                        <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{groupName}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{groupItems.length} oggetti nel forziere</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevealLootGroup(groupName)}
                      className="grimoire-btn grimoire-btn-gold"
                      style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                    >
                      <Sparkles size={14} /> Rivela al Party ✨
                    </button>
                  </div>

                  <div className="responsive-grid-cards">
                    {groupItems.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        isMaster={isMaster}
                        onTransfer={() => {
                          setTransferModalItem(item);
                          setTargetCharId(item.assignedCharacterId || '');
                        }}
                        onEdit={() => openEditModal(item)}
                        onDelete={() => handleDeleteItem(item.id)}
                        onToggleVisibility={() => handleToggleVisibility(item)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Create or Edit Item */}
      {(showAddModal || editingItem) && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>
                {editingItem ? 'Modifica Oggetto' : 'Aggiungi Nuovo Oggetto'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome Oggetto</label>
                <input className="grimoire-input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Spada Fiammeggiante +1" required />
              </div>
              <div className="responsive-form-row-2">
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
                  <input className="grimoire-input" value={itemType} onChange={e => setItemType(e.target.value)} placeholder="Arma, Armatura, Pozione, Tesoro" />
                </div>
              </div>
              <div className="responsive-form-row-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Valore Monete</label>
                  <input className="grimoire-input" value={value} onChange={e => setValue(e.target.value)} placeholder="es. 150 mo" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Peso (kg)</label>
                  <input type="number" step="0.1" className="grimoire-input" value={weight} onChange={e => setWeight(e.target.value)} placeholder="es. 1.5" />
                </div>
              </div>

              <div className="responsive-form-row-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Gruppo / Forziere (Loot Group)
                  </label>
                  <input
                    className="grimoire-input"
                    value={lootGroup}
                    onChange={e => setLootGroup(e.target.value)}
                    placeholder="es. Bottino dei Goblin"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Assegna a:</label>
                  <select className="grimoire-select" value={initialAssignedId} onChange={e => setInitialAssignedId(e.target.value)}>
                    <option value="">Nessuno (Loot Libero)</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Visibilità</label>
                <select
                  className="grimoire-select"
                  value={visibility}
                  onChange={e => setVisibility(e.target.value as any)}
                >
                  <option value="PUBLIC_PLAYERS">🌐 Pubblico ai Giocatori</option>
                  <option value="PRIVATE_MASTER">🔒 DM Only (Nel Forziere Segreto)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descrizione e Proprietà Magiche</label>
                <textarea className="grimoire-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Effetti, danni extra, bonus CA..." />
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
                  {editingItem ? 'Salva Modifiche' : 'Aggiungi Oggetto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Item Modal */}
      {transferModalItem && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '440px' }}>
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

// Item Card Component
const ItemCard: React.FC<{
  item: Item;
  isMaster: boolean;
  onTransfer: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
}> = ({ item, isMaster, onTransfer, onEdit, onDelete, onToggleVisibility }) => {
  const getRarityBadge = (r?: string) => {
    const lower = (r || 'common').toLowerCase().replace(' ', '-');
    return <span className={`badge badge-rarity-${lower}`}>{r || 'Comune'}</span>;
  };

  return (
    <div className="glass-panel glass-panel-hover" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff' }}>{item.name}</h3>
              {isMaster && (
                <button
                  onClick={onToggleVisibility}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  title={item.visibility === 'PRIVATE_MASTER' ? 'Privato DM (clicca per sbloccare ai player)' : 'Visibile ai player (clicca per nascondere)'}
                >
                  {item.visibility === 'PRIVATE_MASTER' ? (
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
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {item.type || 'Oggetto'} {item.lootGroup ? `• [${item.lootGroup}]` : ''}
            </span>
          </div>
          {getRarityBadge(item.rarity)}
        </div>

        {item.description && (
          <p style={{ color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.4', margin: '8px 0 12px 0' }}>
            {item.description}
          </p>
        )}

        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
          {item.value && <span>Valore: <strong style={{ color: '#fde68a' }}>{item.value}</strong></span>}
          {item.weight && <span>Peso: <strong style={{ color: '#cbd5e1' }}>{item.weight} kg</strong></span>}
        </div>

        {/* Custom Properties */}
        <CustomPropertiesView properties={item.customProperties} isMaster={isMaster} />
      </div>

      <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', marginTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assegnato a:</span>
          {item.assignedCharacter ? (
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
              👤 {item.assignedCharacter.name}
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
              Loot Libero
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={onTransfer}
            className="grimoire-btn grimoire-btn-secondary"
            style={{ flex: 1, padding: '6px 8px', fontSize: '0.75rem' }}
          >
            <ArrowRightLeft size={12} /> Assegna / Passa
          </button>

          {isMaster && (
            <>
              <button
                onClick={onEdit}
                className="grimoire-btn grimoire-btn-secondary"
                style={{ padding: '6px 8px' }}
                title="Modifica Oggetto"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={onDelete}
                className="grimoire-btn grimoire-btn-danger"
                style={{ padding: '6px 8px' }}
                title="Elimina Oggetto"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
