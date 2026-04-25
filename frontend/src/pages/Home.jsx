import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaBell,
  FaClipboardList,
  FaHandsHelping,
  FaMapMarkedAlt,
  FaPhoneAlt,
  FaShieldAlt,
  FaSignOutAlt,
  FaUserShield
} from "react-icons/fa";
import "./style.css";
import aegisLogo from "../resources/aegis-logo.png";

const Home = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = JSON.parse(sessionStorage.getItem("user") || "null");

  if (!token) {
    navigate("/login");
    return null;
  }

  const baseCards = [
    {
      title: "My Alerts",
      description: "See live and history alerts generated for your location.",
      icon: <FaBell />,
      to: "/my-alerts",
      buttonText: "Open Alerts"
    },
    {
      title: "Role Request",
      description: "Request volunteer, camp officer, team leader or admin role.",
      icon: <FaUserShield />,
      to: "/request-role",
      buttonText: "Request Role"
    },
    {
      title: "Management",
      description: "Training, camps, operations and disciplinary workflows.",
      icon: <FaHandsHelping />,
      to: "/management",
      buttonText: "Open Dashboard"
    }
  ];

  const quickCards = user?.role === "admin"
    ? [
        ...baseCards,
        {
          title: "Pending Role Requests",
          description: "Approve or reject user role change requests.",
          icon: <FaClipboardList />,
          to: "/admin/role-requests",
          buttonText: "Review Requests"
        },
        {
          title: "Admin Alert Monitor",
          description: "Track all generated system alerts in one place.",
          icon: <FaShieldAlt />,
          to: "/admin/alerts",
          buttonText: "Open Admin Alerts"
        }
      ]
    : baseCards;

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="home-premium-page">
      <header className="home-premium-top">
        <div className="home-premium-brand">
          <img src={aegisLogo} alt="Aegis logo" />
          <div>
            <h1>Aegis Disaster Response Hub</h1>
            <p>Multi-Hazard Real-Time Alert and Management System</p>
          </div>
        </div>
        <div className="home-premium-top-actions">
          <a href="tel:112" className="sos-premium-btn">
            <FaPhoneAlt /> Emergency 112
          </a>
          <button className="logout-premium-btn" onClick={handleLogout}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <section className="home-premium-hero">
        <div>
          <h2>Welcome, {user?.name || "User"}</h2>
          <p>
            Your unified panel for alerts, role requests, volunteer governance, camp operations,
            training sessions and incident response workflows.
          </p>
        </div>
        <div className="home-premium-role-badge">
          <span>Current Role</span>
          <strong>{user?.role || "user"}</strong>
        </div>
      </section>

      <section className="home-premium-grid">
        {quickCards.map((card) => (
          <article className="home-premium-card" key={card.title}>
            <div className="home-premium-card-icon">{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
            <Link to={card.to} className="home-premium-link-btn">
              {card.buttonText}
            </Link>
          </article>
        ))}
      </section>

      <section className="home-premium-footer-links">
        <a href="https://earthquake.usgs.gov/" target="_blank" rel="noreferrer">
          <FaMapMarkedAlt /> USGS Data Source
        </a>
        <a href="https://openweathermap.org/" target="_blank" rel="noreferrer">
          <FaMapMarkedAlt /> OpenWeather Data Source
        </a>
        <a href="mailto:support@aegis.local">
          <FaPhoneAlt /> Contact Support
        </a>
      </section>
    </div>
  );
};

export default Home;