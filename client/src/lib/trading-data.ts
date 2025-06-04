export const generateMockChartData = (days: number = 7) => {
  const data = [];
  const baseValue = 24567.89;
  let currentValue = baseValue;

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * 0.05; // 5% max daily change
    currentValue *= (1 + change);
    
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));

    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(currentValue * 100) / 100,
      change: change * 100,
    });
  }

  return data;
};

export const tradingMockData = {
  portfolioMetrics: {
    totalValue: 24567.89,
    dailyChange: 8.3,
    dailyPnL: 1234.56,
    activeStrategies: 7,
    todayTrades: 43,
  },
  
  chartData: generateMockChartData(),
  
  activeStrategies: [
    {
      id: 1,
      name: "RSI Momentum",
      status: "Running",
      pnl: 567.23,
      trades: 12,
      isActive: true,
    },
    {
      id: 2,
      name: "MACD Cross",
      status: "Paused",
      pnl: -123.45,
      trades: 8,
      isActive: false,
    },
    {
      id: 3,
      name: "Bollinger Bands",
      status: "Running",
      pnl: 890.12,
      trades: 19,
      isActive: true,
    },
  ],
  
  recentActivity: [
    {
      id: 1,
      description: "RSI Momentum executed BUY order for AAPL",
      timestamp: "2 minutes ago",
      type: "success",
    },
    {
      id: 2,
      description: "MACD Cross stopped - risk threshold reached",
      timestamp: "5 minutes ago",
      type: "error",
    },
    {
      id: 3,
      description: "New strategy 'EMA Crossover' created",
      timestamp: "15 minutes ago",
      type: "info",
    },
    {
      id: 4,
      description: "Bollinger Bands executed SELL order for TSLA",
      timestamp: "22 minutes ago",
      type: "success",
    },
  ],
};
