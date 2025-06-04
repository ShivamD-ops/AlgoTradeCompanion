import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import type { Trade } from "@shared/schema";

export function RecentActivity() {
  const { data: trades, isLoading } = useQuery<Trade[]>({
    queryKey: ["/api/trades"],
  });

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentTrades = trades?.slice(0, 4) || [];

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const tradeDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - tradeDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTrades.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            recentTrades.map((trade) => (
              <div key={trade.id} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  trade.side === "BUY" ? "bg-green-500" : "bg-red-500"
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">
                    Strategy executed {trade.side} order for {trade.symbol}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTimeAgo(trade.executedAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
