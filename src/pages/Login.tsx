import { useRef, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, user, roles, onboardingCompleted } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && roles.length > 0) {
      if (onboardingCompleted === false) {
        navigate('/admin/onboarding');
      } else {
        navigate('/admin');
      }
    }
  }, [user, roles, onboardingCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value || '';
    const password = passwordRef.current?.value || '';
    if (!email || !password) return;
    
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC', fontFamily: "'Inter', sans-serif", padding: '32px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #EC4899, #F59E0B)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: '24px', color: '#fff',
          }}>🍕</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1A1D26' }}>Menu Maestro</h1>
          <p style={{ color: '#8892A4', fontSize: '0.9rem', marginTop: '4px' }}>Acesse seu painel administrativo</p>
        </div>

        <div style={{
          background: '#FFFFFF', borderRadius: '16px', padding: '32px',
          border: '1px solid #E8ECF4', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Email</label>
              <input
                ref={emailRef}
                type="email"
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '12px 16px', fontSize: '16px',
                  border: '1px solid #E5E7EB', borderRadius: '10px',
                  background: '#F9FAFB', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box' as const,
                }}
                required
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' as const, letterSpacing: '1px' }}>Senha</label>
              <input
                ref={passwordRef}
                type="password"
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 16px', fontSize: '16px',
                  border: '1px solid #E5E7EB', borderRadius: '10px',
                  background: '#F9FAFB', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box' as const,
                }}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <div style={{ background: '#FEE2E2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: 'linear-gradient(135deg, #EC4899, #F59E0B)',
                color: '#fff', border: 'none', borderRadius: '10px',
                fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "24px", color: "#8892A4", fontSize: "0.9rem" }}>Nao tem conta? <Link to="/signup" style={{ color: "#EC4899", fontWeight: 600, textDecoration: "none" }}>Cadastre-se gratis</Link></p>
      </div>
    </div>
  );
};

export default Login;
