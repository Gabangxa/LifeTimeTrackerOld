import { users, type User, type InsertUser, type UserLifeData, type InsertUserLifeData, type CountryLifeExpectancy, type InsertCountryLifeExpectancy } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userLifeData: Map<number, UserLifeData>;
  private countries: any[];
  private lifeExpectancyCache: Map<string, CountryLifeExpectancy>;
  currentId: number;
  currentLifeDataId: number;
  currentLifeExpectancyId: number;

  constructor() {
    this.users = new Map();
    this.userLifeData = new Map();
    this.countries = [];
    this.lifeExpectancyCache = new Map();
    this.currentId = 1;
    this.currentLifeDataId = 1;
    this.currentLifeExpectancyId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async saveUserLifeData(data: InsertUserLifeData): Promise<UserLifeData> {
    const id = this.currentLifeDataId++;
    
    // Create a properly typed UserLifeData object
    const lifeData: UserLifeData = {
      id,
      userId: data.userId ?? null,
      birthdate: data.birthdate,
      countryCode: data.countryCode,
      activities: data.activities,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
    
    this.userLifeData.set(id, lifeData);
    return lifeData;
  }
  
  async getUserLifeData(id: number): Promise<UserLifeData | undefined> {
    return this.userLifeData.get(id);
  }

  async getCachedCountries(): Promise<any[]> {
    return this.countries;
  }

  async cacheCountries(countries: any[]): Promise<void> {
    this.countries = countries;
  }

  async getCachedLifeExpectancy(countryCode: string): Promise<CountryLifeExpectancy | undefined> {
    return this.lifeExpectancyCache.get(countryCode);
  }

  async cacheLifeExpectancy(data: InsertCountryLifeExpectancy): Promise<CountryLifeExpectancy> {
    const id = this.currentLifeExpectancyId++;
    const lifeExpectancy: CountryLifeExpectancy = {
      id,
      ...data
    };
    this.lifeExpectancyCache.set(data.countryCode, lifeExpectancy);
    return lifeExpectancy;
  }
}

export const storage = new MemStorage();
