#!/usr/bin/env python3
"""
StockLot UI Expansion - Component Verification Test
Verifies all 17 components are properly implemented and accessible.
"""

import os
import json
import re

def check_component_exists(component_path):
    """Check if component file exists and has proper React component structure."""
    if not os.path.exists(component_path):
        return False, "File does not exist"
    
    try:
        with open(component_path, 'r') as f:
            content = f.read()
            
        # Check for React component patterns
        has_react_import = 'import React' in content
        has_export_default = 'export default' in content
        has_component_structure = ('const ' in content and '= () => {') or ('function ' in content and '() {')
        
        if not has_react_import:
            return False, "Missing React import"
        if not has_export_default:
            return False, "Missing export default"
        if not has_component_structure:
            return False, "Missing component structure"
            
        return True, "Component structure valid"
        
    except Exception as e:
        return False, f"Error reading file: {str(e)}"

def check_route_in_app_js(route_path):
    """Check if route is properly defined in App.js."""
    app_js_path = '/app/frontend/src/App.js'
    
    try:
        with open(app_js_path, 'r') as f:
            content = f.read()
            
        # Look for the route path in Route element
        route_pattern = f'path="{route_path}"'
        return route_pattern in content, route_pattern
        
    except Exception as e:
        return False, f"Error reading App.js: {str(e)}"

def main():
    """Main verification function."""
    print("🚀 StockLot UI Expansion - Component Verification Test")
    print("=" * 60)
    
    # Define all 17 components with their paths and routes
    components = [
        # ADMIN_ANALYTICS_UI (4 components)
        {
            'name': 'AdminAnalyticsOverview', 
            'path': '/app/frontend/src/components/admin/AdminAnalyticsOverview.jsx',
            'route': '/admin/analytics/overview'
        },
        {
            'name': 'AdminAnalyticsPDP', 
            'path': '/app/frontend/src/components/admin/AdminAnalyticsPDP.jsx',
            'route': '/admin/analytics/pdp'
        },
        {
            'name': 'AdminSellerPerformance', 
            'path': '/app/frontend/src/components/admin/AdminSellerPerformance.jsx',
            'route': '/admin/analytics/sellers/:id'
        },
        {
            'name': 'AdminRevenueReport', 
            'path': '/app/frontend/src/components/admin/AdminRevenueReport.jsx',
            'route': '/admin/reports/revenue'
        },
        
        # ADVANCED_MODERATION_UI (5 components)
        {
            'name': 'UserModeration', 
            'path': '/app/frontend/src/components/admin/UserModeration.jsx',
            'route': '/admin/moderation/users'
        },
        {
            'name': 'ListingsModeration', 
            'path': '/app/frontend/src/components/admin/ListingsModeration.jsx',
            'route': '/admin/moderation/listings'
        },
        {
            'name': 'BuyRequestModeration', 
            'path': '/app/frontend/src/components/admin/BuyRequestModeration.jsx',
            'route': '/admin/moderation/buy-requests'
        },
        {
            'name': 'ReviewModeration', 
            'path': '/app/frontend/src/components/admin/ReviewModeration.jsx',
            'route': '/admin/moderation/reviews'
        },
        {
            'name': 'RolesQueue', 
            'path': '/app/frontend/src/components/admin/RolesQueue.jsx',
            'route': '/admin/moderation/roles'
        },
        
        # AB_TESTING_UI (2 components)
        {
            'name': 'AdminExperiments', 
            'path': '/app/frontend/src/components/admin/AdminExperiments.jsx',
            'route': '/admin/experiments'
        },
        {
            'name': 'AdminExperimentResults', 
            'path': '/app/frontend/src/components/admin/AdminExperimentResults.jsx',
            'route': '/admin/experiments/:id'
        },
        
        # SELLER_GROWTH_TOOLS (4 components)
        {
            'name': 'SellerAnalytics', 
            'path': '/app/frontend/src/components/seller/SellerAnalytics.jsx',
            'route': '/seller/analytics'
        },
        {
            'name': 'InventoryBulkUpdate', 
            'path': '/app/frontend/src/components/seller/InventoryBulkUpdate.jsx',
            'route': '/seller/inventory/bulk'
        },
        {
            'name': 'SellerCampaigns', 
            'path': '/app/frontend/src/components/seller/SellerCampaigns.jsx',
            'route': '/seller/promotions'
        },
        {
            'name': 'SellerOffers', 
            'path': '/app/frontend/src/components/seller/SellerOffers.jsx',
            'route': '/seller/offers'
        },
        
        # BUYER_PERSONALIZATION (2 components)
        {
            'name': 'Wishlist', 
            'path': '/app/frontend/src/components/buyer/Wishlist.jsx',
            'route': '/buyer/wishlist'
        },
        {
            'name': 'PriceAlerts', 
            'path': '/app/frontend/src/components/buyer/PriceAlerts.jsx',
            'route': '/alerts/prices'
        }
    ]
    
    results = {
        'total': len(components),
        'components_valid': 0,
        'routes_valid': 0,
        'issues': []
    }
    
    print(f"📋 Checking {len(components)} components...")
    print()
    
    for component in components:
        print(f"🔍 {component['name']}")
        
        # Check component file
        comp_valid, comp_msg = check_component_exists(component['path'])
        if comp_valid:
            results['components_valid'] += 1
            print(f"   ✅ Component: {comp_msg}")
        else:
            print(f"   ❌ Component: {comp_msg}")
            results['issues'].append(f"{component['name']}: {comp_msg}")
        
        # Check route
        route_valid, route_msg = check_route_in_app_js(component['route'])
        if route_valid:
            results['routes_valid'] += 1
            print(f"   ✅ Route: Found {component['route']}")
        else:
            print(f"   ❌ Route: Missing {component['route']}")
            results['issues'].append(f"{component['name']}: Route {component['route']} not found in App.js")
        
        print()
    
    # Summary
    print("=" * 60)
    print("📊 SUMMARY")
    print(f"Total Components: {results['total']}")
    print(f"Valid Components: {results['components_valid']}/{results['total']} ({(results['components_valid']/results['total']*100):.1f}%)")
    print(f"Valid Routes: {results['routes_valid']}/{results['total']} ({(results['routes_valid']/results['total']*100):.1f}%)")
    
    if results['issues']:
        print(f"\n⚠️  ISSUES FOUND ({len(results['issues'])})")
        for issue in results['issues']:
            print(f"   • {issue}")
    else:
        print("\n🎉 ALL COMPONENTS AND ROUTES VERIFIED SUCCESSFULLY!")
    
    # Check control map coverage
    print("\n📈 CONTROL COVERAGE ANALYSIS")
    coverage_percentage = (results['components_valid'] / results['total']) * 100
    if coverage_percentage >= 90:
        print(f"✅ Excellent coverage: {coverage_percentage:.1f}% (Target: 90%)")
    elif coverage_percentage >= 75:
        print(f"⚠️  Good coverage: {coverage_percentage:.1f}% (Target: 90%)")
    else:
        print(f"❌ Low coverage: {coverage_percentage:.1f}% (Target: 90%)")
    
    return results

if __name__ == "__main__":
    results = main()
    exit_code = 0 if len(results['issues']) == 0 else 1
    exit(exit_code)