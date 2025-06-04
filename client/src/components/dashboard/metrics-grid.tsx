import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, Activity, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  totalPortfolioValue: number;
  activeStrategiesCount: number;
  todayPnL: number;
  todayTradesCount: number;
}

export function MetricsGrid() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number, base: number) => {
    const percentage = (value / base) * 100;
    return `${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const portfolioChangePercentage = stats.todayPnL ? formatPercentage(stats.todayPnL, stats.totalPortfolioValue - stats.todayPnL) : "+0%";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Portfolio Value */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs text-green-500 bg-green-500/20 px-2 py-1 rounded">
              {portfolioChangePercentage}
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-1">
            {formatCurrency(stats.totalPortfolioValue)}
          </h3>
          <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
        </CardContent>
      </Card>

      {/* Active Strategies */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Active</span>
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-1">
            {stats.activeStrategiesCount}
          </h3>
          <p className="text-sm text-muted-foreground">Active Strategies</p>
        </CardContent>
      </Card>

      {/* Today's P&L */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-xs text-green-500 bg-green-500/20 px-2 py-1 rounded">
              +{((stats.todayPnL / (stats.totalPortfolioValue - stats.todayPnL)) * 100).toFixed(1)}%
            </span>
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-1">
            {stats.todayPnL >= 0 ? "+" : ""}{formatCurrency(stats.todayPnL)}
          </h3>
          <p className="text-sm text-muted-foreground">Today's P&L</p>
        </CardContent>
      </Card>

      {/* Today's Trades */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">24h</span>
          </div>
          <h3 className="text-2xl font-semibold text-foreground mb-1">
            {stats.todayTradesCount}
          </h3>
          <p className="text-sm text-muted-foreground">Trades Today</p>
        </CardContent>
      </Card>
    </div>
  );
}
