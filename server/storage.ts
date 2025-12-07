import { users, userLifeData, countryLifeExpectancy, type User, type InsertUser, type UserLifeData, type InsertUserLifeData, type CountryLifeExpectancy, type InsertCountryLifeExpectancy } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveUserLifeData(data: InsertUserLifeData): Promise<UserLifeData>;
  getUserLifeData(id: number): Promise<UserLifeData | undefined>;
  getCachedCountries(): Promise<any[]>;
  cacheCountries(countries: any[]): Promise<void>;
  getCachedLifeExpectancy(countryCode: string): Promise<CountryLifeExpectancy | undefined>;
  cacheLifeExpectancy(data: InsertCountryLifeExpectancy): Promise<CountryLifeExpectancy>;
}

export class DatabaseStorage implements IStorage {
  private countryCache: any[] = [];

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  
  async saveUserLifeData(data: InsertUserLifeData): Promise<UserLifeData> {
    const [savedData] = await db.insert(userLifeData).values(data).returning();
    return savedData;
  }
  
  async getUserLifeData(id: number): Promise<UserLifeData | undefined> {
    const [data] = await db.select().from(userLifeData).where(eq(userLifeData.id, id));
    return data;
  }

  async getCachedCountries(): Promise<any[]> {
    return this.countryCache;
  }

  async cacheCountries(countries: any[]): Promise<void> {
    this.countryCache = countries;
  }

  async getCachedLifeExpectancy(countryCode: string): Promise<CountryLifeExpectancy | undefined> {
    const [data] = await db.select().from(countryLifeExpectancy).where(eq(countryLifeExpectancy.countryCode, countryCode));
    return data;
  }

  async cacheLifeExpectancy(data: InsertCountryLifeExpectancy): Promise<CountryLifeExpectancy> {
    const [cached] = await db.insert(countryLifeExpectancy)
      .values(data)
      .onConflictDoUpdate({
        target: countryLifeExpectancy.countryCode,
        set: { 
          lifeExpectancy: data.lifeExpectancy,
          dataYear: data.dataYear,
          updatedAt: new Date()
        }
      })
      .returning();
    return cached;
  }
}

export const storage = new DatabaseStorage();
