// Helper function to ensure data appears in the DataGrid
useEffect(() => {
    if (domains && domains.length > 0) {
        // Log domains data to help debug
        console.log("Current domains state:", domains);
        
        // Ensure domains have all required fields
        const updatedDomains = domains.map(domain => ({
            ...domain,
            // Make sure all domains have these fields for display
            domain: domain.domain || '',
            created_at: domain.created_at || new Date().toISOString(),
            ssl_expiry: domain.ssl_expiry || null
        }));
        
        if (JSON.stringify(updatedDomains) !== JSON.stringify(domains)) {
            setDomains(updatedDomains);
        }
    }
}, [domains]);import React, { useEffect, useState } from 'react';
import {
Box, CircularProgress, Typography, Grid, Button, IconButton, Tooltip,
Dialog, DialogTitle, DialogContent, TextField, Stack, Switch, FormControlLabel,
Snackbar, Alert, Stepper, Step, StepLabel
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { Edit, Refresh } from "@mui/icons-material";
import Layout from "./Layout";
import axios from "axios";
import { useParams } from 'react-router-dom';

// Add/Edit Domain Modal Component
const DomainModal = ({ open, handleClose, onSave, domainData }) => {
const [url, setUrl] = useState('');
const [sslEnabled, setSslEnabled] = useState(false);

// In DomainModal component, update URL cleaning
useEffect(() => {
    if (domainData) {
        // Remove any protocol and www from the URL
        const cleanUrl = domainData.url?.replace(/^(https?:\/\/)?(www\.)?/i, '') || 
                        domainData.domain?.replace(/^(https?:\/\/)?(www\.)?/i, '') || '';
        setUrl(cleanUrl);
        setSslEnabled(domainData.sslEnabled || false);
    } else {
        setUrl('');
        setSslEnabled(false);
    }
}, [domainData]);

const handleSubmit = () => {
    const updatedData = {
        ...domainData,
        url,
        sslEnabled,
    };
    onSave(updatedData);
    handleClose();
};

return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, pt: 2 }}>
            <DialogTitle sx={{ p: 0, fontSize: "20px", fontWeight: 500 }}>
                {domainData ? 'Edit Domain' : 'New Domain'}
            </DialogTitle>
        </Box>

        <DialogContent dividers sx={{ px: 3, py: 2 }}>
            <TextField
                fullWidth
                label="URL *"
                placeholder="example.com"
                variant="outlined"
                sx={{ mb: 2 }}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                helperText="Enter domain name without https:// or www."
            />

            <FormControlLabel
                control={
                    <Switch
                        checked={sslEnabled}
                        onChange={(e) => setSslEnabled(e.target.checked)}
                        color="primary"
                    />
                }
                label="Provision Free SSL Certificate"
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                <Button variant="contained" onClick={handleSubmit}>Save</Button>
                <Button onClick={handleClose}>Cancel</Button>
            </Stack>
        </DialogContent>
    </Dialog>
);
};

