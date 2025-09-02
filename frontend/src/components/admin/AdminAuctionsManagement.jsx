import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  Gavel, Calendar, Clock, DollarSign, Users, Eye, Edit, Play, Pause, Square,
  TrendingUp, RefreshCw, Plus, AlertTriangle, CheckCircle, Trophy
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminAuctionsManagement() {
  const [auctions, setAuctions] = useState([]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [showAuctionDialog, setShowAuctionDialog] = useState(false);

  useEffect(() => {
    fetchAuctions();
    fetchBids();
  }, []);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/auctions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuctions(data.auctions || []);
      }
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await fetch(`${API}/admin/auction-bids`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBids(data.bids || []);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Mock data for demo
  const mockAuctions = [
    {
      id: 'auction_1',
      title: 'Premium Brahman Bulls Auction',
      listing_id: 'listing_123',
      seller_name: 'Highveld Cattle Ranch',
      item_description: '5 Premium Brahman Bulls, 18-24 months old',
      starting_price: 45000,
      current_bid: 67500,
      reserve_price: 50000,
      buyout_price: 85000,
      bid_count: 23,
      bidder_count: 8,
      status: 'live',
      start_time: '2025-08-29T09:00:00Z',
      end_time: '2025-08-29T18:00:00Z',
      created_at: '2025-08-25T10:30:00Z',
      category: 'cattle',
      location: 'Gauteng',
      high_bidder: 'Buyer_456',
      auction_type: 'english',
      auto_extend: true,
      minimum_increment: 2500
    },
    {
      id: 'auction_2',
      title: 'Angus Heifers - Breeding Stock',
      listing_id: 'listing_124',
      seller_name: 'Western Cape Angus Farm',
      item_description: '12 Angus Heifers, proven bloodline',
      starting_price: 72000,
      current_bid: 89000,
      reserve_price: 75000,
      buyout_price: 110000,
      bid_count: 34,
      bidder_count: 12,
      status: 'live',
      start_time: '2025-08-29T10:00:00Z',
      end_time: '2025-08-29T17:30:00Z',
      created_at: '2025-08-26T14:15:00Z',
      category: 'cattle',
      location: 'Western Cape',
      high_bidder: 'Buyer_789',
      auction_type: 'english',
      auto_extend: false,
      minimum_increment: 3000
    },
    {
      id: 'auction_3',
      title: 'Ross 308 Day-Old Chicks Bulk',
      listing_id: 'listing_125',
      seller_name: 'KZN Poultry Breeders',
      item_description: '5000 Ross 308 day-old chicks, vaccinated',
      starting_price: 12500,
      current_bid: 18750,
      reserve_price: 15000,
      buyout_price: 25000,
      bid_count: 56,
      bidder_count: 19,
      status: 'scheduled',
      start_time: '2025-08-30T08:00:00Z',
      end_time: '2025-08-30T16:00:00Z',
      created_at: '2025-08-27T11:00:00Z',
      category: 'poultry',
      location: 'KwaZulu-Natal',
      high_bidder: null,
      auction_type: 'english',
      auto_extend: true,
      minimum_increment: 500
    },
    {
      id: 'auction_4',
      title: 'Boer Goats - Commercial Herd',
      listing_id: 'listing_126',
      seller_name: 'Limpopo Goat Breeders',
      item_description: '25 Boer Goats - mixed ages, commercial grade',
      starting_price: 28000,
      current_bid: 28000,
      reserve_price: 30000,
      buyout_price: 42000,
      bid_count: 1,
      bidder_count: 1,
      status: 'completed',
      start_time: '2025-08-28T09:00:00Z',
      end_time: '2025-08-28T17:00:00Z',
      created_at: '2025-08-24T16:30:00Z',
      category: 'goats',
      location: 'Limpopo',
      high_bidder: 'Buyer_321',
      auction_type: 'english',
      auto_extend: true,
      minimum_increment: 1000,
      final_price: 28000,
      winner_id: 'Buyer_321',
      reserve_met: false
    },
    {
      id: 'auction_5',
      title: 'Dorper Sheep Breeding Flock',
      listing_id: 'listing_127',
      seller_name: 'Free State Dorper Stud',
      item_description: '15 Dorper ewes with 2 rams, registered bloodline',
      starting_price: 35000,
      current_bid: 0,
      reserve_price: 40000,
      buyout_price: 55000,
      bid_count: 0,
      bidder_count: 0,
      status: 'cancelled',
      start_time: '2025-08-27T09:00:00Z',
      end_time: '2025-08-27T17:00:00Z',
      created_at: '2025-08-23T12:45:00Z',
      category: 'sheep',
      location: 'Free State',
      high_bidder: null,
      auction_type: 'english',
      auto_extend: false,
      minimum_increment: 2000,
      cancellation_reason: 'Seller requested cancellation due to illness'
    }
  ];

  const mockBids = [
    {
      id: 'bid_1',
      auction_id: 'auction_1',
      auction_title: 'Premium Brahman Bulls Auction',
      bidder_id: 'buyer_456',
      bidder_name: 'John van der Merwe',
      bid_amount: 67500,
      bid_time: '2025-08-29T14:23:15Z',
      is_winning: true,
      proxy_bid: false
    },
    {
      id: 'bid_2',
      auction_id: 'auction_1',
      auction_title: 'Premium Brahman Bulls Auction',
      bidder_id: 'buyer_123',
      bidder_name: 'Sipho Farming Co-op',
      bid_amount: 65000,
      bid_time: '2025-08-29T14:20:32Z',
      is_winning: false,
      proxy_bid: true
    },
    {
      id: 'bid_3',
      auction_id: 'auction_2',
      auction_title: 'Angus Heifers - Breeding Stock',
      bidder_id: 'buyer_789',
      bidder_name: 'Premium Cattle Ltd',
      bid_amount: 89000,
      bid_time: '2025-08-29T15:10:45Z',
      is_winning: true,
      proxy_bid: false
    },
    {
      id: 'bid_4',
      auction_id: 'auction_2',
      auction_title: 'Angus Heifers - Breeding Stock',
      bidder_id: 'buyer_111',
      bidder_name: 'Eastern Cape Ranchers',
      bid_amount: 86000,
      bid_time: '2025-08-29T15:08:22Z',
      is_winning: false,
      proxy_bid: true
    }
  ];

  const displayAuctions = auctions.length > 0 ? auctions : mockAuctions;
  const displayBids = bids.length > 0 ? bids : mockBids;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Auctions Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading auctions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Auctions Management</h2>
          <p className="text-gray-600">Monitor and manage livestock auctions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchAuctions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Auction
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Live Auctions</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayAuctions.filter(a => a.status === 'live').length}
                </p>
              </div>
              <Gavel className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Bids Today</p>
                <p className="text-2xl font-bold text-blue-600">
                  {displayAuctions.reduce((sum, a) => sum + a.bid_count, 0)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Bidders</p>
                <p className="text-2xl font-bold text-purple-600">
                  {displayAuctions.reduce((sum, a) => sum + a.bidder_count, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Volume</p>
                <p className="text-2xl font-bold text-emerald-600">
                  R{displayAuctions.reduce((sum, a) => sum + (a.current_bid || a.starting_price), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Auctions Alert */}
      {displayAuctions.filter(a => a.status === 'live').length > 0 && (
        <Alert>
          <Gavel className="h-4 w-4" />
          <AlertDescription>
            <strong>Live Auctions Active:</strong> {displayAuctions.filter(a => a.status === 'live').length} auctions are currently running with active bidding.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="auctions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="auctions">All Auctions</TabsTrigger>
          <TabsTrigger value="live">Live Auctions</TabsTrigger>
          <TabsTrigger value="bids">Recent Bids</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="auctions">
          <Card>
            <CardHeader>
              <CardTitle>All Auctions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Current Bid</TableHead>
                    <TableHead>Bids</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time Remaining</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAuctions.map((auction) => (
                    <TableRow key={auction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{auction.title}</div>
                          <div className="text-sm text-gray-500">{auction.seller_name}</div>
                          <div className="text-sm text-gray-500">{auction.item_description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">R{auction.current_bid?.toLocaleString() || 'No bids'}</div>
                          <div className="text-sm text-gray-500">
                            Reserve: R{auction.reserve_price.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-semibold">{auction.bid_count}</div>
                          <div className="text-sm text-gray-500">{auction.bidder_count} bidders</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(auction.status)}>
                          {auction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {auction.status === 'live' ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-red-500" />
                            <span className="font-medium text-red-600">
                              {getTimeRemaining(auction.end_time)}
                            </span>
                          </div>
                        ) : auction.status === 'scheduled' ? (
                          <div className="text-sm">
                            Starts: {new Date(auction.start_time).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            {auction.status === 'completed' ? 'Ended' : 'Cancelled'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{auction.location}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedAuction(auction); setShowAuctionDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {auction.status === 'live' && (
                            <Button size="sm" variant="outline">
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {auction.status === 'scheduled' && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live">
          <Card>
            <CardHeader>
              <CardTitle>Live Auctions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Current High Bid</TableHead>
                    <TableHead>Reserve Status</TableHead>
                    <TableHead>Time Left</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Controls</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAuctions.filter(a => a.status === 'live').map((auction) => (
                    <TableRow key={auction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{auction.title}</div>
                          <div className="text-sm text-gray-500">{auction.seller_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold text-green-600">
                            R{auction.current_bid?.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            by {auction.high_bidder}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          auction.current_bid >= auction.reserve_price ? 
                          'bg-green-100 text-green-800' : 
                          'bg-red-100 text-red-800'
                        }>
                          {auction.current_bid >= auction.reserve_price ? 'Reserve Met' : 'Reserve Not Met'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-red-500" />
                          <span className="font-medium text-red-600">
                            {getTimeRemaining(auction.end_time)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-semibold">{auction.bid_count} bids</div>
                          <div className="text-sm text-gray-500">{auction.bidder_count} bidders</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Square className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            Extend
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bids">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bids</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Bidder</TableHead>
                    <TableHead>Bid Amount</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayBids.map((bid) => (
                    <TableRow key={bid.id}>
                      <TableCell>
                        <div className="font-medium">{bid.auction_title}</div>
                      </TableCell>
                      <TableCell>{bid.bidder_name}</TableCell>
                      <TableCell className="font-semibold">
                        R{bid.bid_amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{new Date(bid.bid_time).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <Badge className={bid.is_winning ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {bid.is_winning ? 'Winning' : 'Outbid'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {bid.proxy_bid ? 'Proxy' : 'Manual'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Auctions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Auction</TableHead>
                    <TableHead>Final Price</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead>Reserve Status</TableHead>
                    <TableHead>Ended</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAuctions.filter(a => a.status === 'completed' || a.status === 'cancelled').map((auction) => (
                    <TableRow key={auction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{auction.title}</div>
                          <div className="text-sm text-gray-500">{auction.seller_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {auction.status === 'completed' ? (
                          <div className="font-semibold">
                            R{auction.final_price?.toLocaleString() || auction.current_bid?.toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-gray-500">Cancelled</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {auction.winner_id ? (
                          <div className="flex items-center gap-1">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            {auction.winner_id}
                          </div>
                        ) : (
                          <span className="text-gray-500">No winner</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {auction.status === 'completed' ? (
                          <Badge className={
                            auction.reserve_met ? 
                            'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'
                          }>
                            {auction.reserve_met ? 'Reserve Met' : 'Reserve Not Met'}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">N/A</Badge>
                        )}
                      </TableCell>
                      <TableCell>{new Date(auction.end_time).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedAuction(auction); setShowAuctionDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {auction.status === 'completed' && auction.winner_id && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Process Sale
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Auction Details Dialog */}
      <Dialog open={showAuctionDialog} onOpenChange={setShowAuctionDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Auction Details</DialogTitle>
            <DialogDescription>
              Complete auction information and bidding history
            </DialogDescription>
          </DialogHeader>
          
          {selectedAuction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Auction Title</Label>
                  <p className="text-sm">{selectedAuction.title}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Seller</Label>
                  <p className="text-sm">{selectedAuction.seller_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Bid</Label>
                  <p className="text-sm font-semibold">
                    R{selectedAuction.current_bid?.toLocaleString() || 'No bids'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Reserve Price</Label>
                  <p className="text-sm">R{selectedAuction.reserve_price.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Buyout Price</Label>
                  <p className="text-sm">R{selectedAuction.buyout_price.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedAuction.status)}>
                    {selectedAuction.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Bids</Label>
                  <p className="text-sm">{selectedAuction.bid_count} bids from {selectedAuction.bidder_count} bidders</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Location</Label>
                  <p className="text-sm">{selectedAuction.location}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Item Description</Label>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedAuction.item_description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <p className="text-sm">{new Date(selectedAuction.start_time).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Time</Label>
                  <p className="text-sm">{new Date(selectedAuction.end_time).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Auction Type</Label>
                  <p className="text-sm capitalize">{selectedAuction.auction_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Minimum Increment</Label>
                  <p className="text-sm">R{selectedAuction.minimum_increment.toLocaleString()}</p>
                </div>
              </div>

              {selectedAuction.high_bidder && (
                <div>
                  <Label className="text-sm font-medium">Current High Bidder</Label>
                  <p className="text-sm font-semibold">{selectedAuction.high_bidder}</p>
                </div>
              )}

              {selectedAuction.cancellation_reason && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Cancellation Reason:</strong> {selectedAuction.cancellation_reason}
                  </AlertDescription>
                </Alert>
              )}

              {selectedAuction.status === 'completed' && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Auction Completed</span>
                  </div>
                  <div className="mt-2 text-sm text-green-700">
                    Final Price: R{selectedAuction.final_price?.toLocaleString()}
                    {selectedAuction.winner_id && (
                      <span> - Winner: {selectedAuction.winner_id}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAuctionDialog(false)}>
              Close
            </Button>
            <Button variant="outline">
              View Bid History
            </Button>
            {selectedAuction?.status === 'live' && (
              <Button className="bg-red-600 hover:bg-red-700">
                End Auction
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}