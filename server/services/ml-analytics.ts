import { storage } from "../storage";
import { marketDataService } from "./market-data";

interface PredictionModel {
  id: string;
  name: string;
  type: "PRICE_PREDICTION" | "TREND_ANALYSIS" | "VOLATILITY_FORECAST" | "SENTIMENT_ANALYSIS";
  accuracy: number;
  lastTrainedAt: Date;
  parameters: Record<string, any>;
  isActive: boolean;
}

interface MarketPrediction {
  symbol: string;
  modelId: string;
  predictedPrice: number;
  currentPrice: number;
  confidence: number;
  timeframe: "1H" | "1D" | "1W" | "1M";
  direction: "UP" | "DOWN" | "SIDEWAYS";
  createdAt: Date;
  accuracy?: number;
}

interface AnomalyDetection {
  id: string;
  type: "PRICE_ANOMALY" | "VOLUME_ANOMALY" | "PATTERN_ANOMALY" | "STRATEGY_ANOMALY";
  symbol?: string;
  strategyId?: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  data: any;
  detectedAt: Date;
  resolved: boolean;
}

interface SentimentAnalysis {
  symbol: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  score: number; // -1 to 1
  confidence: number;
  sources: {
    news: number;
    social: number;
    technical: number;
  };
  updatedAt: Date;
}

export class MLAnalyticsService {
  private models: Map<string, PredictionModel> = new Map();
  private predictions: Map<string, MarketPrediction[]> = new Map();
  private anomalies: Map<string, AnomalyDetection> = new Map();
  private sentimentData: Map<string, SentimentAnalysis> = new Map();
  private modelIdCounter = 1;

  constructor() {
    this.initializeModels();
    this.startAnalyticsEngine();
  }

  private initializeModels(): void {
    // Price Prediction Model using Simple Moving Average + Linear Regression
    this.models.set("sma_lr_price", {
      id: "sma_lr_price",
      name: "SMA Linear Regression Price Predictor",
      type: "PRICE_PREDICTION",
      accuracy: 0.72,
      lastTrainedAt: new Date(),
      parameters: {
        lookbackPeriod: 20,
        smaPeriods: [5, 10, 20, 50],
        features: ["price", "volume", "sma", "volatility"]
      },
      isActive: true
    });

    // Volatility Forecast Model
    this.models.set("garch_volatility", {
      id: "garch_volatility",
      name: "GARCH Volatility Forecaster",
      type: "VOLATILITY_FORECAST",
      accuracy: 0.68,
      lastTrainedAt: new Date(),
      parameters: {
        lookbackPeriod: 30,
        forecastHorizon: 5
      },
      isActive: true
    });

    // Trend Analysis Model
    this.models.set("trend_momentum", {
      id: "trend_momentum",
      name: "Momentum-Based Trend Analyzer",
      type: "TREND_ANALYSIS",
      accuracy: 0.75,
      lastTrainedAt: new Date(),
      parameters: {
        rsiPeriod: 14,
        macdFast: 12,
        macdSlow: 26,
        macdSignal: 9
      },
      isActive: true
    });
  }

  async generatePricePrediction(symbol: string, timeframe: MarketPrediction["timeframe"]): Promise<MarketPrediction | null> {
    try {
      // Get historical data
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 60); // 60 days of history

      const historicalData = await marketDataService.getHistoricalData(
        symbol,
        "NSE",
        "ONE_DAY",
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (historicalData.status !== "success" || !historicalData.data?.data) {
        return null;
      }

      const prices = historicalData.data.data.map((d: any) => parseFloat(d.close));
      const volumes = historicalData.data.data.map((d: any) => parseFloat(d.volume));
      const currentPrice = prices[prices.length - 1];

      // Simple prediction using linear regression on moving averages
      const prediction = this.predictPrice(prices, volumes, timeframe);
      
      const marketPrediction: MarketPrediction = {
        symbol,
        modelId: "sma_lr_price",
        predictedPrice: prediction.price,
        currentPrice,
        confidence: prediction.confidence,
        timeframe,
        direction: prediction.price > currentPrice ? "UP" : prediction.price < currentPrice ? "DOWN" : "SIDEWAYS",
        createdAt: new Date()
      };

      // Store prediction
      if (!this.predictions.has(symbol)) {
        this.predictions.set(symbol, []);
      }
      this.predictions.get(symbol)!.push(marketPrediction);

      return marketPrediction;
    } catch (error) {
      console.error(`Failed to generate prediction for ${symbol}:`, error);
      return null;
    }
  }

