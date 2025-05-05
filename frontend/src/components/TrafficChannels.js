// src/components/TrafficChannels.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CancelIcon from "@mui/icons-material/Cancel";
import LockIcon from "@mui/icons-material/Lock";
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
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

// API URL with your specified endpoint
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
  // Added state to track individual channel connection status
  const [channelConnectionStatus, setChannelConnectionStatus] = useState({});
  
  // Enhanced form data with all potential platform-specific fields
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
    isConnected: false, // Add a specific field to track if this channel is connected
    status: "Active"
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Check for OAuth callback parameters in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const success = searchParams.get('success');
    const platform = searchParams.get('platform');
    const code = searchParams.get('code');
    
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
              // Update the channel connection status in our state
              setChannelConnectionStatus(prev => ({
                ...prev,
                [channelToEdit.id]: true
              }));
              
              setFormData({
                ...channelToEdit,
                ...state.formData,
                connectionComplete: true,
                isConnected: true // Mark as connected
              });
              setSelectedChannel(channelToEdit.aliasChannel);
              setEditMode(true);
              setSelectedRow(channelToEdit);
              setOpenSecondModal(true);
              // Set tab based on platform
              if (platform.toLowerCase() === 'facebook') {
                setCurrentTab(1); // Facebook tab
              } else if (platform.toLowerCase() === 'google') {
                setCurrentTab(2); // Google tab
              }
            }
          } else if (state.formData) {
            // For new channel creation
            setFormData({
              ...state.formData,
              connectionComplete: true,
              isConnected: true // Mark as connected
            });
            setSelectedChannel(state.selectedChannel);
            setOpenSecondModal(true);
            // Set tab based on platform
            if (platform.toLowerCase() === 'facebook') {
              setCurrentTab(1); // Facebook tab
            } else if (platform.toLowerCase() === 'google') {
              setCurrentTab(2); // Google tab
            }
          }
          
          // Update global auth status
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
      
      // API endpoint
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
        
        // Check individual channel connection statuses
        // This should be an API call that returns connection status for each channel by ID
        const connectionStatusResponse = await axios.get(`${API_URL}/api/traffic/connection/status`);
        
        // Update channel connection status map
        const newConnectionStatus = {};
        connectionStatusResponse.data.forEach(item => {
          newConnectionStatus[item.channelId] = item.isConnected;
        });
        
        setChannelConnectionStatus(newConnectionStatus);
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

  // Helper to determine if platform connection is available
  const isPlatformConnectable = (platformName) => {
    return ["Facebook", "Google", "TikTok"].includes(platformName);
  };

  // Handle authentication for platforms
  const handleAuth = async (platform) => {
    setLoading(prev => ({ ...prev, [platform.toLowerCase()]: true }));
    
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
      let authUrl = '';
      
      switch(platform.toLowerCase()) {
        case 'facebook':
          authUrl = `${API_URL}/api/traffic/auth/facebook`;
          break;
        case 'google':
          authUrl = `${API_URL}/api/traffic/auth/google`;
          break;
        case 'tiktok':
          authUrl = `${API_URL}/api/traffic/auth/tiktok`;
          break;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
      
      window.location.href = authUrl;
    } catch (err) {
      console.error(`${platform} OAuth Error:`, err);
      setSnackbar({
        open: true,
        message: `Failed to connect to ${platform}. Please try again.`,
        severity: "error"
      });
      setLoading(prev => ({ ...prev, [platform.toLowerCase()]: false }));
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
        isConnected: false // Always start as not connected for new channel
      });
      setSelectedChannel(channelType);
    } else {
      // Reset form for custom channel
      setFormData({
        ...channelTemplates.Custom,
        isConnected: false // Always start as not connected for new channel
      });
      setSelectedChannel(null);
    }
    
    setEditMode(false);
    setCurrentTab(0); // Reset to first tab
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
      isConnected: isChannelConnected // Set the connection status based on our tracked state
    });
    
    setSelectedChannel(channel.aliasChannel);
    setEditMode(true);
    setCurrentTab(0); // Start at first tab when editing
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

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateBasicSettings()) {
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
        
        // Get the updated channel with connection status
        const updatedChannel = response.data;
        
        // Update our connection status tracking
        setChannelConnectionStatus(prev => ({
          ...prev,
          [updatedChannel.id]: updatedChannel.isConnected || false
        }));
        
        // Update local state
        setRows(prevRows => 
          prevRows.map(row => 
            row.id === selectedRow.id ? { ...row, ...updatedChannel } : row
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
        
        // Get the newly created channel with its ID
        const newChannel = response.data;
        
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
        
        // Set selected row to newly created channel
        setSelectedRow(newChannel);
        setEditMode(true);
      }
      
      // Refresh the data to ensure we have the latest from the server
      fetchChannels();
      
      // Don't automatically close the modal - let users navigate to platform settings
      if (!isPlatformConnectable(formData.aliasChannel)) {
        setOpenSecondModal(false);
      }
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

  // Modal controls
  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  
  const handleCloseSecondModal = () => {
    setOpenSecondModal(false);
    setFormData({
      ...channelTemplates.Custom,
      isConnected: false // Reset connection status
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

  // Handle row click to navigate to detailed view
  const handleRowClick = (params) => {
    navigate(`/traffic/${params.id}/details`);
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
              <InfoIcon sx={{ color: '#6b7280', cursor: 'pointer' }} />
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
              {isConnected ? "Connected" : "Not connected"}
            </Typography>
            {isConnected ? (
              <CheckIcon color="success" fontSize="small" />
            ) : (
              <CancelIcon color="error" fontSize="small" />
            )}
          </Box>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" style={{ width: 24, height: 24 }} />}
          onClick={() => handleAuth('facebook')}
          disabled={loading.facebook}
          sx={{ mb: 2, bgcolor: '#1877F2', '&:hover': { bgcolor: '#166FE5' } }}
        >
          {loading.facebook ? <CircularProgress size={24} /> : isConnected ? "Reconnect Facebook" : "Connect Facebook"}
        </Button>
        
        <Box sx={{ mt: 2, color: '#6b7280', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon fontSize="small" />
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
                <Switch
                  checked={formData.customConversionMatching}
                  onChange={(e) => handleFormChange({
                    target: {
                      name: 'customConversionMatching',
                      type: 'checkbox',
                      checked: e.target.checked
                    }
                  })}
                  name="customConversionMatching"
                  color="primary"
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
              <InfoIcon sx={{ color: '#6b7280', cursor: 'pointer' }} />
            </Tooltip>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color={isConnected ? "success.main" : "error.main"}>
              {isConnected ? "Connected" : "Not connected"}
            </Typography>
            {isConnected ? (
              <CheckIcon color="success" fontSize="small" />
            ) : (
              <CancelIcon color="error" fontSize="small" />
            )}
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
              startIcon={<img src="https://developers.google.com/static/ads/images/ads_192px_clr.svg" alt="Google" style={{ width: 20, height: 20 }} />}
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
                  <InfoIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                </Tooltip>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <LockIcon fontSize="small" sx={{ mr: 1, color: '#9ca3af' }} />
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>ADD MORE</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Conversion name *</Typography>
                <Tooltip title="Conversion name information">
                  <InfoIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                </Tooltip>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Category *</Typography>
                <Tooltip title="Category information">
                  <InfoIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                </Tooltip>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Include in "conversions" *</Typography>
                <Tooltip title="Include in 'conversions' information">
                  <InfoIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
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
                  <InfoIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                </Tooltip>
              </Box>
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                <LockIcon fontSize="small" sx={{ mr: 1, color: '#9ca3af' }} />
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>ADD MORE</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Profile ID *</Typography>
                <Tooltip title="Profile ID information">
                  <InfoIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                </Tooltip>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="textSecondary">Floodlight activity ID *</Typography>
                <Tooltip title="Floodlight activity ID information">
                  <InfoIcon fontSize="small" sx={{ cursor: "pointer", color: "#6b7280" }} />
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        <Box sx={{ mt: 4, color: '#6b7280', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <InfoIcon fontSize="small" />
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
                    placeholder="https://your-domain.com/postback?click_id={click_id}"
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
    </Layout>
  );
};

export default TrafficChannels;