import React, { useEffect, useState, useRef } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaChevronDown, FaQuestionCircle, FaEnvelope, FaSignOutAlt } from "react-icons/fa";
import aegisLogo from "../resources/aegis-logo.png";
import "../pages/style.css";

const AppShell = () => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem("token");
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const load = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
        if (res.data?.user) {
          sessionStorage.setItem("user", JSON.stringify(res.data.user));
        }
      } catch (err) {
        setProfile(null);
        if (err.response?.status === 401) {
          sessionStorage.removeItem("token");
          navigate("/login");
        }
      }
    };
    load();
  }, [token, navigate]);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login");
  };

  const user = profile?.user || JSON.parse(sessionStorage.getItem("user") || "null");
  const badge = profile?.rankingBadge;

  return (
    <div className="app-shell-root">
      <nav className="app-shell-nav">
        <Link to="/home" className="app-shell-logo-link">
          <img src={aegisLogo} alt="Aegis" className="app-shell-logo" />
          <span className="app-shell-brand-text">Aegis</span>
        </Link>
        <div className="app-shell-nav-right" ref={menuRef}>
          <button type="button" className="app-shell-profile-btn" onClick={() => setOpen(!open)}>
            <span className="app-shell-avatar">{user?.name?.charAt(0)?.toUpperCase() || "?"}</span>
            <FaChevronDown className="app-shell-chevron" />
          </button>
          {open ? (
            <div className="app-shell-dropdown">
              <p className="app-shell-drop-name">{user?.name}</p>
              <p className="app-shell-drop-meta">Role: {user?.role}</p>
              {user?.role !== "user" && badge ? <p className="app-shell-badge">Badge: {badge}</p> : null}
              {user?.suspension?.active ? (
                <p className="app-shell-susp">Suspended until {user.suspension.endsAt ? new Date(user.suspension.endsAt).toLocaleString() : "—"}</p>
              ) : null}
              <a className="app-shell-drop-link" href="#faq" onClick={() => setOpen(false)}>
                <FaQuestionCircle /> FAQ
              </a>
              <a className="app-shell-drop-link" href="mailto:support@aegis.local">
                <FaEnvelope /> Contact
              </a>
              <button type="button" className="app-shell-drop-logout" onClick={handleLogout}>
                <FaSignOutAlt /> Logout
              </button>
            </div>
          ) : null}
        </div>
      </nav>
      <main className="app-shell-main">
        <Outlet />
      </main>
      <footer className="app-shell-faq" id="faq">
        <h4>FAQ</h4>
        <p>Alerts use USGS and OpenWeather. Volunteer onboarding requires enrollment and camp officer training sign-off.</p>
      </footer>
    </div>
  );
};

export default AppShell;
