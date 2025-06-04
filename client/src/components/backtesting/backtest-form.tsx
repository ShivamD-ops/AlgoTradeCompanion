import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Strategy, BacktestRequest } from "@shared/schema";

interface BacktestFormProps {
  onSuccess?: (backtestId: number) => void;
}

export function BacktestForm({ onSuccess }: BacktestFormProps) {
  const [formData, setFormData] = useState({
    strategyId: "",
    startDate: "",
    endDate: "",
    initialCapital: 10000,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: strategies } = useQuery<Strategy[]>({
    queryKey: ["/api/strategies"],
  });

  const runBacktestMutation = useMutation({
    mutationFn: async (data: BacktestRequest) => {
      const response = await apiRequest("POST", "/api/backtests", data);
      return response.json();
    },
    onSuccess: (backtest) => {
      queryClient.invalidateQueries({ queryKey: ["/api/backtests"] });
      toast({
        title: "Backtest Completed",
        description: "Your backtest has been completed successfully.",
      });
      onSuccess?.(backtest.id);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run backtest",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.strategyId || !formData.startDate || !formData.endDate) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    runBacktestMutation.mutate({
      strategyId: parseInt(formData.strategyId),
      startDate: formData.startDate,
      endDate: formData.endDate,
      initialCapital: formData.initialCapital,
    });
  };

  // Set default dates (last 3 months)
  const today = new Date().toISOString().split('T')[0];
  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Run Backtest</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="strategy">Strategy</Label>
            <Select
              value={formData.strategyId}
              onValueChange={(value) => setFormData({ ...formData, strategyId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategies?.map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.id.toString()}>
                    {strategy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate || threeMonthsAgo}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate || today}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialCapital">Initial Capital ($)</Label>
            <Input
              id="initialCapital"
              type="number"
              min="1000"
              step="100"
              value={formData.initialCapital}
              onChange={(e) => setFormData({ ...formData, initialCapital: parseInt(e.target.value) })}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={runBacktestMutation.isPending || !strategies?.length}
          >
            {runBacktestMutation.isPending ? "Running Backtest..." : "Run Backtest"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
