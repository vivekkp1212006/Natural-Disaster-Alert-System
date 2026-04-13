import React, {useEffect, useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";

const ResetPassword = () => {
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const email = sessionStorage.getItem("resetEmail");

    const navigate = useNavigate();

    useEffect( () =>{
        if(email == null) {
            setMessage("Unauthorized access");
            navigate("/forgot-password");
        }
    },[email, navigate]);
    
    const handleSubmit = async (e) => {
        e.preventDefault();

        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasSpecialChar = /[^a-zA-Z0-9]/.test(newPassword);

        if(!otp) {
            setMessage("OTP required");
            return;
        }
        if(!newPassword) {
            setMessage("Enter new password");
            return;
        }
        if(!confirmPassword || newPassword !== confirmPassword) {
            setMessage("Password mismatch");
            return;
        }
        if( newPassword.length < 8 || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
            setMessage(`Too weak password \nPassword rules \nOne upper case character \nOne lowercase character \nOne special character \n atleast 8 characters`);
            return;
        } 

        //disable the subit button
        setIsSubmitting(true);

        try {
        const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/reset-password`,{email, otp, newPassword});
        setMessage(res.data.message);
        sessionStorage.removeItem("resetEmail");
        navigate("/login");
        }
        catch(err) {
            if(err.response && err.response.data) {
                setMessage(err.response.data.message);
            }
            else {
                setMessage("Something went wrong. Try again later");
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
                <p>{isSubmitting ? "Processing..." : message }</p>
           </div> 
        </div>
    );
}

export default ResetPassword;