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
  Share2,
  Sparkles,
  BarChart3,
  PieChart
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
import { DailyQuote } from '@/components/DailyQuote';

// Define form schema
const formSchema = z.object({
  birthdate: z.string().refine(date => {
    const parsed = new Date(date);
    return !isNaN(parsed.getTime()) && parsed < new Date();
  }, {
    message: "Please enter a valid birthdate in the past"
  }),
  country: z.string().min(1, "Please select a country"),
  profession: z.string().optional(),
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

// Lifestyle templates for smart onboarding
const LIFESTYLE_TEMPLATES: Record<string, ActivityData[]> = {
  student: [
    { id: uuidv4(), name: 'Sleep', hours: 7, icon: 'fa-bed', color: '#3B82F6' },
    { id: uuidv4(), name: 'Study', hours: 6, icon: 'fa-graduation-cap', color: '#10B981' },
    { id: uuidv4(), name: 'Classes', hours: 4, icon: 'fa-chalkboard', color: '#F59E0B' },
    { id: uuidv4(), name: 'Social Time', hours: 2, icon: 'fa-users', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Exercise', hours: 1, icon: 'fa-dumbbell', color: '#EF4444' },
  ],
  parent: [
    { id: uuidv4(), name: 'Sleep', hours: 6, icon: 'fa-bed', color: '#3B82F6' },
    { id: uuidv4(), name: 'Work', hours: 8, icon: 'fa-briefcase', color: '#10B981' },
    { id: uuidv4(), name: 'Childcare', hours: 4, icon: 'fa-baby', color: '#F59E0B' },
    { id: uuidv4(), name: 'Household', hours: 2, icon: 'fa-home', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Family Time', hours: 2, icon: 'fa-heart', color: '#EF4444' },
  ],
  freelancer: [
    { id: uuidv4(), name: 'Sleep', hours: 7, icon: 'fa-bed', color: '#3B82F6' },
    { id: uuidv4(), name: 'Client Work', hours: 6, icon: 'fa-laptop', color: '#10B981' },
    { id: uuidv4(), name: 'Business Development', hours: 2, icon: 'fa-chart-line', color: '#F59E0B' },
    { id: uuidv4(), name: 'Learning/Skills', hours: 2, icon: 'fa-book', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Exercise', hours: 1, icon: 'fa-dumbbell', color: '#EF4444' },
  ],
  retiree: [
    { id: uuidv4(), name: 'Sleep', hours: 8, icon: 'fa-bed', color: '#3B82F6' },
    { id: uuidv4(), name: 'Hobbies', hours: 4, icon: 'fa-paint-brush', color: '#10B981' },
    { id: uuidv4(), name: 'Social Activities', hours: 3, icon: 'fa-users', color: '#F59E0B' },
    { id: uuidv4(), name: 'Exercise', hours: 2, icon: 'fa-dumbbell', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Family Time', hours: 2, icon: 'fa-heart', color: '#EF4444' },
  ],
  'office-worker': [
    { id: uuidv4(), name: 'Sleep', hours: 7, icon: 'fa-bed', color: '#3B82F6' },
    { id: uuidv4(), name: 'Work', hours: 8, icon: 'fa-briefcase', color: '#10B981' },
    { id: uuidv4(), name: 'Commute', hours: 2, icon: 'fa-car', color: '#F59E0B' },
    { id: uuidv4(), name: 'Exercise', hours: 1, icon: 'fa-dumbbell', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Leisure', hours: 3, icon: 'fa-tv', color: '#EF4444' },
  ],
  entrepreneur: [
    { id: uuidv4(), name: 'Sleep', hours: 6, icon: 'fa-bed', color: '#3B82F6' },
    { id: uuidv4(), name: 'Business Work', hours: 10, icon: 'fa-rocket', color: '#10B981' },
    { id: uuidv4(), name: 'Networking', hours: 2, icon: 'fa-handshake', color: '#F59E0B' },
    { id: uuidv4(), name: 'Learning', hours: 2, icon: 'fa-book', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Exercise', hours: 1, icon: 'fa-dumbbell', color: '#EF4444' },
  ],
  'healthcare-worker': [
    { id: uuidv4(), name: 'Sleep', hours: 6, icon: 'fa-bed', color: '#3B82F6' },
    { id: uuidv4(), name: 'Work', hours: 10, icon: 'fa-user-md', color: '#10B981' },
    { id: uuidv4(), name: 'Commute', hours: 1, icon: 'fa-car', color: '#F59E0B' },
    { id: uuidv4(), name: 'Rest/Recovery', hours: 3, icon: 'fa-couch', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Exercise', hours: 1, icon: 'fa-dumbbell', color: '#EF4444' },
  ],
  teacher: [
    { id: uuidv4(), name: 'Sleep', hours: 7, icon: 'fa-bed', color: '#3B82F6' },
    { id: uuidv4(), name: 'Teaching', hours: 6, icon: 'fa-chalkboard-teacher', color: '#10B981' },
    { id: uuidv4(), name: 'Lesson Planning', hours: 2, icon: 'fa-clipboard-list', color: '#F59E0B' },
    { id: uuidv4(), name: 'Grading', hours: 2, icon: 'fa-pen', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Personal Time', hours: 3, icon: 'fa-coffee', color: '#EF4444' },
  ],
};

// Profession options for the dropdown
const PROFESSION_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent/Caregiver' },
  { value: 'freelancer', label: 'Freelancer' },
  { value: 'retiree', label: 'Retiree' },
  { value: 'office-worker', label: 'Office Worker' },
  { value: 'entrepreneur', label: 'Entrepreneur' },
  { value: 'healthcare-worker', label: 'Healthcare Worker' },
  { value: 'teacher', label: 'Teacher/Educator' },
  { value: 'other', label: 'Other' },
];

// Country-specific work culture and lifestyle adjustments
const getCountryAdjustments = (country: string) => {
  // Work culture adjustments based on country
  const workIntensiveCountries = ['JP', 'KR', 'SG', 'CN']; // Japan, South Korea, Singapore, China
  const workLifeBalanceCountries = ['SE', 'DK', 'NO', 'NL', 'DE', 'FR']; // Scandinavian and Western European
  const longCommuteCountries = ['US', 'BR', 'IN', 'ID', 'PH']; // Countries with typically longer commutes
  
  return {
    hasLongWorkHours: workIntensiveCountries.includes(country),
    hasWorkLifeBalance: workLifeBalanceCountries.includes(country),
    hasLongCommute: longCommuteCountries.includes(country),
  };
};

// Smart suggestion logic based on user inputs
const getSuggestedTemplate = (age: number, country: string, profession?: string): ActivityData[] => {
  const countryAdjustments = getCountryAdjustments(country);
  
  // Start with base template
  let baseTemplate: ActivityData[];
  
  // If profession is explicitly selected, use that template
  if (profession && profession !== 'other' && LIFESTYLE_TEMPLATES[profession]) {
    baseTemplate = LIFESTYLE_TEMPLATES[profession];
  } else {
    // Age-based suggestions
    if (age < 25) {
      baseTemplate = LIFESTYLE_TEMPLATES.student;
    } else if (age >= 65) {
      baseTemplate = LIFESTYLE_TEMPLATES.retiree;
    } else if (age >= 25 && age < 45) {
      baseTemplate = LIFESTYLE_TEMPLATES['office-worker'];
    } else {
      baseTemplate = LIFESTYLE_TEMPLATES.parent;
    }
  }
  
  // Apply country-specific adjustments
  const adjustedTemplate = baseTemplate.map(activity => {
    let adjustedActivity = { ...activity, id: uuidv4() };
    
    // Adjust work hours based on country culture
    if (activity.name.toLowerCase().includes('work') || activity.name.toLowerCase().includes('business')) {
      if (countryAdjustments.hasLongWorkHours) {
        adjustedActivity.hours = Math.min(24, adjustedActivity.hours + 1); // Add 1 hour for work-intensive countries
      } else if (countryAdjustments.hasWorkLifeBalance) {
        adjustedActivity.hours = Math.max(1, adjustedActivity.hours - 1); // Reduce 1 hour for work-life balance countries
      }
    }
    
    // Adjust sleep based on work culture
    if (activity.name.toLowerCase().includes('sleep')) {
      if (countryAdjustments.hasLongWorkHours) {
        adjustedActivity.hours = Math.max(5, adjustedActivity.hours - 1); // Less sleep in work-intensive countries
      } else if (countryAdjustments.hasWorkLifeBalance) {
        adjustedActivity.hours = Math.min(9, adjustedActivity.hours + 0.5); // More sleep in balanced countries
      }
    }
    
    return adjustedActivity;
  }).filter(activity => activity.hours > 0);
  
  // Add commute if applicable and not already present
  const hasCommute = adjustedTemplate.some(activity => 
    activity.name.toLowerCase().includes('commute')
  );
  
  if (!hasCommute && countryAdjustments.hasLongCommute && age >= 18 && age < 65) {
    const commuteHours = countryAdjustments.hasLongCommute ? 2.5 : 1;
    adjustedTemplate.push({
      id: uuidv4(),
      name: 'Commute',
      hours: commuteHours,
      icon: 'fa-car',
      color: '#F59E0B'
    });
    
    // Reduce leisure time to accommodate commute
    const leisureIndex = adjustedTemplate.findIndex(activity => 
      activity.name.toLowerCase().includes('leisure') || 
      activity.name.toLowerCase().includes('personal')
    );
    if (leisureIndex !== -1) {
      adjustedTemplate[leisureIndex].hours = Math.max(1, adjustedTemplate[leisureIndex].hours - commuteHours);
    }
  }
  
  // Ensure total hours don't exceed 24
  const totalHours = adjustedTemplate.reduce((sum, activity) => sum + activity.hours, 0);
  if (totalHours > 24) {
    const excessHours = totalHours - 24;
    // Proportionally reduce all activities
    return adjustedTemplate.map(activity => ({
      ...activity,
      hours: Math.max(0.5, activity.hours - (activity.hours / totalHours) * excessHours)
    })).filter(activity => activity.hours >= 0.5);
  }
  
  return adjustedTemplate;
};

// Get recommendation message based on inputs
const getRecommendationMessage = (age: number, country: string, profession?: string): string => {
  const countryAdjustments = getCountryAdjustments(country);
  let baseMessage = '';
  
  if (profession && profession !== 'other') {
    const professionLabel = PROFESSION_OPTIONS.find(p => p.value === profession)?.label || profession;
    baseMessage = `Based on your profession as a ${professionLabel.toLowerCase()}`;
  } else if (age < 25) {
    baseMessage = "Based on your age, we've suggested a student-focused schedule";
  } else if (age >= 65) {
    baseMessage = "Based on your age, we've suggested a retirement lifestyle schedule";
  } else if (age >= 25 && age < 45) {
    baseMessage = "Based on your age, we've suggested a working professional schedule";
  } else {
    baseMessage = "Based on your age, we've suggested a family-oriented schedule";
  }
  
  // Add country-specific context
  let countryContext = '';
  if (countryAdjustments.hasLongWorkHours) {
    countryContext = ' and adjusted for the intensive work culture in your country';
  } else if (countryAdjustments.hasWorkLifeBalance) {
    countryContext = ' and adjusted for the work-life balance culture in your country';
  } else if (countryAdjustments.hasLongCommute) {
    countryContext = ' and included typical commute time for your country';
  }
  
  return baseMessage + countryContext + '.';
};

// Advanced Analytics Functions

// Trend analysis: Calculate compound effects of small changes
const calculateTrendAnalysis = (
  currentActivity: ActivityData, 
  changeInHours: number, 
  ageRange: { start: number; end: number },
  currentAge: number
): {
  originalYears: number;
  modifiedYears: number;
  compoundEffect: number;
  yearlyImpact: number;
  recommendations: string[];
  compoundingFactors: {
    healthMultiplier: number;
    skillMultiplier: number;
    totalBenefit: number;
  };
} => {
  const yearsInPeriod = ageRange.end - ageRange.start;
  const activityLower = currentActivity.name.toLowerCase();
  
  // Calculate base time change (linear component)
  // Clamp to minimum of 0 to prevent impossible negative totals
  const originalHoursPerYear = currentActivity.hours * 365;
  const modifiedHoursPerYear = Math.max(0, currentActivity.hours + changeInHours) * 365;
  
  const baseOriginalYears = (originalHoursPerYear * yearsInPeriod) / (365 * 24);
  const baseModifiedYears = (modifiedHoursPerYear * yearsInPeriod) / (365 * 24);
  
  // Calculate compounding effects based on activity type and age
  const compoundingFactors = calculateCompoundingFactors(activityLower, changeInHours, currentAge, yearsInPeriod, currentActivity.hours);
  
  // Apply compounding multipliers
  const originalYears = baseOriginalYears;
  const modifiedYears = baseModifiedYears * compoundingFactors.totalBenefit;
  
  const compoundEffect = modifiedYears - originalYears;
  const yearlyImpact = compoundEffect / yearsInPeriod;
  
  const recommendations = generateTrendRecommendations(currentActivity.name, changeInHours, compoundEffect, compoundingFactors, currentActivity.hours);
  
  return {
    originalYears,
    modifiedYears,
    compoundEffect,
    yearlyImpact,
    recommendations,
    compoundingFactors
  };
};

// Calculate compounding factors based on activity type, age, and duration
const calculateCompoundingFactors = (
  activityLower: string,
  changeInHours: number,
  currentAge: number,
  yearsInPeriod: number,
  currentActivityHours: number
): {
  healthMultiplier: number;
  skillMultiplier: number;
  totalBenefit: number;
} => {
  let healthMultiplier = 1.0;
  let skillMultiplier = 1.0;
  
  const isPositiveChange = changeInHours > 0;
  const ageFactor = Math.max(0.5, 1 - (currentAge - 25) / 100); // Younger people benefit more from habit changes
  const timeFactor = Math.min(2.0, 1 + yearsInPeriod / 20); // Longer time periods show more compounding
  
  if (activityLower.includes('exercise') || activityLower.includes('fitness') || activityLower.includes('workout') || activityLower.includes('training')) {
    // Research-based exercise calculations (WHO 2020, ATTICA 2025, British Journal Sports Medicine 2024)
    // Optimal: 150-300 min/week moderate (21-43 min/day) OR 75-150 min/week vigorous (11-21 min/day)
    // Sweet spot: 2.5-5 hours/week total activity
    // Every 1 MET increase reduces all-cause death by 11-17%
    
    // Calculate adjusted total activity level (current + change)
    // Clamp to minimum of 0 to prevent impossible negative totals
    const adjustedHoursPerDay = Math.max(0, currentActivityHours + changeInHours);
    const adjustedHoursPerWeek = adjustedHoursPerDay * 7;
    const minutesPerWeek = adjustedHoursPerWeek * 60;
    
    // Determine exercise type for specific benefits
    const isStrength = activityLower.includes('strength') || activityLower.includes('weight') || activityLower.includes('resistance');
    const isAerobic = activityLower.includes('cardio') || activityLower.includes('running') || activityLower.includes('cycling') || activityLower.includes('aerobic');
    const isCombined = (activityLower.includes('exercise') || activityLower.includes('workout')) && !isStrength && !isAerobic;
    
    if (isPositiveChange) {
      // Each hour of exercise can add 3-7 hours of productive life (meta-analysis 2024)
      const lifeExtensionFactor = 1 + (5 * Math.abs(changeInHours) / 24); // Average 5h gained per 1h exercise
      
      // WHO optimal range: 150-300 min/week moderate intensity
      if (minutesPerWeek >= 150 && minutesPerWeek <= 300) {
        // In optimal range - maximum benefits
        healthMultiplier = 1 + (0.4 * ageFactor * timeFactor * Math.abs(changeInHours));
      } else if (minutesPerWeek < 150) {
        // Below optimal - still beneficial
        healthMultiplier = 1 + (0.35 * ageFactor * timeFactor * Math.abs(changeInHours));
      } else if (minutesPerWeek <= 600) {
        // Above optimal but < 10h/week - good but diminishing returns
        const diminishingFactor = 0.9;
        healthMultiplier = 1 + (0.35 * ageFactor * timeFactor * Math.abs(changeInHours) * diminishingFactor);
      } else {
        // Beyond 10h/week - diminishing returns, potential overtraining
        const diminishingFactor = 0.7;
        healthMultiplier = 1 + (0.25 * ageFactor * timeFactor * Math.abs(changeInHours) * diminishingFactor);
      }
      
      // Type-specific multipliers based on research
      if (isStrength) {
        // Strength training: 10-17% mortality reduction, 30% CVD reduction for women (2024 studies)
        // 90 min/week = ~4 years biological age reduction
        const strengthBonus = 1.15;
        healthMultiplier *= strengthBonus;
        skillMultiplier = 1.1; // Improved metabolism, bone density
      } else if (isAerobic) {
        // Aerobic: Every 1 MET increase = 11-17% mortality reduction
        const aerobicBonus = 1.12;
        healthMultiplier *= aerobicBonus;
      } else if (isCombined) {
        // Combined training: 40% mortality reduction vs 21% resistance alone (ATTICA 2025)
        const combinedBonus = 1.2;
        healthMultiplier *= combinedBonus;
        skillMultiplier = 1.08;
      }
      
      // Apply life extension factor
      healthMultiplier = Math.min(1.8, healthMultiplier * Math.min(1.3, lifeExtensionFactor));
      
    } else {
      // Reducing exercise - progressive health decline
      // Sedentary lifestyle is major mortality risk factor
      healthMultiplier = Math.max(0.6, 1 + (0.25 * changeInHours * ageFactor));
      
      // Cognitive and metabolic impacts from reduced activity
      skillMultiplier = Math.max(0.85, 1 + (0.1 * changeInHours));
    }
  } else if (activityLower.includes('learning') || activityLower.includes('study') || activityLower.includes('skill')) {
    if (isPositiveChange) {
      // Learning compounds exponentially: knowledge builds on knowledge
      skillMultiplier = 1 + (0.4 * ageFactor * timeFactor * Math.abs(changeInHours));
      // Skills unlock opportunities that multiply over time
      skillMultiplier = Math.min(2.0, skillMultiplier + 0.15 * yearsInPeriod / 10);
    }
  } else if (activityLower.includes('work') || activityLower.includes('career')) {
    if (isPositiveChange && changeInHours <= 2) {
      // Strategic work time compounds through career advancement
      skillMultiplier = 1 + (0.25 * Math.min(1.2, ageFactor * 2) * Math.abs(changeInHours));
    } else if (changeInHours > 2) {
      // Overwork has diminishing returns and health costs
      healthMultiplier = Math.max(0.8, 1 - 0.1 * (changeInHours - 2));
    }
  } else if (activityLower.includes('social') || activityLower.includes('family') || activityLower.includes('relationship')) {
    if (isPositiveChange) {
      // Strong relationships provide compounding emotional and health benefits
      healthMultiplier = 1 + (0.2 * timeFactor * Math.abs(changeInHours));
      // Social connections become more valuable with age
      const socialAgeFactor = currentAge > 40 ? 1.3 : 1.0;
      healthMultiplier *= socialAgeFactor;
    }
  } else if (activityLower.includes('sleep')) {
    // Research-based sleep calculations (Nature Aging 2022, Scientific Reports 2016, SLEEP 2024)
    // Optimal: 7-9 hours for adults, 7 hours is the sweet spot for cognition
    // Sleep debt: 1 hour takes 4 days to recover
    
    if (isPositiveChange) {
      // Improving sleep toward optimal 7-9 hour range
      // Benefits: cognitive performance, cardiovascular health, metabolic function, longevity
      // Studies show sleep regularity is stronger predictor of mortality than duration
      healthMultiplier = 1 + (0.35 * timeFactor * Math.abs(changeInHours));
      
      // Age-specific benefits: older adults (65+) benefit from 7-8h optimal range
      if (currentAge > 65) {
        healthMultiplier *= 1.2; // Enhanced benefits for older adults
      } else if (currentAge > 40) {
        healthMultiplier *= 1.15; // Moderate enhancement for middle-aged adults
      }
      
      // Consistency multiplier: regular sleep compounds more than duration alone
      healthMultiplier = Math.min(1.6, healthMultiplier * 1.1);
      
    } else if (changeInHours < 0) {
      // Sleep debt compounds severely (Scientific Reports 2016)
      // 1 hour of sleep debt takes 4 days to recover
      // 6h/night for 10 days = cognitive impairment like total sleep deprivation
      const recoveryPenalty = Math.abs(changeInHours) * 4; // 4-day recovery rule
      const compoundingDebt = 1 + (recoveryPenalty / 30); // Normalize over month
      
      // Severe metabolic, cognitive, and cardiovascular impacts
      healthMultiplier = Math.max(0.5, 1 + (0.4 * changeInHours * compoundingDebt));
      
      // Sleep debt has worse effects on younger people's performance
      if (currentAge < 40) {
        healthMultiplier *= 0.9; // Additional 10% penalty for younger adults
      }
      
      // Cognitive impairment compounds over time
      skillMultiplier = Math.max(0.7, 1 + (0.25 * changeInHours));
    }
  }
  
  // Combine factors with realistic bounds
  const totalBenefit = Math.max(0.5, Math.min(2.5, healthMultiplier * skillMultiplier));
  
  return {
    healthMultiplier,
    skillMultiplier,
    totalBenefit
  };
};

// Generate recommendations based on trend analysis
const generateTrendRecommendations = (activityName: string, changeInHours: number, compoundEffect: number, compoundingFactors: any, currentActivityHours: number): string[] => {
  const recommendations: string[] = [];
  const isPositiveChange = changeInHours > 0;
  const activityLower = activityName.toLowerCase();
  
  if (activityLower.includes('exercise') || activityLower.includes('fitness') || activityLower.includes('workout') || activityLower.includes('training')) {
    // Evidence-based exercise recommendations (WHO 2020, ATTICA 2025, British Journal Sports Medicine 2024)
    // Calculate adjusted total activity level (current + change)
    // Clamp to minimum of 0 to prevent impossible negative totals
    const adjustedHoursPerDay = Math.max(0, currentActivityHours + changeInHours);
    const adjustedHoursPerWeek = adjustedHoursPerDay * 7;
    const minutesPerWeek = adjustedHoursPerWeek * 60;
    const isStrength = activityLower.includes('strength') || activityLower.includes('weight') || activityLower.includes('resistance');
    const isAerobic = activityLower.includes('cardio') || activityLower.includes('running') || activityLower.includes('cycling') || activityLower.includes('aerobic');
    
    if (isPositiveChange) {
      // WHO optimal range guidance
      if (minutesPerWeek >= 150 && minutesPerWeek <= 300) {
        recommendations.push("✓ You're in the WHO optimal range (150-300 min/week moderate intensity)");
        recommendations.push("Each hour of exercise adds 3-7 hours of productive life through health benefits (meta-analysis 2024)");
      } else if (minutesPerWeek < 150) {
        recommendations.push(`Current: ${minutesPerWeek.toFixed(0)} min/week. WHO recommends 150-300 min/week for optimal benefits`);
        recommendations.push("Even 15 min/day offers meaningful longevity improvements");
      } else if (minutesPerWeek <= 600) {
        recommendations.push("Above WHO guidelines - excellent! Benefits continue but start to plateau");
      } else {
        recommendations.push("⚠️ Beyond 10h/week: diminishing returns and potential overtraining risk");
        recommendations.push("Consider quality over quantity and adequate recovery time");
      }
      
      // Type-specific recommendations
      if (isStrength) {
        recommendations.push("Strength training: 10-17% all-cause mortality reduction, 30% CVD reduction for women");
        recommendations.push("90 min/week linked to ~4 years biological age reduction (2024 study)");
        recommendations.push("Optimal: 2-3 sessions/week, 30-60 min total, targeting major muscle groups");
      } else if (isAerobic) {
        recommendations.push("Aerobic exercise: Every 1 MET fitness increase = 11-17% lower death risk");
        recommendations.push("Improves cardiovascular health, lowers blood pressure, enhances cognitive function");
        recommendations.push("Optimal: 3-4 sessions/week at moderate-vigorous intensity");
      } else {
        recommendations.push("Combined aerobic + strength training shows 40% mortality reduction (20-year ATTICA study 2025)");
        recommendations.push("Consider mixing cardio and resistance work for comprehensive benefits");
      }
      
      recommendations.push("Consistency matters: Regular moderate activity often beats sporadic intense sessions");
      
    } else {
      const reductionMinutes = Math.abs(changeInHours) * 7 * 60;
      recommendations.push("⚠️ Reducing exercise increases health risks - sedentary lifestyle is a major mortality factor");
      recommendations.push(`After reduction: ${minutesPerWeek.toFixed(0)} min/week (reducing by ${reductionMinutes.toFixed(0)} min/week)`);
      if (minutesPerWeek < 150) {
        recommendations.push(`⚠️ Below WHO minimum of 150 min/week - this significantly impacts cardiovascular, metabolic, and cognitive health`);
      } else {
        recommendations.push("Still above WHO minimum but impacts remain - cardiovascular, metabolic, and cognitive health affected");
      }
      recommendations.push("Even small amounts preserve benefits: 15-20 min/day maintains baseline health");
      recommendations.push("Consider lower-intensity alternatives if time-constrained (walking, gentle movement)");
    }
  } else if (activityLower.includes('learning') || activityLower.includes('study') || activityLower.includes('reading')) {
    if (isPositiveChange) {
      recommendations.push("Continuous learning creates exponential knowledge growth");
      recommendations.push("Skills compound and open new opportunities over decades");
      recommendations.push("Focus on fundamentals that build upon each other");
    }
  } else if (activityLower.includes('work') || activityLower.includes('career')) {
    if (changeInHours > 1) {
      recommendations.push("Excessive work hours can lead to burnout and diminishing returns");
      recommendations.push("Consider if this time investment aligns with career goals");
    } else if (isPositiveChange && changeInHours <= 1) {
      recommendations.push("Strategic career time can compound into significant opportunities");
      recommendations.push("Focus on high-impact activities that build your reputation");
    }
  } else if (activityLower.includes('social') || activityLower.includes('family') || activityLower.includes('relationship')) {
    if (isPositiveChange) {
      recommendations.push("Strong relationships provide compounding emotional and health benefits");
      recommendations.push("Social connections often become more valuable with age");
    }
  } else if (activityLower.includes('sleep')) {
    // Evidence-based sleep recommendations (Nature Aging 2022, Scientific Reports 2016, SLEEP 2024)
    if (isPositiveChange) {
      recommendations.push("Optimal sleep (7-9h) improves cognitive performance, cardiovascular health, and longevity");
      recommendations.push("7 hours is the sweet spot for cognitive function in middle-aged and older adults (Nature Aging, 2022)");
      recommendations.push("Sleep regularity (consistency) is a stronger predictor of mortality than duration alone (SLEEP, 2024)");
      recommendations.push("Good sleep compounds: better immune function, metabolic health, and emotional regulation");
    } else {
      recommendations.push("Sleep debt compounds severely: 1 hour of lost sleep takes 4 days to fully recover (Scientific Reports, 2016)");
      recommendations.push("Chronic sleep restriction causes cumulative cognitive impairment similar to total sleep deprivation");
      recommendations.push("Weekend catch-up sleep does NOT restore metabolic and cognitive damage from weekday sleep debt");
      recommendations.push("Sleep debt increases risk of cardiovascular disease, obesity, diabetes, and cognitive decline");
      if (Math.abs(changeInHours) >= 2) {
        recommendations.push("⚠️ Severe sleep restriction (<6h) dramatically increases mortality risk, especially under age 65");
      }
    }
  }
  
  return recommendations;
};

// Cost-benefit analysis of time reallocation
const calculateCostBenefitAnalysis = (
  fromActivity: ActivityData,
  toActivity: ActivityData,
  hoursToReallocate: number,
  userAge: number,
  lifeExpectancy: number
): {
  opportunityCost: {
    activity: string;
    yearsLost: number;
    qualitativeImpact: string;
  };
  benefit: {
    activity: string;
    yearsGained: number;
    qualitativeImpact: string;
    potentialROI: string;
  };
  netImpact: {
    timeValue: number;
    recommendation: string;
    confidence: 'high' | 'medium' | 'low';
  };
} => {
  const remainingYears = lifeExpectancy - userAge;
  const yearsLost = (hoursToReallocate * 365 * remainingYears) / (365 * 24);
  const yearsGained = yearsLost; // Same time amount, different activity
  
  const fromImpact = getActivityQualitativeImpact(fromActivity.name, false);
  const toImpact = getActivityQualitativeImpact(toActivity.name, true);
  
  const timeValue = calculateTimeValue(fromActivity.name, toActivity.name, hoursToReallocate, userAge);
  const recommendation = generateReallocationRecommendation(fromActivity.name, toActivity.name, timeValue, userAge);
  const confidence = calculateConfidenceLevel(fromActivity.name, toActivity.name, userAge);
  
  return {
    opportunityCost: {
      activity: fromActivity.name,
      yearsLost,
      qualitativeImpact: fromImpact
    },
    benefit: {
      activity: toActivity.name,
      yearsGained,
      qualitativeImpact: toImpact,
      potentialROI: calculatePotentialROI(toActivity.name, hoursToReallocate, userAge)
    },
    netImpact: {
      timeValue,
      recommendation,
      confidence
    }
  };
};

// Calculate qualitative impact of activities
const getActivityQualitativeImpact = (activityName: string, isGaining: boolean): string => {
  const activityLower = activityName.toLowerCase();
  const action = isGaining ? 'Gaining' : 'Losing';
  
  if (activityLower.includes('exercise') || activityLower.includes('fitness')) {
    return isGaining ? 'Improved health, energy, and longevity' : 'Potential health decline and reduced energy';
  } else if (activityLower.includes('work') || activityLower.includes('career')) {
    return isGaining ? 'Career advancement and financial growth' : 'Reduced earning potential and career progress';
  } else if (activityLower.includes('family') || activityLower.includes('social')) {
    return isGaining ? 'Stronger relationships and emotional wellbeing' : 'Weakened relationships and social connections';
  } else if (activityLower.includes('learning') || activityLower.includes('study')) {
    return isGaining ? 'Knowledge accumulation and skill development' : 'Missed learning opportunities and skill stagnation';
  } else if (activityLower.includes('leisure') || activityLower.includes('entertainment')) {
    return isGaining ? 'Improved work-life balance and stress relief' : 'Potential stress increase and reduced relaxation';
  } else if (activityLower.includes('sleep')) {
    return isGaining ? 'Better health, cognitive function, and mood' : 'Cognitive decline, health issues, and mood problems';
  }
  
  return isGaining ? 'Potential positive life impact' : 'Potential negative life impact';
};

// Calculate time value score (-100 to +100)
const calculateTimeValue = (fromActivity: string, toActivity: string, hours: number, age: number): number => {
  const fromScore = getActivityValueScore(fromActivity, age);
  const toScore = getActivityValueScore(toActivity, age);
  
  const netScore = (toScore - fromScore) * (hours / 24) * 100; // Normalize to percentage scale
  return Math.max(-100, Math.min(100, netScore));
};

// Get activity value score based on life phase
const getActivityValueScore = (activityName: string, age: number): number => {
  const activityLower = activityName.toLowerCase();
  
  // Age-based multipliers
  const youthMultiplier = age < 30 ? 1.2 : age < 50 ? 1.0 : 0.8;
  const middleAgeMultiplier = age >= 30 && age < 60 ? 1.2 : 1.0;
  const seniorMultiplier = age >= 60 ? 1.2 : 1.0;
  
  if (activityLower.includes('exercise')) return 0.9 * (age > 40 ? 1.3 : 1.0);
  if (activityLower.includes('career') || activityLower.includes('work')) return 0.8 * middleAgeMultiplier;
  if (activityLower.includes('learning') || activityLower.includes('study')) return 0.85 * youthMultiplier;
  if (activityLower.includes('family') || activityLower.includes('social')) return 0.75 * (age > 30 ? 1.2 : 1.0);
  if (activityLower.includes('leisure') || activityLower.includes('entertainment')) return 0.4;
  if (activityLower.includes('sleep')) return 0.95;
  
  return 0.5; // Default neutral value
};

// Generate reallocation recommendation
const generateReallocationRecommendation = (fromActivity: string, toActivity: string, timeValue: number, age: number): string => {
  if (timeValue > 50) {
    return `Highly recommended: This reallocation aligns well with your life phase and priorities.`;
  } else if (timeValue > 20) {
    return `Recommended: This change could provide meaningful benefits for your current life stage.`;
  } else if (timeValue > -20) {
    return `Neutral: This reallocation has mixed benefits. Consider your personal priorities.`;
  } else if (timeValue > -50) {
    return `Caution: This change may not align with optimal time allocation for your age.`;
  } else {
    return `Not recommended: This reallocation could significantly impact your long-term wellbeing.`;
  }
};

// Calculate confidence level
const calculateConfidenceLevel = (fromActivity: string, toActivity: string, age: number): 'high' | 'medium' | 'low' => {
  const wellStudiedActivities = ['exercise', 'sleep', 'work', 'learning'];
  const fromStudied = wellStudiedActivities.some(activity => fromActivity.toLowerCase().includes(activity));
  const toStudied = wellStudiedActivities.some(activity => toActivity.toLowerCase().includes(activity));
  
  if (fromStudied && toStudied) return 'high';
  if (fromStudied || toStudied) return 'medium';
  return 'low';
};

// Calculate potential ROI
const calculatePotentialROI = (activityName: string, hours: number, age: number): string => {
  const activityLower = activityName.toLowerCase();
  
  if (activityLower.includes('exercise')) {
    const healthBenefit = hours * 365 * 3; // Rough health benefit multiplier
    return `Potential ${healthBenefit.toFixed(0)} additional healthy days per year`;
  } else if (activityLower.includes('learning') || activityLower.includes('skill')) {
    const careerBoost = age < 40 ? 'significant' : age < 60 ? 'moderate' : 'personal satisfaction';
    return `${careerBoost} career advancement potential`;
  } else if (activityLower.includes('work') || activityLower.includes('career')) {
    return hours > 2 ? 'Diminishing returns likely' : 'Potential career acceleration';
  } else if (activityLower.includes('family') || activityLower.includes('social')) {
    return 'Enhanced life satisfaction and emotional support';
  }
  
  return 'Qualitative life improvement';
};

// Life phase optimization
const calculateLifePhaseOptimization = (
  currentAge: number,
  activities: ActivityData[],
  lifeExpectancy: number
): {
  currentPhase: string;
  recommendations: {
    phase: string;
    ageRange: string;
    priority: string;
    suggestedAllocations: { activity: string; hours: number; reason: string }[];
    keyFocus: string[];
  }[];
  transitionPlanning: {
    nextPhase: string;
    timeToTransition: number;
    preparationSteps: string[];
  };
} => {
  const currentPhase = determineLifePhase(currentAge);
  const recommendations = generatePhaseRecommendations(currentAge, lifeExpectancy);
  const transitionPlanning = calculateTransitionPlanning(currentAge, lifeExpectancy);
  
  return {
    currentPhase,
    recommendations,
    transitionPlanning
  };
};

// Determine current life phase
const determineLifePhase = (age: number): string => {
  if (age < 25) return 'Foundation Building';
  if (age < 35) return 'Career Establishment';
  if (age < 45) return 'Growth & Family';
  if (age < 55) return 'Peak Performance';
  if (age < 65) return 'Transition Planning';
  return 'Legacy & Fulfillment';
};

// Generate phase-specific recommendations
const generatePhaseRecommendations = (currentAge: number, lifeExpectancy: number) => {
  const phases = [
    {
      phase: 'Foundation Building',
      ageRange: '18-25',
      priority: 'Learning & Skill Development',
      suggestedAllocations: [
        { activity: 'Learning/Study', hours: 4, reason: 'Build foundational knowledge and skills' },
        { activity: 'Exercise', hours: 1.5, reason: 'Establish healthy habits early' },
        { activity: 'Social Time', hours: 3, reason: 'Build lifelong relationships and network' },
        { activity: 'Work/Internships', hours: 6, reason: 'Gain practical experience' }
      ],
      keyFocus: ['Education completion', 'Habit formation', 'Network building', 'Self-discovery']
    },
    {
      phase: 'Career Establishment',
      ageRange: '25-35',
      priority: 'Professional Growth & Relationships',
      suggestedAllocations: [
        { activity: 'Work/Career', hours: 8, reason: 'Establish career trajectory' },
        { activity: 'Learning/Skills', hours: 2, reason: 'Stay competitive and grow' },
        { activity: 'Exercise', hours: 1.5, reason: 'Maintain health during busy period' },
        { activity: 'Relationship/Family', hours: 3, reason: 'Build lasting partnerships' }
      ],
      keyFocus: ['Career advancement', 'Financial stability', 'Relationship building', 'Health maintenance']
    },
    {
      phase: 'Growth & Family',
      ageRange: '35-45',
      priority: 'Balance & Family Development',
      suggestedAllocations: [
        { activity: 'Work/Career', hours: 7.5, reason: 'Peak earning potential' },
        { activity: 'Family Time', hours: 4, reason: 'Child development critical period' },
        { activity: 'Exercise', hours: 1.5, reason: 'Counter sedentary work lifestyle' },
        { activity: 'Personal Time', hours: 2, reason: 'Prevent burnout and maintain identity' }
      ],
      keyFocus: ['Family development', 'Career peak', 'Financial growth', 'Work-life balance']
    },
    {
      phase: 'Peak Performance',
      ageRange: '45-55',
      priority: 'Leadership & Wealth Building',
      suggestedAllocations: [
        { activity: 'Work/Leadership', hours: 7, reason: 'Maximum impact and influence' },
        { activity: 'Exercise', hours: 2, reason: 'Combat age-related health decline' },
        { activity: 'Family/Mentoring', hours: 3, reason: 'Guide next generation' },
        { activity: 'Learning/Growth', hours: 2, reason: 'Stay relevant and adaptable' }
      ],
      keyFocus: ['Leadership development', 'Wealth accumulation', 'Health preservation', 'Legacy building']
    },
    {
      phase: 'Transition Planning',
      ageRange: '55-65',
      priority: 'Preparation & Health Focus',
      suggestedAllocations: [
        { activity: 'Work/Transition', hours: 6, reason: 'Prepare for retirement transition' },
        { activity: 'Exercise/Health', hours: 2.5, reason: 'Invest in long-term health' },
        { activity: 'Hobbies/Interests', hours: 3, reason: 'Develop retirement activities' },
        { activity: 'Family/Relationships', hours: 3, reason: 'Strengthen support systems' }
      ],
      keyFocus: ['Retirement planning', 'Health optimization', 'Interest development', 'Relationship deepening']
    },
    {
      phase: 'Legacy & Fulfillment',
      ageRange: '65+',
      priority: 'Health & Contribution',
      suggestedAllocations: [
        { activity: 'Exercise/Health', hours: 3, reason: 'Maintain independence and vitality' },
        { activity: 'Hobbies/Interests', hours: 4, reason: 'Pursue lifelong passions' },
        { activity: 'Family/Community', hours: 4, reason: 'Share wisdom and stay connected' },
        { activity: 'Rest/Relaxation', hours: 2, reason: 'Enjoy well-earned leisure' }
      ],
      keyFocus: ['Health maintenance', 'Purpose fulfillment', 'Wisdom sharing', 'Enjoyment']
    }
  ];
  
  return phases;
};

// Calculate transition planning
const calculateTransitionPlanning = (currentAge: number, lifeExpectancy: number) => {
  let nextPhase = '';
  let timeToTransition = 0;
  let preparationSteps: string[] = [];
  
  if (currentAge < 25) {
    nextPhase = 'Career Establishment';
    timeToTransition = 25 - currentAge;
    preparationSteps = [
      'Complete education and certifications',
      'Build professional network',
      'Develop core skills in chosen field',
      'Gain internship or entry-level experience'
    ];
  } else if (currentAge < 35) {
    nextPhase = 'Growth & Family';
    timeToTransition = 35 - currentAge;
    preparationSteps = [
      'Achieve financial stability',
      'Develop leadership skills',
      'Consider family planning',
      'Build emergency fund and investments'
    ];
  } else if (currentAge < 45) {
    nextPhase = 'Peak Performance';
    timeToTransition = 45 - currentAge;
    preparationSteps = [
      'Develop expertise and specialization',
      'Build wealth and assets',
      'Strengthen family relationships',
      'Focus on health and fitness'
    ];
  } else if (currentAge < 55) {
    nextPhase = 'Transition Planning';
    timeToTransition = 55 - currentAge;
    preparationSteps = [
      'Maximize earning potential',
      'Develop leadership and mentoring skills',
      'Diversify investments',
      'Maintain health and energy'
    ];
  } else if (currentAge < 65) {
    nextPhase = 'Legacy & Fulfillment';
    timeToTransition = 65 - currentAge;
    preparationSteps = [
      'Plan retirement finances',
      'Develop post-career interests',
      'Focus on health optimization',
      'Strengthen family and social connections'
    ];
  } else {
    nextPhase = 'Continued Fulfillment';
    timeToTransition = lifeExpectancy - currentAge;
    preparationSteps = [
      'Maintain physical and mental health',
      'Stay engaged with community',
      'Share knowledge and experience',
      'Focus on meaningful relationships'
    ];
  }
  
  return {
    nextPhase,
    timeToTransition,
    preparationSteps
  };
};

// Activity comparisons - focused on meaningful, data-driven insights
const ACTIVITY_COMPARISONS: Record<string, Array<{icon: string, text: (years: number) => string}>> = {
  'Sleep': [
    { 
      icon: 'fa-clock', 
      text: (years) => `${formatNumber(years * 365 * 8)} total hours of rest and recovery` 
    }
  ],
  'Work': [
    { 
      icon: 'fa-clock', 
      text: (years) => `${formatNumber(years * 365 * 8)} hours of professional work` 
    }
  ],
  'Commute': [
    { 
      icon: 'fa-road', 
      text: (years) => `Approximately ${formatNumber(years * 15000)} miles traveled` 
    }
  ],
  'Exercise': [
    { 
      icon: 'fa-fire', 
      text: (years) => `Approximately ${formatNumber(years * 365 * 400)} calories burned` 
    }
  ],
  'Reading': [
    { 
      icon: 'fa-book', 
      text: (years) => `Approximately ${Math.floor(years * 50)} books read (assuming 200 pages/book)` 
    }
  ],
  'Studying': [
    { 
      icon: 'fa-graduation-cap', 
      text: (years) => `${Math.floor(years / 4)} college degrees equivalent in study time` 
    }
  ]
};

// Generic comparison generators for all activities - focused on factual data
const GENERIC_COMPARISONS: Array<{icon: string, text: (years: number, activity: string) => string}> = [
  {
    icon: 'fa-clock', 
    text: (years, activity) => `${formatNumber(years * 365 * 24)} total hours spent on ${activity.toLowerCase()}`
  },
  {
    icon: 'fa-calendar-days', 
    text: (years, activity) => `${formatNumber(years * 365)} days dedicated to this activity`
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
  // Pick 2 random comparisons from the generic list
  const randomIndices = Array.from(Array(GENERIC_COMPARISONS.length).keys())
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  
  return randomIndices.map(index => ({
    icon: GENERIC_COMPARISONS[index].icon,
    text: GENERIC_COMPARISONS[index].text(years, activityName)
  }));
};

// SEO optimization function to set metadata dynamically
const updatePageMetadata = () => {
  // Update document title for better SEO
  document.title = "Lifetime Visualizer - Understand How You Spend Your Life | Time Management Tool";
  
  // Dynamically update meta description for this specific page
  const pageMetaDescription = document.querySelector('meta[name="description"]');
  if (pageMetaDescription) {
    pageMetaDescription.setAttribute('content', 
      'Visualize how you spend your time across your entire lifespan with our interactive life visualization tool. Track activities, see personalized projections, and optimize your life for better productivity and fulfillment.');
  }
};

const LifeVisualizer: React.FC = () => {
  // Update metadata when component mounts
  useEffect(() => {
    updatePageMetadata();
  }, []);

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
      profession: '',
      activities: DEFAULT_ACTIVITIES,
    },
  });
  
  // Watch activities array to ensure UI updates when it changes
  const activities = form.watch('activities');
  const birthdate = form.watch('birthdate');
  const country = form.watch('country');
  const profession = form.watch('profession');

  // State for managing smart suggestions
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [suggestedActivities, setSuggestedActivities] = useState<ActivityData[]>([]);

  // State for advanced analytics
  const [analyticsData, setAnalyticsData] = useState<{
    trendAnalysis: any[];
    costBenefitAnalysis: any[];
    lifePhaseOptimization: any;
  } | null>(null);
  const [selectedAnalyticsTab, setSelectedAnalyticsTab] = useState<'trends' | 'cost-benefit' | 'life-phases'>('trends');

  // Effect to trigger smart suggestions when inputs change
  useEffect(() => {
    if (birthdate && country) {
      const birthdateObj = new Date(birthdate);
      const age = calculateAge(birthdateObj);
      
      if (age > 0) {
        const suggested = getSuggestedTemplate(age, country, profession);
        const message = getRecommendationMessage(age, country, profession);
        
        setSuggestedActivities(suggested);
        setSuggestionMessage(message);
        setShowSuggestion(true);
      }
    } else {
      setShowSuggestion(false);
    }
  }, [birthdate, country, profession]);

  // Function to apply suggested activities
  const applySuggestedActivities = () => {
    form.setValue('activities', suggestedActivities);
    setShowSuggestion(false);
    toast({
      title: "Activities updated",
      description: "Your daily activities have been updated based on our suggestions.",
    });
  };

  // Calculate advanced analytics when visualization result changes
  useEffect(() => {
    if (!visualizeResult) return;

    try {
      const currentAge = visualizeResult.age;
      const lifeExpectancy = visualizeResult.lifeExpectancy;
      const activities = visualizeResult.activityStats;

      // Calculate trend analysis for each activity with small changes
      const trendAnalysis = activities.map(activity => {
        const changeOptions = [-1, -0.5, 0.5, 1]; // Hours to add/remove
        const trends = changeOptions.map(change => ({
          change,
          analysis: calculateTrendAnalysis(
            { id: '', name: activity.name, hours: activity.years * 24 / (lifeExpectancy - 18), icon: activity.icon, color: activity.color },
            change,
            { start: currentAge, end: lifeExpectancy },
            currentAge
          )
        }));
        
        return {
          activity: activity.name,
          currentHours: (activity.years * 24 / (lifeExpectancy - 18)).toFixed(1),
          trends,
          icon: activity.icon,
          color: activity.color
        };
      });

      // Calculate cost-benefit analysis for common reallocations
      const costBenefitAnalysis = [];
      for (let i = 0; i < activities.length; i++) {
        for (let j = 0; j < activities.length; j++) {
          if (i !== j) {
            const fromActivity = {
              id: '', 
              name: activities[i].name, 
              hours: activities[i].years * 24 / (lifeExpectancy - 18),
              icon: activities[i].icon,
              color: activities[i].color
            };
            const toActivity = {
              id: '', 
              name: activities[j].name, 
              hours: activities[j].years * 24 / (lifeExpectancy - 18),
              icon: activities[j].icon,
              color: activities[j].color
            };
            
            const analysis = calculateCostBenefitAnalysis(
              fromActivity,
              toActivity,
              0.5, // 30 minutes reallocation
              currentAge,
              lifeExpectancy
            );
            
            costBenefitAnalysis.push({
              from: activities[i].name,
              to: activities[j].name,
              analysis,
              fromColor: activities[i].color,
              toColor: activities[j].color
            });
          }
        }
      }

      // Calculate life phase optimization
      const activityData = activities.map(activity => ({
        id: '',
        name: activity.name,
        hours: activity.years * 24 / (lifeExpectancy - 18),
        icon: activity.icon,
        color: activity.color
      }));
      
      const lifePhaseOptimization = calculateLifePhaseOptimization(
        currentAge,
        activityData,
        lifeExpectancy
      );

      setAnalyticsData({
        trendAnalysis,
        costBenefitAnalysis: costBenefitAnalysis.slice(0, 8), // Limit to top 8 for UI performance
        lifePhaseOptimization
      });

    } catch (error) {
      console.error('Error calculating analytics:', error);
      setAnalyticsData(null);
    }
  }, [visualizeResult]);

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
    // No hard limit on activities - only constrained by 24-hour daily limit
    // Generate a color from an expanded palette
    const colorPalette = [
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
    
    const colorIndex = (activities.length - 3) % colorPalette.length;
    const color = colorIndex >= 0 ? colorPalette[colorIndex] : getRandomColorHex();
    
    form.setValue('activities', [
      ...activities,
      { 
        id: uuidv4(), 
        name: '', 
        hours: 1, 
        icon: 'fa-circle', 
        color
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
    
    // If chart exists, update its data smoothly instead of destroying it
    if (pieChartInstance.current) {
      pieChartInstance.current.data.labels = activityStats.map(a => a.name);
      pieChartInstance.current.data.datasets[0].data = activityStats.map(a => a.percentage);
      pieChartInstance.current.data.datasets[0].backgroundColor = activityStats.map(a => a.color);
      pieChartInstance.current.update('active'); // Smooth animation
      return;
    }
    
    // Create new chart if it doesn't exist
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
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
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
    
    // If chart exists, update its data smoothly instead of destroying it
    if (projectionChartInstance.current) {
      projectionChartInstance.current.data.labels = projections.map(p => p.activity);
      projectionChartInstance.current.data.datasets[0].data = projections.map(p => p.yearsSoFar);
      projectionChartInstance.current.data.datasets[1].data = projections.map(p => p.yearsRemaining);
      projectionChartInstance.current.update('active'); // Smooth animation
      return;
    }
    
    // Create new chart if it doesn't exist
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
        animation: {
          duration: 750,
          easing: 'easeInOutQuart'
        },
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

  // Calculate exercise optimization - only returns data if there's meaningful improvement opportunity
  const calculateExerciseOptimization = () => {
    if (!visualizeResult) return null;
    
    const exerciseActivity = visualizeResult.activityStats.find(a => 
      a.name.toLowerCase().includes('exercise') || 
      a.name.toLowerCase().includes('workout') || 
      a.name.toLowerCase().includes('fitness') ||
      a.name.toLowerCase().includes('gym')
    );
    if (!exerciseActivity) return null;

    const currentExercise = (exerciseActivity.years * 8760) / (visualizeResult.age * 365);
    const weeklyHours = currentExercise * 7;
    const recommendedWeekly = 2.5; // WHO recommends 150 minutes = 2.5 hours per week
    
    // If already in optimal range (2.5-10 hours/week), don't show recommendations
    // Expanded to ~1.5 hours/day max to avoid flagging healthy active lifestyles
    if (weeklyHours >= 2.5 && weeklyHours <= 10) {
      return null;
    }
    
    let fitnessLevel = '';
    let healthImpact = '';
    let recommendations: string[] = [];
    let yearsImpact = 0;
    let optimizedHours = currentExercise;

    if (weeklyHours < 1.25) { // Less than 75 minutes per week
      fitnessLevel = 'Sedentary';
      healthImpact = 'Significantly increased risk of cardiovascular disease, diabetes, and premature death';
      yearsImpact = -2.5;
      optimizedHours = 0.36; // ~25 minutes daily
      recommendations = [
        'Start with 10-minute walks after meals',
        'Take stairs instead of elevators',
        'Park farther away or get off transit one stop early',
        'Try bodyweight exercises during TV breaks',
        'Set reminders to move every hour'
      ];
    } else if (weeklyHours < 2.5) { // 75-150 minutes per week
      fitnessLevel = 'Lightly Active';
      healthImpact = 'Some health benefits, but below optimal levels for longevity';
      yearsImpact = -1;
      optimizedHours = 0.5; // 30 minutes daily
      recommendations = [
        'Gradually increase to 30 minutes of moderate activity daily',
        'Add strength training 2 days per week',
        'Try brisk walking, cycling, or swimming',
        'Join group fitness classes for motivation',
        'Use fitness apps to track progress'
      ];
    } else if (weeklyHours > 10) { // More than 10 hours per week - potentially overtraining
      fitnessLevel = 'Highly Active';
      healthImpact = 'Consider monitoring for overtraining - excessive volume may lead to burnout';
      yearsImpact = 0; // Neutral to slightly negative
      optimizedHours = 1; // Suggest 7 hours/week = 1 hour daily
      recommendations = [
        'Ensure adequate recovery time between sessions',
        'Monitor for overtraining symptoms (fatigue, decreased performance)',
        'Consider reducing volume if experiencing burnout',
        'Focus on quality over quantity',
        'Maintain proper nutrition and hydration'
      ];
    }

    const potentialGain = optimizedHours > currentExercise ? 
      ((optimizedHours - currentExercise) / 24) * 365 * (visualizeResult.lifeExpectancy - visualizeResult.age) / 365 * 3 : 0;

    return {
      currentHours: currentExercise,
      currentWeeklyHours: weeklyHours.toFixed(1),
      recommendedWeeklyHours: recommendedWeekly,
      fitnessLevel,
      healthImpact,
      yearsImpact: yearsImpact.toFixed(1),
      recommendations,
      optimizedHours,
      potentialGain: potentialGain.toFixed(1),
      isOptimal: false
    };
  };

  // Calculate sleep optimization - only returns data if there's meaningful improvement opportunity
  const calculateSleepOptimization = () => {
    if (!visualizeResult) return null;
    
    const sleepActivity = visualizeResult.activityStats.find(a => a.name.toLowerCase().includes('sleep'));
    if (!sleepActivity) return null;

    const currentSleep = (sleepActivity.years * 8760) / (visualizeResult.age * 365);
    const optimalSleep = 8; // Recommended 8 hours
    
    // If already in optimal range (7-9 hours), don't show recommendations
    if (currentSleep >= 7 && currentSleep <= 9) {
      return null;
    }
    
    // Determine sleep quality and recommendations
    let sleepQuality = '';
    let recommendations: string[] = [];
    let healthImpact = '';
    let yearsImpact = 0;

    if (currentSleep < 6) {
      sleepQuality = 'Severely Insufficient';
      healthImpact = 'Major negative impact on health, cognitive function, and lifespan';
      yearsImpact = -3;
      recommendations = [
        'Establish a consistent bedtime routine',
        'Avoid screens 1 hour before bed',
        'Keep bedroom cool (60-67°F/15-19°C)',
        'Consider consulting a sleep specialist'
      ];
    } else if (currentSleep < 7) {
      sleepQuality = 'Insufficient';
      healthImpact = 'Increased risk of health issues and reduced cognitive performance';
      yearsImpact = -1.5;
      recommendations = [
        'Gradually increase sleep by 15-30 minutes',
        'Create a dark, quiet sleep environment',
        'Limit caffeine after 2 PM',
        'Try relaxation techniques before bed'
      ];
    } else if (currentSleep > 9) {
      sleepQuality = 'Excessive';
      healthImpact = 'May indicate underlying health issues or poor sleep quality';
      yearsImpact = -0.5;
      recommendations = [
        'Evaluate sleep quality vs. quantity',
        'Consider sleep study if persistently tired',
        'Maintain regular sleep/wake times',
        'Increase physical activity during the day'
      ];
    }

    return {
      currentHours: currentSleep,
      optimalHours: optimalSleep,
      quality: sleepQuality,
      healthImpact,
      yearsImpact: yearsImpact.toFixed(1),
      recommendations,
      sleepDebt: currentSleep < 8 ? (8 - currentSleep).toFixed(1) : null
    };
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const exerciseOptimization = calculateExerciseOptimization();
  const sleepOptimization = calculateSleepOptimization();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      {/* Floating Navigation */}
      {visualizeResult && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 p-2">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full p-2 h-10 w-10"
                onClick={() => document.getElementById('resultsContainer')?.scrollIntoView({ behavior: 'smooth' })}
                title="View Results"
              >
                <i className="fas fa-chart-pie text-sm"></i>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full p-2 h-10 w-10"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                title="Back to Top"
              >
                <i className="fas fa-arrow-up text-sm"></i>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Semantic Header with Schema.org markup */}
      <header className="bg-white shadow-sm dark:bg-gray-800" role="banner" itemScope itemType="https://schema.org/WPHeader">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-primary flex items-center dark:text-primary" 
             itemProp="headline" 
             aria-label="Lifetime Visualizer - Track and optimize your life's time allocation">
            <i className="fas fa-hourglass-half mr-2" aria-hidden="true" title="Hourglass icon representing time"></i>
            <span itemProp="name">Lifetime Visualizer</span>
            <meta itemProp="description" content="Interactive tool to visualize your lifetime activity allocation based on current habits" />
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

      {/* Daily Quote */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-0">
        <DailyQuote />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" role="main" 
        itemScope 
        itemType="https://schema.org/WebApplication"
        aria-labelledby="main-heading">
        {/* WebApplication schema.org additional metadata */}
        <meta itemProp="name" content="Lifetime Visualizer" />
        <meta itemProp="applicationCategory" content="LifestyleApplication" />
        <meta itemProp="applicationSubCategory" content="TimeManagementTool" />
        <meta itemProp="operatingSystem" content="Any" />
        <meta itemProp="offers" content="Free" />
        {/* Progress Indicator */}
        {loading && (
          <div className="mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">
                  Calculating your life visualization...
                </span>
              </div>
              <div className="mt-2 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full w-3/4 animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <Card className="mb-8 shadow-lg border-0 ring-1 ring-gray-200 dark:ring-gray-700">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-300 font-bold text-sm">1</span>
              </div>
              Tell Us About Yourself
            </CardTitle>
            <CardDescription>
              Enter your basic information to get started with your life visualization
            </CardDescription>
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
                    
                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profession/Lifestyle (Optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-profession">
                                <SelectValue placeholder="Select your profession or lifestyle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROFESSION_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Smart Suggestions */}
                    {showSuggestion && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            <i className="fas fa-lightbulb text-blue-600 dark:text-blue-400"></i>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                              Smart Activity Suggestions
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                              {suggestionMessage}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {suggestedActivities.map((activity, index) => (
                                <span 
                                  key={index}
                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                                >
                                  <i className={`fas ${activity.icon} text-xs`}></i>
                                  {activity.name} ({activity.hours}h)
                                </span>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={applySuggestedActivities}
                                data-testid="button-apply-suggestions"
                              >
                                Apply Suggestions
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowSuggestion(false)}
                                data-testid="button-dismiss-suggestions"
                              >
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
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
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                onClick={addActivity}
                                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 group"
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
                        <div key={activity.id} className="group flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
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
                              onChange={(e) => {
                                const newActivities = [...activities];
                                newActivities[index].name = e.target.value;
                                newActivities[index].icon = getActivityIcon(e.target.value);
                                form.setValue('activities', newActivities, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                              }}
                              placeholder="Activity name"
                              className="border-0 bg-transparent p-0 font-medium focus-visible:ring-0 dark:text-white"
                              data-testid={`input-activity-name-${index}`}
                            />
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {activity.hours} {activity.hours === 1 ? 'hour' : 'hours'} per day
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-20">
                              <Input
                                type="number"
                                min="0"
                                max="24"
                                step="0.5"
                                value={activity.hours}
                                onChange={(e) => {
                                  const newActivities = [...activities];
                                  newActivities[index].hours = parseFloat(e.target.value) || 0;
                                  form.setValue('activities', newActivities, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                                }}
                                className="text-center text-sm"
                              />
                            </div>
                            {index >= 3 && (
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeActivity(activity.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                

                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? (
                      <>
                        <Hourglass className="mr-2 h-4 w-4 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Hourglass className="mr-2 h-4 w-4" />
                        Visualize My Life
                      </>
                    )}
                  </Button>
                  
                  {/* Quick Stats Preview */}
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total hours: {activities.reduce((sum, activity) => sum + activity.hours, 0)}/24
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Results Container */}
        {visualizeResult && (
          <article id="resultsContainer" ref={resultsRef} 
                  itemScope itemType="https://schema.org/Report"
                  aria-label="Life visualization results">
            <meta itemProp="name" content="Lifetime Activity Analysis Report" />
            <meta itemProp="dateCreated" content={new Date().toISOString()} />
            <meta itemProp="author" content="Lifetime Visualizer" />
            <meta itemProp="about" content="Personal time allocation analysis" />
            <meta itemProp="keywords" content="life planning, time management, productivity, activity analysis" />
            
            {/* Results Summary */}
            <div className="mb-8 space-y-6">
              {/* Key Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{visualizeResult.age}</div>
                    <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Years Lived</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">{(visualizeResult.lifeExpectancy - visualizeResult.age).toFixed(1)}</div>
                    <div className="text-sm text-green-700 dark:text-green-300 font-medium">Years Remaining</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700">
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(visualizeResult.weeksRemaining)}</div>
                    <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">Weeks Left</div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Results Card */}
              <Card className="shadow-xl border-0 ring-1 ring-gray-200 dark:ring-gray-700">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 dark:text-purple-300 font-bold text-sm">2</span>
                    </div>
                    Your Life Visualization
                  </CardTitle>
                  <CardDescription>
                    Interactive analysis based on your age {visualizeResult.age} years out of expected {visualizeResult.lifeExpectancy} years
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
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
                            max={visualizeResult.weeksRemaining}
                            step={52} // Approximately 1 year
                            className="flex-grow touch-none" // Improved touch handling
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
                            <div className="py-2 px-3 sm:px-4 bg-blue-50 dark:bg-blue-900/20 rounded-md inline-block border border-blue-200 dark:border-blue-800 transition-all duration-300">
                              <span className="text-xs sm:text-sm">
                                At age <span className="font-bold text-primary">{projectedAge.toFixed(1)}</span>, you'll have
                                <span className="font-bold text-primary ml-1">
                                  {projectedStats ? projectedStats.daysRemaining.toFixed(0) : ((visualizeResult.lifeExpectancy - projectedAge) * 365).toFixed(0)} days
                                </span> remaining
                              </span>
                            </div>
                          ) : (
                            <div className="py-2 px-3 sm:px-4 bg-primary/10 dark:bg-primary/20 rounded-md inline-block transition-all duration-300">
                              <span className="text-base sm:text-lg font-bold">{((visualizeResult.lifeExpectancy - visualizeResult.age) * 365).toFixed(0)}</span>
                              <span className="ml-1 text-xs sm:text-sm text-primary font-medium">days remaining</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
            
            {/* Activity Breakdown - Dynamically display all activities */}
            <div className={`grid grid-cols-1 ${
              visualizeResult.activityStats.length === 2 ? 'sm:grid-cols-2' : 
              visualizeResult.activityStats.length === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 
              visualizeResult.activityStats.length === 4 ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 
              visualizeResult.activityStats.length >= 5 ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : ''
            } gap-4 sm:gap-6 mb-8`}>
              {/* Use projected stats when available, otherwise use original stats */}
              {(projectedStats && timelineSliderValue > 0 ? projectedStats.activityStats : visualizeResult.activityStats).map((activity) => (
                <Card key={activity.name} 
                      className="overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-1 touch-none"
                      itemScope itemType="https://schema.org/QuantitativeValue"
                      itemProp="value">
                  <div className="p-4 sm:p-5" style={{ backgroundColor: `${activity.color}15` }}>
                    <div className="flex justify-between items-center">
                      <h3 className="text-base sm:text-lg font-semibold" style={{ color: activity.color }}>
                        {activity.name}
                      </h3>
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: activity.color }}
                      >
                        <i className={`fas ${activity.icon} text-white text-sm sm:text-base`}></i>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-2xl sm:text-3xl font-bold transition-all duration-300">{activity.years.toFixed(1)} years</p>
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        {activity.percentage.toFixed(1)}% of your life 
                        {projectedStats && timelineSliderValue > 0 ? " at this age" : " so far"}
                      </p>
                      {/* Show change indicator if projecting into the future */}
                      {projectedStats && timelineSliderValue > 0 && (
                        <div className="mt-1 text-xs font-medium text-green-600 dark:text-green-500 flex items-center transition-all duration-300">
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
            <Card className="transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Future Projections
                  {projectedStats && timelineSliderValue > 0 && (
                    <span className="text-xs sm:text-sm font-normal text-blue-600 dark:text-blue-400 transition-all duration-300">
                      (Live Preview)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="lg:col-span-2 order-2 lg:order-1">
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">If You Continue Current Patterns</h3>
                    <div className="h-48 sm:h-64 relative">
                      <canvas 
                        ref={projectionChartRef}
                        className="w-full h-full"
                      ></canvas>
                      {/* Persistent indicator for timeline exploration */}
                      {projectedStats && timelineSliderValue > 0 && (
                        <div className="absolute top-2 right-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 px-2 py-1 rounded-full text-xs font-medium transition-all duration-300">
                          Updated
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="order-1 lg:order-2">
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
                      {projectedStats && timelineSliderValue > 0 ? 'Adjusted Time Remaining' : 'Time Remaining'}
                      {projectedStats && timelineSliderValue > 0 && (
                        <span className="text-xs sm:text-sm font-normal text-gray-500 dark:text-gray-400 ml-2 transition-all duration-300">
                          at age {projectedAge?.toFixed(1)}
                        </span>
                      )}
                    </h3>
                    <div className="space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto pr-2">
                      {/* Use projected stats when available, otherwise use original stats */}
                      {(projectedStats && timelineSliderValue > 0 ? projectedStats.futureProjections : visualizeResult.futureProjections).map((projection) => (
                        <div key={projection.activity} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 sm:p-4 transition-all duration-300 hover:shadow-sm">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
                            {projection.activity}
                          </h4>
                          <p className="text-lg sm:text-xl font-semibold transition-all duration-300">
                            {projection.yearsRemaining.toFixed(1)} more years
                          </p>
                          {/* Show change indicator if projecting into the future */}
                          {projectedStats && timelineSliderValue > 0 && (
                            <p className="text-xs mt-1 text-blue-600 dark:text-blue-400 transition-all duration-300">
                              {projection.yearsSoFar.toFixed(1)} years spent by this age
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Advanced Analytics Section */}
                {analyticsData && (
                  <div className="mt-8">
                    <Card className="transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                          <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                          Advanced Analytics
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            onClick={() => setSelectedAnalyticsTab('trends')}
                            className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all ${
                              selectedAnalyticsTab === 'trends'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            data-testid="tab-trends"
                          >
                            Trend Analysis
                          </button>
                          <button
                            onClick={() => setSelectedAnalyticsTab('cost-benefit')}
                            className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all ${
                              selectedAnalyticsTab === 'cost-benefit'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            data-testid="tab-cost-benefit"
                          >
                            Cost-Benefit Analysis
                          </button>
                          <button
                            onClick={() => setSelectedAnalyticsTab('life-phases')}
                            className={`px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all ${
                              selectedAnalyticsTab === 'life-phases'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                            data-testid="tab-life-phases"
                          >
                            Life Phase Optimization
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {selectedAnalyticsTab === 'trends' && (
                          <div className="space-y-6">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              See how small daily changes compound over your lifetime. Each hour adjustment shows the total impact over your remaining years.
                            </div>
                            {analyticsData.trendAnalysis.map((item, index) => (
                              <div key={index} className="border rounded-lg p-4 space-y-4">
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
                                  {item.trends.map((trend: any, trendIndex: number) => (
                                    <div 
                                      key={trendIndex} 
                                      className={`p-3 rounded-md border ${
                                        trend.change > 0 
                                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                                          : trend.change < 0
                                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                      }`}
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
                        )}

                        {selectedAnalyticsTab === 'cost-benefit' && (
                          <div className="space-y-6">
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                              Analysis of reallocating 30 minutes daily between activities. Green indicates beneficial trades, red indicates potentially harmful ones.
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {analyticsData.costBenefitAnalysis
                                .sort((a, b) => b.analysis.netImpact.timeValue - a.analysis.netImpact.timeValue)
                                .map((item, index) => (
                                <div 
                                  key={index} 
                                  className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
                                    item.analysis.netImpact.timeValue > 20 
                                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                      : item.analysis.netImpact.timeValue < -20
                                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs font-medium" style={{ color: item.fromColor }}>
                                        -{item.from}
                                      </span>
                                      <span className="text-gray-400">→</span>
                                      <span className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs font-medium" style={{ color: item.toColor }}>
                                        +{item.to}
                                      </span>
                                    </div>
                                    <div className={`text-xs font-bold px-2 py-1 rounded ${
                                      item.analysis.netImpact.confidence === 'high' ? 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200' :
                                      item.analysis.netImpact.confidence === 'medium' ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200' :
                                      'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
                                    }`}>
                                      {item.analysis.netImpact.confidence} confidence
                                    </div>
                                  </div>
                                  <div className="text-sm font-medium mb-2">
                                    Time Value Score: {item.analysis.netImpact.timeValue.toFixed(0)}/100
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    {item.analysis.netImpact.recommendation}
                                  </div>
                                  <div className="text-xs">
                                    <div className="mb-1"><strong>Gain:</strong> {item.analysis.benefit.qualitativeImpact}</div>
                                    <div><strong>Cost:</strong> {item.analysis.opportunityCost.qualitativeImpact}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedAnalyticsTab === 'life-phases' && (
                          <div className="space-y-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                Current Life Phase: {analyticsData.lifePhaseOptimization.currentPhase}
                              </h3>
                              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                                <p>
                                  <strong>Next Phase:</strong> {analyticsData.lifePhaseOptimization.transitionPlanning.nextPhase} 
                                  <span className="ml-2 text-xs">
                                    (in {analyticsData.lifePhaseOptimization.transitionPlanning.timeToTransition.toFixed(0)} years)
                                  </span>
                                </p>
                                <div>
                                  <strong>Preparation Steps:</strong>
                                  <ul className="list-disc list-inside mt-1 space-y-1">
                                    {analyticsData.lifePhaseOptimization.transitionPlanning.preparationSteps.slice(0, 3).map((step: string, index: number) => (
                                      <li key={index} className="text-xs">{step}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {analyticsData.lifePhaseOptimization.recommendations.slice(0, 4).map((phase: any, index: number) => (
                                <div key={index} className="p-4 border rounded-lg space-y-3">
                                  <div>
                                    <h4 className="font-semibold">{phase.phase}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{phase.ageRange}</p>
                                    <p className="text-sm text-primary font-medium">{phase.priority}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium mb-2">Suggested Time Allocation:</p>
                                    <div className="space-y-1">
                                      {phase.suggestedAllocations.slice(0, 3).map((allocation: any, allocIndex: number) => (
                                        <div key={allocIndex} className="flex justify-between text-xs">
                                          <span>{allocation.activity}</span>
                                          <span className="font-medium">{allocation.hours}h</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium mb-1">Key Focus Areas:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {phase.keyFocus.slice(0, 3).map((focus: string, focusIndex: number) => (
                                        <span key={focusIndex} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                                          {focus}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                {(exerciseOptimization || sleepOptimization) && (
                  <div className="mt-8">
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-3">Health Optimization</h3>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <i className="fas fa-info-circle text-blue-600 dark:text-blue-400 mt-0.5"></i>
                          </div>
                          <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-2">Health Disclaimer</p>
                            <p className="mb-2">
                              The health recommendations provided are for informational purposes only and based on general guidelines. 
                              They are not intended as personalized medical advice, diagnosis, or treatment.
                            </p>
                            <p className="text-xs">
                              Always consult with qualified healthcare professionals before making significant changes to your sleep, 
                              exercise, or lifestyle habits, especially if you have existing health conditions or concerns.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Exercise Optimization */}
                    {exerciseOptimization && (
                      <div className={`rounded-lg p-4 border mb-6 ${
                        exerciseOptimization.fitnessLevel === 'Active' || exerciseOptimization.fitnessLevel === 'Highly Active'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : exerciseOptimization.fitnessLevel === 'Sedentary'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <i className={`fas fa-dumbbell ${
                            exerciseOptimization.fitnessLevel === 'Active' || exerciseOptimization.fitnessLevel === 'Highly Active'
                              ? 'text-green-600 dark:text-green-400'
                              : exerciseOptimization.fitnessLevel === 'Sedentary'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}></i>
                          <h4 className={`font-semibold ${
                            exerciseOptimization.fitnessLevel === 'Active' || exerciseOptimization.fitnessLevel === 'Highly Active'
                              ? 'text-green-800 dark:text-green-200'
                              : exerciseOptimization.fitnessLevel === 'Sedentary'
                              ? 'text-red-800 dark:text-red-200'
                              : 'text-yellow-800 dark:text-yellow-200'
                          }`}>
                            Exercise & Fitness Analysis
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Current Activity Level</p>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">{exerciseOptimization.currentWeeklyHours}h</span>
                              <span className="text-sm text-gray-500">per week</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                exerciseOptimization.fitnessLevel === 'Active' || exerciseOptimization.fitnessLevel === 'Highly Active'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                  : exerciseOptimization.fitnessLevel === 'Sedentary'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                              }`}>
                                {exerciseOptimization.fitnessLevel}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              WHO recommends: {exerciseOptimization.recommendedWeeklyHours}h/week minimum
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">Health Impact</p>
                            <p className="text-sm">{exerciseOptimization.healthImpact}</p>
                            {exerciseOptimization.yearsImpact !== '0.0' && (
                              <p className={`text-xs mt-1 font-medium ${
                                parseFloat(exerciseOptimization.yearsImpact) > 0 
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                Lifespan impact: {parseFloat(exerciseOptimization.yearsImpact) > 0 ? '+' : ''}{exerciseOptimization.yearsImpact} years
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">General Recommendations</p>
                          <ul className="space-y-1">
                            {exerciseOptimization.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <i className="fas fa-check-circle text-blue-500 mt-0.5 text-xs"></i>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                            *Start slowly and consult a fitness professional or doctor before beginning any new exercise program.
                          </p>
                        </div>

                        {!exerciseOptimization.isOptimal && parseFloat(exerciseOptimization.potentialGain) > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 mb-4 border border-blue-200 dark:border-blue-700">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                              Optimization Opportunity
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Increasing to {exerciseOptimization.optimizedHours.toFixed(1)} hours daily could add 
                              <span className="font-semibold"> {exerciseOptimization.potentialGain} years</span> to your lifespan!
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          {!exerciseOptimization.isOptimal && (
                            <Button 
                              size="sm"
                              onClick={() => {
                                const exerciseIndex = activities.findIndex(a => 
                                  a.name.toLowerCase().includes('exercise') || 
                                  a.name.toLowerCase().includes('workout') || 
                                  a.name.toLowerCase().includes('fitness') ||
                                  a.name.toLowerCase().includes('gym')
                                );
                                if (exerciseIndex >= 0) {
                                  const updatedActivities = [...activities];
                                  updatedActivities[exerciseIndex].hours = exerciseOptimization.optimizedHours;
                                  form.setValue('activities', updatedActivities, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
                                  form.handleSubmit(visualizeData)();
                                }
                              }}
                            >
                              Apply Optimization
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Sleep Optimization */}
                    {sleepOptimization && (
                      <div className={`rounded-lg p-4 border ${
                        sleepOptimization.quality === 'Optimal' 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : sleepOptimization.quality === 'Severely Insufficient'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                      }`}>
                        <div className="flex items-center gap-2 mb-3">
                          <i className={`fas fa-bed ${
                            sleepOptimization.quality === 'Optimal' 
                              ? 'text-green-600 dark:text-green-400'
                              : sleepOptimization.quality === 'Severely Insufficient'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`}></i>
                          <h4 className={`font-semibold ${
                            sleepOptimization.quality === 'Optimal' 
                              ? 'text-green-800 dark:text-green-200'
                              : sleepOptimization.quality === 'Severely Insufficient'
                              ? 'text-red-800 dark:text-red-200'
                              : 'text-yellow-800 dark:text-yellow-200'
                          }`}>
                            Sleep Health Analysis
                          </h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Current Sleep Pattern</p>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold">{sleepOptimization.currentHours}h</span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                sleepOptimization.quality === 'Optimal' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                  : sleepOptimization.quality === 'Severely Insufficient'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                              }`}>
                                {sleepOptimization.quality}
                              </span>
                            </div>
                            {sleepOptimization.sleepDebt && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Sleep debt: {sleepOptimization.sleepDebt}h per night
                              </p>
                            )}
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">Health Impact</p>
                            <p className="text-sm">{sleepOptimization.healthImpact}</p>
                            {sleepOptimization.yearsImpact !== '0.0' && (
                              <p className={`text-xs mt-1 font-medium ${
                                parseFloat(sleepOptimization.yearsImpact) > 0 
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                Potential lifespan impact: {parseFloat(sleepOptimization.yearsImpact) > 0 ? '+' : ''}{sleepOptimization.yearsImpact} years
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm font-medium mb-2">General Sleep Recommendations</p>
                          <ul className="space-y-1">
                            {sleepOptimization.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <i className="fas fa-check-circle text-blue-500 mt-0.5 text-xs"></i>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                            *If sleep problems persist, consult a healthcare provider or sleep specialist for proper evaluation.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-4">
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
                              scale: 1.5
                            });
                            
                            canvas.toBlob((blob) => {
                              if (!blob) {
                                throw new Error("Failed to create image");
                              }
                              
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.download = 'my-life-visualization.png';
                              link.href = url;
                              link.click();
                              
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

                    {/* Medical Disclaimer Footer */}
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 mt-0.5"></i>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            <p className="font-medium mb-1">Important Medical Disclaimer</p>
                            <p className="mb-2">
                              This tool provides general health information based on established guidelines and should not replace professional medical advice. 
                              Health recommendations are estimates and may not apply to your individual circumstances.
                            </p>
                            <p className="mb-2">
                              Lifespan calculations are statistical projections based on population averages and do not predict individual outcomes. 
                              Many factors including genetics, environment, and access to healthcare significantly impact longevity.
                            </p>
                            <p>
                              Always consult qualified healthcare professionals for personalized medical advice, especially before making significant lifestyle changes 
                              or if you have pre-existing health conditions.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </article>
        )}
      </main>
      
      <footer className="bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-white py-8 mt-12" role="contentinfo" itemScope itemType="https://schema.org/WPFooter">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:justify-between" itemScope itemType="https://schema.org/SiteNavigationElement">
            <div className="mb-8 md:mb-0">
              <h3 className="text-lg font-semibold mb-2">Lifetime Visualizer</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Understand how you spend your most valuable asset: time.</p>
              {/* Hidden SEO-friendly image with descriptive alt text */}
              <div className="hidden">
                <img 
                  src="https://lifetime-visualizer.replit.app/og-image.png"
                  alt="Lifetime Visualizer dashboard showing how time is allocated across different activities over a lifespan"
                  width="1200"
                  height="630"
                  itemProp="image"
                />
              </div>
            </div>
            <div className="flex space-x-6 items-center">
              <a href="mailto:lifetimevisualizer@lifetimeviz.com" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-white">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-4">
            <div className="flex justify-between items-center">
              <BuyMeCoffeeButton 
                username="oncedeved" 
                text="Buy me a coffee"
              />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">© {new Date().getFullYear()} Lifetime Visualizer. All rights reserved.</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  Send feedback to: <a href="mailto:lifetimevisualizer@lifetimeviz.com" className="hover:text-primary">lifetimevisualizer@lifetimeviz.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LifeVisualizer;