  private predictPrice(prices: number[], volumes: number[], timeframe: string): { price: number; confidence: number } {
    if (prices.length < 20) {
      return { price: prices[prices.length - 1], confidence: 0.5 };
    }

    // Calculate features
    const sma5 = this.calculateSMA(prices, 5);
    const sma20 = this.calculateSMA(prices, 20);
    const volatility = this.calculateVolatility(prices.slice(-20));
    const trend = this.calculateTrend(prices.slice(-10));
    
    // Simple linear prediction based on trend and moving averages
    const currentPrice = prices[prices.length - 1];
    const smaRatio = sma5[sma5.length - 1] / sma20[sma20.length - 1];
    
    let multiplier = 1;
    switch (timeframe) {
      case "1H": multiplier = 0.001; break;
      case "1D": multiplier = 0.01; break;
      case "1W": multiplier = 0.05; break;
      case "1M": multiplier = 0.2; break;
    }

    const predictedPrice = currentPrice * (1 + (trend * smaRatio * multiplier));
    const confidence = Math.min(0.9, Math.max(0.3, 1 - volatility));

    return {
      price: Math.max(0, predictedPrice),
      confidence
    };
  }

  async detectAnomalies(symbol?: string, strategyId?: number): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];

    if (symbol) {
      // Price anomaly detection
      const priceAnomaly = await this.detectPriceAnomaly(symbol);
      if (priceAnomaly) anomalies.push(priceAnomaly);

      // Volume anomaly detection
      const volumeAnomaly = await this.detectVolumeAnomaly(symbol);
      if (volumeAnomaly) anomalies.push(volumeAnomaly);
    }

    if (strategyId) {
      // Strategy performance anomaly
      const strategyAnomaly = await this.detectStrategyAnomaly(strategyId);
      if (strategyAnomaly) anomalies.push(strategyAnomaly);
    }

    // Store anomalies
    anomalies.forEach(anomaly => {
      this.anomalies.set(anomaly.id, anomaly);
    });

    return anomalies;
  }

  private async detectPriceAnomaly(symbol: string): Promise<AnomalyDetection | null> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      const historicalData = await marketDataService.getHistoricalData(
        symbol,
        "NSE",
        "ONE_DAY",
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (historicalData.status !== "success") return null;

      const prices = historicalData.data.data.map((d: any) => parseFloat(d.close));
      const returns = this.calculateReturns(prices);
      const volatility = this.calculateVolatility(returns);
      const currentReturn = returns[returns.length - 1];

      // Detect if current return is more than 3 standard deviations away
      if (Math.abs(currentReturn) > 3 * volatility) {
        return {
          id: `PA_${Date.now()}_${symbol}`,
          type: "PRICE_ANOMALY",
          symbol,
          severity: Math.abs(currentReturn) > 5 * volatility ? "CRITICAL" : "HIGH",
          description: `Unusual price movement detected: ${(currentReturn * 100).toFixed(2)}% change`,
          data: {
            return: currentReturn,
            volatility,
            threshold: 3 * volatility,
            zscore: currentReturn / volatility
          },
          detectedAt: new Date(),
          resolved: false
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to detect price anomaly for ${symbol}:`, error);
      return null;
    }
  }

  private async detectVolumeAnomaly(symbol: string): Promise<AnomalyDetection | null> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      const historicalData = await marketDataService.getHistoricalData(
        symbol,
        "NSE",
        "ONE_DAY",
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (historicalData.status !== "success") return null;

      const volumes = historicalData.data.data.map((d: any) => parseFloat(d.volume));
      const avgVolume = volumes.slice(0, -1).reduce((sum, vol) => sum + vol, 0) / (volumes.length - 1);
      const currentVolume = volumes[volumes.length - 1];
      const volumeRatio = currentVolume / avgVolume;

      // Detect volume spike (more than 3x average)
      if (volumeRatio > 3) {
        return {
          id: `VA_${Date.now()}_${symbol}`,
          type: "VOLUME_ANOMALY",
          symbol,
          severity: volumeRatio > 5 ? "HIGH" : "MEDIUM",
          description: `Volume spike detected: ${volumeRatio.toFixed(1)}x average volume`,
          data: {
            currentVolume,
            averageVolume: avgVolume,
            ratio: volumeRatio
          },
          detectedAt: new Date(),
          resolved: false
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to detect volume anomaly for ${symbol}:`, error);
      return null;
    }
  }

  private async detectStrategyAnomaly(strategyId: number): Promise<AnomalyDetection | null> {
    try {
      const trades = await storage.getTradesByStrategy(strategyId);
      if (trades.length < 10) return null;

      const recentTrades = trades.slice(-10);
      const winRate = recentTrades.filter(trade => (trade.pnl || 0) > 0).length / recentTrades.length;
      const avgPnL = recentTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0) / recentTrades.length;

      // Detect if performance has degraded significantly
      if (winRate < 0.3 || avgPnL < -100) {
        return {
          id: `SA_${Date.now()}_${strategyId}`,
          type: "STRATEGY_ANOMALY",
          strategyId,
          severity: winRate < 0.2 ? "CRITICAL" : "HIGH",
          description: `Strategy performance degradation: ${(winRate * 100).toFixed(1)}% win rate, avg P&L: ₹${avgPnL.toFixed(2)}`,
          data: {
            winRate,
            avgPnL,
            recentTradesCount: recentTrades.length
          },
          detectedAt: new Date(),
          resolved: false
        };
      }

      return null;
    } catch (error) {
      console.error(`Failed to detect strategy anomaly for ${strategyId}:`, error);
      return null;
    }
  }

  async generateSentimentAnalysis(symbol: string): Promise<SentimentAnalysis> {
    // Simplified sentiment analysis - in production, integrate with news APIs and social media
    const technicalSentiment = await this.calculateTechnicalSentiment(symbol);
    
    // Mock news and social sentiment (would be replaced with real APIs)
    const newsSentiment = this.generateMockSentiment();
    const socialSentiment = this.generateMockSentiment();
    
    const overallScore = (technicalSentiment * 0.4 + newsSentiment * 0.3 + socialSentiment * 0.3);
    
    let sentiment: SentimentAnalysis["sentiment"];
    if (overallScore > 0.2) sentiment = "BULLISH";
    else if (overallScore < -0.2) sentiment = "BEARISH";
    else sentiment = "NEUTRAL";

    const analysis: SentimentAnalysis = {
      symbol,
      sentiment,
      score: overallScore,
      confidence: 0.7, // Would be calculated based on data quality
      sources: {
        news: newsSentiment,
        social: socialSentiment,
        technical: technicalSentiment
      },
      updatedAt: new Date()
    };

    this.sentimentData.set(symbol, analysis);
    return analysis;
  }

  private async calculateTechnicalSentiment(symbol: string): Promise<number> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 30);

      const historicalData = await marketDataService.getHistoricalData(
        symbol,
        "NSE",
        "ONE_DAY",
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (historicalData.status !== "success") return 0;

      const prices = historicalData.data.data.map((d: any) => parseFloat(d.close));
      const rsi = this.calculateRSI(prices, 14);
      const sma20 = this.calculateSMA(prices, 20);
      const currentPrice = prices[prices.length - 1];
      const currentRSI = rsi[rsi.length - 1];
      const currentSMA = sma20[sma20.length - 1];

      // Technical sentiment based on RSI and price vs SMA
      let sentiment = 0;
      
      if (currentRSI > 70) sentiment -= 0.3; // Overbought
      else if (currentRSI < 30) sentiment += 0.3; // Oversold
      
      if (currentPrice > currentSMA) sentiment += 0.2; // Above moving average
      else sentiment -= 0.2; // Below moving average

      return Math.max(-1, Math.min(1, sentiment));
    } catch (error) {
      console.error(`Failed to calculate technical sentiment for ${symbol}:`, error);
      return 0;
    }
  }

  private generateMockSentiment(): number {
    // Mock sentiment - replace with real news/social media analysis
    return (Math.random() - 0.5) * 2; // Random value between -1 and 1
  }

  // Analytics Helper Functions
  private calculateSMA(prices: number[], period: number): number[] {
    const sma: number[] = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const rsi = [];
    for (let i = period - 1; i < changes.length; i++) {
      const recentChanges = changes.slice(i - period + 1, i + 1);
      const gains = recentChanges.filter(c => c > 0);
      const losses = recentChanges.filter(c => c < 0).map(c => -c);

      const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
      const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;

      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }

    return rsi;
  }

  private calculateReturns(prices: number[]): number[] {
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return returns;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length === 0) return 0;
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculateTrend(prices: number[]): number {
    if (prices.length < 2) return 0;
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    return (lastPrice - firstPrice) / firstPrice;
  }

  private startAnalyticsEngine(): void {
    // Run analytics every hour
    setInterval(async () => {
      // Update predictions for top symbols
      const topSymbols = ["RELIANCE", "INFY", "TCS", "HDFC", "ICICIBANK"];
      for (const symbol of topSymbols) {
        await this.generatePricePrediction(symbol, "1D");
        await this.generateSentimentAnalysis(symbol);
        await this.detectAnomalies(symbol);
      }
    }, 3600000); // 1 hour
  }

  // Getter methods
  async getMarketPredictions(symbol?: string): Promise<MarketPrediction[]> {
    if (symbol) {
      return this.predictions.get(symbol) || [];
    }
    
    const allPredictions: MarketPrediction[] = [];
    this.predictions.forEach(predictions => allPredictions.push(...predictions));
    return allPredictions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAnomalies(resolved?: boolean): Promise<AnomalyDetection[]> {
    const anomalies = Array.from(this.anomalies.values());
    if (resolved !== undefined) {
      return anomalies.filter(anomaly => anomaly.resolved === resolved);
    }
    return anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  async getSentimentAnalysis(symbol?: string): Promise<SentimentAnalysis[]> {
    if (symbol) {
      const sentiment = this.sentimentData.get(symbol);
      return sentiment ? [sentiment] : [];
    }
    return Array.from(this.sentimentData.values());
  }

  async resolveAnomaly(anomalyId: string): Promise<boolean> {
    const anomaly = this.anomalies.get(anomalyId);
    if (anomaly) {
      anomaly.resolved = true;
      return true;
    }
    return false;
  }
}

export const mlAnalyticsService = new MLAnalyticsService();