import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Plus, Minus, ChevronRight, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_available: boolean | null;
  is_featured: boolean | null;
  prep_time_min: number | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

interface CartSheetProps {
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  deliveryFee: number | null;
  onCheckout?: () => void;
}

const CartSheet = ({ cart, cartOpen, setCartOpen, onUpdateQuantity, deliveryFee, onCheckout }: CartSheetProps) => {
  const cartTotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <AnimatePresence>
      {cartCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <div className="max-w-2xl mx-auto">
            <Sheet open={cartOpen} onOpenChange={setCartOpen}>
              <SheetTrigger asChild>
                <button
                  className="w-full px-6 py-4 flex items-center justify-between active:scale-[0.98] transition-transform"
                  style={{
                    borderRadius: '16px',
                    background: '#000000',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <ShoppingBag className="h-5 w-5" style={{ color: '#FFFFFF' }} />
                      <motion.span
                        key={cartCount}
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2.5 -right-3 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center"
                        style={{
                          background: '#FFFFFF',
                          color: '#000000',
                        }}
                      >
                        {cartCount}
                      </motion.span>
                    </div>
                    <span className="font-semibold text-[15px]">Ver Pedido</span>
                  </div>
                  <motion.span
                    key={cartTotal}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="font-bold text-lg"
                  >
                    R$ {cartTotal.toFixed(2)}
                  </motion.span>
                </button>
              </SheetTrigger>

              <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl border-t border-gray-100 p-0" style={{ background: '#FFFFFF' }}>
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full" style={{ background: '#E5E7EB' }} />
                </div>
                <SheetHeader className="px-5 pb-4">
                  <SheetTitle className="text-xl font-bold" style={{ color: '#000000' }}>
                    Seu Pedido
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-4" style={{ maxHeight: 'calc(85vh - 260px)' }}>
                  {cart.map(item => (
                    <motion.div
                      key={item.product.id}
                      layout
                      className="flex items-center gap-3.5 p-3.5"
                      style={{
                        borderRadius: '12px',
                        background: '#F9FAFB',
                        border: '1px solid #F3F4F6',
                      }}
                    >
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt=""
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: '#F3F4F6' }}
                        >
                          <ShoppingBag className="h-5 w-5" style={{ color: '#9CA3AF' }} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate" style={{ color: '#000000' }}>
                          {item.product.name}
                        </h4>
                        <p className="text-sm font-bold mt-0.5" style={{ color: '#000000' }}>
                          R$ {(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                          }}
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="h-3.5 w-3.5" style={{ color: '#EF4444' }} />
                          ) : (
                            <Minus className="h-3.5 w-3.5" style={{ color: '#000000' }} />
                          )}
                        </button>
                        <span className="text-sm font-bold w-6 text-center" style={{ color: '#000000' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: '#000000',
                            color: '#FFFFFF',
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Summary + Checkout */}
                <div className="px-5 py-5 space-y-3" style={{ borderTop: '1px solid #F3F4F6', background: '#FFFFFF' }}>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#6B7280' }}>Subtotal</span>
                    <span className="font-medium" style={{ color: '#000000' }}>R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  {deliveryFee != null && deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: '#6B7280' }}>Taxa de entrega</span>
                      <span className="font-medium" style={{ color: '#000000' }}>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                    <span style={{ color: '#000000' }}>Total</span>
                    <span style={{ color: '#000000' }}>R$ {(cartTotal + (deliveryFee || 0)).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={onCheckout}
                    className="w-full flex items-center justify-center gap-2 py-4 font-bold text-[15px] active:scale-[0.98] transition-all"
                    style={{
                      borderRadius: '12px',
                      background: '#000000',
                      color: '#FFFFFF',
                    }}
                  >
                    Finalizar Pedido
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CartSheet;
