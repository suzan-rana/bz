'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Package,
    RefreshCw,
    Target,
    Zap,
    DollarSign,
    PieChart
} from 'lucide-react';
import { booksAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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
        A: Array<{
            book_id: string;
            title: string;
            author: string;
            quantity: number;
            inventory_value: number;
        }>;
        B: Array<{
            book_id: string;
            title: string;
            author: string;
            quantity: number;
            inventory_value: number;
        }>;
        C: Array<{
            book_id: string;
            title: string;
            author: string;
            quantity: number;
            inventory_value: number;
        }>;
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

export default function SellerAnalytics() {
    const [inventoryData, setInventoryData] = useState<InventoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    const fetchInventoryData = async () => {
        try {
            setLoading(true);
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
            setError('Failed to load analytics data');
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
                    <span className="ml-2">Loading analytics...</span>
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

    const summary = inventoryData?.summary || {
        total_books: 0,
        total_value: 0,
        critical_items: 0,
        low_stock_items: 0,
        reorder_recommendations: 0,
    };

    const abc_analysis = inventoryData?.abc_analysis || {
        category_summary: { A: { count: 0, value: 0 }, B: { count: 0, value: 0 }, C: { count: 0, value: 0 } },
        A: [], B: [], C: []
    };

    const turnover_analysis = inventoryData?.turnover_analysis || {
        turnover_summary: { high: 0, medium: 0, low: 0 },
        books: []
    };

    const totalValue = abc_analysis.category_summary.A.value +
        abc_analysis.category_summary.B.value +
        abc_analysis.category_summary.C.value;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-gray-600 mt-2">Advanced inventory and sales analytics</p>
                </div>
                <Button variant="outline" onClick={fetchInventoryData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Data
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Inventory Value</p>
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
                                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                                <p className="text-2xl font-bold text-yellow-600">{summary.low_stock_items}</p>
                            </div>
                            <Package className="h-8 w-8 text-yellow-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Reorder Recommendations</p>
                                <p className="text-2xl font-bold text-blue-600">{summary.reorder_recommendations}</p>
                            </div>
                            <Target className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Analytics Tabs */}
            <Tabs defaultValue="abc-analysis" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="abc-analysis">ABC Analysis</TabsTrigger>
                    <TabsTrigger value="turnover">Stock Turnover</TabsTrigger>
                    <TabsTrigger value="critical">Critical Items</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                </TabsList>

                {/* ABC Analysis Tab */}
                <TabsContent value="abc-analysis" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* ABC Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>ABC Analysis Summary</CardTitle>
                                <CardDescription>
                                    Inventory categorization by value (Pareto Principle)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Category A */}
                                    <div className="p-4 bg-blue-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-blue-900">Category A (High Value)</h4>
                                            <Badge variant="default" className="bg-blue-600">
                                                {abc_analysis.category_summary.A.count} items
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-blue-700">Inventory Value</span>
                                            <span className="font-bold text-blue-900">
                                                Rs {abc_analysis.category_summary.A.value.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-blue-700">Percentage of Total</span>
                                            <span className="font-bold text-blue-900">
                                                {totalValue > 0 ? ((abc_analysis.category_summary.A.value / totalValue) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={totalValue > 0 ? (abc_analysis.category_summary.A.value / totalValue) * 100 : 0}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* Category B */}
                                    <div className="p-4 bg-yellow-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-yellow-900">Category B (Medium Value)</h4>
                                            <Badge variant="secondary" className="bg-yellow-600">
                                                {abc_analysis.category_summary.B.count} items
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-yellow-700">Inventory Value</span>
                                            <span className="font-bold text-yellow-900">
                                                Rs {abc_analysis.category_summary.B.value.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-yellow-700">Percentage of Total</span>
                                            <span className="font-bold text-yellow-900">
                                                {totalValue > 0 ? ((abc_analysis.category_summary.B.value / totalValue) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={totalValue > 0 ? (abc_analysis.category_summary.B.value / totalValue) * 100 : 0}
                                            className="mt-2"
                                        />
                                    </div>

                                    {/* Category C */}
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-gray-900">Category C (Low Value)</h4>
                                            <Badge variant="outline" className="bg-gray-600 text-white">
                                                {abc_analysis.category_summary.C.count} items
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm text-gray-700">Inventory Value</span>
                                            <span className="font-bold text-gray-900">
                                                Rs {abc_analysis.category_summary.C.value.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-700">Percentage of Total</span>
                                            <span className="font-bold text-gray-900">
                                                {totalValue > 0 ? ((abc_analysis.category_summary.C.value / totalValue) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={totalValue > 0 ? (abc_analysis.category_summary.C.value / totalValue) * 100 : 0}
                                            className="mt-2"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ABC Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Category Details</CardTitle>
                                <CardDescription>
                                    Detailed breakdown by category
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="A" className="w-full">
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="A">Category A</TabsTrigger>
                                        <TabsTrigger value="B">Category B</TabsTrigger>
                                        <TabsTrigger value="C">Category C</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="A" className="space-y-3 mt-4">
                                        <div className="text-sm text-muted-foreground mb-3">
                                            High-value items requiring close attention and frequent monitoring
                                        </div>
                                        {(abc_analysis.A || []).map((book) => (
                                            <div key={book.book_id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">{book.title}</div>
                                                    <div className="text-sm text-muted-foreground">by {book.author}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">Rs {book.inventory_value.toFixed(2)}</div>
                                                    <div className="text-sm text-muted-foreground">Qty: {book.quantity}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </TabsContent>

                                    <TabsContent value="B" className="space-y-3 mt-4">
                                        <div className="text-sm text-muted-foreground mb-3">
                                            Medium-value items requiring moderate attention
                                        </div>
                                        {(abc_analysis.B || []).map((book) => (
                                            <div key={book.book_id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">{book.title}</div>
                                                    <div className="text-sm text-muted-foreground">by {book.author}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">Rs. {book.inventory_value.toFixed(2)}</div>
                                                    <div className="text-sm text-muted-foreground">Qty: {book.quantity}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </TabsContent>

                                    <TabsContent value="C" className="space-y-3 mt-4">
                                        <div className="text-sm text-muted-foreground mb-3">
                                            Low-value items that can be managed with minimal attention
                                        </div>
                                        {(abc_analysis.C || []).map((book) => (
                                            <div key={book.book_id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">{book.title}</div>
                                                    <div className="text-sm text-muted-foreground">by {book.author}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">Rs {book.inventory_value.toFixed(2)}</div>
                                                    <div className="text-sm text-muted-foreground">Qty: {book.quantity}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Stock Turnover Tab */}
                <TabsContent value="turnover" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Turnover Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Stock Turnover Analysis</CardTitle>
                                <CardDescription>
                                    How quickly your inventory is moving
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">{turnover_analysis.turnover_summary?.high || 0}</div>
                                            <div className="text-sm font-medium">High Turnover</div>
                                            <div className="text-xs text-muted-foreground">≥12x per year</div>
                                        </div>
                                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                            <div className="text-2xl font-bold text-yellow-600">{turnover_analysis.turnover_summary?.medium || 0}</div>
                                            <div className="text-sm font-medium">Medium Turnover</div>
                                            <div className="text-xs text-muted-foreground">4-12x per year</div>
                                        </div>
                                        <div className="text-center p-4 bg-red-50 rounded-lg">
                                            <div className="text-2xl font-bold text-red-600">{turnover_analysis.turnover_summary?.low || 0}</div>
                                            <div className="text-sm font-medium">Low Turnover</div>
                                            <div className="text-xs text-muted-foreground">&lt;4x per year</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Turnover Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Books</CardTitle>
                                <CardDescription>
                                    Books with highest turnover rates
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(turnover_analysis.books || [])
                                        .sort((a, b) => (b.turnover_ratio || 0) - (a.turnover_ratio || 0))
                                        .slice(0, 10)
                                        .map((book) => (
                                            <div key={book.book_id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div>
                                                    <div className="font-medium">{book.title}</div>
                                                    <div className="text-sm text-muted-foreground">Stock: {book.current_stock}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{book.turnover_ratio}x/year</div>
                                                    <Badge
                                                        variant={
                                                            book.turnover_category === 'HIGH' ? 'default' :
                                                                book.turnover_category === 'MEDIUM' ? 'secondary' : 'destructive'
                                                        }
                                                    >
                                                        {book.turnover_category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Critical Items Tab */}
                <TabsContent value="critical" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Critical & Low Stock Items</CardTitle>
                            <CardDescription>
                                Items requiring immediate attention
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summary.critical_items === 0 && summary.low_stock_items === 0 ? (
                                <div className="text-center py-8">
                                    <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                    <div className="text-lg font-medium text-green-600">All Good!</div>
                                    <div className="text-sm text-muted-foreground">
                                        No critical or low stock items at the moment.
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(inventoryData?.critical_items || []).map((item) => (
                                        <div key={item.book_id} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-red-800">{item.title}</div>
                                                    <div className="text-sm text-red-600">by {item.author}</div>
                                                    <div className="text-sm text-red-600">
                                                        Current: {item.current_quantity} | Reorder Point: {item.reorder_point}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="destructive">CRITICAL</Badge>
                                                    <div className="text-sm text-red-600 mt-1">
                                                        EOQ: {item.economic_order_quantity}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(inventoryData?.low_stock_items || []).map((item) => (
                                        <div key={item.book_id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium text-yellow-800">{item.title}</div>
                                                    <div className="text-sm text-yellow-600">by {item.author}</div>
                                                    <div className="text-sm text-yellow-600">
                                                        Current: {item.current_quantity} | Reorder Point: {item.reorder_point}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="secondary">LOW STOCK</Badge>
                                                    <div className="text-sm text-yellow-600 mt-1">
                                                        EOQ: {item.economic_order_quantity}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Recommendations Tab */}
                <TabsContent value="recommendations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Inventory Recommendations</CardTitle>
                            {/* <CardDescription>
                                AI-powered suggestions for inventory optimization
                            </CardDescription> */}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* High Priority */}
                                {(inventoryData?.recommendations.high_priority || []).length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-red-800 mb-3 flex items-center">
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            High Priority Actions
                                        </h4>
                                        <div className="space-y-2">
                                            {inventoryData?.recommendations.high_priority && inventoryData.recommendations.high_priority.map((rec, index) => (
                                                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-red-800">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Medium Priority */}
                                {(inventoryData?.recommendations.medium_priority || []).length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-yellow-800 mb-3 flex items-center">
                                            <Target className="h-4 w-4 mr-2" />
                                            Medium Priority Actions
                                        </h4>
                                        <div className="space-y-2">
                                            {inventoryData?.recommendations.medium_priority && inventoryData.recommendations.medium_priority.map((rec, index) => (
                                                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                    <p className="text-yellow-800">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Low Priority */}
                                {(inventoryData?.recommendations.low_priority || []).length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
                                            <Zap className="h-4 w-4 mr-2" />
                                            Low Priority Actions
                                        </h4>
                                        <div className="space-y-2">
                                            {inventoryData?.recommendations.low_priority && inventoryData.recommendations.low_priority.map((rec, index) => (
                                                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                    <p className="text-blue-800">{rec}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(!inventoryData?.recommendations.high_priority?.length &&
                                    !inventoryData?.recommendations.medium_priority?.length &&
                                    !inventoryData?.recommendations.low_priority?.length) && (
                                        <div className="text-center py-8">
                                            <BarChart3 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                                            <div className="text-lg font-medium text-green-600">No Recommendations</div>
                                            <div className="text-sm text-muted-foreground">
                                                Your inventory is well-optimized at the moment.
                                            </div>
                                        </div>
                                    )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
