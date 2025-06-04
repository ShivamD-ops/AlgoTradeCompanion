import { Navigation } from "./navigation";
import { useAuth } from "@/hooks/use-auth";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navigation />
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {children}
      </main>
      
      {/* Status Bar */}
      <footer className="bg-card border-t border-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>Market Status: <span className="text-green-500">Open</span></span>
            <span>Connection: <span className="text-green-500">Connected</span></span>
            <span>API Limit: 1,234/10,000</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Last sync: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </footer>
    </div>
  );
}
