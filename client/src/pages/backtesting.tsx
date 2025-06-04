import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BacktestForm } from "@/components/backtesting/backtest-form";
import { BacktestResults } from "@/components/backtesting/backtest-results";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import type { Backtest } from "@shared/schema";

export default function Backtesting() {
  const [selectedBacktestId, setSelectedBacktestId] = useState<number | null>(null);

  const { data: backtests, isLoading } = useQuery<Backtest[]>({
    queryKey: ["/api/backtests"],
  });

  const { data: selectedBacktest } = useQuery<Backtest>({
    queryKey: ["/api/backtests", selectedBacktestId],
    enabled: !!selectedBacktestId,
  });

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Strategy Backtesting</h2>
          <p className="text-muted-foreground">Test your strategies against historical market data</p>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="text-sm text-muted-foreground">
            {backtests?.length || 0} backtests completed
          </span>
        </div>
      </div>

      <Tabs defaultValue="run-backtest" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="run-backtest">Run New Backtest</TabsTrigger>
          <TabsTrigger value="results">Previous Results</TabsTrigger>
        </TabsList>

        <TabsContent value="run-backtest" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Backtest Form */}
            <div className="lg:col-span-1">
              <BacktestForm onSuccess={(id) => setSelectedBacktestId(id)} />
            </div>

            {/* Instructions/Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <span>Backtesting Guidelines</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">1. Strategy Selection:</strong> Choose a strategy that you want to test. Make sure the strategy code is properly implemented with entry and exit signals.
                    </p>
                    <p>
                      <strong className="text-foreground">2. Time Period:</strong> Select a meaningful time period for testing. Longer periods provide more reliable results but take more time to process.
                    </p>
                    <p>
                      <strong className="text-foreground">3. Initial Capital:</strong> Set a realistic initial capital amount. Minimum recommended amount is $10,000 for meaningful results.
                    </p>
                    <p>
                      <strong className="text-foreground">4. Analysis:</strong> Review key metrics like total return, Sharpe ratio, maximum drawdown, and win rate to evaluate strategy performance.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              {backtests && backtests.length > 0 && (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle>Your Backtesting Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-foreground">{backtests.length}</div>
                        <div className="text-sm text-muted-foreground">Total Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-green-500">
                          {backtests.filter(b => b.totalReturn > 0).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Profitable</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-foreground">
                          {formatPercentage(
                            backtests.reduce((sum, b) => sum + b.totalReturn, 0) / backtests.length
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Return</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-semibold text-foreground">
                          {Math.round(backtests.reduce((sum, b) => sum + b.totalTrades, 0) / backtests.length)}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Trades</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-32 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : backtests && backtests.length > 0 ? (
            <div className="space-y-6">
              {/* Backtest List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {backtests.map((backtest) => (
                  <Card 
                    key={backtest.id} 
                    className={`cursor-pointer transition-colors ${
                      selectedBacktestId === backtest.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedBacktestId(backtest.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                          {new Date(backtest.createdAt).toLocaleDateString()}
                        </div>
                        <TrendingUp className={`w-4 h-4 ${
                          backtest.totalReturn >= 0 ? "text-green-500" : "text-red-500"
                        }`} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Return</span>
                          <span className={`text-sm font-medium ${
                            backtest.totalReturn >= 0 ? "text-green-500" : "text-red-500"
                          }`}>
                            {formatPercentage(backtest.totalReturn)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Final Value</span>
                          <span className="text-sm font-medium text-foreground">
                            {formatCurrency(backtest.finalValue)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Trades</span>
                          <span className="text-sm font-medium text-foreground">
                            {backtest.totalTrades}
                          </span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Max Drawdown</span>
                          <span className="text-sm font-medium text-red-500">
                            -{formatPercentage(backtest.maxDrawdown)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected Backtest Results */}
              {selectedBacktest && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Backtest Results</h3>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedBacktestId(null)}
                    >
                      Close Details
                    </Button>
                  </div>
                  <BacktestResults backtest={selectedBacktest} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">No Backtests Yet</h3>
              <p className="text-muted-foreground mb-6">
                Run your first backtest to see how your strategies perform with historical data.
              </p>
              <Button 
                onClick={() => document.querySelector('[data-value="run-backtest"]')?.click()}
                className="bg-primary hover:bg-primary/90"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Run Your First Backtest
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
