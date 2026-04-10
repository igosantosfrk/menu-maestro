import { useState, useEffect, type CSSProperties } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

/* ── design tokens (inline, matches Dashboard) ── */
const T = {
  bg: '#F8F9FC',
  card: '#FFFFFF',
  border: '#E8ECF4',
  text: '#1A1D26',
  muted: '#8892A4',
  pink: '#EC4899',
  blue: '#3B82F6',
  green: '#10B981',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  red: '#EF4444',
};

/* ── keyframes injected once ── */
const styleId = 'mm-cat-anim';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const s = document.createElement('style');
  s.id = styleId;
  s.textContent = `
@keyframes mmFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes mmGlow1{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,30px)}}
@keyframes mmGlow2{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-20px)}}
`;
  document.head.appendChild(s);
}

/* ── SVG Icons (Lucide-style) ── */
const SvgFolder = ({ color = '#8B5CF6' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
);
const SvgPlus = ({ color = '#FFFFFF' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const SvgPencil = ({ color = '#8892A4' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);
const SvgTrash = ({ color = '#EF4444' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
);
const SvgGrip = ({ color = '#8892A4' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
);
const SvgFolderOpen = ({ color = '#8892A4' }: { color?: string }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><path d="M2 10h20"/></svg>
);
const SvgLayers = ({ color = '#3B82F6' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);

/* ── card base style ── */
const cardBase: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s',
};

const ACCENT_COLORS = [T.purple, T.blue, T.green, T.pink, T.amber, T.red];

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number | null;
  is_active: boolean | null;
}

const Categories = () => {
  const { tenantId } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fadeUp = (delay: number): CSSProperties => ({
    animation: mounted ? `mmFadeUp 0.5s ease ${delay}s both` : 'none',
  });

  const fetchCategories = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order');
    setCategories(data || []);
  };

  useEffect(() => { fetchCategories(); }, [tenantId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', icon: '' });
    setDialogOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({ name: c.name, description: c.description || '', icon: c.icon || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!tenantId || !form.name.trim()) {
      toast({ title: 'Preencha o nome da categoria', variant: 'destructive' });
      return;
    }

    const payload = {
      tenant_id: tenantId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Categoria atualizada!' });
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Categoria criada!' });
    }

    setDialogOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast({ title: 'Categoria excluida!' });
    fetchCategories();
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(categories);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setCategories(items);

    // Persist new order
    const updates = items.map((item, index) =>
      supabase.from('categories').update({ sort_order: index }).eq('id', item.id)
    );
    await Promise.all(updates);
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: '0.9rem',
    fontFamily: "'Inter', sans-serif",
    color: T.text,
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const labelStyle: CSSProperties = {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: T.text,
    letterSpacing: 0.2,
    marginBottom: 6,
    display: 'block',
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text, position: 'relative', minHeight: '100%' }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, right: -150, width: 600, height: 600, background: 'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow1 8s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -150, width: 500, height: 500, background: 'radial-gradient(circle,rgba(236,72,153,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow2 10s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16, ...fadeUp(0.05) }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
              <span style={{ background: `linear-gradient(135deg,${T.purple},${T.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Categorias</span>
            </h1>
            <p style={{ fontSize: '0.88rem', color: T.muted }}>Organize os produtos do seu cardapio</p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: `linear-gradient(135deg,${T.purple},${T.blue})`,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 10,
              fontSize: '0.85rem',
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(139,92,246,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(139,92,246,0.3)'; }}
          >
            <SvgPlus /> Nova Categoria
          </button>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Total', value: categories.length.toString(), icon: <SvgFolder />, iconBg: 'rgba(139,92,246,0.1)', gradient: `linear-gradient(90deg,${T.purple},transparent)` },
            { label: 'Ativas', value: categories.filter(c => c.is_active !== false).length.toString(), icon: <SvgLayers />, iconBg: 'rgba(59,130,246,0.1)', gradient: `linear-gradient(90deg,${T.blue},transparent)` },
            { label: 'Ordenadas', value: categories.filter(c => c.sort_order !== null).length.toString(), icon: <SvgGrip color={T.green} />, iconBg: 'rgba(16,185,129,0.1)', gradient: `linear-gradient(90deg,${T.green},transparent)` },
          ].map((c, i) => (
            <div
              key={c.label}
              style={{
                ...cardBase,
                padding: '20px 18px',
                ...fadeUp(0.1 + i * 0.05),
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
            >
              {/* top gradient border */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.gradient }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600 }}>{c.label}</span>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: c.iconBg }}>
                  {c.icon}
                </div>
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: -1 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* ── Categories List ── */}
        {categories.length === 0 ? (
          <div
            style={{
              ...cardBase,
              padding: '64px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              ...fadeUp(0.25),
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.purple},${T.blue},${T.pink})` }} />
            <div style={{ marginBottom: 16, opacity: 0.5 }}>
              <SvgFolderOpen />
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 600, color: T.text, marginBottom: 6 }}>Nenhuma categoria</p>
            <p style={{ fontSize: '0.85rem', color: T.muted }}>Crie categorias para organizar seus produtos</p>
          </div>
        ) : (
          <div style={{ ...cardBase, ...fadeUp(0.25) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.purple},${T.blue},${T.pink})` }} />
            {/* List header */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
              <span style={{ width: 40 }} />
              <span style={{ flex: 1, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600 }}>Categoria</span>
              <span style={{ width: 180, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600 }}>Descricao</span>
              <span style={{ width: 90, textAlign: 'right', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600 }}>Acoes</span>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="categories">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {categories.map((c, i) => {
                      const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
                      return (
                        <Draggable key={c.id} draggableId={c.id} index={i}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              style={{
                                ...provided.draggableProps.style,
                                display: 'flex',
                                alignItems: 'center',
                                padding: '14px 20px',
                                borderBottom: `1px solid ${T.border}`,
                                background: snapshot.isDragging ? 'rgba(139,92,246,0.04)' : T.card,
                                transition: 'background 0.2s',
                                ...(snapshot.isDragging ? { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderRadius: 10 } : {}),
                              }}
                              onMouseEnter={e => { if (!snapshot.isDragging) (e.currentTarget as HTMLDivElement).style.background = T.bg; }}
                              onMouseLeave={e => { if (!snapshot.isDragging) (e.currentTarget as HTMLDivElement).style.background = T.card; }}
                            >
                              {/* Drag handle */}
                              <div {...provided.dragHandleProps} style={{ width: 40, display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                                <SvgGrip />
                              </div>

                              {/* Name + icon */}
                              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 10,
                                  background: `${accent}12`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.95rem',
                                  fontWeight: 700,
                                  color: accent,
                                  flexShrink: 0,
                                }}>
                                  {c.icon || c.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: T.text }}>{c.name}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <span style={{
                                      display: 'inline-block',
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      background: c.is_active !== false ? T.green : T.muted,
                                    }} />
                                    <span style={{ fontSize: '0.72rem', color: T.muted }}>{c.is_active !== false ? 'Ativa' : 'Inativa'}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Description */}
                              <div style={{ width: 180 }}>
                                <span style={{ fontSize: '0.82rem', color: T.muted }}>{c.description || '-'}</span>
                              </div>

                              {/* Actions */}
                              <div style={{ width: 90, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                                <button
                                  onClick={() => openEdit(c)}
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 8,
                                    border: `1px solid ${T.border}`,
                                    background: T.card,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = T.bg; (e.currentTarget as HTMLButtonElement).style.borderColor = T.blue; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = T.card; (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
                                >
                                  <SvgPencil color={T.blue} />
                                </button>
                                <button
                                  onClick={() => handleDelete(c.id)}
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 8,
                                    border: `1px solid ${T.border}`,
                                    background: T.card,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                  }}
                                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.06)'; (e.currentTarget as HTMLButtonElement).style.borderColor = T.red; }}
                                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = T.card; (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
                                >
                                  <SvgTrash />
                                </button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}
      </div>

      {/* ── Dialog (Modal) ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={{ fontFamily: "'Inter', sans-serif", borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: '0 24px 48px rgba(0,0,0,0.12)', padding: 0, overflow: 'hidden' }}>
          {/* top gradient */}
          <div style={{ height: 2, background: `linear-gradient(90deg,${T.purple},${T.blue},${T.pink})` }} />
          <div style={{ padding: '24px 28px 28px' }}>
            <DialogHeader>
              <DialogTitle style={{ fontSize: '1.15rem', fontWeight: 700, color: T.text, marginBottom: 20 }}>
                {editing ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Nome *</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Pizzas"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = T.purple; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Descricao</label>
                <input
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Descricao opcional"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = T.purple; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Icone (emoji)</label>
                <input
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  placeholder="Ex: P"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = T.purple; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>
              <button
                onClick={handleSave}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: `linear-gradient(135deg,${T.purple},${T.blue})`,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
                  marginTop: 4,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(139,92,246,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(139,92,246,0.3)'; }}
              >
                {editing ? 'Salvar' : 'Criar Categoria'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
