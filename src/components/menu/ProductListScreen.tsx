import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, Plus, Minus, UtensilsCrossed } from 'lucide-react';

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

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id?: string | null;
}

interface ProductListScreenProps {
  category: Category;
  products: Product[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onBack: () => void;
}

const ProductListScreen = ({ category, products, cart, onAddToCart, onUpdateQuantity, onBack }: ProductListScreenProps) => {
  const categoryProducts = products.filter(p => p.category_id === category.id);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-5 active:scale-[0.97]"
        style={{ color: '#000000' }}
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="text-sm font-medium">Voltar</span>
      </button>

      {/* Category Title */}
      <div className="flex items-center gap-2 mb-6">
        {category.icon && <span className="text-2xl">{category.icon}</span>}
        <h2 className="text-xl font-bold" style={{ color: '#000000' }}>
          {category.name}
        </h2>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full ml-1"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          {categoryProducts.length}
        </span>
      </div>

      {categoryProducts.length === 0 ? (
        <div className="text-center py-20">
          <UtensilsCrossed className="h-12 w-12 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Nenhum produto disponivel nesta categoria.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categoryProducts.map((p, i) => {
            const inCart = cart.find(c => c.product.id === p.id);
            const isExpanded = expandedId === p.id;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="overflow-hidden"
                style={{
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  borderBottom: '1px solid #F3F4F6',
                }}
              >
                <div
                  className="flex gap-3.5 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                >
                  <div className="flex-1 min-w-0 py-0.5">
                    <h3 className="font-semibold text-[15px] leading-tight" style={{ color: '#000000' }}>
                      {p.name}
                    </h3>
                    {p.description && (
                      <p
                        className={'text-[13px] mt-1.5 leading-relaxed ' + (isExpanded ? '' : 'line-clamp-2')}
                        style={{ color: '#6B7280' }}
                      >
                        {p.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-[15px] font-bold" style={{ color: '#000000' }}>
                        R$ {p.price.toFixed(2)}
                      </span>
                      {p.prep_time_min && (
                        <span className="text-[11px] flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                          <Clock className="h-3 w-3" /> {p.prep_time_min}min
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Image */}
                  <div className="relative flex-shrink-0">
                    {p.image_url ? (
                      <div
                        className="w-[100px] h-[100px] overflow-hidden"
                        style={{ borderRadius: '12px' }}
                      >
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-[100px] h-[100px] flex items-center justify-center"
                        style={{
                          borderRadius: '12px',
                          background: '#F3F4F6',
                        }}
                      >
                        <UtensilsCrossed className="h-7 w-7" style={{ color: '#D1D5DB' }} />
                      </div>
                    )}
                    {/* Small add button overlapping image bottom-right */}
                    {!inCart && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onAddToCart(p); }}
                        className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: '#000000',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        }}
                      >
                        <Plus className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quantity Controls (when in cart) */}
                {inCart && (
                  <div className="px-4 pb-4">
                    <div
                      className="flex items-center justify-between px-4 py-2.5"
                      style={{
                        borderRadius: '10px',
                        background: '#F9FAFB',
                        border: '1px solid #F3F4F6',
                      }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onUpdateQuantity(p.id, -1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <Minus className="h-4 w-4" style={{ color: '#000000' }} />
                      </button>
                      <span className="text-[15px] font-bold" style={{ color: '#000000' }}>
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(p.id, 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: '#000000',
                          color: '#FFFFFF',
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductListScreen;
