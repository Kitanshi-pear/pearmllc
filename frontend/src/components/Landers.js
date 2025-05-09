import React, { useEffect, useState } from 'react';
import {
  Box, 
  CircularProgress, 
  Typography, 
  Button, 
  Select, 
  Dialog,
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  FormControl, 
  InputLabel,
  Chip, 
  MenuItem, 
  TextField, 
  Card, 
  CardContent, 
  Grid,
  IconButton,
  Paper,
  Divider,
  alpha,
  useTheme,
  Stack,
  Tooltip,
  InputAdornment,
  Fade,
  Tabs,
  Tab,
  Badge,
  styled
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Layout from "./Layout";

// Icons
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LinkIcon from '@mui/icons-material/Link';
import TagIcon from '@mui/icons-material/Tag';
import DescriptionIcon from '@mui/icons-material/Description';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MouseIcon from '@mui/icons-material/Mouse';
import CodeIcon from '@mui/icons-material/Code';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LanguageIcon from '@mui/icons-material/Language';

// Date picker components
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 2px 12px 0 rgba(0,0,0,0.05)',
  overflow: 'visible',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 4px 18px 0 rgba(0,0,0,0.07)',
  },
}));

const MetricCard = styled(Paper)(({ theme, color = 'primary' }) => ({
  borderRadius: 12,
  padding: theme.spacing(2),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: theme.palette[color].main,
  }
}));

const MetricIcon = styled(Box)(({ theme, color = 'primary' }) => ({
  width: 40,
  height: 40,
  borderRadius: 8,
  backgroundColor: alpha(theme.palette[color].main, 0.1),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette[color].main
}));

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  '& .MuiDataGrid-main': {
    borderRadius: 12,
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    overflow: 'hidden'
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
  '& .MuiDataGrid-columnHeader': {
    fontWeight: 600,
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  '& .MuiDataGrid-row': {
    '&:nth-of-type(even)': {
      backgroundColor: alpha(theme.palette.primary.main, 0.01),
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
    },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
      },
    },
  },
  '& .MuiDataGrid-cell': {
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
    fontSize: '0.875rem',
  },
  '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus-within': {
    outline: 'none',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  },
}));

const ActionButton = styled(Button)(({ theme, variant = 'contained', color = 'primary' }) => ({
  textTransform: 'none',
  fontWeight: 500,
  borderRadius: 8,
  boxShadow: 'none',
  padding: theme.spacing(0.75, 2),
  ...(variant === 'contained' && {
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.07)',
    },
  }),
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  backgroundColor: alpha(theme.palette.primary.main, 0.03),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '& .MuiTypography-root': {
    fontWeight: 600,
  },
}));

const MacroChip = styled(Chip)(({ theme }) => ({
  borderRadius: 6,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  color: theme.palette.primary.main,
  fontFamily: 'monospace',
  fontSize: '0.8125rem',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.12),
  },
}));

const TypeSelector = styled(Box)(({ theme, selected }) => ({
  flex: '1 0 21%',
  margin: theme.spacing(0.5),
  padding: theme.spacing(2),
  textAlign: 'center',
  backgroundColor: selected ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.divider, 0.05),
  borderRadius: 8,
  cursor: 'pointer',
  border: selected ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : `1px solid transparent`,
  transition: 'all 0.15s ease',
  '&:hover': {
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.divider, 0.1),
  },
}));

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const FormLabel = styled(Typography)(({ theme }) => ({
  display: 'block',
  marginBottom: theme.spacing(1),
  fontWeight: 600,
  fontSize: '0.9375rem',
  color: theme.palette.text.primary,
}));

const FormHelperText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(0.75),
  fontSize: '0.8125rem',
  color: alpha(theme.palette.text.primary, 0.7),
  lineHeight: 1.4,
}));

