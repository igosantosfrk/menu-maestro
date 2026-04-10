import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Banknote, QrCode, Loader2, MapPin, User, Phone, Mail, MessageSquare, Tag, X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UtmParams } from '@/hooks/useMenuTracking';

interface CartItem {
  product: { id: string; name: string; price: number; image_url?: string | null; [key: string]: any };
  quantity: number;
  notes?: string;
}

interface CheckoutScreenProps {
  cart: CartItem[];
  tenantId: string;
  tenantSlug: string;
  deliveryFee: number | null;
  minOrderValue: number | null;
  sessionId: string;
  utmParams: UtmParams;
  onBack: () => void;
  onOrderComplete: (orderNumber: number) => void;
  paymentGateway?: string;
  pixKey?: string | null;
  pixHolderName?: string | null;
}

type PaymentMethod = 'online_card' | 'online_pix' | 'cash' | 'card_delivery';

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  discountAmount: number;
}

const InputField = ({ icon: Icon, label, value, onChange, placeholder, required, type = 'text' }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
      {label}{required && ' *'}
    </label>
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#D1D5DB' }} />
      <input
        type={type} value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3.5 text-sm focus:outline-none transition-all"
        style={{
          borderRadius: '14px',
          background: 'white',
          border: '1.5px solid #E5E7EB',
          color: '#1A1D26',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#F97316';
          e.currentTarget.style.boxShadow = '0 1px 8px rgba(249,115,22,0.1)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#E5E7EB';
          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
        }}
      />
    </div>
  </div>
);


