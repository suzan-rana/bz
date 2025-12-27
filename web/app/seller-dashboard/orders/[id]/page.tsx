'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ordersAPI, messagesAPI } from '@/lib/api';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, AlertTriangle, User, Mail, Phone, MapPin, DollarSign, Calendar, Eye, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface OrderItem {
  id: string;
  book: {
    id: string;
    title: string;
    author: string;
    cover_image?: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'cancelled';
  payment_method: 'khalti' | 'cod';
  total_amount: number;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  buyer: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export default function SellerOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user?.is_seller && orderId) {
      fetchOrderDetails();
    } else if (user && !user.is_seller) {
      // Redirect buyers to their own order detail page
      router.push(`/orders/${orderId}`);
    }
  }, [user, orderId, router]);

  const fetchOrderDetails = async () => {
    try {
      const response = await ordersAPI.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    if (!order) return;

    setUpdating(true);
    try {
      await ordersAPI.updateStatus(order.id.toString(), newStatus);
      toast.success('Order status updated successfully');
      fetchOrderDetails(); // Refresh order details
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleMessageCustomer = async () => {
    if (!order || !user) return;

    try {
      // Get the first book from the order to start conversation
      const firstBook = order.items[0];
      if (!firstBook) {
        toast.error('No books found in this order');
        return;
      }

      // For sellers messaging customers, we need to get the buyer's ID
      const response = await messagesAPI.startConversation({
        book_id: firstBook.book.id,
        buyer_id: order.buyer.id, // Buyer's ID from the order
        message: `Hi! I'm the seller for your order #${order.id}. How can I help you with your order?`
      });

      // Redirect to the conversation
      router.push(`/messages/${response.data.id}`);
    } catch (error: any) {
      console.error('Error starting conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user?.is_seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This page is only available for seller accounts.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium">Order not found</h3>
            <p className="text-muted-foreground">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link href="/seller-dashboard/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  Order #{order.id}
                </CardTitle>
                <CardDescription>
                  Order placed on {formatDate(order.created_at)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Payment Status:</span>
                    <Badge className={getPaymentStatusColor(order.payment_status)}>
                      <span className="capitalize">{order.payment_status}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Payment Method:</span>
                    <span className="text-muted-foreground">{order.payment_method.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Last Updated:</span>
                    <span className="text-muted-foreground">{formatDate(order.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-20 flex-shrink-0 overflow-hidden rounded">
                        {item.book.cover_image ? (
                          <img
                            src={getImageUrl(item.book.cover_image)}
                            alt={item.book.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">{item.book.title}</h4>
                        <p className="text-muted-foreground text-sm">by {item.book.author}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">Rs {Number(item.price || 0).toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Total: Rs {(Number(item.price || 0) * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rs {Number(order.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>Rs {Number(order.total_amount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">{order.shipping_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.status === 'pending' && (
                  <Button
                    onClick={() => updateOrderStatus('processing')}
                    disabled={updating}
                    className="w-full"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {updating ? 'Processing...' : 'Process Order'}
                  </Button>
                )}
                {order.status === 'processing' && (
                  <Button
                    onClick={() => updateOrderStatus('shipped')}
                    disabled={updating}
                    className="w-full"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {updating ? 'Updating...' : 'Mark as Shipped'}
                  </Button>
                )}
                {order.status === 'shipped' && (
                  <Button
                    onClick={() => updateOrderStatus('delivered')}
                    disabled={updating}
                    className="w-full"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {updating ? 'Updating...' : 'Mark as Delivered'}
                  </Button>
                )}
                <Button
                  onClick={handleMessageCustomer}
                  variant="outline"
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message Customer
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/seller-dashboard/orders">
                    <Eye className="h-4 w-4 mr-2" />
                    View All Orders
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
