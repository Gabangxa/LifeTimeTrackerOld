import { useMemo } from 'react';
import { ActivityData } from '@/types';
import { formatNumber } from '@/lib/utils';

// Types for trend analysis
export interface TrendAnalysisResult {
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
}

// Types for cost-benefit analysis
export interface CostBenefitResult {
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
}

// Types for life phase optimization
export interface PhaseRecommendation {
  phase: string;
  ageRange: string;
  priority: string;
  suggestedAllocations: { activity: string; hours: number; reason: string }[];
  keyFocus: string[];
}

export interface TransitionPlanning {
  nextPhase: string;
  timeToTransition: number;
  preparationSteps: string[];
}

export interface LifePhaseResult {
  currentPhase: string;
  recommendations: PhaseRecommendation[];
  transitionPlanning: TransitionPlanning;
}

// Types for hook input/output
export interface UseLifeProjectionsInput {
  activities: ActivityData[];
  currentAge: number;
  lifeExpectancy: number;
}

export interface UseLifeProjectionsOutput {
  calculateTrendForActivity: (activity: ActivityData, changeInHours: number, ageRange: { start: number; end: number }) => TrendAnalysisResult;
  calculateCostBenefit: (fromActivity: ActivityData, toActivity: ActivityData, hoursToReallocate: number) => CostBenefitResult;
  lifePhaseOptimization: LifePhaseResult;
  generateComparisons: (activityName: string, years: number) => Array<{ icon: string; text: string }>;
  determineLifePhase: (age: number) => string;
}

