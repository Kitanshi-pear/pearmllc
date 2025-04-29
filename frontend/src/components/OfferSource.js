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
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Layout from "./Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faChevronLeft,
  faChevronRight,
  faExchangeAlt,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";

// Postback Macros
const POSTBACK_MACROS = {
  CLICKID: '{click_id}',
  PAYOUT: '{payout}',
  REVENUE: '{revenue}',
  CONVERSION_ID: '{conversion_id}',
  OFFER_ID: '{offer_id}',
  OFFER_NAME: '{offer_name}',
  CAMPAIGN_ID: '{campaign_id}',
  CAMPAIGN_NAME: '{campaign_name}',
  SOURCE: '{source}',
  IP: '{ip}',
  COUNTRY: '{country}',
  DEVICE: '{device}',
  BROWSER: '{browser}',
  OS: '{os}',
  DATE: '{date}',
  TIME: '{time}',
  AFFILIATE_ID: '{affiliate_id}',
  STATUS: '{status}',
  EVENT_NAME: '{event_name}',
  GCLID: '{gclid}',
  SUB1: '{sub1}',
  SUB2: '{sub2}',
  SUB3: '{sub3}',
  SUB4: '{sub4}',
  SUB5: '{sub5}',
  CUSTOM1: '{custom1}',
  CUSTOM2: '{custom2}',
  CUSTOM3: '{custom3}',
};

