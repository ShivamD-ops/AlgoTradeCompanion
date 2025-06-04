import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TrendingUp, TrendingDown, RefreshCw, Search } from "lucide-react";

interface MarketDataItem {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
}

export function MarketDataWidget() {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([]);
  const [searchSymbol, setSearchSymbol] = useState("");
  const [watchlist, setWatchlist] = useState<string[]>(["RELIANCE", "INFY", "TCS", "HDFC", "ICICIBANK"]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchMarketData = async (symbols: string[]) => {
    setIsLoading(true);
    try {
      const promises = symbols.map(async (symbol) => {
        try {
          const searchResponse = await apiRequest(`/api/angel/search?q=${symbol}`);
          if (searchResponse.status === "success" && searchResponse.data?.data?.length > 0) {
            const instrument = searchResponse.data.data[0];
            
            const ltpResponse = await apiRequest(
              `/api/angel/ltp?exchange=${instrument.exchange}&symbol=${instrument.tradingsymbol}&token=${instrument.symboltoken}`
            );
            
            if (ltpResponse.status === "success" && ltpResponse.data?.data) {
              const data = ltpResponse.data.data;
              return {
                symbol: instrument.tradingsymbol,
                ltp: data.ltp || 0,
                change: data.change || 0,
                changePercent: data.changePercent || 0,
                high: data.high || 0,
                low: data.low || 0,
                volume: data.volume || 0,
              };
            }
          }
          return null;
        } catch (error) {
          console.error(`Failed to fetch data for ${symbol}:`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validData = results.filter((item): item is MarketDataItem => item !== null);
      setMarketData(validData);
    } catch (error) {
      console.error("Failed to fetch market data:", error);
      toast({
        title: "Market Data Error",
        description: "Failed to fetch market data. Please check your connection to AngelOne API.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async () => {
    if (!searchSymbol.trim()) return;
    
    const symbol = searchSymbol.trim().toUpperCase();
    if (watchlist.includes(symbol)) {
      toast({
        title: "Symbol exists",
        description: "This symbol is already in your watchlist",
        variant: "destructive"
      });
      return;
    }

    setWatchlist(prev => [...prev, symbol]);
    setSearchSymbol("");
    toast({
      title: "Symbol added",
      description: `${symbol} added to watchlist`
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
    setMarketData(prev => prev.filter(item => item.symbol !== symbol));
  };

  useEffect(() => {
    if (watchlist.length > 0) {
      fetchMarketData(watchlist);
    }
  }, [watchlist]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (watchlist.length > 0) {
        fetchMarketData(watchlist);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [watchlist]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}Cr`;
    } else if (volume >= 100000) {
      return `${(volume / 100000).toFixed(1)}L`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Market Data
              <Badge variant="outline">Live</Badge>
            </CardTitle>
            <CardDescription>
              Real-time market data from AngelOne
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMarketData(watchlist)}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Enter symbol (e.g., RELIANCE)"
            value={searchSymbol}
            onChange={(e) => setSearchSymbol(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
            className="flex-1"
          />
          <Button onClick={addToWatchlist} disabled={!searchSymbol.trim()}>
            <Search className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {marketData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {isLoading ? "Loading market data..." : "No market data available. Add symbols to your watchlist."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {marketData.map((item) => (
              <div
                key={item.symbol}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{item.symbol}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>H: {formatCurrency(item.high)}</span>
                        <span>L: {formatCurrency(item.low)}</span>
                        <span>Vol: {formatVolume(item.volume)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {formatCurrency(item.ltp)}
                      </div>
                      <div className={`flex items-center gap-1 text-sm ${
                        item.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {item.change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {item.change >= 0 ? '+' : ''}{formatCurrency(item.change)} 
                          ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromWatchlist(item.symbol)}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}