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
  UserCheck,
  FileText,
  Image,
  LogOut,
  Plus,
  Radio,
  X
} from 'lucide-react';
import { apiFetch } from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { campaigns, activeCampaign, setActiveCampaign, fetchCampaigns, activeTab, setActiveTab } = useCampaign();
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');

  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

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
      setCampaignTitle('');
      setCampaignDesc('');
    } catch (err: any) {
      alert(err.message || 'Errore creazione campagna');
    }
  };

  const navTabs = [
    { id: 'story', label: 'Story Path', icon: GitFork },
    { id: 'characters', label: 'Personaggi', icon: Users },
    { id: 'inventory', label: 'Loot & Inventario', icon: Briefcase },
    { id: 'monsters', label: 'Bestiario', icon: Shield },
    { id: 'quests', label: 'Quest', icon: Compass },
    { id: 'locations', label: 'Atlante', icon: Map },
    { id: 'npcs', label: 'NPC', icon: UserCheck },
    { id: 'notes', label: 'Note & Log', icon: FileText },
    { id: 'gallery', label: 'Grimorio Visivo', icon: Image },
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
        {/* Brand & User (on mobile top row) */}
        <div className="navbar-brand-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-gold))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px var(--primary-glow)',
              flexShrink: 0
            }}>
              <BookOpen size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
              GRIMOIRE
            </span>
          </div>

          {/* User Controls visible on top right */}
          <div className="navbar-user-section">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'var(--accent-emerald)',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '3px 8px',
              borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <Radio size={11} className="glow-active" />
              <span className="navbar-online-text">Online</span>
            </div>

            <span className={`badge ${isMaster ? 'badge-master' : 'badge-player'}`}>
              {isMaster ? 'Master' : 'Player'}
            </span>

            <span className="navbar-user-name" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </span>

            <button
              onClick={logout}
              className="grimoire-btn grimoire-btn-secondary"
              style={{ padding: '6px 8px' }}
              title="Esci"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Campaign dropdown & Action Controls */}
        <div className="navbar-campaign-controls">
          <select
            className="grimoire-select"
            style={{ width: 'auto', minWidth: '180px', padding: '6px 12px', fontSize: '0.85rem' }}
            value={activeCampaign?.id || ''}
            onChange={(e) => {
              const found = campaigns.find(c => c.id === e.target.value);
              if (found) setActiveCampaign(found);
            }}
          >
            {campaigns.length === 0 ? (
              <option value="">Nessuna campagna attiva</option>
            ) : (
              campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.system})
                </option>
              ))
            )}
          </select>

          {isMaster && (
            <button
              onClick={() => setShowNewCampaign(true)}
              className="grimoire-btn grimoire-btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', whiteSpace: 'nowrap', flexShrink: 0 }}
              title="Crea nuova campagna"
            >
              <Plus size={14} /> Nuova
            </button>
          )}
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
