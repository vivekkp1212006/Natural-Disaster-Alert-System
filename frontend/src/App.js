import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import Login from "./pages/login";
import Home from "./pages/Home";
import VerifyOtp from "./pages/verifyOtp";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import GetMyAlerts from "./pages/myAlerts";
import RequestRole from "./pages/requestRole";
import AdminRoleRequests from "./pages/adminRoleRequests";
import AdminAlerts from "./pages/adminAlerts";
import DisasterManagement from "./pages/disasterManagement";
import FaqPage from "./pages/FaqPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import VolunteerSafetyPage from "./pages/VolunteerSafetyPage";
import LegalPage from "./pages/LegalPage";
import HelpPage from "./pages/HelpPage";
import AdminCampDetail from "./pages/AdminCampDetail";
import AdminDirectory from "./pages/AdminDirectory";

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
