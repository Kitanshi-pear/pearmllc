import React, { useEffect, useState } from 'react';
import {
    Box, CircularProgress, Typography, Grid, TextField, Button, Select, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, IconButton,
    Tooltip, Snackbar, Alert, Card, CardContent, Tabs, Tab, Paper, Divider
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Layout from "./Layout";
import axios from 'axios';

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

const OffersPage = () => {
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

    // Missing state variables (now added)
    const [date, setDate] = useState('');
    const [titleText, setTitleText] = useState('');
    const [filterText, setFilterText] = useState('');

    const [newOffer, setNewOffer] = useState({
        name: '',
        source: '',
        url: '',
        revenue: 0,
        country: 'Global',
        postbackUrl: ''
    });

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
    
    // Handlers for missing variables
    const handleDateChange = (event) => setDate(event.target.value);
    const handleTitleChange = (event) => setTitleText(event.target.value);
    const handleFilterReset = () => setFilterText('');

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

    const columns = [
        { field: 'serial_no', headerName: 'Serial No', width: 100 },
        { field: 'offers_name', headerName: 'Offers Name', width: 150 },
        { field: 'offer_status', headerName: 'Offer Status', width: 150 },
        { field: 'source', headerName: 'Source', width: 120 },
        { 
            field: 'postbackUrl', 
            headerName: 'Postback', 
            width: 120,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {params.value ? (
                        <>
                            <Tooltip title="Test Postback">
                                <IconButton 
                                    size="small" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenPostbackTest(params.row);
                                    }}
                                >
                                    <VisibilityIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </>
                    ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                </Box>
            ),
        },
        { field: 'clicks', headerName: 'Clicks', width: 100, type: 'number' },
        { field: 'lp_clicks', headerName: 'LP Clicks', width: 120, type: 'number' },
        { field: 'conversion', headerName: 'Conversions', width: 150, type: 'number' },
        { field: 'total_cpa', headerName: 'Total CPA ($)', width: 150, type: 'number' },
        { field: 'epc', headerName: 'EPC ($)', width: 120, type: 'number' },
        { field: 'total_revenue', headerName: 'Total Revenue ($)', width: 180, type: 'number' },
        { field: 'cost', headerName: 'Cost ($)', width: 150, type: 'number' },
        { field: 'profit', headerName: 'Profit ($)', width: 150, type: 'number' },
        { field: 'total_roi', headerName: 'Total ROI (%)', width: 150, type: 'number' },
        { field: 'lp_views', headerName: 'LP Views', width: 150, type: 'number' },
        { field: 'impressions', headerName: 'Impressions', width: 150, type: 'number' }
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

    useEffect(() => {
        setLoading(true);
        fetch('https://pearmllc.onrender.com/api/offers')
            .then(res => res.json())
            .then(data => {
                const formatted = data.map(offer => ({
                    id: offer.Serial_No,
                    serial_no: offer.Serial_No,
                    offers_name: offer.Offer_name,
                    offer_status: offer.offer_status,
                    source: offer.source || '',
                    postbackUrl: offer.postbackUrl || '',
                    clicks: offer.clicks,
                    lp_clicks: offer.lp_clicks,
                    conversion: offer.conversion,
                    total_cpa: offer.total_cpa,
                    epc: offer.epc,
                    total_revenue: offer.total_revenue,
                    cost: offer.cost,
                    profit: offer.profit,
                    total_roi: offer.total_roi,
                    lp_views: offer.lp_views,
                    impressions: offer.impressions
                }));
                setOffers(formatted);
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
    }, []);
    
    return (
        <Layout>
            <Box sx={{ mb: 3 }}>
                <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h4">Offers</Typography>
                    <Button variant="contained" color="primary" onClick={handleOpen}>
                        Create New Offer
                    </Button>
                </Grid>

                {/* Date and Title Filters */}
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="Date"
                            type="date"
                            value={date}
                            onChange={handleDateChange}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                        <TextField
                            label="Title"
                            value={titleText}
                            onChange={handleTitleChange}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={4} sm={2}>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            onClick={handleFilterReset}
                        >
                            Apply
                        </Button>
                    </Grid>
                </Grid>

                {/* DataGrid Table */}
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ height: 600, width: '100%', bgcolor: 'white', boxShadow: 1 }}>
                        <DataGrid 
                            rows={offers} 
                            columns={columns} 
                            pageSize={10}
                            rowsPerPageOptions={[5, 10, 25]}
                            disableSelectionOnClick
                        />
                    </Box>
                )}
            </Box>

            {/* Create Offer Dialog */}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
                <DialogTitle>Create New Offer</DialogTitle>
                <DialogContent>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                        <Tabs value={tabValue} onChange={handleTabChange}>
                            <Tab label="Basic Details" />
                            <Tab label="Postback Configuration" />
                        </Tabs>
                    </Box>

                    {/* Tab 1: Basic Details */}
                    {tabValue === 0 && (
                        <Box>
                            <TextField 
                                label="Offer Name" 
                                name="name" 
                                fullWidth 
                                margin="dense" 
                                onChange={handleChange}
                                value={newOffer.name}
                            />
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Offer Source</InputLabel>
                                <Select 
                                    name="source" 
                                    value={newOffer.source} 
                                    onChange={handleSourceChange}
                                >
                                    {offerSources.map(src => (
                                        <MenuItem key={src.id} value={src.name}>{src.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField 
                                label="URL" 
                                name="url" 
                                fullWidth 
                                margin="dense" 
                                onChange={handleChange}
                                value={newOffer.url}
                            />
                            <TextField 
                                label="Default Conversion Revenue" 
                                name="revenue" 
                                type="number" 
                                fullWidth 
                                margin="dense" 
                                onChange={handleChange}
                                value={newOffer.revenue}
                            />
                            <FormControl fullWidth margin="dense">
                                <InputLabel>Country</InputLabel>
                                <Select 
                                    name="country" 
                                    value={newOffer.country} 
                                    onChange={handleChange}
                                >
                                    <MenuItem value="Global">Global</MenuItem>
                                    <MenuItem value="US">United States</MenuItem>
                                    <MenuItem value="UK">United Kingdom</MenuItem>
                                    <MenuItem value="CA">Canada</MenuItem>
                                    <MenuItem value="AU">Australia</MenuItem>
                                    <MenuItem value="IN">India</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    )}

                    {/* Tab 2: Postback Configuration */}
                    {tabValue === 1 && (
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                                Postback URLs are used to track conversions. When a conversion occurs, this URL will be pinged automatically.
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Postback URL"
                                    value={newOffer.postbackUrl}
                                    onChange={(e) => setNewOffer({ ...newOffer, postbackUrl: e.target.value })}
                                    multiline
                                    rows={3}
                                    sx={{ mr: 1 }}
                                />
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Tooltip title="Copy URL">
                                        <IconButton onClick={handleCopyPostback} size="small">
                                            <ContentCopyIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Generate Template">
                                        <IconButton onClick={handleGeneratePostbackTemplate} size="small">
                                            <HelpOutlineIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                            
                            <Typography variant="subtitle2" gutterBottom>
                                Available Parameters:
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                                {Object.entries(POSTBACK_MACROS).map(([key, value]) => (
                                    <Button 
                                        key={key}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleInsertMacro(value)}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        {value}
                                    </Button>
                                ))}
                            </Box>
                            
                            <Typography variant="subtitle2" gutterBottom>
                                Example preview:
                            </Typography>
                            
                            <TextField
                                fullWidth
                                disabled
                                value={parsePostbackUrl(newOffer.postbackUrl, {
                                    click_id: 'abc123',
                                    payout: '10.00',
                                    revenue: newOffer.revenue.toString(),
                                    conversion_id: '123456',
                                    offer_id: '789',
                                    offer_name: newOffer.name,
                                    campaign_id: 'camp_1',
                                    source: newOffer.source,
                                    status: '1'
                                })}
                                sx={{ mb: 3 }}
                            />
                            
                            <Card variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>How it works:</strong> When a conversion occurs, the system will replace the 
                                    placeholders with actual values and ping this URL automatically.
                                    This notifies your traffic source about successful conversions.
                                    
                                    {newOffer.source && newOffer.source.toLowerCase() === 'facebook' && (
                                        <Box mt={1}>
                                            <strong>Facebook-specific:</strong> Use {'{sub1}'} for user_id, {'{sub2}'} for email, and {'{sub3}'} for phone.
                                            These will be automatically hashed for privacy as required by Facebook.
                                        </Box>
                                    )}
                                    
                                    {newOffer.source && newOffer.source.toLowerCase() === 'google' && (
                                        <Box mt={1}>
                                            <strong>Google-specific:</strong> Use {'{gclid}'} or {'{sub1}'} for Google Click ID for conversion tracking.
                                            You can also use {'{sub2}'} for email and {'{sub3}'} for phone for enhanced conversions.
                                        </Box>
                                    )}
                                </Typography>
                            </Card>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} color="primary" variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Postback Testing Dialog */}
            <Dialog 
                open={postbackTestDialogOpen} 
                onClose={handleClosePostbackTest}
                fullWidth
                maxWidth="md"
            >
                <DialogTitle>
                    Test Postback URL
                    {selectedOffer && (
                        <Typography variant="subtitle2" color="text.secondary">
                            {selectedOffer.offers_name} - {selectedOffer.source}
                        </Typography>
                    )}
                </DialogTitle>
                <DialogContent>
                    {selectedOffer && (
                        <>
                            <Typography variant="subtitle2" gutterBottom>
                                Postback URL Template:
                            </Typography>
                            <TextField
                                fullWidth
                                value={selectedOffer.postbackUrl || 'No postback URL configured'}
                                InputProps={{ readOnly: true }}
                                sx={{ mb: 3 }}
                            />
                            
                            <Typography variant="subtitle2" gutterBottom>
                                Test Parameters:
                            </Typography>
                            
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Click ID"
                                        name="click_id"
                                        value={testPostbackData.click_id}
                                        onChange={handleTestDataChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Payout"
                                        name="payout"
                                        value={testPostbackData.payout}
                                        onChange={handleTestDataChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Revenue"
                                        name="revenue"
                                        value={testPostbackData.revenue}
                                        onChange={handleTestDataChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Conversion ID"
                                        name="conversion_id"
                                        value={testPostbackData.conversion_id}
                                        onChange={handleTestDataChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Event Name"
                                        name="event_name"
                                        value={testPostbackData.event_name}
                                        onChange={handleTestDataChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
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
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                fullWidth
                                                label="User ID (sub1)"
                                                name="sub1"
                                                value={testPostbackData.sub1}
                                                onChange={handleTestDataChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                fullWidth
                                                label="Email (sub2)"
                                                name="sub2"
                                                value={testPostbackData.sub2}
                                                onChange={handleTestDataChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
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
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                fullWidth
                                                label="GCLID"
                                                name="gclid"
                                                value={testPostbackData.gclid}
                                                onChange={handleTestDataChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
                                                fullWidth
                                                label="Email (sub2)"
                                                name="sub2"
                                                value={testPostbackData.sub2}
                                                onChange={handleTestDataChange}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={4}>
                                            <TextField
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
                            
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleGenerateTestUrl}
                                    disabled={!selectedOffer.postbackUrl}
                                >
                                    Generate Test URL
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleTestPostback}
                                    disabled={!selectedOffer.postbackUrl || isTesting}
                                >
                                    {isTesting ? 'Testing...' : 'Send Test Postback'}
                                </Button>
                            </Box>
                            
                            {processedUrl && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Generated URL:
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        value={processedUrl}
                                        multiline
                                        rows={2}
                                        InputProps={{
                                            readOnly: true,
                                        }}
                                    />
                                </Box>
                            )}
                            
                            {testResult && (
                                <Paper 
                                    sx={{ 
                                        p: 2, 
                                        bgcolor: testResult.success ? '#e8f5e9' : '#ffebee',
                                        borderRadius: 1
                                    }}
                                >
                                    <Typography>
                                        {testResult.message}
                                    </Typography>
                                    
                                    {testResult.success && testResult.data && (
                                        <Box mt={2}>
                                            <Typography variant="subtitle2">Response Data:</Typography>
                                            <pre style={{ whiteSpace: 'pre-wrap' }}>
                                                {JSON.stringify(testResult.data, null, 2)}
                                            </pre>
                                        </Box>
                                    )}
                                </Paper>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePostbackTest}>Close</Button>
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
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Layout>
    );
};

export default OffersPage;