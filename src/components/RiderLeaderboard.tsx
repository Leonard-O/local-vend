import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Package, Clock, Zap } from 'lucide-react';
import { RiderPerformance } from '@/types';

interface RiderLeaderboardProps {
  performances: RiderPerformance[];
}

export default function RiderLeaderboard({ performances }: RiderLeaderboardProps) {
  const getPositionColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 via-yellow-500 to-amber-600';
      case 2:
        return 'from-slate-300 via-slate-400 to-slate-500';
      case 3:
        return 'from-orange-400 via-orange-500 to-orange-600';
      default:
        return 'from-gray-600 via-gray-700 to-gray-800';
    }
  };

  const getPositionBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-100 border-l-4 border-yellow-500';
      case 2:
        return 'bg-gradient-to-r from-slate-50 via-gray-50 to-slate-100 border-l-4 border-slate-400';
      case 3:
        return 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100 border-l-4 border-orange-500';
      default:
        return 'bg-white border-l-4 border-gray-300';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-600 to-red-800 rounded-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold tracking-tight text-white">
                RIDER STANDINGS
              </CardTitle>
              <CardDescription className="text-slate-300 font-medium">
                Championship Leaderboard
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded-lg">
            <Zap className="w-5 h-5" />
            <span className="font-bold text-sm">LIVE</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {performances.map((perf, index) => (
          <div
            key={perf.riderId}
            className={`${getPositionBg(perf.rank || 0)} rounded-lg overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg`}
          >
            <div className="flex items-center p-4 gap-4">
              {/* Position Number */}
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${getPositionColor(perf.rank || 0)} flex items-center justify-center shadow-lg`}>
                  <span className="text-3xl font-black text-white">
                    {perf.rank}
                  </span>
                </div>
              </div>

              {/* Rider Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide truncate">
                    {perf.riderName}
                  </h3>
                  {perf.rank && perf.rank <= 3 && (
                    <Trophy className={`w-5 h-5 ${
                      perf.rank === 1 ? 'text-yellow-600' : 
                      perf.rank === 2 ? 'text-slate-500' : 
                      'text-orange-600'
                    }`} />
                  )}
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Points</span>
                    <span className="text-lg font-black text-gray-900">
                      {perf.performanceScore.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Rating
                    </span>
                    <span className="text-lg font-black text-gray-900">
                      {perf.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      Runs
                    </span>
                    <span className="text-lg font-black text-gray-900">
                      {perf.totalDeliveries}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Avg
                    </span>
                    <span className="text-lg font-black text-gray-900">
                      {perf.averageDeliveryTime}m
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance Bar */}
              <div className="hidden md:flex flex-col items-end gap-1">
                <span className="text-xs font-bold text-gray-600">PERFORMANCE</span>
                <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${getPositionColor(perf.rank || 0)} transition-all`}
                    style={{ width: `${Math.min((perf.performanceScore / 200) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}

        {performances.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold">No riders in championship yet</p>
            <p className="text-sm mt-2">Complete deliveries to enter the standings</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}