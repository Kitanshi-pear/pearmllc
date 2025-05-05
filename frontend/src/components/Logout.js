import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

/**
 * Logout component that handles user logout
 * This component automatically logs the user out when rendered
 * and redirects them to the login page
 */
const Logout = () => {
  const { logout } = useAuth();
  
  useEffect(() => {
    // Call the logout function from AuthContext
    logout();
    
    // Clear any additional session data if needed
    // For example:
    // sessionStorage.clear();
    
    // You might want to trigger an API call to invalidate the token on the server
    // This is optional and depends on your backend implementation
    const logoutFromServer = async () => {
      try {
        // The token is included automatically in the request if using axios with withCredentials
        // await axios.post("https://pearmllc.onrender.com/api/auth/logout", {}, {
        //   withCredentials: true
        // });
      } catch (error) {
        console.error("Error logging out from server:", error);
      }
    };
    
    logoutFromServer();
  }, [logout]);

  // Redirect to login page
  return <Navigate to="/" state={{ message: "You have been logged out successfully." }} replace />;
};

export default Logout;