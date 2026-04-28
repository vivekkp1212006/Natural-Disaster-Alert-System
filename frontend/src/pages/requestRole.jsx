import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./style.css";
import StatusModal from "../components/StatusModal";

const RequestRole = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");
  const [modal, setModal] = useState({ open: false, type: "success", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!token) {
    navigate("/login");
    return null;
  }

  if (user?.role && user.role !== "user") {
    return (
      <div className="login-container">
        <div className="login-box">
          <p>Only regular users can request the volunteer role.</p>
          <Link to="/home">Back to home</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/roles/request`,
        { requestedRole: "volunteer" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setModal({ open: true, type: "success", message: res.data.message });
    } catch (err) {
      setModal({ open: true, type: "error", message: err.response?.data?.message || "Something went wrong. Try again later" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Request volunteer role</h2>
        <p className="home-small-hint">Submit enrollment on the home page first, then request here.</p>
        <form onSubmit={handleSubmit}>
          <button type="submit" disabled={isSubmitting} className="login-button">
            Submit volunteer request
          </button>
        </form>
        <p>{isSubmitting ? "Processing..." : ""}</p>
        <StatusModal
          open={modal.open}
          type={modal.type}
          message={modal.message}
          onClose={() => setModal({ open: false, type: "success", message: "" })}
        />
        <p>
          <Link to="/home">Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default RequestRole;
