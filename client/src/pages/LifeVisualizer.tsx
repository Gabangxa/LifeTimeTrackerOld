import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import Chart from 'chart.js/auto';
import { 
  Moon, 
  Sun, 
  PlusCircle, 
  Hourglass, 
  Github, 
  Twitter, 
  Mail,
  X,
  Search,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { fetchCountries, fetchLifeExpectancy } from '@/services/WorldBankApi';
import { 
  CountryInfo, 
  ActivityData, 
  VisualizeResult, 
  ActivityStat 
} from '@/types';
import { 
  calculateAliveDays, 
  calculateActivityYears, 
  calculateAge, 
  calculateLivedWeeks, 
  calculateRemainingWeeks, 
  calculateTotalWeeks, 
  getActivityIcon, 
  getRandomColorHex,
  formatNumber
} from '@/lib/utils';

// Define form schema
const formSchema = z.object({
  birthdate: z.string().refine(date => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, {
    message: "Please enter a valid birthdate in the past"
  }),
  country: z.string().min(1, "Please select a country"),
  activities: z.array(
    z.object({
      id: z.string(),
      name: z.string().min(1, "Activity name is required"),
      hours: z.number()
        .min(0, "Hours must be greater than or equal to 0")
        .max(24, "Hours must be less than or equal to 24"),
      icon: z.string().optional(),
      color: z.string().optional()
    })
  ).min(1, "At least one activity is required"),
});

type FormData = z.infer<typeof formSchema>;

// Default activities
const DEFAULT_ACTIVITIES: ActivityData[] = [
  { id: uuidv4(), name: 'Sleep', hours: 8, icon: 'fa-bed', color: '#3B82F6' },
  { id: uuidv4(), name: 'Work', hours: 8, icon: 'fa-briefcase', color: '#10B981' },
  { id: uuidv4(), name: 'Commute', hours: 1, icon: 'fa-car', color: '#8B5CF6' },
];

// Activity comparisons
const ACTIVITY_COMPARISONS: Record<string, Array<{icon: string, text: (years: number) => string}>> = {
  'Sleep': [
    { 
      icon: 'fa-film', 
      text: (years) => `${formatNumber(years * 365 * 3)} Marvel movie marathons 🍿` 
    },
    { 
      icon: 'fa-plane', 
      text: (years) => `${formatNumber(years * 365 * 0.5)} round-trip flights to the moon 🌙` 
    }
  ],
  'Work': [
    { 
      icon: 'fa-dollar-sign', 
      text: (years) => `$${formatNumber(years * 80000)} at average salary 💰` 
    },
    { 
      icon: 'fa-building', 
      text: (years) => `You could've built ${Math.floor(years / 4)} Fortune 500 companies 🏢` 
    }
  ],
  'Commute': [
    { 
      icon: 'fa-globe', 
      text: (years) => `${formatNumber(years * 365 * 0.2)} trips around the Earth 🌎` 
    },
    { 
      icon: 'fa-book', 
      text: (years) => `You could've read ${formatNumber(years * 500)} books 📚` 
    }
  ]
};

const LifeVisualizer: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [countriesLoading, setCountriesLoading] = useState<boolean>(true);
  const [lifeExpectancy, setLifeExpectancy] = useState<number | null>(null);
  const [visualizeResult, setVisualizeResult] = useState<VisualizeResult | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartInstance = useRef<Chart | null>(null);
  const projectionChartRef = useRef<HTMLCanvasElement | null>(null);
  const projectionChartInstance = useRef<Chart | null>(null);

  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      birthdate: '',
      country: '',
      activities: DEFAULT_ACTIVITIES,
    },
  });

  // Filter countries based on search term
  const filteredCountries = useMemo(() => {
    if (!searchTerm) return countries;
    return countries.filter(country => 
      country.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [countries, searchTerm]);

  // Fetch countries on component mount
  useEffect(() => {
    const getCountries = async () => {
      try {
        const countriesData = await fetchCountries();
        setCountries(countriesData);
      } catch (error) {
        toast({
          title: "Error fetching countries",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setCountriesLoading(false);
      }
    };
    
    getCountries();
  }, [toast]);

  // Handle country change
  const handleCountryChange = async (value: string) => {
    form.setValue('country', value);
    
    try {
      const expectancy = await fetchLifeExpectancy(value);
      setLifeExpectancy(expectancy);
    } catch (error) {
      toast({
        title: "Error fetching life expectancy",
        description: "Please try again later.",
        variant: "destructive",
      });
      setLifeExpectancy(null);
    }
  };

  // Add custom activity
  const addActivity = () => {
    const currentActivities = form.getValues('activities');
    form.setValue('activities', [
      ...currentActivities,
      { 
        id: uuidv4(), 
        name: '', 
        hours: 1, 
        icon: 'fa-circle', 
        color: getRandomColorHex() 
      }
    ]);
  };

  // Remove activity
  const removeActivity = (id: string) => {
    const currentActivities = form.getValues('activities');
    form.setValue('activities', currentActivities.filter(activity => activity.id !== id));
  };

  // Visualize data
  const visualizeData = (data: FormData) => {
    if (!lifeExpectancy) {
      toast({
        title: "Life expectancy missing",
        description: "Please select a country to get life expectancy data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const birthdate = new Date(data.birthdate);
      const age = calculateAge(birthdate);
      const aliveDays = calculateAliveDays(birthdate);
      
      const activityStats: ActivityStat[] = data.activities.map(activity => {
        const years = calculateActivityYears(activity.hours, aliveDays);
        const percentage = (years / age) * 100;
        const comparisons = ACTIVITY_COMPARISONS[activity.name] || [];
        
        return {
          name: activity.name,
          years,
          percentage,
          color: activity.color || getRandomColorHex(),
          icon: activity.icon || getActivityIcon(activity.name),
          comparisons: comparisons.map(comp => ({
            icon: comp.icon,
            text: comp.text(years)
          }))
        };
      });

      const weeksLived = calculateLivedWeeks(birthdate);
      const weeksTotal = calculateTotalWeeks(lifeExpectancy);
      const weeksRemaining = calculateRemainingWeeks(birthdate, lifeExpectancy);

      const futureProjections = data.activities.map(activity => {
        const yearsSoFar = calculateActivityYears(activity.hours, aliveDays);
        const yearsRemaining = (activity.hours / 24) * 365 * (lifeExpectancy - age) / 365;
        
        return {
          activity: activity.name,
          yearsSoFar,
          yearsRemaining
        };
      });

      // Calculate free time as remaining hours
      const dailyActivitiesHours = data.activities.reduce((sum, activity) => sum + activity.hours, 0);
      const freeHoursDaily = Math.max(0, 24 - dailyActivitiesHours);
      
      futureProjections.push({
        activity: 'Free Time',
        yearsSoFar: calculateActivityYears(freeHoursDaily, aliveDays),
        yearsRemaining: (freeHoursDaily / 24) * 365 * (lifeExpectancy - age) / 365
      });

      setVisualizeResult({
        age,
        lifeExpectancy,
        activityStats,
        weeksLived,
        weeksTotal,
        weeksRemaining,
        futureProjections
      });

      // Scroll to results
      setTimeout(() => {
        document.getElementById('resultsContainer')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast({
        title: "Error visualizing data",
        description: "Please check your inputs and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initialize/update charts when visualization result changes
  useEffect(() => {
    if (!visualizeResult) return;

    // Initialize/update pie chart
    if (pieChartRef.current) {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }

      const ctx = pieChartRef.current.getContext('2d');
      if (ctx) {
        pieChartInstance.current = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: visualizeResult.activityStats.map(a => a.name),
            datasets: [{
              data: visualizeResult.activityStats.map(a => a.percentage),
              backgroundColor: visualizeResult.activityStats.map(a => a.color),
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  boxWidth: 15,
                  padding: 15,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.raw as number || 0;
                    const years = visualizeResult.activityStats[context.dataIndex].years;
                    return `${label}: ${value.toFixed(1)}% (${years.toFixed(1)} years)`;
                  }
                }
              }
            }
          }
        });
      }
    }

    // Initialize/update projection chart
    if (projectionChartRef.current) {
      if (projectionChartInstance.current) {
        projectionChartInstance.current.destroy();
      }

      const ctx = projectionChartRef.current.getContext('2d');
      if (ctx) {
        projectionChartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: visualizeResult.futureProjections.map(p => p.activity),
            datasets: [{
              label: 'Years Spent So Far',
              data: visualizeResult.futureProjections.map(p => p.yearsSoFar),
              backgroundColor: '#3B82F6',
              borderWidth: 0
            }, {
              label: 'Projected Remaining Years',
              data: visualizeResult.futureProjections.map(p => p.yearsRemaining),
              backgroundColor: '#10B981',
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                stacked: false,
                grid: {
                  display: false
                }
              },
              y: {
                stacked: false,
                title: {
                  display: true,
                  text: 'Years'
                }
              }
            },
            plugins: {
              legend: {
                position: 'top'
              }
            }
          }
        });
      }
    }
  }, [visualizeResult]);

  // Calculate commute optimization
  const calculateCommuteOptimization = () => {
    if (!visualizeResult) return null;
    
    const commuteActivity = form.getValues('activities').find(a => a.name.toLowerCase().includes('commute'));
    if (!commuteActivity) return null;

    const reducedCommute = Math.max(0, commuteActivity.hours - 0.5);
    const yearsGained = (0.5 / 24) * 365 * (visualizeResult.lifeExpectancy - visualizeResult.age) / 365;
    
    return {
      yearsGained: yearsGained.toFixed(1),
      reducedHours: reducedCommute
    };
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const commuteOptimization = calculateCommuteOptimization();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="bg-white shadow-sm dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center dark:text-primary">
            <i className="fas fa-hourglass-half mr-2"></i>
            Lifetime Visualizer
          </h1>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" />
            ) : (
              <Moon className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(visualizeData)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="birthdate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Birthdate</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              max={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <Dialog>
                            <DialogTrigger asChild>
                              <FormControl>
                                <Button 
                                  variant="outline" 
                                  className="w-full justify-between"
                                  type="button"
                                >
                                  {field.value ? countries.find(c => c.code === field.value)?.name : 'Select your country'}
                                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Select Country</DialogTitle>
                                <DialogDescription>
                                  Choose your country to fetch life expectancy data
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex items-center border rounded-md p-1">
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                <Input
                                  placeholder="Search countries..."
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                />
                              </div>
                              <div className="max-h-72 overflow-y-auto">
                                {countriesLoading ? (
                                  <p className="text-center py-4">Loading countries...</p>
                                ) : (
                                  filteredCountries.map(country => (
                                    <div 
                                      key={country.code}
                                      className="flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                                      onClick={() => {
                                        handleCountryChange(country.code);
                                        document.getElementById('closeDialogBtn')?.click();
                                      }}
                                    >
                                      {country.name}
                                    </div>
                                  ))
                                )}
                              </div>
                              <DialogFooter className="sm:justify-end">
                                <Button 
                                  type="button" 
                                  variant="secondary" 
                                  id="closeDialogBtn"
                                >
                                  Close
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <FormMessage />
                          {lifeExpectancy && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Life expectancy: {lifeExpectancy} years
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Activity Inputs */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Daily Activities (hours)
                      </Label>
                      <Button 
                        type="button" 
                        variant="link" 
                        size="sm" 
                        onClick={addActivity}
                        className="text-primary p-0 h-auto"
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Custom
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {form.getValues('activities').map((activity, index) => (
                        <div key={activity.id} className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: activity.color || '#3B82F6' }}
                          >
                            <i className={`fas ${activity.icon || getActivityIcon(activity.name)} text-white`}></i>
                          </div>
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={activity.name}
                              onChange={(e) => {
                                const newActivities = [...form.getValues('activities')];
                                newActivities[index].name = e.target.value;
                                newActivities[index].icon = getActivityIcon(e.target.value);
                                form.setValue('activities', newActivities);
                              }}
                              placeholder="Activity name"
                              className={index < 3 ? "bg-gray-50" : ""}
                              readOnly={index < 3}
                            />
                          </div>
                          <div className="w-16">
                            <Input
                              type="number"
                              min="0"
                              max="24"
                              value={activity.hours}
                              onChange={(e) => {
                                const newActivities = [...form.getValues('activities')];
                                newActivities[index].hours = parseFloat(e.target.value) || 0;
                                form.setValue('activities', newActivities);
                              }}
                              className="text-center"
                            />
                          </div>
                          {index >= 3 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeActivity(activity.id)}
                              className="px-2 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <Hourglass className="mr-2 h-4 w-4 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    'Visualize My Life'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Results Container */}
        {visualizeResult && (
          <div id="resultsContainer">
            {/* Results Summary */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Your Life Visualization
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Based on your birthdate and country, you've lived <span className="font-semibold text-primary">{visualizeResult.age} years</span> out of expected <span className="font-semibold text-primary">{visualizeResult.lifeExpectancy} years</span>.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Pie Chart */}
                  <div className="flex flex-col items-center justify-center">
                    <h3 className="text-lg font-semibold mb-4">Life Spent On Activities</h3>
                    <div className="h-64 w-full">
                      <canvas ref={pieChartRef}></canvas>
                    </div>
                  </div>
                  
                  {/* Remaining Time Timeline */}
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold mb-4">Life Timeline</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                      You have approximately <span className="font-semibold text-primary">{formatNumber(visualizeResult.weeksRemaining)} weeks</span> remaining in your life.
                    </p>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap">
                        {Array.from({ length: visualizeResult.weeksTotal }).map((_, i) => (
                          <div 
                            key={i}
                            className="inline-block w-2 h-2 m-[1px] rounded-sm"
                            style={{ 
                              backgroundColor: i < visualizeResult.weeksLived 
                                ? '#3B82F6' 
                                : '#E5E7EB' 
                            }}
                          ></div>
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Birth</span>
                        <span>Current Age</span>
                        <span>Life Expectancy</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Activity Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {visualizeResult.activityStats.slice(0, 3).map((activity) => (
                <Card key={activity.name} className="overflow-hidden transition-all hover:shadow-md hover:-translate-y-1">
                  <div className="p-5" style={{ backgroundColor: `${activity.color}15` }}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold" style={{ color: activity.color }}>
                        {activity.name}
                      </h3>
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: activity.color }}
                      >
                        <i className={`fas ${activity.icon} text-white`}></i>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-3xl font-bold">{activity.years.toFixed(1)} years</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {activity.percentage.toFixed(1)}% of your life so far
                      </p>
                    </div>
                  </div>
                  <CardContent>
                    <p className="text-sm">That's equivalent to:</p>
                    <ul className="mt-3 space-y-2">
                      {activity.comparisons.map((comparison, idx) => (
                        <li key={idx} className="flex items-center text-sm">
                          <span 
                            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mr-2"
                            style={{ backgroundColor: `${activity.color}20` }}
                          >
                            <i className={`fas ${comparison.icon} text-xs`} style={{ color: activity.color }}></i>
                          </span>
                          <span>{comparison.text}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Future Projections */}
            <Card>
              <CardHeader>
                <CardTitle>Future Projections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-medium mb-4">If You Continue Current Patterns</h3>
                    <div className="h-64">
                      <canvas ref={projectionChartRef}></canvas>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Time Remaining</h3>
                    <div className="space-y-4">
                      {visualizeResult.futureProjections.slice(0, 3).map((projection) => (
                        <div key={projection.activity} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {projection.activity}
                          </h4>
                          <p className="text-xl font-semibold">
                            {projection.yearsRemaining.toFixed(1)} more years
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {commuteOptimization && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Optimize Your Time</h3>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm">
                        Reducing your daily commute by just <span className="font-semibold">30 minutes</span> would give you <span className="font-semibold">{commuteOptimization.yearsGained} extra years</span> of free time over your remaining life.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-4">
                        <Button onClick={() => {
                          const activities = form.getValues('activities');
                          const commuteIndex = activities.findIndex(a => a.name.toLowerCase().includes('commute'));
                          if (commuteIndex >= 0) {
                            const updatedActivities = [...activities];
                            updatedActivities[commuteIndex].hours = commuteOptimization.reducedHours;
                            form.setValue('activities', updatedActivities);
                            form.handleSubmit(visualizeData)();
                          }
                        }}>
                          Recalculate with Changes
                        </Button>
                        <Button variant="outline">
                          Save This Analysis
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Lifetime Visualizer</h3>
              <p className="text-gray-400 text-sm">Understand how you spend your most valuable asset: time.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-800 pt-4">
            <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Lifetime Visualizer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LifeVisualizer;
