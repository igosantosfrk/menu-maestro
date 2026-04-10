import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { event, payment } = body;

    if (!payment?.externalReference) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const orderId = payment.externalReference;

    switch (event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED": {
        await supabaseAdmin.from("orders").update({
          payment_status: "paid",
        }).eq("id", orderId);
        console.log(`Order ${orderId} marked as paid via Asaas`);
        break;
      }
      case "PAYMENT_OVERDUE":
      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED": {
        await supabaseAdmin.from("orders").update({
          payment_status: "failed",
        }).eq("id", orderId);
        console.log(`Order ${orderId} payment failed/refunded via Asaas`);
        break;
      }
      default:
        console.log(`Asaas webhook: unhandled event ${event}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Asaas webhook error:", err);
    return new Response(JSON.stringify({ error: "Webhook processing error" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
});
