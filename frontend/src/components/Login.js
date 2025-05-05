import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we have a message from the redirect
    if (location.state?.message) {
      setAuthMessage(location.state.message);
    }
    
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [location, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

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

        // Redirect to the page the user was trying to access, or dashboard by default
        const from = location.state?.from?.pathname || "/dashboard";
        navigate(from);
      } else {
        setAuthMessage(res.data.error || "Login failed!");
      }
    } catch (err) {
      console.error("Login error:", err.response ? err.response.data : err.message);
      setAuthMessage("Login failed! Check your credentials and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background Elements */}
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="login-card">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <img src="/images/pearm_logo.png" alt="PearM Logo" className="logo" />
            <h1>Streamline Your Ad Management</h1>
            <p>5-minute cost updates across all major ad networks with detailed performance analytics</p>
            
            <div className="features">
              <div className="feature">
                <div className="feature-icon">📊</div>
                <div className="feature-text">Real-time Analytics</div>
              </div>
              <div className="feature">
                <div className="feature-icon">💰</div>
                <div className="feature-text">Revenue Tracking</div>
              </div>
              <div className="feature">
                <div className="feature-icon">🔄</div>
                <div className="feature-text">Multi-platform Sync</div>
              </div>
            </div>
            
            <div className="testimonial">
              <p>"PearM revolutionized how we manage our ad campaigns across platforms."</p>
              <div className="testimonial-author">— Marketing Director</div>
            </div>
          </div>
          <img src="/images/Login_banner.png" alt="Dashboard Preview" className="banner" />
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your <span className="accent-text">PearM</span> dashboard</p>
          </div>

          {/* Display auth message if any */}
          {authMessage && (
            <div className="auth-message">
              {authMessage}
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">✉️</span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="form-group">
              <div className="password-header">
                <label htmlFor="password">Password</label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p>Don't have an account? <a href="#" className="signup-link">Contact IT support</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;