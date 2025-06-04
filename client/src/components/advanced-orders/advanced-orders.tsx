import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Target, 
  TrendingDown, 
  Layers,
  Clock,
  Settings,
  Activity,
  Plus
} from "lucide-react";

interface BracketOrder {
  id: string;
  userId: number;
  symbol: string;
  quantity: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  status: string;
  createdAt: string;
}

interface TrailingStopOrder {
  id: string;
  userId: number;
  symbol: string;
  quantity: number;
  trailAmount: number;
  trailPercent?: number;
  highestPrice: number;
  currentStopPrice: number;
  status: string;
  createdAt: string;
}

interface IcebergOrder {
  id: string;
  userId: number;
  symbol: string;
  totalQuantity: number;
  visibleQuantity: number;
  price: number;
  side: string;
  executedQuantity: number;
  remainingQuantity: number;
  status: string;
  createdAt: string;
}

interface TimeBasedOrder {
  id: string;
  userId: number;
  symbol: string;
  quantity: number;
  price?: number;
  orderType: string;
  side: string;
  scheduleType: string;
  executeAt?: string;
  intervalMinutes?: number;
  maxExecutions?: number;
  executionCount: number;
  status: string;
  createdAt: string;
}

export function AdvancedOrders() {
  const [bracketOrders, setBracketOrders] = useState<BracketOrder[]>([]);
  const [trailingStops, setTrailingStops] = useState<TrailingStopOrder[]>([]);
  const [icebergOrders, setIcebergOrders] = useState<IcebergOrder[]>([]);
  const [timeBasedOrders, setTimeBasedOrders] = useState<TimeBasedOrder[]>([]);
  
  // Form states
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  
  // Bracket order specific
  const [entryPrice, setEntryPrice] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  
  // Trailing stop specific
  const [trailAmount, setTrailAmount] = useState("");
  const [trailPercent, setTrailPercent] = useState("");
  const [usePercent, setUsePercent] = useState(false);
  
  // Iceberg specific
  const [totalQuantity, setTotalQuantity] = useState("");
  const [visibleQuantity, setVisibleQuantity] = useState("");
  
  // Time-based specific
  const [scheduleType, setScheduleType] = useState<"SPECIFIC_TIME" | "INTERVAL" | "MARKET_OPEN" | "MARKET_CLOSE">("SPECIFIC_TIME");
  const [executeAt, setExecuteAt] = useState("");
  const [intervalMinutes, setIntervalMinutes] = useState("");
  const [maxExecutions, setMaxExecutions] = useState("1");
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    // This would fetch from the API endpoints once implemented
    console.log("Fetching advanced orders...");
  };

  const createBracketOrder = async () => {
    if (!symbol || !quantity || !entryPrice || !stopLoss || !takeProfit) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          quantity: parseInt(quantity),
          entryPrice: parseFloat(entryPrice),
          stopLoss: parseFloat(stopLoss),
          takeProfit: parseFloat(takeProfit)
        })
      });

      if (response.ok) {
        const newOrder = await response.json();
        setBracketOrders(prev => [newOrder, ...prev]);
        clearForm();
        toast({
          title: "Bracket Order Created",
          description: `Order for ${symbol.toUpperCase()} created successfully`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Order Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTrailingStop = async () => {
    if (!symbol || !quantity || (!trailAmount && !trailPercent)) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/trailing-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          quantity: parseInt(quantity),
          trailAmount: usePercent ? undefined : parseFloat(trailAmount),
          trailPercent: usePercent ? parseFloat(trailPercent) : undefined
        })
      });

      if (response.ok) {
        const newOrder = await response.json();
        setTrailingStops(prev => [newOrder, ...prev]);
        clearForm();
        toast({
          title: "Trailing Stop Created",
          description: `Trailing stop for ${symbol.toUpperCase()} created successfully`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Order Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createIcebergOrder = async () => {
    if (!symbol || !totalQuantity || !visibleQuantity || !price) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/orders/iceberg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          totalQuantity: parseInt(totalQuantity),
          visibleQuantity: parseInt(visibleQuantity),
          price: parseFloat(price),
          side
        })
      });

      if (response.ok) {
        const newOrder = await response.json();
        setIcebergOrders(prev => [newOrder, ...prev]);
        clearForm();
        toast({
          title: "Iceberg Order Created",
          description: `Iceberg order for ${symbol.toUpperCase()} created successfully`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Order Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTimeBasedOrder = async () => {
    if (!symbol || !quantity) {
      toast({
        title: "Invalid Input",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const options: any = {};
      
      if (price) options.price = parseFloat(price);
      if (executeAt) options.executeAt = new Date(executeAt).toISOString();
      if (intervalMinutes) options.intervalMinutes = parseInt(intervalMinutes);
      if (maxExecutions) options.maxExecutions = parseInt(maxExecutions);

      const response = await fetch("/api/orders/time-based", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          quantity: parseInt(quantity),
          side,
          scheduleType,
          options
        })
      });

      if (response.ok) {
        const newOrder = await response.json();
        setTimeBasedOrders(prev => [newOrder, ...prev]);
        clearForm();
        toast({
          title: "Time-Based Order Created",
          description: `Scheduled order for ${symbol.toUpperCase()} created successfully`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Order Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearForm = () => {
    setSymbol("");
    setQuantity("");
    setPrice("");
    setEntryPrice("");
    setStopLoss("");
    setTakeProfit("");
    setTrailAmount("");
    setTrailPercent("");
    setTotalQuantity("");
    setVisibleQuantity("");
    setExecuteAt("");
    setIntervalMinutes("");
    setMaxExecutions("1");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active": return "text-green-600 bg-green-100";
      case "pending": return "text-yellow-600 bg-yellow-100";
      case "completed": return "text-blue-600 bg-blue-100";
      case "cancelled": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Advanced Orders</h2>
          <p className="text-muted-foreground">Sophisticated order types for professional trading</p>
        </div>
        <Button onClick={fetchOrders} disabled={isLoading}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="bracket" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="bracket">Bracket Orders</TabsTrigger>
          <TabsTrigger value="trailing">Trailing Stops</TabsTrigger>
          <TabsTrigger value="iceberg">Iceberg Orders</TabsTrigger>
          <TabsTrigger value="time-based">Time-Based</TabsTrigger>
        </TabsList>

        {/* Bracket Orders */}
        <TabsContent value="bracket" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Create Bracket Order
                </CardTitle>
                <CardDescription>
                  Automatically place stop-loss and take-profit orders with your entry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      placeholder="e.g., RELIANCE"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Entry Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={entryPrice}
                      onChange={(e) => setEntryPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stop Loss (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Take Profit (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={createBracketOrder} disabled={isLoading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Bracket Order
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Bracket Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {bracketOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bracket orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bracketOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{order.symbol}</h4>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Quantity: {order.quantity}</div>
                          <div>Entry: ₹{order.entryPrice}</div>
                          <div>Stop Loss: ₹{order.stopLoss}</div>
                          <div>Take Profit: ₹{order.takeProfit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trailing Stops */}
        <TabsContent value="trailing" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Create Trailing Stop
                </CardTitle>
                <CardDescription>
                  Dynamic stop-loss that follows price movements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      placeholder="e.g., RELIANCE"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={usePercent}
                    onCheckedChange={setUsePercent}
                  />
                  <Label>Use percentage instead of fixed amount</Label>
                </div>

                <div className="space-y-2">
                  <Label>{usePercent ? "Trail Percentage (%)" : "Trail Amount (₹)"}</Label>
                  <Input
                    type="number"
                    step={usePercent ? "0.1" : "0.01"}
                    value={usePercent ? trailPercent : trailAmount}
                    onChange={(e) => usePercent ? setTrailPercent(e.target.value) : setTrailAmount(e.target.value)}
                  />
                </div>

                <Button onClick={createTrailingStop} disabled={isLoading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Trailing Stop
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Trailing Stops</CardTitle>
              </CardHeader>
              <CardContent>
                {trailingStops.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No trailing stops found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {trailingStops.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{order.symbol}</h4>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Quantity: {order.quantity}</div>
                          <div>Trail: {order.trailPercent ? `${order.trailPercent}%` : `₹${order.trailAmount}`}</div>
                          <div>Highest: ₹{order.highestPrice}</div>
                          <div>Stop: ₹{order.currentStopPrice}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Iceberg Orders */}
        <TabsContent value="iceberg" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Create Iceberg Order
                </CardTitle>
                <CardDescription>
                  Split large orders into smaller visible chunks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      placeholder="e.g., RELIANCE"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Side</Label>
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
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Total Quantity</Label>
                    <Input
                      type="number"
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Visible Quantity</Label>
                    <Input
                      type="number"
                      value={visibleQuantity}
                      onChange={(e) => setVisibleQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>

                <Button onClick={createIcebergOrder} disabled={isLoading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Iceberg Order
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Iceberg Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {icebergOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No iceberg orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {icebergOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{order.symbol}</h4>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Total: {order.totalQuantity}</div>
                          <div>Visible: {order.visibleQuantity}</div>
                          <div>Executed: {order.executedQuantity}</div>
                          <div>Remaining: {order.remainingQuantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Time-Based Orders */}
        <TabsContent value="time-based" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Create Time-Based Order
                </CardTitle>
                <CardDescription>
                  Schedule orders for specific times or intervals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      placeholder="e.g., RELIANCE"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Side</Label>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price (₹) - Optional</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Schedule Type</Label>
                  <Select value={scheduleType} onValueChange={(value: any) => setScheduleType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPECIFIC_TIME">Specific Time</SelectItem>
                      <SelectItem value="INTERVAL">Interval</SelectItem>
                      <SelectItem value="MARKET_OPEN">Market Open</SelectItem>
                      <SelectItem value="MARKET_CLOSE">Market Close</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {scheduleType === "SPECIFIC_TIME" && (
                  <div className="space-y-2">
                    <Label>Execute At</Label>
                    <Input
                      type="datetime-local"
                      value={executeAt}
                      onChange={(e) => setExecuteAt(e.target.value)}
                    />
                  </div>
                )}

                {scheduleType === "INTERVAL" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Interval (minutes)</Label>
                      <Input
                        type="number"
                        value={intervalMinutes}
                        onChange={(e) => setIntervalMinutes(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Executions</Label>
                      <Input
                        type="number"
                        value={maxExecutions}
                        onChange={(e) => setMaxExecutions(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={createTimeBasedOrder} disabled={isLoading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Time-Based Order
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {timeBasedOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No scheduled orders found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {timeBasedOrders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{order.symbol}</h4>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Type: {order.scheduleType.replace('_', ' ')}</div>
                          <div>Executions: {order.executionCount}/{order.maxExecutions}</div>
                          {order.executeAt && (
                            <div className="col-span-2">
                              Execute: {new Date(order.executeAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}