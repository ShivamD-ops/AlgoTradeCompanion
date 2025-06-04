import { storage } from "../storage";
import { tradingService } from "./trading";
import type { Backtest, InsertBacktest, BacktestRequest } from "@shared/schema";

interface BacktestTrade {
  date: Date;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  pnl: number;
}

interface BacktestResult {
  trades: BacktestTrade[];
  dailyValues: Array<{ date: Date; value: number }>;
  maxDrawdown: number;
  sharpeRatio: number;
  profitFactor: number;
}

export class BacktestingService {
  async runBacktest(request: BacktestRequest): Promise<Backtest> {
    const strategy = await storage.getStrategy(request.strategyId);
    if (!strategy) {
      throw new Error("Strategy not found");
    }

    // Generate mock historical data and run backtest
    const result = await this.simulateBacktest(request);

    // Calculate performance metrics
    const finalValue = result.dailyValues[result.dailyValues.length - 1]?.value || request.initialCapital;
    const totalReturn = ((finalValue - request.initialCapital) / request.initialCapital) * 100;
    const winningTrades = result.trades.filter(trade => trade.pnl > 0).length;
    const losingTrades = result.trades.filter(trade => trade.pnl < 0).length;

    const backtestData: InsertBacktest = {
      strategyId: request.strategyId,
      userId: strategy.userId,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      initialCapital: request.initialCapital,
      finalValue,
      totalReturn,
      maxDrawdown: result.maxDrawdown,
      sharpeRatio: result.sharpeRatio,
      totalTrades: result.trades.length,
      winningTrades,
      losingTrades,
      profitFactor: result.profitFactor,
      results: result,
    };

    return storage.createBacktest(backtestData);
  }

  async getBacktestsByUser(userId: number): Promise<Backtest[]> {
    return storage.getBacktestsByUser(userId);
  }

  async getBacktestsByStrategy(strategyId: number): Promise<Backtest[]> {
    return storage.getBacktestsByStrategy(strategyId);
  }

  async getBacktest(id: number): Promise<Backtest | undefined> {
    return storage.getBacktest(id);
  }

  private async simulateBacktest(request: BacktestRequest): Promise<BacktestResult> {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const trades: BacktestTrade[] = [];
    const dailyValues: Array<{ date: Date; value: number }> = [];
    let currentValue = request.initialCapital;
    let maxValue = request.initialCapital;
    let maxDrawdown = 0;

    // Simulate trading strategy execution
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);

      // Simulate random trades (mock strategy execution)
      if (Math.random() < 0.1) { // 10% chance of trade per day
        const symbols = ["AAPL", "GOOGL", "MSFT", "TSLA"];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const side = Math.random() > 0.5 ? "BUY" : "SELL";
        const quantity = Math.floor(Math.random() * 10) + 1;
        const price = tradingService.generateMockPrice(symbol);
        const pnl = (Math.random() - 0.5) * 1000; // Random P&L

        trades.push({
          date: currentDate,
          symbol,
          side,
          quantity,
          price,
          pnl,
        });

        currentValue += pnl;
      }

      // Record daily value
      dailyValues.push({
        date: currentDate,
        value: currentValue,
      });

      // Update max drawdown
      if (currentValue > maxValue) {
        maxValue = currentValue;
      }
      const drawdown = ((maxValue - currentValue) / maxValue) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Calculate Sharpe ratio (simplified)
    const returns = dailyValues.slice(1).map((day, i) => 
      (day.value - dailyValues[i].value) / dailyValues[i].value
    );
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const returnStd = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = returnStd > 0 ? (avgReturn / returnStd) * Math.sqrt(252) : 0;

    // Calculate profit factor
    const profits = trades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
    const losses = Math.abs(trades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = losses > 0 ? profits / losses : profits > 0 ? 999 : 0;

    return {
      trades,
      dailyValues,
      maxDrawdown,
      sharpeRatio,
      profitFactor,
    };
  }
}

export const backtestingService = new BacktestingService();