// Modal component to create a new lander
const LanderModal = ({ open, onClose, macros, onLanderCreated, landerToEdit }) => {
  const theme = useTheme();
  const [landerData, setLanderData] = useState({
    name: '',
    type: 'LANDING',
    url: '',
    domain: '',
    tags: []
  });

  const [domains, setDomains] = useState([]);

  useEffect(() => {
    if (landerToEdit) {
      // When editing a lander, populate the form with existing data
      let domain = '';
      let queryParams = '';
      
      // Extract domain and query parameters from the full URL
      if (landerToEdit.url) {
        try {
          // Parse the URL to extract domain and path
          const urlObj = new URL(landerToEdit.url);
          domain = urlObj.hostname;
          
          // Get the query parameters (search part of the URL)
          queryParams = urlObj.search;
        } catch (error) {
          console.error('Error parsing URL:', error);
        }
      }
      
      // Set the form data with parsed values
      setLanderData({
        name: landerToEdit.name || '',
        type: landerToEdit.type || 'LANDING',
        url: queryParams, // Just the query parameters portion
        domain: domain, // Just the domain portion
        tags: landerToEdit.tags || []
      });
    } else {
      // Reset form for new lander
      setLanderData({
        name: '',
        type: 'LANDING',
        url: '',
        domain: '',
        tags: []
      });
    }
  }, [landerToEdit]);

  const handleChange = (e) => {
    setLanderData({ ...landerData, [e.target.name]: e.target.value });
  };

  const handleMacroClick = (macro) => {
    // Extract the parameter name without braces
    const paramName = macro.replace('{', '').replace('}', '');
    
    // Determine if we need to add ? or & as separator
    let currentUrl = landerData.url || '';
    let separator = '';
    
    if (currentUrl === '') {
      separator = '?';
    } else if (currentUrl.includes('?')) {
      if (currentUrl.endsWith('?') || currentUrl.endsWith('&')) {
        separator = '';
      } else {
        separator = '&';
      }
    } else {
      separator = '?';
    }
    
    // Construct the new parameter
    const newParam = `${separator}${paramName}=${macro}`;
    
    // Update the URL
    setLanderData({ ...landerData, url: currentUrl + newParam });
  };

  const handleSave = async () => {
    try {
      // Get query parameters (ensure proper formatting with ? if needed)
      let queryParams = landerData.url.trim();
      if (queryParams && !queryParams.startsWith('?')) {
        queryParams = `?${queryParams}`;
      }
      
      // Format the final URL with the domain and click path
      const finalUrl = `https://${landerData.domain}/click`;
      
      const payload = {
        ...landerData,
        url: finalUrl
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
      onLanderCreated(savedLander);
      onClose();
    } catch (err) {
      console.error('Error saving lander:', err);
    }
  };

  useEffect(() => {
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
  }, []);

  // Calculate the preview URL to show the user
  const getPreviewUrl = () => {
    if (!landerData.domain) return '';
    
    // Get query parameters (ensure proper formatting with ? if needed)
    let queryParams = landerData.url.trim();
    if (queryParams && !queryParams.startsWith('?')) {
      queryParams = `?${queryParams}`;
    }
    
    return `https://${landerData.domain}/click`;
  };

  // All available macro tokens based on the image
  const allMacros = [
    '{lpkeyua}', '{sub1}', '{sub2}', '{sub3}', '{sub4}', '{sub5}', '{sub6}', '{sub7}', '{sub8}', '{sub9}',
    '{sub10}', '{sub11}', '{sub12}', '{sub13}', '{sub14}', '{sub15}', '{sub16}', '{sub17}', '{sub18}',
    '{sub19}', '{sub20}', '{rt_campaignid}', '{rt_adgroupid}', '{rt_adid}', '{rt_placementid}', '{rt_source}',
    '{rt_medium}', '{rt_campaign}', '{rt_adgroup}', '{rt_ad}', '{rt_placement}', '{rt_keyword}', '{rt_role_1}',
    '{rt_role_2}', '{clickid}', '{campaignid}', '{campaignname}', '{sourceid}', '{trafficsourcename}', '{useragent}',
    '{os}', '{osversion}', '{browser}', '{browserver}', '{brand}', '{model}', '{country}', '{countryname}',
    '{region}', '{city}', '{isp}', '{ip}', '{language}', '{timestamp}', '{clicktime}', '{prelanderid}',
    '{prelandername}', '{landerid}', '{landername}', '{offerid}', '{offername}', '{referrerdomain}', '{connectiontype}',
    '{palias}', '{networkid}', '{networkname}'
  ];

  const landingTypes = [
    { value: 'LANDING', label: 'LANDING' },
    { value: 'PRE-LANDING', label: 'PRE-LANDING' }
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }
      }}
    >
      <StyledDialogTitle>
        <Typography variant="h6">
          {landerToEdit ? 'Edit Lander' : 'Add New Lander'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3, mt: 1 }}>
        {/* Name field */}
        <FormSection>
          <FormLabel component="label" htmlFor="name">
            <Box display="flex" alignItems="center">
              <DescriptionIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              Name *
            </Box>
          </FormLabel>
          <TextField
            id="name"
            name="name"
            fullWidth
            variant="outlined"
            value={landerData.name}
            onChange={handleChange}
            required
            placeholder="Enter lander name"
            size="medium"
            InputProps={{
              sx: { borderRadius: 1.5 }
            }}
          />
        </FormSection>

        {/* Landing page type selection */}
        <FormSection>
          <FormLabel component="div">
            <Box display="flex" alignItems="center">
              <FormatListBulletedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              Type
            </Box>
          </FormLabel>
          <FormHelperText sx={{ mb: 1.5 }}>
            Choose the type of your landing page.
          </FormHelperText>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {landingTypes.map((type) => (
              <TypeSelector
                key={type.value}
                selected={landerData.type === type.value}
                onClick={() => setLanderData({ ...landerData, type: type.value })}
              >
                <Typography 
                  variant="body2" 
                  fontWeight={landerData.type === type.value ? 600 : 400}
                  color={landerData.type === type.value ? 'primary.main' : 'text.primary'}
                >
                  {type.label}
                </Typography>
              </TypeSelector>
            ))}
          </Box>
        </FormSection>

        {/* URL field */}
        <FormSection>
          <FormLabel component="label" htmlFor="url">
            <Box display="flex" alignItems="center">
              <LinkIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              URL*
            </Box>
          </FormLabel>
          <TextField
            id="url"
            name="url"
            fullWidth
            variant="outlined"
            value={landerData.url}
            onChange={handleChange}
            placeholder="?sub1={sub1}&sub2={sub2}"
            required
            InputProps={{
              sx: { borderRadius: 1.5, fontFamily: 'monospace' }
            }}
          />
        </FormSection>

        {/* Macros/tokens */}
        <FormSection>
          <FormLabel>
            <Box display="flex" alignItems="center">
              <CodeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              Available Macros
            </Box>
          </FormLabel>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              maxHeight: 180, 
              overflowY: 'auto',
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              backgroundColor: alpha(theme.palette.background.default, 0.4)
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {allMacros.map((macro, index) => (
                <MacroChip
                  key={index}
                  label={macro}
                  onClick={() => handleMacroClick(macro)}
                  size="small"
                />
              ))}
            </Box>
          </Paper>
        </FormSection>

        {/* Tracking domain */}
        <FormSection>
          <FormLabel component="label" htmlFor="domain">
            <Box display="flex" alignItems="center">
              <LanguageIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              Tracking Domain *
            </Box>
          </FormLabel>
          <FormControl fullWidth variant="outlined">
            <Select
              id="domain"
              name="domain"
              value={landerData.domain}
              onChange={handleChange}
              displayEmpty
              renderValue={(selected) => selected || "Select a tracking domain"}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300,
                    borderRadius: 8
                  },
                },
              }}
              sx={{ borderRadius: 1.5 }}
            >
              <MenuItem disabled value="">
                <em>Select a tracking domain</em>
              </MenuItem>
              {domains.map((domain) => (
                <MenuItem key={domain.id} value={domain.url}>
                  {domain.url}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormHelperText>
            We strongly advise using custom tracking domain. Tracking script and /click URL should use the same tracking domain.
            You can set-up domain in Tools &gt; Domains
          </FormHelperText>
        </FormSection>

        {/* Click URL Preview */}
        <FormSection>
          <FormLabel component="label" htmlFor="preview-url">
            <Box display="flex" alignItems="center">
              <InfoOutlinedIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              Click URL
            </Box>
          </FormLabel>
          
          <TextField
            id="preview-url"
            fullWidth
            variant="outlined"
            value={getPreviewUrl()}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">
                  <ContentCopyIcon color="action" fontSize="small" sx={{ cursor: 'pointer' }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 1.5, 
                backgroundColor: alpha(theme.palette.background.default, 0.4),
                fontFamily: 'monospace',
                fontSize: '0.875rem'
              }
            }}
          />
          
          <FormHelperText>
            Replace URL to offer (hop-link) on your landing page with tracking.domain/click URL. You can add additional parameters to 
            the URL, ex: /click?sub1=variation1 to collect additional details on landing page performance.
          </FormHelperText>
        </FormSection>

        {/* Tags section */}
        <FormSection>
          <FormLabel>
            <Box display="flex" alignItems="center">
              <TagIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              Tags
            </Box>
          </FormLabel>
          
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              minHeight: 60,
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {landerData.tags && landerData.tags.length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {landerData.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => {
                      const newTags = [...landerData.tags];
                      newTags.splice(index, 1);
                      setLanderData({ ...landerData, tags: newTags });
                    }}
                    size="small"
                    sx={{ borderRadius: 1 }}
                  />
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No tags selected. Tags help you organize and filter your landers.
              </Typography>
            )}
          </Paper>
        </FormSection>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <ActionButton 
          variant="outlined" 
          onClick={onClose}
          sx={{ mr: 1 }}
        >
          Cancel
        </ActionButton>
        <ActionButton 
          variant="contained" 
          color="primary" 
          onClick={handleSave}
          disabled={!landerData.name || !landerData.domain}
          startIcon={<CheckCircleIcon />}
        >
          {landerToEdit ? 'Update Lander' : 'Create Lander'}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
};

