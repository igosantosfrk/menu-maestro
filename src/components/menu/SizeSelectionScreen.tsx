import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  parent_id?: string | null;
}

interface SizeSelectionScreenProps {
  parentCategory: Category;
  subCategories: Category[];
  onSelectSubCategory: (category: Category) => void;
  onBack: () => void;
}

const SizeSelectionScreen = ({ parentCategory, subCategories, onSelectSubCategory, onBack }: SizeSelectionScreenProps) => {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-5 transition-colors"
        style={{ color: '#9CA3AF' }}
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm font-medium">Voltar</span>
      </button>
      <div className="mb-6">
        <h2 className="text-xl font-bold" style={{ color: '#1A1D26', letterSpacing: '-0.01em' }}>
          {parentCategory.icon ? `${parentCategory.icon} ` : ''}{parentCategory.name}
        </h2>
        <p className="text-sm mt-1.5" style={{ color: '#9CA3AF' }}>Escolha o tamanho</p>
      </div>
      <div className="space-y-3">
        {subCategories.map((sub, i) => (
          <motion.button
            key={sub.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectSubCategory(sub)}
            className="w-full flex items-center justify-between p-5 text-left group transition-all active:scale-[0.98]"
            style={{
              borderRadius: '20px',
              background: 'white',
              border: '1px solid rgba(0,0,0,0.04)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-center gap-3.5">
              {sub.icon && (
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                  {sub.icon}
                </span>
              )}
              <span
                className="text-base font-semibold transition-colors group-hover:text-orange-600"
                style={{ color: '#1A1D26' }}
              >
                {sub.name}
              </span>
            </div>
            <ChevronRight
              className="h-5 w-5 transition-all group-hover:translate-x-0.5"
              style={{ color: '#D1D5DB' }}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelectionScreen;
