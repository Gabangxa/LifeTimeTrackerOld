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
