import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import { FileText, Plus, Globe, Lock, Trash2, Edit2, Sparkles, X } from 'lucide-react';
import { CustomPropertiesEditor, CustomPropertiesView, type CustomProperty } from './CustomPropertiesEditor';
import { ShareModal } from './ShareModal';

interface Note {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  sessionDate?: string;
  customProperties?: CustomProperty[];
  author: { id: string; username: string };
}

export const NotesTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [sharingNote, setSharingNote] = useState<Note | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [customProperties, setCustomProperties] = useState<CustomProperty[]>([]);

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

  const resetForm = () => {
    setTitle('');
    setContent('');
    setIsPublic(false);
    setCustomProperties([]);
    setEditingNote(null);
    setShowAddModal(false);
  };

  const openCreateModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsPublic(note.isPublic);
    setCustomProperties(Array.isArray(note.customProperties) ? note.customProperties : []);
    setShowAddModal(false);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeCampaign) return;

    const payload = {
      campaignId: activeCampaign.id,
      title,
      content,
      isPublic,
      customProperties
    };

    try {
      if (editingNote) {
        const res = await apiFetch(`/notes/${editingNote.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setNotes(prev => prev.map(n => n.id === editingNote.id ? res.note : n));
        setEditingNote(null);
      } else {
        const res = await apiFetch('/notes', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setNotes(prev => [res.note, ...prev]);
        setShowAddModal(false);
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio nota');
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
    <div className="grimoire-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText color="var(--primary)" /> Note & Cronache di Sessione
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Diari dei giocatori, indizi, appunti di viaggio, proprietà custom e lettere del Master.
          </p>
        </div>

        <button onClick={openCreateModal} className="grimoire-btn grimoire-btn-primary">
          <Plus size={16} /> Nuova Nota
        </button>
      </div>

      <div className="responsive-grid-cards">
        {notes.map(note => {
          const canEdit = isMaster || note.author?.id === user?.id;

          return (
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
                  marginBottom: '10px'
                }}>
                  {note.content}
                </div>

                {/* Custom Properties */}
                <CustomPropertiesView properties={note.customProperties} isMaster={isMaster} />
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Scritto da: <strong style={{ color: '#fff' }}>{note.author?.username}</strong>
                </span>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {isMaster && (
                    <button
                      onClick={() => setSharingNote(note)}
                      className="grimoire-btn grimoire-btn-gold"
                      style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                    >
                      <Sparkles size={12} /> Trasmetti...
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(note)}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ padding: '5px 8px' }}
                      title="Modifica Nota"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="grimoire-btn grimoire-btn-danger"
                      style={{ padding: '5px 8px' }}
                      title="Elimina Nota"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      {sharingNote && (
        <ShareModal
          isOpen={true}
          onClose={() => setSharingNote(null)}
          type="NOTE"
          title={sharingNote.title}
          payload={sharingNote}
        />
      )}

      {/* Create / Edit Note Modal */}
      {(showAddModal || editingNote) && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>
                {editingNote ? 'Modifica Nota' : 'Nuova Nota di Campagna'}
              </h3>
              <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveNote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

              {/* Custom Properties Editor */}
              <CustomPropertiesEditor
                properties={customProperties}
                onChange={setCustomProperties}
                isMaster={isMaster}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={resetForm} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">
                  {editingNote ? 'Salva Modifiche' : 'Salva Nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