// SSL Provisioning Steps Modal with improved flow
const SSLProvisioningModal = ({ open, handleClose, domain, onProvision, onDeploy, onAutoRoute53 }) => {
// Determine initial step based on domain status
const getInitialStep = () => {
    if (domain.status === 'active' && !domain.reissue) return 2; // Already completed
    if (domain.status === 'verifying' || domain.status === 'verifying_dns') return 1; // DNS verification step
    return 0; // Initial step (request certificate)
};

const [activeStep, setActiveStep] = useState(getInitialStep);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [response, setResponse] = useState({
    cname: domain?.cname_acm_name && domain?.cname_acm_value ? {
        name: domain.cname_acm_name,
        value: domain.cname_acm_value
    } : null,
    cloudfront_domain: domain?.cloudfront_domain || null
});

// Update the step when domain status changes
useEffect(() => {
    setActiveStep(getInitialStep());
    // Pre-populate response data from domain
    setResponse({
        cname: domain?.cname_acm_name && domain?.cname_acm_value ? {
            name: domain.cname_acm_name,
            value: domain.cname_acm_value
        } : null,
        cloudfront_domain: domain?.cloudfront_domain || null
    });
}, [domain]);

const steps = ['Request Certificate', 'Add DNS Record', 'Deploy CloudFront'];

const handleProvision = async () => {
    setLoading(true);
    setError(null);
    try {
        const result = await onProvision(domain.id);
        setResponse(result);
        setActiveStep(1);
        // We update the current domain object to reflect its new status
        if (domain && typeof domain === 'object') {
            domain.status = 'verifying';
            if (result?.cname) {
                domain.cname_acm_name = result.cname.name;
                domain.cname_acm_value = result.cname.value;
            }
        }
    } catch (err) {
        setError(err.message || 'Failed to provision certificate');
    } finally {
        setLoading(false);
    }
};

const handleDeploy = async () => {
    setLoading(true);
    setError(null);
    try {
        const result = await onDeploy(domain.id);
        setResponse(result);
        setActiveStep(2);
        // Update domain object to reflect its new status
        if (domain && typeof domain === 'object') {
            domain.status = 'active';
            if (result?.cloudfront_domain) {
                domain.cloudfront_domain = result.cloudfront_domain;
            }
        }
    } catch (err) {
        setError(err.message || 'Failed to deploy CloudFront');
    } finally {
        setLoading(false);
    }
};

const handleAutoRoute53 = async () => {
    setLoading(true);
    setError(null);
    try {
        const result = await onAutoRoute53(domain.id);
        setResponse(result);
        // Update domain status to indicate DNS record has been added through Route53
        if (domain && typeof domain === 'object') {
            domain.status = 'verifying_dns';
        }
        showNotification('DNS record added to Route 53. Proceeding with verification...');
    } catch (err) {
        setError(err.message || 'Failed to add DNS record to Route 53');
    } finally {
        setLoading(false);
    }
};

// Helper function to show notifications from within the modal
const showNotification = (message) => {
    if (onDeploy && typeof onDeploy === 'function') {
        // We're leveraging the parent's notification system
        // This is a bit of a hack, but it works since we know the parent has a showNotification function
        try {
            const mockResponse = { data: { message } };
            onDeploy.constructor({
                response: mockResponse,
                message
            });
        } catch (e) {
            console.log('Could not show notification:', message);
        }
    }
};

return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, pt: 2 }}>
            <DialogTitle sx={{ p: 0, fontSize: "20px", fontWeight: 500 }}>
                SSL Provisioning for {domain?.url?.replace('https://', '')}
            </DialogTitle>
        </Box>

        <DialogContent dividers sx={{ px: 3, py: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {activeStep === 0 && (
                <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        {domain.reissue 
                            ? "Reissue SSL certificate from AWS Certificate Manager for your domain." 
                            : "Request an SSL certificate from AWS Certificate Manager for your domain."}
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={handleProvision} 
                        disabled={loading}
                    >
                        {loading ? 'Requesting...' : domain.reissue ? 'Reissue Certificate' : 'Request Certificate'}
                    </Button>
                </Box>
            )}

            {activeStep === 1 && (
                <Box>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Add this CNAME record to your DNS settings to verify domain ownership:
                    </Typography>
                    
                    {response?.cname && (
                        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
                            <Typography variant="subtitle2">CNAME Name:</Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ fontFamily: 'monospace', mb: 1, wordBreak: 'break-all' }}
                            >
                                {response.cname.name}
                            </Typography>
                            
                            <Typography variant="subtitle2">CNAME Value:</Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                            >
                                {response.cname.value}
                            </Typography>
                        </Box>
                    )}

                    <Stack direction="row" spacing={2}>
                        <Button 
                            variant="contained" 
                            onClick={handleAutoRoute53} 
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Auto-add to Route 53'}
                        </Button>
                        
                        <Button 
                            variant="contained" 
                            onClick={handleDeploy} 
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'I Added the DNS Record'}
                        </Button>
                    </Stack>
                </Box>
            )}

            {activeStep === 2 && (
                <Box>
                    <Alert severity="success" sx={{ mb: 2 }}>
                        SSL Certificate provisioned successfully!
                    </Alert>
                    
                    {response?.cloudfront_domain && (
                        <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1, mb: 3 }}>
                            <Typography variant="subtitle2">CloudFront Domain:</Typography>
                            <Typography 
                                variant="body2" 
                                sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                            >
                                {response.cloudfront_domain}
                            </Typography>
                            
                            <Typography variant="body1" sx={{ mt: 2 }}>
                                Your domain is now secured with SSL and served through CloudFront CDN.
                            </Typography>
                        </Box>
                    )}
                    
                    <Button variant="contained" onClick={handleClose}>
                        Close
                    </Button>
                </Box>
            )}
        </DialogContent>
    </Dialog>
);
};

