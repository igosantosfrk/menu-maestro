import { exportCSV, formatDateBRShort, formatNum } from "@/utils/exportCSV";
import { useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Search, Crown, Phone, Mail, MapPin, ShoppingBag,
  DollarSign, Calendar, TrendingUp, Star, Save, Tag, ArrowUpDown,
  ChevronUp, ChevronDown, Award, Gift, Globe, ExternalLink, CreditCard,
  Truck, Clock, RotateCcw, AlertTriangle, MessageSquare, Ticket,
  Send, Brain, Loader2, Plus, Trash2, Sparkles, X, Cake
} from 'lucide-react';
import DateRangeFilter from '@/components/admin/DateRangeFilter';
import { useDateRange } from '@/hooks/useDateRange';
import { toast } from 'sonner';
import { paymentMethodLabels, paymentStatusLabels, statusConfig } from '@/components/admin/orders/types';

// ── Types ──
interface Customer {
  id: string; name: string; phone: string; email: string | null;
  address: string | null; neighborhood: string | null; city: string | null;
  notes: string | null; tags: string[]; total_orders: number; total_spent: number;
  avg_ticket: number; last_order_at: string | null; first_order_at: string | null;
  loyalty_points: number; loyalty_tier: string; created_at: string;
  birthday: string | null;
}

interface OrderHistory {
  id: string; order_number: number; total: number; subtotal: number;
  delivery_fee: number; discount: number; status: string; payment_method: string;
  payment_status: string; created_at: string; delivery_address: string | null;
  delivery_neighborhood: string | null; delivery_city: string | null;
  delivery_notes: string | null; notes: string | null;
  utm_source: string | null; utm_campaign: string | null; utm_medium: string | null;
  utm_content: string | null; utm_term: string | null; utm_ad_link: string | null;
  session_id: string | null; stripe_payment_intent_id: string | null;
}

interface WaTemplate { id: string; name: string; message: string; category: string; is_active: boolean; }
interface Coupon { id: string; code: string; description: string | null; discount_type: string; discount_value: number; is_active: boolean; expires_at: string | null; used_count: number; max_uses: number | null; }

const tierConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
  bronze: { label: 'Bronze', color: '#D97706', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.2)' },
  silver: { label: 'Prata', color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' },
  gold: { label: 'Ouro', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  platinum: { label: 'Platina', color: '#06B6D4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.2)' },
};

type SortField = 'total_spent' | 'total_orders' | 'last_order_at' | 'name' | 'loyalty_points';

function calcAvgReturnDays(orders: { created_at: string; status: string }[]): number | null {
  const completed = orders.filter(o => o.status !== 'cancelled').map(o => new Date(o.created_at).getTime()).sort((a, b) => a - b);
  if (completed.length < 2) return null;
  let totalDiff = 0;
  for (let i = 1; i < completed.length; i++) totalDiff += completed[i] - completed[i - 1];
  return totalDiff / (completed.length - 1) / (1000 * 60 * 60 * 24);
}

const formatReturnDays = (days: number | null) => {
  if (days === null) return '\u2014';
  if (days < 1) return `${Math.round(days * 24)}h`;
  if (days < 30) return `${Math.round(days)}d`;
  return `${Math.round(days / 30)}m`;
};

/* ── design tokens ── */
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
  cyan: '#06B6D4',
};

/* ── keyframes ── */
const styleId = 'mm-cust-anim';
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

