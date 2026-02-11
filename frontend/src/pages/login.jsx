import React, { useState } from "react";
import { login } from "../services/authService";
import "./login.css";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(email, password);
      setMessage(data.message);
      setMessageType("success");
      localStorage.setItem("token", data.token);
    } catch (err) {
      setMessageType("error");
      if (err.response && err.response.data) {
        setMessage(err.response.data.message);
      } else {
        setMessage("Something went wrong. Try again later");
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Login</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <p><Link to={"/forgot-password"}>Forgot password</Link></p>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <p>
          Don't have an account? <Link to={"/signup"}>Sign Up</Link>
        </p>

        {message && (
          <p className={`message ${messageType}`}>{message}</p>
        )}
      </div>
    </div>
  );
};

export default Login;