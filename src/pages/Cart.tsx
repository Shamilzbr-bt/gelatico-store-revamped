import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from "sonner";
import { useCart } from '@/hooks/useCart';
import CartItemList from '@/components/cart/CartItemList';
import OrderSummary from '@/components/cart/OrderSummary';
import EmptyCart from '@/components/cart/EmptyCart';
import { checkoutService } from '@/services/checkout';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from '@/hooks/useAuth';
import { ShoppingBag } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function Cart() {
  const { 
    cartItems, 
    setCartItems,
    updateQuantity, 
    removeItem, 
    clearCart, 
    calculateSubtotal 
  } = useCart();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    
    setIsCheckingOut(true);
    setCheckoutError(null);
    
    try {
      // Process the checkout locally
      const response = await checkoutService.processCheckout(cartItems);
      
      if (response.success) {
        toast.success("Order processed successfully!");
        
        // Clear the cart after successful checkout
        clearCart();
        
        // Navigate to success page with order details
        navigate(`/checkout-success?orderId=${response.orderId}`);
      } else {
        setCheckoutError(response.error || "There was a problem processing your order");
        toast.error(response.error || "There was a problem processing your order");
      }
    } catch (error) {
      console.error('Error processing checkout:', error);
      const errorMessage = error instanceof Error ? error.message : "There was a problem processing your order. Please try again.";
      setCheckoutError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCheckingOut(false);
    }
  };
  
  const subtotal = calculateSubtotal();
  const shippingFee = subtotal >= 15 ? 0 : 2;
  const total = subtotal + shippingFee;

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="page-container pt-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1 mb-4 rounded-full bg-gelatico-baby-pink/30 text-gelatico-pink text-sm font-medium uppercase tracking-wider">
            Your Cart
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-gelatico mb-6">
            Shopping Cart
          </h1>
        </motion.div>
        
        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            <CartItemList 
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeItem={removeItem}
              clearCart={clearCart}
            />
            
            <OrderSummary 
              subtotal={subtotal}
              shippingFee={shippingFee}
              total={total}
              handleCheckout={handleCheckout}
              isCheckingOut={isCheckingOut}
              cartItemsEmpty={cartItems.length === 0}
            />
          </motion.div>
        )}
        
        {/* View Orders Button (for logged in users) */}
        {user && !cartItems.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-8"
          >
            <Button 
              variant="outline" 
              onClick={() => navigate('/orders')}
              className="px-6"
            >
              <ShoppingBag size={16} className="mr-2" />
              View My Orders
            </Button>
          </motion.div>
        )}
      </div>
      
      {/* Error Dialog */}
      <Dialog open={!!checkoutError} onOpenChange={() => setCheckoutError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-500">Checkout Error</DialogTitle>
            <DialogDescription>
              {checkoutError}
              <div className="mt-4">
                Please try again or contact customer support if the problem persists.
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
