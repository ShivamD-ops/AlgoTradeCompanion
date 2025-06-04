import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Strategy } from "@shared/schema";

export function StrategiesSidebar() {
  const { data: strategies, isLoading } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded w-32 mb-4"></div>
            <div className="h-8 bg-muted rounded w-8"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeStrategies = strategies?.filter(s => s.isActive) || [];

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">Active Strategies</CardTitle>
          <Link href="/strategies">
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeStrategies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active strategies</p>
              <Link href="/strategies">
                <Button variant="outline">Create Strategy</Button>
              </Link>
            </div>
          ) : (
            activeStrategies.map((strategy) => (
              <div key={strategy.id} className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{strategy.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-xs text-green-500">Running</span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    P&L: <span className={strategy.totalPnL >= 0 ? "text-green-500" : "text-red-500"}>
                      {strategy.totalPnL >= 0 ? "+" : ""}{formatCurrency(strategy.totalPnL)}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Trades: <span className="text-foreground">{strategy.totalTrades}</span>
                  </span>
                </div>
              </div>
            ))
          )}
          
          <Link href="/strategies">
            <Button variant="ghost" className="w-full text-primary hover:text-primary/80">
              View All Strategies →
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
