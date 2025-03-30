
import { toast } from "sonner";
import { CartItem } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";

export interface CheckoutAddress {
  first_name?: string;
  last_name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
}

export interface CheckoutOptions {
  email?: string;
  address?: CheckoutAddress;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export const checkoutService = {
  /**
   * Process checkout locally and store order in database if user is authenticated
   */
  async processCheckout(items: CartItem[], options: CheckoutOptions = {}): Promise<{
    success: boolean;
    orderId?: string;
    totalAmount?: number;
    orderSummary?: any;
    message?: string;
    error?: string;
  }> {
    try {
      // Validate cart has items
      if (!items || !items.length) {
        throw new Error('Cannot create checkout with empty cart');
      }

      // Log checkout details for debugging
      console.log('Processing checkout with items:', items);
      console.log('Checkout options:', options);

      // Get current user (if authenticated)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      // Simulate processing time (this would be actual payment processing in production)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => {
        const price = item.price ? parseFloat(item.price) : 0;
        return sum + (price * item.quantity);
      }, 0);

      console.log(`Total order amount: ${totalAmount}`);
      
      // Generate a formatted order summary
      const orderSummary = items.map(item => {
        return {
          title: item.title || 'Unknown product',
          quantity: item.quantity,
          price: item.price || "0",
          container: item.customizations?.container?.name,
          toppings: item.customizations?.toppingNames,
          total: (parseFloat(item.price || "0") * item.quantity).toFixed(3)
        };
      });
      
      console.log('Order summary:', orderSummary);
      
      // Generate a unique order ID
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let dbOrderId = null;
      
      // If the user is logged in, store the order in the database
      if (userId) {
        try {
          // Convert the CheckoutAddress to a plain object that Supabase can store as JSON
          const deliveryAddressJson = options.address ? { ...options.address } : null;
          
          const { data, error } = await supabase
            .from('orders')
            .insert({
              user_id: userId,
              total_amount: totalAmount,
              items: orderSummary,
              status: 'pending',
              delivery_address: deliveryAddressJson,
              special_instructions: ''
            })
            .select()
            .single();
          
          if (error) {
            console.error('Error saving order to database:', error);
            // Continue with checkout even if database storage fails
          } else {
            console.log('Order successfully saved to database:', data);
            dbOrderId = data.id;
            
            // Send confirmation email
            this.sendOrderNotification(data.id, 'confirmation')
              .catch(err => console.error('Failed to send confirmation email:', err));
          }
        } catch (dbError) {
          console.error('Error storing order in database:', dbError);
          // Continue with checkout even if database storage fails
        }
      }
      
      return {
        success: true,
        orderId: dbOrderId || orderId,
        totalAmount,
        orderSummary,
        message: 'Order processed successfully'
      };
    } catch (error) {
      console.error('Error processing checkout:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  },

  /**
   * Get a list of orders for the current user
   */
  async getUserOrders() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return { success: true, orders: data };
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        orders: []
      };
    }
  },

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: string) {
    try {
      // Get current user (if authenticated)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (error) {
        throw error;
      }
      
      // Verify order belongs to user (unless admin)
      const isAdmin = await this.isUserAdmin(session.user.id);
      
      if (!isAdmin && data.user_id !== session.user.id) {
        throw new Error('You do not have permission to view this order');
      }
      
      return { success: true, order: data };
    } catch (error) {
      console.error('Error fetching order:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus) {
    try {
      // Get current user (if authenticated)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      
      // Check if user is admin
      const isAdmin = await this.isUserAdmin(session.user.id);
      
      if (!isAdmin) {
        throw new Error('You do not have permission to update order status');
      }
      
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
        
      if (error) {
        throw error;
      }
      
      // Send notification email based on status
      await this.sendOrderNotification(orderId, status);
      
      return { success: true, order: data };
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get all orders (admin only)
   */
  async getAllOrders() {
    try {
      // Get current user (if authenticated)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }
      
      // Check if user is admin
      const isAdmin = await this.isUserAdmin(session.user.id);
      
      if (!isAdmin) {
        throw new Error('You do not have permission to view all orders');
      }
      
      const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(first_name, last_name, email)')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return { success: true, orders: data };
    } catch (error) {
      console.error('Error fetching all orders:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        orders: []
      };
    }
  },

  /**
   * Check if a user is an admin
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_role', { 
        user_id: userId, 
        role: 'admin'
      });

      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking if user is admin:', error);
      return false;
    }
  },

  /**
   * Send order notification email
   */
  async sendOrderNotification(orderId: string, type: OrderStatus | 'confirmation') {
    try {
      const response = await fetch(`${supabase.functions.url}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          orderId,
          type
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send notification');
      }

      const result = await response.json();
      console.log('Notification sent:', result);
      return { success: true };
    } catch (error) {
      console.error('Error sending order notification:', error);
      return { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};
