import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Play, Pause, Trash2, BarChart3 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Strategy } from "@shared/schema";

interface StrategyCardProps {
  strategy: Strategy;
}

export function StrategyCard({ strategy }: StrategyCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleStrategyMutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const response = await apiRequest("POST", `/api/strategies/${strategy.id}/toggle`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Strategy Updated",
        description: `Strategy ${strategy.isActive ? "paused" : "activated"} successfully.`,
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

  const deleteStrategyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/strategies/${strategy.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Strategy Deleted",
        description: "Strategy has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete strategy",
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

  const handleToggle = () => {
    toggleStrategyMutation.mutate(!strategy.isActive);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this strategy?")) {
      deleteStrategyMutation.mutate();
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-foreground">{strategy.name}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge
              variant={strategy.isActive ? "default" : "secondary"}
              className={strategy.isActive ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {strategy.isActive ? "Active" : "Inactive"}
            </Badge>
            <Switch
              checked={strategy.isActive}
              onCheckedChange={handleToggle}
              disabled={toggleStrategyMutation.isPending}
            />
          </div>
        </div>
        {strategy.description && (
          <p className="text-sm text-muted-foreground">{strategy.description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Total P&L</p>
            <p className={`text-lg font-semibold ${
              strategy.totalPnL >= 0 ? "text-green-500" : "text-red-500"
            }`}>
              {strategy.totalPnL >= 0 ? "+" : ""}{formatCurrency(strategy.totalPnL)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Trades</p>
            <p className="text-lg font-semibold text-foreground">{strategy.totalTrades}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggle}
              disabled={toggleStrategyMutation.isPending}
            >
              {strategy.isActive ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Backtest
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleteStrategyMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
