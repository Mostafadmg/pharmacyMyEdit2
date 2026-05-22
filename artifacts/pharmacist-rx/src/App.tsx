import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { RxLayout } from "@/components/RxLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Queue } from "@/pages/Queue";
import { OrderDetail } from "@/pages/OrderDetail";
import { PatientMessages } from "@/pages/PatientMessages";
import { Patients } from "@/pages/Patients";
import { Prescriptions } from "@/pages/Prescriptions";
import { DispensingLabels } from "@/pages/DispensingLabels";
import { Profile } from "@/pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

function Routes() {
  return (
    <RxLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/queue" component={Queue} />
        <Route path="/orders/:id">{(p) => <OrderDetail id={p.id} />}</Route>
        <Route path="/messages" component={PatientMessages} />
        <Route path="/patients" component={Patients} />
        <Route path="/prescriptions" component={Prescriptions} />
        <Route path="/labels" component={DispensingLabels} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </RxLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Routes />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
