import React from "react";
import { Link } from "react-router-dom";
import "./style.css";

const StaticInfoPage = ({ title, sections }) => {
  return (
    <div className="login-container">
      <div className="login-box static-info-box">
        <h2>{title}</h2>
        {sections.map((s) => (
          <section key={s.heading} className="static-info-section">
            <h3>{s.heading}</h3>
            <p>{s.text}</p>
          </section>
        ))}
        <p>
          <Link to="/home">Back to Home</Link>
        </p>
      </div>
    </div>
  );
};

export default StaticInfoPage;
