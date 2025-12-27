'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ordersAPI } from '@/lib/api';
import { ArrowLeft, Package, Truck, CheckCircle, Clock, AlertCircle, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getImageUrl } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { messagesAPI } from '@/lib/api';

interface OrderItem {
    id: string;
    book: {
        id: string;
        title: string;
        author: string;
        price: number;
        cover_image?: string;
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
    status: string;
    payment_status: string;
    total_amount: number;
    items: OrderItem[];
    created_at: string;
    updated_at: string;
    buyer?: {
        id: string;
        email: string;
    };
}

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const { user } = useAuth();

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    // Redirect sellers to their own order detail page
    useEffect(() => {
        if (user?.is_seller) {
            router.push(`/seller-dashboard/orders/${orderId}`);
        }
    }, [user, orderId, router]);

    useEffect(() => {
        if (orderId) {
            fetchOrderDetails();
        }
    }, [orderId]);

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

    const handleMessageSeller = async () => {
        if (!order || !user) return;

        try {
            // Get the first book from the order to start conversation
            const firstBook = order.items[0];
            if (!firstBook) {
                toast.error('No books found in this order');
                return;
            }

            // Start conversation with the seller
            const response = await messagesAPI.startConversation({
                book_id: firstBook.book.id,
                seller_id: order.buyer?.id || '', // This should be the seller ID, but we need to get it from the book
                message: `Hi! I have a question about my order #${order.id} for "${firstBook.book.title}". Can you help me?`
            });

            // Redirect to the conversation
            router.push(`/messages/${response.data.id}`);
        } catch (error: any) {
            console.error('Error starting conversation:', error);
            toast.error('Failed to start conversation');
        }
    };

    const handleCancelOrder = async () => {
        if (!order) return;

        if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
            return;
        }

        try {
            await ordersAPI.cancelOrder(order.id.toString());
            toast.success('Order cancelled successfully');
            fetchOrderDetails(); // Refresh order details
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            toast.error(error.response?.data?.error || 'Failed to cancel order');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'paid':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'processing':
                return <Package className="h-5 w-5 text-blue-500" />;
            case 'shipped':
                return <Truck className="h-5 w-5 text-purple-500" />;
            case 'delivered':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'cancelled':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            default:
                return <Clock className="h-5 w-5 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'processing':
                return 'bg-blue-100 text-blue-800';
            case 'shipped':
                return 'bg-purple-100 text-purple-800';
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
                        <p className="text-muted-foreground">The order you're looking for doesn't exist.</p>
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
                        <Link href="/orders">
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
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Payment Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Order Date:</span>
                                        <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
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

                    {/* Order Summary */}
                    <div className="space-y-6">
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

                        {/* Shipping Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <span className="font-medium">Name:</span>
                                    <p className="text-muted-foreground">{order.customer_name}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Email:</span>
                                    <p className="text-muted-foreground">{order.customer_email}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Phone:</span>
                                    <p className="text-muted-foreground">{order.customer_phone}</p>
                                </div>
                                <div>
                                    <span className="font-medium">Address:</span>
                                    <p className="text-muted-foreground">{order.shipping_address}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button asChild className="w-full">
                                    <Link href="/books">Continue Shopping</Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/orders">View All Orders</Link>
                                </Button>
                                {user && order && (
                                    <Button
                                        onClick={handleMessageSeller}
                                        variant="outline"
                                        className="w-full"
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        Message Seller
                                    </Button>
                                )}
                                {order && (order.status === 'pending' || order.status === 'paid') && (
                                    <Button
                                        onClick={handleCancelOrder}
                                        variant="destructive"
                                        className="w-full"
                                    >
                                        Cancel Order
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
