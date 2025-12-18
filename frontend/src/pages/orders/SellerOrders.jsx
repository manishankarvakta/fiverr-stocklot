import React, { useState, useMemo } from 'react';
import { 
  Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, Textarea, Badge, Avatar, AvatarFallback,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Tabs, TabsList, TabsTrigger, TabsContent,
  Switch, Alert, AlertDescription, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "src/components/ui";
import { 
  Bell, Search, Menu, X, Users, Package, TrendingUp, DollarSign, 
  Eye, ChevronDown, ChevronUp, Calendar, Clock, MapPin, Phone, Mail, Star, ShoppingCart, 
  CheckCircle, XCircle, AlertTriangle, AlertCircle, Filter, SortAsc, Home, Building, User, Settings, 
  LogOut, Edit, Trash2, Plus, RefreshCw, ArrowRight, ArrowLeft, ArrowLeftRight, Upload, Download, 
  FileText, Image, Video, Play, Pause, BarChart3, PieChart, Zap, Globe, Shield, CreditCard, 
  LayoutDashboard, MessageCircle, Ban, Check, Copy, Heart, Award, Truck, LogIn, Brain
} from "lucide-react";
import { useAuth } from '../../auth/AuthProvider';
import { useGetUserOrdersQuery, useUpdateOrderStatusMutation } from '../../store/api/orders.api';

function SellerOrders() {
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Use RTK Query to fetch orders
  const { data: ordersData, isLoading: loading, error, refetch } = useGetUserOrdersQuery({});
  console.log('ordersData', ordersData);
  const [updateOrderStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusMutation();

  // Extract seller orders from API response
  const allOrders = ordersData?.seller_orders || [];
  
  // Calculate order analytics
  const analytics = useMemo(() => {
    const totalOrders = allOrders.length;
    const newOrders = allOrders.filter(o => 
      ['pending', 'preparing', 'confirmed'].includes(o.status?.toLowerCase() || o.delivery_status?.toLowerCase())
    ).length;
    const activeOrders = allOrders.filter(o => 
      ['shipped', 'in_transit'].includes(o.status?.toLowerCase() || o.delivery_status?.toLowerCase())
    ).length;
    const completedOrders = allOrders.filter(o => 
      ['delivered', 'completed'].includes(o.status?.toLowerCase() || o.delivery_status?.toLowerCase())
    ).length;
    
    const totalRevenue = allOrders.reduce((sum, order) => {
      const amount = order.total_amount || 0;
      return sum + (typeof amount === 'number' ? amount : parseFloat(amount) || 0);
    }, 0);
    
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalOrders,
      newOrders,
      activeOrders,
      completedOrders,
      totalRevenue,
      averageOrderValue
    };
  }, [allOrders]);

  // Filter orders by tab
  const filteredOrders = useMemo(() => {
    let filtered = allOrders;
    
    // Filter by tab
    if (activeTab === 'new') {
      filtered = filtered.filter(o => 
        ['pending', 'preparing', 'confirmed'].includes(o.status?.toLowerCase() || o.delivery_status?.toLowerCase())
      );
    } else if (activeTab === 'active') {
      filtered = filtered.filter(o => 
        ['shipped', 'in_transit'].includes(o.status?.toLowerCase() || o.delivery_status?.toLowerCase())
      );
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(o => 
        ['delivered', 'completed'].includes(o.status?.toLowerCase() || o.delivery_status?.toLowerCase())
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.id?.toLowerCase().includes(searchLower) ||
        order.buyer_name?.toLowerCase().includes(searchLower) ||
        order.items?.some(item => item.listing_title?.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  }, [allOrders, activeTab, searchTerm]);

  const updateDeliveryStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus({
        orderId,
        delivery_status: newStatus,
        status: newStatus
      }).unwrap();
      
      refetch(); // Refresh orders
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, delivery_status: newStatus, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert(error?.data?.detail || error?.message || 'Failed to update delivery status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'preparing': 'bg-yellow-100 text-yellow-700',
      'shipped': 'bg-blue-100 text-blue-700',
      'in_transit': 'bg-purple-100 text-purple-700',
      'delivered': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    const statusText = {
      'preparing': 'Preparing',
      'shipped': 'Shipped',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusText[status] || status;
  };

  
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-emerald-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-emerald-600">Loading your sales...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <h3>Error loading orders</h3>
              <p className="text-sm">{error?.data?.detail || error?.message || 'Something went wrong.'}</p>
              <Button onClick={() => refetch()} className="mt-4 bg-emerald-600 hover:bg-emerald-700">Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">Seller Orders</h1>
        <p className="text-emerald-700">Manage incoming orders and delivery status</p>
      </div>

      {/* Order Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold">{analytics.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Orders</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.newOrders}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.activeOrders}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  R{((analytics.totalRevenue || 0) / 100).toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Management */}
      <Card className="border-emerald-200">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-emerald-900">My Sales</CardTitle>
              <CardDescription>Manage incoming orders and delivery status</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Orders ({allOrders.length})</TabsTrigger>
              <TabsTrigger value="new">New Orders ({analytics.newOrders})</TabsTrigger>
              <TabsTrigger value="active">Active ({analytics.activeOrders})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({analytics.completedOrders})</TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-emerald-600 mb-4">
                {allOrders.length === 0 ? 'No sales yet.' : 'No orders match your filters.'}
              </p>
              <p className="text-sm text-emerald-500">Your incoming orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <Card key={order.id} className="border-emerald-100">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-emerald-900">Order #{order.id.slice(-8)}</h4>
                        <p className="text-sm text-emerald-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-emerald-900">
                          R{((order.total_amount || 0) / 100).toFixed(2)}
                        </p>
                        <Badge className={getStatusColor(order.delivery_status || order.status)}>
                          {getStatusText(order.delivery_status || order.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-emerald-700 font-medium">Buyer: {order.buyer_name || 'Unknown'}</p>
                      <p className="text-sm text-emerald-700 font-medium mt-2">Items:</p>
                      {(order.items || []).map((item, index) => (
                        <div key={index} className="text-sm text-emerald-600 ml-2">
                          • {item.listing_title || item.title} (Qty: {item.quantity}) - R{((item.item_total || item.price || 0) / 100).toFixed(2)}
                        </div>
                      ))}
                    </div>

                    {order.shipping_address && (
                      <div className="mb-3">
                        <p className="text-sm text-emerald-700 font-medium">Shipping Address:</p>
                        <p className="text-sm text-emerald-600">
                          {order.shipping_address?.line1}, {order.shipping_address?.city}, {order.shipping_address?.province}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {(order.delivery_status === 'preparing' || order.status === 'preparing') && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(order.id, 'shipped')}
                            disabled={updatingStatus}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Mark as Shipped
                          </Button>
                        )}
                        {(order.delivery_status === 'shipped' || order.status === 'shipped') && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(order.id, 'in_transit')}
                            disabled={updatingStatus}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Mark In Transit
                          </Button>
                        )}
                        {(order.delivery_status === 'in_transit' || order.status === 'in_transit') && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(order.id, 'delivered')}
                            disabled={updatingStatus}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="border-emerald-200 hover:bg-emerald-50"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.id.slice(-8)}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-emerald-800">Order Status</Label>
                  <Badge className={getStatusColor(selectedOrder.delivery_status || selectedOrder.status)}>
                    {getStatusText(selectedOrder.delivery_status || selectedOrder.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-emerald-800">Total Amount</Label>
                  <p className="font-bold text-emerald-900">
                    R{((selectedOrder.total_amount || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <div>
                  <Label className="text-emerald-800">Order Date</Label>
                  <p className="text-emerald-700">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-emerald-800">Payment Method</Label>
                  <p className="text-emerald-700">{selectedOrder.payment_method}</p>
                </div>
              </div>

              <div>
                <Label className="text-emerald-800">Items Ordered</Label>
                <div className="mt-2 space-y-2">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-emerald-50 rounded">
                      <div>
                        <p className="font-medium text-emerald-900">{item.listing_title || item.title}</p>
                        <p className="text-emerald-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-emerald-900">
                        R{((item.item_total || item.price || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-emerald-800">Shipping Address</Label>
                <div className="mt-2 p-3 bg-emerald-50 rounded">
                  <p className="text-emerald-900">{selectedOrder.shipping_address?.line1}</p>
                  <p className="text-emerald-700">
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.province} {selectedOrder.shipping_address?.postal_code}
                  </p>
                  <p className="text-emerald-700">{selectedOrder.shipping_address?.country}</p>
                </div>
              </div>

              <div>
                <Label className="text-emerald-800">Update Delivery Status</Label>
                <div className="mt-2 flex space-x-2">
                  {['preparing', 'shipped', 'in_transit', 'delivered'].map((status) => (
                    <Button
                      key={status}
                      variant={(selectedOrder.delivery_status === status || selectedOrder.status === status) ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateDeliveryStatus(selectedOrder.id, status)}
                      disabled={updatingStatus}
                      className={(selectedOrder.delivery_status === status || selectedOrder.status === status) ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200"}
                    >
                      {getStatusText(status)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default SellerOrders;



// Seller Orders Management Component