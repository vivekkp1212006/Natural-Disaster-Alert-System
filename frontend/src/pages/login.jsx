import React, { useState } from "react";
import { login } from "../services/authService";
import "./style.css";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import StatusModal from "../components/StatusModal";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState({ open: false, type: "error", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setModal({ open: true, type: "error", message: "Enter a valid email address" });
      return;
    }
    if (!password) {
      setModal({ open: true, type: "error", message: "Password is required" });
      return;
    }

    //disable the subit button
    setIsSubmitting(true);

    try {
      const data = await login(trimmedEmail, password);
      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));
      
      navigate("/home");
    } catch (err) {
      if (err.response && err.response.data) {
        setModal({ open: true, type: "error", message: err.response.data.message });
      } else {
        setModal({ open: true, type: "error", message: "Something went wrong. Try again later" });
      }
    }
    finally {
        // enables the button
        setIsSubmitting(false);
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
          <button type="submit" disabled={isSubmitting} className="login-button">
            Login
          </button>
        </form>
        <p>
          Don't have an account? <Link to={"/signup"}>Sign Up</Link>
        </p>

        <p>{isSubmitting ? "Processing..." : ""}</p>
        <StatusModal
          open={modal.open}
          type={modal.type}
          message={modal.message}
          onClose={() => setModal({ open: false, type: "error", message: "" })}
        />
      </div>
    </div>
  );
};

export default Login;