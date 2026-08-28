import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Compass, Plus, Sparkles, CheckCircle2, Trash2, X } from 'lucide-react';

interface Quest {
  id: string;
  title: string;
  objective: string;
  description?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  rewards?: any;
}

export const QuestsTab: React.FC = () => {
  const { activeCampaign, broadcastHandout } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [quests, setQuests] = useState<Quest[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [objective, setObjective] = useState('');
  const [description, setDescription] = useState('');

  const fetchQuests = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/quests?campaignId=${activeCampaign.id}`);
      setQuests(res.quests || []);
    } catch (err) {
      console.error('Failed to load quests', err);
    }
  };

  useEffect(() => {
    fetchQuests();
  }, [activeCampaign?.id]);

  const handleCreateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeCampaign) return;
    try {
      const res = await apiFetch('/quests', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          title,
          objective,
          description,
          status: 'ACTIVE'
        })
      });
      setQuests(prev => [res.quest, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setObjective('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Errore creazione quest');
    }
  };

  const handleUpdateStatus = async (questId: string, newStatus: Quest['status']) => {
    try {
      const res = await apiFetch(`/quests/${questId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setQuests(prev => prev.map(q => q.id === questId ? res.quest : q));
    } catch (err: any) {
      alert(err.message || 'Errore aggiornamento');
    }
  };

  const handleDeleteQuest = async (questId: string) => {
    if (!confirm('Eliminare questa quest?')) return;
    try {
      await apiFetch(`/quests/${questId}`, { method: 'DELETE' });
      setQuests(prev => prev.filter(q => q.id !== questId));
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
            <Compass color="var(--accent-gold)" /> Quest & Obiettivi di Campagna
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Missioni primarie, trame secondarie, taglie e ricompense per il party.
          </p>
        </div>

        {isMaster && (
          <button onClick={() => setShowAddModal(true)} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Nuova Quest
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {quests.map(quest => (
          <div key={quest.id} className="glass-panel glass-panel-hover" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{quest.title}</h3>
                <span className={`badge ${
                  quest.status === 'COMPLETED' ? 'badge-rarity-uncommon' :
                  quest.status === 'ACTIVE' ? 'badge-rarity-rare' :
                  quest.status === 'FAILED' ? 'badge-rarity-artifact' : 'badge-rarity-common'
                }`}>
                  {quest.status}
                </span>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Obiettivo:
                </span>
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {quest.objective}
                </p>
              </div>

              {quest.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.4', marginBottom: '16px' }}>
                  {quest.description}
                </p>
              )}
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {isMaster && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(quest.id, quest.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED')}
                    className="grimoire-btn grimoire-btn-secondary"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <CheckCircle2 size={14} color="var(--accent-emerald)" /> {quest.status === 'COMPLETED' ? 'Riapri' : 'Completa'}
                  </button>
                  <button
                    onClick={() => broadcastHandout('QUEST', quest)}
                    className="grimoire-btn grimoire-btn-gold"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    <Sparkles size={14} /> Condividi
                  </button>
                  <button
                    onClick={() => handleDeleteQuest(quest.id)}
                    className="grimoire-btn grimoire-btn-danger"
                    style={{ padding: '6px 10px' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '500px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Nuova Quest di Campagna</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateQuest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Titolo della Missione</label>
                <input className="grimoire-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="es. Salvare il Fabbro rapito dai Goblin" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Obiettivo Chiave</label>
                <input className="grimoire-input" value={objective} onChange={e => setObjective(e.target.value)} placeholder="Trova il covo nei boschi e libera il prigioniero" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Dettagli, Indizi e Ricompense</label>
                <textarea className="grimoire-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ricompensa: 200 mo + Mappa segreta..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">Registra Quest</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
