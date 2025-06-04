import {
  users,
  strategies,
  backtests,
  trades,
  positions,
  portfolioHistory,
  type User,
  type InsertUser,
  type Strategy,
  type InsertStrategy,
  type Backtest,
  type InsertBacktest,
  type Trade,
  type InsertTrade,
  type Position,
  type InsertPosition,
  type PortfolioHistory,
  type InsertPortfolioHistory,
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private strategies: Map<number, Strategy>;
  private backtests: Map<number, Backtest>;
  private trades: Map<number, Trade>;
  private positions: Map<number, Position>;
  private portfolioHistory: Map<number, PortfolioHistory>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.strategies = new Map();
    this.backtests = new Map();
    this.trades = new Map();
    this.positions = new Map();
    this.portfolioHistory = new Map();
    this.currentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Strategy operations
  async getStrategy(id: number): Promise<Strategy | undefined> {
    return this.strategies.get(id);
  }

  async getStrategiesByUser(userId: number): Promise<Strategy[]> {
    return Array.from(this.strategies.values()).filter(strategy => strategy.userId === userId);
  }

  async createStrategy(insertStrategy: InsertStrategy): Promise<Strategy> {
    const id = this.currentId++;
    const now = new Date();
    const strategy: Strategy = {
      ...insertStrategy,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.strategies.set(id, strategy);
    return strategy;
  }

  async updateStrategy(id: number, updates: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    const strategy = this.strategies.get(id);
    if (!strategy) return undefined;

    const updatedStrategy: Strategy = {
      ...strategy,
      ...updates,
      updatedAt: new Date(),
    };
    this.strategies.set(id, updatedStrategy);
    return updatedStrategy;
  }

  async deleteStrategy(id: number): Promise<boolean> {
    return this.strategies.delete(id);
  }

  // Backtest operations
  async getBacktest(id: number): Promise<Backtest | undefined> {
    return this.backtests.get(id);
  }

  async getBacktestsByUser(userId: number): Promise<Backtest[]> {
    return Array.from(this.backtests.values()).filter(backtest => backtest.userId === userId);
  }

  async getBacktestsByStrategy(strategyId: number): Promise<Backtest[]> {
    return Array.from(this.backtests.values()).filter(backtest => backtest.strategyId === strategyId);
  }

  async createBacktest(insertBacktest: InsertBacktest): Promise<Backtest> {
    const id = this.currentId++;
    const backtest: Backtest = {
      ...insertBacktest,
      id,
      createdAt: new Date(),
    };
    this.backtests.set(id, backtest);
    return backtest;
  }

  // Trade operations
  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async getTradesByUser(userId: number): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(trade => trade.userId === userId);
  }

  async getTradesByStrategy(strategyId: number): Promise<Trade[]> {
    return Array.from(this.trades.values()).filter(trade => trade.strategyId === strategyId);
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentId++;
    const trade: Trade = {
      ...insertTrade,
      id,
      executedAt: new Date(),
    };
    this.trades.set(id, trade);
    return trade;
  }

  // Position operations
  async getPosition(id: number): Promise<Position | undefined> {
    return this.positions.get(id);
  }

  async getPositionsByUser(userId: number): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(position => position.userId === userId);
  }

  async getPositionByUserAndSymbol(userId: number, symbol: string): Promise<Position | undefined> {
    return Array.from(this.positions.values()).find(
      position => position.userId === userId && position.symbol === symbol
    );
  }

  async createPosition(insertPosition: InsertPosition): Promise<Position> {
    const id = this.currentId++;
    const position: Position = {
      ...insertPosition,
      id,
      updatedAt: new Date(),
    };
    this.positions.set(id, position);
    return position;
  }

  async updatePosition(id: number, updates: Partial<InsertPosition>): Promise<Position | undefined> {
    const position = this.positions.get(id);
    if (!position) return undefined;

    const updatedPosition: Position = {
      ...position,
      ...updates,
      updatedAt: new Date(),
    };
    this.positions.set(id, updatedPosition);
    return updatedPosition;
  }

  async deletePosition(id: number): Promise<boolean> {
    return this.positions.delete(id);
  }

  // Portfolio history operations
  async getPortfolioHistory(userId: number, limit: number = 100): Promise<PortfolioHistory[]> {
    return Array.from(this.portfolioHistory.values())
      .filter(history => history.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createPortfolioHistory(insertHistory: InsertPortfolioHistory): Promise<PortfolioHistory> {
    const id = this.currentId++;
    const history: PortfolioHistory = {
      ...insertHistory,
      id,
      timestamp: new Date(),
    };
    this.portfolioHistory.set(id, history);
    return history;
  }
}

export const storage = new MemStorage();