// Generate postback URL format based on traffic source
const generatePostbackTemplate = (baseUrl = window.location.origin, sourceType = '') => {
  const apiPostbackUrl = `${baseUrl}/api/postback/conversion?click_id=${POSTBACK_MACROS.CLICKID}`;
  
  if (sourceType.toLowerCase() === 'facebook') {
    return `${apiPostbackUrl}&event_name=${POSTBACK_MACROS.EVENT_NAME}&payout=${POSTBACK_MACROS.PAYOUT}&revenue=${POSTBACK_MACROS.REVENUE}&offer_id=${POSTBACK_MACROS.OFFER_ID}&sub1=${POSTBACK_MACROS.SUB1}&sub2=${POSTBACK_MACROS.SUB2}`;
  } else if (sourceType.toLowerCase() === 'google') {
    return `${apiPostbackUrl}&event_name=${POSTBACK_MACROS.EVENT_NAME}&payout=${POSTBACK_MACROS.PAYOUT}&revenue=${POSTBACK_MACROS.REVENUE}&offer_id=${POSTBACK_MACROS.OFFER_ID}&sub1=${POSTBACK_MACROS.GCLID}`;
  } else {
    return `${apiPostbackUrl}&payout=${POSTBACK_MACROS.PAYOUT}&revenue=${POSTBACK_MACROS.REVENUE}&offer_id=${POSTBACK_MACROS.OFFER_ID}&status=1`;
  }
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
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [rows, setRows] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [date, setDate] = useState("");
  const [titleText, setTitle] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [postbackTestDialogOpen, setPostbackTestDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  
  // Postback testing state
  const [testPostbackData, setTestPostbackData] = useState({
    click_id: 'test_' + Math.random().toString(36).substring(2, 10),
    payout: '10.00',
    revenue: '10.00',
    conversion_id: 'conv_' + Date.now(),
    offer_id: '12345',
    offer_name: 'Test Offer',
    campaign_id: 'camp_1',
    campaign_name: 'Test Campaign',
    ip: '192.168.0.1',
    country: 'US',
    device: 'desktop',
    browser: 'Chrome',
    os: 'Windows',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toISOString().split('T')[1].split('.')[0],
    event_name: 'purchase',
    gclid: 'gclid_123456',
    sub1: 'custom_value_1',
    sub2: 'user@example.com', // email for Facebook
    sub3: '15555555555', // phone for Facebook
    sub4: 'order_'+Date.now(),
    sub5: 'additional_data',
    status: '1'
  });
  const [processedUrl, setProcessedUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const currencies = ["USD", "EUR", "INR", "GBP"];
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
    "Other"
  ];

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    alias: "",
    postbackUrl: "",
    sourceType: "",
    currency: "USD",
    offerUrl: "",
    clickid: "",
    sum: "",
    parameter: "",
    token: "",
    description: "",
    role: "",
    // API connection parameters
    pixel_id: "",    // Facebook pixel ID
    api_key: "",     // Facebook API token
    google_ads_id: "", // Google Ads account ID
    conversion_id: "", // Google conversion ID
    conversion_label: "", // Google conversion label
    default_event_name: "purchase" // Default event name
  });

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchOfferSources = async () => {
    try {
      const response = await axios.get(
        "https://pearmllc.onrender.com/offersource/list"
      );
      const data = response.data;

      const formatted = data.map((item, index) => ({
        id: item.id,
        serial_no: index + 1,
        source_name: item.name,
        source_type: item.sourceType || "Other",
        Timestamp: item.createdAt,
        postback: item.postback_url,
        pixel_id: item.pixel_id || "",
        api_key: item.api_key || "",
        google_ads_id: item.google_ads_id || "",
        conversion_id: item.conversion_id || "",
        conversion_label: item.conversion_label || "",
        default_event_name: item.default_event_name || "purchase",
        currency: item.currency,
        offer_url: item.offer_url,
        clickid: item.clickid,
        sum: item.sum,
        parameter: item.parameter,
        token: item.token,
        description: item.description,
        role: item.role,
        clicks: 0,
        lp_clicks: 0,
        conversion: 0,
        total_cpa: 0,
        epc: 0,
        total_revenue: 0,
        cost: 0,
        profit: 0,
        total_roi: 0,
        lp_views: 0,
      }));

      setRows(formatted);
    } catch (err) {
      console.error("Failed to fetch offer sources:", err.message);
    }
  };

  useEffect(() => {
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
      clickid: row.clickid || "",
      sum: row.sum || "",
      parameter: row.parameter || "",
      token: row.token || "",
      description: row.description || "",
      role: row.role || "",
      pixel_id: row.pixel_id || "",
      api_key: row.api_key || "",
      google_ads_id: row.google_ads_id || "",
      conversion_id: row.conversion_id || "",
      conversion_label: row.conversion_label || "",
      default_event_name: row.default_event_name || "purchase"
    });
    setOpenTemplateModal(true);
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
        // API connection parameters
        pixel_id: newTemplate.pixel_id,
        api_key: newTemplate.api_key,
        google_ads_id: newTemplate.google_ads_id,
        conversion_id: newTemplate.conversion_id,
        conversion_label: newTemplate.conversion_label,
        default_event_name: newTemplate.default_event_name
      };

      if (editMode && selectedRowId) {
        await axios.put(
          `https://pearmllc.onrender.com/offersource/update/${selectedRowId}`,
          payload
        );
        console.log("Updated successfully");
      } else {
        await axios.post(
          "https://pearmllc.onrender.com/offersource/create",
          payload
        );
        console.log("Created successfully");
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
        clickid: "",
        sum: "",
        parameter: "",
        token: "",
        description: "",
        role: "",
        pixel_id: "",
        api_key: "",
        google_ads_id: "",
        conversion_id: "",
        conversion_label: "",
        default_event_name: "purchase"
      });
    } catch (error) {
      console.error("Error saving template:", error.message);
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
    // You could add a snackbar notification here
    alert("Postback URL copied to clipboard!");
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
      source: source.source_name || ''
    }));
    setPostbackTestDialogOpen(true);
  };

  const handleClosePostbackTest = () => {
    setPostbackTestDialogOpen(false);
    setProcessedUrl('');
    setTestResult(null);
  };

  // Postback testing functions
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

  const columns = [
    { field: "serial_no", headerName: "Serial No", width: 100, align: "center" },
    {
      field: "source_name",
      headerName: "Source Name",
      width: 200,
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
        </Box>
      ),
    },
    { field: "source_type", headerName: "Type", width: 120 },
    {
      field: "Timestamp",
      headerName: "Timestamp",
      width: 200,
      valueGetter: (params) =>
        params?.value ? new Date(params?.value).toLocaleString() : "N/A",
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
          )}
        </Box>
      )
    },
    { field: "clicks", headerName: "Clicks", width: 100, type: "number" },
    { field: "lp_clicks", headerName: "LP Clicks", width: 120, type: "number" },
    { field: "conversion", headerName: "Conversions", width: 150, type: "number" },
    { field: "total_cpa", headerName: "Total CPA ($)", width: 150, type: "number" },
    { field: "epc", headerName: "EPC ($)", width: 120, type: "number" },
    {
      field: "total_revenue",
      headerName: "Total Revenue ($)",
      width: 180,
      type: "number",
    },
    { field: "cost", headerName: "Cost ($)", width: 150, type: "number" },
    { field: "profit", headerName: "Profit ($)", width: 150, type: "number" },
    { field: "total_roi", headerName: "Total ROI (%)", width: 150, type: "number" },
    { field: "lp_views", headerName: "LP Views", width: 150, type: "number" },
  ];

  // Date grid component from the image, converted to React + MUI + Tailwind style
  const DateGrid = () => {
    return (
      <Box className="max-w-full p-4 bg-white font-sans text-gray-800">
        <Box className="flex space-x-2 mb-6 flex-wrap">
          <Button
            variant="outlined"
            className="flex items-center w-48 justify-start"
            sx={{ borderColor: "#d1d5db", textTransform: "none" }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <Typography variant="caption" color="text.secondary" sx={{ userSelect: "none" }}>
                Date 2025-04-10 - 2025-04-10
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "400" }}>
                Today
              </Typography>
            </Box>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              style={{ marginLeft: "auto", color: "#374151", fontSize: "1.125rem" }}
            />
          </Button>
          <Button
            variant="outlined"
            sx={{ borderColor: "#d1d5db", minWidth: 40, px: 1 }}
            aria-label="Previous"
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ color: "#374151" }} />
          </Button>
          <Button
            variant="outlined"
            sx={{ borderColor: "#d1d5db", minWidth: 40, px: 1 }}
            aria-label="Next"
          >
            <FontAwesomeIcon icon={faChevronRight} style={{ color: "#374151" }} />
          </Button>
          <Button
            sx={{
              bgcolor: "#d1d5db",
              "&:hover": { bgcolor: "#9ca3af" },
              minWidth: 40,
              width: 40,
              height: 40,
              borderRadius: "9999px",
              ml: 2,
            }}
            aria-label="Swap Dates"
          >
            <FontAwesomeIcon icon={faExchangeAlt} style={{ color: "#374151" }} />
          </Button>
          <Box
            sx={{
              border: "1px solid #d1d5db",
              borderRadius: 1,
              px: 2,
              py: 1,
              width: 240,
              ml: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ userSelect: "none" }}>
              Time zone
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "600" }}>
              America/New_York
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Layout>
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
          <Typography variant="h4">Offer Source</Typography>
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
                clickid: "",
                sum: "",
                parameter: "",
                token: "",
                description: "",
                role: "",
                pixel_id: "",
                api_key: "",
                google_ads_id: "",
                conversion_id: "",
                conversion_label: "",
                default_event_name: "purchase"
              });
            }}
          >
            Add New Source
          </Button>
        </Box>

        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={6} sm={2}>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={handleDateChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField
              label="Title"
              value={titleText}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={4} sm={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => setFilterText("")}
            >
              Apply
            </Button>
          </Grid>
        </Grid>

        {/* DateGrid component */}
        <DateGrid />

        <Box
          sx={{
            height: 700,
            width: "100%",
            mt: 3,
            bgcolor: "white",
            boxShadow: 2,
            p: 2,
          }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 15]}
            disableSelectionOnClick
          />
        </Box>

        {/* Enhanced Modal Component with Tabs */}
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
                <Tab label="API Configuration" />
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
                        <Select
                          fullWidth
                          value={newTemplate.sourceType}
                          onChange={handleSourceTypeChange}
                          displayEmpty
                          label="Source Type"
                        >
                          <MenuItem value="" disabled>Select Source Type</MenuItem>
                          {source_types.map((type) => (
                            <MenuItem key={type} value={type}>
                              {type}
                            </MenuItem>
                          ))}
                        </Select>
                      </Grid>
                    </Grid>
                    
                    <Select
                      fullWidth
                      value={newTemplate.currency}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, currency: e.target.value })
                      }
                      sx={{ mt: 2 }}
                      displayEmpty
                      label="Currency"
                    >
                      <MenuItem value="" disabled>Select Currency</MenuItem>
                      {currencies.map((currency) => (
                        <MenuItem key={currency} value={currency}>
                          {currency}
                        </MenuItem>
                      ))}
                    </Select>
                    
                    <TextField
                      fullWidth
                      label="Offer URL Template"
                      value={newTemplate.offerUrl}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, offerUrl: e.target.value })
                      }
                      sx={{ mt: 2 }}
                    />
                  </CardContent>
                </Card>

                {/* Postback Parameters */}
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
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="SUM"
                          value={newTemplate.sum}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, sum: e.target.value })
                          }
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
                        <Select
                          fullWidth
                          value={newTemplate.role}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, role: e.target.value })
                          }
                          displayEmpty
                        >
                          <MenuItem value="" disabled>Select Role</MenuItem>
                          {roles.map((role) => (
                            <MenuItem key={role} value={role}>
                              {role}
                            </MenuItem>
                          ))}
                        </Select>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Tab 2: Postback URL Editor */}
            {tabValue === 1 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Postback URL Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create a postback URL template with dynamic parameters. Traffic sources will use this URL to notify your system about conversions.
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
                      revenue: '10.00',
                      conversion_id: '123456',
                      offer_id: '789',
                      campaign_id: 'camp_1',
                      status: '1'
                    })}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    This URL will be used to receive conversion data from your traffic sources. The system will also automatically forward this data to the respective advertising platform (like Facebook or Google) based on your API configuration.
                    
                    {newTemplate.sourceType && newTemplate.sourceType.toLowerCase() === 'facebook' && (
                      <Box mt={1}>
                        <strong>Facebook-specific:</strong> Use {'{sub1}'} for user_id, {'{sub2}'} for email, and {'{sub3}'} for phone.
                        These values will be automatically hashed for privacy as required by Facebook.
                      </Box>
                    )}
                    
                    {newTemplate.sourceType && newTemplate.sourceType.toLowerCase() === 'google' && (
                      <Box mt={1}>
                        <strong>Google-specific:</strong> Use {'{gclid}'} or {'{sub1}'} for Google Click ID for conversion tracking.
                        For enhanced conversions, you can also use {'{sub2}'} for email and {'{sub3}'} for phone number.
                      </Box>
                    )}
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {/* Tab 3: API Configuration */}
            {tabValue === 2 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    API Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Configure API settings to automatically send conversion data to traffic sources.
                  </Typography>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Conversion Settings
                  </Typography>
                  
                  <TextField
                    fullWidth
                    label="Default Event Name"
                    value={newTemplate.default_event_name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, default_event_name: e.target.value })}
                    sx={{ mb: 2 }}
                    helperText="Default event name for conversions (e.g., purchase, lead, complete_registration)"
                  />
                  
                  {/* Show Facebook-specific fields if the source type is Facebook */}
                  {newTemplate.sourceType && newTemplate.sourceType.toLowerCase() === 'facebook' && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                        Facebook API Configuration
                      </Typography>
                      
                      <TextField
                        fullWidth
                        label="Facebook Pixel ID"
                        value={newTemplate.pixel_id}
                        onChange={(e) => setNewTemplate({ ...newTemplate, pixel_id: e.target.value })}
                        sx={{ mb: 2 }}
                        helperText="Your Facebook Pixel ID (required for Facebook Conversions API)"
                      />
                      
                      <TextField
                        fullWidth
                        label="Facebook API Access Token"
                        value={newTemplate.api_key}
                        onChange={(e) => setNewTemplate({ ...newTemplate, api_key: e.target.value })}
                        type="password"
                        helperText="Your Facebook API Access Token (required for Facebook Conversions API)"
                      />
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        These credentials will be used to send conversion data to Facebook Conversions API. 
                        When a conversion occurs, the system will automatically hash personal data and send it to Facebook
                        following their data privacy requirements.
                      </Typography>
                    </>
                  )}
                  
                  {/* Show Google-specific fields if the source type is Google */}
                  {newTemplate.sourceType && newTemplate.sourceType.toLowerCase() === 'google' && (
                    <>
                      <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                        Google Ads Configuration
                      </Typography>
                      
                      <TextField
                        fullWidth
                        label="Google Ads Account ID"
                        value={newTemplate.google_ads_id}
                        onChange={(e) => setNewTemplate({ ...newTemplate, google_ads_id: e.target.value })}
                        sx={{ mb: 2 }}
                        helperText="Your Google Ads Account ID without dashes (required for Google Ads conversion tracking)"
                      />
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Conversion ID"
                            value={newTemplate.conversion_id}
                            onChange={(e) => setNewTemplate({ ...newTemplate, conversion_id: e.target.value })}
                            helperText="Google Ads Conversion ID"
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Conversion Label"
                            value={newTemplate.conversion_label}
                            onChange={(e) => setNewTemplate({ ...newTemplate, conversion_label: e.target.value })}
                            helperText="Google Ads Conversion Label"
                          />
                        </Grid>
                      </Grid>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        These credentials will be used to send conversion data to Google Ads. 
                        When a conversion occurs, the system will attempt to use the GCLID (Google Click ID) for tracking,
                        or use enhanced conversions with hashed email and phone if available.
                      </Typography>
                    </>
                  )}
                  
                  <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="primary">
                      How the Postback System Works
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      1. A user clicks on your ad and is redirected to your landing page with tracking parameters.
                    </Typography>
                    <Typography variant="body2">
                      2. When a conversion occurs, the postback URL is pinged with conversion data.
                    </Typography>
                    <Typography variant="body2">
                      3. Our system records the conversion and automatically forwards it to the respective traffic source (Facebook/Google).
                    </Typography>
                    <Typography variant="body2">
                      4. No additional code or pixels needed - everything is handled server-side!
                    </Typography>
                  </Box>
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
        
        {/* Postback Testing Dialog */}
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
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Click ID"
                      name="click_id"
                      value={testPostbackData.click_id}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Payout"
                      name="payout"
                      value={testPostbackData.payout}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Revenue"
                      name="revenue"
                      value={testPostbackData.revenue}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Conversion ID"
                      name="conversion_id"
                      value={testPostbackData.conversion_id}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Offer ID"
                      name="offer_id"
                      value={testPostbackData.offer_id}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      label="Event Name"
                      name="event_name"
                      value={testPostbackData.event_name}
                      onChange={handleTestDataChange}
                    />
                  </Grid>
                  
                  {/* Show Facebook-specific fields if the source is Facebook */}
                  {selectedSource.source_type && selectedSource.source_type.toLowerCase() === 'facebook' && (
                    <>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          label="User ID (sub1)"
                          name="sub1"
                          value={testPostbackData.sub1}
                          onChange={handleTestDataChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          label="Email (sub2)"
                          name="sub2"
                          value={testPostbackData.sub2}
                          onChange={handleTestDataChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          label="Phone (sub3)"
                          name="sub3"
                          value={testPostbackData.sub3}
                          onChange={handleTestDataChange}
                        />
                      </Grid>
                    </>
                  )}
                  
                  {/* Show Google-specific fields if the source is Google */}
                  {selectedSource.source_type && selectedSource.source_type.toLowerCase() === 'google' && (
                    <>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          label="GCLID"
                          name="gclid"
                          value={testPostbackData.gclid}
                          onChange={handleTestDataChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          label="Email (sub2)"
                          name="sub2"
                          value={testPostbackData.sub2}
                          onChange={handleTestDataChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                        <TextField
                          fullWidth
                          label="Phone (sub3)"
                          name="sub3"
                          value={testPostbackData.sub3}
                          onChange={handleTestDataChange}
                        />
                      </Grid>
                    </>
                  )}
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
                        <pre style={{ whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(testResult.data, null, 2)}
                        </pre>
                      </Box>
                    )}
                    
                    {testResult.success && selectedSource.source_type && (
                      <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                        <Typography variant="subtitle2">
                          {selectedSource.source_type} Conversion Details:
                        </Typography>
                        {selectedSource.source_type.toLowerCase() === 'facebook' && (
                          <Typography variant="body2">
                            This test conversion was sent to Facebook using your Pixel ID {selectedSource.pixel_id || '[Not configured]'}.
                            {!selectedSource.pixel_id && ' Please configure your Facebook Pixel ID in the source settings.'}
                            {!selectedSource.api_key && ' Please configure your Facebook API Key in the source settings.'}
                          </Typography>
                        )}
                        {selectedSource.source_type.toLowerCase() === 'google' && (
                          <Typography variant="body2">
                            This test conversion was sent to Google Ads using Account ID {selectedSource.google_ads_id || '[Not configured]'}.
                            {!selectedSource.google_ads_id && ' Please configure your Google Ads Account ID in the source settings.'}
                            {!selectedSource.conversion_id && ' Please configure your Google Conversion ID in the source settings.'}
                          </Typography>
                        )}
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
      </Box>
    </Layout>
  );
};

export default OfferSourcePage;