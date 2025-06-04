import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { TrendingUp, LogOut, User, ChevronDown, Brain, Shield, Bell, Layers, Code } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [tradingMode, setTradingMode] = useState<"paper" | "live">("paper");

  const navigationItems = [
    { path: "/", label: "Dashboard" },
    { path: "/strategies", label: "Strategies" },
    { path: "/backtesting", label: "Backtesting" },
    { path: "/live-trading", label: "Live Trading" },
    { path: "/analytics", label: "Analytics" },
  ];

  const advancedItems = [
    { path: "/advanced-analytics", label: "ML Analytics" },
    { path: "/risk-management", label: "Risk Management" },
    { path: "/alerts", label: "Alerts Center" },
    { path: "/advanced-orders", label: "Advanced Orders" },
    { path: "/strategy-templates", label: "Strategy Templates" },
  ];

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">AlgoTrader Pro</h1>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            {navigationItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className={`pb-1 transition-colors ${
                  location === item.path
                    ? "text-primary font-medium border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                  {item.label}
                </a>
              </Link>
            ))}
            
            {/* Advanced Features Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="pb-1 text-muted-foreground hover:text-foreground">
                  Advanced
                  <ChevronDown className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {advancedItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link href={item.path}>
                      <a className="flex items-center w-full">
                        {item.path === '/advanced-analytics' && <Brain className="w-4 h-4 mr-2" />}
                        {item.path === '/risk-management' && <Shield className="w-4 h-4 mr-2" />}
                        {item.path === '/alerts' && <Bell className="w-4 h-4 mr-2" />}
                        {item.path === '/advanced-orders' && <Layers className="w-4 h-4 mr-2" />}
                        {item.path === '/strategy-templates' && <Code className="w-4 h-4 mr-2" />}
                        {item.label}
                      </a>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Trading Mode Toggle */}
          <div className="flex items-center space-x-2 bg-background px-3 py-2 rounded-lg">
            <span className="text-sm text-muted-foreground">Mode:</span>
            <div className="flex bg-card rounded-md p-1">
              <Button
                variant={tradingMode === "paper" ? "default" : "ghost"}
                size="sm"
                className={`px-3 py-1 text-sm ${
                  tradingMode === "paper" 
                    ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                    : "text-muted-foreground"
                }`}
                onClick={() => setTradingMode("paper")}
              >
                Paper
              </Button>
              <Button
                variant={tradingMode === "live" ? "default" : "ghost"}
                size="sm"
                className={`px-3 py-1 text-sm ${
                  tradingMode === "live" 
                    ? "bg-green-500 text-white hover:bg-green-600" 
                    : "text-muted-foreground"
                }`}
                onClick={() => setTradingMode("live")}
              >
                Live
              </Button>
            </div>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-3 p-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-muted text-muted-foreground">
                    {user ? getInitials(user.firstName, user.lastName) : "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user ? `${user.firstName} ${user.lastName}` : "User"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
