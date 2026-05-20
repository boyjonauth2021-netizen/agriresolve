import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import PlantDetail from "@/pages/plant-detail";
import Assistant from "@/pages/assistant";
import Monitor from "@/pages/monitor";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-amber-600 text-white text-sm font-medium py-2 px-4">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You are offline — plant data is available from cache. AI assistant requires internet.</span>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/plant/:id" component={PlantDetail} />
      <Route path="/monitor/:plantId" component={Monitor} />
      <Route path="/assistant" component={Assistant} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Router />
        </WouterRouter>
        <Toaster />
        <OfflineBanner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