const DomainsPage = () => {
const [domains, setDomains] = useState([]);
const [loading, setLoading] = useState(true);
const [openModal, setOpenModal] = useState(false);
const [editingDomain, setEditingDomain] = useState(null);
const [selectedDomain, setSelectedDomain] = useState(null);
const [openSSLModal, setOpenSSLModal] = useState(false);
const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

// Keep track of domain statuses in local state so we can resume from the right step
const [domainStatuses, setDomainStatuses] = useState({});

const { id } = useParams();

const fetchDomains = async () => {
    setLoading(true);
    try {
        if (id) {
            const response = await axios.get(`https://pearmllc.onrender.com/api/domains/${id}`);
            const domain = response.data;

            const formatted = [{
                ...domain,
                serial_no: 1,
                url: domain?.domain ? `https://${domain.domain}` : '',
                cname_acm_name: domain.cname_acm_name || '',
                cname_acm_value: domain.cname_acm_value || '',
                created_at: domain.created_at || '',
                ssl_expiry: domain.ssl_expiry || '',
                sslEnabled: domain.status !== 'active',
                reissue: domain.reissue_only || false,
                // Always allow managing SSL if it's not active or if reissue is needed
                needsSSLManagement: domain.status !== 'active' || domain.reissue_only
            }];

            setDomains(formatted);
        } else {
            const response = await axios.get('https://pearmllc.onrender.com/api/domains');
            const data = response.data;

            const formatted = data.map((d, idx) => ({
                ...d,
                serial_no: idx + 1,
                url: d.domain ? `https://${d.domain}` : '', 
                cname_acm_name: d.cname_acm_name || '',
                cname_acm_value: d.cname_acm_value || '',
                created_at: d.created_at || '',
                ssl_expiry: d.ssl_expiry || '',
                reissue: d.reissue_only || false,
                // Always allow managing SSL if it's not active or if reissue is needed
                needsSSLManagement: d.status !== 'active' || d.reissue_only
            }));

            setDomains(formatted);
        }
    } catch (error) {
        console.error("Error fetching domain(s):", error);
        showNotification('Failed to fetch domains', 'error');
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    fetchDomains();
}, [id]);

const showNotification = (message, severity = 'info') => {
    setNotification({
        open: true,
        message,
        severity
    });
};

const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
};

const handleOpenAdd = () => {
    setEditingDomain(null);
    setOpenModal(true);
};

const handleEdit = (domain) => {
    setEditingDomain(domain);
    setOpenModal(true);
};

const handleManageSSL = (domain) => {
    // Make sure we're working with the most up-to-date domain data
    const updatedDomain = {...domain};
    
    // Check if we have local status information that's more current than what's in the domain object
    if (domain.id && domainStatuses[domain.id]) {
        // Apply any tracked status changes to ensure continuity
        updatedDomain.status = domainStatuses[domain.id].status;
        updatedDomain.cname_acm_name = domainStatuses[domain.id].cname_acm_name || updatedDomain.cname_acm_name;
        updatedDomain.cname_acm_value = domainStatuses[domain.id].cname_acm_value || updatedDomain.cname_acm_value;
        updatedDomain.cloudfront_domain = domainStatuses[domain.id].cloudfront_domain || updatedDomain.cloudfront_domain;
    }
    
    setSelectedDomain(updatedDomain);
    setOpenSSLModal(true);
};

