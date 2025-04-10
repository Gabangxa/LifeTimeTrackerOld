import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fetchCountries, fetchLifeExpectancy } from "./services/worldbank";
import { insertUserLifeDataSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve robots.txt
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /

Sitemap: https://lifetime-visualizer.replit.app/sitemap.xml`);
  });

  // Serve sitemap.xml
  app.get('/sitemap.xml', (req, res) => {
    res.type('application/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://lifetime-visualizer.replit.app/</loc>
    <lastmod>2025-04-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  });
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

  // API route to save user life data
  app.post('/api/life-data', async (req: Request, res: Response) => {
    try {
      // Debug the incoming data
      console.log('Received data for saving:', JSON.stringify(req.body, null, 2));
      console.log('Type of createdAt:', typeof req.body.createdAt);
      console.log('Type of updatedAt:', typeof req.body.updatedAt);
      
      // Convert string timestamps to Date objects if needed
      if (typeof req.body.createdAt === 'string') {
        req.body.createdAt = new Date(req.body.createdAt);
      }
      
      if (typeof req.body.updatedAt === 'string') {
        req.body.updatedAt = new Date(req.body.updatedAt);
      }
      
      // Validate request body
      const validationResult = insertUserLifeDataSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        console.log('Validation error:', validationResult.error.format());
        return res.status(400).json({
          message: 'Invalid data provided',
          errors: validationResult.error.format()
        });
      }
      
      // Save the data
      const savedData = await storage.saveUserLifeData(validationResult.data);
      
      res.status(201).json({
        message: 'Life data saved successfully',
        data: savedData
      });
    } catch (error: any) {
      console.error('Error saving life data:', error);
      res.status(500).json({
        message: `Failed to save life data: ${error.message}`
      });
    }
  });

  // API route to get user life data by ID
  app.get('/api/life-data/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          message: 'Invalid ID provided'
        });
      }
      
      const lifeData = await storage.getUserLifeData(id);
      
      if (!lifeData) {
        return res.status(404).json({
          message: 'Life data not found'
        });
      }
      
      res.json(lifeData);
    } catch (error: any) {
      res.status(500).json({
        message: `Failed to fetch life data: ${error.message}`
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
