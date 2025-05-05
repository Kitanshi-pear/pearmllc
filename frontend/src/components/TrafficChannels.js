// src/components/TrafficChannels.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import DateRangeIcon from "@mui/icons-material/DateRange";
import CancelIcon from "@mui/icons-material/Cancel";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
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
  Paper,
  Link
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
  const [showAdditionalParams, setShowAdditionalParams] = useState(true);
  const [formData, setFormData] = useState({
    channelName: "",
    aliasChannel: "",
    costUpdateDepth: "",
    costUpdateFrequency: "5 minutes",
    currency: "USD",
    s2sPostbackUrl: "",
    clickRefId: "",
    externalId: "",
    pixelId: "",
    apiAccessToken: "",
    defaultEventName: "Purchase",
    customConversionMatching: false,
    payoutType: "",
    payoutValue: "",
    googleAdsAccountId: "",
    googleMccAccountId: "",
    conversionType: "",
    conversionName: "",
    conversionCategory: "",
    includeInConversions: "",
    // Additional parameters (up to 21 params)
    additionalParams: [
      { parameter: "sub1", macroToken: "{ad.id}", nameDescription: "ad_id", selectRole: "Aid" },
      { parameter: "sub2", macroToken: "{adset.id}", nameDescription: "adset_id", selectRole: "Gid" },
      { parameter: "sub3", macroToken: "{campaign.id}", nameDescription: "campaign_id", selectRole: "Gid" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "", macroToken: "", nameDescription: "", selectRole: "" },
      { parameter: "sub20", macroToken: "", nameDescription: "hint", selectRole: "" }
    ],
    // Google specific parameters
    googleParams: [
      { parameter: "utm_campaign", macroToken: "{replace}", nameDescription: "Campaign name", selectRole: "Rt campaign" },
      { parameter: "sub2", macroToken: "{keyword}", nameDescription: "Bidded keyword", selectRole: "Rt keyword" },
      { parameter: "sub3", macroToken: "{matchtype}", nameDescription: "Keyword match type", selectRole: "Rt match type" }
    ]
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
      channelName: "Facebook",
      aliasChannel: "facebook",
      costUpdateDepth: "Ad level",
      costUpdateFrequency: "5 minutes",
      currency: "USD",
      defaultEventName: "Purchase"
    },
    Google: {
      channelName: "Google Ads (No-redirect tracking)",
      aliasChannel: "google",
      costUpdateDepth: "Ad level",
      costUpdateFrequency: "5 minutes",
      currency: "USD",
      defaultEventName: "Purchase",
      clickRefId: "{gclid}"
    },
    TikTok: {
      channelName: "TikTok Ads",
      aliasChannel: "tiktok",
      costUpdateDepth: "Ad level",
      costUpdateFrequency: "5 minutes",
      currency: "USD",
      defaultEventName: "Purchase"
    },
    Custom: {
      channelName: "",
      aliasChannel: "",
      costUpdateDepth: "",
      costUpdateFrequency: "5 minutes",
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

  // Handle additional parameter change - FIXED WITH NULL CHECKS
  const handleParamChange = (index, field, value) => {
    const selectedParamsKey = selectedChannel?.toLowerCase() === 'google' ? 'googleParams' : 'additionalParams';
    
    setFormData(prev => {
      // Create a safety check to ensure the parameter array exists
      if (!prev[selectedParamsKey]) {
        // If the parameter array doesn't exist, initialize it with default values
        const defaultParams = selectedParamsKey === 'googleParams' 
          ? [
              { parameter: "utm_campaign", macroToken: "{replace}", nameDescription: "Campaign name", selectRole: "Rt campaign" },
              { parameter: "sub2", macroToken: "{keyword}", nameDescription: "Bidded keyword", selectRole: "Rt keyword" },
              { parameter: "sub3", macroToken: "{matchtype}", nameDescription: "Keyword match type", selectRole: "Rt match type" }
            ]
          : Array(20).fill({}).map((_, i) => {
              // Set defaults for the first three and sub20
              if (i === 0) return { parameter: "sub1", macroToken: "{ad.id}", nameDescription: "ad_id", selectRole: "Aid" };
              if (i === 1) return { parameter: "sub2", macroToken: "{adset.id}", nameDescription: "adset_id", selectRole: "Gid" };
              if (i === 2) return { parameter: "sub3", macroToken: "{campaign.id}", nameDescription: "campaign_id", selectRole: "Gid" };
              if (i === 19) return { parameter: "sub20", macroToken: "", nameDescription: "hint", selectRole: "" };
              return { parameter: "", macroToken: "", nameDescription: "", selectRole: "" };
            });
        
        // Create a new object with the parameter array initialized
        const newState = {
          ...prev,
          [selectedParamsKey]: defaultParams
        };
        
        // Update the specific field in the param
        newState[selectedParamsKey][index] = {
          ...newState[selectedParamsKey][index],
          [field]: value
        };
        
        return newState;
      }
      
      // Normal case - parameter array exists
      const updatedParams = [...prev[selectedParamsKey]];
      
      // Make sure the parameter object exists at this index
      if (!updatedParams[index]) {
        updatedParams[index] = { parameter: "", macroToken: "", nameDescription: "", selectRole: "" };
      }
      
      updatedParams[index] = {
        ...updatedParams[index],
        [field]: value
      };
      
      return {
        ...prev,
        [selectedParamsKey]: updatedParams
      };
    });
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
    
    // Platform-specific validations
    if (selectedChannel?.toLowerCase() === 'google' && editMode) {
      // Additional requirements for Google in edit mode
      if (!formData.googleAdsAccountId) errors.googleAdsAccountId = 'Google Ads Account ID is required';
    }
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle platform selection and template application
  const handlePlatformSelectionChange = (platformName) => {
    // Get the template for the selected platform
    const template = channelTemplates[platformName] || channelTemplates.Custom;
    
    // Reset the form and apply the new template
    const initialFormData = {
      ...channelTemplates.Custom, // Reset first to ensure all fields exist
      ...template,
      aliasChannel: template.aliasChannel.toLowerCase()
    };
    
    // Initialize platform-specific fields based on the platform
    switch(platformName) {
      case 'Facebook':
        initialFormData.additionalParams = [
          { parameter: "sub1", macroToken: "{ad.id}", nameDescription: "ad_id", selectRole: "Aid" },
          { parameter: "sub2", macroToken: "{adset.id}", nameDescription: "adset_id", selectRole: "Gid" },
          { parameter: "sub3", macroToken: "{campaign.id}", nameDescription: "campaign_id", selectRole: "Gid" },
          ...Array(16).fill({}).map(() => ({ parameter: "", macroToken: "", nameDescription: "", selectRole: "" })),
          { parameter: "sub20", macroToken: "", nameDescription: "hint", selectRole: "" }
        ];
        break;
        
      case 'Google':
        initialFormData.clickRefId = "{gclid}";
        initialFormData.googleParams = [
          { parameter: "utm_campaign", macroToken: "{replace}", nameDescription: "Campaign name", selectRole: "Rt campaign" },
          { parameter: "sub2", macroToken: "{keyword}", nameDescription: "Bidded keyword", selectRole: "Rt keyword" },
          { parameter: "sub3", macroToken: "{matchtype}", nameDescription: "Keyword match type", selectRole: "Rt match type" },
          { parameter: "sub20", macroToken: "", nameDescription: "hint", selectRole: "" }
        ];
        break;
        
      case 'TikTok':
        initialFormData.additionalParams = [
          { parameter: "sub1", macroToken: "{campaign_id}", nameDescription: "campaign_id", selectRole: "Gid" },
          { parameter: "sub2", macroToken: "{adgroup_id}", nameDescription: "adgroup_id", selectRole: "Gid" },
          { parameter: "sub3", macroToken: "{ad_id}", nameDescription: "ad_id", selectRole: "Aid" },
          ...Array(16).fill({}).map(() => ({ parameter: "", macroToken: "", nameDescription: "", selectRole: "" })),
          { parameter: "sub20", macroToken: "", nameDescription: "hint", selectRole: "" }
        ];
        break;
        
      default:
        // Custom platform - maintain current structure
        break;
    }
    
    // Update form data with the initialized platform data
    setFormData(initialFormData);
    setSelectedChannel(platformName);
  };

  // Handle template selection
  const handleOpenSecondModal = (channelType) => {
    if (channelType) {
      // Apply platform-specific template
      handlePlatformSelectionChange(channelType);
    } else {
      // Reset form for custom channel
      setFormData(channelTemplates.Custom);
      setSelectedChannel(null);
    }
    
    setEditMode(false);
    setOpenSecondModal(true);
    setOpenModal(false);
    
    // Show a success message if a template was selected
    if (channelType) {
      setSnackbar({
        open: true,
        message: `${channelType} template applied successfully`,
        severity: "success"
      });
    }
  };

  // Edit channel
  const handleEditChannel = (channel) => {
    setSelectedRow(channel);
    
    // Deep clone to avoid reference issues
    const initialFormData = {
      ...channelTemplates.Custom, // Reset first to ensure all fields exist
      ...channel, // Apply channel data
    };
    
    // Initialize parameter arrays if they don't exist in the channel data
    if (!initialFormData.additionalParams) {
      initialFormData.additionalParams = Array(20).fill({}).map((_, i) => {
        if (i === 0) return { parameter: "sub1", macroToken: "{ad.id}", nameDescription: "ad_id", selectRole: "Aid" };
        if (i === 1) return { parameter: "sub2", macroToken: "{adset.id}", nameDescription: "adset_id", selectRole: "Gid" };
        if (i === 2) return { parameter: "sub3", macroToken: "{campaign.id}", nameDescription: "campaign_id", selectRole: "Gid" };
        if (i === 19) return { parameter: "sub20", macroToken: "", nameDescription: "hint", selectRole: "" };
        return { parameter: "", macroToken: "", nameDescription: "", selectRole: "" };
      });
    }
    
    if (!initialFormData.googleParams && channel.aliasChannel?.toLowerCase() === 'google') {
      initialFormData.googleParams = [
        { parameter: "utm_campaign", macroToken: "{replace}", nameDescription: "Campaign name", selectRole: "Rt campaign" },
        { parameter: "sub2", macroToken: "{keyword}", nameDescription: "Bidded keyword", selectRole: "Rt keyword" },
        { parameter: "sub3", macroToken: "{matchtype}", nameDescription: "Keyword match type", selectRole: "Rt match type" }
      ];
    }
    
    setFormData(initialFormData);
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

  // Form submission - Modified to handle platform-specific validations
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
      
      // Create a copy of formData for submission
      const submissionData = { ...formData };
      
      // For Google, remove Facebook-specific fields and vice versa
      if (selectedChannel?.toLowerCase() === 'google') {
        delete submissionData.pixelId;
        delete submissionData.payoutType;
        delete submissionData.payoutValue;
        delete submissionData.customConversionMatching;
      } else if (selectedChannel?.toLowerCase() === 'facebook') {
        delete submissionData.googleAdsAccountId;
        delete submissionData.googleMccAccountId;
      }
      
      let response;
      if (editMode) {
        // Update existing channel
        response = await axios.put(
          `${API_URL}/api/traffic/${selectedRow.id}`, 
          submissionData
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
        response = await axios.post(`${API_URL}/api/traffic`, submissionData);
        
        // Update local state with the newly created channel
        setRows(prevRows => [...prevRows, response.data]);
        
        setSnackbar({
          open: true,
          message: "Channel created successfully",
          severity: "success"
        });
        
        // For platforms that need connection, immediately go to edit mode after save
        if (["Facebook", "Google"].includes(selectedChannel)) {
          setSelectedRow(response.data);
          setEditMode(true);
          // Don't close the modal in this case
        } else {
          // If it's not a platform that needs connection, reset and close
          resetForm();
          setOpenSecondModal(false);
        }
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

  // Main function to render platform-specific sections
  const renderPlatformSpecificSections = () => {
    // If no platform is selected, return additional parameters section only
    if (!selectedChannel) return renderAdditionalParameters();
    
    // Render different sections based on the selected platform
    switch(selectedChannel.toLowerCase()) {
      case 'facebook':
        return (
          <>
            {editMode && renderFacebookApiSection()}
            {renderFacebookPixelSection()}
            {renderAdditionalParameters()}
          </>
        );
      case 'google':
        return (
          <>
            {editMode && renderGoogleApiSection()}
            {renderAdditionalParameters()}
          </>
        );
      case 'tiktok':
        return (
          <>
            {renderTikTokSection()}
            {renderAdditionalParameters()}
          </>
        );
      default:
        // For custom or other channels, just show additional parameters
        return renderAdditionalParameters();
    }
  };

  // Render Facebook API integration section - Only shown in edit mode
  const renderFacebookApiSection = () => {
    return (
      <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Facebook API integration
            </Typography>
            <HelpOutlineIcon fontSize="small" sx={{ color: '#757575', cursor: 'pointer' }} />
          </Box>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            bgcolor: authStatus.facebook ? 'success.main' : 'error.main',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 10,
            fontSize: '0.75rem',
            fontWeight: 'medium'
          }}>
            {authStatus.facebook ? 'Connected' : 'Not connected'} 
            {!authStatus.facebook && <CancelIcon fontSize="small" sx={{ ml: 0.5 }} />}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Button
            variant="contained"
            color="primary"
            sx={{ 
              bgcolor: '#3b5998', 
              '&:hover': { bgcolor: '#344e86' },
              borderRadius: 1,
              textTransform: 'none',
              mb: 2
            }}
            startIcon={<Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>f</Box>}
            onClick={() => handleAuth("facebook")}
            disabled={loading.facebook || authStatus.facebook}
          >
            {loading.facebook ? <CircularProgress size={24} /> : 'Connect Facebook'}
          </Button>

          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
              Please allow RedTrack.io access to your Facebook profile to activate integrations:
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              #1 Click on "Connect" and accept integration permissions
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              #2 Once accepted, fill in all the mandatory fields and save the changes.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  // Render Facebook Pixel section
  const renderFacebookPixelSection = () => {
    return (
      <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Facebook default data source (pixel)
          </Typography>
          <HelpOutlineIcon fontSize="small" sx={{ ml: 1, color: '#757575', cursor: 'pointer' }} />
        </Box>

        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Pixel ID
            </Typography>
            <TextField
              fullWidth
              placeholder="Pixel ID"
              name="pixelId"
              value={formData.pixelId || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Conversions API Access token
            </Typography>
            <TextField
              fullWidth
              placeholder="Conversions API Access token"
              name="apiAccessToken"
              value={formData.apiAccessToken || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Default Event name
            </Typography>
            <TextField
              fullWidth
              placeholder="Default Event name"
              name="defaultEventName"
              value={formData.defaultEventName || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Payout type
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                name="payoutType"
                value={formData.payoutType || ""}
                onChange={handleFormChange}
                displayEmpty
                variant="outlined"
                sx={{ textAlign: 'left' }}
              >
                <MenuItem value="">Select type</MenuItem>
                <MenuItem value="Fixed">Fixed</MenuItem>
                <MenuItem value="Percentage">Percentage</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Value
            </Typography>
            <TextField
              fullWidth
              placeholder="Value"
              name="payoutValue"
              value={formData.payoutValue || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Switch
              checked={formData.customConversionMatching || false}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                customConversionMatching: e.target.checked
              }))}
              name="customConversionMatching"
              size="small"
            />
            <Typography variant="body2" color="textSecondary">
              Custom Conversion Matching
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  // Render Google API integration section - Only shown in edit mode
  const renderGoogleApiSection = () => {
    return (
      <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Google API integration
          </Typography>
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            bgcolor: authStatus.google ? 'success.main' : 'error.main',
            color: 'white',
            px: 1.5,
            py: 0.5,
            borderRadius: 10,
            fontSize: '0.75rem',
            fontWeight: 'medium'
          }}>
            {authStatus.google ? 'Connected' : 'Not connected'} 
            {!authStatus.google && <CancelIcon fontSize="small" sx={{ ml: 0.5 }} />}
          </Box>
        </Box>

        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Google Ads Account ID *
            </Typography>
            <TextField
              fullWidth
              placeholder="Google Ads Account ID"
              name="googleAdsAccountId"
              value={formData.googleAdsAccountId || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
              required
              error={!!formErrors.googleAdsAccountId}
              helperText={formErrors.googleAdsAccountId}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="body2" color="textSecondary">
              RedTrack will update costs via API and send conversions for the connected ad account
            </Typography>
            <Button
              variant="outlined"
              startIcon={<img src="https://developers.google.com/static/ads/images/ads_192px_clr.svg" alt="Google" style={{ width: 16, height: 16 }} />}
              sx={{ 
                textTransform: 'none',
                borderRadius: 1,
                ml: 2
              }}
              onClick={() => handleAuth("google")}
              disabled={loading.google || authStatus.google}
            >
              {loading.google ? <CircularProgress size={20} /> : 'Sign in with Google'}
            </Button>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Google MCC Account ID (optional)
            </Typography>
            <TextField
              fullWidth
              placeholder="Google MCC Account ID (optional)"
              name="googleMccAccountId"
              value={formData.googleMccAccountId || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
            />
          </Box>

          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Add MCC account id to send conversions to it and not ad account (optional).<br />
            Please make sure you have access to ad account and MCC with the e-mail you used for integration.
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
              Conversion Matching
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Conversion Type *
                  <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, color: '#757575', cursor: 'pointer' }} />
                </Typography>
                <Box component="div" sx={{ opacity: 0.4 }}>
                  <Button 
                    variant="outlined"
                    disabled
                    startIcon={<img src="https://cdn-icons-png.flaticon.com/512/2891/2891413.png" alt="Lock" style={{ width: 14, height: 14 }} />}
                    sx={{ width: '100%', textTransform: 'none', borderRadius: 1 }}
                  >
                    ADD MORE
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Conversion name *
                  <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, color: '#757575', cursor: 'pointer' }} />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Category *
                  <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, color: '#757575', cursor: 'pointer' }} />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Include in "conversions" *
                  <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, color: '#757575', cursor: 'pointer' }} />
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
              Campaign Manager 360
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Conversion Type *
                  <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, color: '#757575', cursor: 'pointer' }} />
                </Typography>
                <Box component="div" sx={{ opacity: 0.4 }}>
                  <Button 
                    variant="outlined"
                    disabled
                    startIcon={<img src="https://cdn-icons-png.flaticon.com/512/2891/2891413.png" alt="Lock" style={{ width: 14, height: 14 }} />}
                    sx={{ width: '100%', textTransform: 'none', borderRadius: 1 }}
                  >
                    ADD MORE
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Profile ID *
                  <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, color: '#757575', cursor: 'pointer' }} />
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                  Floodlight activity ID *
                  <HelpOutlineIcon fontSize="small" sx={{ ml: 0.5, color: '#757575', cursor: 'pointer' }} />
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon fontSize="small" sx={{ mr: 1, color: '#757575' }} />
              Please allow RedTrack.io access to your GoogleAds account to activate integrations:
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              #1 Click on "Connect" and accept integration permissions
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
              #2 Once accepted, fill in all the mandatory fields and save the changes.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  // Render TikTok section
  const renderTikTokSection = () => {
    return (
      <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="medium">
            TikTok Integration
          </Typography>
          <HelpOutlineIcon fontSize="small" sx={{ ml: 1, color: '#757575', cursor: 'pointer' }} />
        </Box>

        <Box sx={{ p: 3 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              TikTok Pixel ID
            </Typography>
            <TextField
              fullWidth
              placeholder="Pixel ID"
              name="pixelId"
              value={formData.pixelId || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              TikTok Events API Access Token
            </Typography>
            <TextField
              fullWidth
              placeholder="API Access Token"
              name="apiAccessToken"
              value={formData.apiAccessToken || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
              Default Event name
            </Typography>
            <TextField
              fullWidth
              placeholder="Default Event name"
              name="defaultEventName"
              value={formData.defaultEventName || ""}
              onChange={handleFormChange}
              variant="outlined"
              size="small"
            />
          </Box>
        </Box>
      </Box>
    );
  };

  // Render additional parameters section - FIXED WITH NULL CHECKS
  const renderAdditionalParameters = () => {
    // Safely determine which params array to use
    const selectedParamsKey = selectedChannel?.toLowerCase() === 'google' ? 'googleParams' : 'additionalParams';
    const params = formData[selectedParamsKey] || [];
    
    // Show only the first 5 parameters plus any that are filled in
    const displayParams = params.filter((param, index) => 
      index < 5 || 
      (param && (param.parameter || param.macroToken || param.nameDescription || param.selectRole))
    );
    
    return (
      <Box sx={{ mt: 3, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          cursor: 'pointer'
        }}
        onClick={() => setShowAdditionalParams(!showAdditionalParams)}
        >
          <Typography variant="subtitle1" fontWeight="medium">
            Additional parameters
          </Typography>
        </Box>

        {showAdditionalParams && (
          <Box sx={{ p: 3 }}>
            {displayParams.map((param, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    Parameter *
                  </Typography>
                  <TextField
                    fullWidth
                    value={param?.parameter || ""}
                    onChange={(e) => handleParamChange(index, 'parameter', e.target.value)}
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
                    value={param?.macroToken || ""}
                    onChange={(e) => handleParamChange(index, 'macroToken', e.target.value)}
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
                    value={param?.nameDescription || ""}
                    onChange={(e) => handleParamChange(index, 'nameDescription', e.target.value)}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                    Select role
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={param?.selectRole || ""}
                      onChange={(e) => handleParamChange(index, 'selectRole', e.target.value)}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="">Select role</MenuItem>
                      <MenuItem value="Aid">Aid</MenuItem>
                      <MenuItem value="Gid">Gid</MenuItem>
                      <MenuItem value="Rt campaign">Rt campaign</MenuItem>
                      <MenuItem value="Rt keyword">Rt keyword</MenuItem>
                      <MenuItem value="Rt match type">Rt match type</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            ))}
          </Box>
        )}
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
              borderRadius: 0,
              boxShadow: 1,
              maxHeight: "90vh",
              overflowY: "auto",
              width: "100%",
              maxWidth: "1200px"
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                borderBottom: "1px solid #e0e0e0",
                position: "sticky",
                top: 0,
                zIndex: 10,
                backgroundColor: "white",
              }}
            >
              <Typography variant="h6">
                {editMode ? `Edit ${formData.channelName}` : 'New Traffic Channel'}
              </Typography>
              <Box sx={{ display: "flex", gap: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading.save}
                  sx={{ 
                    bgcolor: '#4285F4',
                    '&:hover': { bgcolor: '#3367D6' },
                    borderRadius: 1,
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  {loading.save ? <CircularProgress size={20} color="inherit" /> : 'SAVE'}
                </Button>
                <Button
                  variant="text"
                  onClick={handleCloseSecondModal}
                  sx={{ 
                    color: '#666',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: 'transparent', color: '#333' }
                  }}
                >
                  CLOSE
                </Button>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Basic settings */}
              <Box sx={{ mb: 3, border: '1px solid #e0e0e0', borderRadius: 0 }}>
                <Grid container spacing={3} sx={{ p: 3 }}>
                  {/* Channel Name */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Channel name *
                    </Typography>
                    <TextField
                      fullWidth
                      name="channelName"
                      value={formData.channelName}
                      onChange={handleFormChange}
                      variant="outlined"
                      size="small"
                      error={!!formErrors.channelName}
                      helperText={formErrors.channelName}
                    />
                  </Grid>
                  
                  {/* Alias Channel */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Alias channel
                    </Typography>
                    <TextField
                      fullWidth
                      name="aliasChannel"
                      value={formData.aliasChannel}
                      onChange={handleFormChange}
                      variant="outlined"
                      size="small"
                      error={!!formErrors.aliasChannel}
                      helperText={formErrors.aliasChannel}
                    />
                  </Grid>

                  {/* Cost Update Depth */}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Cost update depth:
                    </Typography>
                    <FormControl fullWidth error={!!formErrors.costUpdateDepth} size="small">
                      <Select
                        name="costUpdateDepth"
                        value={formData.costUpdateDepth}
                        onChange={handleFormChange}
                        displayEmpty
                        required
                        variant="outlined"
                        sx={{ textAlign: 'left' }}
                      >
                        <MenuItem value="">Select depth</MenuItem>
                        <MenuItem value="None">None</MenuItem>
                        <MenuItem value="Campaign Level">Campaign Level</MenuItem>
                        <MenuItem value="Adset Level">Adset Level</MenuItem>
                        <MenuItem value="Ad level">Ad level</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      Please select the cost update depth from the available ones from the drop-down list. The default setting is the maximum depth available for your account plan.
                    </Typography>
                  </Grid>

                  {/* Cost Update Frequency */}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Cost update frequency:
                    </Typography>
                    <FormControl fullWidth error={!!formErrors.costUpdateFrequency} size="small">
                      <Select
                        name="costUpdateFrequency"
                        value={formData.costUpdateFrequency}
                        onChange={handleFormChange}
                        displayEmpty
                        required
                        variant="outlined"
                        sx={{ textAlign: 'left' }}
                      >
                        <MenuItem value="None">None</MenuItem>
                        <MenuItem value="60 minutes">60 minutes</MenuItem>
                        <MenuItem value="30 minutes">30 minutes</MenuItem>
                        <MenuItem value="15 minutes">15 minutes</MenuItem>
                        <MenuItem value="5 minutes">5 minutes</MenuItem>
                      </Select>
                    </FormControl>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      These are the current settings for your account. If you would like to change the frequency of cost updates - please contact <Link href="mailto:support@redtrack.io" color="primary">support@redtrack.io</Link>
                    </Typography>
                  </Grid>

                  {/* Currency */}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      Currency
                    </Typography>
                    <FormControl fullWidth error={!!formErrors.currency} size="small">
                      <Select
                        name="currency"
                        value={formData.currency}
                        onChange={handleFormChange}
                        displayEmpty
                        required
                        variant="outlined"
                        sx={{ textAlign: 'left' }}
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
                    </FormControl>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      If no currency is selected, the value selected in the profile will be used
                    </Typography>
                  </Grid>

                  {/* S2S Postback URL */}
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                      S2S Postback URL
                    </Typography>
                    <TextField
                      fullWidth
                      name="s2sPostbackUrl"
                      value={formData.s2sPostbackUrl}
                      onChange={handleFormChange}
                      placeholder="S2S Postback URL"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  {/* Click Ref ID & External ID in one row */}
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

              {/* Platform-specific sections - FIXED */}
              {renderPlatformSpecificSections()}

              {/* Bottom Save/Close buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 1.5 }}>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading.save}
                  sx={{ 
                    bgcolor: '#4285F4',
                    '&:hover': { bgcolor: '#3367D6' },
                    borderRadius: 1,
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  {loading.save ? <CircularProgress size={20} color="inherit" /> : 'SAVE'}
                </Button>
                <Button
                  variant="text"
                  onClick={handleCloseSecondModal}
                  sx={{ 
                    color: '#666',
                    fontWeight: 'bold',
                    '&:hover': { bgcolor: 'transparent', color: '#333' }
                  }}
                >
                  CLOSE
                </Button>
              </Box>
            </Box>
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