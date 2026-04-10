import { useState, useEffect, useRef, type CSSProperties } from 'react';

/* ── design tokens ── */
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

const PROXY = 'http://89.116.225.95:3500';

const PERIODS = [
  { key: '1d', label: 'Hoje' },
  { key: '7d', label: '7d' },
  { key: '14d', label: '14d' },
  { key: '30d', label: '30d' },
  { key: '90d', label: '90d' },
  { key: 'max', label: 'Max' },
] as const;

type Period = typeof PERIODS[number]['key'];

const CHART_COLORS = [
  'linear-gradient(90deg, #3B82F6, #06B6D4)',
  'linear-gradient(90deg, #8B5CF6, #EC4899)',
  'linear-gradient(90deg, #10B981, #34D399)',
  'linear-gradient(90deg, #F59E0B, #FBBF24)',
  'linear-gradient(90deg, #EF4444, #F87171)',
  'linear-gradient(90deg, #06B6D4, #67E8F9)',
  'linear-gradient(90deg, #EC4899, #F9A8D4)',
  'linear-gradient(90deg, #6366F1, #818CF8)',
];

const SOLID_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#6366F1'];

/* ── SVG Icons ── */
const SvgDollar = ({ color = T.green }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);
const SvgMessage = ({ color = T.blue }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
);
const SvgChart = ({ color = T.purple }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
);
const SvgEye = ({ color = T.pink }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const SvgRefresh = ({ color = T.muted, spinning = false }: { color?: string; spinning?: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={spinning ? { animation: 'spin 1s linear infinite' } : undefined}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
);
const SvgSettings = ({ color = T.muted }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
);
const SvgWarning = ({ color = T.amber }: { color?: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);
const SvgPlug = ({ color = T.muted }: { color?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 01-12 0V8z"/></svg>
);

interface CampaignData {
  name: string;
  status: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  conversas?: number;
  cpm?: number;
  [key: string]: any;
}

interface MetricsResponse {
  totals: {
    spend: number;
    impressions: number;
    reach: number;
    clicks: number;
    conversas?: number;
    [key: string]: any;
  };
  campaigns: CampaignData[];
  period: string;
}

interface ConfigResponse {
  access_token?: string;
  account_id?: string;
}

const cardBase: CSSProperties = {
  background: T.card,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s',
};

const hoverCard = {
  onMouseEnter: (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = 'translateY(-2px)';
    el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
  },
  onMouseLeave: (e: React.MouseEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.transform = 'translateY(0)';
    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
  },
};

const CampanhasTab = () => {
  const [period, setPeriod] = useState<Period>('7d');
  const [data, setData] = useState<MetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);
  const [configToken, setConfigToken] = useState('');
  const [configAccountId, setConfigAccountId] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [mounted, setMounted] = useState(false);
  const cacheRef = useRef<Record<string, MetricsResponse>>({});

  useEffect(() => { setMounted(true); }, []);

  // Load config on mount
  useEffect(() => {
    fetchConfig();
  }, []);

  // Fetch metrics when period changes and config is available
  useEffect(() => {
    if (hasConfig) {
      fetchMetrics(period);
    }
  }, [period, hasConfig]);

  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const res = await fetch(`${PROXY}/api/campanhas/config`);
      if (!res.ok) throw new Error('Erro ao buscar config');
      const cfg: ConfigResponse = await res.json();
      if (cfg.access_token && cfg.account_id) {
        setHasConfig(true);
        setConfigToken(cfg.access_token);
        setConfigAccountId(cfg.account_id);
      } else {
        setHasConfig(false);
        setShowConfig(true);
      }
    } catch {
      setHasConfig(false);
      setShowConfig(true);
    }
    setConfigLoading(false);
  };

  const saveConfig = async () => {
    if (!configToken.trim() || !configAccountId.trim()) return;
    setSavingConfig(true);
    try {
      const res = await fetch(`${PROXY}/api/campanhas/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: configToken.trim(), account_id: configAccountId.trim() }),
      });
      if (!res.ok) throw new Error('Erro ao salvar config');
      setHasConfig(true);
      setShowConfig(false);
      setTokenExpired(false);
      setError(null);
      cacheRef.current = {};
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar configuracao');
    }
    setSavingConfig(false);
  };

  const fetchMetrics = async (p: Period, force = false) => {
    if (!force && cacheRef.current[p]) {
      setData(cacheRef.current[p]);
      return;
    }
    setLoading(true);
    setError(null);
    setTokenExpired(false);
    try {
      const res = await fetch(`${PROXY}/api/campanhas/metricas?period=${p}`);
      if (!res.ok) {
        const body = await res.text();
        if (res.status === 401 || body.toLowerCase().includes('token') || body.toLowerCase().includes('expired') || body.toLowerCase().includes('oauth')) {
          setTokenExpired(true);
          throw new Error('Token expirado ou invalido');
        }
        throw new Error(body || `Erro ${res.status}`);
      }
      const result: MetricsResponse = await res.json();
      cacheRef.current[p] = result;
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Erro ao buscar metricas');
    }
    setLoading(false);
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatNumber = (v: number) =>
    new Intl.NumberFormat('pt-BR').format(v);

  const fadeUp = (delay: number): CSSProperties => ({
    animation: mounted ? `mmFadeUp 0.5s ease ${delay}s both` : 'none',
  });

  // Config loading state
  if (configLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
        <SvgRefresh color={T.blue} spinning />
        <span style={{ marginLeft: 12, fontSize: '0.9rem', color: T.muted }}>Carregando configuracao...</span>
      </div>
    );
  }

  // No config state
  if (!hasConfig && !showConfig) {
    return (
      <div style={{ ...cardBase, border: `2px dashed ${T.border}`, ...fadeUp(0.1) }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(59,130,246,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <SvgPlug color={T.blue} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: T.text, marginBottom: 8 }}>Conecte sua conta Meta</h3>
          <p style={{ fontSize: '0.88rem', color: T.muted, maxWidth: 420, marginBottom: 24 }}>
            Configure seu Access Token e Account ID para visualizar as metricas das suas campanhas.
          </p>
          <button
            onClick={() => setShowConfig(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: `linear-gradient(135deg,${T.blue},${T.purple})`, color: T.card,
              fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Inter', sans-serif",
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            <SvgSettings color={T.card} />
            Configurar Conta Meta
          </button>
        </div>
      </div>
    );
  }

  // Config modal
  const configModal = showConfig ? (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={() => hasConfig && setShowConfig(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />
      <div style={{ ...cardBase, position: 'relative', width: '100%', maxWidth: 460, padding: 32, zIndex: 1, animation: 'mmFadeUp 0.3s ease both' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.cyan})` }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill={T.blue}>
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>Configurar Meta Ads</div>
            <div style={{ fontSize: '0.78rem', color: T.muted }}>Facebook & Instagram Ads</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.muted, marginBottom: 6 }}>Access Token</label>
            <input
              type="password"
              value={configToken}
              onChange={e => setConfigToken(e.target.value)}
              placeholder="Cole seu token de acesso do Meta"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: T.muted, marginBottom: 6 }}>Account ID</label>
            <input
              value={configAccountId}
              onChange={e => setConfigAccountId(e.target.value)}
              placeholder="Ex: act_123456789"
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: `1px solid ${T.border}`, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: T.text, background: T.bg, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ fontSize: '0.82rem', color: T.red, margin: 0 }}>{error}</p>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {hasConfig && (
              <button
                onClick={() => setShowConfig(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${T.border}`,
                  background: T.card, color: T.text,
                  fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Inter', sans-serif",
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                Cancelar
              </button>
            )}
            <button
              onClick={saveConfig}
              disabled={savingConfig || !configToken.trim() || !configAccountId.trim()}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: `linear-gradient(135deg,${T.blue},${T.cyan})`, color: T.card,
                fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Inter', sans-serif",
                cursor: savingConfig ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', opacity: (savingConfig || !configToken.trim() || !configAccountId.trim()) ? 0.6 : 1,
              }}
            >
              {savingConfig && <SvgRefresh color={T.card} spinning />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Compute derived metrics
  const totals = data?.totals;
  const campaigns = data?.campaigns || [];
  const totalSpend = totals?.spend ?? 0;
  const totalConversas = totals?.conversas ?? campaigns.reduce((s, c) => s + (c.conversas || 0), 0);
  const costPerConversa = totalConversas > 0 ? totalSpend / totalConversas : 0;
  const totalReach = totals?.reach ?? 0;

  // For bar chart - top campaigns by spend
  const sortedBySpend = [...campaigns].sort((a, b) => b.spend - a.spend).slice(0, 8);
  const maxSpend = sortedBySpend.length > 0 ? Math.max(...sortedBySpend.map(c => c.spend)) : 1;

  // For donut chart
  const donutCampaigns = [...campaigns].sort((a, b) => b.spend - a.spend);
  const donutTotal = donutCampaigns.reduce((s, c) => s + c.spend, 0);

  // Build conic-gradient
  let conicStops = '';
  let cumPercent = 0;
  donutCampaigns.forEach((c, i) => {
    const pct = donutTotal > 0 ? (c.spend / donutTotal) * 100 : 0;
    const color = SOLID_COLORS[i % SOLID_COLORS.length];
    conicStops += `${color} ${cumPercent}% ${cumPercent + pct}%${i < donutCampaigns.length - 1 ? ', ' : ''}`;
    cumPercent += pct;
  });
  if (!conicStops) conicStops = `${T.border} 0% 100%`;

  return (
    <>
      {configModal}

      {/* HEADER ROW */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12, ...fadeUp(0) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: T.text, margin: 0 }}>Campanhas</h2>
          {hasConfig && !tokenExpired && (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: T.green, background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 20 }}>
              Meta Conectada
            </span>
          )}
          {tokenExpired && (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: T.amber, background: 'rgba(245,158,11,0.1)', padding: '3px 10px', borderRadius: 20, cursor: 'pointer' }} onClick={() => setShowConfig(true)}>
              Token Expirado
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Period selector */}
          <div style={{ display: 'flex', gap: 2, background: 'rgba(232,236,244,0.5)', borderRadius: 8, padding: 3 }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                style={{
                  padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Inter', sans-serif",
                  background: period === p.key ? T.card : 'transparent',
                  color: period === p.key ? T.text : T.muted,
                  boxShadow: period === p.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Total spend badge */}
          {data && (
            <span style={{
              fontSize: '0.78rem', fontWeight: 700, color: T.green,
              background: 'rgba(16,185,129,0.08)', padding: '5px 12px', borderRadius: 20,
              border: '1px solid rgba(16,185,129,0.15)',
            }}>
              Total: {formatCurrency(totalSpend)}
            </span>
          )}

          {/* Config button */}
          <button
            onClick={() => setShowConfig(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.card, cursor: 'pointer', transition: 'all 0.2s',
            }}
            title="Configurar Meta Ads"
          >
            <SvgSettings color={T.muted} />
          </button>

          {/* Refresh button */}
          <button
            onClick={() => fetchMetrics(period, true)}
            disabled={loading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${T.border}`,
              background: T.card, cursor: loading ? 'wait' : 'pointer',
              fontSize: '0.8rem', fontWeight: 600, fontFamily: "'Inter', sans-serif",
              color: T.text, transition: 'all 0.2s',
            }}
          >
            <SvgRefresh color={T.muted} spinning={loading} />
            Atualizar
          </button>
        </div>
      </div>

      {/* TOKEN EXPIRED ERROR */}
      {tokenExpired && (
        <div style={{
          ...cardBase, border: `1px solid rgba(245,158,11,0.3)`,
          background: 'rgba(245,158,11,0.04)', marginBottom: 20, ...fadeUp(0.05),
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 24px' }}>
            <SvgWarning color={T.amber} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: T.text, margin: 0 }}>Token Expirado</p>
              <p style={{ fontSize: '0.82rem', color: T.muted, margin: '4px 0 0' }}>Seu token de acesso Meta expirou. Atualize para continuar vendo as metricas.</p>
            </div>
            <button
              onClick={() => setShowConfig(true)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: `linear-gradient(135deg,${T.amber},${T.amber})`, color: T.card,
                fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Inter', sans-serif",
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Atualizar Token
            </button>
          </div>
        </div>
      )}

      {/* GENERIC ERROR */}
      {error && !tokenExpired && (
        <div style={{
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 10, padding: 16, marginBottom: 20, ...fadeUp(0.05),
        }}>
          <p style={{ fontSize: '0.82rem', color: T.red, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && !data && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
          <SvgRefresh color={T.blue} spinning />
          <span style={{ marginLeft: 12, fontSize: '0.9rem', color: T.muted }}>Carregando metricas...</span>
        </div>
      )}

      {/* MAIN CONTENT */}
      {data && (
        <>
          {/* FOUR METRIC CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Gasto Total', value: formatCurrency(totalSpend), icon: <SvgDollar color={T.green} />, iconBg: 'rgba(16,185,129,0.08)', gradient: `linear-gradient(90deg,${T.green},transparent)`, accent: T.green },
              { label: 'Conversas Iniciadas', value: formatNumber(totalConversas), icon: <SvgMessage color={T.blue} />, iconBg: 'rgba(59,130,246,0.08)', gradient: `linear-gradient(90deg,${T.blue},transparent)`, accent: T.blue },
              { label: 'Custo/Conversa', value: formatCurrency(costPerConversa), icon: <SvgChart color={T.purple} />, iconBg: 'rgba(139,92,246,0.08)', gradient: `linear-gradient(90deg,${T.purple},transparent)`, accent: T.purple },
              { label: 'Alcance Total', value: formatNumber(totalReach), icon: <SvgEye color={T.pink} />, iconBg: 'rgba(236,72,153,0.08)', gradient: `linear-gradient(90deg,${T.pink},transparent)`, accent: T.pink },
            ].map((c, i) => (
              <div key={i} style={{ ...cardBase, ...fadeUp(0.1 + i * 0.05) }} {...hoverCard}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.gradient }} />
                <div style={{ padding: '20px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: T.muted, fontWeight: 500, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.3 }}>{c.label}</p>
                      <p style={{ fontSize: '1.35rem', fontWeight: 800, color: T.text, margin: 0 }}>{c.value}</p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.icon}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TWO CHART CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            {/* LEFT: Gasto por Campanha - horizontal bar chart */}
            <div style={{ ...cardBase, ...fadeUp(0.3) }} {...hoverCard}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.cyan})` }} />
              <div style={{ padding: '20px 22px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: T.text, marginBottom: 4 }}>Gasto por Campanha</h3>
                <p style={{ fontSize: '0.78rem', color: T.muted, marginBottom: 18 }}>Top campanhas por investimento</p>

                {sortedBySpend.length === 0 ? (
                  <p style={{ textAlign: 'center', color: T.muted, fontSize: '0.85rem', padding: '20px 0' }}>Sem dados</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {sortedBySpend.map((c, i) => {
                      const pct = maxSpend > 0 ? (c.spend / maxSpend) * 100 : 0;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: T.text, maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {c.name}
                            </span>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: T.text }}>
                              {formatCurrency(c.spend)}
                            </span>
                          </div>
                          <div style={{ width: '100%', height: 8, borderRadius: 4, background: T.bg, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.max(pct, 2)}%`, height: '100%', borderRadius: 4,
                              background: CHART_COLORS[i % CHART_COLORS.length],
                              transition: 'width 0.5s ease',
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: Distribuicao de Gastos - donut chart */}
            <div style={{ ...cardBase, ...fadeUp(0.35) }} {...hoverCard}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.purple},${T.pink})` }} />
              <div style={{ padding: '20px 22px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: T.text, marginBottom: 4 }}>Distribuicao de Gastos</h3>
                <p style={{ fontSize: '0.78rem', color: T.muted, marginBottom: 18 }}>Proporcao de investimento por campanha</p>

                {donutCampaigns.length === 0 ? (
                  <p style={{ textAlign: 'center', color: T.muted, fontSize: '0.85rem', padding: '20px 0' }}>Sem dados</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    {/* Donut */}
                    <div style={{ position: 'relative', width: 160, height: 160 }}>
                      <div style={{
                        width: '100%', height: '100%', borderRadius: '50%',
                        background: `conic-gradient(${conicStops})`,
                      }} />
                      <div style={{
                        position: 'absolute', inset: '25%', borderRadius: '50%',
                        background: T.card, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ fontSize: '0.68rem', color: T.muted, fontWeight: 500 }}>Total</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: T.text }}>{formatCurrency(donutTotal)}</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                      {donutCampaigns.map((c, i) => {
                        const pct = donutTotal > 0 ? ((c.spend / donutTotal) * 100).toFixed(1) : '0.0';
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: 3, background: SOLID_COLORS[i % SOLID_COLORS.length], flexShrink: 0 }} />
                            <span style={{ flex: 1, color: T.text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                            <span style={{ color: T.muted, fontWeight: 600 }}>{formatCurrency(c.spend)}</span>
                            <span style={{ color: T.muted, fontWeight: 500, minWidth: 42, textAlign: 'right' }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CAMPAIGNS TABLE */}
          <div style={{ ...cardBase, ...fadeUp(0.4) }} {...hoverCard}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.purple},${T.pink})` }} />
            <div style={{ padding: '20px 22px 8px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: T.text, marginBottom: 4 }}>Detalhamento de Campanhas</h3>
              <p style={{ fontSize: '0.82rem', color: T.muted, marginBottom: 16 }}>Todas as campanhas do periodo selecionado</p>
            </div>
            <div style={{ padding: '0 22px 20px', overflowX: 'auto' }}>
              {campaigns.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '32px 0', color: T.muted, fontSize: '0.88rem' }}>Nenhuma campanha encontrada.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                      {['Campanha', 'Status', 'Gasto', 'Alcance', 'Impressoes', 'Cliques', 'Conversas', 'CPM'].map((h, i) => (
                        <th key={h} style={{
                          padding: '10px 8px', textAlign: i >= 2 ? 'right' : 'left',
                          fontWeight: 600, color: T.muted, fontSize: '0.72rem',
                          textTransform: 'uppercase', letterSpacing: 0.5,
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c, idx) => {
                      const isActive = c.status?.toUpperCase() === 'ACTIVE';
                      const cpm = c.cpm ?? (c.impressions > 0 ? (c.spend / c.impressions) * 1000 : 0);
                      return (
                        <tr
                          key={idx}
                          style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.2s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(59,130,246,0.02)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <td style={{ padding: '12px 8px', fontWeight: 600, color: T.text, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.name}
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                              color: isActive ? T.green : T.amber,
                              background: isActive ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                              border: `1px solid ${isActive ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                            }}>
                              {isActive ? 'Ativo' : 'Pausado'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 700, color: T.text }}>{formatCurrency(c.spend)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: T.text }}>{formatNumber(c.reach)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: T.text }}>{formatNumber(c.impressions)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: T.text }}>{formatNumber(c.clicks)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: T.text }}>{formatNumber(c.conversas || 0)}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: T.text }}>{formatCurrency(cpm)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CampanhasTab;
