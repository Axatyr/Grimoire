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
  PlayCircle,
  Trash2,
  Edit2,
  Sparkles,
  Link as LinkIcon,
  Layers,
  ChevronRight,
  ChevronDown,
  UserCheck,
  Shield,
  MapPin,
  Briefcase,
  Users,
  Compass,
  CornerDownRight,
  Search,
  Activity,
  Flame,
  Filter,
  X
} from 'lucide-react';
import { ShareModal } from './ShareModal';

interface StoryNodeLink {
  id?: string;
  entityType: 'NPC' | 'MONSTER' | 'ITEM' | 'LOCATION' | 'QUEST' | 'CHARACTER';
  entityId: string;
  entityName?: string;
  extraInfo?: Record<string, any>;
}

interface StoryNode {
  id: string;
  campaignId: string;
  title: string;
  summary?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'REACHED' | 'SKIPPED' | 'ALTERED';
  content?: string;
  links?: StoryNodeLink[];
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
  const { activeCampaign } = useCampaign();
  const { user } = useAuth();
  const isMaster = user?.role === 'MASTER' || user?.role === 'ADMIN';

  const [nodes, setNodes] = useState<StoryNode[]>([]);
  const [edges, setEdges] = useState<StoryEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Available campaign entities for link picker
  const [availableNpcs, setAvailableNpcs] = useState<Array<{ id: string; name: string; role?: string }>>([]);
  const [availableMonsters, setAvailableMonsters] = useState<Array<{ id: string; name: string; cr?: string }>>([]);
  const [availableLocations, setAvailableLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [availableItems, setAvailableItems] = useState<Array<{ id: string; name: string; rarity?: string }>>([]);
  const [availableQuests, setAvailableQuests] = useState<Array<{ id: string; title: string; status?: string }>>([]);
  const [availableCharacters, setAvailableCharacters] = useState<Array<{ id: string; name: string; class?: string }>>([]);

  // Form Modals
  const [showAddNode, setShowAddNode] = useState(false);
  const [editingNode, setEditingNode] = useState<StoryNode | null>(null);
  const [parentForNewNode, setParentForNewNode] = useState<StoryNode | null>(null);
  const [childChoiceLabel, setChildChoiceLabel] = useState<string>('');

  // Node form fields
  const [nodeTitle, setNodeTitle] = useState('');
  const [nodeSummary, setNodeSummary] = useState('');
  const [nodeContent, setNodeContent] = useState('');
  const [nodeStatus, setNodeStatus] = useState<StoryNode['status']>('PLANNED');
  const [nodeLinks, setNodeLinks] = useState<StoryNodeLink[]>([]);

  // Link picker transient fields
  const [selectedLinkType, setSelectedLinkType] = useState<StoryNodeLink['entityType']>('NPC');
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');

  // New Edge Form Modal
  const [showAddEdge, setShowAddEdge] = useState(false);
  const [fromNodeId, setFromNodeId] = useState('');
  const [toNodeId, setToNodeId] = useState('');
  const [choiceLabel, setChoiceLabel] = useState('');

  // Share Modal
  const [sharingData, setSharingData] = useState<{ title: string; payload: any } | null>(null);

  // Session Recap Modal
  const [recapModal, setRecapModal] = useState<string | null>(null);

  // Story Progression & Search Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'REACHED' | 'PLANNED' | 'SKIPPED'>('ALL');
  const [nodeSearch, setNodeSearch] = useState('');

  const fetchGraph = async () => {
    if (!activeCampaign) return;
    try {
      const res = await apiFetch(`/story/campaign/${activeCampaign.id}`);
      const fetchedNodes: StoryNode[] = res.nodes || [];
      const fetchedEdges: StoryEdge[] = res.edges || [];
      setNodes(fetchedNodes);
      setEdges(fetchedEdges);

      // Expand all nodes by default
      const initialExpanded: Record<string, boolean> = {};
      fetchedNodes.forEach(n => {
        initialExpanded[n.id] = true;
      });
      setExpandedNodes(prev => ({ ...initialExpanded, ...prev }));

      if (fetchedNodes.length > 0) {
        if (!selectedNode || !fetchedNodes.find(n => n.id === selectedNode.id)) {
          setSelectedNode(fetchedNodes[0]);
        } else {
          const refreshed = fetchedNodes.find(n => n.id === selectedNode.id);
          if (refreshed) setSelectedNode(refreshed);
        }
      }
    } catch (err) {
      console.error('Failed to load story tree', err);
    }
  };

  const fetchEntitiesForLinks = async () => {
    if (!activeCampaign || !isMaster) return;
    try {
      const [npcsRes, monstersRes, locsRes, itemsRes, questsRes, charsRes] = await Promise.all([
        apiFetch(`/npcs?campaignId=${activeCampaign.id}`),
        apiFetch(`/monsters?campaignId=${activeCampaign.id}`),
        apiFetch(`/locations?campaignId=${activeCampaign.id}`),
        apiFetch(`/items?campaignId=${activeCampaign.id}`),
        apiFetch(`/quests?campaignId=${activeCampaign.id}`),
        apiFetch(`/characters?campaignId=${activeCampaign.id}`),
      ]);

      setAvailableNpcs(npcsRes.npcs || []);
      setAvailableMonsters(monstersRes.monsters || []);
      setAvailableLocations(locsRes.locations || []);
      setAvailableItems(itemsRes.items || []);
      setAvailableQuests(questsRes.quests || []);
      setAvailableCharacters(charsRes.characters || []);
    } catch (err) {
      console.error('Failed to fetch entities for links', err);
    }
  };

  useEffect(() => {
    fetchGraph();
    fetchEntitiesForLinks();
  }, [activeCampaign?.id, isMaster]);

  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const resetNodeForm = () => {
    setNodeTitle('');
    setNodeSummary('');
    setNodeContent('');
    setNodeStatus('PLANNED');
    setNodeLinks([]);
    setSelectedLinkType('NPC');
    setSelectedLinkId('');
    setParentForNewNode(null);
    setChildChoiceLabel('');
    setEditingNode(null);
    setShowAddNode(false);
  };

  const openCreateNodeModal = () => {
    resetNodeForm();
    setShowAddNode(true);
  };

  const openAddChildNodeModal = (parent: StoryNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    resetNodeForm();
    setParentForNewNode(parent);
    setChildChoiceLabel('');
    setShowAddNode(true);
  };

  const openEditNodeModal = (node: StoryNode) => {
    setEditingNode(node);
    setNodeTitle(node.title);
    setNodeSummary(node.summary || '');
    setNodeContent(node.content || '');
    setNodeStatus(node.status);
    setNodeLinks(node.links || []);
    setParentForNewNode(null);
    setShowAddNode(false);
  };

  const handleAddLinkToForm = () => {
    if (!selectedLinkId) return;
    if (nodeLinks.some(l => l.entityType === selectedLinkType && l.entityId === selectedLinkId)) {
      alert('Questo elemento è già collegato al nodo.');
      return;
    }

    let entityName = 'Entità';
    if (selectedLinkType === 'NPC') entityName = availableNpcs.find(n => n.id === selectedLinkId)?.name || 'NPC';
    if (selectedLinkType === 'MONSTER') entityName = availableMonsters.find(m => m.id === selectedLinkId)?.name || 'Mostro';
    if (selectedLinkType === 'LOCATION') entityName = availableLocations.find(l => l.id === selectedLinkId)?.name || 'Luogo';
    if (selectedLinkType === 'ITEM') entityName = availableItems.find(i => i.id === selectedLinkId)?.name || 'Oggetto';
    if (selectedLinkType === 'QUEST') entityName = availableQuests.find(q => q.id === selectedLinkId)?.title || 'Quest';
    if (selectedLinkType === 'CHARACTER') entityName = availableCharacters.find(c => c.id === selectedLinkId)?.name || 'Personaggio';

    setNodeLinks(prev => [
      ...prev,
      {
        entityType: selectedLinkType,
        entityId: selectedLinkId,
        entityName
      }
    ]);
    setSelectedLinkId('');
  };

  const handleRemoveLinkFromForm = (index: number) => {
    setNodeLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeTitle.trim() || !activeCampaign) return;

    const payload = {
      campaignId: activeCampaign.id,
      title: nodeTitle,
      summary: nodeSummary,
      content: nodeContent,
      status: nodeStatus,
      links: nodeLinks.map(l => ({ entityType: l.entityType, entityId: l.entityId }))
    };

    try {
      if (editingNode) {
        const res = await apiFetch(`/story/nodes/${editingNode.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setNodes(prev => prev.map(n => n.id === editingNode.id ? res.node : n));
        setSelectedNode(res.node);
      } else {
        const res = await apiFetch('/story/nodes', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setNodes(prev => [...prev, res.node]);
        setSelectedNode(res.node);

        // If created as a child of another node, automatically create the edge
        if (parentForNewNode) {
          const edgeRes = await apiFetch('/story/edges', {
            method: 'POST',
            body: JSON.stringify({
              campaignId: activeCampaign.id,
              fromNodeId: parentForNewNode.id,
              toNodeId: res.node.id,
              choiceLabel: childChoiceLabel.trim() || undefined
            })
          });
          setEdges(prev => [...prev, edgeRes.edge]);
          setExpandedNodes(prev => ({
            ...prev,
            [parentForNewNode.id]: true,
            [res.node.id]: true
          }));
        } else {
          setExpandedNodes(prev => ({ ...prev, [res.node.id]: true }));
        }
      }
      resetNodeForm();
    } catch (err: any) {
      alert(err.message || 'Errore salvataggio nodo');
    }
  };

  const handleUpdateStatus = async (nodeId: string, status: StoryNode['status']) => {
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
      setEdges(prev => prev.filter(e => e.fromNodeId !== nodeId && e.toNodeId !== nodeId));
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
      setExpandedNodes(prev => ({ ...prev, [fromNodeId]: true }));
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
      case 'IN_PROGRESS':
        return <span className="badge badge-rarity-rare" style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#67e8f9', border: '1px solid rgba(6, 182, 212, 0.5)' }}><PlayCircle size={12} /> In Corso</span>;
      case 'REACHED':
        return <span className="badge badge-rarity-uncommon"><CheckCircle2 size={12} /> Raggiunto</span>;
      case 'ALTERED':
        return <span className="badge badge-rarity-rare"><AlertCircle size={12} /> Modificato dai PG</span>;
      case 'SKIPPED':
        return <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}><SkipForward size={12} /> Saltato</span>;
      default:
        return <span className="badge badge-rarity-very-rare"><HelpCircle size={12} /> Pianificato (DM)</span>;
    }
  };

  const getLinkIcon = (type: StoryNodeLink['entityType']) => {
    switch (type) {
      case 'NPC': return <UserCheck size={12} color="#a78bfa" />;
      case 'MONSTER': return <Shield size={12} color="#f87171" />;
      case 'LOCATION': return <MapPin size={12} color="#38bdf8" />;
      case 'ITEM': return <Briefcase size={12} color="#fbbf24" />;
      case 'QUEST': return <Compass size={12} color="#34d399" />;
      case 'CHARACTER': return <Users size={12} color="#c084fc" />;
    }
  };

  // Story Path Progression Calculations
  const inProgressNodes = nodes.filter(n => n.status === 'IN_PROGRESS');
  const activeInProgressNode = inProgressNodes[0] || null;
  const reachedCount = nodes.filter(n => n.status === 'REACHED' || n.status === 'ALTERED').length;
  const inProgressCount = inProgressNodes.length;
  const plannedCount = nodes.filter(n => n.status === 'PLANNED').length;
  const skippedCount = nodes.filter(n => n.status === 'SKIPPED').length;
  const totalNodesCount = nodes.length;
  const progressPercent = totalNodesCount > 0 ? Math.round((reachedCount / totalNodesCount) * 100) : 0;

  // Filtered nodes logic
  const isFilteringActive = statusFilter !== 'ALL' || nodeSearch.trim() !== '';
  const filteredNodes = nodes.filter(node => {
    if (statusFilter === 'IN_PROGRESS' && node.status !== 'IN_PROGRESS') return false;
    if (statusFilter === 'REACHED' && node.status !== 'REACHED' && node.status !== 'ALTERED') return false;
    if (statusFilter === 'PLANNED' && node.status !== 'PLANNED') return false;
    if (statusFilter === 'SKIPPED' && node.status !== 'SKIPPED') return false;
    if (nodeSearch.trim()) {
      const q = nodeSearch.toLowerCase();
      const matchTitle = node.title.toLowerCase().includes(q);
      const matchSummary = node.summary?.toLowerCase().includes(q);
      const matchContent = node.content?.toLowerCase().includes(q);
      const matchLinks = node.links?.some(l => l.entityName?.toLowerCase().includes(q));
      if (!matchTitle && !matchSummary && !matchContent && !matchLinks) return false;
    }
    return true;
  });

  // Find Root Nodes: Nodes that have no incoming edges from any other node currently visible
  const incomingTargetNodeIds = new Set(edges.map(e => e.toNodeId));
  const rootNodes = nodes.filter(n => !incomingTargetNodeIds.has(n.id));
  const displayRoots = rootNodes.length > 0 ? rootNodes : nodes;

  // Recursive Node Item Renderer for nested branch expansion
  const renderNestedNode = (node: StoryNode, depth = 0, edgeLabel?: string, visited = new Set<string>()): React.ReactNode => {
    if (visited.has(node.id)) return null; // Prevent cycles
    const currentVisited = new Set(visited);
    currentVisited.add(node.id);

    const isSelected = selectedNode?.id === node.id;
    const isExpanded = !!expandedNodes[node.id];
    const outgoingEdges = edges.filter(e => e.fromNodeId === node.id);
    const hasChildren = outgoingEdges.length > 0;
    const quests = node.links?.filter(l => l.entityType === 'QUEST') || [];
    const otherLinks = node.links?.filter(l => l.entityType !== 'QUEST') || [];

    return (
      <div key={node.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: depth > 0 ? '20px' : '0px' }}>
        <div
          onClick={() => setSelectedNode(node)}
          className={`glass-panel ${isSelected ? '' : 'glass-panel-hover'}`}
          style={{
            padding: depth > 0 ? '14px 16px' : '18px 20px',
            cursor: 'pointer',
            borderColor: isSelected ? 'var(--border-glow)' : node.status === 'IN_PROGRESS' ? 'rgba(6, 182, 212, 0.4)' : undefined,
            boxShadow: node.status === 'IN_PROGRESS'
              ? (isSelected ? '0 0 24px rgba(6, 182, 212, 0.5)' : '0 0 16px rgba(6, 182, 212, 0.25)')
              : (isSelected ? '0 0 20px rgba(139, 92, 246, 0.25)' : undefined),
            borderLeft: `4px solid ${
              node.status === 'IN_PROGRESS' ? 'var(--accent-cyan)' :
              node.status === 'REACHED' ? 'var(--accent-emerald)' :
              node.status === 'ALTERED' ? 'var(--accent-gold)' :
              node.status === 'SKIPPED' ? 'var(--text-dim)' : 'var(--primary)'
            }`,
            background: depth > 0 ? 'rgba(15, 23, 42, 0.75)' : undefined
          }}
        >
          {/* Branch choice label if nested */}
          {edgeLabel && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-gold)',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '2px 8px',
              borderRadius: '4px',
              marginBottom: '8px'
            }}>
              <ChevronRight size={12} /> Scelta: "{edgeLabel}"
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => toggleExpand(node.id, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-gold)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={isExpanded ? 'Comprimi diramazioni' : 'Espandi diramazioni'}
                >
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </button>
              )}
              <h4 style={{ fontSize: depth > 0 ? '1.05rem' : '1.15rem', color: '#fff' }}>
                {node.title}
              </h4>
              {node.status === 'IN_PROGRESS' && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: '#67e8f9',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.5px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }} />
                  IN CORSO
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {getStatusBadge(node.status)}
              {isMaster && (
                <button
                  type="button"
                  onClick={(e) => openAddChildNodeModal(node, e)}
                  className="grimoire-btn grimoire-btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.72rem', gap: '4px' }}
                  title="Aggiungi diramazione/sotto-nodo direttamente da qui"
                >
                  <CornerDownRight size={12} /> + Sotto-nodo
                </button>
              )}
            </div>
          </div>

          {node.summary && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '8px' }}>
              {node.summary}
            </p>
          )}

          {/* Prominent Anchored Quests */}
          {quests.length > 0 && (
            <div style={{ marginBottom: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {quests.map(q => (
                <span
                  key={q.entityId}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#a7f3d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Compass size={11} /> 📜 {q.entityName || 'Quest'}
                </span>
              ))}
            </div>
          )}

          {/* Linked Entities Pills */}
          {otherLinks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '6px' }}>
              {otherLinks.map(link => (
                <span
                  key={`${link.entityType}-${link.entityId}`}
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {getLinkIcon(link.entityType)}
                  <span>{link.entityName || link.entityType}</span>
                </span>
              ))}
            </div>
          )}

          {hasChildren && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px', borderTop: '1px solid var(--border-subtle)', marginTop: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {outgoingEdges.length} {outgoingEdges.length === 1 ? 'diramazione collegata' : 'diramazioni collegate'}
              </span>
              <span
                onClick={(e) => toggleExpand(node.id, e)}
                style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}
              >
                {isExpanded ? 'Nascondi sotto-nodi' : 'Mostra sotto-nodi'}
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </div>
          )}
        </div>

        {/* Nested Child Nodes */}
        {hasChildren && isExpanded && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            borderLeft: '2px dashed rgba(139, 92, 246, 0.4)',
            paddingLeft: '12px',
            marginTop: '2px'
          }}>
            {outgoingEdges.map(edge => {
              const child = nodes.find(n => n.id === edge.toNodeId);
              if (!child) return null;
              return renderNestedNode(child, depth + 1, edge.choiceLabel || 'Bivio', currentVisited);
            })}
          </div>
        )}
      </div>
    );
  };

  if (!activeCampaign) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        <p>Seleziona o partecipa a una campagna per visualizzare lo Story Path.</p>
      </div>
    );
  }

  return (
    <div className="grimoire-container">
      {/* Header */}
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
            {isMaster
              ? 'Mappa ad albero innestato: i sotto-nodi appaiono dentro i rami di scelta, espandibili e selezionabili.'
              : 'Cronologia e percorsi intrapresi dal party nel corso della campagna.'}
          </p>
        </div>

        {isMaster && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={handleGenerateRecap} className="grimoire-btn grimoire-btn-gold">
              <Sparkles size={16} /> Genera Recap di Sessione
            </button>
            <button onClick={() => setShowAddEdge(true)} className="grimoire-btn grimoire-btn-secondary">
              <LinkIcon size={16} /> Collega Bivio Esistente
            </button>
            <button onClick={openCreateNodeModal} className="grimoire-btn grimoire-btn-primary">
              <Plus size={16} /> Nuovo Nodo Principale
            </button>
          </div>
        )}
      </div>

      {!isMaster && (
        <div style={{
          background: 'rgba(139, 92, 246, 0.08)',
          border: '1px solid rgba(139, 92, 246, 0.25)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Compass size={18} color="var(--accent-gold)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
            <strong>Fog of War Narrativa attiva:</strong> Come giocatore, puoi consultare i nodi della storia attivi o completati durante le sessioni.
          </span>
        </div>
      )}

      {/* 1. Story Path Progression Bar & Metrics */}
      {nodes.length > 0 && (
        <div className="glass-panel" style={{
          padding: '16px 20px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(11, 15, 25, 0.95))',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flame size={20} color="var(--accent-gold)" />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Avanzamento Story Path
                </span>
                <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {reachedCount} di {totalNodesCount} nodi completati ({progressPercent}%)
                </span>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#67e8f9', border: '1px solid rgba(6, 182, 212, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Activity size={12} /> {inProgressCount} in corso
              </span>
              <span className="badge badge-rarity-uncommon" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <CheckCircle2 size={12} /> {reachedCount} raggiunti
              </span>
              {isMaster && (
                <>
                  <span className="badge badge-rarity-very-rare" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <HelpCircle size={12} /> {plannedCount} pianificati
                  </span>
                  {skippedCount > 0 && (
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <SkipForward size={12} /> {skippedCount} saltati
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Multi-segment Progress Bar */}
          <div style={{
            height: '8px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '4px',
            overflow: 'hidden',
            display: 'flex'
          }}>
            <div
              title={`Raggiunti: ${reachedCount}`}
              style={{
                width: `${totalNodesCount > 0 ? (reachedCount / totalNodesCount) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #10b981, #059669)',
                transition: 'width 0.4s ease'
              }}
            />
            <div
              title={`In Corso: ${inProgressCount}`}
              style={{
                width: `${totalNodesCount > 0 ? (inProgressCount / totalNodesCount) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #06b6d4, #0891b2)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* 2. Active Scene Banner (Prominent in-progress focal point) */}
      {activeInProgressNode && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(15, 23, 42, 0.9))',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(6, 182, 212, 0.2)',
              border: '1px solid #06b6d4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22d3ee',
              flexShrink: 0
            }}>
              <PlayCircle size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#67e8f9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Scena Attualmente in Corso:
                </span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06b6d4', boxShadow: '0 0 6px #06b6d4' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', margin: '2px 0 0 0' }}>
                {activeInProgressNode.title}
              </h3>
              {activeInProgressNode.summary && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '2px 0 0 0' }}>
                  {activeInProgressNode.summary}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setSelectedNode(activeInProgressNode)}
            className="grimoire-btn grimoire-btn-primary"
            style={{ padding: '8px 16px', background: 'var(--accent-cyan)', color: '#0f172a', fontWeight: 600, gap: '6px' }}
          >
            <Compass size={16} /> Ispeziona Scena
          </button>
        </div>
      )}

      {/* 3. Search & Status Filter Toolbar */}
      {/* Filters Toolbar */}
      {nodes.length > 0 && (
        <div className="toolbar-responsive">
          {/* Status Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter size={14} /> Filtra:
            </span>
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`grimoire-btn ${statusFilter === 'ALL' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            >
              Tutti ({totalNodesCount})
            </button>
            <button
              onClick={() => setStatusFilter('IN_PROGRESS')}
              className={`grimoire-btn ${statusFilter === 'IN_PROGRESS' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
              style={{
                padding: '4px 10px',
                fontSize: '0.8rem',
                background: statusFilter === 'IN_PROGRESS' ? 'var(--accent-cyan)' : undefined,
                color: statusFilter === 'IN_PROGRESS' ? '#0f172a' : undefined
              }}
            >
              In Corso ({inProgressCount})
            </button>
            <button
              onClick={() => setStatusFilter('REACHED')}
              className={`grimoire-btn ${statusFilter === 'REACHED' ? 'grimoire-btn-gold' : 'grimoire-btn-secondary'}`}
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
            >
              Raggiunti ({reachedCount})
            </button>
            {isMaster && (
              <>
                <button
                  onClick={() => setStatusFilter('PLANNED')}
                  className={`grimoire-btn ${statusFilter === 'PLANNED' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  Pianificati ({plannedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('SKIPPED')}
                  className={`grimoire-btn ${statusFilter === 'SKIPPED' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  Saltati ({skippedCount})
                </button>
              </>
            )}
          </div>

          {/* Quick Node Search */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px', minWidth: 0 }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="grimoire-input"
              value={nodeSearch}
              onChange={e => setNodeSearch(e.target.value)}
              placeholder="Cerca per titolo, sinossi..."
              style={{ paddingLeft: '32px', paddingRight: nodeSearch ? '30px' : '10px', fontSize: '0.82rem', height: '34px' }}
            />
            {nodeSearch && (
              <button
                onClick={() => setNodeSearch('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Grid: Tree Column + Details Column */}
      <div className="story-main-layout">
        {/* Left Column: Hierarchical Nested Story Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {nodes.length === 0 ? (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Layers size={40} style={{ margin: '0 auto 16px auto', color: 'var(--primary)' }} />
              <h3 style={{ color: '#fff', marginBottom: '8px' }}>Nessun nodo di trama sbloccato</h3>
              <p style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
                {isMaster ? 'Inizia a preparare la sessione aggiungendo il punto di partenza dell\'avventura.' : 'Il Dungeon Master non ha ancora sbloccato nodi della trama.'}
              </p>
              {isMaster && (
                <button onClick={openCreateNodeModal} className="grimoire-btn grimoire-btn-primary">
                  <Plus size={16} /> Crea Primo Nodo
                </button>
              )}
            </div>
          ) : isFilteringActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Risultati filtro: <strong>{filteredNodes.length}</strong> {filteredNodes.length === 1 ? 'nodo trovato' : 'nodi trovati'}
                </span>
                <button
                  onClick={() => { setStatusFilter('ALL'); setNodeSearch(''); }}
                  className="grimoire-btn grimoire-btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                >
                  Mostra Albero Completo
                </button>
              </div>
              {filteredNodes.length === 0 ? (
                <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Search size={32} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
                  <p>Nessun nodo corrisponde ai filtri selezionati.</p>
                </div>
              ) : (
                filteredNodes.map(node => renderNestedNode(node, 0))
              )}
            </div>
          ) : (
            displayRoots.map(rootNode => renderNestedNode(rootNode))
          )}
        </div>

        {/* Right Column: Selected Node Details & Live Progress */}
        <div>
          {selectedNode ? (
            <div className="glass-panel" style={{ padding: '26px', position: 'sticky', top: '90px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Scheda Nodo Selezionato
                  </span>
                  <h3 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '4px' }}>{selectedNode.title}</h3>
                </div>
                {isMaster && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => openAddChildNodeModal(selectedNode)}
                      className="grimoire-btn grimoire-btn-primary"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', gap: '4px' }}
                      title="Aggiungi sotto-nodo"
                    >
                      <CornerDownRight size={14} /> + Sotto-nodo
                    </button>
                    <button
                      onClick={() => openEditNodeModal(selectedNode)}
                      className="grimoire-btn grimoire-btn-secondary"
                      style={{ padding: '6px 10px' }}
                      title="Modifica Nodo"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="grimoire-btn grimoire-btn-danger"
                      style={{ padding: '6px 10px' }}
                      title="Elimina Nodo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Master Live Progress Controls */}
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
                      onClick={() => handleUpdateStatus(selectedNode.id, 'IN_PROGRESS')}
                      className={`grimoire-btn ${selectedNode.status === 'IN_PROGRESS' ? 'grimoire-btn-primary' : 'grimoire-btn-secondary'}`}
                      style={{ padding: '6px 10px', fontSize: '0.8rem', background: selectedNode.status === 'IN_PROGRESS' ? 'var(--accent-cyan)' : undefined, color: selectedNode.status === 'IN_PROGRESS' ? '#0f172a' : undefined }}
                    >
                      <PlayCircle size={14} /> In Corso (Attivo)
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedNode.id, 'REACHED')}
                      className={`grimoire-btn ${selectedNode.status === 'REACHED' ? 'grimoire-btn-gold' : 'grimoire-btn-secondary'}`}
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      <CheckCircle2 size={14} /> Raggiunto
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedNode.id, 'ALTERED')}
                      className={`grimoire-btn ${selectedNode.status === 'ALTERED' ? 'grimoire-btn-gold' : 'grimoire-btn-secondary'}`}
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

              {/* Premise / Summary */}
              {selectedNode.summary && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Premessa / Situazione
                  </h4>
                  <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {selectedNode.summary}
                  </p>
                </div>
              )}

              {/* Anchored Quests Section */}
              {selectedNode.links && selectedNode.links.filter(l => l.entityType === 'QUEST').length > 0 && (
                <div style={{ marginBottom: '16px', background: 'rgba(16, 185, 129, 0.08)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: '#6ee7b7', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Compass size={14} /> Quest Ancorate a questa Scena:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedNode.links.filter(l => l.entityType === 'QUEST').map(q => (
                      <div key={q.entityId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 600 }}>{q.entityName || 'Quest'}</span>
                        <span className="badge badge-rarity-uncommon" style={{ fontSize: '0.7rem' }}>
                          {q.extraInfo?.status || 'ACTIVE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked Campaign Entities */}
              {selectedNode.links && selectedNode.links.filter(l => l.entityType !== 'QUEST').length > 0 && (
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Entità della Campagna Collegate:
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {selectedNode.links.filter(l => l.entityType !== 'QUEST').map(link => (
                      <div
                        key={`${link.entityType}-${link.entityId}`}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid var(--border-subtle)',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {getLinkIcon(link.entityType)}
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {link.entityName || link.entityType}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{link.entityType}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Master Prep Details */}
              {isMaster && selectedNode.content && (
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Appunti Master & Dettagli DM
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

              {/* Master Share Button with targeted recipient support */}
              {isMaster && (
                <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    onClick={() => setSharingData({
                      title: selectedNode.title,
                      payload: {
                        title: selectedNode.title,
                        content: selectedNode.summary || selectedNode.content
                      }
                    })}
                    className="grimoire-btn grimoire-btn-gold"
                    style={{ width: '100%' }}
                  >
                    <Sparkles size={16} /> Condividi Situazione con i Giocatori...
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Seleziona un nodo dall'albero per visualizzarne i dettagli e le entità collegate.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Create / Edit Story Node with Link Picker */}
      {(showAddNode || editingNode) && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ color: '#fff', fontSize: '1.3rem' }}>
                {editingNode
                  ? 'Modifica Nodo di Trama'
                  : parentForNewNode
                  ? `Nuovo Sotto-Nodo di "${parentForNewNode.title}"`
                  : 'Nuovo Nodo di Trama'}
              </h3>
              <button onClick={resetNodeForm} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveNode} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {parentForNewNode && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Collegamento Diretto da: <strong>{parentForNewNode.title}</strong>
                  </span>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Etichetta Scelta / Bivio (es. "Accettano la missione", "Fuggono", "Aprono la cassa"):
                  </label>
                  <input
                    className="grimoire-input"
                    value={childChoiceLabel}
                    onChange={e => setChildChoiceLabel(e.target.value)}
                    placeholder="Azione o scelta dei giocatori per arrivare qui..."
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Titolo Nodo
                </label>
                <input
                  className="grimoire-input"
                  value={nodeTitle}
                  onChange={e => setNodeTitle(e.target.value)}
                  placeholder="es. Incontro con Gundren, Attacco dei Goblin"
                  required
                />
              </div>
              <div className="responsive-form-row-2">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Stato Nodo
                  </label>
                  <select
                    className="grimoire-select"
                    value={nodeStatus}
                    onChange={e => setNodeStatus(e.target.value as any)}
                  >
                    <option value="PLANNED">Pianificato (Nascosto ai Player)</option>
                    <option value="IN_PROGRESS">⏳ In Corso / Scena Attiva</option>
                    <option value="REACHED">Raggiunto (Visibile ai Player)</option>
                    <option value="ALTERED">Modificato dai PG (Visibile)</option>
                    <option value="SKIPPED">Saltato</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Sinossi / Descrizione Breve
                  </label>
                  <input
                    className="grimoire-input"
                    value={nodeSummary}
                    onChange={e => setNodeSummary(e.target.value)}
                    placeholder="Cosa succede in questa scena..."
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Appunti Dettagliati Master (dialoghi, trappole, indizi)
                </label>
                <textarea
                  className="grimoire-textarea"
                  rows={3}
                  value={nodeContent}
                  onChange={e => setNodeContent(e.target.value)}
                  placeholder="Note dettagliate per gestire la scena..."
                />
              </div>

              {/* Entity Linker Section */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 600, marginBottom: '8px' }}>
                  Collega Entità o Quest a questo Nodo
                </label>

                <div className="responsive-form-row-3" style={{ marginBottom: '10px' }}>
                  <select
                    className="grimoire-select"
                    value={selectedLinkType}
                    onChange={e => {
                      setSelectedLinkType(e.target.value as any);
                      setSelectedLinkId('');
                    }}
                  >
                    <option value="NPC">👤 NPC</option>
                    <option value="MONSTER">⚔️ Mostro</option>
                    <option value="LOCATION">📍 Luogo</option>
                    <option value="QUEST">📜 Quest</option>
                    <option value="ITEM">💎 Oggetto</option>
                    <option value="CHARACTER">🧙‍♂️ Personaggio</option>
                  </select>

                  <select
                    className="grimoire-select"
                    value={selectedLinkId}
                    onChange={e => setSelectedLinkId(e.target.value)}
                  >
                    <option value="">Seleziona {selectedLinkType}...</option>
                    {selectedLinkType === 'NPC' && availableNpcs.map(n => <option key={n.id} value={n.id}>{n.name} ({n.role || 'NPC'})</option>)}
                    {selectedLinkType === 'MONSTER' && availableMonsters.map(m => <option key={m.id} value={m.id}>{m.name} (CR {m.cr || '1'})</option>)}
                    {selectedLinkType === 'LOCATION' && availableLocations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    {selectedLinkType === 'QUEST' && availableQuests.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                    {selectedLinkType === 'ITEM' && availableItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    {selectedLinkType === 'CHARACTER' && availableCharacters.map(c => <option key={c.id} value={c.id}>{c.name} ({c.class || 'Eroe'})</option>)}
                  </select>

                  <button
                    type="button"
                    onClick={handleAddLinkToForm}
                    disabled={!selectedLinkId}
                    className="grimoire-btn grimoire-btn-secondary"
                  >
                    <Plus size={14} /> Aggiungi
                  </button>
                </div>

                {nodeLinks.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {nodeLinks.map((link, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        {getLinkIcon(link.entityType)}
                        <strong>{link.entityName || link.entityType}</strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveLinkFromForm(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-crimson)', cursor: 'pointer', padding: 0 }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={resetNodeForm} className="grimoire-btn grimoire-btn-secondary">
                  Annulla
                </button>
                <button type="submit" className="grimoire-btn grimoire-btn-primary">
                  {editingNode ? 'Salva Modifiche' : 'Crea Nodo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Edge */}
      {showAddEdge && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '480px' }}>
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
                  Etichetta Scelta (es. "Accettano la missione", "Fuggono", "Uccidono il boss"):
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

      {/* Share Modal */}
      {sharingData && (
        <ShareModal
          isOpen={true}
          onClose={() => setSharingData(null)}
          type="NOTE"
          title={sharingData.title}
          payload={sharingData.payload}
        />
      )}

      {/* Session Recap Modal */}
      {recapModal && (
        <div className="modal-responsive-backdrop">
          <div className="glass-panel modal-responsive-content animate-fade-in" style={{ maxWidth: '650px' }}>
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
