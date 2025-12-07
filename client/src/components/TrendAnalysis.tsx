import { TrendAnalysisResult } from '@/hooks/useLifeProjections';

interface TrendItem {
  activity: string;
  currentHours: string;
  trends: Array<{
    change: number;
    analysis: TrendAnalysisResult;
  }>;
  icon: string;
  color: string;
}

interface TrendAnalysisProps {
  trendData: TrendItem[];
}

export function TrendAnalysis({ trendData }: TrendAnalysisProps) {
  if (!trendData || trendData.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-8">
        No trend analysis data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        See how small daily changes compound over your lifetime. Each hour adjustment shows the total impact over your remaining years.
      </div>
      {trendData.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4" data-testid={`trend-item-${index}`}>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: item.color }}
            >
              <i className={`fas ${item.icon} text-white text-sm`}></i>
            </div>
            <h3 className="text-lg font-semibold">{item.activity}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Currently {item.currentHours}h/day
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {item.trends.map((trend, trendIndex) => (
              <div 
                key={trendIndex} 
                className={`p-3 rounded-md border ${
                  trend.change > 0 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : trend.change < 0
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
                data-testid={`trend-option-${index}-${trendIndex}`}
              >
                <div className="text-xs font-medium mb-1">
                  {trend.change > 0 ? '+' : ''}{trend.change}h/day
                </div>
                <div className="text-sm font-semibold">
                  {trend.analysis.compoundEffect > 0 ? '+' : ''}
                  {trend.analysis.compoundEffect.toFixed(1)} years over lifetime
                </div>
                {trend.analysis.recommendations.length > 0 && (
                  <div className="text-xs mt-2 opacity-75">
                    {trend.analysis.recommendations[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
