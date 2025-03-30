
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Loader2, Package, Clock, ShoppingBag, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkoutService } from '@/services/checkout';
import { formatDate } from '@/utils/formatters';

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      setIsLoading(true);
      const { success, orders, error } = await checkoutService.getUserOrders();
      
      if (success && orders) {
        setOrders(orders);
      } else {
        toast.error(error || 'Failed to load orders');
      }
      
      setIsLoading(false);
    };

    fetchOrders();
  }, [user, navigate]);

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
      case 'pending': return <Clock size={16} />;
      case 'processing': return <Loader2 size={16} className="animate-spin" />;
      case 'shipped': return <Package size={16} />;
      case 'delivered': return <ShoppingBag size={16} />;
      case 'cancelled': return <AlertCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

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
            Your Orders
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-gelatico mb-6">
            Order History
          </h1>
        </motion.div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gelatico-pink" />
            <span className="ml-2 text-lg">Loading your orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="mb-4">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Orders Yet</h2>
            <p className="text-muted-foreground mb-8">
              You haven't placed any orders yet. Start shopping to place your first order!
            </p>
            <Button 
              onClick={() => navigate('/shop')}
              className="bg-gelatico-pink hover:bg-gelatico-pink/90"
            >
              Browse Products
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white p-6 rounded-xl border border-muted shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 space-y-2 md:space-y-0">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Order #{order.id.substring(0, 8)}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </span>
                    <div className="text-right">
                      <span className="font-medium">{order.total_amount.toFixed(3)} KD</span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-muted pt-4 space-y-2">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Items: </span>
                    {order.items.length} {order.items.length === 1 ? 'product' : 'products'}
                  </div>
                  
                  <div className="flex justify-end">
                    <Link to={`/order/${order.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
