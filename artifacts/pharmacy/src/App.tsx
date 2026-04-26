import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Import pages
import Home from "./pages/Home";
import Conditions from "./pages/Conditions";
import ConditionDetail from "./pages/ConditionDetail";
import Consultation from "./pages/Consultation";
import TrackConsultation from "./pages/TrackConsultation";
import Dashboard from "./pages/Dashboard";
import ReviewConsultation from "./pages/ReviewConsultation";
import PharmacistLogin from "./pages/PharmacistLogin";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const token = localStorage.getItem("pharmacist_token");
  if (!token) {
    navigate("/dashboard/login");
    return null;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/conditions" component={Conditions} />
      <Route path="/conditions/:id" component={ConditionDetail} />
      <Route path="/consult/:conditionId" component={Consultation} />
      <Route path="/track" component={TrackConsultation} />
      <Route path="/dashboard/login" component={PharmacistLogin} />
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/dashboard/consultation/:id">{() => <ProtectedRoute component={ReviewConsultation} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
