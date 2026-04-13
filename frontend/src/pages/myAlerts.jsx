import React, {useCallback, useEffect,useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./login.css";

const GetMyAlerts = () => {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");
    const [isSubmitting,setIsSubmitting] = useState(false);
    const [message,setMessage] = useState("");
    const [alerts,setAlerts]= useState([]);
    const [viewMode, setViewMode] = useState("active");

    const getAlerts = useCallback(async (mode) => {
        try {
            setIsSubmitting(true);
            const endpoint = mode === "history" ? "/api/alerts/me/history" : "/api/alerts/me";
            const res = await axios.get(`${process.env.REACT_APP_API_URL}${endpoint}`, {
                headers: {Authorization : `Bearer ${token}`}
            });
            setAlerts(res.data.alerts || []);
            setMessage("");
        } catch (err) {
            if(err.response && err.response.data ) {
                setMessage(err.response.data.message)
            }
            else{
                setMessage("Something went wrong. Try again later");
            }
        }
        finally {
            setIsSubmitting(false);
        }
    }, [token]);
    useEffect( ()=>{
        if(! token) {
            navigate("/login");
            return ;
        }
        getAlerts(viewMode);
    },[navigate, token, viewMode, getAlerts]);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login");
    };

    
    
    return (
        <div className="login-container">
            <div className="login-box">
            <h2>My Alerts</h2>
            <div style={{display:"flex", gap:"8px", marginBottom:"15px"}}>
                <button className="login-button" onClick={() => setViewMode("active")}>
                    Active Alerts
                </button>
                <button className="login-button" onClick={() => setViewMode("history")}>
                    Alert History
                </button>
            </div>

            {alerts.length > 0 ? (
            <ul>
                {alerts.map((alert, index) => (
                    <li key={index}>
                        <p>
                            Risk: {alert.riskLevel} | Type: {alert.type}<br />
                            Expires: {new Date(alert.expiresAt).toLocaleString()}
                        </p>
                    </li>
                ))}
            </ul>
            ):(<p>{isSubmitting? "processing" : message? message : "No active alerts"}</p>)}
            <button className="login-button" onClick={handleLogout}>Logout</button>
            </div>
        </div>
    )
}
export default GetMyAlerts;