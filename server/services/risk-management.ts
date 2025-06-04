import { storage } from "../storage";
import { tradingService } from "./trading";

interface RiskParameters {
  maxDailyLoss: number;
  maxPositionSize: number;
  maxDrawdown: number;
  riskPercentPerTrade: number;
  stopLossPercentage: number;
  takeProfitPercentage: number;
}

interface PositionSizeCalculation {
  recommendedSize: number;
  maxAllowedSize: number;
  riskAmount: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}

export class RiskManagementService {
  private defaultRiskParams: RiskParameters = {
    maxDailyLoss: 5000,
    maxPositionSize: 100000,
    maxDrawdown: 10,
    riskPercentPerTrade: 2,
    stopLossPercentage: 2,
    takeProfitPercentage: 6
  };

  async calculatePositionSize(
    userId: number,
    symbol: string,
    currentPrice: number,
    side: "BUY" | "SELL",
    customRiskParams?: Partial<RiskParameters>
  ): Promise<PositionSizeCalculation> {
    const riskParams = { ...this.defaultRiskParams, ...customRiskParams };
    const portfolioValue = await tradingService.calculatePortfolioValue(userId);
    
    // Calculate risk amount based on portfolio percentage
    const riskAmount = (portfolioValue * riskParams.riskPercentPerTrade) / 100;
    
    // Calculate stop loss and take profit prices
    const stopLossPrice = side === "BUY" 
      ? currentPrice * (1 - riskParams.stopLossPercentage / 100)
      : currentPrice * (1 + riskParams.stopLossPercentage / 100);
    
    const takeProfitPrice = side === "BUY"
      ? currentPrice * (1 + riskParams.takeProfitPercentage / 100)
      : currentPrice * (1 - riskParams.takeProfitPercentage / 100);
    
    // Calculate position size based on risk
    const priceRisk = Math.abs(currentPrice - stopLossPrice);
    const recommendedSize = Math.floor(riskAmount / priceRisk);
    
    // Apply maximum position size limit
    const maxAllowedSize = Math.min(
      recommendedSize,
      Math.floor(riskParams.maxPositionSize / currentPrice)
    );

    return {
      recommendedSize,
      maxAllowedSize,
      riskAmount,
      stopLossPrice,
      takeProfitPrice
    };
  }

  async checkDailyLossLimit(userId: number): Promise<{ exceeded: boolean; currentLoss: number; limit: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTrades = await storage.getTradesByUser(userId);
    const todayLoss = todayTrades
      .filter(trade => trade.executedAt >= today && trade.pnl !== null)
      .reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    
    return {
      exceeded: todayLoss < -this.defaultRiskParams.maxDailyLoss,
      currentLoss: Math.abs(todayLoss),
      limit: this.defaultRiskParams.maxDailyLoss
    };
  }

  async calculateDrawdown(userId: number, days: number = 30): Promise<{ currentDrawdown: number; maxDrawdown: number }> {
    const portfolioHistory = await storage.getPortfolioHistory(userId, days);
    
    if (portfolioHistory.length === 0) {
      return { currentDrawdown: 0, maxDrawdown: 0 };
    }

    let peak = portfolioHistory[0].totalValue;
    let maxDrawdown = 0;
    let currentDrawdown = 0;

    for (const record of portfolioHistory) {
      if (record.totalValue > peak) {
        peak = record.totalValue;
      }
      
      const drawdown = ((peak - record.totalValue) / peak) * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }

    // Current drawdown from latest peak
    const currentValue = portfolioHistory[portfolioHistory.length - 1].totalValue;
    currentDrawdown = ((peak - currentValue) / peak) * 100;

    return { currentDrawdown, maxDrawdown };
  }

  async validateTrade(
    userId: number,
    symbol: string,
    quantity: number,
    price: number,
    side: "BUY" | "SELL"
  ): Promise<{ allowed: boolean; reasons: string[] }> {
    const reasons: string[] = [];

    // Check daily loss limit
    const lossCheck = await this.checkDailyLossLimit(userId);
    if (lossCheck.exceeded) {
      reasons.push(`Daily loss limit exceeded: ${lossCheck.currentLoss} / ${lossCheck.limit}`);
    }

    // Check drawdown limit
    const drawdownCheck = await this.calculateDrawdown(userId);
    if (drawdownCheck.currentDrawdown > this.defaultRiskParams.maxDrawdown) {
      reasons.push(`Maximum drawdown exceeded: ${drawdownCheck.currentDrawdown.toFixed(2)}%`);
    }

    // Check position size
    const positionCalc = await this.calculatePositionSize(userId, symbol, price, side);
    if (quantity > positionCalc.maxAllowedSize) {
      reasons.push(`Position size too large: ${quantity} > ${positionCalc.maxAllowedSize}`);
    }

    return {
      allowed: reasons.length === 0,
      reasons
    };
  }

  async getPortfolioRiskMetrics(userId: number): Promise<{
    totalValue: number;
    dailyPnL: number;
    weeklyPnL: number;
    monthlyPnL: number;
    maxDrawdown: number;
    currentDrawdown: number;
    sharpeRatio: number;
    volatility: number;
    varDaily: number;
  }> {
    const portfolioHistory = await storage.getPortfolioHistory(userId, 365);
    
    if (portfolioHistory.length === 0) {
      return {
        totalValue: 0,
        dailyPnL: 0,
        weeklyPnL: 0,
        monthlyPnL: 0,
        maxDrawdown: 0,
        currentDrawdown: 0,
        sharpeRatio: 0,
        volatility: 0,
        varDaily: 0
      };
    }

    const current = portfolioHistory[portfolioHistory.length - 1];
    const dailyReturns = this.calculateDailyReturns(portfolioHistory);
    
    // Calculate time-based P&L
    const oneDayAgo = portfolioHistory.find(h => 
      h.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
    );
    const oneWeekAgo = portfolioHistory.find(h => 
      h.timestamp >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    const oneMonthAgo = portfolioHistory.find(h => 
      h.timestamp >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const dailyPnL = oneDayAgo ? current.totalValue - oneDayAgo.totalValue : 0;
    const weeklyPnL = oneWeekAgo ? current.totalValue - oneWeekAgo.totalValue : 0;
    const monthlyPnL = oneMonthAgo ? current.totalValue - oneMonthAgo.totalValue : 0;

    // Calculate risk metrics
    const drawdown = await this.calculateDrawdown(userId, 365);
    const volatility = this.calculateVolatility(dailyReturns);
    const sharpeRatio = this.calculateSharpeRatio(dailyReturns);
    const varDaily = this.calculateVaR(dailyReturns, 0.95);

    return {
      totalValue: current.totalValue,
      dailyPnL,
      weeklyPnL,
      monthlyPnL,
      maxDrawdown: drawdown.maxDrawdown,
      currentDrawdown: drawdown.currentDrawdown,
      sharpeRatio,
      volatility,
      varDaily
    };
  }

  private calculateDailyReturns(portfolioHistory: any[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < portfolioHistory.length; i++) {
      const prevValue = portfolioHistory[i - 1].totalValue;
      const currentValue = portfolioHistory[i].totalValue;
      const dailyReturn = (currentValue - prevValue) / prevValue;
      returns.push(dailyReturn);
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 0.05): number {
    if (returns.length === 0) return 0;
    
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const annualizedReturn = meanReturn * 252;
    const volatility = this.calculateVolatility(returns);
    
    return volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;
  }

  private calculateVaR(returns: number[], confidence: number = 0.95): number {
    if (returns.length === 0) return 0;
    
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return Math.abs(sortedReturns[index] || 0);
  }
}

export const riskManagementService = new RiskManagementService();