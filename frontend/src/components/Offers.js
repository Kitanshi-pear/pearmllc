import React, { useEffect, useState } from 'react';
import {
    Box, CircularProgress, Typography, Grid, TextField, Button, Select, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, IconButton,
    Tooltip, Snackbar, Alert, Card, CardContent, Tabs, Tab, Paper, Divider, Container,
    useTheme, alpha, styled, Badge, Chip, Avatar, InputAdornment
} from "@mui/material";
import { DataGrid, gridClasses } from '@mui/x-data-grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TitleIcon from '@mui/icons-material/Title';
import SendIcon from '@mui/icons-material/Send';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RefreshIcon from '@mui/icons-material/Refresh';
import LinkIcon from '@mui/icons-material/Link';
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import SettingsIcon from '@mui/icons-material/Settings';
import PublicIcon from '@mui/icons-material/Public';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import Layout from "./Layout";
import axios from 'axios';

// Modern styled components with improved aesthetics
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  },
}));

const GradientButton = styled(Button)(({ theme, colorStart = '#4776E6', colorEnd = '#8E54E9' }) => ({
  background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  transition: 'all 0.2s',
  color: 'white',
  fontWeight: 600,
  borderRadius: 8,
  padding: '8px 16px',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
  },
}));

const AnimatedIconButton = styled(IconButton)(({ theme }) => ({
  transition: 'transform 0.15s, background 0.15s',
  '&:hover': {
    transform: 'scale(1.08)',
    background: alpha(theme.palette.primary.main, 0.08),
  },
}));

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  borderRadius: 12,
  '& .MuiDataGrid-root': {
    border: 'none',
  },
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: alpha(theme.palette.primary.main, 0.06),
    padding: '16px',
    '&:first-of-type': {
      borderTopLeftRadius: 12,
    },
    '&:last-of-type': {
      borderTopRightRadius: 12,
    },
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
  },
  '& .MuiDataGrid-cell': {
    padding: '16px',
    fontSize: '0.9rem',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
  },
  '& .MuiDataGrid-row': {
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.03),
    },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
      },
    },
  },
  // Subtle zebra striping for better readability
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: alpha(theme.palette.primary.main, 0.01),
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
  borderRadius: 6,
  ...(status === 'active' && {
    background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    color: '#05603a',
  }),
  ...(status === 'inactive' && {
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    color: '#4b4b4b',
  }),
}));

const GradientBox = styled(Box)(({ theme, colorStart = '#a1c4fd', colorEnd = '#c2e9fb' }) => ({
  background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
  borderRadius: 16,
  padding: theme.spacing(4, 3),
  color: theme.palette.getContrastText(theme.palette.primary.light),
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
}));

// Clean, modern modal container
const ModalContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "900px",
  maxWidth: "95vw",
  maxHeight: "90vh",
  overflow: "auto",
  backgroundColor: theme.palette.background.paper,
  borderRadius: 16,
  boxShadow: '0 16px 32px rgba(0, 0, 0, 0.12)',
  padding: 0,
}));

// Custom styled tab
const StyledTab = styled(Tab)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '0.9rem',
  textTransform: 'none',
  minWidth: 120,
  transition: 'all 0.2s',
  '&.Mui-selected': {
    color: theme.palette.primary.main,
  },
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && <>{children}</>}
    </div>
  );
};

// Refined text field for better visual consistency
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    transition: 'box-shadow 0.15s',
    '&:hover': {
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
    },
    '&.Mui-focused': {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.9rem',
  },
  '& .MuiOutlinedInput-input': {
    padding: '14px 16px',
  }
}));

// Enhanced select field
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 8,
    transition: 'box-shadow 0.15s',
    '&:hover': {
      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06)',
    },
    '&.Mui-focused': {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    }
  },
  '& .MuiInputLabel-root': {
    fontSize: '0.9rem',
  },
  '& .MuiSelect-select': {
    padding: '14px 16px',
  }
}));

// Define postback macros globally
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
    STATUS: '{status}',
    EVENT_NAME: '{event_name}',
    GCLID: '{gclid}',
    SUB1: '{sub1}',
    SUB2: '{sub2}',
    SUB3: '{sub3}',
    SUB4: '{sub4}',
    SUB5: '{sub5}'
};

// Generate postback URL format based on traffic source
const generatePostbackTemplate = (baseUrl = window.location.origin, trafficSource = '') => {
    const apiPostbackUrl = `${baseUrl}/api/postback/conversion?click_id=${POSTBACK_MACROS.CLICKID}`;
    
    if (trafficSource.toLowerCase() === 'facebook') {
        return `${apiPostbackUrl}&event_name=${POSTBACK_MACROS.EVENT_NAME}&payout=${POSTBACK_MACROS.PAYOUT}&revenue=${POSTBACK_MACROS.REVENUE}&offer_id=${POSTBACK_MACROS.OFFER_ID}&sub1=${POSTBACK_MACROS.SUB1}&sub2=${POSTBACK_MACROS.SUB2}`;
    } else if (trafficSource.toLowerCase() === 'google') {
        return `${apiPostbackUrl}&event_name=${POSTBACK_MACROS.EVENT_NAME}&payout=${POSTBACK_MACROS.PAYOUT}&revenue=${POSTBACK_MACROS.REVENUE}&offer_id=${POSTBACK_MACROS.OFFER_ID}&sub1=${POSTBACK_MACROS.GCLID}`;
    } else {
        return `${apiPostbackUrl}&payout=${POSTBACK_MACROS.PAYOUT}&revenue=${POSTBACK_MACROS.REVENUE}&offer_id=${POSTBACK_MACROS.OFFER_ID}&status=1`;
    }
};

