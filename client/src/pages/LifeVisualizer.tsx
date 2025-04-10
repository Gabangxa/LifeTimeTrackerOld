import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import Chart from 'chart.js/auto';
import html2canvas from 'html2canvas';
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
  AlertCircle,
  ArrowUpRight,
  Share2
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
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { BuyMeCoffeeButton } from '@/components/BuyMeCoffeeButton';
import { BuyMeCoffeeWidget } from '@/components/BuyMeCoffeeWidget';
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
import { apiRequest } from '@/lib/queryClient';

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
  )
  .min(1, "At least one activity is required")
  .refine(activities => {
    // Calculate total hours spent on all activities
    const totalHours = activities.reduce((total, activity) => total + activity.hours, 0);
    return totalHours <= 24;
  }, {
    message: "Total time spent on activities cannot exceed 24 hours per day",
    path: ["activities"] // This will display the error message under the activities field
  }),
});

type FormData = z.infer<typeof formSchema>;

// Default activities
const DEFAULT_ACTIVITIES: ActivityData[] = [
  { id: uuidv4(), name: 'Sleep', hours: 8, icon: 'fa-bed', color: '#3B82F6' },
  { id: uuidv4(), name: 'Work', hours: 8, icon: 'fa-briefcase', color: '#10B981' },
  { id: uuidv4(), name: 'Exercise', hours: 1, icon: 'fa-dumbbell', color: '#8B5CF6' },
];

// Activity comparisons - predefined for default activities
const ACTIVITY_COMPARISONS: Record<string, Array<{icon: string, text: (years: number) => string}>> = {
  'Sleep': [
    { 
      icon: 'fa-film', 
      text: (years) => `${formatNumber(years * 365 * 3)} Marvel movie marathons 🍿` 
    },
    { 
      icon: 'fa-plane', 
      text: (years) => `${formatNumber(years * 365 * 0.5)} round-trip flights to the moon 🌙` 
    },
    { 
      icon: 'fa-bed', 
      text: (years) => `${formatNumber(years * 365)} complete hibernation cycles for a bear 🐻` 
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
    },
    { 
      icon: 'fa-rocket', 
      text: (years) => `Could've launched ${Math.floor(years * 2)} successful startups 🚀` 
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
    },
    { 
      icon: 'fa-language', 
      text: (years) => `Could've learned ${Math.floor(years / 1.5)} new languages fluently 🗣️` 
    }
  ],
  'Exercise': [
    { 
      icon: 'fa-medal', 
      text: (years) => `Could've trained for and completed ${Math.floor(years * 4)} marathons 🏃‍♂️` 
    },
    { 
      icon: 'fa-heart', 
      text: (years) => `Added approximately ${Math.floor(years * 2)} years to your lifespan ❤️` 
    },
    { 
      icon: 'fa-dumbbell', 
      text: (years) => `Lifted the equivalent of ${formatNumber(years * 1000)} elephants in weight 🐘` 
    }
  ],
  'Social Media': [
    { 
      icon: 'fa-photo-film', 
      text: (years) => `Scrolled through ${formatNumber(years * 365 * 1000)} posts 📱` 
    },
    { 
      icon: 'fa-book-open', 
      text: (years) => `Could've read ${formatNumber(years * 365)} novels instead 📖` 
    },
    { 
      icon: 'fa-people-group', 
      text: (years) => `Could've made ${Math.floor(years * 50)} meaningful friendships in person 👥` 
    }
  ],
  'Cooking': [
    { 
      icon: 'fa-utensils', 
      text: (years) => `Prepared approximately ${formatNumber(years * 365 * 2)} meals 🍽️` 
    },
    { 
      icon: 'fa-hat-chef', 
      text: (years) => `Equivalent to ${Math.floor(years / 4)} culinary degrees worth of practice 👨‍🍳` 
    },
    { 
      icon: 'fa-wheat-awn', 
      text: (years) => `Chopped enough vegetables to fill ${Math.floor(years * 52)} swimming pools 🥕` 
    }
  ],
  'Reading': [
    { 
      icon: 'fa-book', 
      text: (years) => `Read approximately ${formatNumber(years * 50)} books 📚` 
    },
    { 
      icon: 'fa-brain', 
      text: (years) => `Absorbed ${formatNumber(years * 5000000)} words of knowledge 🧠` 
    },
    { 
      icon: 'fa-pen-fancy', 
      text: (years) => `Could've written ${Math.floor(years / 3)} novels of your own ✍️` 
    }
  ],
  'Gaming': [
    { 
      icon: 'fa-gamepad', 
      text: (years) => `Completed roughly ${Math.floor(years * 50)} video game storylines 🎮` 
    },
    { 
      icon: 'fa-trophy', 
      text: (years) => `Earned approximately ${formatNumber(years * 1000)} gaming achievements 🏆` 
    },
    { 
      icon: 'fa-code', 
      text: (years) => `Could've learned to develop ${Math.floor(years / 2)} games yourself 💻` 
    }
  ]
};

