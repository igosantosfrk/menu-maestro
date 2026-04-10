import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Clock, MapPin, Phone, Mail, CreditCard, ExternalLink, User, Package, Truck, Hash, Globe, RotateCcw, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem, OrderStatus, statusConfig, paymentMethodLabels, paymentStatusLabels, getTimeAgo } from './types';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, DollarSign } from 'lucide-react';

interface Props {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onOpenCustomer: (order: Order) => void;
}

export default function OrderDetailSheet({ order, open, onOpenChange, onStatusChange, onOpenCustomer }: Props) {
  const [items, setItems] = useState<OrderItem[]>([]);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [refundType, setRefundType] = useState<'total' | 'partial'>('total');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (!order) return;
    supabase
      .from('order_items')
      .select('id, product_name, quantity, unit_price, total, notes, addons')
      .eq('order_id', order.id)
      .then(({ data }) => setItems(data || []));
    setShowRefundForm(false);
    setRefundType('total');
    setRefundAmount('');
    setRefundReason('');
  }, [order?.id]);

  if (!order) return null;
  const config = statusConfig[order.status];

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      toast({ title: 'Informe o motivo do reembolso', variant: 'destructive' });
      return;
    }
    const amount = refundType === 'total' ? Number(order.total) : parseFloat(refundAmount);
    if (refundType === 'partial' && (!amount || amount <= 0 || amount > Number(order.total))) {
      toast({ title: 'Valor invalido', variant: 'destructive' });
      return;
    }
    setRefundLoading(true);
    const { error } = await supabase.from('orders').update({
      refund_status: 'refunded',
      refund_amount: amount,
      refund_reason: refundReason.trim(),
      refunded_at: new Date().toISOString(),
      refunded_by: profile?.full_name || 'Admin',
      payment_status: 'refunded',
    } as any).eq('id', order.id);
    setRefundLoading(false);
    if (error) {
      toast({ title: 'Erro ao processar reembolso', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Reembolso registrado com sucesso!' });
    setShowRefundForm(false);
    onOpenChange(false);
  };

  const isPaid = order.payment_status === 'confirmed' || (order.payment_status as string) === 'paid';
  const isRefunded = order.refund_status === 'refunded' || order.payment_status === 'refunded';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-card border-border/30">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-xl flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Pedido #{order.order_number}
            </SheetTitle>
            {isRefunded && (
                <Badge className="bg-red-500/10 text-red-400 border-red-500/20 border text-xs">
                  Reembolsado
                </Badge>
              )}
              <Badge className={`${config.bgClass} ${config.color} border text-xs`}>
              {config.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(order.created_at).toLocaleString('pt-BR')} · {getTimeAgo(order.created_at)} atrás
          </p>
        </SheetHeader>

        <div className="space-y-5 mt-2">
          {/* Customer Section */}
          <div
            className="p-3 rounded-xl bg-muted/20 border border-border/20 cursor-pointer hover:bg-muted/40 transition-colors group"
            onClick={() => onOpenCustomer(order)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</span>
              <span className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">Ver perfil →</span>
            </div>
            <div className="space-y-1">
              <p className="font-semibold flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {order.customer_name}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                {order.customer_phone}
              </p>
              {order.customer_email && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  {order.customer_email}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <Package className="h-3.5 w-3.5" />
              Itens do Pedido
            </span>
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-start justify-between py-2 px-3 rounded-lg bg-muted/10 border border-border/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.quantity}x {item.product_name}</p>
                    {item.notes && <p className="text-[11px] text-muted-foreground mt-0.5">📝 {item.notes}</p>}
                    {item.addons && Array.isArray(item.addons) && item.addons.length > 0 && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        + {(item.addons as any[]).map((a: any) => a.name || a).join(', ')}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-semibold shrink-0 ml-2">
                    R$ {Number(item.total).toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>R$ {Number(order.subtotal).toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Taxa de entrega</span>
              <span>R$ {Number(order.delivery_fee).toFixed(2).replace('.', ',')}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-emerald-400">-R$ {Number(order.discount).toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <Separator className="bg-border/20" />
            <div className="flex justify-between font-display font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">R$ {Number(order.total).toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <CreditCard className="h-3.5 w-3.5" />
              Pagamento
            </span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{paymentMethodLabels[order.payment_method]}</Badge>
              <Badge className={`text-xs ${(order.payment_status === 'confirmed' || order.payment_status === 'paid') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : order.payment_status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} border`}>
                {paymentStatusLabels[order.payment_status]}
              </Badge>
            </div>
            {order.stripe_payment_intent_id && (
              <p className="text-[11px] text-muted-foreground mt-2 font-mono">ID: {order.stripe_payment_intent_id}</p>
            )}
            {order.payment_status === 'pending' && (
              <Button
                size="sm"
                className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={async () => {
                  await supabase.from('orders').update({ payment_status: 'confirmed' }).eq('id', order.id);
                  toast({ title: 'Pagamento confirmado!' });
                  onOpenChange(false);
                }}
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Marcar como Pago
              </Button>
            )}
          </div>

          {/* Delivery */}
          {order.delivery_address && (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Truck className="h-3.5 w-3.5" />
                Entrega
              </span>
              <p className="text-sm">{order.delivery_address}</p>
              {order.delivery_neighborhood && <p className="text-sm text-muted-foreground">{order.delivery_neighborhood}{order.delivery_city ? ` - ${order.delivery_city}` : ''}</p>}
              {order.delivery_notes && <p className="text-[11px] text-muted-foreground mt-1">📝 {order.delivery_notes}</p>}
            </div>
          )}

          {/* Tracking */}
          {(order.utm_source || order.utm_campaign) && (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Globe className="h-3.5 w-3.5" />
                Rastreamento
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {order.utm_source && (
                  <div><span className="text-muted-foreground">Fonte:</span> <span className="font-medium">{order.utm_source}</span></div>
                )}
                {order.utm_campaign && (
                  <div><span className="text-muted-foreground">Campanha:</span> <span className="font-medium">{order.utm_campaign}</span></div>
                )}
                {order.utm_medium && (
                  <div><span className="text-muted-foreground">Mídia:</span> <span className="font-medium">{order.utm_medium}</span></div>
                )}
                {order.utm_ad_link && (
                  <div>
                    <a href={order.utm_ad_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-accent flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Ver anúncio
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {order.notes && (
            <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">Observações</span>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          
          {/* Refund Section */}
          {(isPaid || isRefunded) && (
            <div className={`p-3 rounded-xl border ${isRefunded ? 'border-red-500/20 bg-red-500/5' : 'border-border/20 bg-muted/20'}`}>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <RotateCcw className="h-3.5 w-3.5" />
                Reembolso
              </span>

              {isRefunded ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20 border text-xs font-semibold">Reembolsado</Badge>
                    <span className="text-sm font-bold text-red-400">R$ {Number(order.refund_amount || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                  {order.refund_reason && (<p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Motivo:</span> {order.refund_reason}</p>)}
                  {order.refunded_at && (<p className="text-xs text-muted-foreground">{new Date(order.refunded_at).toLocaleString('pt-BR')}{order.refunded_by ? ` . por ${order.refunded_by}` : ''}</p>)}
                </div>
              ) : !showRefundForm ? (
                <Button size="sm" variant="outline" className="w-full border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400" onClick={() => setShowRefundForm(true)}>
                  <RotateCcw className="h-4 w-4 mr-1.5" />Reembolsar
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button onClick={() => setRefundType('total')} className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg border transition-all ${refundType === 'total' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-muted/10 border-border/20 text-muted-foreground hover:bg-muted/20'}`}>Total (R$ {Number(order.total).toFixed(2).replace('.', ',')})</button>
                    <button onClick={() => setRefundType('partial')} className={`flex-1 text-xs font-semibold py-2 px-3 rounded-lg border transition-all ${refundType === 'partial' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-muted/10 border-border/20 text-muted-foreground hover:bg-muted/20'}`}>Parcial</button>
                  </div>
                  {refundType === 'partial' && (<div><label className="text-xs font-medium text-muted-foreground mb-1 block">Valor do reembolso (R$)</label><Input type="number" step="0.01" min="0.01" max={Number(order.total)} value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder="0,00" className="h-8 text-sm" /></div>)}
                  <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Motivo do reembolso *</label><Input value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Ex: Cliente solicitou cancelamento" className="h-8 text-sm" /></div>
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20"><AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" /><p className="text-[11px] text-amber-600">O estorno no gateway de pagamento deve ser feito manualmente.</p></div>
                  <div className="flex gap-2"><Button size="sm" className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs" onClick={handleRefund} disabled={refundLoading}>{refundLoading ? 'Processando...' : 'Confirmar Reembolso'}</Button><Button size="sm" variant="outline" className="text-xs" onClick={() => { setShowRefundForm(false); setRefundReason(''); setRefundAmount(''); }}>Cancelar</Button></div>
                </div>
              )}
            </div>
          )}

          {/* Status Actions */}
          {order.status !== 'completed' && order.status !== 'cancelled' && (
            <div className="flex gap-2 pt-2">
              {order.status === 'new' && (
                <Button className="flex-1 gradient-primary" onClick={() => { onStatusChange(order.id, 'preparing'); onOpenChange(false); }}>
                  Aceitar Pedido
                </Button>
              )}
              {order.status === 'preparing' && (
                <Button className="flex-1 gradient-primary" onClick={() => { onStatusChange(order.id, 'out_for_delivery'); onOpenChange(false); }}>
                  <Truck className="h-4 w-4 mr-2" />
                  Saiu p/ Entrega
                </Button>
              )}
              {order.status === 'out_for_delivery' && (
                <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => { onStatusChange(order.id, 'completed'); onOpenChange(false); }}>
                  Marcar como Entregue ✓
                </Button>
              )}
              <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => { onStatusChange(order.id, 'cancelled'); onOpenChange(false); }}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
