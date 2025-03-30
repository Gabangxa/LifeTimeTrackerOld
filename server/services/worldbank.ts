import axios from 'axios';
import { CountryLifeExpectancy } from '@shared/schema';
import { storage } from '../storage';

interface WorldBankCountry {
  id: string;
  name: string;
  region: { id: string; value: string };
}

interface WorldBankResponse<T> {
  [0]: { page: number; pages: number; total: number };
  [1]: T[];
}

interface LifeExpectancyData {
  indicator: { id: string; value: string };
  country: { id: string; value: string };
  value: number;
  date: string;
}

// World Bank API endpoints
const WORLD_BANK_API_BASE = 'https://api.worldbank.org/v2';
const LIFE_EXPECTANCY_INDICATOR = 'SP.DYN.LE00.IN'; // Life expectancy at birth, total (years)

/**
 * Fetches all countries from the World Bank API
 */
export async function fetchCountries(): Promise<any[]> {
  try {
    // Try to get cached countries first
    const cache = await storage.getCachedCountries();
    if (cache && cache.length > 0) {
      return cache;
    }

    const response = await axios.get<WorldBankResponse<WorldBankCountry>>(
      `${WORLD_BANK_API_BASE}/country?format=json&per_page=300`
    );
    
    // World Bank API returns an array where the first element contains metadata
    const countries = response.data[1]
      .filter(country => 
        // Filter out aggregates and only include countries
        country.region.id !== 'NA' && !country.id.match(/^X/)
      )
      .map(country => ({
        code: country.id,
        name: country.name,
        lifeExpectancy: 0 // Will be populated on demand
      }));
    
    // Cache the country list
    await storage.cacheCountries(countries);
    
    return countries;
  } catch (error) {
    console.error('Error fetching countries from World Bank API:', error);
    throw new Error('Failed to fetch countries data');
  }
}

/**
 * Fetches life expectancy data for a specific country
 */
export async function fetchLifeExpectancy(countryCode: string): Promise<number> {
  try {
    // Try to get cached life expectancy first
    const cachedData = await storage.getCachedLifeExpectancy(countryCode);
    if (cachedData) {
      return cachedData.lifeExpectancy;
    }

    // Fetch most recent life expectancy data
    const response = await axios.get<WorldBankResponse<LifeExpectancyData>>(
      `${WORLD_BANK_API_BASE}/country/${countryCode}/indicator/${LIFE_EXPECTANCY_INDICATOR}?format=json&per_page=1&MRV=1`
    );
    
    if (response.data[1] && response.data[1][0] && response.data[1][0].value) {
      const lifeExpectancy = response.data[1][0].value;
      const dataYear = parseInt(response.data[1][0].date);
      const countryName = response.data[1][0].country.value;
      
      // Cache the fetched data
      await storage.cacheLifeExpectancy({
        countryCode,
        countryName,
        lifeExpectancy,
        dataYear,
        updatedAt: new Date()
      });
      
      return lifeExpectancy;
    } else {
      // Fallback values if no data available
      const fallbackLifeExpectancy = {
        USA: 78.5,
        GBR: 81.2,
        CAN: 82.3,
        AUS: 83.4,
        DEU: 80.9,
        FRA: 82.5,
        JPN: 84.3,
        CHN: 76.9,
        IND: 69.7,
        BRA: 75.5,
      };
      
      return fallbackLifeExpectancy[countryCode as keyof typeof fallbackLifeExpectancy] || 72.0; // Global average
    }
  } catch (error) {
    console.error(`Error fetching life expectancy for ${countryCode}:`, error);
    throw new Error('Failed to fetch life expectancy data');
  }
}