// Generic comparison generators for all activities
const GENERIC_COMPARISONS: Array<{icon: string, text: (years: number, activity: string) => string}> = [
  {
    icon: 'fa-calendar-days', 
    text: (years, activity) => `${formatNumber(years * 365)} days spent on ${activity.toLowerCase()}`
  },
  {
    icon: 'fa-clock', 
    text: (years, activity) => `${formatNumber(years * 365 * 24)} hours of ${activity.toLowerCase()}`
  },
  {
    icon: 'fa-earth-americas', 
    text: (years, activity) => `Could've traveled to ${Math.floor(years * 10)} countries instead`
  },
  {
    icon: 'fa-graduation-cap', 
    text: (years, activity) => `Could've earned ${Math.floor(years / 4)} college degrees`
  },
  {
    icon: 'fa-code', 
    text: (years, activity) => `Could've written ${formatNumber(years * 50000)} lines of code`
  },
  {
    icon: 'fa-bicycle', 
    text: (years, activity) => `Could've biked ${formatNumber(years * 3650)} miles`
  },
  {
    icon: 'fa-music', 
    text: (years, activity) => `Could've listened to ${formatNumber(years * 8760)} music albums`
  },
  {
    icon: 'fa-film', 
    text: (years, activity) => `Could've watched ${formatNumber(years * 365 * 12)} movies`
  },
  {
    icon: 'fa-tree', 
    text: (years, activity) => `Could've planted ${formatNumber(years * 365)} trees`
  },
  {
    icon: 'fa-pizza-slice', 
    text: (years, activity) => `Could've eaten ${formatNumber(years * 365 * 2)} pizzas (not recommended!)`
  }
];

// Function to generate dynamic comparisons for any activity
const generateDynamicComparisons = (activityName: string, years: number): Array<{icon: string, text: string}> => {
  // Use predefined comparisons if available
  if (ACTIVITY_COMPARISONS[activityName]) {
    return ACTIVITY_COMPARISONS[activityName].map(comp => ({
      icon: comp.icon,
      text: comp.text(years)
    }));
  }
  
  // Otherwise, generate dynamic comparisons
  // Pick 3 random comparisons from the generic list
  const randomIndices = Array.from(Array(GENERIC_COMPARISONS.length).keys())
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  
  return randomIndices.map(index => ({
    icon: GENERIC_COMPARISONS[index].icon,
    text: GENERIC_COMPARISONS[index].text(years, activityName)
  }));
};

