import numpy as np
from django.db import connection
from datetime import datetime, timedelta
import math
from typing import Dict, List, Optional

class InventoryManagementEngine:
    """
    Advanced Inventory Management System with multiple algorithms:
    1. Economic Order Quantity (EOQ)
    2. Safety Stock Calculation
    3. Reorder Point Analysis
    4. ABC Analysis (Pareto Principle)
    5. Demand Forecasting (Simple Moving Average)
    6. Stock Turnover Analysis
    """
    
    def __init__(self):
        self.safety_factor = 1.5  # Safety stock multiplier
        self.reorder_point_factor = 0.2  # Reorder when 20% stock remains
        self.abc_thresholds = {
            'A': 0.8,  # Top 20% of items (80% of value)
            'B': 0.95,  # Next 15% of items (15% of value)
            'C': 1.0   # Remaining 65% of items (5% of value)
        }
    
    def calculate_demand_forecast(self, book_id: str, days: int = 30) -> Dict:
        """
        Calculate demand forecast using Simple Moving Average
        Works with limited historical data
        """
        with connection.cursor() as cursor:
            # Get historical sales data (last 90 days)
            cursor.execute("""
                SELECT 
                    DATE(oi.created_at) as sale_date,
                    SUM(oi.quantity) as daily_sales
                FROM orders_orderitem oi
                JOIN orders_order o ON oi.order_id = o.id
                WHERE oi.book_id = %s
                AND oi.created_at >= NOW() - INTERVAL '90 days'
                GROUP BY DATE(oi.created_at)
                ORDER BY sale_date
            """, [book_id])
            
            sales_data = cursor.fetchall()
        
        if not sales_data:
            return {
                'avg_daily_demand': 0,
                'demand_std': 0,
                'forecasted_demand': 0,
                'confidence_interval': {'lower': 0, 'upper': 0},
                'data_points': 0,
                'forecast_method': 'no_data'
            }
        
        # Calculate average daily demand
        daily_sales = [row[1] for row in sales_data]
        avg_daily_demand = np.mean(daily_sales)
        
        # Calculate demand variability (standard deviation)
        demand_std = np.std(daily_sales) if len(daily_sales) > 1 else 0
        
        # Forecast demand for next 'days' period
        forecasted_demand = avg_daily_demand * days
        
        # Calculate confidence interval (95% confidence)
        confidence_margin = 1.96 * demand_std * math.sqrt(days) if demand_std > 0 else 0
        
        return {
            'avg_daily_demand': round(avg_daily_demand, 2),
            'demand_std': round(demand_std, 2),
            'forecasted_demand': round(forecasted_demand, 2),
            'confidence_interval': {
                'lower': round(max(0, forecasted_demand - confidence_margin), 2),
                'upper': round(forecasted_demand + confidence_margin, 2)
            },
            'data_points': len(daily_sales),
            'forecast_method': 'simple_moving_average'
        }
    
    def calculate_economic_order_quantity(self, book_id: str) -> Optional[Dict]:
        """
        Calculate Economic Order Quantity (EOQ) with safety stock
        """
        with connection.cursor() as cursor:
            # Get book details and sales data
            cursor.execute("""
                SELECT 
                    b.price,
                    b.quantity as current_quantity,
                    b.title,
                    b.author,
                    (SELECT COUNT(*) FROM orders_orderitem oi 
                     WHERE oi.book_id = b.id 
                     AND oi.created_at >= NOW() - INTERVAL '30 days') as monthly_demand,
                    (SELECT COUNT(*) FROM orders_orderitem oi 
                     WHERE oi.book_id = b.id 
                     AND oi.created_at >= NOW() - INTERVAL '90 days') as quarterly_demand
                FROM books_book b
                WHERE b.id = %s
            """, [book_id])
            
            row = cursor.fetchone()
            if not row:
                return None
            
            price, current_quantity, title, author, monthly_demand, quarterly_demand = row
        
        # Use quarterly demand if monthly is too low
        annual_demand = max(monthly_demand * 12, quarterly_demand * 4)
        
        # Assumptions for EOQ calculation
        ordering_cost = 5  # Fixed cost per order (lower for books)
        holding_cost_rate = 0.15  # 15% of item cost per year (books depreciate)
        holding_cost_per_unit = float(price) * holding_cost_rate
        
        # EOQ formula: sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit)
        if holding_cost_per_unit > 0 and annual_demand > 0:
            eoq = math.sqrt((2 * annual_demand * ordering_cost) / holding_cost_per_unit)
        else:
            eoq = 1  # Minimum order quantity
        
        # Calculate safety stock
        safety_stock = self.calculate_safety_stock(book_id)
        
        # Calculate reorder point (lead time = 7 days)
        lead_time_days = 7
        daily_demand = annual_demand / 365 if annual_demand > 0 else 0
        reorder_point = safety_stock + (daily_demand * lead_time_days)
        
        # Calculate total annual cost
        total_annual_cost = 0
        if eoq > 0:
            ordering_cost_annual = (annual_demand / eoq) * ordering_cost
            holding_cost_annual = (eoq / 2) * holding_cost_per_unit
            total_annual_cost = ordering_cost_annual + holding_cost_annual
        
        return {
            'book_id': book_id,
            'title': title,
            'author': author,
            'current_quantity': current_quantity,
            'price': price,
            'economic_order_quantity': round(eoq, 0),
            'safety_stock': round(safety_stock, 0),
            'reorder_point': round(reorder_point, 0),
            'annual_demand': annual_demand,
            'monthly_demand': monthly_demand,
            'daily_demand': round(daily_demand, 2),
            'ordering_cost': ordering_cost,
            'holding_cost_per_unit': round(holding_cost_per_unit, 2),
            'total_annual_cost': round(total_annual_cost, 2),
            'stock_status': self.get_stock_status(current_quantity, reorder_point, safety_stock)
        }
    
    def calculate_safety_stock(self, book_id: str) -> float:
        """
        Calculate safety stock using demand variability
        """
        with connection.cursor() as cursor:
            # Get demand variability
            cursor.execute("""
                SELECT 
                    STDDEV(oi.quantity) as demand_std,
                    AVG(oi.quantity) as avg_demand,
                    COUNT(*) as data_points
                FROM orders_orderitem oi
                JOIN orders_order o ON oi.order_id = o.id
                WHERE oi.book_id = %s
                AND oi.created_at >= NOW() - INTERVAL '90 days'
            """, [book_id])
            
            row = cursor.fetchone()
            if not row or not row[0] or row[2] < 3:  # Need at least 3 data points
                return 1  # Default safety stock of 1
            
            demand_std, avg_demand, data_points = row
            
            # Safety stock = Z * demand_std * sqrt(lead_time)
            # Z = 1.96 for 95% service level
            lead_time_days = 7
            safety_stock = 1.96 * demand_std * math.sqrt(lead_time_days)
            
            # Ensure minimum safety stock
            return max(safety_stock, 1)
    
    def get_stock_status(self, current_quantity: int, reorder_point: float, safety_stock: float) -> Dict:
        """
        Determine stock status and recommendations
        """
        if current_quantity <= safety_stock:
            status = 'CRITICAL'
            message = 'Stock is critically low - immediate reorder needed'
            priority = 'HIGH'
        elif current_quantity <= reorder_point:
            status = 'LOW'
            message = 'Stock is below reorder point - consider reordering'
            priority = 'MEDIUM'
        else:
            status = 'OK'
            message = 'Stock levels are adequate'
            priority = 'LOW'
        
        return {
            'status': status,
            'message': message,
            'priority': priority,
            'days_until_stockout': self.calculate_days_until_stockout(current_quantity, reorder_point)
        }
    
    def calculate_days_until_stockout(self, current_quantity: int, reorder_point: float) -> Optional[int]:
        """
        Calculate days until stockout based on current demand
        """
        if current_quantity <= 0:
            return 0
        
        # Get average daily demand
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT AVG(daily_sales) as avg_daily_demand
                FROM (
                    SELECT DATE(oi.created_at) as sale_date, SUM(oi.quantity) as daily_sales
                    FROM orders_orderitem oi
                    JOIN orders_order o ON oi.order_id = o.id
                    WHERE oi.created_at >= NOW() - INTERVAL '30 days'
                    GROUP BY DATE(oi.created_at)
                ) as daily_data
            """)
            
            row = cursor.fetchone()
            avg_daily_demand = row[0] if row and row[0] else 0.1  # Default to 0.1 if no data
        
        if avg_daily_demand <= 0:
            return None  # No demand, won't stockout
        
        days_until_stockout = current_quantity / avg_daily_demand
        return round(days_until_stockout, 1)
    
    def perform_abc_analysis(self, seller_id: str) -> Dict:
        """
        Perform ABC Analysis (Pareto Principle) on inventory
        A: High-value items (80% of value, 20% of items)
        B: Medium-value items (15% of value, 30% of items)
        C: Low-value items (5% of value, 50% of items)
        """
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    b.id,
                    b.title,
                    b.author,
                    b.price,
                    b.quantity,
                    (CAST(b.price AS FLOAT) * b.quantity) as inventory_value,
                    (SELECT COUNT(*) FROM orders_orderitem oi 
                     WHERE oi.book_id = b.id 
                     AND oi.created_at >= NOW() - INTERVAL '30 days') as monthly_sales
                FROM books_book b
                WHERE b.seller_id = %s AND b.is_active = true
                ORDER BY (b.price * b.quantity) DESC
            """, [seller_id])
            
            books = cursor.fetchall()
        
        if not books:
            return {'A': [], 'B': [], 'C': [], 'total_value': 0}
        
        # Calculate total inventory value
        total_value = sum(book[5] for book in books)
        
        # Sort by inventory value
        sorted_books = sorted(books, key=lambda x: x[5], reverse=True)
        
        # Categorize books
        cumulative_value = 0
        categories = {'A': [], 'B': [], 'C': []}
        
        for book in sorted_books:
            book_id, title, author, price, quantity, inventory_value, monthly_sales = book
            cumulative_value += inventory_value
            cumulative_percentage = cumulative_value / total_value if total_value > 0 else 0
            
            book_data = {
                'book_id': book_id,
                'title': title,
                'author': author,
                'price': price,
                'quantity': quantity,
                'inventory_value': inventory_value,
                'monthly_sales': monthly_sales,
                'cumulative_percentage': round(cumulative_percentage * 100, 2)
            }
            
            if cumulative_percentage <= self.abc_thresholds['A']:
                categories['A'].append(book_data)
            elif cumulative_percentage <= self.abc_thresholds['B']:
                categories['B'].append(book_data)
            else:
                categories['C'].append(book_data)
        
        return {
            'A': categories['A'],
            'B': categories['B'],
            'C': categories['C'],
            'total_value': total_value,
            'category_summary': {
                'A': {'count': len(categories['A']), 'value': sum(b['inventory_value'] for b in categories['A'])},
                'B': {'count': len(categories['B']), 'value': sum(b['inventory_value'] for b in categories['B'])},
                'C': {'count': len(categories['C']), 'value': sum(b['inventory_value'] for b in categories['C'])}
            }
        }
    
    def calculate_stock_turnover(self, seller_id: str) -> Dict:
        """
        Calculate stock turnover ratio for inventory analysis
        """
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    b.id,
                    b.title,
                    b.price,
                    b.quantity as current_stock,
                    (SELECT COUNT(*) FROM orders_orderitem oi 
                     WHERE oi.book_id = b.id 
                     AND oi.created_at >= NOW() - INTERVAL '30 days') as monthly_sales,
                    (SELECT COUNT(*) FROM orders_orderitem oi 
                     WHERE oi.book_id = b.id 
                     AND oi.created_at >= NOW() - INTERVAL '90 days') as quarterly_sales
                FROM books_book b
                WHERE b.seller_id = %s AND b.is_active = true
            """, [seller_id])
            
            books = cursor.fetchall()
        
        turnover_data = []
        total_turnover = 0
        total_items = 0
        
        for book in books:
            book_id, title, price, current_stock, monthly_sales, quarterly_sales = book
            
            # Calculate annual sales (extrapolate from available data)
            annual_sales = max(monthly_sales * 12, quarterly_sales * 4)
            
            # Calculate average inventory (simplified as current stock)
            avg_inventory = current_stock
            
            # Calculate turnover ratio
            turnover_ratio = annual_sales / avg_inventory if avg_inventory > 0 else 0
            
            turnover_data.append({
                'book_id': book_id,
                'title': title,
                'price': price,
                'current_stock': current_stock,
                'annual_sales': annual_sales,
                'turnover_ratio': round(turnover_ratio, 2),
                'turnover_category': self.categorize_turnover(turnover_ratio)
            })
            
            total_turnover += turnover_ratio
            total_items += 1
        
        avg_turnover = total_turnover / total_items if total_items > 0 else 0
        
        return {
            'books': turnover_data,
            'average_turnover': round(avg_turnover, 2),
            'total_items': total_items,
            'turnover_summary': {
                'high': len([b for b in turnover_data if b['turnover_category'] == 'HIGH']),
                'medium': len([b for b in turnover_data if b['turnover_category'] == 'MEDIUM']),
                'low': len([b for b in turnover_data if b['turnover_category'] == 'LOW'])
            }
        }
    
    def categorize_turnover(self, turnover_ratio: float) -> str:
        """
        Categorize turnover ratio
        """
        if turnover_ratio >= 12:  # More than once per month
            return 'HIGH'
        elif turnover_ratio >= 4:  # More than once per quarter
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def get_inventory_recommendations(self, seller_id: str) -> Dict:
        """
        Get comprehensive inventory recommendations
        """
        # Get EOQ analysis for all books
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT id FROM books_book 
                WHERE seller_id = %s AND is_active = true
            """, [seller_id])
            
            book_ids = [row[0] for row in cursor.fetchall()]
        
        eoq_analyses = []
        critical_items = []
        low_stock_items = []
        
        for book_id in book_ids:
            eoq_analysis = self.calculate_economic_order_quantity(book_id)
            if eoq_analysis:
                eoq_analyses.append(eoq_analysis)
                
                # Categorize by urgency
                if eoq_analysis['stock_status']['priority'] == 'HIGH':
                    critical_items.append(eoq_analysis)
                elif eoq_analysis['stock_status']['priority'] == 'MEDIUM':
                    low_stock_items.append(eoq_analysis)
        
        # Perform ABC Analysis
        abc_analysis = self.perform_abc_analysis(seller_id)
        
        # Calculate Stock Turnover
        turnover_analysis = self.calculate_stock_turnover(seller_id)
        
        return {
            'seller_id': seller_id,
            'summary': {
                'total_books': len(eoq_analyses),
                'critical_items': len(critical_items),
                'low_stock_items': len(low_stock_items),
                'ok_items': len(eoq_analyses) - len(critical_items) - len(low_stock_items)
            },
            'critical_items': critical_items,
            'low_stock_items': low_stock_items,
            'abc_analysis': abc_analysis,
            'turnover_analysis': turnover_analysis,
            'recommendations': self.generate_recommendations(
                critical_items, low_stock_items, abc_analysis, turnover_analysis
            )
        }
    
    def generate_recommendations(self, critical_items: List, low_stock_items: List, 
                                abc_analysis: Dict, turnover_analysis: Dict) -> List[str]:
        """
        Generate actionable recommendations
        """
        recommendations = []
        
        # Critical stock recommendations
        if critical_items:
            recommendations.append(
                f"URGENT: {len(critical_items)} items need immediate reordering"
            )
        
        if low_stock_items:
            recommendations.append(
                f"Monitor: {len(low_stock_items)} items are approaching reorder point"
            )
        
        # ABC Analysis recommendations
        if abc_analysis['A']:
            recommendations.append(
                f"Focus on {len(abc_analysis['A'])} high-value items (Category A) - prioritize their inventory management"
            )
        
        if abc_analysis['C']:
            recommendations.append(
                f"Review {len(abc_analysis['C'])} low-value items (Category C) - consider reducing stock or discontinuing"
            )
        
        # Turnover recommendations
        low_turnover_count = turnover_analysis['turnover_summary']['low']
        if low_turnover_count > 0:
            recommendations.append(
                f"Optimize: {low_turnover_count} items have low turnover - consider price adjustments or promotions"
            )
        
        return recommendations
