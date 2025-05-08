// Inside your modal component
import React from 'react';
import { OAuthHandler } from './OAuthHandler';
import { Button, Alert, CircularProgress } from '@mui/material';

function ConnectPlatformButton({ platform }) {
  const { isConnecting, isConnected, authError, connectWithPlatform } = OAuthHandler();
  
  return (
    <div>
      <Button
        variant={isConnected ? "outlined" : "contained"} 
        onClick={() => connectWithPlatform(platform)}
        disabled={isConnecting}
        startIcon={isConnecting ? <CircularProgress size={20} /> : null}
      >
        {isConnecting 
          ? `Connecting to ${platform}...` 
          : isConnected 
            ? `Reconnect ${platform}` 
            : `Connect with ${platform}`
        }
      </Button>
      
      {authError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {authError}
        </Alert>
      )}
      
      {isConnected && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Successfully connected to {platform}!
        </Alert>
      )}
    </div>
  );
}

// Use it in your tab content
function FacebookTabContent() {
  return (
    <div>
      <h3>Connect to Facebook</h3>
      <p>Connect your Facebook account to enable integrations.</p>
      <ConnectPlatformButton platform="Facebook" />
    </div>
  );
}