// Activity comparisons - focused on meaningful, data-driven insights
const ACTIVITY_COMPARISONS: Record<string, Array<{ icon: string; text: (years: number) => string }>> = {
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

// Generic comparison generators for all activities
const GENERIC_COMPARISONS: Array<{ icon: string; text: (years: number, activity: string) => string }> = [
  {
    icon: 'fa-clock', 
    text: (years, activity) => `${formatNumber(years * 365 * 24)} total hours spent on ${activity.toLowerCase()}`
  },
  {
    icon: 'fa-calendar-days', 
    text: (years, activity) => `${formatNumber(years * 365)} days dedicated to this activity`
  }
];

// Pure helper functions (exported for testing)

export const calculateCompoundingFactors = (
  activityLower: string,
  changeInHours: number,
  currentAge: number,
  yearsInPeriod: number,
  currentActivityHours: number
): { healthMultiplier: number; skillMultiplier: number; totalBenefit: number } => {
  let healthMultiplier = 1.0;
  let skillMultiplier = 1.0;
  
  const isPositiveChange = changeInHours > 0;
  const ageFactor = Math.max(0.5, 1 - (currentAge - 25) / 100);
  const timeFactor = Math.min(2.0, 1 + yearsInPeriod / 20);
  
  if (activityLower.includes('exercise') || activityLower.includes('fitness') || activityLower.includes('workout') || activityLower.includes('training')) {
    const adjustedHoursPerDay = Math.max(0, currentActivityHours + changeInHours);
    const adjustedHoursPerWeek = adjustedHoursPerDay * 7;
    const minutesPerWeek = adjustedHoursPerWeek * 60;
    
    const isStrength = activityLower.includes('strength') || activityLower.includes('weight') || activityLower.includes('resistance');
    const isAerobic = activityLower.includes('cardio') || activityLower.includes('running') || activityLower.includes('cycling') || activityLower.includes('aerobic');
    
    if (isPositiveChange) {
      if (minutesPerWeek >= 150 && minutesPerWeek <= 300) {
        healthMultiplier = 1 + (0.4 * ageFactor * timeFactor * Math.abs(changeInHours));
      } else if (minutesPerWeek < 150) {
        healthMultiplier = 1 + (0.35 * ageFactor * timeFactor * Math.abs(changeInHours));
      } else if (minutesPerWeek <= 600) {
        healthMultiplier = 1 + (0.3 * ageFactor * timeFactor * Math.abs(changeInHours));
      } else {
        healthMultiplier = 1 + (0.15 * ageFactor * Math.abs(changeInHours));
      }
      
      if (isStrength) {
        healthMultiplier *= 1.15;
        skillMultiplier = 1 + (0.1 * Math.abs(changeInHours));
      } else if (isAerobic) {
        healthMultiplier *= 1.2;
      } else {
        healthMultiplier *= 1.25;
      }
    } else {
      const detrimentFactor = 1 + (yearsInPeriod / 10);
      healthMultiplier = Math.max(0.5, 1 + (0.5 * changeInHours * detrimentFactor));
      
      if (currentAge > 40) {
        healthMultiplier *= 0.85;
      }
    }
  } else if (activityLower.includes('learning') || activityLower.includes('study') || activityLower.includes('reading') || activityLower.includes('education')) {
    if (isPositiveChange) {
      const knowledgeCompounding = currentAge < 30 ? 1.4 : currentAge < 50 ? 1.2 : 1.1;
      skillMultiplier = 1 + (0.3 * ageFactor * timeFactor * Math.abs(changeInHours) * knowledgeCompounding);
      healthMultiplier = 1 + (0.05 * Math.abs(changeInHours));
    } else {
      skillMultiplier = Math.max(0.7, 1 + (0.2 * changeInHours));
    }
  } else if (activityLower.includes('work') || activityLower.includes('career') || activityLower.includes('job')) {
    if (isPositiveChange) {
      if (changeInHours <= 1) {
        skillMultiplier = 1 + (0.15 * ageFactor * Math.abs(changeInHours));
        healthMultiplier = 1 - (0.02 * Math.abs(changeInHours));
      } else if (changeInHours <= 2) {
        skillMultiplier = 1 + (0.1 * ageFactor * Math.abs(changeInHours));
        healthMultiplier = 1 - (0.08 * Math.abs(changeInHours));
      } else {
        skillMultiplier = 1 + (0.05 * Math.abs(changeInHours));
        healthMultiplier = 1 - (0.15 * Math.abs(changeInHours));
      }
    } else {
      skillMultiplier = Math.max(0.85, 1 + (0.1 * changeInHours));
      healthMultiplier = 1 + (0.05 * Math.abs(changeInHours));
    }
  } else if (activityLower.includes('social') || activityLower.includes('family') || activityLower.includes('friends') || activityLower.includes('relationship')) {
    if (isPositiveChange) {
      const relationshipValue = currentAge > 40 ? 1.3 : 1.1;
      healthMultiplier = 1 + (0.15 * Math.abs(changeInHours) * relationshipValue);
      skillMultiplier = 1 + (0.1 * Math.abs(changeInHours));
    } else {
      healthMultiplier = Math.max(0.8, 1 + (0.2 * changeInHours));
    }
  } else if (activityLower.includes('sleep') || activityLower.includes('rest')) {
    const adjustedSleepHours = currentActivityHours + changeInHours;
    
    if (isPositiveChange) {
      if (adjustedSleepHours >= 7 && adjustedSleepHours <= 9) {
        healthMultiplier = 1 + (0.3 * Math.abs(changeInHours));
        skillMultiplier = 1 + (0.15 * Math.abs(changeInHours));
      } else if (adjustedSleepHours > 9) {
        healthMultiplier = 1 + (0.1 * Math.abs(changeInHours));
      } else {
        healthMultiplier = 1 + (0.35 * Math.abs(changeInHours));
        skillMultiplier = 1 + (0.2 * Math.abs(changeInHours));
      }
    } else {
      const recoveryPenalty = Math.abs(changeInHours) * 4;
      const compoundingDebt = 1 + (recoveryPenalty / 30);
      
      healthMultiplier = Math.max(0.5, 1 + (0.4 * changeInHours * compoundingDebt));
      
      if (currentAge < 40) {
        healthMultiplier *= 0.9;
      }
      
      skillMultiplier = Math.max(0.7, 1 + (0.25 * changeInHours));
    }
  }
  
  const totalBenefit = Math.max(0.5, Math.min(2.5, healthMultiplier * skillMultiplier));
  
  return { healthMultiplier, skillMultiplier, totalBenefit };
};

export const generateTrendRecommendations = (
  activityName: string,
  changeInHours: number,
  compoundEffect: number,
  compoundingFactors: { healthMultiplier: number; skillMultiplier: number; totalBenefit: number },
  currentActivityHours: number
): string[] => {
  const recommendations: string[] = [];
  const isPositiveChange = changeInHours > 0;
  const activityLower = activityName.toLowerCase();
  
  if (activityLower.includes('exercise') || activityLower.includes('fitness') || activityLower.includes('workout') || activityLower.includes('training')) {
    const adjustedHoursPerDay = Math.max(0, currentActivityHours + changeInHours);
    const adjustedHoursPerWeek = adjustedHoursPerDay * 7;
    const minutesPerWeek = adjustedHoursPerWeek * 60;
    const isStrength = activityLower.includes('strength') || activityLower.includes('weight') || activityLower.includes('resistance');
    const isAerobic = activityLower.includes('cardio') || activityLower.includes('running') || activityLower.includes('cycling') || activityLower.includes('aerobic');
    
    if (isPositiveChange) {
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
      
      if (isStrength) {
        const strengthTips = [
          "Strength training delivers 10-17% all-cause mortality reduction and 30% CVD reduction for women",
          "Just 90 min/week correlates with ~4 years biological age reduction (2024 study)",
          "Best results: 2-3 sessions weekly, 30-60 min total, hitting major muscle groups",
          "Resistance training preserves muscle mass and bone density - critical as we age",
          "Building strength now prevents frailty and maintains independence later in life"
        ];
        const selectedStrengthTips = strengthTips.sort(() => 0.5 - Math.random()).slice(0, 2);
        selectedStrengthTips.forEach(tip => recommendations.push(tip));
      } else if (isAerobic) {
        const aerobicTips = [
          "Every 1 MET fitness increase = 11-17% lower death risk - small gains matter",
          "Cardio strengthens your heart, lowers blood pressure, and sharpens cognitive function",
          "Aim for 3-4 sessions weekly at moderate-vigorous intensity for optimal results",
          "Aerobic fitness is one of the strongest predictors of longevity",
          "Your cardiovascular system adapts quickly - improvements visible within weeks"
        ];
        const selectedAerobicTips = aerobicTips.sort(() => 0.5 - Math.random()).slice(0, 2);
        selectedAerobicTips.forEach(tip => recommendations.push(tip));
      } else {
        const combinedTips = [
          "Combining aerobic + strength training delivers 40% mortality reduction (20-year ATTICA study 2025)",
          "Mixing cardio and resistance work creates synergistic health benefits",
          "The most comprehensive fitness gains come from varied exercise types",
          "Diversifying your workouts prevents plateaus and reduces injury risk"
        ];
        const selectedCombinedTips = combinedTips.sort(() => 0.5 - Math.random()).slice(0, 2);
        selectedCombinedTips.forEach(tip => recommendations.push(tip));
      }
      
      const consistencyTips = [
        "Consistency matters: Regular moderate activity often beats sporadic intense sessions",
        "Building the habit is more important than perfecting each workout",
        "Show up regularly - your future self will thank you"
      ];
      recommendations.push(consistencyTips[Math.floor(Math.random() * consistencyTips.length)]);
      
    } else {
      const reductionMinutes = Math.abs(changeInHours) * 7 * 60;
      const reductionWarnings = [
        "⚠️ Reducing exercise elevates health risks - sedentary behavior is a leading mortality factor",
        "⚠️ Cutting back on movement increases cardiovascular, metabolic, and cognitive risks",
        "⚠️ Less activity means higher health risks - the sedentary lifestyle toll is well-documented"
      ];
      recommendations.push(reductionWarnings[Math.floor(Math.random() * reductionWarnings.length)]);
      recommendations.push(`After this change: ${minutesPerWeek.toFixed(0)} min/week (down by ${reductionMinutes.toFixed(0)} min/week)`);
      if (minutesPerWeek < 150) {
        recommendations.push(`⚠️ This drops below WHO's 150 min/week minimum - significant impact on cardiovascular, metabolic, and cognitive health`);
      } else {
        recommendations.push("Above WHO minimum but still losing protective benefits from reduced activity");
      }
      const preservationTips = [
        "Even 15-20 min/day preserves meaningful health benefits if time is limited",
        "Brief daily movement maintains baseline health better than sporadic longer sessions",
        "Short, consistent activity beats nothing - every minute counts"
      ];
      recommendations.push(preservationTips[Math.floor(Math.random() * preservationTips.length)]);
      recommendations.push("Low-intensity options like walking or gentle stretching work if you're time-constrained");
    }
  } else if (activityLower.includes('learning') || activityLower.includes('study') || activityLower.includes('reading')) {
    if (isPositiveChange) {
      const learningTips = [
        "Knowledge compounds exponentially - what you learn today becomes the foundation for tomorrow's insights",
        "Each skill you master opens doors to entirely new fields and opportunities",
        "Building strong fundamentals now pays dividends across your entire lifetime",
        "The brain's neuroplasticity means learning literally reshapes your cognitive abilities",
        "Deep work on challenging material creates lasting neural pathways"
      ];
      const selectedTips = learningTips.sort(() => 0.5 - Math.random()).slice(0, 2);
      selectedTips.forEach(tip => recommendations.push(tip));
      recommendations.push("Consider focusing on skills that complement each other for multiplied impact");
    } else {
      recommendations.push("Even brief daily learning sessions maintain cognitive sharpness and adaptability");
      recommendations.push("Consider audiobooks or podcasts to preserve learning during other activities");
    }
  } else if (activityLower.includes('work') || activityLower.includes('career')) {
    if (changeInHours > 1) {
      const workWarnings = [
        "Beyond a certain threshold, extra work hours yield diminishing returns on productivity and creativity",
        "Research shows burnout compounds over time - recovery gets harder, not easier",
        "Consider whether this time investment truly advances your long-term career trajectory",
        "Peak performance requires rest and recovery - overwork can harm more than help"
      ];
      const selectedWarnings = workWarnings.sort(() => 0.5 - Math.random()).slice(0, 2);
      selectedWarnings.forEach(warning => recommendations.push(warning));
    } else if (isPositiveChange && changeInHours <= 1) {
      const careerTips = [
        "Strategic focus on high-leverage activities can transform your career trajectory",
        "This extra time could compound into expertise, reputation, and advancement opportunities",
        "Consider directing this time toward skill-building rather than busywork",
        "Quality beats quantity - make sure this additional time is truly productive"
      ];
      const selectedTips = careerTips.sort(() => 0.5 - Math.random()).slice(0, 2);
      selectedTips.forEach(tip => recommendations.push(tip));
    } else {
      recommendations.push("Reducing work hours can improve work-life balance and prevent burnout");
      recommendations.push("Make sure remaining work time is focused on high-impact activities");
    }
  } else if (activityLower.includes('social') || activityLower.includes('family') || activityLower.includes('relationship')) {
    if (isPositiveChange) {
      const socialBenefits = [
        "Harvard's 80-year study found relationships are the #1 predictor of happiness and longevity",
        "Quality time with loved ones compounds emotionally - memories and bonds strengthen over time",
        "Social connections act as a buffer against stress, anxiety, and physical illness",
        "The value of strong relationships often becomes clearer as we age",
        "Investing in relationships now creates a support network for life's challenges"
      ];
      const selectedBenefits = socialBenefits.sort(() => 0.5 - Math.random()).slice(0, 2);
      selectedBenefits.forEach(benefit => recommendations.push(benefit));
    } else {
      recommendations.push("Even small amounts of quality time can maintain important relationships");
      recommendations.push("Consider being more present during interactions rather than just spending more time");
    }
  } else if (activityLower.includes('sleep')) {
    if (isPositiveChange) {
      const sleepBenefits = [
        "Quality sleep (7-9h) enhances cognitive performance, cardiovascular health, and overall longevity",
        "Research shows 7 hours is optimal for cognitive function in middle-aged and older adults (Nature Aging, 2022)",
        "Consistent sleep schedules predict mortality better than duration alone (SLEEP, 2024)",
        "Adequate rest strengthens immune function, metabolic health, and emotional stability",
        "Your brain consolidates memories and clears toxins during deep sleep phases",
        "Quality sleep improves decision-making, creativity, and problem-solving abilities"
      ];
      const selectedBenefits = sleepBenefits.sort(() => 0.5 - Math.random()).slice(0, 3);
      selectedBenefits.forEach(benefit => recommendations.push(benefit));
    } else {
      const sleepWarnings = [
        "Sleep debt has a brutal 4:1 recovery ratio - losing 1 hour takes 4 days to fully recover (Scientific Reports, 2016)",
        "Chronic sleep restriction creates cognitive impairment similar to total sleep deprivation",
        "Weekend catch-up sleep doesn't undo the metabolic and cognitive damage from weekday deficits",
        "Insufficient sleep elevates risks for cardiovascular disease, obesity, diabetes, and cognitive decline",
        "Your body doesn't adapt to sleep deprivation - the damage accumulates silently"
      ];
      const selectedWarnings = sleepWarnings.sort(() => 0.5 - Math.random()).slice(0, 3);
      selectedWarnings.forEach(warning => recommendations.push(warning));
      if (Math.abs(changeInHours) >= 2) {
        recommendations.push("⚠️ Severe sleep restriction (<6h) dramatically increases mortality risk, especially under age 65");
      }
    }
  }
  
  return recommendations;
};

export const calculateTrendAnalysis = (
  currentActivity: ActivityData,
  changeInHours: number,
  ageRange: { start: number; end: number },
  currentAge: number
): TrendAnalysisResult => {
  // Guard: Normalize age range and calculate safe horizon
  const safeStart = Math.max(ageRange.start, currentAge);
  const safeEnd = Math.max(safeStart, ageRange.end);
  const horizonYears = safeEnd - safeStart;
  
  // Bail out with neutral defaults if horizon is invalid
  if (horizonYears <= 0 || !Number.isFinite(horizonYears)) {
    return {
      originalYears: 0,
      modifiedYears: 0,
      compoundEffect: 0,
      yearlyImpact: 0,
      recommendations: [],
      compoundingFactors: { healthMultiplier: 1, skillMultiplier: 1, totalBenefit: 1 }
    };
  }
  
  const activityLower = currentActivity.name.toLowerCase();
  
  const originalHoursPerYear = currentActivity.hours * 365;
  const modifiedHoursPerYear = Math.max(0, currentActivity.hours + changeInHours) * 365;
  
  const baseOriginalYears = (originalHoursPerYear * horizonYears) / (365 * 24);
  const baseModifiedYears = (modifiedHoursPerYear * horizonYears) / (365 * 24);
  
  const compoundingFactors = calculateCompoundingFactors(activityLower, changeInHours, currentAge, horizonYears, currentActivity.hours);
  
  const originalYears = baseOriginalYears;
  const modifiedYears = baseModifiedYears * compoundingFactors.totalBenefit;
  
  const compoundEffect = modifiedYears - originalYears;
  const yearlyImpact = horizonYears > 0 ? compoundEffect / horizonYears : 0;
  
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

export const getActivityQualitativeImpact = (activityName: string, isGaining: boolean): string => {
  const activityLower = activityName.toLowerCase();
  
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

export const getActivityValueScore = (activityName: string, age: number): number => {
  const activityLower = activityName.toLowerCase();
  
  const middleAgeMultiplier = age >= 30 && age < 60 ? 1.2 : 1.0;
  const youthMultiplier = age < 30 ? 1.2 : age < 50 ? 1.0 : 0.8;
  
  if (activityLower.includes('exercise')) return 0.9 * (age > 40 ? 1.3 : 1.0);
  if (activityLower.includes('career') || activityLower.includes('work')) return 0.8 * middleAgeMultiplier;
  if (activityLower.includes('learning') || activityLower.includes('study')) return 0.85 * youthMultiplier;
  if (activityLower.includes('family') || activityLower.includes('social')) return 0.75 * (age > 30 ? 1.2 : 1.0);
  if (activityLower.includes('leisure') || activityLower.includes('entertainment')) return 0.4;
  if (activityLower.includes('sleep')) return 0.95;
  
  return 0.5;
};

export const calculateTimeValue = (fromActivity: string, toActivity: string, hours: number, age: number): number => {
  const fromScore = getActivityValueScore(fromActivity, age);
  const toScore = getActivityValueScore(toActivity, age);
  
  const netScore = (toScore - fromScore) * (hours / 24) * 100;
  return Math.max(-100, Math.min(100, netScore));
};

export const generateReallocationRecommendation = (fromActivity: string, toActivity: string, timeValue: number, age: number): string => {
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

export const calculateConfidenceLevel = (fromActivity: string, toActivity: string, age: number): 'high' | 'medium' | 'low' => {
  const wellStudiedActivities = ['exercise', 'sleep', 'work', 'learning'];
  const fromStudied = wellStudiedActivities.some(activity => fromActivity.toLowerCase().includes(activity));
  const toStudied = wellStudiedActivities.some(activity => toActivity.toLowerCase().includes(activity));
  
  if (fromStudied && toStudied) return 'high';
  if (fromStudied || toStudied) return 'medium';
  return 'low';
};

export const calculatePotentialROI = (activityName: string, hours: number, age: number): string => {
  const activityLower = activityName.toLowerCase();
  
  if (activityLower.includes('exercise')) {
    const healthBenefit = hours * 365 * 3;
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

export const calculateCostBenefitAnalysis = (
  fromActivity: ActivityData,
  toActivity: ActivityData,
  hoursToReallocate: number,
  userAge: number,
  lifeExpectancy: number
): CostBenefitResult => {
  // Guard: Clamp remaining years to prevent negative horizons
  const remainingYears = Math.max(0, lifeExpectancy - userAge);
  
  // Bail out with neutral defaults if no valid horizon or hours
  if (remainingYears === 0 || hoursToReallocate <= 0) {
    return {
      opportunityCost: {
        activity: fromActivity.name,
        yearsLost: 0,
        qualitativeImpact: 'No remaining horizon to evaluate'
      },
      benefit: {
        activity: toActivity.name,
        yearsGained: 0,
        qualitativeImpact: 'No remaining horizon to evaluate',
        potentialROI: 'N/A'
      },
      netImpact: {
        timeValue: 0,
        recommendation: 'Neutral: No remaining horizon to evaluate.',
        confidence: 'low' as const
      }
    };
  }
  
  const yearsLost = (hoursToReallocate * 365 * remainingYears) / (365 * 24);
  const yearsGained = yearsLost;
  
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

export const determineLifePhase = (age: number): string => {
  if (age < 25) return 'Foundation Building';
  if (age < 35) return 'Career Establishment';
  if (age < 45) return 'Growth & Family';
  if (age < 55) return 'Peak Performance';
  if (age < 65) return 'Transition Planning';
  return 'Legacy & Fulfillment';
};

export const generatePhaseRecommendations = (currentAge: number, lifeExpectancy: number): PhaseRecommendation[] => {
  return [
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
};

export const calculateTransitionPlanning = (currentAge: number, lifeExpectancy: number): TransitionPlanning => {
  // Guard: Use safe expectancy (at least equal to current age)
  const safeExpectancy = Math.max(currentAge, lifeExpectancy);
  
  let nextPhase = '';
  let timeToTransition = 0;
  let preparationSteps: string[] = [];
  
  if (currentAge < 25) {
    nextPhase = 'Career Establishment';
    timeToTransition = Math.max(0, 25 - currentAge);
    preparationSteps = [
      'Complete education and certifications',
      'Build professional network',
      'Develop core skills in chosen field',
      'Gain internship or entry-level experience'
    ];
  } else if (currentAge < 35) {
    nextPhase = 'Growth & Family';
    timeToTransition = Math.max(0, 35 - currentAge);
    preparationSteps = [
      'Achieve financial stability',
      'Develop leadership skills',
      'Consider family planning',
      'Build emergency fund and investments'
    ];
  } else if (currentAge < 45) {
    nextPhase = 'Peak Performance';
    timeToTransition = Math.max(0, 45 - currentAge);
    preparationSteps = [
      'Develop expertise and specialization',
      'Build wealth and assets',
      'Strengthen family relationships',
      'Focus on health and fitness'
    ];
  } else if (currentAge < 55) {
    nextPhase = 'Transition Planning';
    timeToTransition = Math.max(0, 55 - currentAge);
    preparationSteps = [
      'Maximize earning potential',
      'Develop leadership and mentoring skills',
      'Diversify investments',
      'Maintain health and energy'
    ];
  } else if (currentAge < 65) {
    nextPhase = 'Legacy & Fulfillment';
    timeToTransition = Math.max(0, 65 - currentAge);
    preparationSteps = [
      'Plan retirement finances',
      'Develop post-career interests',
      'Focus on health optimization',
      'Strengthen family and social connections'
    ];
  } else {
    nextPhase = 'Continued Fulfillment';
    timeToTransition = Math.max(0, safeExpectancy - currentAge);
    preparationSteps = [
      'Maintain physical and mental health',
      'Stay engaged with community',
      'Share knowledge and experience',
      'Focus on meaningful relationships'
    ];
  }
  
  return { nextPhase, timeToTransition, preparationSteps };
};

export const calculateLifePhaseOptimization = (
  currentAge: number,
  activities: ActivityData[],
  lifeExpectancy: number
): LifePhaseResult => {
  // Guard: Use safe expectancy (at least equal to current age)
  const safeExpectancy = Math.max(currentAge, lifeExpectancy);
  
  const currentPhase = determineLifePhase(currentAge);
  const recommendations = generatePhaseRecommendations(currentAge, safeExpectancy);
  const transitionPlanning = calculateTransitionPlanning(currentAge, safeExpectancy);
  
  return { currentPhase, recommendations, transitionPlanning };
};

export const generateDynamicComparisons = (activityName: string, years: number): Array<{ icon: string; text: string }> => {
  if (ACTIVITY_COMPARISONS[activityName]) {
    return ACTIVITY_COMPARISONS[activityName].map(comp => ({
      icon: comp.icon,
      text: comp.text(years)
    }));
  }
  
  const randomIndices = Array.from(Array(GENERIC_COMPARISONS.length).keys())
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  
  return randomIndices.map(index => ({
    icon: GENERIC_COMPARISONS[index].icon,
    text: GENERIC_COMPARISONS[index].text(years, activityName)
  }));
};

// Main hook
export function useLifeProjections({ activities, currentAge, lifeExpectancy }: UseLifeProjectionsInput): UseLifeProjectionsOutput {
  const lifePhaseOptimization = useMemo(() => {
    return calculateLifePhaseOptimization(currentAge, activities, lifeExpectancy);
  }, [currentAge, activities, lifeExpectancy]);

  const calculateTrendForActivity = useMemo(() => {
    return (activity: ActivityData, changeInHours: number, ageRange: { start: number; end: number }) => {
      return calculateTrendAnalysis(activity, changeInHours, ageRange, currentAge);
    };
  }, [currentAge]);

  const calculateCostBenefit = useMemo(() => {
    return (fromActivity: ActivityData, toActivity: ActivityData, hoursToReallocate: number) => {
      return calculateCostBenefitAnalysis(fromActivity, toActivity, hoursToReallocate, currentAge, lifeExpectancy);
    };
  }, [currentAge, lifeExpectancy]);

  const generateComparisons = useMemo(() => {
    return (activityName: string, years: number) => {
      return generateDynamicComparisons(activityName, years);
    };
  }, []);

  return {
    calculateTrendForActivity,
    calculateCostBenefit,
    lifePhaseOptimization,
    generateComparisons,
    determineLifePhase
  };
}
