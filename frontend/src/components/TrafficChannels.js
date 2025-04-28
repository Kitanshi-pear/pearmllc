import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import InfoIcon from "@mui/icons-material/Info";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  Button,
  IconButton,
  InputLabel,
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
  CheckIcon
} from "@mui/material";
import Layout from "./Layout";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

const ChannelTable = () => {
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
    includeInConversions: "",
    parameter: "",
    macroToken: "",
    nameDescription: "",
    selectRole: ""
  });

  const navigate = useNavigate();

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
      costUpdateDepth: "Campaign Level",
      costUpdateFrequency: "15 Minutes",
      currency: "USD",
      conversionType: "Purchase",
      conversionCategory: "Default",
      includeInConversions: "Yes"
    },
    TikTok: {
      channelName: "TikTok Ads",
      aliasChannel: "TikTok",
      costUpdateDepth: "Ad Level",
      costUpdateFrequency: "30 Minutes",
      currency: "USD"
    },
    Custom: {
      channelName: "",
      aliasChannel: "",
      costUpdateDepth: "",
      costUpdateFrequency: "5 Minutes",
      currency: "USD"
    }
  };

  // Fetch channels data
  const fetchChannels = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, table: true }));
      const response = await axios.get(`${API_URL}/api/trafficChannels`);
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Map data to ensure each row has required properties and metrics
      const mappedData = data.map(item => ({
        ...item,
        id: item.id || item.serial_no || Math.random().toString(36).substring(2, 9),
        ...(item.Metrics && typeof item.Metrics === 'object' ? item.Metrics : {})
      }));
      
      setRows(mappedData);
    } catch (error) {
      console.error('Error fetching channels:', error);
      setSnackbar({
        open: true,
        message: "Failed to load traffic channels. Please try again.",
        severity: "error"
      });
    } finally {
      setLoading(prev => ({ ...prev, table: false }));
    }
  }, []);

  // Fetch auth status
  const fetchAuthStatus = useCallback(async () => {
    try {
      const fbResponse = await axios.get(`${API_URL}/api/auth/facebook/status`);
      const googleResponse = await axios.get(`${API_URL}/api/auth/google/status`);
      
      setAuthStatus({
        facebook: fbResponse.data?.connected || false,
        google: googleResponse.data?.connected || false
      });
    } catch (error) {
      console.error('Error fetching auth status:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchChannels();
    fetchAuthStatus();
    
    // Check for auth callbacks
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      const platform = urlParams.get("platform");
      if (platform) {
        setSnackbar({
          open: true,
          message: `${platform} account successfully connected!`,
          severity: "success"
        });
        
        // Set auth status
        setAuthStatus(prev => ({
          ...prev,
          [platform.toLowerCase()]: true
        }));
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [fetchChannels, fetchAuthStatus]);

  // Define columns for DataGrid
  const getColumns = useCallback(() => {
    // Get metrics columns from first row
    const metricFields = rows[0]?.Metrics && typeof rows[0].Metrics === 'object'
      ? Object.keys(rows[0].Metrics).map((key) => ({
          field: key,
          headerName: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          width: 120,
          valueFormatter: (params) => {
            // Format numbers
            if (typeof params.value === 'number') {
              return params.value.toLocaleString();
            }
            return params.value;
          }
        }))
      : [];

    // Static columns with added actions column
    const staticColumns = [
      { field: "id", headerName: "ID", width: 70 },
      { 
        field: "channelName", 
        headerName: "Channel Name", 
        width: 180,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getChannelIcon(params.row.aliasChannel)}
            <Typography sx={{ ml: 1 }}>{params.value}</Typography>
          </Box>
        )
      },
      { field: "aliasChannel", headerName: "Alias", width: 120 },
      { field: "costUpdateFrequency", headerName: "Update Frequency", width: 150 },
      { field: "currency", headerName: "Currency", width: 90 },
      { 
        field: "status", 
        headerName: "Status", 
        width: 120,
        renderCell: (params) => (
          <Chip 
            label={params.value || "Active"} 
            color={params.value === "Inactive" ? "error" : "success"}
            size="small"
          />
        )
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Box>
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleEditChannel(params.row);
              }}
              size="small"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteChannel(params.row.id);
              }}
              size="small"
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )
      }
    ];

    return [...staticColumns, ...metricFields];
  }, [rows]);

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

  // Filter rows based on search text
  const filteredRows = rows.filter((row) =>
    Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  // Handle authentication for platforms
  const handleAuth = async (platform) => {
    setLoading(prev => ({ ...prev, [platform]: true }));
    
    try {
      const authUrl = platform === "google" 
        ? `${API_URL}/api/auth/google` 
        : `${API_URL}/api/auth/facebook`;
      
      // For real implementation, you'd open the auth URL in a popup or redirect
      window.location.href = authUrl;
    } catch (err) {
      console.error(`${platform} OAuth Error:`, err);
      setSnackbar({
        open: true,
        message: `Failed to connect to ${platform}. Please try again.`,
        severity: "error"
      });
    } finally {
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

  // Validate form
  const validateForm = () => {
    const errors = {};
    const requiredFields = ['channelName', 'aliasChannel', 'costUpdateDepth', 'costUpdateFrequency', 'currency'];
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors[field] = 'This field is required';
      }
    });
    
    // Channel specific validation
    if (selectedChannel === 'Facebook') {
      if (!formData.pixelId) errors.pixelId = 'Pixel ID is required';
      if (!formData.apiAccessToken) errors.apiAccessToken = 'API Access Token is required';
    }
    
    if (selectedChannel === 'Google') {
      if (!formData.googleAdsAccountId) errors.googleAdsAccountId = 'Google Ads Account ID is required';
      if (!formData.conversionType) errors.conversionType = 'Conversion Type is required';
      if (!formData.conversionName) errors.conversionName = 'Conversion Name is required';
      if (!formData.conversionCategory) errors.conversionCategory = 'Category is required';
      if (!formData.includeInConversions) errors.includeInConversions = 'This field is required';
    }
    
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
        await axios.delete(`${API_URL}/api/trafficChannels/${channelId}`);
        
        // Update local state
        setRows(prevRows => prevRows.filter(row => row.id !== channelId));
        
        setSnackbar({
          open: true,
          message: "Channel deleted successfully",
          severity: "success"
        });
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
          `${API_URL}/api/trafficChannels/${selectedRow.id}`, 
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
        response = await axios.post(`${API_URL}/api/trafficChannels`, formData);
        
        // Update local state
        setRows(prevRows => [...prevRows, response.data]);
        
        setSnackbar({
          open: true,
          message: "Channel created successfully",
          severity: "success"
        });
      }
      
      // Reset form and close modal
      resetForm();
      setOpenSecondModal(false);
    } catch (error) {
      console.error("Error saving channel:", error);
      setSnackbar({
        open: true,
        message: `Failed to ${editMode ? 'update' : 'create'} channel: ${error.response?.data?.message || error.message}`,
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

  return (
    <Layout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          p: 3,
          bgcolor: "#f5f5f5",
          minHeight: "calc(100vh - 80px)",
          position: "relative",
        }}
      >
        {/* HEADER WITH PERSISTENT BUTTONS */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 10,
            bgcolor: "#f5f5f5",
            py: 1,
            px: 2,
            boxShadow: 1,
            borderRadius: 1
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
            Traffic Channels
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" color="primary" onClick={handleOpenModal}>
              New From Template
            </Button>
            <Button variant="contained" color="secondary" onClick={() => handleOpenSecondModal(null)}>
              New From Scratch
            </Button>
          </Stack>
        </Box>

        {/* FILTER FIELD */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Filter Channels"
              variant="outlined"
              size="small"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              sx={{ width: "300px" }}
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
            <Typography variant="body2" color="textSecondary">
              {filteredRows.length} {filteredRows.length === 1 ? 'channel' : 'channels'}
            </Typography>
          </Stack>
        </Card>

        {/* DataGrid */}
        <Card sx={{ height: 600, width: "100%", p: 0, overflow: 'hidden' }}>
          {loading.table ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredRows}
              columns={getColumns()}
              pageSize={10}
              rowsPerPageOptions={[10, 20, 50]}
              checkboxSelection
              disableSelectionOnClick
              onRowClick={(params) => handleEditChannel(params.row)}
              getRowId={(row) => row.id}
              sx={{
                '& .MuiDataGrid-columnHeaders': { backgroundColor: "#f0f0f0", fontWeight: "bold" },
                '& .MuiDataGrid-row:hover': { backgroundColor: "#f1f1f1", cursor: 'pointer' },
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
        </Card>

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
              width: "60%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflow: "auto"
            }}
          >
            <Typography variant="h6" align="center" sx={{ mb: 3 }}>
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
                    p: 2,
                    height: '100%',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 3
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenSecondModal("Facebook")}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                    alt="Facebook Ads"
                    style={{ width: "60px", height: "60px", marginBottom: '8px' }}
                  />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Facebook Ads
                  </Typography>
                  <Divider sx={{ width: '100%', my: 1 }} />
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                    API Integrations:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start", width: '100%' }}>
                    <Chip size="small" label="Cost update" color="primary" />
                    <Chip size="small" label="Campaign pause" color="primary" />
                    <Chip size="small" label="Conversion tracking" color="primary" />
                  </Box>
                  <Button variant="outlined" color="primary" sx={{ mt: 'auto', pt: 1 }}>
                    + Add
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
                    p: 2,
                    height: '100%',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 3
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenSecondModal("Google")}
                >
                  <img
                    src="https://developers.google.com/static/ads/images/ads_192px_clr.svg"
                    alt="Google Ads"
                    style={{ width: "60px", height: "60px", marginBottom: '8px' }}
                  />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Google Ads
                  </Typography>
                  <Divider sx={{ width: '100%', my: 1 }} />
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                    API Integrations:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start", width: '100%' }}>
                    <Chip size="small" label="Cost update" color="primary" />
                    <Chip size="small" label="Campaign pause" color="primary" />
                    <Chip size="small" label="Conversion tracking" color="primary" />
                  </Box>
                  <Button variant="outlined" color="primary" sx={{ mt: 'auto', pt: 1 }}>
                    + Add
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
                    p: 2,
                    height: '100%',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: 3
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => handleOpenSecondModal("TikTok")}
                >
                  <img
                    src="https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpoguhm/tiktok-icon2.png"
                    alt="TikTok Ads"
                    style={{ width: "60px", height: "60px", marginBottom: '8px' }}
                  />
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    TikTok Ads
                  </Typography>
                  <Divider sx={{ width: '100%', my: 1 }} />
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                    API Integrations:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, alignItems: "flex-start", width: '100%' }}>
                    <Chip size="small" label="Cost update" color="primary" />
                    <Chip size="small" label="Campaign pause" color="secondary" />
                    <Chip size="small" label="Conversion tracking" color="primary" />
                  </Box>
                  <Button variant="outlined" color="primary" sx={{ mt: 'auto', pt: 1 }}>
                    + Add
                  </Button>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button onClick={handleCloseModal} sx={{ mr: 1 }}>
                Cancel
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => handleOpenSecondModal(null)}
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
              width: "80%",
              maxWidth: "900px"
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
                  p: 2,
                  boxShadow: 2,
                  zIndex: 10,
                  backgroundColor: "white",
                  borderTopLeftRadius: 2,
                  borderTopRightRadius: 2,
                }}
              >
                <Typography variant="h6">
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
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button variant="outlined" onClick={handleCloseSecondModal}>
                    Cancel
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    type="submit"
                    disabled={loading.save}
                  >
                    {loading.save ? <CircularProgress size={24} /> : 'Save'}
                  </Button>
                </Box>
              </Box>

              {/* Main form content */}
              <Box sx={{ p: 2 }}>
                {/* Basic settings */}
                <Card sx={{ mt: 2, p: 2, boxShadow: 1, borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Basic Settings</Typography>
                    <Grid container spacing={2}>
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
                        />
                      </Grid>

                      {/* Cost Update Depth with description */}
                      <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                        <Typography sx={{ width: "30%" }}>Cost Update Depth:</Typography>
                        <FormControl fullWidth error={!!formErrors.costUpdateDepth}>
                          <Select
                            name="costUpdateDepth"
                            value={formData.costUpdateDepth}
                            onChange={handleFormChange}
                            displayEmpty
                            required
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
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: -1 }}>
                          Please select the cost update depth from the available options.
                          The default setting is the maximum depth available for your account plan.
                        </Typography>
                      </Grid>

                      {/* Cost Update Frequency */}
                      <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                        <Typography sx={{ width: "30%" }}>Cost Update Frequency:</Typography>
                        <FormControl fullWidth error={!!formErrors.costUpdateFrequency}>
                          <Select
                            name="costUpdateFrequency"
                            value={formData.costUpdateFrequency}
                            onChange={handleFormChange}
                            required
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
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: -1 }}>
                          These are the current settings for your account. If you would like to change the frequency of
                          cost updates - please contact support.
                        </Typography>
                      </Grid>

                      {/* Currency */}
                      <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                        <Typography sx={{ width: "30%" }}>Currency:</Typography>
                        <FormControl fullWidth error={!!formErrors.currency}>
                          <Select
                            name="currency"
                            value={formData.currency}
                            onChange={handleFormChange}
                            required
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
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="textSecondary" sx={{ mt: -1 }}>
                          If no currency is selected, the value selected in the profile will be used.
                        </Typography>
                      </Grid>

                      {/* S2S Postback URL */}
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="S2S Postback URL"
                          name="s2sPostbackUrl"
                          value={formData.s2sPostbackUrl}
                          onChange={handleFormChange}
                          placeholder="https://your-domain.com/postback?click_id={clickid}"
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
                          placeholder=""
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
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Additional Parameters Section */}
                <Card sx={{ mt: 2, p: 2, boxShadow: 1, borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Additional Parameters</Typography>
                    <Grid container spacing={2}>
                      {/* Parameter, Macro/Token, Name/Description, Select Role in One Row */}
                      <Grid item xs={12} sx={{ display: "flex", flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                        <TextField
                          fullWidth
                          label="Parameter"
                          name="parameter"
                          value={formData.parameter}
                          onChange={handleFormChange}
                          placeholder="campaign_id"
                        />
                        <TextField
                          fullWidth
                          label="Macro/Token"
                          name="macroToken"
                          value={formData.macroToken}
                          onChange={handleFormChange}
                          placeholder="{campaign_id}"
                        />
                        <TextField
                          fullWidth
                          label="Name / Description"
                          name="nameDescription"
                          value={formData.nameDescription}
                          onChange={handleFormChange}
                          placeholder="Campaign Identifier"
                        />
                        <FormControl fullWidth>
                          <InputLabel>Select Role</InputLabel>
                          <Select
                            name="selectRole"
                            value={formData.selectRole}
                            onChange={handleFormChange}
                            displayEmpty
                          >
                            <MenuItem value="">Select role</MenuItem>
                            <MenuItem value="Aid">Aid</MenuItem>
                            <MenuItem value="Campaign ID">Campaign ID</MenuItem>
                            <MenuItem value="Adset ID">Adset ID</MenuItem>
                            <MenuItem value="Ad ID">Ad ID</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 1 }}
                          disabled={!formData.parameter || !formData.macroToken}
                        >
                          + Add Parameter
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Conditional Rendering Based on selectedChannel */}
                {selectedChannel === "Facebook" && (
                  <Card sx={{ mt: 2, p: 2, boxShadow: 1, borderRadius: 2 }}>
                    <CardContent>
                      {/* Facebook API Integration Section */}
                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                              Facebook API Integration
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Button
                              variant={authStatus.facebook ? "contained" : "outlined"}
                              color={authStatus.facebook ? "success" : "primary"}
                              sx={{ textTransform: "none" }}
                              onClick={() => handleAuth("facebook")}
                              disabled={loading.facebook}
                              startIcon={authStatus.facebook && <CheckIcon />}
                            >
                              {loading.facebook ? <CircularProgress size={24} /> : authStatus.facebook ? "Connected" : "Connect Facebook"}
                            </Button>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              Please allow access to activate integrations:  
                              <br /> #1 Click on "Connect" and accept integration permissions  
                              <br /> #2 Once accepted, fill in all mandatory fields and save changes.  
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Facebook Pixel Data Section */}
                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Grid container spacing={2}>
                          {/* Section Title */}
                          <Grid item xs={12}>
                            <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                              Facebook default data source (pixel)
                              <Tooltip title="The Facebook pixel helps you track conversions from Facebook ads, optimize ads based on collected data, build targeted audiences for future ads, and remarket to people who have already taken some action on your website.">
                                <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer" }} />
                              </Tooltip>
                            </Typography>
                          </Grid>

                          {/* Pixel ID */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Pixel ID"
                              name="pixelId"
                              value={formData.pixelId}
                              onChange={handleFormChange}
                              required
                              error={!!formErrors.pixelId}
                              helperText={formErrors.pixelId}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Tooltip title="Enter your Facebook Pixel ID">
                                      <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#888" }} />
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>

                          {/* Conversions API Access Token */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Conversions API Access token"
                              name="apiAccessToken"
                              value={formData.apiAccessToken}
                              onChange={handleFormChange}
                              required
                              error={!!formErrors.apiAccessToken}
                              helperText={formErrors.apiAccessToken}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Tooltip title="Enter your Facebook API Access Token">
                                      <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#888" }} />
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>

                          {/* Default Event Name */}
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Default Event name"
                              name="defaultEventName"
                              value={formData.defaultEventName}
                              onChange={handleFormChange}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Tooltip title="Default event triggered in your pixel (e.g., Purchase, Lead)">
                                      <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#888" }} />
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>

                          {/* Custom Conversion Matching */}
                          <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                            <Switch
                              checked={formData.customConversionMatching}
                              onChange={(e) =>
                                setFormData((prevState) => ({
                                  ...prevState,
                                  customConversionMatching: e.target.checked,
                                }))
                              }
                              name="customConversionMatching"
                              inputProps={{ "aria-label": "toggle custom conversion matching" }}
                            />
                            <Typography variant="body2" sx={{ ml: 1, color: "#666" }}>
                              Custom Conversion Matching
                            </Typography>
                            <Tooltip title="Enable to use custom matching parameters for improved conversion tracking">
                              <HelpOutlineIcon fontSize="small" sx={{ ml: 1, cursor: "pointer", color: "#888" }} />
                            </Tooltip>
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {selectedChannel === "Google" && (
                  <Card sx={{ mt: 2, p: 2, boxShadow: 1, borderRadius: 2 }}>
                    <CardContent>
                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                              Google API Integration
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Button
                              variant={authStatus.google ? "contained" : "outlined"}
                              color={authStatus.google ? "success" : "primary"}
                              sx={{ textTransform: "none" }}
                              onClick={() => handleAuth("google")}
                              disabled={loading.google}
                              startIcon={authStatus.google && <CheckIcon />}
                            >
                              {loading.google ? <CircularProgress size={24} /> : authStatus.google ? "Connected" : "Connect Google"}
                            </Button>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              Please allow access to activate Google Ads integrations:  
                              <br /> #1 Click on "Connect" and accept integration permissions  
                              <br /> #2 Once accepted, fill in all mandatory fields and save changes.  
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Google Ads Account ID"
                              name="googleAdsAccountId"
                              value={formData.googleAdsAccountId}
                              onChange={handleFormChange}
                              required
                              error={!!formErrors.googleAdsAccountId}
                              helperText={formErrors.googleAdsAccountId}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <Tooltip title="Enter your Google Ads Account ID (e.g., 123-456-7890)">
                                      <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#888" }} />
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mt: 2 }}>Google MCC Account ID (optional)</Typography>
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
                                      <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#888" }} />
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                              Add MCC account ID to send conversions to it and not the ad account (optional).
                              Please make sure you have access to the ad account and MCC with the e-mail you used for integration.
                            </Typography>
                          </Grid>

                          {/* Conversion Matching Section */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Conversion Matching</Typography>
                            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, p: 2 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="body2" color="textSecondary">Conversion Type *</Typography>
                                  <FormControl 
                                    fullWidth 
                                    sx={{ mt: 1 }}
                                    error={!!formErrors.conversionType}
                                  >
                                    <Select
                                      name="conversionType"
                                      value={formData.conversionType || ""}
                                      onChange={handleFormChange}
                                      displayEmpty
                                      required
                                    >
                                      <MenuItem value="">Select type</MenuItem>
                                      <MenuItem value="Purchase">Purchase</MenuItem>
                                      <MenuItem value="Lead">Lead</MenuItem>
                                      <MenuItem value="SignUp">Sign Up</MenuItem>
                                      <MenuItem value="PageView">Page View</MenuItem>
                                      <MenuItem value="AddToCart">Add To Cart</MenuItem>
                                    </Select>
                                    {formErrors.conversionType && (
                                      <Typography variant="caption" color="error">
                                        {formErrors.conversionType}
                                      </Typography>
                                    )}
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="body2" color="textSecondary">Conversion Name *</Typography>
                                  <TextField
                                    fullWidth
                                    name="conversionName"
                                    placeholder="Enter name"
                                    value={formData.conversionName || ""}
                                    onChange={handleFormChange}
                                    sx={{ mt: 1 }}
                                    required
                                    error={!!formErrors.conversionName}
                                    helperText={formErrors.conversionName}
                                  />
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="body2" color="textSecondary">Category *</Typography>
                                  <FormControl 
                                    fullWidth 
                                    sx={{ mt: 1 }}
                                    error={!!formErrors.conversionCategory}
                                  >
                                    <Select
                                      name="conversionCategory"
                                      value={formData.conversionCategory || ""}
                                      onChange={handleFormChange}
                                      displayEmpty
                                      required
                                    >
                                      <MenuItem value="">Select category</MenuItem>
                                      <MenuItem value="Default">Default</MenuItem>
                                      <MenuItem value="Purchase">Purchase</MenuItem>
                                      <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                    {formErrors.conversionCategory && (
                                      <Typography variant="caption" color="error">
                                        {formErrors.conversionCategory}
                                      </Typography>
                                    )}
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                  <Typography variant="body2" color="textSecondary">Include in conversions *</Typography>
                                  <FormControl 
                                    fullWidth 
                                    sx={{ mt: 1 }}
                                    error={!!formErrors.includeInConversions}
                                  >
                                    <Select
                                      name="includeInConversions"
                                      value={formData.includeInConversions || ""}
                                      onChange={handleFormChange}
                                      displayEmpty
                                      required
                                    >
                                      <MenuItem value="">Select option</MenuItem>
                                      <MenuItem value="Yes">Yes</MenuItem>
                                      <MenuItem value="No">No</MenuItem>
                                    </Select>
                                    {formErrors.includeInConversions && (
                                      <Typography variant="caption" color="error">
                                        {formErrors.includeInConversions}
                                      </Typography>
                                    )}
                                  </FormControl>
                                </Grid>
                              </Grid>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {selectedChannel === "TikTok" && (
                  <Card sx={{ mt: 2, p: 2, boxShadow: 1, borderRadius: 2 }}>
                    <CardContent>
                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          p: 2,
                          mb: 2,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={6}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                              TikTok API Integration
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              sx={{ textTransform: "none" }}
                              onClick={() => {
                                setSnackbar({
                                  open: true,
                                  message: "TikTok integration coming soon!",
                                  severity: "info"
                                });
                              }}
                            >
                              Connect TikTok
                            </Button>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              TikTok integration is currently in development. You can still create a TikTok channel
                              for manual cost data entry.
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      <Box
                        sx={{
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          p: 2,
                          backgroundColor: "#fafafa",
                        }}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="TikTok Advertiser ID"
                              name="tiktokAdvertiserId"
                              value={formData.tiktokAdvertiserId || ""}
                              onChange={handleFormChange}
                              placeholder="Optional"
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="TikTok Pixel ID"
                              name="tiktokPixelId"
                              value={formData.tiktokPixelId || ""}
                              onChange={handleFormChange}
                              placeholder="Optional"
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
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
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Layout>
  );
};

export default ChannelTable;