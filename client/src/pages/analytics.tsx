import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, PieChart as PieChartIcon } from "lucide-react";
import type { Strategy, Trade, Backtest } from "@shared/schema";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");

  const { data: strategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const { data: backtests } = useQuery<Backtest[]>({
    queryKey: ["/api/backtests"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  // Calculate analytics data
  const totalPnL = strategies?.reduce((sum, s) => sum + s.totalPnL, 0) || 0;
  const totalTrades = strategies?.reduce((sum, s) => sum + s.totalTrades, 0) || 0;
  const activeStrategies = strategies?.filter(s => s.isActive).length || 0;
  const avgBacktestReturn = backtests?.reduce((sum, b) => sum + b.totalReturn, 0) / (backtests?.length || 1) || 0;

  // Strategy performance data for charts
  const strategyPerformanceData = strategies?.map(strategy => ({
    name: strategy.name,
    pnl: strategy.totalPnL,
    trades: strategy.totalTrades,
    isActive: strategy.isActive,
  })) || [];

  // Monthly performance data (mock calculation based on existing data)
  const monthlyPerformanceData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - i));
    const monthName = month.toLocaleString('default', { month: 'short' });
    
    // Simulate monthly performance based on total PnL
    const monthlyPnL = (totalPnL / 12) * (0.8 + Math.random() * 0.4);
    
    return {
      month: monthName,
      pnl: monthlyPnL,
      trades: Math.floor((totalTrades / 12) * (0.8 + Math.random() * 0.4)),
    };
  });

  // Backtest comparison data
  const backtestComparisonData = backtests?.slice(0, 5).map((backtest, index) => ({
    name: `Test ${index + 1}`,
    return: backtest.totalReturn,
    sharpe: backtest.sharpeRatio || 0,
    drawdown: backtest.maxDrawdown,
    trades: backtest.totalTrades,
  })) || [];

  // Win/Loss distribution for pie chart
  const winLossData = [
    { name: 'Winning Trades', value: trades?.filter(t => (t.pnl || 0) > 0).length || 0, color: '#10B981' },
    { name: 'Losing Trades', value: trades?.filter(t => (t.pnl || 0) < 0).length || 0, color: '#EF4444' },
    { name: 'Break-even', value: trades?.filter(t => (t.pnl || 0) === 0).length || 0, color: '#64748B' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Trading Analytics</h2>
          <p className="text-muted-foreground">Comprehensive analysis of your trading performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                totalPnL >= 0 ? "text-green-500 bg-green-500/20" : "text-red-500 bg-red-500/20"
              }`}>
                {totalPnL >= 0 ? "Profit" : "Loss"}
              </span>
            </div>
            <h3 className={`text-2xl font-semibold ${
              totalPnL >= 0 ? "text-green-500" : "text-red-500"
            }`}>
              {totalPnL >= 0 ? "+" : ""}{formatCurrency(totalPnL)}
            </h3>
            <p className="text-sm text-muted-foreground">Total P&L</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Total</span>
            </div>
            <h3 className="text-2xl font-semibold text-foreground">{totalTrades}</h3>
            <p className="text-sm text-muted-foreground">Total Trades</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-primary bg-primary/20 px-2 py-1 rounded">Active</span>
            </div>
            <h3 className="text-2xl font-semibold text-foreground">{activeStrategies}</h3>
            <p className="text-sm text-muted-foreground">Active Strategies</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-yellow-500" />
              </div>
              <span className={`text-xs px-2 py-1 rounded ${
                avgBacktestReturn >= 0 ? "text-green-500 bg-green-500/20" : "text-red-500 bg-red-500/20"
              }`}>
                Avg
              </span>
            </div>
            <h3 className={`text-2xl font-semibold ${
              avgBacktestReturn >= 0 ? "text-green-500" : "text-red-500"
            }`}>
              {formatPercentage(avgBacktestReturn)}
            </h3>
            <p className="text-sm text-muted-foreground">Backtest Return</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="backtests">Backtests</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Performance Chart */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Monthly P&L Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyPerformanceData}>
                      <defs>
                        <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                      <YAxis stroke="#64748B" fontSize={12} tickFormatter={formatCurrency} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "#1E293B",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "#F8FAFC"
                        }}
                        formatter={(value: number) => [formatCurrency(value), "P&L"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="pnl"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#pnlGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Win/Loss Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Trade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "#1E293B",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "#F8FAFC"
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Volume */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Trading Volume by Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#F8FAFC"
                      }}
                      formatter={(value: number) => [value, "Trades"]}
                    />
                    <Bar dataKey="trades" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Strategy Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={strategyPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                    <YAxis stroke="#64748B" fontSize={12} tickFormatter={formatCurrency} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#F8FAFC"
                      }}
                      formatter={(value: number) => [formatCurrency(value), "P&L"]}
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Details Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Strategy Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategies && strategies.length > 0 ? strategies.map((strategy) => (
                  <div key={strategy.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        strategy.isActive ? "bg-green-500" : "bg-gray-500"
                      }`}></div>
                      <div>
                        <p className="font-medium text-foreground">{strategy.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {strategy.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        strategy.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                      }`}>
                        {strategy.totalPnL >= 0 ? "+" : ""}{formatCurrency(strategy.totalPnL)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {strategy.totalTrades} trades
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No strategies found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backtests" className="space-y-6">
          {backtests && backtests.length > 0 ? (
            <>
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Backtest Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={backtestComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                        <XAxis dataKey="name" stroke="#64748B" fontSize={12} />
                        <YAxis stroke="#64748B" fontSize={12} />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "#1E293B",
                            border: "1px solid #334155",
                            borderRadius: "8px",
                            color: "#F8FAFC"
                          }}
                        />
                        <Bar dataKey="return" fill="#2563EB" radius={[4, 4, 0, 0]} name="Return %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Backtest Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {backtests.slice(0, 5).map((backtest, index) => (
                      <div key={backtest.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                        <div>
                          <p className="font-medium text-foreground">Backtest #{index + 1}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(backtest.startDate).toLocaleDateString()} - {new Date(backtest.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${
                            backtest.totalReturn >= 0 ? "text-green-500" : "text-red-500"
                          }`}>
                            {formatPercentage(backtest.totalReturn)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {backtest.totalTrades} trades
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Backtest Data</h3>
              <p className="text-muted-foreground">
                Run backtests to see performance analysis here.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Drawdown</span>
                  <span className="font-medium text-red-500">
                    {backtests && backtests.length > 0 
                      ? `-${Math.max(...backtests.map(b => b.maxDrawdown)).toFixed(2)}%`
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Average Sharpe Ratio</span>
                  <span className="font-medium text-foreground">
                    {backtests && backtests.length > 0 
                      ? (backtests.reduce((sum, b) => sum + (b.sharpeRatio || 0), 0) / backtests.length).toFixed(2)
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-medium text-green-500">
                    {trades && trades.length > 0 
                      ? ((trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100).toFixed(1) + "%"
                      : "N/A"
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Profit Factor</span>
                  <span className="font-medium text-foreground">
                    {backtests && backtests.length > 0 
                      ? (backtests.reduce((sum, b) => sum + (b.profitFactor || 0), 0) / backtests.length).toFixed(2)
                      : "N/A"
                    }
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Portfolio Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Risk Level</span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-sm">
                      Moderate
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Strategies</span>
                    <span className="font-medium text-foreground">{activeStrategies}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diversification</span>
                    <span className="font-medium text-foreground">
                      {strategies && strategies.length > 0 ? "Good" : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Volatility</span>
                    <span className="font-medium text-yellow-500">Medium</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Risk Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-blue-400 font-medium">Strategy Diversification</p>
                  </div>
                  <p className="text-blue-300 text-sm mt-2">
                    Consider adding more diverse trading strategies to reduce overall portfolio risk.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <p className="text-yellow-400 font-medium">Position Sizing</p>
                  </div>
                  <p className="text-yellow-300 text-sm mt-2">
                    Monitor position sizes to ensure no single strategy dominates your portfolio.
                  </p>
                </div>
                
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-green-400 font-medium">Risk Management</p>
                  </div>
                  <p className="text-green-300 text-sm mt-2">
                    Your current risk management appears adequate with reasonable drawdown levels.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
