import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./style.css";
import StatusModal from "../components/StatusModal";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [modal, setModal] = useState({ open: false, type: "error", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        sessionStorage.removeItem("pendingEmail");
    },[]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setModal({ open: true, type: "error", message: "Enter a valid email address" });
            return;
        }

        setIsSubmitting(true);

        try {
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/auth/forgot-password`,
                { email: trimmedEmail }
            );

            setModal({ open: true, type: "success", message: res.data.message });
            sessionStorage.setItem("resetEmail", trimmedEmail);
            setEmail("");
            navigate("/reset-password")
        }
        catch (err) {
            if( err.response && err.response.data ) {
                setModal({ open: true, type: "error", message: err.response.data.message });
            } else {
                setModal({ open: true, type: "error", message: "Something went wrong. Try again later" });
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

export default ForgotPassword;