import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";

const RequestRole = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [requestedRole, setRequestedRole] = useState("volunteer");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    navigate("/login");
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/roles/request`,
        { requestedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
    } catch (err) {
      if (err.response?.data?.message) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Something went wrong. Try again later");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Request Role Upgrade</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <select
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value)}
              style={{ width: "100%", padding: "10px" }}
            >
              <option value="volunteer">Volunteer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="login-button">
            Submit Request
          </button>
        </form>
        <p>{isSubmitting ? "Processing..." : message}</p>
        <p><Link to="/my-alerts">Back to Alerts</Link></p>
      </div>
    </div>
  );
};

export default RequestRole;
