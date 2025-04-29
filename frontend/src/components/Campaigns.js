import React, { useEffect, useState } from "react";
import {
  Menu, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Select, MenuItem, InputLabel, 
  FormControl, Button, ToggleButton, ToggleButtonGroup, Chip, Box, Typography, Tabs, Tab, Switch, Divider, 
  Tooltip, Snackbar, Alert, Paper, Grid
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EastIcon from "@mui/icons-material/East";
import WestIcon from "@mui/icons-material/West";
import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import LaunchIcon from "@mui/icons-material/Launch";
import axios from "axios";
import Layout from "./Layout";
import { startOfToday, subDays, startOfMonth, endOfMonth, format } from "date-fns";

// Ensure API_URL is correctly set - adjust this according to your backend configuration
// If the server might be running locally during development or on a different URL in production
const API_URL = process.env.REACT_APP_API_URL || "https://pearmllc.onrender.com";

// For debugging purposes - log what API URL is being used
console.log("Using API URL:", API_URL);

const CampaignModal = ({ open, onClose, onCreate, editMode = false, campaignData = {} }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [campaignName, setCampaignName] = useState(editMode ? campaignData.name || "" : "");
  const [trafficChannel, setTrafficChannel] = useState(editMode ? campaignData.traffic_channel_id || "" : "");
  const [trackingDomain, setTrackingDomain] = useState(editMode ? campaignData.domain_id || "" : "");
  const [costType, setCostType] = useState(editMode ? campaignData.costType || "CPC" : "CPC");
  const [costValue, setCostValue] = useState(editMode ? campaignData.costValue || "0" : "0");
  const [tags, setTags] = useState(editMode ? campaignData.tags || [] : []);
  const [tagInput, setTagInput] = useState("");
  const [offer, setOffer] = useState(editMode ? campaignData.offer || "" : "");
  const [offerWeight, setOfferWeight] = useState(editMode ? campaignData.offerWeight || "100" : "100");
  const [autoOptimize, setAutoOptimize] = useState(editMode ? campaignData.autoOptimize || false : false);
  const [trafficChannels, setTrafficChannels] = useState([]);
  const [domains, setDomains] = useState([]);
  const [offers, setOffers] = useState([]);
  const [isDirectLinking, setIsDirectLinking] = useState(editMode ? campaignData.isDirectLinking || false : false);
  const [lander, setLander] = useState(editMode ? campaignData.lander_id || "" : "");
  const [landers, setLanders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingUrl, setTrackingUrl] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [offersList, setOffersList] = useState([]);
const [offerSelected, setOfferSelected] = useState("");

  const selectedDomain = domains.find(d => d.id === trackingDomain);

  useEffect(() => {
    if (open) {
      setLoading(true);
      
      // Fetch traffic channels
      fetch(`${API_URL}/api/traffic`)
        .then((res) => res.json())
        .then((data) => {
          // Ensure data is an array
          if (Array.isArray(data)) {
            setTrafficChannels(data);
          } else {
            console.error("Traffic channels data is not an array:", data);
            setTrafficChannels([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching traffic channels:", err);
          setTrafficChannels([]);
        });

      // Fetch domains
      fetch(`${API_URL}/api/domains`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const cleaned = data.map(domain => ({
              id: domain.id,
              url: domain.url.replace(/^https?:\/\//, '')
            }));
            setDomains(cleaned);
          } else {
            console.error("Domains data is not an array:", data);
            setDomains([]);
          }
        })
        .catch(err => {
          console.error('Error fetching domains:', err);
          setDomains([]);
        });
        
      // Fetch offers
      fetch(`${API_URL}/api/offers`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOffersList(data);
        } else {
          console.error("Offers data is not an array:", data);
          setOffersList([]);
        }
      })
      .catch(err => {
        console.error('Error fetching offers:', err);
        setOffersList([]);
    });
        
      // Fetch landers
      fetch(`${API_URL}/api/landers`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLanders(data);
          } else {
            console.error("Landers data is not an array:", data);
            setLanders([]);
          }
        })
        .catch(err => {
          console.error('Error fetching landers:', err);
          setLanders([]);
        });
        
      setLoading(false);
    }
  }, [open]);

  // Generate tracking URL when relevant fields change
  useEffect(() => {
    if (selectedDomain && trafficChannel) {
      let url = `https://${selectedDomain?.url}/api/track/click?campaign_id=${editMode ? campaignData.id : 'CAMPAIGN_ID'}&tc=${trafficChannel}`;
      
      // Add placeholder macros
      url += '&sub1={sub1}&sub2={sub2}&sub3={sub3}';
      
      setTrackingUrl(url);
    } else {
      setTrackingUrl("");
    }
  }, [selectedDomain, trafficChannel, editMode, campaignData]);

  // Modified handleSubmit function in CampaignModal component
