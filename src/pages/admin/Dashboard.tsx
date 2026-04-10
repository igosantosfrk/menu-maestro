import { useAuth } from '@/contexts/AuthContext';
import DateRangeFilter from '@/components/admin/DateRangeFilter';
import { useDateRange } from '@/hooks/useDateRange';
import { useDashboardData } from '@/hooks/useDashboardData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useEffect, useState, type CSSProperties } from 'react';

/* ── helpers ── */
const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
const fmtPct = (v: number) => `${v.toFixed(1).replace('.', ',')}%`;

/* ── design tokens (inline) ── */
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

/* ── keyframes injected once ── */
const styleId = 'mm-dash-anim';
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
const SvgDollar = ({ color = '#10B981' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);
const SvgClipboard = ({ color = '#3B82F6' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
);
const SvgBarChart = ({ color = '#8B5CF6' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
);
const SvgRevenue = ({ color = '#F59E0B' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
);
const SvgTrending = ({ color = '#EC4899' }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);
const SvgChartLine = ({ color = '#EC4899' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
);
const SvgFunnel = ({ color = '#8B5CF6' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
const SvgTrophy = ({ color = '#F59E0B' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 010-5C6 4 6 9 6 9zM18 9h1.5a2.5 2.5 0 000-5C18 4 18 9 18 9z"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>
);
const SvgCampaign = ({ color = '#3B82F6' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
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

const FUNNEL_COLORS = [T.pink, T.blue, T.green, T.amber, T.purple, T.cyan];

const Dashboard = () => {
  const { profile } = useAuth();
  const { preset, setPreset, dateRange, customRange, setCustomRange } = useDateRange('today');
  const { kpis, weeklySales, funnel, topCustomers, campaignSales, adSales, loading } = useDashboardData(profile?.tenant_id, dateRange);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const userName = profile?.full_name?.split(' ')[0] || 'Admin';

  const fadeUp = (delay: number): CSSProperties => ({
    animation: mounted ? `mmFadeUp 0.5s ease ${delay}s both` : 'none',
  });

  /* metric cards config */
  const metricCards = [
    { label: 'Investimento', value: fmt(kpis.investment), icon: <SvgDollar />, iconBg: `rgba(16,185,129,0.1)`, gradient: `linear-gradient(90deg,${T.green},transparent)` },
    { label: 'Pedidos', value: kpis.orders.toString(), icon: <SvgClipboard />, iconBg: `rgba(59,130,246,0.1)`, gradient: `linear-gradient(90deg,${T.blue},transparent)` },
    { label: 'Custo/Pedido', value: fmt(kpis.costPerOrder), icon: <SvgBarChart />, iconBg: `rgba(139,92,246,0.08)`, gradient: `linear-gradient(90deg,${T.purple},transparent)` },
    { label: 'Faturamento', value: fmt(kpis.revenue), icon: <SvgRevenue />, iconBg: `rgba(245,158,11,0.1)`, gradient: `linear-gradient(90deg,${T.amber},transparent)` },
    { label: 'Ticket Medio', value: fmt(kpis.avgTicket), icon: <SvgTrending />, iconBg: `rgba(236,72,153,0.08)`, gradient: `linear-gradient(90deg,${T.pink},transparent)` },
  ];

  const statusCards = [
    { label: 'ROI', value: fmtPct(kpis.roi), color: T.amber },
    { label: 'Em Preparo', value: kpis.preparing.toString(), color: T.cyan },
    { label: 'Em Entrega', value: kpis.outForDelivery.toString(), color: T.blue },
    { label: 'Finalizados', value: kpis.completed.toString(), color: T.green },
    { label: 'Cancelados', value: kpis.cancelled.toString(), color: T.red },
  ];

  const campaignChartData = campaignSales.slice(0, 8).map(c => ({
    name: c.campaign.length > 20 ? c.campaign.slice(0, 18) + '...' : c.campaign,
    fullName: c.campaign,
    receita: c.revenue,
    pedidos: c.orders,
    fonte: c.source,
  }));

  const maxFunnel = funnel[0]?.sessions || 1;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text, position: 'relative', minHeight: '100%' }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, right: -150, width: 600, height: 600, background: 'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow1 8s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -150, width: 500, height: 500, background: 'radial-gradient(circle,rgba(236,72,153,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow2 10s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
              Ola, <span style={{ background: `linear-gradient(135deg,${T.pink},${T.amber})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{userName}</span>
            </h1>
            <p style={{ fontSize: '0.88rem', color: T.muted }}>Painel de performance do seu restaurante</p>
          </div>
          <DateRangeFilter
            preset={preset}
            onPresetChange={setPreset}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
          />
        </div>

        {/* ── Metric Cards (5) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
          {metricCards.map((c, i) => (
            <div
              key={c.label}
              style={{
                ...cardBase,
                padding: '20px 18px',
                ...fadeUp(0.05 + i * 0.05),
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
            >
              {/* top gradient border */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: c.gradient }} />
              {/* bottom subtle line */}
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

        {/* ── Status Cards (5) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          {statusCards.map((c, i) => (
            <div
              key={c.label}
              style={{
                ...cardBase,
                padding: '18px 16px',
                ...fadeUp(0.3 + i * 0.05),
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.06)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 1.2, color: T.muted, fontWeight: 600 }}>{c.label}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: -0.5, color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* ── Charts Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Weekly Sales */}
          <div style={{ ...cardBase, borderRadius: 16, padding: 24, minHeight: 280, ...fadeUp(0.55) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.15),transparent)' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SvgChartLine /> Vendas da Semana
            </div>
            <div style={{ fontSize: '0.75rem', color: T.muted, marginBottom: 20 }}>Faturamento diario dos ultimos 7 dias</div>
            {weeklySales.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={weeklySales} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} opacity={0.5} />
                  <XAxis dataKey="day" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    labelStyle={{ color: T.text, fontWeight: 600 }}
                    formatter={(value: number, name: string) => [
                      name === 'receita' ? `R$ ${value.toFixed(2)}` : value,
                      name === 'receita' ? 'Receita' : 'Pedidos'
                    ]}
                  />
                  <Bar dataKey="pedidos" fill={T.blue} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="receita" fill={T.pink} radius={[6, 6, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: '0.85rem' }}>
                {loading ? 'Carregando...' : 'Sem dados'}
              </div>
            )}
          </div>

          {/* Funnel */}
          <div style={{ ...cardBase, borderRadius: 16, padding: 24, minHeight: 280, ...fadeUp(0.6) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.15),transparent)' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SvgFunnel /> Funil do Cardapio
            </div>
            <div style={{ fontSize: '0.75rem', color: T.muted, marginBottom: 20 }}>Sessoes unicas de visualizacao</div>
            {funnel.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {funnel.map((step, i) => {
                  const pct = (step.sessions / maxFunnel) * 100;
                  const dropoff = i > 0 ? (((funnel[i - 1].sessions - step.sessions) / funnel[i - 1].sessions) * 100) : 0;
                  return (
                    <div key={step.step}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span style={{ color: T.muted }}>{step.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700 }}>{step.sessions}</span>
                          {i > 0 && dropoff > 0 && (
                            <span style={{ fontSize: '0.7rem', color: T.red }}>-{dropoff.toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                      <div style={{ height: 10, background: 'rgba(0,0,0,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, width: `${pct}%`, background: FUNNEL_COLORS[i % FUNNEL_COLORS.length], transition: 'width 0.7s ease-out' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.muted, fontSize: '0.85rem', textAlign: 'center' as const, padding: '40px 0' }}>
                {loading ? 'Carregando...' : 'Sem visualizacoes no periodo'}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Top Customers */}
          <div style={{ ...cardBase, borderRadius: 16, padding: 24, ...fadeUp(0.65) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(236,72,153,0.15),transparent)' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SvgTrophy /> Ranking de Clientes
            </div>
            <div style={{ fontSize: '0.75rem', color: T.muted, marginBottom: 20 }}>Top clientes por faturamento</div>
            {topCustomers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {topCustomers.map((c, i) => (
                  <div key={c.phone} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', borderRadius: 8, transition: 'background 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.02)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                  >
                    <span style={{ width: 28, textAlign: 'center' as const, fontSize: i < 3 ? '1rem' : '0.75rem', fontWeight: 700, color: i < 3 ? [T.amber, T.muted, T.amber][i] : T.muted, flexShrink: 0 }}>
                      {i < 3 ? ['1', '2', '3'][i] + 'o' : `${i + 1}o`}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{c.name}</p>
                      <p style={{ fontSize: '0.72rem', color: T.muted }}>{c.orders} pedido{c.orders > 1 ? 's' : ''}</p>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: T.green, flexShrink: 0 }}>
                      R$ {c.total.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center' as const, padding: '40px 0', color: T.muted, fontSize: '0.85rem' }}>
                {loading ? 'Carregando...' : 'Sem clientes no periodo'}
              </div>
            )}
          </div>

          {/* Campaign Sales */}
          <div style={{ ...cardBase, borderRadius: 16, padding: 24, ...fadeUp(0.7) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(59,130,246,0.15),transparent)' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SvgCampaign /> Vendas por Campanha
            </div>
            <div style={{ fontSize: '0.75rem', color: T.muted, marginBottom: 20 }}>Performance de campanhas de marketing</div>
            {campaignChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={campaignChartData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} opacity={0.3} horizontal={false} />
                  <XAxis type="number" tick={{ fill: T.muted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: T.muted, fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                    formatter={(value: number, name: string) => [
                      name === 'receita' ? `R$ ${value.toFixed(2)}` : value,
                      name === 'receita' ? 'Receita' : 'Pedidos'
                    ]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                  />
                  <Bar dataKey="receita" fill={T.blue} radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center' as const, padding: '40px 0', color: T.muted, fontSize: '0.85rem' }}>
                {loading ? 'Carregando...' : 'Sem dados de campanha'}
              </div>
            )}
          </div>
        </div>

        {/* ── Ad Sales Table ── */}
        {adSales.length > 0 && (
          <div style={{ ...cardBase, borderRadius: 16, padding: 24, ...fadeUp(0.75) }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(139,92,246,0.15),transparent)' }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <SvgTrending color={T.purple} /> Vendas por Anuncio
            </div>
            <div style={{ fontSize: '0.75rem', color: T.muted, marginBottom: 20 }}>Links de anuncio com melhor performance</div>
            <div style={{ overflowX: 'auto' as const }}>
              <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' as const }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Fonte', 'Campanha', 'Views', 'Pedidos', 'Receita', 'Link'].map((h, hi) => (
                      <th key={h} style={{ textAlign: hi >= 2 && hi <= 4 ? 'right' as const : hi === 5 ? 'center' as const : 'left' as const, padding: '10px 8px', color: T.muted, fontWeight: 600, fontSize: '0.68rem', textTransform: 'uppercase' as const, letterSpacing: 1.2 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adSales.map((ad, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid rgba(232,236,244,0.5)` }}>
                      <td style={{ padding: '10px 8px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(59,130,246,0.08)', color: T.blue }}>{ad.source || '-'}</span>
                      </td>
                      <td style={{ padding: '10px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ad.campaign || '-'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' as const, color: T.muted }}>{ad.views}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' as const, fontWeight: 600 }}>{ad.orders}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' as const, fontWeight: 700, color: T.green }}>R$ {ad.revenue.toFixed(2).replace('.', ',')}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' as const }}>
                        {ad.adLink ? (
                          <a href={ad.adLink} target="_blank" rel="noopener noreferrer" style={{ color: T.blue, textDecoration: 'none' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                        ) : (
                          <span style={{ color: T.muted }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
