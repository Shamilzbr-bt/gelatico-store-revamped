
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Clock,
  ShoppingBag,
  Package,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  User,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkoutService } from '@/services/checkout';
import { formatDate } from '@/utils/formatters';
import type { OrderStatus } from '@/services/checkout';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch orders and check admin status
  useEffect(() => {
    const checkAdminAndFetchOrders = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      setIsLoading(true);
      
      // Check if user is admin
      const adminStatus = await checkoutService.isUserAdmin(user.id);
      setIsAdmin(adminStatus);
      
      if (!adminStatus) {
        toast.error('You do not have permission to access this page');
        navigate('/');
        return;
      }

      // Fetch all orders
      const { success, orders, error } = await checkoutService.getAllOrders();
      
      if (success && orders) {
        setOrders(orders);
        setFilteredOrders(orders);
      } else {
        toast.error(error || 'Failed to load orders');
      }
      
      setIsLoading(false);
    };

    checkAdminAndFetchOrders();
  }, [user, navigate]);

  // Apply filters when search or status filter changes
  useEffect(() => {
    if (!orders.length) return;
    
    let result = [...orders];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.id.toLowerCase().includes(lowerSearchTerm) ||
        (order.profiles?.email && order.profiles.email.toLowerCase().includes(lowerSearchTerm)) ||
        (order.profiles?.first_name && order.profiles.first_name.toLowerCase().includes(lowerSearchTerm)) ||
        (order.profiles?.last_name && order.profiles.last_name.toLowerCase().includes(lowerSearchTerm))
      );
    }
    
    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(result);
  }, [searchTerm, statusFilter, orders]);

  const refreshOrders = async () => {
    setIsLoading(true);
    const { success, orders, error } = await checkoutService.getAllOrders();
    
    if (success && orders) {
      setOrders(orders);
      setFilteredOrders(orders);
      toast.success('Orders refreshed');
    } else {
      toast.error(error || 'Failed to refresh orders');
    }
    
    setIsLoading(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const { success, error } = await checkoutService.updateOrderStatus(orderId, newStatus);
      
      if (success) {
        toast.success(`Order status updated to ${newStatus}`);
        refreshOrders();
      } else {
        toast.error(error || 'Failed to update order status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('An error occurred while updating order status');
    }
  };

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

  if (!isAdmin && !isLoading) {
    return null; // Already redirected in useEffect
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="page-container pt-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <span className="inline-block px-4 py-1 mb-4 rounded-full bg-gelatico-baby-pink/30 text-gelatico-pink text-sm font-medium uppercase tracking-wider">
            Admin Panel
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold font-gelatico mb-2">
            Order Management
          </h1>
          <p className="text-muted-foreground">
            View and manage all customer orders in one place
          </p>
        </motion.div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gelatico-pink" />
            <span className="ml-2 text-lg">Loading orders...</span>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID or customer..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <div className="w-40">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="outline" onClick={refreshOrders} disabled={isLoading}>
                  <RefreshCw size={16} className="mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
            
            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-16 bg-muted/20 rounded-lg">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Orders Found</h2>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? "No orders match your current filters." 
                    : "There are no orders in the system yet."}
                </p>
                {(searchTerm || statusFilter !== 'all') && (
                  <Button variant="outline" onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          <Link to={`/admin/order/${order.id}`} className="hover:underline">
                            {order.id.substring(0, 8)}...
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User size={16} className="mr-2 text-muted-foreground" />
                            {order.profiles ? (
                              <div>
                                <div className="font-medium">
                                  {order.profiles.first_name || ''} {order.profiles.last_name || ''}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order.profiles.email || 'No email'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unknown user</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(order.created_at)}</TableCell>
                        <TableCell>{order.items?.length || 0}</TableCell>
                        <TableCell>{order.total_amount.toFixed(3)} KD</TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => updateStatus(order.id, value as OrderStatus)}
                            >
                              <SelectTrigger className="w-36">
                                <SelectValue placeholder="Update Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button variant="outline" size="icon" asChild>
                              <Link to={`/admin/order/${order.id}`}>
                                <ShoppingBag size={16} />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </motion.div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