const handleSubmit = async () => {
  setSubmitError("");
  
  // Validate required fields
  if (!campaignName || !trafficChannel || !trackingDomain) {
    setSubmitError("Campaign name, traffic channel, and tracking domain are required");
    return;
  }

  // If not direct linking, require a lander
  if (!isDirectLinking && !lander) {
    setSubmitError("Please select a landing page or enable direct linking");
    return;
  }
  
  const campaignPayload = {
    name: campaignName,
    traffic_channel_id: trafficChannel,
    domain_id: trackingDomain,
    costType,
    costValue: parseFloat(costValue) || 0,
    tags,
    offer_id: offerSelected, // Use the selected offer ID from state
    offerWeight: parseInt(offerWeight) || 100,
    autoOptimize,
    isDirectLinking,
    lander_id: isDirectLinking ? null : lander,
    status: "ACTIVE"
  };

  try {
    console.log("Submitting campaign with payload:", campaignPayload);
    
    let res;
    if (editMode) {
      const editUrl = `${API_URL}/api/campaigns${campaignData.id}`;
      console.log("Making PUT request to:", editUrl);
      res = await axios.put(editUrl, campaignPayload);
      console.log("Successfully updated campaign:", res.data);
      onClose(res.data);
    } else {
      // Try the correct endpoint based on API structure
      const createUrl = `${API_URL}/api/campaigns`; // Use a create endpoint
      console.log("Making POST request to:", createUrl);
      
      try {
        res = await axios.post(createUrl, campaignPayload);
        console.log("Successfully created campaign:", res.data);
        onCreate(res.data);
        onClose();
      } catch (createError) {
        console.error("Error with :", createError);
        
        // Try another common endpoint pattern
        try {
          console.log("Trying alternate endpoint: /");
          res = await axios.post(`${API_URL}/api/campaigns`, campaignPayload);
          console.log("Successfully created campaign with /:", res.data);
          onCreate(res.data);
          onClose();
        } catch (error) {
          // Try one more potential endpoint structure
          try {
            console.log("Trying second alternate endpoint: /");
            res = await axios.post(`${API_URL}/api/campaigns`, campaignPayload);
            console.log("Successfully created campaign with /:", res.data);
            onCreate(res.data);
            onClose();
          } catch (finalError) {
            console.error("All campaign creation attempts failed:", finalError);
            throw finalError;
          }
        }
      }
    }

    // Reset form after submission
    if (!editMode) {
      setCampaignName("");
      setTrafficChannel("");
      setTrackingDomain("");
      setCostType("CPC");
      setCostValue("0");
      setTags([]);
      setTagInput("");
      setOffer("");
      setOfferWeight("100");
      setAutoOptimize(false);
      setIsDirectLinking(false);
      setLander("");
    }
  } catch (error) {
    console.error("Error saving campaign:", error);
    
    // Enhanced error logging
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
      
      // Provide more helpful error messages based on status codes
      if (error.response.status === 400) {
        setSubmitError(`Validation Error: ${error.response.data?.error || "Please check your input values"}`);
      } else if (error.response.status === 401 || error.response.status === 403) {
        setSubmitError("Authorization Error: You don't have permission to create/edit campaigns");
      } else if (error.response.status === 404) {
        setSubmitError("API Error: The campaign creation endpoint could not be found. Please contact administrator.");
      } else {
        setSubmitError(`API Error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || "Unknown error"}`);
      }
    } else if (error.request) {
      console.error("Request made but no response received:", error.request);
      setSubmitError("No response received from server. Please check your network connection.");
    } else {
      console.error("Error setting up request:", error.message);
      setSubmitError(`Request error: ${error.message}`);
    }
  }
};

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };
  
  const handleDeleteTag = (tagToDelete) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbarMessage("Copied to clipboard!");
    setSnackbarOpen(true);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
          {editMode ? "Edit Campaign" : "Create Campaign"}
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </DialogTitle>

        <Tabs value={tabIndex} onChange={(_, i) => setTabIndex(i)} sx={{ px: 3 }}>
          <Tab label="Campaign Details" />
          <Tab label="Tracking & Routing" />
        </Tabs>

        <DialogContent dividers>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {submitError}
            </Alert>
          )}
          
          {tabIndex === 0 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>General</Typography>
              <Divider />
              <TextField 
                label="Campaign Name" 
                fullWidth 
                value={campaignName} 
                onChange={(e) => setCampaignName(e.target.value)} 
                required
              />
              
              <Box display="flex" gap={2}>
                <FormControl fullWidth required>
                  <InputLabel>Traffic Channel</InputLabel>
                  <Select 
                    value={trafficChannel} 
                    onChange={(e) => setTrafficChannel(e.target.value)} 
                    label="Traffic Channel"
                  >
                    {Array.isArray(trafficChannels) && trafficChannels.map((channel) => (
                      <MenuItem key={channel.id} value={channel.id}>
                        {channel.channelName} ({channel.aliasChannel || "N/A"})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl fullWidth required>
                  <InputLabel>Tracking Domain</InputLabel>
                  <Select 
                    value={trackingDomain} 
                    onChange={(e) => setTrackingDomain(e.target.value)} 
                    label="Tracking Domain"
                  >
                    {Array.isArray(domains) && domains.map((domain) => (
                      <MenuItem key={domain.id} value={domain.id}>{domain.url}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                Campaign Cost
                <Tooltip title="Choose how cost will be tracked.">
                  <span style={{ marginLeft: 8, cursor: "pointer" }}>❓</span>
                </Tooltip>
              </Typography>
              
              <ToggleButtonGroup
                value={costType}
                exclusive
                onChange={(e, value) => value && setCostType(value)}
                sx={{ mb: 2, display: 'flex', flexWrap: 'wrap' }}
              >
                {["CPC", "CPA", "CPM", "POPCPM", "REVSHARE", "DONOTTRACK"].map((val) => (
                  <ToggleButton key={val} value={val}>{val}</ToggleButton>
                ))}
              </ToggleButtonGroup>
              
              <TextField 
                label="Cost Value" 
                type="number" 
                value={costValue} 
                onChange={(e) => setCostValue(e.target.value)} 
                InputProps={{ endAdornment: "$" }} 
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Tags</Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {tags.map((tag, i) => (
                  <Chip 
                    key={i} 
                    label={tag} 
                    onDelete={() => handleDeleteTag(tag)}
                  />
                ))}
              </Box>
              
              <Box display="flex" gap={1}>
                <TextField 
                  label="Add Tag" 
                  value={tagInput} 
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag();
                      e.preventDefault();
                    }
                  }}
                />
                <Button variant="outlined" onClick={handleAddTag}>Add</Button>
              </Box>
            </Box>
          )}
          
          {tabIndex === 1 && (
            <Box display="flex" flexDirection="column" gap={2}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Traffic Routing</Typography>
              <Divider />
              
              <Box display="flex" alignItems="center" gap={1}>
                <Switch 
                  checked={isDirectLinking} 
                  onChange={(e) => setIsDirectLinking(e.target.checked)} 
                />
                <Typography>Direct Linking (Skip Lander)</Typography>
              </Box>
              
              {!isDirectLinking && (
                <FormControl fullWidth required={!isDirectLinking}>
                  <InputLabel>Landing Page</InputLabel>
                  <Select 
                    value={lander} 
                    onChange={(e) => setLander(e.target.value)} 
                    label="Landing Page"
                    disabled={isDirectLinking}
                  >
                    {Array.isArray(landers) && landers.map((landerItem) => (
                      <MenuItem key={landerItem.id} value={landerItem.id}>
                        {landerItem.name} ({landerItem.url})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              
              
              <FormControl fullWidth required>
                <InputLabel>Offer</InputLabel>
                <Select 
                  value={offerSelected}
                  onChange={(e) => setOfferSelected(e.target.value)}
                  label="Offer"
                >
                  {offersList.map((offerItem) => (
                    <MenuItem key={offerItem.Serial_No} value={offerItem.Serial_No}>
                      {offerItem.Offer_name} (${offerItem.revenue})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              
              <TextField 
                label="Offer Weight" 
                type="number" 
                value={offerWeight} 
                onChange={(e) => setOfferWeight(e.target.value)}
                InputProps={{ endAdornment: "%" }}
                helperText="For offer rotations (if applicable)"
              />
              
              <Box display="flex" alignItems="center" gap={1}>
                <Switch 
                  checked={autoOptimize} 
                  onChange={(e) => setAutoOptimize(e.target.checked)} 
                />
                <Typography>Auto-Optimize Offers</Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Tracking Links</Typography>
              
              <Paper elevation={1} sx={{ p: 2, borderRadius: 1, bgcolor: '#f5f5f5' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Campaign Tracking URL</Typography>
                  <IconButton onClick={() => copyToClipboard(trackingUrl)} size="small">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  value={trackingUrl}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                  This URL will track clicks to your campaign. Append additional sub parameters as needed.
                </Typography>
              </Paper>
              
              {!isDirectLinking && (
                <Paper elevation={1} sx={{ p: 2, borderRadius: 1, bgcolor: '#f5f5f5' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">Lander View Tracking Code</Typography>
                    <IconButton 
                      onClick={() => copyToClipboard(`<img src="${API_URL}/api/track/lander?click_id={CLICK_ID}" style="position:absolute; visibility:hidden;" height="1" width="1" />`)} 
                      size="small"
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    value={`<img src="${API_URL}/api/track/lander?click_id={CLICK_ID}" style="position:absolute; visibility:hidden;" height="1" width="1" />`}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    Add this invisible pixel to your landing page to track views. Replace {'{CLICK_ID}'} with the actual click_id parameter.
                  </Typography>
                </Paper>
              )}
              
              <Paper elevation={1} sx={{ p: 2, borderRadius: 1, bgcolor: '#f5f5f5' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle2">Conversion Tracking URL</Typography>
                  <IconButton 
                    onClick={() => copyToClipboard(`${API_URL}/api/track/conversion?click_id={CLICK_ID}&payout={PAYOUT}`)} 
                    size="small"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  value={`${API_URL}/api/track/conversion?click_id={CLICK_ID}&payout={PAYOUT}`}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    readOnly: true,
                  }}
                />
                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                  Use this URL for server-to-server conversion tracking. Replace {'{CLICK_ID}'} with the actual click_id and {'{PAYOUT}'} with the conversion amount.
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editMode ? "Update Campaign" : "Create Campaign"}
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dateRange, setDateRange] = useState([startOfToday(), startOfToday()]);
  const [metrics, setMetrics] = useState({});
  const [selectedRows, setSelectedRows] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [domains, setDomains] = useState([]);

  // Enhanced columns with proper data mapping
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Campaign Name", flex: 1 },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value || "INACTIVE"} 
          color={params.value === "ACTIVE" ? "success" : "default"} 
          size="small"
        />
      ),
    },
    {
      field: "traffic_channel",
      headerName: "Traffic Source",
      width: 150,
      valueGetter: (params) => {
        // Check multiple possible paths to get traffic channel name
        if (params.row.traffic_channel?.channelName) {
          return params.row.traffic_channel.channelName;
        } else if (params.row.traffic_channel_name) {
          return params.row.traffic_channel_name;
        } else {
          // Try to find traffic channel by ID if available
          return params.row.traffic_channel_id || "N/A";
        }
      }
    },
    { 
      field: "costType", 
      headerName: "Cost Type", 
      width: 100,
      valueGetter: (params) => params.row.costType || "N/A"
    },
    { 
      field: "costValue", 
      headerName: "Cost", 
      width: 80,
      valueGetter: (params) => params.row.costValue || 0,
      valueFormatter: (params) => `$${parseFloat(params.value).toFixed(2)}` 
    },
    {
      field: "clicks",
      headerName: "Clicks",
      width: 80,
      valueGetter: (params) => {
        const campaignMetrics = metrics[params.row.id] || {};
        return campaignMetrics.clicks || 0;
      }
    },
    {
      field: "conversions",
      headerName: "Conversions",
      width: 110,
      valueGetter: (params) => {
        const campaignMetrics = metrics[params.row.id] || {};
        return campaignMetrics.conversions || 0;
      }
    },
    {
      field: "cr",
      headerName: "CR%",
      width: 80,
      valueGetter: (params) => {
        const campaignMetrics = metrics[params.row.id] || {};
        const clicks = campaignMetrics.clicks || 0;
        const conversions = campaignMetrics.conversions || 0;
        return clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : "0.00";
      },
      valueFormatter: (params) => `${params.value}%`
    },
    {
      field: "revenue",
      headerName: "Revenue",
      width: 100,
      valueGetter: (params) => {
        const campaignMetrics = metrics[params.row.id] || {};
        return campaignMetrics.total_revenue || campaignMetrics.revenue || 0;
      },
      valueFormatter: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: "profit",
      headerName: "Profit",
      width: 100,
      valueGetter: (params) => {
        const campaignMetrics = metrics[params.row.id] || {};
        // Calculate profit if not directly available
        if (campaignMetrics.profit !== undefined) {
          return campaignMetrics.profit;
        } else {
          const revenue = campaignMetrics.total_revenue || campaignMetrics.revenue || 0;
          const cost = campaignMetrics.total_cost || campaignMetrics.cost || 0;
          return revenue - cost;
        }
      },
      valueFormatter: (params) => `$${Number(params.value).toFixed(2)}`
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      renderCell: (params) => (
        <Box display="flex">
          <IconButton
            size="small"
            onClick={() => handleEditClick(params.row)}
            title="Edit Campaign"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              // Function to copy tracking URL
              const domain = params.row.domain?.url || 
                             (params.row.domain_id && domains.find(d => d.id === params.row.domain_id)?.url) || 
                             "yourdomain.com";
              const trackingUrl = `https://${domain}/api/track/click?campaign_id=${params.row.id}&tc=${params.row.traffic_channel_id}`;
              navigator.clipboard.writeText(trackingUrl);
              setSnackbarMessage("Tracking URL copied to clipboard!");
              setSnackbarOpen(true);
            }}
            title="Copy Tracking URL"
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              window.open(`/campaigns/${params.row.id}`, '_blank');
            }}
            title="View Campaign Details"
          >
            <LaunchIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  // Improved campaign fetching with better error handling
  const fetchCampaigns = () => {
    setLoading(true);
    
    console.log("Fetching campaigns from:", `${API_URL}/api/campaigns`);
    
    axios.get(`${API_URL}/api/campaigns`)
      .then((res) => {
        console.log("Campaign data received:", res.data);
        
        // FIX: Check if res.data is an array, if not, try to convert it
        let campaignsData = res.data;
        if (!Array.isArray(campaignsData)) {
          // If it's an object with a data property that's an array
          if (res.data && Array.isArray(res.data.data)) {
            campaignsData = res.data.data;
          } 
          // If it's an object with a campaigns property that's an array
          else if (res.data && Array.isArray(res.data.campaigns)) {
            campaignsData = res.data.campaigns;
          }
          // If it's just a single object
          else if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
            campaignsData = [res.data];
          } 
          // Last resort, create an empty array
          else {
            campaignsData = [];
            console.warn("Received unexpected data structure:", res.data);
          }
        }
        
        const campaignsWithIds = campaignsData.map((campaign) => ({
          ...campaign,
          id: campaign.id || campaign._id || campaign.campaign_id || Math.random().toString(36).substr(2, 9),
        }));
        
        setCampaigns(campaignsWithIds);
        
        // Fetch metrics for these campaigns
        if (campaignsWithIds.length > 0) {
          console.log("Fetching metrics for campaigns:", campaignsWithIds.map(c => c.id));
          fetchMetrics(campaignsWithIds.map(c => c.id));
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching campaigns:", err);
        
        // Try alternative endpoints
        tryAlternativeEndpoints();
      });
  };
  
  // Function to try alternative API endpoints
  const tryAlternativeEndpoints = () => {
    console.log("Trying alternative endpoint:", `${API_URL}/api/campaigns`);
    
    axios.get(`${API_URL}/api/campaigns`)
      .then((res) => handleSuccessfulResponse(res, "Alternative endpoint successful"))
      .catch((err) => {
        console.log("Trying another alternative endpoint:", `${API_URL}/api/campaign`);
        
        axios.get(`${API_URL}/api/campaign`)
          .then((res) => handleSuccessfulResponse(res, "Second alternative endpoint successful"))
          .catch((altErr) => {
            console.error("All campaign fetching attempts failed");
            setLoading(false);
            setSnackbarMessage("Failed to load campaigns. Please check API configuration.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
          });
      });
  };
  
  // Handle successful API response
  const handleSuccessfulResponse = (res, logMessage) => {
    console.log(logMessage, res.data);
    
    let campaignsData = res.data;
    if (!Array.isArray(campaignsData)) {
      if (res.data && Array.isArray(res.data.data)) {
        campaignsData = res.data.data;
      } else if (res.data && Array.isArray(res.data.campaigns)) {
        campaignsData = res.data.campaigns;
      } else if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        campaignsData = [res.data];
      } else {
        campaignsData = [];
        console.warn("Received unexpected data structure:", res.data);
      }
    }
    
    const campaignsWithIds = campaignsData.map((campaign) => ({
      ...campaign,
      id: campaign.id || campaign._id || campaign.campaign_id || Math.random().toString(36).substr(2, 9),
    }));
    
    setCampaigns(campaignsWithIds);
    
    // Fetch metrics for these campaigns
    if (campaignsWithIds.length > 0) {
      console.log("Fetching metrics for campaigns:", campaignsWithIds.map(c => c.id));
      fetchMetrics(campaignsWithIds.map(c => c.id));
    } else {
      setLoading(false);
    }
  };
  
  // Improved metrics fetching function
  const fetchMetrics = (campaignIds) => {
    // Format date range for API
    const startDate = format(dateRange[0], 'yyyy-MM-dd');
    const endDate = format(dateRange[1], 'yyyy-MM-dd');
    
    console.log(`Fetching metrics from ${startDate} to ${endDate} for campaigns:`, campaignIds);
    
    // Create metrics object to store by campaign ID
    const metricsData = {};
    let completedRequests = 0;
    
    // Fetch metrics for each campaign
    campaignIds.forEach(id => {
      const metricsUrl = `${API_URL}/api/track/metrics?campaign_id=${id}&start_date=${startDate}&end_date=${endDate}`;
      console.log(`Fetching metrics for campaign ${id} from: ${metricsUrl}`);
      
      axios.get(metricsUrl)
        .then(res => {
          console.log(`Metrics data for campaign ${id}:`, res.data);
          
          // Check if res.data is an array before reducing
          if (Array.isArray(res.data)) {
            // Sum up metrics if multiple records are returned
            const campaignMetrics = res.data.reduce((acc, curr) => {
              Object.keys(curr).forEach(key => {
                if (typeof curr[key] === 'number') {
                  acc[key] = (acc[key] || 0) + curr[key];
                }
              });
              return acc;
            }, {});
            
            metricsData[id] = campaignMetrics;
          } else if (typeof res.data === 'object') {
            // If it's a single object, use it directly
            metricsData[id] = res.data;
          }
        })
        .catch(err => {
          console.error(`Error fetching metrics for campaign ${id}:`, err);
          // Set empty metrics to avoid undefined errors
          metricsData[id] = { clicks: 0, conversions: 0, total_revenue: 0, profit: 0 };
        })
        .finally(() => {
          completedRequests++;
          if (completedRequests === campaignIds.length) {
            console.log("All metrics fetching completed:", metricsData);
            setMetrics(metricsData);
            setLoading(false);
          }
        });
    });
    
    // Handle case where no campaigns or all API calls fail
    if (campaignIds.length === 0) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);
  
  useEffect(() => {
    if (campaigns.length > 0) {
      fetchMetrics(campaigns.map(c => c.id));
    }
  }, [dateRange]);

  // The rest of the component functions
  const handleCreateClick = () => {
    setCreateOpen(true);
  };

  const handleCreateClose = () => {
    setCreateOpen(false);
    fetchCampaigns(); // Refresh the campaigns list
  };

  const handleEditClick = (campaign) => {
    setSelectedCampaign(campaign);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setSelectedCampaign(null);
    fetchCampaigns(); // Refresh the campaigns list
  };

  const handleCreate = (newCampaign) => {
    fetchCampaigns(); // Refresh to get the updated list
    setSnackbarMessage("Campaign created successfully!");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  };
  
  const predefinedRanges = {
    Today: [startOfToday(), startOfToday()],
    Yesterday: [subDays(new Date(), 1), subDays(new Date(), 1)],
    "Last 7 Days": [subDays(new Date(), 6), new Date()],
    "Last 30 Days": [subDays(new Date(), 29), new Date()],
    "This Month": [startOfMonth(new Date()), new Date()],
    "Last Month": [startOfMonth(subDays(new Date(), 30)), endOfMonth(subDays(new Date(), 30))],
  };

  return (
    <Layout>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>Campaigns</Typography>
        
        <Grid container spacing={2} alignItems="center" mb={2}>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCreateClick}
              startIcon={<AddIcon />}
            >
              Create Campaign
            </Button>
          </Grid>
          
          <Grid item flexGrow={1}>
            <Box display="flex" justifyContent="flex-end">
              <ToggleButtonGroup
                value={null} // This needs to be fixed to match the format used in the onChange
                exclusive
                onChange={(e, newValue) => {
                  if (newValue && predefinedRanges[newValue]) {
                    setDateRange(predefinedRanges[newValue]);
                  }
                }}
                size="small"
              >
                {Object.keys(predefinedRanges).map((label) => (
                  <ToggleButton 
                    key={label} 
                    value={label}
                  >
                    {label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Paper elevation={2}>
        <DataGrid
          rows={campaigns}
          columns={columns}
          pageSize={10}
          loading={loading}
          rowsPerPageOptions={[5, 10, 25, 50]}
          checkboxSelection
          onSelectionModelChange={(ids) => setSelectedRows(ids)}
          disableSelectionOnClick
          autoHeight
          sx={{ minHeight: 400 }}
          getRowId={(row) => row.id}
        />
      </Paper>

      {/* Create Campaign Modal */}
      <CampaignModal 
        open={createOpen} 
        onClose={handleCreateClose} 
        onCreate={handleCreate} 
      />
      
      {/* Edit Campaign Modal */}
      {selectedCampaign && (
        <CampaignModal 
          open={editOpen} 
          onClose={handleEditClose} 
          onCreate={handleCreate} 
          editMode={true}
          campaignData={selectedCampaign}
        />
      )}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Layout>
  );
}