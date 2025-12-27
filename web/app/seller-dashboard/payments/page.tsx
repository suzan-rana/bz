'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    AlertTriangle,
    Calendar,
    Download,
    Filter
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersAPI } from '@/lib/api';

interface Payment {
    id: number;
    order_id: number;
    amount: number;
    payment_method: 'khalti' | 'cod';
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    created_at: string;
    paid_at?: string;
    customer_name: string;
    customer_email: string;
    order_status: string;
}

export default function SellerPayments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'cancelled'>('all');
    const { user } = useAuth();

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await ordersAPI.getSellerPayments();
            setPayments(response.data);
        } catch (err) {
            console.error('Error fetching payments:', err);
            setError('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.is_seller) {
            fetchPayments();
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
                    <span className="ml-2">Loading payments...</span>
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

    const filteredPayments = payments.filter(payment => {
        if (statusFilter === 'all') return true;
        return payment.status === statusFilter;
    });

    const stats = {
        totalEarnings: payments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0),
        thisMonth: payments.filter(p => {
            const paymentDate = new Date(p.paid_at || p.created_at);
            const now = new Date();
            return paymentDate.getMonth() === now.getMonth() &&
                paymentDate.getFullYear() === now.getFullYear() &&
                p.status === 'completed';
        }).reduce((sum, p) => sum + p.amount, 0),
        pending: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
        total: payments.length,
        completed: payments.filter(p => p.status === 'completed').length,
        pendingCount: payments.filter(p => p.status === 'pending').length,
        failed: payments.filter(p => p.status === 'failed').length,
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="h-4 w-4" />;
            case 'completed': return <CheckCircle className="h-4 w-4" />;
            case 'failed': return <XCircle className="h-4 w-4" />;
            case 'refunded': return <TrendingDown className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'completed': return 'bg-green-100 text-green-800 border-green-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPaymentMethodColor = (method: string) => {
        switch (method) {
            case 'khalti': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'cod': return 'bg-blue-100 text-blue-800 border-blue-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                    <p className="text-gray-600 mt-2">Track your earnings and payment history</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" onClick={fetchPayments}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                                <p className="text-2xl font-bold text-green-600">Rs {stats.totalEarnings.toFixed(2)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">This Month</p>
                                <p className="text-2xl font-bold text-blue-600">Rs {stats.thisMonth.toFixed(2)}</p>
                            </div>
                            <Calendar className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">Rs {stats.pending.toFixed(2)}</p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                        >
                            All ({stats.total})
                        </Button>
                        <Button
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('completed')}
                        >
                            Completed ({stats.completed})
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('pending')}
                        >
                            Pending ({stats.pendingCount})
                        </Button>
                        <Button
                            variant={statusFilter === 'failed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('failed')}
                        >
                            Failed ({stats.failed})
                        </Button>
                        <Button
                            variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('cancelled')}
                        >
                            Cancelled ({payments.filter(p => p.status === 'cancelled').length})
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Payments List */}
            {filteredPayments.length === 0 ? (
                <Card>
                    <CardContent className="p-12">
                        <div className="text-center">
                            <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {statusFilter === 'all' ? 'No payments yet' : `No ${statusFilter} payments`}
                            </h3>
                            <p className="text-gray-600">
                                {statusFilter === 'all'
                                    ? 'When customers complete payments, they will appear here.'
                                    : `You don't have any ${statusFilter} payments at the moment.`
                                }
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {filteredPayments.map((payment) => (
                        <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-900">
                                                    Payment for Order #{payment.order_id}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(payment.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge className={`${getStatusColor(payment.status)}`}>
                                                    {getStatusIcon(payment.status)}
                                                    <span className="ml-1 capitalize">{payment.status}</span>
                                                </Badge>
                                                <Badge className={`${getPaymentMethodColor(payment.payment_method)}`}>
                                                    <span className="uppercase">{payment.payment_method}</span>
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Customer</p>
                                                <p className="text-gray-900">{payment.customer_name}</p>
                                                <p className="text-sm text-gray-600">{payment.customer_email}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">Payment Details</p>
                                                <p className="text-gray-900">Order ID: {payment.order_id}</p>
                                                {payment.paid_at && (
                                                    <p className="text-sm text-gray-600">
                                                        Paid: {new Date(payment.paid_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="lg:text-right">
                                        <div className="mb-4">
                                            <p className="text-3xl font-bold text-green-600">
                                                Rs {payment.amount.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {payment.status === 'completed' ? 'Earned' : 'Amount'}
                                            </p>
                                        </div>

                                        {payment.status === 'pending' && (
                                            <Button size="sm" variant="outline">
                                                <Clock className="h-4 w-4 mr-1" />
                                                Awaiting Payment
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Payment Insights */}
            {payments.length > 0 && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Payment Insights</CardTitle>
                        <CardDescription>
                            Key metrics and trends for your payments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%
                                </div>
                                <div className="text-sm font-medium">Success Rate</div>
                                <div className="text-xs text-muted-foreground">
                                    {stats.completed} of {stats.total} payments
                                </div>
                            </div>

                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    Rs {(stats.totalEarnings / Math.max(stats.completed, 1)).toFixed(2)}
                                </div>
                                <div className="text-sm font-medium">Average Payment</div>
                                <div className="text-xs text-muted-foreground">
                                    Per successful transaction
                                </div>
                            </div>

                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {stats.pendingCount}
                                </div>
                                <div className="text-sm font-medium">Pending Payments</div>
                                <div className="text-xs text-muted-foreground">
                                    Awaiting clearance
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
