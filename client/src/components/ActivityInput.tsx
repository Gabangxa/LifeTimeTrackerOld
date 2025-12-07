import { AlertCircle, X, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ActivityData } from '@/types';
import { getActivityIcon, getRandomColorHex } from '@/lib/utils';

interface ActivityInputProps {
  activities: ActivityData[];
  onActivitiesChange: (activities: ActivityData[]) => void;
  minProtectedActivities?: number;
}

const COLOR_PALETTE = [
  '#D6293B', // Red
  '#F7893B', // Orange
  '#FBBF24', // Yellow
  '#34D399', // Green
  '#60A5FA', // Light Blue
  '#A78BFA', // Purple
  '#F472B6', // Pink
  '#FB923C', // Amber
  '#4ADE80', // Lime
  '#38BDF8'  // Sky
];

export function ActivityInput({ 
  activities, 
  onActivitiesChange,
  minProtectedActivities = 3 
}: ActivityInputProps) {
  const effectiveHours = activities.reduce((sum, activity) => sum + (activity.hours * activity.daysPerWeek) / 7, 0);

  const addActivity = () => {
    const colorIndex = (activities.length - minProtectedActivities) % COLOR_PALETTE.length;
    const color = colorIndex >= 0 ? COLOR_PALETTE[colorIndex] : getRandomColorHex();
    
    onActivitiesChange([
      ...activities,
      { 
        id: uuidv4(), 
        name: '', 
        hours: 1,
        daysPerWeek: 7,
        icon: 'fa-circle', 
        color
      }
    ]);
  };

  const removeActivity = (id: string) => {
    onActivitiesChange(activities.filter(activity => activity.id !== id));
  };

  const updateActivity = (index: number, updates: Partial<ActivityData>) => {
    const newActivities = [...activities];
    newActivities[index] = { ...newActivities[index], ...updates };
    
    if (updates.name !== undefined) {
      newActivities[index].icon = getActivityIcon(updates.name);
    }
    
    onActivitiesChange(newActivities);
  };

  return (
    <div>
      <div className="flex justify-between mb-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Daily Activities (hours)
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs">
            <div className={`font-medium ${
              effectiveHours > 24 
                ? 'text-red-500' 
                : effectiveHours > 20
                  ? 'text-amber-500'
                  : 'text-green-500'
            }`}>
              {effectiveHours.toFixed(1)}/24 hrs
            </div>
            <AlertCircle className={`h-3 w-3 ${
              effectiveHours > 24 
                ? 'text-red-500' 
                : 'hidden'
            }`} />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addActivity}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 group"
                  data-testid="button-add-activity"
                >
                  <Sparkles className="h-4 w-4 mr-1 group-hover:animate-pulse" />
                  Add Custom
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">Add your own personalized activity to track how you spend your time. Add as many as you need - only limited by the 24-hour daily limit.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <div 
            key={activity.id} 
            className="group flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: activity.color || '#3B82F6' }}
            >
              <i className={`fas ${activity.icon || getActivityIcon(activity.name)} text-white text-sm`}></i>
            </div>
            <div className="flex-1 space-y-1">
              <Input
                type="text"
                value={activity.name}
                onChange={(e) => updateActivity(index, { name: e.target.value })}
                placeholder="Activity name"
                className="border-0 bg-transparent p-0 font-medium focus-visible:ring-0 dark:text-white"
                data-testid={`input-activity-name-${index}`}
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {activity.hours} {activity.hours === 1 ? 'hour' : 'hours'}, {activity.daysPerWeek} {activity.daysPerWeek === 1 ? 'day' : 'days'}/week
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={activity.hours}
                  onChange={(e) => updateActivity(index, { hours: parseFloat(e.target.value) || 0 })}
                  className="text-center text-sm w-16"
                  data-testid={`input-activity-hours-${index}`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">hrs</span>
              </div>
              <div className="flex items-center space-x-1">
                <Input
                  type="number"
                  min="1"
                  max="7"
                  step="1"
                  value={activity.daysPerWeek}
                  onChange={(e) => updateActivity(index, { daysPerWeek: parseInt(e.target.value) || 7 })}
                  className="text-center text-sm w-14"
                  data-testid={`input-activity-days-${index}`}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">d/w</span>
              </div>
              {index >= minProtectedActivities && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => removeActivity(activity.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                  data-testid={`button-remove-activity-${index}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
