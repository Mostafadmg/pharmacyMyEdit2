import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Import pages
import Home from "./pages/Home";
import Conditions from "./pages/Conditions";
import WeightLoss from "./pages/WeightLoss";
import ConditionDetail from "./pages/ConditionDetail";
import Consultation from "./pages/Consultation";
import TrackConsultation from "./pages/TrackConsultation";
import Dashboard from "./pages/Dashboard";
import ReviewConsultation from "./pages/ReviewConsultation";
import PharmacistComplaints from "./pages/PharmacistComplaints";
import PharmacistMessages from "./pages/PharmacistMessages";
import PharmacistMessageThread from "./pages/PharmacistMessageThread";
import PharmacistNotes from "./pages/PharmacistNotes";
import PharmacistPatients from "./pages/PharmacistPatients";
import PharmacistPatientDetail from "./pages/PharmacistPatientDetail";
import PharmacistLogin from "./pages/PharmacistLogin";
import PatientLogin from "./pages/PatientLogin";
import PatientRegister from "./pages/PatientRegister";
import MyConsultations from "./pages/MyConsultations";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderConfirmation from "./pages/OrderConfirmation";
import OrderTracking from "./pages/OrderTracking";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminProducts from "./pages/AdminProducts";
import AdminProductForm from "./pages/AdminProductForm";
import AdminConditions from "./pages/AdminConditions";
import AdminConditionEditor from "./pages/AdminConditionEditor";
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
import CookieBanner from "@/components/CookieBanner";
import LiveHelpFAB from "@/components/LiveHelpFAB";

const queryClient = new QueryClient();

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location]);
  return null;
}

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
      <Route path="/treatments/weight-loss" component={WeightLoss} />
      <Route path="/conditions/:id" component={ConditionDetail} />
      <Route path="/consult/:conditionId" component={Consultation} />
      <Route path="/track" component={TrackConsultation} />
      <Route path="/dashboard/login" component={PharmacistLogin} />
      <Route path="/dashboard">{() => <ProtectedRoute component={Dashboard} />}</Route>
      <Route path="/dashboard/consultation/:id">{() => <ProtectedRoute component={ReviewConsultation} />}</Route>
      <Route path="/dashboard/messages">{() => <ProtectedRoute component={PharmacistMessages} />}</Route>
      <Route path="/dashboard/messages/:id">{() => <ProtectedRoute component={PharmacistMessageThread} />}</Route>
      <Route path="/dashboard/notes">{() => <ProtectedRoute component={PharmacistNotes} />}</Route>
      <Route path="/dashboard/complaints">{() => <ProtectedRoute component={PharmacistComplaints} />}</Route>
      <Route path="/dashboard/patients">{() => <ProtectedRoute component={PharmacistPatients} />}</Route>
      <Route path="/dashboard/patients/:email">{() => <ProtectedRoute component={PharmacistPatientDetail} />}</Route>
      <Route path="/dashboard/orders">{() => <ProtectedRoute component={AdminOrders} />}</Route>
      <Route path="/dashboard/orders/:id">{() => <ProtectedRoute component={AdminOrderDetail} />}</Route>
      <Route path="/dashboard/products">{() => <ProtectedRoute component={AdminProducts} />}</Route>
      <Route path="/dashboard/products/new">{() => <ProtectedRoute component={AdminProductForm} />}</Route>
      <Route path="/dashboard/products/:id/edit">{() => <ProtectedRoute component={AdminProductForm} />}</Route>
      <Route path="/dashboard/conditions">{() => <ProtectedRoute component={AdminConditions} />}</Route>
      <Route path="/dashboard/conditions/:id">{() => <ProtectedRoute component={AdminConditionEditor} />}</Route>
      <Route path="/my-account/login" component={PatientLogin} />
      <Route path="/my-account/register" component={PatientRegister} />
      <Route path="/my-consultations" component={MyConsultations} />
      <Route path="/shop" component={Shop} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/my-orders" component={MyOrders} />
      <Route path="/order-confirmation/:id" component={OrderConfirmation} />
      <Route path="/track-order/:id" component={OrderTracking} />
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
          <ScrollToTop />
          <Router />
          <LiveHelpFAB />
          <CookieBanner />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
