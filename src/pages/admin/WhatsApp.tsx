import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ConversationList, { Conversation } from '@/components/admin/whatsapp/ConversationList';
import ChatWindow from '@/components/admin/whatsapp/ChatWindow';

interface WaInstance {
  id: string;
  instance_name: string | null;
  instance_token: string | null;
  phone_number: string | null;
  is_connected: boolean | null;
  auto_send_confirmation: boolean | null;
  auto_send_preparing: boolean | null;
  auto_send_delivery: boolean | null;
  auto_send_completed: boolean | null;
}

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
const styleId = 'mm-wa-anim';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const s = document.createElement('style');
  s.id = styleId;
  s.textContent = `
@keyframes mmFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes mmGlow1{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,30px)}}
@keyframes mmGlow2{0%,100%{transform:translate(0,0)}50%{transform:translate(20px,-20px)}}
@keyframes mmSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;
  document.head.appendChild(s);
}

/* ── SVG Icons (Lucide-style) ── */
const SvgMessageCircle = ({ color = T.green, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z"/></svg>
);
const SvgSettings = ({ color = T.purple, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);
const SvgWifi = ({ color = T.green, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>
);
const SvgWifiOff = ({ color = T.muted, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M2 2l20 20"/><path d="M10.14 5.67A15 15 0 0 1 22 8.82"/><path d="M5 12.859a10 10 0 0 1 5.17-2.69"/><path d="M2 8.82a15 15 0 0 1 2.79-1.64"/><path d="M14.33 10.61a10 10 0 0 1 4.67 2.25"/></svg>
);
const SvgRefresh = ({ color = T.blue, size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);
const SvgQrCode = ({ color = T.purple, size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
);
const SvgCheck = ({ color = T.green, size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
);
const SvgPhone = ({ color = T.muted, size = 12 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
);
const SvgSend = ({ color = T.blue, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
);
const SvgVolume = ({ color = T.blue, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
);
const SvgVolumeX = ({ color = T.muted, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>
);
const SvgMessageSquare = ({ color = T.muted, size = 40 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const SvgLoader = ({ color = T.blue, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'mmSpin 1s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
const SvgBell = ({ color = T.amber, size = 16 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
);
const SvgPackage = ({ color = T.blue, size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
);
const SvgTruck = ({ color = T.cyan, size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
);
const SvgCheckCircle = ({ color = T.green, size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
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

/* ── Setup Form ── */
const SetupForm = ({ tenantId, onComplete }: { tenantId: string; onComplete: () => void }) => {
  const [name, setName] = useState('');
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !token.trim()) {
      toast({ title: 'Preencha nome e token da instancia', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('whatsapp_instances').insert({
      tenant_id: tenantId,
      instance_name: name.trim(),
      instance_token: token.trim(),
      is_connected: false,
    });
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Instancia configurada!' });
    onComplete();
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: `1px solid ${T.border}`,
    fontSize: '0.875rem',
    fontFamily: "'Inter', sans-serif",
    color: T.text,
    outline: 'none',
    transition: 'border-color 0.2s',
    background: T.card,
    boxSizing: 'border-box' as const,
  };

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Nome da Instancia (UaZapi)</label>
        <input
          style={inputStyle}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="ex: minha-instancia"
          onFocus={e => e.currentTarget.style.borderColor = T.blue}
          onBlur={e => e.currentTarget.style.borderColor = T.border}
        />
      </div>
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Token da Instancia</label>
        <input
          style={inputStyle}
          value={token}
          onChange={e => setToken(e.target.value)}
          placeholder="Token de acesso UaZapi"
          type="password"
          onFocus={e => e.currentTarget.style.borderColor = T.blue}
          onBlur={e => e.currentTarget.style.borderColor = T.border}
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          padding: '12px 20px',
          borderRadius: 10,
          border: 'none',
          background: `linear-gradient(135deg, ${T.green}, ${T.blue})`,
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.875rem',
          fontFamily: "'Inter', sans-serif",
          cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'opacity 0.2s',
        }}
      >
        {saving ? <SvgLoader color="#fff" size={16} /> : <SvgCheck color="#fff" size={16} />}
        Salvar e Configurar
      </button>
    </div>
  );
};

const WhatsApp = () => {
  const { tenantId } = useAuth();
  const [instance, setInstance] = useState<WaInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<string>('chat');

  // Chat state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [pinnedPhones, setPinnedPhones] = useState<Set<string>>(new Set());
  const [labelMap, setLabelMap] = useState<Record<string, string>>({});
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fadeUp = (delay: number): CSSProperties => ({
    animation: mounted ? `mmFadeUp 0.5s ease ${delay}s both` : 'none',
  });

  const fetchInstance = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    setInstance(data as WaInstance | null);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { fetchInstance(); }, [fetchInstance]);

  // Load conversations
  const fetchConversations = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('contact_phone, contact_name, content, direction, created_at, is_read')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (!data) return;

    const convMap = new Map<string, Conversation>();
    for (const msg of data) {
      if (!convMap.has(msg.contact_phone)) {
        convMap.set(msg.contact_phone, {
          contact_phone: msg.contact_phone,
          contact_name: msg.contact_name,
          last_message: msg.content,
          last_direction: msg.direction,
          last_message_at: msg.created_at,
          unread_count: 0,
        });
      }
      if (msg.direction === 'incoming' && !msg.is_read) {
        const conv = convMap.get(msg.contact_phone)!;
        conv.unread_count++;
      }
      if (msg.contact_name && !convMap.get(msg.contact_phone)!.contact_name) {
        convMap.get(msg.contact_phone)!.contact_name = msg.contact_name;
      }
    }

    const sorted = Array.from(convMap.values()).sort(
      (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
    );
    setConversations(sorted.map(cv => ({ ...cv, is_pinned: pinnedPhones.has(cv.contact_phone), label: labelMap[cv.contact_phone] || null })));
  }, [tenantId]);

  useEffect(() => {
    if (tab === 'chat') fetchConversations();
  }, [tab, fetchConversations]);

  // Realtime for new messages
  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase
      .channel('wa-conversations')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'whatsapp_messages',
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tenantId, fetchConversations]);

  // Sound for new messages
  const playMessageSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 600; osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  }, [soundEnabled]);

  useEffect(() => {
    if (!tenantId) return;
    const channel = supabase.channel('wa-new-msg-sound')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, (payload: any) => {
        if (payload.new?.direction === 'incoming' && payload.new?.tenant_id === tenantId) playMessageSound();
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, playMessageSound]);

  const togglePin = (phone: string) => {
    setPinnedPhones(prev => { const n = new Set(prev); if (n.has(phone)) n.delete(phone); else n.add(phone); return n; });
  };

  const setLabel = (phone: string, label: string | null) => {
    setLabelMap(prev => { const n = { ...prev }; if (label) n[phone] = label; else delete n[phone]; return n; });
  };

  const startNewChat = () => {
    const phone = newChatPhone.replace(/\D/g, '');
    if (phone.length < 10) { toast({ title: 'Numero invalido', variant: 'destructive' }); return; }
    const formatted = phone.startsWith('55') ? phone : '55' + phone;
    setSelectedPhone(formatted); setSelectedName(null); setShowNewChat(false); setNewChatPhone('');
  };

  const selectConversation = (phone: string) => {
    setSelectedPhone(phone);
    const conv = conversations.find(c => c.contact_phone === phone);
    setSelectedName(conv?.contact_name || null);
  };

  const getQrCode = async () => {
    if (!instance?.instance_name || !instance?.instance_token) return;
    setQrLoading(true);
    setQrCode(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('whatsapp-send', {
        body: { action: 'getQrCode', tenant_id: tenantId },
      });
      if (fnErr) throw fnErr;
      if (data.qrcode || data.base64 || data.qr) {
        setQrCode(data.qrcode || data.base64 || data.qr);
      } else if (data.connected || data.status === 'CONNECTED') {
        toast({ title: 'WhatsApp ja esta conectado!' });
        await supabase.from('whatsapp_instances').update({ is_connected: true }).eq('id', instance?.id);
        fetchInstance();
      } else {
        toast({ title: 'Nao foi possivel gerar QR Code', description: JSON.stringify(data), variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Erro ao buscar QR Code', description: err.message, variant: 'destructive' });
    }
    setQrLoading(false);
  };

  const checkStatus = async () => {
    if (!instance?.instance_name || !instance?.instance_token) return;
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('whatsapp-send', {
        body: { action: 'status', tenant_id: tenantId },
      });
      if (fnErr) throw fnErr;
      const connected = data.connected === true || data.status === 'CONNECTED' || data.state === 'open';
      await supabase.from('whatsapp_instances').update({ is_connected: connected }).eq('id', instance?.id);
      toast({ title: connected ? 'WhatsApp conectado!' : 'WhatsApp desconectado' });
      fetchInstance();
    } catch (err: any) {
      toast({ title: 'Erro ao verificar status', description: err.message, variant: 'destructive' });
    }
  };

  const toggleAutoSend = async (field: string, value: boolean) => {
    if (!instance) return;
    setSaving(true);
    await supabase.from('whatsapp_instances').update({ [field]: value }).eq('id', instance?.id);
    setInstance(prev => prev ? { ...prev, [field]: value } : null);
    setSaving(false);
    toast({ title: 'Configuracao salva!' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
        <SvgLoader color={T.blue} size={32} />
      </div>
    );
  }

  const isConnected = instance?.is_connected === true;
  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0);

  const tabBtnStyle = (active: boolean): CSSProperties => ({
    padding: '8px 18px',
    borderRadius: 10,
    border: 'none',
    background: active ? T.card : 'transparent',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
    color: active ? T.text : T.muted,
    fontWeight: active ? 700 : 500,
    fontSize: '0.82rem',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  });

  const btnOutline: CSSProperties = {
    padding: '8px 14px',
    borderRadius: 10,
    border: `1px solid ${T.border}`,
    background: T.card,
    color: T.text,
    fontWeight: 600,
    fontSize: '0.8rem',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  };

  const btnPrimary: CSSProperties = {
    padding: '8px 14px',
    borderRadius: 10,
    border: 'none',
    background: `linear-gradient(135deg, ${T.green}, ${T.blue})`,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.8rem',
    fontFamily: "'Inter', sans-serif",
    cursor: qrLoading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    opacity: qrLoading ? 0.7 : 1,
    transition: 'all 0.2s',
  };

  const autoMsgItems = [
    { field: 'auto_send_confirmation', label: 'Confirmacao de Pedido', desc: 'Enviada quando o pedido e recebido', value: instance?.auto_send_confirmation, icon: <SvgBell color={T.amber} size={14} />, gradient: `linear-gradient(90deg,${T.amber},transparent)` },
    { field: 'auto_send_preparing', label: 'Em Preparo', desc: 'Enviada quando o pedido comeca a ser preparado', value: instance?.auto_send_preparing, icon: <SvgPackage color={T.blue} size={14} />, gradient: `linear-gradient(90deg,${T.blue},transparent)` },
    { field: 'auto_send_delivery', label: 'Saiu para Entrega', desc: 'Enviada quando o pedido sai para entrega', value: instance?.auto_send_delivery, icon: <SvgTruck color={T.cyan} size={14} />, gradient: `linear-gradient(90deg,${T.cyan},transparent)` },
    { field: 'auto_send_completed', label: 'Pedido Entregue', desc: 'Enviada quando o pedido e finalizado', value: instance?.auto_send_completed, icon: <SvgCheckCircle color={T.green} size={14} />, gradient: `linear-gradient(90deg,${T.green},transparent)` },
  ];

  // Custom toggle component
  const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
    <button
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: 'none',
        background: checked ? T.green : '#E2E8F0',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        opacity: disabled ? 0.5 : 1,
        flexShrink: 0,
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        position: 'absolute',
        top: 3,
        left: checked ? 23 : 3,
        transition: 'left 0.2s',
      }} />
    </button>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text, position: 'relative', minHeight: '100%' }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, right: -150, width: 600, height: 600, background: 'radial-gradient(circle,rgba(16,185,129,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow1 8s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -150, width: 500, height: 500, background: 'radial-gradient(circle,rgba(139,92,246,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow2 10s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>
        {/* ── Header Row: Tabs + Status ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12, ...fadeUp(0.05) }}>
          {/* Tab Buttons */}
          <div style={{ display: 'flex', gap: 4, background: 'rgba(232,236,244,0.4)', padding: 4, borderRadius: 12, border: `1px solid ${T.border}` }}>
            <button style={tabBtnStyle(tab === 'chat')} onClick={() => setTab('chat')}>
              <SvgMessageCircle color={tab === 'chat' ? T.green : T.muted} size={15} />
              Conversas
              {totalUnread > 0 && (
                <span style={{
                  background: T.green,
                  color: '#fff',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 8,
                  minWidth: 16,
                  textAlign: 'center' as const,
                  lineHeight: '16px',
                }}>
                  {totalUnread}
                </span>
              )}
            </button>
            <button style={tabBtnStyle(tab === 'settings')} onClick={() => setTab('settings')}>
              <SvgSettings color={tab === 'settings' ? T.purple : T.muted} size={15} />
              Configuracoes
            </button>
          </div>

          {/* Sound + Connection Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{ padding: 6, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'background 0.2s' }}
              title={soundEnabled ? 'Desativar som' : 'Ativar som'}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,236,244,0.6)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {soundEnabled ? <SvgVolume color={T.blue} size={16} /> : <SvgVolumeX color={T.muted} size={16} />}
            </button>
            {isConnected ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 8,
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: T.green,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                <SvgWifi color={T.green} size={13} /> Conectado
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 8,
                background: 'rgba(136,146,164,0.08)',
                border: `1px solid ${T.border}`,
                color: T.muted,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                <SvgWifiOff color={T.muted} size={13} /> Desconectado
              </div>
            )}
          </div>
        </div>

        {/* ── Chat Tab ── */}
        {tab === 'chat' && (
          <div
            style={{
              ...cardBase,
              borderRadius: 16,
              height: 'calc(100vh - 220px)',
              minHeight: 500,
              display: 'flex',
              ...fadeUp(0.1),
            }}
          >
            {/* top gradient */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.green}, ${T.blue})`, zIndex: 2 }} />

            {/* Conversation List */}
            <div style={{ width: 384, flexShrink: 0, borderRight: `1px solid ${T.border}` }}
              className={selectedPhone ? 'hidden lg:block' : 'block'}
            >
              <ConversationList
                conversations={conversations}
                selectedPhone={selectedPhone}
                onSelect={selectConversation}
                onNewConversation={() => setShowNewChat(true)}
                onTogglePin={togglePin}
                onSetLabel={setLabel}
              />
              {showNewChat && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowNewChat(false)}>
                  <div style={{ ...cardBase, borderRadius: 16, padding: 24, width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
                    {/* top gradient on modal */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.green}, ${T.blue})` }} />
                    <h3 style={{ fontWeight: 800, fontSize: '1rem', color: T.text, marginBottom: 16 }}>Nova Conversa</h3>
                    <input
                      value={newChatPhone}
                      onChange={e => setNewChatPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      onKeyDown={e => e.key === 'Enter' && startNewChat()}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: `1px solid ${T.border}`,
                        fontSize: '0.875rem',
                        fontFamily: "'Inter', sans-serif",
                        color: T.text,
                        outline: 'none',
                        marginBottom: 16,
                        boxSizing: 'border-box' as const,
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = T.blue}
                      onBlur={e => e.currentTarget.style.borderColor = T.border}
                    />
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => setShowNewChat(false)}
                        style={{ ...btnOutline, flex: 1, justifyContent: 'center' }}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={startNewChat}
                        style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}
                      >
                        Iniciar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Window or Empty State */}
            <div style={{ flex: 1 }}
              className={selectedPhone ? 'block' : 'hidden lg:block'}
            >
              {selectedPhone ? (
                <ChatWindow
                  contactPhone={selectedPhone}
                  contactName={selectedName}
                  tenantId={tenantId!}
                  tenantSlug="meu-restaurante"
                  instanceName={instance?.instance_name}
                  instanceToken={instance?.instance_token}
                  onBack={() => setSelectedPhone(null)}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', background: T.bg }}>
                  <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(136,146,164,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <SvgMessageSquare color={T.muted} size={36} />
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: T.text, marginBottom: 4 }}>Menu Maestro Chat</p>
                  <p style={{ fontSize: '0.82rem', color: T.muted }}>Selecione uma conversa para comecar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Settings Tab ── */}
        {tab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Setup card (no instance) */}
            {!instance && (
              <div
                style={{
                  ...cardBase,
                  borderRadius: 16,
                  padding: '40px 24px',
                  borderStyle: 'dashed',
                  borderColor: 'rgba(245,158,11,0.3)',
                  background: 'rgba(245,158,11,0.03)',
                  ...fadeUp(0.1),
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.amber}, ${T.green})` }} />
                <div style={{ textAlign: 'center' as const, marginBottom: 28 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(245,158,11,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <SvgMessageCircle color={T.amber} size={22} />
                  </div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 800, color: T.text, marginBottom: 4 }}>Configure o WhatsApp</p>
                  <p style={{ fontSize: '0.82rem', color: T.muted }}>Insira os dados da sua instancia UaZapi para ativar o chat</p>
                </div>
                <SetupForm tenantId={tenantId!} onComplete={fetchInstance} />
              </div>
            )}

            {/* Connection Card */}
            {instance && (
              <div
                style={{ ...cardBase, borderRadius: 16, padding: 0, ...fadeUp(0.1) }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.green}, ${T.blue})` }} />
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <SvgWifi color={T.green} size={18} />
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: T.text }}>Conexao</span>
                  </div>
                </div>
                <div style={{ padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: 14,
                        background: isConnected ? 'rgba(16,185,129,0.1)' : 'rgba(136,146,164,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        {isConnected ? <SvgWifi color={T.green} size={22} /> : <SvgWifiOff color={T.muted} size={22} />}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '1.05rem', color: T.text, margin: 0 }}>{isConnected ? 'Conectado' : 'Desconectado'}</p>
                        {instance?.phone_number && (
                          <p style={{ fontSize: '0.78rem', color: T.muted, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2, margin: 0 }}>
                            <SvgPhone color={T.muted} size={12} /> {instance?.phone_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={btnOutline} onClick={checkStatus}>
                        <SvgRefresh color={T.blue} size={14} /> Verificar
                      </button>
                      {!isConnected && (
                        <button style={btnPrimary} onClick={getQrCode} disabled={qrLoading}>
                          {qrLoading ? <SvgLoader color="#fff" size={14} /> : <SvgQrCode color="#fff" size={14} />}
                          Gerar QR Code
                        </button>
                      )}
                    </div>
                  </div>

                  {qrCode && !isConnected && (
                    <div style={{
                      marginTop: 24,
                      display: 'flex',
                      flexDirection: 'column' as const,
                      alignItems: 'center',
                      gap: 16,
                      padding: 28,
                      background: T.bg,
                      borderRadius: 14,
                      border: `1px solid ${T.border}`,
                    }}>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: T.text, margin: 0 }}>Escaneie o QR Code com seu WhatsApp</p>
                      <div style={{ padding: 16, background: T.card, borderRadius: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                        <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code" style={{ width: 256, height: 256, display: 'block' }} />
                      </div>
                      <div style={{ textAlign: 'center' as const }}>
                        <p style={{ fontSize: '0.72rem', color: T.muted, lineHeight: 1.8, margin: 0 }}>1. Abra o WhatsApp no celular</p>
                        <p style={{ fontSize: '0.72rem', color: T.muted, lineHeight: 1.8, margin: 0 }}>2. Toque em Configuracoes &rarr; Aparelhos conectados</p>
                        <p style={{ fontSize: '0.72rem', color: T.muted, lineHeight: 1.8, margin: 0 }}>3. Toque em Conectar aparelho e escaneie o codigo</p>
                      </div>
                      <button style={btnOutline} onClick={checkStatus}>
                        <SvgCheck color={T.green} size={14} /> Ja escaneei
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Auto Messages Card */}
            {instance && (
              <div
                style={{ ...cardBase, borderRadius: 16, padding: 0, ...fadeUp(0.2) }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${T.blue}, ${T.purple})` }} />
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <SvgSend color={T.blue} size={18} />
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: T.text }}>Mensagens Automaticas</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: T.muted, margin: 0 }}>Envie mensagens automaticas no WhatsApp quando o status do pedido mudar</p>
                </div>
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                  {autoMsgItems.map(item => (
                    <div
                      key={item.field}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: T.bg,
                        border: `1px solid ${T.border}`,
                        position: 'relative' as const,
                        overflow: 'hidden' as const,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.08)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; }}
                    >
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: item.gradient }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: T.card, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {item.icon}
                        </div>
                        <div>
                          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text, margin: 0 }}>{item.label}</p>
                          <p style={{ fontSize: '0.7rem', color: T.muted, marginTop: 1, margin: 0 }}>{item.desc}</p>
                        </div>
                      </div>
                      <Toggle
                        checked={item.value ?? false}
                        onChange={(v) => toggleAutoSend(item.field, v)}
                        disabled={saving || !isConnected}
                      />
                    </div>
                  ))}
                  {!isConnected && (
                    <p style={{ fontSize: '0.72rem', color: T.amber, textAlign: 'center' as const, marginTop: 4 }}>Conecte o WhatsApp para ativar as mensagens automaticas</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsApp;
