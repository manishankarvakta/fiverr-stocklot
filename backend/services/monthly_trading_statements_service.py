from datetime import datetime, timezone, timedelta
from typing import Dict, List, Any, Optional
from decimal import Decimal
import logging
from pymongo.database import Database

logger = logging.getLogger(__name__)

class MonthlyTradingStatementsService:
    """Service for generating monthly trading statements for buyers and sellers"""
    
    def __init__(self, db: Database):
        self.db = db
        
    async def get_seller_monthly_statement(self, seller_id: str, year: int, month: int) -> Dict[str, Any]:
        """Generate monthly trading statement for seller"""
        try:
            # Define date range for the month
            start_date = datetime(year, month, 1, tzinfo=timezone.utc)
            if month == 12:
                end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
            
            # Get completed orders for the seller in this month
            orders_cursor = self.db.orders.find({
                "seller_id": seller_id,
                "status": "completed",
                "completed_at": {
                    "$gte": start_date,
                    "$lt": end_date
                }
            })
            orders = await orders_cursor.to_list(length=None)
            
            # Calculate revenue metrics
            total_revenue = Decimal('0')
            total_orders = len(orders)
            total_quantity_sold = 0
            platform_fees = Decimal('0')
            delivery_earnings = Decimal('0')
            net_earnings = Decimal('0')
            
            order_details = []
            species_breakdown = {}
            daily_sales = {}
            
            for order in orders:
                order_date = order.get("completed_at", order.get("created_at"))
                if isinstance(order_date, str):
                    order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
                
                day_key = order_date.strftime('%Y-%m-%d')
                
                # Order totals
                merchandise_total = Decimal(str(order.get("merchandise_total", 0)))
                delivery_cost = Decimal(str(order.get("delivery_cost", 0)))
                platform_fee = Decimal(str(order.get("platform_fee", 0)))
                
                total_revenue += merchandise_total
                delivery_earnings += delivery_cost
                platform_fees += platform_fee
                total_quantity_sold += order.get("quantity", 0)
                
                # Daily breakdown
                if day_key not in daily_sales:
                    daily_sales[day_key] = {
                        "orders": 0,
                        "revenue": Decimal('0'),
                        "quantity": 0
                    }
                
                daily_sales[day_key]["orders"] += 1
                daily_sales[day_key]["revenue"] += merchandise_total
                daily_sales[day_key]["quantity"] += order.get("quantity", 0)
                
                # Species breakdown
                species_name = order.get("species_name", "Unknown")
                if species_name not in species_breakdown:
                    species_breakdown[species_name] = {
                        "orders": 0,
                        "revenue": Decimal('0'),
                        "quantity": 0
                    }
                
                species_breakdown[species_name]["orders"] += 1
                species_breakdown[species_name]["revenue"] += merchandise_total
                species_breakdown[species_name]["quantity"] += order.get("quantity", 0)
                
                # Order detail
                order_details.append({
                    "order_id": order.get("id"),
                    "date": order_date.strftime('%Y-%m-%d'),
                    "buyer_name": order.get("buyer_name", "Anonymous"),
                    "species": species_name,
                    "quantity": order.get("quantity", 0),
                    "unit_price": float(order.get("unit_price", 0)),
                    "merchandise_total": float(merchandise_total),
                    "delivery_cost": float(delivery_cost),
                    "platform_fee": float(platform_fee)
                })
            
            net_earnings = total_revenue + delivery_earnings - platform_fees
            
            # Get seller info
            seller_doc = await self.db.users.find_one({"id": seller_id})
            seller_name = seller_doc.get("full_name", "Unknown Seller") if seller_doc else "Unknown Seller"
            
            # Convert daily sales to list format
            daily_sales_list = []
            for date_str, data in sorted(daily_sales.items()):
                daily_sales_list.append({
                    "date": date_str,
                    "orders": data["orders"],
                    "revenue": float(data["revenue"]),
                    "quantity": data["quantity"]
                })
            
            # Convert species breakdown to list format
            species_breakdown_list = []
            for species, data in species_breakdown.items():
                species_breakdown_list.append({
                    "species": species,
                    "orders": data["orders"],
                    "revenue": float(data["revenue"]),
                    "quantity": data["quantity"],
                    "percentage": float((data["revenue"] / total_revenue * 100) if total_revenue > 0 else 0)
                })
            
            return {
                "statement_type": "seller",
                "seller_id": seller_id,
                "seller_name": seller_name,
                "period": {
                    "year": year,
                    "month": month,
                    "month_name": start_date.strftime('%B'),
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "summary": {
                    "total_orders": total_orders,
                    "total_revenue": float(total_revenue),
                    "total_quantity_sold": total_quantity_sold,
                    "platform_fees": float(platform_fees),
                    "delivery_earnings": float(delivery_earnings),
                    "net_earnings": float(net_earnings),
                    "average_order_value": float(total_revenue / total_orders) if total_orders > 0 else 0
                },
                "daily_breakdown": daily_sales_list,
                "species_breakdown": species_breakdown_list,
                "order_details": order_details,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating seller monthly statement: {e}")
            raise
    
    async def get_buyer_monthly_statement(self, buyer_id: str, year: int, month: int) -> Dict[str, Any]:
        """Generate monthly trading statement for buyer"""
        try:
            # Define date range for the month
            start_date = datetime(year, month, 1, tzinfo=timezone.utc)
            if month == 12:
                end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
            
            # Get completed orders for the buyer in this month
            orders_cursor = self.db.orders.find({
                "buyer_id": buyer_id,
                "status": "completed",
                "completed_at": {
                    "$gte": start_date,
                    "$lt": end_date
                }
            })
            orders = await orders_cursor.to_list(length=None)
            
            # Calculate expense metrics
            total_spent = Decimal('0')
            total_orders = len(orders)
            total_quantity_purchased = 0
            delivery_costs = Decimal('0')
            platform_fees = Decimal('0')
            
            order_details = []
            species_breakdown = {}
            daily_purchases = {}
            seller_breakdown = {}
            
            for order in orders:
                order_date = order.get("completed_at", order.get("created_at"))
                if isinstance(order_date, str):
                    order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
                
                day_key = order_date.strftime('%Y-%m-%d')
                
                # Order totals
                merchandise_total = Decimal(str(order.get("merchandise_total", 0)))
                delivery_cost = Decimal(str(order.get("delivery_cost", 0)))
                platform_fee = Decimal(str(order.get("platform_fee", 0)))
                grand_total = merchandise_total + delivery_cost + platform_fee
                
                total_spent += grand_total
                delivery_costs += delivery_cost
                platform_fees += platform_fee
                total_quantity_purchased += order.get("quantity", 0)
                
                # Daily breakdown
                if day_key not in daily_purchases:
                    daily_purchases[day_key] = {
                        "orders": 0,
                        "total_spent": Decimal('0'),
                        "quantity": 0
                    }
                
                daily_purchases[day_key]["orders"] += 1
                daily_purchases[day_key]["total_spent"] += grand_total
                daily_purchases[day_key]["quantity"] += order.get("quantity", 0)
                
                # Species breakdown
                species_name = order.get("species_name", "Unknown")
                if species_name not in species_breakdown:
                    species_breakdown[species_name] = {
                        "orders": 0,
                        "total_spent": Decimal('0'),
                        "quantity": 0
                    }
                
                species_breakdown[species_name]["orders"] += 1
                species_breakdown[species_name]["total_spent"] += grand_total
                species_breakdown[species_name]["quantity"] += order.get("quantity", 0)
                
                # Seller breakdown
                seller_name = order.get("seller_name", "Unknown Seller")
                if seller_name not in seller_breakdown:
                    seller_breakdown[seller_name] = {
                        "orders": 0,
                        "total_spent": Decimal('0'),
                        "quantity": 0
                    }
                
                seller_breakdown[seller_name]["orders"] += 1
                seller_breakdown[seller_name]["total_spent"] += grand_total
                seller_breakdown[seller_name]["quantity"] += order.get("quantity", 0)
                
                # Order detail
                order_details.append({
                    "order_id": order.get("id"),
                    "date": order_date.strftime('%Y-%m-%d'),
                    "seller_name": seller_name,
                    "species": species_name,
                    "quantity": order.get("quantity", 0),
                    "unit_price": float(order.get("unit_price", 0)),
                    "merchandise_total": float(merchandise_total),
                    "delivery_cost": float(delivery_cost),
                    "platform_fee": float(platform_fee),
                    "grand_total": float(grand_total)
                })
            
            # Get buyer info
            buyer_doc = await self.db.users.find_one({"id": buyer_id})
            buyer_name = buyer_doc.get("full_name", "Unknown Buyer") if buyer_doc else "Unknown Buyer"
            
            # Convert daily purchases to list format
            daily_purchases_list = []
            for date_str, data in sorted(daily_purchases.items()):
                daily_purchases_list.append({
                    "date": date_str,
                    "orders": data["orders"],
                    "total_spent": float(data["total_spent"]),
                    "quantity": data["quantity"]
                })
            
            # Convert breakdowns to list format
            species_breakdown_list = []
            for species, data in species_breakdown.items():
                species_breakdown_list.append({
                    "species": species,
                    "orders": data["orders"],
                    "total_spent": float(data["total_spent"]),
                    "quantity": data["quantity"],
                    "percentage": float((data["total_spent"] / total_spent * 100) if total_spent > 0 else 0)
                })
            
            seller_breakdown_list = []
            for seller, data in seller_breakdown.items():
                seller_breakdown_list.append({
                    "seller": seller,
                    "orders": data["orders"],
                    "total_spent": float(data["total_spent"]),
                    "quantity": data["quantity"],
                    "percentage": float((data["total_spent"] / total_spent * 100) if total_spent > 0 else 0)
                })
            
            return {
                "statement_type": "buyer",
                "buyer_id": buyer_id,
                "buyer_name": buyer_name,
                "period": {
                    "year": year,
                    "month": month,
                    "month_name": start_date.strftime('%B'),
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat()
                },
                "summary": {
                    "total_orders": total_orders,
                    "total_spent": float(total_spent),
                    "total_quantity_purchased": total_quantity_purchased,
                    "delivery_costs": float(delivery_costs),
                    "platform_fees": float(platform_fees),
                    "average_order_value": float(total_spent / total_orders) if total_orders > 0 else 0
                },
                "daily_breakdown": daily_purchases_list,
                "species_breakdown": species_breakdown_list,
                "seller_breakdown": seller_breakdown_list,
                "order_details": order_details,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating buyer monthly statement: {e}")
            raise
    
    async def get_available_periods(self, user_id: str, user_type: str) -> List[Dict[str, Any]]:
        """Get available periods for which statements can be generated"""
        try:
            filter_field = "seller_id" if user_type == "seller" else "buyer_id"
            
            # Get earliest and latest order dates
            pipeline = [
                {"$match": {filter_field: user_id, "status": "completed"}},
                {"$group": {
                    "_id": None,
                    "earliest": {"$min": "$completed_at"},
                    "latest": {"$max": "$completed_at"}
                }}
            ]
            
            result = await self.db.orders.aggregate(pipeline).to_list(length=1)
            
            if not result:
                return []
            
            earliest = result[0]["earliest"]
            latest = result[0]["latest"]
            
            if isinstance(earliest, str):
                earliest = datetime.fromisoformat(earliest.replace('Z', '+00:00'))
            if isinstance(latest, str):
                latest = datetime.fromisoformat(latest.replace('Z', '+00:00'))
            
            # Generate list of available months
            periods = []
            current = datetime(earliest.year, earliest.month, 1)
            end = datetime(latest.year, latest.month, 1)
            
            while current <= end:
                periods.append({
                    "year": current.year,
                    "month": current.month,
                    "month_name": current.strftime('%B'),
                    "display": current.strftime('%B %Y')
                })
                
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1)
                else:
                    current = current.replace(month=current.month + 1)
            
            return sorted(periods, key=lambda x: (x["year"], x["month"]), reverse=True)
            
        except Exception as e:
            logger.error(f"Error getting available periods: {e}")
            return []