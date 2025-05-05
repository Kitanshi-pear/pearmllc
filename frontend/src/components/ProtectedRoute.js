import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, validateToken } = useAuth();
  const location = useLocation();

  // Check token validity - this adds an extra layer of security
  const isValidToken = validateToken();

  // If user is not authenticated, redirect to login
  if (!isAuthenticated || !isValidToken) {
    // Force removal of any invalid tokens
    if (!isValidToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("userEmail");
    }
    
    // Redirect to login page with the return url and message
    return (
      <Navigate 
        to="/" 
        state={{ 
          from: location, 
          message: "Please login to access this page" 
        }} 
        replace 
      />
    );
  }

  // If user is authenticated, render the protected component
  return children;
};

export default ProtectedRoute;