"""
Bulk Inventory Service - Bulk Updates & CSV Processing
"""

import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Optional
from models_expansion import BulkUpdateRecord, BulkUpdateRequest, BulkUpdateResult
import uuid

class BulkInventoryService:
    def __init__(self):
        self.name = "BulkInventoryService"
        # Mock inventory data
        self.inventory = {
            "listing-001": {
                "id": "listing-001",
                "title": "Premium Angus Bulls",
                "quantity": 25,
                "price_per_unit": 28000.0,
                "unit": "head",
                "status": "available",
                "seller_id": "seller-123"
            },
            "listing-002": {
                "id": "listing-002", 
                "title": "Broiler Chickens",
                "quantity": 500,
                "price_per_unit": 180.0,
                "unit": "head",
                "status": "available",
                "seller_id": "seller-123"
            },
            "listing-003": {
                "id": "listing-003",
                "title": "Boer Goat Does", 
                "quantity": 15,
                "price_per_unit": 4200.0,
                "unit": "head",
                "status": "limited",
                "seller_id": "seller-123"
            }
        }
    
    async def process_csv_upload(self, csv_content: str, seller_id: str) -> BulkUpdateResult:
        """Process CSV file for bulk inventory updates."""
        
        try:
            # Parse CSV content
            csv_reader = csv.DictReader(io.StringIO(csv_content))
            records = []
            errors = []
            
            for row_num, row in enumerate(csv_reader, start=2):  # Start at 2 (header is row 1)
                try:
                    # Validate required fields
                    if not row.get('listing_id'):
                        errors.append({
                            "row": row_num,
                            "message": "Missing required field: listing_id"
                        })
                        continue
                    
                    # Parse and validate data
                    record_data = {}
                    
                    if row.get('quantity'):
                        try:
                            record_data['quantity'] = int(row['quantity'])
                        except ValueError:
                            errors.append({
                                "row": row_num,
                                "message": "Invalid quantity value"
                            })
                            continue
                    
                    if row.get('price_per_unit'):
                        try:
                            record_data['price_per_unit'] = float(row['price_per_unit'])
                        except ValueError:
                            errors.append({
                                "row": row_num,
                                "message": "Invalid price_per_unit value"
                            })
                            continue
                    
                    if row.get('status'):
                        valid_statuses = ['available', 'limited', 'out_of_stock', 'reserved']
                        if row['status'] not in valid_statuses:
                            errors.append({
                                "row": row_num,
                                "message": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
                            })
                            continue
                        record_data['status'] = row['status']
                    
                    if row.get('reserved_quantity'):
                        try:
                            record_data['reserved_quantity'] = int(row['reserved_quantity'])
                        except ValueError:
                            errors.append({
                                "row": row_num,
                                "message": "Invalid reserved_quantity value"
                            })
                            continue
                    
                    if row.get('notes'):
                        record_data['notes'] = row['notes']
                    
                    # Check if listing exists and belongs to seller
                    listing_id = row['listing_id']
                    if listing_id not in self.inventory:
                        errors.append({
                            "row": row_num,
                            "message": f"Listing {listing_id} not found"
                        })
                        continue
                    
                    if self.inventory[listing_id]["seller_id"] != seller_id:
                        errors.append({
                            "row": row_num,
                            "message": f"Listing {listing_id} does not belong to current seller"
                        })
                        continue
                    
                    # Create record
                    record = BulkUpdateRecord(
                        listing_id=listing_id,
                        **record_data
                    )
                    records.append(record)
                    
                except Exception as e:
                    errors.append({
                        "row": row_num,
                        "message": f"Error processing row: {str(e)}"
                    })
            
            # Return results
            total_rows = len(records) + len(errors)
            success_count = len(records)
            
            return BulkUpdateResult(
                success=len(errors) == 0,
                message=f"Processed {total_rows} rows. {success_count} valid, {len(errors)} errors.",
                total_processed=total_rows,
                successful_updates=success_count,
                failed_updates=len(errors),
                errors=errors,
                preview_data=[record.dict() for record in records[:10]]  # Preview first 10
            )
            
        except Exception as e:
            return BulkUpdateResult(
                success=False,
                message=f"Failed to process CSV: {str(e)}",
                total_processed=0,
                successful_updates=0,
                failed_updates=0,
                errors=[{"row": 0, "message": str(e)}]
            )
    
    async def apply_bulk_updates(self, request: BulkUpdateRequest, seller_id: str) -> BulkUpdateResult:
        """Apply bulk updates to inventory."""
        
        successful_updates = 0
        failed_updates = 0
        errors = []
        
        for record in request.records:
            try:
                # Verify listing ownership
                if record.listing_id not in self.inventory:
                    errors.append({
                        "listing_id": record.listing_id,
                        "message": "Listing not found"
                    })
                    failed_updates += 1
                    continue
                
                listing = self.inventory[record.listing_id]
                if listing["seller_id"] != seller_id:
                    errors.append({
                        "listing_id": record.listing_id,
                        "message": "Listing does not belong to current seller"
                    })
                    failed_updates += 1
                    continue
                
                # Apply updates
                if record.quantity is not None:
                    listing["quantity"] = record.quantity
                
                if record.price_per_unit is not None:
                    listing["price_per_unit"] = record.price_per_unit
                
                if record.status is not None:
                    listing["status"] = record.status
                
                if record.reserved_quantity is not None:
                    listing["reserved_quantity"] = record.reserved_quantity
                
                if record.notes is not None:
                    listing["notes"] = record.notes
                
                listing["updated_at"] = datetime.utcnow().isoformat()
                successful_updates += 1
                
            except Exception as e:
                errors.append({
                    "listing_id": record.listing_id,
                    "message": str(e)
                })
                failed_updates += 1
        
        return BulkUpdateResult(
            success=failed_updates == 0,
            message=f"Bulk update completed. {successful_updates} successful, {failed_updates} failed.",
            total_processed=len(request.records),
            successful_updates=successful_updates,
            failed_updates=failed_updates,
            errors=errors
        )
    
    async def get_inventory_for_seller(self, seller_id: str) -> List[Dict[str, Any]]:
        """Get all inventory items for a seller."""
        
        seller_inventory = [
            listing for listing in self.inventory.values()
            if listing["seller_id"] == seller_id
        ]
        
        return seller_inventory
    
    async def generate_csv_template(self) -> str:
        """Generate CSV template for bulk updates."""
        
        template_content = io.StringIO()
        writer = csv.writer(template_content)
        
        # Header row
        writer.writerow([
            'listing_id',
            'quantity', 
            'price_per_unit',
            'status',
            'reserved_quantity',
            'notes'
        ])
        
        # Example rows
        writer.writerow([
            'listing-001',
            '25',
            '28000.00',
            'available',
            '0',
            'Premium breeding stock'
        ])
        
        writer.writerow([
            'listing-002', 
            '500',
            '180.00',
            'available',
            '50',
            'Free range broilers'
        ])
        
        return template_content.getvalue()
    
    async def export_current_inventory(self, seller_id: str) -> str:
        """Export current inventory as CSV."""
        
        inventory_items = await self.get_inventory_for_seller(seller_id)
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'listing_id',
            'title',
            'quantity',
            'price_per_unit',
            'unit',
            'status',
            'reserved_quantity',
            'notes',
            'updated_at'
        ])
        
        # Data rows
        for item in inventory_items:
            writer.writerow([
                item.get('id', ''),
                item.get('title', ''),
                item.get('quantity', 0),
                item.get('price_per_unit', 0.0),
                item.get('unit', 'head'),
                item.get('status', 'available'),
                item.get('reserved_quantity', 0),
                item.get('notes', ''),
                item.get('updated_at', datetime.utcnow().isoformat())
            ])
        
        return output.getvalue()