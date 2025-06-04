import { storage } from "../storage";
import { marketDataService } from "./market-data";

interface PriceAlert {
  id: number;
  userId: number;
  symbol: string;
  alertType: "PRICE_ABOVE" | "PRICE_BELOW" | "PRICE_CHANGE" | "VOLUME_SPIKE";
  targetValue: number;
  currentValue: number;
  isActive: boolean;
  message: string;
  createdAt: Date;
  triggeredAt?: Date;
}

interface NotificationChannel {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

interface Alert {
  id: number;
  userId: number;
  type: "TRADE_EXECUTED" | "RISK_BREACH" | "PRICE_ALERT" | "SYSTEM" | "STRATEGY";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  channels: NotificationChannel;
  createdAt: Date;
}

export class AlertsService {
  private priceAlerts: Map<number, PriceAlert> = new Map();
  private activeAlerts: Map<number, Alert> = new Map();
  private alertIdCounter = 1;

  async createPriceAlert(
    userId: number,
    symbol: string,
    alertType: PriceAlert["alertType"],
    targetValue: number,
    message?: string
  ): Promise<PriceAlert> {
    const alert: PriceAlert = {
      id: this.alertIdCounter++,
      userId,
      symbol,
      alertType,
      targetValue,
      currentValue: 0,
      isActive: true,
      message: message || `${symbol} ${alertType.replace('_', ' ').toLowerCase()} ${targetValue}`,
      createdAt: new Date()
    };

    this.priceAlerts.set(alert.id, alert);
    return alert;
  }

  async createSystemAlert(
    userId: number,
    type: Alert["type"],
    severity: Alert["severity"],
    title: string,
    message: string,
    data?: any,
    channels: Partial<NotificationChannel> = {}
  ): Promise<Alert> {
    const alert: Alert = {
      id: this.alertIdCounter++,
      userId,
      type,
      severity,
      title,
      message,
      data,
      isRead: false,
      channels: {
        email: false,
        sms: false,
        push: false,
        inApp: true,
        ...channels
      },
      createdAt: new Date()
    };

    this.activeAlerts.set(alert.id, alert);
    await this.processNotification(alert);
    return alert;
  }