// Fix for domain creation/update error
const handleSaveDomain = async (domain) => {
    try {
        // Clean up the domain name - remove any protocol and trailing slashes
        const cleanDomain = domain.url.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
        
        console.log("Attempting to save domain with:", { domain: cleanDomain, sslEnabled: domain.sslEnabled });
        
        if (domain?.id) {
            // Update existing domain
            const response = await axios.put(`https://pearmllc.onrender.com/api/domains/${domain.id}`, {
                domain: cleanDomain, // API expects 'domain', not 'url'
                sslEnabled: domain.sslEnabled
            });

            console.log("Update response:", response.data);
            const updated = response.data;
            
            // Update domains state with the response data
            setDomains(prev => prev.map(d => d.id === updated.id ? {
                ...d,
                ...updated,
                url: updated.domain ? `https://${updated.domain}` : '',
                domainName: updated.domain || '',
                sslEnabled: updated.status !== 'active',
                needsSSLManagement: updated.status !== 'active' || updated.reissue_only,
                created_at: updated.created_at || d.created_at,
                ssl_expiry: updated.ssl_expiry || d.ssl_expiry
            } : d));
            
            showNotification('Domain updated successfully', 'success');
        } else {
            // Create new domain
            const response = await axios.post('https://pearmllc.onrender.com/api/domains', {
                domain: cleanDomain, // API expects 'domain', not 'url'
                sslEnabled: domain.sslEnabled
            });

            console.log("Create response:", response.data);
            const created = response.data;
            const newDomain = {
                ...created,
                serial_no: domains.length + 1,
                url: created.domain ? `https://${created.domain}` : '',
                domainName: created.domain || '',
                sslEnabled: created.status !== 'active',
                needsSSLManagement: created.status !== 'active',
                created_at: created.created_at || new Date().toISOString(),
                ssl_expiry: created.ssl_expiry || ''
            };
            
            setDomains(prev => [...prev, newDomain]);
            showNotification('Domain created successfully', 'success');
            
            // Auto-start SSL provisioning if enabled
            if (domain.sslEnabled) {
                setSelectedDomain(newDomain);
                setOpenSSLModal(true);
            }
        }
    } catch (error) {
        console.error("Error saving domain:", error);
        // Log detailed error information
        if (error.response) {
            console.error("Error status:", error.response.status);
            console.error("Error data:", error.response.data);
        }
        
        const errorMsg = error.response?.data?.error || 
            error.response?.data?.message || 
            error.message || 
            'Failed to save domain';
            
        showNotification(errorMsg, 'error');
    }
};

// SSL Provisioning Functions
const handleProvisionSSL = async (domainId) => {
    try {
        const response = await axios.post(`https://pearmllc.onrender.com/api/domains/${domainId}/provision`);
        showNotification('Certificate requested successfully', 'success');
        
        // Store the updated status in our local state to maintain continuity
        setDomainStatuses(prevStatuses => ({
            ...prevStatuses,
            [domainId]: {
                ...prevStatuses[domainId],
                status: 'verifying',
                cname_acm_name: response.data.cname?.name || '',
                cname_acm_value: response.data.cname?.value || ''
            }
        }));

        // Update domains data to reflect changes
        setDomains(prevDomains => 
            prevDomains.map(d => d.id === domainId ? {
                ...d,
                status: 'verifying',
                cname_acm_name: response.data.cname?.name || d.cname_acm_name,
                cname_acm_value: response.data.cname?.value || d.cname_acm_value
            } : d)
        );
        
        return response.data;
    } catch (error) {
        console.error("Error provisioning SSL:", error);
        throw new Error(error.response?.data?.error || 'Failed to provision SSL certificate');
    }
};

