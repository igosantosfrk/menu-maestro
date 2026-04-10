import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

const emailTemplates: Record<string, { subject: string; heading: string; message: string; color: string }> = {
  confirmed: { subject: "Pedido #{order_number} confirmado!", heading: "Pedido Confirmado!", message: "Seu pedido foi recebido e confirmado. Em breve comecaremos a preparar.", color: "#10B981" },
  preparing: { subject: "Pedido #{order_number} em preparo", heading: "Estamos Preparando!", message: "Seu pedido esta sendo preparado com carinho.", color: "#F59E0B" },
  out_for_delivery: { subject: "Pedido #{order_number} saiu para entrega!", heading: "Saiu para Entrega!", message: "Seu pedido esta a caminho! Fique atento.", color: "#3B82F6" },
  completed: { subject: "Pedido #{order_number} entregue!", heading: "Pedido Entregue!", message: "Seu pedido foi entregue. Bom apetite!", color: "#059669" },
  cancelled: { subject: "Pedido #{order_number} cancelado", heading: "Pedido Cancelado", message: "Infelizmente seu pedido foi cancelado.", color: "#EF4444" },
};

function buildHtml(template: typeof emailTemplates.confirmed, order: any, restaurantName: string) {
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;margin:0;padding:0;background:#f8f9fc">
<div style="max-width:500px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
<div style="background:${template.color};padding:32px;text-align:center">
<h1 style="color:#fff;margin:0;font-size:24px">${template.heading}</h1>
</div>
<div style="padding:32px">
<p style="color:#374151;font-size:16px;margin:0 0 16px">${template.message}</p>
<div style="background:#f3f4f6;border-radius:12px;padding:20px;margin:20px 0">
<p style="margin:0 0 8px;font-size:14px;color:#6b7280">Pedido <strong style="color:${template.color}">#${order.order_number}</strong></p>
<p style="margin:0 0 4px;font-size:14px;color:#374151"><strong>${order.customer_name}</strong></p>
<p style="margin:0;font-size:20px;font-weight:800;color:#1a1d26">R$ ${Number(order.total).toFixed(2)}</p>
</div>
<p style="text-align:center;color:#9ca3af;font-size:12px;margin:24px 0 0">${restaurantName}</p>
</div></div></body></html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, order_id, event_type } = await req.json();
    if (!tenant_id || !order_id || !event_type) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: tenant } = await supabaseAdmin.from("tenants").select("smtp_pass, smtp_from_email, smtp_from_name, email_notifications_enabled, name").eq("id", tenant_id).single();
    if (!tenant?.email_notifications_enabled || !tenant?.smtp_pass) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: order } = await supabaseAdmin.from("orders").select("*").eq("id", order_id).single();
    if (!order?.customer_email) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const template = emailTemplates[event_type];
    if (!template) return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const subject = template.subject.replace("{order_number}", order.order_number);
    const html = buildHtml(template, order, tenant.name || "Restaurante");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tenant.smtp_pass}` },
      body: JSON.stringify({
        from: `${tenant.smtp_from_name || tenant.name} <${tenant.smtp_from_email || "noreply@resend.dev"}>`,
        to: [order.customer_email],
        subject,
        html,
      }),
    });

    const result = await res.json();
    return new Response(JSON.stringify({ sent: true, result }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Email error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
