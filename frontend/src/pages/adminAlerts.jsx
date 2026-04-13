import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

const AdminAlerts = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const [alerts, setAlerts] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin") {
      setMessage("Only admin can access this page");
      return;
    }

    const fetchAllAlerts = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/alerts/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAlerts(res.data.alerts || []);
      } catch (err) {
        setMessage(err.response?.data?.message || "Failed to load alerts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllAlerts();
  }, [navigate, token, user?.role]);

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>All Alerts (Admin)</h2>
        {isLoading ? <p>Loading...</p> : null}
        {message ? <p>{message}</p> : null}

        {alerts.length === 0 ? (
          <p>No alerts found</p>
        ) : (
          <ul>
            {alerts.map((alert) => (
              <li key={alert._id}>
                <p>
                  Type: {alert.type} | Risk: {alert.riskLevel}<br />
                  User: {alert.user}<br />
                  Expires: {new Date(alert.expiresAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p><Link to="/my-alerts">Back to Alerts</Link></p>
      </div>
    </div>
  );
};

export default AdminAlerts;
