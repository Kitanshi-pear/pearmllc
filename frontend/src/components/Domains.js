import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        if (domainData) {
            setUrl(domainData.url || '');
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

// SSL Provisioning Steps Modal
const SSLProvisioningModal = ({ open, handleClose, domain, onProvision, onDeploy, onAutoRoute53 }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [response, setResponse] = useState(null);

    const steps = ['Request Certificate', 'Add DNS Record', 'Deploy CloudFront'];

    const handleProvision = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await onProvision(domain.id);
            setResponse(result);
            setActiveStep(1);
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
        } catch (err) {
            setError(err.message || 'Failed to add DNS record to Route 53');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, pt: 2 }}>
                <DialogTitle sx={{ p: 0, fontSize: "20px", fontWeight: 500 }}>
                    SSL Provisioning for {domain?.url}
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
                            Request an SSL certificate from AWS Certificate Manager for your domain.
                        </Typography>
                        <Button 
                            variant="contained" 
                            onClick={handleProvision} 
                            disabled={loading}
                        >
                            {loading ? 'Requesting...' : 'Request Certificate'}
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
                    url: `https://${domain.domain}`,
                    cname_acm_name: domain.cname_acm_name || '',
                    cname_acm_value: domain.cname_acm_value || '',
                    created_at: domain.created_at || '',
                    ssl_expiry: domain.ssl_expiry || '',
                    sslEnabled: domain.status !== 'active',
                    reissue: domain.status !== 'active',
                }];

                setDomains(formatted);
            } else {
                const response = await axios.get('https://pearmllc.onrender.com/api/domains');
                const data = response.data;

                const formatted = data.map((d, idx) => ({
                    ...d,
                    serial_no: idx + 1,
                    cname_acm_name: d.cname_acm_name || '',
                    cname_acm_value: d.cname_acm_value || '',
                    created_at: d.created_at || '',
                    ssl_expiry: d.ssl_expiry || '',
                    reissue: d.status !== 'active',
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
        setSelectedDomain(domain);
        setOpenSSLModal(true);
    };

    const handleSaveDomain = async (domain) => {
        try {
            if (domain?.id) {
                // Update existing domain
                const response = await axios.put(`https://pearmllc.onrender.com/api/domains/${domain.id}`, {
                    url: domain.url,
                    sslEnabled: domain.sslEnabled
                });

                const updated = response.data;
                setDomains(prev => prev.map(d => d.id === updated.id ? {
                    ...d,
                    ...updated,
                    url: `https://${updated.domain}`,
                    sslEnabled: updated.status !== 'active'
                } : d));
                
                showNotification('Domain updated successfully', 'success');
            } else {
                // Create new domain
                const response = await axios.post('https://pearmllc.onrender.com/api/domains', {
                    url: domain.url,
                    sslEnabled: domain.sslEnabled
                });

                const created = response.data;
                const newDomain = {
                    ...created,
                    serial_no: domains.length + 1,
                    url: `https://${created.domain}`,
                    sslEnabled: created.status !== 'active'
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
            showNotification('Failed to save domain', 'error');
        }
    };

    // SSL Provisioning Functions
    const handleProvisionSSL = async (domainId) => {
        try {
            const response = await axios.post(`https://pearmllc.onrender.com/api/domains/${domainId}/provision`);
            showNotification('Certificate requested successfully', 'success');
            fetchDomains(); // Refresh domains list
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
            fetchDomains(); // Refresh domains list
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
            fetchDomains(); // Refresh domains list
            return response.data;
        } catch (error) {
            console.error("Error adding to Route 53:", error);
            throw new Error(error.response?.data?.error || 'Failed to add DNS record to Route 53');
        }
    };

    const handleRefresh = () => {
        fetchDomains();
    };

    const columns = [
        {
            field: 'action',
            headerName: 'Actions',
            width: 160,
            renderCell: (params) => (
                <Box>
                    <Tooltip title="Edit Domain">
                        <IconButton onClick={() => handleEdit(params.row)}>
                            <Edit />
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Manage SSL">
                        <IconButton 
                            onClick={() => handleManageSSL(params.row)}
                            disabled={params.row.status === 'active' && !params.row.reissue}
                            color={params.row.status !== 'active' ? 'primary' : 'default'}
                        >
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                </Box>
            ),
        },
        { field: 'id', headerName: 'ID', width: 100 },
        { field: 'url', headerName: 'Domain', width: 200 },
        {
            field: 'status',
            headerName: 'Status',
            width: 130,
            renderCell: (params) => {
                const status = params.value;
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
            field: 'cname_acm_name',
            headerName: 'CNAME Name',
            width: 250,
        },
        {
            field: 'cname_acm_value',
            headerName: 'CNAME Value',
            width: 250,
        },
        {
            field: 'created_at',
            headerName: 'Created',
            width: 180,
            valueFormatter: (params) => {
                const value = params?.value;
                if (!value) return '';
                const date = new Date(value);
                return isNaN(date.getTime()) ? '' : date.toLocaleString();
            },
        },
        {
            field: 'ssl_expiry',
            headerName: 'SSL Expires',
            width: 180,
            valueFormatter: (params) => {
                const value = params?.value;
                if (!value) return '';
                const date = new Date(value);
                return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
            },
        },
        {
            field: 'cloudfront_domain',
            headerName: 'CloudFront Domain',
            width: 250,
        },
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
                            getRowId={(row) => row?.serial_no ?? Math.random()}
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
                    handleClose={() => setOpenSSLModal(false)}
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