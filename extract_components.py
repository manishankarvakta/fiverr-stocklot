#!/usr/bin/env python3
"""
Script to extract remaining components from App.js and create individual component files.
"""

import re
import os

def extract_component_from_app_js(component_name, start_line, end_line):
    """Extract a component from App.js and create a separate file."""
    
    # Read App.js
    with open('frontend/src/App.js', 'r') as f:
        lines = f.readlines()
    
    # Extract component lines (1-indexed to 0-indexed)
    component_lines = lines[start_line-1:end_line]
    component_code = ''.join(component_lines)
    
    # Clean up the component code
    # Remove the function declaration and add proper imports
    component_code = re.sub(r'^function\s+\w+.*?\{', '', component_code, count=1)
    component_code = component_code.rstrip('}').strip()
    
    return component_code

def create_component_file(component_name, component_code, file_path):
    """Create a component file with proper imports and exports."""
    
    # Determine imports based on component name
    imports = []
    
    # Common imports
    imports.append("import React, { useState, useEffect } from 'react';")
    imports.append("import { useNavigate, useLocation } from 'react-router-dom';")
    imports.append("import { useAuth } from '../../auth/AuthProvider';")
    
    # UI imports
    imports.append("import { Button, Input, Label, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Badge, Avatar, AvatarFallback, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Tabs, TabsList, TabsTrigger, TabsContent, Switch, Alert, AlertDescription, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui';")
    
    # Icon imports
    imports.append("import { Bell, Search, Menu, X, Users, Package, TrendingUp, DollarSign, Eye, ChevronDown, ChevronUp, Calendar, Clock, MapPin, Phone, Mail, Star, ShoppingCart, CheckCircle, XCircle, AlertTriangle, AlertCircle, Filter, SortAsc, Home, Building, User, Settings, LogOut, Edit, Trash2, Plus, RefreshCw, ArrowRight, ArrowLeft, Upload, Download, FileText, Image, Video, Play, Pause, BarChart3, PieChart, Zap, Globe, Shield, CreditCard, LayoutDashboard, MessageCircle, Ban, Check, Copy, Heart, Award, Truck, LogIn, Brain } from 'lucide-react';")
    
    # Create the component file
    component_file_content = '\n'.join(imports) + '\n\n'
    component_file_content += f'function {component_name}() {{\n'
    component_file_content += component_code
    component_file_content += '\n}\n\n'
    component_file_content += f'export default {component_name};'
    
    # Write the file
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w') as f:
        f.write(component_file_content)
    
    print(f"Created {file_path}")

def main():
    """Main function to extract all remaining components."""
    
    # Component mapping: name -> (start_line, end_line, file_path)
    components = {
        'AdminDashboardRoute': (1560, 1583, 'frontend/src/pages/dashboard/AdminDashboard.jsx'),
        'UserOrders': (1584, 1748, 'frontend/src/pages/orders/UserOrders.jsx'),
        'SellerOrders': (1749, 2029, 'frontend/src/pages/orders/SellerOrders.jsx'),
        'Dashboard': (2030, 2258, 'frontend/src/pages/dashboard/Dashboard.jsx'),
        'SellerDashboard': (2259, 2397, 'frontend/src/pages/dashboard/SellerDashboard.jsx'),
        'Marketplace': (2398, 3404, 'frontend/src/pages/marketplace/Marketplace.jsx'),
        'CreateListing': (4260, 5162, 'frontend/src/pages/marketplace/CreateListing.jsx'),
        'HowItWorks': (5163, 5218, 'frontend/src/pages/static/HowItWorks.jsx'),
        'AboutUs': (5219, 5288, 'frontend/src/pages/static/AboutUs.jsx'),
        'Pricing': (5289, 5349, 'frontend/src/pages/static/Pricing.jsx'),
        'Blog': (5350, 5381, 'frontend/src/pages/static/Blog.jsx'),
        'Contact': (5382, 5543, 'frontend/src/pages/static/Contact.jsx'),
        'BuyRequestsPage': (5544, 5549, 'frontend/src/pages/buy-requests/BuyRequestsPage.jsx'),
        'CreateBuyRequestPage': (5550, 5594, 'frontend/src/pages/buy-requests/CreateBuyRequestPage.jsx'),
        'ProfilePage': (5807, 6832, 'frontend/src/pages/profile/ProfilePage.jsx'),
        'PaymentMethodsPage': (6833, 6869, 'frontend/src/pages/profile/PaymentMethodsPage.jsx'),
        'AddressesPage': (6870, 6951, 'frontend/src/pages/profile/AddressesPage.jsx'),
        'BuyerOffersInbox': (7990, 7995, 'frontend/src/pages/buy-requests/BuyerOffersInbox.jsx'),
        'UnifiedInbox': (7996, 8001, 'frontend/src/pages/buy-requests/UnifiedInbox.jsx'),
        'ExoticsPage': (8002, 8192, 'frontend/src/pages/marketplace/ExoticsPage.jsx'),
        'InlineCartPage': (136, 145, 'frontend/src/pages/utility/InlineCartPage.jsx'),
    }
    
    for component_name, (start_line, end_line, file_path) in components.items():
        try:
            component_code = extract_component_from_app_js(component_name, start_line, end_line)
            create_component_file(component_name, component_code, file_path)
        except Exception as e:
            print(f"Error extracting {component_name}: {e}")

if __name__ == "__main__":
    main()
