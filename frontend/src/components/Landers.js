import React, { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Typography, Button, Select, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Chip, MenuItem, TextField, Tabs, Tab, Paper, IconButton, Grid, 
  Tooltip, Divider, Switch, FormControlLabel, Snackbar, Alert,
  Card, CardContent, InputAdornment, OutlinedInput
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Layout from "./Layout";
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import PreviewIcon from '@mui/icons-material/Preview';
import CategoryIcon from '@mui/icons-material/Category';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';

// Macro categories with tooltips
const macroCategories = {
  tracking: {
    label: "Tracking",
    macros: [
      { name: '{clickid}', description: 'Unique ID for each click' },
      { name: '{campaignid}', description: 'Campaign identifier' },
      { name: '{campaignname}', description: 'Name of the campaign' },
      { name: '{sourceid}', description: 'Traffic source identifier' },
      { name: '{timestamp}', description: 'Time of the click' }
    ]
  },
  user: {
    label: "User Data",
    macros: [
      { name: '{sub1}', description: 'Custom parameter 1' },
      { name: '{sub2}', description: 'Custom parameter 2' },
      { name: '{sub3}', description: 'Custom parameter 3' },
      { name: '{country}', description: 'User country' },
      { name: '{city}', description: 'User city' },
      { name: '{ip}', description: 'User IP address' }
    ]
  },
  device: {
    label: "Device Info",
    macros: [
      { name: '{useragent}', description: 'Browser user agent' },
      { name: '{os}', description: 'Operating system' },
      { name: '{browser}', description: 'Browser type' },
      { name: '{device}', description: 'Device type (mobile, desktop, tablet)' },
      { name: '{screensize}', description: 'User screen resolution' }
    ]
  },
  referrer: {
    label: "Referrer",
    macros: [
      { name: '{referrerdomain}', description: 'Domain that referred the visitor' },
      { name: '{referrerurl}', description: 'Full referrer URL' },
      { name: '{lpsource}', description: 'Landing page source identifier' }
    ]
  }
};

// Flattened list of all macros for backward compatibility
const allMacros = Object.values(macroCategories).flatMap(category => 
  category.macros.map(macro => macro.name)
);

// Example values for URL preview
const exampleValues = {
  '{clickid}': 'cl_12345abcde',
  '{campaignid}': 'camp_789',
  '{campaignname}': 'Summer_Promo',
  '{sourceid}': 'fb_101',
  '{sub1}': 'banner1',
  '{sub2}': 'interest_fitness',
  '{sub3}': 'retargeting',
  '{country}': 'US',
  '{city}': 'New_York',
  '{ip}': '192.168.1.1',
  '{timestamp}': '1635789600',
  '{useragent}': 'Mozilla',
  '{os}': 'Windows',
  '{browser}': 'Chrome',
  '{device}': 'desktop',
  '{screensize}': '1920x1080',
  '{referrerdomain}': 'facebook.com',
  '{referrerurl}': 'facebook.com/ad',
  '{lpsource}': 'email'
};

// URL paths options
const pathOptions = [
  { value: 'click', label: 'Click (Standard Redirect)' },
  { value: 'direct', label: 'Direct (No Redirect)' },
  { value: 'view', label: 'View (Impression Only)' },
  { value: 'custom', label: 'Custom Path' }
];

// Modal component to create a new lander
const LanderModal = ({ open, onClose, onLanderCreated, landerToEdit }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [landerData, setLanderData] = useState({
    name: '',
    type: 'LANDING',
    url: '',
    path: 'click',
    customPath: '',
    domain: '',
    tags: [],
    useDirectUrl: false,
    usesTemplate: false,
    templateId: ''
  });
  
  const [domains, setDomains] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [searchTerm, setSearchTerm] = useState('');

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    if (landerToEdit) {
      // Extract path from URL for editing
      const domainPart = landerToEdit.domain;
      const urlPart = landerToEdit.url?.replace(`${domainPart}/`, '');
      const pathPart = urlPart?.split('?')[0] || 'click';
      const queryPart = urlPart?.includes('?') ? `?${urlPart.split('?')[1]}` : '';
      
      setLanderData({
        name: landerToEdit.name || '',
        type: landerToEdit.type || 'LANDING',
        url: queryPart,
        path: pathOptions.some(p => p.value === pathPart) ? pathPart : 'custom',
        customPath: pathOptions.some(p => p.value === pathPart) ? '' : pathPart,
        domain: domainPart || '',
        tags: landerToEdit.tags || [],
        useDirectUrl: pathPart === 'direct',
        usesTemplate: landerToEdit.usesTemplate || false,
        templateId: landerToEdit.templateId || ''
      });
    } else {
      setLanderData({
        name: '',
        type: 'LANDING',
        url: '',
        path: 'click',
        customPath: '',
        domain: '',
        tags: [],
        useDirectUrl: false,
        usesTemplate: false,
        templateId: ''
      });
    }
  }, [landerToEdit]);

  // Update preview URL whenever relevant fields change
  useEffect(() => {
    updatePreviewUrl();
  }, [landerData.domain, landerData.path, landerData.customPath, landerData.url]);

  const updatePreviewUrl = () => {
    if (!landerData.domain) {
      setPreviewUrl('Select a domain to see URL preview');
      return;
    }

    let path = landerData.path;
    if (path === 'custom' && landerData.customPath) {
      path = landerData.customPath;
    }

    const baseMacros = landerData.url?.trim() || '';
    const queryParams = baseMacros.startsWith('?') ? baseMacros : baseMacros ? `?${baseMacros}` : '';
    
    // Build preview URL
    const finalUrl = `${landerData.domain}/${path}${queryParams}`;
    
    // Replace macros with example values for preview
    let previewWithValues = finalUrl;
    Object.entries(exampleValues).forEach(([macro, value]) => {
      const macroPattern = new RegExp(`${macro.replace(/[{}]/g, '\\$&')}`, 'g');
      previewWithValues = previewWithValues.replace(macroPattern, value);
    });
    
    setPreviewUrl(previewWithValues);
  };

  const handleChange = (e) => {
    setLanderData({ ...landerData, [e.target.name]: e.target.value });
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    if (name === 'useDirectUrl') {
      setLanderData({ 
        ...landerData, 
        useDirectUrl: checked,
        path: checked ? 'direct' : 'click'
      });
    } else {
      setLanderData({ ...landerData, [name]: checked });
    }
  };

  const handlePathChange = (e) => {
    const path = e.target.value;
    setLanderData({ 
      ...landerData, 
      path,
      useDirectUrl: path === 'direct'
    });
  };

  const handleMacroClick = (macro) => {
    const currentUrl = landerData.url || '';
    let updatedUrl;
    
    if (currentUrl.trim() === '') {
      updatedUrl = `?${macro.slice(1, -1)}=${macro}`;
    } else {
      const separator = currentUrl.includes('?') ? 
                        (currentUrl.endsWith('?') || currentUrl.endsWith('&') ? '' : '&') : 
                        '?';
      updatedUrl = currentUrl + separator + macro.slice(1, -1) + '=' + macro;
    }
    
    setLanderData({ ...landerData, url: updatedUrl });
  };

  const handleSave = async () => {
    try {
      // Construct the final URL based on path type and parameters
      let pathPart = landerData.path;
      if (pathPart === 'custom' && landerData.customPath) {
        pathPart = landerData.customPath;
      }
      
      const baseMacros = landerData.url.trim();
      const queryParams = baseMacros.startsWith('?') ? baseMacros : baseMacros ? `?${baseMacros}` : '';
      const finalUrl = `${landerData.domain}/${pathPart}${queryParams}`;

      const payload = {
        name: landerData.name,
        type: landerData.type,
        url: finalUrl,
        domain: landerData.domain,
        tags: landerData.tags,
        usesTemplate: landerData.usesTemplate,
        templateId: landerData.templateId
      };

      const method = landerToEdit ? 'PUT' : 'POST';
      const endpoint = landerToEdit
        ? `https://pearmllc.onrender.com/api/landers/${landerToEdit.id}`
        : 'https://pearmllc.onrender.com/api/landers';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save lander');
      const savedLander = await res.json();
      
      // Show success notification
      setNotification({
        open: true,
        message: `Lander ${landerToEdit ? 'updated' : 'created'} successfully!`,
        severity: 'success'
      });
      
      onLanderCreated(savedLander);
      onClose();
    } catch (err) {
      console.error('Error saving lander:', err);
      setNotification({
        open: true,
        message: 'Failed to save lander. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCopyUrl = () => {
    const urlToCopy = landerData.domain ? 
      `${landerData.domain}/${landerData.path === 'custom' ? landerData.customPath : landerData.path}${landerData.url}` : 
      '';
      
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy);
      setNotification({
        open: true,
        message: 'URL copied to clipboard!',
        severity: 'success'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  useEffect(() => {
    // Fetch domains
    fetch('https://pearmllc.onrender.com/api/domains')
      .then(res => res.json())
      .then(data => {
        const cleaned = data.map(domain => ({
          id: domain.id,
          url: domain.url.replace(/^https?:\/\//, '')
        }));
        setDomains(cleaned);
      })
      .catch(err => console.error('Error fetching domains:', err));
    
    // Fetch templates (mock for now)
    setTemplates([
      { id: 1, name: 'Default Landing Page' },
      { id: 2, name: 'Email Opt-in' },
      { id: 3, name: 'Product Showcase' }
    ]);
  }, []);

  // Filter macros based on search term
  const filterMacros = (macros) => {
    if (!searchTerm) return macros;
    return macros.filter(macro => 
      macro.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      macro.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">{landerToEdit ? 'Edit Lander' : 'Create Lander'}</Typography>
            <Box>
              <Tooltip title="Copy URL">
                <IconButton onClick={handleCopyUrl} disabled={!landerData.domain}>
                  <FileCopyIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Lander Name */}
            <Grid item xs={12}>
              <TextField
                label="Lander Name"
                name="name"
                fullWidth
                required
                margin="normal"
                value={landerData.name}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          
          <Paper sx={{ mt: 2 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="URL Builder" icon={<LinkIcon />} iconPosition="start" />
              <Tab label="Settings" icon={<SettingsIcon />} iconPosition="start" />
            </Tabs>
            
            {/* URL Builder Tab */}
            {activeTab === 0 && (
              <Box p={2}>
                {/* URL Preview Card */}
                <Card variant="outlined" sx={{ mb: 3, bgcolor: '#f8f9fa' }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      <PreviewIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />
                      URL Preview
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        bgcolor: '#fff', 
                        border: '1px solid #e0e0e0', 
                        borderRadius: 1,
                        wordBreak: 'break-all',
                        fontSize: '0.875rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      {previewUrl || 'Configure URL parameters to see preview'}
                    </Box>
                  </CardContent>
                </Card>
                
                {/* Domain & Path Selection */}
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Tracking Domain</InputLabel>
                      <Select
                        name="domain"
                        value={landerData.domain}
                        onChange={handleChange}
                      >
                        {domains.map((domain) => (
                          <MenuItem key={domain.id} value={domain.url}>
                            {domain.url}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Path Type</InputLabel>
                      <Select
                        name="path"
                        value={landerData.path}
                        onChange={handlePathChange}
                      >
                        {pathOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  {/* Custom Path Input (only shown when 'custom' is selected) */}
                  {landerData.path === 'custom' && (
                    <Grid item xs={12}>
                      <TextField
                        label="Custom Path"
                        name="customPath"
                        fullWidth
                        placeholder="e.g., my-path or lp/special"
                        value={landerData.customPath}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">/</InputAdornment>,
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
                
                {/* URL Parameters/Macros */}
                <Box mt={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    URL Parameters
                  </Typography>
                  <TextField
                    label="Query Parameters"
                    name="url"
                    fullWidth
                    margin="normal"
                    value={landerData.url}
                    onChange={handleChange}
                    placeholder="?sub1={sub1}&sub2={sub2}"
                    helperText="Add query parameters with macros"
                  />
                </Box>
                
                {/* Macro Selection */}
                <Box mt={3}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2">
                      <CategoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} fontSize="small" />
                      Available Macros
                    </Typography>
                    <TextField
                      placeholder="Search macros"
                      variant="outlined"
                      size="small"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  
                  <Paper variant="outlined" sx={{ p: 2, maxHeight: '300px', overflow: 'auto' }}>
                    {Object.entries(macroCategories).map(([key, category]) => {
                      const filteredMacros = filterMacros(category.macros);
                      if (filteredMacros.length === 0) return null;
                      
                      return (
                        <Box key={key} mb={2}>
                          <Typography variant="body2" color="primary" fontWeight="medium" gutterBottom>
                            {category.label}
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {filteredMacros.map((macro, idx) => (
                              <Tooltip key={idx} title={macro.description} arrow>
                                <Chip
                                  label={macro.name}
                                  onClick={() => handleMacroClick(macro.name)}
                                  variant="outlined"
                                  size="small"
                                  icon={<AddIcon fontSize="small" />}
                                  clickable
                                />
                              </Tooltip>
                            ))}
                          </Box>
                          <Divider sx={{ mt: 2 }} />
                        </Box>
                      );
                    })}
                  </Paper>
                </Box>
              </Box>
            )}
            
            {/* Settings Tab */}
            {activeTab === 1 && (
              <Box p={2}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={landerData.useDirectUrl}
                          onChange={handleSwitchChange}
                          name="useDirectUrl"
                          color="primary"
                        />
                      }
                      label="Use Direct URL (no redirect)"
                    />
                    <Typography variant="caption" display="block" color="textSecondary">
                      Direct URLs bypass the redirect but may have limited tracking capabilities
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={landerData.usesTemplate}
                          onChange={handleSwitchChange}
                          name="usesTemplate"
                          color="primary"
                        />
                      }
                      label="Use Landing Page Template"
                    />
                  </Grid>
                  
                  {landerData.usesTemplate && (
                    <Grid item xs={12}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Select Template</InputLabel>
                        <Select
                          name="templateId"
                          value={landerData.templateId}
                          onChange={handleChange}
                        >
                          {templates.map((template) => (
                            <MenuItem key={template.id} value={template.id}>
                              {template.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSave}
            startIcon={<SaveIcon />}
            disabled={!landerData.name || !landerData.domain}
          >
            {landerToEdit ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
};

// Main page component
const LandingPage = () => {
  const [landers, setLanders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editLander, setEditLander] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  const [selectedLanders, setSelectedLanders] = useState([]);

  const fetchLanders = () => {
    setLoading(true);
    fetch('https://pearmllc.onrender.com/api/landers')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((lander, index) => ({
          id: lander.id || lander.Serial_No || index + 1,
          ...lander
        }));
        setLanders(formatted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
        setNotification({
          open: true,
          message: 'Failed to load landers',
          severity: 'error'
        });
      });
  };

  useEffect(() => {
    fetchLanders();
  }, []);

  const handleOpen = () => {
    setEditLander(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditLander(null);
  };

  const handleRowClick = (params) => {
    setEditLander(params.row);
    setOpen(true);
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setNotification({
      open: true, 
      message: 'URL copied to clipboard!', 
      severity: 'success'
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleSelectionChange = (newSelection) => {
    setSelectedLanders(newSelection);
  };

  const handleDeleteSelected = async () => {
    if (selectedLanders.length === 0) return;
    
    // In a real app, you would add a confirmation dialog here
    try {
      // Implementation would depend on your API
      // This is just a placeholder
      setNotification({
        open: true,
        message: `${selectedLanders.length} landers deleted`,
        severity: 'success'
      });
      
      // Refresh the list
      fetchLanders();
      setSelectedLanders([]);
    } catch (err) {
      setNotification({
        open: true,
        message: 'Failed to delete landers',
        severity: 'error'
      });
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'name',
      headerName: 'Name',
      width: 220,
      renderCell: (params) => {
        const row = params.row;
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            sx={{
              '&:hover .hover-icons': { visibility: 'visible' }
            }}
          >
            <Typography variant="body2">{row.name}</Typography>
            <Box className="hover-icons" display="flex" gap={1} visibility="hidden">
              <Tooltip title="Edit Lander">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditLander(row);
                    setOpen(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Copy URL">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyUrl(row.url);
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        );
      }
    },
    { 
      field: 'url', 
      headerName: 'URL', 
      width: 300,
      renderCell: (params) => (
        <Tooltip title={params.value}>
          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }}
          >
            {params.value}
          </Typography>
        </Tooltip>
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Created', 
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleString();
      }
    },
    { 
      field: 'clicks', 
      headerName: 'Clicks', 
      width: 100,
      type: 'number' 
    },
    { 
      field: 'lp_clicks', 
      headerName: 'LP Clicks', 
      width: 110,
      type: 'number'
    },
    { 
      field: 'lp_views', 
      headerName: 'LP Views', 
      width: 110,
      type: 'number' 
    },
    { 
      field: 'conversion', 
      headerName: 'Convs', 
      width: 90,
      type: 'number'
    },
    { 
      field: 'epc', 
      headerName: 'EPC ($)', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'total_revenue', 
      headerName: 'Revenue ($)', 
      width: 130,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'profit', 
      headerName: 'Profit ($)', 
      width: 110,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'total_roi', 
      headerName: 'ROI (%)', 
      width: 100,
      type: 'number',
      valueFormatter: (params) => {
        if (params.value == null) return '';
        return `${params.value.toFixed(2)}%`;
      }
    }
  ];

  return (
    <Layout>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Landers</Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={fetchLanders}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            
            <Button 
              variant="outlined" 
              color="error" 
              startIcon={<DeleteIcon />} 
              onClick={handleDeleteSelected}
              disabled={selectedLanders.length === 0}
              sx={{ mr: 1 }}
            >
              Delete ({selectedLanders.length})
            </Button>
            
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleOpen}
            >
              New Lander
            </Button>
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
            <CircularProgress />
          </Box>
        ) : (
          <Paper elevation={1}>
            <DataGrid
              rows={landers}
              columns={columns}
              autoHeight
              pageSize={25}
              rowsPerPageOptions={[25, 50, 100]}
              checkboxSelection
              disableSelectionOnClick
              onRowClick={handleRowClick}
              onSelectionModelChange={handleSelectionChange}
              sx={{
                "& .MuiDataGrid-columnHeader": {
                  backgroundColor: "#f0f0f0",
                  fontWeight: "bold"
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5"
                },
                "& .MuiDataGrid-cell:focus-within": {
                  outline: "none !important"
                }
              }}
            />
          </Paper>
        )}
      </Box>

      {/* Lander Modal */}
      <LanderModal
        open={open}
        onClose={handleClose}
        onLanderCreated={fetchLanders}
        landerToEdit={editLander}
      />
      
      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default LandingPage;