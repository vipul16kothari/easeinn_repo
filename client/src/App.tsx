import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/not-found";
import Dashboard from "./pages/dashboard";
import CheckIn from "./pages/check-in";
import Guests from "./pages/guests";
import Reports from "./pages/reports";
import Rooms from "./pages/rooms";
import Calendar from "./pages/calendar";
import Header from "./components/header";

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/check-in" component={CheckIn} />
        <Route path="/guests" component={Guests} />
        <Route path="/rooms" component={Rooms} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/reports" component={Reports} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
