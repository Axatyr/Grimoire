import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { apiFetch } from '../services/api';
import { Sparkles, Globe, User, X, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  title: string;
  payload: any;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  payload
}) => {
  const { activeCampaign, broadcastHandout } = useCampaign();
  const [members, setMembers] = useState<Array<{ id: string; username: string; role?: string }>>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL'); // 'ALL' or userId
  const [sharedSuccess, setSharedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen || !activeCampaign) return;

    // Fetch members and players of campaign
    const loadMembers = async () => {
      try {
        const res = await apiFetch(`/campaigns/${activeCampaign.id}`);
        if (res.campaign?.members) {
          const list = res.campaign.members
            .map((m: any) => m.user)
            .filter((u: any) => u && u.id !== activeCampaign.masterId);
          setMembers(list);
        }
      } catch (err) {
        console.error('Failed to load campaign members', err);
      }
    };

    loadMembers();
    setSelectedTarget('ALL');
    setSharedSuccess(false);
  }, [isOpen, activeCampaign?.id]);

  if (!isOpen) return null;

  const handleConfirmShare = () => {
    let targetUserId: string | null = null;
    let targetUsername: string | null = null;

    if (selectedTarget !== 'ALL') {
      targetUserId = selectedTarget;
      const found = members.find(m => m.id === selectedTarget);
      targetUsername = found?.username || null;
    }

    broadcastHandout(type, payload, targetUserId, targetUsername);
    setSharedSuccess(true);
    setTimeout(() => {
      setSharedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1500,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '26px',
        border: '1px solid var(--accent-gold)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles color="var(--accent-gold)" size={20} />
            <h3 style={{ color: '#fff', fontSize: '1.25rem' }}>Condividi Handout Live</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '18px', border: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
            Elemento da trasmettere ({type}):
          </span>
          <span style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>
            {title}
          </span>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Seleziona Destinatario:
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Option ALL */}
            <div
              onClick={() => setSelectedTarget('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: selectedTarget === 'ALL' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: selectedTarget === 'ALL' ? '1px solid var(--accent-gold)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={18} color={selectedTarget === 'ALL' ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                <div>
                  <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>Tutto il Party (Pubblico)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trasmesso a tutti i giocatori collegati</div>
                </div>
              </div>
              <input
                type="radio"
                name="targetShare"
                checked={selectedTarget === 'ALL'}
                onChange={() => setSelectedTarget('ALL')}
                style={{ cursor: 'pointer' }}
              />
            </div>

            {/* Single players */}
            {members.map(member => (
              <div
                key={member.id}
                onClick={() => setSelectedTarget(member.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedTarget === member.id ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                  border: selectedTarget === member.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <User size={18} color={selectedTarget === member.id ? '#c4b5fd' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>
                      🔒 Solo per {member.username}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comunicazione o indizio segreto individuale</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="targetShare"
                  checked={selectedTarget === member.id}
                  onChange={() => setSelectedTarget(member.id)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            ))}

            {members.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', margin: '4px 0' }}>
                Nessun giocatore attualmente registrato nella campagna (verrà inviato alla stanza pubblica).
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="grimoire-btn grimoire-btn-secondary">
            Annulla
          </button>
          <button
            type="button"
            onClick={handleConfirmShare}
            className="grimoire-btn grimoire-btn-gold"
            disabled={sharedSuccess}
            style={{ gap: '6px' }}
          >
            {sharedSuccess ? (
              <>
                <Check size={16} /> Trasmesso!
              </>
            ) : (
              <>
                <Sparkles size={16} /> Invia Handout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
