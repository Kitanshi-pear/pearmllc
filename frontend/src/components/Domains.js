import React, { useEffect, useState } from 'react';
import {
    Box, CircularProgress, Typography, Grid, Button, IconButton, Tooltip,
    Dialog, DialogTitle, DialogContent, TextField, Stack, Switch, FormControlLabel
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { Edit } from "@mui/icons-material";
import Layout from "./Layout";
import axios from "axios";
import { useParams } from 'react-router-dom'; // ✅ Import for route params

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
                    placeholder="https://"
                    variant="outlined"
                    sx={{ mb: 2 }}
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />

                <FormControlLabel
                    control={
                        <Switch
                            checked={sslEnabled}
                            onChange={(e) => setSslEnabled(e.target.checked)}
                            color="primary"
                        />
                    }
                    label="Enable Free SSL Certificate"
                />

                <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 3 }}>
                    <Button variant="contained" onClick={handleSubmit}>Save</Button>
                    <Button onClick={handleClose}>Cancel</Button>
                </Stack>
            </DialogContent>
        </Dialog>
    );
};

const DomainsPage = () => {
    const [domains, setDomains] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openModal, setOpenModal] = useState(false);
    const [editingDomain, setEditingDomain] = useState(null);

    const { id } = useParams(); // ✅ Get the domain ID from route params (if exists)

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                if (id) {
                    const response = await axios.get(`https://pearmllc.onrender.com/api/domains/${id}`);
                    const domain = response.data;

                    const formatted = [{
                        ...domain,
                        serial_no: 1,
                        cname_acm_name:  '',
    cname_acm_value: '',
    created_at: '',
    ssl_expiry:  '',
    reissue: domain.status !== 'active',
                    }];

                    setDomains(formatted);
                } else {
                    const response = await axios.get('https://pearmllc.onrender.com/api/domains');
                    const data = response.data;

                    const formatted = data.map((d, idx) => ({
                        ...d,
                        serial_no: idx + 1,
                        cname_acm_name: d.cname_acm_name ?? '',
    cname_acm_value: d.cname_acm_value ?? '',
    created_at: d.created_at ?? '',
    ssl_expiry: d.ssl_expiry ?? '',
    reissue: d.status !== 'not_active',
                    }));

                    setDomains(formatted);
                }
            } catch (error) {
                console.error("Error fetching domain(s):", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDomains();
    }, [id]);

    const handleReissue = (id) => {
        alert(`Reissuing SSL for domain ID: ${id}`);
    };

    const handleRowClick = (row) => {
        alert(`Clicked row: ${row?.url}`);
    };

    const handleOpenAdd = () => {
        setEditingDomain(null);
        setOpenModal(true);
    };

    const handleEdit = (domain) => {
        setEditingDomain(domain);
        setOpenModal(true);
    };

    const handleSaveDomain = async (domain) => {
        try {
            if (domain?.id) {
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
            } else {
                const response = await axios.post('https://pearmllc.onrender.com/api/domains', {
                    url: domain.url,
                    sslEnabled: domain.sslEnabled
                });

                const created = response.data.domain;
                setDomains(prev => [
                    ...prev,
                    {
                        ...created,
                        serial_no: prev.length + 1,
                        url: `https://${created.domain}`,
                        sslEnabled: created.status !== 'active'
                    }
                ]);
            }
        } catch (error) {
            console.error("Error saving domain:", error);
            alert("Failed to save domain.");
        }
    };

    const columns = [
        {
            field: 'action',
            headerName: 'Action',
            width: 100,
            renderCell: (params) => (
                <Tooltip title="Edit Domain">
                    <IconButton onClick={() => handleEdit(params.row)}>
                        <Edit />
                    </IconButton>
                </Tooltip>
            ),
        },
        { field: 'id', headerName: 'ID', width: 250 },
        { field: 'url', headerName: 'URL', width: 350 },
        {
            field: 'cname_acm_name',
            headerName: 'CNAME Name',
            width: 300,
        },
        {
            field: 'cname_acm_value',
            headerName: 'CNAME Value',
            width: 400,
        },
        {
            field: 'created_at',
            headerName: 'Date Created (UTC)',
            width: 300,
            valueFormatter: (params) => {
                const value = params?.value;
                if (!value) return '';
                const date = new Date(value);
                return isNaN(date.getTime()) ? '' : date.toLocaleString();
            },
        },
        {
            field: 'ssl_expiry',
            headerName: 'SSL Expiry Date',
            width: 300,
            valueFormatter: (params) => {
                const value = params?.value;
                if (!value) return '';
                const date = new Date(value);
                return isNaN(date.getTime()) ? '' : date.toLocaleDateString();
            },
        },
        {
            field: 'reissue',
            headerName: 'Reissue',
            width: 150,
            renderCell: (params) => (params.value ? 'Yes' : 'No'),
        },
    ];

    return (
        <Layout>
            <Box sx={{ mt: 2 }}>
                <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h4">Domains</Typography>
                    <Button variant="contained" color="primary" onClick={handleOpenAdd}>
                        Add Domain
                    </Button>
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
                            checkboxSelection
                            disableSelectionOnClick
                            onRowClick={(params) => handleRowClick(params?.row ?? {})}
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

            <DomainModal
                open={openModal}
                handleClose={() => setOpenModal(false)}
                onSave={handleSaveDomain}
                domainData={editingDomain}
            />
        </Layout>
    );
};

export default DomainsPage;
