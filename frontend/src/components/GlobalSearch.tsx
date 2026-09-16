import React, { useState, useEffect, useRef } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { apiFetch } from '../services/api';
import {
  Search,
  X,
  Loader2,
  GitFork,
  Compass,
  Map,
  Users,
  UserCheck,
  Shield,
  Briefcase,
  FileText,
  CornerDownLeft,
  Command
} from 'lucide-react';

interface SearchResultItem {
  id: string;
  type: 'story' | 'quests' | 'locations' | 'characters' | 'npcs' | 'monsters' | 'inventory' | 'notes';
  typeLabel: string;
  title: string;
  subtitle?: string;
  snippet?: string;
  visibility?: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  story: GitFork,
  quests: Compass,
  locations: Map,
  characters: Users,
  npcs: UserCheck,
  monsters: Shield,
  inventory: Briefcase,
  notes: FileText,
};

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  story: { bg: 'rgba(139, 92, 246, 0.2)', text: '#c4b5fd', border: 'rgba(139, 92, 246, 0.4)' },
  quests: { bg: 'rgba(245, 158, 11, 0.2)', text: '#fde68a', border: 'rgba(245, 158, 11, 0.4)' },
  locations: { bg: 'rgba(59, 130, 246, 0.2)', text: '#93c5fd', border: 'rgba(59, 130, 246, 0.4)' },
  characters: { bg: 'rgba(16, 185, 129, 0.2)', text: '#a7f3d0', border: 'rgba(16, 185, 129, 0.4)' },
  npcs: { bg: 'rgba(236, 72, 153, 0.2)', text: '#fbcfe8', border: 'rgba(236, 72, 153, 0.4)' },
  monsters: { bg: 'rgba(239, 68, 68, 0.2)', text: '#fca5a5', border: 'rgba(239, 68, 68, 0.4)' },
  inventory: { bg: 'rgba(217, 119, 6, 0.2)', text: '#fef3c7', border: 'rgba(217, 119, 6, 0.4)' },
  notes: { bg: 'rgba(107, 114, 128, 0.2)', text: '#e5e7eb', border: 'rgba(107, 114, 128, 0.4)' },
};

export const GlobalSearch: React.FC = () => {
  const { activeCampaign, setActiveTab } = useCampaign();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut: Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || !activeCampaign) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await apiFetch(`/search?campaignId=${activeCampaign.id}&q=${encodeURIComponent(query.trim())}`);
        setResults(res.results || []);
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [query, activeCampaign?.id]);

  const handleSelect = (item: SearchResultItem) => {
    if (item.type === 'npcs') {
      setActiveTab('characters');
    } else {
      setActiveTab(item.type);
    }
    setIsOpen(false);
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    }
  };

  if (!activeCampaign) return null;

  return (
    <>
      {/* Unified Responsive Search Bar */}
      <div
        onClick={() => setIsOpen(true)}
        className="grimoire-search-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          cursor: 'pointer',
          width: '100%',
          maxWidth: '380px',
          transition: 'all 0.2s ease',
          color: 'var(--text-muted)',
          fontSize: '0.85rem'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'var(--border-glow)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'var(--border-subtle)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        }}
      >
        <Search size={15} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
        <span className="search-bar-placeholder-desktop" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Cerca nel Grimorio...
        </span>
        <span className="search-bar-placeholder-mobile" style={{ display: 'none', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Cerca...
        </span>
        <kbd className="search-bar-kbd" style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '4px',
          padding: '2px 5px',
          fontSize: '0.7rem',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          flexShrink: 0
        }}>
          <Command size={10} />K
        </kbd>
      </div>

      {/* Search Modal / Spotlight Palette */}
      {isOpen && (
        <div
          className="modal-responsive-backdrop"
          onClick={() => setIsOpen(false)}
          style={{
            alignItems: 'flex-start',
            paddingTop: 'max(40px, env(safe-area-inset-top, 40px))',
            paddingLeft: '12px',
            paddingRight: '12px'
          }}
        >
          <div
            ref={searchContainerRef}
            className="glass-panel modal-responsive-content animate-fade-in search-modal-panel"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '640px',
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glow)',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px var(--primary-glow)'
            }}
          >
            {/* Input Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(15, 23, 42, 0.98)'
            }}>
              <Search size={20} color="var(--accent-gold)" style={{ flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDownInInput}
                placeholder="Cerca mostri, NPC, quest, oggetti..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '16px', // Prevents iOS Safari unwanted auto-zoom
                  fontFamily: 'var(--font-sans)',
                  minWidth: 0
                }}
              />
              {loading && <Loader2 size={18} className="spin" color="var(--primary)" style={{ flexShrink: 0 }} />}
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <X size={14} />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  flexShrink: 0
                }}
              >
                Chiudi
              </button>
            </div>

            {/* Results Body */}
            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '10px 12px' }} className="hide-scrollbar">
              {!query.trim() ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                    Digita un nome, una caratteristica, un luogo o una parola chiave
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Cerca istantaneamente in: Trama, Quest, Atlante, Personaggi, NPC, Bestiario, Loot e Note
                  </span>
                </div>
              ) : results.length === 0 && !loading ? (
                <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.95rem' }}>Nessun risultato trovato per "{query}"</p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                    Verifica il testo inserito o prova con un termine più generico
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {results.map((item, index) => {
                    const Icon = TYPE_ICONS[item.type] || FileText;
                    const tagStyle = TYPE_COLORS[item.type] || TYPE_COLORS.notes;
                    const isSelected = index === selectedIndex;

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                          border: isSelected ? '1px solid var(--border-glow)' : '1px solid transparent',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: tagStyle.bg,
                          border: `1px solid ${tagStyle.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Icon size={18} color={tagStyle.text} />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                            <span style={{
                              fontWeight: 600,
                              fontSize: '0.95rem',
                              color: isSelected ? '#fff' : 'var(--text-main)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.title}
                            </span>
                            <span style={{
                              fontSize: '0.7rem',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: tagStyle.bg,
                              color: tagStyle.text,
                              border: `1px solid ${tagStyle.border}`,
                              flexShrink: 0
                            }}>
                              {item.typeLabel}
                            </span>
                          </div>

                          {item.subtitle && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.subtitle}
                            </div>
                          )}

                          {item.snippet && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{item.snippet}"
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text-dim)', flexShrink: 0 }}>
                          <CornerDownLeft size={14} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 16px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(10, 14, 25, 0.85)',
              fontSize: '0.75rem',
              color: 'var(--text-dim)'
            }}>
              <span>
                <strong>{results.length}</strong> {results.length === 1 ? 'risultato trovato' : 'risultati trovati'}
              </span>
              <div className="search-desktop-hints" style={{ display: 'flex', gap: '12px' }}>
                <span>↑↓ Naviga</span>
                <span>↵ Apri</span>
                <span>ESC Chiudi</span>
              </div>
              <div className="search-mobile-hints" style={{ display: 'none' }}>
                <span>Tocca per selezionare</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
