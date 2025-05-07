import { useState, useEffect, useRef } from 'react';
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
  Container,
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

// Simulated icons that would be imported in a real application
// In a real app, use MUI icons or another icon library
const InfoIcon = () => <div style={{ width: 20, height: 20, background: '#1976d2', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>i</div>;
const DeleteIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🗑️</div>;
const EditIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</div>;
const DateRangeIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📅</div>;
const CheckIcon = () => <div style={{ width: 20, height: 20, color: 'green', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✓</div>;
const CancelIcon = () => <div style={{ width: 20, height: 20, color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✗</div>;
const LockIcon = () => <div style={{ width: 20, height: 20, color: 'gray', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🔒</div>;
const SearchIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🔍</div>;
const AddIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>+</div>;

// API endpoint for traffic channels
const API_URL = "https://pearmllc.onrender.com/api/traffic";

// Utility functions for formatting numbers and percentages
const formatNumber = (num, decimals = 2) => {
  if (num === undefined || num === null) return "0";
  return Number(num).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const formatPercent = (num) => {
  if (num === undefined || num === null) return "0%";
  return `${(Number(num) * 100).toFixed(2)}%`;
};

// Template options with predefined settings - Same as your original
const channelTemplates = {
  Facebook: {
    channelName: "Facebook Ads",
    aliasChannel: "Facebook",
    costUpdateDepth: "Ad Level",
    costUpdateFrequency: "15 Minutes",
    currency: "USD",
    defaultEventName: "Purchase",
    isConnected: false,
    customParameters: Array(20).fill().map((_, index) => {
      if (index === 0) return { name: "sub1", macro: "{{ad.id}}", description: "ad_id", role: "Aid" };
      if (index === 1) return { name: "sub2", macro: "{{adset.id}}", description: "adset_id", role: "Gid" };
      if (index === 2) return { name: "sub3", macro: "{{campaign.id}}", description: "campaign_id", role: "Cid" };
      if (index === 3) return { name: "sub4", macro: "{{ad.name}}", description: "ad_name", role: "Rt ad" };
      if (index === 4) return { name: "sub5", macro: "{{adset.name}}", description: "adset_name", role: "Rt adgroup" };
      if (index === 5) return { name: "sub6", macro: "{{campaign.name}}", description: "campaign_name", role: "Rt campaign" };
      if (index === 6) return { name: "sub7", macro: "{{placement}}", description: "Placement", role: "Rt placement" };
      if (index === 7) return { name: "sub8", macro: "{{site_source_name}}", description: "Site source name", role: "" };
      if (index === 8) return { name: "utm_source", macro: "facebook", description: "UTM source", role: "Rt source" };
      if (index === 9) return { name: "utm_medium", macro: "paid", description: "UTM medium", role: "Rt medium" };
      if (index === 10) return { name: "fbclid", macro: "", description: "Facebook click ID", role: "" };
      return { name: `sub${index + 1}`, macro: "", description: "hint", role: "" };
    })
  },
  Google: {
    channelName: "Google Ads",
    aliasChannel: "Google",
    costUpdateDepth: "Ad Level",
    costUpdateFrequency: "15 Minutes",
    currency: "USD",
    defaultEventName: "Purchase",
    isConnected: false,
    customParameters: Array(20).fill().map((_, index) => {
      if (index === 0) return { name: "sub1", macro: "{{creative.id}}", description: "creative_id", role: "Aid" };
      if (index === 1) return { name: "sub2", macro: "{{adgroup.id}}", description: "adgroup_id", role: "Gid" };
      if (index === 2) return { name: "sub3", macro: "{{campaign.id}}", description: "campaign_id", role: "Cid" };
      if (index === 3) return { name: "sub4", macro: "{{creative.name}}", description: "creative_name", role: "Rt ad" };
      if (index === 4) return { name: "sub5", macro: "{{adgroup.name}}", description: "adgroup_name", role: "Rt adgroup" };
      if (index === 5) return { name: "sub6", macro: "{{campaign.name}}", description: "campaign_name", role: "Rt campaign" };
      if (index === 6) return { name: "sub7", macro: "{{placement}}", description: "Placement", role: "Rt placement" };
      if (index === 7) return { name: "sub8", macro: "{{network}}", description: "Network", role: "" };
      if (index === 8) return { name: "utm_source", macro: "google", description: "UTM source", role: "Rt source" };
      if (index === 9) return { name: "utm_medium", macro: "cpc", description: "UTM medium", role: "Rt medium" };
      if (index === 10) return { name: "gclid", macro: "{gclid}", description: "Google Click ID", role: "" };
      return { name: `sub${index + 1}`, macro: "", description: "hint", role: "" };
    })
  },
  TikTok: {
    channelName: "TikTok Ads",
    aliasChannel: "TikTok",
    costUpdateDepth: "Ad Level",
    costUpdateFrequency: "15 Minutes",
    currency: "USD",
    defaultEventName: "Purchase",
    isConnected: false,
    customParameters: Array(20).fill().map((_, index) => {
      if (index === 0) return { name: "sub1", macro: "{{ad.id}}", description: "ad_id", role: "Aid" };
      if (index === 1) return { name: "sub2", macro: "{{adgroup.id}}", description: "adgroup_id", role: "Gid" };
      if (index === 2) return { name: "sub3", macro: "{{campaign.id}}", description: "campaign_id", role: "Cid" };
      if (index === 3) return { name: "sub4", macro: "{{ad.name}}", description: "ad_name", role: "Rt ad" };
      if (index === 4) return { name: "sub5", macro: "{{adgroup.name}}", description: "adgroup_name", role: "Rt adgroup" };
      if (index === 5) return { name: "sub6", macro: "{{campaign.name}}", description: "campaign_name", role: "Rt campaign" };
      if (index === 6) return { name: "utm_source", macro: "tiktok", description: "UTM source", role: "Rt source" };
      if (index === 7) return { name: "utm_medium", macro: "paid", description: "UTM medium", role: "Rt medium" };
      if (index === 8) return { name: "ttclid", macro: "{ttclid}", description: "TikTok Click ID", role: "" };
      return { name: `sub${index + 1}`, macro: "", description: "hint", role: "" };
    })
  },
  Custom: {
    channelName: "",
    aliasChannel: "",
    costUpdateDepth: "",
    costUpdateFrequency: "5 Minutes",
    currency: "USD",
    s2sPostbackUrl: "",
    clickRefId: "",
    externalId: "",
    isConnected: false,
    customParameters: Array(20).fill().map((_, index) => (
      { name: `sub${index + 1}`, macro: "", description: "hint", role: "" }
    )),
    status: "Active"
  }
};

// Helper component for platform connection status - Redesigned
const PlatformConnectionStatus = ({ platform, isConnected, isLoading, onConnect }) => {
  const theme = useTheme();
  
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

// Main component
const TrafficChannels = () => {
  // Theme for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));

  // State management - Same as original
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
  const [authPopupOpen, setAuthPopupOpen] = useState(false);
  
  // Refs for auth popup window and interval
  const authWindow = useRef(null);
  const authInterval = useRef(null);
  const authPlatform = useRef(null);
  
  // Form data - Same as original
  const [formData, setFormData] = useState({
    // Basic settings
    channelName: "",
    aliasChannel: "",
    costUpdateDepth: "",
    costUpdateFrequency: "5 Minutes",
    currency: "USD",
    s2sPostbackUrl: "",
    clickRefId: "",
    externalId: "",
    
    // Custom parameters for platforms (up to 20)
    customParameters: Array(20).fill().map((_, index) => ({
      name: `sub${index + 1}`,
      macro: index < 3 ? `{{ad.id}}` : "",
      description: index < 3 ? `ad_id` : "hint",
      role: index < 3 ? "Aid" : ""
    })),
    
    // Facebook specific
    pixelId: "",
    apiAccessToken: "",
    defaultEventName: "Purchase",
    payoutType: "",
    value: "",
    customConversionMatching: false,
    
    // Google specific
    googleAdsAccountId: "",
    googleMccAccountId: "",
    conversionType: "",
    conversionName: "",
    conversionCategory: "",
    includeInConversions: "",
    profileId: "",
    floodlightActivityId: "",
    
    // Connection status
    connectionComplete: false,
    isConnected: false,
    status: "Active"
  });

  // Check if current URL contains OAuth callback parameters
  useEffect(() => {
    // Run only in popup windows
    if (!window.opener) return;

    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const platform = urlParams.get('platform');
    const session = urlParams.get('session');
    const error = urlParams.get('error');
    const message = urlParams.get('message');
    
    if (success === 'true' && platform && session) {
      // We're in a popup window that received successful OAuth callback
      console.log("Authentication successful, sending message to parent window");
      window.opener.postMessage({
        type: 'auth_success',
        platform,
        session
      }, window.location.origin);
      
      // Close popup after sending message
      window.close();
    } else if (error === 'true' && platform) {
      // We're in a popup window that received an OAuth error
      console.log("Authentication failed, sending error to parent window");
      window.opener.postMessage({
        type: 'auth_error',
        platform,
        message: message || 'Authentication failed'
      }, window.location.origin);
      
      // Close popup after sending message
      window.close();
    }
  }, []);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = (event) => {
      // Only accept messages from our domain
      if (event.origin !== window.location.origin) return;
      
      console.log("Received message from popup:", event.data);
      
      if (event.data && event.data.type === 'auth_success') {
        // Handle successful authentication
        const { platform, session } = event.data;
        const platformLower = platform.toLowerCase();
        
        console.log(`${platform} authentication successful`);
        
        // Store session token
        localStorage.setItem('sessionToken', session);
        
        // Update auth status for the platform
        setAuthStatus(prev => ({
          ...prev,
          [platformLower]: true
        }));
        
        // If we're editing a channel, update its connection status
        if (selectedRow) {
          setChannelConnectionStatus(prev => ({
            ...prev,
            [selectedRow.id]: true
          }));
        }
        
        // Update form data to reflect connected status
        setFormData(prev => ({
          ...prev,
          isConnected: true
        }));
        
        // Show success message
        setSnackbar({
          open: true,
          message: `${platform} account connected successfully`,
          severity: 'success'
        });
        
        // Reset loading state
        setLoading(prev => ({ ...prev, [platformLower]: false }));
        
        // Save the form changes to update the connection status
        handleSubmit();
      } else if (event.data && event.data.type === 'auth_error') {
        // Handle authentication error
        const { platform, message } = event.data;
        const platformLower = platform.toLowerCase();
        
        console.log(`${platform} authentication failed:`, message);
        
        // Show error message
        setSnackbar({
          open: true,
          message: `Failed to connect to ${platform}: ${message}`,
          severity: 'error'
        });
        
        // Reset loading state
        setLoading(prev => ({ ...prev, [platformLower]: false }));
      }
      
      // Reset auth popup state
      setAuthPopupOpen(false);
      authPlatform.current = null;
      
      // Close popup if it's still open
      if (authWindow.current && !authWindow.current.closed) {
        authWindow.current.close();
      }
      authWindow.current = null;
      
      // Clear interval
      if (authInterval.current) {
        clearInterval(authInterval.current);
        authInterval.current = null;
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [selectedRow]);

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      setLoading((prev) => ({ ...prev, table: true }));
      
      try {
        // Fetch data from the actual API
        const response = await axios.get(API_URL);
        
        // Process the data
        if (response.data && Array.isArray(response.data)) {
          setRows(response.data);
          
          // Set up connection statuses based on data
          const newConnectionStatus = {};
          response.data.forEach(row => {
            // Determine connection status based on API data
            newConnectionStatus[row.id] = row.isConnected || 
                                        (row.apiAccessToken && row.aliasChannel === 'Facebook') || 
                                        (row.googleAdsAccountId && row.aliasChannel === 'Google');
          });
          
          setChannelConnectionStatus(newConnectionStatus);
        } else {
          // If API returns unexpected format, set empty array
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
        setLoading((prev) => ({ ...prev, table: false }));
      }
    };
    
    fetchChannels();
  }, [dateRange.startDate, dateRange.endDate]);
  
  // Check auth status from API
  useEffect(() => {
    const checkApiAuthStatus = async () => {
      try {
        const sessionToken = localStorage.getItem('sessionToken');
        
        if (sessionToken) {
          // Make API call to check authentication status
          const response = await axios.get(`${API_URL}/auth/status`, {
            headers: {
              Authorization: `Bearer ${sessionToken}`
            }
          });
          
          // Update auth status based on API response
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

  // Filter rows based on search text
  const filteredRows = rows.filter((row) =>
    Object.values(row || {}).some((value) =>
      value?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // Helper to determine if platform connection is available
  const isPlatformConnectable = (platformName) => {
    return ["Facebook", "Google", "TikTok"].includes(platformName);
  };

  // Handle authentication for platforms using popup
  const handleAuth = async (platform) => {
    const platformLower = platform.toLowerCase();
    
    // Don't proceed if already authenticating
    if (authPopupOpen) {
      return;
    }
    
    setLoading(prev => ({ ...prev, [platformLower]: true }));
    authPlatform.current = platform;
    
    try {
      // Calculate center position for popup
      const width = 600;
      const height = 700;
      const left = (window.innerWidth - width) / 2 + window.screenX;
      const top = (window.innerHeight - height) / 2 + window.screenY;
      
      // Open popup for authentication
      authWindow.current = window.open(
        `${API_URL}/auth/${platformLower}`,
        `${platform}Auth`,
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      // Check if popup was blocked
      if (!authWindow.current || authWindow.current.closed) {
        throw new Error('Popup was blocked. Please allow popups for this site.');
      }
      
      setAuthPopupOpen(true);
      
      // Check periodically if the popup has been closed without completing auth
      authInterval.current = setInterval(() => {
        if (authWindow.current && authWindow.current.closed) {
          clearInterval(authInterval.current);
          authInterval.current = null;
          
          if (authPopupOpen) {
            // Popup was closed without completing authentication
            setAuthPopupOpen(false);
            setLoading(prev => ({ ...prev, [platformLower]: false }));
            
            setSnackbar({
              open: true,
              message: `${platform} authentication was cancelled`,
              severity: 'info'
            });
          }
        }
      }, 1000);
      
      // Automatically close the popup after 10 seconds (safety measure)
      setTimeout(() => {
        if (authWindow.current && !authWindow.current.closed) {
          authWindow.current.close();
          setAuthPopupOpen(false);
          setLoading(prev => ({ ...prev, [platformLower]: false }));
        }
      }, 60000); // 1 minute timeout as a safety fallback
    } catch (error) {
      console.error(`Error initiating ${platform} auth:`, error);
      setLoading(prev => ({ ...prev, [platformLower]: false }));
      setSnackbar({
        open: true,
        message: `Failed to connect to ${platform}: ${error.message}`,
        severity: 'error'
      });
      setAuthPopupOpen(false);
    }
  };

  // Form change handler for basic fields
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

  // Form change handler for custom parameters
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

  // Date range change handler
  const handleDateRangeChange = (field, date) => {
    setDateRange(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Validate form for basic settings
  const validateBasicSettings = () => {
    const errors = {};
    const requiredFields = ['channelName', 'aliasChannel', 'costUpdateDepth', 'costUpdateFrequency', 'currency'];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle template selection
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

  // Edit channel
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
    // Call API to delete channel
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

  // Form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
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
      
      // Don't automatically close the modal if it's a connectable platform
      if (!isPlatformConnectable(formData.aliasChannel)) {
        setOpenSecondModal(false);
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

  // Modal controls
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  
  const handleCloseSecondModal = () => {
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

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle row click for navigation to details
  const handleRowClick = (row) => {
    console.log("Navigate to details for:", row.id);
    // In a real app, this would navigate to a details page
  };

  // Helper function to get channel icon with modern styling
  const getChannelIcon = (channelName) => {
    if (!channelName) return <Avatar sx={{ width: 32, height: 32, bgcolor: '#f5f5f5', color: '#666' }}>?</Avatar>;
    
    switch(channelName.toLowerCase()) {
      case 'facebook':
        return <Avatar sx={{ width: 32, height: 32, bgcolor: '#1877F2' }}>f</Avatar>;
      case 'google':
        return <Avatar sx={{ width: 32, height: 32, bgcolor: '#4285F4' }}>G</Avatar>;
      case 'tiktok':
        return <Avatar sx={{ width: 32, height: 32, bgcolor: '#000000' }}>T</Avatar>;
      default:
        return <Avatar sx={{ width: 32, height: 32, bgcolor: '#f5f5f5', color: '#666' }}>{channelName?.charAt(0).toUpperCase() || '?'}</Avatar>;
    }
  };

  // Render Facebook connection section
  const renderFacebookConnection = () => {
    // Check if the current channel is connected
    const isConnected = (editMode && selectedRow) 
      ? channelConnectionStatus[selectedRow.id] || false 
      : formData.isConnected || authStatus.facebook;
    
    return (
      <Box sx={{ px: 3, py: 4, borderBottom: "1px solid #eee" }}>
        <PlatformConnectionStatus 
          platform="Facebook"
          isConnected={isConnected}
          isLoading={loading.facebook}
          onConnect={() => handleAuth('facebook')}
        />
        
        <Button
          variant="contained"
          startIcon={<Avatar sx={{ width: 24, height: 24, bgcolor: '#1877F2' }}>f</Avatar>}
          onClick={() => handleAuth('facebook')}
          disabled={loading.facebook || authPopupOpen}
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
          {loading.facebook ? <CircularProgress size={24} color="inherit" /> : isConnected ? "Reconnect Facebook" : "Connect with Facebook"}
        </Button>
        
        {authPopupOpen && authPlatform.current === 'facebook' && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Facebook authentication window opened. Please complete the process in the popup window.
          </Alert>
        )}
        
        <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.info.light, 0.1), borderRadius: 2, mb: 4 }}>
          <Box display="flex" alignItems="flex-start" gap={1.5}>
            <InfoIcon />
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Please allow access to your Facebook profile to activate integrations:
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, ml: 0.5 }}>#1 Click on "Connect" and accept integration permissions</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, ml: 0.5 }}>#2 Once accepted, fill in all the mandatory fields and save the changes.</Typography>
            </Box>
          </Box>
        </Paper>
        
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
                value={formData.pixelId}
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
                value={formData.apiAccessToken}
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
                value={formData.defaultEventName}
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
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>Payout type</Typography>
              <Select
                fullWidth
                name="payoutType"
                value={formData.payoutType}
                onChange={handleFormChange}
                displayEmpty
                size="small"
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="CPA">CPA</MenuItem>
                <MenuItem value="CPC">CPC</MenuItem>
                <MenuItem value="CPL">CPL</MenuItem>
              </Select>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>Value</Typography>
              <TextField
                fullWidth
                name="value"
                value={formData.value}
                onChange={handleFormChange}
                placeholder="Value"
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
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 1,
                p: 1.5,
                borderRadius: 1.5,
                border: `1px solid ${alpha(theme.palette.text.primary, 0.12)}`,
              }}>
                <input
                  type="checkbox"
                  checked={formData.customConversionMatching}
                  onChange={(e) => handleFormChange({
                    target: {
                      name: 'customConversionMatching',
                      type: 'checkbox',
                      checked: e.target.checked
                    }
                  })}
                  name="customConversionMatching"
                  style={{ marginRight: 10 }}
                />
                <Typography variant="body2">
                  Custom Conversion Matching
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    );
  };

  // Render Google connection section
  const renderGoogleConnection = () => {
    // Check if the current channel is connected
    const isConnected = (editMode && selectedRow) 
      ? channelConnectionStatus[selectedRow.id] || false 
      : formData.isConnected || authStatus.google;
    
    return (
      <Box sx={{ px: 3, py: 4, borderBottom: "1px solid #eee" }}>
        <PlatformConnectionStatus 
          platform="Google"
          isConnected={isConnected}
          isLoading={loading.google}
          onConnect={() => handleAuth('google')}
        />
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="textSecondary" gutterBottom>Google Ads Account ID *</Typography>
            <TextField
              fullWidth
              name="googleAdsAccountId"
              value={formData.googleAdsAccountId}
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
              onClick={() => handleAuth('google')}
              disabled={loading.google || authPopupOpen}
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
              {loading.google ? <CircularProgress size={24} color="inherit" /> : isConnected ? "Reconnect" : "Sign in with Google"}
            </Button>
          </Grid>
        </Grid>
        
        {authPopupOpen && authPlatform.current === 'google' && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            Google authentication window opened. Please complete the process in the popup window.
          </Alert>
        )}
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 3, opacity: 0.85 }}>
          Our platform will update costs via API and send conversions for the connected ad account
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="textSecondary" gutterBottom>Google MCC Account ID (optional)</Typography>
          <TextField
            fullWidth
            name="googleMccAccountId"
            value={formData.googleMccAccountId}
            onChange={handleFormChange}
            placeholder="Google MCC Account ID (optional)"
            variant="outlined"
            size="small"
            sx={{ 
              mb: 1.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              }
            }}
          />
          
          <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.08), borderRadius: 2, mb: 4 }}>
            <Typography variant="body2" color="textSecondary">
              Add MCC account id to send conversions to it and not ad account (optional).<br />
              Please make sure you have access to ad account and MCC with the e-mail you used for integration.
            </Typography>
          </Paper>
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 3 }}>
            Conversion Matching
          </Typography>
          
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                  <TableRow>
                    <TableCell width="25%">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">Conversion Type *</Typography>
                        <Tooltip title="Conversion type information">
                          <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell width="25%">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">Conversion name *</Typography>
                        <Tooltip title="Conversion name information">
                          <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell width="25%">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">Category *</Typography>
                        <Tooltip title="Category information">
                          <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell width="25%">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">Include in "conversions" *</Typography>
                        <Tooltip title="Include in 'conversions' information">
                          <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: alpha(theme.palette.text.primary, 0.6) }}>
                        <LockIcon />
                        <Typography variant="body2">ADD MORE</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
        
        <Box>
          <Typography variant="h6" fontWeight="medium" sx={{ mb: 3 }}>
            Campaign Manager 360
          </Typography>
          
          <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                  <TableRow>
                    <TableCell width="33%">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">Conversion Type *</Typography>
                        <Tooltip title="Conversion type information">
                          <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell width="33%">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">Profile ID *</Typography>
                        <Tooltip title="Profile ID information">
                          <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell width="33%">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">Floodlight activity ID *</Typography>
                        <Tooltip title="Floodlight activity ID information">
                          <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={3} sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: alpha(theme.palette.text.primary, 0.6) }}>
                        <LockIcon />
                        <Typography variant="body2">ADD MORE</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
        
        <Paper elevation={0} sx={{ p: 3, bgcolor: alpha(theme.palette.info.light, 0.1), borderRadius: 2, mt: 4 }}>
          <Box display="flex" alignItems="flex-start" gap={1.5}>
            <InfoIcon />
            <Box>
              <Typography variant="body2" fontWeight="medium" gutterBottom>
                Please allow access to your Google Ads account to activate integrations:
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, ml: 0.5 }}>#1 Click on "Connect" and accept integration permissions</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, ml: 0.5 }}>#2 Once accepted, fill in all the mandatory fields and save the changes.</Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  };

  // Render custom parameters section
  const renderCustomParameters = () => {
    // Determine how many rows to display based on filled data
    const visibleParams = formData.customParameters.filter(param => 
      param.name || param.macro || param.description
    ).length + 1; // add one more empty row
    
    const displayParams = formData.customParameters.slice(0, Math.max(visibleParams, 10));
    
    return (
      <Box sx={{ px: 3, py: 4 }}>
        <Typography variant="h6" fontWeight="medium" sx={{ mb: 3 }}>Additional parameters</Typography>
        
        <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                <TableRow>
                  <TableCell width="25%">
                    <Typography variant="body2" fontWeight="medium">Parameter *</Typography>
                  </TableCell>
                  <TableCell width="25%">
                    <Typography variant="body2" fontWeight="medium">Macro/token *</Typography>
                  </TableCell>
                  <TableCell width="25%">
                    <Typography variant="body2" fontWeight="medium">Name / Description *</Typography>
                  </TableCell>
                  <TableCell width="25%">
                    <Typography variant="body2" fontWeight="medium">Select role</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayParams.map((param, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={param.name}
                        onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                        placeholder={`sub${index + 1}`}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={param.macro}
                        onChange={(e) => handleParamChange(index, 'macro', e.target.value)}
                        placeholder={index < 3 ? `{{ad.id}}` : ""}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={param.description}
                        onChange={(e) => handleParamChange(index, 'description', e.target.value)}
                        placeholder={index < 3 ? "ad_id" : "hint"}
                        variant="outlined"
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        fullWidth
                        value={param.role || ""}
                        onChange={(e) => handleParamChange(index, 'role', e.target.value)}
                        displayEmpty
                        size="small"
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                          }
                        }}
                      >
                        <MenuItem value="">Select</MenuItem>
                        <MenuItem value="Aid">Aid</MenuItem>
                        <MenuItem value="Gid">Gid</MenuItem>
                        <MenuItem value="Cid">Cid</MenuItem>
                        <MenuItem value="Rt ad">Rt ad</MenuItem>
                        <MenuItem value="Rt adgroup">Rt adgroup</MenuItem>
                        <MenuItem value="Rt campaign">Rt campaign</MenuItem>
                        <MenuItem value="Rt placement">Rt placement</MenuItem>
                        <MenuItem value="Rt source">Rt source</MenuItem>
                        <MenuItem value="Rt medium">Rt medium</MenuItem>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {displayParams.length < 5 && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', p: 2 }}>
                      <Button 
                        startIcon={<AddIcon />}
                        sx={{ 
                          color: theme.palette.primary.main,
                          textTransform: 'none',
                          fontWeight: 'normal',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.05)
                          }
                        }}
                      >
                        Add Parameter
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    );
  };

  // Render the main tabs based on the channel type - Modernized
  const renderTabs = () => {
    const tabs = [
      { label: "Basic Settings", value: 0 },
      { label: "Facebook Integration", value: 1, show: selectedChannel === 'Facebook' },
      { label: "Google Integration", value: 2, show: selectedChannel === 'Google' },
      { label: "Additional Parameters", value: 3 }
    ].filter(tab => tab.show !== false);
    
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={(e, newValue) => setCurrentTab(newValue)}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : "standard"}
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 3,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                minWidth: isMobile ? 'auto' : 120,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                },
              },
            }}
          >
            {tabs.map((tab) => (
              <Tab key={tab.value} label={tab.label} value={tab.value} />
            ))}
          </Tabs>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          {currentTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Channel name *
                  </Typography>
                  <TextField
                    fullWidth
                    name="channelName"
                    value={formData.channelName}
                    onChange={handleFormChange}
                    error={!!formErrors.channelName}
                    helperText={formErrors.channelName}
                    placeholder="e.g., Facebook Ads"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Alias channel
                  </Typography>
                  <TextField
                    fullWidth
                    name="aliasChannel"
                    value={formData.aliasChannel}
                    onChange={handleFormChange}
                    error={!!formErrors.aliasChannel}
                    helperText={formErrors.aliasChannel}
                    placeholder="e.g., Facebook"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cost update depth:
                  </Typography>
                  <Select
                    fullWidth
                    name="costUpdateDepth"
                    value={formData.costUpdateDepth}
                    onChange={handleFormChange}
                    error={!!formErrors.costUpdateDepth}
                    displayEmpty
                    variant="outlined"
                    size="small"
                    sx={{ 
                      mb: 0.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  >
                    <MenuItem value="">Select depth</MenuItem>
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="Campaign Level">Campaign Level</MenuItem>
                    <MenuItem value="Adset Level">Adset Level</MenuItem>
                    <MenuItem value="Ad Level">Ad Level</MenuItem>
                  </Select>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem', opacity: 0.8 }}>
                    Please select the cost update depth from the available options.
                    The default setting is the maximum depth available for your account plan.
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cost update frequency:
                  </Typography>
                  <Select
                    fullWidth
                    name="costUpdateFrequency"
                    value={formData.costUpdateFrequency}
                    onChange={handleFormChange}
                    error={!!formErrors.costUpdateFrequency}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      mb: 0.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  >
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="60 Minutes">60 Minutes</MenuItem>
                    <MenuItem value="30 Minutes">30 Minutes</MenuItem>
                    <MenuItem value="15 Minutes">15 Minutes</MenuItem>
                    <MenuItem value="5 Minutes">5 Minutes</MenuItem>
                  </Select>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem', opacity: 0.8 }}>
                    These are the current settings for your account. If you would like to change the frequency of
                    cost updates - please contact support.
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Currency
                  </Typography>
                  <Select
                    fullWidth
                    name="currency"
                    value={formData.currency}
                    onChange={handleFormChange}
                    error={!!formErrors.currency}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      mb: 0.5,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="EUR">EUR</MenuItem>
                    <MenuItem value="GBP">GBP</MenuItem>
                    <MenuItem value="INR">INR</MenuItem>
                    <MenuItem value="JPY">JPY</MenuItem>
                    <MenuItem value="AUD">AUD</MenuItem>
                    <MenuItem value="CAD">CAD</MenuItem>
                    <MenuItem value="CHF">CHF</MenuItem>
                    <MenuItem value="CNY">CNY</MenuItem>
                    <MenuItem value="SEK">SEK</MenuItem>
                    <MenuItem value="NZD">NZD</MenuItem>
                    <MenuItem value="MXN">MXN</MenuItem>
                    <MenuItem value="SGD">SGD</MenuItem>
                    <MenuItem value="HKD">HKD</MenuItem>
                    <MenuItem value="NOK">NOK</MenuItem>
                    <MenuItem value="KRW">KRW</MenuItem>
                    <MenuItem value="TRY">TRY</MenuItem>
                    <MenuItem value="RUB">RUB</MenuItem>
                    <MenuItem value="BRL">BRL</MenuItem>
                    <MenuItem value="ZAR">ZAR</MenuItem>
                  </Select>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem', opacity: 0.8 }}>
                    If no currency is selected, the value selected in the profile will be used.
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    S2S Postback URL
                  </Typography>
                  <TextField
                    fullWidth
                    name="s2sPostbackUrl"
                    value={formData.s2sPostbackUrl}
                    onChange={handleFormChange}
                    placeholder="https://pearmllc.onrender.com/postback?click_id={click_id}"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Click Ref ID
                  </Typography>
                  <TextField
                    fullWidth
                    name="clickRefId"
                    value={formData.clickRefId}
                    onChange={handleFormChange}
                    placeholder="Click Ref ID"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    External ID
                  </Typography>
                  <TextField
                    fullWidth
                    name="externalId"
                    value={formData.externalId}
                    onChange={handleFormChange}
                    placeholder="External ID"
                    variant="outlined"
                    size="small"
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 1.5,
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
          
          {currentTab === 1 && renderFacebookConnection()}
          {currentTab === 2 && renderGoogleConnection()}
          {currentTab === 3 && renderCustomParameters()}
        </Box>
      </Box>
    );
  };

  // Modern DataGrid component
  const ModernDataGrid = ({ rows, columns, loading }) => {
    return (
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 2, height: '100%', overflow: 'auto' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: alpha(theme.palette.primary.main, 0.04) } }}>
              {columns.map((col, i) => (
                <TableCell 
                  key={i} 
                  align={col.align || 'left'}
                  width={col.width}
                  sx={{ 
                    fontWeight: 'bold', 
                    py: 2, 
                    whiteSpace: 'nowrap'
                  }}
                >
                  {col.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={40} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Typography color="text.secondary" variant="body1">
                      No channels found
                    </Typography>
                    <Typography color="text.secondary" variant="body2" sx={{ maxWidth: 400, textAlign: 'center' }}>
                      Create your first channel to start tracking your traffic and performance metrics.
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleOpenModal} 
                      startIcon={<AddIcon />}
                      sx={{ mt: 1, borderRadius: 6, px: 3, py: 1, textTransform: 'none' }}
                    >
                      Add Channel
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow 
                  key={rowIndex} 
                  hover
                  onClick={() => handleRowClick(row)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  {columns.map((col, colIndex) => (
                    <TableCell 
                      key={colIndex} 
                      align={col.align || 'left'}
                      sx={{ 
                        color: col.field === 'profit' || col.field === 'roi' 
                          ? row[col.field] >= 0 ? theme.palette.success.main : theme.palette.error.main 
                          : 'inherit',
                        py: 1.75
                      }}
                    >
                      {col.renderCell ? (
                        col.renderCell({ row, value: row[col.field] })
                      ) : col.valueFormatter ? (
                        col.valueFormatter({ value: row[col.field] })
                      ) : (
                        row[col.field]
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // Define the table columns with modern styling
  const tableColumns = [
    {
      field: 'channelName',
      headerName: 'Channel',
      width: '20%',
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {getChannelIcon(params.row.aliasChannel)}
          <Box>
            <Typography variant="body2" fontWeight="medium">{params.value}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              {params.row.status === 'Inactive' && (
                <Chip size="small" label="Inactive" color="default" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
              {isPlatformConnectable(params.row.aliasChannel) && (
                <Chip 
                  size="small" 
                  label={channelConnectionStatus[params.row.id] ? "Connected" : "Not Connected"} 
                  color={channelConnectionStatus[params.row.id] ? "success" : "warning"} 
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: 'costUpdateDepth',
      headerName: 'Update Depth',
      width: '10%',
    },
    {
      field: 'costUpdateFrequency',
      headerName: 'Frequency',
      width: '10%',
    },
    {
      field: 'clicks',
      headerName: 'Clicks',
      width: '8%',
      align: 'right',
      valueFormatter: (params) => params?.value !== undefined ? formatNumber(params.value, 0) : "0",
    },
    {
      field: 'conversions',
      headerName: 'Conv.',
      width: '8%',
      align: 'right',
      valueFormatter: (params) => params?.value !== undefined ? formatNumber(params.value, 0) : "0",
    },
    {
      field: 'revenue',
      headerName: 'Revenue',
      width: '10%',
      align: 'right',
      valueFormatter: (params) => params?.value !== undefined ? `${formatNumber(params.value)}` : "$0",
    },
    {
      field: 'cost',
      headerName: 'Cost',
      width: '10%',
      align: 'right',
      valueFormatter: (params) => params?.value !== undefined ? `${formatNumber(params.value)}` : "$0",
    },
    {
      field: 'profit',
      headerName: 'Profit',
      width: '10%',
      align: 'right',
      valueFormatter: (params) => params?.value !== undefined ? `${formatNumber(params.value)}` : "$0",
    },
    {
      field: 'roi',
      headerName: 'ROI',
      width: '8%',
      align: 'right',
      valueFormatter: (params) => params?.value !== undefined ? formatPercent(params.value) : "0%",
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: '6%',
      align: 'center',
      renderCell: (params) => (
        <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Edit Channel">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditChannel(params.row);
              }}
              sx={{ 
                color: theme.palette.primary.main,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Channel">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteChannel(params.row.id);
              }}
              sx={{ 
                color: theme.palette.error.main,
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Layout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          p: 3,
          bgcolor: "#f8fafc",
          minHeight: "calc(100vh - 80px)",
          position: "relative",
        }}
      >
        {/* HEADER WITH PERSISTENT BUTTONS */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 10,
            bgcolor: "#ffffff",
            py: 2.5,
            px: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
            Traffic Channels
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenModal}
              sx={{ 
                py: 1.2, 
                px: 3, 
                borderRadius: 8,
                borderWidth: 1.5,
                textTransform: 'none',
                fontWeight: 'medium'
              }}
              size="medium"
            >
              New From Template
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenSecondModal(null)}
              sx={{ 
                py: 1.2, 
                px: 3, 
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 'medium',
                boxShadow: '0 4px 10px rgba(25, 118, 210, 0.2)'
              }}
              size="medium"
              startIcon={<AddIcon />}
            >
              Create Channel
            </Button>
          </Stack>
        </Paper>

        {/* FILTER FIELD & DATE RANGE */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2.5, 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                placeholder="Search channels..."
                variant="outlined"
                size="small"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: filterText && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setFilterText("")}
                        edge="end"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { 
                    borderRadius: 6,
                    bgcolor: alpha(theme.palette.common.black, 0.02)
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: theme.palette.primary.main,
                    },
                  },
                }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1, ml: 1 }}>
                {filteredRows.length} {filteredRows.length === 1 ? 'channel' : 'channels'} found
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                <TextField
                  type="date"
                  value={dateRange.startDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateRangeChange('startDate', new Date(e.target.value))}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
                <TextField
                  type="date"
                  value={dateRange.endDate.toISOString().split('T')[0]}
                  onChange={(e) => handleDateRangeChange('endDate', new Date(e.target.value))}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    sx: { borderRadius: 2 }
                  }}
                />
                <Button 
                  variant="outlined" 
                  startIcon={<DateRangeIcon />}
                  onClick={() => {
                    const newStartDate = new Date();
                    newStartDate.setDate(newStartDate.getDate() - 30);
                    setDateRange({
                      startDate: newStartDate,
                      endDate: new Date()
                    });
                  }}
                  sx={{ 
                    borderRadius: 6, 
                    textTransform: 'none',
                    py: 1,
                    fontWeight: 'normal',
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: alpha(theme.palette.primary.main, 0.04)
                    }
                  }}
                >
                  Last 30 Days
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* DataGrid */}
        <Paper 
          elevation={0} 
          sx={{ 
            height: 600, 
            width: "100%", 
            overflow: 'hidden', 
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            border: `1px solid ${alpha(theme.palette.common.black, 0.05)}`
          }}
        >
          <ModernDataGrid 
            rows={filteredRows} 
            columns={tableColumns} 
            loading={loading.table}
          />
        </Paper>

        {/* Template Selection Modal */}
        <Modal 
          open={openModal} 
          onClose={handleCloseModal}
          aria-labelledby="template-modal-title"
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
              p: 4,
              width: "85%",
              maxWidth: "1000px",
              maxHeight: "90vh",
              overflow: "auto"
            }}
          >
            <Typography 
              variant="h5" 
              align="center" 
              id="template-modal-title"
              sx={{ 
                mb: 4, 
                fontWeight: 600,
                color: theme.palette.text.primary
              }}
            >
              Choose Your Traffic Channel Template
            </Typography>
            
            <Grid container spacing={3} justifyContent="center">
              {/* Facebook Ads Box */}
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 3,
                    height: '100%',
                    transition: 'all 0.2s ease-in-out',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenSecondModal("Facebook")}
                >
                  <Box sx={{ mb: 2 }}>
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: '#1877F2',
                      boxShadow: `0 8px 16px ${alpha('#1877F2', 0.3)}`
                    }}>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>f</Typography>
                    </Avatar>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Facebook Ads
                  </Typography>
                  <Divider sx={{ width: '70%', my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: 600 }}>
                    API Integrations:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: '100%', mb: 3 }}>
                    <Chip size="small" label="Cost update" color="primary" sx={{ borderRadius: 6 }} />
                    <Chip size="small" label="Campaign pause" color="primary" sx={{ borderRadius: 6 }} />
                    <Chip size="small" label="Conversion tracking" color="primary" sx={{ borderRadius: 6 }} />
                  </Box>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    sx={{ 
                      mt: 'auto', 
                      py: 1,
                      px: 3,
                      borderRadius: 6,
                      textTransform: 'none',
                      fontWeight: 'medium',
                      bgcolor: '#1877F2',
                      '&:hover': {
                        bgcolor: '#166FE5'
                      }
                    }}
                  >
                    Add Facebook
                  </Button>
                </Card>
              </Grid>

              {/* Google Ads Box */}
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 3,
                    height: '100%',
                    transition: 'all 0.2s ease-in-out',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenSecondModal("Google")}
                >
                  <Box sx={{ mb: 2 }}>
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: '#4285F4',
                      boxShadow: `0 8px 16px ${alpha('#4285F4', 0.3)}`
                    }}>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>G</Typography>
                    </Avatar>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    Google Ads
                  </Typography>
                  <Divider sx={{ width: '70%', my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: 600 }}>
                    API Integrations:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: '100%', mb: 3 }}>
                    <Chip size="small" label="Cost update" color="primary" sx={{ borderRadius: 6 }} />
                    <Chip size="small" label="Campaign pause" color="primary" sx={{ borderRadius: 6 }} />
                    <Chip size="small" label="Conversion tracking" color="primary" sx={{ borderRadius: 6 }} />
                  </Box>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      mt: 'auto', 
                      py: 1,
                      px: 3,
                      borderRadius: 6,
                      textTransform: 'none',
                      fontWeight: 'medium',
                      bgcolor: '#4285F4',
                      '&:hover': {
                        bgcolor: '#3367D6'
                      }
                    }}
                  >
                    Add Google
                  </Button>
                </Card>
              </Grid>

              {/* TikTok Ads Box */}
              <Grid item xs={12} sm={6} md={4}>
                <Card
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    p: 3,
                    height: '100%',
                    transition: 'all 0.2s ease-in-out',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: `0 12px 20px ${alpha(theme.palette.primary.main, 0.1)}`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenSecondModal("TikTok")}
                >
                  <Box sx={{ mb: 2 }}>
                    <Avatar sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: '#000000',
                      boxShadow: `0 8px 16px ${alpha('#000000', 0.2)}`
                    }}>
                      <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>T</Typography>
                    </Avatar>
                  </Box>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    TikTok Ads
                  </Typography>
                  <Divider sx={{ width: '70%', my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: 600 }}>
                    API Integrations:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: '100%', mb: 3 }}>
                    <Chip size="small" label="Cost update" color="primary" sx={{ borderRadius: 6 }} />
                    <Chip size="small" label="Campaign pause" color="secondary" sx={{ borderRadius: 6 }} />
                    <Chip size="small" label="Conversion tracking" color="primary" sx={{ borderRadius: 6 }} />
                  </Box>
                  <Button 
                    variant="contained" 
                    sx={{ 
                      mt: 'auto', 
                      py: 1,
                      px: 3,
                      borderRadius: 6,
                      textTransform: 'none',
                      fontWeight: 'medium',
                      bgcolor: '#000000',
                      '&:hover': {
                        bgcolor: '#333333'
                      }
                    }}
                  >
                    Add TikTok
                  </Button>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button 
                variant="outlined" 
                onClick={handleCloseModal}
                sx={{ 
                  px: 3, 
                  py: 1, 
                  borderRadius: 6,
                  textTransform: 'none',
                  fontWeight: 'medium'
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                onClick={() => handleOpenSecondModal(null)}
                sx={{ 
                  px: 3, 
                  py: 1, 
                  borderRadius: 6,
                  textTransform: 'none',
                  fontWeight: 'medium',
                  bgcolor: theme.palette.secondary.main,
                  '&:hover': {
                    bgcolor: theme.palette.secondary.dark
                  }
                }}
              >
                Custom Channel
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Channel Setup Modal */}
        <Modal 
          open={openSecondModal} 
          onClose={handleCloseSecondModal}
          aria-labelledby="channel-setup-modal-title"
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
            <Box
              sx={{
                position: "sticky",
                top: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2.5,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                zIndex: 10,
                backgroundColor: "white",
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3,
              }}
            >
              <Typography variant="h6" fontWeight="bold" id="channel-setup-modal-title">
                {editMode ? "Edit Traffic Channel" : "New Traffic Channel"}
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={handleCloseSecondModal}
                  sx={{ 
                    borderRadius: 6,
                    textTransform: 'none',
                    fontWeight: 'medium'
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleSubmit}
                  disabled={loading.save}
                  startIcon={loading.save ? <CircularProgress size={20} color="inherit" /> : null}
                  sx={{ 
                    borderRadius: 6,
                    textTransform: 'none',
                    fontWeight: 'medium',
                    px: 3
                  }}
                >
                  {loading.save ? "Saving..." : "Save Changes"}
                </Button>
              </Box>
            </Box>

            {renderTabs()}
          </Box>
        </Modal>

        {/* Global Snackbar for messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            elevation={6}
            variant="filled"
            sx={{ width: '100%', borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default TrafficChannels;