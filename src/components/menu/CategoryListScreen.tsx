import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, UtensilsCrossed } from 'lucide-react';

interface Category {

  id: string;
  name: string;
  icon: string | null;
  parent_id?: string | null;
}

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

interface CategoryListScreenProps {
  categories: Category[];
  products?: Product[];
  onSelectCategory: (category: Category) => void;
  onAddToCart?: (product: Product) => void;
}

const CategoryListScreen = ({ categories, products = [], onSelectCategory, onAddToCart }: CategoryListScreenProps) => {
  const [search, setSearch] = useState('');
  const topLevelCategories = categories.filter(c => !c.parent_id);
  const featuredProducts = products.filter(p => p.is_featured && p.is_available);

  const searchResults = search.length >= 2
    ? products.filter(p =>
        p.is_available &&
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
         p.description?.toLowerCase().includes(search.toLowerCase()))
      )
    : [];

  const getProductCount = (catId: string) => {
    const childCats = categories.filter(c => c.parent_id === catId).map(c => c.id);
    const allCatIds = [catId, ...childCats];
    return products.filter(p => p.is_available && p.category_id && allCatIds.includes(p.category_id)).length;
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px]" style={{ color: '#9CA3AF' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="O que voce esta procurando?"
          className="w-full pl-12 pr-4 py-3.5 text-sm focus:outline-none"
          style={{
            borderRadius: '9999px',
            background: '#F3F4F6',
            border: 'none',
            color: '#000000',
          }}
        />
      </div>

      {/* Search Results */}
      {search.length >= 2 && (
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider font-semibold mb-3" style={{ color: '#9CA3AF' }}>
            {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
          </p>
          {searchResults.length === 0 ? (
            <div className="text-center py-10">
              <UtensilsCrossed className="h-10 w-10 mx-auto mb-3" style={{ color: '#D1D5DB' }} />
              <p className="text-sm" style={{ color: '#9CA3AF' }}>Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.slice(0, 8).map((p, i) => (
                <motion.button
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => onAddToCart?.(p)}
                  className="w-full flex items-center gap-3 p-3 text-left active:scale-[0.98]"
                  style={{
                    borderRadius: '12px',
                    background: '#FFFFFF',
                    border: '1px solid #F3F4F6',
                  }}
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#F3F4F6' }}>
                      <UtensilsCrossed className="h-5 w-5" style={{ color: '#9CA3AF' }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#000000' }}>{p.name}</p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: '#000000' }}>R$ {p.price.toFixed(2)}</p>
                  </div>
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: '#000000' }}
                  >
                    <Plus className="w-4 h-4" style={{ color: '#FFFFFF' }} />
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Products - Horizontal Scroll */}
      {!search && featuredProducts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>Mais Pedidos</h2>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4">
            {featuredProducts.slice(0, 6).map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => onAddToCart?.(p)}
                className="flex-shrink-0 w-[150px] overflow-hidden group"
                style={{
                  borderRadius: '16px',
                  background: '#FFFFFF',
                  border: '1px solid #F3F4F6',
                }}
              >
                {p.image_url ? (
                  <div className="h-[110px] overflow-hidden">
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="h-[110px] flex items-center justify-center"
                    style={{ background: '#F3F4F6' }}
                  >
                    <UtensilsCrossed className="h-8 w-8" style={{ color: '#D1D5DB' }} />
                  </div>
                )}
                <div className="p-3">
                  <p
                    className="text-[13px] font-semibold line-clamp-2 leading-tight"
                    style={{ color: '#000000', minHeight: '34px' }}
                  >
                    {p.name}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold" style={{ color: '#000000' }}>
                      R$ {p.price.toFixed(2)}
                    </p>
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: '#000000' }}
                    >
                      <Plus className="w-3.5 h-3.5" style={{ color: '#FFFFFF' }} />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      {!search && (
        <>
          <h2 className="text-lg font-bold mb-4" style={{ color: '#000000' }}>Cardapio</h2>
          <div className="grid grid-cols-2 gap-3">
            {topLevelCategories.map((cat, i) => {
              const count = getProductCount(cat.id);
              return (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => onSelectCategory(cat)}
                  className="relative flex flex-col items-center justify-center p-5 text-center active:scale-[0.97]"
                  style={{
                    borderRadius: '16px',
                    background: '#F9FAFB',
                    minHeight: '120px',
                    border: '1px solid #F3F4F6',
                  }}
                >
                  {(cat as any).image_url ? (
                    <div style={{ width: '100%', height: '80px', borderRadius: '8px', overflow: 'hidden', marginBottom: '8px' }}>
                      <img src={(cat as any).image_url} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ) : cat.icon ? (
                    <span className="text-[36px] mb-2">
                      {cat.icon}
                    </span>
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                      style={{ background: '#E5E7EB' }}
                    >
                      <span className="font-bold text-lg" style={{ color: '#000000' }}>{cat.name[0]}</span>
                    </div>
                  )}
                  <span
                    className="text-[14px] font-semibold leading-tight"
                    style={{ color: '#000000' }}
                  >
                    {cat.name}
                  </span>
                  {count > 0 && (
                    <span className="text-[11px] mt-1" style={{ color: '#9CA3AF' }}>
                      {count} {count === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CategoryListScreen;
