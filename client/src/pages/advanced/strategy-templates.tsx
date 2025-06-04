import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Code, 
  TrendingUp, 
  BarChart3,
  Target,
  Layers,
  Zap,
  Settings,
  Eye,
  Download
} from "lucide-react";

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  code: string;
  parameters: StrategyParameter[];
  riskLevel: string;
  complexity: string;
  estimatedReturns: string;
  marketConditions: string;
}

interface StrategyParameter {
  name: string;
  type: string;
  defaultValue: any;
  description: string;
  min?: number;
  max?: number;
  options?: string[];
}

export function StrategyTemplates() {
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [complexityFilter, setComplexityFilter] = useState<string>("ALL");
  const [customParameters, setCustomParameters] = useState<Record<string, any>>({});
  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/strategy-templates", {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateStrategy = async () => {
    if (!selectedTemplate) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/strategy-templates/${selectedTemplate.id}/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ customParameters })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedCode(result.code);
        toast({
          title: "Strategy Generated",
          description: `Strategy code generated from ${selectedTemplate.name} template`
        });
      } else {
        const error = await response.json();
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateParameter = (paramName: string, value: any) => {
    setCustomParameters(prev => ({
      ...prev,
      [paramName]: value
    }));
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case "low": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "high": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case "beginner": return "text-blue-600 bg-blue-100";
      case "intermediate": return "text-purple-600 bg-purple-100";
      case "advanced": return "text-orange-600 bg-orange-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "MOMENTUM": return <TrendingUp className="h-4 w-4" />;
      case "MEAN_REVERSION": return <Target className="h-4 w-4" />;
      case "BREAKOUT": return <BarChart3 className="h-4 w-4" />;
      case "PAIRS_TRADING": return <Layers className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = categoryFilter === "ALL" || template.category === categoryFilter;
    const complexityMatch = complexityFilter === "ALL" || template.complexity === complexityFilter;
    return categoryMatch && complexityMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Strategy Templates</h2>
          <p className="text-muted-foreground">Pre-built algorithmic trading strategies for quick deployment</p>
        </div>
        <Button onClick={fetchTemplates} disabled={isLoading}>
          <Zap className="h-4 w-4 mr-2" />
          Refresh Templates
        </Button>
      </div>

      <div className="flex gap-4">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            <SelectItem value="MOMENTUM">Momentum</SelectItem>
            <SelectItem value="MEAN_REVERSION">Mean Reversion</SelectItem>
            <SelectItem value="ARBITRAGE">Arbitrage</SelectItem>
            <SelectItem value="PAIRS_TRADING">Pairs Trading</SelectItem>
            <SelectItem value="BREAKOUT">Breakout</SelectItem>
            <SelectItem value="SCALPING">Scalping</SelectItem>
          </SelectContent>
        </Select>

        <Select value={complexityFilter} onValueChange={setComplexityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Complexity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Levels</SelectItem>
            <SelectItem value="BEGINNER">Beginner</SelectItem>
            <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
            <SelectItem value="ADVANCED">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Available Templates</CardTitle>
              <CardDescription>
                Choose a strategy template to customize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getCategoryIcon(template.category)}
                      <h4 className="font-medium text-sm">{template.name}</h4>
                    </div>
                    
                    <div className="flex gap-1 mb-2">
                      <Badge className={getRiskColor(template.riskLevel)} variant="outline">
                        {template.riskLevel}
                      </Badge>
                      <Badge className={getComplexityColor(template.complexity)} variant="outline">
                        {template.complexity}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      Returns: {template.estimatedReturns}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Details & Configuration */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="parameters">Parameters</TabsTrigger>
                <TabsTrigger value="code">Generated Code</TabsTrigger>
              </TabsList>

              <TabsContent value="details">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getCategoryIcon(selectedTemplate.category)}
                      {selectedTemplate.name}
                    </CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Badge className={getRiskColor(selectedTemplate.riskLevel)}>
                          Risk: {selectedTemplate.riskLevel}
                        </Badge>
                        <Badge className={getComplexityColor(selectedTemplate.complexity)}>
                          {selectedTemplate.complexity}
                        </Badge>
                        <Badge variant="outline">
                          {selectedTemplate.category.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Expected Returns</h4>
                          <p className="text-sm text-muted-foreground">{selectedTemplate.estimatedReturns}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Market Conditions</h4>
                          <p className="text-sm text-muted-foreground">{selectedTemplate.marketConditions}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Parameters ({selectedTemplate.parameters.length})</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedTemplate.parameters.map((param) => (
                            <div key={param.name} className="text-sm">
                              <span className="font-medium">{param.name}</span>
                              <span className="text-muted-foreground ml-2">({param.type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="parameters">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configure Parameters
                    </CardTitle>
                    <CardDescription>
                      Customize the strategy parameters to fit your trading style
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTemplate.parameters.map((param) => (
                        <div key={param.name} className="space-y-2">
                          <Label htmlFor={param.name}>
                            {param.name}
                            <span className="text-muted-foreground ml-2">({param.type})</span>
                          </Label>
                          <p className="text-sm text-muted-foreground">{param.description}</p>
                          
                          {param.type === "NUMBER" && (
                            <Input
                              id={param.name}
                              type="number"
                              step={param.name.includes("Percent") ? "0.1" : "1"}
                              min={param.min}
                              max={param.max}
                              defaultValue={param.defaultValue}
                              onChange={(e) => updateParameter(param.name, parseFloat(e.target.value))}
                            />
                          )}
                          
                          {param.type === "BOOLEAN" && (
                            <Select 
                              defaultValue={param.defaultValue.toString()}
                              onValueChange={(value) => updateParameter(param.name, value === "true")}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">True</SelectItem>
                                <SelectItem value="false">False</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          
                          {param.type === "STRING" && (
                            <Input
                              id={param.name}
                              defaultValue={param.defaultValue}
                              onChange={(e) => updateParameter(param.name, e.target.value)}
                            />
                          )}
                          
                          {param.type === "SELECT" && param.options && (
                            <Select 
                              defaultValue={param.defaultValue}
                              onValueChange={(value) => updateParameter(param.name, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {param.options.map((option) => (
                                  <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          {param.min !== undefined && param.max !== undefined && (
                            <p className="text-xs text-muted-foreground">
                              Range: {param.min} - {param.max}
                            </p>
                          )}
                        </div>
                      ))}
                      
                      <Button onClick={generateStrategy} disabled={isLoading} className="w-full">
                        <Code className="h-4 w-4 mr-2" />
                        Generate Strategy Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="code">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Generated Strategy Code
                    </CardTitle>
                    <CardDescription>
                      Review and download your customized strategy
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {generatedCode ? (
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigator.clipboard.writeText(generatedCode)}
                            variant="outline"
                            size="sm"
                          >
                            Copy Code
                          </Button>
                          <Button
                            onClick={() => {
                              const blob = new Blob([generatedCode], { type: 'text/javascript' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '_')}_strategy.js`;
                              a.click();
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                        
                        <div className="relative">
                          <Textarea
                            value={generatedCode}
                            readOnly
                            className="font-mono text-sm min-h-96"
                          />
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p className="font-medium mb-1">Usage Instructions:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Copy this code to your strategy implementation</li>
                            <li>Test thoroughly with backtesting before live trading</li>
                            <li>Customize parameters based on market conditions</li>
                            <li>Monitor performance and adjust as needed</li>
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Generate strategy code to view it here</p>
                        <Button
                          onClick={generateStrategy}
                          disabled={isLoading}
                          className="mt-4"
                        >
                          Generate Code
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-96">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select a Template</h3>
                  <p className="text-muted-foreground">Choose a strategy template from the list to get started</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}