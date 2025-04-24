import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "https://pearmllc.onrender.com/api/auth/login",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      console.log("Login Response:", res.data);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userEmail", email);

        navigate("/dashboard");
      } else {
        alert(res.data.error || "Login failed!");
      }
    } catch (err) {
      console.error("Login error:", err.response ? err.response.data : err.message);
      alert("Login failed! Check API request.");
    }
  };

  return (
    <div className="login-container">
      {/* Left Side */}
      <div className="login-left">
        <img src="/images/pearm_logo.png" alt="PearM Logo" className="logo" />
        <h2>Ad spend & revenue sync</h2>
        <p>5-min cost update frequency up to ad level across all major ad networks</p>
        <img src="/images/Login_banner.png" alt="Login Banner" className="banner" />
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right">
        <h2>
          Welcome to <span className="red-text">PearM Dashboard</span>
        </h2>
        <p>Sign in to the internal platform</p>

        <form onSubmit={handleLogin}>
          <label>Email<span className="required">*</span></label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />

          <label>Password<span className="required">*</span></label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
          />

          <a href="#" className="forgot-password">Forgot password?</a>

          <button type="submit" className="login-button">Log in</button>
        </form>
      </div>
    </div>
  );
};

export default Login;