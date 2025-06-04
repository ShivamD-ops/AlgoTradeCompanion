import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { Backtest } from "@shared/schema";

interface BacktestResultsProps {
  backtest: Backtest;
}

export function BacktestResults({ backtest }: BacktestResultsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const winRate = backtest.totalTrades > 0 
    ? (backtest.winningTrades / backtest.totalTrades) * 100 
    : 0;

  const chartData = backtest.results?.dailyValues || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Total Return</div>
            <div className={`text-xl font-semibold ${
              backtest.totalReturn >= 0 ? "text-green-500" : "text-red-500"
            }`}>
              {formatPercentage(backtest.totalReturn)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(backtest.finalValue - backtest.initialCapital)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Max Drawdown</div>
            <div className="text-xl font-semibold text-red-500">
              -{formatPercentage(backtest.maxDrawdown)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Sharpe Ratio</div>
            <div className={`text-xl font-semibold ${
              (backtest.sharpeRatio || 0) >= 1 ? "text-green-500" : "text-yellow-500"
            }`}>
              {backtest.sharpeRatio?.toFixed(2) || "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Win Rate</div>
            <div className={`text-xl font-semibold ${
              winRate >= 50 ? "text-green-500" : "text-red-500"
            }`}>
              {winRate.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">
              {backtest.winningTrades}W / {backtest.losingTrades}L
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Value Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  stroke="#64748B"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#1E293B",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#F8FAFC"
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Portfolio Value"]}
                  labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Initial Capital</span>
              <span className="font-medium">{formatCurrency(backtest.initialCapital)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Final Value</span>
              <span className="font-medium">{formatCurrency(backtest.finalValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Trades</span>
              <span className="font-medium">{backtest.totalTrades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Profit Factor</span>
              <span className="font-medium">
                {backtest.profitFactor?.toFixed(2) || "N/A"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span className="font-medium">
                {new Date(backtest.startDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span className="font-medium">
                {new Date(backtest.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">
                {Math.ceil((new Date(backtest.endDate).getTime() - new Date(backtest.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <Badge variant="outline" className="text-green-500 border-green-500">
                {new Date(backtest.createdAt).toLocaleDateString()}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
