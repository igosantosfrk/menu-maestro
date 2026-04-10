import { exportCSV, formatDateBR, formatNum } from "@/utils/exportCSV";
import { useAutoPrint } from "@/hooks/useAutoPrint";
import { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DndContext, DragOverlay, useDroppable, useDraggable, closestCenter, type DragStartEvent, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import DateRangeFilter from '@/components/admin/DateRangeFilter';
import { useDateRange } from '@/hooks/useDateRange';
import { Order, OrderStatus, statusConfig, kanbanColumns } from '@/components/admin/orders/types';
import OrderCard from '@/components/admin/orders/OrderCard';
import OrderDetailSheet from '@/components/admin/orders/OrderDetailSheet';
import CustomerDetailSheet from '@/components/admin/orders/CustomerDetailSheet';
import OrderListView from '@/components/admin/orders/OrderListView';
import { toast } from '@/hooks/use-toast';

type ViewMode = 'kanban' | 'list';

/* ── design tokens (same as Dashboard) ── */
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
const styleId = 'mm-orders-anim';
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
const SvgShoppingBag = ({ color = T.muted }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
);
const SvgLayoutGrid = ({ color = T.text }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);
const SvgList = ({ color = T.text }: { color?: string }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
);
const SvgVolume2 = ({ color = T.blue }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
);
const SvgVolumeX = ({ color = T.muted }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
);
const SvgSparkles = ({ color = T.cyan }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/></svg>
);
const SvgChefHat = ({ color = T.amber }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 011.05-1.54 5 5 0 017.08 0A5.11 5.11 0 0116.59 6 4 4 0 0118 13.87V21H6z"/><line x1="6" y1="17" x2="18" y2="17"/></svg>
);
const SvgTruck = ({ color = T.blue }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
);
const SvgCheckCircle = ({ color = T.green }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
);
const SvgXCircle = ({ color = T.red }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
);
const SvgClock = ({ color = T.muted }: { color?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);
const SvgPackage = ({ color = T.muted }: { color?: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
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

/* ── status tab config ── */
const statusTabConfig: Record<string, { label: string; color: string; icon: (props: { color?: string }) => JSX.Element }> = {
  all: { label: 'Todos', color: T.purple, icon: SvgShoppingBag },
  new: { label: 'Novos', color: T.cyan, icon: SvgSparkles },
  preparing: { label: 'Em Preparo', color: T.amber, icon: SvgChefHat },
  out_for_delivery: { label: 'Em Entrega', color: T.blue, icon: SvgTruck },
  completed: { label: 'Finalizados', color: T.green, icon: SvgCheckCircle },
  cancelled: { label: 'Cancelados', color: T.red, icon: SvgXCircle },
};

/* ── column icon map ── */
const columnIconMap: Record<string, (props: { color?: string }) => JSX.Element> = {
  new: SvgSparkles,
  preparing: SvgChefHat,
  out_for_delivery: SvgTruck,
  completed: SvgCheckCircle,
  cancelled: SvgXCircle,
};

/* ── column color map ── */
const columnColorMap: Record<string, string> = {
  new: T.cyan,
  preparing: T.amber,
  out_for_delivery: T.blue,
  completed: T.green,
  cancelled: T.red,
};


/* ── Droppable Column Component ── */
const KanbanColumn = ({ status, colColor, config, IconComp, columnOrders, updateStatus, openDetail }: {
  status: string; colColor: string; config: any; IconComp: any;
  columnOrders: Order[]; updateStatus: any; openDetail: any;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: status });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
        borderRadius: 12, border: `1px solid ${colColor}25`,
        background: colColor + '0A',
      }}>
        <IconComp color={colColor} />
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: colColor }}>{config.label}</span>
        <span style={{
          marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: 22, height: 20, padding: '0 6px', borderRadius: 6,
          fontSize: '0.68rem', fontWeight: 700,
          background: colColor + '15', color: colColor,
        }}>
          {columnOrders.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          minHeight: 100, borderRadius: 12, padding: 6,
          background: isOver ? colColor + '0A' : 'transparent',
          outline: isOver ? `2px dashed ${colColor}40` : 'none',
          transition: 'background 0.2s, outline 0.2s',
        }}
      >
        {columnOrders.map((order) => (
          <DraggableCard key={order.id} order={order} updateStatus={updateStatus} openDetail={openDetail} />
        ))}
        {columnOrders.length === 0 && !isOver && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 96, fontSize: '0.75rem', color: '#8892A4',
            border: '1px dashed #E8ECF4', borderRadius: 12,
          }}>
            Nenhum pedido
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Draggable Card Component ── */
const DraggableCard = ({ order, updateStatus, openDetail }: { order: Order; updateStatus: any; openDetail: any }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: order.id });
  const style: CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    borderRadius: 14,
    zIndex: isDragging ? 999 : 'auto',
    transition: isDragging ? 'opacity 0.15s ease' : 'opacity 0.15s ease',
  };
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <OrderCard order={order} index={0} onStatusChange={updateStatus} onOpenDetail={openDetail} />
    </div>
  );
};

const SvgDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const Orders = () => {
  const { tenantId } = useAuth();
  useAutoPrint(tenantId);
  const { preset, setPreset, dateRange, customRange, setCustomRange } = useDateRange('today');
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customerOrder, setCustomerOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);
  const orderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);
  const dragCooldownRef = useRef(false);

  useEffect(() => { setMounted(true); }, []);

  const fadeUp = (delay: number): CSSProperties => ({
    animation: mounted ? `mmFadeUp 0.5s ease ${delay}s both` : 'none',
  });

  const playNewOrderSound = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new AudioContext();
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };
      playTone(880, 0, 0.15);
      playTone(1100, 0.15, 0.15);
      playTone(1320, 0.3, 0.25);
    } catch (e) { console.warn("Audio not available:", e); }
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    if (!tenantId || dragCooldownRef.current) return;
    try {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });
      const fetched = (data || []) as Order[];
      setOrders(fetched);

      if (initialLoadRef.current) {
        orderIdsRef.current = new Set(fetched.map(o => o.id));
        initialLoadRef.current = false;
      } else {
        const newOrders = fetched.filter(o => o.status === 'new' && !orderIdsRef.current.has(o.id));
        if (newOrders.length > 0) {
          playNewOrderSound();
          toast({ title: 'Novo pedido!', description: 'Pedido #' + newOrders[newOrders.length - 1].order_number });
        }
        orderIdsRef.current = new Set(fetched.map(o => o.id));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, [tenantId, dateRange.from, dateRange.to, playNewOrderSound]);

  useEffect(() => {
    fetchOrders();
    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `tenant_id=eq.${tenantId}`,
      }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tenantId, dateRange.from, dateRange.to, fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') updateData.delivered_at = new Date().toISOString();
      if (newStatus === 'cancelled') updateData.cancelled_at = new Date().toISOString();
      await supabase.from('orders').update(updateData).eq('id', orderId);
      // Send email notification (fire and forget)
      const emailEventType = newStatus === 'new' ? 'confirmed' : newStatus;
      if (['confirmed', 'preparing', 'out_for_delivery', 'completed', 'cancelled'].includes(emailEventType)) {
        supabase.functions.invoke('send-order-email', { body: { tenant_id: tenantId, order_id: orderId, event_type: emailEventType } }).catch(() => {});
      }
      // Log activity
      const order = orders.find(o => o.id === orderId);
      supabase.from("activity_logs").insert({ tenant_id: tenantId, user_name: "Admin", action: `Pedido #${order?.order_number || "?"} → ${newStatus}` }).catch(() => {});
      await fetchOrders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    dragCooldownRef.current = true;
    const order = orders.find(o => o.id === event.active.id);
    setActiveOrder(order || null);
  };

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over) {
      dragCooldownRef.current = false;
      return;
    }
    const newStatus = over.id as OrderStatus;
    const order = orders.find(o => o.id === active.id);
    if (!order || order.status === newStatus) {
      dragCooldownRef.current = false;
      return;
    }
    setOrders(prev => prev.map(o => o.id === active.id ? { ...o, status: newStatus } : o));
    updateStatus(active.id as string, newStatus).then(() => {
      dragCooldownRef.current = false;
    });
  }, [orders]);

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setDetailOpen(true);
  };

  const openCustomer = (order: Order) => {
    setCustomerOrder(order);
    setDetailOpen(false);
    setCustomerOpen(true);
  };

  const counts = {
    all: orders.length,
    new: orders.filter(o => o.status === 'new').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    out_for_delivery: orders.filter(o => o.status === 'out_for_delivery').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const filteredOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: T.text, position: 'relative', minHeight: '100%' }}>
      {/* Background decorations */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)`, backgroundSize: '80px 80px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', top: -200, right: -150, width: 600, height: 600, background: 'radial-gradient(circle,rgba(59,130,246,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow1 8s ease-in-out infinite' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -150, width: 500, height: 500, background: 'radial-gradient(circle,rgba(236,72,153,0.04) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0, animation: 'mmGlow2 10s ease-in-out infinite' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px 0' }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16, ...fadeUp(0.05) }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: -0.5, marginBottom: 4 }}>
              <span style={{ background: `linear-gradient(135deg,${T.blue},${T.purple})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pedidos</span>
            </h1>
            <p style={{ fontSize: '0.88rem', color: T.muted }}>{orders.length} pedidos no periodo</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Export CSV */}
            <button
              onClick={() => {
                const statusLabels: Record<string, string> = { new: 'Novo', preparing: 'Em Preparo', out_for_delivery: 'Em Entrega', completed: 'Finalizado', cancelled: 'Cancelado' };
                exportCSV(filteredOrders, 'pedidos.csv', [
                  { key: 'order_number', label: 'Pedido' },
                  { key: 'created_at', label: 'Data', format: (v: any) => formatDateBR(v) },
                  { key: 'customer_name', label: 'Cliente' },
                  { key: 'customer_phone', label: 'Telefone' },
                  { key: 'delivery_address', label: 'Endereco' },
                  { key: 'delivery_neighborhood', label: 'Bairro' },
                  { key: 'status', label: 'Status', format: (v: any) => statusLabels[v] || v },
                  { key: 'payment_method', label: 'Pagamento' },
                  { key: 'subtotal', label: 'Subtotal', format: (v: any) => formatNum(v) },
                  { key: 'delivery_fee', label: 'Taxa Entrega', format: (v: any) => formatNum(v) },
                  { key: 'discount', label: 'Desconto', format: (v: any) => formatNum(v) },
                  { key: 'total', label: 'Total', format: (v: any) => formatNum(v) },
                ]);
              }}
              title="Exportar CSV"
              style={{
                width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`,
                background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              <SvgDownload />
            </button>
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Desativar som" : "Ativar som"}
              style={{
                width: 34, height: 34, borderRadius: 10, border: `1px solid ${T.border}`,
                background: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              {soundEnabled ? <SvgVolume2 /> : <SvgVolumeX />}
            </button>
            {/* View Toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2, padding: 3, borderRadius: 10,
              background: T.card, border: `1px solid ${T.border}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                  transition: 'all 0.2s',
                  background: viewMode === 'kanban' ? `linear-gradient(135deg,${T.blue},${T.purple})` : 'transparent',
                  color: viewMode === 'kanban' ? '#FFF' : T.muted,
                }}
              >
                <SvgLayoutGrid color={viewMode === 'kanban' ? '#FFF' : T.muted} />
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                  borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                  transition: 'all 0.2s',
                  background: viewMode === 'list' ? `linear-gradient(135deg,${T.blue},${T.purple})` : 'transparent',
                  color: viewMode === 'list' ? '#FFF' : T.muted,
                }}
              >
                <SvgList color={viewMode === 'list' ? '#FFF' : T.muted} />
                Lista
              </button>
            </div>
            <DateRangeFilter
              preset={preset}
              onPresetChange={setPreset}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
          </div>
        </div>

        {/* ── Status Filter Tabs ── */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20, ...fadeUp(0.1) }}>
          {(['all', 'new', 'preparing', 'out_for_delivery', 'completed', 'cancelled'] as const).map((key) => {
            const cfg = statusTabConfig[key];
            const count = counts[key];
            const isActive = statusFilter === key;
            const IconComp = cfg.icon;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                  borderRadius: 10, border: `1px solid ${isActive ? cfg.color + '40' : T.border}`,
                  cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                  transition: 'all 0.25s',
                  background: isActive ? cfg.color + '12' : T.card,
                  color: isActive ? cfg.color : T.muted,
                  boxShadow: isActive ? `0 2px 8px ${cfg.color}18` : '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = cfg.color + '30';
                    (e.currentTarget as HTMLButtonElement).style.background = cfg.color + '08';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = T.border;
                    (e.currentTarget as HTMLButtonElement).style.background = T.card;
                  }
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, display: 'inline-block', opacity: isActive ? 1 : 0.5 }} />
                <IconComp color={isActive ? cfg.color : T.muted} />
                {cfg.label}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 22, height: 20, padding: '0 6px', borderRadius: 6,
                  fontSize: '0.68rem', fontWeight: 700,
                  background: isActive ? cfg.color + '20' : 'rgba(0,0,0,0.04)',
                  color: isActive ? cfg.color : T.muted,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Content Area ── */}
        {orders.length === 0 ? (
          /* ── Empty State ── */
          <div style={{
            ...cardBase,
            padding: '64px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            ...fadeUp(0.15),
          }}>
            {/* Top gradient border */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.purple},transparent)` }} />
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: `linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <SvgPackage color={T.muted} />
            </div>
            <p style={{ fontSize: '1.05rem', fontWeight: 700, color: T.text, marginBottom: 6 }}>Nenhum pedido no periodo</p>
            <p style={{ fontSize: '0.85rem', color: T.muted }}>Os pedidos aparecerao aqui em tempo real</p>
          </div>
        ) : viewMode === 'kanban' ? (
          /* ── Kanban View ── */
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, ...fadeUp(0.15) }}>
              {kanbanColumns.map(status => {
                const config = statusConfig[status];
                const colColor = columnColorMap[status] || T.muted;
                const IconComp = columnIconMap[status] || SvgClock;
                const columnOrders = (statusFilter === 'all' || statusFilter === status)
                  ? orders.filter(o => o.status === status)
                  : [];
                return (
                  <KanbanColumn key={status} status={status} colColor={colColor} config={config} IconComp={IconComp}
                    columnOrders={columnOrders} updateStatus={updateStatus} openDetail={openDetail} />
                );
              })}
            </div>
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease-out' }}>
              {activeOrder ? (
                <div style={{
                  borderRadius: 14,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
                  transform: 'scale(1.02)',
                  cursor: 'grabbing',
                }}>
                  <OrderCard order={activeOrder} index={0} onStatusChange={() => {}} onOpenDetail={() => {}} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          /* ── List View ── */
          <div style={{ ...cardBase, ...fadeUp(0.15) }}>
            {/* Top gradient border */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${T.blue},${T.purple},transparent)` }} />
            <OrderListView
              orders={filteredOrders}
              onStatusChange={updateStatus}
              onOpenDetail={openDetail}
            />
          </div>
        )}
      </div>

      {/* Sheets */}
      <OrderDetailSheet
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onStatusChange={updateStatus}
        onOpenCustomer={openCustomer}
      />
      <CustomerDetailSheet
        order={customerOrder}
        open={customerOpen}
        onOpenChange={setCustomerOpen}
        tenantId={tenantId}
      />
    </div>
  );
};

export default Orders;
