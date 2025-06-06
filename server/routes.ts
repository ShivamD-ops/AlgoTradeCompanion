import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { authService } from "./services/auth";
import { tradingService } from "./services/trading";
import { backtestingService } from "./services/backtesting";
import { marketDataService } from "./services/market-data";
import { riskManagementService } from "./services/risk-management";
import { alertsService } from "./services/alerts";
import { strategyTemplatesService } from "./services/strategy-templates";
import { advancedOrdersService } from "./services/advanced-orders";
import { mlAnalyticsService } from "./services/ml-analytics";
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

  // AngelOne SmartAPI routes
  app.post("/api/angel/auth", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.authenticateAngelOne();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Authentication failed" });
    }
  });

  app.get("/api/angel/profile", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.getProfile();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Profile fetch failed" });
    }
  });

  app.get("/api/angel/holdings", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.getHoldings();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Holdings fetch failed" });
    }
  });

  app.get("/api/angel/positions", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.getPositions();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Positions fetch failed" });
    }
  });

  app.post("/api/angel/orders", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.placeOrder(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Order placement failed" });
    }
  });

  app.put("/api/angel/orders/:orderId", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.modifyOrder(req.params.orderId, req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Order modification failed" });
    }
  });

  app.delete("/api/angel/orders/:orderId", requireAuth, async (req, res) => {
    try {
      const variety = req.query.variety as string || 'NORMAL';
      const result = await marketDataService.cancelOrder(req.params.orderId, variety);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Order cancellation failed" });
    }
  });

  app.get("/api/angel/orders", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.getOrderBook();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Order book fetch failed" });
    }
  });

  app.get("/api/angel/trades", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.getTradeBook();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Trade book fetch failed" });
    }
  });

  app.get("/api/angel/search", requireAuth, async (req, res) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        return res.status(400).json({ message: "Search term required" });
      }
      const result = await marketDataService.searchInstruments(searchTerm);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Search failed" });
    }
  });

  app.get("/api/angel/ltp", requireAuth, async (req, res) => {
    try {
      const { exchange, symbol, token } = req.query;
      if (!symbol || !token) {
        return res.status(400).json({ message: "Symbol and token required" });
      }
      const result = await marketDataService.getLTP(
        exchange as string || 'NSE',
        symbol as string,
        token as string
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "LTP fetch failed" });
    }
  });

  app.get("/api/angel/historical", requireAuth, async (req, res) => {
    try {
      const { token, exchange, duration, fromDate, toDate } = req.query;
      if (!token || !fromDate || !toDate) {
        return res.status(400).json({ message: "Token, fromDate, and toDate required" });
      }
      const result = await marketDataService.getHistoricalData(
        token as string,
        exchange as string || 'NSE',
        duration as string || 'ONE_DAY',
        fromDate as string,
        toDate as string
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Historical data fetch failed" });
    }
  });

  app.post("/api/angel/websocket/start", requireAuth, async (req, res) => {
    try {
      const tokens = req.body;
      if (!Array.isArray(tokens)) {
        return res.status(400).json({ message: "Tokens array required" });
      }
      const result = await marketDataService.startWebSocket(tokens);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "WebSocket start failed" });
    }
  });

  app.get("/api/angel/live/:token", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.getLiveData(req.params.token);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Live data fetch failed" });
    }
  });

  app.post("/api/angel/logout", requireAuth, async (req, res) => {
    try {
      const result = await marketDataService.logout();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Logout failed" });
    }
  });

  // Risk Management Routes
  app.post("/api/risk/position-size", requireAuth, async (req, res) => {
    try {
      const { symbol, currentPrice, side, customRiskParams } = req.body;
      const result = await riskManagementService.calculatePositionSize(
        req.session.userId!,
        symbol,
        currentPrice,
        side,
        customRiskParams
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Position size calculation failed" });
    }
  });

  app.get("/api/risk/daily-loss", requireAuth, async (req, res) => {
    try {
      const result = await riskManagementService.checkDailyLossLimit(req.session.userId!);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Daily loss check failed" });
    }
  });

  app.get("/api/risk/metrics", requireAuth, async (req, res) => {
    try {
      const result = await riskManagementService.getPortfolioRiskMetrics(req.session.userId!);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Risk metrics calculation failed" });
    }
  });

  // Alerts Routes
  app.post("/api/alerts/price", requireAuth, async (req, res) => {
    try {
      const { symbol, alertType, targetValue, message } = req.body;
      const result = await alertsService.createPriceAlert(
        req.session.userId!,
        symbol,
        alertType,
        targetValue,
        message
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Price alert creation failed" });
    }
  });

  app.get("/api/alerts", requireAuth, async (req, res) => {
    try {
      const unreadOnly = req.query.unreadOnly === 'true';
      const result = await alertsService.getUserAlerts(req.session.userId!, unreadOnly);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get alerts" });
    }
  });

  app.put("/api/alerts/:id/read", requireAuth, async (req, res) => {
    try {
      const result = await alertsService.markAlertAsRead(parseInt(req.params.id));
      res.json({ success: result });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to mark alert as read" });
    }
  });

  // Strategy Templates Routes
  app.get("/api/strategy-templates", requireAuth, async (req, res) => {
    try {
      const templates = strategyTemplatesService.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get templates" });
    }
  });

  app.get("/api/strategy-templates/:id", requireAuth, async (req, res) => {
    try {
      const template = strategyTemplatesService.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get template" });
    }
  });

  app.post("/api/strategy-templates/:id/create", requireAuth, async (req, res) => {
    try {
      const { customParameters } = req.body;
      const result = strategyTemplatesService.createStrategyFromTemplate(req.params.id, customParameters);
      if (!result) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to create strategy from template" });
    }
  });

  // Advanced Orders Routes
  app.post("/api/orders/bracket", requireAuth, async (req, res) => {
    try {
      const { symbol, quantity, entryPrice, stopLoss, takeProfit } = req.body;
      const result = await advancedOrdersService.createBracketOrder(
        req.session.userId!,
        symbol,
        quantity,
        entryPrice,
        stopLoss,
        takeProfit
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Bracket order creation failed" });
    }
  });

  app.post("/api/orders/trailing-stop", requireAuth, async (req, res) => {
    try {
      const { symbol, quantity, trailAmount, trailPercent } = req.body;
      const result = await advancedOrdersService.createTrailingStopOrder(
        req.session.userId!,
        symbol,
        quantity,
        trailAmount,
        trailPercent
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Trailing stop creation failed" });
    }
  });

  app.post("/api/orders/iceberg", requireAuth, async (req, res) => {
    try {
      const { symbol, totalQuantity, visibleQuantity, price, side } = req.body;
      const result = await advancedOrdersService.createIcebergOrder(
        req.session.userId!,
        symbol,
        totalQuantity,
        visibleQuantity,
        price,
        side
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Iceberg order creation failed" });
    }
  });

  app.post("/api/orders/time-based", requireAuth, async (req, res) => {
    try {
      const { symbol, quantity, side, scheduleType, options } = req.body;
      const result = await advancedOrdersService.createTimeBasedOrder(
        req.session.userId!,
        symbol,
        quantity,
        side,
        scheduleType,
        options
      );
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Time-based order creation failed" });
    }
  });

  // ML Analytics Routes
  app.get("/api/analytics/predictions", requireAuth, async (req, res) => {
    try {
      const { symbol } = req.query;
      const result = await mlAnalyticsService.getMarketPredictions(symbol as string);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get predictions" });
    }
  });

  app.post("/api/analytics/predict/:symbol", requireAuth, async (req, res) => {
    try {
      const { timeframe } = req.body;
      const result = await mlAnalyticsService.generatePricePrediction(req.params.symbol, timeframe);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Prediction generation failed" });
    }
  });

  app.get("/api/analytics/anomalies", requireAuth, async (req, res) => {
    try {
      const { resolved } = req.query;
      const result = await mlAnalyticsService.getAnomalies(resolved === 'true' ? true : resolved === 'false' ? false : undefined);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get anomalies" });
    }
  });

  app.get("/api/analytics/sentiment", requireAuth, async (req, res) => {
    try {
      const { symbol } = req.query;
      const result = await mlAnalyticsService.getSentimentAnalysis(symbol as string);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to get sentiment analysis" });
    }
  });

  app.post("/api/analytics/sentiment/:symbol", requireAuth, async (req, res) => {
    try {
      const result = await mlAnalyticsService.generateSentimentAnalysis(req.params.symbol);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Sentiment analysis generation failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
