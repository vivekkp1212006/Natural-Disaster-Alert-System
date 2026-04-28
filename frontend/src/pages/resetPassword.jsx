import React, {useEffect, useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";
import StatusModal from "../components/StatusModal";

const ResetPassword = () => {
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [modal, setModal] = useState({ open: false, type: "error", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const email = sessionStorage.getItem("resetEmail");

    const navigate = useNavigate();

    useEffect( () =>{
        if(email == null) {
            setModal({ open: true, type: "error", message: "Unauthorized access" });
            navigate("/forgot-password");
        }
    },[email, navigate]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);

        if(!/^\d{4,8}$/.test(otp.trim())) {
            setModal({ open: true, type: "error", message: "OTP required" });
            return;
        }
        if(!newPassword) {
            setModal({ open: true, type: "error", message: "Enter new password" });
            return;
        }
        if(!confirmPassword || newPassword !== confirmPassword) {
            setModal({ open: true, type: "error", message: "Password mismatch" });
            return;
        }
        if( newPassword.length < 8 || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
            setModal({ open: true, type: "error", message: "Weak password: include uppercase, lowercase, special character and minimum 8 characters" });
            return;
        } 

        //disable the subit button
        setIsSubmitting(true);

        try {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`,{email, otp, newPassword});
        setModal({ open: true, type: "success", message: res.data.message });
        sessionStorage.removeItem("resetEmail");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
        navigate("/login");
        }
        catch(err) {
            if(err.response && err.response.data) {
                setModal({ open: true, type: "error", message: err.response.data.message });
            }
            else {
                setModal({ open: true, type: "error", message: "Something went wrong. Try again later" });
            }
        }
        finally {
            // enables the button
            setIsSubmitting(false);
        }

    };
    
    return (
        <div className="login-container">
           <div className="login-box">
                <form onSubmit={handleSubmit}>
                   <div className="form-group">
                    <input
                        type="text"
                        placeholder="OTP"
                        value={otp}
                        required
                        onChange={ (e) => setOtp(e.target.value)}
                    />
                   </div>

                   <div className="form-group"> 
                    <input
                        type="password"
                        placeholder="New password"
                        value={newPassword}
                        required
                        onChange={ (e) => setNewPassword(e.target.value)}
                    />
                   </div>

                   <div className="form-group"> 
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        required
                        onChange={ (e) => setConfirmPassword(e.target.value)}
                    />
                   </div>

                    <button type="submit" disabled={isSubmitting} className="login-button">
                        Reset password
                    </button>
                </form>
                <p>{isSubmitting ? "Processing..." : ""}</p>
                <StatusModal
                  open={modal.open}
                  type={modal.type}
                  message={modal.message}
                  onClose={() => setModal({ open: false, type: "error", message: "" })}
                />
           </div> 
        </div>
    );
}

export default ResetPassword;