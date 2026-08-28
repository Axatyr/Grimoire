import React, { useState, useEffect } from 'react';
import { useCampaign } from '../context/CampaignContext';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import {
  GitFork,
  Plus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  SkipForward,
  Trash2,
  Sparkles,
  Link as LinkIcon,
  Layers,
  ChevronRight
} from 'lucide-react';

interface StoryNode {
  id: string;
  campaignId: string;
  title: string;
  summary?: string;
  status: 'PLANNED' | 'REACHED' | 'SKIPPED' | 'ALTERED';
  content?: string;
  links?: Array<{ id: string; entityType: string; entityId: string }>;
}

interface StoryEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  choiceLabel?: string;
  condition?: string;
  fromNode?: { id: string; title: string };
  toNode?: { id: string; title: string };
}

export const StoryTree: React.FC = () => {
  const { activeCampaign, broadcastHandout } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [edges, setEdges] = useState<StoryEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);

  // New Node Form Modal
  const [showAddNode, setShowAddNode] = useState(false);
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeSummary, setNodeSummary] = useState('');
  const [nodeContent, setNodeContent] = useState('');

  // New Edge Form Modal
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [fromNodeId, setFromNodeId] = useState('');
  const [toNodeId, setToNodeId] = useState('');
  const [choiceLabel, setChoiceLabel] = useState('');

  // Session Recap Modal
  const [recapModal, setRecapModal] = useState<string | null>(null);

  const fetchGraph = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/story/campaign/${activeCampaign.id}`);
      setNodes(res.nodes || []);
      setEdges(res.edges || []);
      if (res.nodes && res.nodes.length > 0 && !selectedNode) {
        setSelectedNode(res.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load story tree', err);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [activeCampaign?.id]);

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeTitle.trim() || !activeCampaign) return;
    try {
      const res = await apiFetch('/story/nodes', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          title: nodeTitle,
          summary: nodeSummary,
          content: nodeContent,
          status: 'PLANNED'
        })
      });
      setNodes(prev => [...prev, res.node]);
      setSelectedNode(res.node);
      setShowAddNode(false);
      setNodeTitle('');
      setNodeSummary('');
      setNodeContent('');
    } catch (err: any) {
      alert(err.message || 'Errore creazione nodo');
    }
  };

  const handleUpdateStatus = async (nodeId: string, status: 'PLANNED' | 'REACHED' | 'SKIPPED' | 'ALTERED') => {
    try {
      const res = await apiFetch(`/story/nodes/${nodeId}`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      setNodes(prev => prev.map(n => n.id === nodeId ? res.node : n));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(res.node);
      }
    } catch (err: any) {
      alert(err.message || 'Errore aggiornamento');
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo nodo della storia?')) return;
    try {
      await apiFetch(`/story/nodes/${nodeId}`, { method: 'DELETE' });
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    } catch (err: any) {
      alert(err.message || 'Errore cancellazione nodo');
    }
  };

  const handleCreateEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromNodeId || !toNodeId || !activeCampaign) return;
    try {
      const res = await apiFetch('/story/edges', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: activeCampaign.id,
          fromNodeId,
          toNodeId,
          choiceLabel
        })
      });
      setEdges(prev => [...prev, res.edge]);
      setShowAddEdge(false);
      setChoiceLabel('');
    } catch (err: any) {
      alert(err.message || 'Errore collegamento nodi');
    }
  };

  const handleGenerateRecap = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/story/campaign/${activeCampaign.id}/recap`);
      setRecapModal(res.recapMarkdown);
    } catch (err: any) {
      alert(err.message || 'Errore generazione riassunto');
    }
  };

  const getStatusBadge = (status: StoryNode['status']) => {
    switch (status) {
      case 'REACHED':
        return <span className="badge badge-rarity-uncommon"><CheckCircle2 size={12} /> Completato / Raggiunto</span>;
      case 'ALTERED':
        return <span className="badge badge-rarity-rare"><AlertCircle size={12} /> Percorso Modificato</span>;
      case 'SKIPPED':
        return <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}><SkipForward size={12} /> Saltato</span>;
      default:
        return <span className="badge badge-rarity-very-rare"><HelpCircle size={12} /> Pianificato</span>;
    }
  };

  if (!activeCampaign) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p>Seleziona o crea una campagna per visualizzare lo Story Path.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GitFork color="var(--primary)" /> Albero Decisionale & Session Flow
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Mappa le scelte dei giocatori, i bivi narrativi e le diramazioni della sessione.
          </p>
        </div>

        {isMaster && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateRecap}
              className="grimoire-btn grimoire-btn-gold"
            >
              <Sparkles size={16} /> Genera Recap di Sessione
            </button>
            <button
              onClick={() => setShowAddEdge(true)}
              className="grimoire-btn grimoire-btn-secondary"
            >
              <LinkIcon size={16} /> Collega Bivio / Scelta
            </button>
            <button
              onClick={() => setShowAddNode(true)}
              className="grimoire-btn grimoire-btn-primary"
            >
              <Plus size={16} /> Aggiungi Nodo di Trama
            </button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(320px, 1fr)', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {nodes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Layers size={40} style={{ margin: '0 auto 16px auto', color: 'var(--primary)' }} />
              <h3 style={{ color: '#fff', marginBottom: '8px' }}>Nessun nodo di trama creato</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                Inizia a preparare la sessione aggiungendo il punto di partenza dell'avventura.
              </p>
              {isMaster && (
                <button onClick={() => setShowAddNode(true)} className="grimoire-btn grimoire-btn-primary">
                  <Plus size={16} /> Crea Primo Nodo
                </button>
              )}
            </div>
          ) : (
            nodes.map((node, index) => {
              const isSelected = selectedNode?.id === node.id;
              const outgoingEdges = edges.filter(e => e.fromNodeId === node.id);

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`glass-panel ${isSelected ? '' : 'glass-panel-hover'}`}
                  style={{
                    padding: '18px 22px',
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--border-glow)' : undefined,
                    boxShadow: isSelected ? '0 0 20px rgba(139, 92, 246, 0.25)' : undefined,
                    borderLeft: `4px solid ${
                      node.status === 'REACHED' ? 'var(--accent-emerald)' :
                      node.status === 'ALTERED' ? 'var(--accent-cyan)' :
                      node.status === 'SKIPPED' ? 'var(--text-dim)' : 'var(--primary)'
                    }`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          #{index + 1}
                        </span>
                        <h4 style={{ fontSize: '1.15rem', color: '#fff' }}>{node.title}</h4>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(node.status)}
                    </div>
                  </div>

                  {node.summary && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.4', marginBottom: '12px' }}>
                      {node.summary}
                    </p>
                  )}

                  {outgoingEdges.length > 0 && (
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, textTransform: 'uppercase' }}>
                        Bivi & Decisioni Possibili:
                      </span>
                      {outgoingEdges.map(edge => {
                        const targetNode = nodes.find(n => n.id === edge.toNodeId);
                        return (
                          <div key={edge.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            color: 'var(--text-main)',
                            background: 'rgba(255, 255, 255, 0.03)',
                            padding: '4px 8px',
                            borderRadius: '4px'
                          }}>
                            <ChevronRight size={14} color="var(--primary)" />
                            <span style={{ fontWeight: 500, color: '#fde68a' }}>{edge.choiceLabel || 'Scelta'}</span>
                            <span style={{ color: 'var(--text-dim)' }}>➔</span>
                            <span>{targetNode?.title || 'Nodo successivo'}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Selected Node Details & Live Session Actions */}
        <div>
          {selectedNode ? (
            <div className="glass-panel" style={{ padding: '26px', position: 'sticky', top: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Scheda Nodo Sessione
                  </span>
                  <h3 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '4px' }}>{selectedNode.title}</h3>
                </div>
                {isMaster && (
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="grimoire-btn grimoire-btn-danger"
                    style={{ padding: '6px 10px' }}
                    title="Elimina Nodo"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              {isMaster && (
                <div style={{
                  background: 'rgba(10, 14, 24, 0.8)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '20px',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Stato di avanzamento nella sessione:
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleUpdateStatus(selectedNode.id, 'REACHED')}
                      className={`grimoire-btn ${selectedNode.status === 'REACHED' ? 'grimoire-btn-gold' : 'grimoire-btn-secondary'}`}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <CheckCircle2 size={14} /> Raggiunto
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedNode.id, 'ALTERED')}
                      className={`grimoire-btn ${selectedNode.status === 'ALTERED' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <AlertCircle size={14} /> Modificato dai PG
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedNode.id, 'SKIPPED')}
                      className={`grimoire-btn ${selectedNode.status === 'SKIPPED' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <SkipForward size={14} /> Saltato
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedNode.id, 'PLANNED')}
                      className={`grimoire-btn ${selectedNode.status === 'PLANNED' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <HelpCircle size={14} /> Pianificato
                    </button>
                  </div>
                </div>
              )}

              {selectedNode.summary && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Premessa / Situazione
                  </h4>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {selectedNode.summary}
                  </p>
                </div>
              )}

              {selectedNode.content && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Appunti Master & Dettagli
                  </h4>
                  <div style={{
                    background: 'rgba(5, 8, 15, 0.6)',
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    color: '#e2e8f0',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {selectedNode.content}
                  </div>
                </div>
              )}

              {isMaster && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => broadcastHandout('NOTE', { title: selectedNode.title, content: selectedNode.summary || selectedNode.content })}
                    className="grimoire-btn grimoire-btn-secondary"
                    style={{ width: '100%' }}
                  >
                    <Sparkles size={16} color="var(--accent-gold)" /> Condividi Situazione con i Giocatori
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Seleziona un nodo dall'albero per visualizzarne i dettagli e gestirne lo stato.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Node Modal */}
      {showAddNode && (
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
            <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '18px' }}>Nuovo Nodo di Trama</h3>
            <form onSubmit={handleCreateNode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Titolo Nodo (es. "Arrivo alla Locanda del Dragone", "Incontro con il Necromante")
                </label>
                <input
                  className="grimoire-input"
                  value={nodeTitle}
                  onChange={e => setNodeTitle(e.target.value)}
                  placeholder="Titolo della scena o bivio"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Sinossi / Descrizione Breve
                </label>
                <input
                  className="grimoire-input"
                  value={nodeSummary}
                  onChange={e => setNodeSummary(e.target.value)}
                  placeholder="Cosa succede in questa scena"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Appunti Dettagliati Master (dialoghi, indizi, trappole)
                </label>
                <textarea
                  className="grimoire-textarea"
                  rows={4}
                  value={nodeContent}
                  onChange={e => setNodeContent(e.target.value)}
                  placeholder="Note dettagliate per gestire la scena durante la sessione..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddNode(false)} className="grimoire-btn grimoire-btn-secondary">
                  Annulla
                </button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">
                  Crea Nodo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Edge Modal */}
      {showAddEdge && (
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
            <h3 style={{ color: '#fff', fontSize: '1.3rem', marginBottom: '18px' }}>Collega Bivio Narrativo</h3>
            <form onSubmit={handleCreateEdge} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Da Nodo:
                </label>
                <select
                  className="grimoire-select"
                  value={fromNodeId}
                  onChange={e => setFromNodeId(e.target.value)}
                  required
                >
                  <option value="">Seleziona nodo di partenza...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Etichetta Scelta (es. "Accettano la missione", "Fuggono dal dungeon", "Uccidono il boss"):
                </label>
                <input
                  className="grimoire-input"
                  value={choiceLabel}
                  onChange={e => setChoiceLabel(e.target.value)}
                  placeholder="Azione o scelta dei giocatori"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  A Nodo Successivo:
                </label>
                <select
                  className="grimoire-select"
                  value={toNodeId}
                  onChange={e => setToNodeId(e.target.value)}
                  required
                >
                  <option value="">Seleziona nodo di arrivo...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.title}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddEdge(false)} className="grimoire-btn grimoire-btn-secondary">
                  Annulla
                </button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">
                  Crea Collegamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Recap Modal */}
      {recapModal && (
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
          <div className="glass-panel animate-fade-in" style={{ maxWidth: '650px', width: '100%', padding: '28px' }}>
            <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.4rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} /> Riepilogo di Sessione Generato
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
              Questo riepilogo è stato calcolato dai nodi completati e modificati durante la sessione di gioco.
            </p>
            <div style={{
              background: 'rgba(10, 14, 24, 0.9)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              maxHeight: '350px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: '#f1f5f9',
              whiteSpace: 'pre-wrap',
              marginBottom: '20px'
            }}>
              {recapModal}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(recapModal);
                  alert('Riepilogo copiato negli appunti!');
                }}
                className="grimoire-btn grimoire-btn-secondary"
              >
                Copia Markdown
              </button>
              <button onClick={() => setRecapModal(null)} className="grimoire-btn grimoire-btn-primary">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
