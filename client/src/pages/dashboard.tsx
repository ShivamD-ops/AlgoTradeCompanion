import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Play, BarChart } from "lucide-react";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { StrategiesSidebar } from "@/components/dashboard/strategies-sidebar";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { MarketDataWidget } from "@/components/market-data-widget";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRefresh = () => {
    queryClient.invalidateQueries();
    toast({
      title: "Data Refreshed",
      description: "Dashboard data has been updated.",
    });
  };

  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-foreground">Dashboard Overview</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-muted-foreground">
              Last updated: <span>{new Date().toLocaleTimeString()}</span>
            </span>
            <Button onClick={handleRefresh} className="bg-primary hover:bg-primary/90">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <MetricsGrid />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <PerformanceChart />

        {/* Sidebar */}
        <div className="space-y-6">
          <StrategiesSidebar />
          <RecentActivity />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Create Strategy</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Build and deploy a new algorithmic trading strategy
            </p>
            <Link href="/strategies">
              <Button className="w-full bg-primary hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <BarChart className="w-5 h-5 text-yellow-500" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Run Backtest</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Test your strategy against historical market data
            </p>
            <Link href="/backtesting">
              <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                Start Testing
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Deploy Live</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Deploy your tested strategy to live trading
            </p>
            <Link href="/live-trading">
              <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                Deploy Now
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
