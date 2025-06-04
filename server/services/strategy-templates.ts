interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: "MOMENTUM" | "MEAN_REVERSION" | "ARBITRAGE" | "PAIRS_TRADING" | "BREAKOUT" | "SCALPING";
  code: string;
  parameters: StrategyParameter[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  complexity: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedReturns: string;
  marketConditions: string;
}

interface StrategyParameter {
  name: string;
  type: "NUMBER" | "BOOLEAN" | "STRING" | "SELECT";
  defaultValue: any;
  description: string;
  min?: number;
  max?: number;
  options?: string[];
}

export class StrategyTemplatesService {
  private templates: Map<string, StrategyTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Moving Average Crossover Strategy
    this.templates.set("sma_crossover", {
      id: "sma_crossover",
      name: "Simple Moving Average Crossover",
      description: "Buy when fast MA crosses above slow MA, sell when it crosses below",
      category: "MOMENTUM",
      riskLevel: "LOW",
      complexity: "BEGINNER",
      estimatedReturns: "8-12% annually",
      marketConditions: "Works best in trending markets",
      parameters: [
        {
          name: "fastPeriod",
          type: "NUMBER",
          defaultValue: 10,
          description: "Fast moving average period",
          min: 5,
          max: 50
        },
        {
          name: "slowPeriod",
          type: "NUMBER",
          defaultValue: 30,
          description: "Slow moving average period",
          min: 20,
          max: 200
        },
        {
          name: "stopLoss",
          type: "NUMBER",
          defaultValue: 2,
          description: "Stop loss percentage",
          min: 0.5,
          max: 10
        },
        {
          name: "takeProfit",
          type: "NUMBER",
          defaultValue: 4,
          description: "Take profit percentage",
          min: 1,
          max: 20
        }
      ],
      code: `
// Simple Moving Average Crossover Strategy
class SMAStrategy {
  constructor(params) {
    this.fastPeriod = params.fastPeriod || 10;
    this.slowPeriod = params.slowPeriod || 30;
    this.stopLoss = params.stopLoss || 2;
    this.takeProfit = params.takeProfit || 4;
    this.position = null;
    this.entryPrice = 0;
  }

  analyze(data) {
    const prices = data.map(d => d.close);
    const fastSMA = this.calculateSMA(prices, this.fastPeriod);
    const slowSMA = this.calculateSMA(prices, this.slowPeriod);
    
    if (prices.length < this.slowPeriod) return null;
    
    const currentPrice = prices[prices.length - 1];
    const prevFastSMA = fastSMA[fastSMA.length - 2];
    const prevSlowSMA = slowSMA[slowSMA.length - 2];
    const currentFastSMA = fastSMA[fastSMA.length - 1];
    const currentSlowSMA = slowSMA[slowSMA.length - 1];
    
    // Golden Cross - Buy Signal
    if (prevFastSMA <= prevSlowSMA && currentFastSMA > currentSlowSMA && !this.position) {
      return {
        action: 'BUY',
        quantity: 1,
        price: currentPrice,
        reason: 'Golden Cross detected'
      };
    }
    
    // Death Cross - Sell Signal
    if (prevFastSMA >= prevSlowSMA && currentFastSMA < currentSlowSMA && this.position === 'LONG') {
      return {
        action: 'SELL',
        quantity: 1,
        price: currentPrice,
        reason: 'Death Cross detected'
      };
    }
    
    // Stop Loss Check
    if (this.position === 'LONG' && currentPrice <= this.entryPrice * (1 - this.stopLoss / 100)) {
      return {
        action: 'SELL',
        quantity: 1,
        price: currentPrice,
        reason: 'Stop loss triggered'
      };
    }
    
    // Take Profit Check
    if (this.position === 'LONG' && currentPrice >= this.entryPrice * (1 + this.takeProfit / 100)) {
      return {
        action: 'SELL',
        quantity: 1,
        price: currentPrice,
        reason: 'Take profit triggered'
      };
    }
    
    return null;
  }
  
  onTrade(action, price) {
    if (action === 'BUY') {
      this.position = 'LONG';
      this.entryPrice = price;
    } else if (action === 'SELL') {
      this.position = null;
      this.entryPrice = 0;
    }
  }
  
  calculateSMA(prices, period) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
    return sma;
  }
}
`
    });

