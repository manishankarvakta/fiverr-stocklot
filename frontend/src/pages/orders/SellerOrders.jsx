import React from 'react';


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

function SellerOrders() {
   const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    try {
      const response = await apiCall('GET', '/orders');
      // Filter orders where current user is the seller
      const sellerOrders = (Array.isArray(response) ? response : []).filter(order => 
        order.seller_id === user?.id || order.seller_id === 'admin_user_id' // Include admin orders for demo
      );
      setOrders(sellerOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      setOrders([]);
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await apiCall('PUT', `/orders/${orderId}/status`, {
        delivery_status: newStatus
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, delivery_status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, delivery_status: newStatus });
      }
      
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Failed to update delivery status. Please try again.');
    } finally {
      setUpdatingStatus(false);
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
      <Card className="border-emerald-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-600">Loading your sales...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <>

    <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">My Sales</CardTitle>
          <CardDescription>Manage incoming orders and delivery status</CardDescription>
        </CardHeader>
        <CardContent>
          {(orders || []).length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-emerald-600 mb-4">No sales yet.</p>
              <p className="text-sm text-emerald-500">Your incoming orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(orders || []).map(order => (
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
                        <p className="font-bold text-lg text-emerald-900">R{order.total_amount}</p>
                        <Badge className={getStatusColor(order.delivery_status)}>
                          {getStatusText(order.delivery_status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-emerald-700 font-medium">Items:</p>
                      {(order.items || []).map((item, index) => (
                        <div key={index} className="text-sm text-emerald-600 ml-2">
                          • {item.listing_title} (Qty: {item.quantity}) - R{item.item_total}
                        </div>
                      ))}
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-emerald-700 font-medium">Shipping Address:</p>
                      <p className="text-sm text-emerald-600">
                        {order.shipping_address?.line1}, {order.shipping_address?.city}, {order.shipping_address?.province}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {order.delivery_status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(order.id, 'shipped')}
                            disabled={updatingStatus}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Mark as Shipped
                          </Button>
                        )}
                        {order.delivery_status === 'shipped' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(order.id, 'in_transit')}
                            disabled={updatingStatus}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Mark In Transit
                          </Button>
                        )}
                        {order.delivery_status === 'in_transit' && (
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
                  <Badge className={getStatusColor(selectedOrder.delivery_status)}>
                    {getStatusText(selectedOrder.delivery_status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-emerald-800">Total Amount</Label>
                  <p className="font-bold text-emerald-900">R{selectedOrder.total_amount}</p>
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
                        <p className="font-medium text-emerald-900">{item.listing_title}</p>
                        <p className="text-emerald-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-emerald-900">R{item.item_total}</p>
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
                      variant={selectedOrder.delivery_status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateDeliveryStatus(selectedOrder.id, status)}
                      disabled={updatingStatus}
                      className={selectedOrder.delivery_status === status ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200"}
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

    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-emerald-900 mb-8">Seller Orders</h1>
          <Card className="border-emerald-200">
            <CardContent className="p-8">
              <Package className="h-12 w-12 text-emerald-600 mb-6" />
              <p className="text-emerald-700 mb-6">
                Seller order management. Please use the main App.js version for full features.
              </p>
              <Button 
                onClick={() => window.location.href = '/seller-dashboard'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Go to Seller Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}

export default SellerOrders;



// Seller Orders Management Component