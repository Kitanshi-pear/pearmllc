import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { format, subDays, parseISO } from 'date-fns';
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
  FormControlLabel,
  Switch,
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Divider,
  Card,
  CardContent,
  InputAdornment,
  Collapse,
  Checkbox,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  AppBar,
  Toolbar,
  Menu,
  Badge,
  Avatar,
  useTheme,
  useMediaQuery,
  Drawer,
  Breadcrumbs,
  Link,
  Autocomplete,
  ButtonGroup
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Facebook as FacebookIcon,
  Google as GoogleIcon,
  Twitter as TwitterIcon,
  Pinterest as PinterestIcon,
  Instagram as InstagramIcon,
  LinkOff as LinkOffIcon,
  Done as DoneIcon,
  Settings as SettingsIcon,
  BarChart as BarChartIcon,
  Timeline as TimelineIcon,
  FormatListBulleted as ListIcon,
  Code as CodeIcon,
  CopyAll as CopyIcon,
  Analytics as AnalyticsIcon,
  Sync as SyncIcon,
  MonetizationOn as RevenueIcon,
  DoubleArrow as ConversionIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  PauseCircle as PauseCircleIcon,
  Bolt as BoltIcon,
  Description as DocumentIcon,
  DataUsage as DataIcon,
  Campaign as CampaignIcon,
  Hub as HubIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  OpenInNew as OpenInNewIcon,
  ArrowDropDown as ArrowDropDownIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Send as SendIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  SwapHoriz as SwapHorizIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  GroupAdd as GroupAddIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Define API base URL
const API_BASE_URL = '/api/traffic-channels';

// API Service
const TrafficChannelService = {
  // Get all traffic channels
  getAllChannels: () => {
    return axios.get(API_BASE_URL);
  },

  // Get a single traffic channel by ID
  getChannelById: (id, params = {}) => {
    return axios.get(`${API_BASE_URL}/${id}`, { params });
  },

  // Create a new traffic channel
  createChannel: (channelData) => {
    return axios.post(API_BASE_URL, channelData);
  },

  // Update an existing traffic channel
  updateChannel: (id, channelData) => {
    return axios.put(`${API_BASE_URL}/${id}`, channelData);
  },

  // Delete a traffic channel
  deleteChannel: (id) => {
    return axios.delete(`${API_BASE_URL}/${id}`);
  },

  // Get metrics for a traffic channel
  getChannelMetrics: (id, params = {}) => {
    return axios.get(`${API_BASE_URL}/${id}/metrics`, { params });
  },

  // Get macros for a traffic channel
  getChannelMacros: (id) => {
    return axios.get(`${API_BASE_URL}/${id}/macros`);
  },

  // Get external metrics for a traffic channel
  getExternalMetrics: (id) => {
    return axios.get(`${API_BASE_URL}/${id}/external-metrics`);
  },

  // Get conversion settings for a traffic channel
  getConversionSettings: (id) => {
    return axios.get(`${API_BASE_URL}/${id}/conversion-settings`);
  },

  // Update conversion settings for a traffic channel
  updateConversionSettings: (id, settingsData) => {
    return axios.put(`${API_BASE_URL}/${id}/conversion-settings`, settingsData);
  },

  // Test a conversion for a traffic channel
  testConversion: (id, testData = {}) => {
    return axios.post(`${API_BASE_URL}/${id}/test-conversion`, testData);
  },

  // Get conversions for a traffic channel
  getConversions: (id, params = {}) => {
    return axios.get(`${API_BASE_URL}/${id}/conversions`, { params });
  },

  // Check OAuth authentication status
  getAuthStatus: () => {
    return axios.get(`${API_BASE_URL}/auth/status`);
  },

  // Facebook OAuth
  getFacebookAuthUrl: () => {
    return `${API_BASE_URL}/auth/facebook`;
  },

  // Google OAuth
  getGoogleAuthUrl: () => {
    return `${API_BASE_URL}/auth/google`;
  },

  // Disconnect Google OAuth
  disconnectGoogle: () => {
    return axios.post(`${API_BASE_URL}/auth/google/disconnect`);
  }
};

// Helper Components
const LoadingIndicator = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
    <CircularProgress />
  </Box>
);

const EmptyState = ({ title, message, actionText, onAction, icon: Icon }) => (
  <Paper sx={{ p: 4, textAlign: 'center' }}>
    {Icon && <Icon sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, my: 2 }} />}
    <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
      {message}
    </Typography>
    {actionText && (
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<AddIcon />}
        onClick={onAction}
      >
        {actionText}
      </Button>
    )}
  </Paper>
);

const StatusChip = ({ status }) => {
  let color = 'default';
  let icon = null;
  
  if (!status) return null;
  
  switch (status.toLowerCase()) {
    case 'active':
      color = 'success';
      icon = <CheckCircleIcon />;
      break;
    case 'inactive':
      color = 'error';
      icon = <CancelIcon />;
      break;
    case 'paused':
      color = 'warning';
      icon = <PauseCircleIcon />;
      break;
    default:
      color = 'default';
      icon = <InfoIcon />;
  }

  return (
    <Chip 
      label={status} 
      size="small" 
      color={color}
      icon={icon}
      variant="outlined"
    />
  );
};

const ChannelTypeIcon = ({ type }) => {
  if (!type) return null;
  
  switch (type.toLowerCase()) {
    case 'facebook':
      return <FacebookIcon color="primary" />;
    case 'google':
      return <GoogleIcon sx={{ color: '#4285F4' }} />;
    case 'twitter':
      return <TwitterIcon sx={{ color: '#1DA1F2' }} />;
    case 'pinterest':
      return <PinterestIcon sx={{ color: '#E60023' }} />;
    case 'instagram':
      return <InstagramIcon sx={{ color: '#C13584' }} />;
    default:
      return <HubIcon color="action" />;
  }
};

// Metrics Cards
const MetricCard = ({ title, value, icon: Icon, color, secondaryValue, secondaryLabel, isLoading, isPercentage, isCurrency, onClick }) => (
  <Paper 
    variant="outlined" 
    sx={{ 
      p: 2, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': onClick ? { boxShadow: 2 } : {}
    }}
    onClick={onClick}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
      <Typography variant="body2" color="textSecondary">
        {title}
      </Typography>
      {Icon && (
        <Box sx={{ 
          width: 36, 
          height: 36, 
          borderRadius: '50%', 
          backgroundColor: `${color}.light`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center'
        }}>
          <Icon sx={{ color: `${color}.main` }} />
        </Box>
      )}
    </Box>
    
    {isLoading ? (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1 }}>
        <CircularProgress size={24} />
      </Box>
    ) : (
      <>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: 500 }}>
            {isCurrency ? `$${parseFloat(value || 0).toFixed(2)}` : 
             isPercentage ? `${parseFloat(value || 0).toFixed(2)}%` : 
             typeof value === 'number' ? value.toLocaleString() : value || '0'}
          </Typography>
        </Box>
        
        {secondaryValue !== undefined && (
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">{secondaryLabel || 'vs previous'}: </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                ml: 0.5,
                color: parseFloat(secondaryValue) > 0 ? 'success.main' : 
                       parseFloat(secondaryValue) < 0 ? 'error.main' : 'text.secondary'
              }}
            >
              {parseFloat(secondaryValue) > 0 ? '+' : ''}{secondaryValue}
              {isPercentage ? '%' : ''}
            </Typography>
          </Box>
        )}
      </>
    )}
  </Paper>
);

