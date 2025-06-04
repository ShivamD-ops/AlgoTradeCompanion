import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Bell, 
  AlertTriangle, 
  Plus,
  Eye,
  EyeOff,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";

interface Alert {
  id: number;
  userId: number;
  type: string;
  severity: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  channels: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  createdAt: string;
}

interface PriceAlert {
  id: number;
  userId: number;
  symbol: string;
  alertType: string;
  targetValue: number;
  currentValue: number;
  isActive: boolean;
  message: string;
  createdAt: string;
  triggeredAt?: string;
}

export function AlertsCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  // New price alert form
  const [symbol, setSymbol] = useState("");
  const [alertType, setAlertType] = useState<"PRICE_ABOVE" | "PRICE_BELOW" | "PRICE_CHANGE" | "VOLUME_SPIKE">("PRICE_ABOVE");
  const [targetValue, setTargetValue] = useState("");
  const [message, setMessage] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    fetchPriceAlerts();
  }, [showUnreadOnly]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/alerts?unreadOnly=${showUnreadOnly}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPriceAlerts = async () => {
    try {
      const response = await fetch("/api/alerts/price", {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPriceAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch price alerts:", error);
    }
  };

  const createPriceAlert = async () => {
    if (!symbol || !targetValue) {
      toast({
        title: "Invalid Input",
        description: "Please enter symbol and target value",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/alerts/price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify({
          symbol: symbol.toUpperCase(),
          alertType,
          targetValue: parseFloat(targetValue),
          message: message || `${symbol.toUpperCase()} ${alertType.replace('_', ' ').toLowerCase()} ${targetValue}`
        })
      });

      if (response.ok) {
        const newAlert = await response.json();
        setPriceAlerts(prev => [newAlert, ...prev]);
        
        // Clear form
        setSymbol("");
        setTargetValue("");
        setMessage("");
        
        toast({
          title: "Price Alert Created",
          description: `Alert for ${symbol.toUpperCase()} created successfully`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Alert Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (alertId: number) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/read`, {
        method: "PUT",
        credentials: 'include'
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, isRead: true } : alert
        ));
      }
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
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

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case "TRADE_EXECUTED": return <Activity className="h-4 w-4" />;
      case "RISK_BREACH": return <AlertTriangle className="h-4 w-4" />;
      case "PRICE_ALERT": return <TrendingUp className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Alerts Center</h2>
          <p className="text-muted-foreground">Manage price alerts and notifications</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showUnreadOnly ? "default" : "outline"}
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          >
            {showUnreadOnly ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showUnreadOnly ? "Show All" : "Unread Only"}
          </Button>
          <Button onClick={() => { fetchAlerts(); fetchPriceAlerts(); }} disabled={isLoading}>
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">Active Alerts</TabsTrigger>
          <TabsTrigger value="price-alerts">Price Alerts</TabsTrigger>
          <TabsTrigger value="create">Create Alert</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                System Alerts
                {alerts.filter(a => !a.isRead).length > 0 && (
                  <Badge variant="destructive">
                    {alerts.filter(a => !a.isRead).length} unread
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Recent notifications and system alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No alerts found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`border rounded-lg p-4 ${!alert.isRead ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getAlertTypeIcon(alert.type)}
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity}
                          </Badge>
                          <Badge variant="outline">{alert.type.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {!alert.isRead && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => markAsRead(alert.id)}
                            >
                              Mark Read
                            </Button>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      
                      <div className="flex gap-2">
                        {alert.channels.email && <Badge variant="outline" className="text-xs">Email</Badge>}
                        {alert.channels.sms && <Badge variant="outline" className="text-xs">SMS</Badge>}
                        {alert.channels.push && <Badge variant="outline" className="text-xs">Push</Badge>}
                        {alert.channels.inApp && <Badge variant="outline" className="text-xs">In-App</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="price-alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Price Alerts
                {priceAlerts.filter(a => a.isActive).length > 0 && (
                  <Badge variant="secondary">
                    {priceAlerts.filter(a => a.isActive).length} active
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Monitor price movements and get notified
              </CardDescription>
            </CardHeader>
            <CardContent>
              {priceAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No price alerts configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {priceAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{alert.symbol}</h4>
                          <Badge 
                            variant={alert.isActive ? "default" : "secondary"}
                            className={alert.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {alert.isActive ? "Active" : "Triggered"}
                          </Badge>
                          <Badge variant="outline">
                            {alert.alertType.replace('_', ' ')}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-2">{alert.message}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Target Value: </span>
                          <span className="font-medium">₹{alert.targetValue.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Current Value: </span>
                          <span className="font-medium">₹{alert.currentValue.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      {alert.triggeredAt && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Price Alert
              </CardTitle>
              <CardDescription>
                Set up custom price alerts for your watchlist
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-symbol">Symbol</Label>
                  <Input
                    id="alert-symbol"
                    placeholder="e.g., RELIANCE"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRICE_ABOVE">Price Above</SelectItem>
                      <SelectItem value="PRICE_BELOW">Price Below</SelectItem>
                      <SelectItem value="PRICE_CHANGE">Price Change</SelectItem>
                      <SelectItem value="VOLUME_SPIKE">Volume Spike</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-value">Target Value (₹)</Label>
                <Input
                  id="target-value"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-message">Custom Message (Optional)</Label>
                <Input
                  id="alert-message"
                  placeholder="Alert message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <Button onClick={createPriceAlert} disabled={isLoading} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create Price Alert
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}