// Parse a postback URL by replacing macros with actual values
const parsePostbackUrl = (template, data) => {
    if (!template) return '';
    
    let url = template;
    
    // Replace all macros with actual values if they exist
    Object.entries(POSTBACK_MACROS).forEach(([key, macro]) => {
        const valueKey = key.toLowerCase();
        const value = data[valueKey] || '';
        url = url.replace(new RegExp(macro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), encodeURIComponent(value));
    });
    
    return url;
};

// Function to get source icon based on source name
const getSourceIcon = (source) => {
  const sourceLower = source?.toLowerCase() || '';
  
  if (sourceLower === 'facebook') {
    return <FacebookIcon sx={{ color: '#1877F2' }} />;
  } else if (sourceLower === 'google') {
    return <GoogleIcon sx={{ color: '#4285F4' }} />;
  } else if (sourceLower === 'tiktok') {
    return <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>TT</Box>;
  } else {
    return <LinkIcon />;
  }
};

const OffersPage = () => {
    const theme = useTheme();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [offerSources, setOfferSources] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [tabValue, setTabValue] = useState(0);
    const [postbackTestDialogOpen, setPostbackTestDialogOpen] = useState(false);
    const [selectedOffer, setSelectedOffer] = useState(null);
    
    // Postback testing state
    const [testPostbackData, setTestPostbackData] = useState({
        click_id: 'test_' + Math.random().toString(36).substring(2, 10),
        payout: '10.00',
        revenue: '10.00',
        conversion_id: 'conv_' + Date.now(),
        offer_id: '',
        offer_name: '',
        campaign_id: 'camp_1',
        campaign_name: 'Test Campaign',
        source: '',
        ip: '192.168.0.1',
        country: 'US',
        device: 'desktop',
        browser: 'Chrome',
        os: 'Windows',
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

    // State variables for filters
    const [date, setDate] = useState('');
    const [titleText, setTitleText] = useState('');
    const [filterText, setFilterText] = useState('');

    // New offer state
    const [newOffer, setNewOffer] = useState({
        name: '',
        source: '',
        url: '',
        revenue: 0,
        country: 'Global',
        postbackUrl: ''
    });

    // Stats for dashboard
    const [stats, setStats] = useState({
        totalOffers: 0,
        activeOffers: 0,
        totalConversions: 0,
        totalRevenue: 0,
        totalProfit: 0
    });

    // Fetch offer sources on component mount
    useEffect(() => {
        fetch('https://pearmllc.onrender.com/offersource/')
            .then(res => res.json())
            .then(data => {
                setOfferSources(data);
                console.log("Fetched Offer Sources:", data);
            })
            .catch(err => console.error(err));
    }, []);
    
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewOffer(prev => ({ ...prev, [name]: value }));
    };

    const handleSourceChange = (e) => {
        const selectedSourceName = e.target.value;
    
        const sourceDetails = offerSources.find(src => src.name === selectedSourceName);
    
        setNewOffer(prev => ({
            ...prev,
            source: selectedSourceName,
            // Generate postback URL based on source type
            postbackUrl: generatePostbackTemplate(window.location.origin, selectedSourceName)
        }));
    };
    
    // Handlers for filters
    const handleDateChange = (event) => setDate(event.target.value);
    const handleTitleChange = (event) => setTitleText(event.target.value);
    const handleFilterReset = () => {
        setDate('');
        setTitleText('');
        setFilterText('');
        // Re-fetch offers with no filters
        fetchOffers();
    };

    // Apply filters
    const handleApplyFilters = () => {
        // You would typically call your API with filter parameters here
        // For now, we'll just simulate filtering by offer name
        if (titleText) {
            const filteredOffers = offers.filter(offer => 
                offer.offers_name.toLowerCase().includes(titleText.toLowerCase())
            );
            setOffers(filteredOffers);
        } else {
            // If no filters, fetch all offers
            fetchOffers();
        }
    };

    // Postback URL handlers
    const handleCopyPostback = () => {
        navigator.clipboard.writeText(newOffer.postbackUrl);
        setSnackbar({
            open: true,
            message: 'Postback URL copied to clipboard',
            severity: 'success'
        });
    };

    const handleGeneratePostbackTemplate = () => {
        setNewOffer(prev => ({
            ...prev,
            postbackUrl: generatePostbackTemplate(window.location.origin, prev.source)
        }));
    };

    const handleInsertMacro = (macro) => {
        setNewOffer(prev => ({
            ...prev,
            postbackUrl: prev.postbackUrl + macro
        }));
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
        if (!selectedOffer) return '';
        
        const url = parsePostbackUrl(selectedOffer.postbackUrl, {
            ...testPostbackData,
            offer_id: selectedOffer.id,
            offer_name: selectedOffer.offers_name
        });
        
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

    const handleOpenPostbackTest = (offer) => {
        setSelectedOffer(offer);
        setTestPostbackData(prev => ({
            ...prev,
            offer_id: offer.id,
            offer_name: offer.offers_name,
            source: offer.source || ''
        }));
        setPostbackTestDialogOpen(true);
    };

    const handleClosePostbackTest = () => {
        setPostbackTestDialogOpen(false);
        setProcessedUrl('');
        setTestResult(null);
    };

    // Snackbar close handler
    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Enhanced columns for DataGrid with modern styling
    const columns = [
        { 
            field: 'serial_no', 
            headerName: '#', 
            width: 70,
            align: 'center',
            headerAlign: 'center'
        },
        { 
            field: 'offers_name', 
            headerName: 'Offer Name', 
            width: 220,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                        sx={{ 
                            width: 32, 
                            height: 32, 
                            mr: 1.5,
                            background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`
                        }}
                    >
                        {params.value.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {params.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            ID: {params.row.id}
                        </Typography>
                    </Box>
                </Box>
            )
        },
        { 
            field: 'offer_status', 
            headerName: 'Status', 
            width: 110,
            renderCell: (params) => {
                const isActive = params.value?.toLowerCase() === 'active';
                return (
                    <StatusChip
                        label={params.value || 'Unknown'}
                        status={isActive ? 'active' : 'inactive'}
                        icon={isActive ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
                        size="small"
                    />
                );
            }
        },
        { 
            field: 'source', 
            headerName: 'Source', 
            width: 120,
            renderCell: (params) => (
                <Chip
                    icon={getSourceIcon(params.value)}
                    label={params.value || 'Unknown'}
                    variant="outlined"
                    size="small"
                    sx={{ 
                        borderRadius: 6,
                        '& .MuiChip-icon': {
                            mr: 0.5
                        }
                    }}
                />
            )
        },
        { 
            field: 'postbackUrl', 
            headerName: 'Postback', 
            width: 100,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {params.value ? (
                        <Tooltip title="Test Postback">
                            <AnimatedIconButton 
                                size="small" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPostbackTest(params.row);
                                }}
                                sx={{ color: theme.palette.warning.main }}
                            >
                                <VisibilityIcon fontSize="small" />
                            </AnimatedIconButton>
                        </Tooltip>
                    ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                </Box>
            ),
        },
        { 
            field: 'clicks', 
            headerName: 'Clicks', 
            width: 90, 
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography sx={{ fontWeight: 600 }}>
                    {params.value?.toLocaleString() || 0}
                </Typography>
            )
        },
        { 
            field: 'conversion', 
            headerName: 'Conv.', 
            width: 90, 
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Typography sx={{ fontWeight: 600 }}>
                    {params.value?.toLocaleString() || 0}
                </Typography>
            )
        },
        { 
            field: 'total_cpa', 
            headerName: 'CPA ($)', 
            width: 110, 
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                const value = params.value || 0;
                return (
                    <Typography sx={{ 
                        fontWeight: 600,
                        color: value > 10 ? theme.palette.error.main : theme.palette.success.main 
                    }}>
                        ${value.toFixed(2)}
                    </Typography>
                );
            }
        },
        { 
            field: 'epc', 
            headerName: 'EPC ($)', 
            width: 110, 
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                const value = params.value || 0;
                return (
                    <Typography sx={{ 
                        fontWeight: 600,
                        color: value > 0.5 ? theme.palette.success.main : theme.palette.text.primary 
                    }}>
                        ${value.toFixed(2)}
                    </Typography>
                );
            }
        },
        { 
            field: 'total_revenue', 
            headerName: 'Revenue', 
            width: 120, 
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                const value = params.value || 0;
                return (
                    <Typography sx={{ fontWeight: 600 }}>
                        ${value.toFixed(2)}
                    </Typography>
                );
            }
        },
        { 
            field: 'profit', 
            headerName: 'Profit', 
            width: 120, 
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                const value = params.value || 0;
                const isPositive = value >= 0;
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {isPositive ? 
                            <ArrowUpwardIcon fontSize="small" sx={{ color: theme.palette.success.main, mr: 0.5 }} /> :
                            <ArrowDownwardIcon fontSize="small" sx={{ color: theme.palette.error.main, mr: 0.5 }} />
                        }
                        <Typography sx={{ 
                            fontWeight: 600,
                            color: isPositive ? theme.palette.success.main : theme.palette.error.main
                        }}>
                            ${Math.abs(value).toFixed(2)}
                        </Typography>
                    </Box>
                );
            }
        },
        { 
            field: 'total_roi', 
            headerName: 'ROI', 
            width: 110, 
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => {
                const value = params.value || 0;
                const isPositive = value >= 0;
                return (
                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        bgcolor: isPositive ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                        px: 1,
                        py: 0.5,
                        borderRadius: 6
                    }}>
                        <Typography sx={{ 
                            fontWeight: 600,
                            color: isPositive ? theme.palette.success.main : theme.palette.error.main
                        }}>
                            {value.toFixed(2)}%
                        </Typography>
                    </Box>
                );
            }
        }
    ];
      
    const handleSubmit = async () => {
        try {
            const response = await fetch('https://pearmllc.onrender.com/api/offers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...newOffer,
                    postbackUrl: newOffer.postbackUrl // Save the postback URL with the offer
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to create offer');
            }
    
            const createdOffer = await response.json();
    
            // Add the new offer to the list
            setOffers(prev => [...prev, {
                id: createdOffer.Serial_No,
                serial_no: createdOffer.Serial_No,
                offers_name: createdOffer.Offer_name,
                offer_status: createdOffer.offer_status,
                source: newOffer.source,
                postbackUrl: newOffer.postbackUrl,
                clicks: createdOffer.clicks,
                lp_clicks: createdOffer.lp_clicks,
                conversion: createdOffer.conversion,
                total_cpa: createdOffer.total_cpa,
                epc: createdOffer.epc,
                total_revenue: createdOffer.total_revenue,
                cost: createdOffer.cost,
                profit: createdOffer.profit,
                total_roi: createdOffer.total_roi,
                lp_views: createdOffer.lp_views,
                impressions: createdOffer.impressions
            }]);
    
            setNewOffer({
                name: '',
                source: '',
                url: '',
                revenue: 0,
                country: 'Global',
                postbackUrl: ''
            });
    
            setSnackbar({
                open: true,
                message: 'Offer created successfully!',
                severity: 'success'
            });
            
            handleClose();
        } catch (err) {
            console.error(err);
            setSnackbar({
                open: true,
                message: 'Error saving offer: ' + err.message,
                severity: 'error'
            });
        }
    };

    // Function to fetch offers
    const fetchOffers = () => {
        setLoading(true);
        fetch('https://pearmllc.onrender.com/api/offers')
            .then(res => res.json())
            .then(data => {
                const formatted = data.map(offer => ({
                    id: offer.Serial_No,
                    serial_no: offer.Serial_No,
                    offers_name: offer.Offer_name,
                    offer_status: offer.offer_status || 'Active',
                    source: offer.source || '',
                    postbackUrl: offer.postbackUrl || '',
                    clicks: offer.clicks || 0,
                    lp_clicks: offer.lp_clicks || 0,
                    conversion: offer.conversion || 0,
                    total_cpa: offer.total_cpa || 0,
                    epc: offer.epc || 0,
                    total_revenue: offer.total_revenue || 0,
                    cost: offer.cost || 0,
                    profit: offer.profit || 0,
                    total_roi: offer.total_roi || 0,
                    lp_views: offer.lp_views || 0,
                    impressions: offer.impressions || 0
                }));
                setOffers(formatted);
                
                // Calculate and update stats
                const totalOffers = formatted.length;
                const activeOffers = formatted.filter(o => o.offer_status?.toLowerCase() === 'active').length;
                const totalConversions = formatted.reduce((sum, o) => sum + (o.conversion || 0), 0);
                const totalRevenue = formatted.reduce((sum, o) => sum + (o.total_revenue || 0), 0);
                const totalProfit = formatted.reduce((sum, o) => sum + (o.profit || 0), 0);
                
                setStats({
                    totalOffers,
                    activeOffers,
                    totalConversions,
                    totalRevenue,
                    totalProfit
                });
                
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
                setSnackbar({
                    open: true,
                    message: 'Error loading offers: ' + err.message,
                    severity: 'error'
                });
            });
    };

    // Fetch offers on initial load
    useEffect(() => {
        fetchOffers();
    }, []);
    
    return (
        <Layout>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                <Box sx={{ mb: 6 }}>
                    {/* Dashboard Header with Stats */}
                    <GradientBox 
                        sx={{ mb: 4 }}
                        colorStart="#4facfe"
                        colorEnd="#00f2fe"
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                                    Offers Dashboard
                                </Typography>
                                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                    Monitor performance and manage your offers
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button 
                                    variant="contained" 
                                    color="inherit"
                                    startIcon={<RefreshIcon />}
                                    onClick={fetchOffers}
                                    disabled={loading}
                                    sx={{ 
                                        bgcolor: 'rgba(255, 255, 255, 0.9)', 
                                        color: theme.palette.primary.main,
                                        borderRadius: 8,
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                        '&:hover': {
                                            bgcolor: 'rgba(255, 255, 255, 1)',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                        }
                                    }}
                                >
                                    {loading ? 'Refreshing...' : 'Refresh'}
                                </Button>
                                <GradientButton
                                    startIcon={<AddIcon />}
                                    colorStart="#FF416C"
                                    colorEnd="#FF4B2B"
                                    onClick={handleOpen}
                                >
                                    Create New Offer
                                </GradientButton>
                            </Box>
                        </Box>

                        {/* Stats Overview */}
                        <Grid container spacing={3} sx={{ mt: 3 }}>
                            {/* Stat Cards */}
                            <Grid item xs={12} md={2.4}>
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 2.5, 
                                        bgcolor: 'rgba(255, 255, 255, 0.92)', 
                                        backdropFilter: 'blur(8px)', 
                                        borderRadius: 3,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                                        }
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                        Total Offers
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'baseline' }}>
                                        {stats.totalOffers}
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1, fontWeight: 500 }}>
                                            ({stats.activeOffers} active)
                                        </Typography>
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={2.4}>
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 2.5, 
                                        bgcolor: 'rgba(255, 255, 255, 0.92)', 
                                        backdropFilter: 'blur(8px)', 
                                        borderRadius: 3,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                                        }
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                        Total Clicks
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {offers.reduce((sum, o) => sum + (o.clicks || 0), 0).toLocaleString()}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={2.4}>
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 2.5, 
                                        bgcolor: 'rgba(255, 255, 255, 0.92)', 
                                        backdropFilter: 'blur(8px)', 
                                        borderRadius: 3,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                                        }
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                        Conversions
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {stats.totalConversions.toLocaleString()}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={2.4}>
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 2.5, 
                                        bgcolor: 'rgba(255, 255, 255, 0.92)', 
                                        backdropFilter: 'blur(8px)', 
                                        borderRadius: 3,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                                        }
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                        Total Revenue
                                    </Typography>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        ${stats.totalRevenue.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </Typography>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={2.4}>
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 2.5, 
                                        bgcolor: 'rgba(255, 255, 255, 0.92)', 
                                        backdropFilter: 'blur(8px)', 
                                        borderRadius: 3,
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.06)',
                                        }
                                    }}
                                >
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                                        Total Profit
                                    </Typography>
                                    <Typography 
                                        variant="h4" 
                                        sx={{ 
                                            fontWeight: 700, 
                                            color: stats.totalProfit >= 0 ? 
                                                theme.palette.success.main : theme.palette.error.main
                                        }}
                                    >
                                        ${stats.totalProfit.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    </GradientBox>

                    {/* Filter Controls */}
                    <StyledCard sx={{ mb: 4 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={12} md={3}>
                                    <StyledTextField
                                        label="Date"
                                        type="date"
                                        value={date}
                                        onChange={handleDateChange}
                                        fullWidth
                                        InputLabelProps={{ shrink: true }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarTodayIcon color="primary" fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <StyledTextField
                                        label="Offer Name"
                                        value={titleText}
                                        onChange={handleTitleChange}
                                        fullWidth
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <TitleIcon color="primary" fontSize="small" />
                                                </InputAdornment>
                                            ),
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <StyledFormControl fullWidth>
                                        <InputLabel>Source</InputLabel>
                                        <Select
                                            value={filterText}
                                            onChange={(e) => setFilterText(e.target.value)}
                                            label="Source"
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    <LinkIcon color="primary" fontSize="small" />
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value="">All Sources</MenuItem>
                                            {offerSources.map(src => (
                                                <MenuItem key={src.id} value={src.name}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                        {getSourceIcon(src.name)}
                                                        <Box sx={{ ml: 1 }}>{src.name}</Box>
                                                    </Box>
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </StyledFormControl>
                                </Grid>
                                <Grid item xs={12} md={3}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <GradientButton
                                            variant="contained"
                                            fullWidth
                                            startIcon={<FilterListIcon />}
                                            onClick={handleApplyFilters}
                                        >
                                            Apply Filters
                                        </GradientButton>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            onClick={handleFilterReset}
                                            sx={{ borderRadius: 8 }}
                                        >
                                            Reset
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </StyledCard>

                    {/* DataGrid Table */}
                    <StyledCard>
                        <Box sx={{ position: 'relative', height: 650, width: '100%' }}>
                            {loading ? (
                                <Box 
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                                        zIndex: 10,
                                        backdropFilter: 'blur(4px)',
                                    }}
                                >
                                    <CircularProgress />
                                </Box>
                            ) : null}
                            
                            <StyledDataGrid 
                                rows={offers} 
                                columns={columns} 
                                pageSize={10}
                                rowsPerPageOptions={[5, 10, 25]}
                                disableSelectionOnClick
                                getRowClassName={(params) => params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'}
                                components={{
                                    NoRowsOverlay: () => (
                                        <Box 
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                height: '100%',
                                                p: 5
                                            }}
                                        >
                                            <FormatListBulletedIcon 
                                                sx={{ fontSize: 60, color: theme.palette.grey[300], mb: 2 }} 
                                            />
                                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                                No Offers Found
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 400 }}>
                                                Create your first offer or adjust your filter criteria
                                            </Typography>
                                            <GradientButton
                                                startIcon={<AddIcon />}
                                                onClick={handleOpen}
                                            >
                                                Create New Offer
                                            </GradientButton>
                                        </Box>
                                    ),
                                }}
                            />
                        </Box>
                    </StyledCard>
                </Box>

                {/* Create Offer Dialog */}
                <Dialog 
                    open={open} 
                    onClose={handleClose} 
                    fullWidth 
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                        }
                    }}
                >
                    <Box sx={{ bgcolor: theme.palette.primary.main, color: 'white', p: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600 }}>
                            Create New Offer
                        </Typography>
                    </Box>
                    
                    <Box sx={{ px: 3, pt: 3 }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={handleTabChange}
                            variant="fullWidth"
                            TabIndicatorProps={{
                                style: {
                                    height: 3,
                                    borderRadius: '3px',
                                    background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
                                }
                            }}
                            sx={{ mb: 3 }}
                        >
                            <StyledTab 
                                label="Basic Details" 
                                icon={<SettingsIcon />} 
                                iconPosition="start"
                            />
                            <StyledTab 
                                label="Postback Configuration" 
                                icon={<CodeIcon />}
                                iconPosition="start"
                            />
                        </Tabs>

                        {/* Tab 1: Basic Details */}
                        {tabValue === 0 && (
                            <TabPanel value={tabValue} index={0}>
                                <Grid container spacing={3}>
                                    <Grid item xs={12}>
                                        <StyledTextField 
                                            label="Offer Name" 
                                            name="name" 
                                            fullWidth 
                                            onChange={handleChange}
                                            value={newOffer.name}
                                            placeholder="Enter a descriptive name for your offer"
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledFormControl fullWidth>
                                            <InputLabel>Offer Source</InputLabel>
                                            <Select 
                                                name="source" 
                                                value={newOffer.source} 
                                                onChange={handleSourceChange}
                                                startAdornment={
                                                    <InputAdornment position="start">
                                                        {getSourceIcon(newOffer.source)}
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value="" disabled>
                                                    <Typography color="text.secondary">Select a traffic source</Typography>
                                                </MenuItem>
                                                {offerSources.map(src => (
                                                    <MenuItem key={src.id} value={src.name}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            {getSourceIcon(src.name)}
                                                            <Box sx={{ ml: 1 }}>{src.name}</Box>
                                                        </Box>
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </StyledFormControl>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <StyledTextField 
                                            label="Offer URL" 
                                            name="url" 
                                            fullWidth 
                                            onChange={handleChange}
                                            value={newOffer.url}
                                            placeholder="https://example.com/offer"
                                            helperText="The landing page URL for this offer"
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LinkIcon color="primary" fontSize="small" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledTextField 
                                            label="Default Conversion Revenue" 
                                            name="revenue" 
                                            type="number" 
                                            fullWidth 
                                            onChange={handleChange}
                                            value={newOffer.revenue}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">$</InputAdornment>
                                                ),
                                            }}
                                            helperText="Revenue amount for each conversion"
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <StyledFormControl fullWidth>
                                            <InputLabel>Country</InputLabel>
                                            <Select 
                                                name="country" 
                                                value={newOffer.country} 
                                                onChange={handleChange}
                                                startAdornment={
                                                    <InputAdornment position="start">
                                                        <PublicIcon color="primary" fontSize="small" />
                                                    </InputAdornment>
                                                }
                                            >
                                                <MenuItem value="Global">Global (Worldwide)</MenuItem>
                                                <MenuItem value="US">United States</MenuItem>
                                                <MenuItem value="UK">United Kingdom</MenuItem>
                                                <MenuItem value="CA">Canada</MenuItem>
                                                <MenuItem value="AU">Australia</MenuItem>
                                                <MenuItem value="IN">India</MenuItem>
                                            </Select>
                                        </StyledFormControl>
                                    </Grid>
                                </Grid>
                            </TabPanel>
                        )}

                        {/* Tab 2: Postback Configuration */}
                        {tabValue === 1 && (
                            <TabPanel value={tabValue} index={1}>
                                <Box>
                                    <Paper 
                                        elevation={0} 
                                        sx={{ 
                                            p: 3, 
                                            mb: 3, 
                                            bgcolor: alpha(theme.palette.info.main, 0.05),
                                            borderRadius: 2,
                                            borderLeft: `4px solid ${theme.palette.info.main}`
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                            About Postback URLs
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Postback URLs are used to track conversions. When a conversion occurs, this URL will be pinged automatically.
                                            This allows your traffic sources to track the performance of your campaigns.
                                        </Typography>
                                    </Paper>

                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
                                        <StyledTextField
                                            fullWidth
                                            label="Postback URL"
                                            value={newOffer.postbackUrl}
                                            onChange={(e) => setNewOffer({ ...newOffer, postbackUrl: e.target.value })}
                                            multiline
                                            rows={3}
                                            sx={{ mr: 1 }}
                                            placeholder="Configure your postback URL or generate one automatically"
                                            InputProps={{
                                                sx: { 
                                                    fontFamily: 'monospace',
                                                    fontSize: '0.9rem'
                                                }
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <AnimatedIconButton onClick={handleCopyPostback} title="Copy URL">
                                                <ContentCopyIcon />
                                            </AnimatedIconButton>
                                            <AnimatedIconButton onClick={handleGeneratePostbackTemplate} title="Generate Template">
                                                <HelpOutlineIcon />
                                            </AnimatedIconButton>
                                        </Box>
                                    </Box>
                                    
                                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                        Available Parameters
                                    </Typography>
                                    
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                        {Object.entries(POSTBACK_MACROS).map(([key, value]) => (
                                            <Chip 
                                                key={key}
                                                label={value}
                                                onClick={() => handleInsertMacro(value)}
                                                sx={{ 
                                                    fontFamily: 'monospace',
                                                    borderRadius: 6,
                                                    fontWeight: 500,
                                                    transition: 'all 0.15s',
                                                    '&:hover': {
                                                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                                                    }
                                                }}
                                                clickable
                                            />
                                        ))}
                                    </Box>
                                    
                                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                        Example Preview
                                    </Typography>
                                    
                                    <Paper 
                                        elevation={0}
                                        sx={{ 
                                            p: 2, 
                                            bgcolor: alpha(theme.palette.background.paper, 0.5), 
                                            borderRadius: 2,
                                            mb: 3,
                                            border: `1px dashed ${theme.palette.divider}`
                                        }}
                                    >
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                fontFamily: 'monospace',
                                                fontSize: '0.85rem',
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-all'
                                            }}
                                        >
                                            {parsePostbackUrl(newOffer.postbackUrl, {
                                                click_id: 'abc123',
                                                payout: '10.00',
                                                revenue: newOffer.revenue.toString(),
                                                conversion_id: '123456',
                                                offer_id: '789',
                                                offer_name: newOffer.name,
                                                campaign_id: 'camp_1',
                                                source: newOffer.source,
                                                status: '1'
                                            }) || 'Postback URL preview will appear here...'}
                                        </Typography>
                                    </Paper>
                                    
                                    {/* Source-specific instructions */}
                                    {newOffer.source && (newOffer.source.toLowerCase() === 'facebook' || newOffer.source.toLowerCase() === 'google') && (
                                        <Paper 
                                            elevation={0} 
                                            sx={{ 
                                                p: 3, 
                                                mb: 3, 
                                                borderRadius: 2,
                                                borderLeft: `4px solid ${
                                                    newOffer.source.toLowerCase() === 'facebook' ? '#1877F2' : '#4285F4'
                                                }`,
                                                bgcolor: alpha(
                                                    newOffer.source.toLowerCase() === 'facebook' ? '#1877F2' : '#4285F4', 
                                                    0.05
                                                )
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                {newOffer.source.toLowerCase() === 'facebook' ? 
                                                    <FacebookIcon sx={{ color: '#1877F2', mr: 1 }} /> : 
                                                    <GoogleIcon sx={{ color: '#4285F4', mr: 1 }} />
                                                }
                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                    {newOffer.source}-Specific Settings
                                                </Typography>
                                            </Box>
                                            
                                            {newOffer.source.toLowerCase() === 'facebook' && (
                                                <Typography variant="body2" color="text.secondary">
                                                    For Facebook conversions, use <Typography component="span" sx={{ fontFamily: 'monospace' }}>{'{sub1}'}</Typography> for user_id, 
                                                    <Typography component="span" sx={{ fontFamily: 'monospace' }}>{'{sub2}'}</Typography> for email, and 
                                                    <Typography component="span" sx={{ fontFamily: 'monospace' }}>{'{sub3}'}</Typography> for phone.
                                                    These will be automatically hashed for privacy as required by Facebook.
                                                </Typography>
                                            )}
                                            
                                            {newOffer.source.toLowerCase() === 'google' && (
                                                <Typography variant="body2" color="text.secondary">
                                                    For Google conversion tracking, use <Typography component="span" sx={{ fontFamily: 'monospace' }}>{'{gclid}'}</Typography> or 
                                                    <Typography component="span" sx={{ fontFamily: 'monospace' }}>{'{sub1}'}</Typography> for Google Click ID.
                                                    You can also include <Typography component="span" sx={{ fontFamily: 'monospace' }}>{'{sub2}'}</Typography> for email and 
                                                    <Typography component="span" sx={{ fontFamily: 'monospace' }}>{'{sub3}'}</Typography> for phone for enhanced conversions.
                                                </Typography>
                                            )}
                                        </Paper>
                                    )}
                                </Box>
                            </TabPanel>
                        )}
                    </Box>
                    
                    <DialogActions sx={{ p: 3, pt: 1 }}>
                        <Button 
                            variant="outlined" 
                            onClick={handleClose}
                            sx={{ borderRadius: 8, px: 3 }}
                        >
                            Cancel
                        </Button>
                        <GradientButton 
                            onClick={handleSubmit} 
                            endIcon={<AddIcon />}
                            sx={{ px: 3 }}
                        >
                            Create Offer
                        </GradientButton>
                    </DialogActions>
                </Dialog>

                {/* Postback Testing Dialog */}
                <Dialog 
                    open={postbackTestDialogOpen} 
                    onClose={handleClosePostbackTest}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            overflow: 'hidden',
                            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                        }
                    }}
                >
                    <Box sx={{ bgcolor: theme.palette.warning.main, color: 'white', p: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                            <VisibilityIcon sx={{ mr: 1.5 }} /> Test Postback URL
                        </Typography>
                        {selectedOffer && (
                            <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                                {selectedOffer.offers_name} {selectedOffer.source && `- ${selectedOffer.source}`}
                            </Typography>
                        )}
                    </Box>
                    
                    <DialogContent sx={{ p: 3 }}>
                        {selectedOffer && (
                            <>
                                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                    Postback URL Template:
                                </Typography>
                                <Paper 
                                    elevation={0}
                                    sx={{ 
                                        p: 2, 
                                        mb: 3, 
                                        bgcolor: alpha(theme.palette.warning.main, 0.05),
                                        borderRadius: 2
                                    }}
                                >
                                    <Typography 
                                        variant="body2" 
                                        sx={{ 
                                            fontFamily: 'monospace',
                                            wordBreak: 'break-all'
                                        }}
                                    >
                                        {selectedOffer.postbackUrl || 'No postback URL configured'}
                                    </Typography>
                                </Paper>
                                
                                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                    Test Parameters:
                                </Typography>
                                
                                <StyledCard sx={{ mb: 3 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Grid container spacing={2.5}>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <StyledTextField
                                                    fullWidth
                                                    label="Click ID"
                                                    name="click_id"
                                                    value={testPostbackData.click_id}
                                                    onChange={handleTestDataChange}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <StyledTextField
                                                    fullWidth
                                                    label="Payout"
                                                    name="payout"
                                                    value={testPostbackData.payout}
                                                    onChange={handleTestDataChange}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">$</InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <StyledTextField
                                                    fullWidth
                                                    label="Revenue"
                                                    name="revenue"
                                                    value={testPostbackData.revenue}
                                                    onChange={handleTestDataChange}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">$</InputAdornment>
                                                        ),
                                                    }}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <StyledTextField
                                                    fullWidth
                                                    label="Conversion ID"
                                                    name="conversion_id"
                                                    value={testPostbackData.conversion_id}
                                                    onChange={handleTestDataChange}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <StyledTextField
                                                    fullWidth
                                                    label="Event Name"
                                                    name="event_name"
                                                    value={testPostbackData.event_name}
                                                    onChange={handleTestDataChange}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6} md={4}>
                                                <StyledTextField
                                                    fullWidth
                                                    label="Campaign ID"
                                                    name="campaign_id"
                                                    value={testPostbackData.campaign_id}
                                                    onChange={handleTestDataChange}
                                                />
                                            </Grid>
                                            
                                            {/* Show Facebook-specific fields if the source is Facebook */}
                                            {selectedOffer.source && selectedOffer.source.toLowerCase() === 'facebook' && (
                                                <>
                                                    <Grid item xs={12} md={12}>
                                                        <Divider sx={{ my: 1 }}>
                                                            <Chip 
                                                                icon={<FacebookIcon />} 
                                                                label="Facebook-Specific Parameters" 
                                                                sx={{ px: 1 }}
                                                            />
                                                        </Divider>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <StyledTextField
                                                            fullWidth
                                                            label="User ID (sub1)"
                                                            name="sub1"
                                                            value={testPostbackData.sub1}
                                                            onChange={handleTestDataChange}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <StyledTextField
                                                            fullWidth
                                                            label="Email (sub2)"
                                                            name="sub2"
                                                            value={testPostbackData.sub2}
                                                            onChange={handleTestDataChange}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <StyledTextField
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
                                            {selectedOffer.source && selectedOffer.source.toLowerCase() === 'google' && (
                                                <>
                                                    <Grid item xs={12} md={12}>
                                                        <Divider sx={{ my: 1 }}>
                                                            <Chip 
                                                                icon={<GoogleIcon />} 
                                                                label="Google-Specific Parameters" 
                                                                sx={{ px: 1 }}
                                                            />
                                                        </Divider>
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <StyledTextField
                                                            fullWidth
                                                            label="GCLID"
                                                            name="gclid"
                                                            value={testPostbackData.gclid}
                                                            onChange={handleTestDataChange}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <StyledTextField
                                                            fullWidth
                                                            label="Email (sub2)"
                                                            name="sub2"
                                                            value={testPostbackData.sub2}
                                                            onChange={handleTestDataChange}
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6} md={4}>
                                                        <StyledTextField
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
                                    </CardContent>
                                </StyledCard>
                                
                                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleGenerateTestUrl}
                                        disabled={!selectedOffer.postbackUrl}
                                        startIcon={<CodeIcon />}
                                        sx={{ borderRadius: 8 }}
                                    >
                                        Generate Test URL
                                    </Button>
                                    <GradientButton
                                        onClick={handleTestPostback}
                                        disabled={!selectedOffer.postbackUrl || isTesting}
                                        colorStart="#f5af19"
                                        colorEnd="#f12711"
                                        endIcon={<SendIcon />}
                                    >
                                        {isTesting ? 'Testing...' : 'Send Test Postback'}
                                    </GradientButton>
                                </Box>
                                
                                {processedUrl && (
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                                            Generated URL:
                                        </Typography>
                                        <Box sx={{ position: 'relative' }}>
                                            <StyledTextField
                                                fullWidth
                                                value={processedUrl}
                                                multiline
                                                rows={2}
                                                InputProps={{
                                                    readOnly: true,
                                                    sx: { 
                                                        borderRadius: 2,
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.85rem',
                                                        pr: 5
                                                    }
                                                }}
                                            />
                                            <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                                                <AnimatedIconButton
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(processedUrl);
                                                        setSnackbar({
                                                            open: true,
                                                            message: 'URL copied to clipboard',
                                                            severity: 'success'
                                                        });
                                                    }}
                                                    title="Copy URL"
                                                >
                                                    <ContentCopyIcon />
                                                </AnimatedIconButton>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                                
                                {testResult && (
                                    <Paper 
                                        elevation={0}
                                        sx={{ 
                                            p: 3, 
                                            bgcolor: testResult.success ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                                            borderRadius: 2,
                                            borderLeft: `4px solid ${testResult.success ? theme.palette.success.main : theme.palette.error.main}`,
                                            mb: 3
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
                                            {testResult.success ? 
                                                <><CheckCircleIcon sx={{ mr: 1, color: theme.palette.success.main }} /> Test Successful</> : 
                                                <><CancelIcon sx={{ mr: 1, color: theme.palette.error.main }} /> Test Failed</>
                                            }
                                        </Typography>
                                        
                                        <Typography variant="body2">
                                            {testResult.message}
                                        </Typography>
                                        
                                        {testResult.success && testResult.data && (
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="subtitle2" sx={{ mb: 1 }}>Response Data:</Typography>
                                                <Paper 
                                                    elevation={0}
                                                    sx={{ 
                                                        p: 2, 
                                                        bgcolor: 'background.paper', 
                                                        borderRadius: 2
                                                    }}
                                                >
                                                    <Typography 
                                                        variant="body2" 
                                                        sx={{ 
                                                            fontFamily: 'monospace',
                                                            whiteSpace: 'pre-wrap'
                                                        }}
                                                    >
                                                        {JSON.stringify(testResult.data, null, 2)}
                                                    </Typography>
                                                </Paper>
                                            </Box>
                                        )}
                                    </Paper>
                                )}
                            </>
                        )}
                    </DialogContent>
                    
                    <DialogActions sx={{ p: 3, pt: 0 }}>
                        <Button 
                            onClick={handleClosePostbackTest}
                            sx={{ borderRadius: 8, px: 3 }}
                            variant="outlined"
                        >
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert 
                        onClose={handleSnackbarClose} 
                        severity={snackbar.severity}
                        variant="filled"
                        sx={{ 
                            width: '100%',
                            borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Layout>
    );
};

export default OffersPage;