
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { type, orderId } = await req.json();
    
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    console.log(`Processing ${type} email for order: ${orderId}`);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, profiles(*)')
      .eq('id', orderId)
      .single();

    if (orderError) {
      throw new Error(`Error fetching order: ${orderError.message}`);
    }

    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // In a production app, you would send a real email here using a service like SendGrid, Mailgun, etc.
    // For this demo, we'll just log the email content
    console.log(`Sending ${type} email for order ${orderId}`);

    let emailSubject = '';
    let emailContent = '';

    switch (type) {
      case 'confirmation':
        emailSubject = `Order Confirmed #${orderId}`;
        emailContent = `Thank you for your order! Your order #${orderId} has been received and is being processed.`;
        break;
      case 'shipped':
        emailSubject = `Order Shipped #${orderId}`;
        emailContent = `Good news! Your order #${orderId} has been shipped and is on its way.`;
        break;
      case 'delivered':
        emailSubject = `Order Delivered #${orderId}`;
        emailContent = `Your order #${orderId} has been delivered. Enjoy!`;
        break;
      case 'cancelled':
        emailSubject = `Order Cancelled #${orderId}`;
        emailContent = `Your order #${orderId} has been cancelled. If you didn't request this, please contact us.`;
        break;
      default:
        emailSubject = `Order Update #${orderId}`;
        emailContent = `Your order #${orderId} has been updated.`;
    }

    // Update the order with notification sent status
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
        updated_at: new Date().toISOString(),
        last_notification_sent: type
      })
      .eq('id', orderId);

    if (updateError) {
      throw new Error(`Error updating order notification status: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${type} email sent for order ${orderId}`,
        emailSubject,
        emailContent,
        recipient: order.profiles?.email || 'customer'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
