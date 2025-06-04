import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { InsertStrategy } from "@shared/schema";

interface StrategyFormProps {
  onSuccess?: () => void;
}

export function StrategyForm({ onSuccess }: StrategyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    code: `# Example trading strategy
def strategy(data):
    # RSI indicator
    rsi = calculate_rsi(data['close'], 14)
    
    # Generate signals
    if rsi < 30:
        return 'BUY'
    elif rsi > 70:
        return 'SELL'
    else:
        return 'HOLD'
`,
    parameters: {},
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStrategyMutation = useMutation({
    mutationFn: async (data: Omit<InsertStrategy, "userId">) => {
      const response = await apiRequest("POST", "/api/strategies", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      toast({
        title: "Strategy Created",
        description: "Your trading strategy has been created successfully.",
      });
      onSuccess?.();
      setFormData({
        name: "",
        description: "",
        code: `# Example trading strategy
def strategy(data):
    # RSI indicator
    rsi = calculate_rsi(data['close'], 14)
    
    # Generate signals
    if rsi < 30:
        return 'BUY'
    elif rsi > 70:
        return 'SELL'
    else:
        return 'HOLD'
`,
        parameters: {},
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create strategy",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createStrategyMutation.mutate({
      name: formData.name,
      description: formData.description,
      code: formData.code,
      parameters: formData.parameters,
      isActive: false,
      totalPnL: 0,
      totalTrades: 0,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Strategy</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Strategy Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter strategy name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your trading strategy"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Strategy Code</Label>
            <Textarea
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Enter your strategy code"
              rows={15}
              className="font-mono text-sm"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createStrategyMutation.isPending}
          >
            {createStrategyMutation.isPending ? "Creating..." : "Create Strategy"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
