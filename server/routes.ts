import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { authService } from "./services/auth";
import { tradingService } from "./services/trading";
import { backtestingService } from "./services/backtesting";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  loginSchema, 
  insertStrategySchema,
  backtestRequestSchema,
  insertTradeSchema,
} from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || "trading-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await authService.register(userData);
      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const user = await authService.login(username, password);
      req.session.userId = user.id;
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await authService.getUserById(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { ...user, password: undefined } });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Strategy routes
  app.get("/api/strategies", requireAuth, async (req, res) => {
    try {
      const strategies = await tradingService.getStrategiesByUser(req.session.userId!);
      res.json(strategies);
    } catch (error) {
      res.status(500).json({ message: "Failed to get strategies" });
    }
  });

  app.post("/api/strategies", requireAuth, async (req, res) => {
    try {
      const strategyData = insertStrategySchema.omit({ userId: true }).parse(req.body);
      const strategy = await tradingService.createStrategy(req.session.userId!, strategyData);
      res.json(strategy);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to create strategy" });
    }
  });

  app.get("/api/strategies/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await tradingService.getStrategy(id);
      if (!strategy || strategy.userId !== req.session.userId) {
        return res.status(404).json({ message: "Strategy not found" });
      }
      res.json(strategy);
    } catch (error) {
      res.status(500).json({ message: "Failed to get strategy" });
    }
  });

  app.put("/api/strategies/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertStrategySchema.omit({ userId: true }).partial().parse(req.body);
      
      const existingStrategy = await tradingService.getStrategy(id);
      if (!existingStrategy || existingStrategy.userId !== req.session.userId) {
        return res.status(404).json({ message: "Strategy not found" });
      }

      const strategy = await tradingService.updateStrategy(id, updates);
      res.json(strategy);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to update strategy" });
    }
  });

  app.delete("/api/strategies/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const strategy = await tradingService.getStrategy(id);
      if (!strategy || strategy.userId !== req.session.userId) {
        return res.status(404).json({ message: "Strategy not found" });
      }

      await tradingService.deleteStrategy(id);
      res.json({ message: "Strategy deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete strategy" });
    }
  });

  app.post("/api/strategies/:id/toggle", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const strategy = await tradingService.getStrategy(id);
      if (!strategy || strategy.userId !== req.session.userId) {
        return res.status(404).json({ message: "Strategy not found" });
      }

      const updatedStrategy = await tradingService.toggleStrategyStatus(id, isActive);
      res.json(updatedStrategy);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle strategy" });
    }
  });

  // Backtest routes
  app.post("/api/backtests", requireAuth, async (req, res) => {
    try {
      const backtestData = backtestRequestSchema.parse(req.body);
      
      const strategy = await tradingService.getStrategy(backtestData.strategyId);
      if (!strategy || strategy.userId !== req.session.userId) {
        return res.status(404).json({ message: "Strategy not found" });
      }

      const backtest = await backtestingService.runBacktest(backtestData);
      res.json(backtest);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to run backtest" });
    }
  });

  app.get("/api/backtests", requireAuth, async (req, res) => {
    try {
      const backtests = await backtestingService.getBacktestsByUser(req.session.userId!);
      res.json(backtests);
    } catch (error) {
      res.status(500).json({ message: "Failed to get backtests" });
    }
  });

  app.get("/api/backtests/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const backtest = await backtestingService.getBacktest(id);
      if (!backtest || backtest.userId !== req.session.userId) {
        return res.status(404).json({ message: "Backtest not found" });
      }
      res.json(backtest);
    } catch (error) {
      res.status(500).json({ message: "Failed to get backtest" });
    }
  });

  // Trade routes
  app.get("/api/trades", requireAuth, async (req, res) => {
    try {
      const trades = await tradingService.getTradesByUser(req.session.userId!);
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to get trades" });
    }
  });

  app.post("/api/trades", requireAuth, async (req, res) => {
    try {
      const tradeData = insertTradeSchema.omit({ userId: true }).parse(req.body);
      const trade = await tradingService.executeTrade({
        ...tradeData,
        userId: req.session.userId!,
      });
      res.json(trade);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to execute trade" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio/positions", requireAuth, async (req, res) => {
    try {
      const positions = await tradingService.getPositionsByUser(req.session.userId!);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get positions" });
    }
  });

  app.get("/api/portfolio/value", requireAuth, async (req, res) => {
    try {
      const totalValue = await tradingService.calculatePortfolioValue(req.session.userId!);
      res.json({ totalValue });
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate portfolio value" });
    }
  });

  app.get("/api/portfolio/history", requireAuth, async (req, res) => {
    try {
      const history = await storage.getPortfolioHistory(req.session.userId!);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to get portfolio history" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const [strategies, trades, positions] = await Promise.all([
        tradingService.getStrategiesByUser(req.session.userId!),
        tradingService.getTradesByUser(req.session.userId!),
        tradingService.getPositionsByUser(req.session.userId!),
      ]);

      const activeStrategies = strategies.filter(s => s.isActive);
      const totalValue = await tradingService.calculatePortfolioValue(req.session.userId!);
      
      const todayTrades = trades.filter(trade => {
        const today = new Date();
        const tradeDate = new Date(trade.executedAt);
        return tradeDate.toDateString() === today.toDateString();
      });

      const todayPnL = todayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

      res.json({
        totalPortfolioValue: totalValue,
        activeStrategiesCount: activeStrategies.length,
        todayPnL,
        todayTradesCount: todayTrades.length,
        totalStrategies: strategies.length,
        totalTrades: trades.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
