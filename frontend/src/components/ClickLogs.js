// components/logs/click-log.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Collapse,
  Divider,
  Badge,
  Alert,
  Snackbar,
  Stack
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  CloudDownload as DownloadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import Layout from '../../Layout';

const API_URL = process.env.REACT_APP_API_URL || "https://pearmllc.onrender.com";

// Click Log Component
const ClickLogs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract query params
  const queryParams = new URLSearchParams(location.search);
  
  // State for click logs data
  const [clicks, setClicks] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(parseInt(queryParams.get('page')) || 1);
  const [pageSize, setPageSize] = useState(parseInt(queryParams.get('limit')) || 25);
  
  // State for filters
  const [filters, setFilters] = useState({
    campaign_id: queryParams.get('campaign_id') || '',
    traffic_channel_id: queryParams.get('traffic_channel_id') || '',
    lander_id: queryParams.get('lander_id') || '',
    offer_id: queryParams.get('offer_id') || '',
    country: queryParams.get('country') || '',
    start_date: queryParams.get('start_date') ? new Date(queryParams.get('start_date')) : null,
    end_date: queryParams.get('end_date') ? new Date(queryParams.get('end_date')) : null,
    conversion_status: queryParams.get('conversion_status') || 'all',
    ip: queryParams.get('ip') || '',
    device: queryParams.get('device') || '',
    os: queryParams.get('os') || '',
    browser: queryParams.get('browser') || '',
    sub_parameter: queryParams.get('sub_parameter') || '',
    sub_value: queryParams.get('sub_value') || ''
  });
  
  // State for filter options (dropdowns)
  const [filterOptions, setFilterOptions] = useState({
    campaigns: [],
    traffic_sources: [],
    landers: [],
    offers: [],
    countries: [],
    devices: [],
    operating_systems: [],
    browsers: [],
    conversion_statuses: [],
    sub_parameters: []
  });
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [selectedClick, setSelectedClick] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Update URL with current filters and pagination
  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    
    // Add filters to URL
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (key === 'start_date' || key === 'end_date') {
          // Format dates for URL
          if (value instanceof Date) {
            params.set(key, value.toISOString().split('T')[0]);
          }
        } else {
          params.set(key, value);
        }
      }
    });
    
    // Add pagination to URL
    params.set('page', page);
    params.set('limit', pageSize);
    
    // Update URL without reload
    navigate({
      pathname: location.pathname,
      search: params.toString()
    }, { replace: true });
  }, [filters, page, pageSize, navigate, location.pathname]);
  
  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/click-logs/filters/options`);
      setFilterOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load filter options',
        severity: 'error'
      });
    }
  }, []);
  
  // Fetch click logs
  const fetchClickLogs = useCallback(async () => {
    setLoading(true);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      
      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          if (key === 'start_date' || key === 'end_date') {
            // Format dates for API
            if (value instanceof Date) {
              params.set(key, value.toISOString().split('T')[0]);
            }
          } else {
            params.set(key, value);
          }
        }
      });
      
      // Add pagination
      params.set('page', page);
      params.set('limit', pageSize);
      
      // Make API call
      const response = await axios.get(`${API_URL}/api/click-logs?${params.toString()}`);
      
      // Update state with results
      setClicks(response.data.clicks);
      setTotalClicks(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching click logs:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load click logs data',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);
  
  // Load data on initial render and when filters/pagination change
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);
  
  useEffect(() => {
    fetchClickLogs();
    updateUrl();
  }, [fetchClickLogs, updateUrl]);
  
  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset to first page when filters change
    setPage(1);
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      campaign_id: '',
      traffic_channel_id: '',
      lander_id: '',
      offer_id: '',
      country: '',
      start_date: null,
      end_date: null,
      conversion_status: 'all',
      ip: '',
      device: '',
      os: '',
      browser: '',
      sub_parameter: '',
      sub_value: ''
    });
    setPage(1);
  };
  
  // Export clicks to CSV
  const handleExportCsv = () => {
    // Build query params
    const params = new URLSearchParams();
    
    // Add filters to params
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        if (key === 'start_date' || key === 'end_date') {
          // Format dates for API
          if (value instanceof Date) {
            params.set(key, value.toISOString().split('T')[0]);
          }
        } else {
          params.set(key, value);
        }
      }
    });
    
    // Create export URL
    const exportUrl = `${API_URL}/api/click-logs/export/csv?${params.toString()}`;
    
    // Open in new tab or trigger download
    window.open(exportUrl, '_blank');
  };
  
  // View click details
  const handleViewClick = async (clickId) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_URL}/api/click-logs/${clickId}`);
      setSelectedClick(response.data);
      setDetailDialogOpen(true);
    } catch (error) {
      console.error('Error fetching click details:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load click details',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle page change
  const handlePageChange = (event, newPage) => {
    setPage(newPage + 1); // MUI is 0-indexed, our API is 1-indexed
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(1);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  return (
    <Layout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">Click Logs</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchClickLogs}
            >
              Refresh
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
          </Box>
        </Box>
        
        {/* Filters Section */}
        <Collapse in={showFilters}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Filters</Typography>
              <Grid container spacing={2}>
                {/* Date Range */}
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={filters.start_date}
                      onChange={(date) => handleFilterChange('start_date', date)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={filters.end_date}
                      onChange={(date) => handleFilterChange('end_date', date)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </Grid>
                
                {/* Campaign */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Campaign</InputLabel>
                    <Select
                      value={filters.campaign_id}
                      onChange={(e) => handleFilterChange('campaign_id', e.target.value)}
                      label="Campaign"
                    >
                      <MenuItem value="">All Campaigns</MenuItem>
                      {filterOptions.campaigns.map((campaign) => (
                        <MenuItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Traffic Source */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Traffic Source</InputLabel>
                    <Select
                      value={filters.traffic_channel_id}
                      onChange={(e) => handleFilterChange('traffic_channel_id', e.target.value)}
                      label="Traffic Source"
                    >
                      <MenuItem value="">All Traffic Sources</MenuItem>
                      {filterOptions.traffic_sources.map((source) => (
                        <MenuItem key={source.id} value={source.id}>
                          {source.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Lander */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Lander</InputLabel>
                    <Select
                      value={filters.lander_id}
                      onChange={(e) => handleFilterChange('lander_id', e.target.value)}
                      label="Lander"
                    >
                      <MenuItem value="">All Landers</MenuItem>
                      {filterOptions.landers.map((lander) => (
                        <MenuItem key={lander.id} value={lander.id}>
                          {lander.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Offer */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Offer</InputLabel>
                    <Select
                      value={filters.offer_id}
                      onChange={(e) => handleFilterChange('offer_id', e.target.value)}
                      label="Offer"
                    >
                      <MenuItem value="">All Offers</MenuItem>
                      {filterOptions.offers.map((offer) => (
                        <MenuItem key={offer.id} value={offer.id}>
                          {offer.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Country */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Country</InputLabel>
                    <Select
                      value={filters.country}
                      onChange={(e) => handleFilterChange('country', e.target.value)}
                      label="Country"
                    >
                      <MenuItem value="">All Countries</MenuItem>
                      {filterOptions.countries.map((country) => (
                        <MenuItem key={country} value={country}>
                          {country}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Conversion Status */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Conversion Status</InputLabel>
                    <Select
                      value={filters.conversion_status}
                      onChange={(e) => handleFilterChange('conversion_status', e.target.value)}
                      label="Conversion Status"
                    >
                      <MenuItem value="all">All Clicks</MenuItem>
                      <MenuItem value="converted">Converted</MenuItem>
                      <MenuItem value="not_converted">Not Converted</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Sub Parameter */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sub Parameter</InputLabel>
                    <Select
                      value={filters.sub_parameter}
                      onChange={(e) => handleFilterChange('sub_parameter', e.target.value)}
                      label="Sub Parameter"
                    >
                      <MenuItem value="">Select Sub Parameter</MenuItem>
                      {filterOptions.sub_parameters.map((param) => (
                        <MenuItem key={param} value={param}>
                          {param}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Sub Value */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Sub Value"
                    value={filters.sub_value}
                    onChange={(e) => handleFilterChange('sub_value', e.target.value)}
                    disabled={!filters.sub_parameter}
                  />
                </Grid>
                
                {/* IP */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="IP Address"
                    value={filters.ip}
                    onChange={(e) => handleFilterChange('ip', e.target.value)}
                  />
                </Grid>
                
                {/* Device */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Device</InputLabel>
                    <Select
                      value={filters.device}
                      onChange={(e) => handleFilterChange('device', e.target.value)}
                      label="Device"
                    >
                      <MenuItem value="">All Devices</MenuItem>
                      {filterOptions.devices.map((device) => (
                        <MenuItem key={device} value={device}>
                          {device}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* OS */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Operating System</InputLabel>
                    <Select
                      value={filters.os}
                      onChange={(e) => handleFilterChange('os', e.target.value)}
                      label="Operating System"
                    >
                      <MenuItem value="">All OS</MenuItem>
                      {filterOptions.operating_systems.map((os) => (
                        <MenuItem key={os} value={os}>
                          {os}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Browser */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Browser</InputLabel>
                    <Select
                      value={filters.browser}
                      onChange={(e) => handleFilterChange('browser', e.target.value)}
                      label="Browser"
                    >
                      <MenuItem value="">All Browsers</MenuItem>
                      {filterOptions.browsers.map((browser) => (
                        <MenuItem key={browser} value={browser}>
                          {browser}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                {/* Filter Actions */}
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2}>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleClearFilters}
                    startIcon={<ClearIcon />}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={fetchClickLogs}
                    startIcon={<SearchIcon />}
                  >
                    Apply Filters
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Collapse>
        
        {/* Applied Filters */}
        {Object.values(filters).some(value => value && value !== 'all') && (
          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.campaign_id && (
              <Chip 
                label={`Campaign: ${filterOptions.campaigns.find(c => c.id.toString() === filters.campaign_id.toString())?.name || filters.campaign_id}`}
                onDelete={() => handleFilterChange('campaign_id', '')}
              />
            )}
            {filters.traffic_channel_id && (
              <Chip 
                label={`Traffic Source: ${filterOptions.traffic_sources.find(t => t.id.toString() === filters.traffic_channel_id.toString())?.name || filters.traffic_channel_id}`}
                onDelete={() => handleFilterChange('traffic_channel_id', '')}
              />
            )}
            {filters.lander_id && (
              <Chip 
                label={`Lander: ${filterOptions.landers.find(l => l.id.toString() === filters.lander_id.toString())?.name || filters.lander_id}`}
                onDelete={() => handleFilterChange('lander_id', '')}
              />
            )}
            {filters.offer_id && (
              <Chip 
                label={`Offer: ${filterOptions.offers.find(o => o.id.toString() === filters.offer_id.toString())?.name || filters.offer_id}`}
                onDelete={() => handleFilterChange('offer_id', '')}
              />
            )}
            {filters.country && (
              <Chip 
                label={`Country: ${filters.country}`}
                onDelete={() => handleFilterChange('country', '')}
              />
            )}
            {filters.start_date && (
              <Chip 
                label={`From: ${filters.start_date.toLocaleDateString()}`}
                onDelete={() => handleFilterChange('start_date', null)}
              />
            )}
            {filters.end_date && (
              <Chip 
                label={`To: ${filters.end_date.toLocaleDateString()}`}
                onDelete={() => handleFilterChange('end_date', null)}
              />
            )}
            {filters.conversion_status !== 'all' && (
              <Chip 
                label={`Status: ${filters.conversion_status === 'converted' ? 'Converted' : 'Not Converted'}`}
                onDelete={() => handleFilterChange('conversion_status', 'all')}
              />
            )}
            {filters.ip && (
              <Chip 
                label={`IP: ${filters.ip}`}
                onDelete={() => handleFilterChange('ip', '')}
              />
            )}
            {filters.device && (
              <Chip 
                label={`Device: ${filters.device}`}
                onDelete={() => handleFilterChange('device', '')}
              />
            )}
            {filters.os && (
              <Chip 
                label={`OS: ${filters.os}`}
                onDelete={() => handleFilterChange('os', '')}
              />
            )}
            {filters.browser && (
              <Chip 
                label={`Browser: ${filters.browser}`}
                onDelete={() => handleFilterChange('browser', '')}
              />
            )}
            {filters.sub_parameter && filters.sub_value && (
              <Chip 
                label={`${filters.sub_parameter}: ${filters.sub_value}`}
                onDelete={() => {
                  handleFilterChange('sub_parameter', '');
                  handleFilterChange('sub_value', '');
                }}
              />
            )}
          </Box>
        )}
        
        {/* Click Logs Table */}
        <Card>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date/Time</TableCell>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Traffic Source</TableCell>
                    <TableCell>Lander</TableCell>
                    <TableCell>Offer</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Revenue</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={40} />
                      </TableCell>
                    </TableRow>
                  ) : clicks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                        <Typography variant="body1">No click logs found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    clicks.map((click) => (
                      <TableRow key={click.id} hover>
                        <TableCell>{formatTimestamp(click.createdAt)}</TableCell>
                        <TableCell>{click.campaign_name || 'N/A'}</TableCell>
                        <TableCell>{click.traffic_source || 'N/A'}</TableCell>
                        <TableCell>{click.lander_name || 'N/A'}</TableCell>
                        <TableCell>{click.offer_name || 'N/A'}</TableCell>
                        <TableCell>
                          {click.country ? (
                            <Chip 
                              label={click.country} 
                              size="small" 
                              variant="outlined"
                            />
                          ) : 'Unknown'}
                        </TableCell>
                        <TableCell>{click.device || 'Unknown'}</TableCell>
                        <TableCell>
                          {click.conversion ? (
                            <Chip 
                              icon={<CheckCircleIcon />} 
                              label="Converted" 
                              color="success" 
                              size="small"
                            />
                          ) : (
                            <Chip 
                              icon={<CancelIcon />} 
                              label="Not Converted" 
                              color="default" 
                              size="small" 
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {click.conversion ? formatCurrency(click.revenue) : '$0.00'}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewClick(click.id)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalClicks}
              page={page - 1} // MUI is 0-indexed, our API is 1-indexed
              rowsPerPage={pageSize}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </CardContent>
        </Card>
        
        {/* Click Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Click Details {selectedClick && `(ID: ${selectedClick.id})`}
          </DialogTitle>
          <DialogContent dividers>
            {selectedClick ? (
              <Box>
                {/* Status badge */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  {selectedClick.conversion ? (
                    <Chip 
                      icon={<CheckCircleIcon />} 
                      label="Converted" 
                      color="success"
                    />
                  ) : (
                    <Chip 
                      icon={<CancelIcon />} 
                      label="Not Converted" 
                      color="default" 
                      variant="outlined"
                    />
                  )}
                </Box>
                
                {/* Basic info */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Click Time</Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatTimestamp(selectedClick.createdAt)}
                    </Typography>
                  </Grid>
                  
                  {selectedClick.conversion && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="textSecondary">Conversion Time</Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatTimestamp(selectedClick.conversion_time)}
                      </Typography>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Campaign</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedClick.campaign_name || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Traffic Source</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedClick.traffic_source || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Lander</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedClick.lander_name || 'N/A'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Offer</Typography>
                    <Typography variant="body1" gutterBottom>
                      {selectedClick.offer_name || 'N/A'}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Visitor information */}
                <Typography variant="h6" gutterBottom>Visitor Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">IP Address</Typography>
                    <Typography variant="body1" gutterBottom>{selectedClick.ip || 'N/A'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Country</Typography>
                    <Typography variant="body1" gutterBottom>{selectedClick.country || 'Unknown'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">Region</Typography>
                    <Typography variant="body1" gutterBottom>{selectedClick.region || 'Unknown'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="textSecondary">City</Typography>
                    <Typography variant="body1" gutterBottom>{selectedClick.city || 'Unknown'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">Device</Typography>
                    <Typography variant="body1" gutterBottom>{selectedClick.device || 'Unknown'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">Operating System</Typography>
                    <Typography variant="body1" gutterBottom>{selectedClick.os || 'Unknown'}</Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">Browser</Typography>
                    <Typography variant="body1" gutterBottom>{selectedClick.browser || 'Unknown'}</Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Financial info */}
                <Typography variant="h6" gutterBottom>Financial Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">Revenue</Typography>
                    <Typography 
                      variant="body1" 
                      gutterBottom 
                      color={selectedClick.revenue > 0 ? 'success.main' : 'text.primary'}
                    >
                      {formatCurrency(selectedClick.revenue)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">Cost</Typography>
                    <Typography 
                      variant="body1" 
                      gutterBottom 
                      color={selectedClick.cost > 0 ? 'error.main' : 'text.primary'}
                    >
                      {formatCurrency(selectedClick.cost)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle2" color="textSecondary">Profit</Typography>
                    <Typography 
                      variant="body1" 
                      gutterBottom 
                      color={(selectedClick.profit || 0) > 0 ? 'success.main' : (selectedClick.profit || 0) < 0 ? 'error.main' : 'text.primary'}
                    >
                      {formatCurrency(selectedClick.profit)}
                    </Typography>
                  </Grid>
                </Grid>
                
                {/* Sub parameters */}
                {selectedClick.macro && Object.entries(selectedClick.macro).some(([key, value]) => key.startsWith('sub') && value) && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Sub Parameters</Typography>
                    <Grid container spacing={2}>
                      {Object.entries(selectedClick.macro)
                        .filter(([key, value]) => key.startsWith('sub') && value)
                        .map(([key, value]) => (
                          <Grid item xs={12} md={4} key={key}>
                            <Typography variant="subtitle2" color="textSecondary">{key}</Typography>
                            <Typography variant="body1" gutterBottom>{value}</Typography>
                          </Grid>
                        ))}
                    </Grid>
                  </>
                )}
                
                {/* Timeline */}
                {selectedClick.timeline && selectedClick.timeline.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Event Timeline</Typography>
                    
                    <Stack spacing={2}>
                      {selectedClick.timeline.map((event, index) => (
                        <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" color="textSecondary">Event</Typography>
                              <Typography variant="body1">
                                {event.event_type === 'click' ? 'Click' :
                                 event.event_type === 'lp_view' ? 'Lander View' :
                                 event.event_type === 'conversion' ? 'Conversion' : event.event_type}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" color="textSecondary">Timestamp</Typography>
                              <Typography variant="body1">{formatTimestamp(event.timestamp)}</Typography>
                            </Grid>
                            <Grid item xs={12} md={4}>
                              <Typography variant="subtitle2" color="textSecondary">Details</Typography>
                              <Typography variant="body1" component="div">
                                {Object.entries(event.details || {}).map(([key, value]) => (
                                  <Box key={key} sx={{ display: 'flex', gap: 1 }}>
                                    <Typography variant="caption" color="textSecondary">{key}:</Typography>
                                    <Typography variant="caption">{value}</Typography>
                                  </Box>
                                ))}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      ))}
                    </Stack>
                  </>
                )}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
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

export default ClickLogs;