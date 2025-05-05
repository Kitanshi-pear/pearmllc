// src/components/TrafficChannels.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DateRangeIcon from "@mui/icons-material/DateRange";
import {
  Button,
  IconButton,
  CircularProgress,
  Typography,
  Box,
  Modal,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Stack,
  Switch,
  Tooltip,
  InputAdornment,
  Snackbar,
  Alert,
  Divider,
  Chip,
  Paper
} from "@mui/material";
import Layout from "./Layout";
import axios from "axios";
import CheckIcon from "@mui/icons-material/Check";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

// Updated API URL with your specified endpoint
const API_URL = process.env.REACT_APP_API_URL || "https://pearmllc.onrender.com";

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

const TrafficChannels = () => {
  // State management
  const [authStatus, setAuthStatus] = useState({
    facebook: false,
    google: false
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
  const [formData, setFormData] = useState({
    channelName: "",
    aliasChannel: "",
    costUpdateDepth: "",
    costUpdateFrequency: "5 Minutes",
    currency: "USD",
    s2sPostbackUrl: "",
    clickRefId: "",
    externalId: "",
    pixelId: "",
    apiAccessToken: "",
    defaultEventName: "Purchase",
    customConversionMatching: false,
    googleAdsAccountId: "",
    googleMccAccountId: "",
    conversionType: "",
    conversionName: "",
    conversionCategory: "",
    includeInConversions: ""
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Check for OAuth callback parameters in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const success = searchParams.get('success');
    const platform = searchParams.get('platform');
    const code = searchParams.get('code');
    const scope = searchParams.get('scope');
    
    if ((success === 'true' || code) && platform) {
      // Check if there's stored state in localStorage
      const storedState = localStorage.getItem('oauthState');
      
      if (storedState) {
        try {
          const state = JSON.parse(storedState);
          
          // Show success message
          setSnackbar({
            open: true,
            message: `Successfully connected to ${platform}!`,
            severity: 'success'
          });
          
          // Restore the modal state
          if (state.editingChannelId) {
            // Find the channel and open it for editing
            const channelToEdit = rows.find(row => row.id === state.editingChannelId);
            if (channelToEdit) {
              setFormData({
                ...channelToEdit,
                ...state.formData
              });
              setSelectedChannel(channelToEdit.aliasChannel);
              setEditMode(true);
              setSelectedRow(channelToEdit);
              setOpenSecondModal(true);
            }
          } else if (state.formData) {
            // For new channel creation
            setFormData(state.formData);
            setSelectedChannel(state.selectedChannel);
            setOpenSecondModal(true);
          }
          
          // Update auth status
          setAuthStatus(prev => ({
            ...prev,
            [platform.toLowerCase()]: true
          }));
          
          // Clear localStorage
          localStorage.removeItem('oauthState');
        } catch (error) {
          console.error('Error parsing oauthState:', error);
        }
      }
      
      // Clear URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location, rows]);

  // Define the table columns
  const columns = [
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
      type: 'number',
      width: 90,
      valueFormatter: (params) => params?.value !== undefined ? formatNumber(params.value, 0) : "0",
    },
    {
      field: 'conversions',
      headerName: 'Conversions',
      type: 'number',
      width: 120,
      valueFormatter: (params) => params?.value !== undefined ? formatNumber(params.value, 0) : "0",
    },
    {
      field: 'revenue',
      headerName: 'Revenue',
      type: 'number',
      width: 120,
      valueFormatter: (params) => params?.value !== undefined ? `$${formatNumber(params.value)}` : "$0",
    },
    {
      field: 'cost',
      headerName: 'Cost',
      type: 'number',
      width: 120,
      valueFormatter: (params) => params?.value !== undefined ? `$${formatNumber(params.value)}` : "$0",
    },
    {
      field: 'profit',
      headerName: 'Profit',
      type: 'number',
      width: 120,
      valueFormatter: (params) => params?.value !== undefined ? `$${formatNumber(params.value)}` : "$0",
      cellClassName: (params) => {
        if (params.value == null || params.value === undefined) {
          return '';
        }
        return params.value >= 0 ? 'profit-positive' : 'profit-negative';
      },
    },
    {
      field: 'roi',
      headerName: 'ROI',
      type: 'number',
      width: 90,
      valueFormatter: (params) => params?.value !== undefined ? formatPercent(params.value) : "0%",
      cellClassName: (params) => {
        if (params.value == null || params.value === undefined) {
          return '';
        }
        return params.value >= 0 ? 'profit-positive' : 'profit-negative';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
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
              <EditIcon fontSize="small" />
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
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  // Template options with predefined settings
  const channelTemplates = {
    Facebook: {
      channelName: "Facebook Ads",
      aliasChannel: "Facebook",
      costUpdateDepth: "Ad Level",
      costUpdateFrequency: "15 Minutes",
      currency: "USD",
      defaultEventName: "Purchase"
    },
    Google: {
      channelName: "Google Ads",
      aliasChannel: "Google",
      costUpdateDepth: "Ad Level",
      costUpdateFrequency: "15 Minutes",
      currency: "USD",
      defaultEventName: "Purchase"
    },
    TikTok: {
      channelName: "TikTok Ads",
      aliasChannel: "TikTok",
      costUpdateDepth: "Ad Level",
      costUpdateFrequency: "15 Minutes",
      currency: "USD",
      defaultEventName: "Purchase"
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
      pixelId: "",
      apiAccessToken: "",
      defaultEventName: "Purchase",
      customConversionMatching: false,
      googleAdsAccountId: "",
      googleMccAccountId: "",
      conversionType: "",
      conversionName: "",
      conversionCategory: "",
      includeInConversions: ""
    }
  };

  // Helper function to get channel icon
  const getChannelIcon = (channelName) => {
    const iconSize = { width: 20, height: 20 };
    
    switch(channelName?.toLowerCase()) {
      case 'facebook':
        return <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" style={iconSize} />;
      case 'google':
        return <img src="https://developers.google.com/static/ads/images/ads_192px_clr.svg" alt="Google" style={iconSize} />;
      case 'tiktok':
        return <img src="https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png" alt="TikTok" style={iconSize} />;
      default:
        return <InfoIcon style={iconSize} />;
    }
  };

  // Fetch channels from API with metrics data
  const fetchChannels = async () => {
    try {
      setLoading(prev => ({ ...prev, table: true }));
      
      // Format date range for API
      const formattedStartDate = dateRange.startDate.toISOString().split('T')[0];
      const formattedEndDate = dateRange.endDate.toISOString().split('T')[0];
      
      // Updated API endpoint to match your specified endpoint
      const response = await axios.get(`${API_URL}/api/traffic`, {
        params: {
          start_date: formattedStartDate,
          end_date: formattedEndDate
        }
      });
      
      // Process the data
      const processedData = response.data.map(row => ({
        ...row,
        clicks: row.metrics?.clicks ?? 0,
        conversions: row.metrics?.conversions ?? 0,
        revenue: row.metrics?.revenue ?? 0,
        cost: row.metrics?.cost ?? 0,
        profit: row.metrics?.profit ?? 0,
        roi: row.metrics?.roi ?? 0
      }));
      
      setRows(processedData);
      
      // Check auth status
      try {
        const authResponse = await axios.get(`${API_URL}/api/traffic/auth/status`);
        setAuthStatus(authResponse.data);
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
      setSnackbar({
        open: true,
        message: "Failed to load traffic channels data",
        severity: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, table: false }));
    }
  };

  // Load data on component mount and when date range changes
  useEffect(() => {
    fetchChannels();
  }, [dateRange.startDate, dateRange.endDate]);

  // Filter rows based on search text
  const filteredRows = Array.isArray(rows) 
  ? rows.filter((row) =>
      Object.values(row || {}).some((value) =>
        value?.toString().toLowerCase().includes(filterText.toLowerCase())
      )
    )
  : [];

  // Handle authentication for platforms
  const handleAuth = async (platform) => {
    setLoading(prev => ({ ...prev, [platform]: true }));
    
    try {
      // Save current state before redirecting
      const stateToSave = {
        editingChannelId: selectedRow?.id,
        formData: formData,
        selectedChannel: selectedChannel,
        editMode: editMode
      };
      
      localStorage.setItem('oauthState', JSON.stringify(stateToSave));
      
      // Redirect to OAuth
      const authUrl = platform === "google" 
        ? `${API_URL}/api/traffic/auth/google` 
        : `${API_URL}/api/traffic/auth/facebook`;
      
      window.location.href = authUrl;
    } catch (err) {
      console.error(`${platform} OAuth Error:`, err);
      setSnackbar({
        open: true,
        message: `Failed to connect to ${platform}. Please try again.`,
        severity: "error"
      });
      setLoading(prev => ({ ...prev, [platform]: false }));
    }
  };

  // Form change handler
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

  // Date range change handler
  const handleDateRangeChange = (field, date) => {
    setDateRange(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Validate form - Modified to only require basic fields
  const validateForm = () => {
    const errors = {};
    const requiredFields = ['channelName', 'aliasChannel', 'costUpdateDepth', 'costUpdateFrequency', 'currency'];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });
    
    // Don't require platform-specific fields - they can be filled later after OAuth
    
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
        aliasChannel: channelType
      });
      setSelectedChannel(channelType);
    } else {
      // Reset form for custom channel
      setFormData(channelTemplates.Custom);
      setSelectedChannel(null);
    }
    
    setEditMode(false);
    setOpenSecondModal(true);
    setOpenModal(false);
  };

  // Edit channel
  const handleEditChannel = (channel) => {
    setSelectedRow(channel);
    setFormData({
      ...channelTemplates.Custom,
      ...channel
    });
    setSelectedChannel(channel.aliasChannel);
    setEditMode(true);
    setOpenSecondModal(true);
  };

  // Delete channel
  const handleDeleteChannel = async (channelId) => {
    if (window.confirm("Are you sure you want to delete this channel?")) {
      try {
        setLoading(prev => ({ ...prev, delete: true }));
        const response = await axios.delete(`${API_URL}/api/traffic/${channelId}`);
        
        if (response.data.deactivated) {
          // Channel was not deleted but marked as inactive
          setRows(prevRows => 
            prevRows.map(row => 
              row.id === channelId ? { ...row, status: 'Inactive' } : row
            )
          );
          
          setSnackbar({
            open: true,
            message: "Channel has associated data and cannot be deleted. It has been marked as inactive.",
            severity: "warning"
          });
        } else {
          // Channel was deleted
          setRows(prevRows => prevRows.filter(row => row.id !== channelId));
          
          setSnackbar({
            open: true,
            message: "Channel deleted successfully",
            severity: "success"
          });
        }
      } catch (error) {
        console.error("Error deleting channel:", error);
        setSnackbar({
          open: true,
          message: "Failed to delete channel",
          severity: "error"
        });
      } finally {
        setLoading(prev => ({ ...prev, delete: false }));
      }
    }
  };

  // Form submission - Modified to allow saving without platform-specific fields
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields",
        severity: "error"
      });
      return;
    }
    
    try {
      setLoading(prev => ({ ...prev, save: true }));
      
      let response;
      if (editMode) {
        // Update existing channel
        response = await axios.put(
          `${API_URL}/api/traffic/${selectedRow.id}`, 
          formData
        );
        
        // Update local state
        setRows(prevRows => 
          prevRows.map(row => 
            row.id === selectedRow.id ? { ...row, ...response.data } : row
          )
        );
        
        setSnackbar({
          open: true,
          message: "Channel updated successfully",
          severity: "success"
        });
      } else {
        // Create new channel
        response = await axios.post(`${API_URL}/api/traffic`, formData);
        
        // Update local state with the newly created channel
        setRows(prevRows => [...prevRows, response.data]);
        
        setSnackbar({
          open: true,
          message: "Channel created successfully",
          severity: "success"
        });
        
        // Immediately open edit mode for newly created channel if it's a platform that needs connection
        if (["Facebook", "Google"].includes(formData.aliasChannel)) {
          setSelectedRow(response.data);
          setEditMode(true);
        }
      }
      
      // Close modal only if not immediately going to edit mode
      if (!["Facebook", "Google"].includes(formData.aliasChannel) || editMode) {
        resetForm();
        setOpenSecondModal(false);
      }
      
      // Refresh the data to ensure we have the latest from the server
      fetchChannels();
    } catch (error) {
      console.error("Error saving channel:", error);
      setSnackbar({
        open: true,
        message: `Failed to ${editMode ? 'update' : 'create'} channel: ${error.response?.data?.error || error.message}`,
        severity: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, save: false }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData(channelTemplates.Custom);
    setSelectedChannel(null);
    setSelectedRow(null);
    setFormErrors({});
    setEditMode(false);
  };

  // Modal controls
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  
  const handleCloseSecondModal = () => {
    setOpenSecondModal(false);
    resetForm();
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Handle row click to navigate to detailed view
  const handleRowClick = (params) => {
    navigate(`/api/traffic/${params.id}/details`);
  };

  // Helper to determine if platform connection is available
  const isPlatformConnectable = (platformName) => {
    return ["Facebook", "Google"].includes(platformName);
  };

  // Helper to render connection section based on platform
  const renderConnectionSection = (platformName) => {
    if (!isPlatformConnectable(platformName)) {
      return null;
    }

    const platform = platformName.toLowerCase();
    
    return (
      <Box
        sx={{
          border: "1px solid #e0e0e0",
          borderRadius: 2,
          p: 3,
          mb: 3,
          backgroundColor: "#f8f9fa",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={7}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {getChannelIcon(platformName)}
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                {platformName} API Integration
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Connect your {platformName} account to enable:
              <Box component="ul" sx={{ pl: 2, mt: 1, mb: 1 }}>
                <Box component="li">Automatic cost updates</Box>
                <Box component="li">Campaign management</Box>
                <Box component="li">Conversion tracking</Box>
              </Box>
            </Typography>
          </Grid>
          <Grid item xs={12} sm={5} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
            <Button
              variant={authStatus[platform] ? "contained" : "outlined"}
              color={authStatus[platform] ? "success" : "primary"}
              sx={{ 
                textTransform: "none", 
                py: 1.2,
                px: 3,
                borderRadius: 2,
                boxShadow: authStatus[platform] ? 3 : 0
              }}
              onClick={() => handleAuth(platform)}
              disabled={loading[platform]}
              startIcon={authStatus[platform] ? <CheckIcon /> : getChannelIcon(platformName)}
            >
              {loading[platform] ? 
                <CircularProgress size={24} /> : 
                authStatus[platform] ? "Connected" : `Connect ${platformName}`
              }
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Render platform-specific settings
  const renderPlatformSettings = () => {
    if (selectedChannel === "Facebook") {
      return (
        <Card sx={{ mt: 3, p: 0, boxShadow: 2, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ 
            bgcolor: "#f0f7ff", 
            p: 2, 
            borderBottom: "1px solid #e0e0e0",
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            {getChannelIcon("Facebook")}
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Facebook Settings
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {/* Always show connection section first in the channel settings */}
            {renderConnectionSection("Facebook")}

            {/* Facebook Pixel Data Section - Optional fields */}
            <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0", borderRadius: 2, mb: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      Facebook Default Data Source (Pixel)
                    </Typography>
                    <Tooltip title="The Facebook pixel helps you track conversions from Facebook ads, optimize ads based on collected data, build targeted audiences for future ads, and remarket to people who have already taken some action on your website.">
                      <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                    </Tooltip>
                  </Box>
                </Grid>

                {/* Pixel ID - Optional */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Pixel ID"
                    name="pixelId"
                    value={formData.pixelId}
                    onChange={handleFormChange}
                    placeholder="Enter your Facebook Pixel ID"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Tooltip title="Enter your Facebook Pixel ID">
                            <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="medium"
                  />
                </Grid>

                {/* Conversions API Access Token - Optional */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Conversions API Access Token"
                    name="apiAccessToken"
                    value={formData.apiAccessToken}
                    onChange={handleFormChange}
                    placeholder="Enter your Facebook API Access Token"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Tooltip title="Enter your Facebook API Access Token">
                            <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="medium"
                  />
                </Grid>

                {/* Default Event Name */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Default Event Name"
                    name="defaultEventName"
                    value={formData.defaultEventName}
                    onChange={handleFormChange}
                    placeholder="e.g., Purchase, Lead"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Tooltip title="Default event triggered in your pixel (e.g., Purchase, Lead)">
                            <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="medium"
                  />
                </Grid>

                {/* Custom Conversion Matching */}
                <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center" }}>
                  <FormControl component="fieldset" sx={{ width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Switch
                        checked={formData.customConversionMatching}
                        onChange={(e) =>
                          setFormData((prevState) => ({
                            ...prevState,
                            customConversionMatching: e.target.checked,
                          }))
                        }
                        name="customConversionMatching"
                        color="primary"
                      />
                      <Typography variant="body1" sx={{ ml: 1 }}>
                        Custom Conversion Matching
                      </Typography>
                      <Tooltip title="Enable to use custom matching parameters for improved conversion tracking">
                        <HelpOutlineIcon fontSize="small" sx={{ ml: 1, cursor: "pointer", color: "#6b7280" }} />
                      </Tooltip>
                    </Box>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </CardContent>
        </Card>
      );
    } else if (selectedChannel === "Google") {
      return (
        <Card sx={{ mt: 3, p: 0, boxShadow: 2, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ 
            bgcolor: "#f0f7ff", 
            p: 2, 
            borderBottom: "1px solid #e0e0e0",
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            {getChannelIcon("Google")}
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Google Settings
            </Typography>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {/* Always show connection section first in the channel settings */}
            {renderConnectionSection("Google")}

            <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0", borderRadius: 2, mb: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      Google Ads Account Details
                    </Typography>
                    <Tooltip title="Enter your Google Ads account information to enable tracking and automation">
                      <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                    </Tooltip>
                  </Box>
                </Grid>

                {/* Google Ads Account ID */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Google Ads Account ID"
                    name="googleAdsAccountId"
                    value={formData.googleAdsAccountId}
                    onChange={handleFormChange}
                    placeholder="e.g., 123-456-7890"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Tooltip title="Enter your Google Ads Account ID (e.g., 123-456-7890)">
                            <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="medium"
                  />
                </Grid>

                {/* Google MCC Account ID */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Google MCC Account ID"
                    name="googleMccAccountId"
                    value={formData.googleMccAccountId}
                    onChange={handleFormChange}
                    placeholder="Optional"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Tooltip title="Enter your Google MCC Account ID if applicable">
                            <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="medium"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Add MCC account ID to send conversions to it and not the ad account (optional).
                    Please make sure you have access to the ad account and MCC with the e-mail you used for integration.
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Conversion Matching Section */}
            <Paper elevation={0} sx={{ p: 3, border: "1px solid #e0e0e0", borderRadius: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  Conversion Matching Settings
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                  Configure how conversions are tracked and matched in Google Ads
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Conversion Type</Typography>
                  <FormControl fullWidth>
                    <Select
                      name="conversionType"
                      value={formData.conversionType || ""}
                      onChange={handleFormChange}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Select type</MenuItem>
                      <MenuItem value="Purchase">Purchase</MenuItem>
                      <MenuItem value="Lead">Lead</MenuItem>
                      <MenuItem value="SignUp">Sign Up</MenuItem>
                      <MenuItem value="PageView">Page View</MenuItem>
                      <MenuItem value="AddToCart">Add To Cart</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Conversion Name</Typography>
                  <TextField
                    fullWidth
                    name="conversionName"
                    placeholder="Enter name"
                    value={formData.conversionName || ""}
                    onChange={handleFormChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Category</Typography>
                  <FormControl fullWidth>
                    <Select
                      name="conversionCategory"
                      value={formData.conversionCategory || ""}
                      onChange={handleFormChange}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Select category</MenuItem>
                      <MenuItem value="Default">Default</MenuItem>
                      <MenuItem value="Purchase">Purchase</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>Include in Conversions</Typography>
                  <FormControl fullWidth>
                    <Select
                      name="includeInConversions"
                      value={formData.includeInConversions || ""}
                      onChange={handleFormChange}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Select option</MenuItem>
                      <MenuItem value="Yes">Yes</MenuItem>
                      <MenuItem value="No">No</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  return (
    <Layout>
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
                        <DeleteIcon fontSize="small" />
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
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="From Date"
                    value={dateRange.startDate}
                    onChange={(date) => handleDateRangeChange('startDate', date)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label="To Date"
                    value={dateRange.endDate}
                    onChange={(date) => handleDateRangeChange('endDate', date)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </LocalizationProvider>
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
            <DataGrid
              rows={filteredRows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 20, 50]}
              disableSelectionOnClick
              onRowClick={handleRowClick}
              getRowId={(row) => row.id}
              sx={{
                '& .MuiDataGrid-columnHeaders': { backgroundColor: "#f8f9fa", fontWeight: "bold" },
                '& .MuiDataGrid-row:hover': { backgroundColor: "#f5f5f5", cursor: 'pointer' },
                '& .profit-positive': { color: 'green' },
                '& .profit-negative': { color: 'red' },
                border: 'none',
                height: '100%'
              }}
              components={{
                NoRowsOverlay: () => (
                  <Stack height="100%" alignItems="center" justifyContent="center">
                    <Typography color="text.secondary">
                      No channels found. Create your first channel to get started.
                    </Typography>
                  </Stack>
                )
              }}
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
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                      alt="Facebook Ads"
                      style={{ width: "60px", height: "60px" }}
                    />
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
                    <img
                      src="https://developers.google.com/static/ads/images/ads_192px_clr.svg"
                      alt="Google Ads"
                      style={{ width: "60px", height: "60px" }}
                    />
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
                    <img
                      src="https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png"
                      alt="TikTok Ads"
                      style={{ width: "60px", height: "60px" }}
                    />
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
            <form onSubmit={handleSubmit}>
              {/* Sticky header */}
              <Box
                sx={{
                  position: "sticky",
                  top: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 3,
                  boxShadow: 2,
                  zIndex: 10,
                  backgroundColor: "white",
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {selectedChannel && getChannelIcon(selectedChannel)}
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {editMode ? "Edit Traffic Channel" : "New Traffic Channel"}
                    {selectedChannel && (
                      <Chip 
                        label={selectedChannel} 
                        size="small" 
                        color="primary" 
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCloseSecondModal}
                    sx={{ px: 3, py: 1, borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    type="submit"
                    disabled={loading.save}
                    sx={{ px: 3, py: 1, borderRadius: 2 }}
                  >
                    {loading.save ? <CircularProgress size={24} /> : editMode ? 'Update' : 'Save'}
                  </Button>
                </Box>
              </Box>

              {/* Main form content */}
              <Box sx={{ p: 3 }}>
                {/* Basic settings */}
                <Card sx={{ p: 0, boxShadow: 2, borderRadius: 2, overflow: 'hidden' }}>
                  <Box sx={{ bgcolor: "#f8f9fa", p: 2, borderBottom: "1px solid #e0e0e0" }}>
                    <Typography variant="h6" sx={{ fontWeight: "bold" }}>Basic Settings</Typography>
                  </Box>
                  
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                      {/* Channel Name & Alias Channel in one row */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Channel Name"
                          name="channelName"
                          value={formData.channelName}
                          onChange={handleFormChange}
                          required
                          error={!!formErrors.channelName}
                          helperText={formErrors.channelName}
                          variant="outlined"
                          placeholder="e.g., Facebook Ads"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Alias Channel"
                          name="aliasChannel"
                          value={formData.aliasChannel}
                          onChange={handleFormChange}
                          required
                          error={!!formErrors.aliasChannel}
                          helperText={formErrors.aliasChannel}
                          variant="outlined"
                          placeholder="e.g., Facebook"
                        />
                      </Grid>

                      {/* Cost Update Depth with description */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                            Cost Update Depth
                          </Typography>
                        </Box>
                        <FormControl fullWidth error={!!formErrors.costUpdateDepth}>
                          <Select
                            name="costUpdateDepth"
                            value={formData.costUpdateDepth}
                            onChange={handleFormChange}
                            displayEmpty
                            required
                            variant="outlined"
                          >
                            <MenuItem value="">Select depth</MenuItem>
                            <MenuItem value="None">None</MenuItem>
                            <MenuItem value="Campaign Level">Campaign Level</MenuItem>
                            <MenuItem value="Adset Level">Adset Level</MenuItem>
                            <MenuItem value="Ad Level">Ad Level</MenuItem>
                          </Select>
                          {formErrors.costUpdateDepth && (
                            <Typography variant="caption" color="error">
                              {formErrors.costUpdateDepth}
                            </Typography>
                          )}
                        </FormControl>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Please select the cost update depth from the available options.
                          The default setting is the maximum depth available for your account plan.
                        </Typography>
                      </Grid>

                      {/* Cost Update Frequency */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                            Cost Update Frequency
                          </Typography>
                        </Box>
                        <FormControl fullWidth error={!!formErrors.costUpdateFrequency}>
                          <Select
                            name="costUpdateFrequency"
                            value={formData.costUpdateFrequency}
                            onChange={handleFormChange}
                            required
                            variant="outlined"
                          >
                            <MenuItem value="None">None</MenuItem>
                            <MenuItem value="60 Minutes">60 Minutes</MenuItem>
                            <MenuItem value="30 Minutes">30 Minutes</MenuItem>
                            <MenuItem value="15 Minutes">15 Minutes</MenuItem>
                            <MenuItem value="5 Minutes">5 Minutes</MenuItem>
                          </Select>
                          {formErrors.costUpdateFrequency && (
                            <Typography variant="caption" color="error">
                              {formErrors.costUpdateFrequency}
                            </Typography>
                          )}
                        </FormControl>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          These are the current settings for your account. If you would like to change the frequency of
                          cost updates - please contact support.
                        </Typography>
                      </Grid>

                      {/* Currency */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                            Currency
                          </Typography>
                        </Box>
                        <FormControl fullWidth error={!!formErrors.currency}>
                          <Select
                            name="currency"
                            value={formData.currency}
                            onChange={handleFormChange}
                            required
                            variant="outlined"
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
                          {formErrors.currency && (
                            <Typography variant="caption" color="error">
                              {formErrors.currency}
                            </Typography>
                          )}
                        </FormControl>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          If no currency is selected, the value selected in the profile will be used.
                        </Typography>
                      </Grid>

                      {/* S2S Postback URL */}
                      <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: "medium" }}>
                            S2S Postback URL
                          </Typography>
                        </Box>
                        <TextField
                          fullWidth
                          name="s2sPostbackUrl"
                          value={formData.s2sPostbackUrl}
                          onChange={handleFormChange}
                          placeholder="https://your-domain.com/postback?click_id={click_id}"
                          variant="outlined"
                        />
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          Use if you need to send conversions back to your traffic source.
                        </Typography>
                      </Grid>

                      {/* Click Ref ID & External ID in one row */}
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Click Ref ID"
                          name="clickRefId"
                          value={formData.clickRefId}
                          onChange={handleFormChange}
                          placeholder="Click Ref ID"
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="External ID"
                          name="externalId"
                          value={formData.externalId}
                          onChange={handleFormChange}
                          placeholder="External ID"
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Platform-specific settings */}
                {renderPlatformSettings()}
                
                {/* Connection reminders for new channels that need connection */}
                {!editMode && isPlatformConnectable(selectedChannel) && (
                  <Card sx={{ mt: 3, p: 3, boxShadow: 2, borderRadius: 2, bgcolor: "#f0f7ff" }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <InfoIcon color="primary" />
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                          Set up {selectedChannel} Connection
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          After creating this channel, you'll need to connect your {selectedChannel} account to enable cost updates and conversion tracking.
                          You'll be automatically taken to the connection page after saving.
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                )}
              </Box>
            </form>
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
    </Layout>
  );
};

export default TrafficChannels;