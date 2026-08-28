import React from 'react';
import { useCampaign } from '../context/CampaignContext';
import { Sparkles, X, Award } from 'lucide-react';

export const HandoutBroadcastModal: React.FC = () => {
  const { liveHandout, dismissHandout } = useCampaign();

  if (!liveHandout) return null;

  const { type, payload } = liveHandout;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '20px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
        border: '2px solid var(--accent-gold)',
        boxShadow: '0 0 50px rgba(245, 158, 11, 0.3), 0 20px 40px rgba(0, 0, 0, 0.9)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              background: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid var(--border-gold)',
              padding: '6px 12px',
              borderRadius: '9999px',
              color: 'var(--accent-gold)',
              fontSize: '0.8rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sparkles size={14} /> TRASMISSIONE DAL DUNGEON MASTER
            </span>
          </div>
          <button
            onClick={dismissHandout}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Type Handling */}
        {type === 'IMAGE' && (
          <div>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '12px' }}>{payload.altText || payload.filename}</h3>
            <img
              src={payload.url.startsWith('http') ? payload.url : `http://localhost:4000${payload.url}`}
              alt={payload.altText || 'Handout'}
              style={{
                width: '100%',
                maxHeight: '450px',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: '#070a10'
              }}
            />
          </div>
        )}

        {type === 'MONSTER' && (
          <div style={{ background: 'rgba(10, 14, 24, 0.9)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.6rem', color: '#fff' }}>{payload.name}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{payload.type || 'Creatura'} • Grado di Sfida: {payload.cr || 'N/D'}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-rarity-artifact">HP: {payload.hp}</span>
                <span className="badge badge-rarity-rare">AC: {payload.ac}</span>
              </div>
            </div>
            {payload.imageUrl && (
              <img
                src={payload.imageUrl.startsWith('http') ? payload.imageUrl : `http://localhost:4000${payload.imageUrl}`}
                alt={payload.name}
                style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}
              />
            )}
            <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {payload.description || 'Nessuna descrizione.'}
            </p>
          </div>
        )}

        {type === 'QUEST' && (
          <div style={{ background: 'rgba(10, 14, 24, 0.9)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-gold)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Award color="var(--accent-gold)" size={20} />
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-gold)' }}>{payload.title}</h3>
            </div>
            <h4 style={{ fontSize: '1rem', color: '#fff', margin: '10px 0 6px 0' }}>Obiettivo:</h4>
            <p style={{ color: 'var(--text-main)', marginBottom: '14px' }}>{payload.objective}</p>
            {payload.description && (
              <>
                <h4 style={{ fontSize: '1rem', color: '#fff', margin: '10px 0 6px 0' }}>Dettagli:</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{payload.description}</p>
              </>
            )}
          </div>
        )}

        {type === 'NOTE' && (
          <div style={{ background: 'rgba(10, 14, 24, 0.9)', padding: '20px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glow)' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '12px' }}>{payload.title}</h3>
            <div style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {payload.content}
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={dismissHandout} className="grimoire-btn grimoire-btn-primary">
            Chiudi Handout
          </button>
        </div>
      </div>
    </div>
  );
};
