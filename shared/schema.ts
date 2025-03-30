import { pgTable, text, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Country Life Expectancy Model
export const countryLifeExpectancy = pgTable("country_life_expectancy", {
  id: serial("id").primaryKey(),
  countryCode: text("country_code").notNull().unique(),
  countryName: text("country_name").notNull(),
  lifeExpectancy: integer("life_expectancy").notNull(),
  dataYear: integer("data_year").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});

export const insertCountryLifeExpectancySchema = createInsertSchema(countryLifeExpectancy).pick({
  countryCode: true,
  countryName: true,
  lifeExpectancy: true,
  dataYear: true,
  updatedAt: true
});

export type CountryLifeExpectancy = typeof countryLifeExpectancy.$inferSelect;
export type InsertCountryLifeExpectancy = z.infer<typeof insertCountryLifeExpectancySchema>;

// UserLifeData Model - for saving user profile and visualization data
export const userLifeData = pgTable("user_life_data", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  birthdate: date("birthdate").notNull(),
  countryCode: text("country_code").notNull(),
  activities: text("activities").notNull(), // JSON string of activities array
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull()
});

export const insertUserLifeDataSchema = createInsertSchema(userLifeData).pick({
  userId: true,
  birthdate: true,
  countryCode: true,
  activities: true,
  createdAt: true,
  updatedAt: true
});

export type UserLifeData = typeof userLifeData.$inferSelect;
export type InsertUserLifeData = z.infer<typeof insertUserLifeDataSchema>;

// Activity schema for frontend validation
export const activitySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Activity name is required"),
  hours: z.number().min(0, "Hours must be greater than or equal to 0").max(24, "Hours must be less than or equal to 24"),
  icon: z.string().optional(),
  color: z.string().optional()
});

export type Activity = z.infer<typeof activitySchema>;
