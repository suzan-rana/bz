'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Package,
  DollarSign,
  BarChart3,
  RefreshCw,
  BookOpen,
  ShoppingCart,
  Clock,
  Target,
  Zap,
  User,
  Settings,
  ArrowRight
} from 'lucide-react';
import { booksAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface InventoryData {
  summary: {
    total_books: number;
    total_value: number;
    critical_items: number;
    low_stock_items: number;
    reorder_recommendations: number;
  };
  recommendations: {
    high_priority: string[];
    medium_priority: string[];
    low_priority: string[];
  };
  abc_analysis: {
    category_summary: {
      A: { count: number; value: number };
      B: { count: number; value: number };
      C: { count: number; value: number };
    };
  };
  turnover_analysis: {
    turnover_summary: {
      high: number;
      medium: number;
      low: number;
    };
    books: Array<{
      book_id: string;
      title: string;
      current_stock: number;
      turnover_ratio: number;
      turnover_category: string;
    }>;
  };
  critical_items: Array<{
    book_id: string;
    title: string;
    author: string;
    current_quantity: number;
    reorder_point: number;
    economic_order_quantity: number;
  }>;
  low_stock_items: Array<{
    book_id: string;
    title: string;
    author: string;
    current_quantity: number;
    reorder_point: number;
    economic_order_quantity: number;
  }>;
}

export default function SellerDashboard() {
  const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const fetchInventoryData = async () => {
    try {
      setLoading(true);

      // Fetch all inventory data from APIs
      const [recommendations, abcAnalysis, turnoverAnalysis] = await Promise.all([
        booksAPI.getInventoryRecommendations(),
        booksAPI.getABCAnalysis(),
        booksAPI.getStockTurnover(),
      ]);

      setInventoryData({
        summary: {
          total_books: recommendations.data.total_books || 0,
          total_value: recommendations.data.total_inventory_value || 0,
          critical_items: recommendations.data.critical_items_count || 0,
          low_stock_items: recommendations.data.low_stock_items_count || 0,
          reorder_recommendations: recommendations.data.reorder_recommendations_count || 0,
        },
        recommendations: {
          high_priority: recommendations.data.high_priority_recommendations || [],
          medium_priority: recommendations.data.medium_priority_recommendations || [],
          low_priority: recommendations.data.low_priority_recommendations || [],
        },
        abc_analysis: abcAnalysis.data,
        turnover_analysis: turnoverAnalysis.data,
        critical_items: recommendations.data.critical_items || [],
        low_stock_items: recommendations.data.low_stock_items || [],
      });

    } catch (err) {
      console.error('Error fetching inventory data:', err);
      // Fallback to basic data if APIs fail
      try {
        const booksResponse = await booksAPI.getMyBooks();
        const books = booksResponse.data.results || booksResponse.data || [];
        const totalBooks = books.length;
        const totalValue = books.reduce((sum: number, book: any) => sum + (book.price * book.quantity), 0);

        setInventoryData({
          summary: {
            total_books: totalBooks,
            total_value: totalValue,
            critical_items: 0,
            low_stock_items: 0,
            reorder_recommendations: 0,
          },
          recommendations: {
            high_priority: [],
            medium_priority: [],
            low_priority: [],
          },
          abc_analysis: {
            category_summary: { A: { count: 0, value: 0 }, B: { count: 0, value: 0 }, C: { count: 0, value: 0 } }
          },
          turnover_analysis: {
            turnover_summary: { high: 0, medium: 0, low: 0 },
            books: []
          },
          critical_items: [],
          low_stock_items: [],
        });
      } catch (fallbackErr) {
        console.error('Fallback data also failed:', fallbackErr);
        setInventoryData({
          summary: {
            total_books: 0,
            total_value: 0,
            critical_items: 0,
            low_stock_items: 0,
            reorder_recommendations: 0,
          },
          recommendations: {
            high_priority: [],
            medium_priority: [],
            low_priority: [],
          },
          abc_analysis: {
            category_summary: { A: { count: 0, value: 0 }, B: { count: 0, value: 0 }, C: { count: 0, value: 0 } }
          },
          turnover_analysis: {
            turnover_summary: { high: 0, medium: 0, low: 0 },
            books: []
          },
          critical_items: [],
          low_stock_items: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_seller) {
      fetchInventoryData();
    }
  }, [user]);

  if (!user?.is_seller) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This dashboard is only available for seller accounts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </div>
    );
  }



  // Check KYC verification status
  const isKYCVerified = user?.kyc_status?.status === 'approved';

  const summary = inventoryData?.summary || {
    total_books: 0,
    total_value: 0,
    critical_items: 0,
    low_stock_items: 0,
    reorder_recommendations: 0,
  };

  const abc_analysis = inventoryData?.abc_analysis || {
    category_summary: { A: { count: 0, value: 0 }, B: { count: 0, value: 0 }, C: { count: 0, value: 0 } }
  };

  const turnover_analysis = inventoryData?.turnover_analysis || {
    turnover_summary: { high: 0, medium: 0, low: 0 },
    books: []
  };

  const dashboardSections = [
    {
      title: 'My Books',
      description: 'Manage your book inventory and listings',
      icon: BookOpen,
      href: '/seller-dashboard/books',
      color: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Orders',
      description: 'View and manage customer orders',
      icon: ShoppingCart,
      href: '/seller-dashboard/orders',
      color: 'bg-green-50 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      title: 'Payments',
      description: 'Track your earnings and payment history',
      icon: DollarSign,
      href: '/seller-dashboard/payments',
      color: 'bg-yellow-50 border-yellow-200',
      iconColor: 'text-yellow-600'
    },
    {
      title: 'Analytics',
      description: 'Advanced inventory and sales analytics',
      icon: BarChart3,
      href: '/seller-dashboard/analytics',
      color: 'bg-purple-50 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Customers',
      description: 'View customer information and order history',
      icon: User,
      href: '/seller-dashboard/customers',
      color: 'bg-indigo-50 border-indigo-200',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'Settings',
      description: 'Manage your seller account settings',
      icon: Settings,
      href: '/seller-dashboard/settings',
      color: 'bg-gray-50 border-gray-200',
      iconColor: 'text-gray-600'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* KYC Verification Alert */}
      {user?.is_seller && !isKYCVerified && (
        <Alert className="mb-6 border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">KYC Verification Required</p>
                <p className="text-sm mt-1">
                  {user?.kyc_status?.status === 'not_submitted' ? (
                    'Your account needs to be verified to access all seller features. Complete your KYC verification to start selling books.'
                  ) : user?.kyc_status?.status === 'pending' ? (
                    'Your KYC application is under review. You will be notified once it is approved.'
                  ) : user?.kyc_status?.status === 'rejected' ? (
                    'Your KYC application was rejected. Please review the feedback and resubmit.'
                  ) : (
                    'Your account needs to be verified to access all seller features. Complete your KYC verification to start selling books.'
                  )}
                </p>
                {user?.kyc_status?.admin_notes && (
                  <p className="text-xs mt-1 text-orange-700">
                    <strong>Admin Notes:</strong> {user.kyc_status.admin_notes}
                  </p>
                )}
              </div>
              <Button
                onClick={() => router.push('/kyc')}
                className="ml-4 bg-orange-600 hover:bg-orange-700 text-white"
              >
                {user?.kyc_status?.status === 'rejected' ? 'Resubmit KYC' : 'Complete KYC'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user.first_name || user.email}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Books</p>
                <p className="text-2xl font-bold text-gray-900">{summary.total_books}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inventory Value</p>
                <p className="text-2xl font-bold text-gray-900">Rs. {summary.total_value.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Items</p>
                <p className="text-2xl font-bold text-red-600">{summary.critical_items}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{summary.low_stock_items}</p>
              </div>
              <Package className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {dashboardSections.map((section) => {
          const IconComponent = section.icon;
          const isRestricted = user?.is_seller && !isKYCVerified && (section.title === 'Payments' || section.title === 'Analytics');

          return (
            <Card
              key={section.title}
              className={`cursor-pointer hover:shadow-lg transition-shadow ${section.color} ${isRestricted ? 'opacity-60' : ''}`}
              onClick={() => !isRestricted ? router.push(section.href) : null}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      {isRestricted && (
                        <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                          KYC Required
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                    {isRestricted ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-0 h-auto text-orange-600 hover:text-orange-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/kyc');
                        }}
                      >
                        <span className="text-sm font-medium">Complete KYC First</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        <span className="text-sm font-medium">View Details</span>
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    )}
                  </div>
                  <IconComponent className={`h-12 w-12 ${section.iconColor} ${isRestricted ? 'opacity-50' : ''}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Welcome Message for New Sellers */}
      {summary.total_books === 0 && (
        <Card className="mb-8 border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome to BookZone!</h3>
                <p className="text-blue-700 mb-4">
                  You're all set up! Start by adding your first book to your inventory.
                  Once you have books listed, you'll see detailed analytics and insights here.
                </p>
                <Button
                  onClick={() => router.push('/sell')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add Your First Book
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Alerts */}
      {(summary.critical_items > 0 || summary.low_stock_items > 0) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Inventory Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.critical_items > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You have {summary.critical_items} critical stock items that need immediate attention.
                  </AlertDescription>
                </Alert>
              )}
              {summary.low_stock_items > 0 && (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    You have {summary.low_stock_items} items running low on stock.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ABC Analysis Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
          <CardDescription>
            ABC Analysis - Inventory categorization by value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{abc_analysis.category_summary?.A?.count || 0}</div>
              <div className="text-sm font-medium">Category A</div>
              <div className="text-xs text-muted-foreground">High Value (80%)</div>
              <div className="text-sm font-bold">Rs {(abc_analysis.category_summary?.A?.value || 0).toFixed(2)}</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{abc_analysis.category_summary?.B?.count || 0}</div>
              <div className="text-sm font-medium">Category B</div>
              <div className="text-xs text-muted-foreground">Medium Value (15%)</div>
              <div className="text-sm font-bold">Rs {(abc_analysis.category_summary?.B?.value || 0).toFixed(2)}</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{abc_analysis.category_summary?.C?.count || 0}</div>
              <div className="text-sm font-medium">Category C</div>
              <div className="text-xs text-muted-foreground">Low Value (5%)</div>
              <div className="text-sm font-bold">Rs {(abc_analysis.category_summary?.C?.value || 0).toFixed(2)}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
