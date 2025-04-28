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
  CLICKID: '{clickid}',
  PAYOUT: '{payout}',
  REVENUE: '{revenue}',
  CONVERSION_ID: '{conversionid}',
  OFFER_ID: '{offerid}',
  CAMPAIGN_ID: '{campaignid}',
  IP: '{ip}',
  COUNTRY: '{country}',
  DEVICE: '{device}',
  BROWSER: '{browser}',
  OS: '{os}',
  DATE: '{date}',
  TIME: '{time}',
  AFFILIATE_ID: '{affiliateid}',
  STATUS: '{status}',
  CUSTOM1: '{custom1}',
  CUSTOM2: '{custom2}',
  CUSTOM3: '{custom3}',
};

// Generate sample postback URL
const generatePostbackTemplate = (baseUrl = 'https://yourdomain.com/postback') => {
  return `${baseUrl}?clickid=${POSTBACK_MACROS.CLICKID}&payout=${POSTBACK_MACROS.PAYOUT}&status=1`;
};

// Parse a postback URL template and replace macros with test values
const parsePostbackUrl = (template, data) => {
  if (!template) return '';
  
  let url = template;
  
  // Replace all macros with test values
  Object.entries(POSTBACK_MACROS).forEach(([key, macro]) => {
    const valueKey = key.toLowerCase();
    const value = data[valueKey] || '';
    url = url.replace(new RegExp(macro, 'g'), encodeURIComponent(value));
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
  
  // Postback testing state
  const [testPostbackData, setTestPostbackData] = useState({
    clickid: 'test_' + Math.random().toString(36).substring(2, 10),
    payout: '10.00',
    revenue: '10.00',
    conversionid: 'conv_' + Date.now(),
    offerid: '12345',
    campaignid: 'camp_1',
    ip: '192.168.0.1',
    country: 'US',
    device: 'desktop',
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

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    alias: "",
    postbackUrl: "",
    currency: "USD",
    offerUrl: "",
    clickid: "",
    sum: "",
    parameter: "",
    token: "",
    description: "",
    role: "",
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
        Timestamp: item.createdAt,
        postback: item.postback_url,
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
      currency: row.currency || "USD",
      offerUrl: row.offer_url || "",
      clickid: row.clickid || "",
      sum: row.sum || "",
      parameter: row.parameter || "",
      token: row.token || "",
      description: row.description || "",
      role: row.role || "",
    });
    setOpenTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const payload = {
        name: newTemplate.name,
        alias: newTemplate.alias,
        postback_url: newTemplate.postbackUrl,
        currency: newTemplate.currency,
        offer_url: newTemplate.offerUrl,
        clickid: newTemplate.clickid,
        sum: newTemplate.sum,
        parameter: newTemplate.parameter,
        token: newTemplate.token,
        description: newTemplate.description,
        role: newTemplate.role,
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
        currency: "USD",
        offerUrl: "",
        clickid: "",
        sum: "",
        parameter: "",
        token: "",
        description: "",
        role: "",
      });
    } catch (error) {
      console.error("Error saving template:", error.message);
    }
  };

  const handleCopyPostback = () => {
    navigator.clipboard.writeText(newTemplate.postbackUrl);
    // Could add a snackbar notification here
  };

  const handleGeneratePostbackTemplate = () => {
    const template = generatePostbackTemplate();
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

  // Postback testing functions
  const handleTestDataChange = (e) => {
    const { name, value } = e.target;
    setTestPostbackData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateTestUrl = () => {
    const url = parsePostbackUrl(newTemplate.postbackUrl, testPostbackData);
    setProcessedUrl(url);
    return url;
  };

  const handleTestPostback = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const url = handleGenerateTestUrl();
      
      // This is just a simulation since we can't actually make the request due to CORS
      // In a real app, you might use a proxy or server-side code to test the actual URL
      setTimeout(() => {
        setTestResult({
          success: true,
          message: 'Postback test completed! Note: This is a simulation. In production, the actual request would be sent.'
        });
        setIsTesting(false);
      }, 1500);
      
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.message}`
      });
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
        <Tooltip title={params.value || "No postback URL"}>
          <Typography sx={{ 
            overflow: "hidden", 
            textOverflow: "ellipsis", 
            whiteSpace: "nowrap" 
          }}>
            {params.value || "—"}
          </Typography>
        </Tooltip>
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
                currency: "USD",
                offerUrl: "",
                clickid: "",
                sum: "",
                parameter: "",
                token: "",
                description: "",
                role: "",
              });
            }}
          >
            Add New Template
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
              {editMode ? "Edit Offer Source" : "Add New Template"}
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={tabValue} onChange={handleTabChange}>
                <Tab label="Basic Details" />
                <Tab label="Postback URL" />
                <Tab label="Test Postback" />
              </Tabs>
            </Box>

            {/* Tab 1: Basic Details */}
            {tabValue === 0 && (
              <>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={12}>
                        <TextField
                          fullWidth
                          label="Name *"
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
                      <Grid item md={4} or lg={3}>
                        <TextField
                          fullWidth
                          label="Alias Offer Source"
                          value={newTemplate.alias}
                          disabled
                        />
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
                    Create a postback URL template with dynamic parameters. Traffic sources will use this URL to notify you about conversions.
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
                      clickid: 'abc123',
                      payout: '10.00',
                      revenue: '10.00',
                      conversionid: '123456',
                      offerid: '789',
                      campaignid: 'camp_1',
                      status: '1'
                    })}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    This URL will be used to receive conversion data from your traffic sources. Replace placeholders with macros from your traffic source.
                  </Typography>
                </CardContent>
              </Card>
            )}
            
            {/* Tab 3: Test Postback */}
            {tabValue === 2 && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Test Your Postback URL
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Test your postback URL with sample data to ensure it works correctly.
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Current postback URL template:
                    </Typography>
                    <TextField
                      fullWidth
                      disabled
                      value={newTemplate.postbackUrl || 'No postback URL configured'}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Test Parameters:
                  </Typography>
                  
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="Click ID"
                        name="clickid"
                        value={testPostbackData.clickid}
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
                        name="conversionid"
                        value={testPostbackData.conversionid}
                        onChange={handleTestDataChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="Offer ID"
                        name="offerid"
                        value={testPostbackData.offerid}
                        onChange={handleTestDataChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="Campaign ID"
                        name="campaignid"
                        value={testPostbackData.campaignid}
                        onChange={handleTestDataChange}
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={handleGenerateTestUrl}
                      disabled={!newTemplate.postbackUrl}
                    >
                      Generate Test URL
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleTestPostback}
                      disabled={!newTemplate.postbackUrl || isTesting}
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
                    </Paper>
                  )}
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
      </Box>
    </Layout>
  );
};

export default OfferSourcePage;