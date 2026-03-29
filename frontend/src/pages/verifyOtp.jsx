import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./style.css";

const VerifyOtp = () => {
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const email = localStorage.getItem("pendingEmail");
    if(!email) {
        return <p>Session expired. Please register again.</p>;
    }

  const handleSubmit = async (e) => {
    e.preventDefault();
    // API call will come next
    try{
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/verify-email`, {email, otp});
        setMessage(res.data.message);
        localStorage.removeItem("pendingEmail");
        if(res.data.message === "Email verified successfully") {
            navigate("/login");
        }
    }
    catch(error) {
        setMessage(error.response?.data?.message || 'Verification Failed');
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

          {message && <p>{message}</p>}
      </div>
    </div>
  );
};

export default VerifyOtp;
