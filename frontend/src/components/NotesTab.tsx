import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { FileText, Plus, Globe, Lock, Trash2, Sparkles, X } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  sessionDate?: string;
  author: { id: string; username: string };
}

export const NotesTab: React.FC = () => {
  const { activeCampaign, broadcastHandout } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const fetchNotes = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/notes?campaignId=${activeCampaign.id}`);
      setNotes(res.notes || []);
    } catch (err) {
      console.error('Failed to load notes', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [activeCampaign?.id]);

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeCampaign) return;
    try {
      const res = await apiFetch('/notes', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          title,
          content,
          isPublic
        })
      });
      setNotes(prev => [res.note, ...prev]);
      setShowAddModal(false);
      setTitle('');
      setContent('');
      setIsPublic(false);
    } catch (err: any) {
      alert(err.message || 'Errore creazione nota');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Eliminare questa nota?')) return;
    try {
      await apiFetch(`/notes/${noteId}`, { method: 'DELETE' });
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err: any) {
      alert(err.message || 'Errore cancellazione');
    }
  };

  if (!activeCampaign) return null;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText color="var(--primary)" /> Note & Cronache di Sessione
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Diari dei giocatori, indizi, appunti di viaggio e lettere del Master.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="grimoire-btn grimoire-btn-primary">
          <Plus size={16} /> Nuova Nota
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {notes.map(note => (
          <div key={note.id} className="glass-panel glass-panel-hover" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>{note.title}</h3>
                <span className={`badge ${note.isPublic ? 'badge-rarity-uncommon' : 'badge-rarity-common'}`}>
                  {note.isPublic ? <><Globe size={12} /> Pubblica</> : <><Lock size={12} /> Personale</>}
                </span>
              </div>

              <div style={{
                background: 'rgba(5, 8, 15, 0.6)',
                padding: '14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                maxHeight: '220px',
                overflowY: 'auto',
                marginBottom: '14px'
              }}>
                {note.content}
              </div>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Scritto da: <strong style={{ color: '#fff' }}>{note.author?.username}</strong>
              </span>

              <div style={{ display: 'flex', gap: '6px' }}>
                {isMaster && (
                  <button
                    onClick={() => broadcastHandout('NOTE', note)}
                    className="grimoire-btn grimoire-btn-gold"
                    style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                  >
                    <Sparkles size={12} /> Trasmetti
                  </button>
                )}
                {(isMaster || note.author?.id === user?.id) && (
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="grimoire-btn grimoire-btn-danger"
                    style={{ padding: '5px 8px' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Note Modal */}
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Nuova Nota di Campagna</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Titolo Nota</label>
                <input className="grimoire-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="es. Lettera del Barone, Enigma della Porta delle Rune" required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Contenuto / Testo</label>
                <textarea className="grimoire-textarea" rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="Scrivi il testo della nota o della pergamena..." required />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="publicToggle" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                <label htmlFor="publicToggle" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                  Rendi visibile a tutti i giocatori della campagna
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">Salva Nota</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