  async checkPriceAlerts(): Promise<void> {
    const activeAlerts = Array.from(this.priceAlerts.values()).filter(alert => alert.isActive);
    
    for (const alert of activeAlerts) {
      try {
        // Get current price from market data
        const response = await marketDataService.searchInstruments(alert.symbol);
        if (response.status === "success" && response.data?.data?.length > 0) {
          const instrument = response.data.data[0];
          const ltpResponse = await marketDataService.getLTP("NSE", instrument.tradingsymbol, instrument.symboltoken);
          
          if (ltpResponse.status === "success" && ltpResponse.data?.data) {
            const currentPrice = ltpResponse.data.data.ltp;
            alert.currentValue = currentPrice;

            let triggered = false;
            switch (alert.alertType) {
              case "PRICE_ABOVE":
                triggered = currentPrice > alert.targetValue;
                break;
              case "PRICE_BELOW":
                triggered = currentPrice < alert.targetValue;
                break;
              case "PRICE_CHANGE":
                const changePercent = Math.abs((currentPrice - alert.targetValue) / alert.targetValue * 100);
                triggered = changePercent > 5; // 5% change threshold
                break;
              case "VOLUME_SPIKE":
                // Volume spike logic would need historical volume data
                break;
            }

            if (triggered) {
              await this.triggerPriceAlert(alert, currentPrice);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to check price alert for ${alert.symbol}:`, error);
      }
    }
  }

  private async triggerPriceAlert(alert: PriceAlert, currentPrice: number): Promise<void> {
    alert.isActive = false;
    alert.triggeredAt = new Date();

    await this.createSystemAlert(
      alert.userId,
      "PRICE_ALERT",
      "MEDIUM",
      `Price Alert: ${alert.symbol}`,
      `${alert.message}. Current price: ₹${currentPrice.toFixed(2)}`,
      { alert, currentPrice },
      { email: true, push: true, inApp: true }
    );
  }

  async createTradeAlert(
    userId: number,
    tradeData: any,
    channels: Partial<NotificationChannel> = {}
  ): Promise<Alert> {
    const pnlText = tradeData.pnl ? ` (P&L: ₹${tradeData.pnl.toFixed(2)})` : '';
    
    return await this.createSystemAlert(
      userId,
      "TRADE_EXECUTED",
      "MEDIUM",
      "Trade Executed",
      `${tradeData.side} ${tradeData.quantity} ${tradeData.symbol} @ ₹${tradeData.price}${pnlText}`,
      tradeData,
      { inApp: true, push: true, ...channels }
    );
  }

  async createRiskAlert(
    userId: number,
    riskType: string,
    severity: Alert["severity"],
    message: string,
    data?: any
  ): Promise<Alert> {
    return await this.createSystemAlert(
      userId,
      "RISK_BREACH",
      severity,
      `Risk Alert: ${riskType}`,
      message,
      data,
      { email: true, sms: severity === "CRITICAL", push: true, inApp: true }
    );
  }

  async createStrategyAlert(
    userId: number,
    strategyName: string,
    event: string,
    message: string,
    data?: any
  ): Promise<Alert> {
    return await this.createSystemAlert(
      userId,
      "STRATEGY",
      "LOW",
      `Strategy: ${strategyName}`,
      `${event}: ${message}`,
      data,
      { inApp: true, push: true }
    );
  }

  async getUserAlerts(userId: number, unreadOnly: boolean = false): Promise<Alert[]> {
    const userAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.userId === userId);
    
    if (unreadOnly) {
      return userAlerts.filter(alert => !alert.isRead);
    }
    
    return userAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAlertAsRead(alertId: number): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.isRead = true;
      return true;
    }
    return false;
  }

  async getUserPriceAlerts(userId: number): Promise<PriceAlert[]> {
    return Array.from(this.priceAlerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deletePriceAlert(alertId: number): Promise<boolean> {
    return this.priceAlerts.delete(alertId);
  }

  private async processNotification(alert: Alert): Promise<void> {
    // In-app notifications are handled by storing in activeAlerts
    
    if (alert.channels.email) {
      await this.sendEmailNotification(alert);
    }
    
    if (alert.channels.sms) {
      await this.sendSMSNotification(alert);
    }
    
    if (alert.channels.push) {
      await this.sendPushNotification(alert);
    }
  }

  private async sendEmailNotification(alert: Alert): Promise<void> {
    // Email notification implementation
    console.log(`Email notification: ${alert.title} - ${alert.message}`);
    // Integration with email service (SendGrid, AWS SES, etc.)
  }

  private async sendSMSNotification(alert: Alert): Promise<void> {
    // SMS notification implementation
    console.log(`SMS notification: ${alert.title} - ${alert.message}`);
    // Integration with SMS service (Twilio, AWS SNS, etc.)
  }

  private async sendPushNotification(alert: Alert): Promise<void> {
    // Push notification implementation
    console.log(`Push notification: ${alert.title} - ${alert.message}`);
    // Integration with push service (Firebase, OneSignal, etc.)
  }

  // Start monitoring service
  async startMonitoring(): Promise<void> {
    // Check price alerts every 30 seconds
    setInterval(async () => {
      await this.checkPriceAlerts();
    }, 30000);
  }

  async getAlertStatistics(userId: number): Promise<{
    totalAlerts: number;
    unreadCount: number;
    activePriceAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
  }> {
    const userAlerts = await this.getUserAlerts(userId);
    const priceAlerts = await this.getUserPriceAlerts(userId);
    
    const unreadCount = userAlerts.filter(alert => !alert.isRead).length;
    const activePriceAlerts = priceAlerts.filter(alert => alert.isActive).length;
    
    const alertsByType = userAlerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const alertsBySeverity = userAlerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAlerts: userAlerts.length,
      unreadCount,
      activePriceAlerts,
      alertsByType,
      alertsBySeverity
    };
  }
}

export const alertsService = new AlertsService();