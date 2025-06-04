import { storage } from "../storage";
import { marketDataService } from "./market-data";
import { alertsService } from "./alerts";

interface BracketOrder {
  id: string;
  userId: number;
  symbol: string;
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  entryOrderId?: string;
  stopLossOrderId?: string;
  takeProfitOrderId?: string;
  createdAt: Date;
  executedAt?: Date;
}

interface TrailingStopOrder {
  id: string;
  userId: number;
  symbol: string;
  quantity: number;
  trailAmount: number;
  trailPercent?: number;
  highestPrice: number;
  currentStopPrice: number;
  status: "ACTIVE" | "TRIGGERED" | "CANCELLED";
  createdAt: Date;
  triggeredAt?: Date;
}

interface IcebergOrder {
  id: string;
  userId: number;
  symbol: string;
  totalQuantity: number;
  visibleQuantity: number;
  price: number;
  side: "BUY" | "SELL";
  executedQuantity: number;
  remainingQuantity: number;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  childOrders: string[];
  createdAt: Date;
}

interface TimeBasedOrder {
  id: string;
  userId: number;
  symbol: string;
  quantity: number;
  price?: number;
  orderType: "MARKET" | "LIMIT";
  side: "BUY" | "SELL";
  scheduleType: "SPECIFIC_TIME" | "INTERVAL" | "MARKET_OPEN" | "MARKET_CLOSE";
  executeAt?: Date;
  intervalMinutes?: number;
  maxExecutions?: number;
  executionCount: number;
  status: "SCHEDULED" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
}

export class AdvancedOrdersService {
  private bracketOrders: Map<string, BracketOrder> = new Map();
  private trailingStopOrders: Map<string, TrailingStopOrder> = new Map();
  private icebergOrders: Map<string, IcebergOrder> = new Map();
  private timeBasedOrders: Map<string, TimeBasedOrder> = new Map();
  private orderIdCounter = 1;

  constructor() {
    this.startOrderMonitoring();
  }

  // Bracket Orders
  async createBracketOrder(
    userId: number,
    symbol: string,
    quantity: number,
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
  ): Promise<BracketOrder> {
    const order: BracketOrder = {
      id: `BO_${this.orderIdCounter++}`,
      userId,
      symbol,
      quantity,
      entryPrice,
      stopLoss,
      takeProfit,
      status: "PENDING",
      createdAt: new Date()
    };

    this.bracketOrders.set(order.id, order);

    // Place entry order
    try {
      const entryOrderResponse = await marketDataService.placeOrder({
        tradingsymbol: symbol,
        quantity,
        price: entryPrice,
        transactiontype: "BUY",
        ordertype: "LIMIT",
        producttype: "BRACKET",
        duration: "DAY"
      });

      if (entryOrderResponse.status === "success") {
        order.entryOrderId = entryOrderResponse.data?.orderid;
        order.status = "ACTIVE";
        
        await alertsService.createSystemAlert(
          userId,
          "SYSTEM",
          "LOW",
          "Bracket Order Created",
          `Bracket order for ${symbol} created successfully`,
          order
        );
      }
    } catch (error) {
      order.status = "CANCELLED";
      console.error("Failed to place bracket order:", error);
    }

    return order;
  }

  // Trailing Stop Orders
  async createTrailingStopOrder(
    userId: number,
    symbol: string,
    quantity: number,
    trailAmount: number,
    trailPercent?: number
  ): Promise<TrailingStopOrder> {
    // Get current market price
    const searchResponse = await marketDataService.searchInstruments(symbol);
    if (searchResponse.status !== "success" || !searchResponse.data?.data?.length) {
      throw new Error("Unable to get current market price");
    }

    const instrument = searchResponse.data.data[0];
    const ltpResponse = await marketDataService.getLTP("NSE", instrument.tradingsymbol, instrument.symboltoken);
    
    if (ltpResponse.status !== "success") {
      throw new Error("Unable to get current market price");
    }

    const currentPrice = ltpResponse.data.data.ltp;
    const stopPrice = trailPercent 
      ? currentPrice * (1 - trailPercent / 100)
      : currentPrice - trailAmount;

    const order: TrailingStopOrder = {
      id: `TS_${this.orderIdCounter++}`,
      userId,
      symbol,
      quantity,
      trailAmount,
      trailPercent,
      highestPrice: currentPrice,
      currentStopPrice: stopPrice,
      status: "ACTIVE",
      createdAt: new Date()
    };

    this.trailingStopOrders.set(order.id, order);

    await alertsService.createSystemAlert(
      userId,
      "SYSTEM",
      "LOW",
      "Trailing Stop Created",
      `Trailing stop order for ${symbol} created at ₹${stopPrice.toFixed(2)}`,
      order
    );

    return order;
  }