// Date Range Selector Component
const DateRangeSelector = ({ startDate, endDate, onDateChange }) => {
  const theme = useTheme();
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <DateRangeIcon color="action" sx={{ mr: 2 }} />
        
        <Box display="flex" gap={2} alignItems="center">
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newDate) => onDateChange('startDate', newDate)}
            slotProps={{ 
              textField: { 
                size: "small",
                sx: { width: 170 }
              } 
            }}
          />
          <Typography variant="body2" color="text.secondary">to</Typography>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newDate) => onDateChange('endDate', newDate)}
            minDate={startDate}
            slotProps={{ 
              textField: { 
                size: "small",
                sx: { width: 170 }
              } 
            }}
          />
        </Box>
        
        <Box flexGrow={1} />
        
        <Stack direction="row" spacing={1}>
          <ActionButton 
            variant="outlined" 
            size="small"
            onClick={() => {
              const today = new Date();
              onDateChange('startDate', new Date(today.setDate(today.getDate() - 7)));
              onDateChange('endDate', new Date());
            }}
          >
            Last 7 Days
          </ActionButton>
          <ActionButton 
            variant="outlined" 
            size="small"
            onClick={() => {
              const today = new Date();
              onDateChange('startDate', new Date(today.setDate(today.getDate() - 30)));
              onDateChange('endDate', new Date());
            }}
          >
            Last 30 Days
          </ActionButton>
          <ActionButton 
            variant="outlined" 
            size="small"
            onClick={() => {
              const today = new Date();
              onDateChange('startDate', new Date(today.setDate(today.getDate() - 90)));
              onDateChange('endDate', new Date());
            }}
          >
            Last 90 Days
          </ActionButton>
        </Stack>
      </Paper>
    </LocalizationProvider>
  );
};

