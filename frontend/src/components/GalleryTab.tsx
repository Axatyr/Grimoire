import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch, BACKEND_URL } from '../services/api';

import { Image as ImageIcon, Upload, Link2, Sparkles, Trash2, X } from 'lucide-react';
import { ShareModal } from './ShareModal';

interface GrimoireImage {
  id: string;
  filename: string;
  url: string;
  altText?: string;
  sourceType: 'UPLOADED' | 'EXTERNAL_URL';
}

export const GalleryTab: React.FC = () => {
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [images, setImages] = useState<GrimoireImage[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sharingImage, setSharingImage] = useState<GrimoireImage | null>(null);
  const [mode, setMode] = useState<'UPLOAD' | 'LINK'>('LINK');

  // Form state
  const [externalUrl, setExternalUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchImages = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/images?campaignId=${activeCampaign.id}`);
      setImages(res.images || []);
    } catch (err) {
      console.error('Failed to load images', err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, [activeCampaign?.id]);

  const handleAddExternal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!externalUrl.trim() || !activeCampaign) return;
    try {
      const res = await apiFetch('/images/external', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          url: externalUrl,
          filename: altText || 'Immagine Web',
          altText
        })
      });
      setImages(prev => [res.image, ...prev]);
      setShowAddModal(false);
      setExternalUrl('');
      setAltText('');
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio immagine');
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !activeCampaign) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('campaignId', activeCampaign.id);
      if (altText) formData.append('altText', altText);

      const res = await apiFetch('/images/upload', {
        method: 'POST',
        body: formData
      });
      setImages(prev => [res.image, ...prev]);
      setShowAddModal(false);
      setSelectedFile(null);
      setAltText('');
    } catch (err: any) {
      alert(err.message || 'Errore upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Rimuovere questa immagine dal grimorio?')) return;
    try {
      await apiFetch(`/images/${imageId}`, { method: 'DELETE' });
      setImages(prev => prev.filter(i => i.id !== imageId));
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
            <ImageIcon color="var(--primary)" /> Grimorio Visivo & Handouts
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Illustrazioni, mappe, ritratti e indizi visivi da mostrare in tempo reale sui monitor dei giocatori.
          </p>
        </div>

        {isMaster && (
          <button onClick={() => setShowAddModal(true)} className="grimoire-btn grimoire-btn-primary">
            <Upload size={16} /> Aggiungi Immagine / Link
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {images.map(img => {
          const displayUrl = img.url.startsWith('http') ? img.url : `${BACKEND_URL}${img.url}`;
          return (
            <div key={img.id} className="glass-panel glass-panel-hover" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: '200px', width: '100%', background: '#070a10', position: 'relative' }}>
                <img
                  src={displayUrl}
                  alt={img.altText || img.filename}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="badge badge-rarity-rare" style={{ position: 'absolute', top: '10px', right: '10px', backdropFilter: 'blur(8px)' }}>
                  {img.sourceType === 'EXTERNAL_URL' ? 'Web Link' : 'Locale'}
                </span>
              </div>

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '12px' }}>
                  {img.altText || img.filename}
                </h4>

                {isMaster && (
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      onClick={() => setSharingImage(img)}
                      className="grimoire-btn grimoire-btn-gold"
                      style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <Sparkles size={14} /> Mostra ai Giocatori...
                    </button>
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="grimoire-btn grimoire-btn-danger"
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Modal */}
      {sharingImage && (
        <ShareModal
          isOpen={true}
          onClose={() => setSharingImage(null)}
          type="IMAGE"
          title={sharingImage.altText || sharingImage.filename}
          payload={sharingImage}
        />
      )}

      {/* Add Image Modal */}
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>Aggiungi Immagine al Grimorio</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setMode('LINK')}
                className={`grimoire-btn ${mode === 'LINK' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                style={{ fontSize: '0.85rem' }}
              >
                <Link2 size={16} /> Link Diretto Web
              </button>
              <button
                type="button"
                onClick={() => setMode('UPLOAD')}
                className={`grimoire-btn ${mode === 'UPLOAD' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                style={{ fontSize: '0.85rem' }}
              >
                <Upload size={16} /> Carica File Locale
              </button>
            </div>

            {mode === 'LINK' ? (
              <form onSubmit={handleAddExternal} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>URL Immagine</label>
                  <input className="grimoire-input" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://sito.com/mappa.jpg" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Titolo / Didascalia</label>
                  <input className="grimoire-input" value={altText} onChange={e => setAltText(e.target.value)} placeholder="es. Mappa dei Sotterranei di Wave Echo Cave" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                  <button type="submit" className="grimoire-btn grimoire-btn-primary">Salva Link</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleUploadFile} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Seleziona File dal Disco</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    className="grimoire-input"
                    style={{ padding: '8px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Titolo / Didascalia</label>
                  <input className="grimoire-input" value={altText} onChange={e => setAltText(e.target.value)} placeholder="es. Lettera con il sigillo spezzato" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="grimoire-btn grimoire-btn-secondary">Annulla</button>
                  <button type="submit" disabled={uploading} className="grimoire-btn grimoire-btn-primary">
                    {uploading ? 'Caricamento...' : 'Carica sul Server'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
