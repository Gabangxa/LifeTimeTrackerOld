import { users, type User, type InsertUser, type UserLifeData, type InsertUserLifeData } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  saveUserLifeData(data: InsertUserLifeData): Promise<UserLifeData>;
  getUserLifeData(id: number): Promise<UserLifeData | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private userLifeData: Map<number, UserLifeData>;
  currentId: number;
  currentLifeDataId: number;

  constructor() {
    this.users = new Map();
    this.userLifeData = new Map();
    this.currentId = 1;
    this.currentLifeDataId = 1;
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
}

export const storage = new MemStorage();