const LifeVisualizer: React.FC = () => {

  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [countries, setCountries] = useState<CountryInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [countriesLoading, setCountriesLoading] = useState<boolean>(true);
  const [lifeExpectancy, setLifeExpectancy] = useState<number | null>(null);
  const [visualizeResult, setVisualizeResult] = useState<VisualizeResult | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timelineSliderValue, setTimelineSliderValue] = useState<number>(0);
  const [projectedAge, setProjectedAge] = useState<number | null>(null);
  const [projectedStats, setProjectedStats] = useState<{
    activityStats: ActivityStat[];
    futureProjections: VisualizeResult['futureProjections'];
    daysRemaining: number;
  } | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Apply dark mode by default on initial render
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

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
  
  // Watch activities array to ensure UI updates when it changes
  const activities = form.watch('activities');

  // Add manual life expectancy state
  const [manualLifeExpectancy, setManualLifeExpectancy] = useState<string>('');
  const [useManualLifeExpectancy, setUseManualLifeExpectancy] = useState<boolean>(false);

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
      
      if (!expectancy) {
        toast({
          title: "No life expectancy data available",
          description: "Data is not available for this country. Please use the manual life expectancy input instead.",
          variant: "destructive",
        });
        // Toggle the manual life expectancy input
        setUseManualLifeExpectancy(true);
        setLifeExpectancy(null);
        return;
      }
      
      setLifeExpectancy(expectancy);
    } catch (error) {
      toast({
        title: "Error fetching life expectancy",
        description: "Unable to retrieve data from World Bank API. Please use the manual life expectancy input instead.",
        variant: "destructive",
      });
      // Toggle the manual life expectancy input
      setUseManualLifeExpectancy(true);
      setLifeExpectancy(null);
    }
  };

  // Add custom activity
  const addActivity = () => {
    // Limit to maximum 5 activities total
    if (activities.length >= 5) {
      toast({
        title: "Maximum activities reached",
        description: "You can have a maximum of 5 activities. Remove an existing one to add a new activity.",
        variant: "destructive",
      });
      return;
    }
    
    // Assign specific colors based on activity count
    // First additional activity (index 3) gets red, second (index 4) gets orange
    const fixedColors = ['#D6293B', '#F7893B']; // Red and Orange
    const colorIndex = activities.length - 3; // 0 for first custom activity, 1 for second
    
    form.setValue('activities', [
      ...activities,
      { 
        id: uuidv4(), 
        name: '', 
        hours: 1, 
        icon: 'fa-circle', 
        color: colorIndex >= 0 && colorIndex < fixedColors.length ? fixedColors[colorIndex] : getRandomColorHex()
      }
    ]);
  };

  // Remove activity
  const removeActivity = (id: string) => {
    form.setValue('activities', activities.filter(activity => activity.id !== id));
  };

  // Calculate projected stats at a specific point in time
  const calculateProjectedStats = (
    formData: FormData, 
    birthdate: Date, 
    currentAge: number, 
    expectancy: number, 
    weeksAdvanced: number
  ) => {
    const yearsAdvanced = weeksAdvanced / 52;
    const projectedAge = currentAge + yearsAdvanced;
    
    // Calculate new aliveDays (original + advancement)
    const originalAliveDays = calculateAliveDays(birthdate);
    const additionalDays = weeksAdvanced * 7;
    const projectedAliveDays = originalAliveDays + additionalDays;
    
    // Calculate new activity stats
    const activityStats: ActivityStat[] = formData.activities.map(activity => {
      const years = calculateActivityYears(activity.hours, projectedAliveDays);
      const percentage = (years / projectedAge) * 100;
      
      // Generate comparisons based on the new values
      const dynamicComparisons = generateDynamicComparisons(activity.name, years);
      
      return {
        name: activity.name,
        years,
        percentage,
        color: activity.color || getRandomColorHex(),
        icon: activity.icon || getActivityIcon(activity.name),
        comparisons: dynamicComparisons
      };
    });

    // Calculate future projections
    const futureProjections = formData.activities.map(activity => {
      const yearsSoFar = calculateActivityYears(activity.hours, projectedAliveDays);
      const yearsRemaining = (activity.hours / 24) * 365 * (expectancy - projectedAge) / 365;
      
      return {
        activity: activity.name,
        yearsSoFar,
        yearsRemaining
      };
    });

    // Calculate free time
    const dailyActivitiesHours = formData.activities.reduce((sum, activity) => sum + activity.hours, 0);
    const freeHoursDaily = Math.max(0, 24 - dailyActivitiesHours);
    
    futureProjections.push({
      activity: 'Free Time',
      yearsSoFar: calculateActivityYears(freeHoursDaily, projectedAliveDays),
      yearsRemaining: (freeHoursDaily / 24) * 365 * (expectancy - projectedAge) / 365
    });

    return {
      activityStats,
      futureProjections,
      daysRemaining: Math.max(0, (expectancy - projectedAge) * 365)
    };
  };

  // Visualize data
  const visualizeData = (data: FormData) => {
    // Check if total activity hours exceed 24
    const totalHours = data.activities.reduce((total, activity) => total + activity.hours, 0);
    if (totalHours > 24) {
      toast({
        title: "Total hours exceed limit",
        description: "The total time spent on activities cannot exceed 24 hours per day.",
        variant: "destructive",
      });
      return;
    }
    
    if (!lifeExpectancy && !useManualLifeExpectancy) {
      toast({
        title: "Life expectancy missing",
        description: "Please select a country or enter life expectancy manually.",
        variant: "destructive",
      });
      return;
    }
    
    // Use manual life expectancy if selected
    const expectancy = useManualLifeExpectancy ? parseFloat(manualLifeExpectancy) : (lifeExpectancy || 0);
    if (useManualLifeExpectancy && (!manualLifeExpectancy || isNaN(expectancy) || expectancy <= 0)) {
      toast({
        title: "Invalid life expectancy",
        description: "Please enter a valid positive number for life expectancy.",
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
        
        // Use the dynamic comparisons generator for all activities
        const dynamicComparisons = generateDynamicComparisons(activity.name, years);
        
        return {
          name: activity.name,
          years,
          percentage,
          color: activity.color || getRandomColorHex(),
          icon: activity.icon || getActivityIcon(activity.name),
          comparisons: dynamicComparisons
        };
      });

      // Use the expectancy value we validated earlier
      const weeksLived = calculateLivedWeeks(birthdate);
      const weeksTotal = calculateTotalWeeks(expectancy);
      const weeksRemaining = calculateRemainingWeeks(birthdate, expectancy);

      const futureProjections = data.activities.map(activity => {
        const yearsSoFar = calculateActivityYears(activity.hours, aliveDays);
        const yearsRemaining = (activity.hours / 24) * 365 * (expectancy - age) / 365;
        
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
        yearsRemaining: (freeHoursDaily / 24) * 365 * (expectancy - age) / 365
      });

      setVisualizeResult({
        age,
        lifeExpectancy: expectancy,
        activityStats,
        weeksLived,
        weeksTotal,
        weeksRemaining,
        futureProjections
      });

      // Reset projected data
      setTimelineSliderValue(0);
      setProjectedAge(null);
      setProjectedStats(null);

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

  // Function to create or update the pie chart
  const updatePieChart = (activityStats: ActivityStat[]) => {
    if (!pieChartRef.current) return;
    
    if (pieChartInstance.current) {
      pieChartInstance.current.destroy();
    }
    
    const ctx = pieChartRef.current.getContext('2d');
    if (!ctx) return;
    
    pieChartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: activityStats.map(a => a.name),
        datasets: [{
          data: activityStats.map(a => a.percentage),
          backgroundColor: activityStats.map(a => a.color),
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
                const years = activityStats[context.dataIndex].years;
                return `${label}: ${value.toFixed(1)}% (${years.toFixed(1)} years)`;
              }
            }
          }
        }
      }
    });
  };
  
  // Function to create or update the projection chart
  const updateProjectionChart = (projections: VisualizeResult['futureProjections']) => {
    if (!projectionChartRef.current) return;
    
    if (projectionChartInstance.current) {
      projectionChartInstance.current.destroy();
    }
    
    const ctx = projectionChartRef.current.getContext('2d');
    if (!ctx) return;
    
    projectionChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: projections.map(p => p.activity),
        datasets: [{
          label: 'Years Spent So Far',
          data: projections.map(p => p.yearsSoFar),
          backgroundColor: '#3B82F6',
          borderWidth: 0
        }, {
          label: 'Projected Remaining Years',
          data: projections.map(p => p.yearsRemaining),
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
  };

  // Initialize/update charts when visualization result changes
  useEffect(() => {
    if (!visualizeResult) return;

    // Initialize both charts with initial data
    updatePieChart(visualizeResult.activityStats);
    updateProjectionChart(visualizeResult.futureProjections);
  }, [visualizeResult]);
  
  // Update charts when projected stats change
  useEffect(() => {
    if (!projectedStats || timelineSliderValue === 0) return;
    
    // Update both charts with projected data
    updatePieChart(projectedStats.activityStats);
    updateProjectionChart(projectedStats.futureProjections);
  }, [projectedStats, timelineSliderValue]);

  // Calculate exercise optimization
  const calculateExerciseOptimization = () => {
    if (!visualizeResult) return null;
    
    const exerciseActivity = activities.find(a => a.name.toLowerCase().includes('exercise'));
    if (!exerciseActivity) return null;

    // If adding 30 min (0.5 hours) more exercise per day
    const additionalExercise = exerciseActivity.hours + 0.5;
    const yearsGained = (0.5 / 24) * 365 * (visualizeResult.lifeExpectancy - visualizeResult.age) / 365 * 2; // Exercise has double impact
    
    return {
      yearsGained: yearsGained.toFixed(1),
      increasedHours: additionalExercise
    };
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const exerciseOptimization = calculateExerciseOptimization();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>

      {/* Semantic Header with Schema.org markup */}
      <header className="bg-white shadow-sm dark:bg-gray-800" role="banner" itemScope itemType="https://schema.org/WPHeader">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center dark:text-primary" itemProp="headline">
            <i className="fas fa-hourglass-half mr-2" aria-hidden="true" title="Hourglass icon representing time"></i>
            Lifetime Visualizer
          </h1>
          <button 
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? (
              <Sun className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            ) : (
              <Moon className="h-5 w-5 text-gray-500" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" role="main" itemScope itemType="https://schema.org/WebApplication">
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
                              className="dark:text-white [&::-webkit-calendar-picker-indicator]:dark:filter [&::-webkit-calendar-picker-indicator]:dark:invert"
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
                                  onClick={() => {
                                    const dialog = document.querySelector('[data-state="open"]');
                                    if (dialog) {
                                      const closeEvent = new KeyboardEvent('keydown', {
                                        key: 'Escape',
                                        code: 'Escape',
                                        keyCode: 27,
                                        which: 27,
                                        bubbles: true
                                      });
                                      dialog.dispatchEvent(closeEvent);
                                    }
                                  }}
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
                    
                    {/* Manual Life Expectancy */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="manual-life-expectancy"
                          checked={useManualLifeExpectancy}
                          onChange={(e) => {
                            setUseManualLifeExpectancy(e.target.checked);
                            if (e.target.checked) {
                              setManualLifeExpectancy(lifeExpectancy?.toString() || "");
                            }
                          }}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                        />
                        <Label 
                          htmlFor="manual-life-expectancy"
                          className="text-sm font-medium"
                        >
                          Enter life expectancy manually
                        </Label>
                      </div>
                      
                      {useManualLifeExpectancy && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={manualLifeExpectancy}
                            onChange={(e) => setManualLifeExpectancy(e.target.value)}
                            placeholder="Enter life expectancy in years"
                            min="1"
                            max="150"
                            step="0.1"
                            className="w-full"
                          />
                          <span className="text-sm dark:text-gray-300">years</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Activity Inputs */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Daily Activities (hours)
                      </Label>
                      <div className="flex items-center gap-3">
                        {/* Hours Usage Indicator */}
                        <div className="flex items-center gap-1 text-xs">
                          <div className={`font-medium ${
                            activities.reduce((sum, activity) => sum + activity.hours, 0) > 24 
                              ? 'text-red-500' 
                              : activities.reduce((sum, activity) => sum + activity.hours, 0) > 20
                                ? 'text-amber-500'
                                : 'text-green-500'
                          }`}>
                            {activities.reduce((sum, activity) => sum + activity.hours, 0).toFixed(1)}/24 hrs
                          </div>
                          <AlertCircle className={`h-3 w-3 ${
                            activities.reduce((sum, activity) => sum + activity.hours, 0) > 24 
                              ? 'text-red-500' 
                              : 'hidden'
                          }`} />
                        </div>
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
                    </div>
                    
                    <div className="space-y-3">
                      {activities.map((activity, index) => (
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
                                const newActivities = [...activities];
                                newActivities[index].name = e.target.value;
                                newActivities[index].icon = getActivityIcon(e.target.value);
                                form.setValue('activities', newActivities);
                              }}
                              placeholder="Activity name"
                              className={index < 3 ? "bg-gray-50 dark:bg-gray-800" : ""}
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
                                const newActivities = [...activities];
                                newActivities[index].hours = parseFloat(e.target.value) || 0;
                                form.setValue('activities', newActivities, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                              }}
                              className="text-center dark:text-white"
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
          <article id="resultsContainer" ref={resultsRef} itemScope itemType="https://schema.org/Report">
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
                  
                  {/* Interactive Life Timeline Slider */}
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold mb-4">Life Timeline</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      You have approximately <span className="font-semibold text-primary">{formatNumber(visualizeResult.weeksRemaining)} weeks</span> remaining in your life.
                    </p>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                      {/* Timeline Visualization */}
                      <div className="relative mb-8">
                        {/* Life Progress Bar */}
                        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                            style={{ 
                              width: `${(visualizeResult.weeksLived / visualizeResult.weeksTotal) * 100}%`
                            }}
                          ></div>
                          
                          {/* Future Projection Marker (only visible when slider is used) */}
                          {timelineSliderValue > 0 && (
                            <div 
                              className="absolute top-0 h-4 w-1 bg-yellow-400 shadow-sm"
                              style={{ 
                                left: `${((visualizeResult.weeksLived + timelineSliderValue) / visualizeResult.weeksTotal) * 100}%`,
                                transform: 'translateX(-50%)'
                              }}
                            ></div>
                          )}
                        </div>
                        
                        {/* Key Milestones */}
                        <div className="flex justify-between mt-2">
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-1 bg-gray-400 dark:bg-gray-500"></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Birth</span>
                          </div>
                          
                          <div 
                            className="flex flex-col items-center"
                            style={{ 
                              position: 'absolute',
                              left: `${(visualizeResult.weeksLived / visualizeResult.weeksTotal) * 100}%`,
                              transform: 'translateX(-50%)'
                            }}
                          >
                            <div className="h-4 w-2 bg-blue-600 -mt-4 z-10 rounded-sm"></div>
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">Now ({visualizeResult.age.toFixed(1)} yrs)</span>
                          </div>
                          
                          {/* Projected future age milestone (only visible when slider is used) */}
                          {timelineSliderValue > 0 && projectedAge !== null && (
                            <div 
                              className="flex flex-col items-center"
                              style={{ 
                                position: 'absolute',
                                left: `${((visualizeResult.weeksLived + timelineSliderValue) / visualizeResult.weeksTotal) * 100}%`,
                                transform: 'translateX(-50%)'
                              }}
                            >
                              <div className="h-3 w-2 bg-yellow-400 -mt-3 z-10 rounded-sm"></div>
                              <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mt-1">Age {projectedAge.toFixed(1)}</span>
                            </div>
                          )}
                          
                          <div className="flex flex-col items-center">
                            <div className="h-3 w-1 bg-gray-400 dark:bg-gray-500"></div>
                            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{visualizeResult.lifeExpectancy} years</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Interactive Slider */}
                      <div className="mt-8">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          Explore how time continues to pass:
                        </p>
                        <div className="flex items-center space-x-4">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Today</span>
                          <Slider 
                            defaultValue={[0]}
                            max={visualizeResult.weeksRemaining}
                            step={52} // Approximately 1 year
                            className="flex-grow"
                            onValueChange={(value) => {
                              const weeksAdvanced = value[0];
                              setTimelineSliderValue(weeksAdvanced);
                              
                              // Reset projected data if slider is at 0
                              if (weeksAdvanced === 0) {
                                setProjectedAge(null);
                                setProjectedStats(null);
                                
                                // Reset charts to initial state when slider is at 0
                                if (visualizeResult) {
                                  updatePieChart(visualizeResult.activityStats);
                                  updateProjectionChart(visualizeResult.futureProjections);
                                }
                              } else {
                                const yearsAdvanced = weeksAdvanced / 52;
                                const projectedAgeValue = visualizeResult.age + yearsAdvanced;
                                setProjectedAge(projectedAgeValue);
                                
                                // Calculate and set the projected stats
                                const birthdate = new Date(form.getValues('birthdate'));
                                const formData = form.getValues();
                                const expectancy = visualizeResult.lifeExpectancy;
                                
                                const stats = calculateProjectedStats(
                                  formData,
                                  birthdate,
                                  visualizeResult.age,
                                  expectancy,
                                  weeksAdvanced
                                );
                                
                                setProjectedStats(stats);
                              }
                            }}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">Life Expectancy</span>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                          {projectedAge !== null && timelineSliderValue > 0 ? (
                            <div className="py-2 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-md inline-block border border-blue-200 dark:border-blue-800">
                              <span className="text-sm">
                                At age <span className="font-bold text-primary">{projectedAge.toFixed(1)}</span>, you'll have
                                <span className="font-bold text-primary ml-1">
                                  {projectedStats ? projectedStats.daysRemaining.toFixed(0) : ((visualizeResult.lifeExpectancy - projectedAge) * 365).toFixed(0)} days
                                </span> remaining
                              </span>
                            </div>
                          ) : (
                            <div className="py-2 px-4 bg-primary/10 dark:bg-primary/20 rounded-md inline-block">
                              <span className="text-lg font-bold">{((visualizeResult.lifeExpectancy - visualizeResult.age) * 365).toFixed(0)}</span>
                              <span className="ml-1 text-sm text-primary font-medium">days remaining</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Activity Breakdown - Dynamically display all activities */}
            <div className={`grid grid-cols-1 ${
              visualizeResult.activityStats.length === 2 ? 'sm:grid-cols-2' : 
              visualizeResult.activityStats.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 
              visualizeResult.activityStats.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 
              visualizeResult.activityStats.length >= 5 ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : ''
            } gap-6 mb-8`}>
              {/* Use projected stats when available, otherwise use original stats */}
              {(projectedStats && timelineSliderValue > 0 ? projectedStats.activityStats : visualizeResult.activityStats).map((activity) => (
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
                        {activity.percentage.toFixed(1)}% of your life 
                        {projectedStats && timelineSliderValue > 0 ? " at this age" : " so far"}
                      </p>
                      {/* Show change indicator if projecting into the future */}
                      {projectedStats && timelineSliderValue > 0 && (
                        <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-500 flex items-center">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          From {visualizeResult.activityStats.find(a => a.name === activity.name)?.years.toFixed(1) || "0"} years
                        </div>
                      )}
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
                    <h3 className="text-lg font-medium mb-4">
                      {projectedStats && timelineSliderValue > 0 ? 'Adjusted Time Remaining' : 'Time Remaining'}
                      {projectedStats && timelineSliderValue > 0 && (
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                          at age {projectedAge?.toFixed(1)}
                        </span>
                      )}
                    </h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                      {/* Use projected stats when available, otherwise use original stats */}
                      {(projectedStats && timelineSliderValue > 0 ? projectedStats.futureProjections : visualizeResult.futureProjections).map((projection) => (
                        <div key={projection.activity} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            {projection.activity}
                          </h4>
                          <p className="text-xl font-semibold">
                            {projection.yearsRemaining.toFixed(1)} more years
                          </p>
                          {/* Show change indicator if projecting into the future */}
                          {projectedStats && timelineSliderValue > 0 && (
                            <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                              {projection.yearsSoFar.toFixed(1)} years spent by this age
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {exerciseOptimization && (
                  <div className="mt-8">
                    <h3 className="text-lg font-medium mb-4">Health Optimization</h3>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <p className="text-sm">
                        Adding just <span className="font-semibold">30 minutes</span> more to your daily exercise routine could add <span className="font-semibold">{exerciseOptimization.yearsGained} extra years</span> to your life expectancy!
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <Button onClick={() => {
                          const exerciseIndex = activities.findIndex(a => a.name.toLowerCase().includes('exercise'));
                          if (exerciseIndex >= 0) {
                            const updatedActivities = [...activities];
                            updatedActivities[exerciseIndex].hours = exerciseOptimization.increasedHours;
                            form.setValue('activities', updatedActivities, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                            form.handleSubmit(visualizeData)();
                          }
                        }}>
                          Recalculate with Changes
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={async () => {
                            if (!visualizeResult || !resultsRef.current) return;
                            
                            setIsSharing(true);
                            
                            try {
                              const canvas = await html2canvas(resultsRef.current, {
                                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                allowTaint: true,
                                useCORS: true,
                                scale: 1.5 // Higher quality
                              });
                              
                              // Convert canvas to blob
                              canvas.toBlob((blob) => {
                                if (!blob) {
                                  throw new Error("Failed to create image");
                                }
                                
                                // Create download link
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.download = 'my-life-visualization.png';
                                link.href = url;
                                link.click();
                                
                                // Clean up
                                URL.revokeObjectURL(url);
                                
                                toast({
                                  title: "Screenshot captured",
                                  description: "Your life visualization has been downloaded as an image.",
                                  variant: "default",
                                });
                              }, 'image/png');
                            } catch (error: any) {
                              console.error("Screenshot error:", error);
                              toast({
                                title: "Failed to capture screenshot",
                                description: error.message || "Please try again later.",
                                variant: "destructive",
                              });
                            } finally {
                              setIsSharing(false);
                            }
                          }}
                          disabled={isSharing}
                        >
                          {isSharing ? 'Capturing...' : (
                            <>
                              <Share2 className="w-4 h-4 mr-2" />
                              Share Results
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </article>
        )}
      </main>
      
      <footer className="bg-gray-900 text-white py-8 mt-12" role="contentinfo" itemScope itemType="https://schema.org/WPFooter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between" itemScope itemType="https://schema.org/SiteNavigationElement">
            <div className="mb-8 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Lifetime Visualizer</h3>
              <p className="text-gray-400 text-sm">Understand how you spend your most valuable asset: time.</p>
            </div>
            <div className="flex space-x-6 items-center">
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
            <div className="flex justify-between items-center">
              <BuyMeCoffeeButton 
                username="oncedeved" 
                text="Buy me a coffee"
              />
              <p className="text-gray-400 text-sm">© {new Date().getFullYear()} Lifetime Visualizer. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LifeVisualizer;
