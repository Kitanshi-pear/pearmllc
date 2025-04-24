import React, { useEffect, useState } from "react";
import {
  Menu, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField, Select, MenuItem, InputLabel, FormControl, Button, ToggleButton, ToggleButtonGroup, Chip, Box, Typography, Tabs, Tab, Switch, Divider, Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import AddIcon from "@mui/icons-material/Add";
import EastIcon from "@mui/icons-material/East";
import WestIcon from "@mui/icons-material/West";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import Layout from "./Layout";
import { startOfToday, subDays, startOfMonth, endOfMonth } from "date-fns";

const API_URL = process.env.REACT_APP_API_URL || "https://pearmllc.onrender.com";

const CampaignModal = ({ open, onClose, onCreate }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [campaignName, setCampaignName] = useState("");
  const [trafficChannel, setTrafficChannel] = useState("");
  const [trackingDomain, setTrackingDomain] = useState("");
  const [costType, setCostType] = useState("CPC");
  const [costValue, setCostValue] = useState("0");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [offer, setOffer] = useState("");
  const [offerWeight, setOfferWeight] = useState("100");
  const [autoOptimize, setAutoOptimize] = useState(false);
  const [trafficChannels, setTrafficChannels] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);

  const selectedDomain = domains.find(d => d.id === trackingDomain);
  const clickUrl = selectedDomain ? `https://${selectedDomain.url}/click?cid=...` : "";

  useEffect(() => {
    if (open) {
      fetch(`${API_URL}/api/traffic-channels`)
        .then((res) => res.json())
        .then((data) => setTrafficChannels(data))
        .catch((err) => console.error("Error fetching traffic channels:", err));

      fetch(`${API_URL}/api/domains`)
        .then(res => res.json())
        .then(data => {
          const cleaned = data.map(domain => ({
            id: domain.id,
            url: domain.url.replace(/^https?:\/\//, '')
          }));
          setDomains(cleaned);
        })
        .catch(err => console.error('Error fetching domains:', err));
    }
  }, [open]);

  const handleSubmit = async () => {
    const newCampaign = {
      name: campaignName,
      traffic_channel_id: trafficChannel,
      domain_id: trackingDomain,
      costType,
      costValue,
      tags,
      offer: offer || null,
      offerWeight: offerWeight || 100,
      autoOptimize,
    };

    try {
      const res = await axios.post(`${API_URL}/api/campaigns`, newCampaign);
      onCreate(res.data);
      onClose();

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
    } catch (error) {
      console.error("Error creating campaign:", error);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between" }}>
        Campaign
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <Tabs value={tabIndex} onChange={(_, i) => setTabIndex(i)} sx={{ px: 3 }}>
        <Tab label="Campaign Details" />
      </Tabs>

      <DialogContent dividers>
        {tabIndex === 0 && (
          <Box display="flex">
            <Box flex={1}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>General</Typography>
              <Divider />
              <TextField label="Name" fullWidth value={campaignName} onChange={(e) => setCampaignName(e.target.value)} margin="normal" />
              <Box display="flex" gap={1} my={2}>
                <FormControl fullWidth>
                  <InputLabel>Traffic Channel</InputLabel>
                  <Select value={trafficChannel} onChange={(e) => setTrafficChannel(e.target.value)} label="Traffic Channel">
                    {trafficChannels.map((channel) => (
                      <MenuItem key={channel.id} value={channel.id}>
                        {channel.channelName} ({channel.aliasChannel})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Tracking Domain</InputLabel>
                  <Select value={trackingDomain} onChange={(e) => setTrackingDomain(e.target.value)} label="Tracking Domain">
                    {domains.map((domain, index) => (
                      <MenuItem key={index} value={domain.id}>{domain.url}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
                Campaign Cost
                <Tooltip title="Choose how cost will be tracked."><span style={{ marginLeft: 1, cursor: "pointer" }}>❓</span></Tooltip>
              </Typography>
              <ToggleButtonGroup
                value={costType}
                exclusive
                onChange={(e, value) => value && setCostType(value)}
                sx={{ mb: 2, display: 'flex', flexDirection: 'row', gap: 0, flexWrap: 'nowrap', overflowX: 'auto' }}
              >
                {["CPC", "CPA", "CPM", "POPCPM", "REVSHARE", "DONOTTRACK"].map((val) => (
                  <ToggleButton key={val} value={val}>{val}</ToggleButton>
                ))}
              </ToggleButtonGroup>
              <TextField label="Value" type="number" value={costValue} onChange={(e) => setCostValue(e.target.value)} InputProps={{ endAdornment: "$" }} />
            </Box>
          </Box>
        )}
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" gutterBottom>Tags</Typography>
        <Box display="flex" flexWrap="wrap">{tags.map((tag, i) => <Chip key={i} label={tag} />)}</Box>
        <Box display="flex" gap={1}>
          <TextField label="Add Tag" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
          <Button variant="outlined" onClick={handleAddTag}>Add</Button>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>Tracking links and parameters</Typography>
        <Box display="flex" mb={2}>
          <Button variant="contained">REDIRECT</Button>
        </Box>
        <TextField
          label="Click URL"
          fullWidth
          value={clickUrl}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDateLabel, setSelectedDateLabel] = useState("Today");
  const [selectedRange, setSelectedRange] = useState([startOfToday(), startOfToday()]);

  const predefinedRanges = {
    Today: [startOfToday(), startOfToday()],
    Yesterday: [subDays(new Date(), 1), subDays(new Date(), 1)],
    "Last 7 Days": [subDays(new Date(), 6), new Date()],
    "Last 30 Days": [subDays(new Date(), 29), new Date()],
    "This Month": [startOfMonth(new Date()), new Date()],
    "Last Month": [startOfMonth(subDays(new Date(), 30)), endOfMonth(subDays(new Date(), 30))],
  };

  const columns = [
    { field: "id", headerName: "#", width: 70 },
    { field: "name", headerName: "Title", flex: 1 },
    {
      field: "status",
      headerName: "Campaign Status",
      width: 140,
      renderCell: (params) => <span style={{ color: "green" }}>● {params.value}</span>,
    },
    {
      field: "traffic_channel",
      headerName: "Traffic Channel",
      width: 180,
      renderCell: (params) => {
        console.log('Row:', params.row);
        const channel = params.row.traffic_channel;
        return channel ? `${channel.channelName}` : '';
      },      
    },      
    { field: "clicks", headerName: "Clicks", width: 100 },
    { field: "lp_clicks", headerName: "LP Clicks", width: 110 },
    { field: "conversions", headerName: "Conversions", width: 120 },
    {
      field: "revenue",
      headerName: "Total Revenue",
      width: 130,
      renderCell: (params) => `$${params.value?.toFixed(2) ?? "0.00"}`,
    },
    {
      field: "cost",
      headerName: "Cost",
      width: 100,
      renderCell: (params) => `$${params.value?.toFixed(2) ?? "0.00"}`,
    },
    {
      field: "profit",
      headerName: "Profit",
      width: 100,
      renderCell: (params) => `$${params.value?.toFixed(2) ?? "0.00"}`,
    },
  ];

  const handleCreateCampaign = (campaign) => {
    setCampaigns((prev) => [...prev, campaign]);
  };

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/campaigns`);
      setCampaigns(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);


  return (
    <Layout>
      <Box>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={2}>
          <Typography variant="h4">Campaigns</Typography>
          <Button variant="contained" onClick={() => setCreateOpen(true)}>Create Campaign</Button>
        </Box>

        {/* Filter Bar */}
        <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
          <TextField label="Date" size="small" sx={{ width: 200 }} value={selectedDateLabel} onClick={(e) => setAnchorEl(e.currentTarget)} />
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            {Object.entries(predefinedRanges).map(([label, range]) => (
              <MenuItem key={label} onClick={() => {
                setSelectedDateLabel(label);
                setSelectedRange(range);
                setAnchorEl(null);
              }}>{label}</MenuItem>
            ))}
          </Menu>
          <IconButton sx={{ border: "1px solid #ccc", borderRadius: 1, p: 1, height: 40, width: 40 }}>
            <EastIcon fontSize="medium" /><WestIcon fontSize="medium" />
          </IconButton>
          <TextField label="Date" type="date" size="small" sx={{ width: 200 }} InputLabelProps={{ shrink: true }} />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Traffic channels</InputLabel>
            <Select defaultValue="">
              <MenuItem value="">Traffic channels</MenuItem>
              <MenuItem value="Facebook">Facebook</MenuItem>
              <MenuItem value="Google Ads">Google Ads</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Status</InputLabel>
            <Select defaultValue="Active" label="Status">
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Paused">Paused</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Time zone" size="small" defaultValue="America/New_York" />
          <TextField label="Title" size="small" />
          <TextField label="Tags" size="small" />
          <Button variant="contained">Apply</Button>
        </Box>

        {/* Table */}
        <DataGrid
          rows={campaigns}
          columns={columns}
          pageSize={100}
          rowsPerPageOptions={[100]}
          loading={loading}
          checkboxSelection
          autoHeight
          disableSelectionOnClick
        />

        {/* Create Modal */}
        <CampaignModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateCampaign}
        />
      </Box>
    </Layout>
  );
}
