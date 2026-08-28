import React from 'react';
import { Plus, Trash2, Lock, Eye } from 'lucide-react';

export interface CustomProperty {
  id?: string;
  key: string;
  value: string;
  isSecret: boolean;
}

interface Props {
  properties: CustomProperty[];
  onChange: (properties: CustomProperty[]) => void;
  isMaster?: boolean;
}

export const CustomPropertiesEditor: React.FC<Props> = ({
  properties = [],
  onChange,
  isMaster = true,
}) => {
  const handleAdd = () => {
    onChange([
      ...properties,
      { id: Date.now().toString(), key: '', value: '', isSecret: false }
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(properties.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof CustomProperty, val: any) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: val };
    onChange(updated);
  };

  return (
    <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-gold)' }}>
          Proprietà Personalizzate
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="grimoire-btn grimoire-btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
        >
          <Plus size={12} /> Aggiungi Proprietà
        </button>
      </div>

      {properties.length === 0 && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 0' }}>
          Nessuna proprietà custom (es. Resistenza al Fuoco, Allineamento segreto, Valore stimato).
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {properties.map((prop, idx) => (
          <div
            key={prop.id || idx}
            style={{
              display: 'grid',
              gridTemplateColumns: isMaster ? '1.2fr 1.5fr auto auto' : '1.2fr 1.5fr',
              gap: '8px',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              border: prop.isSecret ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)'
            }}
          >
            <input
              type="text"
              placeholder="Chiave (es. Debolezza)"
              value={prop.key}
              onChange={(e) => handleUpdate(idx, 'key', e.target.value)}
              className="grimoire-input"
              style={{ fontSize: '0.8rem', padding: '5px 8px' }}
            />
            <input
              type="text"
              placeholder="Valore (es. Acqua Santa)"
              value={prop.value}
              onChange={(e) => handleUpdate(idx, 'value', e.target.value)}
              className="grimoire-input"
              style={{ fontSize: '0.8rem', padding: '5px 8px' }}
            />

            {isMaster && (
              <button
                type="button"
                onClick={() => handleUpdate(idx, 'isSecret', !prop.isSecret)}
                className={`grimoire-btn ${prop.isSecret ? 'grimoire-btn-danger' : 'grimoire-btn-secondary'}`}
                style={{ padding: '5px 8px', fontSize: '0.75rem', gap: '4px', whiteSpace: 'nowrap' }}
                title={prop.isSecret ? 'Segreto: Visibile solo al Master' : 'Pubblico: Visibile a tutti'}
              >
                {prop.isSecret ? <Lock size={12} /> : <Eye size={12} />}
                <span>{prop.isSecret ? 'DM' : 'Tutti'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleRemove(idx)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-crimson)',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Rimuovi proprietà"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CustomPropertiesView: React.FC<{ properties?: CustomProperty[]; isMaster?: boolean }> = ({
  properties,
  isMaster = false,
}) => {
  if (!properties || !Array.isArray(properties) || properties.length === 0) return null;

  const visibleProps = isMaster ? properties : properties.filter((p) => !p.isSecret);
  if (visibleProps.length === 0) return null;

  return (
    <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {visibleProps.map((p, idx) => (
        <span
          key={p.id || idx}
          style={{
            fontSize: '0.75rem',
            padding: '3px 8px',
            borderRadius: '4px',
            background: p.isSecret ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: p.isSecret ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid var(--border-subtle)',
            color: p.isSecret ? '#fca5a5' : 'var(--text-main)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
          title={p.isSecret ? 'Proprietà segreta visibile solo al Master' : undefined}
        >
          {p.isSecret && <Lock size={10} color="#f87171" />}
          <strong style={{ color: p.isSecret ? '#fca5a5' : 'var(--text-muted)' }}>{p.key}:</strong> {p.value}
        </span>
      ))}
    </div>
  );
};