// Metrics Summary Component
const MetricsSummary = ({ selectedRows }) => {
  const theme = useTheme();
  
  // Calculate totals and averages for selected rows
  const getTotals = () => {
    if (!selectedRows || selectedRows.length === 0) return null;
    
    const totals = {
      impressions: 0,
      clicks: 0,
      lp_views: 0,
      lp_clicks: 0,
      conversion: 0,
      total_revenue: 0,
      cost: 0,
      profit: 0
    };
    
    selectedRows.forEach(row => {
      totals.impressions += row.impressions || 0;
      totals.clicks += row.clicks || 0;
      totals.lp_views += row.lp_views || 0;
      totals.lp_clicks += row.lp_clicks || 0;
      totals.conversion += row.conversion || 0;
      totals.total_revenue += row.total_revenue || 0;
      totals.cost += row.cost || 0;
      totals.profit += row.profit || 0;
    });
    
    // Calculate averages
    const averages = {
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      lpctr: totals.lp_views > 0 ? (totals.lp_clicks / totals.lp_views) * 100 : 0,
      cr: totals.clicks > 0 ? (totals.conversion / totals.clicks) * 100 : 0,
      epc: totals.clicks > 0 ? totals.total_revenue / totals.clicks : 0,
      roi: totals.cost > 0 ? ((totals.total_revenue - totals.cost) / totals.cost) * 100 : 0
    };
    
    return { totals, averages };
  };
  
  const metrics = getTotals();
  
  if (!metrics) return null;
  
  const metricItems = [
    { 
      title: 'Impressions', 
      value: metrics.totals.impressions.toLocaleString(), 
      icon: <VisibilityIcon />,
      color: 'primary' 
    },
    { 
      title: 'Clicks', 
      value: metrics.totals.clicks.toLocaleString(), 
      icon: <MouseIcon />,
      color: 'secondary' 
    },
    { 
      title: 'Conversions', 
      value: metrics.totals.conversion.toLocaleString(), 
      icon: <CheckCircleIcon />,
      color: 'success' 
    },
    { 
      title: 'CTR', 
      value: `${metrics.averages.ctr.toFixed(2)}%`, 
      icon: <TrendingUpIcon />,
      color: 'info' 
    },
    { 
      title: 'Revenue', 
      value: `$${metrics.totals.total_revenue.toFixed(2)}`, 
      icon: <AttachMoneyIcon />,
      color: 'primary' 
    },
    { 
      title: 'Cost', 
      value: `$${metrics.totals.cost.toFixed(2)}`, 
      icon: <AttachMoneyIcon />,
      color: 'error' 
    },
    { 
      title: 'Profit', 
      value: `$${metrics.totals.profit.toFixed(2)}`, 
      icon: <AttachMoneyIcon />,
      color: 'success' 
    },
    { 
      title: 'ROI', 
      value: `${metrics.averages.roi.toFixed(2)}%`, 
      icon: <ArrowUpwardIcon />,
      color: metrics.averages.roi >= 0 ? 'success' : 'error' 
    }
  ];
  
  return (
    <Box sx={{ mt: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <PeopleIcon sx={{ mr: 1 }} />
        Summary for {selectedRows.length} Selected Landers
      </Typography>
      
      <Grid container spacing={2}>
        {metricItems.map((metric, index) => (
          <Grid item xs={6} md={3} key={index}>
            <MetricCard color={metric.color}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  {metric.title}
                </Typography>
                <MetricIcon color={metric.color}>
                  {metric.icon}
                </MetricIcon>
              </Box>
              <Typography variant="h4" fontWeight={600}>
                {metric.value}
              </Typography>
            </MetricCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Main page component
const LandingPage = () => {
  const theme = useTheme();
  const [landers, setLanders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editLander, setEditLander] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState(new Date()); // Today
  const [selectionModel, setSelectionModel] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);

  const fetchLanders = async () => {
    setLoading(true);
    try {
      // Get all landers
      const landersRes = await fetch('https://pearmllc.onrender.com/api/landers');
      if (!landersRes.ok) {
        throw new Error('Failed to fetch landers');
      }
      const landersData = await landersRes.json();
      
      // Format dates for API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Get metrics for each lander
      const landersWithMetrics = await Promise.all(landersData.map(async (lander, index) => {
        try {
          // Fetch metrics for this lander
          const metricsRes = await fetch(
            `https://pearmllc.onrender.com/api/metrics/lander/${lander.id}?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
          );
          
          let metrics = {
            impressions: 0,
            clicks: 0,
            lpviews: 0,
            lpclicks: 0,
            conversions: 0,
            revenue: 0,
            cost: 0,
            profit: 0,
            ctr: 0,
            lpctr: 0,
            cr: 0,
            epc: 0,
            ctc: 0,
            roi: 0
          };
          
          if (metricsRes.ok) {
            const metricsData = await metricsRes.json();
            metrics = metricsData || metrics;
          }
          
          return {
            id: lander.id || lander.Serial_No || index + 1,
            ...lander,
            // Map metrics to the lander object
            impressions: metrics.impressions || 0,
            clicks: metrics.clicks || 0,
            lp_views: metrics.lpviews || 0,
            lp_clicks: metrics.lpclicks || 0,
            conversion: metrics.conversions || 0,
            total_revenue: metrics.revenue || 0,
            cost: metrics.cost || 0,
            profit: metrics.profit || 0,
            total_cpa: metrics.ctc || 0,
            epc: metrics.epc || 0,
            total_roi: metrics.roi || 0,
            ctr: metrics.ctr || 0,
            lpctr: metrics.lpctr || 0,
            cr: metrics.cr || 0
          };
        } catch (error) {
          console.error(`Error fetching metrics for lander ${lander.id}:`, error);
          
          // Return lander with default metrics if fetch fails
          return {
            id: lander.id || lander.Serial_No || index + 1,
            ...lander,
            impressions: 0,
            clicks: 0,
            lp_views: 0,
            lp_clicks: 0,
            conversion: 0,
            total_revenue: 0,
            cost: 0,
            profit: 0,
            total_cpa: 0,
            epc: 0,
            total_roi: 0,
            ctr: 0,
            lpctr: 0,
            cr: 0
          };
        }
      }));
      
      setLanders(landersWithMetrics);
    } catch (err) {
      console.error('Error fetching landers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanders();
  }, [startDate, endDate]); // Refetch when date range changes

  const handleDateChange = (type, value) => {
    if (type === 'startDate') {
      setStartDate(value);
    } else {
      setEndDate(value);
    }
  };

  const handleSelectionModelChange = (newSelectionModel) => {
    setSelectionModel(newSelectionModel);
    const selectedRowsData = newSelectionModel.map(id => 
      landers.find(lander => lander.id === id)
    ).filter(Boolean); // Filter out any undefined values
    setSelectedRows(selectedRowsData);
  };

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

  const handleExportCSV = () => {
    const dataToExport = selectedRows.length > 0 ? selectedRows : landers;
    
    // Format data for CSV
    const headers = [
      'ID', 'Name', 'URL', 'Impressions', 'Clicks', 'LP Views', 'LP Clicks',
      'Conversions', 'CTR (%)', 'LP CTR (%)', 'CR (%)', 'CPA ($)', 'EPC ($)',
      'Revenue ($)', 'Cost ($)', 'Profit ($)', 'ROI (%)'
    ];
    
    const csvData = dataToExport.map(lander => [
      lander.id,
      lander.name,
      lander.url,
      lander.impressions,
      lander.clicks,
      lander.lp_views,
      lander.lp_clicks,
      lander.conversion,
      lander.ctr ? lander.ctr.toFixed(2) : '0.00',
      lander.lpctr ? lander.lpctr.toFixed(2) : '0.00',
      lander.cr ? lander.cr.toFixed(2) : '0.00',
      lander.total_cpa ? lander.total_cpa.toFixed(2) : '0.00',
      lander.epc ? lander.epc.toFixed(2) : '0.00',
      lander.total_revenue ? lander.total_revenue.toFixed(2) : '0.00',
      lander.cost ? lander.cost.toFixed(2) : '0.00',
      lander.profit ? lander.profit.toFixed(2) : '0.00',
      lander.total_roi ? lander.total_roi.toFixed(2) : '0.00'
    ]);
    
    // Create CSV content
    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `landers_metrics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const macros = [
    '{sub1}', '{sub2}', '{sub3}', '{clickid}', '{campaignid}', '{campaignname}',
    '{sourceid}', '{country}', '{city}', '{ip}', '{timestamp}', '{useragent}',
    '{os}', '{browser}', '{referrerdomain}'
  ];

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'name',
      headerName: 'Name',
      width: 220,
      renderCell: (params) => {
        if (!params || !params.row) return null;
        const row = params.row;
        return (
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
            sx={{
              '&:hover .hover-icons': { opacity: 1 }
            }}
          >
            <Typography variant="body2" fontWeight={500}>{row.name}</Typography>
            <Box 
              className="hover-icons" 
              display="flex" 
              gap={0.5} 
              opacity={0}
              sx={{ transition: 'opacity 0.2s ease' }}
            >
              <Tooltip title="Edit Lander">
                <IconButton
                  size="small"
                  sx={{ 
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: theme.palette.primary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.16),
                    }
                  }}
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
                  sx={{ 
                    backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.16),
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(row.url);
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
      renderCell: (params) => {
        if (!params || params.value == null) return null;
        return (
          <Typography
            variant="body2"
            fontFamily="monospace"
            fontSize="0.8125rem"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }}
          >
            {params.value == landerData.url ? params.value : 'URL not available'}
          </Typography>
        );
      } 
    },
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      width: 180,
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return new Date(params.value).toLocaleString();
      }
    },
    { 
      field: 'updatedAt', 
      headerName: 'Updated At', 
      width: 180,
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return new Date(params.value).toLocaleString();
      }
    },
    { 
      field: 'impressions', 
      headerName: 'Impressions', 
      width: 120,
      type: 'number',
      align: 'right',
      headerAlign: 'right'
    },
    { 
      field: 'clicks', 
      headerName: 'Clicks', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right'
    },
    { 
      field: 'lp_views', 
      headerName: 'LP Views', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right' 
    },
    { 
      field: 'lp_clicks', 
      headerName: 'LP Clicks', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right'
    },
    { 
      field: 'conversion', 
      headerName: 'Conversions', 
      width: 120,
      type: 'number',
      align: 'right',
      headerAlign: 'right'
    },
    { 
      field: 'ctr', 
      headerName: 'CTR (%)', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `${params.value.toFixed(2)}%`;
      }
    },
    { 
      field: 'lpctr', 
      headerName: 'LP CTR (%)', 
      width: 110,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `${params.value.toFixed(2)}%`;
      }
    },
    { 
      field: 'cr', 
      headerName: 'CR (%)', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `${params.value.toFixed(2)}%`;
      }
    },
    { 
      field: 'total_cpa', 
      headerName: 'CPA ($)', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `$${params.value.toFixed(2)}`;
      }
    },
    { 
      field: 'epc', 
      headerName: 'EPC ($)', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `$${params.value.toFixed(2)}`;
      }
    },
    { 
      field: 'total_revenue', 
      headerName: 'Revenue ($)', 
      width: 120,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `$${params.value.toFixed(2)}`;
      }
    },
    { 
      field: 'cost', 
      headerName: 'Cost ($)', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `$${params.value.toFixed(2)}`;
      }
    },
    { 
      field: 'profit', 
      headerName: 'Profit ($)', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `$${params.value.toFixed(2)}`;
      }
    },
    { 
      field: 'total_roi', 
      headerName: 'ROI (%)', 
      width: 100,
      type: 'number',
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `${params.value.toFixed(2)}%`;
      }
    }
  ];

  const filteredLanders = currentTab === 0 
    ? landers 
    : currentTab === 1 
      ? landers.filter(lander => lander.profit > 0) 
      : landers.filter(lander => lander.profit <= 0);

  return (
    <Layout>
      <Box >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Landers Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage your landing pages and track their performance
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderTopLeftRadius: 3,
                borderTopRightRadius: 3
              }
            }}
          >
            <Tab 
              label={
                <Badge badgeContent={landers.length} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
                  <Typography variant="button" fontWeight={currentTab === 0 ? 600 : 400}>All Landers</Typography>
                </Badge>
              } 
              />
          </Tabs>
          
          <Box display="flex" gap={1}>
            <ActionButton 
              variant="outlined" 
              color="primary" 
              onClick={handleExportCSV}
              disabled={loading}
              startIcon={<DownloadIcon />}
            >
              Export CSV
            </ActionButton>
            <ActionButton 
              variant="contained" 
              color="primary" 
              onClick={handleOpen}
              startIcon={<AddIcon />}
            >
              New Lander
            </ActionButton>
          </Box>
        </Box>

        <DateRangeSelector 
          startDate={startDate}
          endDate={endDate}
          onDateChange={handleDateChange}
        />

        {selectedRows.length > 0 && (
          <MetricsSummary selectedRows={selectedRows} />
        )}

        <Box sx={{ position: 'relative', mt: 3 }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 10,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <CircularProgress />
            </Box>
          )}
          
          <StyledDataGrid
            rows={filteredLanders}
            columns={columns}
            autoHeight
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50, 100]}
            checkboxSelection
            disableSelectionOnClick
            onRowClick={handleRowClick}
            selectionModel={selectionModel}
            onSelectionModelChange={handleSelectionModelChange}
            initialState={{
              sorting: {
                sortModel: [{ field: 'impressions', sort: 'desc' }],
              },
              pagination: {
                pageSize: 10,
              },
            }}
            components={{
              NoRowsOverlay: () => (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                  <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 1 }}>No Landers Found</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add your first lander to get started
                  </Typography>
                </Box>
              ),
            }}
            sx={{
              '.MuiDataGrid-row:hover .hover-icons': {
                opacity: 1,
              },
            }}
          />
        </Box>
      </Box>

      <LanderModal
        open={open}
        onClose={handleClose}
        macros={macros}
        onLanderCreated={fetchLanders}
        landerToEdit={editLander}
      />
    </Layout>
  );
};

export default LandingPage;