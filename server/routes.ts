import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchCountries, fetchLifeExpectancy } from "./services/worldbank";

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to get all countries
  app.get('/api/countries', async (req, res) => {
    try {
      const countries = await fetchCountries();
      res.json(countries);
    } catch (error: any) {
      res.status(500).json({ 
        message: `Failed to fetch countries: ${error.message}` 
      });
    }
  });

  // API route to get life expectancy by country code
  app.get('/api/life-expectancy/:countryCode', async (req, res) => {
    try {
      const { countryCode } = req.params;
      const lifeExpectancy = await fetchLifeExpectancy(countryCode);
      res.json({ countryCode, lifeExpectancy });
    } catch (error: any) {
      res.status(500).json({ 
        message: `Failed to fetch life expectancy data: ${error.message}` 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