  // Iceberg Orders
  async createIcebergOrder(
    userId: number,
    symbol: string,
    totalQuantity: number,
    visibleQuantity: number,
    price: number,
    side: "BUY" | "SELL"
  ): Promise<IcebergOrder> {
    const order: IcebergOrder = {
      id: `IC_${this.orderIdCounter++}`,
      userId,
      symbol,
      totalQuantity,
      visibleQuantity,
      price,
      side,
      executedQuantity: 0,
      remainingQuantity: totalQuantity,
      status: "ACTIVE",
      childOrders: [],
      createdAt: new Date()
    };

    this.icebergOrders.set(order.id, order);
    await this.processIcebergOrder(order);

    return order;
  }

  private async processIcebergOrder(order: IcebergOrder): Promise<void> {
    if (order.remainingQuantity <= 0 || order.status !== "ACTIVE") {
      return;
    }

    const quantityToOrder = Math.min(order.visibleQuantity, order.remainingQuantity);

    try {
      const orderResponse = await marketDataService.placeOrder({
        tradingsymbol: order.symbol,
        quantity: quantityToOrder,
        price: order.price,
        transactiontype: order.side,
        ordertype: "LIMIT",
        producttype: "DELIVERY",
        duration: "DAY"
      });

      if (orderResponse.status === "success") {
        order.childOrders.push(orderResponse.data?.orderid);
        order.executedQuantity += quantityToOrder;
        order.remainingQuantity -= quantityToOrder;

        if (order.remainingQuantity <= 0) {
          order.status = "COMPLETED";
        }
      }
    } catch (error) {
      console.error("Failed to process iceberg order:", error);
    }
  }

  // Time-Based Orders
  async createTimeBasedOrder(
    userId: number,
    symbol: string,
    quantity: number,
    side: "BUY" | "SELL",
    scheduleType: TimeBasedOrder["scheduleType"],
    options: {
      price?: number;
      orderType?: "MARKET" | "LIMIT";
      executeAt?: Date;
      intervalMinutes?: number;
      maxExecutions?: number;
    } = {}
  ): Promise<TimeBasedOrder> {
    const order: TimeBasedOrder = {
      id: `TB_${this.orderIdCounter++}`,
      userId,
      symbol,
      quantity,
      price: options.price,
      orderType: options.orderType || "MARKET",
      side,
      scheduleType,
      executeAt: options.executeAt,
      intervalMinutes: options.intervalMinutes,
      maxExecutions: options.maxExecutions || 1,
      executionCount: 0,
      status: "SCHEDULED",
      createdAt: new Date()
    };

    this.timeBasedOrders.set(order.id, order);

    await alertsService.createSystemAlert(
      userId,
      "SYSTEM",
      "LOW",
      "Time-Based Order Scheduled",
      `${scheduleType.replace('_', ' ')} order for ${symbol} scheduled`,
      order
    );

    return order;
  }

  // Order Monitoring
  private async startOrderMonitoring(): Promise<void> {
    // Monitor trailing stops every 10 seconds
    setInterval(async () => {
      await this.updateTrailingStops();
    }, 10000);

    // Monitor time-based orders every minute
    setInterval(async () => {
      await this.processTimeBasedOrders();
    }, 60000);

    // Monitor iceberg orders every 30 seconds
    setInterval(async () => {
      await this.monitorIcebergOrders();
    }, 30000);
  }

  private async updateTrailingStops(): Promise<void> {
    const activeOrders = Array.from(this.trailingStopOrders.values())
      .filter(order => order.status === "ACTIVE");

    for (const order of activeOrders) {
      try {
        const searchResponse = await marketDataService.searchInstruments(order.symbol);
        if (searchResponse.status !== "success") continue;

        const instrument = searchResponse.data.data[0];
        const ltpResponse = await marketDataService.getLTP("NSE", instrument.tradingsymbol, instrument.symboltoken);
        
        if (ltpResponse.status !== "success") continue;

        const currentPrice = ltpResponse.data.data.ltp;

        // Update highest price if current price is higher
        if (currentPrice > order.highestPrice) {
          order.highestPrice = currentPrice;
          
          // Update stop price
          order.currentStopPrice = order.trailPercent
            ? order.highestPrice * (1 - order.trailPercent / 100)
            : order.highestPrice - order.trailAmount;
        }

        // Check if stop should be triggered
        if (currentPrice <= order.currentStopPrice) {
          await this.triggerTrailingStop(order, currentPrice);
        }
      } catch (error) {
        console.error(`Failed to update trailing stop for ${order.symbol}:`, error);
      }
    }
  }

