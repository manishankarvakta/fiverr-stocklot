// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardHeader, CardTitle } from '../ui';
// import { Search, Filter, Check, X, Flag, AlertTriangle, Star, MessageCircle, Calendar, User } from 'lucide-react';
// import { useGetAdminReviewsQuery, useGetModerationStatsQuery } from '@/store/api/admin.api';
// // import adminApi from '../../api/adminClient';

// const ReviewModeration = () => {
//   const [reviews, setReviews] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filters, setFilters] = useState({
//     status: 'pending',
//     rating: 'all',
//     search: '',
//     flagged_only: false,
//     sort: 'newest'
//   });
//   const [selectedReviews, setSelectedReviews] = useState([]);
//   const [moderatingIds, setModeratingIds] = useState(new Set());
//   const [stats, setStats] = useState({});
//   const {data, isLoading, isError} = useGetAdminReviewsQuery();
//   console.log("Admin Reviews Data:", data, isLoading, isError);

//   const {data: reviewsData, isLoading: reviewsLoading, isError: reviewsError} = useGetModerationStatsQuery();
//   console.log("Moderation Stats Data:", reviewsData, reviewsLoading, reviewsError);
//   useEffect(() => {
//     loadReviews();
//     loadModerationStats();
//   }, [filters]);

//   // const loadReviews = async () => {
//   //   try {
//   //     setLoading(true);
      
//   //     const response = await adminApi.get('/admin/reviews', {
//   //       params: {
//   //         status: filters.status,
//   //         rating_filter: filters.rating !== 'all' ? filters.rating : undefined,
//   //         search: filters.search || undefined,
//   //         flagged_only: filters.flagged_only || undefined,
//   //         sort: filters.sort,
//   //         limit: 50
//   //       }
//   //     });
      
//   //     setReviews(response.data.reviews || []);
      
