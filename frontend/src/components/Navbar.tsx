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
      background: 'rgba(11, 15, 25, 0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 20px'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Brand & Campaign Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-gold))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px var(--primary-glow)'
            }}>
              <BookOpen size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 700, color: '#fff', letterSpacing: '1px' }}>
              GRIMOIRE
            </span>
          </div>

          {/* Campaign dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                title="Crea nuova campagna"
              >
                <Plus size={14} /> Nuova
              </button>
            )}
          </div>
        </div>

        {/* User Info & Realtime Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            color: 'var(--accent-emerald)',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '4px 10px',
            borderRadius: '9999px',
            border: '1px solid rgba(16, 185, 129, 0.2)'
          }}>
            <Radio size={12} className="glow-active" />
            <span>Online</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isMaster ? 'badge-master' : 'badge-player'}`}>
              {isMaster ? 'Master' : 'Player'}
            </span>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
              {user?.username}
            </span>
          </div>

          <button
            onClick={logout}
            className="grimoire-btn grimoire-btn-secondary"
            style={{ padding: '6px 10px' }}
            title="Esci"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        padding: '8px 0 12px 0',
        borderTop: '1px solid var(--border-subtle)',
      }}>
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
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'var(--text-muted)',
                background: isActive ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                border: isActive ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <Icon size={14} color={isActive ? 'var(--accent-gold)' : 'currentColor'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Create Campaign Modal */}
      {showNewCampaign && (
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '460px', width: '100%', padding: '28px' }}>
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
