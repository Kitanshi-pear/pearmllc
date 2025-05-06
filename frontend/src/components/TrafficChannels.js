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
  Tooltip
} from '@mui/material';

// Simulated icons that would be imported in a real application
const InfoIcon = () => <div style={{ width: 20, height: 20, background: '#1976d2', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>i</div>;
const DeleteIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🗑️</div>;
const EditIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</div>;
const DateRangeIcon = () => <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📅</div>;
const CheckIcon = () => <div style={{ width: 20, height: 20, color: 'green', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✓</div>;
const CancelIcon = () => <div style={{ width: 20, height: 20, color: 'red', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✗</div>;
const LockIcon = () => <div style={{ width: 20, height: 20, color: 'gray', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🔒</div>;

// Mock API for demonstration
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

// Mock data for demonstration
const mockRows = [
  { 
    id: 1, 
    channelName: 'Facebook Ads', 
    aliasChannel: 'Facebook', 
    costUpdateDepth: 'Ad Level', 
    costUpdateFrequency: '15 Minutes', 
    clicks: 1250, 
    conversions: 48, 
    revenue: 3500, 
    cost: 1800, 
    profit: 1700, 
    roi: 0.94,
    status: 'Active'
  },
  { 
    id: 2, 
    channelName: 'Google Ads', 
    aliasChannel: 'Google', 
    costUpdateDepth: 'Ad Level', 
    costUpdateFrequency: '15 Minutes', 
    clicks: 980, 
    conversions: 35, 
    revenue: 2800, 
    cost: 1500, 
    profit: 1300, 
    roi: 0.87,
    status: 'Active'
  },
  { 
    id: 3, 
    channelName: 'TikTok Ads', 
    aliasChannel: 'TikTok', 
    costUpdateDepth: 'Ad Level', 
    costUpdateFrequency: '15 Minutes', 
    clicks: 1500, 
    conversions: 25, 
    revenue: 1900, 
    cost: 1200, 
    profit: 700, 
    roi: 0.58,
    status: 'Active'
  },
  { 
    id: 4, 
    channelName: 'Custom Channel', 
    aliasChannel: 'Custom', 
    costUpdateDepth: 'Campaign Level', 
    costUpdateFrequency: '60 Minutes', 
    clicks: 450, 
    conversions: 12, 
    revenue: 950, 
    cost: 600, 
    profit: 350, 
    roi: 0.58,
    status: 'Inactive'
  }
];

// Template options with predefined settings
const channelTemplates = {
  Facebook: {
    channelName: "Facebook Ads",
    aliasChannel: "Facebook",
    costUpdateDepth: "Ad Level",
    costUpdateFrequency: "15 Minutes",
    currency: "USD",
    defaultEventName: "Purchase",
    isConnected: false, // Always start as not connected
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
    isConnected: false, // Always start as not connected
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
    isConnected: false, // Always start as not connected
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
    isConnected: false, // Always start as not connected
    customParameters: Array(20).fill().map((_, index) => (
      { name: `sub${index + 1}`, macro: "", description: "hint", role: "" }
    )),
    status: "Active"
  }
};

// Main component
const TrafficChannels = () => {
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
  
  // Form data with all potential platform-specific fields
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

  // Simulate fetching data on component mount
  useEffect(() => {
    const fetchChannels = async () => {
      setLoading((prev) => ({ ...prev, table: true }));
      
      // In a real app, this would be an API call
      setTimeout(() => {
        setRows(mockRows);
        
        // Set up mock connection statuses
        const newConnectionStatus = {};
        mockRows.forEach(row => {
          newConnectionStatus[row.id] = row.aliasChannel === 'Facebook' || row.aliasChannel === 'Google';
        });
        
        setChannelConnectionStatus(newConnectionStatus);
        setLoading((prev) => ({ ...prev, table: false }));
      }, 1000);
    };
    
    fetchChannels();
  }, [dateRange.startDate, dateRange.endDate]);

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

  // Handle authentication for platforms
  const handleAuth = async (platform) => {
    setLoading(prev => ({ ...prev, [platform.toLowerCase()]: true }));
    
    // Simulate OAuth flow
    setTimeout(() => {
      // Update connection status for the channel being edited
      if (selectedRow) {
        setChannelConnectionStatus(prev => ({
          ...prev,
          [selectedRow.id]: true
        }));
        
        setFormData(prev => ({
          ...prev,
          isConnected: true,
          connectionComplete: true
        }));
      }
      
      // Update global auth status
      setAuthStatus(prev => ({
        ...prev,
        [platform.toLowerCase()]: true
      }));
      
      setLoading(prev => ({ ...prev, [platform.toLowerCase()]: false }));
      
      setSnackbar({
        open: true,
        message: `Successfully connected to ${platform}!`,
        severity: 'success'
      });
    }, 2000);
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
  const handleDeleteChannel = (channelId) => {
    // Simulate API call
    setLoading(prev => ({ ...prev, delete: true }));
    
    setTimeout(() => {
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
      
      setLoading(prev => ({ ...prev, delete: false }));
    }, 1000);
  };

  // Form submission
  const handleSubmit = (e) => {
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
    
    // Simulate API call
    setLoading(prev => ({ ...prev, save: true }));
    
    setTimeout(() => {
      if (editMode) {
        // Update existing channel
        setRows(prevRows => 
          prevRows.map(row => 
            row.id === selectedRow.id ? { ...row, ...formData } : row
          )
        );
        
        setSnackbar({
          open: true,
          message: "Channel updated successfully",
          severity: "success"
        });
      } else {
        // Create new channel
        const newChannel = {
          ...formData,
          id: rows.length + 1, // Generate new ID
          clicks: 0,
          conversions: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          roi: 0
        };
        
        // Update our connection status tracking
        setChannelConnectionStatus(prev => ({
          ...prev,
          [newChannel.id]: newChannel.isConnected || false
        }));
        
        // Update local state with the newly created channel
        setRows(prevRows => [...prevRows, newChannel]);
        
        setSnackbar({
          open: true,
          message: "Channel created successfully",
          severity: "success"
        });
        
        // Set selected row to newly created channel for editing
        setSelectedRow(newChannel);
        setEditMode(true);
      }
      
      // Don't automatically close the modal if it's a connectable platform
      if (!isPlatformConnectable(formData.aliasChannel)) {
        setOpenSecondModal(false);
      }
      
      setLoading(prev => ({ ...prev, save: false }));
    }, 1500);
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

  // Helper function to get channel icon
  const getChannelIcon = (channelName) => {
    const iconSize = { width: 20, height: 20 };
    
    switch(channelName?.toLowerCase()) {
      case 'facebook':
        return <div style={{ ...iconSize, backgroundColor: '#4267B2', borderRadius: '50%' }}>f</div>;
      case 'google':
        return <div style={{ ...iconSize, backgroundColor: '#4285F4', borderRadius: '50%' }}>G</div>;
      case 'tiktok':
        return <div style={{ ...iconSize, backgroundColor: '#000000', borderRadius: '50%' }}>T</div>;
      default:
        return <InfoIcon />;
    }
  };

  // Render Facebook connection section
  const renderFacebookConnection = () => {
    // Check if the current channel is connected
    const isConnected = editMode 
      ? channelConnectionStatus[selectedRow?.id] || false 
      : false;
    
    return (
      <Box sx={{ p: 3, borderBottom: "1px solid #eee" }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Facebook API integration</Typography>
            <Tooltip title="Integration information">
              <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
              {isConnected ? "Connected" : "Not connected"}
            </Typography>
            {isConnected ? <CheckIcon /> : <CancelIcon />}
          </Box>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<div style={{ width: 24, height: 24, backgroundColor: '#4267B2', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>f</div>}
          onClick={() => handleAuth('facebook')}
          disabled={loading.facebook}
          sx={{ mb: 2, bgcolor: '#1877F2', '&:hover': { bgcolor: '#166FE5' } }}
        >
          {loading.facebook ? <CircularProgress size={24} /> : isConnected ? "Reconnect Facebook" : "Connect Facebook"}
        </Button>
        
        <Box sx={{ mt: 2, color: '#6b7280', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon />
            <Typography variant="body2">Please allow access to your Facebook profile to activate integrations:</Typography>
          </Box>
          <Typography variant="body2" sx={{ pl: 3 }}>#1 Click on "Connect" and accept integration permissions</Typography>
          <Typography variant="body2" sx={{ pl: 3 }}>#2 Once accepted, fill in all the mandatory fields and save the changes.</Typography>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Facebook default data source (pixel)</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Pixel ID</Typography>
              <TextField
                fullWidth
                name="pixelId"
                value={formData.pixelId}
                onChange={handleFormChange}
                placeholder="Pixel ID"
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Conversions API Access token</Typography>
              <TextField
                fullWidth
                name="apiAccessToken"
                value={formData.apiAccessToken}
                onChange={handleFormChange}
                placeholder="Conversions API Access token"
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Default Event name</Typography>
              <TextField
                fullWidth
                name="defaultEventName"
                value={formData.defaultEventName}
                onChange={handleFormChange}
                placeholder="Default Event name"
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Payout type</Typography>
              <Select
                fullWidth
                name="payoutType"
                value={formData.payoutType}
                onChange={handleFormChange}
                displayEmpty
                size="small"
              >
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="CPA">CPA</MenuItem>
                <MenuItem value="CPC">CPC</MenuItem>
                <MenuItem value="CPL">CPL</MenuItem>
              </Select>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Value</Typography>
              <TextField
                fullWidth
                name="value"
                value={formData.value}
                onChange={handleFormChange}
                placeholder="Value"
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
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
                />
                <Typography variant="body2" sx={{ ml: 1 }}>
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
    const isConnected = editMode 
      ? channelConnectionStatus[selectedRow?.id] || false 
      : false;
    
    return (
      <Box sx={{ p: 3, borderBottom: "1px solid #eee" }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Google API integration</Typography>
            <Tooltip title="Integration information">
              <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
              {isConnected ? "Connected" : "Not connected"}
            </Typography>
            {isConnected ? <CheckIcon /> : <CancelIcon />}
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Google Ads Account ID *</Typography>
            <TextField
              fullWidth
              name="googleAdsAccountId"
              value={formData.googleAdsAccountId}
              onChange={handleFormChange}
              placeholder="Google Ads Account ID"
              variant="outlined"
              size="small"
            />
          </Grid>
          
          <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={() => handleAuth('google')}
              disabled={loading.google}
              startIcon={<div style={{ width: 20, height: 20, backgroundColor: '#4285F4', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>G</div>}
              fullWidth
              sx={{ mb: 0.5 }}
            >
              {loading.google ? <CircularProgress size={24} /> : isConnected ? "Reconnect Google" : "Sign in with Google"}
            </Button>
          </Grid>
        </Grid>
        
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 3 }}>
          Our platform will update costs via API and send conversions for the connected ad account
        </Typography>
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Google MCC Account ID (optional)</Typography>
        <TextField
          fullWidth
          name="googleMccAccountId"
          value={formData.googleMccAccountId}
          onChange={handleFormChange}
          placeholder="Google MCC Account ID (optional)"
          variant="outlined"
          size="small"
          sx={{ mb: 1 }}
        />
        
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Add MCC account id to send conversions to it and not ad account (optional).<br />
          Please make sure you have access to ad account and MCC with the e-mail you used for integration.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Conversion Matching</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Conversion Type *</Typography>
                <Tooltip title="Conversion type information">
                  <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                </Tooltip>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <LockIcon />
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>ADD MORE</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Conversion name *</Typography>
                <Tooltip title="Conversion name information">
                  <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                </Tooltip>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Category *</Typography>
                <Tooltip title="Category information">
                  <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                </Tooltip>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Include in "conversions" *</Typography>
                <Tooltip title="Include in 'conversions' information">
                  <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Campaign Manager 360</Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Conversion Type *</Typography>
                <Tooltip title="Conversion type information">
                  <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                </Tooltip>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <LockIcon />
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>ADD MORE</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Profile ID *</Typography>
                <Tooltip title="Profile ID information">
                  <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                </Tooltip>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Floodlight activity ID *</Typography>
                <Tooltip title="Floodlight activity ID information">
                  <div style={{ cursor: 'pointer' }}><InfoIcon /></div>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mt: 4, color: '#6b7280', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon />
            <Typography variant="body2">Please allow access to your Google Ads account to activate integrations:</Typography>
          </Box>
          <Typography variant="body2" sx={{ pl: 3 }}>#1 Click on "Connect" and accept integration permissions</Typography>
          <Typography variant="body2" sx={{ pl: 3 }}>#2 Once accepted, fill in all the mandatory fields and save the changes.</Typography>
        </Box>
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
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Additional parameters</Typography>
        
        {displayParams.map((param, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Parameter *
              </Typography>
              <TextField
                fullWidth
                value={param.name}
                onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                placeholder={`sub${index + 1}`}
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Macro/token *
              </Typography>
              <TextField
                fullWidth
                value={param.macro}
                onChange={(e) => handleParamChange(index, 'macro', e.target.value)}
                placeholder={index < 3 ? `{{ad.id}}` : ""}
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Name / Description *
              </Typography>
              <TextField
                fullWidth
                value={param.description}
                onChange={(e) => handleParamChange(index, 'description', e.target.value)}
                placeholder={index < 3 ? "ad_id" : "hint"}
                variant="outlined"
                size="small"
              />
            </Grid>
            
            <Grid item xs={12} sm={3}>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                Select role
              </Typography>
              <Select
                fullWidth
                value={param.role || ""}
                onChange={(e) => handleParamChange(index, 'role', e.target.value)}
                displayEmpty
                size="small"
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
            </Grid>
          </Grid>
        ))}
      </Box>
    );
  };

  // Render the main tabs based on the channel type
  const renderTabs = () => {
    return (
      <Box sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
            <Box
              sx={{
                p: 2,
                cursor: 'pointer',
                borderBottom: currentTab === 0 ? '2px solid #1976d2' : 'none',
                fontWeight: currentTab === 0 ? 'bold' : 'normal',
                color: currentTab === 0 ? '#1976d2' : 'inherit'
              }}
              onClick={() => setCurrentTab(0)}
            >
              Basic Settings
            </Box>
            
            {selectedChannel === 'Facebook' && (
              <Box
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderBottom: currentTab === 1 ? '2px solid #1976d2' : 'none',
                  fontWeight: currentTab === 1 ? 'bold' : 'normal',
                  color: currentTab === 1 ? '#1976d2' : 'inherit'
                }}
                onClick={() => setCurrentTab(1)}
              >
                Facebook Integration
              </Box>
            )}
            
            {selectedChannel === 'Google' && (
              <Box
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderBottom: currentTab === 2 ? '2px solid #1976d2' : 'none',
                  fontWeight: currentTab === 2 ? 'bold' : 'normal',
                  color: currentTab === 2 ? '#1976d2' : 'inherit'
                }}
                onClick={() => setCurrentTab(2)}
              >
                Google Integration
              </Box>
            )}
            
            <Box
              sx={{
                p: 2,
                cursor: 'pointer',
                borderBottom: currentTab === 3 ? '2px solid #1976d2' : 'none',
                fontWeight: currentTab === 3 ? 'bold' : 'normal',
                color: currentTab === 3 ? '#1976d2' : 'inherit'
              }}
              onClick={() => setCurrentTab(3)}
            >
              Additional Parameters
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ mt: 2 }}>
          {currentTab === 0 && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
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
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
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
                  />
                </Grid>
                
                <Grid item xs={12} md={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
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
                    sx={{ mb: 0.5 }}
                  >
                    <MenuItem value="">Select depth</MenuItem>
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="Campaign Level">Campaign Level</MenuItem>
                    <MenuItem value="Adset Level">Adset Level</MenuItem>
                    <MenuItem value="Ad Level">Ad Level</MenuItem>
                  </Select>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                    Please select the cost update depth from the available options.
                    The default setting is the maximum depth available for your account plan.
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
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
                    sx={{ mb: 0.5 }}
                  >
                    <MenuItem value="None">None</MenuItem>
                    <MenuItem value="60 Minutes">60 Minutes</MenuItem>
                    <MenuItem value="30 Minutes">30 Minutes</MenuItem>
                    <MenuItem value="15 Minutes">15 Minutes</MenuItem>
                    <MenuItem value="5 Minutes">5 Minutes</MenuItem>
                  </Select>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                    These are the current settings for your account. If you would like to change the frequency of
                    cost updates - please contact support.
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
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
                    sx={{ mb: 0.5 }}
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
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5, fontSize: '0.75rem' }}>
                    If no currency is selected, the value selected in the profile will be used.
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
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
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
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
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
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

  // DataGrid-like table component
  const SimpleDataGrid = ({ rows, columns }) => {
    return (
      <Box sx={{ width: '100%', overflow: 'auto', border: '1px solid #e0e0e0' }}>
        <Box sx={{ bgcolor: '#f8f9fa', fontWeight: 'bold', display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
          {columns.map((col, i) => (
            <Box key={i} sx={{ flex: col.flex || 'none', width: col.width || 'auto', p: 1.5, fontWeight: 'bold' }}>
              {col.headerName}
            </Box>
          ))}
        </Box>
        
        {rows.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <Typography color="text.secondary">
              No channels found. Create your first channel to get started.
            </Typography>
          </Box>
        ) : (
          rows.map((row, rowIndex) => (
            <Box 
              key={rowIndex} 
              sx={{ 
                display: 'flex', 
                borderBottom: '1px solid #e0e0e0',
                '&:hover': { bgcolor: '#f5f5f5', cursor: 'pointer' }
              }}
              onClick={() => handleRowClick(row)}
            >
              {columns.map((col, colIndex) => (
                <Box 
                  key={colIndex} 
                  sx={{ 
                    flex: col.flex || 'none', 
                    width: col.width || 'auto', 
                    p: 1.5,
                    color: col.field === 'profit' || col.field === 'roi' 
                      ? row[col.field] >= 0 ? 'green' : 'red' 
                      : 'inherit'
                  }}
                >
                  {col.renderCell ? (
                    col.renderCell({ row, value: row[col.field] })
                  ) : col.valueFormatter ? (
                    col.valueFormatter({ value: row[col.field] })
                  ) : (
                    row[col.field]
                  )}
                </Box>
              ))}
            </Box>
          ))
        )}
      </Box>
    );
  };

  // Define the table columns
  const tableColumns = [
    {
      field: 'channelName',
      headerName: 'Channel',
      flex: 1,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getChannelIcon(params.row.aliasChannel)}
          <Typography variant="body2">{params.value}</Typography>
          {params.row.status === 'Inactive' && (
            <Chip size="small" label="Inactive" color="default" />
          )}
          {isPlatformConnectable(params.row.aliasChannel) && (
            <Chip 
              size="small" 
              label={channelConnectionStatus[params.row.id] ? "Connected" : "Not Connected"} 
              color={channelConnectionStatus[params.row.id] ? "success" : "warning"} 
            />
          )}
        </Box>
      ),
    },
    {
      field: 'costUpdateDepth',
      headerName: 'Update Depth',
      width: 150,
    },
    {
      field: 'costUpdateFrequency',
      headerName: 'Update Frequency',
      width: 170,
    },
    {
      field: 'clicks',
      headerName: 'Clicks',
      width: 90,
      valueFormatter: (params) => params?.value !== undefined ? formatNumber(params.value, 0) : "0",
    },
    {
      field: 'conversions',
      headerName: 'Conversions',
      width: 120,
      valueFormatter: (params) => params?.value !== undefined ? formatNumber(params.value, 0) : "0",
    },
    {
      field: 'revenue',
      headerName: 'Revenue',
      width: 120,
      valueFormatter: (params) => params?.value !== undefined ? `$${formatNumber(params.value)}` : "$0",
    },
    {
      field: 'cost',
      headerName: 'Cost',
      width: 120,
      valueFormatter: (params) => params?.value !== undefined ? `$${formatNumber(params.value)}` : "$0",
    },
    {
      field: 'profit',
      headerName: 'Profit',
      width: 120,
      valueFormatter: (params) => params?.value !== undefined ? `$${formatNumber(params.value)}` : "$0",
    },
    {
      field: 'roi',
      headerName: 'ROI',
      width: 90,
      valueFormatter: (params) => params?.value !== undefined ? formatPercent(params.value) : "0%",
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit Channel">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEditChannel(params.row);
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
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 3,
        p: 3,
        bgcolor: "#f5f5f5",
        minHeight: "calc(100vh - 80px)",
        position: "relative",
      }}
    >
      {/* HEADER WITH PERSISTENT BUTTONS */}
      <Paper
        elevation={2}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "#ffffff",
          py: 2,
          px: 3,
          borderRadius: 2
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
            sx={{ py: 1, px: 2, borderRadius: 1.5 }}
            size="medium"
          >
            New From Template
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenSecondModal(null)}
            sx={{ py: 1, px: 2, borderRadius: 1.5 }}
            size="medium"
          >
            Create New Channel
          </Button>
        </Stack>
      </Paper>

      {/* FILTER FIELD & DATE RANGE */}
      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              label="Filter Channels"
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              fullWidth
              InputProps={{
                endAdornment: filterText && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setFilterText("")}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              {filteredRows.length} {filteredRows.length === 1 ? 'channel' : 'channels'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
              <input
                type="date"
                value={dateRange.startDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateRangeChange('startDate', new Date(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input
                type="date"
                value={dateRange.endDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateRangeChange('endDate', new Date(e.target.value))}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
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
              >
                Last 30 Days
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* DataGrid */}
      <Paper elevation={2} sx={{ height: 600, width: "100%", p: 0, overflow: 'hidden', borderRadius: 2 }}>
        {loading.table ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <SimpleDataGrid 
            rows={filteredRows} 
            columns={tableColumns} 
          />
        )}
      </Paper>

      {/* Template Selection Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            width: "80%",
            maxWidth: "1000px",
            maxHeight: "90vh",
            overflow: "auto"
          }}
        >
          <Typography variant="h5" align="center" sx={{ mb: 4, fontWeight: "bold" }}>
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
                  transition: 'all 0.2s',
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 5
                  },
                  cursor: 'pointer'
                }}
                onClick={() => handleOpenSecondModal("Facebook")}
              >
                <Box sx={{ bgcolor: '#f0f2f5', p: 2, borderRadius: '50%', mb: 2 }}>
                  <div style={{ 
                    width: "60px", 
                    height: "60px", 
                    backgroundColor: '#4267B2', 
                    borderRadius: '50%', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px',
                    fontWeight: 'bold'
                  }}>f</div>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                  Facebook Ads
                </Typography>
                <Divider sx={{ width: '70%', my: 2 }} />
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: "bold" }}>
                  API Integrations:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: '100%', mb: 3 }}>
                  <Chip size="small" label="Cost update" color="primary" sx={{ borderRadius: 1 }} />
                  <Chip size="small" label="Campaign pause" color="primary" sx={{ borderRadius: 1 }} />
                  <Chip size="small" label="Conversion tracking" color="primary" sx={{ borderRadius: 1 }} />
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ 
                    mt: 'auto', 
                    py: 1,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold'
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
                  transition: 'all 0.2s',
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 5
                  },
                  cursor: 'pointer'
                }}
                onClick={() => handleOpenSecondModal("Google")}
              >
                <Box sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: '50%', mb: 2 }}>
                  <div style={{ 
                    width: "60px", 
                    height: "60px", 
                    backgroundColor: '#4285F4', 
                    borderRadius: '50%', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px',
                    fontWeight: 'bold'
                  }}>G</div>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                  Google Ads
                </Typography>
                <Divider sx={{ width: '70%', my: 2 }} />
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: "bold" }}>
                  API Integrations:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: '100%', mb: 3 }}>
                  <Chip size="small" label="Cost update" color="primary" sx={{ borderRadius: 1 }} />
                  <Chip size="small" label="Campaign pause" color="primary" sx={{ borderRadius: 1 }} />
                  <Chip size="small" label="Conversion tracking" color="primary" sx={{ borderRadius: 1 }} />
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ 
                    mt: 'auto', 
                    py: 1,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold'
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
                  transition: 'all 0.2s',
                  borderRadius: 3,
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 5
                  },
                  cursor: 'pointer'
                }}
                onClick={() => handleOpenSecondModal("TikTok")}
              >
                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '50%', mb: 2 }}>
                  <div style={{ 
                    width: "60px", 
                    height: "60px", 
                    backgroundColor: '#000000', 
                    borderRadius: '50%', 
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    fontWeight: 'bold'
                  }}>T</div>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" }}>
                  TikTok Ads
                </Typography>
                <Divider sx={{ width: '70%', my: 2 }} />
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 2, fontWeight: "bold" }}>
                  API Integrations:
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: '100%', mb: 3 }}>
                  <Chip size="small" label="Cost update" color="primary" sx={{ borderRadius: 1 }} />
                  <Chip size="small" label="Campaign pause" color="secondary" sx={{ borderRadius: 1 }} />
                  <Chip size="small" label="Conversion tracking" color="primary" sx={{ borderRadius: 1 }} />
                </Box>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ 
                    mt: 'auto', 
                    py: 1,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 'bold'
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
              sx={{ px: 3, py: 1, borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={() => handleOpenSecondModal(null)}
              sx={{ px: 3, py: 1, borderRadius: 2 }}
            >
              Custom Channel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Channel Setup Modal */}
      <Modal open={openSecondModal} onClose={handleCloseSecondModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "white",
            borderRadius: 2,
            boxShadow: 3,
            maxHeight: "90vh",
            overflowY: "auto",
            width: "85%",
            maxWidth: "1000px"
          }}
        >
          <Box
            sx={{
              position: "sticky",
              top: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: 2,
              boxShadow: 1,
              zIndex: 10,
              backgroundColor: "white",
              borderTopLeftRadius: 2,
              borderTopRightRadius: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {editMode ? "Edit Traffic Channel" : "New Traffic Channel"}
            </Typography>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button 
                variant="outlined" 
                onClick={handleCloseSecondModal}
              >
                CLOSE
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSubmit}
                disabled={loading.save}
                startIcon={loading.save ? <CircularProgress size={20} /> : null}
              >
                SAVE
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
          sx={{ width: '100%', boxShadow: 3, borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TrafficChannels;