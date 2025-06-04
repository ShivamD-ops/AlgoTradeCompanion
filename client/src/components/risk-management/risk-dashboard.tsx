import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  TrendingDown, 
  AlertTriangle, 
  Calculator,
  Target,
  BarChart3,
  DollarSign,
  Activity
} from "lucide-react";

interface PositionSizeResult {
  recommendedSize: number;
  maxAllowedSize: number;
  riskAmount: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}

interface DailyLossCheck {
  exceeded: boolean;
  currentLoss: number;
  limit: number;
}

interface RiskMetrics {
  totalValue: number;
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  varDaily: number;
}

export function RiskDashboard() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [dailyLossCheck, setDailyLossCheck] = useState<DailyLossCheck | null>(null);
  const [positionSizeResult, setPositionSizeResult] = useState<PositionSizeResult | null>(null);
  
  // Position size calculator inputs
  const [symbol, setSymbol] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [riskPercent, setRiskPercent] = useState("2");
  const [stopLossPercent, setStopLossPercent] = useState("2");
  const [takeProfitPercent, setTakeProfitPercent] = useState("6");
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRiskData();
  }, []);

  const fetchRiskData = async () => {
    setIsLoading(true);
    try {
      const [metricsRes, lossRes] = await Promise.all([
        apiRequest("/api/risk/metrics"),
        apiRequest("/api/risk/daily-loss")
      ]);

      if (metricsRes) setRiskMetrics(metricsRes);
      if (lossRes) setDailyLossCheck(lossRes);
    } catch (error) {
      console.error("Failed to fetch risk data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePositionSize = async () => {
    if (!symbol || !currentPrice) {
      toast({
        title: "Invalid Input",
        description: "Please enter symbol and current price",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest("/api/risk/position-size", {
        method: "POST",
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          currentPrice: parseFloat(currentPrice),
          side,
          customRiskParams: {
            riskPercentPerTrade: parseFloat(riskPercent),
            stopLossPercentage: parseFloat(stopLossPercent),
            takeProfitPercentage: parseFloat(takeProfitPercent)
          }
        })
      });

      if (response) {
        setPositionSizeResult(response);
        toast({
          title: "Position Size Calculated",
          description: `Recommended position size: ${response.recommendedSize} shares`
        });
      }
    } catch (error: any) {
      toast({
        title: "Calculation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Risk Management</h2>
          <p className="text-muted-foreground">Monitor portfolio risk and calculate optimal position sizes</p>
        </div>
        <Button onClick={fetchRiskData} disabled={isLoading}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Daily Loss Alert */}
      {dailyLossCheck?.exceeded && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Daily Loss Limit Exceeded:</strong> Current loss of {formatCurrency(dailyLossCheck.currentLoss)} 
            exceeds your daily limit of {formatCurrency(dailyLossCheck.limit)}. Consider halting trading for today.
          </AlertDescription>
        </Alert>
      )}

      {/* Risk Metrics Grid */}
      {riskMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(riskMetrics.totalValue)}</p>
                  <p className={`text-sm ${riskMetrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Today: {formatCurrency(riskMetrics.dailyPnL)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-2xl font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Risk-adjusted returns</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold text-red-500">{riskMetrics.maxDrawdown.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    Current: {riskMetrics.currentDrawdown.toFixed(1)}%
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Volatility</p>
                  <p className="text-2xl font-bold">{(riskMetrics.volatility * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Annualized</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Position Size Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Position Size Calculator
            </CardTitle>
            <CardDescription>
              Calculate optimal position size based on risk parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., RELIANCE"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Current Price (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="side">Side</Label>
              <Select value={side} onValueChange={(value: "BUY" | "SELL") => setSide(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUY">Buy</SelectItem>
                  <SelectItem value="SELL">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk">Risk %</Label>
                <Input
                  id="risk"
                  type="number"
                  step="0.1"
                  value={riskPercent}
                  onChange={(e) => setRiskPercent(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="stopLoss">Stop Loss %</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  step="0.1"
                  value={stopLossPercent}
                  onChange={(e) => setStopLossPercent(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="takeProfit">Take Profit %</Label>
                <Input
                  id="takeProfit"
                  type="number"
                  step="0.1"
                  value={takeProfitPercent}
                  onChange={(e) => setTakeProfitPercent(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={calculatePositionSize} disabled={isLoading} className="w-full">
              Calculate Position Size
            </Button>
          </CardContent>
        </Card>

        {/* Position Size Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
            <CardDescription>
              Recommended position sizing and risk levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            {positionSizeResult ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Recommended Size</p>
                    <p className="text-xl font-bold text-blue-600">
                      {positionSizeResult.recommendedSize} shares
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Max Allowed</p>
                    <p className="text-xl font-bold text-green-600">
                      {positionSizeResult.maxAllowedSize} shares
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Risk Amount</span>
                    <span className="font-medium">{formatCurrency(positionSizeResult.riskAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Stop Loss Price</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(positionSizeResult.stopLossPrice)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Take Profit Price</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(positionSizeResult.takeProfitPrice)}
                    </span>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Position size calculated based on {riskPercent}% portfolio risk. 
                    Maximum loss per trade: {formatCurrency(positionSizeResult.riskAmount)}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Enter trade details to calculate position size</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Risk Metrics */}
      {riskMetrics && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Risk Metrics</CardTitle>
            <CardDescription>
              Comprehensive portfolio risk analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium">Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Daily P&L</span>
                    <span className={`font-medium ${riskMetrics.dailyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(riskMetrics.dailyPnL)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Weekly P&L</span>
                    <span className={`font-medium ${riskMetrics.weeklyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(riskMetrics.weeklyPnL)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Monthly P&L</span>
                    <span className={`font-medium ${riskMetrics.monthlyPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(riskMetrics.monthlyPnL)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Risk Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Value at Risk (95%)</span>
                    <span className="font-medium text-red-600">
                      {(riskMetrics.varDaily * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Current Drawdown</span>
                    <span className="font-medium text-orange-600">
                      {riskMetrics.currentDrawdown.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Volatility (Annual)</span>
                    <span className="font-medium">
                      {(riskMetrics.volatility * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Risk Status</h4>
                <div className="space-y-2">
                  <div className={`p-2 rounded text-sm ${
                    riskMetrics.currentDrawdown < 5 ? 'bg-green-100 text-green-800' :
                    riskMetrics.currentDrawdown < 10 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Drawdown Risk: {
                      riskMetrics.currentDrawdown < 5 ? 'Low' :
                      riskMetrics.currentDrawdown < 10 ? 'Medium' : 'High'
                    }
                  </div>
                  
                  <div className={`p-2 rounded text-sm ${
                    riskMetrics.sharpeRatio > 1 ? 'bg-green-100 text-green-800' :
                    riskMetrics.sharpeRatio > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Risk-Adjusted Returns: {
                      riskMetrics.sharpeRatio > 1 ? 'Excellent' :
                      riskMetrics.sharpeRatio > 0.5 ? 'Good' : 'Poor'
                    }
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}