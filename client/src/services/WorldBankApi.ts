import { CountryInfo } from '@/types';

// API endpoint for World Bank data
const WORLD_BANK_API_BASE = 'https://api.worldbank.org/v2';
const LIFE_EXPECTANCY_INDICATOR = 'SP.DYN.LE00.IN'; // Life expectancy at birth, total (years)

export async function fetchCountries(): Promise<CountryInfo[]> {
  try {
    const response = await fetch(`${WORLD_BANK_API_BASE}/country?format=json&per_page=300`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }
    
    const data = await response.json();
    
    // World Bank API returns an array where the first element is metadata and the second contains the data
    const countries = data[1].filter((country: any) => 
      // Filter out aggregates and only include countries
      country.region.id !== "NA" && !country.id.match(/^X/)
    ).map((country: any) => ({
      code: country.id,
      name: country.name,
      lifeExpectancy: 0 // Will be populated on demand
    }));
    
    return countries;
  } catch (error) {
    console.error('Error fetching countries:', error);
    // Fallback to API endpoint
    return fetchCountriesFromAPI();
  }
}

export async function fetchLifeExpectancy(countryCode: string): Promise<number> {
  try {
    // Get most recent life expectancy data (limit=1&sort=desc gets the most recent)
    const response = await fetch(
      `${WORLD_BANK_API_BASE}/country/${countryCode}/indicator/${LIFE_EXPECTANCY_INDICATOR}?format=json&per_page=1&MRV=1`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch life expectancy data');
    }
    
    const data = await response.json();
    
    if (data[1] && data[1][0] && data[1][0].value) {
      return data[1][0].value;
    } else {
      throw new Error('No life expectancy data available');
    }
  } catch (error) {
    console.error('Error fetching life expectancy:', error);
    // Fallback to our API endpoint
    return fetchLifeExpectancyFromAPI(countryCode);
  }
}

// Fallback functions that use our backend API
async function fetchCountriesFromAPI(): Promise<CountryInfo[]> {
  const response = await fetch('/api/countries');
  if (!response.ok) {
    throw new Error('Failed to fetch countries from server');
  }
  return response.json();
}

async function fetchLifeExpectancyFromAPI(countryCode: string): Promise<number> {
  const response = await fetch(`/api/life-expectancy/${countryCode}`);
  if (!response.ok) {
    throw new Error('Failed to fetch life expectancy from server');
  }
  const data = await response.json();
  return data.lifeExpectancy;
}
