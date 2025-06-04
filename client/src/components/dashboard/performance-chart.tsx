import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useState } from "react";
import { generateMockChartData } from "@/lib/trading-data";

export function PerformanceChart() {
  const [period, setPeriod] = useState("1W");
  
  const getPeriodDays = (period: string) => {
    switch (period) {
      case "1D": return 1;
      case "1W": return 7;
      case "1M": return 30;
      case "3M": return 90;
      case "1Y": return 365;
      default: return 7;
    }
  };

  const chartData = generateMockChartData(getPeriodDays(period));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const currentValue = chartData[chartData.length - 1]?.value || 0;
  const previousValue = chartData[0]?.value || 0;
  const totalChange = currentValue - previousValue;
  const percentageChange = ((totalChange / previousValue) * 100).toFixed(2);

  return (
    <Card className="lg:col-span-2 bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Portfolio Performance</CardTitle>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-24 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1D">1D</SelectItem>
              <SelectItem value="1W">1W</SelectItem>
              <SelectItem value="1M">1M</SelectItem>
              <SelectItem value="3M">3M</SelectItem>
              <SelectItem value="1Y">1Y</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <div className="mb-4">
            <div className="text-2xl font-semibold text-green-500">
              {formatCurrency(currentValue)}
            </div>
            <div className="text-sm text-muted-foreground">
              {totalChange >= 0 ? "+" : ""}{formatCurrency(totalChange)} ({totalChange >= 0 ? "+" : ""}{percentageChange}%)
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#64748B"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return period === "1D" ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                         period === "1W" ? date.toLocaleDateString([], { weekday: 'short' }) :
                         date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                }}
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
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
