import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const m = today.getMonth() - birthdate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthdate.getDate())) {
    age--;
  }
  return age;
}

export function calculateAliveDays(birthdate: Date): number {
  return (Date.now() - birthdate.getTime()) / 86400000;
}

export function calculateActivityYears(
  dailyHours: number,
  aliveDays: number
): number {
  return (dailyHours * aliveDays) / 8760; // 8760 hours in a year
}

export function calculateRemainingYears(
  birthdate: Date,
  lifeExpectancy: number
): number {
  const ageInYears = calculateAge(birthdate);
  return Math.max(0, lifeExpectancy - ageInYears);
}

export function calculateRemainingWeeks(
  birthdate: Date,
  lifeExpectancy: number
): number {
  return Math.max(0, calculateRemainingYears(birthdate, lifeExpectancy) * 52);
}

export function calculateTotalWeeks(lifeExpectancy: number): number {
  return lifeExpectancy * 52;
}

export function calculateLivedWeeks(birthdate: Date): number {
  return Math.floor(calculateAliveDays(birthdate) / 7);
}

export function formatNumber(num: number): string {
  return num.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function getRandomColorHex(): string {
  const colors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#8B5CF6", // purple
    "#F59E0B", // amber
    "#EF4444", // red
    "#EC4899", // pink
    "#14B8A6", // teal
    "#F97316", // orange
    "#06B6D4", // cyan
    "#84CC16", // lime
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function getActivityIcon(activityName: string): string {
  const activityIcons: Record<string, string> = {
    Sleep: "fa-bed",
    Work: "fa-briefcase",
    Commute: "fa-car",
    Exercise: "fa-dumbbell",
    "Social Media": "fa-hashtag",
    "TV/Entertainment": "fa-tv",
    Eating: "fa-utensils",
    "Family Time": "fa-users",
    Cooking: "fa-kitchen-set",
    Shopping: "fa-shopping-cart",
    Hobbies: "fa-paint-brush",
    Reading: "fa-book",
    Gaming: "fa-gamepad",
    Studying: "fa-graduation-cap",
    Cleaning: "fa-broom",
    Meditation: "fa-om",
    "Phone Calls": "fa-phone",
    "Social Activities": "fa-users",
    Travel: "fa-plane",
  };

  const normalizedName = activityName.trim().toLowerCase();
  
  for (const [key, icon] of Object.entries(activityIcons)) {
    if (normalizedName.includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  return "fa-circle"; // Default icon
}

export function generateActivityInsights(
  activityStats: Array<{ name: string; years: number; percentage: number }>,
  age: number,
  lifeExpectancy: number
): Array<{
  text: string;
  activityName: string;
  type: 'balance' | 'pattern' | 'projection' | 'comparison' | 'motivation';
  icon: string;
  priority: number; // 1-10, higher = more important insight
}> {
  const insights: Array<{
    text: string;
    activityName: string;
    type: 'balance' | 'pattern' | 'projection' | 'comparison' | 'motivation';
    icon: string;
    priority: number;
  }> = [];

  // Sort activities by percentage (highest first)
  const sortedActivities = [...activityStats].sort((a, b) => b.percentage - a.percentage);
  
  // Get top activity and second activity
  const topActivity = sortedActivities[0];
  const secondActivity = sortedActivities[1];
  
  // Add balance insights
  if (topActivity && topActivity.percentage > 30) {
    insights.push({
      text: `You spend ${topActivity.percentage.toFixed(1)}% of your life on ${topActivity.name}. Consider if this aligns with your life priorities.`,
      activityName: topActivity.name,
      type: 'balance',
      icon: getActivityIcon(topActivity.name),
      priority: 9
    });
  }
  
  // Add comparison insights between top activities
  if (topActivity && secondActivity) {
    const ratio = topActivity.percentage / secondActivity.percentage;
    if (ratio > 2) {
      insights.push({
        text: `You spend ${ratio.toFixed(1)}x more time on ${topActivity.name} than on ${secondActivity.name}. Is this intentional?`,
        activityName: topActivity.name,
        type: 'comparison',
        icon: getActivityIcon(topActivity.name),
        priority: 8
      });
    }
  }
  
  // Check for sleep patterns
  const sleep = activityStats.find(a => a.name.toLowerCase() === 'sleep');
  if (sleep) {
    if (sleep.percentage < 25) {
      insights.push({
        text: `You spend less than 25% of your time sleeping. Most health experts recommend about 33% (8 hours daily).`,
        activityName: 'Sleep',
        type: 'pattern',
        icon: 'fa-bed',
        priority: 10
      });
    } else if (sleep.percentage > 40) {
      insights.push({
        text: `You spend over 40% of your time sleeping. This is above the average of 33% (8 hours daily).`,
        activityName: 'Sleep',
        type: 'pattern',
        icon: 'fa-bed',
        priority: 7
      });
    }
  }
  
  // Check for work-life balance
  const work = activityStats.find(a => a.name.toLowerCase() === 'work');
  if (work) {
    if (work.percentage > 33) {
      insights.push({
        text: `Work occupies over a third of your life. Consider ways to make your work more fulfilling or find better work-life balance.`,
        activityName: 'Work',
        type: 'balance',
        icon: 'fa-briefcase',
        priority: 8
      });
    }
  }
  
  // Check for exercise
  const exercise = activityStats.find(a => 
    a.name.toLowerCase() === 'exercise' || 
    a.name.toLowerCase().includes('workout') || 
    a.name.toLowerCase().includes('fitness')
  );
  
  if (exercise) {
    if (exercise.percentage < 4) {
      insights.push({
        text: `You spend less than 4% of your time on physical activity. Even small increases could have significant health benefits.`,
        activityName: exercise.name,
        type: 'motivation',
        icon: 'fa-dumbbell',
        priority: 9
      });
    }
  } else {
    insights.push({
      text: `No exercise activity was found in your entries. Consider adding some physical activity to your routine.`,
      activityName: 'Exercise',
      type: 'motivation',
      icon: 'fa-dumbbell',
      priority: 8
    });
  }
  
  // Future projections based on age
  const yearsRemaining = lifeExpectancy - age;
  
  if (yearsRemaining > 0) {
    // Random activity for projection insight
    const randomActivity = activityStats[Math.floor(Math.random() * activityStats.length)];
    const futureYearsOnActivity = (randomActivity.percentage / 100) * yearsRemaining;
    
    insights.push({
      text: `At your current rate, you'll spend about ${futureYearsOnActivity.toFixed(1)} more years on ${randomActivity.name} in your lifetime.`,
      activityName: randomActivity.name,
      type: 'projection',
      icon: getActivityIcon(randomActivity.name),
      priority: 6
    });
  }
  
  // Social media insights
  const socialMedia = activityStats.find(a => 
    a.name.toLowerCase().includes('social media') || 
    a.name.toLowerCase().includes('phone') ||
    a.name.toLowerCase().includes('internet')
  );
  
  if (socialMedia && socialMedia.percentage > 10) {
    insights.push({
      text: `You spend ${socialMedia.percentage.toFixed(1)}% of your life on ${socialMedia.name}. That's ${(socialMedia.years * 365 * 24).toFixed(0)} hours so far.`,
      activityName: socialMedia.name,
      type: 'pattern',
      icon: 'fa-hashtag',
      priority: 7
    });
  }
  
  // Personal development insights
  const personalDevActivities = activityStats.filter(a => 
    a.name.toLowerCase().includes('read') || 
    a.name.toLowerCase().includes('study') ||
    a.name.toLowerCase().includes('learn') ||
    a.name.toLowerCase().includes('education')
  );
  
  const totalPersonalDevPercentage = personalDevActivities.reduce((sum, act) => sum + act.percentage, 0);
  
  if (personalDevActivities.length > 0 && totalPersonalDevPercentage < 5) {
    insights.push({
      text: `You allocate ${totalPersonalDevPercentage.toFixed(1)}% of your time to personal development activities. Small increases here compound over time.`,
      activityName: personalDevActivities[0].name,
      type: 'motivation',
      icon: getActivityIcon(personalDevActivities[0].name),
      priority: 7
    });
  }
  
  // Sort insights by priority (highest first) and take top 5
  return insights.sort((a, b) => b.priority - a.priority).slice(0, 5);
}
