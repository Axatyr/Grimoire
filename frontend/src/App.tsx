import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CampaignProvider, useCampaign } from './context/CampaignContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { HandoutBroadcastModal } from './components/HandoutBroadcastModal';
import { StoryTree } from './components/StoryTree';
import { CharactersTab } from './components/CharactersTab';
import { InventoryTab } from './components/InventoryTab';
import { MonstersTab } from './components/MonstersTab';
import { QuestsTab } from './components/QuestsTab';
import { LocationsTab } from './components/LocationsTab';
import { NpcsTab } from './components/NpcsTab';
import { NotesTab } from './components/NotesTab';
import { GalleryTab } from './components/GalleryTab';
import { apiFetch } from './services/api';
import { Plus, BookOpen, X, LogIn } from 'lucide-react';

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeTab, activeCampaign, campaigns, fetchCampaigns, setActiveCampaign } = useCampaign();
  
  // Master modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [system, setSystem] = useState('D&D 5e');

  // Player join state
  const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([]);
  const [joinCampaignIdInput, setJoinCampaignIdInput] = useState('');

  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const fetchAvailable = async () => {
    if (isMaster || campaigns.length > 0) return;
    try {
      const res = await apiFetch('/campaigns/available');
      setAvailableCampaigns(res.campaigns || []);
    } catch (err) {
      console.error('Error fetching available campaigns', err);
    }
  };

  useEffect(() => {
    if (user && !isMaster && (!activeCampaign || campaigns.length === 0)) {
      fetchAvailable();
    }
  }, [user?.id, isMaster, campaigns.length, activeCampaign]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await apiFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({ title, description: desc, system })
      });
      await fetchCampaigns();
      setActiveCampaign(res.campaign);
      setShowCreateModal(false);
      setTitle('');
      setDesc('');
    } catch (err: any) {
      alert(err.message || 'Errore creazione campagna');
    }
  };

  const handleJoin = async (campaignIdToJoin: string) => {
    if (!campaignIdToJoin.trim()) return;
    try {
      const res = await apiFetch('/campaigns/join', {
        method: 'POST',
        body: JSON.stringify({ campaignId: campaignIdToJoin })
      });
      await fetchCampaigns();
      setActiveCampaign(res.campaign);
      setJoinCampaignIdInput('');
    } catch (err: any) {
      alert(err.message || 'Errore partecipazione alla campagna');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          border: '3px solid var(--border-subtle)',
          borderTopColor: 'var(--primary)',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-serif)', letterSpacing: '2px' }}>
          APERTURA DEL GRIMORIO...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <AuthModal isOpen={true} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <HandoutBroadcastModal />

      <main style={{ flex: 1 }}>
        {campaigns.length === 0 || !activeCampaign ? (
          <div style={{
            maxWidth: '680px',
            margin: '60px auto',
            padding: '40px 30px',
            textAlign: 'center'
          }} className="glass-panel animate-fade-in">
            <div style={{
              width: '70px',
              height: '70px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(245, 158, 11, 0.25))',
              border: '1px solid var(--border-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto'
            }}>
              <BookOpen size={36} color="var(--accent-gold)" />
            </div>
            <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '10px' }}>
              Benvenuto, {user.username}!
            </h2>

            {isMaster ? (
              <>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '30px' }}>
                  Non hai ancora nessuna campagna attiva nel tuo grimorio. Crea la tua prima avventura da Dungeon Master per iniziare a mappare la storia, i mostri, il loot e i personaggi.
                </p>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="grimoire-btn grimoire-btn-gold"
                  style={{ padding: '14px 28px', fontSize: '1.05rem', margin: '0 auto' }}
                >
                  <Plus size={20} /> Crea Nuova Campagna
                </button>
              </>
            ) : (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                  Sei autenticato come <strong>Giocatore</strong>. Per iniziare, unisciti a una campagna creata dal tuo Dungeon Master.
                </p>

                {availableCampaigns.length > 0 && (
                  <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', marginBottom: '10px', textTransform: 'uppercase' }}>
                      Campagne disponibili sul server locale:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {availableCampaigns.map(c => (
                        <div
                          key={c.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            padding: '14px 16px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <h5 style={{ fontSize: '1.05rem', color: '#fff' }}>{c.title}</h5>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              Master: <strong>{c.master?.username}</strong> • Sistema: {c.system}
                            </span>
                          </div>
                          <button
                            onClick={() => handleJoin(c.id)}
                            className="grimoire-btn grimoire-btn-primary"
                            style={{ padding: '7px 14px', fontSize: '0.85rem' }}
                          >
                            <LogIn size={15} /> Unisciti
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{
                  background: 'rgba(10, 14, 24, 0.8)',
                  padding: '20px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'left'
                }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Oppure inserisci il Codice / ID Campagna fornito dal Master:
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      className="grimoire-input"
                      placeholder="es. e234f9a1-..."
                      value={joinCampaignIdInput}
                      onChange={e => setJoinCampaignIdInput(e.target.value)}
                    />
                    <button
                      onClick={() => handleJoin(joinCampaignIdInput)}
                      disabled={!joinCampaignIdInput.trim()}
                      className="grimoire-btn grimoire-btn-gold"
                      style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                    >
                      <LogIn size={16} /> Partecipa
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {activeTab === 'story' && <StoryTree />}
            {activeTab === 'characters' && <CharactersTab />}
            {activeTab === 'inventory' && <InventoryTab />}
            {activeTab === 'monsters' && <MonstersTab />}
            {activeTab === 'quests' && <QuestsTab />}
            {activeTab === 'locations' && <LocationsTab />}
            {activeTab === 'npcs' && <NpcsTab />}
            {activeTab === 'notes' && <NotesTab />}
            {activeTab === 'gallery' && <GalleryTab />}
          </>
        )}
      </main>

      {/* Floating Modal for Master Campaign Creation */}
      {showCreateModal && isMaster && (
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
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Crea Nuova Campagna</h3>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Titolo della Campagna
                </label>
                <input
                  className="grimoire-input"
                  placeholder="es. La Maledizione di Strahd"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Sistema di Gioco
                </label>
                <input
                  className="grimoire-input"
                  placeholder="es. D&D 5e, Pathfinder 2e, Call of Cthulhu"
                  value={system}
                  onChange={e => setSystem(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Descrizione / Premessa
                </label>
                <textarea
                  className="grimoire-textarea"
                  rows={3}
                  placeholder="Breve sinossi dell'avventura..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} className="grimoire-btn grimoire-btn-secondary">
                  Annulla
                </button>
                <button type="submit" className="grimoire-btn grimoire-btn-gold">
                  Inizia Campagna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer style={{
        padding: '24px 20px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '60px',
        color: 'var(--text-dim)',
        fontSize: '0.85rem'
      }}>
        Grimoire TTRPG Manager • Self-Hosted Local Server & Realtime Campaign Hub
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <CampaignProvider>
        <MainContent />
      </CampaignProvider>
    </AuthProvider>
  );
}

export default App;
