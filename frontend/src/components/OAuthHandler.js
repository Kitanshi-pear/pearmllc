// OAuthHandler.js
import { useState } from 'react';

// Base URL for your API
const API_URL = "https://pearmllc.onrender.com/api/traffic";

export function OAuthHandler() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Simple function to initiate OAuth
  const connectWithPlatform = (platform) => {
    // Reset state
    setIsConnecting(true);
    setAuthError(null);

    // Register message listener BEFORE opening popup
    const handleMessage = (event) => {
      console.log("Message received:", event.data);
      
      // Only process if message has correct structure
      if (event.data && event.data.type) {
        if (event.data.type === 'auth_success') {
          console.log(`Successfully connected with ${platform}`);
          
          // Store token in localStorage if provided
          if (event.data.token) {
            localStorage.setItem('auth_token', event.data.token);
          }
          
          // Update state
          setIsConnected(true);
          setIsConnecting(false);
          
          // Remove listener after successful auth
          window.removeEventListener('message', handleMessage);
        } 
        else if (event.data.type === 'auth_error') {
          console.error(`Error connecting with ${platform}:`, event.data.message);
          
          // Update state
          setAuthError(event.data.message || 'Authentication failed');
          setIsConnecting(false);
          
          // Remove listener after failed auth
          window.removeEventListener('message', handleMessage);
        }
      }
    };

    // Add message listener
    window.addEventListener('message', handleMessage);
    
    // Open the popup
    const width = 600;
    const height = 700;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    
    const authWindow = window.open(
      `${API_URL}/auth/${platform.toLowerCase()}`,
      `${platform}Auth`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
    
    // Handle popup blocker case
    if (!authWindow || authWindow.closed || typeof authWindow.closed === 'undefined') {
      setAuthError('Popup was blocked. Please allow popups for this site.');
      setIsConnecting(false);
      window.removeEventListener('message', handleMessage);
      return;
    }
    
    // Setup a timeout to check if popup was closed manually
    const checkPopupClosed = setInterval(() => {
      if (authWindow.closed) {
        clearInterval(checkPopupClosed);
        
        // If still connecting when popup closes, user probably closed it manually
        if (isConnecting) {
          setAuthError('Authentication was cancelled');
          setIsConnecting(false);
          window.removeEventListener('message', handleMessage);
        }
      }
    }, 500);
  };

  return {
    isConnecting,
    isConnected,
    authError,
    connectWithPlatform
  };
}