    // RSI Mean Reversion Strategy
    this.templates.set("rsi_mean_reversion", {
      id: "rsi_mean_reversion",
      name: "RSI Mean Reversion",
      description: "Buy oversold conditions (RSI < 30), sell overbought conditions (RSI > 70)",
      category: "MEAN_REVERSION",
      riskLevel: "MEDIUM",
      complexity: "INTERMEDIATE",
      estimatedReturns: "10-15% annually",
      marketConditions: "Works best in ranging markets",
      parameters: [
        {
          name: "rsiPeriod",
          type: "NUMBER",
          defaultValue: 14,
          description: "RSI calculation period",
          min: 5,
          max: 30
        },
        {
          name: "oversoldLevel",
          type: "NUMBER",
          defaultValue: 30,
          description: "RSI oversold threshold",
          min: 10,
          max: 40
        },
        {
          name: "overboughtLevel",
          type: "NUMBER",
          defaultValue: 70,
          description: "RSI overbought threshold",
          min: 60,
          max: 90
        },
        {
          name: "holdPeriod",
          type: "NUMBER",
          defaultValue: 5,
          description: "Minimum hold period in days",
          min: 1,
          max: 20
        }
      ],
      code: `
// RSI Mean Reversion Strategy
class RSIStrategy {
  constructor(params) {
    this.rsiPeriod = params.rsiPeriod || 14;
    this.oversoldLevel = params.oversoldLevel || 30;
    this.overboughtLevel = params.overboughtLevel || 70;
    this.holdPeriod = params.holdPeriod || 5;
    this.position = null;
    this.entryDate = null;
  }

  analyze(data) {
    if (data.length < this.rsiPeriod + 1) return null;
    
    const rsi = this.calculateRSI(data.map(d => d.close), this.rsiPeriod);
    const currentRSI = rsi[rsi.length - 1];
    const currentPrice = data[data.length - 1].close;
    const currentDate = new Date(data[data.length - 1].date);
    
    // Buy on oversold condition
    if (currentRSI < this.oversoldLevel && !this.position) {
      return {
        action: 'BUY',
        quantity: 1,
        price: currentPrice,
        reason: \`RSI oversold: \${currentRSI.toFixed(2)}\`
      };
    }
    
    // Sell on overbought condition or minimum hold period
    if (this.position === 'LONG') {
      const daysSinceEntry = this.entryDate ? 
        Math.floor((currentDate.getTime() - this.entryDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      if (currentRSI > this.overboughtLevel || daysSinceEntry >= this.holdPeriod) {
        return {
          action: 'SELL',
          quantity: 1,
          price: currentPrice,
          reason: currentRSI > this.overboughtLevel ? 
            \`RSI overbought: \${currentRSI.toFixed(2)}\` : 
            \`Hold period reached: \${daysSinceEntry} days\`
        };
      }
    }
    
    return null;
  }
  
  onTrade(action, price, date) {
    if (action === 'BUY') {
      this.position = 'LONG';
      this.entryDate = new Date(date);
    } else if (action === 'SELL') {
      this.position = null;
      this.entryDate = null;
    }
  }
  
  calculateRSI(prices, period) {
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
}
`
    });

