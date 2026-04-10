import { Clock, MapPin, Bike, Star } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  phone: string | null;
  address: string | null;
  is_open: boolean | null;
  avg_delivery_time_min: number | null;
  delivery_fee: number | null;
  min_order_value: number | null;
}

interface MenuHeaderProps {
  tenant: Tenant;
}

const MenuHeader = ({ tenant }: MenuHeaderProps) => {
  return (
    <div style={{ background: '#FFFFFF' }}>
      {/* Banner */}
      {tenant.banner_url ? (
        <div className="h-48 sm:h-56 overflow-hidden relative">
          <img
            src={tenant.banner_url}
            alt={tenant.name}
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 60%, #FFFFFF 100%)'
          }} />
        </div>
      ) : (
        <div style={{ height: '8px', background: '#FFFFFF' }} />
      )}

      {/* Store Info */}
      <div className="px-4 sm:px-6 max-w-2xl mx-auto" style={{ paddingTop: tenant.banner_url ? '0' : '24px', paddingBottom: '20px' }}>
        <div className="flex items-start gap-4">
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt=""
              className="w-16 h-16 rounded-full object-cover flex-shrink-0"
              style={{ border: '2px solid #F3F4F6' }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: '#F3F4F6' }}
            >
              <span className="text-2xl font-bold" style={{ color: '#000000' }}>{tenant.name[0]}</span>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1
                className="text-2xl sm:text-[26px] font-bold truncate"
                style={{ color: '#000000', letterSpacing: '-0.02em' }}
              >
                {tenant.name}
              </h1>
              {tenant.is_open ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: '#ECFDF5', color: '#059669' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                  Aberto
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{ background: '#FEF2F2', color: '#DC2626' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#EF4444' }} />
                  Fechado
                </span>
              )}
            </div>
            {tenant.description && (
              <p className="text-sm mt-1 line-clamp-2 leading-relaxed" style={{ color: '#6B7280' }}>
                {tenant.description}
              </p>
            )}
          </div>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center gap-4 mt-4" style={{ color: '#6B7280' }}>
          {tenant.avg_delivery_time_min && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" style={{ color: '#9CA3AF' }} />
              <span className="text-sm">
                {tenant.avg_delivery_time_min}-{tenant.avg_delivery_time_min + 15} min
              </span>
            </div>
          )}
          {tenant.delivery_fee != null && (
            <div className="flex items-center gap-1.5">
              <Bike className="h-4 w-4" style={{ color: '#9CA3AF' }} />
              <span className="text-sm">
                {tenant.delivery_fee === 0 ? 'Entrega Gratis' : `R$ ${tenant.delivery_fee.toFixed(2)}`}
              </span>
            </div>
          )}
          {tenant.min_order_value != null && tenant.min_order_value > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm">
                Min. R$ {tenant.min_order_value.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Subtle divider */}
        <div style={{ height: '1px', background: '#F3F4F6', marginTop: '20px' }} />
      </div>
    </div>
  );
};

export default MenuHeader;
