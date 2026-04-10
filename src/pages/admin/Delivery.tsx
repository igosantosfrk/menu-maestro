import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const T = {
  bg: '#F8F9FC', card: '#FFFFFF', border: '#E8ECF4', text: '#1A1D26',
  muted: '#8892A4', blue: '#3B82F6', purple: '#8B5CF6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', pink: '#EC4899', cyan: '#06B6D4',
};

const styleId = 'mm-delivery-anim';
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

const SvgPlus = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const SvgPencil = ({ color = T.muted }: { color?: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const SvgTrash = ({ color = T.red }: { color?: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const SvgMapPin = ({ color = T.blue }: { color?: string }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
const SvgUser = ({ color = T.purple }: { color?: string }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const SvgTruck = ({ color = T.cyan }: { color?: string }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
const SvgClock = ({ color = T.muted }: { color?: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const SvgPhone = ({ color = T.muted }: { color?: string }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
const SvgCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;

const cardBase: CSSProperties = { background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s' };

interface Zone { id: string; tenant_id: string; name: string; fee: number; min_order: number; estimated_time_min: number; neighborhoods: string[]; is_active: boolean; }
interface Driver { id: string; tenant_id: string; name: string; phone: string; vehicle: string; is_available: boolean; current_orders: number; max_orders: number; }
interface ActiveDelivery { id: string; order_number: number; customer_name: string; delivery_address: string; delivery_neighborhood: string; driver_id: string | null; status: string; created_at: string; }

type Tab = 'zones' | 'drivers' | 'active';

const tabConfig: { key: Tab; label: string; color: string; icon: (p: { color?: string }) => JSX.Element }[] = [
  { key: 'zones', label: 'Zonas de Entrega', color: T.blue, icon: SvgMapPin },
  { key: 'drivers', label: 'Entregadores', color: T.purple, icon: SvgUser },
  { key: 'active', label: 'Entregas em Andamento', color: T.cyan, icon: SvgTruck },
];

const Delivery = () => {
  const { tenantId } = useAuth();
  const [tab, setTab] = useState<Tab>('zones');
  const [mounted, setMounted] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeDeliveries, setActiveDeliveries] = useState<ActiveDelivery[]>([]);
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [zoneForm, setZoneForm] = useState({ name: '', fee: '', min_order: '', estimated_time_min: '30', neighborhoods: '', is_active: true });
  const [driverForm, setDriverForm] = useState({ name: '', phone: '', vehicle: 'moto', max_orders: '3' });

  useEffect(() => { setMounted(true); }, []);
  const fadeUp = (d: number): CSSProperties => ({ animation: mounted ? `mmFadeUp 0.5s ease ${d}s both` : 'none' });

  const fetchZones = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('delivery_zones').select('*').eq('tenant_id', tenantId).order('name');
    setZones((data || []) as Zone[]);
  }, [tenantId]);

  const fetchDrivers = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('delivery_drivers').select('*').eq('tenant_id', tenantId).order('name');
    setDrivers((data || []) as Driver[]);
  }, [tenantId]);

  const fetchActive = useCallback(async () => {
    if (!tenantId) return;
    const { data } = await supabase.from('orders').select('id, order_number, customer_name, delivery_address, delivery_neighborhood, driver_id, status, created_at')
      .eq('tenant_id', tenantId).eq('status', 'out_for_delivery').order('created_at', { ascending: false });
    setActiveDeliveries((data || []) as ActiveDelivery[]);
  }, [tenantId]);

  useEffect(() => { fetchZones(); fetchDrivers(); fetchActive(); }, [fetchZones, fetchDrivers, fetchActive]);

  useEffect(() => {
    if (!tenantId) return;
    const ch = supabase.channel('delivery-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` }, () => fetchActive()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tenantId, fetchActive]);

  // Zone CRUD
  const openCreateZone = () => { setEditingZone(null); setZoneForm({ name: '', fee: '', min_order: '', estimated_time_min: '30', neighborhoods: '', is_active: true }); setZoneDialogOpen(true); };
  const openEditZone = (z: Zone) => { setEditingZone(z); setZoneForm({ name: z.name, fee: String(z.fee), min_order: String(z.min_order || 0), estimated_time_min: String(z.estimated_time_min || 30), neighborhoods: (z.neighborhoods || []).join(', '), is_active: z.is_active }); setZoneDialogOpen(true); };
  const handleSaveZone = async () => {
    if (!tenantId || !zoneForm.name.trim()) { toast({ title: 'Preencha o nome da zona', variant: 'destructive' }); return; }
    const payload = { tenant_id: tenantId, name: zoneForm.name.trim(), fee: parseFloat(zoneForm.fee) || 0, min_order: parseFloat(zoneForm.min_order) || 0, estimated_time_min: parseInt(zoneForm.estimated_time_min) || 30, neighborhoods: zoneForm.neighborhoods.split(',').map(n => n.trim()).filter(Boolean), is_active: zoneForm.is_active };
    if (editingZone) { await supabase.from('delivery_zones').update(payload).eq('id', editingZone.id); toast({ title: 'Zona atualizada!' }); }
    else { await supabase.from('delivery_zones').insert(payload); toast({ title: 'Zona criada!' }); }
    setZoneDialogOpen(false); fetchZones();
  };
  const handleDeleteZone = async (id: string) => { await supabase.from('delivery_zones').delete().eq('id', id); toast({ title: 'Zona excluida!' }); fetchZones(); };
  const toggleZoneActive = async (z: Zone) => { await supabase.from('delivery_zones').update({ is_active: !z.is_active }).eq('id', z.id); fetchZones(); };

  // Driver CRUD
  const openCreateDriver = () => { setEditingDriver(null); setDriverForm({ name: '', phone: '', vehicle: 'moto', max_orders: '3' }); setDriverDialogOpen(true); };
  const openEditDriver = (d: Driver) => { setEditingDriver(d); setDriverForm({ name: d.name, phone: d.phone, vehicle: d.vehicle || 'moto', max_orders: String(d.max_orders || 3) }); setDriverDialogOpen(true); };
  const handleSaveDriver = async () => {
    if (!tenantId || !driverForm.name.trim() || !driverForm.phone.trim()) { toast({ title: 'Preencha nome e telefone', variant: 'destructive' }); return; }
    const payload = { tenant_id: tenantId, name: driverForm.name.trim(), phone: driverForm.phone.trim(), vehicle: driverForm.vehicle, max_orders: parseInt(driverForm.max_orders) || 3 };
    if (editingDriver) { await supabase.from('delivery_drivers').update(payload).eq('id', editingDriver.id); toast({ title: 'Entregador atualizado!' }); }
    else { await supabase.from('delivery_drivers').insert({ ...payload, is_available: true, current_orders: 0 }); toast({ title: 'Entregador adicionado!' }); }
    setDriverDialogOpen(false); fetchDrivers();
  };
  const handleDeleteDriver = async (id: string) => { await supabase.from('delivery_drivers').delete().eq('id', id); toast({ title: 'Entregador excluido!' }); fetchDrivers(); };
  const toggleDriverAvailable = async (d: Driver) => { await supabase.from('delivery_drivers').update({ is_available: !d.is_available }).eq('id', d.id); fetchDrivers(); };

  // Assign driver & mark delivered
  const assignDriver = async (orderId: string, driverId: string) => {
    await supabase.from('orders').update({ driver_id: driverId }).eq('id', orderId);
    const driver = drivers.find(d => d.id === driverId);
    if (driver) await supabase.from('delivery_drivers').update({ current_orders: (driver.current_orders || 0) + 1 }).eq('id', driverId);
    toast({ title: 'Entregador atribuido!' }); fetchActive(); fetchDrivers();
  };
  const markDelivered = async (order: ActiveDelivery) => {
    await supabase.from('orders').update({ status: 'completed', delivered_at: new Date().toISOString() }).eq('id', order.id);
    if (order.driver_id) {
      const driver = drivers.find(d => d.id === order.driver_id);
      if (driver && driver.current_orders > 0) await supabase.from('delivery_drivers').update({ current_orders: driver.current_orders - 1 }).eq('id', order.driver_id);
    }
    toast({ title: 'Entrega finalizada!' }); fetchActive(); fetchDrivers();
  };

  const getTimeAgo = (d: string) => { const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000); return m < 60 ? `${m}min` : `${Math.floor(m / 60)}h${m % 60}min`; };
  const vehicleLabels: Record<string, string> = { moto: 'Moto', bicicleta: 'Bicicleta', carro: 'Carro' };

  const inputStyle: CSSProperties = { width: '100%', padding: '10px 14px', fontSize: '0.9rem', color: T.text, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, outline: 'none', fontFamily: 'inherit' };
  const labelStyle: CSSProperties = { fontSize: '0.78rem', fontWeight: 600, color: T.text, marginBottom: 6, display: 'block' };
  const btnPrimary: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${T.blue}, ${T.purple})`, color: '#fff', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(59,130,246,0.18)' };
  const btnIcon: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer' };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text, position: 'relative', minHeight: '100%' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, right: -150, width: 600, height: 600, background: 'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow1 8s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16, ...fadeUp(0.05) }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
              <span style={{ background: `linear-gradient(135deg,${T.blue},${T.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Entregas</span>
            </h1>
            <p style={{ fontSize: '0.88rem', color: T.muted }}>Gerencie zonas, entregadores e entregas ativas</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {tab === 'zones' && <button style={btnPrimary} onClick={openCreateZone}><SvgPlus /> Nova Zona</button>}
            {tab === 'drivers' && <button style={btnPrimary} onClick={openCreateDriver}><SvgPlus /> Novo Entregador</button>}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, ...fadeUp(0.1) }}>
          {tabConfig.map(t => {
            const active = tab === t.key;
            const Icon = t.icon;
            const count = t.key === 'zones' ? zones.length : t.key === 'drivers' ? drivers.length : activeDeliveries.length;
            return (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 10,
                border: `1px solid ${active ? t.color + '40' : T.border}`, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                background: active ? t.color + '12' : T.card, color: active ? t.color : T.muted,
                boxShadow: active ? `0 2px 8px ${t.color}18` : '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.2s',
              }}>
                <Icon color={active ? t.color : T.muted} />
                {t.label}
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 22, height: 20, padding: '0 6px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, background: active ? t.color + '20' : 'rgba(0,0,0,0.04)', color: active ? t.color : T.muted }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* Zones Tab */}
        {tab === 'zones' && (
          <div style={{ ...fadeUp(0.15) }}>
            {zones.length === 0 ? (
              <div style={{ ...cardBase, padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.cyan},transparent)` }} />
                <SvgMapPin color={T.muted} />
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, margin: '16px 0 6px' }}>Nenhuma zona cadastrada</p>
                <p style={{ fontSize: '0.85rem', color: T.muted }}>Crie zonas de entrega com taxas diferentes por regiao</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {zones.map((z, i) => (
                  <div key={z.id} style={{ ...cardBase, ...fadeUp(0.15 + i * 0.05) }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: z.is_active ? `linear-gradient(90deg,${T.blue},${T.cyan})` : T.border }} />
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{z.name}</h3>
                          <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 0' }}>{(z.neighborhoods || []).join(', ') || 'Sem bairros definidos'}</p>
                        </div>
                        <Switch checked={z.is_active} onCheckedChange={() => toggleZoneActive(z)} />
                      </div>
                      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                        <div><span style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 600 }}>Taxa</span><p style={{ fontSize: 16, fontWeight: 700, color: T.green, margin: '2px 0 0' }}>R$ {z.fee.toFixed(2)}</p></div>
                        <div><span style={{ fontSize: 11, color: T.muted, textTransform: 'uppercase', fontWeight: 600 }}>Min. pedido</span><p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '2px 0 0' }}>R$ {(z.min_order || 0).toFixed(2)}</p></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><SvgClock /><span style={{ fontSize: 13, color: T.muted }}>{z.estimated_time_min || 30}min</span></div>
                      </div>
                      <div style={{ display: 'flex', gap: 4, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                        <button style={btnIcon} onClick={() => openEditZone(z)}><SvgPencil color={T.blue} /></button>
                        <button style={btnIcon} onClick={() => handleDeleteZone(z.id)}><SvgTrash /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Drivers Tab */}
        {tab === 'drivers' && (
          <div style={{ ...fadeUp(0.15) }}>
            {drivers.length === 0 ? (
              <div style={{ ...cardBase, padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.purple},${T.pink},transparent)` }} />
                <SvgUser color={T.muted} />
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, margin: '16px 0 6px' }}>Nenhum entregador</p>
                <p style={{ fontSize: '0.85rem', color: T.muted }}>Cadastre seus entregadores para atribuir entregas</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {drivers.map((d, i) => {
                  const statusColor = !d.is_available ? T.red : d.current_orders >= d.max_orders ? T.amber : T.green;
                  const statusLabel = !d.is_available ? 'Offline' : d.current_orders >= d.max_orders ? 'Ocupado' : 'Disponivel';
                  return (
                    <div key={d.id} style={{ ...cardBase, ...fadeUp(0.15 + i * 0.05) }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${statusColor},${statusColor}80)` }} />
                      <div style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: `${statusColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                              {d.vehicle === 'moto' ? '🏍️' : d.vehicle === 'bicicleta' ? '🚲' : '🚗'}
                            </div>
                            <div>
                              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{d.name}</h3>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                <SvgPhone />
                                <span style={{ fontSize: 12, color: T.muted }}>{d.phone}</span>
                              </div>
                            </div>
                          </div>
                          <Switch checked={d.is_available} onCheckedChange={() => toggleDriverAvailable(d)} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: statusColor + '15', color: statusColor }}>{statusLabel}</span>
                          <span style={{ fontSize: 12, color: T.muted }}>{vehicleLabels[d.vehicle] || d.vehicle}</span>
                          <span style={{ fontSize: 12, color: T.muted }}>{d.current_orders}/{d.max_orders} entregas</span>
                        </div>
                        <div style={{ display: 'flex', gap: 4, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                          <button style={btnIcon} onClick={() => openEditDriver(d)}><SvgPencil color={T.blue} /></button>
                          <button style={btnIcon} onClick={() => handleDeleteDriver(d.id)}><SvgTrash /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Active Deliveries Tab */}
        {tab === 'active' && (
          <div style={{ ...fadeUp(0.15) }}>
            {activeDeliveries.length === 0 ? (
              <div style={{ ...cardBase, padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.cyan},${T.blue},transparent)` }} />
                <SvgTruck color={T.muted} />
                <p style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, margin: '16px 0 6px' }}>Nenhuma entrega em andamento</p>
                <p style={{ fontSize: '0.85rem', color: T.muted }}>Pedidos em entrega aparecerao aqui em tempo real</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeDeliveries.map((o, i) => {
                  const assignedDriver = o.driver_id ? drivers.find(d => d.id === o.driver_id) : null;
                  const availableDrivers = drivers.filter(d => d.is_available && d.current_orders < d.max_orders);
                  return (
                    <div key={o.id} style={{ ...cardBase, ...fadeUp(0.15 + i * 0.05) }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.cyan},${T.blue})` }} />
                      <div style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: T.blue }}>#{o.order_number}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{o.customer_name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.muted }}>
                            <SvgMapPin color={T.muted} />
                            <span>{o.delivery_address || o.delivery_neighborhood || 'Sem endereco'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.amber, marginTop: 4 }}>
                            <SvgClock color={T.amber} />
                            <span>{getTimeAgo(o.created_at)} em andamento</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {assignedDriver ? (
                            <span style={{ fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 8, background: T.purple + '12', color: T.purple }}>
                              {assignedDriver.name}
                            </span>
                          ) : (
                            <select
                              onChange={e => e.target.value && assignDriver(o.id, e.target.value)}
                              defaultValue=""
                              style={{ ...inputStyle, width: 'auto', minWidth: 160, fontSize: 13, padding: '6px 12px' }}
                            >
                              <option value="" disabled>Atribuir entregador</option>
                              {availableDrivers.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.current_orders}/{d.max_orders})</option>
                              ))}
                            </select>
                          )}
                          <button onClick={() => markDelivered(o)} style={{ ...btnPrimary, background: `linear-gradient(135deg, ${T.green}, #059669)`, boxShadow: '0 2px 8px rgba(16,185,129,0.18)', padding: '8px 16px' }}>
                            <SvgCheck /> Entregue
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingZone ? 'Editar Zona' : 'Nova Zona de Entrega'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={labelStyle}>Nome da Zona *</label><input style={inputStyle} value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Centro, Zona Sul" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><label style={labelStyle}>Taxa de Entrega (R$)</label><input style={inputStyle} type="number" step="0.01" value={zoneForm.fee} onChange={e => setZoneForm(f => ({ ...f, fee: e.target.value }))} placeholder="5.00" /></div>
              <div><label style={labelStyle}>Pedido Minimo (R$)</label><input style={inputStyle} type="number" step="0.01" value={zoneForm.min_order} onChange={e => setZoneForm(f => ({ ...f, min_order: e.target.value }))} placeholder="20.00" /></div>
            </div>
            <div><label style={labelStyle}>Tempo Estimado (min)</label><input style={inputStyle} type="number" value={zoneForm.estimated_time_min} onChange={e => setZoneForm(f => ({ ...f, estimated_time_min: e.target.value }))} placeholder="30" /></div>
            <div><label style={labelStyle}>Bairros (separados por virgula)</label><input style={inputStyle} value={zoneForm.neighborhoods} onChange={e => setZoneForm(f => ({ ...f, neighborhoods: e.target.value }))} placeholder="Centro, Boa Vista, Madalena" /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Switch checked={zoneForm.is_active} onCheckedChange={v => setZoneForm(f => ({ ...f, is_active: v }))} /><span style={{ fontSize: 13 }}>Zona ativa</span></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={() => setZoneDialogOpen(false)} style={{ padding: '9px 16px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancelar</button>
            <button onClick={handleSaveZone} style={btnPrimary}>Salvar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Driver Dialog */}
      <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingDriver ? 'Editar Entregador' : 'Novo Entregador'}</DialogTitle></DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={driverForm.name} onChange={e => setDriverForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do entregador" /></div>
            <div><label style={labelStyle}>Telefone *</label><input style={inputStyle} value={driverForm.phone} onChange={e => setDriverForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Veiculo</label>
                <select style={inputStyle} value={driverForm.vehicle} onChange={e => setDriverForm(f => ({ ...f, vehicle: e.target.value }))}>
                  <option value="moto">Moto</option>
                  <option value="bicicleta">Bicicleta</option>
                  <option value="carro">Carro</option>
                </select>
              </div>
              <div><label style={labelStyle}>Max. Entregas Simultaneas</label><input style={inputStyle} type="number" value={driverForm.max_orders} onChange={e => setDriverForm(f => ({ ...f, max_orders: e.target.value }))} /></div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button onClick={() => setDriverDialogOpen(false)} style={{ padding: '9px 16px', borderRadius: 10, background: T.card, border: `1px solid ${T.border}`, cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancelar</button>
            <button onClick={handleSaveDriver} style={btnPrimary}>Salvar</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Delivery;
