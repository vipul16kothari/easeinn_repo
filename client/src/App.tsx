import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/not-found";
import Landing from "./pages/landing";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import AdminDashboard from "./pages/admin-dashboard";
import CheckIn from "./pages/check-in";
import Checkout from "./pages/checkout";
import Guests from "./pages/guests";
import Reports from "./pages/reports";
import Rooms from "./pages/rooms";
import Bookings from "./pages/bookings";
import Calendar from "./pages/calendar";
import MultiRoomBooking from "./pages/multi-room-booking";
import Header from "./components/header";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Authenticated routes with header */}
      <Route path="/dashboard">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Dashboard />
        </div>
      </Route>
      <Route path="/admin/dashboard">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <AdminDashboard />
        </div>
      </Route>
      <Route path="/check-in">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <CheckIn />
        </div>
      </Route>
      <Route path="/checkout">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Checkout />
        </div>
      </Route>
      <Route path="/guests">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Guests />
        </div>
      </Route>
      <Route path="/rooms">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Rooms />
        </div>
      </Route>
      <Route path="/bookings">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Bookings />
        </div>
      </Route>
      <Route path="/multi-room-booking">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <MultiRoomBooking />
        </div>
      </Route>
      <Route path="/calendar">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Calendar />
        </div>
      </Route>
      <Route path="/reports">
        <div className="min-h-screen bg-gray-50">
          <Header />
          <Reports />
        </div>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
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
