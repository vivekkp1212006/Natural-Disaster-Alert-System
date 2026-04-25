import React, { useState } from "react";
import "./style.css";
import { FaBars, FaQuestionCircle, FaFileAlt, FaPhone, FaShieldAlt, FaBook, FaLifeRing } from "react-icons/fa";

import aegisLogo from "../resources/aegis-logo.png";

const Home = () => {
  const [expanded, setExpanded] = useState(false);

  const menuItems = [
    { icon: <FaQuestionCircle />, label: "FAQ" },
    { icon: <FaShieldAlt />, label: "Privacy Policy" },
    { icon: <FaPhone />, label: "Contact Us" },
    { icon: <FaBook />, label: "License" },
    { icon: <FaFileAlt />, label: "Terms & Conditions" },
    { icon: <FaLifeRing />, label: "Support" },
  ];

  return (
    <div className="home-container">

      {/* TOP NAVBAR */}
      <div className="top-navbar">
        <img src={aegisLogo} alt="aegis" className="aegis-logo-navbar" />

        <button className="sos-button">SOS</button>
      </div>

      {/* LEFT SIDEBAR */}
      <div className={`side-navbar ${expanded ? "expanded" : ""}`}>
        
        {/* MENU ICON */}
        <div
          className="menu-icon"
          onClick={() => setExpanded(!expanded)}
        >
          <FaBars />
        </div>

        {/* MENU ITEMS */}
        <div className="menu-items">
          {menuItems.map((item, index) => (
            <div className="menu-item" key={index}>
              <div className="icon">{item.icon}</div>
              {expanded && <span className="label">{item.label}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* BODY (EMPTY FOR NOW) */}
      <div className="home-body"></div>

    </div>
  );
};

export default Home;