import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Calendar, Download, TrendingUp, TrendingDown, DollarSign, 
  Package, FileText, BarChart3, PieChart, Users, Clock
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const MonthlyTradingStatements = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [statement, setStatement] = useState(null);
  const [loadingStatement, setLoadingStatement] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    if (user && (user.roles?.includes('seller') || user.roles?.includes('buyer'))) {
      fetchAvailablePeriods();
    }
  }, [user]);

  const fetchAvailablePeriods = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/trading-statements/periods`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPeriods(data.periods || []);
        setUserType(data.user_type);
        
        // Auto-select the most recent period
        if (data.periods && data.periods.length > 0) {
          setSelectedPeriod(data.periods[0]);
          fetchStatement(data.periods[0], data.user_type);
        }
      } else {
        console.error('Failed to fetch available periods');
      }
    } catch (error) {
      console.error('Error fetching periods:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatement = async (period, type = userType) => {
    if (!period || !type) return;

    setLoadingStatement(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/trading-statements/${type}/${period.year}/${period.month}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatement(data);
      } else {
        console.error('Failed to fetch statement');
        setStatement(null);
      }
    } catch (error) {
      console.error('Error fetching statement:', error);
      setStatement(null);
    } finally {
      setLoadingStatement(false);
    }
  };

  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    fetchStatement(period);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const downloadStatement = () => {
    if (!statement) return;

    const dataStr = JSON.stringify(statement, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `${userType}-statement-${statement.period.year}-${statement.period.month.toString().padStart(2, '0')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!user || (!user.roles?.includes('seller') && !user.roles?.includes('buyer'))) {
    return (
      <div className="text-center p-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Trading statements are available for sellers and buyers only.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading trading statements...</p>
      </div>
    );
  }

  if (periods.length === 0) {
    return (
      <div className="text-center p-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">No Trading History</h2>
        <p className="text-gray-600">Complete some transactions to generate trading statements.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Monthly Trading Statements</h1>
          <p className="text-emerald-700">
            {userType === 'seller' ? 'Track your sales performance and earnings' : 'Monitor your purchases and expenses'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.month}` : ''}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              const period = periods.find(p => p.year === parseInt(year) && p.month === parseInt(month));
              if (period) handlePeriodChange(period);
            }}
            className="border border-emerald-200 rounded-lg px-3 py-2 bg-white text-emerald-800"
          >
            {periods.map(period => (
              <option key={`${period.year}-${period.month}`} value={`${period.year}-${period.month}`}>
                {period.display}
              </option>
            ))}
          </select>
          
          {statement && (
            <Button 
              onClick={downloadStatement}
              variant="outline" 
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </div>

      {loadingStatement ? (
        <div className="text-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating statement...</p>
        </div>
      ) : statement ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-emerald-900">{statement.summary.total_orders}</p>
                  </div>
                  <Package className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {userType === 'seller' ? 'Total Revenue' : 'Total Spent'}
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {formatCurrency(userType === 'seller' ? statement.summary.total_revenue : statement.summary.total_spent)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {userType === 'seller' ? 'Quantity Sold' : 'Quantity Purchased'}
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {userType === 'seller' ? statement.summary.total_quantity_sold : statement.summary.total_quantity_purchased}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {formatCurrency(statement.summary.average_order_value)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Breakdown */}
          {userType === 'seller' && (
            <Card>
              <CardHeader>
                <CardTitle>Financial Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Gross Revenue</p>
                    <p className="text-xl font-bold text-emerald-900">
                      {formatCurrency(statement.summary.total_revenue)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Platform Fees</p>
                    <p className="text-xl font-bold text-red-600">
                      -{formatCurrency(statement.summary.platform_fees)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Net Earnings</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(statement.summary.net_earnings)}
                    </p>
                  </div>
                </div>
                
                {statement.summary.delivery_earnings > 0 && (
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-sm text-gray-600">Delivery Earnings</p>
                    <p className="text-lg font-semibold text-blue-600">
                      +{formatCurrency(statement.summary.delivery_earnings)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {userType === 'buyer' && (
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Product Costs</p>
                    <p className="text-xl font-bold text-emerald-900">
                      {formatCurrency(statement.summary.total_spent - statement.summary.delivery_costs - statement.summary.platform_fees)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Delivery Costs</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatCurrency(statement.summary.delivery_costs)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Platform Fees</p>
                    <p className="text-xl font-bold text-gray-600">
                      {formatCurrency(statement.summary.platform_fees)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Species/Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                {userType === 'seller' ? 'Sales by Species' : 'Purchases by Species'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {statement.species_breakdown.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-emerald-100 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                        {item.species}
                      </Badge>
                      <span className="text-sm text-gray-600">{item.orders} orders</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(userType === 'seller' ? item.revenue : item.total_spent)}
                      </p>
                      <p className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Daily Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Daily Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {statement.daily_breakdown.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-2 hover:bg-emerald-50 rounded">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                      <span className="text-sm font-medium">
                        {new Date(day.date).toLocaleDateString('en-ZA', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {day.orders} order{day.orders !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatCurrency(userType === 'seller' ? day.revenue : day.total_spent)}
                      </p>
                      <p className="text-xs text-gray-500">{day.quantity} items</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-emerald-200">
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">{userType === 'seller' ? 'Buyer' : 'Seller'}</th>
                      <th className="text-left p-2">Species</th>
                      <th className="text-right p-2">Quantity</th>
                      <th className="text-right p-2">Unit Price</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.order_details.slice(0, 10).map((order, index) => (
                      <tr key={index} className="border-b border-gray-100 hover:bg-emerald-50">
                        <td className="p-2">{new Date(order.date).toLocaleDateString('en-ZA')}</td>
                        <td className="p-2">{userType === 'seller' ? order.buyer_name : order.seller_name}</td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {order.species}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">{order.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(order.unit_price)}</td>
                        <td className="p-2 text-right font-semibold">
                          {formatCurrency(userType === 'seller' ? order.merchandise_total : order.grand_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {statement.order_details.length > 10 && (
                  <div className="text-center py-4 text-sm text-gray-500">
                    Showing 10 of {statement.order_details.length} orders
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center p-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
          <p className="text-gray-600">No trading activity found for the selected period.</p>
        </div>
      )}
    </div>
  );
};

export default MonthlyTradingStatements;