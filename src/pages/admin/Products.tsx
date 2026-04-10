import { exportCSV, formatNum } from "@/utils/exportCSV";
import { useState, useEffect, type CSSProperties } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import ProductFormDialog from '@/components/admin/products/ProductFormDialog';
import BulkImportDialog from '@/components/admin/products/BulkImportDialog';

/* ── Types ── */
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean | null;
  is_featured: boolean | null;
  prep_time_min: number | null;
  track_stock?: boolean | null;
  stock_quantity?: number | null;
  stock_min_alert?: number | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

/* ── Design Tokens ── */
const T = {
  bg: '#F8F9FC',
  card: '#FFFFFF',
  border: '#E8ECF4',
  text: '#1A1D26',
  muted: '#8892A4',
  green: '#10B981',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  amber: '#F59E0B',
  pink: '#EC4899',
  red: '#EF4444',
};

/* ── Keyframes ── */
const styleId = 'mm-products-anim';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const s = document.createElement('style');
  s.id = styleId;
  s.textContent = `
@keyframes mmFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes mmGlow1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-30px,30px) scale(1.1)}}
@keyframes mmGlow2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(20px,-20px) scale(1.1)}}
`;
  document.head.appendChild(s);
}

/* ── SVG Icons ── */
const SvgSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const SvgPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
const SvgPencil = ({ color = T.muted }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
);
const SvgTrash = ({ color = T.muted }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const SvgPackage = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);
const SvgSpreadsheet = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
const SvgExtLink = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);
const SvgTrashLg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
);
const SvgChevronDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const SvgBox = ({ color = T.muted }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16.5 9.4-9-5.19"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
);
const SvgAlertTriangle = ({ color = T.amber }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 00-3.48 0l-8 14A2 2 0 004.27 21h15.46A2 2 0 0021.73 18Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const SvgXCircle = ({ color = T.red }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);
const SvgFolderPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
);

const SvgDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

/* ── Accent color cycle ── */
const accents = [
  { from: T.green, to: T.blue },
  { from: T.blue, to: T.purple },
  { from: T.purple, to: T.pink },
  { from: T.amber, to: T.green },
  { from: T.pink, to: T.amber },
];

/* ── Shared Styles ── */
const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: T.bg,
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  position: 'relative',
  overflow: 'hidden',
  padding: '32px 24px',
};