const handleDeployCloudFront = async (domainId) => {
    try {
        const response = await axios.post(`https://pearmllc.onrender.com/api/domains/${domainId}/deploy`);
        showNotification('CloudFront deployed successfully', 'success');
        
        // Store the updated status in our local state
        setDomainStatuses(prevStatuses => ({
            ...prevStatuses,
            [domainId]: {
                ...prevStatuses[domainId],
                status: 'active',
                cloudfront_domain: response.data.cloudfront_domain || ''
            }
        }));

        // Update domains data to reflect changes
        setDomains(prevDomains => 
            prevDomains.map(d => d.id === domainId ? {
                ...d,
                status: 'active',
                cloudfront_domain: response.data.cloudfront_domain || d.cloudfront_domain,
                // FIX: Update SSL expiry if provided in the response
                ssl_expiry: response.data.ssl_expiry || d.ssl_expiry
            } : d)
        );
        
        return response.data;
    } catch (error) {
        console.error("Error deploying CloudFront:", error);
        throw new Error(error.response?.data?.error || 'Failed to deploy CloudFront');
    }
};

const handleAutoRoute53 = async (domainId) => {
    try {
        const response = await axios.post(`https://pearmllc.onrender.com/api/domains/${domainId}/auto-route53`);
        showNotification('DNS record added to Route 53', 'success');
        
        // Store the updated status in our local state
        setDomainStatuses(prevStatuses => ({
            ...prevStatuses,
            [domainId]: {
                ...prevStatuses[domainId],
                status: 'verifying_dns'
            }
        }));

        // Update domains data to reflect changes
        setDomains(prevDomains => 
            prevDomains.map(d => d.id === domainId ? {
                ...d,
                status: 'verifying_dns'
            } : d)
        );
        
        return response.data;
    } catch (error) {
        console.error("Error adding to Route 53:", error);
        throw new Error(error.response?.data?.error || 'Failed to add DNS record to Route 53');
    }
};

const handleRefresh = () => {
    fetchDomains();
};

// Helper function to get appropriate tooltip text
const getSSLButtonTooltip = (domain) => {
    if (!domain) return 'Manage SSL';
    
    // Check if we have local status information
    const localStatus = domain.id && domainStatuses[domain.id]?.status || domain.status;
    
    if (localStatus === 'active' && !domain.reissue) {
        return 'SSL Already Active';
    }
    
    if (localStatus === 'verifying' || localStatus === 'verifying_dns') {
        return 'Continue DNS Verification';
    }
    
    return domain.reissue ? 'Reissue SSL Certificate' : 'Manage SSL';
};

