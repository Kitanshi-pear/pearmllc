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

// Modern styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const GradientButton = styled(Button)(({ theme, colorStart = '#4776E6', colorEnd = '#8E54E9' }) => ({
  background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s',
  color: 'white',
  fontWeight: 600,
  '&:hover': {
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.25)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
}));

const AnimatedIconButton = styled(IconButton)(({ theme }) => ({
  transition: 'transform 0.2s, background 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
    background: alpha(theme.palette.primary.main, 0.1),
  },
}));

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  borderRadius: 16,
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    padding: '12px 16px',
    '&:first-of-type': {
      borderTopLeftRadius: 16,
    },
    '&:last-of-type': {
      borderTopRightRadius: 16,
    },
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
  },
  '& .MuiDataGrid-cell': {
    padding: '16px',
    fontSize: '0.95rem',
  },
  '& .MuiDataGrid-row': {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
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
  // Zebra striping for rows
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
  ...(status === 'active' && {
    background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    color: '#05603a',
  }),
  ...(status === 'inactive' && {
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    color: '#4b4b4b',
  }),
}));

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
}));

const StatCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  height: '100%',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.09)',
  },
}));

// Other styled components from the original code...
// (Keep all the remaining styled components)

// Define postback macros globally
// (All the utility functions and constants remain the same)
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
    
    // Keep all the state variables and utility functions...
    // (All the state variables and functions remain the same)

    // Fetch offers on initial load
    useEffect(() => {
        fetchOffers();
    }, []);
    
    return (
        <Layout>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Modern Page Header */}
                <PageHeader>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                            Offers Dashboard
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Monitor performance and manage your offers
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button 
                            variant="outlined" 
                            color="primary"
                            startIcon={<RefreshIcon />}
                            onClick={fetchOffers}
                            disabled={loading}
                            sx={{ borderRadius: 8 }}
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                        <GradientButton
                            startIcon={<AddIcon />}
                            colorStart="#FF416C"
                            colorEnd="#FF4B2B"
                            onClick={handleOpen}
                            sx={{ borderRadius: 8 }}
                        >
                            Create New Offer
                        </GradientButton>
                    </Box>
                </PageHeader>

                {/* Stats Overview */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={2.4}>
                        <StatCard elevation={0}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Total Offers
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                                {stats.totalOffers}
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                    ({stats.activeOffers} active)
                                </Typography>
                            </Typography>
                        </StatCard>
                    </Grid>
                    <Grid item xs={12} md={2.4}>
                        <StatCard elevation={0}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Total Clicks
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {offers.reduce((sum, o) => sum + (o.clicks || 0), 0).toLocaleString()}
                            </Typography>
                        </StatCard>
                    </Grid>
                    <Grid item xs={12} md={2.4}>
                        <StatCard elevation={0}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Conversions
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                {stats.totalConversions.toLocaleString()}
                            </Typography>
                        </StatCard>
                    </Grid>
                    <Grid item xs={12} md={2.4}>
                        <StatCard elevation={0}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Total Revenue
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                ${stats.totalRevenue.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                            </Typography>
                        </StatCard>
                    </Grid>
                    <Grid item xs={12} md={2.4}>
                        <StatCard elevation={0}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                        </StatCard>
                    </Grid>
                </Grid>

                {/* Filter Controls */}
                <StyledCard sx={{ mb: 4 }}>
                    <CardContent>
                        <Grid container spacing={2} alignItems="center">
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
                                                <CalendarTodayIcon color="primary" />
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
                                                <TitleIcon color="primary" />
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
                                                <LinkIcon color="primary" />
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
                                        color="primary"
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
                    <Box sx={{ position: 'relative', height: 650, p: 0 }}>
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

                {/* All dialogs and other components remain the same */}
                {/* Create Offer Dialog */}
                <Dialog 
                    open={open} 
                    onClose={handleClose} 
                    fullWidth 
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            borderRadius: 3,
                            overflow: 'hidden'
                        }
                    }}
                >
                    {/* Dialog content remains the same */}
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
                            overflow: 'hidden'
                        }
                    }}
                >
                    {/* Dialog content remains the same */}
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
                            borderRadius: 2,
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