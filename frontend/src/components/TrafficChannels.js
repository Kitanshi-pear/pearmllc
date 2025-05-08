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
import { useTheme, useMediaQuery } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from "./Layout";
import axios from 'axios';

// Simulated icons that would be imported in a real application
const InfoIcon = () => <div style={{ width: 20, height: 20, background: '#1976d2', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>i</div>;
const DeleteIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🗑️</div>;
const EditIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</div>;
const DateRangeIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📅</div>;
const CheckIcon = () => <div style={{ width: 20, height: 20, color: 'green', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✓</div>;
const CancelIcon = () => <div style={{ width: 20, height: 20, color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✗</div>;
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

// Template options with predefined settings
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

// Helper component for platform connection status with improved UI
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip 
            label={isConnected ? "Connected" : "Not connected"} 
            color={isConnected ? "success" : "error"}
            size="small"
            icon={isConnected ? <CheckIcon /> : <CancelIcon />}
          />
          
          <Button
            variant={isConnected ? "outlined" : "contained"}
            onClick={onConnect}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={16} /> : null}
            sx={{ 
              py: 0.8, 
              px: 2, 
              borderRadius: 6,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 'medium',
              bgcolor: isConnected ? 'transparent' : platform === 'Facebook' ? '#1877F2' : 
                     platform === 'Google' ? '#4285F4' : '#000000',
              borderColor: platform === 'Facebook' ? '#1877F2' : 
                          platform === 'Google' ? '#4285F4' : '#000000',
              color: isConnected ? (platform === 'Facebook' ? '#1877F2' : 
                    platform === 'Google' ? '#4285F4' : '#000000') : 'white',
              '&:hover': {
                bgcolor: isConnected ? 'rgba(0,0,0,0.04)' : 
                        platform === 'Facebook' ? '#166FE5' : 
                        platform === 'Google' ? '#3367D6' : '#333333',
                borderColor: platform === 'Facebook' ? '#1877F2' : 
                            platform === 'Google' ? '#4285F4' : '#000000',
              }
            }}
          >
            {isConnected ? "Reconnect" : "Connect"}
          </Button>
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
  const location = useLocation();
  const navigate = useNavigate();

  // Refs for polling auth status
  const authPollingRef = useRef(null);
  const authTimeoutRef = useRef(null);

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

  // Cleanup function for auth polling
  const cleanupAuthPolling = () => {
    if (authPollingRef.current) {
      clearInterval(authPollingRef.current);
      authPollingRef.current = null;
    }

    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
  };
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupAuthPolling();
    };
  }, []);

  // Function to refresh connection status
  const refreshConnectionStatus = async () => {
    try {
      console.log("Refreshing connection status...");
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (!sessionToken) {
        console.log("No session token found, cannot refresh connection status");
        return;
      }
      
      // Make API call to check authentication status
      const response = await axios.get(`${API_URL}/auth/status`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`
        }
      });
      
      console.log("Auth status API response:", response.data);
      
      // Update auth status based on API response
      if (response.data) {
        const newAuthStatus = {
          facebook: response.data.facebook?.connected || false,
          google: response.data.google?.connected || false,
          tiktok: response.data.tiktok?.connected || false
        };
        
        setAuthStatus(newAuthStatus);
        
        // Update connection status for all channels
        const updatedChannelConnectionStatus = { ...channelConnectionStatus };
        
        // Update all channels based on their platform type
        rows.forEach(channel => {
          const platform = channel.aliasChannel?.toLowerCase();
          if (platform && (platform === 'facebook' || platform === 'google' || platform === 'tiktok')) {
            updatedChannelConnectionStatus[channel.id] = newAuthStatus[platform] || false;
          }
        });
        
        setChannelConnectionStatus(updatedChannelConnectionStatus);
        
        // Update the current channel being edited (if any)
        if (selectedRow && selectedRow.id) {
          const platform = selectedRow.aliasChannel?.toLowerCase();
          if (platform && (platform === 'facebook' || platform === 'google' || platform === 'tiktok')) {
            setFormData(prev => ({
              ...prev,
              isConnected: newAuthStatus[platform] || false
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing connection status:", error);
    }
  };

  // Function to save connection status
  const saveConnectionStatus = async (platform, isConnected) => {
    if (!selectedRow) {
      console.warn("Cannot save connection status: No channel selected");
      return;
    }
    
    try {
      console.log(`Saving connection status for ${platform}: ${isConnected ? 'Connected' : 'Disconnected'}`);
      
      // Show loading indicator
      setLoading(prev => ({ ...prev, save: true }));
      
      // Create an update payload with the current form data and updated connection status
      const updateData = {
        ...formData,
        isConnected: isConnected
      };
      
      console.log("Updating channel with data:", updateData);
      
      // Call API to update channel connection status
      const response = await axios.put(`${API_URL}/${selectedRow.id}`, updateData);
      
      console.log("API response:", response.data);
      
      // Update rows in state
      setRows(prevRows => 
        prevRows.map(row => 
          row.id === selectedRow.id ? response.data : row
        )
      );
      
      // Update connection status tracking specifically
      setChannelConnectionStatus(prev => ({
        ...prev,
        [selectedRow.id]: response.data.isConnected || isConnected
      }));
      
      // Also update form data's isConnected property
      setFormData(prev => ({
        ...prev,
        isConnected: response.data.isConnected || isConnected
      }));
      
      // Show success message
      setSnackbar({
        open: true,
        message: `${platform} connection status saved successfully`,
        severity: "success"
      });
      
      // Refresh the connection status display
      refreshConnectionStatus();
    } catch (error) {
      console.error(`Error saving connection status for ${platform}:`, error);
      
      // Show error message but keep modal open
      setSnackbar({
        open: true,
        message: `Failed to save connection status: ${error.message || 'Unknown error'}`,
        severity: "error"
      });
    } finally {
      // Always clear loading state
      setLoading(prev => ({ ...prev, save: false }));
    }
  };

  // Simplified handleAuth function that uses backend API
  const handleAuth = async (platform) => {
    const platformLower = platform.toLowerCase();
    
    // Clean up any existing auth polling
    cleanupAuthPolling();
    
    // Set loading state
    setLoading(prev => ({ ...prev, [platformLower]: true }));
    
    try {
      // Get the authentication URL from the API
      const authUrlResponse = await axios.get(`${API_URL}/auth/${platformLower}/url`);
      
      if (authUrlResponse.data && authUrlResponse.data.authUrl) {
        // Open the authentication URL in a new window
        window.open(authUrlResponse.data.authUrl, '_blank');
        
        // Start polling for connection status
        authPollingRef.current = setInterval(async () => {
          try {
            const statusResponse = await axios.get(`${API_URL}/auth/status`, {
              headers: {
                Authorization: `Bearer ${localStorage.getItem('sessionToken') || ''}`
              }
            });
            
            if (statusResponse.data && statusResponse.data[platformLower]?.connected) {
              // Auth successful - clear the polling interval
              clearInterval(authPollingRef.current);
              authPollingRef.current = null;
              
              // Update auth status
              setAuthStatus(prev => ({
                ...prev,
                [platformLower]: true
              }));
              
              // If we have a selected channel, update its connection status
              if (selectedRow && selectedRow.id) {
                setChannelConnectionStatus(prev => ({
                  ...prev,
                  [selectedRow.id]: true
                }));
                
                setFormData(prev => ({
                  ...prev,
                  isConnected: true
                }));
                
                // Save to API
                saveConnectionStatus(platform, true);
              }
              
              // Show success message
              setSnackbar({
                open: true,
                message: `${platform} account connected successfully`,
                severity: 'success'
              });
              
              // Clear loading state
              setLoading(prev => ({ ...prev, [platformLower]: false }));
            }
          } catch (error) {
            console.error("Error polling auth status:", error);
          }
        }, 2000); // Poll every 2 seconds
        
        // Set a timeout to stop polling after 2 minutes
        authTimeoutRef.current = setTimeout(() => {
          if (authPollingRef.current) {
            clearInterval(authPollingRef.current);
            authPollingRef.current = null;
            
            // Only show error if still loading
            if (loading[platformLower]) {
              setLoading(prev => ({ ...prev, [platformLower]: false }));
              
              setSnackbar({
                open: true,
                message: `${platform} authentication timed out. Please try again.`,
                severity: 'warning'
              });
            }
          }
        }, 120000); // 2 minutes timeout
      } else {
        throw new Error("Invalid auth URL response from API");
      }
    } catch (error) {
      console.error(`Error starting ${platform} authentication:`, error);
      
      setSnackbar({
        open: true,
        message: `Failed to initiate ${platform} authentication: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
      
      setLoading(prev => ({ ...prev, [platformLower]: false }));
    }
  };

  // Fetch data from API on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      setLoading((prev) => ({ ...prev, table: true }));
      
      try {
        // Fetch data from the API
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

  // Effect to update connection status when auth status changes
  useEffect(() => {
    if (selectedRow && openSecondModal) {
      // If we're in edit mode and the modal is open, update connection status
      const platform = selectedRow.aliasChannel;
      let isConnected = false;
      
      if (platform === 'Facebook') isConnected = authStatus.facebook;
      else if (platform === 'Google') isConnected = authStatus.google;
      else if (platform === 'TikTok') isConnected = authStatus.tiktok;
      
      // Update the connection status in the form
      setFormData(prev => ({
        ...prev,
        isConnected: isConnected
      }));
      
      // Also update the connection status tracking
      if (selectedRow.id) {
        setChannelConnectionStatus(prev => ({
          ...prev,
          [selectedRow.id]: isConnected
        }));
      }
    }
  }, [authStatus, selectedRow, openSecondModal]);

  // Filter rows based on search text
  const filteredRows = rows.filter((row) =>
    Object.values(row || {}).some((value) =>
      value?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // Helper to determine if platform is connectable
  const isPlatformConnectable = (platformName) => {
    if (!platformName) return false;
    const platformLower = platformName.toLowerCase();
    return ["facebook", "google", "tiktok"].includes(platformLower);
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
      
      // Only close modal for non-connectable platforms
      const shouldCloseModal = !isPlatformConnectable(formData.aliasChannel);
      
      if (shouldCloseModal) {
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
  
  // Simplified modal close function
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

  // More reliable function to check if current channel is connected
  const isChannelConnected = (platform) => {
    // For an existing channel being edited
    if (editMode && selectedRow) {
      const status = channelConnectionStatus[selectedRow.id];
      return status || false;
    }
    
    // For a new channel, check global auth status
    const platformLower = platform.toLowerCase();
    if (authStatus[platformLower]) {
      return true;
    }
    
    return formData.isConnected || false;
  };

  // Render Facebook connection section
  const renderFacebookConnection = () => {
    // Check if the current channel is connected
    const isConnected = isChannelConnected('Facebook');
    
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
          disabled={loading.facebook}
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
        
        {/* Show success message when connected */}
        {isConnected && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Your Facebook account is successfully connected. You can now use Facebook integrations.
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
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" gutterBottom>Payout type</Typography>
              <Select
                fullWidth
                name="payoutType"
                value={formData.payoutType || ""}
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
                value={formData.value || ""}
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
                  checked={formData.customConversionMatching || false}
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
    const isConnected = isChannelConnected('Google');
    
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
              disabled={loading.google}
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
        
        {/* Show success message when connected */}
        {isConnected && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            Your Google account is successfully connected. You can now use Google integrations.
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
            value={formData.googleMccAccountId || ""}
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
      </Box>
    );
  };

  // Return JSX for the component
  return (
    <Layout>
      <Typography variant="h5">Traffic Channels</Typography>
      <Typography variant="body2" color="textSecondary">
        Implementation with properly fixed API authentication flow.
      </Typography>
    </Layout>
  );
};

export default TrafficChannels;