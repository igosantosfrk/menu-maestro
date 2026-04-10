import PrinterSettings from "@/components/admin/PrinterSettings";
import TeamManagement from "@/components/admin/TeamManagement";
import { useState, useEffect, type CSSProperties } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
const styleId = 'mm-settings-anim';
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
const SvgSettings = ({ color = T.purple }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
);
const SvgStore = ({ color = T.blue }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const SvgImage = ({ color = T.pink }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
);
const SvgTruck = ({ color = T.green }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
);
const SvgCreditCard = ({ color = T.amber }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
);
const SvgEye = ({ color = T.muted }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const SvgEyeOff = ({ color = T.muted }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);
const SvgSave = ({ color = '#FFFFFF' }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);
const SvgBell = ({ color = T.purple }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
);
const SvgMail = ({ color = T.muted }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
);
const SvgPhone = ({ color = T.muted }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
);
const SvgMapPin = ({ color = T.muted }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
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

/* ── input style ── */
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '0.875rem',
  fontFamily: "'Inter', sans-serif",
  color: T.text,
  background: T.bg,
  border: `1px solid ${T.border}`,
  borderRadius: 10,
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};

const inputFocusStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = T.blue;
  e.currentTarget.style.boxShadow = `0 0 0 3px rgba(59,130,246,0.1)`;
};
const inputBlurStyle = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = T.border;
  e.currentTarget.style.boxShadow = 'none';
};

const disabledInputStyle: CSSProperties = {
  ...inputStyle,
  background: '#F0F1F5',
  color: T.muted,
  cursor: 'not-allowed',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: T.text,
  marginBottom: 6,
  letterSpacing: 0.2,
};

