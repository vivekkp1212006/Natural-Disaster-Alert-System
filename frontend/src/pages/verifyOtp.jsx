import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";
import StatusModal from "../components/StatusModal";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [modal, setModal] = useState({ open: false, type: "error", message: "" });
  const navigate = useNavigate();

  const email = sessionStorage.getItem("pendingEmail");
    if(!email) {
        return <p>Session expired. Please register again.</p>;
    }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{4,8}$/.test(otp.trim())) {
      setModal({ open: true, type: "error", message: "Enter a valid OTP" });
      return;
    }
    // API call will come next
    try{
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-email`, {email, otp});
        setModal({ open: true, type: "success", message: res.data.message });
        setOtp("");
        sessionStorage.removeItem("pendingEmail");
        if(res.data.message === "Email verified successfully") {
            navigate("/login");
        }
    }
    catch(error) {
        setModal({ open: true, type: "error", message: error.response?.data?.message || 'Verification Failed' });
    }

  };

    
  return (
    <div className="login-container">
      <div className="login-box">
          <h2>Email Verification</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
          </div>
            <button type="submit">Verify</button>
          </form>

          <StatusModal
            open={modal.open}
            type={modal.type}
            message={modal.message}
            onClose={() => setModal({ open: false, type: "error", message: "" })}
          />
      </div>
    </div>
  );
};

export default VerifyOtp;
