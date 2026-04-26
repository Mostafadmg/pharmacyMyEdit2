import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/conditions" component={Conditions} />
      <Route path="/conditions/:id" component={ConditionDetail} />
      <Route path="/consult/:conditionId" component={Consultation} />
      <Route path="/track" component={TrackConsultation} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/consultation/:id" component={ReviewConsultation} />
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
