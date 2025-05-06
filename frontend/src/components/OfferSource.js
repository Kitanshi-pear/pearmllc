import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Modal,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Tooltip,
  Tab,
  Tabs,
  Paper,
  FormControl,
  FormControlLabel,
  Switch,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import Layout from "./Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import regular icons from free-solid-svg-icons
import {
  faCalendarAlt,
  faChevronLeft,
  faChevronRight,
  faExchangeAlt,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";

// Import brand icons from free-brands-svg-icons
import {
  faFacebookF,
  faGoogle,
} from "@fortawesome/free-brands-svg-icons";

// Import our custom date components
import DateRangePicker from "./DateRange";
import DateFormatter, { DATE_FORMAT } from "./DateFormat";

// Create date formatter instance
const dateFormatter = new DateFormatter();

// Enhanced Postback Macros - RedTrack style
const POSTBACK_MACROS = {
  CLICKID: '{click_id}',
  PAYOUT: '{payout}',
  STATUS: '{status}',
  SOURCE: '{source}',
  CAMPAIGN: '{campaign}',
  REVENUE: '{revenue}',
  OFFER_ID: '{offer_id}',
  CUSTOM1: '{custom1}',
  CUSTOM2: '{custom2}',
  CUSTOM3: '{custom3}'
};

// Generate RedTrack-style postback URL format
const generatePostbackTemplate = (baseUrl = window.location.origin, sourceType = '') => {
  const apiPostbackUrl = `${baseUrl}/api/postback?click_id=${POSTBACK_MACROS.CLICKID}&payout=${POSTBACK_MACROS.PAYOUT}&status=${POSTBACK_MACROS.STATUS}`;
  return apiPostbackUrl;
};

// Parse a postback URL template and replace macros with test values
const parsePostbackUrl = (template, data) => {
  if (!template) return '';
  
  let url = template;
  
  // Replace all macros with test values
  Object.entries(POSTBACK_MACROS).forEach(([key, macro]) => {
    const valueKey = key.toLowerCase();
    const value = data[valueKey] || '';
    url = url.replace(new RegExp(macro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), encodeURIComponent(value));
  });
  
  return url;
};

const OfferSourcePage = () => {
  // State for dates
  const [dateRange, setDateRange] = useState({
    startDate: dateFormatter.prepareDate(dateFormatter.getDateRange('today').startDate),
    endDate: dateFormatter.prepareDate(dateFormatter.getDateRange('today').endDate),
    label: 'Today',
    timeInterval: ''
  });
  
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [titleText, setTitle] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [postbackTestDialogOpen, setPostbackTestDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [conversionApiDialogOpen, setConversionApiDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Enhanced postback testing state
  const [testPostbackData, setTestPostbackData] = useState({
    click_id: 'test_' + Math.random().toString(36).substring(2, 10),
    payout: '10.00',
    status: 'approved',
    source: '',
    campaign: 'test_campaign',
    revenue: '12.50',
    offer_id: '123',
    custom1: 'test1',
    custom2: 'test2',
    custom3: 'test3'
  });
  const [processedUrl, setProcessedUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const currencies = ["USD", "EUR", "INR", "GBP", "CAD", "AUD", "JPY", "CNY"];
  const roles = [
    "Event ID",
    "First Name",
    "Last Name",
    "Phone",
    "Gender",
    "Email",
    "Zip Code",
    "Birthday",
    "Content IDs",
    "Contents",
    "Product Name",
    "Content Category",
    "Consent User data",
    "Consent Personalization",
    "None",
  ];
  
  const source_types = [
    "Facebook",
    "Google",
    "TikTok",
    "Taboola",
    "Outbrain",
    "Snapchat",
    "Pinterest",
    "Twitter",
    "LinkedIn",
    "Reddit",
    "Other"
  ];

  // Enhanced template with conversion API settings
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    alias: "",
    postbackUrl: "",
    sourceType: "",
    currency: "USD",
    offerUrl: "",
    clickid: "click_id", 
    sum: "payout",
    parameter: "",
    token: "",
    description: "",
    role: "",
    is_active: true,
    // Conversion API settings
    forward_to_facebook: false,
    forward_to_google: false,
    facebook_event_name: "Purchase",
    google_conversion_id: "",
    google_conversion_label: ""
  });

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    // Auto-fetch when date range changes
    fetchOfferSources(newRange);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchOfferSources = async (dateRangeToUse = null) => {
    setLoading(true);
    try {
      // Use provided date range or current state
      const dateParams = dateRangeToUse || dateRange;
      
      // Include date range in the API request
      const response = await axios.get(
        "https://pearmllc.onrender.com/offersource/list", {
          params: {
            date_from: dateParams.startDate,
            date_to: dateParams.endDate,
            time_interval: dateParams.timeInterval
          }
        }
      );
      const data = response.data;

      const formatted = data.map((item, index) => ({
        id: item.id,
        serial_no: index + 1,
        source_name: item.name,
        source_type: item.sourceType || "Other",
        timestamp: item.createdAt,
        postback: item.postback_url,
        currency: item.currency,
        offer_url: item.offer_url,
        clickid: item.clickid,
        sum: item.sum,
        parameter: item.parameter,
        token: item.token,
        description: item.description,
        role: item.role,
        is_active: item.is_active !== false,
        clicks: item.clicks || 0,
        lp_clicks: item.lp_clicks || 0,
        conversion: item.conversions || 0,
        total_cpa: item.total_cpa || 0,
        epc: item.epc || 0,
        total_revenue: item.total_revenue || 0,
        cost: item.cost || 0,
        profit: item.profit || 0,
        total_roi: item.total_roi || 0,
        lp_views: item.lp_views || 0,
        // Conversion API attributes
        forward_to_facebook: item.forward_to_facebook || false,
        forward_to_google: item.forward_to_google || false,
        facebook_event_name: item.facebook_event_name || "Purchase",
        google_conversion_id: item.google_conversion_id || "",
        google_conversion_label: item.google_conversion_label || ""
      }));

      setRows(formatted);
      setSnackbar({
        open: true,
        message: 'Sources loaded successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error("Failed to fetch offer sources:", err.message);
      setSnackbar({
        open: true,
        message: 'Failed to load sources: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchOfferSources();
  }, []);

  const handleEditClick = (row) => {
    setSelectedRowId(row.id);
    setEditMode(true);
    setNewTemplate({
      name: row.source_name,
      alias: row.source_name.toLowerCase().replace(/\s+/g, "-"),
      postbackUrl: row.postback || "",
      sourceType: row.source_type || "Other",
      currency: row.currency || "USD",
      offerUrl: row.offer_url || "",
      clickid: row.clickid || "click_id",
      sum: row.sum || "payout",
      parameter: row.parameter || "",
      token: row.token || "",
      description: row.description || "",
      role: row.role || "",
      is_active: row.is_active !== false,
      // Conversion API settings
      forward_to_facebook: row.forward_to_facebook || false,
      forward_to_google: row.forward_to_google || false,
      facebook_event_name: row.facebook_event_name || "Purchase",
      google_conversion_id: row.google_conversion_id || "",
      google_conversion_label: row.google_conversion_label || ""
    });
    setOpenTemplateModal(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedRowId(row.id);
    setDeleteConfirmOpen(true);
  };

  const handleOpenConversionSettings = (row) => {
    setSelectedRowId(row.id);
    setSelectedSource(row);
    setNewTemplate({
      ...newTemplate,
      forward_to_facebook: row.forward_to_facebook || false,
      forward_to_google: row.forward_to_google || false,
      facebook_event_name: row.facebook_event_name || "Purchase",
      google_conversion_id: row.google_conversion_id || "",
      google_conversion_label: row.google_conversion_label || ""
    });
    setConversionApiDialogOpen(true);
  };

  const handleSaveConversionSettings = async () => {
    try {
      const payload = {
        forward_to_facebook: newTemplate.forward_to_facebook,
        forward_to_google: newTemplate.forward_to_google,
        facebook_event_name: newTemplate.facebook_event_name,
        google_conversion_id: newTemplate.google_conversion_id,
        google_conversion_label: newTemplate.google_conversion_label
      };

      await axios.put(
        `https://pearmllc.onrender.com/offersource/${selectedRowId}/conversion-settings`,
        payload
      );
      
      setSnackbar({
        open: true,
        message: 'Conversion settings updated successfully',
        severity: 'success'
      });
      
      fetchOfferSources();
      setConversionApiDialogOpen(false);
    } catch (error) {
      console.error("Error saving conversion settings:", error.message);
      setSnackbar({
        open: true,
        message: 'Failed to save conversion settings: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(
        `https://pearmllc.onrender.com/offersource/delete/${selectedRowId}`
      );
      
      setSnackbar({
        open: true,
        message: 'Source deleted successfully',
        severity: 'success'
      });
      
      fetchOfferSources();
      setDeleteConfirmOpen(false);
      setSelectedRowId(null);
    } catch (error) {
      console.error("Error deleting source:", error.message);
      setSnackbar({
        open: true,
        message: 'Failed to delete source: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const payload = {
        name: newTemplate.name,
        alias: newTemplate.alias,
        sourceType: newTemplate.sourceType,
        postback_url: newTemplate.postbackUrl,
        currency: newTemplate.currency,
        offer_url: newTemplate.offerUrl,
        clickid: newTemplate.clickid,
        sum: newTemplate.sum,
        parameter: newTemplate.parameter,
        token: newTemplate.token,
        description: newTemplate.description,
        role: newTemplate.role,
        is_active: newTemplate.is_active,
        // Include conversion API settings
        forward_to_facebook: newTemplate.forward_to_facebook,
        forward_to_google: newTemplate.forward_to_google,
        facebook_event_name: newTemplate.facebook_event_name,
        google_conversion_id: newTemplate.google_conversion_id,
        google_conversion_label: newTemplate.google_conversion_label
      };

      if (editMode && selectedRowId) {
        await axios.put(
          `https://pearmllc.onrender.com/offersource/update/${selectedRowId}`,
          payload
        );
        setSnackbar({
          open: true,
          message: 'Source updated successfully',
          severity: 'success'
        });
      } else {
        await axios.post(
          "https://pearmllc.onrender.com/offersource/create",
          payload
        );
        setSnackbar({
          open: true,
          message: 'Source created successfully',
          severity: 'success'
        });
      }

      fetchOfferSources();
      setOpenTemplateModal(false);
      setEditMode(false);
      setSelectedRowId(null);
      setNewTemplate({
        name: "",
        alias: "",
        postbackUrl: "",
        sourceType: "",
        currency: "USD",
        offerUrl: "",
        clickid: "click_id",
        sum: "payout",
        parameter: "",
        token: "",
        description: "",
        role: "",
        is_active: true,
        forward_to_facebook: false,
        forward_to_google: false,
        facebook_event_name: "Purchase",
        google_conversion_id: "",
        google_conversion_label: ""
      });
    } catch (error) {
      console.error("Error saving template:", error.message);
      setSnackbar({
        open: true,
        message: 'Failed to save source: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const handleSourceTypeChange = (e) => {
    const sourceType = e.target.value;
    setNewTemplate({
      ...newTemplate,
      sourceType,
      postbackUrl: generatePostbackTemplate(window.location.origin, sourceType)
    });
  };

  const handleCopyPostback = () => {
    navigator.clipboard.writeText(newTemplate.postbackUrl);
    setSnackbar({
      open: true,
      message: 'Postback URL copied to clipboard',
      severity: 'success'
    });
  };

  const handleGeneratePostbackTemplate = () => {
    const template = generatePostbackTemplate(window.location.origin, newTemplate.sourceType);
    setNewTemplate({
      ...newTemplate,
      postbackUrl: template
    });
  };

  const handleInsertMacro = (macro) => {
    setNewTemplate({
      ...newTemplate,
      postbackUrl: newTemplate.postbackUrl + macro
    });
  };

  const handleOpenPostbackTest = (source) => {
    setSelectedSource(source);
    setTestPostbackData(prev => ({
      ...prev,
      source: source.source_name || '',
      click_id: 'test_' + Math.random().toString(36).substring(2, 10)
    }));
    setPostbackTestDialogOpen(true);
  };

  const handleClosePostbackTest = () => {
    setPostbackTestDialogOpen(false);
    setProcessedUrl('');
    setTestResult(null);
  };

  // Enhanced postback testing functions
  const handleTestDataChange = (e) => {
    const { name, value } = e.target;
    setTestPostbackData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateTestUrl = () => {
    if (!selectedSource) return '';
    
    const url = parsePostbackUrl(selectedSource.postback, testPostbackData);
    setProcessedUrl(url);
    return url;
  };

  const handleTestPostback = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const url = handleGenerateTestUrl();
      
      // Actually send the test postback request
      const response = await axios.get(url);
      
      setTestResult({
        success: true,
        message: 'Postback test completed successfully! Response: ' + JSON.stringify(response.data),
        data: response.data
      });
      
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Enhanced columns with conversion API settings
  const columns = [
    { field: "serial_no", headerName: "Serial No", width: 80, align: "center" },
    {
      field: "source_name",
      headerName: "Source Name",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Typography sx={{ flexGrow: 1 }}>{params.value}</Typography>
          <IconButton
            size="small"
            onClick={() => handleEditClick(params.row)}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => handleDeleteClick(params.row)}
            title="Delete"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
    { 
      field: "source_type", 
      headerName: "Type", 
      width: 100,
      renderCell: (params) => (
        <Tooltip title={`${params.value} source`}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            width: '100%'
          }}>
            <Typography>{params.value}</Typography>
          </Box>
        </Tooltip>
      )
    },
    {
      field: "is_active",
      headerName: "Status",
      width: 100,
      renderCell: (params) => (
        <Box
          sx={{
            backgroundColor: params.value ? "#e6f7e7" : "#ffebee",
            color: params.value ? "#2e7d32" : "#d32f2f",
            borderRadius: 1,
            px: 1,
            py: 0.5,
          }}
        >
          {params.value ? "Active" : "Inactive"}
        </Box>
      ),
    },
    { 
      field: "postback", 
      headerName: "Postback", 
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={params.value || "No postback URL"}>
            <Typography sx={{ 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap",
              flexGrow: 1 
            }}>
              {params.value || "—"}
            </Typography>
          </Tooltip>
          {params.value && (
            <>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(params.value);
                  setSnackbar({
                    open: true,
                    message: 'Postback URL copied to clipboard',
                    severity: 'success'
                  });
                }}
                title="Copy Postback"
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPostbackTest(params.row);
                }}
                title="Test Postback"
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
      )
    },
    {
      field: "integration",
      headerName: "Conversions",
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={params.row.forward_to_facebook ? "Facebook Integration Active" : "Facebook Integration Inactive"}>
            <Box 
              sx={{ 
                color: params.row.forward_to_facebook ? "#4267B2" : "#bdbdbd",
                mr: 1
              }}
            >
              <FontAwesomeIcon icon={faFacebookF} />
            </Box>
          </Tooltip>
          <Tooltip title={params.row.forward_to_google ? "Google Integration Active" : "Google Integration Inactive"}>
            <Box 
              sx={{ 
                color: params.row.forward_to_google ? "#DB4437" : "#bdbdbd",
                mr: 1
              }}
            >
              <FontAwesomeIcon icon={faGoogle} />
            </Box>
          </Tooltip>
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenConversionSettings(params.row);
            }}
            sx={{ fontSize: '0.7rem', py: 0.3 }}
          >
            Settings
          </Button>
        </Box>
      )
    },
    { field: "clicks", headerName: "Clicks", width: 80, type: "number" },
    { field: "conversion", headerName: "Conv", width: 80, type: "number" },
    { 
      field: "total_cpa", 
      headerName: "CPA ($)", 
      width: 100, 
      type: "number",
      valueFormatter: (params) => {
        if (params.value == null) {
          return '0.00';
        }
        return params.value.toFixed(2);
      }
    },
    { 
      field: "epc", 
      headerName: "EPC ($)", 
      width: 100, 
      type: "number",
      valueFormatter: (params) => {
        if (params.value == null) {
          return '0.00';
        }
        return params.value.toFixed(2);
      }
    },
    { 
      field: "total_revenue", 
      headerName: "Revenue ($)", 
      width: 120, 
      type: "number",
      valueFormatter: (params) => {
        if (params.value == null) {
          return '0.00';
        }
        return params.value.toFixed(2);
      }
    },
    { 
      field: "profit", 
      headerName: "Profit ($)", 
      width: 100, 
      type: "number",
      valueFormatter: (params) => {
        if (params.value == null) {
          return '0.00';
        }
        return params.value.toFixed(2);
      }
    },
    { 
      field: "total_roi", 
      headerName: "ROI (%)", 
      width: 100, 
      type: "number",
      valueFormatter: (params) => {
        if (params.value == null) {
          return '0.00';
        }
        return params.value.toFixed(2) + '%';
      }
    },
  ];

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Layout>
      <Box>
        {/* Title and Add New Source button in the same row */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Typography variant="h4">Offer Sources</Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchOfferSources}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setOpenTemplateModal(true);
                setEditMode(false);
                setSelectedRowId(null);
                setNewTemplate({
                  name: "",
                  alias: "",
                  postbackUrl: "",
                  sourceType: "",
                  currency: "USD",
                  offerUrl: "",
                  clickid: "click_id",
                  sum: "payout",
                  parameter: "",
                  token: "",
                  description: "",
                  role: "",
                  is_active: true,
                  forward_to_facebook: false,
                  forward_to_google: false,
                  facebook_event_name: "Purchase",
                  google_conversion_id: "",
                  google_conversion_label: ""
                });
              }}
            >
              Add New Source
            </Button>
          </Box>
        </Box>

        {/* Title field, DateRangePicker, and Apply button in the same row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 3,
            gap: 2,
            flexWrap: { xs: "wrap", md: "nowrap" }
          }}
        >
         
          
          {/* Date range picker - takes up most of the space */}
          <Box sx={{ flexGrow: 1 }}>
            <DateRangePicker onDateRangeChange={handleDateRangeChange} />
          </Box>
          
          {/* Apply button */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => fetchOfferSources()}
          >
            Apply
          </Button>
        </Box>

        {/* DataGrid for displaying offer sources */}
        <Box
          sx={{
            height: 700,
            width: "100%",
            bgcolor: "white",
            boxShadow: 2,
            p: 2,
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 15, 20, 50]}
              disableSelectionOnClick
              components={{
                NoRowsOverlay: () => (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                    <Typography variant="h6" color="text.secondary">No Sources Found</Typography>
                    <Typography variant="body2" color="text.secondary">Add your first traffic source to get started</Typography>
                  </Box>
                ),
              }}
            />
          )}
        </Box>

        {/* Source Modal with 3 tabs - Basic Details, Postback URL, Conversion API */}
        <Modal open={openTemplateModal} onClose={() => setOpenTemplateModal(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "900px",
              maxWidth: "95vw",
              maxHeight: "90vh",
              overflow: "auto",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              {editMode ? "Edit Offer Source" : "Add New Source"}
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Basic Details" />
                <Tab label="Postback URL" />
              </Tabs>
            </Box>

            {/* Tab 1: Basic Details */}
            {tabValue === 0 && (
              <>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Source Name *"
                          value={newTemplate.name}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewTemplate({
                              ...newTemplate,
                              name: value,
                              alias: value.toLowerCase().replace(/\s+/g, "-"),
                            });
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Alias"
                          value={newTemplate.alias}
                          disabled
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Source Type</InputLabel>
                          <Select
                            value={newTemplate.sourceType}
                            onChange={handleSourceTypeChange}
                            label="Source Type"
                          >
                            <MenuItem value="" disabled>Select Source Type</MenuItem>
                            {source_types.map((type) => (
                              <MenuItem key={type} value={type}>
                                {type}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <InputLabel>Currency</InputLabel>
                      <Select
                        value={newTemplate.currency}
                        onChange={(e) =>
                          setNewTemplate({ ...newTemplate, currency: e.target.value })
                        }
                        label="Currency"
                      >
                        <MenuItem value="" disabled>Select Currency</MenuItem>
                        {currencies.map((currency) => (
                          <MenuItem key={currency} value={currency}>
                            {currency}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Offer URL Template"
                      value={newTemplate.offerUrl}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, offerUrl: e.target.value })
                      }
                      sx={{ mt: 2 }}
                      helperText="Template for generating tracking links (optional)"
                    />
                    
                    <FormControl fullWidth sx={{ mt: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={6}>
                          <Typography variant="body2">Status</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Select
                            value={newTemplate.is_active}
                            onChange={(e) => setNewTemplate({ ...newTemplate, is_active: e.target.value })}
                            fullWidth
                          >
                            <MenuItem value={true}>Active</MenuItem>
                            <MenuItem value={false}>Inactive</MenuItem>
                          </Select>
                        </Grid>
                      </Grid>
                    </FormControl>
                  </CardContent>
                </Card>

                {/* Postback Parameters - Enhanced for RedTrack */}
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1">Postback Parameters</Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="CLICKID"
                          value={newTemplate.clickid}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, clickid: e.target.value })
                          }
                          helperText="Parameter name for tracking clicks (default: click_id)"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="PAYOUT"
                          value={newTemplate.sum}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, sum: e.target.value })
                          }
                          helperText="Parameter name for payout value (default: payout)"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>

                {/* Additional Parameters */}
                <Card>
                  <CardContent>
                  <Typography variant="subtitle1">Additional Parameters</Typography>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label="Parameter"
                          value={newTemplate.parameter}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, parameter: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label="Macro / Token"
                          value={newTemplate.token}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, token: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <TextField
                          fullWidth
                          label="Name / Description"
                          value={newTemplate.description}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, description: e.target.value })
                          }
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <FormControl fullWidth>
                          <InputLabel>Role</InputLabel>
                          <Select
                            value={newTemplate.role}
                            onChange={(e) =>
                              setNewTemplate({ ...newTemplate, role: e.target.value })
                            }
                            label="Role"
                          >
                            <MenuItem value="" disabled>Select Role</MenuItem>
                            {roles.map((role) => (
                              <MenuItem key={role} value={role}>
                                {role}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Tab 2: Postback URL Editor - Enhanced for RedTrack */}
            {tabValue === 1 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Postback URL Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create a postback URL template with tracking parameters. Traffic sources will use this URL to notify your system about conversions.
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TextField
                      fullWidth
                      label="Postback URL"
                      value={newTemplate.postbackUrl}
                      onChange={(e) => setNewTemplate({ ...newTemplate, postbackUrl: e.target.value })}
                      multiline
                      rows={3}
                      sx={{ mr: 1 }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <IconButton onClick={handleCopyPostback} title="Copy URL">
                        <ContentCopyIcon />
                      </IconButton>
                      <IconButton onClick={handleGeneratePostbackTemplate} title="Generate Template">
                        <HelpOutlineIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Available Parameters:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {Object.entries(POSTBACK_MACROS).map(([key, value]) => (
                      <Button 
                        key={key}
                        size="small"
                        variant="outlined"
                        onClick={() => handleInsertMacro(value)}
                        sx={{ textTransform: 'none' }}
                      >
                        {value}
                      </Button>
                    ))}
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Example preview:
                  </Typography>
                  
                  <TextField
                    fullWidth
                    disabled
                    value={parsePostbackUrl(newTemplate.postbackUrl, {
                      click_id: 'abc123',
                      payout: '10.00',
                      status: 'approved'
                    })}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    This URL will be used to receive conversion data from your traffic sources. The system will track
                    clicks using the {'{click_id}'} parameter, payout values using the {'{payout}'} parameter, and
                    conversion status with the {'{status}'} parameter.
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Tab 3: Conversion API Settings */}
            {tabValue === 2 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Conversion Tracking Integration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure conversion forwarding to external platforms to track your campaign performance.
                  </Typography>
                  
                  {/* Facebook Integration */}
                  <Paper sx={{ p: 2, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box 
                        sx={{ 
                          backgroundColor: '#4267B2', 
                          color: 'white',
                          p: 1,
                          borderRadius: 1,
                          mr: 2
                        }}
                      >
                        <FontAwesomeIcon icon={faFacebookF} />
                      </Box>
                      <Typography variant="h6">Facebook Conversions API</Typography>
                      <Box sx={{ ml: 'auto' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={newTemplate.forward_to_facebook}
                              onChange={(e) => setNewTemplate({ 
                                ...newTemplate, 
                                forward_to_facebook: e.target.checked 
                              })}
                            />
                          }
                          label={newTemplate.forward_to_facebook ? "Enabled" : "Disabled"}
                        />
                      </Box>
                    </Box>
                    
                    {newTemplate.forward_to_facebook && (
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <FormControl fullWidth>
                            <InputLabel>Event Name</InputLabel>
                            <Select
                              value={newTemplate.facebook_event_name}
                              onChange={(e) => setNewTemplate({ 
                                ...newTemplate, 
                                facebook_event_name: e.target.value 
                              })}
                              label="Event Name"
                            >
                              <MenuItem value="Purchase">Purchase</MenuItem>
                              <MenuItem value="Lead">Lead</MenuItem>
                              <MenuItem value="CompleteRegistration">Complete Registration</MenuItem>
                              <MenuItem value="Subscribe">Subscribe</MenuItem>
                              <MenuItem value="AddToCart">Add To Cart</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                      </Grid>
                    )}
                  </Paper>
                  
                  {/* Google Integration */}
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box 
                        sx={{ 
                          backgroundColor: '#DB4437', 
                          color: 'white',
                          p: 1,
                          borderRadius: 1,
                          mr: 2
                        }}
                      >
                        <FontAwesomeIcon icon={faGoogle} />
                      </Box>
                      <Typography variant="h6">Google Ads Conversion</Typography>
                      <Box sx={{ ml: 'auto' }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={newTemplate.forward_to_google}
                              onChange={(e) => setNewTemplate({ 
                                ...newTemplate, 
                                forward_to_google: e.target.checked 
                              })}
                            />
                          }
                          label={newTemplate.forward_to_google ? "Enabled" : "Disabled"}
                        />
                      </Box>
                    </Box>
                    
                    {newTemplate.forward_to_google && (
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Google Conversion ID"
                            value={newTemplate.google_conversion_id}
                            onChange={(e) => setNewTemplate({ 
                              ...newTemplate, 
                              google_conversion_id: e.target.value 
                            })}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Google Conversion Label"
                            value={newTemplate.google_conversion_label}
                            onChange={(e) => setNewTemplate({ 
                              ...newTemplate, 
                              google_conversion_label: e.target.value 
                            })}
                          />
                        </Grid>
                      </Grid>
                    )}
                  </Paper>
                </CardContent>
              </Card>
            )}

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setOpenTemplateModal(false)} sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveTemplate}>
                {editMode ? "Save Changes" : "Save Template"}
              </Button>
            </Box>
          </Box>
        </Modal>
        
        {/* Conversion API Settings Dialog */}
        <Modal
          open={conversionApiDialogOpen}
          onClose={() => setConversionApiDialogOpen(false)}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "700px",
              maxWidth: "95vw",
              maxHeight: "90vh",
              overflow: "auto",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Conversion API Settings
              {selectedSource && (
                <Typography variant="subtitle2" color="text.secondary">
                  {selectedSource.source_name} ({selectedSource.source_type})
                </Typography>
              )}
            </Typography>
            
            {/* Facebook Integration */}
            <Paper sx={{ p: 2, mb: 3, mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    backgroundColor: '#4267B2', 
                    color: 'white',
                    p: 1,
                    borderRadius: 1,
                    mr: 2
                  }}
                >
                  <FontAwesomeIcon icon={faFacebookF} />
                </Box>
                <Typography variant="h6">Facebook Conversions API</Typography>
                <Box sx={{ ml: 'auto' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newTemplate.forward_to_facebook}
                        onChange={(e) => setNewTemplate({ 
                          ...newTemplate, 
                          forward_to_facebook: e.target.checked 
                        })}
                      />
                    }
                    label={newTemplate.forward_to_facebook ? "Enabled" : "Disabled"}
                  />
                </Box>
              </Box>
              
              {newTemplate.forward_to_facebook && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Event Name</InputLabel>
                      <Select
                        value={newTemplate.facebook_event_name}
                        onChange={(e) => setNewTemplate({ 
                          ...newTemplate, 
                          facebook_event_name: e.target.value 
                        })}
                        label="Event Name"
                      >
                        <MenuItem value="Purchase">Purchase</MenuItem>
                        <MenuItem value="Lead">Lead</MenuItem>
                        <MenuItem value="CompleteRegistration">Complete Registration</MenuItem>
                        <MenuItem value="Subscribe">Subscribe</MenuItem>
                        <MenuItem value="AddToCart">Add To Cart</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              )}
            </Paper>
            
            {/* Google Integration */}
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    backgroundColor: '#DB4437', 
                    color: 'white',
                    p: 1,
                    borderRadius: 1,
                    mr: 2
                  }}
                >
                  <FontAwesomeIcon icon={faGoogle} />
                </Box>
                <Typography variant="h6">Google Ads Conversion</Typography>
                <Box sx={{ ml: 'auto' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={newTemplate.forward_to_google}
                        onChange={(e) => setNewTemplate({ 
                          ...newTemplate, 
                          forward_to_google: e.target.checked 
                        })}
                      />
                    }
                    label={newTemplate.forward_to_google ? "Enabled" : "Disabled"}
                  />
                </Box>
              </Box>
              
              {newTemplate.forward_to_google && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Google Conversion ID"
                      value={newTemplate.google_conversion_id}
                      onChange={(e) => setNewTemplate({ 
                        ...newTemplate, 
                        google_conversion_id: e.target.value 
                      })}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Google Conversion Label"
                      value={newTemplate.google_conversion_label}
                      onChange={(e) => setNewTemplate({ 
                        ...newTemplate, 
                        google_conversion_label: e.target.value 
                      })}
                    />
                  </Grid>
                </Grid>
              )}
            </Paper>

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button 
                onClick={() => setConversionApiDialogOpen(false)} 
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveConversionSettings}
              >
                Save Settings
              </Button>
            </Box>
          </Box>
        </Modal>
        
        {/* Enhanced Postback Testing Dialog */}
        <Modal 
          open={postbackTestDialogOpen} 
          onClose={handleClosePostbackTest}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "800px",
              maxWidth: "95vw",
              maxHeight: "90vh",
              overflow: "auto",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Test Postback URL
              {selectedSource && (
                <Typography variant="subtitle2" color="text.secondary">
                  {selectedSource.source_name} ({selectedSource.source_type})
                </Typography>
              )}
            </Typography>
            
            {selectedSource && (
              <>
                <Typography variant="subtitle2" gutterBottom>
                  Postback URL Template:
                </Typography>
                <TextField
                  fullWidth
                  value={selectedSource.postback || 'No postback URL configured'}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 3 }}
                />
                
                <Typography variant="subtitle2" gutterBottom>
                  Test Parameters:
                </Typography>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Click ID"
                      name="click_id"
                      value={testPostbackData.click_id}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Payout"
                      name="payout"
                      value={testPostbackData.payout}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        name="status"
                        value={testPostbackData.status}
                        onChange={handleTestDataChange}
                        label="Status"
                      >
                        <MenuItem value="approved">Approved</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="rejected">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Revenue"
                      name="revenue"
                      value={testPostbackData.revenue}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleGenerateTestUrl}
                    disabled={!selectedSource.postback}
                  >
                    Generate Test URL
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleTestPostback}
                    disabled={!selectedSource.postback || isTesting}
                  >
                    {isTesting ? 'Testing...' : 'Send Test Postback'}
                  </Button>
                </Box>
                
                {processedUrl && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Generated URL:
                    </Typography>
                    <TextField
                      fullWidth
                      value={processedUrl}
                      multiline
                      rows={2}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <IconButton
                            onClick={() => {
                              navigator.clipboard.writeText(processedUrl);
                              setSnackbar({
                                open: true,
                                message: 'URL copied to clipboard',
                                severity: 'success'
                              });
                            }}
                          >
                            <ContentCopyIcon />
                          </IconButton>
                        )
                      }}
                    />
                  </Box>
                )}
                
                {testResult && (
                  <Paper 
                    sx={{ 
                      p: 2, 
                      bgcolor: testResult.success ? '#e8f5e9' : '#ffebee',
                      borderRadius: 1
                    }}
                  >
                    <Typography>
                      {testResult.message}
                    </Typography>
                    
                    {testResult.success && testResult.data && (
                      <Box mt={2}>
                        <Typography variant="subtitle2">Response Data:</Typography>
                        <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </Box>
                    )}
                  </Paper>
                )}
              </>
            )}
            
            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 3 }}>
              <Button onClick={handleClosePostbackTest}>
                Close
              </Button>
            </Box>
          </Box>
        </Modal>
        
        {/* Delete Confirmation Dialog */}
        <Modal
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "400px",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Confirm Deletion
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Are you sure you want to delete this traffic source? This action cannot be undone.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button 
                onClick={() => setDeleteConfirmOpen(false)} 
                sx={{ mr: 2 }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="error" 
                onClick={handleConfirmDelete}
              >
                Delete
              </Button>
            </Box>
          </Box>
        </Modal>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
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

export default OfferSourcePage;