import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Heart, X, ShoppingCart, Eye, Bell, BellOff, Filter, Search, Package, DollarSign, Calendar, Star } from 'lucide-react';
import {
  useGetWishlistQuery,
  useRemoveFromWishlistMutation,
  useGetWishlistStatsQuery,
  useUpdateWishlistMutation
} from '../../store/api/wishlist.api';
import { useAddToCartMutation } from '../../store/api/cart.api';

const Wishlist = () => {
  const [filters, setFilters] = useState({
    category: 'all',
    price_range: 'all',
    availability: 'all',
    search: ''
  });
  const [notifications, setNotifications] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);

  // Use Redux RTK Query hooks
  const { data: wishlistData, isLoading: loading, refetch } = useGetWishlistQuery();
  console.log('console.log', wishlistData)
  console.log('wishlistData', wishlistData);
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const { data: statsData } = useGetWishlistStatsQuery();
  console.log('statsData', statsData);

  const wishlistItems = wishlistData?.items || [];

  // Load notification settings from wishlist data
  useEffect(() => {
    if (wishlistData?.items) {
      const notificationSettings = {};
      wishlistData.items.forEach(item => {
        notificationSettings[item.id] = item.notifications_enabled || false;
      });
      setNotifications(notificationSettings);
    }
  }, [wishlistData]);

  const handleRemoveFromWishlist = async (itemId) => {
    try {
      await removeFromWishlist(itemId).unwrap();
      refetch();
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const [updateWishlist] = useUpdateWishlistMutation();
  const [addToCartMutation] = useAddToCartMutation();

  const toggleNotifications = async (itemId) => {
    try {
      const newState = !notifications[itemId];
      
      await updateWishlist({
        wishlistId: itemId,
        notifications_enabled: newState
      }).unwrap();
      
      setNotifications(prev => ({
        ...prev,
        [itemId]: newState
      }));
      
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const addToCart = async (listing) => {
    try {
      await addToCartMutation({
        listing_id: listing.listing_id || listing.id,
        quantity: 1
      }).unwrap();
      console.log('Added to cart successfully');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const getAvailabilityBadge = (availability) => {
    const availabilityConfig = {
      available: { label: 'Available', color: 'bg-green-100 text-green-800' },
      limited: { label: 'Limited Stock', color: 'bg-yellow-100 text-yellow-800' },
      out_of_stock: { label: 'Out of Stock', color: 'bg-red-100 text-red-800' },
      pre_order: { label: 'Pre-Order', color: 'bg-blue-100 text-blue-800' }
    };
    
    const config = availabilityConfig[availability] || availabilityConfig.available;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getPriceChangeIndicator = (item) => {
    if (!item.price_change) return null;
    
    const change = item.price_change;
    const isIncrease = change > 0;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${isIncrease ? 'text-red-600' : 'text-green-600'}`}>
        <span>{isIncrease ? '↗' : '↘'}</span>
        <span>{Math.abs(change)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-600 mt-1">Keep track of your favorite livestock and get notified of updates</p>
        </div>
        
        <div className="text-sm text-gray-600">
          {wishlistItems.length} items saved
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search wishlist..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Categories</option>
              <option value="poultry">Poultry</option>
              <option value="ruminants">Ruminants</option>
              <option value="pigs">Pigs</option>
              <option value="exotic">Exotic</option>
            </select>
            
            <select
              value={filters.price_range}
              onChange={(e) => setFilters(prev => ({ ...prev, price_range: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Prices</option>
              <option value="0-1000">R0 - R1,000</option>
              <option value="1000-5000">R1,000 - R5,000</option>
              <option value="5000-10000">R5,000 - R10,000</option>
              <option value="10000-plus">R10,000+</option>
            </select>
            
            <select
              value={filters.availability}
              onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="limited">Limited Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="pre_order">Pre-Order</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wishlistItems.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <div className="relative">
              {/* Image */}
              <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              {/* Remove Button */}
              <button
                onClick={() => handleRemoveFromWishlist(item.id)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
              
              {/* Notification Toggle */}
              <button
                onClick={() => toggleNotifications(item.id)}
                className={`absolute top-2 left-2 p-2 rounded-full shadow-md transition-colors ${
                  notifications[item.id] 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-white text-gray-600 hover:bg-blue-50'
                }`}
              >
                {notifications[item.id] ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </button>
            </div>
            
            <CardContent className="p-4">
              {/* Title and Availability */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
                  {item.title}
                </h3>
                {getAvailabilityBadge(item.availability)}
              </div>
              
              {/* Price */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-emerald-600">
                    R{item.current_price.toLocaleString()}
                  </span>
                  {item.original_price && item.original_price !== item.current_price && (
                    <span className="text-sm text-gray-500 line-through">
                      R{item.original_price.toLocaleString()}
                    </span>
                  )}
                </div>
                {getPriceChangeIndicator(item)}
              </div>
              
              <p className="text-sm text-gray-600 mb-2">
                per {item.unit}
              </p>
              
              {/* Seller Info */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.seller_name}</p>
                  {item.seller_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-600">{item.seller_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {item.seller_location}
                </div>
              </div>
              
              {/* Added Date */}
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <Calendar className="h-3 w-3" />
                <span>Added {new Date(item.added_at).toLocaleDateString()}</span>
              </div>
              
              {/* Price Alerts */}
              {item.price_alerts?.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-blue-600 mb-1">Active Price Alerts:</div>
                  {item.price_alerts.map((alert, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                      Alert when price ≤ R{alert.target_price.toLocaleString()}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedItem(item)}
                  className="flex items-center gap-1 flex-1 justify-center py-2 px-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </button>
                
                {item.availability === 'available' && (
                  <button
                    onClick={() => addToCart(item)}
                    className="flex items-center gap-1 flex-1 justify-center py-2 px-3 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {wishlistItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-4">
              Browse our marketplace and save your favorite livestock
            </p>
            <button
              onClick={() => window.location.href = '/marketplace'}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Browse Marketplace
            </button>
          </CardContent>
        </Card>
      )}

      {/* Item Details Modal */}
      {selectedItem && (
        <WishlistItemModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onRemove={() => {
            handleRemoveFromWishlist(selectedItem.id);
            setSelectedItem(null);
          }}
          onAddToCart={() => {
            addToCart(selectedItem);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
};

// Wishlist Item Details Modal
const WishlistItemModal = ({ item, onClose, onRemove, onAddToCart }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={item.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Details */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Current Price</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-emerald-600">
                  R{item.current_price.toLocaleString()}
                </span>
                {item.original_price && item.original_price !== item.current_price && (
                  <span className="text-lg text-gray-500 line-through">
                    R{item.original_price.toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">per {item.unit}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Seller</h3>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.seller_name}</span>
                {item.seller_rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm">{item.seller_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">{item.seller_location}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Availability</h3>
              {getAvailabilityBadge(item.availability)}
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Added to Wishlist</h3>
              <p className="text-sm text-gray-600">
                {new Date(item.added_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        {/* Description */}
        {item.description && (
          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{item.description}</p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onRemove}
            className="flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
            Remove from Wishlist
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            
            {item.availability === 'available' && (
              <button
                onClick={onAddToCart}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;