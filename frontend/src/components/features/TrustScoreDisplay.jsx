import React, { useEffect, useState } from 'react';
import { Badge } from '../ui';
import { Shield, Star, TrendingUp, Award } from 'lucide-react';
import { IfFlag } from '../../providers/FeatureFlagsProvider';

// import api from '../../api/client';

import api from '../../utils/apiHelper';


const TrustScoreDisplay = ({ userId, size = 'sm', showDetails = false }) => {
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrustScore = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await api.get(`/trust/score/${userId}`);
        setTrustScore(response.data);
      } catch (error) {
        // Silently handle 404 - trust score doesn't exist (expected for new users)
        // apiHelper throws Error objects, check error message for 404
        const errorMessage = error?.message || '';
        const is404 = errorMessage.includes('404') || 
                      errorMessage.includes('Not Found') ||
                      error?.response?.status === 404 ||
                      error?.status === 404;
        
        if (!is404) {
          // Only log non-404 errors
          console.error('Error fetching trust score:', error);
        }
        // Set default trust score for new users or when endpoint doesn't exist
        setTrustScore({ score: 500, level: 'NEW' });
      } finally {
        setLoading(false);
      }
    };

    fetchTrustScore();
  }, [userId]);

  if (loading) {
    return (
      <IfFlag flag="ff.trust_engine">
        <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
      </IfFlag>
    );
  }

  if (!trustScore) {
    return null;
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'EXCELLENT': return 'bg-green-500 text-white';
      case 'GOOD': return 'bg-blue-500 text-white';
      case 'FAIR': return 'bg-yellow-500 text-white';
      case 'AVERAGE': return 'bg-orange-500 text-white';
      case 'POOR': return 'bg-red-500 text-white';
      case 'NEW': return 'bg-gray-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'EXCELLENT': return <Award className="h-3 w-3" />;
      case 'GOOD': return <Star className="h-3 w-3" />;
      case 'FAIR': return <TrendingUp className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  const getLevelDescription = (level) => {
    switch (level) {
      case 'EXCELLENT': return 'Highly trusted seller/buyer';
      case 'GOOD': return 'Reliable transaction history';
      case 'FAIR': return 'Good standing member';
      case 'AVERAGE': return 'Standard user rating';
      case 'POOR': return 'Limited transaction history';
      case 'NEW': return 'New to the platform';
      default: return 'User trust rating';
    }
  };

  return (
    <IfFlag flag="ff.trust_engine">
      <div className="inline-flex items-center gap-2">
        <Badge 
          className={`${getLevelColor(trustScore.level)} ${size === 'lg' ? 'px-3 py-1' : 'px-2 py-0.5'}`}
        >
          <div className="flex items-center gap-1">
            {getLevelIcon(trustScore.level)}
            <span className={size === 'lg' ? 'text-sm' : 'text-xs'}>
              {trustScore.score}
            </span>
          </div>
        </Badge>
        
        {showDetails && (
          <div className="text-sm text-gray-600">
            <div className="font-medium">{trustScore.level}</div>
            <div className="text-xs">{getLevelDescription(trustScore.level)}</div>
          </div>
        )}
      </div>
    </IfFlag>
  );
};

export default TrustScoreDisplay;