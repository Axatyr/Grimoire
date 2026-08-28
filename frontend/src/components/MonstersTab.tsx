import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Plus, Sparkles, Trash2, Skull, X } from 'lucide-react';

interface Monster {
  id: string;
  name: string;
  cr?: string;
  type?: string;
  hp: number;
  ac: number;
  description?: string;
  imageUrl?: string;
  visibility: 'PRIVATE_MASTER' | 'PUBLIC_PLAYERS';
}

export const MonstersTab: React.FC = () => {
  const { activeCampaign, broadcastHandout } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [cr, setCr] = useState('1/2');
  const [monsterType, setMonsterType] = useState('Bestia');
  const [hp, setHp] = useState(20);
  const [ac, setAc] = useState(13);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchMonsters = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/monsters?campaignId=${activeCampaign.id}`);
      setMonsters(res.monsters || []);
    } catch (err) {
      console.error('Failed to load monsters', err);
    }
  };

  useEffect(() => {
    fetchMonsters();
  }, [activeCampaign?.id]);

  const handleCreateMonster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeCampaign) return;
    try {
      const res = await apiFetch('/monsters', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          name,
          cr,
          type: monsterType,
          hp: Number(hp),
          ac: Number(ac),
          description,
          imageUrl: imageUrl || undefined,
          visibility: 'PRIVATE_MASTER'
        })
      });
      setMonsters(prev => [...prev, res.monster]);
      setShowAddModal(false);
      setName('');
      setDescription('');
      setImageUrl('');
    } catch (err: any) {
      alert(err.message || 'Errore creazione mostro');
    }
  };

  const handleDeleteMonster = async (monsterId: string) => {
    if (!confirm('Eliminare questo mostro dal bestiario?')) return;
    try {
      await apiFetch(`/monsters/${monsterId}`, { method: 'DELETE' });
      setMonsters(prev => prev.filter(m => m.id !== monsterId));
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
            <Skull color="var(--accent-crimson)" /> Bestiario & Creature
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Mostri, nemici, statistiche di combattimento e trasmissione immediata della scheda ai giocatori.
          </p>
        </div>

        {isMaster && (
          <button onClick={() => setShowAddModal(true)} className="grimoire-btn grimoire-btn-primary">
            <Plus size={16} /> Aggiungi Mostro al Bestiario
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {monsters.map(monster => (
          <div key={monster.id} className="glass-panel glass-panel-hover" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {monster.imageUrl && (
                <div style={{ height: '160px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
                  <img src={monster.imageUrl} alt={monster.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#fff' }}>{monster.name}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{monster.type || 'Creatura'} • Grado: {monster.cr || '1'}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="badge badge-rarity-artifact">HP {monster.hp}</span>
                  <span className="badge badge-rarity-rare">CA {monster.ac}</span>
                </div>
              </div>

              {monster.description && (
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.4', margin: '10px 0 16px 0', whiteSpace: 'pre-wrap' }}>
                  {monster.description}
                </p>
              )}
            </div>

            {isMaster && (
              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  onClick={() => broadcastHandout('MONSTER', monster)}
                  className="grimoire-btn grimoire-btn-gold"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem' }}
                >
                  <Sparkles size={14} /> Mostra ai Giocatori
                </button>
                <button
                  onClick={() => handleDeleteMonster(monster.id)}
                  className="grimoire-btn grimoire-btn-danger"
                  style={{ padding: '7px 10px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
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
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Aggiungi Creatura al Bestiario</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateMonster} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Nome Mostro</label>
                <input className="grimoire-input" value={name} onChange={e => setName(e.target.value)} placeholder="es. Drago Rosso Adulto" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tipo Creatura</label>
                  <input className="grimoire-input" value={monsterType} onChange={e => setMonsterType(e.target.value)} placeholder="Drago, Non Morto, Bestia" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Grado di Sfida (CR)</label>
                  <input className="grimoire-input" value={cr} onChange={e => setCr(e.target.value)} placeholder="es. 1/4, 5, 17" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Punti Ferita (HP)</label>
                  <input type="number" min="1" className="grimoire-input" value={hp} onChange={e => setHp(Number(e.target.value))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Classe Armatura (CA)</label>
                  <input type="number" min="1" className="grimoire-input" value={ac} onChange={e => setAc(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>URL Immagine</label>
                <input className="grimoire-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Azioni & Descrizione</label>
                <textarea className="grimoire-textarea" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Attacchi speciali, soffio di fuoco, resistenze..." />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">Salva Creatura</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
