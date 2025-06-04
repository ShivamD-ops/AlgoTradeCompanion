import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Pause, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  Shield,
  Zap
} from "lucide-react";
import type { Strategy, Trade, Position } from "@shared/schema";

export default function LiveTrading() {
  const [tradingMode, setTradingMode] = useState<"paper" | "live">("paper");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: strategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  const { data: positions } = useQuery<Position[]>({
    queryKey: ["/api/portfolio/positions"],
  });

  const toggleStrategyMutation = useMutation({
    mutationFn: async ({ strategyId, isActive }: { strategyId: number; isActive: boolean }) => {
      const response = await apiRequest("POST", `/api/strategies/${strategyId}/toggle`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Strategy Updated",
        description: "Strategy status updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update strategy",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const tradeDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - tradeDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const activeStrategies = strategies?.filter(s => s.isActive) || [];
  const recentTrades = trades?.slice(0, 10) || [];
  const totalPnL = strategies?.reduce((sum, s) => sum + s.totalPnL, 0) || 0;
  const todayTrades = trades?.filter(trade => {
    const today = new Date();
    const tradeDate = new Date(trade.executedAt);
    return tradeDate.toDateString() === today.toDateString();
  }) || [];

  const handleToggleStrategy = (strategyId: number, isActive: boolean) => {
    if (tradingMode === "live" && !isActive) {
      const confirmed = window.confirm(
        "You are about to activate a strategy in LIVE trading mode. This will use real money. Are you sure?"
      );
      if (!confirmed) return;
    }
    
    toggleStrategyMutation.mutate({ strategyId, isActive: !isActive });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Live Trading</h2>
          <p className="text-muted-foreground">Monitor and control your active trading strategies</p>
        </div>
        
        {/* Trading Mode Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Trading Mode:</span>
          </div>
          <div className="flex bg-card rounded-lg p-1 border border-border">
            <Button
              variant={tradingMode === "paper" ? "default" : "ghost"}
              size="sm"
              className={`px-4 py-2 text-sm transition-colors ${
                tradingMode === "paper" 
                  ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTradingMode("paper")}
            >
              Paper Trading
            </Button>
            <Button
              variant={tradingMode === "live" ? "default" : "ghost"}
              size="sm"
              className={`px-4 py-2 text-sm transition-colors ${
                tradingMode === "live" 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setTradingMode("live")}
            >
              Live Trading
            </Button>
          </div>
        </div>
      </div>

      {/* Warning for Live Mode */}
      {tradingMode === "live" && (
        <Card className="border-red-500 bg-red-500/10">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-red-500 font-medium">Live Trading Mode Active</p>
                <p className="text-red-400 text-sm">
                  You are in live trading mode. All trades will use real money. Please monitor your strategies carefully.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <Badge variant={activeStrategies.length > 0 ? "default" : "secondary"}>
                {activeStrategies.length} Active
              </Badge>
            </div>
            <h3 className="text-2xl font-semibold text-foreground">{activeStrategies.length}</h3>
            <p className="text-sm text-muted-foreground">Running Strategies</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
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
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Today</span>
            </div>
            <h3 className="text-2xl font-semibold text-foreground">{todayTrades.length}</h3>
            <p className="text-sm text-muted-foreground">Trades Executed</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-500" />
              </div>
              <span className="text-xs text-green-500 bg-green-500/20 px-2 py-1 rounded">Online</span>
            </div>
            <h3 className="text-2xl font-semibold text-foreground">{positions?.length || 0}</h3>
            <p className="text-sm text-muted-foreground">Open Positions</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="strategies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="strategies">Active Strategies</TabsTrigger>
          <TabsTrigger value="trades">Recent Trades</TabsTrigger>
          <TabsTrigger value="positions">Open Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="strategies" className="space-y-6">
          {strategies && strategies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy) => (
                <Card key={strategy.id} className="bg-card border-border">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={strategy.isActive ? "default" : "secondary"}
                          className={strategy.isActive ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          {strategy.isActive ? "Running" : "Stopped"}
                        </Badge>
                        <Switch
                          checked={strategy.isActive}
                          onCheckedChange={() => handleToggleStrategy(strategy.id, strategy.isActive)}
                          disabled={toggleStrategyMutation.isPending}
                        />
                      </div>
                    </div>
                    {strategy.description && (
                      <p className="text-sm text-muted-foreground">{strategy.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">P&L</p>
                        <p className={`text-lg font-semibold ${
                          strategy.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          {strategy.totalPnL >= 0 ? "+" : ""}{formatCurrency(strategy.totalPnL)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Trades</p>
                        <p className="text-lg font-semibold text-foreground">{strategy.totalTrades}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${
                            strategy.isActive ? "bg-green-500" : "bg-gray-500"
                          }`}></span>
                          <span className={strategy.isActive ? "text-green-500" : "text-muted-foreground"}>
                            {strategy.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Strategies</h3>
              <p className="text-muted-foreground mb-6">
                Create and deploy strategies to start live trading.
              </p>
              <Button className="bg-primary hover:bg-primary/90">
                Create Strategy
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trades" className="space-y-6">
          {recentTrades.length > 0 ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Recent Trade Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTrades.map((trade) => (
                    <div key={trade.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          trade.side === "BUY" ? "bg-green-500" : "bg-red-500"
                        }`}></div>
                        <div>
                          <p className="font-medium text-foreground">
                            {trade.side} {trade.quantity} {trade.symbol}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            @ {formatCurrency(trade.price)} • {formatTimeAgo(trade.executedAt)}
                          </p>
                        </div>
                      </div>
                      {trade.pnl !== null && trade.pnl !== undefined && (
                        <div className={`text-right ${
                          trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                        }`}>
                          <p className="font-medium">
                            {trade.pnl >= 0 ? "+" : ""}{formatCurrency(trade.pnl)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Recent Trades</h3>
              <p className="text-muted-foreground">
                Trade activity will appear here when your strategies execute orders.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="positions" className="space-y-6">
          {positions && positions.length > 0 ? (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Open Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {positions.map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                          <span className="text-primary font-medium text-sm">
                            {position.symbol.substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{position.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {position.quantity} shares @ {formatCurrency(position.averagePrice)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-foreground">
                          {formatCurrency((position.currentPrice || position.averagePrice) * position.quantity)}
                        </p>
                        {position.unrealizedPnL !== null && position.unrealizedPnL !== undefined && (
                          <p className={`text-sm ${
                            position.unrealizedPnL >= 0 ? "text-green-500" : "text-red-500"
                          }`}>
                            {position.unrealizedPnL >= 0 ? "+" : ""}{formatCurrency(position.unrealizedPnL)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Open Positions</h3>
              <p className="text-muted-foreground">
                Your portfolio positions will appear here when strategies execute trades.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
