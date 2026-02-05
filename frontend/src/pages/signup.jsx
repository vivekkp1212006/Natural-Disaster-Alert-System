import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () =>  {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [location, setLocation] = useState({
        latitude: null,
        longitude: null,
    });
    const navigate = useNavigate();
    useEffect(() => {
        if(!navigator.geolocation) {
            setMessage("Geolocation is not supported by this browser");
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
                    setMessage("Location permission denied. Please enable location access in browser settings and reload the page.");
                }
                else if(error.code === 2) {
                    setMessage("Location un available");
                }
                else if(error.code === 3) {
                    setMessage("Request timeout");
                }
            }
        );
    },  []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location.latitude || !location.longitude) {
            setMessage("Location is required to register");
            return;
        }
            
        try {
            const res = await axios.post("http://localhost:5000/api/auth/register", {name, email, password, location: {lat: location.latitude, lng: location.longitude,},});
            setMessage(res.data.message);
            localStorage.setItem("pendingEmail", email);
            navigate("/verify-otp");
        }
        catch (err) {
            if(err.response && err.response.data) {
                setMessage(err.response.data.message);
            }
            else {
                setMessage("Something went wrong. Try again later");
            }
        }
    };
    return (
        <div>
            <h2>Sign-Up</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    required
                    onChange={(e) => setName(e.target.value)}
                />
                <input
                    type="email"
                    placeholder="email"
                    value={email}
                    required
                    onChange={ (e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="password"
                    value={password}
                    required
                    onChange={ (e)=> setPassword(e.target.value)}
                />
                <button type="submit">
                    Sign-Up
                </button>
            </form>
            <p>{message || "Fetching location..."}</p>
        </div>
    );
};

export default Signup;