//   //   } catch (error) {
//   //     console.error('Error loading reviews:', error);
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const loadModerationStats = async () => {
//     try {
//       const response = await adminApi.get('/admin/moderation/stats');
//       setStats(response.data.reviews || {});
//     } catch (error) {
//       console.error('Error loading stats:', error);
//     }
//   };

//   const moderateReview = async (reviewId, action, reason = '') => {
//     try {
//       setModeratingIds(prev => new Set(prev).add(reviewId));
      
//       await adminApi.post(`/admin/reviews/${reviewId}/${action}`, {
//         reason: reason || undefined
//       });
      
//       // Refresh reviews
//       await loadReviews();
//       await loadModerationStats();
      
//       // Remove from selected if applicable
//       setSelectedReviews(prev => prev.filter(id => id !== reviewId));
      
//     } catch (error) {
//       console.error(`Error ${action} review:`, error);
//     } finally {
//       setModeratingIds(prev => {
//         const newSet = new Set(prev);
//         newSet.delete(reviewId);
//         return newSet;
//       });
//     }
//   };

//   const batchModerate = async (action) => {
//     if (selectedReviews.length === 0) return;
    
//     try {
//       const promises = selectedReviews.map(reviewId => 
//         adminApi.post(`/admin/reviews/${reviewId}/${action}`)
//       );
      
//       await Promise.all(promises);
      
//       await loadReviews();
//       await loadModerationStats();
//       setSelectedReviews([]);
      
//     } catch (error) {
//       console.error(`Error batch ${action}:`, error);
//     }
//   };

//   const toggleReviewSelection = (reviewId) => {
//     setSelectedReviews(prev => 
//       prev.includes(reviewId) 
//         ? prev.filter(id => id !== reviewId)
//         : [...prev, reviewId]
//     );
//   };

//   const getStatusBadge = (status) => {
//     const statusConfig = {
//       pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
//       approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
//       rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
//       flagged: { label: 'Flagged', color: 'bg-orange-100 text-orange-800' }
//     };
    
//     const config = statusConfig[status] || statusConfig.pending;
//     return (
//       <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
//         {config.label}
//       </span>
//     );
//   };

//   const getRatingStars = (rating) => {
//     return [...Array(5)].map((_, i) => (
//       <Star
//         key={i}
//         className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
//       />
//     ));
//   };

//   const detectSpamIndicators = (review) => {
//     const indicators = [];
    
//     // Check for repetitive content
//     if (review.content && review.content.length < 20) {
//       indicators.push('Very short content');
//     }
    
//     // Check for excessive caps
//     if (review.content && review.content.match(/[A-Z]{10,}/)) {
//       indicators.push('Excessive caps');
//     }
    
//     // Check for repeated characters
//     if (review.content && review.content.match(/(.)\1{4,}/)) {
//       indicators.push('Repeated characters');
//     }
    
//     // Check for suspicious patterns
//     if (review.content && review.content.match(/\b(fake|scam|fraud)\b/i)) {
//       indicators.push('Suspicious keywords');
//     }
    
//     return indicators;
//   };

//   if (loading) {
//     return (
//       <div className="space-y-6">
//         <div className="animate-pulse">
//           <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
//           <div className="grid grid-cols-4 gap-4 mb-6">
//             {[...Array(4)].map((_, i) => (
//               <div key={i} className="h-24 bg-gray-200 rounded"></div>
//             ))}
//           </div>
//           <div className="h-96 bg-gray-200 rounded"></div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
//           <p className="text-gray-600 mt-1">Manage and moderate user reviews with spam detection</p>
//         </div>
        
//         {/* Batch Actions */}
//         {selectedReviews.length > 0 && (
//           <div className="flex items-center gap-2">
//             <span className="text-sm text-gray-600">
//               {selectedReviews.length} selected
//             </span>
//             <button
//               onClick={() => batchModerate('approve')}
//               className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
//             >
//               <Check className="h-4 w-4" />
//               Approve All
//             </button>
//             <button
//               onClick={() => batchModerate('reject')}
//               className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
//             >
//               <X className="h-4 w-4" />
//               Reject All
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
//                 <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
//               </div>
//               <div className="p-3 rounded-full bg-yellow-100">
//                 <MessageCircle className="h-6 w-6 text-yellow-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Flagged Reviews</p>
//                 <p className="text-2xl font-bold text-orange-600">{stats.flagged || 0}</p>
//               </div>
//               <div className="p-3 rounded-full bg-orange-100">
//                 <Flag className="h-6 w-6 text-orange-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Approved Today</p>
//                 <p className="text-2xl font-bold text-green-600">{stats.approved_today || 0}</p>
//               </div>
//               <div className="p-3 rounded-full bg-green-100">
//                 <Check className="h-6 w-6 text-green-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
        
//         <Card>
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <p className="text-sm font-medium text-gray-600">Spam Detected</p>
//                 <p className="text-2xl font-bold text-red-600">{stats.spam_detected || 0}</p>
//               </div>
//               <div className="p-3 rounded-full bg-red-100">
//                 <AlertTriangle className="h-6 w-6 text-red-600" />
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>

//       {/* Filters */}
//       <Card>
//         <CardContent className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//             {/* Search */}
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
//               <input
//                 type="text"
//                 placeholder="Search reviews..."
//                 value={filters.search}
//                 onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
//                 className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
//               />
//             </div>
            
//             {/* Status Filter */}
//             <select
//               value={filters.status}
//               onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
//               className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
//             >
//               <option value="pending">Pending</option>
//               <option value="approved">Approved</option>
//               <option value="rejected">Rejected</option>
//               <option value="flagged">Flagged</option>
//               <option value="all">All Status</option>
//             </select>
            
//             {/* Rating Filter */}
//             <select
//               value={filters.rating}
//               onChange={(e) => setFilters(prev => ({ ...prev, rating: e.target.value }))}
//               className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
//             >
//               <option value="all">All Ratings</option>
//               <option value="5">5 Stars</option>
//               <option value="4">4 Stars</option>
//               <option value="3">3 Stars</option>
//               <option value="2">2 Stars</option>
//               <option value="1">1 Star</option>
//             </select>
            
//             {/* Sort */}
//             <select
//               value={filters.sort}
//               onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
//               className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
//             >
//               <option value="newest">Newest First</option>
//               <option value="oldest">Oldest First</option>
//               <option value="rating_high">Highest Rated</option>
//               <option value="rating_low">Lowest Rated</option>
//               <option value="flagged">Flagged First</option>
//             </select>
            
//             {/* Flagged Only Toggle */}
//             <label className="flex items-center gap-2 cursor-pointer">
//               <input
//                 type="checkbox"
//                 checked={filters.flagged_only}
//                 onChange={(e) => setFilters(prev => ({ ...prev, flagged_only: e.target.checked }))}
//                 className="rounded border-gray-300"
//               />
//               <span className="text-sm">Flagged Only</span>
//             </label>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Reviews List */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Reviews ({reviews.length})</CardTitle>
//         </CardHeader>
//         <CardContent className="p-0">
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead className="border-b bg-gray-50">
//                 <tr>
//                   <th className="text-left p-4">
//                     <input
//                       type="checkbox"
//                       checked={selectedReviews.length === reviews.length && reviews.length > 0}
//                       onChange={(e) => {
//                         if (e.target.checked) {
//                           setSelectedReviews(reviews.map(r => r.id));
//                         } else {
//                           setSelectedReviews([]);
//                         }
//                       }}
//                       className="rounded border-gray-300"
//                     />
//                   </th>
//                   <th className="text-left p-4">Review</th>
//                   <th className="text-left p-4">Rating</th>
//                   <th className="text-left p-4">User</th>
//                   <th className="text-left p-4">Listing</th>
//                   <th className="text-left p-4">Status</th>
//                   <th className="text-left p-4">Spam Risk</th>
//                   <th className="text-left p-4">Date</th>
//                   <th className="text-left p-4">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {reviews.map((review) => {
//                   const spamIndicators = detectSpamIndicators(review);
//                   const isSelected = selectedReviews.includes(review.id);
//                   const isModerating = moderatingIds.has(review.id);
                  
//                   return (
//                     <tr key={review.id} className={`border-b hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
//                       <td className="p-4">
//                         <input
//                           type="checkbox"
//                           checked={isSelected}
//                           onChange={() => toggleReviewSelection(review.id)}
//                           className="rounded border-gray-300"
//                         />
//                       </td>
                      
//                       <td className="p-4 max-w-xs">
//                         <div className="truncate font-medium text-gray-900 mb-1">
//                           {review.title || 'No title'}
//                         </div>
//                         <div className="text-gray-600 line-clamp-2">
//                           {review.content || 'No content'}
//                         </div>
//                       </td>
                      
//                       <td className="p-4">
//                         <div className="flex items-center gap-1">
//                           {getRatingStars(review.rating)}
//                           <span className="ml-1 text-sm text-gray-600">
//                             ({review.rating})
//                           </span>
//                         </div>
//                       </td>
                      
//                       <td className="p-4">
//                         <div className="flex items-center gap-2">
//                           <User className="h-4 w-4 text-gray-400" />
//                           <div>
//                             <div className="font-medium">{review.user_name || 'Anonymous'}</div>
//                             <div className="text-xs text-gray-500">{review.user_email}</div>
//                           </div>
//                         </div>
//                       </td>
                      
//                       <td className="p-4">
//                         <div className="font-medium text-gray-900 truncate max-w-32">
//                           {review.listing_title}
//                         </div>
//                         <div className="text-xs text-gray-500">
//                           ID: {review.listing_id?.slice(0, 8)}...
//                         </div>
//                       </td>
                      
//                       <td className="p-4">
//                         {getStatusBadge(review.status)}
//                       </td>
                      
//                       <td className="p-4">
//                         {spamIndicators.length > 0 ? (
//                           <div className="flex items-center gap-1">
//                             <AlertTriangle className="h-4 w-4 text-red-500" />
//                             <span className="text-xs text-red-600 font-medium">
//                               {spamIndicators.length} issues
//                             </span>
//                           </div>
//                         ) : (
//                           <span className="text-xs text-green-600">Clean</span>
//                         )}
//                       </td>
                      
//                       <td className="p-4">
//                         <div className="flex items-center gap-1 text-gray-500">
//                           <Calendar className="h-4 w-4" />
//                           <span className="text-xs">
//                             {new Date(review.created_at).toLocaleDateString()}
//                           </span>
//                         </div>
//                       </td>
                      
//                       <td className="p-4">
//                         <div className="flex items-center gap-1">
//                           {review.status === 'pending' && (
//                             <>
//                               <button
//                                 onClick={() => moderateReview(review.id, 'approve')}
//                                 disabled={isModerating}
//                                 className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
//                                 title="Approve"
//                               >
//                                 <Check className="h-4 w-4" />
//                               </button>
//                               <button
//                                 onClick={() => moderateReview(review.id, 'reject')}
//                                 disabled={isModerating}
//                                 className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
//                                 title="Reject"
//                               >
//                                 <X className="h-4 w-4" />
//                               </button>
//                             </>
//                           )}
//                           <button
//                             onClick={() => moderateReview(review.id, 'flag')}
//                             disabled={isModerating}
//                             className="p-1 text-orange-600 hover:bg-orange-100 rounded disabled:opacity-50"
//                             title="Flag"
//                           >
//                             <Flag className="h-4 w-4" />
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
            
//             {reviews.length === 0 && (
//               <div className="text-center py-12 text-gray-500">
//                 No reviews found matching your criteria
//               </div>
//             )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default ReviewModeration;



import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Search, Check, X, Flag, AlertTriangle, Star, Calendar, User } from 'lucide-react';
import { useGetAdminReviewsQuery, useGetModerationStatsQuery } from '@/store/api/admin.api';
const ReviewModeration = () => {
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [moderatingIds, setModeratingIds] = useState(new Set());

  // RTK Query hooks
  const { data: reviewsData, isLoading: reviewsLoading } = useGetAdminReviewsQuery();
  const { data: statsData, isLoading: statsLoading } = useGetModerationStatsQuery();
  console.log("Admin Reviews Data:", reviewsData, reviewsLoading);
  console.log("Moderation Stats Data:", statsData, statsLoading);
 

  // Derived state
  const reviews = reviewsData?.reviews || [];
  const stats = statsData?.counts || {};

  const toggleReviewSelection = (reviewId) => {
    setSelectedReviews(prev =>
      prev.includes(reviewId)
        ? prev.filter(id => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const moderateReview = async (reviewId, action) => {
    try {
      setModeratingIds(prev => new Set(prev).add(reviewId));
      await moderateReviewApi({ reviewId, action }).unwrap();
      setSelectedReviews(prev => prev.filter(id => id !== reviewId));
    } catch (error) {
      console.error(`Error ${action} review:`, error);
    } finally {
      setModeratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reviewId);
        return newSet;
      });
    }
  };

  const batchModerate = async (action) => {
    try {
      const promises = selectedReviews.map(id => moderateReviewApi({ reviewId: id, action }).unwrap());
      await Promise.all(promises);
      setSelectedReviews([]);
    } catch (error) {
      console.error(`Error batch ${action}:`, error);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      flagged: { label: 'Flagged', color: 'bg-orange-100 text-orange-800' }
    };
    const badge = config[status] || config.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>;
  };

  const getRatingStars = (rating) =>
    [...Array(5)].map((_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
    ));

  if (reviewsLoading || statsLoading) {
    return <div className="p-6 text-gray-500">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending || 0}</p>
            </div>
            <Flag className="h-6 w-6 text-yellow-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Flagged</p>
              <p className="text-2xl font-bold text-orange-600">{stats.flagged || 0}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Approved Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.approved_today || 0}</p>
            </div>
            <Check className="h-6 w-6 text-green-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Spam Detected</p>
              <p className="text-2xl font-bold text-red-600">{stats.spam_detected || 0}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </CardContent>
        </Card>
      </div>

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reviews ({reviews.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedReviews.length === reviews.length && reviews.length > 0}
                    onChange={e => e.target.checked ? setSelectedReviews(reviews.map(r => r.id)) : setSelectedReviews([])}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="p-4 text-left">Review</th>
                <th className="p-4 text-left">Rating</th>
                <th className="p-4 text-left">User</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => {
                const isSelected = selectedReviews.includes(review.id);
                const isModerating = moderatingIds.has(review.id);
                return (
                  <tr key={review.id} className={`${isSelected ? 'bg-blue-50' : ''} border-b hover:bg-gray-50`}>
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleReviewSelection(review.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="p-4">{review.content}</td>
                    <td className="p-4">{getRatingStars(review.rating)}</td>
                    <td className="p-4">{review.user_name || 'Anonymous'}</td>
                    <td className="p-4">{getStatusBadge(review.status)}</td>
                    <td className="p-4 flex gap-1">
                      <button
                        onClick={() => moderateReview(review.id, 'approve')}
                        disabled={isModerating}
                        className="p-1 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moderateReview(review.id, 'reject')}
                        disabled={isModerating}
                        className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moderateReview(review.id, 'flag')}
                        disabled={isModerating}
                        className="p-1 text-orange-600 hover:bg-orange-100 rounded disabled:opacity-50"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {reviews.length === 0 && (
            <div className="text-center p-6 text-gray-500">No reviews found</div>
          )}
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {selectedReviews.length > 0 && (
        <div className="flex gap-2">
          <button onClick={() => batchModerate('approve')} className="px-3 py-1 bg-green-600 text-white rounded">Approve All</button>
          <button onClick={() => batchModerate('reject')} className="px-3 py-1 bg-red-600 text-white rounded">Reject All</button>
        </div>
      )}
    </div>
  );
};

export default ReviewModeration;
