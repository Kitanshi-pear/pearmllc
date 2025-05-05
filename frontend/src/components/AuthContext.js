import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

// Create Authentication Context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const email = localStorage.getItem("userEmail");
      
      if (token) {
        setIsAuthenticated(true);
        setCurrentUser(email);
        setUserRole(role);
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setUserRole(null);
      }
      
      setLoading(false);
    };
    
    checkAuthStatus();
    
    // Listen for changes to localStorage
    window.addEventListener("storage", checkAuthStatus);
    
    return () => {
      window.removeEventListener("storage", checkAuthStatus);
    };
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      const res = await axios.post(
        "https://pearmllc.onrender.com/api/auth/login",
        { email, password },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userEmail", email);
        
        setIsAuthenticated(true);
        setCurrentUser(email);
        setUserRole(res.data.role);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          error: res.data.error || "Login failed" 
        };
      }
    } catch (err) {
      console.error("Login error:", err.response ? err.response.data : err.message);
      return { 
        success: false, 
        error: err.response?.data?.message || "Login failed. Please check your credentials." 
      };
    }
  };

  // Logout function
  const logout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
    
    // Clear any additional data related to the user session
    // Example: localStorage.removeItem("user_preferences");
    
    // Optional: Clear all localStorage if you want a complete cleanup
    // localStorage.clear();
    
    // Reset auth state
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserRole(null);
    
    // You could also dispatch a global event to notify other components
    window.dispatchEvent(new Event("logout"));
    
    console.log("User logged out successfully");
  };

  // Check if token is valid (you could add a function to verify with backend)
  const validateToken = () => {
    const token = localStorage.getItem("token");
    return !!token; // Simple check if token exists
  };

  const value = {
    currentUser,
    userRole,
    isAuthenticated,
    validateToken,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;