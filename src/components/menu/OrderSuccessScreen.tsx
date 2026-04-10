import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, MessageCircle } from 'lucide-react';

interface OrderSuccessScreenProps {
  orderNumber: number;
  tenantPhone?: string | null;
  onBackToMenu: () => void;
}

const OrderSuccessScreen = ({ orderNumber, tenantPhone, onBackToMenu }: OrderSuccessScreenProps) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const confettiColors = ['#F97316', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#EA580C', '#8B5CF6', '#06B6D4'];

  const handleWhatsApp = () => {
    const phone = (tenantPhone || '').replace(/\D/g, '');
    const message = encodeURIComponent(`Oi! Gostaria de acompanhar meu pedido #${orderNumber}`);
    window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#FAFAFA' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-sm w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
          className="relative inline-flex items-center justify-center mb-8"
        >
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center"
            style={{ background: '#ECFDF5' }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}
            >
              <CheckCircle2 className="h-12 w-12" style={{ color: '#059669' }} />
            </div>
          </div>
          {showConfetti && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    scale: 1,
                    x: Math.cos(i * 45 * Math.PI / 180) * 70,
                    y: Math.sin(i * 45 * Math.PI / 180) * 70,
                  }}
                  transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                  className="absolute w-2.5 h-2.5 rounded-full"
                  style={{ background: confettiColors[i] }}
                />
              ))}
            </>
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold mb-2"
          style={{ color: '#1A1D26' }}
        >
          Pedido Confirmado!
        </motion.h2>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-4">
          <p style={{ color: '#6B7280' }}>
            Seu pedido <span className="font-bold text-lg" style={{ color: '#F97316' }}>#{orderNumber}</span> foi recebido
          </p>

          {/* Status Card */}
          <div
            className="p-5 text-left space-y-4 mt-6"
            style={{
              borderRadius: '20px',
              background: 'white',
              border: '1px solid #F3F4F6',
              boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
                  border: '1px solid #FED7AA',
                }}
              >
                <Clock className="h-5 w-5" style={{ color: '#F97316' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#1A1D26' }}>Preparando seu pedido</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>Voce sera notificado sobre o status</p>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="flex items-center gap-1.5 pt-2">
              <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }} />
              <div className="flex-1 h-2 rounded-full" style={{ background: '#F3F4F6' }} />
              <div className="flex-1 h-2 rounded-full" style={{ background: '#F3F4F6' }} />
              <div className="flex-1 h-2 rounded-full" style={{ background: '#F3F4F6' }} />
            </div>
            <div className="flex justify-between text-[10px] font-medium">
              <span style={{ color: '#F97316' }}>Recebido</span>
              <span style={{ color: '#D1D5DB' }}>Preparando</span>
              <span style={{ color: '#D1D5DB' }}>Saiu</span>
              <span style={{ color: '#D1D5DB' }}>Entregue</span>
            </div>
          </div>

          {/* WhatsApp Button */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2.5 py-4 font-semibold text-sm transition-all active:scale-[0.98] mt-4"
            style={{
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              color: 'white',
              boxShadow: '0 4px 14px rgba(37,211,102,0.3)',
            }}
          >
            <MessageCircle className="h-5 w-5" />
            Acompanhar pedido no WhatsApp
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default OrderSuccessScreen;
