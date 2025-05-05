import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  LinkOff as LinkOffIcon,
  Done as DoneIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  FormatListBulleted as ListIcon,
  Code as CodeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

// API base URL - update to match your backend
const API_BASE_URL = '/api/traffic-channels';

const TrafficChannels = () => {
  // State management
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState({ facebook: { connected: false }, google: { connected: false } });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [tabValue, setTabValue] = useState(0);
  const [metricsData, setMetricsData] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  
  // Form state
  const [formData, setFormData] = useState({
    channelName: '',
    aliasChannel: 'Custom',
    costUpdateDepth: 30,
    costUpdateFrequency: 'daily',
    currency: 'USD',
    s2sPostbackUrl: '',
    clickRefId: '{click_id}',
    externalId: '',
    pixelId: '',
    apiAccessToken: '',
    defaultEventName: 'Purchase',
    customConversionMatching: false,
    googleAdsAccountId: '',
    googleMccAccountId: '',
    status: 'Active'
  });

  // Fetch all channels on component mount
  useEffect(() => {
    fetchChannels();
    checkAuthStatus();
  }, []);

  // Fetch channels from the API
  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(API_BASE_URL);
      setChannels(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError('Failed to load traffic channels. Please try again.');
      setLoading(false);
    }
  };

  // Check OAuth connection status
  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/status`);
      setAuthStatus(response.data);
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Open dialog to add new channel
  const handleAddChannel = () => {
    setFormData({
      channelName: '',
      aliasChannel: 'Custom',
      costUpdateDepth: 30,
      costUpdateFrequency: 'daily',
      currency: 'USD',
      s2sPostbackUrl: '',
      clickRefId: '{click_id}',
      externalId: '',
      pixelId: '',
      apiAccessToken: '',
      defaultEventName: 'Purchase',
      customConversionMatching: false,
      googleAdsAccountId: '',
      googleMccAccountId: '',
      status: 'Active'
    });
    setSelectedChannel(null);
    setDialogOpen(true);
  };

  // Open dialog to edit channel
  const handleEditChannel = (channel) => {
    setSelectedChannel(channel);
    setFormData({
      channelName: channel.channelName,
      aliasChannel: channel.aliasChannel,
      costUpdateDepth: channel.costUpdateDepth,
      costUpdateFrequency: channel.costUpdateFrequency,
      currency: channel.currency,
      s2sPostbackUrl: channel.s2sPostbackUrl,
      clickRefId: channel.clickRefId || '{click_id}',
      externalId: channel.externalId || '',
      pixelId: channel.pixelId || '',
      apiAccessToken: channel.apiAccessToken || '',
      defaultEventName: channel.defaultEventName || 'Purchase',
      customConversionMatching: channel.customConversionMatching || false,
      googleAdsAccountId: channel.googleAdsAccountId || '',
      googleMccAccountId: channel.googleMccAccountId || '',
      status: channel.status
    });
    setDialogOpen(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      if (selectedChannel) {
        // Update existing channel
        await axios.put(`${API_BASE_URL}/${selectedChannel.id}`, formData);
        setSnackbar({ open: true, message: 'Traffic channel updated successfully', severity: 'success' });
      } else {
        // Create new channel
        await axios.post(API_BASE_URL, formData);
        setSnackbar({ open: true, message: 'Traffic channel created successfully', severity: 'success' });
      }
      setDialogOpen(false);
      fetchChannels();
    } catch (err) {
      console.error('Error saving channel:', err);
      setSnackbar({ open: true, message: 'Failed to save traffic channel', severity: 'error' });
    }
  };

  // Handle channel deletion
  const handleDeleteChannel = async (channel) => {
    if (window.confirm(`Are you sure you want to delete ${channel.channelName}?`)) {
      try {
        await axios.delete(`${API_BASE_URL}/${channel.id}`);
        setSnackbar({ open: true, message: 'Traffic channel deleted successfully', severity: 'success' });
        fetchChannels();
      } catch (err) {
        console.error('Error deleting channel:', err);
        setSnackbar({ open: true, message: 'Failed to delete traffic channel', severity: 'error' });
      }
    }
  };

  // Initiate Facebook OAuth
  const handleFacebookConnect = () => {
    window.location.href = `${API_BASE_URL}/auth/facebook`;
  };

  // Initiate Google OAuth
  const handleGoogleConnect = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  // Disconnect Google OAuth
  const handleGoogleDisconnect = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/google/disconnect`);
      setSnackbar({ open: true, message: 'Google account disconnected', severity: 'success' });
      checkAuthStatus();
    } catch (err) {
      console.error('Error disconnecting Google:', err);
      setSnackbar({ open: true, message: 'Failed to disconnect Google account', severity: 'error' });
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1 && selectedChannel) {
      fetchChannelMetrics(selectedChannel.id);
    }
  };

  // View channel details
  const handleViewChannel = (channel) => {
    setSelectedChannel(channel);
    setTabValue(0); // Reset to overview tab
    // Fetch metrics for this channel
    fetchChannelMetrics(channel.id);
  };

  // Fetch channel metrics
  const fetchChannelMetrics = async (channelId) => {
    setMetricsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/${channelId}/metrics`, {
        params: {
          start_date: dateRange.startDate,
          end_date: dateRange.endDate,
          dimension: 'day'
        }
      });
      setMetricsData(response.data);
      setMetricsLoading(false);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setMetricsLoading(false);
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!metricsData || metricsData.length === 0) return null;

    // Sort metrics by date
    const sortedMetrics = [...metricsData].sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      labels: sortedMetrics.map(metric => format(new Date(metric.date), 'MMM dd')),
      datasets: [
        {
          label: 'Clicks',
          data: sortedMetrics.map(metric => metric.clicks || 0),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Conversions',
          data: sortedMetrics.map(metric => metric.conversions || 0),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderWidth: 2,
          fill: false,
          tension: 0.4
        },
        {
          label: 'Revenue',
          data: sortedMetrics.map(metric => metric.revenue || 0),
          borderColor: 'rgba(255, 159, 64, 1)',
          backgroundColor: 'rgba(255, 159, 64, 0.2)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  };

  // Prepare chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Clicks & Conversions'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: 'Revenue ($)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        enabled: true
      }
    }
  };

  // Calculate aggregated metrics from metricsData
  const calculateAggregatedMetrics = () => {
    if (!metricsData || metricsData.length === 0) return {
      clicks: 0,
      conversions: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      ctr: 0,
      cr: 0,
      cpc: 0,
      rpc: 0,
      roi: 0
    };

    return metricsData.reduce((total, metric) => {
      return {
        clicks: total.clicks + (metric.clicks || 0),
        conversions: total.conversions + (metric.conversions || 0),
        revenue: total.revenue + (metric.revenue || 0),
        cost: total.cost + (metric.cost || 0),
        profit: total.profit + (metric.profit || 0),
        ctr: 0, // Calculated below
        cr: 0, // Calculated below
        cpc: 0, // Calculated below
        rpc: 0, // Calculated below
        roi: 0 // Calculated below
      };
    }, {
      clicks: 0,
      conversions: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      ctr: 0,
      cr: 0,
      cpc: 0,
      rpc: 0,
      roi: 0
    });
  };

  // Calculate derived metrics
  const calculateDerivedMetrics = (metrics) => {
    const { clicks, conversions, revenue, cost } = metrics;
    
    const ctr = clicks > 0 ? (metrics.ctr || 0) : 0;
    const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const cpc = clicks > 0 ? cost / clicks : 0;
    const rpc = clicks > 0 ? revenue / clicks : 0;
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

    return {
      ...metrics,
      ctr,
      cr,
      cpc,
      rpc,
      roi
    };
  };

  // Format currency
  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${value.toFixed(2)}%`;
  };

  // Format number with comma separators
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  // Render channel status chip
  const renderStatusChip = (status) => {
    let color = 'default';
    
    switch (status.toLowerCase()) {
      case 'active':
        color = 'success';
        break;
      case 'inactive':
        color = 'error';
        break;
      case 'paused':
        color = 'warning';
        break;
      default:
        color = 'default';
    }

    return (
      <Chip 
        label={status} 
        size="small" 
        color={color} 
        variant="outlined"
      />
    );
  };

  // Render channel type icon
  const renderChannelTypeIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'facebook':
        return <FacebookIcon color="primary" />;
      case 'google':
        return <GoogleIcon style={{ color: '#4285F4' }} />;
      default:
        return null;
    }
  };

  // Main render
  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ pt: 4, pb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Traffic Channels
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchChannels}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddChannel}
            color="primary"
          >
            New Channel
          </Button>
        </Box>
      </Box>

      {/* OAuth connection status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          API Connections
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FacebookIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="subtitle1">Facebook Ads</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {authStatus.facebook.connected 
                      ? `Connected as ${authStatus.facebook.email}` 
                      : 'Not connected'}
                  </Typography>
                </Box>
              </Box>
              <Button
                variant={authStatus.facebook.connected ? "outlined" : "contained"}
                color={authStatus.facebook.connected ? "inherit" : "primary"}
                onClick={handleFacebookConnect}
                startIcon={authStatus.facebook.connected ? <RefreshIcon /> : <FacebookIcon />}
              >
                {authStatus.facebook.connected ? 'Reconnect' : 'Connect'}
              </Button>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GoogleIcon sx={{ mr: 2, fontSize: 32, color: '#4285F4' }} />
                <Box>
                  <Typography variant="subtitle1">Google Ads</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {authStatus.google.connected 
                      ? `Connected as ${authStatus.google.email}` 
                      : 'Not connected'}
                  </Typography>
                </Box>
              </Box>
              {authStatus.google.connected ? (
                <Box>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleGoogleDisconnect}
                    startIcon={<LinkOffIcon />}
                    sx={{ mr: 1 }}
                  >
                    Disconnect
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleGoogleConnect}
                    startIcon={<RefreshIcon />}
                  >
                    Reconnect
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleGoogleConnect}
                  startIcon={<GoogleIcon />}
                >
                  Connect
                </Button>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Channels List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
      ) : channels.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>No traffic channels found</Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Create your first traffic channel to start tracking your traffic sources.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleAddChannel}
          >
            Add Traffic Channel
          </Button>
        </Paper>
      ) : (
        <>
          {/* Channels table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Clicks</TableCell>
                  <TableCell align="right">Conversions</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Profit</TableCell>
                  <TableCell align="right">ROI</TableCell>
                  <TableCell align="right">Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {channels.map((channel) => {
                  // Get metrics for this channel
                  const metrics = channel.metrics || {};
                  const derivedMetrics = calculateDerivedMetrics(metrics);

                  return (
                    <TableRow 
                      key={channel.id}
                      hover
                      onClick={() => handleViewChannel(channel)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {renderChannelTypeIcon(channel.aliasChannel)}
                          <Typography sx={{ ml: renderChannelTypeIcon(channel.aliasChannel) ? 1 : 0 }}>
                            {channel.channelName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{channel.aliasChannel}</TableCell>
                      <TableCell align="right">{formatNumber(metrics.clicks || 0)}</TableCell>
                      <TableCell align="right">{formatNumber(metrics.conversions || 0)}</TableCell>
                      <TableCell align="right">{formatCurrency(metrics.revenue || 0, channel.currency)}</TableCell>
                      <TableCell align="right">{formatCurrency(metrics.cost || 0, channel.currency)}</TableCell>
                      <TableCell align="right">{formatCurrency(metrics.profit || 0, channel.currency)}</TableCell>
                      <TableCell align="right">{formatPercentage(derivedMetrics.roi || 0)}</TableCell>
                      <TableCell align="right">{renderStatusChip(channel.status)}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditChannel(channel);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChannel(channel);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Channel Details Dialog */}
      {selectedChannel && (
        <Dialog
          open={!!selectedChannel}
          onClose={() => setSelectedChannel(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6">{selectedChannel.channelName}</Typography>
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditChannel(selectedChannel)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => setSelectedChannel(null)}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab icon={<BarChartIcon />} label="Overview" />
              <Tab icon={<TimelineIcon />} label="Performance" />
              <Tab icon={<SettingsIcon />} label="Settings" />
              <Tab icon={<CodeIcon />} label="Macros" />
            </Tabs>

            {/* Overview Tab */}
            {tabValue === 0 && (
              <Box sx={{ py: 2 }}>
                <Grid container spacing={3}>
                  {/* Channel Info Card */}
                  <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                        Channel Information
                      </Typography>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Channel Type
                        </Typography>
                        <Typography variant="body1">
                          {selectedChannel.aliasChannel}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Status
                        </Typography>
                        {renderStatusChip(selectedChannel.status)}
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Created
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(selectedChannel.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Updated
                        </Typography>
                        <Typography variant="body1">
                          {format(new Date(selectedChannel.updatedAt), 'MMM dd, yyyy')}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          Currency
                        </Typography>
                        <Typography variant="body1">
                          {selectedChannel.currency || 'USD'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Metrics Summary Card */}
                  <Grid item xs={12} md={8}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                        Performance Summary (Last 30 Days)
                      </Typography>
                      
                      {metricsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <Grid container spacing={2}>
                          {/* Metrics tiles */}
                          <Grid item xs={6} md={3}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="body2" color="textSecondary">
                                Clicks
                              </Typography>
                              <Typography variant="h6">
                                {formatNumber(calculateAggregatedMetrics().clicks)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="body2" color="textSecondary">
                                Conversions
                              </Typography>
                              <Typography variant="h6">
                                {formatNumber(calculateAggregatedMetrics().conversions)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="body2" color="textSecondary">
                                Revenue
                              </Typography>
                              <Typography variant="h6">
                                {formatCurrency(calculateAggregatedMetrics().revenue, selectedChannel.currency)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="body2" color="textSecondary">
                                Cost
                              </Typography>
                              <Typography variant="h6">
                                {formatCurrency(calculateAggregatedMetrics().cost, selectedChannel.currency)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="body2" color="textSecondary">
                                Profit
                              </Typography>
                              <Typography variant="h6">
                                {formatCurrency(calculateAggregatedMetrics().profit, selectedChannel.currency)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="body2" color="textSecondary">
                                ROI
                              </Typography>
                              <Typography variant="h6">
                                {formatPercentage(calculateDerivedMetrics(calculateAggregatedMetrics()).roi)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="body2" color="textSecondary">
                                Conversion Rate
                              </Typography>
                              <Typography variant="h6">
                                {formatPercentage(calculateDerivedMetrics(calculateAggregatedMetrics()).cr)}
                              </Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={6} md={3}>
                            <Paper variant="outlined" sx={{ p: 1.5, textAlign: 'center' }}>
                              <Typography variant="body2" color="textSecondary">
                                Cost per Click
                              </Typography>
                              <Typography variant="h6">
                                {formatCurrency(calculateDerivedMetrics(calculateAggregatedMetrics()).cpc, selectedChannel.currency)}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>
                      )}
                    </Paper>
                  </Grid>

                  {/* S2S Postback URL Card */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                        S2S Postback URL
                      </Typography>
                      <TextField
                        fullWidth
                        variant="outlined"
                        value={selectedChannel.s2sPostbackUrl || ''}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <Tooltip title="Copy to clipboard">
                              <IconButton
                                edge="end"
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedChannel.s2sPostbackUrl || '');
                                  setSnackbar({ open: true, message: 'URL copied to clipboard', severity: 'success' });
                                }}
                              >
                                <DoneIcon />
                              </IconButton>
                            </Tooltip>
                          ),
                        }}
                      />
                      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        Use this URL as the postback URL in your traffic source settings.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Performance Tab */}
            {tabValue === 1 && (
              <Box sx={{ py: 2 }}>
                <Grid container spacing={3}>
                  {/* Date Range Picker */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          label="Start Date"
                          type="date"
                          value={dateRange.startDate}
                          onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                          sx={{ mr: 2 }}
                        />
                        <TextField
                          label="End Date"
                          type="date"
                          value={dateRange.endDate}
                          onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                          sx={{ mr: 2 }}
                        />
                        <Button 
                          variant="outlined"
                          onClick={() => fetchChannelMetrics(selectedChannel.id)}
                        >
                          Apply
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* Chart Card */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                        Performance Chart
                      </Typography>
                      
                      {metricsLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : !metricsData || metricsData.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <Typography variant="body1" color="textSecondary">
                            No data available for the selected time period.
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ height: 400 }}>
                          <Line data={prepareChartData()} options={chartOptions} />
                        </Box>
                      )}
                    </Paper>
                  </Grid>

                  {/* Data Table Card */}
                  <Grid item xs={12}>
                    <Paper variant="outlined">
                      <TableContainer>
                        <Table size="small">
                          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell align="right">Clicks</TableCell>
                              <TableCell align="right">Conversions</TableCell>
                              <TableCell align="right">Revenue</TableCell>
                              <TableCell align="right">Cost</TableCell>
                              <TableCell align="right">Profit</TableCell>
                              <TableCell align="right">CR (%)</TableCell>
                              <TableCell align="right">CPC</TableCell>
                              <TableCell align="right">ROI (%)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {metricsData && metricsData.length > 0 ? (
                              [...metricsData]
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((metric, index) => {
                                  const derivedMetric = calculateDerivedMetrics(metric);
                                  return (
                                    <TableRow key={index}>
                                      <TableCell>
                                        {format(new Date(metric.date), 'MMM dd, yyyy')}
                                      </TableCell>
                                      <TableCell align="right">{formatNumber(metric.clicks || 0)}</TableCell>
                                      <TableCell align="right">{formatNumber(metric.conversions || 0)}</TableCell>
                                      <TableCell align="right">
                                        {formatCurrency(metric.revenue || 0, selectedChannel.currency)}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatCurrency(metric.cost || 0, selectedChannel.currency)}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatCurrency(metric.profit || 0, selectedChannel.currency)}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatPercentage(derivedMetric.cr || 0)}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatCurrency(derivedMetric.cpc || 0, selectedChannel.currency)}
                                      </TableCell>
                                      <TableCell align="right">
                                        {formatPercentage(derivedMetric.roi || 0)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={9} align="center">
                                  No data available for the selected time period.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Settings Tab */}
            {tabValue === 2 && (
              <Box sx={{ py: 2 }}>
                <Grid container spacing={3}>
                  {/* Channel Settings Card */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                        Channel Settings
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Channel Name"
                            value={selectedChannel.channelName}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Channel Type"
                            value={selectedChannel.aliasChannel}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Currency"
                            value={selectedChannel.currency}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Cost Update Frequency"
                            value={selectedChannel.costUpdateFrequency}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Integration Settings Card */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                        Integration Settings
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            label="S2S Postback URL"
                            value={selectedChannel.s2sPostbackUrl || ''}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Click ID Parameter"
                            value={selectedChannel.clickRefId || '{click_id}'}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="External ID"
                            value={selectedChannel.externalId || ''}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  {/* Facebook Integration Card */}
                  {selectedChannel.aliasChannel.toLowerCase() === 'facebook' && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                          Facebook Integration
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Facebook Pixel ID"
                              value={selectedChannel.pixelId || ''}
                              fullWidth
                              variant="outlined"
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Default Event Name"
                              value={selectedChannel.defaultEventName || 'Purchase'}
                              fullWidth
                              variant="outlined"
                              disabled
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}

                  {/* Google Integration Card */}
                  {selectedChannel.aliasChannel.toLowerCase() === 'google' && (
                    <Grid item xs={12}>
                      <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                          Google Ads Integration
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Google Ads Account ID"
                              value={selectedChannel.googleAdsAccountId || ''}
                              fullWidth
                              variant="outlined"
                              disabled
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField
                              label="Google MCC Account ID"
                              value={selectedChannel.googleMccAccountId || ''}
                              fullWidth
                              variant="outlined"
                              disabled
                            />
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}

                  {/* Conversion Settings Card */}
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                        Conversion Settings
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Default Event Name"
                            value={selectedChannel.defaultEventName || 'Purchase'}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Custom Conversion Matching"
                            value={selectedChannel.customConversionMatching ? 'Enabled' : 'Disabled'}
                            fullWidth
                            variant="outlined"
                            disabled
                          />
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Macros Tab */}
            {tabValue === 3 && (
              <Box sx={{ py: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                    Postback URL with Macros
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={selectedChannel.s2sPostbackUrl || ''}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            edge="end"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedChannel.s2sPostbackUrl || '');
                              setSnackbar({ open: true, message: 'URL copied to clipboard', severity: 'success' });
                            }}
                          >
                            <DoneIcon />
                          </IconButton>
                        </Tooltip>
                      ),
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    Use this URL as the postback URL in your traffic source settings.
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                    Available Macros
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Macro Name</TableCell>
                          <TableCell>Token</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Click ID</TableCell>
                          <TableCell>{'{click_id}'}</TableCell>
                          <TableCell>Unique identifier for the click</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Campaign ID</TableCell>
                          <TableCell>{'{campaign_id}'}</TableCell>
                          <TableCell>Campaign identifier</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Campaign Name</TableCell>
                          <TableCell>{'{campaign_name}'}</TableCell>
                          <TableCell>Campaign name</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Traffic Source</TableCell>
                          <TableCell>{'{traffic_source}'}</TableCell>
                          <TableCell>Name of the traffic source</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Payout</TableCell>
                          <TableCell>{'{payout}'}</TableCell>
                          <TableCell>Conversion payout amount</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Revenue</TableCell>
                          <TableCell>{'{revenue}'}</TableCell>
                          <TableCell>Revenue amount</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>IP</TableCell>
                          <TableCell>{'{ip}'}</TableCell>
                          <TableCell>Visitor IP address</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Country</TableCell>
                          <TableCell>{'{country}'}</TableCell>
                          <TableCell>Visitor country</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                    Custom Parameters (Sub IDs)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Parameter</TableCell>
                          <TableCell>Token</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                          <TableRow key={num}>
                            <TableCell>sub{num}</TableCell>
                            <TableCell>{`{sub${num}}`}</TableCell>
                            <TableCell>Custom parameter {num}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Channel Form Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedChannel ? 'Edit Traffic Channel' : 'Add Traffic Channel'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Basic Information
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Channel Name"
                name="channelName"
                value={formData.channelName}
                onChange={handleFormChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Channel Type</InputLabel>
                <Select
                  name="aliasChannel"
                  value={formData.aliasChannel}
                  onChange={handleFormChange}
                  label="Channel Type"
                >
                  <MenuItem value="Custom">Custom</MenuItem>
                  <MenuItem value="Facebook">Facebook</MenuItem>
                  <MenuItem value="Google">Google</MenuItem>
                  <MenuItem value="Bing">Bing</MenuItem>
                  <MenuItem value="Pinterest">Pinterest</MenuItem>
                  <MenuItem value="TikTok">TikTok</MenuItem>
                  <MenuItem value="Snapchat">Snapchat</MenuItem>
                  <MenuItem value="Twitter">Twitter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Currency</InputLabel>
                <Select
                  name="currency"
                  value={formData.currency}
                  onChange={handleFormChange}
                  label="Currency"
                >
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="CAD">CAD</MenuItem>
                  <MenuItem value="AUD">AUD</MenuItem>
                  <MenuItem value="INR">INR</MenuItem>
                  <MenuItem value="JPY">JPY</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  label="Status"
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Paused">Paused</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Cost Update Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                Cost Update Settings
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Cost Update Frequency</InputLabel>
                <Select
                  name="costUpdateFrequency"
                  value={formData.costUpdateFrequency}
                  onChange={handleFormChange}
                  label="Cost Update Frequency"
                >
                  <MenuItem value="hourly">Hourly</MenuItem>
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="manual">Manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Cost Update Depth (days)"
                name="costUpdateDepth"
                type="number"
                value={formData.costUpdateDepth}
                onChange={handleFormChange}
                fullWidth
              />
            </Grid>

            {/* Integration Settings */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                Integration Settings
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="S2S Postback URL"
                name="s2sPostbackUrl"
                value={formData.s2sPostbackUrl}
                onChange={handleFormChange}
                fullWidth
                placeholder="https://yourdomain.com/track/conversion?click_id={click_id}"
                helperText="URL to receive conversion postbacks. Use macros like {click_id}, {campaign_id}, etc."
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Click ID Parameter"
                name="clickRefId"
                value={formData.clickRefId}
                onChange={handleFormChange}
                fullWidth
                placeholder="{click_id}"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="External ID"
                name="externalId"
                value={formData.externalId}
                onChange={handleFormChange}
                fullWidth
                placeholder="Optional external system ID"
              />
            </Grid>

            {/* Platform-specific settings */}
            {formData.aliasChannel === 'Facebook' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                    Facebook Settings
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Facebook Pixel ID"
                    name="pixelId"
                    value={formData.pixelId}
                    onChange={handleFormChange}
                    fullWidth
                    placeholder="Facebook Pixel ID"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="API Access Token"
                    name="apiAccessToken"
                    value={formData.apiAccessToken}
                    onChange={handleFormChange}
                    fullWidth
                    placeholder="Facebook API Access Token"
                    type="password"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Default Event Name"
                    name="defaultEventName"
                    value={formData.defaultEventName}
                    onChange={handleFormChange}
                    fullWidth
                    placeholder="Purchase"
                  />
                </Grid>
              </>
            )}

            {formData.aliasChannel === 'Google' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 2 }}>
                    Google Ads Settings
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Google Ads Account ID"
                    name="googleAdsAccountId"
                    value={formData.googleAdsAccountId}
                    onChange={handleFormChange}
                    fullWidth
                    placeholder="Google Ads Account ID"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Google MCC Account ID"
                    name="googleMccAccountId"
                    value={formData.googleMccAccountId}
                    onChange={handleFormChange}
                    fullWidth
                    placeholder="Google MCC Account ID (Optional)"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={!formData.channelName}
          >
            {selectedChannel ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TrafficChannels;