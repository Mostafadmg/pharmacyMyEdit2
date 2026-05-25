import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { RxLayout } from "@/components/RxLayout";
import { Dashboard } from "@/pages/Dashboard";
import { Queue } from "@/pages/Queue";
import { OrderDetail } from "@/pages/OrderDetail";
import { PatientMessages } from "@/pages/PatientMessages";
import { Patients } from "@/pages/Patients";
import { PatientDetail } from "@/pages/PatientDetail";
import { Prescriptions } from "@/pages/Prescriptions";
import { DispensingLabels } from "@/pages/DispensingLabels";
import { Profile } from "@/pages/Profile";
import { ShopAdmin } from "@/pages/ShopAdmin";
import { ShopProductForm } from "@/pages/ShopProductForm";
import { PharmacistLogin } from "@/pages/PharmacistLogin";
import { getPharmacistToken } from "@/lib/pharmacistSession";
import { CustomOrderTagsProvider } from "@/context/CustomOrderTagsContext";
import { UiPreferencesProvider } from "@/context/UiPreferencesContext";

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
      <UiPreferencesProvider>
        <RxLayout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/queue" component={Queue} />
            <Route path="/orders/:id">{(p) => <OrderDetail id={p.id} />}</Route>
            <Route path="/messages" component={PatientMessages} />
            <Route path="/patients" component={Patients} />
            <Route path="/patients/:email">
              {(p) => <PatientDetail email={decodeURIComponent(p.email)} />}
            </Route>
            <Route path="/prescriptions" component={Prescriptions} />
            <Route path="/labels" component={DispensingLabels} />
            <Route path="/shop" component={ShopAdmin} />
            <Route path="/shop/new" component={ShopProductForm} />
            <Route path="/shop/:id/edit" component={ShopProductForm} />
            <Route path="/profile" component={Profile} />
            <Route component={NotFound} />
          </Switch>
        </RxLayout>
      </UiPreferencesProvider>
    </RequireAuth>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CustomOrderTagsProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Switch>
              <Route path="/login" component={PharmacistLogin} />
              <Route component={AuthenticatedRoutes} />
            </Switch>
          </WouterRouter>
        </CustomOrderTagsProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
