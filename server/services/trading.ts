import { storage } from "../storage";
import type { Strategy, InsertStrategy, Trade, InsertTrade, Position, InsertPosition } from "@shared/schema";

export class TradingService {
  // Strategy management
  async createStrategy(userId: number, strategyData: Omit<InsertStrategy, "userId">): Promise<Strategy> {
    return storage.createStrategy({
      ...strategyData,
      userId,
    });
  }

  async getStrategiesByUser(userId: number): Promise<Strategy[]> {
    return storage.getStrategiesByUser(userId);
  }

  async getStrategy(id: number): Promise<Strategy | undefined> {
    return storage.getStrategy(id);
  }

  async updateStrategy(id: number, updates: Partial<InsertStrategy>): Promise<Strategy | undefined> {
    return storage.updateStrategy(id, updates);
  }

  async deleteStrategy(id: number): Promise<boolean> {
    return storage.deleteStrategy(id);
  }

  async toggleStrategyStatus(id: number, isActive: boolean): Promise<Strategy | undefined> {
    return storage.updateStrategy(id, { isActive });
  }

  // Trade execution
  async executeTrade(tradeData: InsertTrade): Promise<Trade> {
    const trade = await storage.createTrade(tradeData);

    // Update strategy statistics
    if (trade.pnl !== undefined && trade.pnl !== null) {
      const strategy = await storage.getStrategy(trade.strategyId);
      if (strategy) {
        await storage.updateStrategy(strategy.id, {
          totalPnL: strategy.totalPnL + trade.pnl,
          totalTrades: strategy.totalTrades + 1,
        });
      }
    }

    return trade;
  }

  async getTradesByUser(userId: number): Promise<Trade[]> {
    return storage.getTradesByUser(userId);
  }

  async getTradesByStrategy(strategyId: number): Promise<Trade[]> {
    return storage.getTradesByStrategy(strategyId);
  }

  // Position management
  async updatePosition(userId: number, symbol: string, quantity: number, price: number): Promise<Position> {
    const existingPosition = await storage.getPositionByUserAndSymbol(userId, symbol);

    if (existingPosition) {
      const newQuantity = existingPosition.quantity + quantity;
      
      if (newQuantity === 0) {
        // Close position
        await storage.deletePosition(existingPosition.id);
        return existingPosition;
      } else {
        // Update position
        const averagePrice = ((existingPosition.averagePrice * existingPosition.quantity) + (price * quantity)) / newQuantity;
        return await storage.updatePosition(existingPosition.id, {
          quantity: newQuantity,
          averagePrice,
          currentPrice: price,
        }) as Position;
      }
    } else {
      // Create new position
      return storage.createPosition({
        userId,
        symbol,
        quantity,
        averagePrice: price,
        currentPrice: price,
        unrealizedPnL: 0,
      });
    }
  }

  async getPositionsByUser(userId: number): Promise<Position[]> {
    return storage.getPositionsByUser(userId);
  }

  // Portfolio value calculation
  async calculatePortfolioValue(userId: number): Promise<number> {
    const positions = await storage.getPositionsByUser(userId);
    let totalValue = 0;

    for (const position of positions) {
      const currentPrice = position.currentPrice || position.averagePrice;
      totalValue += position.quantity * currentPrice;
    }

    return totalValue;
  }

  // Mock market data
  generateMockPrice(symbol: string): number {
    const basePrice = this.getBasePriceForSymbol(symbol);
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    return basePrice * (1 + change);
  }

  private getBasePriceForSymbol(symbol: string): number {
    const basePrices: Record<string, number> = {
      AAPL: 150,
      GOOGL: 100,
      MSFT: 300,
      TSLA: 200,
      AMZN: 120,
      NVDA: 400,
      META: 250,
    };
    return basePrices[symbol] || 100;
  }
}

export const tradingService = new TradingService();
