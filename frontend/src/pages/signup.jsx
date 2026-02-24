import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./signup.css";

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
    });
    const navigate = useNavigate();

    useEffect(() => {
        if (!navigator.geolocation) {
            setMessage("Geolocation is not supported by this browser");
            setMessageType("error");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setMessage("Location detected successfully!");
                setMessageType("success");
            },
            (error) => {
                setMessageType("error");
                if (error.code === 1) {
                    setMessage("Location permission denied. Please enable location access in browser settings and reload the page.");
                } else if (error.code === 2) {
                    setMessage("Location unavailable");
                } else if (error.code === 3) {
                    setMessage("Request timeout");
                }
            }
        );
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location.latitude || !location.longitude) {
            setMessage("Location is required to register");
            setMessageType("error");
            return;
        }

        try {
<<<<<<< Updated upstream
            const res = await axios.post("http://localhost:5000/api/auth/register", {
                name,
                email,
                password,
                location: {
                    lat: location.latitude,
                    lng: location.longitude,
                },
            });
=======
            const res = await axios.post("http://localhost:5001/api/auth/register", {name, email, password, location: {lat: location.latitude, lng: location.longitude,},});
>>>>>>> Stashed changes
            setMessage(res.data.message);
            setMessageType("success");
            localStorage.setItem("pendingEmail", email);
            navigate("/verify-otp");
        } catch (err) {
            setMessageType("error");
            if (err.response && err.response.data) {
                setMessage(err.response.data.message);
            } else {
                setMessage("Something went wrong. Try again later");
            }
        }
    };

    return (
        <div className="signup-container">
            <div className="signup-box">
                <h2>Sign Up</h2>

                <form onSubmit={handleSubmit} className="signup-form">
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            required
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            required
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            required
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="signup-button">
                        Sign Up
                    </button>
                </form>

                <p className="login-link">
                    Already have an account? <Link to={"/login"}>Log in</Link>
                </p>

                {message && (
                    <p className={`message ${messageType}`}>{message}</p>
                )}
            </div>
        </div>
    );
};

export default Signup;