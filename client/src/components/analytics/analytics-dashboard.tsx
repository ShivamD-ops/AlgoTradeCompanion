import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  AlertTriangle, 
  Heart,
  Activity,
  BarChart3,
  Target,
  Shield,
  Zap
} from "lucide-react";

interface Prediction {
  symbol: string;
  modelId: string;
  predictedPrice: number;
  currentPrice: number;
  confidence: number;
  timeframe: string;
  direction: string;
  createdAt: string;
}

interface Anomaly {
  id: string;
  type: string;
  symbol?: string;
  severity: string;
  description: string;
  detectedAt: string;
  resolved: boolean;
}

interface SentimentData {
  symbol: string;
  sentiment: string;
  score: number;
  confidence: number;
  sources: {
    news: number;
    social: number;
    technical: number;
  };
  updatedAt: string;
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

export function AnalyticsDashboard() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("RELIANCE");
  const [timeframe, setTimeframe] = useState<string>("1D");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [predictionsRes, anomaliesRes, sentimentRes, riskRes] = await Promise.all([
        apiRequest("/api/analytics/predictions"),
        apiRequest("/api/analytics/anomalies?resolved=false"),
        apiRequest("/api/analytics/sentiment"),
        apiRequest("/api/risk/metrics")
      ]);

      if (predictionsRes) setPredictions(predictionsRes);
      if (anomaliesRes) setAnomalies(anomaliesRes);
      if (sentimentRes) setSentimentData(sentimentRes);
      if (riskRes) setRiskMetrics(riskRes);
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePrediction = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/analytics/predict/${selectedSymbol}`, {
        method: "POST",
        body: JSON.stringify({ timeframe })
      });

      if (response) {
        setPredictions(prev => [response, ...prev]);
        toast({
          title: "Prediction Generated",
          description: `ML prediction for ${selectedSymbol} created successfully`
        });
      }
    } catch (error: any) {
      toast({
        title: "Prediction Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case "bullish": return "text-green-600 bg-green-100";
      case "bearish": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical": return "text-red-600 bg-red-100";
      case "high": return "text-orange-600 bg-orange-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      default: return "text-blue-600 bg-blue-100";
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
          <h2 className="text-2xl font-semibold">Advanced Analytics</h2>
          <p className="text-muted-foreground">AI-powered market insights and risk analysis</p>
        </div>
        <Button onClick={fetchAnalyticsData} disabled={isLoading}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Risk Metrics Overview */}
      {riskMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(riskMetrics.totalValue)}</p>
                </div>
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                  <p className="text-2xl font-bold">{riskMetrics.sharpeRatio.toFixed(2)}</p>
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
                </div>
                <BarChart3 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">ML Predictions</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Price Predictions
              </CardTitle>
              <CardDescription>
                AI-powered price forecasting using machine learning models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RELIANCE">RELIANCE</SelectItem>
                    <SelectItem value="INFY">INFY</SelectItem>
                    <SelectItem value="TCS">TCS</SelectItem>
                    <SelectItem value="HDFC">HDFC</SelectItem>
                    <SelectItem value="ICICIBANK">ICICIBANK</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1H">1 Hour</SelectItem>
                    <SelectItem value="1D">1 Day</SelectItem>
                    <SelectItem value="1W">1 Week</SelectItem>
                    <SelectItem value="1M">1 Month</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={generatePrediction} disabled={isLoading}>
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Prediction
                </Button>
              </div>

              <div className="space-y-4">
                {predictions.slice(0, 5).map((prediction, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{prediction.symbol}</h4>
                        <Badge variant="outline">{prediction.timeframe}</Badge>
                        <Badge className={prediction.direction === "UP" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                          {prediction.direction}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Confidence: {(prediction.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Current Price</p>
                        <p className="text-lg font-semibold">{formatCurrency(prediction.currentPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Predicted Price</p>
                        <p className="text-lg font-semibold">{formatCurrency(prediction.predictedPrice)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">
                        Expected Change: {((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sentiment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Market Sentiment
              </CardTitle>
              <CardDescription>
                Multi-source sentiment analysis combining news, social media, and technical indicators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sentimentData.map((sentiment, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">{sentiment.symbol}</h4>
                      <Badge className={getSentimentColor(sentiment.sentiment)}>
                        {sentiment.sentiment}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Overall Score</span>
                        <span className={`font-semibold ${sentiment.score > 0 ? 'text-green-600' : sentiment.score < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {sentiment.score.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>News Sentiment</span>
                          <span>{sentiment.sources.news.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Social Media</span>
                          <span>{sentiment.sources.social.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Technical</span>
                          <span>{sentiment.sources.technical.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Confidence: {(sentiment.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Anomaly Detection
              </CardTitle>
              <CardDescription>
                Real-time detection of unusual market patterns and strategy performance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No anomalies detected</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {anomalies.map((anomaly) => (
                    <div key={anomaly.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(anomaly.severity)}>
                              {anomaly.severity}
                            </Badge>
                            <Badge variant="outline">{anomaly.type.replace('_', ' ')}</Badge>
                            {anomaly.symbol && (
                              <span className="font-medium">{anomaly.symbol}</span>
                            )}
                          </div>
                          <p className="text-sm">{anomaly.description}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(anomaly.detectedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}