const columns = [
    {
        field: 'action',
        headerName: 'Actions',
        width: 160,
        renderCell: (params) => {
            if (!params || !params.row) return null;
            
            const domain = params.row;
            // Check if we have local state for this domain's status
            const localStatus = domain.id && domainStatuses[domain.id]?.status;
            const effectiveStatus = localStatus || domain.status;
            const needsSSLManagement = effectiveStatus !== 'active' || domain.reissue;
            
            return (
                <Box>
                    <Tooltip title="Edit Domain">
                        <IconButton onClick={() => handleEdit(domain)}>
                            <Edit />
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={getSSLButtonTooltip(domain)}>
                        <span> {/* Wrapper to allow disabled Tooltip */}
                            <IconButton 
                                onClick={() => handleManageSSL(domain)}
                                disabled={!needsSSLManagement}
                                color={needsSSLManagement ? 'primary' : 'default'}
                            >
                                <Refresh />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            );
        },
    },
    { field: 'id', headerName: 'ID', width: 70 },
    { 
        field: 'domain', 
        headerName: 'Domain Name', 
        width: 220,
        valueGetter: (params) => {
            // Handle domain name display with fallbacks
            return params.row.domain || 
                   (params.row.url && params.row.url.replace(/^https?:\/\//, '')) || 
                   params.row.domainName || 
                   '';
        }
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 120,
        renderCell: (params) => {
            if (!params || !params.row) return null;
            
            // Check if we have a more up-to-date status in our local state
            const domainId = params.row.id;
            const status = (domainId && domainStatuses[domainId]?.status) || params.row.status;
            
            let color = 'default';
            let label = status;
            
            switch(status) {
                case 'active':
                    color = 'success';
                    label = 'Active';
                    break;
                case 'pending':
                    color = 'warning';
                    label = 'Pending';
                    break;
                case 'verifying':
                    color = 'info';
                    label = 'Verifying';
                    break;
                case 'verifying_dns':
                    color = 'info';
                    label = 'Verifying DNS';
                    break;
                default:
                    color = 'default';
            }
            
            return (
                <Typography color={color} fontWeight={500}>
                    {label}
                </Typography>
            );
        }
    },
    {
        field: 'created_at',
        headerName: 'Created',
        width: 180,
        valueFormatter: (params) => {
            const value = params?.value;
            if (!value) return 'N/A';
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return 'Invalid Date';
                
                // Format date as MM/DD/YYYY, HH:MM AM/PM
                return new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                }).format(date);
            } catch (error) {
                console.error("Error formatting date:", error, value);
                return String(value);
            }
        }
    },
    {
        field: 'ssl_expiry',
        headerName: 'SSL Expires',
        width: 150,
        valueFormatter: (params) => {
            const value = params?.value;
            if (!value) return 'N/A';
            try {
                const date = new Date(value);
                if (isNaN(date.getTime())) return 'Invalid Date';
                
                // Format date as MM/DD/YYYY
                return new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(date);
            } catch (error) {
                console.error("Error formatting date:", error, value);
                return String(value);
            }
        }
    },
    {
        field: 'cname_acm_name',
        headerName: 'CNAME Name',
        width: 180,
        valueGetter: (params) => params.row.cname_acm_name || 'N/A'
    },
    {
        field: 'cname_acm_value',
        headerName: 'CNAME Value',
        width: 180,
        valueGetter: (params) => params.row.cname_acm_value || 'N/A'
    },
    {
        field: 'cloudfront_domain',
        headerName: 'CloudFront Domain',
        width: 220,
        valueGetter: (params) => params.row.cloudfront_domain || 'N/A'
    }
];

return (
    <Layout>
        <Box sx={{ mt: 2 }}>
            <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4">Domains</Typography>
                <Box>
                    <Button 
                        variant="outlined" 
                        onClick={handleRefresh} 
                        sx={{ mr: 2 }}
                        startIcon={<Refresh />}
                    >
                        Refresh
                    </Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleOpenAdd}
                    >
                        Add Domain
                    </Button>
                </Box>
            </Grid>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ height: 600, width: "100%" }}>
                    <DataGrid
                        rows={domains}
                        columns={columns}
                        getRowId={(row) => row?.serial_no ?? row?.id ?? Math.random()}
                        pageSize={10}
                        rowsPerPageOptions={[10, 20, 50]}
                        disableSelectionOnClick
                        sx={{
                            "& .MuiDataGrid-columnHeader": {
                                backgroundColor: "#f0f0f0",
                                fontWeight: "bold"
                            },
                            "& .MuiDataGrid-row:hover": {
                                backgroundColor: "#f1f1f1"
                            }
                        }}
                    />
                </Box>
            )}
        </Box>

        {/* Domain Add/Edit Modal */}
        <DomainModal
            open={openModal}
            handleClose={() => setOpenModal(false)}
            onSave={handleSaveDomain}
            domainData={editingDomain}
        />

        {/* SSL Provisioning Modal */}
        {selectedDomain && (
            <SSLProvisioningModal
                open={openSSLModal}
                handleClose={() => {
                    setOpenSSLModal(false);
                    // Refresh domains after closing the modal to ensure UI is updated
                    fetchDomains();
                }}
                domain={selectedDomain}
                onProvision={handleProvisionSSL}
                onDeploy={handleDeployCloudFront}
                onAutoRoute53={handleAutoRoute53}
            />
        )}

        {/* Notifications */}
        <Snackbar 
            open={notification.open} 
            autoHideDuration={6000} 
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

export default DomainsPage;