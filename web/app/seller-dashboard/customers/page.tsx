'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    User,
    ShoppingCart,
    DollarSign,
    Calendar,
    RefreshCw,
    AlertTriangle,
    Eye,
    TrendingUp,
    Star,
    Mail,
    Phone
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ordersAPI } from '@/lib/api';

interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    total_orders: number;
    total_spent: number;
    first_order_date: string;
    last_order_date: string;
    average_order_value: number;
    favorite_categories: string[];
    order_history: Array<{
        id: number;
        total_amount: number;
        status: string;
        created_at: string;
        items: Array<{
            book_title: string;
            quantity: number;
            price: number;
        }>;
    }>;
}

export default function SellerCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'recent' | 'top'>('all');
    const { user } = useAuth();
    const router = useRouter();

    const fetchCustomers = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getSellerCustomers();
            setCustomers(response.data);
        } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.is_seller) {
            fetchCustomers();
        }
    }, [user]);

    if (!user?.is_seller) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert>
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
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading customers...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        );
    }

    const filteredCustomers = customers.filter(customer => {
        if (filter === 'recent') {
            const lastOrderDate = new Date(customer.last_order_date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return lastOrderDate >= thirtyDaysAgo;
        }
        if (filter === 'top') {
            return customer.total_spent > 100; // Top customers who spent more than Rs 100
        }
        return true;
    });

    const stats = {
        total: customers.length,
        recent: customers.filter(c => {
            const lastOrderDate = new Date(c.last_order_date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return lastOrderDate >= thirtyDaysAgo;
        }).length,
        top: customers.filter(c => c.total_spent > 100).length,
        totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
        averageOrderValue: customers.length > 0
            ? customers.reduce((sum, c) => sum + c.average_order_value, 0) / customers.length
            : 0,
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
                    <p className="text-gray-600 mt-2">View customer information and order history</p>
                </div>
                <Button variant="outline" onClick={fetchCustomers}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <User className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-green-600">Rs. {stats.totalRevenue.toFixed(2)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Recent Customers</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.recent}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                                <p className="text-2xl font-bold text-purple-600">Rs. {stats.averageOrderValue.toFixed(2)}</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            All Customers ({stats.total})
                        </Button>
                        <Button
                            variant={filter === 'recent' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('recent')}
                        >
                            Recent ({stats.recent})
                        </Button>
                        <Button
                            variant={filter === 'top' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('top')}
                        >
                            Top Buyers ({stats.top})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Customers List */}
            {filteredCustomers.length === 0 ? (
                <Card>
                    <CardContent className="p-12">
                        <div className="text-center">
                            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {filter === 'all' ? 'No customers yet' : `No ${filter} customers`}
                            </h3>
                            <p className="text-gray-600">
                                {filter === 'all'
                                    ? 'When customers place orders, they will appear here.'
                                    : `You don't have any ${filter} customers at the moment.`
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {filteredCustomers.map((customer) => (
                        <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-semibold text-xl text-gray-900 mb-1">{customer.name}</h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-4 w-4" />
                                                        {customer.email}
                                                    </div>
                                                    {customer.phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-4 w-4" />
                                                            {customer.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <div className="text-lg font-bold text-blue-600">{customer.total_orders}</div>
                                                <div className="text-sm text-blue-700">Total Orders</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="text-lg font-bold text-green-600">Rs {customer.total_spent.toFixed(2)}</div>
                                                <div className="text-sm text-green-700">Total Spent</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <div className="text-lg font-bold text-purple-600">Rs {customer.average_order_value.toFixed(2)}</div>
                                                <div className="text-sm text-purple-700">Avg Order</div>
                                            </div>
                                            <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                                <div className="text-lg font-bold text-yellow-600">
                                                    {new Date(customer.last_order_date).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm text-yellow-700">Last Order</div>
                                            </div>
                                        </div>

                                        {customer.favorite_categories.length > 0 && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-600 mb-2">Favorite Categories:</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {customer.favorite_categories.map((category, index) => (
                                                        <Badge key={index} variant="outline">
                                                            {category}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-600">Recent Orders:</p>
                                            {customer.order_history.slice(0, 3).map((order) => (
                                                <div key={order.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                    <div>
                                                        <p className="font-medium text-sm">Order #{order.id}</p>
                                                        <p className="text-xs text-gray-600">
                                                            {new Date(order.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-sm">Rs {order.total_amount.toFixed(2)}</p>
                                                        <Badge
                                                            variant={
                                                                order.status === 'delivered' ? 'default' :
                                                                    order.status === 'shipped' ? 'secondary' :
                                                                        order.status === 'processing' ? 'outline' : 'destructive'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {order.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="lg:text-right">
                                        <div className="space-y-2 flex items-center gap-5">
                                            {/* <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // TODO: Navigate to detailed customer view
                                                    console.log('View customer details:', customer.id);
                                                }}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View Details
                                            </Button> */}
                                            <div className="text-right flex items-center mt-3">
                                                <Badge variant={customer.total_spent > 100 ? 'default' : 'secondary'}>
                                                    {customer.total_spent > 100 ? 'Top Buyer' : 'Regular'}
                                                </Badge>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // TODO: Send email to customer
                                                    window.location.href = `mailto:${customer.email}`;
                                                }}
                                            >
                                                <Mail className="h-4 w-4 mr-1" />
                                                Send Email
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Customer Insights */}
            {customers.length > 0 && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Customer Insights</CardTitle>
                        <CardDescription>
                            Key metrics and trends for your customer base
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {stats.total > 0 ? (stats.recent / stats.total * 100).toFixed(1) : 0}%
                                </div>
                                <div className="text-sm font-medium">Active Customers</div>
                                <div className="text-xs text-muted-foreground">
                                    Ordered in last 30 days
                                </div>
                            </div>

                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {stats.total > 0 ? (stats.top / stats.total * 100).toFixed(1) : 0}%
                                </div>
                                <div className="text-sm font-medium">Top Buyers</div>
                                <div className="text-xs text-muted-foreground">
                                    Spent over Rs 100
                                </div>
                            </div>

                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {stats.total > 0 ? (stats.totalRevenue / stats.total).toFixed(2) : 0}
                                </div>
                                <div className="text-sm font-medium">Avg Customer Value</div>
                                <div className="text-xs text-muted-foreground">
                                    Revenue per customer
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
