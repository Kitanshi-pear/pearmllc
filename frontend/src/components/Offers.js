import React, { useEffect, useState } from 'react';
import {
    Box, CircularProgress, Typography, Grid, TextField, Button, Select, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, FormControl, InputLabel
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Layout from "./Layout";

const OffersPage = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [offerSources, setOfferSources] = useState([]);

    
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

    const columns = [
        { field: 'serial_no', headerName: 'Serial No', width: 100 },
        { field: 'offers_name', headerName: 'Offers Name', width: 150 },
        { field: 'offer_status', headerName: 'Offer Status', width: 150 },
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
    
            handleClose();
        } catch (err) {
            console.error(err);
            alert("Error saving offer");
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
                    <DataGrid rows={offers} columns={columns} pageSize={5} sx={{ height: 600 }} />
                )}
            </Box>

            {/* Create Offer Dialog */}
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>Create New Offer</DialogTitle>
                <DialogContent>
                    <TextField label="Offer Name" name="name" fullWidth margin="dense" onChange={handleChange} />
                    <FormControl fullWidth margin="dense">
                        <InputLabel>Offer Source</InputLabel>
                        <Select name="source" value={newOffer.source} onChange={handleSourceChange}>
                            {offerSources.map(src => (
                                <MenuItem key={src.id} value={src.name}>{src.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField label="URL" name="url" fullWidth margin="dense" onChange={handleChange} />
                    <TextField label="Default Conversion Revenue" name="revenue" type="number" fullWidth margin="dense" onChange={handleChange} />
                    <TextField label="Default Postback URL" name="postbackUrl" fullWidth margin="dense" value={newOffer.postbackUrl} InputProps={{ style: { whiteSpace: "nowrap", overflow: "auto", textOverflow: "ellipsis" } }} />

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleSubmit} color="primary" variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </Layout>
    );
};

export default OffersPage;
