import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import {
  BookOpen,
  GitFork,
  Users,
  Shield,
  Briefcase,
  Map,
  Compass,
  FileText,
  LogOut,
  Plus,
  X,
  Layers,
  ChevronDown,
  Check,
  Crown,
  Swords
} from 'lucide-react';
import { apiFetch } from '../services/api';
import { GlobalSearch } from './GlobalSearch';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { campaigns, activeCampaign, setActiveCampaign, fetchCampaigns, activeTab, setActiveTab } = useCampaign();
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignMenuOpen, setCampaignMenuOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');

  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  // Close dropdown on click outside
  const campaignMenuRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (campaignMenuRef.current && !campaignMenuRef.current.contains(e.target as Node)) {
        setCampaignMenuOpen(false);
      }
    };
    if (campaignMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [campaignMenuOpen]);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim()) return;
    try {
      const res = await apiFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({ title: campaignTitle, description: campaignDesc })
      });
      await fetchCampaigns();
      setActiveCampaign(res.campaign);
      setShowNewCampaign(false);
      setCampaignMenuOpen(false);
      setCampaignTitle('');
      setCampaignDesc('');
    } catch (err: any) {
      alert(err.message || 'Errore creazione campagna');
    }
  };

  // Logically organized tabs: Story & Quests -> World & Entities -> Logs & Notes
  const navTabs = [
    { id: 'story', label: 'Story Path', icon: GitFork },
    { id: 'quests', label: 'Quest', icon: Compass },
    { id: 'locations', label: 'Atlante', icon: Map },
    { id: 'characters', label: 'Personaggi', icon: Users },
    { id: 'monsters', label: 'Bestiario', icon: Shield },
    { id: 'inventory', label: 'Loot & Inventario', icon: Briefcase },
    { id: 'notes', label: 'Note & Log', icon: FileText },
  ];

  return (
    <header style={{
      background: 'rgba(11, 15, 25, 0.95)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 16px'
    }}>
      <div className="navbar-top-container">
        {/* Left Zone: Brand Logo & Compact Campaign Pill */}
        <div className="navbar-left-zone">
          <div className="navbar-brand-box">
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-gold))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px var(--primary-glow)',
              flexShrink: 0
            }}>
              <BookOpen size={18} color="#fff" />
            </div>
            <span className="navbar-brand-title" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
              GRIMOIRE
            </span>
          </div>

          <div className="navbar-desktop-divider" />

          {/* Compact Campaign Switcher Pill */}
          <div ref={campaignMenuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setCampaignMenuOpen(!campaignMenuOpen)}
              className="campaign-pill-button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: campaignMenuOpen ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 500,
                maxWidth: '220px',
                transition: 'all 0.15s ease'
              }}
              title={activeCampaign ? `Campagna: ${activeCampaign.title}` : 'Seleziona campagna'}
            >
              <Layers size={15} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
              <span className="campaign-pill-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeCampaign ? activeCampaign.title : 'Nessuna campagna'}
              </span>
              <ChevronDown className="campaign-pill-chevron" size={13} style={{ color: 'var(--text-dim)', flexShrink: 0, transform: campaignMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Campaign Switcher Dropdown Popover (High Contrast) */}
            {campaignMenuOpen && (
              <div
                className="animate-fade-in"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  width: '290px',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  zIndex: 100,
                  padding: '10px',
                  background: '#0f172a',
                  border: '1px solid rgba(139, 92, 246, 0.45)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(139, 92, 246, 0.25)'
                }}
              >
                <div style={{
                  padding: '4px 8px 10px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '8px'
                }}>
                  Campagne del Grimorio
                </div>

                {campaigns.length === 0 ? (
                  <div style={{ padding: '16px 10px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                    Nessuna campagna attiva
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {campaigns.map(c => {
                      const isActive = c.id === activeCampaign?.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setActiveCampaign(c);
                            setCampaignMenuOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            background: isActive ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.04)',
                            border: isActive ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                            }
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: isActive ? '#ddd6fe' : '#94a3b8', marginTop: '2px' }}>
                              {c.system}
                            </div>
                          </div>
                          {isActive && <Check size={16} color="var(--accent-gold)" style={{ flexShrink: 0 }} />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isMaster && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <button
                      onClick={() => {
                        setCampaignMenuOpen(false);
                        setShowNewCampaign(true);
                      }}
                      className="grimoire-btn grimoire-btn-gold"
                      style={{ width: '100%', padding: '9px 12px', fontSize: '0.85rem', fontWeight: 600, justifyContent: 'center' }}
                    >
                      <Plus size={15} /> Crea Nuova Campagna
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Zone: Centered Global Search */}
        <div className="navbar-center-zone">
          <GlobalSearch />
        </div>

        {/* Right Zone: User Profile & Logout */}
        <div className="navbar-right-zone">
          <div
            className="navbar-role-pill"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '9999px',
              padding: '3px 10px 3px 4px'
            }}
            title={`Ruolo: ${isMaster ? 'Dungeon Master' : 'Giocatore'} (${user?.username})`}
          >
            <span className={`badge ${isMaster ? 'badge-master' : 'badge-player'}`} style={{ padding: '3px 7px' }}>
              {isMaster ? <Crown size={12} /> : <Swords size={12} />}
              <span className="navbar-role-text" style={{ marginLeft: '4px' }}>
                {isMaster ? 'Master' : 'Player'}
              </span>
            </span>
            <span className="navbar-user-name" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </span>
          </div>

          <button
            onClick={logout}
            className="grimoire-btn grimoire-btn-secondary navbar-logout-btn"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
            title="Esci dall'account"
          >
            <LogOut size={15} />
            <span className="navbar-logout-text" style={{ fontSize: '0.8rem' }}>Esci</span>
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div
        className="hide-scrollbar touch-scroll"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          margin: '0 -16px',
          padding: '8px 16px 10px 16px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                minHeight: '38px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'rgba(139, 92, 246, 0.28)' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} color={isActive ? 'var(--accent-gold)' : 'currentColor'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Create Campaign Modal */}
      {showNewCampaign && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '460px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Crea Nuova Campagna</h3>
              <button onClick={() => setShowNewCampaign(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Titolo della Campagna</label>
                <input
                  className="grimoire-input"
                  placeholder="es. Le Miniere Perdute di Phandelver"
                  value={campaignTitle}
                  onChange={e => setCampaignTitle(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descrizione / Premessa</label>
                <textarea
                  className="grimoire-textarea"
                  rows={3}
                  placeholder="Breve sinossi dell'avventura..."
                  value={campaignDesc}
                  onChange={e => setCampaignDesc(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowNewCampaign(false)} className="grimoire-btn grimoire-btn-secondary">
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
    </header>
  );
};
