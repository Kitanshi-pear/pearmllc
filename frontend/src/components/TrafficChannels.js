import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Paper,
  Grid,
  Modal,
  Card,
  Chip,
  Divider,
  Select,
  MenuItem,
  InputAdornment,
  Snackbar,
  Alert,
  CircularProgress,
  Stack,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tabs,
  Tab,
  alpha
} from '@mui/material';
import Layout from "./Layout";
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

// API endpoint for traffic channels
const API_URL = "https://pearmllc.onrender.com/api/traffic";

// Main component with redirect-based auth flow
const TrafficChannels = () => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State management
  const [authStatus, setAuthStatus] = useState({
    facebook: false,
    google: false,
    tiktok: false
  });
  const [rows, setRows] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [openSecondModal, setOpenSecondModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });
  const [loading, setLoading] = useState({
    table: true,
    form: false,
    facebook: false,
    google: false,
    tiktok: false,
    save: false,
    delete: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info"
  });
  const [editMode, setEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [currentTab, setCurrentTab] = useState(0);
  const [channelConnectionStatus, setChannelConnectionStatus] = useState({});
  
  // Form data state
  const [formData, setFormData] = useState({
    // Basic form fields as before
    channelName: "",
    aliasChannel: "",
    costUpdateDepth: "",
    costUpdateFrequency: "5 Minutes",
    currency: "USD",
    // Other fields...
    isConnected: false
  });
  
  // Store pending authentication state in session storage
  const [pendingAuth, setPendingAuth] = useState({
    inProgress: false,
    platform: null,
    channelId: null
  });

  // ----- OAUTH REDIRECT HANDLING -----
  
  // Check for OAuth callback parameters in URL when component mounts
  useEffect(() => {
    const handleOAuthCallback = () => {
      // Get URL parameters
      const params = new URLSearchParams(location.search);
      const platform = params.get('platform');
      const success = params.get('success');
      const error = params.get('error');
      const message = params.get('message');
      const session = params.get('session');
      
      // Check if this is an OAuth callback
      if (platform) {
        console.log(`Detected OAuth callback for ${platform}, success=${success}`);
        
        // Retrieve pending auth data from session storage
        const storedPendingAuth = sessionStorage.getItem('pendingAuth');
        let pendingAuthData = null;
        
        if (storedPendingAuth) {
          try {
            pendingAuthData = JSON.parse(storedPendingAuth);
            console.log("Retrieved pending auth data:", pendingAuthData);
          } catch (e) {
            console.error("Error parsing pending auth data:", e);
          }
        }
        
        // Clean URL params to avoid reprocessing on refresh
        navigate(location.pathname, { replace: true });
        
        if (success === 'true' && session) {
          // Successful authentication
          console.log(`${platform} authentication successful`);
          
          // Store session token
          localStorage.setItem('sessionToken', session);
          
          // Update auth status
          setAuthStatus(prev => ({
            ...prev,
            [platform.toLowerCase()]: true
          }));
          
          // Show success message
          setSnackbar({
            open: true,
            message: `${platform} account connected successfully`,
            severity: 'success'
          });
          
          // If we have pending auth data, reopen the modal and update connection
          if (pendingAuthData && pendingAuthData.channelId) {
            console.log("Reopening modal for channel:", pendingAuthData.channelId);
            
            // Find the channel and reopen modal
            const channel = rows.find(row => row.id === pendingAuthData.channelId);
            if (channel) {
              // Update connection status
              setChannelConnectionStatus(prev => ({
                ...prev,
                [pendingAuthData.channelId]: true
              }));
              
              // Reopen the modal with the updated data
              handleEditChannel(channel);
              
              // Navigate to the appropriate tab
              if (platform.toLowerCase() === 'facebook') {
                setCurrentTab(1);
              } else if (platform.toLowerCase() === 'google') {
                setCurrentTab(2);
              }
              
              // Update the form data
              setFormData(prev => ({
                ...prev,
                isConnected: true
              }));
              
              // Save the connection status to the API
              saveConnectionStatus(pendingAuthData.channelId, platform.toLowerCase(), true);
            }
          }
        } else if (error === 'true' || success === 'false') {
          // Failed authentication
          console.log(`${platform} authentication failed:`, message);
          
          // Show error message
          setSnackbar({
            open: true,
            message: `Failed to connect to ${platform}: ${message || 'Authentication failed'}`,
            severity: 'error'
          });
          
          // If we have pending auth data, reopen the modal
          if (pendingAuthData && pendingAuthData.channelId) {
            const channel = rows.find(row => row.id === pendingAuthData.channelId);
            if (channel) {
              handleEditChannel(channel);
              
              // Navigate to the appropriate tab
              if (platform.toLowerCase() === 'facebook') {
                setCurrentTab(1);
              } else if (platform.toLowerCase() === 'google') {
                setCurrentTab(2);
              }
            }
          }
        }
        
        // Clear pending auth state
        sessionStorage.removeItem('pendingAuth');
        setPendingAuth({
          inProgress: false,
          platform: null,
          channelId: null
        });
      }
    };
    
    handleOAuthCallback();
  }, [location, navigate, rows]);

  // Fetch channels data when component mounts
  useEffect(() => {
    const fetchChannels = async () => {
      setLoading(prev => ({ ...prev, table: true }));
      
      try {
        const response = await axios.get(API_URL);
        
        if (response.data && Array.isArray(response.data)) {
          setRows(response.data);
          
          // Set up connection statuses based on data
          const newConnectionStatus = {};
          response.data.forEach(row => {
            newConnectionStatus[row.id] = row.isConnected || 
                                       (row.apiAccessToken && row.aliasChannel === 'Facebook') || 
                                       (row.googleAdsAccountId && row.aliasChannel === 'Google');
          });
          
          setChannelConnectionStatus(newConnectionStatus);
        } else {
          setRows([]);
          setSnackbar({
            open: true,
            message: "Could not load channels: Unexpected data format",
            severity: "error"
          });
        }
      } catch (error) {
        console.error("Error fetching channels:", error);
        setRows([]);
        setSnackbar({
          open: true,
          message: `Could not load channels: ${error.message}`,
          severity: "error"
        });
      } finally {
        setLoading(prev => ({ ...prev, table: false }));
      }
    };
    
    fetchChannels();
  }, [dateRange.startDate, dateRange.endDate]);
  
  // Check auth status when component mounts
  useEffect(() => {
    const checkApiAuthStatus = async () => {
      try {
        const sessionToken = localStorage.getItem('sessionToken');
        
        if (sessionToken) {
          const response = await axios.get(`${API_URL}/auth`, {
            headers: {
              Authorization: `Bearer ${sessionToken}`
            }
          });
          
          if (response.data) {
            setAuthStatus({
              facebook: response.data.facebook?.connected || false,
              google: response.data.google?.connected || false,
              tiktok: response.data.tiktok?.connected || false
            });
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };
    
    checkApiAuthStatus();
  }, []);

  // Helper function to determine if platform is connectable
  const isPlatformConnectable = (platformName) => {
    if (!platformName) return false;
    const platformLower = platformName.toLowerCase();
    return ["facebook", "google", "tiktok"].includes(platformLower);
  };

  // Function to check if current channel is connected
  const isChannelConnected = (platform) => {
    console.log(`Checking connection status for ${platform}`);
    
    // For an existing channel being edited
    if (editMode && selectedRow) {
      const status = channelConnectionStatus[selectedRow.id];
      console.log(`Existing channel status for ${selectedRow.id}: ${status}`);
      return status || false;
    }
    
    // For a new channel, check global auth status
    if (platform === 'Facebook') {
      console.log(`Facebook global auth status: ${authStatus.facebook}`);
      return authStatus.facebook;
    }
    if (platform === 'Google') {
      console.log(`Google global auth status: ${authStatus.google}`);
      return authStatus.google;
    }
    if (platform === 'TikTok') {
      console.log(`TikTok global auth status: ${authStatus.tiktok}`);
      return authStatus.tiktok;
    }
    
    console.log(`No status found for ${platform}, using form status: ${formData.isConnected}`);
    return formData.isConnected || false;
  };

  // ----- REDIRECT-BASED AUTHENTICATION HANDLER -----
  
  // Handle authentication with full page redirect
  const handleAuth = (platform) => {
    const platformLower = platform.toLowerCase();
    
    // Set loading state
    setLoading(prev => ({ ...prev, [platformLower]: true }));
    
    // Store the current channel ID in session storage for after redirect
    const pendingAuthData = {
      inProgress: true,
      platform: platformLower,
      channelId: selectedRow?.id
    };
    
    // Save pending auth data to session storage
    sessionStorage.setItem('pendingAuth', JSON.stringify(pendingAuthData));
    setPendingAuth(pendingAuthData);
    
    // Construct auth URL
    const authUrl = `${API_URL}/auth/${platformLower}`;
    
    // Redirect browser to authentication URL
    window.location.href = authUrl;
  };

  // ----- DATA MANAGEMENT FUNCTIONS -----
  
  // Save connection status to API without closing modal
  const saveConnectionStatus = async (channelId, platform, isConnected) => {
    if (!channelId) return;
    
    console.log(`Saving connection status for ${platform}: ${isConnected}`);
    
    try {
      // Get current channel data
      const channel = rows.find(row => row.id === channelId);
      if (!channel) {
        console.error("Channel not found:", channelId);
        return;
      }
      
      // Update with connection status
      const updateData = {
        ...channel,
        isConnected: isConnected
      };
      
      // Call API to update channel status
      const response = await axios.put(`${API_URL}/${channelId}`, updateData);
      
      // Update local rows data
      setRows(prevRows => 
        prevRows.map(row => 
          row.id === channelId ? response.data : row
        )
      );
      
      console.log(`Connection status for ${platform} saved successfully`);
    } catch (error) {
      console.error(`Error saving connection status for ${platform}:`, error);
      setSnackbar({
        open: true,
        message: `Failed to save connection status: ${error.message}`,
        severity: "warning"
      });
    }
  };

  // Filter rows based on search text
  const filteredRows = rows.filter((row) =>
    Object.values(row || {}).some((value) =>
      value?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // ----- FORM HANDLING FUNCTIONS -----
  
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleParamChange = (index, field, value) => {
    const updatedParams = [...formData.customParameters];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value
    };
    
    setFormData(prev => ({
      ...prev,
      customParameters: updatedParams
    }));
  };

  const validateBasicSettings = () => {
    const errors = {};
    const requiredFields = ['channelName', 'aliasChannel', 'costUpdateDepth', 'costUpdateFrequency', 'currency'];
    
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission with better modal handling
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Log to debug
    console.log("Submitting form, editMode:", editMode);
    console.log("Selected channel:", selectedChannel);
    console.log("Is platform connectable:", isPlatformConnectable(formData.aliasChannel));
    
    // Validate form
    if (!validateBasicSettings()) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "error"
      });
      return;
    }
    
    // Call API to create/update channel
    setLoading(prev => ({ ...prev, save: true }));
    
    try {
      if (editMode) {
        // Update existing channel
        const response = await axios.put(`${API_URL}/${selectedRow.id}`, formData);
        
        // Update state with response data
        setRows(prevRows => 
          prevRows.map(row => 
            row.id === selectedRow.id ? response.data : row
          )
        );
        
        // Update connection status tracking
        setChannelConnectionStatus(prev => ({
          ...prev,
          [selectedRow.id]: response.data.isConnected || formData.isConnected
        }));
        
        setSnackbar({
          open: true,
          message: "Channel updated successfully",
          severity: "success"
        });
      } else {
        // Create new channel
        const response = await axios.post(API_URL, formData);
        
        // Update connection status tracking
        setChannelConnectionStatus(prev => ({
          ...prev,
          [response.data.id]: response.data.isConnected || false
        }));
        
        // Update local state with the newly created channel
        setRows(prevRows => [...prevRows, response.data]);
        
        setSnackbar({
          open: true,
          message: "Channel created successfully",
          severity: "success"
        });
        
        // Set selected row to newly created channel for editing
        setSelectedRow(response.data);
        setEditMode(true);
      }
      
      // Only close modal for non-connectable platforms or if explicitly requested
      // This is the critical change that ensures the modal stays open after authentication
      const shouldCloseModal = !isPlatformConnectable(formData.aliasChannel);
      
      console.log("Should close modal:", shouldCloseModal);
      
      if (shouldCloseModal) {
        setOpenSecondModal(false);
      } else {
        console.log("Keeping modal open for connectable platform:", formData.aliasChannel);
      }
    } catch (error) {
      console.error("Error saving channel:", error);
      setSnackbar({
        open: true,
        message: `Failed to ${editMode ? 'update' : 'create'} channel: ${error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  };

  // ----- MODAL AND UI HANDLING FUNCTIONS -----
  
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  
  const handleOpenSecondModal = (channelType) => {
    if (channelType) {
      const template = channelTemplates[channelType] || channelTemplates.Custom;
      setFormData({
        ...formData,
        ...template,
        aliasChannel: channelType,
        isConnected: false
      });
      setSelectedChannel(channelType);
    } else {
      // Reset form for custom channel
      setFormData({
        ...channelTemplates.Custom,
        isConnected: false
      });
      setSelectedChannel(null);
    }
    
    setEditMode(false);
    setCurrentTab(0);
    setOpenSecondModal(true);
    setOpenModal(false);
  };
  
  const handleCloseSecondModal = () => {
    // If we're in the middle of authentication, warn user
    if (pendingAuth.inProgress) {
      const confirmClose = window.confirm('Authentication is in progress. Closing this window will cancel the process. Continue?');
      if (!confirmClose) return;
      
      // Clear pending auth if user confirms close
      sessionStorage.removeItem('pendingAuth');
      setPendingAuth({
        inProgress: false,
        platform: null,
        channelId: null
      });
    }
    
    setOpenSecondModal(false);
    setFormData({
      ...channelTemplates.Custom,
      isConnected: false
    });
    setSelectedChannel(null);
    setSelectedRow(null);
    setFormErrors({});
    setEditMode(false);
    setCurrentTab(0);
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  const handleDateRangeChange = (field, date) => {
    setDateRange(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Edit channel - opens the modal with channel data
  const handleEditChannel = (channel) => {
    setSelectedRow(channel);
    
    // Check if this channel is connected
    const isChannelConnected = channelConnectionStatus[channel.id] || false;
    
    setFormData({
      ...channelTemplates.Custom,
      ...channel,
      isConnected: isChannelConnected
    });
    
    setSelectedChannel(channel.aliasChannel);
    setEditMode(true);
    setCurrentTab(0);
    setOpenSecondModal(true);
  };

  // Delete channel
  const handleDeleteChannel = async (channelId) => {
    setLoading(prev => ({ ...prev, delete: true }));
    
    try {
      await axios.delete(`${API_URL}/${channelId}`);
      
      // Remove the channel from the list
      setRows(prevRows => prevRows.filter(row => row.id !== channelId));
      
      // Also remove from connection status tracking
      setChannelConnectionStatus(prev => {
        const updated = { ...prev };
        delete updated[channelId];
        return updated;
      });
      
      setSnackbar({
        open: true,
        message: "Channel deleted successfully",
        severity: "success"
      });
    } catch (error) {
      console.error("Error deleting channel:", error);
      setSnackbar({
        open: true,
        message: `Failed to delete channel: ${error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, delete: false }));
    }
  };

  // Helper component for platform connection status
  const PlatformConnectionStatus = ({ platform, isConnected, isLoading, onConnect }) => {
    const theme = useTheme();
    
    // Added console logging to help debug connection status
    console.log(`Rendering PlatformConnectionStatus for ${platform}: isConnected=${isConnected}`);
    
    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${isConnected ? theme.palette.success.light : theme.palette.error.light}`,
          bgcolor: isConnected ? alpha(theme.palette.success.light, 0.1) : alpha(theme.palette.error.light, 0.1)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {platform === 'Facebook' && (
                <Avatar sx={{ bgcolor: '#1877F2', width: 32, height: 32 }}>f</Avatar>
              )}
              {platform === 'Google' && (
                <Avatar sx={{ bgcolor: '#4285F4', width: 32, height: 32 }}>G</Avatar>
              )}
              {platform === 'TikTok' && (
                <Avatar sx={{ bgcolor: '#000000', width: 32, height: 32 }}>T</Avatar>
              )}
              <Typography variant="subtitle1" fontWeight="medium">{platform} API integration</Typography>
            </Box>
            <Tooltip title="Integration information">
              <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={isConnected ? "Connected" : "Not connected"} 
              color={isConnected ? "success" : "error"}
              size="small"
              icon={isConnected ? <CheckIcon /> : <CancelIcon />}
            />
          </Box>
        </Box>
      </Paper>
    );
  };

  // Render Facebook connection section
  const renderFacebookConnection = () => {
    // Check if the current channel is connected
    const isConnected = isChannelConnected('Facebook');
    const isFacebookAuthInProgress = pendingAuth.inProgress && pendingAuth.platform === 'facebook';
    
    return (
      <Box sx={{ px: 3, py: 4, borderBottom: "1px solid #eee" }}>
        <PlatformConnectionStatus 
          platform="Facebook"
          isConnected={isConnected}
          isLoading={loading.facebook}
          onConnect={() => handleAuth('Facebook')}
        />
        
        <Button
          variant="contained"
          startIcon={<Avatar sx={{ width: 24, height: 24, bgcolor: '#1877F2' }}>f</Avatar>}
          onClick={() => handleAuth('Facebook')}
          disabled={loading.facebook || isFacebookAuthInProgress}
          sx={{ 
            mb: 3, 
            py: 1.2, 
            px: 3, 
            borderRadius: 2,
            bgcolor: '#1877F2', 
            '&:hover': { bgcolor: '#166FE5' },
            textTransform: 'none',
            fontWeight: 'medium',
            boxShadow: 2
          }}
        >
          {loading.facebook ? (
            <CircularProgress size={24} color="inherit" /> 
          ) : isConnected ? (
            "Reconnect Facebook"
          ) : (
            "Connect with Facebook"
          )}
        </Button>
        
        {/* Show info alert during active authentication */}
        {isFacebookAuthInProgress && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Facebook authentication in progress. Please complete the process in the redirected window.
          </Alert>
        )}
        
        {/* Show success message when connected */}
        {isConnected && !isFacebookAuthInProgress && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Your Facebook account is successfully connected. You can now use Facebook integrations.
          </Alert>
        )}
        
        {/* Facebook form fields */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 3 }}>
            Facebook default data source (pixel)
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>Pixel ID</Typography>
              <TextField
                fullWidth
                name="pixelId"
                value={formData.pixelId || ""}
                onChange={handleFormChange}
                placeholder="Pixel ID"
                variant="outlined"
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                    '& fieldset': {
                      borderColor: alpha(theme.palette.text.primary, 0.2),
                    },
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>Conversions API Access token</Typography>
              <TextField
                fullWidth
                name="apiAccessToken"
                value={formData.apiAccessToken || ""}
                onChange={handleFormChange}
                placeholder="Conversions API Access token"
                variant="outlined"
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" gutterBottom>Default Event name</Typography>
              <TextField
                fullWidth
                name="defaultEventName"
                value={formData.defaultEventName || ""}
                onChange={handleFormChange}
                placeholder="Default Event name"
                variant="outlined"
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
            </Grid>
            
            {/* Additional Facebook fields */}
          </Grid>
        </Box>
      </Box>
    );
  };

  // Render Google connection section
  const renderGoogleConnection = () => {
    // Check if the current channel is connected
    const isConnected = isChannelConnected('Google');
    const isGoogleAuthInProgress = pendingAuth.inProgress && pendingAuth.platform === 'google';
    
    return (
      <Box sx={{ px: 3, py: 4, borderBottom: "1px solid #eee" }}>
        <PlatformConnectionStatus 
          platform="Google"
          isConnected={isConnected}
          isLoading={loading.google}
          onConnect={() => handleAuth('Google')}
        />
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="textSecondary" gutterBottom>Google Ads Account ID *</Typography>
            <TextField
              fullWidth
              name="googleAdsAccountId"
              value={formData.googleAdsAccountId || ""}
              onChange={handleFormChange}
              placeholder="Google Ads Account ID"
              variant="outlined"
              size="small"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                }
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => handleAuth('Google')}
              disabled={loading.google || isGoogleAuthInProgress}
              startIcon={<Avatar sx={{ width: 24, height: 24, bgcolor: '#4285F4' }}>G</Avatar>}
              fullWidth
              sx={{ 
                borderRadius: 1.5, 
                py: 1, 
                border: '1px solid #4285F4', 
                color: '#4285F4', 
                textTransform: 'none',
                '&:hover': {
                  bgcolor: alpha('#4285F4', 0.05),
                  border: '1px solid #4285F4'
                }
              }}
            >
              {loading.google ? (
                <CircularProgress size={24} color="inherit" />
              ) : isConnected ? (
                "Reconnect" 
              ) : (
                "Sign in with Google"
              )}
            </Button>
          </Grid>
        </Grid>
        
        {/* Show info alert during active authentication */}
        {isGoogleAuthInProgress && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Google authentication in progress. Please complete the process in the redirected window.
          </Alert>
        )}
        
        {/* Show success message when connected */}
        {isConnected && !isGoogleAuthInProgress && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Your Google account is successfully connected. You can now use Google integrations.
          </Alert>
        )}
        
        {/* Additional Google form fields */}
      </Box>
    );
  };

  // Rest of your component code...
  // (Including the render methods for custom parameters, tabs, data grid, etc.)

  return (
    <Layout>
      {/* Main component content */}
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          Traffic Channels
        </Typography>
        
        {/* Your UI components here */}
        
        {/* Modals for templates and channel editing/creation */}
        <Modal 
          open={openSecondModal} 
          onClose={handleCloseSecondModal}
          aria-labelledby="channel-modal-title"
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "white",
              borderRadius: 3,
              boxShadow: 24,
              maxHeight: "90vh",
              overflowY: "auto",
              width: "90%",
              maxWidth: "1100px"
            }}
          >
            {/* Modal content here */}
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" id="channel-modal-title">
                {editMode ? "Edit Traffic Channel" : "New Traffic Channel"}
              </Typography>
              
              {/* Tabs for channel settings */}
              <Tabs 
                value={currentTab} 
                onChange={(e, newValue) => setCurrentTab(newValue)}
              >
                <Tab label="Basic Settings" value={0} />
                {selectedChannel === 'Facebook' && <Tab label="Facebook Integration" value={1} />}
                {selectedChannel === 'Google' && <Tab label="Google Integration" value={2} />}
                <Tab label="Additional Parameters" value={3} />
              </Tabs>
              
              {/* Tab contents */}
              <Box sx={{ mt: 2 }}>
                {currentTab === 0 && (
                  <Box>
                    {/* Basic settings fields */}
                  </Box>
                )}
                
                {currentTab === 1 && renderFacebookConnection()}
                {currentTab === 2 && renderGoogleConnection()}
                {currentTab === 3 && (
                  <Box>
                    {/* Additional parameters fields */}
                  </Box>
                )}
              </Box>
              
              {/* Action buttons */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleCloseSecondModal}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSubmit}
                  disabled={loading.save}
                >
                  {loading.save ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default TrafficChannels;

// Helper functions and components like InfoIcon, DeleteIcon, etc. would be defined here
// channelTemplates would also be defined here