  private async triggerTrailingStop(order: TrailingStopOrder, currentPrice: number): Promise<void> {
    order.status = "TRIGGERED";
    order.triggeredAt = new Date();

    try {
      // Place market sell order
      await marketDataService.placeOrder({
        tradingsymbol: order.symbol,
        quantity: order.quantity,
        transactiontype: "SELL",
        ordertype: "MARKET",
        producttype: "DELIVERY",
        duration: "DAY"
      });

      await alertsService.createSystemAlert(
        order.userId,
        "TRADE_EXECUTED",
        "MEDIUM",
        "Trailing Stop Triggered",
        `Trailing stop for ${order.symbol} triggered at ₹${currentPrice.toFixed(2)}`,
        order
      );
    } catch (error) {
      console.error("Failed to execute trailing stop:", error);
    }
  }

  private async processTimeBasedOrders(): Promise<void> {
    const scheduledOrders = Array.from(this.timeBasedOrders.values())
      .filter(order => order.status === "SCHEDULED" || order.status === "ACTIVE");

    const now = new Date();

    for (const order of scheduledOrders) {
      let shouldExecute = false;

      switch (order.scheduleType) {
        case "SPECIFIC_TIME":
          shouldExecute = order.executeAt && now >= order.executeAt;
          break;
        case "INTERVAL":
          if (order.status === "SCHEDULED") {
            order.status = "ACTIVE";
            shouldExecute = true;
          } else if (order.intervalMinutes) {
            const lastExecution = order.createdAt;
            const nextExecution = new Date(lastExecution.getTime() + order.intervalMinutes * 60000);
            shouldExecute = now >= nextExecution;
          }
          break;
        case "MARKET_OPEN":
          // Simplified - assume market opens at 9:15 AM
          shouldExecute = now.getHours() === 9 && now.getMinutes() >= 15 && order.executionCount === 0;
          break;
        case "MARKET_CLOSE":
          // Simplified - assume market closes at 3:30 PM
          shouldExecute = now.getHours() === 15 && now.getMinutes() >= 30 && order.executionCount === 0;
          break;
      }

      if (shouldExecute && order.executionCount < order.maxExecutions) {
        await this.executeTimeBasedOrder(order);
      }
    }
  }

  private async executeTimeBasedOrder(order: TimeBasedOrder): Promise<void> {
    try {
      const orderResponse = await marketDataService.placeOrder({
        tradingsymbol: order.symbol,
        quantity: order.quantity,
        price: order.price,
        transactiontype: order.side,
        ordertype: order.orderType,
        producttype: "DELIVERY",
        duration: "DAY"
      });

      if (orderResponse.status === "success") {
        order.executionCount++;
        
        if (order.executionCount >= order.maxExecutions) {
          order.status = "COMPLETED";
        }

        await alertsService.createSystemAlert(
          order.userId,
          "TRADE_EXECUTED",
          "MEDIUM",
          "Time-Based Order Executed",
          `${order.scheduleType.replace('_', ' ')} order for ${order.symbol} executed`,
          order
        );
      }
    } catch (error) {
      console.error("Failed to execute time-based order:", error);
    }
  }

  private async monitorIcebergOrders(): Promise<void> {
    const activeOrders = Array.from(this.icebergOrders.values())
      .filter(order => order.status === "ACTIVE");

    for (const order of activeOrders) {
      // Check if we need to place more child orders
      if (order.remainingQuantity > 0) {
        await this.processIcebergOrder(order);
      }
    }
  }

  // Getter methods for orders
  async getUserBracketOrders(userId: number): Promise<BracketOrder[]> {
    return Array.from(this.bracketOrders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserTrailingStops(userId: number): Promise<TrailingStopOrder[]> {
    return Array.from(this.trailingStopOrders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserIcebergOrders(userId: number): Promise<IcebergOrder[]> {
    return Array.from(this.icebergOrders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getUserTimeBasedOrders(userId: number): Promise<TimeBasedOrder[]> {
    return Array.from(this.timeBasedOrders.values())
      .filter(order => order.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Cancel orders
  async cancelBracketOrder(orderId: string): Promise<boolean> {
    const order = this.bracketOrders.get(orderId);
    if (order && order.status === "ACTIVE") {
      order.status = "CANCELLED";
      return true;
    }
    return false;
  }

  async cancelTrailingStop(orderId: string): Promise<boolean> {
    const order = this.trailingStopOrders.get(orderId);
    if (order && order.status === "ACTIVE") {
      order.status = "CANCELLED";
      return true;
    }
    return false;
  }

  async cancelIcebergOrder(orderId: string): Promise<boolean> {
    const order = this.icebergOrders.get(orderId);
    if (order && order.status === "ACTIVE") {
      order.status = "CANCELLED";
      return true;
    }
    return false;
  }

  async cancelTimeBasedOrder(orderId: string): Promise<boolean> {
    const order = this.timeBasedOrders.get(orderId);
    if (order && (order.status === "SCHEDULED" || order.status === "ACTIVE")) {
      order.status = "CANCELLED";
      return true;
    }
    return false;
  }
}

export const advancedOrdersService = new AdvancedOrdersService();