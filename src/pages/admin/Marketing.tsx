import { useState, useEffect, type CSSProperties } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import DateRangeFilter from '@/components/admin/DateRangeFilter';
import { useDateRange } from '@/hooks/useDateRange';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  DollarSign, TrendingUp, Target, ShoppingCart, RefreshCw, Settings2,
  Eye, MousePointer, ArrowUpRight, ArrowDownRight, Loader2, Plug, BarChart3, Link2, Ticket, Crown, MessageSquare
} from 'lucide-react';
import TrackingLinksTab from '@/components/admin/marketing/TrackingLinksTab';
import CouponsTab from '@/components/admin/marketing/CouponsTab';
import LoyaltyTab from '@/components/admin/marketing/LoyaltyTab';
import WhatsAppAutomationTab from '@/components/admin/marketing/WhatsAppAutomationTab';
import CampanhasTab from '@/components/admin/marketing/CampanhasTab';

/* ── design tokens (inline) ── */
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
  cyan: '#06B6D4',
};

/* ── keyframes injected once ── */
const styleId = 'mm-mkt-anim';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const s = document.createElement('style');
  s.id = styleId;
  s.textContent = `
@keyframes mmFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes mmGlow1{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,30px)}}
@keyframes mmGlow2{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-20px)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;
  document.head.appendChild(s);
}

/* ── SVG Icons (Lucide-style) ── */
const SvgDollar = ({ color = T.red }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);
const SvgTrending = ({ color = T.green }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);
const SvgCart = ({ color = T.blue }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
);
const SvgArrowUp = ({ color = T.green }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
);
const SvgArrowDown = ({ color = T.red }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="7" x2="17" y2="17"/><polyline points="17 7 17 17 7 17"/></svg>
);
const SvgPlug = ({ color = T.muted }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 01-12 0V8z"/></svg>
);
const SvgBarChartIcon = ({ color = T.purple }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
);
const SvgSettings = ({ color = T.muted }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
);
const SvgRefresh = ({ color = T.muted, spinning = false }: { color?: string; spinning?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={spinning ? { animation: 'spin 1s linear infinite' } : undefined}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
);
const SvgPause = ({ color = T.card }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
);
const SvgPlay = ({ color = T.text }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
);
const SvgLink = ({ color = T.blue }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
);
const SvgTicket = ({ color = T.amber }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v0a3 3 0 01-3 3v0a3 3 0 01-3 3H5a3 3 0 01-3-3v0z"/><path d="M13 6v12"/></svg>
);
const SvgCrown = ({ color = T.amber }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18"/></svg>
);
const SvgMessage = ({ color = T.green }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
);

interface Campaign {
  id: string;
  name: string;
  status: string;
  platform: 'meta' | 'google';
  spend: number;
  impressions: number;
  clicks: number;
  results: number;
  cost_per_result: number;
  revenue: number;
  orders: number;
  roi: number;
}

interface Summary {
  total_spend: number;
  total_revenue: number;
  total_orders: number;
  roi: number;
}

interface AdAccount {
  id: string;
  platform: string;
  account_id: string;
  access_token: string;
  account_name: string | null;
  is_active: boolean;
  last_synced_at: string | null;
}

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

const Marketing = () => {
  const { tenantId } = useAuth();
  const { preset, setPreset, dateRange, customRange, setCustomRange } = useDateRange('today');
  const [tab, setTab] = useState('overview');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Form states
  const [metaToken, setMetaToken] = useState('');
  const [metaAccountId, setMetaAccountId] = useState('');
  const [metaAccountName, setMetaAccountName] = useState('');
  const [googleToken, setGoogleToken] = useState('');
  const [googleAccountId, setGoogleAccountId] = useState('');
  const [googleAccountName, setGoogleAccountName] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingGoogle, setSavingGoogle] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (tenantId) {
      fetchAdAccounts();
    }
  }, [tenantId]);

  // Auto-polling: fetch campaigns every 30s when on overview tab with accounts connected
  useEffect(() => {
    if (!tenantId || !autoRefresh || tab !== 'overview') return;
    if (adAccounts.length === 0) return;

    // Initial fetch
    fetchCampaigns();

    const interval = setInterval(() => {
      fetchCampaigns();
    }, 30000);

    return () => clearInterval(interval);
  }, [tenantId, autoRefresh, tab, adAccounts.length]);

  const fetchAdAccounts = async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('tenant_id', tenantId);

    if (data) {
      setAdAccounts(data as AdAccount[]);
      const meta = data.find((a: any) => a.platform === 'meta');
      const google = data.find((a: any) => a.platform === 'google');
      if (meta) {
        setMetaToken(meta.access_token);
        setMetaAccountId(meta.account_id);
        setMetaAccountName(meta.account_name || '');
      }
      if (google) {
        setGoogleToken(google.access_token);
        setGoogleAccountId(google.account_id);
        setGoogleAccountName(google.account_name || '');
      }
    }
  };

  const saveAdAccount = async (platform: 'meta' | 'google') => {
    if (!tenantId) return;
    const isMeta = platform === 'meta';
    const setter = isMeta ? setSavingMeta : setSavingGoogle;
    setter(true);

    const token = isMeta ? metaToken : googleToken;
    const accountId = isMeta ? metaAccountId : googleAccountId;
    const accountName = isMeta ? metaAccountName : googleAccountName;

    if (!token || !accountId) {
      toast.error('Preencha o token e o ID da conta');
      setter(false);
      return;
    }

    const existing = adAccounts.find(a => a.platform === platform);

    if (existing) {
      const { error } = await supabase
        .from('ad_accounts')
        .update({ access_token: token, account_id: accountId, account_name: accountName || null })
        .eq('id', existing.id);
      if (error) toast.error(error.message);
      else toast.success(`Conta ${isMeta ? 'Meta' : 'Google'} atualizada!`);
    } else {
      const { error } = await supabase
        .from('ad_accounts')
        .insert({ tenant_id: tenantId, platform, access_token: token, account_id: accountId, account_name: accountName || null });
      if (error) toast.error(error.message);
      else toast.success(`Conta ${isMeta ? 'Meta' : 'Google'} conectada!`);
    }

    setter(false);
    fetchAdAccounts();
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    setErrors([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nao autenticado');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/fetch-ad-campaigns`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            date_from: dateRange.from.toISOString(),
            date_to: dateRange.to.toISOString(),
          }),
        }
      );

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      setCampaigns(result.campaigns || []);
      setSummary(result.summary || null);
      setLastUpdated(new Date());
      if (result.errors?.length) setErrors(result.errors);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao buscar campanhas');
    }
    setLoading(false);
  };

  const hasAccounts = adAccounts.length > 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatPercent = (value: number) =>
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const fadeUp = (delay: number): CSSProperties => ({
    animation: mounted ? `mmFadeUp 0.5s ease ${delay}s both` : 'none',
  });

  /* ── tab config with SVG icons ── */
  const tabItems = [
    { value: 'overview', label: 'Campanhas', icon: <SvgBarChartIcon color={tab === 'overview' ? T.purple : T.muted} /> },
    { value: 'settings', label: 'Conexoes', icon: <SvgSettings color={tab === 'settings' ? T.blue : T.muted} /> },
    { value: 'links', label: 'Links', icon: <SvgLink color={tab === 'links' ? T.blue : T.muted} /> },
    { value: 'coupons', label: 'Cupons', icon: <SvgTicket color={tab === 'coupons' ? T.amber : T.muted} /> },
    { value: 'loyalty', label: 'Fidelidade', icon: <SvgCrown color={tab === 'loyalty' ? T.amber : T.muted} /> },
    { value: 'whatsapp', label: 'Automacao', icon: <SvgMessage color={tab === 'whatsapp' ? T.green : T.muted} /> },
  ];

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text, position: 'relative', minHeight: '100%' }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, right: -150, width: 600, height: 600, background: 'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow1 8s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -150, width: 500, height: 500, background: 'radial-gradient(circle,rgba(236,72,153,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow2 10s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16, ...fadeUp(0) }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
              <span style={{ background: `linear-gradient(135deg,${T.blue},${T.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Marketing</span>
            </h1>
            <p style={{ fontSize: '0.88rem', color: T.muted }}>Campanhas, links e automacoes de marketing</p>
          </div>
          <DateRangeFilter
            preset={preset}
            onPresetChange={setPreset}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12, ...fadeUp(0.05) }}>
            <div style={{ display: 'flex', gap: 4, background: 'rgba(232,236,244,0.5)', borderRadius: 10, padding: 4 }}>
              {tabItems.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: '0.82rem', fontWeight: 600, fontFamily: "'Inter', sans-serif",
                    background: tab === t.value ? T.card : 'transparent',
                    color: tab === t.value ? T.text : T.muted,
                    boxShadow: tab === t.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>


          {/* Hidden TabsList for Radix state management */}
          <TabsList style={{ display: 'none' }}>
            <TabsTrigger value="overview">Campanhas</TabsTrigger>
            <TabsTrigger value="settings">Conexoes</TabsTrigger>
            <TabsTrigger value="links">Links</TabsTrigger>
            <TabsTrigger value="coupons">Cupons</TabsTrigger>
            <TabsTrigger value="loyalty">Fidelidade</TabsTrigger>
            <TabsTrigger value="whatsapp">Automacao</TabsTrigger>
          </TabsList>

          {/* CONNECTIONS TAB */}
          <TabsContent value="settings">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, ...fadeUp(0.1) }}>
              {/* Meta Ads Card */}
              <div
                style={{ ...cardBase }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
              >
                {/* Colored top gradient */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.cyan})` }} />
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill={T.blue}>
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: T.text }}>Meta Ads</div>
                      <div style={{ fontSize: '0.78rem', color: T.muted }}>Facebook & Instagram</div>
                    </div>
                    {adAccounts.find(a => a.platform === 'meta') && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: T.green, background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 20 }}>Conectado</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.muted, marginBottom: 6 }}>Nome da Conta (opcional)</label>
                      <input
                        value={metaAccountName} onChange={e => setMetaAccountName(e.target.value)}
                        placeholder="Ex: Minha Loja - Meta"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.muted, marginBottom: 6 }}>Access Token</label>
                      <input
                        type="password" value={metaToken} onChange={e => setMetaToken(e.target.value)}
                        placeholder="Cole seu token de acesso do Meta"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.muted, marginBottom: 6 }}>ID da Conta de Anuncios</label>
                      <input
                        value={metaAccountId} onChange={e => setMetaAccountId(e.target.value)}
                        placeholder="Ex: act_123456789"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      onClick={() => saveAdAccount('meta')} disabled={savingMeta}
                      style={{
                        width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
                        background: `linear-gradient(135deg,${T.blue},${T.cyan})`, color: T.card,
                        fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Inter', sans-serif",
                        cursor: savingMeta ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s', opacity: savingMeta ? 0.7 : 1,
                      }}
                    >
                      {savingMeta ? <SvgRefresh color={T.card} spinning /> : <SvgPlug color={T.card} />}
                      {adAccounts.find(a => a.platform === 'meta') ? 'Atualizar' : 'Conectar'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Google Ads Card */}
              <div
                style={{ ...cardBase }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; }}
              >
                {/* Colored top gradient */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.red},${T.amber})` }} />
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: T.text }}>Google Ads</div>
                      <div style={{ fontSize: '0.78rem', color: T.muted }}>Search, Display & YouTube</div>
                    </div>
                    {adAccounts.find(a => a.platform === 'google') && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 600, color: T.green, background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 20 }}>Conectado</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.muted, marginBottom: 6 }}>Nome da Conta (opcional)</label>
                      <input
                        value={googleAccountName} onChange={e => setGoogleAccountName(e.target.value)}
                        placeholder="Ex: Minha Loja - Google"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.muted, marginBottom: 6 }}>Access Token</label>
                      <input
                        type="password" value={googleToken} onChange={e => setGoogleToken(e.target.value)}
                        placeholder="Cole seu token de acesso do Google"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.muted, marginBottom: 6 }}>ID do Cliente (Customer ID)</label>
                      <input
                        value={googleAccountId} onChange={e => setGoogleAccountId(e.target.value)}
                        placeholder="Ex: 123-456-7890"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                    <button
                      onClick={() => saveAdAccount('google')} disabled={savingGoogle}
                      style={{
                        width: '100%', padding: '10px 0', borderRadius: 8, border: 'none',
                        background: `linear-gradient(135deg,${T.red},${T.amber})`, color: T.card,
                        fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Inter', sans-serif",
                        cursor: savingGoogle ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s', opacity: savingGoogle ? 0.7 : 1,
                      }}
                    >
                      {savingGoogle ? <SvgRefresh color={T.card} spinning /> : <SvgPlug color={T.card} />}
                      {adAccounts.find(a => a.platform === 'google') ? 'Atualizar' : 'Conectar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div style={fadeUp(0.1)}>
              <CampanhasTab />
            </div>
          </TabsContent>
          {/* TRACKING LINKS TAB */}
          <TabsContent value="links">
            <div style={fadeUp(0.1)}>
              <TrackingLinksTab tenantId={tenantId} />
            </div>
          </TabsContent>

          {/* COUPONS TAB */}
          <TabsContent value="coupons">
            <div style={fadeUp(0.1)}>
              <CouponsTab tenantId={tenantId} />
            </div>
          </TabsContent>

          {/* LOYALTY TAB */}
          <TabsContent value="loyalty">
            <div style={fadeUp(0.1)}>
              <LoyaltyTab tenantId={tenantId} />
            </div>
          </TabsContent>

          {/* WHATSAPP AUTOMATION TAB */}
          <TabsContent value="whatsapp">
            <div style={fadeUp(0.1)}>
              <WhatsAppAutomationTab tenantId={tenantId} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Marketing;
