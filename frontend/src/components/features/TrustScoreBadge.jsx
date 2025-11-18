import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui';
import { Shield, Star, TrendingUp } from 'lucide-react';
import api from '../../api/client';

const TrustScoreBadge = ({ userId, size = 'sm' }) => {
  const [trustScore, setTrustScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrustScore = async () => {
      try {
        const response = await api.get(`/trust/score/${userId}`);
        setTrustScore(response.data);
      } catch (error) {
        console.error('Error fetching trust score:', error);
        setTrustScore({ score: 0, level: 'NEW' });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTrustScore();
    }
  }, [userId]);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>;
  }

  if (!trustScore) {
    return null;
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'EXCELLENT': return 'bg-green-500';
      case 'GOOD': return 'bg-blue-500';
      case 'FAIR': return 'bg-yellow-500';
      case 'AVERAGE': return 'bg-orange-500';
      case 'POOR': return 'bg-red-500';
      case 'NEW': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'EXCELLENT': return <Star className="h-3 w-3" />;
      case 'GOOD': return <TrendingUp className="h-3 w-3" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge 
            className={`${getLevelColor(trustScore.level)} text-white ${size === 'lg' ? 'px-3 py-1' : 'px-2 py-0.5'}`}
          >
            <div className="flex items-center gap-1">
              {getLevelIcon(trustScore.level)}
              <span className={size === 'lg' ? 'text-sm' : 'text-xs'}>
                {trustScore.score}
              </span>
            </div>
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <div className="font-semibold">Trust Score: {trustScore.score}</div>
            <div className="text-sm">Level: {trustScore.level}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default TrustScoreBadge;