import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, useRoute } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Import pages
import Home from "./pages/Home";
import Conditions from "./pages/Conditions";
import WeightLoss from "./pages/WeightLoss";
import InjectableWeightLoss from "./pages/InjectableWeightLoss";
import InjectableWeightLossConsultation from "./pages/InjectableWeightLossConsultation";
import OralWeightLossConsultation from "./pages/OralWeightLossConsultation";
import ConditionDetail from "./pages/ConditionDetail";
import Consultation from "./pages/Consultation";
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
import PatientMessages from "./pages/PatientMessages";
import UploadDocuments from "./pages/UploadDocuments";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import AccountHub from "./pages/account/AccountHub";
import YourDetails from "./pages/account/YourDetails";
import MyPayments from "./pages/account/MyPayments";
import ChangePassword from "./pages/account/ChangePassword";
import GPDetails from "./pages/account/GPDetails";
import MySubscriptions from "./pages/account/MySubscriptions";
import ReferFriend from "./pages/account/ReferFriend";
import CustomerService from "./pages/account/CustomerService";
import Notifications from "./pages/account/Notifications";
import Prescriptions from "./pages/account/Prescriptions";
import Preferences from "./pages/account/Preferences";
import DataAndPrivacy from "./pages/account/DataAndPrivacy";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminOrders from "./pages/AdminOrders";
import AdminOrderDetail from "./pages/AdminOrderDetail";
import AdminProducts from "./pages/AdminProducts";
import AdminProductForm from "./pages/AdminProductForm";
import AdminConditions from "./pages/AdminConditions";
import AdminConditionEditor from "./pages/AdminConditionEditor";
import PharmacistAnalytics from "./pages/PharmacistAnalytics";
import Contact from "./pages/Contact";
import Feedback from "./pages/Feedback";
import HealthHub from "./pages/HealthHub";
import HealthHubArticle from "./pages/HealthHubArticle";
import TreatmentLanding from "./pages/TreatmentLanding";
import Wishlist from "./pages/Wishlist";
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

function RedirectTo({ href }: { href: string }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate(href);
  }, [href, navigate]);
  return null;
}

function RedirectTrackOrder() {
  const [, params] = useRoute<{ id: string }>("/track-order/:id");
  const target = params?.id ? `/order-confirmation/${params.id}` : "/my-orders";
  return <RedirectTo href={target} />;
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
      <Route path="/injectable-weight-loss" component={InjectableWeightLoss} />
      <Route path="/treatments/weight-loss/injectable" component={InjectableWeightLossConsultation} />
      <Route path="/consultation/weight-loss-injectable" component={InjectableWeightLossConsultation} />
      <Route path="/consultation/weight-loss-oral" component={OralWeightLossConsultation} />
      <Route path="/treatments/weight-loss/oral" component={OralWeightLossConsultation} />
      <Route path="/treatments/:slug" component={TreatmentLanding} />
      <Route path="/health-hub" component={HealthHub} />
      <Route path="/health-hub/:slug" component={HealthHubArticle} />
      <Route path="/wishlist" component={Wishlist} />
      <Route path="/conditions/:id" component={ConditionDetail} />
      <Route path="/consult/:conditionId" component={Consultation} />
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
      <Route path="/dashboard/analytics">{() => <ProtectedRoute component={PharmacistAnalytics} />}</Route>
      <Route path="/my-account/login" component={PatientLogin} />
      <Route path="/my-account/register" component={PatientRegister} />
      <Route path="/my-consultations" component={MyConsultations} />
      <Route path="/my-messages" component={PatientMessages} />
      <Route path="/upload-documents/:id" component={UploadDocuments} />
      <Route path="/shop" component={Shop} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/my-orders" component={MyOrders} />
      <Route path="/account" component={AccountHub} />
      <Route path="/account/details" component={YourDetails} />
      <Route path="/account/details/payments" component={MyPayments} />
      <Route path="/account/details/password" component={ChangePassword} />
      <Route path="/account/details/gp" component={GPDetails} />
      <Route path="/account/subscriptions" component={MySubscriptions} />
      <Route path="/account/refer" component={ReferFriend} />
      <Route path="/account/customer-service" component={CustomerService} />
      <Route path="/account/notifications" component={Notifications} />
      <Route path="/account/prescriptions" component={Prescriptions} />
      <Route path="/account/preferences" component={Preferences} />
      <Route path="/account/data-and-privacy" component={DataAndPrivacy} />
      <Route path="/order-confirmation/:id" component={OrderConfirmation} />
      <Route path="/track-order/:id" component={RedirectTrackOrder} />
      <Route path="/track">
        {() => (
          <RedirectTo
            href={
              typeof localStorage !== "undefined" && localStorage.getItem("patient_token")
                ? "/my-orders"
                : "/my-account/login"
            }
          />
        )}
      </Route>
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
