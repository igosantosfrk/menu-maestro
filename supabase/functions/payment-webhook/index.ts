import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const gateway = url.searchParams.get("gateway");
    const tenantIdParam = url.searchParams.get("tenant_id");
    const body = await req.text();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    switch (gateway) {
      // ─── Asaas ───
      case "asaas": {
        const data = JSON.parse(body);
        const { event, payment } = data;
        if (!payment?.externalReference) break;

        if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") {
          await supabaseAdmin.from("orders").update({ payment_status: "paid" })
            .eq("id", payment.externalReference);
          console.log(`[asaas] Order ${payment.externalReference} paid`);
        } else if (event === "PAYMENT_OVERDUE" || event === "PAYMENT_DELETED" || event === "PAYMENT_REFUNDED") {
          await supabaseAdmin.from("orders").update({ payment_status: "failed" })
            .eq("id", payment.externalReference);
          console.log(`[asaas] Order ${payment.externalReference} failed/refunded`);
        }
        break;
      }

      // ─── Mercado Pago ───
      case "mercadopago": {
        const data = JSON.parse(body);
        if (data.type === "payment" && data.data?.id) {
          // Fetch payment details from MP to get external_reference (our order_id)
          // We need the tenant's access token - get it from tenant_id param
          if (!tenantIdParam) {
            console.error("[mercadopago] Missing tenant_id param");
            break;
          }

          const { data: tenant } = await supabaseAdmin
            .from("tenants")
            .select("mercadopago_access_token")
            .eq("id", tenantIdParam)
            .single();

          if (!tenant?.mercadopago_access_token) {
            console.error("[mercadopago] No access token for tenant");
            break;
          }

          const paymentRes = await fetch(
            `https://api.mercadopago.com/v1/payments/${data.data.id}`,
            { headers: { Authorization: `Bearer ${tenant.mercadopago_access_token}` } }
          );
          const paymentData = await paymentRes.json();

          if (paymentData.external_reference) {
            const orderId = paymentData.external_reference;
            const status = paymentData.status;

            if (status === "approved") {
              await supabaseAdmin.from("orders").update({ payment_status: "paid" }).eq("id", orderId);
              console.log(`[mercadopago] Order ${orderId} paid`);
            } else if (status === "rejected" || status === "cancelled") {
              await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
              console.log(`[mercadopago] Order ${orderId} failed`);
            }
            // pending/in_process - keep as pending
          }
        }
        break;
      }

      // ─── PagSeguro ───
      case "pagseguro": {
        const data = JSON.parse(body);
        // PagSeguro v4 webhook sends charges array
        const charges = data.charges || [];
        const referenceId = data.reference_id;

        if (referenceId) {
          const allPaid = charges.length > 0 && charges.every((c: any) => c.status === "PAID");
          const anyFailed = charges.some((c: any) => c.status === "DECLINED" || c.status === "CANCELED");

          if (allPaid) {
            await supabaseAdmin.from("orders").update({ payment_status: "paid" }).eq("id", referenceId);
            console.log(`[pagseguro] Order ${referenceId} paid`);
          } else if (anyFailed) {
            await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", referenceId);
            console.log(`[pagseguro] Order ${referenceId} failed`);
          }
        }
        break;
      }

      // ─── Pagar.me ───
      case "pagarme": {
        const data = JSON.parse(body);
        // Pagar.me v5 webhook: data.type = "order.paid", "order.payment_failed", etc.
        const eventType = data.type || "";
        const orderId = data.data?.metadata?.order_id || data.data?.code;

        if (orderId) {
          if (eventType === "order.paid") {
            await supabaseAdmin.from("orders").update({ payment_status: "paid" }).eq("id", orderId);
            console.log(`[pagarme] Order ${orderId} paid`);
          } else if (eventType === "order.payment_failed" || eventType === "order.canceled") {
            await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", orderId);
            console.log(`[pagarme] Order ${orderId} failed`);
          }
        }
        break;
      }

      default:
        console.log(`[payment-webhook] Unknown gateway: ${gateway}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Payment webhook error:", err);
    return new Response(JSON.stringify({ error: "Webhook processing error" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
