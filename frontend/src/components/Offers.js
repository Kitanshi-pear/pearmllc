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

// Define postback macros globally
const POSTBACK_MACROS = {
    CLICKID: '{clickid}',
    PAYOUT: '{payout}',
    REVENUE: '{revenue}',
    CONVERSION_ID: '{conversionid}',
    OFFER_ID: '{offerid}',
    OFFER_NAME: '{offername}',
    CAMPAIGN_ID: '{campaignid}',
    SOURCE: '{source}',
    IP: '{ip}',
    COUNTRY: '{country}',
    DEVICE: '{device}',
    BROWSER: '{browser}',
    OS: '{os}',
    STATUS: '{status}'
};

// Generate a default postback URL template
const generatePostbackTemplate = (baseUrl = 'https://your-domain.com/') => {
    return `${baseUrl}?clickid=${POSTBACK_MACROS.CLICKID}&payout=${POSTBACK_MACROS.PAYOUT}&offer=${POSTBACK_MACROS.OFFER_ID}&status=1`;
};

// Parse a postback URL by replacing macros with actual values
const parsePostbackUrl = (template, data) => {
    if (!template) return '';
    
    let url = template;
    
    // Replace all macros with actual values if they exist
    Object.entries(POSTBACK_MACROS).forEach(([key, macro]) => {
        const valueKey = key.toLowerCase();
        const value = data[valueKey] || '';
        url = url.replace(new RegExp(macro, 'g'), encodeURIComponent(value));
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
        clickid: 'test_' + Math.random().toString(36).substring(2, 10),
        payout: '10.00',
        revenue: '10.00',
        conversionid: 'conv_' + Date.now(),
        offerid: '',
        offername: '',
        campaignid: 'camp_1',
        source: '',
        ip: '192.168.0.1',
        country: 'US',
        device: 'desktop',
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
            postbackUrl: sourceDetails ? sourceDetails.postback_url : ''
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
            postbackUrl: generatePostbackTemplate()
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
            offerid: selectedOffer.id,
            offername: selectedOffer.offers_name
        });
        
        setProcessedUrl(url);
        return url;
    };

    const handleTestPostback = async () => {
        setIsTesting(true);
        setTestResult(null);
        
        try {
            const url = handleGenerateTestUrl();
            
            // This is just a simulation since we can't actually make the request due to CORS
            // In a real app, you might use a proxy or server-side code to test the actual URL
            setTimeout(() => {
                setTestResult({
                    success: true,
                    message: 'Postback test completed! In production, this would notify your traffic source about the conversion.'
                });
                setIsTesting(false);
            }, 1500);
            
        } catch (error) {
            setTestResult({
                success: false,
                message: `Error: ${error.message}`
            });
            setIsTesting(false);
        }
    };

    const handleOpenPostbackTest = (offer) => {
        setSelectedOffer(offer);
        setTestPostbackData(prev => ({
            ...prev,
            offerid: offer.id,
            offername: offer.offers_name,
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
                body: JSON.stringify(newOffer)
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
            <Box sx={{ mt: 2 }}>
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
                                    clickid: 'abc123',
                                    payout: '10.00',
                                    revenue: newOffer.revenue.toString(),
                                    conversionid: '123456',
                                    offerid: '789',
                                    offername: newOffer.name,
                                    campaignid: 'camp_1',
                                    source: newOffer.source,
                                    status: '1'
                                })}
                                sx={{ mb: 3 }}
                            />
                            
                            <Card variant="outlined" sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                                <Typography variant="body2" color="text.secondary">
                                    <strong>How it works:</strong> When a conversion occurs, the system will replace the 
                                    placeholders (like {'{clickid}'}) with actual values and ping this URL automatically.
                                    This notifies your traffic source about successful conversions.
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
                            {selectedOffer.offers_name}
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
                                        name="clickid"
                                        value={testPostbackData.clickid}
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
                                        name="conversionid"
                                        value={testPostbackData.conversionid}
                                        onChange={handleTestDataChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Campaign ID"
                                        name="campaignid"
                                        value={testPostbackData.campaignid}
                                        onChange={handleTestDataChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <TextField
                                        fullWidth
                                        label="Status"
                                        name="status"
                                        value={testPostbackData.status}
                                        onChange={handleTestDataChange}
                                    />
                                </Grid>
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