    // Bollinger Bands Breakout Strategy
    this.templates.set("bollinger_breakout", {
      id: "bollinger_breakout",
      name: "Bollinger Bands Breakout",
      description: "Trade breakouts from Bollinger Bands with volume confirmation",
      category: "BREAKOUT",
      riskLevel: "HIGH",
      complexity: "ADVANCED",
      estimatedReturns: "15-25% annually",
      marketConditions: "Works in volatile markets with clear trends",
      parameters: [
        {
          name: "period",
          type: "NUMBER",
          defaultValue: 20,
          description: "Bollinger Bands period",
          min: 10,
          max: 50
        },
        {
          name: "standardDeviations",
          type: "NUMBER",
          defaultValue: 2,
          description: "Standard deviations for bands",
          min: 1,
          max: 3
        },
        {
          name: "volumeThreshold",
          type: "NUMBER",
          defaultValue: 1.5,
          description: "Volume multiplier for confirmation",
          min: 1,
          max: 3
        },
        {
          name: "breakoutConfirmation",
          type: "BOOLEAN",
          defaultValue: true,
          description: "Require volume confirmation for breakouts"
        }
      ],
      code: `
// Bollinger Bands Breakout Strategy
class BollingerBreakoutStrategy {
  constructor(params) {
    this.period = params.period || 20;
    this.stdDev = params.standardDeviations || 2;
    this.volumeThreshold = params.volumeThreshold || 1.5;
    this.requireVolumeConfirmation = params.breakoutConfirmation || true;
    this.position = null;
  }

  analyze(data) {
    if (data.length < this.period) return null;
    
    const prices = data.map(d => d.close);
    const volumes = data.map(d => d.volume);
    const bands = this.calculateBollingerBands(prices, this.period, this.stdDev);
    
    if (bands.length === 0) return null;
    
    const currentPrice = prices[prices.length - 1];
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = this.calculateAverage(volumes.slice(-this.period));
    const currentBands = bands[bands.length - 1];
    
    const volumeConfirmed = !this.requireVolumeConfirmation || 
      currentVolume > avgVolume * this.volumeThreshold;
    
    // Upper band breakout - Buy signal
    if (currentPrice > currentBands.upper && !this.position && volumeConfirmed) {
      return {
        action: 'BUY',
        quantity: 1,
        price: currentPrice,
        reason: \`Upper band breakout with volume confirmation\`
      };
    }
    
    // Lower band breakdown - Sell signal (if long)
    if (currentPrice < currentBands.lower && this.position === 'LONG') {
      return {
        action: 'SELL',
        quantity: 1,
        price: currentPrice,
        reason: \`Lower band breakdown\`
      };
    }
    
    // Mean reversion to middle band
    if (this.position === 'LONG' && currentPrice <= currentBands.middle) {
      return {
        action: 'SELL',
        quantity: 1,
        price: currentPrice,
        reason: \`Mean reversion to middle band\`
      };
    }
    
    return null;
  }
  
  onTrade(action, price) {
    if (action === 'BUY') {
      this.position = 'LONG';
    } else if (action === 'SELL') {
      this.position = null;
    }
  }
  
  calculateBollingerBands(prices, period, stdDev) {
    const bands = [];
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = this.calculateAverage(slice);
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      bands.push({
        upper: mean + (standardDeviation * stdDev),
        middle: mean,
        lower: mean - (standardDeviation * stdDev)
      });
    }
    
    return bands;
  }
  
  calculateAverage(values) {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
}
`
    });

