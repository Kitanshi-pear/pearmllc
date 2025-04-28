import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { 
  Button, 
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
  InputAdornment
} from "@mui/material";
import Layout from "./Layout";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const ChannelTable = () => {
  const [isFacebookConnected, setIsFacebookConnected] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [rows, setRows] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState("");
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [openSecondModal, setOpenSecondModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
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
    defaultEventName: "", 
    customConversionMatching: false, 
    googleAdsAccountId: "", 
    googleMccAccountId: "",
    parameter: "",
    macroToken: "",
    nameDescription: "",
    selectRole: "",
    conversionType: "",
    conversionName: "",
    conversionCategory: "",
    includeInConversions: ""
  });
  const [error, setError] = useState("");

  // Fetching data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/traffic-channels`);
        setData(response.data);
        setRows(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Check for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      alert("Google account successfully connected!");
      setIsGoogleConnected(true);
      // Clean up the URL after processing
      navigate("/traffic-channel", { replace: true });
    }
  }, [navigate]);

  // Fixed the error by ensuring Metrics is a valid object before using Object.keys
  const metricFields = data.length > 0 && data[0]?.Metrics && typeof data[0].Metrics === 'object'
    ? Object.keys(data[0].Metrics).map((key) => ({
        field: key,
        headerName: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        width: 120,
      }))
    : [];

  const staticColumns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "channelName", headerName: "Channel Name", width: 150 },
    { field: "aliasChannel", headerName: "Alias Channel", width: 150 },
    { field: "costUpdateFrequency", headerName: "Cost Update Frequency", width: 180 },
    { field: "currency", headerName: "Currency", width: 100 },
    { field: "pixelId", headerName: "Pixel ID", width: 150 },
  ];

  const columns = [...staticColumns, ...metricFields];

  // Map metrics into row objects for DataGrid, ensuring each row has a unique id
  const mappedRows = data.map(item => {
    const rowData = {
      ...item,
      id: item.id || item.serial_no || Math.random().toString()
    };
    
    // Only spread Metrics if it exists and is an object
    if (item.Metrics && typeof item.Metrics === 'object') {
      Object.assign(rowData, item.Metrics);
    }
    
    return rowData;
  });

  const filteredRows = mappedRows.filter((row) =>
    Object.values(row).some((value) =>
      value?.toString().toLowerCase().includes(filterText.toLowerCase())
    )
  );

  const handleAuth = (platform) => {
    setLoading(true);
    setError("");

    try {
      const authUrl = platform === "google" 
        ? `${API_URL}/auth/google`
        : `${API_URL}/api/traffic/facebook/auth`;
      console.log(`Redirecting to: ${authUrl}`);
      window.location.href = authUrl;
    } catch (err) {
      console.error(`${platform} OAuth Error:`, err);
      setError(`Error: Unable to connect to ${platform} API`);
      setLoading(false);
    }
  };

  const fetchFacebookData = async (code) => {
    try {
      const response = await axios.get(`${API_URL}/auth/callback?code=${code}`);
      setFormData((prev) => ({
        ...prev,
        pixelId: response.data.pixelId,
        apiAccessToken: response.data.access_token,
      }));
      alert("Facebook Connected successfully!");
      setIsFacebookConnected(true);
    } catch (error) {
      console.error("Error fetching Facebook Pixel ID:", error);
      alert("Error connecting to Facebook: " + error.message);
    }
  };

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  const handleOpenSecondModal = (channelName) => {
    setSelectedChannel(channelName);
    setOpenSecondModal(true);
  };

  const handleCloseSecondModal = () => {
    setOpenSecondModal(false);
  };

  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prevState) => ({ ...prevState, [name]: newValue }));
  };

  const handleRowClick = (params) => {
    setSelectedChannel(params.row.channelName || null);
    setOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // Send data to backend
      const response = await axios.post(`${API_URL}/api/traffic-channels`, formData);
  
      // Update local state
      setRows((prevRows) => [...prevRows, response.data]);
  
      // Close modal and reset form
      setOpenSecondModal(false);
      setFormData({
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
        defaultEventName: "",
        customConversionMatching: false,
        googleAdsAccountId: "",
        googleMccAccountId: "",
        parameter: "",
        macroToken: "",
        nameDescription: "",
        selectRole: "",
        conversionType: "",
        conversionName: "",
        conversionCategory: "",
        includeInConversions: ""
      });
      
      // Alert success
      alert("Channel saved successfully!");
    } catch (error) {
      console.error("Error saving channel:", error);
      alert("Failed to save channel. Check the console for details.");
    }
  };

  return (
    <Layout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
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
          }}
        >
          <Typography variant="h5" fontWeight="bold" sx={{ lineHeight: 1.2, marginRight: 1 }}>
            Traffic Channels
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" color="primary" onClick={handleOpenModal}>
              New From Template
            </Button>
            <Button variant="contained" color="secondary">
              New From Scratch
            </Button>
          </Stack>
        </Box>

        {/* FILTER FIELD */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="Filter"
            variant="outlined"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            sx={{ width: "300px" }}
          />
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => console.log("Filter applied")}
          >
            Apply
          </Button>
        </Stack>

        {/* DataGrid */}
        <Box sx={{ height: 600, width: "100%" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredRows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 20, 50]}
              checkboxSelection
              disableSelectionOnClick
              onRowClick={handleRowClick}
              getRowId={(row) => row.id}
              sx={{
                "& .MuiDataGrid-columnHeader": { backgroundColor: "#f0f0f0", fontWeight: "bold" },
                "& .MuiDataGrid-row:hover": { backgroundColor: "#f1f1f1" },
              }}
            />
          )}
        </Box>

        {/* Modal for New From Template */}
        <Modal open={openModal} onClose={handleCloseModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: 3,
              p: 4,
              width: "60%",
            }}
          >
            <Typography variant="h6" align="center" sx={{ mb: 3 }}>
              Choose Your Ad Template
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {/* Facebook Ads Box */}
              <Grid item xs={5}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                  }}
                >
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg"
                    alt="Facebook Ads"
                    style={{ width: "80px", height: "80px" }}
                  />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Facebook Ads
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    API Integrations:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2, alignItems: "flex-start" }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Cost update
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Campaign pause
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Pause creative
                    </Typography>
                  </Box>
                  <Button variant="outlined" color="primary" sx={{ mt: 1 }} onClick={() => handleOpenSecondModal("Facebook")}>
                    + Add
                  </Button>
                </Box>
              </Grid>

              {/* Google Ads Box */}
              <Grid item xs={5}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    border: "1px solid #ddd",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                  }}
                >
                  <img
                    src="https://developers.google.com/static/ads/images/ads_192px_clr.svg"
                    alt="Google Ads"
                    style={{ width: "80px", height: "80px" }}
                  />
                  <Typography variant="h6" sx={{ mt: 2 }}>
                    Google Ads
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    API Integrations:
                  </Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2, alignItems: "flex-start" }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Cost update
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Campaign pause
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                      Pause creative
                    </Typography>
                  </Box>
                  <Button variant="outlined" color="primary" sx={{ mt: 1 }} onClick={() => handleOpenSecondModal("Google")}>
                    + Add
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Modal>

        {/* Second Modal for Facebook/Google Ads */}
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
              width: "80%",
              overflowY: "auto",
            }}
          >
            <Box
              sx={{
                position: "sticky",
                top: 0,
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2,
                boxShadow: 2,
                zIndex: 10,
                backgroundColor: "white",
              }}
            >
              <Typography variant="h6">New Traffic Channel</Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button variant="outlined" onClick={handleCloseSecondModal}>
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="primary" 
                  form="channelForm"
                  type="submit"
                >
                  Save
                </Button>
              </Box>
            </Box>

            <form id="channelForm" onSubmit={handleSubmit}>
              <Card sx={{ mt: 2, p: 2, boxShadow: 3, borderRadius: 2, mx: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Channel Name & Alias Channel in one row */}
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Channel Name"
                        name="channelName"
                        value={formData.channelName}
                        onChange={handleFormChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Alias Channel"
                        name="aliasChannel"
                        value={formData.aliasChannel || selectedChannel || ""}
                        onChange={handleFormChange}
                        required
                      />
                    </Grid>

                    {/* Cost Update Depth with description */}
                    <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                      <Typography sx={{ width: "50%" }}>Cost Update Depth:</Typography>
                      <FormControl fullWidth>
                        <Select
                          name="costUpdateDepth"
                          value={formData.costUpdateDepth}
                          onChange={handleFormChange}
                          displayEmpty
                          required
                        >
                          <MenuItem value="">Select Cost Update Depth</MenuItem>
                          <MenuItem value="None">None</MenuItem>
                          <MenuItem value="Campaign Level">Campaign Level</MenuItem>
                          <MenuItem value="Adset Level">Adset Level</MenuItem>
                          <MenuItem value="Ad Level">Ad Level</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: -1 }}>
                        Please select the cost update depth from the available ones from the drop-down list.
                        The default setting is the maximum depth available for your account plan.
                      </Typography>
                    </Grid>

                    {/* Cost Update Frequency */}
                    <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                      <Typography sx={{ width: "50%" }}>Cost Update Frequency:</Typography>
                      <FormControl fullWidth>
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
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" sx={{ mt: -1 }}>
                        These are the current settings for your account. If you would like to change the frequency of
                        cost updates - please contact{" "}
                        <a href="mailto:support@redtrack.io">abc@gmail.com</a>.
                      </Typography>
                    </Grid>

                    {/* Currency */}
                    <Grid item xs={12} sx={{ display: "flex", alignItems: "center" }}>
                      <Typography sx={{ width: "50%" }}>Currency:</Typography>
                      <FormControl fullWidth>
                        <Select
                          name="currency"
                          value={formData.currency}
                          onChange={handleFormChange}
                          required
                        >
                          <MenuItem value="None">None</MenuItem>
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
                      />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Use if you need to send conversions back to your traffic source.
                      </Typography>
                    </Grid>

                    {/* Click Ref ID & External ID in one row */}
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Click Ref ID"
                        name="clickRefId"
                        value={formData.clickRefId}
                        onChange={handleFormChange}
                        placeholder=""
                      />
                    </Grid>
                    <Grid item xs={6}>
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
              <Card sx={{ mt: 2, p: 2, boxShadow: 3, borderRadius: 2, mx: 2 }}>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        Additional Parameters
                      </Typography>
                    </Grid>

                    {/* Parameter, Macro/Token, Name/Description, Select Role in One Row */}
                    <Grid item xs={12} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Parameter *"
                        name="parameter"
                        value={formData.parameter}
                        onChange={handleFormChange}
                      />
                      <TextField
                        fullWidth
                        label="Macro/Token *"
                        name="macroToken"
                        value={formData.macroToken}
                        onChange={handleFormChange}
                      />
                      <TextField
                        fullWidth
                        label="Name / Description *"
                        name="nameDescription"
                        value={formData.nameDescription}
                        onChange={handleFormChange}
                      />
                      <FormControl fullWidth>
                        <InputLabel>Select Role</InputLabel>
                        <Select
                          name="selectRole"
                          value={formData.selectRole}
                          onChange={handleFormChange}
                        >
                          <MenuItem value="">Select a role</MenuItem>
                          <MenuItem value="Aid">Aid</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Conditional Rendering Based on selectedChannel */}
              {selectedChannel && (
                <Card sx={{ mt: 2, p: 2, boxShadow: 3, borderRadius: 2, mx: 2 }}>
                  <CardContent>
                    {selectedChannel === "Facebook" && (
                      <>
                        {/* Facebook API Integration Section */}
                        <Box
                          sx={{
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            p: 2,
                            mb: 2,
                            backgroundColor: "#fafafa",
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={6}>
                              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                Facebook API Integration
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ textAlign: "right" }}>
                              <Button
                                variant={isFacebookConnected ? "contained" : "outlined"}
                                color={isFacebookConnected ? "success" : "primary"}
                                sx={{ textTransform: "none" }}
                                onClick={() => handleAuth("facebook")}
                                disabled={loading}
                              >
                                {loading ? 
                                  <CircularProgress size={24} /> :
                                  isFacebookConnected ? "Connected" : "Connect Facebook"
                                }
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
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            p: 2,
                            mb: 2,
                            backgroundColor: "#fafafa",
                            width: '100%'
                          }}
                        >
                          <Grid container spacing={2}>
                            {/* Section Title */}
                            <Grid item xs={12}>
                              <Typography variant="h6" sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
                                Facebook default data source (pixel)
                                <Tooltip title="Info about pixel data">
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
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Tooltip title="Enter your Pixel ID">
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
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Tooltip title="Enter your API Access Token">
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
                                      <Tooltip title="Default event triggered in your pixel">
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
                            </Grid>
                          </Grid>
                        </Box>
                      </>
                    )}

                    {selectedChannel === "Google" && (
                      <>
                        {/* Google API Integration Section */}
                        <Box
                          sx={{
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            p: 2,
                            mb: 2,
                            backgroundColor: "#fafafa",
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={6}>
                              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                Google API Integration
                              </Typography>
                            </Grid>
                            <Grid item xs={6} sx={{ textAlign: "right" }}>
                              <Button
                                variant={isGoogleConnected ? "contained" : "outlined"}
                                color={isGoogleConnected ? "success" : "primary"}
                                sx={{ textTransform: "none" }}
                                onClick={() => handleAuth("google")}
                                disabled={loading}
                              >
                                {loading ? 
                                  <CircularProgress size={24} /> :
                                  isGoogleConnected ? "Connected" : "Connect Google"
                                }
                              </Button>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="body2" color="textSecondary">
                                Please allow access to activate Google Ads integrations.
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Google Account Details */}
                        <Box
                          sx={{
                            border: "1px solid #ddd",
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
                                label="Google Ads Account ID *"
                                name="googleAdsAccountId"
                                value={formData.googleAdsAccountId}
                                onChange={handleFormChange}
                                required
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Tooltip title="Enter your Google Ads Account ID">
                                        <HelpOutlineIcon fontSize="small" sx={{ cursor: "pointer", color: "#888" }} />
                                      </Tooltip>
                                    </InputAdornment>
                                  ),
                                }}
                              />
                            </Grid>

                            <Grid item xs={12}>
                              <TextField
                                fullWidth
                                label="Google MCC Account ID (optional)"
                                name="googleMccAccountId"
                                value={formData.googleMccAccountId}
                                onChange={handleFormChange}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <Tooltip title="Enter your MCC Account ID if applicable">
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
                          </Grid>
                        </Box>

                        {/* Conversion Matching Section */}
                        <Box
                          sx={{
                            border: "1px solid #ddd",
                            borderRadius: 2,
                            p: 2,
                            mb: 2,
                            backgroundColor: "#fafafa",
                          }}
                        >
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                Conversion Matching
                              </Typography>
                            </Grid>

                            <Grid item xs={12}>
                              <Grid container spacing={2}>
                                <Grid item xs={3}>
                                  <FormControl fullWidth>
                                    <InputLabel>Conversion Type *</InputLabel>
                                    <Select
                                      name="conversionType"
                                      value={formData.conversionType || ""}
                                      onChange={handleFormChange}
                                      required={selectedChannel === "Google"}
                                    >
                                      <MenuItem value="">Select Type</MenuItem>
                                      <MenuItem value="PURCHASE">Purchase</MenuItem>
                                      <MenuItem value="LEAD">Lead</MenuItem>
                                      <MenuItem value="SIGNUP">Signup</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={3}>
                                  <TextField
                                    fullWidth
                                    label="Conversion Name *"
                                    name="conversionName"
                                    value={formData.conversionName || ""}
                                    onChange={handleFormChange}
                                    required={selectedChannel === "Google"}
                                  />
                                </Grid>
                                <Grid item xs={3}>
                                  <FormControl fullWidth>
                                    <InputLabel>Category *</InputLabel>
                                    <Select
                                      name="conversionCategory"
                                      value={formData.conversionCategory || ""}
                                      onChange={handleFormChange}
                                      required={selectedChannel === "Google"}
                                    >
                                      <MenuItem value="">Select Category</MenuItem>
                                      <MenuItem value="DEFAULT">Default</MenuItem>
                                      <MenuItem value="NEW_CUSTOMER">New Customer</MenuItem>
                                      <MenuItem value="RETURNING_CUSTOMER">Returning Customer</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={3}>
                                  <FormControl fullWidth>
                                    <InputLabel>Include in conversions *</InputLabel>
                                    <Select
                                      name="includeInConversions"
                                      value={formData.includeInConversions || ""}
                                      onChange={handleFormChange}
                                      required={selectedChannel === "Google"}
                                    >
                                      <MenuItem value="">Select Option</MenuItem>
                                      <MenuItem value="true">Yes</MenuItem>
                                      <MenuItem value="false">No</MenuItem>
                                    </Select>
                                  </FormControl>
                                </Grid>
                              </Grid>
                            </Grid>
                          </Grid>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Submit/Cancel buttons already in sticky header */}
            </form>
          </Box>
        </Modal>
      </Box>
    </Layout>
  );
};

export default ChannelTable;