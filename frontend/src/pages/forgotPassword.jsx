import React, {useEffect, useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        sessionStorage.removeItem("pendingEmail");
    },[]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ( !email ) {
            setMessage("Email required");
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`, {email} );
            setMessage(res.data.message);
            sessionStorage.setItem("resetEmail",email);
            navigate("/reset-password")
        }
        catch (err) {
            if( err.response && err.response.data ) {
                setMessage(err.response.data.message);
            }
            else {
                setMessage("Something went wrong. Try again later");
            }
        }
        finally {
            setIsSubmitting(false);
            setMessage(`${process.env.REACT_APP_API_URL}/api/auth/forgot-password`);
        }
    };

    return (
        <div>
            <h2>Forgot Password</h2><br/>
            <form onSubmit={handleSubmit}>
                <input 
                    type="email"
                    placeholder="email"
                    value={email}
                    required
                    onChange={ (e) => setEmail(e.target.value)}
                />
                <button type="submit" disabled={isSubmitting}>
                    Send OTP
                </button>
            </form>
            <p>{isSubmitting ? "Processing" : message}</p>
        </div>
    );
}

export default ForgotPassword;