    // Pairs Trading Strategy
    this.templates.set("pairs_trading", {
      id: "pairs_trading",
      name: "Statistical Arbitrage Pairs Trading",
      description: "Trade the spread between two correlated stocks",
      category: "PAIRS_TRADING",
      riskLevel: "MEDIUM",
      complexity: "ADVANCED",
      estimatedReturns: "12-18% annually",
      marketConditions: "Market neutral strategy, works in all conditions",
      parameters: [
        {
          name: "lookbackPeriod",
          type: "NUMBER",
          defaultValue: 60,
          description: "Lookback period for spread calculation",
          min: 30,
          max: 252
        },
        {
          name: "entryThreshold",
          type: "NUMBER",
          defaultValue: 2,
          description: "Z-score threshold for entry",
          min: 1,
          max: 3
        },
        {
          name: "exitThreshold",
          type: "NUMBER",
          defaultValue: 0.5,
          description: "Z-score threshold for exit",
          min: 0,
          max: 1
        },
        {
          name: "stopLoss",
          type: "NUMBER",
          defaultValue: 3,
          description: "Stop loss z-score threshold",
          min: 2,
          max: 5
        }
      ],
      code: `
// Pairs Trading Strategy
class PairsTradingStrategy {
  constructor(params) {
    this.lookbackPeriod = params.lookbackPeriod || 60;
    this.entryThreshold = params.entryThreshold || 2;
    this.exitThreshold = params.exitThreshold || 0.5;
    this.stopLoss = params.stopLoss || 3;
    this.position = null;
  }

  analyze(stockAData, stockBData) {
    if (stockAData.length < this.lookbackPeriod || stockBData.length < this.lookbackPeriod) {
      return null;
    }
    
    const pricesA = stockAData.map(d => d.close);
    const pricesB = stockBData.map(d => d.close);
    const spread = this.calculateSpread(pricesA, pricesB);
    const zScore = this.calculateZScore(spread, this.lookbackPeriod);
    
    if (zScore.length === 0) return null;
    
    const currentZScore = zScore[zScore.length - 1];
    const currentPriceA = pricesA[pricesA.length - 1];
    const currentPriceB = pricesB[pricesB.length - 1];
    
    // Entry signals
    if (!this.position) {
      if (currentZScore > this.entryThreshold) {
        // Spread is too high - sell A, buy B
        return {
          trades: [
            { action: 'SELL', symbol: 'A', quantity: 1, price: currentPriceA },
            { action: 'BUY', symbol: 'B', quantity: 1, price: currentPriceB }
          ],
          reason: \`Spread divergence: z-score \${currentZScore.toFixed(2)}\`
        };
      } else if (currentZScore < -this.entryThreshold) {
        // Spread is too low - buy A, sell B
        return {
          trades: [
            { action: 'BUY', symbol: 'A', quantity: 1, price: currentPriceA },
            { action: 'SELL', symbol: 'B', quantity: 1, price: currentPriceB }
          ],
          reason: \`Spread convergence: z-score \${currentZScore.toFixed(2)}\`
        };
      }
    }
    
    // Exit signals
    if (this.position) {
      const shouldExit = Math.abs(currentZScore) < this.exitThreshold ||
                        Math.abs(currentZScore) > this.stopLoss;
      
      if (shouldExit) {
        // Close positions
        const exitReason = Math.abs(currentZScore) > this.stopLoss ? 'Stop loss' : 'Mean reversion';
        return {
          trades: [
            { action: this.position === 'LONG_A' ? 'SELL' : 'BUY', symbol: 'A', quantity: 1, price: currentPriceA },
            { action: this.position === 'LONG_A' ? 'BUY' : 'SELL', symbol: 'B', quantity: 1, price: currentPriceB }
          ],
          reason: \`\${exitReason}: z-score \${currentZScore.toFixed(2)}\`
        };
      }
    }
    
    return null;
  }
  
  onTrade(trades) {
    if (trades.length === 2) {
      const tradeA = trades.find(t => t.symbol === 'A');
      if (tradeA.action === 'BUY') {
        this.position = 'LONG_A';
      } else {
        this.position = 'SHORT_A';
      }
    } else {
      this.position = null;
    }
  }
  
  calculateSpread(pricesA, pricesB) {
    return pricesA.map((priceA, i) => priceA - pricesB[i]);
  }
  
  calculateZScore(spread, period) {
    const zScores = [];
    
    for (let i = period - 1; i < spread.length; i++) {
      const slice = spread.slice(i - period + 1, i + 1);
      const mean = slice.reduce((sum, val) => sum + val, 0) / slice.length;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / slice.length;
      const stdDev = Math.sqrt(variance);
      
      zScores.push(stdDev === 0 ? 0 : (spread[i] - mean) / stdDev);
    }
    
    return zScores;
  }
}
`
    });
  }

  getTemplates(): StrategyTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplatesByCategory(category: StrategyTemplate["category"]): StrategyTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.category === category);
  }

  getTemplate(id: string): StrategyTemplate | undefined {
    return this.templates.get(id);
  }

  getTemplatesByComplexity(complexity: StrategyTemplate["complexity"]): StrategyTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.complexity === complexity);
  }

  createStrategyFromTemplate(templateId: string, customParameters: Record<string, any> = {}): {
    code: string;
    parameters: Record<string, any>;
  } | null {
    const template = this.templates.get(templateId);
    if (!template) return null;

    const parameters = template.parameters.reduce((acc, param) => {
      acc[param.name] = customParameters[param.name] !== undefined 
        ? customParameters[param.name] 
        : param.defaultValue;
      return acc;
    }, {} as Record<string, any>);

    return {
      code: template.code,
      parameters
    };
  }

  validateParameters(templateId: string, parameters: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const template = this.templates.get(templateId);
    if (!template) {
      return { valid: false, errors: ["Template not found"] };
    }

    const errors: string[] = [];

    template.parameters.forEach(param => {
      const value = parameters[param.name];
      
      if (value === undefined || value === null) {
        errors.push(`Parameter '${param.name}' is required`);
        return;
      }

      switch (param.type) {
        case "NUMBER":
          if (typeof value !== "number") {
            errors.push(`Parameter '${param.name}' must be a number`);
          } else {
            if (param.min !== undefined && value < param.min) {
              errors.push(`Parameter '${param.name}' must be >= ${param.min}`);
            }
            if (param.max !== undefined && value > param.max) {
              errors.push(`Parameter '${param.name}' must be <= ${param.max}`);
            }
          }
          break;
        case "BOOLEAN":
          if (typeof value !== "boolean") {
            errors.push(`Parameter '${param.name}' must be a boolean`);
          }
          break;
        case "SELECT":
          if (param.options && !param.options.includes(value)) {
            errors.push(`Parameter '${param.name}' must be one of: ${param.options.join(", ")}`);
          }
          break;
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const strategyTemplatesService = new StrategyTemplatesService();