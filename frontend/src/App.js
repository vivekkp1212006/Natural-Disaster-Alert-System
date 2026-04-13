import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/login";
import VerifyOtp from "./pages/verifyOtp";
import Signup from "./pages/signup";
import ForgotPassword from "./pages/forgotPassword";
import ResetPassword from "./pages/resetPassword";
import GetMyAlerts  from "./pages/myAlerts";
import RequestRole from "./pages/requestRole";
import AdminRoleRequests from "./pages/adminRoleRequests";
import AdminAlerts from "./pages/adminAlerts";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login"/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/my-alerts" element={<GetMyAlerts />} />
        <Route path="/request-role" element={<RequestRole />} />
        <Route path="/admin/role-requests" element={<AdminRoleRequests />} />
        <Route path="/admin/alerts" element={<AdminAlerts />} />
      </Routes>
    </Router>
  );
}

export default App;
