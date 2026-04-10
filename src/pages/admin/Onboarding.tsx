import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Plan { id: string; name: string; slug: string; price: number; max_orders_month: number | null; max_products: number | null; features: string[]; }

const STEPS = ["Seu Restaurante", "Endereco", "Entrega", "Escolha seu Plano", "Pronto!"];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, tenantId, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", phone: "", address: "", neighborhood: "", city: "", state: "", delivery_fee: "0", min_order_value: "0", estimated_delivery_time: "40", free_delivery: false, plan_id: "" });

  useEffect(() => { if (!user) { navigate("/login"); return; } loadTenantData(); loadPlans(); }, [user]);

  const loadTenantData = async () => { if (!tenantId) return; const { data } = await supabase.from("tenants").select("*").eq("id", tenantId).single(); if (data) { setForm((prev) => ({ ...prev, name: data.name || "", slug: data.slug || "", phone: data.phone || "", description: data.description || "", address: data.address || "", delivery_fee: String(data.delivery_fee || 0), min_order_value: String(data.min_order_value || 0), plan_id: data.plan_id || "" })); } };
  const loadPlans = async () => { const { data } = await supabase.from("plans").select("*").eq("is_active", true).order("price"); if (data) setPlans(data as Plan[]); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => { const target = e.target; const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value; setForm((prev) => ({ ...prev, [target.name]: value })); };
  const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => { const name = e.target.value; setForm((prev) => ({ ...prev, name, slug: generateSlug(name) })); };

  const saveProgress = async () => { if (!tenantId) return; setSaving(true); try { const u: any = { name: form.name, slug: form.slug, description: form.description, phone: form.phone, address: form.address, delivery_fee: parseFloat(form.delivery_fee) || 0, min_order_value: parseFloat(form.min_order_value) || 0 }; if (form.plan_id) u.plan_id = form.plan_id; await supabase.from("tenants").update(u).eq("id", tenantId); } catch (err) { console.error("Save error:", err); } finally { setSaving(false); } };

  const handleNext = async () => { if (step < STEPS.length - 2) { await saveProgress(); setStep((s) => s + 1); } else if (step === STEPS.length - 2) { setSaving(true); try { const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 14); const u: any = { name: form.name, slug: form.slug, description: form.description, phone: form.phone, address: form.address, delivery_fee: parseFloat(form.delivery_fee) || 0, min_order_value: parseFloat(form.min_order_value) || 0, onboarding_completed: true }; if (form.plan_id) { u.plan_id = form.plan_id; const sp = plans.find((p) => p.id === form.plan_id); if (sp && sp.slug !== "free") { u.trial_ends_at = trialEnd.toISOString(); } } await supabase.from("tenants").update(u).eq("id", tenantId); await refreshProfile(); setStep((s) => s + 1); setShowConfetti(true); } catch (err) { console.error("Complete error:", err); } finally { setSaving(false); } } };
  const handleBack = () => { if (step > 0) setStep((s) => s - 1); };

  const ls: React.CSSProperties = { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#6B7280", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" };
  const is: React.CSSProperties = { width: "100%", padding: "12px 16px", fontSize: "16px", border: "1px solid #E5E7EB", borderRadius: "10px", background: "#F9FAFB", outline: "none", fontFamily: "inherit", boxSizing: "border-box" };
  const fg: React.CSSProperties = { marginBottom: "16px" };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (<>
          <div style={fg}><label style={ls}>Nome do restaurante</label><input name="name" value={form.name} onChange={handleNameChange} style={is} placeholder="Ex: Pizzaria do Joao" required /></div>
          <div style={fg}><label style={ls}>URL do cardapio</label><div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: "10px", background: "#F9FAFB", overflow: "hidden" }}><span style={{ padding: "12px", color: "#9CA3AF", fontSize: "14px", whiteSpace: "nowrap", borderRight: "1px solid #E5E7EB", background: "#F3F4F6" }}>menu-maestro.com/</span><input name="slug" value={form.slug} onChange={handleChange} style={{ ...is, border: "none", borderRadius: 0 }} placeholder="meu-restaurante" /></div></div>
          <div style={fg}><label style={ls}>Descricao curta</label><textarea name="description" value={form.description} onChange={handleChange} style={{ ...is, minHeight: "80px", resize: "vertical" } as any} placeholder="Conte um pouco sobre seu restaurante..." /></div>
          <div style={fg}><label style={ls}>Telefone</label><input name="phone" value={form.phone} onChange={handleChange} style={is} placeholder="(11) 99999-9999" /></div>
        </>);
      case 1:
        return (<>
          <div style={fg}><label style={ls}>Endereco completo</label><input name="address" value={form.address} onChange={handleChange} style={is} placeholder="Rua, numero" /></div>
          <div style={fg}><label style={ls}>Bairro</label><input name="neighborhood" value={form.neighborhood} onChange={handleChange} style={is} placeholder="Bairro" /></div>
          <div style={{ display: "flex", gap: "12px" }}><div style={{ ...fg, flex: 1 }}><label style={ls}>Cidade</label><input name="city" value={form.city} onChange={handleChange} style={is} placeholder="Cidade" /></div><div style={{ ...fg, width: "100px" }}><label style={ls}>Estado</label><input name="state" value={form.state} onChange={handleChange} style={is} placeholder="UF" maxLength={2} /></div></div>
        </>);
      case 2:
        return (<>
          <div style={{ display: "flex", gap: "12px" }}><div style={{ ...fg, flex: 1 }}><label style={ls}>Taxa de entrega (R$)</label><input name="delivery_fee" type="number" step="0.01" value={form.delivery_fee} onChange={handleChange} style={is} placeholder="0.00" /></div><div style={{ ...fg, flex: 1 }}><label style={ls}>Pedido minimo (R$)</label><input name="min_order_value" type="number" step="0.01" value={form.min_order_value} onChange={handleChange} style={is} placeholder="0.00" /></div></div>
          <div style={fg}><label style={ls}>Tempo estimado de entrega (min)</label><input name="estimated_delivery_time" type="number" value={form.estimated_delivery_time} onChange={handleChange} style={is} placeholder="40" /></div>
          <div style={{ ...fg, display: "flex", alignItems: "center", gap: "12px" }}><div onClick={() => setForm((prev) => ({ ...prev, free_delivery: !prev.free_delivery }))} style={{ width: "48px", height: "26px", borderRadius: "13px", background: form.free_delivery ? "#10B981" : "#D1D5DB", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}><div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "#fff", position: "absolute", top: "3px", left: form.free_delivery ? "25px" : "3px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} /></div><span style={{ fontSize: "0.9rem", color: "#374151" }}>Entrega gratis</span></div>
        </>);
      case 3:
        return (<div style={{ display: "grid", gap: "16px" }}>{plans.map((plan) => { const isSel = form.plan_id === plan.id; const isPro = plan.slug === "pro"; return (<div key={plan.id} onClick={() => setForm((prev) => ({ ...prev, plan_id: plan.id }))} style={{ border: isSel ? "2px solid #EC4899" : "1px solid #E5E7EB", borderRadius: "12px", padding: "20px", cursor: "pointer", background: isSel ? "#FFF5F7" : "#FFFFFF", position: "relative", transition: "all 0.2s" }}>
                  {isPro && <span style={{ position: "absolute", top: "-10px", right: "16px", background: "linear-gradient(135deg, #EC4899, #F59E0B)", color: "#fff", fontSize: "0.7rem", fontWeight: 700, padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Recomendado</span>}
                  {plan.slug !== "free" && <span style={{ position: "absolute", top: "-10px", left: "16px", background: "#DBEAFE", color: "#3B82F6", fontSize: "0.7rem", fontWeight: 600, padding: "4px 10px", borderRadius: "20px" }}>14 dias gratis</span>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}><h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1A1D26", margin: 0 }}>{plan.name}</h3><div style={{ textAlign: "right" }}><span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1A1D26" }}>{plan.price === 0 ? "Gratis" : `R$ ${plan.price.toFixed(2).replace(".", ",")}`}</span>{plan.price > 0 && <span style={{ fontSize: "0.8rem", color: "#9CA3AF" }}>/mes</span>}</div></div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>{(plan.features || []).map((feat: string, i: number) => (<span key={i} style={{ fontSize: "0.75rem", background: "#F3F4F6", color: "#6B7280", padding: "4px 10px", borderRadius: "6px" }}>{feat}</span>))}</div>
                  {isSel && <div style={{ position: "absolute", top: "16px", right: "16px", width: "24px", height: "24px", borderRadius: "50%", background: "#EC4899", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700 }}>{"\u2713"}</div>}
                </div>); })}</div>);
      case 4:
        return (<div style={{ textAlign: "center", padding: "20px 0" }}>
          {showConfetti && <div style={{ fontSize: "4rem", marginBottom: "20px" }}>{"\ud83c\udf89"}</div>}
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1A1D26", marginBottom: "8px" }}>Tudo pronto!</h2>
          <p style={{ color: "#8892A4", fontSize: "0.95rem", marginBottom: "24px" }}>Seu cardapio esta no ar em:</p>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "12px 20px", marginBottom: "32px", display: "inline-block" }}><span style={{ color: "#16A34A", fontWeight: 700, fontSize: "1rem" }}>{window.location.origin}/{form.slug}</span></div>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button onClick={() => navigate("/admin")} style={{ padding: "14px 28px", background: "linear-gradient(135deg, #EC4899, #F59E0B)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Ir para o Painel</button>
            <button onClick={() => navigate("/admin/products")} style={{ padding: "14px 28px", background: "#FFFFFF", color: "#374151", border: "1px solid #E5E7EB", borderRadius: "10px", fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Adicionar Produtos</button>
          </div></div>);
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8F9FC", fontFamily: "'Inter', sans-serif", padding: "32px" }}>
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "14px", background: "linear-gradient(135deg, #EC4899, #F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "24px", color: "#fff" }}>{"\ud83c\udf55"}</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1A1D26", marginBottom: "4px" }}>Configure seu restaurante</h1>
          <p style={{ color: "#8892A4", fontSize: "0.9rem" }}>{step < STEPS.length - 1 ? `Passo ${step + 1} de ${STEPS.length - 1}` : "Configuracao completa"}</p>
        </div>
        {step < STEPS.length - 1 && (<div style={{ display: "flex", gap: "6px", marginBottom: "32px" }}>{STEPS.slice(0, -1).map((_, i) => (<div key={i} style={{ flex: 1, height: "4px", borderRadius: "2px", background: i <= step ? "linear-gradient(135deg, #EC4899, #F59E0B)" : "#E5E7EB", transition: "background 0.3s" }} />))}</div>)}
        <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "32px", border: "1px solid #E8ECF4", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {step < STEPS.length - 1 && <h2 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#1A1D26", marginBottom: "24px", marginTop: 0 }}>{STEPS[step]}</h2>}
          {renderStep()}
          {step < STEPS.length - 1 && (<div style={{ display: "flex", justifyContent: "space-between", marginTop: "28px" }}>
            {step > 0 ? (<button onClick={handleBack} style={{ padding: "12px 24px", background: "#FFFFFF", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Voltar</button>) : <div />}
            <button onClick={handleNext} disabled={saving} style={{ padding: "12px 28px", background: "linear-gradient(135deg, #EC4899, #F59E0B)", color: "#fff", border: "none", borderRadius: "10px", fontSize: "0.95rem", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>{saving ? "Salvando..." : step === STEPS.length - 2 ? "Concluir" : "Proximo"}</button>
          </div>)}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
