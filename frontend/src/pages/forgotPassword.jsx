import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        sessionStorage.removeItem("pendingEmail");
    },[]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email) {
            setMessage("Email required");
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await axios.post(
                "http://localhost:5001/api/auth/forgot-password",
                { email }
            );

            setMessage(res.data.message);
            sessionStorage.setItem("resetEmail",email);
            navigate("/reset-password")
        }
        catch (err) {
            if( err.response && err.response.data ) {
                setMessage(err.response.data.message);
            } else {
                setMessage("Something went wrong. Try again later");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Forgot Password</h2>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="email"
                            value={email}
                            required
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="login-button">
                        {isSubmitting ? "Processing..." : "Send OTP"}
                    </button>
                </form>

                <p>{message}</p>
            </div>
        </div>
    );
};

export default ForgotPassword;