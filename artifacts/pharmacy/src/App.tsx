import React, { useEffect } from "react";
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
import PharmacistComplaints from "./pages/PharmacistComplaints";
import PharmacistPatients from "./pages/PharmacistPatients";
import PharmacistPatientDetail from "./pages/PharmacistPatientDetail";
import PharmacistLogin from "./pages/PharmacistLogin";
import PatientLogin from "./pages/PatientLogin";
import PatientRegister from "./pages/PatientRegister";
import MyConsultations from "./pages/MyConsultations";
import Contact from "./pages/Contact";
import Feedback from "./pages/Feedback";
import OurService from "./pages/about/OurService";
import Regulatory from "./pages/about/Regulatory";
import SafePrescribing from "./pages/about/SafePrescribing";
import Terms from "./pages/legal/Terms";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import CookiePolicy from "./pages/legal/CookiePolicy";
import Safeguarding from "./pages/legal/Safeguarding";
import Complaints from "./pages/legal/Complaints";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, navigate] = useLocation();
  const token = localStorage.getItem("pharmacist_token");

  useEffect(() => {
    if (!token) {
      navigate("/dashboard/login");
    }
  }, [token, navigate]);

  if (!token) return null;
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
      <Route path="/dashboard/complaints">{() => <ProtectedRoute component={PharmacistComplaints} />}</Route>
      <Route path="/dashboard/patients">{() => <ProtectedRoute component={PharmacistPatients} />}</Route>
      <Route path="/dashboard/patients/:email">{() => <ProtectedRoute component={PharmacistPatientDetail} />}</Route>
      <Route path="/my-account/login" component={PatientLogin} />
      <Route path="/my-account/register" component={PatientRegister} />
      <Route path="/my-consultations" component={MyConsultations} />
      <Route path="/contact" component={Contact} />
      <Route path="/feedback" component={Feedback} />
      <Route path="/about/our-service" component={OurService} />
      <Route path="/about/regulatory" component={Regulatory} />
      <Route path="/about/safeguarding" component={SafePrescribing} />
      <Route path="/legal/terms" component={Terms} />
      <Route path="/legal/privacy" component={PrivacyPolicy} />
      <Route path="/legal/cookies" component={CookiePolicy} />
      <Route path="/legal/safeguarding" component={Safeguarding} />
      <Route path="/legal/complaints" component={Complaints} />
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
