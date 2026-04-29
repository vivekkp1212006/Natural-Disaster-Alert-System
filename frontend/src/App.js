import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PwaSupport from "./components/PwaSupport";

const AppShell = lazy(() => import("./components/AppShell"));
const Login = lazy(() => import("./pages/login"));
const Home = lazy(() => import("./pages/Home"));
const VerifyOtp = lazy(() => import("./pages/verifyOtp"));
const Signup = lazy(() => import("./pages/signup"));
const ForgotPassword = lazy(() => import("./pages/forgotPassword"));
const ResetPassword = lazy(() => import("./pages/resetPassword"));
const GetMyAlerts = lazy(() => import("./pages/myAlerts"));
const RequestRole = lazy(() => import("./pages/requestRole"));
const AdminRoleRequests = lazy(() => import("./pages/adminRoleRequests"));
const AdminAlerts = lazy(() => import("./pages/adminAlerts"));
const DisasterManagement = lazy(() => import("./pages/disasterManagement"));
const FaqPage = lazy(() => import("./pages/FaqPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
const VolunteerSafetyPage = lazy(() => import("./pages/VolunteerSafetyPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const HelpPage = lazy(() => import("./pages/HelpPage"));
const AdminCampDetail = lazy(() => import("./pages/AdminCampDetail"));
const AdminDirectory = lazy(() => import("./pages/AdminDirectory"));

function App() {
  return (
    <Router>
      <PwaSupport />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<AppShell />}>
            <Route path="/home" element={<Home />} />
            <Route path="/my-alerts" element={<GetMyAlerts />} />
            <Route path="/request-role" element={<RequestRole />} />
            <Route path="/admin/role-requests" element={<AdminRoleRequests />} />
            <Route path="/admin/alerts" element={<AdminAlerts />} />
            <Route path="/management" element={<DisasterManagement />} />
            <Route path="/admin/camps/:campId" element={<AdminCampDetail />} />
            <Route path="/admin/directory/:category" element={<AdminDirectory />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/volunteer-safety" element={<VolunteerSafetyPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/help" element={<HelpPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
