
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useMobile } from "@/hooks/useMobile";
import { isActive } from "@/utils/navigation";
import { 
  Button,
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from "@/integrations/supabase/client";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();
  const { user, signOut, isLoading } = useAuth();
  const { itemCount } = useCart();
  const isMobile = useMobile();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const getCartCount = () => {
      try {
        const cartItems = JSON.parse(localStorage.getItem('gelatico-cart') || '[]');
        const count = cartItems.reduce((total: number, item: any) => total + item.quantity, 0);
        setCartCount(count);
      } catch (error) {
        console.error('Error getting cart count:', error);
        setCartCount(0);
      }
    };

    getCartCount();
    
    // Listen for storage events to update cart count
    window.addEventListener('storage', getCartCount);
    // Listen for custom cart update events
    window.addEventListener('cart-updated', getCartCount);
    
    return () => {
      window.removeEventListener('storage', getCartCount);
      window.removeEventListener('cart-updated', getCartCount);
    };
  }, []);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user) {
        try {
          // Check if user has admin role
          const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setIsAdmin(data?.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        }
      }
    };

    checkAdminStatus();
  }, [user]);

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Flavors', href: '/flavors' },
    { name: 'Shop', href: '/shop' },
    { name: 'About', href: '/about' },
    { name: 'Locations', href: '/locations' },
  ];

  const userMenuItems = (user: any | null, isAdmin: boolean, signOut: () => Promise<void>) => [
    { name: 'Profile', href: '/profile' },
    { name: 'My Orders', href: '/orders' },
    ...(isAdmin ? [{ name: 'Order Management', href: '/admin/orders' }] : []),
    { 
      name: 'Sign Out', 
      onClick: async () => {
        await signOut();
        window.location.href = '/';
      } 
    },
  ];

  const renderUserMenu = () => (
    <DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
        >
          <Avatar>
            <AvatarFallback className="bg-gelatico-pink text-white">
              {user?.email?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.email || "My Account"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "Guest"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMenuItems(user, isAdmin, signOut).map((item) => (
          <DropdownMenuItem key={item.name}>
            {item.href ? (
              <Link to={item.href} className="w-full">
                {item.name}
              </Link>
            ) : (
              <button
                onClick={item.onClick}
                className="w-full text-left cursor-pointer"
              >
                {item.name}
              </button>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300", 
        isScrolled ? "py-2 bg-white/80 backdrop-blur-md shadow-sm" : "py-4 bg-transparent"
      )}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 flex justify-between items-center">
        {/* Logo */}
        <Link 
          to="/" 
          className="relative z-10 transition-all duration-300 hover:opacity-80"
        >
          <img 
            src="/public/lovable-uploads/2892a530-dfcf-4764-8487-557369ed7b21.png" 
            alt="Gelatico" 
            className="h-12 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-sm font-medium transition-all duration-300 relative after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-gelatico-pink after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:text-gelatico-pink hover:after:scale-x-100",
                isActive(item.href) 
                  ? "text-gelatico-pink after:scale-x-100" 
                  : "text-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}

          <div className="flex items-center space-x-4">
            <Link 
              to="/cart" 
              className="relative p-2 text-foreground transition-all duration-300 hover:text-gelatico-pink"
            >
              <ShoppingCart size={20} />
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-gelatico-pink rounded-full">
                {cartCount}
              </span>
            </Link>
            
            {renderUserMenu()}
          </div>
        </nav>

        {/* Mobile: Menu Button & Cart */}
        <div className="flex items-center space-x-4 md:hidden">
          <Link 
            to="/cart" 
            className="relative p-1 text-foreground transition-all duration-300 hover:text-gelatico-pink"
          >
            <ShoppingCart size={20} />
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-gelatico-pink rounded-full">
              {cartCount}
            </span>
          </Link>
          
          {renderUserMenu()}
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-foreground transition-all duration-300 hover:text-gelatico-pink"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={cn(
            "fixed inset-0 bg-white z-40 flex flex-col items-center justify-center space-y-8 transition-all duration-300 md:hidden",
            isMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full pointer-events-none"
          )}
        >
          <img 
            src="/public/lovable-uploads/6a86ae94-f6ae-4ab1-abd3-4587a6f0c711.png" 
            alt="Gelatico Logo" 
            className="w-24 h-24 object-contain mb-4"
          />
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-xl font-medium transition-all duration-300",
                isActive(item.href) ? "text-gelatico-pink" : "text-foreground"
              )}
            >
              {item.name}
            </Link>
          ))}
          
          {renderUserMenu()}
        </div>
      </div>
    </header>
  );
}
