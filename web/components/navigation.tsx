'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, BookOpen, User, ShoppingCart, Heart, LogOut, Settings, ChevronDown, Package, Plus, DollarSign, Users } from 'lucide-react';
import { userAPI, authAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Navigation() {
  const { user, loading, logout: authLogout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state: cartState } = useCart();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      authLogout();
      toast.success('Logged out successfully');
      window.location.href = '/';
    } catch (error) {
      toast.error('Error logging out');
    }
  };



  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">BookZone</span>
          </Link>



          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link href="/books">Browse</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/categories">Categories</Link>
            </Button>
            {user && (
              <Button asChild variant="ghost">
                <Link href="/messages">Messages</Link>
              </Button>
            )}
            {user && (
              <Button asChild variant="ghost">
                <Link href={user.is_seller ? "/seller-dashboard" : "/dashboard"}>Dashboard</Link>
              </Button>
            )}
            {user?.is_seller && (
              <Button asChild variant="ghost">
                <Link href="/sell">Sell</Link>
              </Button>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon - Only show for non-sellers */}
            {user && !user.is_seller && (
              <Button asChild variant="ghost" size="icon" className="relative">
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5" />
                  {cartState.itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartState.itemCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            {!loading && (
              <>
                {user ? (
                  <div className="relative" ref={menuRef}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      className="relative hover:bg-muted/50 transition-colors"
                    >
                      <User className="h-5 w-5" />
                      <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
                    </Button>

                    {isMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-2 z-50 animate-in slide-in-from-top-2 duration-200">
                        {/* User Info Header */}
                        <div className="px-4 py-3 border-b border-border">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </p>
                              <div className="flex items-center mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.is_seller
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-green-100 text-green-800'
                                  }`}>
                                  {user.is_seller ? 'Seller' : 'Buyer'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href={user.is_seller ? "/seller-dashboard" : "/dashboard"}
                            className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <User className="h-4 w-4 mr-3 text-muted-foreground" />
                            Dashboard
                          </Link>

                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
                            Profile Settings
                          </Link>

                          {!user.is_seller && (
                            <>
                              <Link
                                href="/orders"
                                className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <Package className="h-4 w-4 mr-3 text-muted-foreground" />
                                My Orders
                              </Link>

                              <Link
                                href="/wishlist"
                                className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <Heart className="h-4 w-4 mr-3 text-muted-foreground" />
                                Wishlist
                              </Link>
                            </>
                          )}

                          {user.is_seller && (
                            <>
                              <Link
                                href="/my-books"
                                className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <BookOpen className="h-4 w-4 mr-3 text-muted-foreground" />
                                My Books
                              </Link>

                              <Link
                                href="/sell"
                                className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <Plus className="h-4 w-4 mr-3 text-muted-foreground" />
                                Sell New Book
                              </Link>

                              <Link
                                href="/seller-dashboard/orders"
                                className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <Package className="h-4 w-4 mr-3 text-muted-foreground" />
                                Orders
                              </Link>

                              <Link
                                href="/seller-dashboard/payments"
                                className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <DollarSign className="h-4 w-4 mr-3 text-muted-foreground" />
                                Payments
                              </Link>

                              <Link
                                href="/seller-dashboard/customers"
                                className="flex items-center px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                                onClick={() => setIsMenuOpen(false)}
                              >
                                <Users className="h-4 w-4 mr-3 text-muted-foreground" />
                                Customers
                              </Link>
                            </>
                          )}
                        </div>

                        {/* Logout Section */}
                        <div className="border-t border-border pt-1">
                          <button
                            onClick={() => {
                              setIsMenuOpen(false);
                              handleLogout();
                            }}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Button asChild variant="ghost">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>


      </div>
    </nav>
  );
}