const gridBg: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`,
  backgroundSize: '48px 48px',
  opacity: 0.5,
  pointerEvents: 'none',
};

const glowOrb = (top: string, left: string, color: string, anim: string): CSSProperties => ({
  position: 'absolute',
  top, left,
  width: 260,
  height: 260,
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
  filter: 'blur(40px)',
  animation: `${anim} 14s ease-in-out infinite`,
  pointerEvents: 'none',
});

const cardBase: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s',
};

const fadeUp = (i: number): CSSProperties => ({
  animation: `mmFadeUp 0.5s ${i * 0.06}s both`,
});

/* ── Component ── */
const Products = () => {
  const { tenantId, isSuperAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  // Bulk delete state
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Hover state for cards
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Accordion state
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: '' });

  // Resolve tenant and slug
  useEffect(() => {
    const resolveTenant = async () => {
      let tid = tenantId;
      if (!tid && isSuperAdmin) {
        const { data } = await supabase.from('tenants').select('id, slug').limit(1);
        if (data && data.length > 0) { tid = data[0].id; setTenantSlug(data[0].slug); }
      } else if (tid) {
        const { data } = await supabase.from('tenants').select('slug').eq('id', tid).single();
        if (data) setTenantSlug(data.slug);
      }
      if (tid) setActiveTenantId(tid);
    };
    resolveTenant();
  }, [tenantId, isSuperAdmin]);

  const fetchProducts = async () => {
    if (!activeTenantId) return;
    const { data } = await supabase.from('products').select('*').eq('tenant_id', activeTenantId).order('sort_order');
    setProducts(data || []);
  };

  const fetchCategories = async () => {
    if (!activeTenantId) return;
    const { data } = await supabase.from('categories').select('id, name, description, icon, is_active, sort_order').eq('tenant_id', activeTenantId).eq('is_active', true).order('sort_order');
    setCategories(data || []);
  };

  useEffect(() => { fetchProducts(); fetchCategories(); }, [activeTenantId]);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setDialogOpen(true); };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast({ title: 'Erro ao excluir', variant: 'destructive' }); return; }
    toast({ title: 'Produto excluido!' });
    fetchProducts();
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    await supabase.from('products').update({ is_available: !current }).eq('id', id);
    fetchProducts();
  };

  const handleBulkDeleteConfirm = async () => {
    if (!selectedCategoryId || !activeTenantId) return;
    setDeleting(true);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('tenant_id', activeTenantId)
      .eq('category_id', selectedCategoryId);
    setDeleting(false);
    setConfirmDeleteOpen(false);
    setBulkDeleteOpen(false);
    setSelectedCategoryId('');
    if (error) {
      toast({ title: 'Erro ao excluir produtos', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Produtos excluidos com sucesso!' });
      fetchProducts();
    }
  };

  const selectedCategoryName = categories.find(c => c.id === selectedCategoryId)?.name || '';

  // Accordion toggle
  const toggleCategory = (id: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Category CRUD
  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', icon: '' });
    setCategoryDialogOpen(true);
  };

  const openEditCategory = (c: Category) => {
    setEditingCategory(c);
    setCategoryForm({ name: c.name, description: c.description || '', icon: c.icon || '' });
    setCategoryDialogOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!activeTenantId || !categoryForm.name.trim()) {
      toast({ title: 'Preencha o nome da categoria', variant: 'destructive' });
      return;
    }
    const payload = {
      tenant_id: activeTenantId,
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || null,
      icon: categoryForm.icon.trim() || null,
    };
    if (editingCategory) {
      const { error } = await supabase.from('categories').update(payload).eq('id', editingCategory.id);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Categoria atualizada!' });
    } else {
      const { error } = await supabase.from('categories').insert(payload);
      if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Categoria criada!' });
    }
    setCategoryDialogOpen(false);
    fetchCategories();
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id);
    toast({ title: 'Categoria excluida!' });
    fetchCategories();
  };

  // Filtering
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  // Auto-expand matching categories when searching
  useEffect(() => {
    if (search.trim()) {
      const matchingCatIds = new Set(filtered.map(p => p.category_id || '__none__'));
      setOpenCategories(matchingCatIds);
    }
  }, [search]);

  // Group products by category
  const productsByCategory = categories.map(cat => ({
    category: cat,
    products: filtered.filter(p => p.category_id === cat.id),
  }));
  const uncategorized = filtered.filter(p => !p.category_id);

  if (!activeTenantId) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: `3px solid ${T.border}`, borderTopColor: T.blue,
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  /* ── Button styles ── */
  const btnPrimary: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '9px 20px', borderRadius: 10,
    background: `linear-gradient(135deg, ${T.blue}, ${T.purple})`,
    color: '#fff', fontWeight: 600, fontSize: 13,
    border: 'none', cursor: 'pointer',
    transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(59,130,246,0.18)',
  };

  const btnSecondary: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '9px 16px', borderRadius: 10,
    background: T.card, color: T.text, fontWeight: 500, fontSize: 13,
    border: `1px solid ${T.border}`, cursor: 'pointer',
    transition: 'all 0.2s',
  };

  const btnDanger: CSSProperties = {
    ...btnSecondary,
    color: T.red,
    border: `1px solid ${T.red}22`,
  };

  const btnCategory: CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '9px 16px', borderRadius: 10,
    background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
    color: '#fff', fontWeight: 600, fontSize: 13,
    border: 'none', cursor: 'pointer',
    transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(139,92,246,0.18)',
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: 14,
    fontFamily: "'Inter', sans-serif",
    color: T.text,
    background: T.bg,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const labelStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: T.text,
    letterSpacing: 0.2,
    marginBottom: 6,
    display: 'block',
  };

  const iconBtnStyle: CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 8,
    border: `1px solid ${T.border}`, background: T.card,
    cursor: 'pointer', transition: 'all 0.2s',
  };

  // Render product card
  const renderProductCard = (p: Product, i: number) => {
    const accent = accents[i % accents.length];
    const isHovered = hoveredCard === p.id;
    return (
      <div
        key={p.id}
        style={{
          ...cardBase,
          ...fadeUp(i + 2),
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 8px 24px rgba(0,0,0,0.08)'
            : '0 1px 3px rgba(0,0,0,0.04)',
        }}
        onMouseEnter={() => setHoveredCard(p.id)}
        onMouseLeave={() => setHoveredCard(null)}
      >
        {/* Top gradient border */}
        <div style={{
          height: 2,
          background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
        }} />

        {/* Image */}
        {p.image_url && (
          <div style={{ height: 160, overflow: 'hidden', background: '#f1f3f8' }}>
            <img
              src={p.image_url}
              alt={p.name}
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transition: 'transform 0.5s',
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>
                {p.name}
              </h3>
              {p.description && (
                <p style={{
                  margin: '4px 0 0', fontSize: 13, color: T.muted, lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {p.description}
                </p>
              )}
            </div>
            <span style={{
              fontSize: 18, fontWeight: 800, color: T.green, whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
            }}>
              R$ {p.price.toFixed(2)}
            </span>
          {/* Stock badge */}
          {(p as any).track_stock && (() => {
            const qty = (p as any).stock_quantity ?? 0;
            const minAlert = (p as any).stock_min_alert ?? 5;
            if (qty === 0) {
              return (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: T.red, padding: '2px 8px', borderRadius: 6 }}>
                  Esgotado
                </span>
              );
            }
            const isLow = qty <= minAlert;
            const badgeColor = isLow ? T.amber : T.green;
            const badgeBg = isLow ? T.amber + '18' : T.green + '18';
            return (
              <span style={{ fontSize: 11, fontWeight: 600, color: badgeColor, background: badgeBg, padding: '2px 8px', borderRadius: 6 }}>
                {qty} unid.
              </span>
            );
          })()}
          </div>

          {/* Bottom bar: toggle + actions */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 12, paddingTop: 12,
            borderTop: `1px solid ${T.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch
                checked={p.is_available ?? true}
                onCheckedChange={() => toggleAvailability(p.id, p.is_available ?? true)}
              />
              <span style={{
                fontSize: 12, fontWeight: 500,
                color: (p.is_available ?? true) ? T.green : T.muted,
              }}>
                {(p.is_available ?? true) ? 'Disponivel' : 'Indisponivel'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => openEdit(p)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.card,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.blue; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
              >
                <SvgPencil color={T.blue} />
              </button>
              <button
                onClick={() => handleDelete(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 32, height: 32, borderRadius: 8,
                  border: `1px solid ${T.border}`, background: T.card,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.red; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
              >
                <SvgTrash color={T.red} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render accordion section
  const renderAccordionSection = (
    sectionId: string,
    title: string,
    sectionProducts: Product[],
    animIndex: number,
    categoryObj?: Category,
  ) => {
    const isOpen = openCategories.has(sectionId);
    const hasProducts = sectionProducts.length > 0;

    // Skip empty categories when searching
    if (search.trim() && !hasProducts) return null;

    return (
      <div key={sectionId} style={{ ...cardBase, ...fadeUp(animIndex) }}>
        {/* Category Header */}
        <div
          onClick={() => toggleCategory(sectionId)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{
            transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform 0.2s ease',
            color: T.muted,
            display: 'flex', alignItems: 'center',
          }}>
            <SvgChevronDown />
          </div>
          {categoryObj?.icon && (
            <span style={{ fontSize: 18 }}>{categoryObj.icon}</span>
          )}
          <span style={{ fontSize: 15, fontWeight: 700, color: T.text, flex: 1 }}>
            {title}
          </span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: T.muted,
            background: T.bg, padding: '2px 10px', borderRadius: 8,
          }}>
            {sectionProducts.length} {sectionProducts.length === 1 ? 'produto' : 'produtos'}
          </span>
          {/* Edit / Delete buttons for real categories */}
          {categoryObj && (
            <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
              <button
                onClick={() => openEditCategory(categoryObj)}
                style={iconBtnStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.blue; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
              >
                <SvgPencil color={T.blue} />
              </button>
              <button
                onClick={() => handleDeleteCategory(categoryObj.id)}
                style={iconBtnStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.red; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
              >
                <SvgTrash color={T.red} />
              </button>
            </div>
          )}
        </div>

        {/* Expandable content */}
        <div style={{
          maxHeight: isOpen ? 5000 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.35s ease',
        }}>
          <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${T.border}` }}>
            {hasProducts ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, paddingTop: 16 }}>
                {sectionProducts.map((p, i) => renderProductCard(p, i))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: T.muted, fontSize: 13, padding: '20px 0' }}>
                Nenhum produto nesta categoria
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={pageStyle}>
      {/* Background grid */}
      <div style={gridBg} />
      {/* Glow orbs */}
      <div style={glowOrb('10%', '5%', T.blue, 'mmGlow1')} />
      <div style={glowOrb('60%', '75%', T.purple, 'mmGlow2')} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28, ...fadeUp(0) }}>
          <div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, margin: 0,
              background: `linear-gradient(135deg, ${T.text}, ${T.blue})`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>
              Produtos
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: T.muted, fontWeight: 500 }}>
              {products.length} produtos cadastrados
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button style={btnDanger} onClick={() => setBulkDeleteOpen(true)}>
              <SvgTrashLg /> Excluir por categoria
            </button>
            {tenantSlug && (
              <button style={btnSecondary} onClick={() => window.open(`/${tenantSlug}`, '_blank')}>
                <SvgExtLink /> Ver Cardapio
              </button>
            )}
            <button style={btnSecondary} onClick={() => setImportOpen(true)}>
              <SvgSpreadsheet /> Importar em lote
            </button>
            <button style={btnSecondary} onClick={() => {
              const catMap: Record<string, string> = {};
              categories.forEach(c => { catMap[c.id] = c.name; });
              exportCSV(products, 'produtos.csv', [
                { key: 'name', label: 'Nome' },
                { key: 'category_id', label: 'Categoria', format: (v: any) => catMap[v] || 'Sem categoria' },
                { key: 'price', label: 'Preco', format: (v: any) => formatNum(v) },
                { key: 'is_available', label: 'Disponivel', format: (v: any) => v ? 'Sim' : 'Nao' },
                { key: 'is_featured', label: 'Destaque', format: (v: any) => v ? 'Sim' : 'Nao' },
                { key: 'prep_time_min', label: 'Tempo Preparo (min)' },
              ]);
            }}>
              <SvgDownload /> Exportar Produtos
            </button>
            <button style={btnCategory} onClick={openCreateCategory}>
              <SvgFolderPlus /> Nova Categoria
            </button>
            <button style={btnPrimary} onClick={openCreate}>
              <SvgPlus /> Novo Produto
            </button>
          </div>
        </div>

        {/* ── Search ── */}
        <div style={{ marginBottom: 24, ...fadeUp(1) }}>
          <div style={{
            ...cardBase,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 16px', maxWidth: 380,
          }}>
            <SvgSearch />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontSize: 14, color: T.text, fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Stock Summary */}
        {(() => {
          const tracked = products.filter((p: any) => p.track_stock);
          if (tracked.length === 0) return null;
          const lowStock = tracked.filter((p: any) => p.stock_quantity != null && p.stock_quantity <= (p.stock_min_alert ?? 5) && p.stock_quantity > 0);
          const outOfStock = tracked.filter((p: any) => p.stock_quantity != null && p.stock_quantity === 0);
          const summaryCards = [
            { label: 'Estoque controlado', value: tracked.length, color: T.blue, icon: <SvgBox color={T.blue} /> },
            { label: 'Estoque baixo', value: lowStock.length, color: T.amber, icon: <SvgAlertTriangle color={T.amber} /> },
            { label: 'Esgotados', value: outOfStock.length, color: T.red, icon: <SvgXCircle color={T.red} /> },
          ];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24, ...fadeUp(1.5) }}>
              {summaryCards.map((sc, idx) => (
                <div key={idx} style={{ ...cardBase, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: sc.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sc.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: sc.color }}>{sc.value}</div>
                    <div style={{ fontSize: 12, color: T.muted, fontWeight: 500 }}>{sc.label}</div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── Accordion Categories ── */}
        {filtered.length === 0 ? (
          <div style={{ ...cardBase, padding: '64px 24px', textAlign: 'center', ...fadeUp(2) }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <SvgPackage />
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>Nenhum produto encontrado</p>
            <p style={{ fontSize: 13, color: T.muted, margin: 0 }}>Comece adicionando seu primeiro produto</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {productsByCategory.map(({ category, products: catProducts }, idx) =>
              renderAccordionSection(category.id, category.name, catProducts, idx + 2, category)
            )}
            {uncategorized.length > 0 &&
              renderAccordionSection('__none__', 'Sem Categoria', uncategorized, productsByCategory.length + 2)
            }
          </div>
        )}
      </div>

      {/* ── Existing Dialogs ── */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tenantId={activeTenantId}
        editing={editing}
        categories={categories}
        onSaved={fetchProducts}
      />
      <BulkImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        tenantId={activeTenantId}
        categories={categories}
        onImported={fetchProducts}
      />

      {/* Dialog para selecionar categoria (bulk delete) */}
      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir todos os produtos de uma categoria</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Selecione a categoria da qual deseja excluir todos os produtos:</p>
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setBulkDeleteOpen(false); setSelectedCategoryId(''); }}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={!selectedCategoryId}
              onClick={() => { setBulkDeleteOpen(false); setConfirmDeleteOpen(true); }}
            >
              Prosseguir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmacao final (bulk delete) */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Todos os produtos da categoria <strong>&quot;{selectedCategoryName}&quot;</strong> serao excluidos permanentemente. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setConfirmDeleteOpen(false); setSelectedCategoryId(''); }}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Excluindo...' : 'Sim, excluir tudo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Category Dialog ── */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent style={{ fontFamily: "'Inter', sans-serif", borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: '0 24px 48px rgba(0,0,0,0.12)', padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 2, background: `linear-gradient(90deg,${T.purple},${T.blue},${T.pink})` }} />
          <div style={{ padding: '24px 28px 28px' }}>
            <DialogHeader>
              <DialogTitle style={{ fontSize: '1.15rem', fontWeight: 700, color: T.text, marginBottom: 20 }}>
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </DialogTitle>
            </DialogHeader>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>Nome *</label>
                <input
                  value={categoryForm.name}
                  onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Pizzas"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = T.purple; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Descricao</label>
                <input
                  value={categoryForm.description}
                  onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descricao opcional"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = T.purple; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Icone (emoji)</label>
                <input
                  value={categoryForm.icon}
                  onChange={e => setCategoryForm(f => ({ ...f, icon: e.target.value }))}
                  placeholder="Ex: P"
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = T.purple; }}
                  onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                />
              </div>
              <button
                onClick={handleSaveCategory}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: `linear-gradient(135deg,${T.purple},${T.blue})`,
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14,
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
                {editingCategory ? 'Salvar' : 'Criar Categoria'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;