// Traffic Channels Component
const TrafficChannels = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [authStatus, setAuthStatus] = useState({ 
    facebook: { connected: false }, 
    google: { connected: false } 
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  const [detailsView, setDetailsView] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [channelToDelete, setChannelToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [metricsData, setMetricsData] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [macrosData, setMacrosData] = useState(null);
  const [macrosLoading, setMacrosLoading] = useState(false);
  const [externalMetrics, setExternalMetrics] = useState(null);
  const [externalMetricsLoading, setExternalMetricsLoading] = useState(false);
  const [conversionSettings, setConversionSettings] = useState(null);
  const [conversionSettingsLoading, setConversionSettingsLoading] = useState(false);
  const [conversionSettingsFormData, setConversionSettingsFormData] = useState({
    facebook: { enabled: false, pixel_id: '', default_event_name: 'Purchase' },
    google: { enabled: false, ads_account_id: '', conversion_id: '', conversion_label: '' }
  });
  const [conversionTestDialogOpen, setConversionTestDialogOpen] = useState(false);
  const [conversionTestResult, setConversionTestResult] = useState(null);
  const [conversionTestLoading, setConversionTestLoading] = useState(false);
  const [conversionsData, setConversionsData] = useState([]);
  const [conversionsLoading, setConversionsLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [settingsSuccess, setSettingsSuccess] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelTypeFilter, setChannelTypeFilter] = useState('all');
  const [actionMenuAnchorEl, setActionMenuAnchorEl] = useState(null);
  const [selectedChannelForActions, setSelectedChannelForActions] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'channelName', direction: 'asc' });
  
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

  // Channel types available for selection
  const channelTypes = [
    { value: 'Custom', label: 'Custom' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Google', label: 'Google' },
    { value: 'Twitter', label: 'Twitter' },
    { value: 'Pinterest', label: 'Pinterest' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'Snapchat', label: 'Snapchat' },
    { value: 'Instagram', label: 'Instagram' },
    { value: 'LinkedIn', label: 'LinkedIn' },
    { value: 'Bing', label: 'Bing' },
    { value: 'Yahoo', label: 'Yahoo' },
    { value: 'Taboola', label: 'Taboola' },
    { value: 'Outbrain', label: 'Outbrain' },
    { value: 'Propeller', label: 'Propeller' }
  ];

  // Currencies available for selection
  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' },
    { value: 'JPY', label: 'JPY - Japanese Yen' },
    { value: 'CNY', label: 'CNY - Chinese Yuan' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'BRL', label: 'BRL - Brazilian Real' },
    { value: 'RUB', label: 'RUB - Russian Ruble' }
  ];

  // Cost update frequencies
  const costUpdateFrequencies = [
    { value: 'hourly', label: 'Hourly' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'manual', label: 'Manual' }
  ];

  // Fetch all channels on component mount
  useEffect(() => {
    fetchChannels();
    checkAuthStatus();
  }, []);

  // Fetch all channels from API
  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await TrafficChannelService.getAllChannels();
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
      const response = await TrafficChannelService.getAuthStatus();
      setAuthStatus(response.data);
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  };

  // Format currency
  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value || 0);
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(2)}%`;
  };

  // Format number with comma separators
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  // Calculate derived metrics
  const calculateDerivedMetrics = (metrics) => {
    if (!metrics) return {};
    
    const { clicks, conversions, revenue, cost } = metrics;
    
    // Prevent division by zero
    const clicksNonZero = clicks > 0 ? clicks : 1;
    const costNonZero = cost > 0 ? cost : 1;
    
    const cr = (conversions / clicksNonZero) * 100;
    const cpc = cost / clicksNonZero;
    const rpc = revenue / clicksNonZero;
    const roi = ((revenue - cost) / costNonZero) * 100;
    const profit = revenue - cost;

    return {
      ...metrics,
      cr,
      cpc,
      rpc,
      roi,
      profit
    };
  };

  // Calculate aggregated metrics from metricsData
  const calculateAggregatedMetrics = () => {
    if (!metricsData || metricsData.length === 0) return {
      clicks: 0,
      conversions: 0,
      revenue: 0,
      cost: 0,
      profit: 0
    };

    return metricsData.reduce((total, metric) => {
      return {
        clicks: total.clicks + (metric.clicks || 0),
        conversions: total.conversions + (metric.conversions || 0),
        revenue: total.revenue + (metric.revenue || 0),
        cost: total.cost + (metric.cost || 0),
        profit: total.profit + ((metric.revenue || 0) - (metric.cost || 0))
      };
    }, {
      clicks: 0,
      conversions: 0,
      revenue: 0,
      cost: 0,
      profit: 0
    });
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
    setChannelDialogOpen(true);
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
      s2sPostbackUrl: channel.s2sPostbackUrl || '',
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
    setChannelDialogOpen(true);
  };

  // Handle form submission
  const handleSubmitChannelForm = async () => {
    try {
      if (selectedChannel) {
        // Update existing channel
        await TrafficChannelService.updateChannel(selectedChannel.id, formData);
        setSnackbar({ 
          open: true, 
          message: 'Traffic channel updated successfully', 
          severity: 'success' 
        });
      } else {
        // Create new channel
        await TrafficChannelService.createChannel(formData);
        setSnackbar({ 
          open: true, 
          message: 'Traffic channel created successfully', 
          severity: 'success' 
        });
      }
      setChannelDialogOpen(false);
      fetchChannels();
    } catch (err) {
      console.error('Error saving channel:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to save traffic channel', 
        severity: 'error' 
      });
    }
  };

  // Open delete confirmation dialog
  const handleDeleteConfirmation = (channel) => {
    setChannelToDelete(channel);
    setDeleteDialogOpen(true);
  };

  // Handle channel deletion
  const handleDeleteChannel = async () => {
    if (!channelToDelete) return;
    
    try {
      await TrafficChannelService.deleteChannel(channelToDelete.id);
      setSnackbar({ 
        open: true, 
        message: 'Traffic channel deleted successfully', 
        severity: 'success' 
      });
      fetchChannels();
      
      // If we deleted the currently selected channel, go back to list view
      if (selectedChannel && selectedChannel.id === channelToDelete.id) {
        handleBackToList();
      }
    } catch (err) {
      console.error('Error deleting channel:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to delete traffic channel', 
        severity: 'error' 
      });
    }
    
    setDeleteDialogOpen(false);
    setChannelToDelete(null);
  };

  // Initiate Facebook OAuth
  const handleFacebookConnect = () => {
    window.location.href = TrafficChannelService.getFacebookAuthUrl();
  };

  // Initiate Google OAuth
  const handleGoogleConnect = () => {
    window.location.href = TrafficChannelService.getGoogleAuthUrl();
  };

  // Disconnect Google OAuth
  const handleGoogleDisconnect = async () => {
    try {
      await TrafficChannelService.disconnectGoogle();
      setSnackbar({ 
        open: true, 
        message: 'Google account disconnected', 
        severity: 'success' 
      });
      checkAuthStatus();
    } catch (err) {
      console.error('Error disconnecting Google:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to disconnect Google account', 
        severity: 'error' 
      });
    }
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Load tab-specific data
    if (selectedChannel) {
      if (newValue === 0) {
        // Overview tab
        fetchChannelMetrics(selectedChannel.id);
      } else if (newValue === 1) {
        // Performance tab
        fetchChannelMetrics(selectedChannel.id);
      } else if (newValue === 2) {
        // Settings tab - no special loading needed
      } else if (newValue === 3) {
        // Macros tab
        fetchChannelMacros(selectedChannel.id);
      } else if (newValue === 4) {
        // Conversions tab
        fetchConversionSettings(selectedChannel.id);
        fetchConversions(selectedChannel.id);
      } else if (newValue === 5) {
        // External tab
        fetchExternalMetrics(selectedChannel.id);
      }
    }
  };

  // View channel details
  const handleViewChannel = (channel) => {
    setSelectedChannel(channel);
    setDetailsView(true);
    setTabValue(0); // Reset to overview tab
    
    // Fetch metrics for this channel
    fetchChannelMetrics(channel.id);
  };

  // Go back to channel list
  const handleBackToList = () => {
    setSelectedChannel(null);
    setDetailsView(false);
    setTabValue(0);
  };

  // Fetch channel metrics
  const fetchChannelMetrics = async (channelId) => {
    if (!channelId) return;
    
    setMetricsLoading(true);
    try {
      const response = await TrafficChannelService.getChannelMetrics(channelId, {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        dimension: 'day'
      });
      setMetricsData(response.data);
      setMetricsLoading(false);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setMetricsLoading(false);
    }
  };

  // Fetch channel macros
  const fetchChannelMacros = async (channelId) => {
    if (!channelId) return;
    
    setMacrosLoading(true);
    try {
      const response = await TrafficChannelService.getChannelMacros(channelId);
      setMacrosData(response.data);
      setMacrosLoading(false);
    } catch (err) {
      console.error('Error fetching macros:', err);
      setMacrosLoading(false);
    }
  };

  // Fetch external metrics
  const fetchExternalMetrics = async (channelId) => {
    if (!channelId) return;
    
    setExternalMetricsLoading(true);
    try {
      const response = await TrafficChannelService.getExternalMetrics(channelId);
      setExternalMetrics(response.data);
      setExternalMetricsLoading(false);
    } catch (err) {
      console.error('Error fetching external metrics:', err);
      setExternalMetricsLoading(false);
    }
  };

  // Fetch conversion settings
  const fetchConversionSettings = async (channelId) => {
    if (!channelId) return;
    
    setConversionSettingsLoading(true);
    try {
      const response = await TrafficChannelService.getConversionSettings(channelId);
      setConversionSettings(response.data);
      
      // Update form data
      setConversionSettingsFormData({
        facebook: {
          enabled: !!response.data.facebook.enabled,
          pixel_id: response.data.facebook.pixel_id || '',
          default_event_name: response.data.facebook.default_event_name || 'Purchase'
        },
        google: {
          enabled: !!response.data.google.enabled,
          ads_account_id: response.data.google.ads_account_id || '',
          conversion_id: response.data.google.conversion_id || '',
          conversion_label: response.data.google.conversion_label || ''
        }
      });
      
      setConversionSettingsLoading(false);
    } catch (err) {
      console.error('Error fetching conversion settings:', err);
      setConversionSettingsLoading(false);
    }
  };

  // Fetch conversions
  const fetchConversions = async (channelId) => {
    if (!channelId) return;
    
    setConversionsLoading(true);
    try {
      const response = await TrafficChannelService.getConversions(channelId, {
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        limit: 50
      });
      setConversionsData(response.data.conversions || []);
      setConversionsLoading(false);
    } catch (err) {
      console.error('Error fetching conversions:', err);
      setConversionsLoading(false);
    }
  };

  // Handle conversion settings form change
  const handleConversionSettingsChange = (platform, field, value) => {
    setConversionSettingsFormData(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value
      }
    }));
  };

  // Save conversion settings
  const handleSaveConversionSettings = async () => {
    if (!selectedChannel) return;
    
    setConversionSettingsLoading(true);
    setSettingsSuccess(null);
    
    try {
      const requestData = {
        forward_to_facebook: conversionSettingsFormData.facebook.enabled,
        forward_to_google: conversionSettingsFormData.google.enabled,
        pixel_id: conversionSettingsFormData.facebook.pixel_id,
        default_event_name: conversionSettingsFormData.facebook.default_event_name,
        conversion_id: conversionSettingsFormData.google.conversion_id,
        conversion_label: conversionSettingsFormData.google.conversion_label
      };
      
      await TrafficChannelService.updateConversionSettings(selectedChannel.id, requestData);
      setSettingsSuccess('Conversion settings updated successfully');
      fetchConversionSettings(selectedChannel.id);
    } catch (err) {
      console.error('Error saving conversion settings:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to save conversion settings', 
        severity: 'error' 
      });
      setConversionSettingsLoading(false);
    }
  };

  // Test conversion
  const handleTestConversion = async () => {
    if (!selectedChannel) return;
    
    setConversionTestLoading(true);
    try {
      const response = await TrafficChannelService.testConversion(selectedChannel.id);
      setConversionTestResult(response.data);
      setConversionTestDialogOpen(true);
      setConversionTestLoading(false);
    } catch (err) {
      console.error('Error testing conversion:', err);
      setSnackbar({ 
        open: true, 
        message: 'Failed to test conversion', 
        severity: 'error' 
      });
      setConversionTestLoading(false);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply date range filter
  const applyDateRangeFilter = () => {
    if (selectedChannel) {
      fetchChannelMetrics(selectedChannel.id);
      fetchConversions(selectedChannel.id);
    }
  };

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Toggle filters drawer
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  // Handle channel type filter change
  const handleChannelTypeFilterChange = (e) => {
    setChannelTypeFilter(e.target.value);
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('all');
    setChannelTypeFilter('all');
    setSearchQuery('');
  };

  // Open actions menu
  const handleActionsMenuOpen = (event, channel) => {
    event.stopPropagation();
    setActionMenuAnchorEl(event.currentTarget);
    setSelectedChannelForActions(channel);
  };

  // Close actions menu
  const handleActionsMenuClose = () => {
    setActionMenuAnchorEl(null);
    setSelectedChannelForActions(null);
  };

  // Copy postback URL to clipboard
  const copyPostbackUrl = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ 
      open: true, 
      message: 'Postback URL copied to clipboard', 
      severity: 'success' 
    });
  };

  // Handle table sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get CSS class for sort headers
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  // Filter and sort channels
  const filteredAndSortedChannels = useMemo(() => {
    let result = [...channels];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(channel => 
        channel.channelName.toLowerCase().includes(query) ||
        channel.aliasChannel.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(channel => 
        channel.status && channel.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Apply channel type filter
    if (channelTypeFilter !== 'all') {
      result = result.filter(channel => 
        channel.aliasChannel && channel.aliasChannel.toLowerCase() === channelTypeFilter.toLowerCase()
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return result;
  }, [channels, searchQuery, statusFilter, channelTypeFilter, sortConfig]);

  // Prepare chart data
  const prepareChartData = useCallback(() => {
    if (!metricsData || metricsData.length === 0) return null;

    // Sort metrics by date
    const sortedMetrics = [...metricsData].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return {
      labels: sortedMetrics.map(metric => format(new Date(metric.date), 'MMM dd')),
      datasets: [
        {
          label: 'Clicks',
          data: sortedMetrics.map(metric => metric.clicks || 0),
          borderColor: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Conversions',
          data: sortedMetrics.map(metric => metric.conversions || 0),
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        },
        {
          label: 'Revenue',
          data: sortedMetrics.map(metric => metric.revenue || 0),
          borderColor: '#ff9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [metricsData]);

  // Prepare chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.yAxisID === 'y1') {
              label += new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: selectedChannel?.currency || 'USD'
              }).format(context.parsed.y);
            } else {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Clicks & Conversions'
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      y1: {
        beginAtZero: true,
        position: 'right',
        title: {
          display: true,
          text: `Revenue (${selectedChannel?.currency || 'USD'})`
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };
  
  // Render channel form
  const renderChannelForm = () => (
    <>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 2 }}>
            Basic Information
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Channel Name"
            name="channelName"
            value={formData.channelName}
            onChange={handleFormChange}
            fullWidth
            required
            variant="outlined"
            error={!formData.channelName}
            helperText={!formData.channelName ? "Channel name is required" : ""}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required variant="outlined">
            <InputLabel>Channel Type</InputLabel>
            <Select
              name="aliasChannel"
              value={formData.aliasChannel}
              onChange={handleFormChange}
              label="Channel Type"
            >
              {channelTypes.map(type => (
                <MenuItem key={type.value} value={type.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ChannelTypeIcon type={type.value} />
                    <Box sx={{ ml: 1 }}>{type.label}</Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required variant="outlined">
            <InputLabel>Currency</InputLabel>
            <Select
              name="currency"
              value={formData.currency}
              onChange={handleFormChange}
              label="Currency"
            >
              {currencies.map(currency => (
                <MenuItem key={currency.value} value={currency.value}>
                  {currency.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required variant="outlined">
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
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mt: 2, mb: 2 }}>
            Cost Update Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Cost Update Frequency</InputLabel>
            <Select
              name="costUpdateFrequency"
              value={formData.costUpdateFrequency}
              onChange={handleFormChange}
              label="Cost Update Frequency"
            >
              {costUpdateFrequencies.map(frequency => (
                <MenuItem key={frequency.value} value={frequency.value}>
                  {frequency.label}
                </MenuItem>
              ))}
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
            variant="outlined"
            InputProps={{
              inputProps: { min: 1, max: 365 }
            }}
          />
        </Grid>

        {/* Integration Settings */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, mt: 2, mb: 2 }}>
            Integration Settings
          </Typography>
          <Divider sx={{ mb: 2 }} />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            label="S2S Postback URL"
            name="s2sPostbackUrl"
            value={formData.s2sPostbackUrl}
            onChange={handleFormChange}
            fullWidth
            variant="outlined"
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
            variant="outlined"
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
            variant="outlined"
            placeholder="Optional external system ID"
          />
        </Grid>

        {/* Platform-specific settings */}
        {formData.aliasChannel === 'Facebook' && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mt: 2, mb: 2 }}>
                Facebook Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Facebook Pixel ID"
                name="pixelId"
                value={formData.pixelId}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
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
                variant="outlined"
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
                variant="outlined"
                placeholder="Purchase"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.customConversionMatching}
                    onChange={handleFormChange}
                    name="customConversionMatching"
                    color="primary"
                  />
                }
                label="Enable Custom Conversion Matching"
              />
            </Grid>
          </>
        )}

        {formData.aliasChannel === 'Google' && (
          <>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mt: 2, mb: 2 }}>
                Google Ads Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Google Ads Account ID"
                name="googleAdsAccountId"
                value={formData.googleAdsAccountId}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
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
                variant="outlined"
                placeholder="Google MCC Account ID (Optional)"
              />
            </Grid>
          </>
        )}
      </Grid>
    </>
  );

  // Render API connections
  const renderApiConnections = () => (
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
  );

  // Render channel list
  const renderChannelListTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell 
              onClick={() => handleSort('channelName')}
              sx={{ cursor: 'pointer' }}
            >
              Name {getSortDirectionIndicator('channelName')}
            </TableCell>
            <TableCell 
              onClick={() => handleSort('aliasChannel')}
              sx={{ cursor: 'pointer' }}
            >
              Type {getSortDirectionIndicator('aliasChannel')}
            </TableCell>
            <TableCell align="right">Clicks</TableCell>
            <TableCell align="right">Conversions</TableCell>
            <TableCell align="right">Revenue</TableCell>
            <TableCell align="right">Cost</TableCell>
            <TableCell align="right">Profit</TableCell>
            <TableCell align="right">ROI</TableCell>
            <TableCell 
              align="right"
              onClick={() => handleSort('status')}
              sx={{ cursor: 'pointer' }}
            >
              Status {getSortDirectionIndicator('status')}
            </TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredAndSortedChannels.map((channel) => {
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
                    <ChannelTypeIcon type={channel.aliasChannel} />
                    <Typography sx={{ ml: 1 }}>
                      {channel.channelName}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{channel.aliasChannel}</TableCell>
                <TableCell align="right">{formatNumber(metrics.clicks)}</TableCell>
                <TableCell align="right">{formatNumber(metrics.conversions)}</TableCell>
                <TableCell align="right">{formatCurrency(metrics.revenue, channel.currency)}</TableCell>
                <TableCell align="right">{formatCurrency(metrics.cost, channel.currency)}</TableCell>
                <TableCell align="right">{formatCurrency(derivedMetrics.profit, channel.currency)}</TableCell>
                <TableCell align="right">{formatPercentage(derivedMetrics.roi)}</TableCell>
                <TableCell align="right">
                  <StatusChip status={channel.status} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="More Actions">
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleActionsMenuOpen(e, channel)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // Render overview tab
  const renderOverviewTab = () => {
    const aggregatedMetrics = calculateAggregatedMetrics();
    const derivedMetrics = calculateDerivedMetrics(aggregatedMetrics);

    return (
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
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <ChannelTypeIcon type={selectedChannel.aliasChannel} />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    {selectedChannel.aliasChannel}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="textSecondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusChip status={selectedChannel.status} />
                </Box>
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
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditChannel(selectedChannel)}
                >
                  Edit Channel
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteConfirmation(selectedChannel)}
                >
                  Delete
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Metrics Summary Cards */}
          <Grid item xs={12} md={8}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                Performance Summary ({format(new Date(dateRange.startDate), 'MMM dd')} - {format(new Date(dateRange.endDate), 'MMM dd')})
              </Typography>
              
              {metricsLoading ? (
                <LoadingIndicator />
              ) : (
                <Grid container spacing={2}>
                  {/* Metrics tiles */}
                  <Grid item xs={6} md={3}>
                    <MetricCard 
                      title="Clicks"
                      value={aggregatedMetrics.clicks}
                      icon={AnalyticsIcon}
                      color="primary"
                      isLoading={metricsLoading}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard 
                      title="Conversions"
                      value={aggregatedMetrics.conversions}
                      icon={ConversionIcon}
                      color="success"
                      isLoading={metricsLoading}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard 
                      title="Revenue"
                      value={aggregatedMetrics.revenue}
                      icon={RevenueIcon}
                      color="warning"
                      isLoading={metricsLoading}
                      isCurrency={true}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard 
                      title="Cost"
                      value={aggregatedMetrics.cost}
                      icon={MonetizationOn}
                      color="error"
                      isLoading={metricsLoading}
                      isCurrency={true}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard 
                      title="Profit"
                      value={derivedMetrics.profit}
                      icon={RevenueIcon}
                      color="info"
                      isLoading={metricsLoading}
                      isCurrency={true}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard 
                      title="ROI"
                      value={derivedMetrics.roi}
                      icon={DataIcon}
                      color="secondary"
                      isLoading={metricsLoading}
                      isPercentage={true}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard 
                      title="Conv. Rate"
                      value={derivedMetrics.cr}
                      icon={BoltIcon}
                      color="success"
                      isLoading={metricsLoading}
                      isPercentage={true}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <MetricCard 
                      title="Cost per Click"
                      value={derivedMetrics.cpc}
                      icon={MonetizationOn}
                      color="warning"
                      isLoading={metricsLoading}
                      isCurrency={true}
                    />
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>

          {/* S2S Postback URL Card */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  S2S Postback URL
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<CopyIcon />}
                  onClick={() => copyPostbackUrl(selectedChannel.s2sPostbackUrl || '')}
                >
                  Copy URL
                </Button>
              </Box>
              <TextField
                fullWidth
                variant="outlined"
                value={selectedChannel.s2sPostbackUrl || ''}
                InputProps={{
                  readOnly: true
                }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                Use this URL as the postback URL in your traffic source settings. Replace {'{click_id}'} with your traffic source's click ID parameter.
              </Typography>
            </Paper>
          </Grid>

          {/* Performance Chart */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                Performance Chart
              </Typography>
              
              <Box sx={{ display: 'flex', mb: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={new Date(dateRange.startDate)}
                    onChange={(date) => handleDateRangeChange('startDate', format(date, 'yyyy-MM-dd'))}
                    renderInput={(params) => <TextField {...params} sx={{ mr: 2 }} />}
                  />
                  <DatePicker
                    label="End Date"
                    value={new Date(dateRange.endDate)}
                    onChange={(date) => handleDateRangeChange('endDate', format(date, 'yyyy-MM-dd'))}
                    renderInput={(params) => <TextField {...params} sx={{ mr: 2 }} />}
                  />
                </LocalizationProvider>
                <Button 
                  variant="outlined" 
                  onClick={applyDateRangeFilter}
                >
                  Apply
                </Button>
              </Box>
              
              {metricsLoading ? (
                <LoadingIndicator />
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
        </Grid>
      </Box>
    );
  };

  // Render performance tab
  const renderPerformanceTab = () => {
    return (
      <Box sx={{ py: 2 }}>
        <Grid container spacing={3}>
          {/* Date Range Picker */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={new Date(dateRange.startDate)}
                    onChange={(date) => handleDateRangeChange('startDate', format(date, 'yyyy-MM-dd'))}
                    renderInput={(params) => <TextField {...params} sx={{ mr: 2 }} />}
                  />
                  <DatePicker
                    label="End Date"
                    value={new Date(dateRange.endDate)}
                    onChange={(date) => handleDateRangeChange('endDate', format(date, 'yyyy-MM-dd'))}
                    renderInput={(params) => <TextField {...params} sx={{ mr: 2 }} />}
                  />
                </LocalizationProvider>
                <Button 
                  variant="outlined"
                  onClick={applyDateRangeFilter}
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
                <LoadingIndicator />
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
                              <TableCell align="right">{formatNumber(metric.clicks)}</TableCell>
                              <TableCell align="right">{formatNumber(metric.conversions)}</TableCell>
                              <TableCell align="right">
                                {formatCurrency(metric.revenue, selectedChannel.currency)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(metric.cost, selectedChannel.currency)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(derivedMetric.profit, selectedChannel.currency)}
                              </TableCell>
                              <TableCell align="right">
                                {formatPercentage(derivedMetric.cr)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(derivedMetric.cpc, selectedChannel.currency)}
                              </TableCell>
                              <TableCell align="right">
                                {formatPercentage(derivedMetric.roi)}
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
    );
  };

  // Render settings tab
  const renderSettingsTab = () => {
    return (
      <Box sx={{ py: 2 }}>
        <Grid container spacing={3}>
          {/* Channel Settings Card */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  Channel Settings
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => handleEditChannel(selectedChannel)}
                >
                  Edit Settings
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Channel Name"
                    value={selectedChannel.channelName}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Channel Type"
                    value={selectedChannel.aliasChannel}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Currency"
                    value={selectedChannel.currency}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Cost Update Frequency"
                    value={selectedChannel.costUpdateFrequency}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Cost Update Depth"
                    value={`${selectedChannel.costUpdateDepth} days`}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Status"
                    value={selectedChannel.status}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
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
                    InputProps={{ 
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copy to clipboard">
                            <IconButton
                              edge="end"
                              onClick={() => copyPostbackUrl(selectedChannel.s2sPostbackUrl || '')}
                            >
                              <CopyIcon />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Click ID Parameter"
                    value={selectedChannel.clickRefId || '{click_id}'}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="External ID"
                    value={selectedChannel.externalId || ''}
                    fullWidth
                    variant="outlined"
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Platform-specific integration settings */}
          {selectedChannel.aliasChannel === 'Facebook' && (
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
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Default Event Name"
                      value={selectedChannel.defaultEventName || 'Purchase'}
                      fullWidth
                      variant="outlined"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={!!selectedChannel.customConversionMatching}
                          disabled
                        />
                      }
                      label="Custom Conversion Matching"
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          {selectedChannel.aliasChannel === 'Google' && (
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
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Google MCC Account ID"
                      value={selectedChannel.googleMccAccountId || ''}
                      fullWidth
                      variant="outlined"
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  // Render macros tab
  const renderMacrosTab = () => {
    return (
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
                <InputAdornment position="end">
                  <Tooltip title="Copy to clipboard">
                    <IconButton
                      edge="end"
                      onClick={() => copyPostbackUrl(selectedChannel.s2sPostbackUrl || '')}
                    >
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              )
            }}
          />
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Use this URL as the postback URL in your traffic source settings.
          </Typography>
        </Paper>

        {macrosLoading ? (
          <LoadingIndicator />
        ) : !macrosData ? (
          <Alert severity="info">
            No macros data available. Click "Load Macros" to fetch macro information.
          </Alert>
        ) : (
          <>
            <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                System Macros
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Macro Name</TableCell>
                      <TableCell>Token</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Detected</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {macrosData.systemMacros ? (
                      macrosData.systemMacros.map((macro, index) => (
                        <TableRow key={index}>
                          <TableCell>{macro.name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <code>{macro.token}</code>
                              <IconButton 
                                size="small" 
                                onClick={() => copyPostbackUrl(macro.token)}
                                sx={{ ml: 1 }}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>{macro.description}</TableCell>
                          <TableCell align="center">
                            {macro.detected ? (
                              <CheckCircleIcon color="success" />
                            ) : (
                              <CancelIcon color="disabled" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No system macros available.
                        </TableCell>
                      </TableRow>
                    )}
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
                      <TableCell>Sample Values</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {macrosData.subMacros ? (
                      macrosData.subMacros.map((macro, index) => (
                        <TableRow key={index}>
                          <TableCell>{macro.name}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <code>{macro.token}</code>
                              <IconButton 
                                size="small" 
                                onClick={() => copyPostbackUrl(macro.token)}
                                sx={{ ml: 1 }}
                              >
                                <CopyIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell>{macro.description}</TableCell>
                          <TableCell>
                            {macro.samples && macro.samples.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {macro.samples.map((sample, i) => (
                                  <Chip 
                                    key={i} 
                                    label={sample} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="textSecondary">
                                No samples available
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          No custom parameters available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}
        
        {!macrosData && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => fetchChannelMacros(selectedChannel.id)}
              startIcon={<RefreshIcon />}
            >
              Load Macros
            </Button>
          </Box>
        )}
      </Box>
    );
  };

  // Render conversions tab
  const renderConversionsTab = () => {
    return (
      <Box sx={{ py: 2 }}>
        <Tabs value={tabValue === 4 ? 0 : 1} sx={{ mb: 3 }}>
          <Tab label="Conversion Settings" />
          <Tab label="Conversion Log" />
        </Tabs>
        
        {/* Conversion Settings */}
        {tabValue === 4 && (
          <>
            {settingsSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {settingsSuccess}
              </Alert>
            )}
            
            {conversionSettingsLoading ? (
              <LoadingIndicator />
            ) : !conversionSettings ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                No conversion settings available. Click "Load Settings" to fetch settings.
              </Alert>
            ) : (
              <>
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FacebookIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Facebook Ads Conversion API</Typography>
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={conversionSettingsFormData.facebook.enabled}
                        onChange={(e) => handleConversionSettingsChange('facebook', 'enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Forward Conversions to Facebook"
                    sx={{ mb: 2 }}
                  />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Facebook Pixel ID"
                        value={conversionSettingsFormData.facebook.pixel_id}
                        onChange={(e) => handleConversionSettingsChange('facebook', 'pixel_id', e.target.value)}
                        disabled={!conversionSettingsFormData.facebook.enabled}
                        fullWidth
                        margin="normal"
                        helperText="Enter your Facebook Pixel ID"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Default Event Name"
                        value={conversionSettingsFormData.facebook.default_event_name}
                        onChange={(e) => handleConversionSettingsChange('facebook', 'default_event_name', e.target.value)}
                        disabled={!conversionSettingsFormData.facebook.enabled}
                        fullWidth
                        margin="normal"
                        helperText="Default event name for conversions (e.g. Purchase)"
                      />
                    </Grid>
                  </Grid>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Status: {conversionSettings && conversionSettings.facebook.has_token ? 
                      'Connected to Facebook' : 'Not connected to Facebook API'}
                  </Typography>
                </Paper>
                
                <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GoogleIcon sx={{ mr: 1, color: '#4285F4' }} />
                    <Typography variant="h6">Google Ads Conversion API</Typography>
                  </Box>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={conversionSettingsFormData.google.enabled}
                        onChange={(e) => handleConversionSettingsChange('google', 'enabled', e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Forward Conversions to Google"
                    sx={{ mb: 2 }}
                  />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Google Ads Account ID"
                        value={conversionSettingsFormData.google.ads_account_id}
                        onChange={(e) => handleConversionSettingsChange('google', 'ads_account_id', e.target.value)}
                        disabled={!conversionSettingsFormData.google.enabled}
                        fullWidth
                        margin="normal"
                        helperText="Enter your Google Ads Account ID (without dashes)"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Conversion ID"
                        value={conversionSettingsFormData.google.conversion_id}
                        onChange={(e) => handleConversionSettingsChange('google', 'conversion_id', e.target.value)}
                        disabled={!conversionSettingsFormData.google.enabled}
                        fullWidth
                        margin="normal"
                        helperText="Google Ads Conversion ID"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Conversion Label"
                        value={conversionSettingsFormData.google.conversion_label}
                        onChange={(e) => handleConversionSettingsChange('google', 'conversion_label', e.target.value)}
                        disabled={!conversionSettingsFormData.google.enabled}
                        fullWidth
                        margin="normal"
                        helperText="Google Ads Conversion Label"
                      />
                    </Grid>
                  </Grid>
                </Paper>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button
                    variant="outlined"
                    startIcon={<BoltIcon />}
                    onClick={handleTestConversion}
                    disabled={conversionSettingsLoading}
                  >
                    Test Conversion
                  </Button>
                  
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveConversionSettings}
                    disabled={conversionSettingsLoading}
                  >
                    Save Settings
                  </Button>
                </Box>
              </>
            )}
            
            {!conversionSettings && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => fetchConversionSettings(selectedChannel.id)}
                  startIcon={<RefreshIcon />}
                >
                  Load Settings
                </Button>
              </Box>
            )}
          </>
        )}
        
        {/* Conversion Log */}
        {tabValue === 5 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h3">
                Conversion Log
              </Typography>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => fetchConversions(selectedChannel.id)}
                disabled={conversionsLoading}
              >
                Refresh
              </Button>
            </Box>
            
            {conversionsLoading ? (
              <LoadingIndicator />
            ) : !conversionsData || conversionsData.length === 0 ? (
              <Alert severity="info">
                No conversions found for the selected time period.
              </Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Click ID</TableCell>
                      <TableCell>Campaign</TableCell>
                      <TableCell>Event</TableCell>
                      <TableCell align="right">Payout</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                      <TableCell align="right">Profit</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {conversionsData.map((conversion) => (
                      <TableRow key={conversion.id}>
                        <TableCell>
                          {format(new Date(conversion.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Tooltip title={conversion.click_id}>
                            <span>{conversion.click_id.substring(0, 10)}...</span>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {conversion.campaign ? conversion.campaign.name : 'N/A'}
                        </TableCell>
                        <TableCell>{conversion.event_name || 'Purchase'}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(conversion.payout, selectedChannel.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(conversion.revenue, selectedChannel.currency)}
                        </TableCell>
                        <TableCell align="right">
                          {formatCurrency(conversion.profit, selectedChannel.currency)}
                        </TableCell>
                        <TableCell align="right">
                          <StatusChip status={conversion.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Box>
    );
  };

  // Render external metrics tab
  const renderExternalTab = () => {
    return (
      <Box sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" component="h3">
            External Metrics
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => fetchExternalMetrics(selectedChannel.id)}
            disabled={externalMetricsLoading}
          >
            Refresh
          </Button>
        </Box>
        
        {externalMetricsLoading ? (
          <LoadingIndicator />
        ) : !externalMetrics ? (
          <Alert severity="info">
            No external metrics available. Click "Refresh" to fetch external metrics.
          </Alert>
        ) : (
          <>
            {/* Platform-specific metrics */}
            {selectedChannel.aliasChannel === 'Facebook' && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FacebookIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Facebook Ad Campaigns</Typography>
                </Box>
                
                {externalMetrics.campaigns && externalMetrics.campaigns.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Campaign Name</TableCell>
                          <TableCell align="right">Clicks</TableCell>
                          <TableCell align="right">Impressions</TableCell>
                          <TableCell align="right">CTR</TableCell>
                          <TableCell align="right">Cost</TableCell>
                          <TableCell align="right">CPC</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {externalMetrics.campaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell>{campaign.name}</TableCell>
                            <TableCell align="right">{formatNumber(campaign.clicks)}</TableCell>
                            <TableCell align="right">{formatNumber(campaign.impressions)}</TableCell>
                            <TableCell align="right">{formatPercentage(campaign.ctr)}</TableCell>
                            <TableCell align="right">{formatCurrency(campaign.cost)}</TableCell>
                            <TableCell align="right">{formatCurrency(campaign.cpc)}</TableCell>
                            <TableCell align="right">
                              <StatusChip status={campaign.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    Connect your Facebook Ads account to import campaign data.
                  </Alert>
                )}
              </Paper>
            )}
            
            {selectedChannel.aliasChannel === 'Google' && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <GoogleIcon sx={{ mr: 1, color: '#4285F4' }} />
                  <Typography variant="h6">Google Ad Campaigns</Typography>
                </Box>
                
                {externalMetrics.campaigns && externalMetrics.campaigns.length > 0 ? (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell>Campaign Name</TableCell>
                          <TableCell align="right">Clicks</TableCell>
                          <TableCell align="right">Impressions</TableCell>
                          <TableCell align="right">CTR</TableCell>
                          <TableCell align="right">Cost</TableCell>
                          <TableCell align="right">CPC</TableCell>
                          <TableCell align="right">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {externalMetrics.campaigns.map((campaign) => (
                          <TableRow key={campaign.id}>
                            <TableCell>{campaign.name}</TableCell>
                            <TableCell align="right">{formatNumber(campaign.clicks)}</TableCell>
                            <TableCell align="right">{formatNumber(campaign.impressions)}</TableCell>
                            <TableCell align="right">{formatPercentage(campaign.ctr)}</TableCell>
                            <TableCell align="right">{formatCurrency(campaign.cost)}</TableCell>
                            <TableCell align="right">{formatCurrency(campaign.cpc)}</TableCell>
                            <TableCell align="right">
                              <StatusChip status={campaign.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    Connect your Google Ads account to import campaign data.
                  </Alert>
                )}
              </Paper>
            )}
            
            {/* Generic external metrics */}
            {selectedChannel.aliasChannel !== 'Facebook' && selectedChannel.aliasChannel !== 'Google' && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>External Metrics</Typography>
                <Alert severity="info">
                  External metrics are only available for Facebook and Google traffic channels.
                </Alert>
              </Paper>
            )}
            
            {/* Integration instructions */}
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Integration Instructions</Typography>
              <Typography variant="body1" paragraph>
                To integrate your {selectedChannel.aliasChannel} account with TrackPro, follow these steps:
              </Typography>
              
              {selectedChannel.aliasChannel === 'Facebook' && (
                <List>
                  <ListItemButton>
                    <ListItemIcon><FacebookIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Connect to Facebook Ads" 
                      secondary="Click the Connect button at the top of the page to authorize access" 
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon><BoltIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Configure Conversion Settings" 
                      secondary="Enter your Pixel ID and configure conversion settings in the Conversions tab" 
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon><SendIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Use the Postback URL" 
                      secondary="Add the S2S postback URL to your Facebook campaign settings" 
                    />
                  </ListItemButton>
                </List>
              )}
              
              {selectedChannel.aliasChannel === 'Google' && (
                <List>
                  <ListItemButton>
                    <ListItemIcon><GoogleIcon sx={{ color: '#4285F4' }} /></ListItemIcon>
                    <ListItemText 
                      primary="Connect to Google Ads" 
                      secondary="Click the Connect button at the top of the page to authorize access" 
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon><BoltIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Configure Conversion Settings" 
                      secondary="Enter your Conversion ID and Label in the Conversions tab" 
                    />
                  </ListItemButton>
                  <ListItemButton>
                    <ListItemIcon><SendIcon color="primary" /></ListItemIcon>
                    <ListItemText 
                      primary="Use the Postback URL" 
                      secondary="Add the S2S postback URL to your Google Ads campaign settings" 
                    />
                  </ListItemButton>
                </List>
              )}
              
              {selectedChannel.aliasChannel !== 'Facebook' && selectedChannel.aliasChannel !== 'Google' && (
                <Typography variant="body1">
                  External metrics integration is not available for this traffic channel type.
                </Typography>
              )}
            </Paper>
          </>
        )}
      </Box>
    );
  };

  // Main render function
  return (
    <Container maxWidth="xl" sx={{ mt: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        {detailsView ? (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Button
                variant="text"
                startIcon={<ArrowDropDownIcon />}
                onClick={handleBackToList}
                sx={{ ml: -1 }}
              >
                Back to Channels
              </Button>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ChannelTypeIcon type={selectedChannel.aliasChannel} />
                <Typography variant="h4" component="h1" sx={{ ml: 1 }}>
                  {selectedChannel.channelName}
                </Typography>
                <StatusChip status={selectedChannel.status} sx={{ ml: 2 }} />
              </Box>
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
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => handleDeleteConfirmation(selectedChannel)}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
        )}
      </Box>

      {/* Main Content */}
      {detailsView ? (
        <>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab icon={<BarChartIcon />} label="Overview" />
            <Tab icon={<TimelineIcon />} label="Performance" />
            <Tab icon={<SettingsIcon />} label="Settings" />
            <Tab icon={<CodeIcon />} label="Macros" />
            <Tab icon={<ConversionIcon />} label="Conversions" />
            <Tab icon={<SyncIcon />} label="External" />
          </Tabs>
          
          {/* Tab Content */}
          {tabValue === 0 && renderOverviewTab()}
          {tabValue === 1 && renderPerformanceTab()}
          {tabValue === 2 && renderSettingsTab()}
          {tabValue === 3 && renderMacrosTab()}
          {tabValue === 4 && renderConversionsTab()}
          {tabValue === 5 && renderExternalTab()}
        </>
      ) : (
        <>
          {/* API Connections */}
          {renderApiConnections()}
          
          {/* Filters and Search */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <TextField
                placeholder="Search channels..."
                value={searchQuery}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                sx={{ width: 300 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
              <Box>
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={toggleFilters}
                  sx={{ mr: 1 }}
                >
                  Filters
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              </Box>
            </Box>
            
            <Collapse in={filtersOpen}>
              <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={statusFilter}
                        onChange={handleStatusFilterChange}
                        label="Status"
                      >
                        <MenuItem value="all">All Statuses</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="paused">Paused</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined" size="small">
                      <InputLabel>Channel Type</InputLabel>
                      <Select
                        value={channelTypeFilter}
                        onChange={handleChannelTypeFilterChange}
                        label="Channel Type"
                      >
                        <MenuItem value="all">All Types</MenuItem>
                        {channelTypes.map(type => (
                          <MenuItem key={type.value} value={type.value.toLowerCase()}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ChannelTypeIcon type={type.value} />
                              <Box sx={{ ml: 1 }}>{type.label}</Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Paper>
          
          {/* Channel List */}
          {loading ? (
            <LoadingIndicator />
          ) : error ? (
            <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
          ) : channels.length === 0 ? (
            <EmptyState 
              title="No traffic channels found"
              message="Create your first traffic channel to start tracking your traffic sources."
              actionText="Add Traffic Channel"
              onAction={handleAddChannel}
              icon={HubIcon}
            />
          ) : filteredAndSortedChannels.length === 0 ? (
            <EmptyState
              title="No matching channels"
              message="No channels match your current filters. Try adjusting your search or filter criteria."
              actionText="Reset Filters"
              onAction={resetFilters}
              icon={FilterIcon}
            />
          ) : (
            renderChannelListTable()
          )}
        </>
      )}

      {/* Channel Form Dialog */}
      <Dialog
        open={channelDialogOpen}
        onClose={() => setChannelDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedChannel ? 'Edit Traffic Channel' : 'Add Traffic Channel'}
        </DialogTitle>
        <DialogContent dividers>
          {renderChannelForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChannelDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmitChannelForm}
            disabled={!formData.channelName}
          >
            {selectedChannel ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Traffic Channel</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the traffic channel "{channelToDelete?.channelName}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            color="error" 
            variant="contained"
            onClick={handleDeleteChannel}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Conversion Dialog */}
      <Dialog
        open={conversionTestDialogOpen}
        onClose={() => setConversionTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Conversion Test</DialogTitle>
        <DialogContent>
          {conversionTestLoading ? (
            <LoadingIndicator />
          ) : conversionTestResult ? (
            <>
              <Typography variant="body1" paragraph>
                This is a simulation of how a conversion would be processed for this traffic channel.
              </Typography>
              
              <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                <Typography variant="subtitle1">Test Conversion Info</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Traffic Channel</Typography>
                    <Typography variant="body1">
                      {conversionTestResult.test_conversion?.traffic_channel?.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Campaign</Typography>
                    <Typography variant="body1">
                      {conversionTestResult.test_conversion?.campaign?.name}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1">API Settings</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Facebook</Typography>
                    <Typography variant="body1">
                      {conversionTestResult.test_conversion?.apiSettings?.facebook?.enabled ? 'Enabled' : 'Disabled'}
                      {conversionTestResult.test_conversion?.apiSettings?.facebook?.pixel_id && 
                        ` (Pixel ID: ${conversionTestResult.test_conversion?.apiSettings?.facebook?.pixel_id})`}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">Google</Typography>
                    <Typography variant="body1">
                      {conversionTestResult.test_conversion?.apiSettings?.google?.enabled ? 'Enabled' : 'Disabled'}
                      {conversionTestResult.test_conversion?.apiSettings?.google?.conversion_id && 
                        ` (Conv ID: ${conversionTestResult.test_conversion?.apiSettings?.google?.conversion_id})`}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1">Test URL</Typography>
                <TextField
                  value={conversionTestResult.test_url || ''}
                  fullWidth
                  margin="normal"
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Copy to clipboard">
                          <IconButton
                            edge="end"
                            onClick={() => copyPostbackUrl(conversionTestResult.test_url || '')}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {conversionTestResult.note}
                </Typography>
              </Paper>
            </>
          ) : (
            <Typography>Failed to generate test conversion.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConversionTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchorEl}
        open={Boolean(actionMenuAnchorEl)}
        onClose={handleActionsMenuClose}
      >
        <MenuItem 
          onClick={() => {
            handleEditChannel(selectedChannelForActions);
            handleActionsMenuClose();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem 
          onClick={() => {
            handleViewChannel(selectedChannelForActions);
            handleActionsMenuClose();
          }}
        >
          <ListItemIcon>
            <BarChartIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            if (selectedChannelForActions && selectedChannelForActions.s2sPostbackUrl) {
              copyPostbackUrl(selectedChannelForActions.s2sPostbackUrl);
            }
            handleActionsMenuClose();
          }}
        >
          <ListItemIcon>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copy Postback URL</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            handleDeleteConfirmation(selectedChannelForActions);
            handleActionsMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

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