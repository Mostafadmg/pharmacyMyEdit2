import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { PmrLayout } from "@/components/PmrLayout";
import { Dashboard } from "@/pages/Dashboard";
import { DispensingQueue } from "@/pages/DispensingQueue";
import { Patients } from "@/pages/Patients";
import { PatientDetail } from "@/pages/PatientDetail";
import { PrescriptionView } from "@/pages/PrescriptionView";
import { History } from "@/pages/History";
import { ClinicalCheck } from "@/pages/ClinicalCheck";
import { PickQueue } from "@/pages/PickQueue";
import { LabellingLanding, LabellingSession } from "@/pages/Labelling";
import { PharmacistLogin } from "@/pages/PharmacistLogin";import { getPharmacistToken } from "@/lib/pharmacistSession";
import { PatientsProvider } from "@/context/PatientsContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

function RequireAuth({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const token = getPharmacistToken();

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  if (!token) return null;
  return <>{children}</>;
}


function AuthenticatedRoutes() {
  return (
    <RequireAuth>
      <PatientsProvider>
        <PmrLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/queue" component={DispensingQueue} />
            <Route path="/clinical-check/:id" component={ClinicalCheck} />
            <Route path="/pick" component={PickQueue} />
            <Route path="/labelling" component={LabellingLanding} />
            <Route path="/labelling/:id" component={LabellingSession} />
            <Route path="/patients" component={Patients} />
            <Route path="/patients/:email">
              {(p) => <PatientDetail email={decodeURIComponent(p.email)} />}
            </Route>
            <Route path="/prescription/:id">
              {(p) => <PrescriptionView id={p.id} />}
            </Route>
            <Route path="/dispensing/:id">
              {(p) => <PrescriptionView id={p.id} />}
            </Route>
            <Route path="/history" component={History} />
            <Route component={NotFound} />
          </Switch>
        </PmrLayout>
      </PatientsProvider>
    </RequireAuth>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/login" component={PharmacistLogin} />
            <Route component={AuthenticatedRoutes} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
