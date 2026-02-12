import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Signup = () =>  {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
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

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

        if (!location.latitude || !location.longitude) {
            setMessage("Location is required to register");
            return;
        }
        if(!password) {
            setMessage("Set a password");
            return;
        }
        if(!confirmPassword || password !== confirmPassword) {
            setMessage("Password mismatch");
            return;
        }
        if( password.length < 8 || !hasUpperCase || !hasLowerCase || !hasSpecialChar) {
            setMessage(`Too weak password \nPassword rules \nOne upper case character \nOne lowercase character \nOne special character \n atleast 8 characters`);
            return;
        } 
         
        //disable the subit button
        setIsSubmitting(true);

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
        finally {
            // enables the button
            setIsSubmitting(false);
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
                /><br></br>
                <input
                    type="email"
                    placeholder="email"
                    value={email}
                    required
                    onChange={ (e) => setEmail(e.target.value)}
                /><br></br>
                <input
                    type="password"
                    placeholder="password"
                    value={password}
                    required
                    onChange={ (e)=> setPassword(e.target.value)}
                /><br></br>
                <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    required
                    onChange={ (e) => setConfirmPassword(e.target.value)}
                /><br />
                <button type="submit" disabled={isSubmitting}>
                    Sign-Up
                </button>
            </form>
            <p>
                Already have an account? <Link to={"/login"}>Log in</Link>
            </p>
            <p>{isSubmitting ? "Processing..." : message }</p>
        </div>
    );
};

export default Signup;