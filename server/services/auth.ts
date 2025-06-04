import { storage } from "../storage";
import type { InsertUser, User } from "@shared/schema";
import bcrypt from "bcrypt";

export class AuthService {
  async register(userData: InsertUser): Promise<User> {
    // Check if user already exists
    const existingUserByUsername = await storage.getUserByUsername(userData.username);
    if (existingUserByUsername) {
      throw new Error("Username already exists");
    }

    const existingUserByEmail = await storage.getUserByEmail(userData.email);
    if (existingUserByEmail) {
      throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    return user;
  }

  async login(username: string, password: string): Promise<User> {
    const user = await storage.getUserByUsername(username);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return storage.getUser(id);
  }
}

export const authService = new AuthService();
