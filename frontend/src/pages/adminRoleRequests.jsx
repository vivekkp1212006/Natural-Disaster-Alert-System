import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";
import StatusModal from "../components/StatusModal";

const AdminRoleRequests = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const [requests, setRequests] = useState([]);
  const [modal, setModal] = useState({ open: false, type: "success", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    if (user?.role !== "admin") {
      setModal({ open: true, type: "error", message: "Only admin can access this page" });
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
        setModal({ open: true, type: "error", message: err.response?.data?.message || "Failed to fetch requests" });
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
      setModal({ open: true, type: "success", message: res.data.message || "Updated" });
      setRequests((prev) => prev.filter((item) => item._id !== userId));
    } catch (err) {
      setModal({ open: true, type: "error", message: err.response?.data?.message || "Action failed" });
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Pending Role Requests</h2>
        {isLoading ? <p>Loading...</p> : null}
        <StatusModal
          open={modal.open}
          type={modal.type}
          message={modal.message}
          onClose={() => setModal({ open: false, type: "success", message: "" })}
        />

        {requests.length === 0 ? (
          <p>No pending requests</p>
        ) : (
          <ul>
            {requests.map((req) => (
              <li key={req._id}>
                <p>
                  Name: {req.name}<br />
                  Email: {req.email}<br />
                  AGS ID: {req.AGS_ID}<br />
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
