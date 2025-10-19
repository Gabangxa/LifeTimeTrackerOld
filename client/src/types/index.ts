export interface CountryInfo {
  code: string;
  name: string;
  lifeExpectancy: number;
}

export interface ActivityComparisonData {
  id: string;
  type: string;
  description: string;
  icon: string;
}

export interface ActivityData {
  id: string;
  name: string;
  hours: number;
  daysPerWeek: number;
  icon: string;
  color: string;
}

export interface ActivityStat {
  name: string;
  years: number;
  percentage: number;
  color: string;
  icon: string;
  comparisons: {
    icon: string;
    text: string;
  }[];
}

export interface VisualizeResult {
  age: number;
  lifeExpectancy: number;
  activityStats: ActivityStat[];
  weeksLived: number;
  weeksTotal: number;
  weeksRemaining: number;
  futureProjections: {
    activity: string;
    yearsSoFar: number;
    yearsRemaining: number;
  }[];
}
