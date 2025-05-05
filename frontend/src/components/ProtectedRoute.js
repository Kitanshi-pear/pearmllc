import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  if (loading) {
    // You could return a loading spinner here
    return <div className="loading-container">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/" state={{ from: location, message: "Please login to access this page" }} replace />;
  }

  return children;
};

export default ProtectedRoute;