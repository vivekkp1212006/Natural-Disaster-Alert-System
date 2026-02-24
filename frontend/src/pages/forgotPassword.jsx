import React, {useEffect, useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        localStorage.removeItem("pendingEmail");
    },[]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if ( !email ) {
            setMessage("Email required");
            return;
        }
        try {
            const res = await axios.post("http://localhost:5001/api/auth/forgot-password", {email} );
            setMessage(res.data.message);
            localStorage.setItem("resetEmail",email);
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
                <button type="submit">
                    Send OTP
                </button>
            </form>
            <p>{message}</p>
        </div>
    );
}

export default ForgotPassword;