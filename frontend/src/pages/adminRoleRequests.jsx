import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

const AdminRoleRequests = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const [requests, setRequests] = useState([]);
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

    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/roles/pending`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data.requests || []);
      } catch (err) {
        setMessage(err.response?.data?.message || "Failed to fetch requests");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, [navigate, token, user?.role]);

  const handleAction = async (userId, action) => {
    try {
      const url = `${process.env.REACT_APP_API_URL}/api/roles/${action}/${userId}`;
      const res = await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage(res.data.message || "Updated");
      setRequests((prev) => prev.filter((item) => item._id !== userId));
    } catch (err) {
      setMessage(err.response?.data?.message || "Action failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Pending Role Requests</h2>
        {isLoading ? <p>Loading...</p> : null}
        {message ? <p>{message}</p> : null}

        {requests.length === 0 ? (
          <p>No pending requests</p>
        ) : (
          <ul>
            {requests.map((req) => (
              <li key={req._id}>
                <p>
                  Name: {req.name}<br />
                  Email: {req.email}<br />
                  Requested Role: {req.requestedRole}
                </p>
                <button className="login-button" onClick={() => handleAction(req._id, "approve")}>
                  Approve
                </button>
                <button className="login-button" onClick={() => handleAction(req._id, "reject")}>
                  Reject
                </button>
              </li>
            ))}
          </ul>
        )}

        <p><Link to="/my-alerts">Back to Alerts</Link></p>
      </div>
    </div>
  );
};

export default AdminRoleRequests;
