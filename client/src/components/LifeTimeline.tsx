import { Hourglass } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { formatNumber } from '@/lib/utils';

interface LifeTimelineProps {
  age: number;
  lifeExpectancy: number;
  weeksLived: number;
  weeksTotal: number;
  weeksRemaining: number;
  timelineSliderValue: number;
  projectedAge: number | null;
  projectedDaysRemaining: number | null;
  onSliderChange: (weeksAdvanced: number) => void;
}

export function LifeTimeline({
  age,
  lifeExpectancy,
  weeksLived,
  weeksTotal,
  weeksRemaining,
  timelineSliderValue,
  projectedAge,
  projectedDaysRemaining,
  onSliderChange
}: LifeTimelineProps) {
  const livedPercentage = (weeksLived / weeksTotal) * 100;
  const projectedPercentage = ((weeksLived + timelineSliderValue) / weeksTotal) * 100;

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold mb-4">Life Timeline</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        You have approximately <span className="font-semibold text-primary">{formatNumber(weeksRemaining)} weeks</span> remaining in your life.
      </p>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="relative mb-8">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
              style={{ width: `${livedPercentage}%` }}
            ></div>
            
            {timelineSliderValue > 0 && (
              <div 
                className="absolute top-0 h-4 w-1 bg-yellow-400 shadow-sm"
                style={{ 
                  left: `${projectedPercentage}%`,
                  transform: 'translateX(-50%)'
                }}
              ></div>
            )}
          </div>
          
          <div className="flex justify-between mt-2">
            <div className="flex flex-col items-center">
              <div className="h-3 w-1 bg-gray-400 dark:bg-gray-500"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Birth</span>
            </div>
            
            <div 
              className="flex flex-col items-center"
              style={{ 
                position: 'absolute',
                left: `${livedPercentage}%`,
                transform: 'translateX(-50%)'
              }}
            >
              <div className="h-4 w-2 bg-blue-600 -mt-4 z-10 rounded-sm"></div>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">Now ({age.toFixed(1)} yrs)</span>
            </div>
            
            {timelineSliderValue > 0 && projectedAge !== null && (
              <div 
                className="flex flex-col items-center"
                style={{ 
                  position: 'absolute',
                  left: `${projectedPercentage}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="h-3 w-2 bg-yellow-400 -mt-3 z-10 rounded-sm"></div>
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mt-1">Age {projectedAge.toFixed(1)}</span>
              </div>
            )}
            
            <div className="flex flex-col items-center">
              <div className="h-3 w-1 bg-gray-400 dark:bg-gray-500"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{lifeExpectancy} years</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <div className="relative border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg p-3 sm:p-4 mb-4 bg-blue-50/50 dark:bg-blue-900/20">
            <div className="absolute -top-3 left-4 bg-white dark:bg-gray-900 px-2">
              <span className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 sm:gap-2">
                <Hourglass className="w-3 h-3 sm:w-4 sm:h-4" />
                Interactive Timeline
              </span>
            </div>
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
              Explore how time continues to pass:
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Today</span>
            <Slider 
              defaultValue={[0]}
              max={weeksRemaining}
              step={52}
              className="flex-grow touch-none"
              onValueChange={(value) => onSliderChange(value[0])}
              data-testid="slider-timeline"
            />
            <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Life Expectancy</span>
          </div>
          <div className="mt-4 text-center space-y-2">
            {projectedAge !== null && timelineSliderValue > 0 ? (
              <div className="py-2 px-3 sm:px-4 bg-blue-50 dark:bg-blue-900/20 rounded-md inline-block border border-blue-200 dark:border-blue-800 transition-all duration-300">
                <span className="text-xs sm:text-sm">
                  At age <span className="font-bold text-primary">{projectedAge.toFixed(1)}</span>, you'll have
                  <span className="font-bold text-primary ml-1">
                    {projectedDaysRemaining !== null ? projectedDaysRemaining.toFixed(0) : ((lifeExpectancy - projectedAge) * 365).toFixed(0)} days
                  </span> remaining
                </span>
              </div>
            ) : (
              <div className="py-2 px-3 sm:px-4 bg-primary/10 dark:bg-primary/20 rounded-md inline-block transition-all duration-300">
                <span className="text-base sm:text-lg font-bold">{((lifeExpectancy - age) * 365).toFixed(0)}</span>
                <span className="ml-1 text-xs sm:text-sm text-primary font-medium">days remaining</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
