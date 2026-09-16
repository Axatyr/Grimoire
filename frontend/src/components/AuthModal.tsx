import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { Shield, Sparkles, User, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const AuthModal: React.FC<{ isOpen: boolean; onClose?: () => void }> = ({ isOpen }) => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MASTER' | 'PLAYER'>('MASTER');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        const res = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
            email: email || undefined,
            role,
          }),
        });
        login(res.token, res.user);
      } else {
        const res = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        login(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-responsive-backdrop">
      <div className="glass-panel modal-responsive-content animate-fade-in" style={{
        maxWidth: '440px',
        border: '1px solid var(--border-glow)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px var(--primary-glow)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(245, 158, 11, 0.2))',
            border: '1px solid var(--border-glow)',
            marginBottom: '16px'
          }}>
            <Sparkles size={30} color="var(--accent-gold)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '6px' }}>Grimoire</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isRegister ? 'Crea il tuo profilo da Master o Giocatore' : 'Accedi al tuo Grimorio di Campagna'}
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 14px',
            color: '#fca5a5',
            fontSize: '0.85rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Shield size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
              <input
                className="grimoire-input"
                style={{ paddingLeft: '38px' }}
                placeholder="es. Gandalf, DM_Marco"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Email (opzionale)
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
                <input
                  type="email"
                  className="grimoire-input"
                  style={{ paddingLeft: '38px' }}
                  placeholder="master@avventura.it"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-dim)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="grimoire-input"
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Nascondi password' : 'Mostra password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-main)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-dim)')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                Ruolo Principale
              </label>
              <div className="responsive-form-row-2">
                <button
                  type="button"
                  onClick={() => setRole('MASTER')}
                  className={`grimoire-btn ${role === 'MASTER' ? 'grimoire-btn-gold' : 'grimoire-btn-secondary'}`}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  👑 Dungeon Master
                </button>
                <button
                  type="button"
                  onClick={() => setRole('PLAYER')}
                  className={`grimoire-btn ${role === 'PLAYER' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  ⚔️ Giocatore
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="grimoire-btn grimoire-btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '10px', fontSize: '1rem' }}
          >
            {submitting ? 'Elaborazione in corso...' : (
              <>
                {isRegister ? 'Crea Account' : 'Entra in Grimoire'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isRegister ? (
            <span>
              Hai già un account?{' '}
              <button
                onClick={() => setIsRegister(false)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Accedi
              </button>
            </span>
          ) : (
            <span>
              Non hai ancora un account?{' '}
              <button
                onClick={() => setIsRegister(true)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontWeight: 600 }}
              >
                Registrati
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