/* ── SVG Icons ── */
const SvgUsers = ({ color = '#3B82F6' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
);
const SvgDollar = ({ color = '#10B981' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);
const SvgTrending = ({ color = '#8B5CF6' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);
const SvgAward = ({ color = '#EC4899' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
);
const SvgRotate = ({ color = '#F59E0B' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
);
const SvgStar = ({ color = '#F59E0B' }: { color?: string }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
);
const SvgMedal = ({ rank, color }: { rank: number; color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="7"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    <text x="12" y="11" textAnchor="middle" fill={color} stroke="none" fontSize="8" fontWeight="bold">{rank}</text>
  </svg>
);
const SvgSearch = ({ color = '#8892A4' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const SvgAlert = ({ color = '#F59E0B' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

const SvgDownload = ({ color = '#8892A4' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);

/* ── shared styles ── */
const cardBase: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s',
};

// ── Component ──
const Customers = () => {
  const { tenantId } = useAuth();
  const { preset, setPreset, dateRange, customRange, setCustomRange } = useDateRange('today');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const fadeUp = (delay: number): CSSProperties => ({
    animation: mounted ? `mmFadeUp 0.5s ease ${delay}s both` : 'none',
  });

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('total_spent');
  const [sortAsc, setSortAsc] = useState(false);
  const [allOrdersDates, setAllOrdersDates] = useState<{ customer_phone: string; created_at: string; status: string }[]>([]);

  // Detail
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [editNotes, setEditNotes] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  // AI Analysis
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Loyalty transactions for dossier
  const [loyaltyTxns, setLoyaltyTxns] = useState<{ id: string; type: string; points: number; description: string | null; created_at: string }[]>([]);
  const [customerCouponUsage, setCustomerCouponUsage] = useState<{ id: string; discount_applied: number; order_total: number; used_at: string; coupon_id: string }[]>([]);

  // Inactive filter
  const [inactivityDays, setInactivityDays] = useState(29);
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [filterDaysWithout, setFilterDaysWithout] = useState<number | null>(null);

  // Reactivation dialog
  const [reactivationOpen, setReactivationOpen] = useState(false);
  const [selectedInactiveCustomers, setSelectedInactiveCustomers] = useState<Customer[]>([]);

  // Templates & Coupons
  const [templates, setTemplates] = useState<WaTemplate[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedCoupon, setSelectedCoupon] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateMsg, setNewTemplateMsg] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState<'percentage' | 'fixed'>('percentage');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState('');
  const [showNewCoupon, setShowNewCoupon] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);

  // WhatsApp instance
  const [waInstance, setWaInstance] = useState<any>(null);

  // ── Fetchers ──
  const fetchCustomers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    let query = supabase.from('customers').select('*').eq('tenant_id', tenantId);
    if (preset !== 'max') {
      query = query.gte('last_order_at', dateRange.from.toISOString()).lte('last_order_at', dateRange.to.toISOString());
    }
    const { data } = await query.order('total_spent', { ascending: false });
    setCustomers((data as Customer[]) || []);
    setLoading(false);
  }, [tenantId, preset, dateRange.from, dateRange.to]);

  const fetchAllOrdersDates = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('orders').select('customer_phone, created_at, status')
      .eq('tenant_id', tenantId).neq('status', 'cancelled').order('created_at', { ascending: true });
    setAllOrdersDates(data || []);
  }, [tenantId]);

  const fetchTemplates = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('whatsapp_templates').select('*').eq('tenant_id', tenantId).eq('is_active', true);
    setTemplates((data as WaTemplate[]) || []);
  }, [tenantId]);

  const fetchCoupons = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('coupons').select('*').eq('tenant_id', tenantId).eq('is_active', true);
    setCoupons((data as Coupon[]) || []);
  }, [tenantId]);

  const fetchWaInstance = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('whatsapp_instances').select('*').eq('tenant_id', tenantId).single();
    setWaInstance(data);
  }, [tenantId]);

  useEffect(() => {
    fetchCustomers();
    fetchAllOrdersDates();
    fetchTemplates();
    fetchCoupons();
    fetchWaInstance();
  }, [fetchCustomers, fetchAllOrdersDates, fetchTemplates, fetchCoupons, fetchWaInstance]);

  // ── Detail open ──
  const openDetail = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditNotes(customer.notes || '');
    setEditEmail(customer.email || '');
    setEditTags((customer.tags || []).join(', '));
    setEditBirthday(customer.birthday || '');
    setDetailOpen(true);
    setExpandedOrder(null);
    setAiAnalysis(null);
    setLoyaltyTxns([]);
    setCustomerCouponUsage([]);

    const [ordersRes, loyaltyRes, couponUsageRes] = await Promise.all([
      supabase.from('orders')
        .select('id, order_number, total, subtotal, delivery_fee, discount, status, payment_method, payment_status, created_at, delivery_address, delivery_neighborhood, delivery_city, delivery_notes, notes, utm_source, utm_campaign, utm_medium, utm_content, utm_term, utm_ad_link, session_id, stripe_payment_intent_id')
        .eq('tenant_id', tenantId!).eq('customer_phone', customer.phone)
        .order('created_at', { ascending: false }),
      supabase.from('loyalty_transactions')
        .select('id, type, points, description, created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('coupon_usage')
        .select('id, discount_applied, order_total, used_at, coupon_id')
        .eq('customer_phone', customer.phone)
        .eq('tenant_id', tenantId!)
        .order('used_at', { ascending: false })
        .limit(20),
    ]);
    setOrderHistory((ordersRes.data as OrderHistory[]) || []);
    setLoyaltyTxns((loyaltyRes.data as any[]) || []);
    setCustomerCouponUsage((couponUsageRes.data as any[]) || []);
  };

  // ── AI analysis ──
  const runAiAnalysis = async () => {
    if (!selectedCustomer || !tenantId) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-customer', {
        body: { customer_phone: selectedCustomer.phone, tenant_id: tenantId },
      });
      if (error) {
        const errorBody = typeof error === 'object' && 'context' in error ? await (error as any).context?.json?.() : null;
        toast.error(errorBody?.error || 'Erro ao analisar cliente');
        setAiLoading(false);
        return;
      }
      if (data?.error) { toast.error(data.error); setAiLoading(false); return; }
      setAiAnalysis(data?.analysis || 'Sem dados para analise.');
    } catch (e: any) {
      toast.error('Erro ao analisar cliente: ' + (e?.message || 'erro desconhecido'));
    }
    setAiLoading(false);
  };

  // ── Save customer ──
  const saveCustomer = async () => {
    if (!selectedCustomer) return;
    setSaving(true);
    const tags = editTags.split(',').map(t => t.trim()).filter(Boolean);
    await supabase.from('customers').update({
      notes: editNotes, email: editEmail || null, tags,
      birthday: editBirthday || null,
    }).eq('id', selectedCustomer.id);
    toast.success('Cliente atualizado');
    setSaving(false);
    fetchCustomers();
  };

  // ── Sorting ──
  const handleSort = (field: SortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(false); }
  };

  // ── Inactive customers ──
  const inactiveCustomers = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - inactivityDays);
    return customers.filter(c => {
      if (!c.last_order_at) return true;
      return new Date(c.last_order_at) < cutoff;
    });
  }, [customers, inactivityDays]);

  const getDaysSinceLastOrder = (customer: Customer): number | null => {
    if (!customer.last_order_at) return null;
    return Math.floor((Date.now() - new Date(customer.last_order_at).getTime()) / (1000 * 60 * 60 * 24));
  };

  // ── Filtered list ──
  const filtered = useMemo(() => {
    let list = showInactiveOnly ? [...inactiveCustomers] : [...customers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email || '').toLowerCase().includes(q));
    }
    if (filterDaysWithout !== null) {
      list = list.filter(c => {
        const days = getDaysSinceLastOrder(c);
        return days === null || days >= filterDaysWithout;
      });
    }
    list.sort((a, b) => {
      let va: any = a[sortField]; let vb: any = b[sortField];
      if (sortField === 'name') { va = va?.toLowerCase(); vb = vb?.toLowerCase(); }
      if (sortField === 'last_order_at') { va = va ? new Date(va).getTime() : 0; vb = vb ? new Date(vb).getTime() : 0; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [customers, inactiveCustomers, showInactiveOnly, search, sortField, sortAsc, filterDaysWithout]);

  // ── KPIs ──
  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.total_spent, 0);
  const avgLTV = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const returning = customers.filter(c => c.total_orders > 1).length;
  const returnRate = totalCustomers > 0 ? (returning / totalCustomers) * 100 : 0;

  const globalAvgReturnDays = useMemo(() => {
    if (allOrdersDates.length === 0) return null;
    const byPhone: Record<string, number[]> = {};
    allOrdersDates.forEach(o => {
      if (!byPhone[o.customer_phone]) byPhone[o.customer_phone] = [];
      byPhone[o.customer_phone].push(new Date(o.created_at).getTime());
    });
    let totalDiff = 0, totalGaps = 0;
    Object.values(byPhone).forEach(dates => {
      if (dates.length < 2) return;
      dates.sort((a, b) => a - b);
      for (let i = 1; i < dates.length; i++) { totalDiff += dates[i] - dates[i - 1]; totalGaps++; }
    });
    return totalGaps === 0 ? null : totalDiff / totalGaps / (1000 * 60 * 60 * 24);
  }, [allOrdersDates]);

  const customerAvgReturn = useMemo(() => calcAvgReturnDays(orderHistory), [orderHistory]);

  // ── Template / Coupon creation ──
  const createTemplate = async () => {
    if (!newTemplateName || !newTemplateMsg || !tenantId) return;
    await supabase.from('whatsapp_templates').insert({ tenant_id: tenantId, name: newTemplateName, message: newTemplateMsg, category: 'reactivation' });
    toast.success('Template criado');
    setNewTemplateName(''); setNewTemplateMsg(''); setShowNewTemplate(false);
    fetchTemplates();
  };

  const createCoupon = async () => {
    if (!newCouponCode || !newCouponValue || !tenantId) return;
    await supabase.from('coupons').insert({
      tenant_id: tenantId, code: newCouponCode.toUpperCase(), discount_type: newCouponType,
      discount_value: parseFloat(newCouponValue),
      expires_at: newCouponExpiry ? new Date(newCouponExpiry).toISOString() : null,
    });
    toast.success('Cupom criado');
    setNewCouponCode(''); setNewCouponValue(''); setNewCouponExpiry(''); setShowNewCoupon(false);
    fetchCoupons();
  };

  // ── Send WhatsApp ──
  const sendWhatsAppBulk = async () => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template || !waInstance?.instance_name || !waInstance?.instance_token) {
      toast.error('Selecione um template e verifique a conexao do WhatsApp');
      return;
    }
    setSendingWa(true);
    const coupon = coupons.find(c => c.id === selectedCoupon);
    let sent = 0;
    for (const customer of selectedInactiveCustomers) {
      let msg = template.message
        .replace('{{nome}}', customer.name.split(' ')[0])
        .replace('{{cupom}}', coupon?.code || '')
        .replace('{{desconto}}', coupon ? `${coupon.discount_value}${coupon.discount_type === 'percentage' ? '%' : ' reais'}` : '');

      const phone = customer.phone.replace(/\D/g, '');
      try {
        await fetch(`https://igosantos.uazapi.com/v2/sendText/${waInstance.instance_name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'token': waInstance.instance_token },
          body: JSON.stringify({ to: `${phone}@s.whatsapp.net`, text: msg }),
        });
        sent++;
      } catch { /* skip failed */ }
    }
    toast.success(`${sent} mensagens enviadas com sucesso!`);
    setSendingWa(false);
    setReactivationOpen(false);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown style={{ width: 12, height: 12, color: T.muted }} />;
    return sortAsc ? <ChevronUp style={{ width: 12, height: 12, color: T.blue }} /> : <ChevronDown style={{ width: 12, height: 12, color: T.blue }} />;
  };

  /* ── metric cards config ── */
  const metricCards = [
    { label: 'Total Clientes', value: totalCustomers.toString(), icon: <SvgUsers />, iconBg: 'rgba(59,130,246,0.1)', gradient: `linear-gradient(90deg,${T.blue},transparent)` },
    { label: 'Receita Total', value: `R$ ${totalRevenue.toFixed(0)}`, icon: <SvgDollar />, iconBg: 'rgba(16,185,129,0.1)', gradient: `linear-gradient(90deg,${T.green},transparent)` },
    { label: 'LTV Medio', value: `R$ ${avgLTV.toFixed(2).replace('.', ',')}`, icon: <SvgTrending />, iconBg: 'rgba(139,92,246,0.08)', gradient: `linear-gradient(90deg,${T.purple},transparent)` },
    { label: 'Taxa de Retorno', value: `${returnRate.toFixed(1)}%`, icon: <SvgAward />, iconBg: 'rgba(236,72,153,0.08)', gradient: `linear-gradient(90deg,${T.pink},transparent)` },
    { label: 'Tempo Medio Retorno', value: formatReturnDays(globalAvgReturnDays), icon: <SvgRotate />, iconBg: 'rgba(245,158,11,0.1)', gradient: `linear-gradient(90deg,${T.amber},transparent)` },
  ];

  const getDaysColor = (days: number | null) => {
    if (days === null) return T.muted;
    if (days >= 60) return T.red;
    if (days >= 30) return '#F97316';
    if (days >= 10) return T.amber;
    return T.green;
  };

  /* table header style */
  const thStyle: CSSProperties = {
    padding: '12px 14px',
    fontSize: '0.62rem',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: T.muted,
    fontWeight: 600,
    borderBottom: `1px solid ${T.border}`,
    whiteSpace: 'nowrap',
  };

  const sortBtnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    fontSize: 'inherit',
    fontWeight: 'inherit',
    textTransform: 'inherit' as any,
    letterSpacing: 'inherit',
    color: 'inherit',
    transition: 'color 0.2s',
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text, position: 'relative', minHeight: '100%' }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, right: -150, width: 600, height: 600, background: 'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow1 8s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -150, width: 500, height: 500, background: 'radial-gradient(circle,rgba(236,72,153,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow2 10s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16, ...fadeUp(0) }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
              <span style={{ background: `linear-gradient(135deg,${T.blue},${T.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Clientes</span>
            </h1>
            <p style={{ fontSize: '0.88rem', color: T.muted }}>
              {totalCustomers} clientes cadastrados
              {showInactiveOnly && <span style={{ color: '#F97316', marginLeft: 8 }}>· Filtro: inativos ha {inactivityDays}+ dias</span>}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => {
                exportCSV(filtered, 'clientes.csv', [
                  { key: 'name', label: 'Nome' },
                  { key: 'phone', label: 'Telefone' },
                  { key: 'email', label: 'Email' },
                  { key: 'address', label: 'Endereco' },
                  { key: 'neighborhood', label: 'Bairro' },
                  { key: 'city', label: 'Cidade' },
                  { key: 'total_orders', label: 'Total Pedidos' },
                  { key: 'total_spent', label: 'Total Gasto', format: (v: any) => formatNum(v) },
                  { key: 'avg_ticket', label: 'Ticket Medio', format: (v: any) => formatNum(v) },
                  { key: 'last_order_at', label: 'Ultimo Pedido', format: (v: any) => formatDateBRShort(v) },
                  { key: 'first_order_at', label: 'Primeiro Pedido', format: (v: any) => formatDateBRShort(v) },
                  { key: 'tags', label: 'Tags', format: (v: any) => (v || []).join('; ') },
                ]);
              }}
              title="Exportar CSV"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 10,
                background: T.card, color: T.text, fontWeight: 500, fontSize: '0.78rem',
                border: `1px solid ${T.border}`, cursor: 'pointer',
                transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <SvgDownload /> Exportar
            </button>
            <DateRangeFilter preset={preset} onPresetChange={setPreset} customRange={customRange} onCustomRangeChange={setCustomRange} />
          </div>
        </div>

        {/* ── Metric Cards (5) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {metricCards.map((c, i) => (
            <div
              key={c.label}
              style={{ ...cardBase, padding: '20px 18px', ...fadeUp(0.05 + i * 0.05) }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.gradient }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.08),transparent)' }} />
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

        {/* ── Inactive Alert Banner ── */}
        {inactiveCustomers.length > 0 && (
          <div
            style={{
              ...cardBase,
              padding: '16px 20px',
              marginBottom: 16,
              cursor: 'pointer',
              ...fadeUp(0.35),
            }}
            onClick={() => {
              setShowInactiveOnly(!showInactiveOnly);
              if (!showInactiveOnly) setSelectedInactiveCustomers(inactiveCustomers);
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(245,158,11,0.3)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.amber},#F97316,transparent)` }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SvgAlert />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: T.text }}>
                    {inactiveCustomers.length} cliente{inactiveCustomers.length !== 1 ? 's' : ''} inativo{inactiveCustomers.length !== 1 ? 's' : ''}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: T.muted }}>Sem pedidos ha {inactivityDays}+ dias · Clique para {showInactiveOnly ? 'remover filtro' : 'filtrar'}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Select value={inactivityDays.toString()} onValueChange={v => { setInactivityDays(parseInt(v)); setShowInactiveOnly(false); }}>
                  <SelectTrigger style={{ width: 90, height: 32, fontSize: '0.75rem', background: 'rgba(0,0,0,0.02)', border: `1px solid ${T.border}`, borderRadius: 8 }} onClick={e => e.stopPropagation()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 29, 45, 60, 90].map(d => (
                      <SelectItem key={d} value={d.toString()}>{d} dias</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    background: `linear-gradient(135deg,${T.amber},#F97316)`, color: '#fff',
                    border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'opacity 0.2s',
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedInactiveCustomers(inactiveCustomers); setReactivationOpen(true); }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                >
                  <MessageSquare style={{ width: 13, height: 13 }} />
                  Reativar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Search + Filters ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, ...fadeUp(0.4) }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <SvgSearch />
            </div>
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px 10px 38px',
                background: T.card, border: `1px solid ${T.border}`,
                borderRadius: 10, fontSize: '0.85rem', color: T.text,
                outline: 'none', transition: 'border-color 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = T.blue; }}
              onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
            />
          </div>
          <Select value={filterDaysWithout?.toString() || 'all'} onValueChange={v => setFilterDaysWithout(v === 'all' ? null : parseInt(v))}>
            <SelectTrigger style={{ width: 180, background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, fontSize: '0.82rem', color: T.text, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', height: 42 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock style={{ width: 13, height: 13, color: T.muted }} />
                <SelectValue placeholder="Dias sem pedir" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              <SelectItem value="10">+10 dias sem pedir</SelectItem>
              <SelectItem value="30">+30 dias sem pedir</SelectItem>
              <SelectItem value="45">+45 dias sem pedir</SelectItem>
              <SelectItem value="60">+60 dias sem pedir</SelectItem>
              <SelectItem value="90">+90 dias sem pedir</SelectItem>
              <SelectItem value="180">+180 dias sem pedir</SelectItem>
            </SelectContent>
          </Select>
          {(showInactiveOnly || filterDaysWithout !== null) && (
            <button
              onClick={() => { setShowInactiveOnly(false); setFilterDaysWithout(null); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '8px 14px', background: 'rgba(245,158,11,0.06)',
                border: `1px solid rgba(245,158,11,0.25)`, borderRadius: 10,
                fontSize: '0.78rem', color: '#F97316', fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <X style={{ width: 13, height: 13 }} /> Limpar filtros
            </button>
          )}
        </div>

        {/* ── Customer Table ── */}
        <div style={{ ...cardBase, borderRadius: 16, ...fadeUp(0.45) }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.purple},transparent)` }} />

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: T.muted, fontSize: '0.88rem' }}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
              <Users style={{ width: 40, height: 40, color: T.muted, marginBottom: 12 }} />
              <p style={{ color: T.muted, fontWeight: 500 }}>Nenhum cliente encontrado</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, textAlign: 'left', width: 50 }}>#</th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>
                      <button style={sortBtnStyle} onClick={() => handleSort('name')}>Cliente <SortIcon field="name" /></button>
                    </th>
                    <th style={{ ...thStyle, textAlign: 'left' }}>Tier</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>
                      <button style={{ ...sortBtnStyle, margin: '0 auto' }} onClick={() => handleSort('total_orders')}>Pedidos <SortIcon field="total_orders" /></button>
                    </th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>
                      <button style={{ ...sortBtnStyle, marginLeft: 'auto' }} onClick={() => handleSort('total_spent')}>Total Gasto <SortIcon field="total_spent" /></button>
                    </th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Ticket Medio</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>
                      <button style={{ ...sortBtnStyle, marginLeft: 'auto' }} onClick={() => handleSort('last_order_at')}>Ultimo Pedido <SortIcon field="last_order_at" /></button>
                    </th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Dias s/ Pedir</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>
                      <button style={{ ...sortBtnStyle, margin: '0 auto' }} onClick={() => handleSort('loyalty_points')}>Pontos <SortIcon field="loyalty_points" /></button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer, i) => {
                    const tier = tierConfig[customer.loyalty_tier] || tierConfig.bronze;
                    const days = getDaysSinceLastOrder(customer);
                    const daysColor = getDaysColor(days);
                    return (
                      <tr
                        key={customer.id}
                        style={{ borderBottom: `1px solid rgba(232,236,244,0.5)`, cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => openDetail(customer)}
                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(59,130,246,0.02)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          {i < 3 ? (
                            <SvgMedal rank={i + 1} color={i === 0 ? T.amber : i === 1 ? '#9CA3AF' : '#D97706'} />
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: T.muted, fontWeight: 700 }}>{i + 1}</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: '0.84rem', color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{customer.name}</p>
                            <p style={{ fontSize: '0.7rem', color: T.muted, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <Phone style={{ width: 11, height: 11 }} />{customer.phone}
                            </p>
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            display: 'inline-block', padding: '3px 10px',
                            fontSize: '0.68rem', fontWeight: 600,
                            color: tier.color, background: tier.bg,
                            border: `1px solid ${tier.border}`,
                            borderRadius: 20,
                          }}>
                            {tier.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 600 }}>{customer.total_orders}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: T.green }}>R$ {Number(customer.total_spent).toFixed(2).replace('.', ',')}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.82rem' }}>R$ {Number(customer.avg_ticket).toFixed(2).replace('.', ',')}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.75rem', color: T.muted }}>{customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString('pt-BR') : '\u2014'}</td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          {days === null ? (
                            <span style={{ fontSize: '0.75rem', color: T.muted }}>\u2014</span>
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: daysColor }}>{days}d</span>
                          )}
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 8px', fontSize: '0.68rem', fontWeight: 500,
                            border: `1px solid ${T.border}`, borderRadius: 20,
                            color: T.text,
                          }}>
                            <SvgStar /> {customer.loyalty_points}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Customer Detail Sheet ── */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto" style={{ background: T.bg, borderLeft: `1px solid ${T.border}` }}>
          {selectedCustomer && (() => {
            const tier = tierConfig[selectedCustomer.loyalty_tier] || tierConfig.bronze;
            return (
              <>
                <SheetHeader style={{ paddingBottom: 16 }}>
                  <SheetTitle style={{ fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 8, color: T.text }}>
                    <Crown style={{ width: 18, height: 18, color: T.amber }} /> Dossie do Cliente
                  </SheetTitle>
                </SheetHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                  {/* Avatar card */}
                  <div style={{ ...cardBase, padding: 24, textAlign: 'center' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.purple},transparent)` }} />
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', background: 'rgba(59,130,246,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                    }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 700, color: T.blue }}>{selectedCustomer.name[0]?.toUpperCase()}</span>
                    </div>
                    <h3 style={{ fontWeight: 700, fontSize: '1.1rem', color: T.text }}>{selectedCustomer.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
                      <Phone style={{ width: 13, height: 13 }} /> {selectedCustomer.phone}
                    </p>
                    {selectedCustomer.email && (
                      <p style={{ fontSize: '0.82rem', color: T.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 }}>
                        <Mail style={{ width: 13, height: 13 }} /> {selectedCustomer.email}
                      </p>
                    )}
                    <div style={{ marginTop: 12 }}>
                      <span style={{
                        display: 'inline-block', padding: '4px 14px', fontSize: '0.75rem',
                        fontWeight: 600, color: tier.color, background: tier.bg,
                        border: `1px solid ${tier.border}`, borderRadius: 20,
                      }}>
                        {tier.label} · {selectedCustomer.loyalty_points} pontos
                      </span>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { icon: <ShoppingBag style={{ width: 14, height: 14, color: T.blue }} />, value: selectedCustomer.total_orders.toString(), label: 'Pedidos' },
                      { icon: <DollarSign style={{ width: 14, height: 14, color: T.green }} />, value: `R$ ${Number(selectedCustomer.total_spent).toFixed(0)}`, label: 'Total Gasto' },
                      { icon: <TrendingUp style={{ width: 14, height: 14, color: T.purple }} />, value: `R$ ${Number(selectedCustomer.avg_ticket).toFixed(2).replace('.', ',')}`, label: 'Ticket Medio' },
                      { icon: <Calendar style={{ width: 14, height: 14, color: T.pink }} />, value: selectedCustomer.first_order_at ? new Date(selectedCustomer.first_order_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }) : '\u2014', label: 'Cliente desde' },
                      { icon: <Clock style={{ width: 14, height: 14, color: T.amber }} />, value: selectedCustomer.last_order_at ? new Date(selectedCustomer.last_order_at).toLocaleDateString('pt-BR') : '\u2014', label: 'Ultimo Pedido' },
                      { icon: <RotateCcw style={{ width: 14, height: 14, color: '#F97316' }} />, value: formatReturnDays(customerAvgReturn), label: 'Retorno Medio' },
                    ].map(s => (
                      <div key={s.label} style={{ ...cardBase, padding: '12px 8px', textAlign: 'center', borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
                        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: T.text }}>{s.value}</p>
                        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.8, color: T.muted, marginTop: 2 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI Analysis */}
                  <div style={{ ...cardBase, padding: 16, borderRadius: 12 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.purple},transparent)` }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Brain style={{ width: 13, height: 13, color: T.purple }} /> Analise de IA
                      </span>
                      <button
                        onClick={runAiAnalysis}
                        disabled={aiLoading}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px',
                          background: 'rgba(139,92,246,0.08)', border: `1px solid rgba(139,92,246,0.15)`,
                          borderRadius: 6, fontSize: '0.72rem', fontWeight: 500, color: T.purple,
                          cursor: aiLoading ? 'wait' : 'pointer',
                        }}
                      >
                        {aiLoading ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Sparkles style={{ width: 13, height: 13 }} />}
                        {aiAnalysis ? 'Reanalisar' : 'Analisar Preferencias'}
                      </button>
                    </div>
                    {aiAnalysis ? (
                      <div style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, color: T.text }}>{aiAnalysis}</div>
                    ) : (
                      <p style={{ fontSize: '0.75rem', color: T.muted }}>Clique em "Analisar Preferencias" para gerar insights baseados no historico de compras.</p>
                    )}
                  </div>

                  {/* Address */}
                  {selectedCustomer.address && (
                    <div style={{ ...cardBase, padding: 14, borderRadius: 10 }}>
                      <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <MapPin style={{ width: 13, height: 13, color: T.muted }} /> Endereco
                      </span>
                      <p style={{ fontSize: '0.82rem', color: T.text }}>{selectedCustomer.address}</p>
                      {selectedCustomer.neighborhood && (
                        <p style={{ fontSize: '0.82rem', color: T.muted }}>{selectedCustomer.neighborhood}{selectedCustomer.city ? ` - ${selectedCustomer.city}` : ''}</p>
                      )}
                    </div>
                  )}

                  <Separator style={{ background: T.border }} />

                  {/* Editable Fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600 }}>Informacoes Adicionais</span>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.muted, display: 'block', marginBottom: 4 }}>E-mail</label>
                      <input
                        value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="email@exemplo.com"
                        style={{ width: '100%', padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', color: T.text, outline: 'none' }}
                        onFocus={e => { e.currentTarget.style.borderColor = T.blue; }}
                        onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Cake style={{ width: 11, height: 11 }} /> Data de Aniversario
                      </label>
                      <input
                        type="date" value={editBirthday} onChange={(e) => setEditBirthday(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', color: T.text, outline: 'none' }}
                        onFocus={e => { e.currentTarget.style.borderColor = T.blue; }}
                        onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Tag style={{ width: 11, height: 11 }} /> Tags
                      </label>
                      <input
                        value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="vip, frequente"
                        style={{ width: '100%', padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', color: T.text, outline: 'none' }}
                        onFocus={e => { e.currentTarget.style.borderColor = T.blue; }}
                        onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: T.muted, display: 'block', marginBottom: 4 }}>Observacoes</label>
                      <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Anotacoes..." style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', minHeight: 60, color: T.text }} />
                    </div>
                    <button
                      onClick={saveCustomer}
                      disabled={saving}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        width: '100%', padding: '10px 0',
                        background: `linear-gradient(135deg,${T.blue},${T.purple})`,
                        color: '#fff', border: 'none', borderRadius: 10,
                        fontSize: '0.85rem', fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                    >
                      <Save style={{ width: 15, height: 15 }} /> Salvar
                    </button>
                  </div>

                  <Separator style={{ background: T.border }} />

                  {/* Loyalty Section */}
                  <div style={{ ...cardBase, padding: 14, borderRadius: 12 }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.amber},transparent)` }} />
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <Gift style={{ width: 13, height: 13, color: T.amber }} /> Fidelidade
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: tier.color }}>{tier.label}</p>
                        <p style={{ fontSize: '0.72rem', color: T.muted }}>{selectedCustomer.loyalty_points} pontos</p>
                      </div>
                      <p style={{ fontSize: '0.72rem', fontWeight: 600, color: T.amber }}>
                        {selectedCustomer.loyalty_tier === 'bronze' ? 'Prata (500)' : selectedCustomer.loyalty_tier === 'silver' ? 'Ouro (1500)' : selectedCustomer.loyalty_tier === 'gold' ? 'Platina (5000)' : 'Maximo'}
                      </p>
                    </div>

                    {loyaltyTxns.length > 0 && (
                      <div style={{ marginTop: 12, maxHeight: 128, overflowY: 'auto' }}>
                        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.8, color: T.muted, marginBottom: 6 }}>Historico de Pontos</p>
                        {loyaltyTxns.map(tx => (
                          <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 0', borderBottom: `1px solid rgba(232,236,244,0.4)` }}>
                            <div>
                              <span style={{ color: tx.type === 'earn' ? T.green : T.red, fontWeight: 500 }}>
                                {tx.type === 'earn' ? '+' : ''}{tx.points} pts
                              </span>
                              {tx.description && <span style={{ color: T.muted, marginLeft: 6 }}>{tx.description}</span>}
                            </div>
                            <span style={{ color: T.muted, fontSize: '0.65rem' }}>{new Date(tx.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Coupon usage history */}
                  {customerCouponUsage.length > 0 && (
                    <div style={{ ...cardBase, padding: 14, borderRadius: 12 }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},transparent)` }} />
                      <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <Ticket style={{ width: 13, height: 13, color: T.blue }} /> Cupons Utilizados
                      </span>
                      <div style={{ maxHeight: 128, overflowY: 'auto' }}>
                        {customerCouponUsage.map(cu => (
                          <div key={cu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', padding: '4px 0', borderBottom: `1px solid rgba(232,236,244,0.4)` }}>
                            <div>
                              <span style={{ color: T.red, fontWeight: 500 }}>-R$ {Number(cu.discount_applied).toFixed(2).replace('.', ',')}</span>
                              <span style={{ color: T.muted, marginLeft: 6 }}>em pedido de R$ {Number(cu.order_total).toFixed(2).replace('.', ',')}</span>
                            </div>
                            <span style={{ color: T.muted, fontSize: '0.65rem' }}>{new Date(cu.used_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator style={{ background: T.border }} />

                  {/* Full Order History */}
                  <div>
                    <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 12 }}>
                      Historico Completo ({orderHistory.length})
                    </span>
                    <div style={{ maxHeight: 500, overflowY: 'auto', paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {orderHistory.map(h => {
                        const isExpanded = expandedOrder === h.id;
                        const sConfig = statusConfig[h.status as keyof typeof statusConfig];
                        const hasTracking = h.utm_source || h.utm_campaign || h.utm_medium || h.utm_content || h.utm_term || h.utm_ad_link;
                        return (
                          <div key={h.id} style={{ ...cardBase, borderRadius: 10, borderColor: isExpanded ? 'rgba(59,130,246,0.2)' : T.border }}>
                            <div
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer' }}
                              onClick={() => setExpandedOrder(isExpanded ? null : h.id)}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: T.blue }}>#{h.order_number}</span>
                                  {sConfig && (
                                    <span style={{
                                      display: 'inline-block', padding: '2px 8px', fontSize: '0.62rem',
                                      fontWeight: 500, borderRadius: 10,
                                      background: h.status === 'completed' ? 'rgba(16,185,129,0.08)' : h.status === 'cancelled' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                                      color: h.status === 'completed' ? T.green : h.status === 'cancelled' ? T.red : T.amber,
                                      border: `1px solid ${h.status === 'completed' ? 'rgba(16,185,129,0.2)' : h.status === 'cancelled' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                    }}>
                                      {sConfig.label}
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: '0.7rem', color: T.muted, marginTop: 2 }}>
                                  {new Date(h.created_at).toLocaleDateString('pt-BR')} as {new Date(h.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: T.text }}>R$ {Number(h.total).toFixed(2).replace('.', ',')}</span>
                                <ChevronDown style={{ width: 14, height: 14, color: T.muted, transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }} />
                              </div>
                            </div>
                            {isExpanded && (
                              <div style={{ padding: '0 14px 14px', borderTop: `1px solid rgba(232,236,244,0.5)`, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                                  <div style={{ fontSize: '0.75rem' }}><span style={{ color: T.muted }}>Subtotal</span><p style={{ fontWeight: 600, color: T.text }}>R$ {Number(h.subtotal).toFixed(2).replace('.', ',')}</p></div>
                                  <div style={{ fontSize: '0.75rem' }}><span style={{ color: T.muted }}>Entrega</span><p style={{ fontWeight: 600, color: T.text }}>R$ {Number(h.delivery_fee).toFixed(2).replace('.', ',')}</p></div>
                                  {Number(h.discount) > 0 && <div style={{ fontSize: '0.75rem' }}><span style={{ color: T.muted }}>Desconto</span><p style={{ fontWeight: 600, color: T.green }}>-R$ {Number(h.discount).toFixed(2).replace('.', ',')}</p></div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <CreditCard style={{ width: 12, height: 12, color: T.muted }} />
                                  <span style={{ padding: '2px 8px', fontSize: '0.65rem', border: `1px solid ${T.border}`, borderRadius: 10, color: T.text }}>
                                    {paymentMethodLabels[h.payment_method as keyof typeof paymentMethodLabels] || h.payment_method}
                                  </span>
                                  <span style={{
                                    padding: '2px 8px', fontSize: '0.65rem', borderRadius: 10,
                                    background: h.payment_status === 'confirmed' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                    color: h.payment_status === 'confirmed' ? T.green : T.amber,
                                    border: `1px solid ${h.payment_status === 'confirmed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                  }}>
                                    {paymentStatusLabels[h.payment_status as keyof typeof paymentStatusLabels] || h.payment_status}
                                  </span>
                                </div>
                                {h.delivery_address && (
                                  <div style={{ fontSize: '0.75rem' }}>
                                    <span style={{ color: T.muted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}><Truck style={{ width: 12, height: 12 }} /> Endereco</span>
                                    <p style={{ color: T.text }}>{h.delivery_address}</p>
                                    {h.delivery_neighborhood && <p style={{ color: T.muted }}>{h.delivery_neighborhood}{h.delivery_city ? ` - ${h.delivery_city}` : ''}</p>}
                                    {h.delivery_notes && <p style={{ color: T.muted, marginTop: 2 }}>Obs: {h.delivery_notes}</p>}
                                  </div>
                                )}
                                {h.notes && <div style={{ fontSize: '0.75rem' }}><span style={{ color: T.muted }}>Obs:</span> <span style={{ color: T.text }}>{h.notes}</span></div>}
                                {hasTracking && (
                                  <div style={{ padding: 10, borderRadius: 8, background: 'rgba(59,130,246,0.02)', border: `1px solid rgba(232,236,244,0.5)` }}>
                                    <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.8, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                      <Globe style={{ width: 11, height: 11 }} /> Rastreamento
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.7rem' }}>
                                      {h.utm_source && <div><span style={{ color: T.muted }}>Fonte:</span> <span style={{ fontWeight: 500, color: T.text }}>{h.utm_source}</span></div>}
                                      {h.utm_campaign && <div><span style={{ color: T.muted }}>Campanha:</span> <span style={{ fontWeight: 500, color: T.text }}>{h.utm_campaign}</span></div>}
                                      {h.utm_medium && <div><span style={{ color: T.muted }}>Midia:</span> <span style={{ fontWeight: 500, color: T.text }}>{h.utm_medium}</span></div>}
                                      {h.utm_content && <div><span style={{ color: T.muted }}>Conteudo:</span> <span style={{ fontWeight: 500, color: T.text }}>{h.utm_content}</span></div>}
                                      {h.utm_term && <div><span style={{ color: T.muted }}>Termo:</span> <span style={{ fontWeight: 500, color: T.text }}>{h.utm_term}</span></div>}
                                      {h.utm_ad_link && <div><a href={h.utm_ad_link} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, display: 'flex', alignItems: 'center', gap: 4 }}><ExternalLink style={{ width: 11, height: 11 }} /> Ver anuncio</a></div>}
                                    </div>
                                    {h.session_id && <p style={{ fontSize: '0.62rem', color: T.muted, marginTop: 4, fontFamily: 'monospace' }}>Sessao: {h.session_id.slice(0, 12)}...</p>}
                                  </div>
                                )}
                                {h.stripe_payment_intent_id && <p style={{ fontSize: '0.62rem', color: T.muted, fontFamily: 'monospace' }}>Stripe: {h.stripe_payment_intent_id}</p>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {orderHistory.length === 0 && <p style={{ fontSize: '0.82rem', color: T.muted, textAlign: 'center', padding: '16px 0' }}>Nenhum pedido encontrado</p>}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Reactivation Dialog ── */}
      <Dialog open={reactivationOpen} onOpenChange={setReactivationOpen}>
        <DialogContent style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, maxWidth: 540 }}>
          <DialogHeader>
            <DialogTitle style={{ fontWeight: 800, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8, color: T.text }}>
              <MessageSquare style={{ width: 18, height: 18, color: T.blue }} />
              Campanha de Reativacao
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
            <p style={{ fontSize: '0.82rem', color: T.muted }}>
              <span style={{ fontWeight: 600, color: '#F97316' }}>{selectedInactiveCustomers.length}</span> clientes inativos ha {inactivityDays}+ dias serao impactados.
            </p>

            {/* Template Selection */}
            <div>
              <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600, display: 'block', marginBottom: 8 }}>Template de Mensagem</label>
              {templates.length > 0 ? (
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem' }}>
                    <SelectValue placeholder="Selecione um template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p style={{ fontSize: '0.75rem', color: T.muted }}>Nenhum template criado ainda.</p>
              )}
              {selectedTemplate && (
                <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: 'rgba(59,130,246,0.02)', border: `1px solid rgba(232,236,244,0.5)`, fontSize: '0.75rem' }}>
                  <p style={{ color: T.muted, marginBottom: 4 }}>Preview:</p>
                  <p style={{ color: T.text }}>{templates.find(t => t.id === selectedTemplate)?.message}</p>
                </div>
              )}
              <button
                onClick={() => setShowNewTemplate(!showNewTemplate)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 0', marginTop: 8, background: 'none', border: 'none', fontSize: '0.75rem', color: T.blue, fontWeight: 500, cursor: 'pointer' }}
              >
                <Plus style={{ width: 12, height: 12 }} /> Novo template
              </button>
              <AnimatePresence>
                {showNewTemplate && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(59,130,246,0.02)', border: `1px solid rgba(232,236,244,0.5)` }}>
                      <input
                        placeholder="Nome do template" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)}
                        style={{ padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', color: T.text, outline: 'none' }}
                      />
                      <Textarea
                        placeholder="Mensagem (use {{nome}}, {{cupom}}, {{desconto}})"
                        value={newTemplateMsg} onChange={e => setNewTemplateMsg(e.target.value)}
                        style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', minHeight: 60, color: T.text }}
                      />
                      <button
                        onClick={createTemplate}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 14px', background: `linear-gradient(135deg,${T.blue},${T.purple})`, color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Salvar Template
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator style={{ background: T.border }} />

            {/* Coupon Selection */}
            <div>
              <label style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ticket style={{ width: 13, height: 13, color: T.muted }} /> Cupom de Desconto (opcional)
              </label>
              {coupons.length > 0 && (
                <Select value={selectedCoupon} onValueChange={setSelectedCoupon}>
                  <SelectTrigger style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem' }}>
                    <SelectValue placeholder="Anexar cupom..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem cupom</SelectItem>
                    {coupons.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} - {c.discount_value}{c.discount_type === 'percentage' ? '%' : ' R$'} off
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <button
                onClick={() => setShowNewCoupon(!showNewCoupon)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 0', marginTop: 8, background: 'none', border: 'none', fontSize: '0.75rem', color: T.blue, fontWeight: 500, cursor: 'pointer' }}
              >
                <Plus style={{ width: 12, height: 12 }} /> Novo cupom
              </button>
              <AnimatePresence>
                {showNewCoupon && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, padding: 12, borderRadius: 8, background: 'rgba(59,130,246,0.02)', border: `1px solid rgba(232,236,244,0.5)` }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          placeholder="CODIGO" value={newCouponCode} onChange={e => setNewCouponCode(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', color: T.text, outline: 'none', textTransform: 'uppercase' }}
                        />
                        <Select value={newCouponType} onValueChange={v => setNewCouponType(v as any)}>
                          <SelectTrigger style={{ width: 100, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem' }}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">R$</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="number" placeholder="Valor" value={newCouponValue} onChange={e => setNewCouponValue(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', color: T.text, outline: 'none' }}
                        />
                        <input
                          type="date" placeholder="Expira em" value={newCouponExpiry} onChange={e => setNewCouponExpiry(e.target.value)}
                          style={{ flex: 1, padding: '8px 12px', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: '0.82rem', color: T.text, outline: 'none' }}
                        />
                      </div>
                      <button
                        onClick={createCoupon}
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 14px', background: `linear-gradient(135deg,${T.blue},${T.purple})`, color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Criar Cupom
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator style={{ background: T.border }} />

            {/* Send */}
            <button
              disabled={!selectedTemplate || sendingWa}
              onClick={sendWhatsAppBulk}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '12px 0',
                background: (!selectedTemplate || sendingWa) ? T.border : `linear-gradient(135deg,${T.blue},${T.purple})`,
                color: (!selectedTemplate || sendingWa) ? T.muted : '#fff',
                border: 'none', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600,
                cursor: (!selectedTemplate || sendingWa) ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
            >
              {sendingWa ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 15, height: 15 }} />}
              Enviar para {selectedInactiveCustomers.length} clientes via WhatsApp
            </button>

            {!waInstance?.instance_name && (
              <p style={{ fontSize: '0.72rem', color: T.red, textAlign: 'center' }}>
                <AlertTriangle style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                WhatsApp nao configurado. Acesse a pagina de WhatsApp primeiro.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;