const hoverCard = (e: React.MouseEvent<HTMLDivElement>) => {
  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
  (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.06)';
};
const unhoverCard = (e: React.MouseEvent<HTMLDivElement>) => {
  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
  (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
};

const AdminSettings = () => {
  const { tenantId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showAsaasKey, setShowAsaasKey] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', phone: '', email: '',
    address: '', city: '', state: '', zip_code: '',
    logo_url: '', banner_url: '', is_open: true,
    delivery_fee: '0', min_order_value: '0', avg_delivery_time_min: '45',
    payment_gateway: 'none', asaas_api_key: '',
    mercadopago_access_token: '', pagseguro_token: '', pagseguro_email: '',
    pagarme_api_key: '',
    stripe_secret_key: '', stripe_publishable_key: '',
    email_notifications_enabled: false, smtp_pass: '', smtp_from_email: '', smtp_from_name: '',
    pix_key: '', pix_key_type: 'cpf', pix_holder_name: '',
  });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!tenantId) return;
    supabase.from('tenants').select('*').eq('id', tenantId).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          phone: data.phone || '',
          email: data.email || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
          is_open: data.is_open ?? true,
          delivery_fee: String(data.delivery_fee || 0),
          min_order_value: String(data.min_order_value || 0),
          avg_delivery_time_min: String(data.avg_delivery_time_min || 45),
          payment_gateway: data.payment_gateway || 'none',
          asaas_api_key: data.asaas_api_key || '',
          mercadopago_access_token: data.mercadopago_access_token || '',
          pagseguro_token: data.pagseguro_token || '',
          pagseguro_email: data.pagseguro_email || '',
          pagarme_api_key: data.pagarme_api_key || '',
          stripe_secret_key: data.stripe_secret_key || '',
          stripe_publishable_key: data.stripe_publishable_key || '',
          email_notifications_enabled: data.email_notifications_enabled ?? false,
          smtp_pass: data.smtp_pass || '',
          pix_key: data.pix_key || '',
          pix_key_type: data.pix_key_type || 'cpf',
          pix_holder_name: data.pix_holder_name || '',
          smtp_from_email: data.smtp_from_email || '',
          smtp_from_name: data.smtp_from_name || '',
        });
      }
    });
  }, [tenantId]);

  const handleSave = async () => {
    if (!tenantId) return;
    setLoading(true);
    const { error } = await supabase.from('tenants').update({
      name: form.name, description: form.description || null,
      phone: form.phone || null, email: form.email || null,
      address: form.address || null, city: form.city || null,
      state: form.state || null, zip_code: form.zip_code || null,
      logo_url: form.logo_url || null, banner_url: form.banner_url || null,
      is_open: form.is_open,
      delivery_fee: parseFloat(form.delivery_fee) || 0,
      min_order_value: parseFloat(form.min_order_value) || 0,
      avg_delivery_time_min: parseInt(form.avg_delivery_time_min) || 45,
      payment_gateway: form.payment_gateway || 'none',
      asaas_api_key: form.asaas_api_key || null,
      mercadopago_access_token: form.mercadopago_access_token || null,
      pagseguro_token: form.pagseguro_token || null,
      pagseguro_email: form.pagseguro_email || null,
      pagarme_api_key: form.pagarme_api_key || null,
      stripe_secret_key: form.stripe_secret_key || null,
      stripe_publishable_key: form.stripe_publishable_key || null,
      email_notifications_enabled: form.email_notifications_enabled,
      smtp_pass: form.smtp_pass || null,
      pix_key: form.pix_key || null,
      pix_key_type: form.pix_key_type || 'cpf',
      pix_holder_name: form.pix_holder_name || null,
      smtp_from_email: form.smtp_from_email || null,
      smtp_from_name: form.smtp_from_name || null,
    }).eq('id', tenantId);
    setLoading(false);
    if (error) { toast({ title: 'Erro', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Configuracoes salvas!' });
  };

  const fadeUp = (delay: number): CSSProperties => ({
    animation: mounted ? `mmFadeUp 0.5s ease ${delay}s both` : 'none',
  });

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text, position: 'relative', minHeight: '100%' }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, right: -150, width: 600, height: 600, background: 'radial-gradient(circle,rgba(139,92,246,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow1 8s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -150, width: 500, height: 500, background: 'radial-gradient(circle,rgba(236,72,153,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow2 10s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0', maxWidth: 780 }}>
        {/* ── Header ── */}
        <div style={{ marginBottom: 28, ...fadeUp(0) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: `rgba(139,92,246,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SvgSettings color={T.purple} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: -0.5, margin: 0 }}>
                <span style={{ background: `linear-gradient(135deg,${T.purple},${T.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Configuracoes</span>
              </h1>
              <p style={{ fontSize: '0.85rem', color: T.muted, margin: 0 }}>Gerencie os dados e preferencias do seu restaurante</p>
            </div>
          </div>
        </div>

        {/* ── Card 1: Dados do Restaurante ── */}
        <div
          style={{ ...cardBase, padding: 0, marginBottom: 20, ...fadeUp(0.1) }}
          onMouseEnter={hoverCard}
          onMouseLeave={unhoverCard}
        >
          {/* top gradient border */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.purple})` }} />

          <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(59,130,246,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SvgStore color={T.blue} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>Dados do Restaurante</div>
              <div style={{ fontSize: '0.78rem', color: T.muted }}>Informacoes basicas do seu estabelecimento</div>
            </div>
          </div>

          <div style={{ padding: '22px 26px 26px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Nome do Restaurante</label>
                <input
                  style={inputStyle}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Slug (URL)</label>
                <input style={disabledInputStyle} value={form.slug} disabled />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Descricao</label>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: 'vertical' } as CSSProperties}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                onFocus={inputFocusStyle as any}
                onBlur={inputBlurStyle as any}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SvgPhone color={T.muted} /> Telefone
                </label>
                <input
                  style={inputStyle}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
              <div>
                <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SvgMail color={T.muted} /> Email
                </label>
                <input
                  style={inputStyle}
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                <SvgMapPin color={T.muted} /> Endereco
              </label>
              <input
                style={inputStyle}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                onFocus={inputFocusStyle}
                onBlur={inputBlurStyle}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Cidade</label>
                <input
                  style={inputStyle}
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Estado</label>
                <input
                  style={inputStyle}
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>CEP</label>
                <input
                  style={inputStyle}
                  value={form.zip_code}
                  onChange={e => setForm({ ...form, zip_code: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 2: Imagens ── */}
        <div
          style={{ ...cardBase, padding: 0, marginBottom: 20, ...fadeUp(0.2) }}
          onMouseEnter={hoverCard}
          onMouseLeave={unhoverCard}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.pink},${T.amber})` }} />

          <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(236,72,153,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SvgImage color={T.pink} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>Imagens</div>
              <div style={{ fontSize: '0.78rem', color: T.muted }}>Logo e banner do seu restaurante</div>
            </div>
          </div>

          <div style={{ padding: '22px 26px 26px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>URL do Logo</label>
                <input
                  style={inputStyle}
                  value={form.logo_url}
                  onChange={e => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://..."
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
                {form.logo_url && (
                  <div style={{ marginTop: 10, width: 56, height: 56, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', background: T.bg }}>
                    <img src={form.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>URL do Banner</label>
                <input
                  style={inputStyle}
                  value={form.banner_url}
                  onChange={e => setForm({ ...form, banner_url: e.target.value })}
                  placeholder="https://..."
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
                {form.banner_url && (
                  <div style={{ marginTop: 10, width: '100%', height: 56, borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden', background: T.bg }}>
                    <img src={form.banner_url} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => (e.currentTarget.style.display = 'none')} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 3: Delivery ── */}
        <div
          style={{ ...cardBase, padding: 0, marginBottom: 20, ...fadeUp(0.3) }}
          onMouseEnter={hoverCard}
          onMouseLeave={unhoverCard}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.green},${T.blue})` }} />

          <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(16,185,129,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SvgTruck color={T.green} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>Delivery</div>
              <div style={{ fontSize: '0.78rem', color: T.muted }}>Configuracoes de entrega e status do restaurante</div>
            </div>
          </div>

          <div style={{ padding: '22px 26px 26px' }}>
            {/* Open/Closed toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderRadius: 10,
              background: form.is_open ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${form.is_open ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`,
              marginBottom: 20,
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: form.is_open ? T.green : T.red,
                  boxShadow: form.is_open ? '0 0 8px rgba(16,185,129,0.4)' : '0 0 8px rgba(239,68,68,0.4)',
                }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: form.is_open ? T.green : T.red }}>
                  Restaurante {form.is_open ? 'Aberto' : 'Fechado'}
                </span>
              </div>
              <button
                onClick={() => setForm({ ...form, is_open: !form.is_open })}
                style={{
                  position: 'relative',
                  width: 48, height: 26, borderRadius: 13,
                  background: form.is_open ? T.green : '#CBD5E1',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.3s',
                  padding: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 3, left: form.is_open ? 24 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.3s',
                }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Taxa de Entrega (R$)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.delivery_fee}
                  onChange={e => setForm({ ...form, delivery_fee: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Pedido Minimo (R$)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.min_order_value}
                  onChange={e => setForm({ ...form, min_order_value: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Tempo Entrega (min)</label>
                <input
                  type="number"
                  style={inputStyle}
                  value={form.avg_delivery_time_min}
                  onChange={e => setForm({ ...form, avg_delivery_time_min: e.target.value })}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Card 4: Pagamentos Online ── */}
        <div
          style={{ ...cardBase, padding: 0, marginBottom: 20, ...fadeUp(0.35) }}
          onMouseEnter={hoverCard}
          onMouseLeave={unhoverCard}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.amber},${T.green})` }} />

          <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `rgba(245,158,11,0.1)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SvgCreditCard color={T.amber} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>Pagamentos Online</div>
              <div style={{ fontSize: '0.78rem', color: T.muted }}>Configure seu gateway de pagamento</div>
            </div>
          </div>

          <div style={{ padding: '22px 26px 26px' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Gateway de Pagamento</label>
              <select
                style={{
                  ...inputStyle,
                  appearance: 'none' as const,
                  backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px',
                  paddingRight: '36px',
                }}
                value={form.payment_gateway}
                onChange={e => setForm({ ...form, payment_gateway: e.target.value })}
              >
                <option value="none">Nenhum (apenas pagamento na entrega)</option>
                <option value="asaas">Asaas (PIX, Cartao, Boleto)</option>
                <option value="mercadopago">Mercado Pago (PIX, Cartao, Boleto)</option>
                <option value="pagseguro">PagSeguro (PIX, Cartao, Boleto)</option>
                <option value="pagarme">Pagar.me (PIX, Cartao, Boleto)</option>
                <option value="stripe">Stripe (Cartao, PIX, Boleto)</option>
              </select>
            </div>

            {form.payment_gateway === 'asaas' && (
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Chave API do Asaas</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAsaasKey ? 'text' : 'password'}
                    style={inputStyle}
                    value={form.asaas_api_key}
                    onChange={e => setForm({ ...form, asaas_api_key: e.target.value })}
                    placeholder="$aact_..."
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAsaasKey(!showAsaasKey)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    }}
                  >
                    {showAsaasKey ? <SvgEyeOff /> : <SvgEye />}
                  </button>
                </div>
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(59,130,246,0.05)', border: `1px solid rgba(59,130,246,0.1)`,
                  fontSize: '0.78rem', color: T.muted,
                }}>
                  <strong style={{ color: T.text }}>URL do Webhook:</strong><br />
                  <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                    https://geznqqpfvsnhlckqlcab.supabase.co/functions/v1/payment-webhook?gateway=asaas
                  </code>
                  <br /><span style={{ fontSize: '0.7rem' }}>Configure esta URL no painel do Asaas em Integracoes &gt; Webhooks</span>
                  <br /><span style={{ fontSize: '0.7rem' }}>Obtenha sua API Key em: Asaas &gt; Minha Conta &gt; Integracoes &gt; API</span>
                </div>
              </div>
            )}

            {form.payment_gateway === 'mercadopago' && (
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>Access Token do Mercado Pago</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAsaasKey ? 'text' : 'password'}
                    style={inputStyle}
                    value={form.mercadopago_access_token}
                    onChange={e => setForm({ ...form, mercadopago_access_token: e.target.value })}
                    placeholder="APP_USR-..."
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAsaasKey(!showAsaasKey)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    }}
                  >
                    {showAsaasKey ? <SvgEyeOff /> : <SvgEye />}
                  </button>
                </div>
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(59,130,246,0.05)', border: `1px solid rgba(59,130,246,0.1)`,
                  fontSize: '0.78rem', color: T.muted,
                }}>
                  <strong style={{ color: T.text }}>URL do Webhook:</strong><br />
                  <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                    https://geznqqpfvsnhlckqlcab.supabase.co/functions/v1/payment-webhook?gateway=mercadopago
                  </code>
                  <br /><span style={{ fontSize: '0.7rem' }}>Obtenha seu Access Token em: Mercado Pago &gt; Seu Negocio &gt; Configuracoes &gt; Credenciais</span>
                </div>
              </div>
            )}

            {form.payment_gateway === 'pagseguro' && (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Token do PagSeguro</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={form.pagseguro_token}
                    onChange={e => setForm({ ...form, pagseguro_token: e.target.value })}
                    placeholder="Token de producao..."
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email do PagSeguro</label>
                  <input
                    style={inputStyle}
                    value={form.pagseguro_email}
                    onChange={e => setForm({ ...form, pagseguro_email: e.target.value })}
                    placeholder="seu@email.com"
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(59,130,246,0.05)', border: `1px solid rgba(59,130,246,0.1)`,
                  fontSize: '0.78rem', color: T.muted,
                }}>
                  <strong style={{ color: T.text }}>URL do Webhook:</strong><br />
                  <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                    https://geznqqpfvsnhlckqlcab.supabase.co/functions/v1/payment-webhook?gateway=pagseguro
                  </code>
                  <br /><span style={{ fontSize: '0.7rem' }}>Obtenha seu Token em: PagSeguro &gt; Vendas &gt; Integracoes &gt; Token de Seguranca</span>
                </div>
              </div>
            )}

            {form.payment_gateway === 'pagarme' && (
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>API Key do Pagar.me</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showAsaasKey ? 'text' : 'password'}
                    style={inputStyle}
                    value={form.pagarme_api_key}
                    onChange={e => setForm({ ...form, pagarme_api_key: e.target.value })}
                    placeholder="sk_..."
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAsaasKey(!showAsaasKey)}
                    style={{
                      position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                    }}
                  >
                    {showAsaasKey ? <SvgEyeOff /> : <SvgEye />}
                  </button>
                </div>
                <div style={{
                  marginTop: 12, padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(59,130,246,0.05)', border: `1px solid rgba(59,130,246,0.1)`,
                  fontSize: '0.78rem', color: T.muted,
                }}>
                  <strong style={{ color: T.text }}>URL do Webhook:</strong><br />
                  <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                    https://geznqqpfvsnhlckqlcab.supabase.co/functions/v1/payment-webhook?gateway=pagarme
                  </code>
                  <br /><span style={{ fontSize: '0.7rem' }}>Obtenha sua API Key em: Pagar.me Dashboard &gt; Configuracoes &gt; Chaves da API</span>
                </div>
              </div>
            )}


            {/* PIX Manual */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: T.text, marginBottom: 4 }}>PIX Manual</div>
              <div style={{ fontSize: '0.78rem', color: T.muted, marginBottom: 16 }}>Aceite PIX sem gateway. O cliente copia sua chave e paga pelo app do banco.</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Tipo de Chave</label>
                  <select style={inputStyle} value={form.pix_key_type} onChange={e => setForm({ ...form, pix_key_type: e.target.value })}>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">Email</option>
                    <option value="phone">Telefone</option>
                    <option value="random">Chave Aleatoria</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Nome do Titular</label>
                  <input style={inputStyle} value={form.pix_holder_name} onChange={e => setForm({ ...form, pix_holder_name: e.target.value })} placeholder="Nome que aparece no PIX" />
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <label style={labelStyle}>Chave PIX</label>
                <input style={inputStyle} value={form.pix_key} onChange={e => setForm({ ...form, pix_key: e.target.value })} placeholder="Sua chave PIX" />
              </div>
            </div>

            {form.payment_gateway === 'stripe' && (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Stripe Secret Key</label>
                  <input
                    type="password"
                    style={inputStyle}
                    value={form.stripe_secret_key}
                    onChange={e => setForm({ ...form, stripe_secret_key: e.target.value })}
                    placeholder="sk_live_..."
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Stripe Publishable Key</label>
                  <input
                    style={inputStyle}
                    value={form.stripe_publishable_key}
                    onChange={e => setForm({ ...form, stripe_publishable_key: e.target.value })}
                    placeholder="pk_live_..."
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(59,130,246,0.05)', border: `1px solid rgba(59,130,246,0.1)`,
                  fontSize: '0.78rem', color: T.muted,
                }}>
                  <strong style={{ color: T.text }}>URL do Webhook:</strong><br />
                  <code style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>
                    https://geznqqpfvsnhlckqlcab.supabase.co/functions/v1/stripe-webhook
                  </code>
                  <br /><span style={{ fontSize: '0.7rem' }}>Obtenha suas chaves em: Stripe Dashboard &gt; Developers &gt; API Keys</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Card 5: Notificacoes por Email ── */}
        <div
          style={{ ...cardBase, padding: 0, marginBottom: 20, ...fadeUp(0.4) }}
          onMouseEnter={hoverCard}
          onMouseLeave={unhoverCard}
        >
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.purple},${T.pink})` }} />

          <div style={{ padding: '22px 26px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SvgBell color={T.purple} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: T.text }}>Notificacoes por Email</div>
              <div style={{ fontSize: '0.78rem', color: T.muted }}>Envie emails automaticos sobre status dos pedidos</div>
            </div>
          </div>

          <div style={{ padding: '22px 26px 26px' }}>
            {/* Enable/Disable toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderRadius: 10,
              background: form.email_notifications_enabled ? 'rgba(139,92,246,0.06)' : 'rgba(0,0,0,0.02)',
              border: `1px solid ${form.email_notifications_enabled ? 'rgba(139,92,246,0.15)' : T.border}`,
              marginBottom: 20,
              transition: 'all 0.3s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: form.email_notifications_enabled ? T.purple : T.muted,
                  boxShadow: form.email_notifications_enabled ? '0 0 8px rgba(139,92,246,0.4)' : 'none',
                }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: form.email_notifications_enabled ? T.purple : T.muted }}>
                  Notificacoes {form.email_notifications_enabled ? 'Ativadas' : 'Desativadas'}
                </span>
              </div>
              <button
                onClick={() => setForm({ ...form, email_notifications_enabled: !form.email_notifications_enabled })}
                style={{
                  position: 'relative',
                  width: 48, height: 26, borderRadius: 13,
                  background: form.email_notifications_enabled ? T.purple : '#CBD5E1',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.3s',
                  padding: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 3, left: form.email_notifications_enabled ? 24 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  transition: 'left 0.3s',
                }} />
              </button>
            </div>

            {form.email_notifications_enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>API Key do Resend</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showResendKey ? 'text' : 'password'}
                      style={inputStyle}
                      value={form.smtp_pass}
                      onChange={e => setForm({ ...form, smtp_pass: e.target.value })}
                      placeholder="re_..."
                      onFocus={inputFocusStyle}
                      onBlur={inputBlurStyle}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResendKey(!showResendKey)}
                      style={{
                        position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                      }}
                    >
                      {showResendKey ? <SvgEyeOff /> : <SvgEye />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Email de Envio</label>
                    <input
                      style={inputStyle}
                      value={form.smtp_from_email}
                      onChange={e => setForm({ ...form, smtp_from_email: e.target.value })}
                      placeholder="noreply@seudominio.com"
                      onFocus={inputFocusStyle}
                      onBlur={inputBlurStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Nome de Envio</label>
                    <input
                      style={inputStyle}
                      value={form.smtp_from_name}
                      onChange={e => setForm({ ...form, smtp_from_name: e.target.value })}
                      placeholder="Meu Restaurante"
                      onFocus={inputFocusStyle}
                      onBlur={inputBlurStyle}
                    />
                  </div>
                </div>
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.1)',
                  fontSize: '0.78rem', color: T.muted,
                }}>
                  Crie uma conta gratuita em <strong style={{ color: T.text }}>resend.com</strong> e cole sua API Key acima. Emails serao enviados automaticamente quando o status do pedido mudar.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Card 6: Printer Settings (existing component) ── */}
        <div style={{ marginBottom: 20, ...fadeUp(0.45) }}>
          <PrinterSettings />
        </div>

        {/* ── Card 7: Team Management ── */}
        <div style={{ ...cardBase, marginBottom: 20, padding: 24, ...fadeUp(0.5) }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.purple},${T.blue},transparent)` }} />
          <TeamManagement tenantId={activeTenantId} />
        </div>

        {/* ── Save Button ── */}
        <div style={{ ...fadeUp(0.5) }}>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '14px 32px',
              fontSize: '0.92rem',
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
              color: '#FFFFFF',
              background: `linear-gradient(135deg, ${T.green}, ${T.blue})`,
              border: 'none',
              borderRadius: 12,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.65 : 1,
              boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
              transition: 'all 0.3s',
              letterSpacing: 0.3,
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.35)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,185,129,0.25)'; }}
          >
            <SvgSave />
            {loading ? 'Salvando...' : 'Salvar Configuracoes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
