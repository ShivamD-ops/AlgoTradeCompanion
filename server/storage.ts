import { users, strategies, backtests, trades, positions, portfolioHistory, type User, type InsertUser, type Strategy, type InsertStrategy, type Backtest, type InsertBacktest, type Trade, type InsertTrade, type Position, type InsertPosition, type PortfolioHistory, type InsertPortfolioHistory } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Strategy operations
  getStrategy(id: number): Promise<Strategy | undefined>;
  getStrategiesByUser(userId: number): Promise<Strategy[]>;
  createStrategy(strategy: InsertStrategy): Promise<Strategy>;
  updateStrategy(id: number, updates: Partial<InsertStrategy>): Promise<Strategy | undefined>;
  deleteStrategy(id: number): Promise<boolean>;

  // Backtest operations
  getBacktest(id: number): Promise<Backtest | undefined>;
  getBacktestsByUser(userId: number): Promise<Backtest[]>;
  getBacktestsByStrategy(strategyId: number): Promise<Backtest[]>;
  createBacktest(backtest: InsertBacktest): Promise<Backtest>;

  // Trade operations
  getTrade(id: number): Promise<Trade | undefined>;
  getTradesByUser(userId: number): Promise<Trade[]>;
  getTradesByStrategy(strategyId: number): Promise<Trade[]>;
  createTrade(trade: InsertTrade): Promise<Trade>;

  // Position operations
  getPosition(id: number): Promise<Position | undefined>;
  getPositionsByUser(userId: number): Promise<Position[]>;
  getPositionByUserAndSymbol(userId: number, symbol: string): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, updates: Partial<InsertPosition>): Promise<Position | undefined>;
  deletePosition(id: number): Promise<boolean>;

  // Portfolio history operations
  getPortfolioHistory(userId: number, limit?: number): Promise<PortfolioHistory[]>;
  createPortfolioHistory(history: InsertPortfolioHistory): Promise<PortfolioHistory>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Strategy operations
  async getStrategy(id: number): Promise<Strategy | undefined> {
    const [strategy] = await db.select().from(strategies).where(eq(strategies.id, id));
    return strategy || undefined;
  }

  async getStrategiesByUser(userId: number): Promise<Strategy[]> {
    return await db.select().from(strategies).where(eq(strategies.userId, userId));
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const [strategy] = await db
      .insert(strategies)
      .values(insertStrategy)
      .returning();
    return strategy;
  }

  async updateStrategy(id: number, updates: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    const [strategy] = await db
      .update(strategies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(strategies.id, id))
      .returning();
    return strategy || undefined;
  }

  async deleteStrategy(id: number): Promise<boolean> {
    const result = await db.delete(strategies).where(eq(strategies.id, id));
    return result.rowCount > 0;
  }

  // Backtest operations
  async getBacktest(id: number): Promise<Backtest | undefined> {
    const [backtest] = await db.select().from(backtests).where(eq(backtests.id, id));
    return backtest || undefined;
  }

  async getBacktestsByUser(userId: number): Promise<Backtest[]> {
    return await db.select().from(backtests).where(eq(backtests.userId, userId));
  }

  async getBacktestsByStrategy(strategyId: number): Promise<Backtest[]> {
    return await db.select().from(backtests).where(eq(backtests.strategyId, strategyId));
  }

  async createBacktest(insertBacktest: InsertBacktest): Promise<Backtest> {
    const [backtest] = await db
      .insert(backtests)
      .values(insertBacktest)
      .returning();
    return backtest;
  }

  // Trade operations
  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade || undefined;
  }

  async getTradesByUser(userId: number): Promise<Trade[]> {
    return await db.select().from(trades).where(eq(trades.userId, userId));
  }

  async getTradesByStrategy(strategyId: number): Promise<Trade[]> {
    return await db.select().from(trades).where(eq(trades.strategyId, strategyId));
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const [trade] = await db
      .insert(trades)
      .values(insertTrade)
      .returning();
    return trade;
  }

  // Position operations
  async getPosition(id: number): Promise<Position | undefined> {
    const [position] = await db.select().from(positions).where(eq(positions.id, id));
    return position || undefined;
  }

  async getPositionsByUser(userId: number): Promise<Position[]> {
    return await db.select().from(positions).where(eq(positions.userId, userId));
  }

  async getPositionByUserAndSymbol(userId: number, symbol: string): Promise<Position | undefined> {
    const [position] = await db
      .select()
      .from(positions)
      .where(eq(positions.userId, userId))
      .where(eq(positions.symbol, symbol));
    return position || undefined;
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const [position] = await db
      .insert(positions)
      .values(insertPosition)
      .returning();
    return position;
  }

  async updatePosition(id: number, updates: Partial<InsertPosition>): Promise<Position | undefined> {
    const [position] = await db
      .update(positions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(positions.id, id))
      .returning();
    return position || undefined;
  }

  async deletePosition(id: number): Promise<boolean> {
    const result = await db.delete(positions).where(eq(positions.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Portfolio history operations
  async getPortfolioHistory(userId: number, limit: number = 100): Promise<PortfolioHistory[]> {
    return await db
      .select()
      .from(portfolioHistory)
      .where(eq(portfolioHistory.userId, userId))
      .orderBy(portfolioHistory.timestamp)
      .limit(limit);
  }

  async createPortfolioHistory(insertHistory: InsertPortfolioHistory): Promise<PortfolioHistory> {
    const [history] = await db
      .insert(portfolioHistory)
      .values(insertHistory)
      .returning();
    return history;
  }
}

export const storage = new DatabaseStorage();
