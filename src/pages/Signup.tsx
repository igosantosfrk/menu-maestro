import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    restaurantName: "",
    phone: "",
  });

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar conta");

      const userId = authData.user.id;
      const slug = generateSlug(form.restaurantName);

      // 2. Get free plan
      const { data: freePlan } = await supabase
        .from("plans")
        .select("id")
        .eq("slug", "free")
        .single();

      // 3. Create tenant
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          name: form.restaurantName,
          slug,
          phone: form.phone,
          plan_id: freePlan?.id || null,
          trial_ends_at: trialEnd.toISOString(),
          onboarding_completed: false,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // 4. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        user_id: userId,
        tenant_id: tenant.id,
        full_name: form.fullName,
        phone: form.phone,
      });
      if (profileError) throw profileError;

      // 5. Assign tenant_admin role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: "tenant_admin",
      });
      if (roleError) console.error("Role assignment error:", roleError);

      // 6. Redirect to onboarding
      navigate("/admin/onboarding");
    } catch (err: any) {
      console.error("Signup error:", err);
      if (err.message?.includes("already registered")) {
        setError("Este email já está cadastrado");
      } else {
        setError(err.message || "Erro ao criar conta");
      }
    } finally {
      setLoading(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#6B7280",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    fontSize: "16px",
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    background: "#F9FAFB",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8F9FC",
        fontFamily: "Inter, sans-serif",
        padding: "32px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #EC4899, #F59E0B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "24px",
              color: "#fff",
            }}
          >
            {"\ud83c\udf55"}
          </div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1A1D26" }}>
            Menu Maestro
          </h1>
          <p
            style={{ color: "#8892A4", fontSize: "0.9rem", marginTop: "4px" }}
          >
            Crie sua conta e comece a vender
          </p>
        </div>

        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "32px",
            border: "1px solid #E8ECF4",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Nome completo</label>
              <input
                name="fullName"
                type="text"
                placeholder="Seu nome"
                value={form.fullName}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Email</label>
              <input
                name="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={handleChange}
                style={inputStyle}
                required
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Senha</label>
              <input
                name="password"
                type="password"
                placeholder="Min. 6 caracteres"
                value={form.password}
                onChange={handleChange}
                style={inputStyle}
                required
                autoComplete="new-password"
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Confirmar senha</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={handleChange}
                style={inputStyle}
                required
                autoComplete="new-password"
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Nome do restaurante</label>
              <input
                name="restaurantName"
                type="text"
                placeholder="Ex: Pizzaria do Joao"
                value={form.restaurantName}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>Telefone</label>
              <input
                name="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={form.phone}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#FEE2E2",
                  color: "#DC2626",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #EC4899, #F59E0B)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                fontFamily: "inherit",
              }}
            >
              {loading ? "Criando conta..." : "Criar conta gratis"}
            </button>
          </form>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "24px",
            color: "#8892A4",
            fontSize: "0.9rem",
          }}
        >
          Ja tem conta?{" "}
          <Link
            to="/login"
            style={{ color: "#EC4899", fontWeight: 600, textDecoration: "none" }}
          >
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
