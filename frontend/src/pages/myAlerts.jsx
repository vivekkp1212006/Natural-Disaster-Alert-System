import React, {useCallback, useEffect,useState} from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

const GetMyAlerts = () => {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("token");
    const user = JSON.parse(sessionStorage.getItem("user") || "null");
    const [isSubmitting,setIsSubmitting] = useState(false);
    const [message,setMessage] = useState("");
    const [alerts,setAlerts]= useState([]);
    const [viewMode, setViewMode] = useState("active");

    const getAlerts = useCallback(async () => {
        try {
            setIsSubmitting(true);
            const endpoint = viewMode === "history" ? "/api/alerts/me/history" : "/api/alerts/me";
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
    }, [token, viewMode]);

    useEffect( ()=>{
        if(! token) {
            navigate("/login");
            return ;
        }
        getAlerts();
    },[navigate, token, getAlerts]);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        navigate("/login");
    };

    
    
    return (
        <div className="login-container">
            <div className="login-box">
            <h2>My Alerts</h2>

            <div style={{marginBottom:"12px"}}>
                {user?.name ? <p>Welcome, {user.name}</p> : null}
                {user?.role ? <p>Role: {user.role}</p> : null}
            </div>

            <div style={{display:"flex", gap:"10px", marginBottom:"10px"}}>
                <button className="login-button" onClick={() => setViewMode("active")}>Active Alerts</button>
                <button className="login-button" onClick={() => setViewMode("history")}>Alert History</button>
            </div>

            {alerts.length > 0 ? (
            <ul>
                {alerts.map((alert) => (
                    <li key={alert._id}>
                        <p>
                            Risk: {alert.riskLevel} | Type: {alert.type}<br />
                            Expires: {new Date(alert.expiresAt).toLocaleString()}
                        </p>
                    </li>
                ))}
            </ul>
            ):(<p>{isSubmitting? "processing" : message? message : "No active alerts"}</p>)}

            <div style={{marginTop:"15px", display:"flex", gap:"12px", flexWrap:"wrap"}}>
                <Link to="/request-role">Request Role</Link>
                {user?.role === "admin" ? <Link to="/admin/role-requests">Admin Role Requests</Link> : null}
                {user?.role === "admin" ? <Link to="/admin/alerts">Admin Alerts</Link> : null}
            </div>

            <div style={{marginTop:"20px"}}>
                <button className="login-button" onClick={handleLogout}>Logout</button>
            </div>
            </div>
        </div>
    )
}
export default GetMyAlerts;