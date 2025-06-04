import { pgTable, text, serial, integer, boolean, timestamp, real, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Trading strategies
export const strategies = pgTable("strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").notNull(),
  parameters: json("parameters"),
  isActive: boolean("is_active").default(false).notNull(),
  totalPnL: real("total_pnl").default(0).notNull(),
  totalTrades: integer("total_trades").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Backtest results
export const backtests = pgTable("backtests", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").notNull(),
  userId: integer("user_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  initialCapital: real("initial_capital").notNull(),
  finalValue: real("final_value").notNull(),
  totalReturn: real("total_return").notNull(),
  maxDrawdown: real("max_drawdown").notNull(),
  sharpeRatio: real("sharpe_ratio"),
  totalTrades: integer("total_trades").notNull(),
  winningTrades: integer("winning_trades").notNull(),
  losingTrades: integer("losing_trades").notNull(),
  profitFactor: real("profit_factor"),
  results: json("results"), // Store detailed trade history
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Trade executions
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").notNull(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  side: text("side").notNull(), // 'BUY' or 'SELL'
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
  pnl: real("pnl"),
  isBacktest: boolean("is_backtest").default(false).notNull(),
});

// Portfolio positions
export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  symbol: text("symbol").notNull(),
  quantity: integer("quantity").notNull(),
  averagePrice: real("average_price").notNull(),
  currentPrice: real("current_price"),
  unrealizedPnL: real("unrealized_pnl"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User portfolio value history
export const portfolioHistory = pgTable("portfolio_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  totalValue: real("total_value").notNull(),
  cash: real("cash").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertStrategySchema = createInsertSchema(strategies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBacktestSchema = createInsertSchema(backtests).omit({
  id: true,
  createdAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  executedAt: true,
});

export const insertPositionSchema = createInsertSchema(positions).omit({
  id: true,
  updatedAt: true,
});

export const insertPortfolioHistorySchema = createInsertSchema(portfolioHistory).omit({
  id: true,
  timestamp: true,
});

// Additional schemas for API requests
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const backtestRequestSchema = z.object({
  strategyId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  initialCapital: z.number().min(1000),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = z.infer<typeof insertStrategySchema>;
export type Backtest = typeof backtests.$inferSelect;
export type InsertBacktest = z.infer<typeof insertBacktestSchema>;
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type PortfolioHistory = typeof portfolioHistory.$inferSelect;
export type InsertPortfolioHistory = z.infer<typeof insertPortfolioHistorySchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type BacktestRequest = z.infer<typeof backtestRequestSchema>;
