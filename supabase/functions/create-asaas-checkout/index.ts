import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      tenant_id, items, customer_name, customer_phone, customer_email,
      delivery_address, delivery_neighborhood, delivery_city, delivery_notes,
      delivery_fee, discount, coupon_code, coupon_id, session_id,
      utm_source, utm_medium, utm_campaign, utm_term, utm_content, utm_ad_link,
    } = body;

    if (!tenant_id || !items?.length || !customer_name || !customer_phone) {
      return new Response(JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get tenant config
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("asaas_api_key, name")
      .eq("id", tenant_id)
      .single();

    if (!tenant?.asaas_api_key) {
      return new Response(JSON.stringify({ error: "Asaas nao configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const asaasHeaders = {
      "Content-Type": "application/json",
      "access_token": tenant.asaas_api_key,
    };

    const subtotal = items.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    const orderTotal = subtotal - (discount || 0) + (delivery_fee || 0);

    // Create order first
    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        tenant_id, customer_name, customer_phone,
        customer_email: customer_email || null,
        delivery_address: delivery_address || null,
        delivery_neighborhood: delivery_neighborhood || null,
        delivery_city: delivery_city || null,
        delivery_notes: delivery_notes || null,
        delivery_fee: delivery_fee || 0,
        subtotal, discount: discount || 0,
        coupon_code: coupon_code || null, coupon_id: coupon_id || null,
        total: orderTotal,
        payment_method: "online", payment_status: "pending", status: "new",
        session_id: session_id || null,
        utm_source: utm_source || null, utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null, utm_term: utm_term || null,
        utm_content: utm_content || null, utm_ad_link: utm_ad_link || null,
      })
      .select("id, order_number")
      .single();

    if (orderError) {
      console.error("Order error:", orderError);
      return new Response(JSON.stringify({ error: "Erro ao criar pedido" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id, tenant_id,
      product_name: item.name, unit_price: item.price,
      quantity: item.quantity, total: item.price * item.quantity,
    }));
    await supabaseAdmin.from("order_items").insert(orderItems);

    // Upsert customer
    const now = new Date().toISOString();
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id, total_orders, total_spent")
      .eq("tenant_id", tenant_id)
      .eq("phone", customer_phone)
      .maybeSingle();

    if (existingCustomer) {
      const newTotalOrders = (existingCustomer.total_orders || 0) + 1;
      const newTotalSpent = (existingCustomer.total_spent || 0) + orderTotal;
      await supabaseAdmin.from("customers").update({
        name: customer_name, email: customer_email || null,
        address: delivery_address || null, neighborhood: delivery_neighborhood || null,
        city: delivery_city || null,
        total_orders: newTotalOrders, total_spent: newTotalSpent,
        avg_ticket: newTotalSpent / newTotalOrders, last_order_at: now,
      }).eq("id", existingCustomer.id);
    } else {
      await supabaseAdmin.from("customers").insert({
        tenant_id, name: customer_name, phone: customer_phone,
        email: customer_email || null, address: delivery_address || null,
        neighborhood: delivery_neighborhood || null, city: delivery_city || null,
        total_orders: 1, total_spent: orderTotal, avg_ticket: orderTotal,
        first_order_at: now, last_order_at: now,
        loyalty_points: 0, loyalty_tier: "bronze", tags: [],
      });
    }

    // Create/find Asaas customer
    const customerPayload: any = { name: customer_name };
    if (customer_email) customerPayload.email = customer_email;
    if (customer_phone) customerPayload.mobilePhone = customer_phone.replace(/\D/g, "");
    customerPayload.externalReference = `${tenant_id}_${customer_phone}`;

    // Try to find existing customer first
    const findRes = await fetch(
      `https://api.asaas.com/v3/customers?externalReference=${customerPayload.externalReference}`,
      { headers: asaasHeaders }
    );
    const findData = await findRes.json();
    let asaasCustomerId: string;

    if (findData.data && findData.data.length > 0) {
      asaasCustomerId = findData.data[0].id;
    } else {
      customerPayload.cpfCnpj = "00000000000";
      const createRes = await fetch("https://api.asaas.com/v3/customers", {
        method: "POST", headers: asaasHeaders, body: JSON.stringify(customerPayload),
      });
      const createData = await createRes.json();
      if (createData.errors) {
        console.error("Asaas customer error:", createData.errors);
        asaasCustomerId = "";
      } else {
        asaasCustomerId = createData.id;
      }
    }

    // Create Asaas payment
    const today = new Date().toISOString().split("T")[0];

    const paymentPayload: any = {
      customer: asaasCustomerId,
      billingType: "UNDEFINED",
      value: orderTotal,
      dueDate: today,
      description: `Pedido #${order.order_number} - ${tenant.name || "Delivery"}`,
      externalReference: order.id,
    };

    const payRes = await fetch("https://api.asaas.com/v3/payments", {
      method: "POST", headers: asaasHeaders, body: JSON.stringify(paymentPayload),
    });
    const payData = await payRes.json();

    if (payData.errors) {
      console.error("Asaas payment error:", payData.errors);
      return new Response(JSON.stringify({ error: "Erro ao criar cobranca no Asaas" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update order with Asaas payment ID
    await supabaseAdmin.from("orders").update({
      asaas_payment_id: payData.id,
    }).eq("id", order.id);

    return new Response(JSON.stringify({
      invoiceUrl: payData.invoiceUrl,
      order_id: order.id,
      order_number: order.order_number,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Asaas checkout error:", error);
    return new Response(JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
