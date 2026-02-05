import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


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
        const res = await axios.post("http://localhost:5000/api/auth/verify-email", {email, otp});
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
    <div>
      <h2>Email Verification</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button type="submit">Verify</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
};

export default VerifyOtp;