const CheckoutScreen = ({
  cart, tenantId, tenantSlug, deliveryFee, minOrderValue, sessionId, utmParams, onBack, onOrderComplete, paymentGateway, pixKey, pixHolderName
}: CheckoutScreenProps) => {
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showPixKey, setShowPixKey] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNeighborhood, setDeliveryNeighborhood] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const discount = appliedCoupon?.discountAmount || 0;
  const total = Math.max(0, subtotal - discount + (deliveryFee || 0));
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        toast({ title: 'Cupom invalido', description: 'Verifique o codigo e tente novamente', variant: 'destructive' });
        setCouponLoading(false);
        return;
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({ title: 'Cupom expirado', variant: 'destructive' });
        setCouponLoading(false);
        return;
      }

      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        toast({ title: 'Cupom esgotado', variant: 'destructive' });
        setCouponLoading(false);
        return;
      }

      if (coupon.min_order_value && subtotal < coupon.min_order_value) {
        toast({ title: `Pedido minimo para este cupom: R$ ${coupon.min_order_value.toFixed(2)}`, variant: 'destructive' });
        setCouponLoading(false);
        return;
      }

      const discountAmount = coupon.discount_type === 'percentage'
        ? subtotal * (coupon.discount_value / 100)
        : coupon.discount_value;

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discountAmount: Math.min(discountAmount, subtotal),
      });

      toast({ title: 'Cupom aplicado!', description: `Desconto de R$ ${Math.min(discountAmount, subtotal).toFixed(2)}` });
    } catch {
      toast({ title: 'Erro ao validar cupom', variant: 'destructive' });
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const items = cart.map(i => ({ name: i.product.name, price: i.product.price, quantity: i.quantity }));

  const basePayload = {
    tenant_id: tenantId, items, customer_name: customerName, customer_phone: customerPhone,
    customer_email: customerEmail || undefined, delivery_address: deliveryAddress || undefined,
    delivery_neighborhood: deliveryNeighborhood || undefined, delivery_city: deliveryCity || undefined,
    delivery_notes: deliveryNotes || undefined, delivery_fee: deliveryFee || 0,
    discount: discount, coupon_code: appliedCoupon?.code || undefined, coupon_id: appliedCoupon?.id || undefined,
    session_id: sessionId, ...utmParams,
  };

  const handleContinueToPayment = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({ title: 'Preencha nome e telefone', variant: 'destructive' }); return;
    }
    if (!deliveryAddress.trim()) {
      toast({ title: 'Preencha o endereco de entrega', variant: 'destructive' }); return;
    }
    if (minOrderValue && subtotal < minOrderValue) {
      toast({ title: `Pedido minimo: R$ ${minOrderValue.toFixed(2)}`, description: `Faltam R$ ${(minOrderValue - subtotal).toFixed(2)} para atingir o minimo`, variant: 'destructive' }); return;
    }
    setStep('payment');
  };

  const handleOnlinePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-online-payment', { body: basePayload });
      if (error) throw error;
      if (data?.paymentUrl) window.location.href = data.paymentUrl;
    } catch (err: any) {
      toast({ title: 'Erro ao processar pagamento', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const handleOfflinePayment = async (method: 'cash' | 'credit_card' | 'debit_card') => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-cash-order', { body: { ...basePayload, payment_method: method } });
      if (error) throw error;
      if (data?.order_number) onOrderComplete(data.order_number);
    } catch (err: any) {
      toast({ title: 'Erro ao criar pedido', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };


  const handlePixManual = () => {
    setShowPixKey(true);
  };

  const copyPixKey = () => {
    if (pixKey) {
      navigator.clipboard.writeText(pixKey);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    }
  };

  const handlePixConfirm = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-cash-order', { body: { ...basePayload, payment_method: 'pix' } });
      if (error) throw error;
      if (data?.order_number) onOrderComplete(data.order_number);
    } catch (err: any) {
      toast({ title: 'Erro ao criar pedido', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };
  const handleSelectPayment = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'online_card' || method === 'online_pix') handleOnlinePayment();
    else if (method === 'cash') handleOfflinePayment('cash');
    else if (method === 'card_delivery') handleOfflinePayment('credit_card');
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAFAFA' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 px-4 py-3.5"
        style={{
          background: 'rgba(250,250,250,0.92)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #F3F4F6',
        }}
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={step === 'payment' ? () => setStep('info') : onBack}
            className="flex items-center gap-2 transition-colors"
            style={{ color: '#9CA3AF' }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: step === 'info' ? 'linear-gradient(135deg, #F97316, #EA580C)' : '#F3F4F6',
                  color: step === 'info' ? 'white' : '#9CA3AF',
                  boxShadow: step === 'info' ? '0 2px 6px rgba(249,115,22,0.3)' : 'none',
                }}
              >
                1
              </span>
              <span className="hidden sm:inline text-xs font-medium" style={{ color: step === 'info' ? '#F97316' : '#D1D5DB' }}>
                Dados
              </span>
            </div>
            <div className="w-8 h-px" style={{ background: '#E5E7EB' }} />
            <div className="flex items-center gap-1.5">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
                style={{
                  background: step === 'payment' ? 'linear-gradient(135deg, #F97316, #EA580C)' : '#F3F4F6',
                  color: step === 'payment' ? 'white' : '#9CA3AF',
                  boxShadow: step === 'payment' ? '0 2px 6px rgba(249,115,22,0.3)' : 'none',
                }}
              >
                2
              </span>
              <span className="hidden sm:inline text-xs font-medium" style={{ color: step === 'payment' ? '#F97316' : '#D1D5DB' }}>
                Pagamento
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {step === 'info' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <h2 className="text-lg font-bold" style={{ color: '#1A1D26' }}>Dados da Entrega</h2>
            <div className="space-y-4">
              <InputField icon={User} label="Nome" value={customerName} onChange={setCustomerName} placeholder="Seu nome completo" required />
              <div className="grid grid-cols-2 gap-3">
                <InputField icon={Phone} label="Telefone" value={customerPhone} onChange={setCustomerPhone} placeholder="(00) 00000-0000" required type="tel" />
                <InputField icon={Mail} label="Email" value={customerEmail} onChange={setCustomerEmail} placeholder="seu@email.com" />
              </div>
              <InputField icon={MapPin} label="Endereco" value={deliveryAddress} onChange={setDeliveryAddress} placeholder="Rua, numero, complemento" required />
              <div className="grid grid-cols-2 gap-3">
                <InputField icon={MapPin} label="Bairro" value={deliveryNeighborhood} onChange={setDeliveryNeighborhood} placeholder="Bairro" />
                <InputField icon={MapPin} label="Cidade" value={deliveryCity} onChange={setDeliveryCity} placeholder="Cidade" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                  Observacoes
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-3.5 h-4 w-4" style={{ color: '#D1D5DB' }} />
                  <textarea
                    value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
                    placeholder="Ex: Apartamento 201, portao azul..." rows={2}
                    className="w-full pl-12 pr-4 py-3.5 text-sm focus:outline-none resize-none transition-all"
                    style={{
                      borderRadius: '14px',
                      background: 'white',
                      border: '1.5px solid #E5E7EB',
                      color: '#1A1D26',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#F97316';
                      e.currentTarget.style.boxShadow = '0 1px 8px rgba(249,115,22,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Coupon Section */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#6B7280' }}>
                Cupom de Desconto
              </label>
              {appliedCoupon ? (
                <div
                  className="flex items-center gap-3 p-4"
                  style={{
                    borderRadius: '14px',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                  }}
                >
                  <Check className="h-5 w-5 flex-shrink-0" style={{ color: '#059669' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: '#065F46' }}>{appliedCoupon.code}</p>
                    <p className="text-xs" style={{ color: '#059669' }}>
                      -{appliedCoupon.discount_type === 'percentage' ? `${appliedCoupon.discount_value}%` : `R$ ${appliedCoupon.discount_value.toFixed(2)}`}
                      {' '}(- R$ {appliedCoupon.discountAmount.toFixed(2)})
                    </p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: '#059669' }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#D1D5DB' }} />
                    <input
                      type="text" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Digite o codigo"
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      className="w-full pl-12 pr-4 py-3.5 text-sm focus:outline-none transition-all uppercase"
                      style={{
                        borderRadius: '14px',
                        background: 'white',
                        border: '1.5px solid #E5E7EB',
                        color: '#1A1D26',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#F97316';
                        e.currentTarget.style.boxShadow = '0 1px 8px rgba(249,115,22,0.1)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#E5E7EB';
                        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
                      }}
                    />
                  </div>
                  <button
                    onClick={applyCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="px-5 py-3.5 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    style={{
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, #F97316, #EA580C)',
                      boxShadow: '0 2px 8px rgba(249,115,22,0.25)',
                    }}
                  >
                    {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div
              className="p-5 space-y-3"
              style={{
                borderRadius: '18px',
                background: 'white',
                border: '1px solid #F3F4F6',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex justify-between text-sm">
                <span style={{ color: '#9CA3AF' }}>Subtotal ({cartCount} {cartCount === 1 ? 'item' : 'itens'})</span>
                <span className="font-medium" style={{ color: '#374151' }}>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#059669' }}>Desconto</span>
                  <span className="font-medium" style={{ color: '#059669' }}>- R$ {discount.toFixed(2)}</span>
                </div>
              )}
              {(deliveryFee || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#9CA3AF' }}>Entrega</span>
                  <span className="font-medium" style={{ color: '#374151' }}>R$ {(deliveryFee || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold pt-3" style={{ borderTop: '1px solid #F9FAFB' }}>
                <span style={{ color: '#1A1D26' }}>Total</span>
                <span style={{ color: '#F97316' }}>R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleContinueToPayment}
              className="w-full py-4 text-white font-bold text-[15px] active:scale-[0.98] transition-all"
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #F97316, #EA580C)',
                boxShadow: '0 6px 20px rgba(249,115,22,0.3)',
              }}
            >
              Escolher Pagamento
            </button>
          </motion.div>
        )}

        {step === 'payment' && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <h2 className="text-lg font-bold" style={{ color: '#1A1D26' }}>Forma de Pagamento</h2>
              <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                Total: <span className="font-bold" style={{ color: '#F97316' }}>R$ {total.toFixed(2)}</span>
              </p>
            </div>

            {paymentGateway && paymentGateway !== 'none' && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                  Pagar Online
                </p>
                <button
                  disabled={loading}
                  onClick={() => handleSelectPayment('online_card')}
                  className="w-full flex items-center gap-4 p-4 text-left group transition-all active:scale-[0.98]"
                  style={{
                    borderRadius: '16px',
                    background: 'white',
                    border: '1px solid #F3F4F6',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                      border: '1px solid #FED7AA',
                    }}
                  >
                    <QrCode className="h-5 w-5" style={{ color: '#F97316' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: '#1A1D26' }}>Pagar Online</p>
                    <p className="text-[12px]" style={{ color: '#9CA3AF' }}>
                      {({
                        asaas: 'PIX, Cartao ou Boleto',
                        mercadopago: 'PIX, Cartao ou Boleto',
                        pagseguro: 'PIX, Cartao ou Boleto',
                        pagarme: 'PIX, Cartao ou Boleto',
                        stripe: 'Cartao, PIX ou Boleto',
                      } as Record<string, string>)[paymentGateway] || 'Pagamento seguro'}
                    </p>
                  </div>
                  {loading && paymentMethod === 'online_card' && <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#F97316' }} />}
                </button>
              </div>
            )}

            {pixKey && (
              <div className="space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>
                  Pagar com PIX
                </p>
                {!showPixKey ? (
                  <button
                    onClick={handlePixManual}
                    className="w-full flex items-center gap-4 p-4 text-left group transition-all active:scale-[0.98]"
                    style={{ borderRadius: '16px', background: 'white', border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  >
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #A7F3D0' }}>
                      <QrCode className="h-5 w-5" style={{ color: '#059669' }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm" style={{ color: '#1A1D26' }}>PIX</p>
                      <p className="text-[12px]" style={{ color: '#9CA3AF' }}>Copie a chave e pague pelo app do banco</p>
                    </div>
                  </button>
                ) : (
                  <div style={{ borderRadius: '16px', background: 'white', border: '1px solid #D1FAE5', padding: 20 }}>
                    <p className="text-sm font-semibold mb-3" style={{ color: '#1A1D26' }}>Copie a chave PIX e pague pelo app do seu banco:</p>
                    {pixHolderName && <p className="text-xs mb-2" style={{ color: '#6B7280' }}>Titular: <strong>{pixHolderName}</strong></p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F3F4F6', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1A1D26', wordBreak: 'break-all' }}>{pixKey}</span>
                      <button
                        onClick={copyPixKey}
                        style={{ padding: '6px 14px', borderRadius: 8, background: pixCopied ? '#059669' : '#F97316', color: '#fff', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {pixCopied ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <p className="text-xs mb-3" style={{ color: '#9CA3AF' }}>Total: <strong style={{ color: '#F97316' }}>R$ {total.toFixed(2)}</strong></p>
                    <button
                      onClick={handlePixConfirm}
                      disabled={loading}
                      className="w-full py-3 font-bold text-sm active:scale-[0.98] transition-all"
                      style={{ borderRadius: 12, background: 'linear-gradient(135deg, #059669, #047857)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.3)' }}
                    >
                      {loading ? 'Processando...' : 'Ja paguei o PIX'}
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider pt-2" style={{ color: '#9CA3AF' }}>
                Pagar na Entrega
              </p>
              {([
                { method: 'cash' as const, icon: Banknote, title: 'Dinheiro', desc: 'Pague em dinheiro ao receber' },
                { method: 'card_delivery' as const, icon: CreditCard, title: 'Cartao na Entrega', desc: 'Credito ou debito na maquininha' },
              ]).map(opt => (
                <button
                  key={opt.method}
                  disabled={loading}
                  onClick={() => handleSelectPayment(opt.method)}
                  className="w-full flex items-center gap-4 p-4 text-left group transition-all active:scale-[0.98]"
                  style={{
                    borderRadius: '16px',
                    background: 'white',
                    border: '1px solid #F3F4F6',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <div
                    className="h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
                  >
                    <opt.icon className="h-5 w-5" style={{ color: '#6B7280' }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm" style={{ color: '#1A1D26' }}>{opt.title}</p>
                    <p className="text-[12px]" style={{ color: '#9CA3AF' }}>{opt.desc}</p>
                  </div>
                  {loading && paymentMethod === opt.method && <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#F97316' }} />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CheckoutScreen;
