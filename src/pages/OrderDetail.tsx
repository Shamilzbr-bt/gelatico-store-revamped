
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  ArrowLeft, 
  Package, 
  Clock, 
  ShoppingBag, 
  AlertCircle, 
  MapPin,
  Calendar,
  User
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkoutService } from '@/services/checkout';
import { formatDate } from '@/utils/formatters';

export default function OrderDetail() {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (!orderId) {
        navigate('/orders');
        return;
      }

      setIsLoading(true);
      const { success, order, error } = await checkoutService.getOrderById(orderId);
      
      if (success && order) {
        setOrder(order);
      } else {
        toast.error(error || 'Failed to load order details');
        navigate('/orders');
      }
      
      setIsLoading(false);
    };

    fetchOrderDetails();
  }, [orderId, user, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={18} />;
      case 'processing': return <Loader2 size={18} className="animate-spin" />;
      case 'shipped': return <Package size={18} />;
      case 'delivered': return <ShoppingBag size={18} />;
      case 'cancelled': return <AlertCircle size={18} />;
      default: return <Clock size={18} />;
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    
    const parts = [];
    if (address.first_name || address.last_name) {
      parts.push(`${address.first_name || ''} ${address.last_name || ''}`.trim());
    }
    if (address.address1) parts.push(address.address1);
    if (address.address2) parts.push(address.address2);
    if (address.city || address.province || address.zip) {
      parts.push(`${address.city || ''}, ${address.province || ''} ${address.zip || ''}`.trim());
    }
    if (address.country) parts.push(address.country);
    
    return parts.join(', ') || 'No address provided';
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="page-container pt-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
        >
          <div>
            <Link to="/orders" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft size={14} className="mr-1" />
              Back to Orders
            </Link>
            <h1 className="text-3xl font-bold">
              Order Details
            </h1>
          </div>
          {order && (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-1.5 capitalize">{order.status}</span>
            </div>
          )}
        </motion.div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gelatico-pink" />
            <span className="ml-2 text-lg">Loading order details...</span>
          </div>
        ) : !order ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-8">
              We couldn't find the order you're looking for.
            </p>
            <Button 
              onClick={() => navigate('/orders')}
              variant="default"
            >
              View All Orders
            </Button>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Order Info */}
              <div className="md:col-span-2 space-y-8">
                <div className="bg-white p-6 rounded-xl border border-muted shadow-sm">
                  <h2 className="font-semibold text-xl mb-4">Order Information</h2>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-medium">{order.id}</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Order Date</p>
                      <p className="font-medium flex items-center">
                        <Calendar size={16} className="mr-1 text-muted-foreground" /> 
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="font-medium">{order.total_amount.toFixed(3)} KD</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Payment Method</p>
                      <p className="font-medium">{order.payment_method || 'Not specified'}</p>
                    </div>
                  </div>

                  {order.special_instructions && (
                    <div className="mt-4 pt-4 border-t border-muted">
                      <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
                      <p>{order.special_instructions}</p>
                    </div>
                  )}
                </div>
                
                {/* Order Items */}
                <div className="bg-white p-6 rounded-xl border border-muted shadow-sm">
                  <h2 className="font-semibold text-xl mb-4">Order Items</h2>
                  
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="font-medium">{item.total} KD</p>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Quantity: {item.quantity} × {item.price} KD</p>
                          
                          {item.container && (
                            <p>Container: {item.container}</p>
                          )}
                          
                          {item.toppings && (
                            <p>Toppings: {item.toppings}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total</span>
                    <span>{order.total_amount.toFixed(3)} KD</span>
                  </div>
                </div>
              </div>
              
              {/* Delivery Info */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-muted shadow-sm">
                  <h2 className="font-semibold text-xl mb-4">Delivery Information</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Address</p>
                      <p className="flex items-start">
                        <MapPin size={16} className="mr-1 mt-1 flex-shrink-0 text-muted-foreground" />
                        <span>{order.delivery_address ? formatAddress(order.delivery_address) : 'No address provided'}</span>
                      </p>
                    </div>
                    
                    {order.delivery_address?.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Phone</p>
                        <p>{order.delivery_address.phone}</p>
                      </div>
                    )}
                    
                    {order.delivery_time && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Delivery Time</p>
                        <p className="flex items-center">
                          <Clock size={16} className="mr-1 text-muted-foreground" />
                          <span>{formatDate(order.delivery_time)}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl border border-muted shadow-sm">
                  <h2 className="font-semibold text-xl mb-4">Need Help?</h2>
                  <p className="text-muted-foreground mb-4">
                    If you have any questions about your order, please contact our customer support.
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/contact')}
                  >
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
