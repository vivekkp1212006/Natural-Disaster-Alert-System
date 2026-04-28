import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./style.css";
import StatusModal from "../components/StatusModal";

const Signup = () =>  {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [modal, setModal] = useState({ open: false, type: "error", message: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
    });
    const navigate = useNavigate();
    useEffect(() => {
        if(!navigator.geolocation) {
            setModal({ open: true, type: "error", message: "Geolocation is not supported by this browser" });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // successor callback
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
            },
            (error) => {
                if(error.code === 1) {
                    setModal({ open: true, type: "error", message: "Location permission denied. Please enable location access in browser settings and reload the page." });
                }
                else if(error.code === 2) {
                    setModal({ open: true, type: "error", message: "Location unavailable" });
                }
                else if(error.code === 3) {
                    setModal({ open: true, type: "error", message: "Location request timeout" });
                }
            }
        );
    },  []);
    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedEmail = email.trim();
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);
        const trimmeName  = name.trim();
        const nameRegex = /^[A-Za-z\s]+$/.test(trimmeName);

        if (!location.latitude || !location.longitude) {
            setModal({ open: true, type: "error", message: "Location is required to register" });
            return;
        }
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            setModal({ open: true, type: "error", message: "Enter a valid email address" });
            return;
        }
        if(!password) {
            setModal({ open: true, type: "error", message: "Set a password" });
            return;
        }
        if(!confirmPassword || password !== confirmPassword) {
            setModal({ open: true, type: "error", message: "Password mismatch" });
            return;
        }
        if( password.length < 8 || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
            setModal({ open: true, type: "error", message: "Weak password: include uppercase, lowercase, special character and minimum 8 characters" });
            return;
        } 
        if(!nameRegex) {
            setModal({ open: true, type: "error", message: "Name must contain only letters and spaces" });
            return;
        }
        //disable the subit button
        setIsSubmitting(true);

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, {name: trimmeName, email: trimmedEmail, password, location: {lat: location.latitude, lng: location.longitude,},});
            sessionStorage.setItem("pendingEmail", trimmedEmail);
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setModal({ open: true, type: "success", message: res.data.message });
            navigate("/verify-otp");
        }
        catch (err) {
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
            <h2>Sign-Up</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                /><br></br>
                </div>

                <div className="form-group">
                <input
                    type="email"
                    placeholder="email"
                    value={email}
                    required
                    onChange={ (e) => setEmail(e.target.value)}
                /><br></br>
                </div>

                <div className="form-group">
                <input
                    type="password"
                    placeholder="password"
                    value={password}
                    required
                    onChange={ (e)=> setPassword(e.target.value)}
                /><br></br>
                </div>

                <div className="form-group">
                <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    required
                    onChange={ (e) => setConfirmPassword(e.target.value)}
                /><br />
                </div>

                <button type="submit" disabled={isSubmitting} className="login-button">
                    Sign-Up
                </button>
              
            </form>
            <p>
                Already have an account? <Link to={"/login"}>Log in</Link>
            </p>
            <p className="pass-sec-message">{isSubmitting ? "Processing..." : ""}</p>
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

export default Signup;