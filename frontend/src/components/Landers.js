import React, { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Typography, Button, Select, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Chip, MenuItem, TextField, Card, CardContent, Grid
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Layout from "./Layout";
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DatePicker from '@mui/lab/DatePicker';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

// Modal component to create a new lander
const LanderModal = ({ open, onClose, macros, onLanderCreated, landerToEdit }) => {
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
          
          // Get the part after '/click' if it exists
          const pathParts = urlObj.pathname.split('/click');
          const path = pathParts.length > 1 ? pathParts[1] : '';
          
          // Combine path and search params for the full query string
          queryParams = path + urlObj.search;
        } catch (error) {
          console.error('Error parsing URL:', error);
        }
      }
      
      setLanderData({
        name: landerToEdit.name || '',
        type: landerToEdit.type || 'LANDING',
        url: queryParams || '',
        domain: domain || '',
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
    let separator = landerData.url.includes('?') ? '&' : '?';
    let updatedUrl = landerData.url + (landerData.url.endsWith('?') || landerData.url.endsWith('&') ? '' : separator) + macro.slice(1, -1) + '={' + macro.slice(1, -1) + '}';
    setLanderData({ ...landerData, url: updatedUrl });
  };

  const handleSave = async () => {
    try {
      // Get query parameters (ensure proper formatting with ? if needed)
      const queryParams = landerData.url.trim();
      const queryParamsFormatted = queryParams ? 
        (queryParams.startsWith('?') ? queryParams : `?${queryParams}`) : 
        '';
      
      // Format the final URL with the domain and click path
      const finalUrl = `https://${landerData.domain}/click${queryParamsFormatted}`;

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
    const queryParams = landerData.url.trim();
    const queryParamsFormatted = queryParams ? 
      (queryParams.startsWith('?') ? queryParams : `?${queryParams}`) : 
      '';
    
    return `https://${landerData.domain}/click${queryParamsFormatted}`;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{landerToEdit ? 'Edit Lander' : 'Create Lander'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          name="name"
          fullWidth
          margin="normal"
          value={landerData.name}
          onChange={handleChange}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Tracking domain</InputLabel>
          <Select
            name="domain"
            value={landerData.domain}
            onChange={handleChange}
            label="Tracking domain"
          >
            {domains.map((domain) => (
              <MenuItem key={domain.id} value={domain.url}>
                {domain.url}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          label="Query Parameters (e.g., ?sub1={sub1})"
          name="url"
          fullWidth
          margin="normal"
          value={landerData.url}
          onChange={handleChange}
          placeholder="?sub1={sub1}&sub2={sub2}"
          helperText="Add query parameters after the /click path"
        />

        <Box mt={2} mb={2}>
          <Typography variant="subtitle2" gutterBottom>Quick Add Macros:</Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {macros.map((macro, index) => (
              <Chip
                key={index}
                label={`+ ${macro}`}
                onClick={() => handleMacroClick(macro)}
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
        </Box>

        <Box mt={2}>
          <Typography variant="subtitle2">Click URL Preview</Typography>
          <TextField
            fullWidth
            value={getPreviewUrl()}
            margin="dense"
            InputProps={{ readOnly: true }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSave}
          disabled={!landerData.name || !landerData.domain}
        >
          {landerToEdit ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Date Range Selector Component
const DateRangeSelector = ({ startDate, endDate, onDateChange }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box display="flex" gap={2}>
        <DatePicker
          label="Start Date"
          value={startDate}
          onChange={(newDate) => onDateChange('startDate', newDate)}
          renderInput={(params) => <TextField {...params} />}
        />
        <DatePicker
          label="End Date"
          value={endDate}
          onChange={(newDate) => onDateChange('endDate', newDate)}
          renderInput={(params) => <TextField {...params} />}
          minDate={startDate}
        />
      </Box>
    </LocalizationProvider>
  );
};

// Metrics Summary Component
const MetricsSummary = ({ selectedRows }) => {
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
  
  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Summary for {selectedRows.length} Selected Landers
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2">Impressions</Typography>
            <Typography variant="body1">{metrics.totals.impressions.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2">Clicks</Typography>
            <Typography variant="body1">{metrics.totals.clicks.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2">Conversions</Typography>
            <Typography variant="body1">{metrics.totals.conversion.toLocaleString()}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2">CTR</Typography>
            <Typography variant="body1">{metrics.averages.ctr.toFixed(2)}%</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2">Revenue</Typography>
            <Typography variant="body1">${metrics.totals.total_revenue.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2">Cost</Typography>
            <Typography variant="body1">${metrics.totals.cost.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2">Profit</Typography>
            <Typography variant="body1">${metrics.totals.profit.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="subtitle2">ROI</Typography>
            <Typography variant="body1">{metrics.averages.roi.toFixed(2)}%</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Main page component
const LandingPage = () => {
  const [landers, setLanders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editLander, setEditLander] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState(new Date()); // Today
  const [selectionModel, setSelectionModel] = useState([]);

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
              '&:hover .hover-icons': { visibility: 'visible' }
            }}
          >
            <Typography variant="body2">{row.name}</Typography>
            <Box className="hover-icons" display="flex" gap={1} visibility="hidden">
              <EditIcon
                fontSize="small"
                sx={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditLander(row);
                  setOpen(true);
                }}
              />
              <ContentCopyIcon
                fontSize="small"
                sx={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(row.url);
                }}
              />
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
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%'
            }}
          >
            {params.value}
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

  return (
    <Layout>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Landers</Typography>
          <Box display="flex" gap={2}>
            <Button variant="contained" color="primary" onClick={handleOpen}>
              + New Lander
            </Button>
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleExportCSV}
              disabled={loading}
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        <Box mb={3}>
          <DateRangeSelector 
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
          />
        </Box>

        {selectedRows.length > 0 && (
          <MetricsSummary selectedRows={selectedRows} />
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" my={5}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={landers}
            columns={columns}
            autoHeight
            pageSize={100}
            rowsPerPageOptions={[25, 50, 100, 200, 500]}
            checkboxSelection
            disableSelectionOnClick
            onRowClick={handleRowClick}
            selectionModel={selectionModel}
            onSelectionModelChange={handleSelectionModelChange}
            sx={{
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "#f0f0f0",
                fontWeight: "bold"
              },
              "& .MuiDataGrid-row:hover": {
                backgroundColor: "#f1f1f1"
              },
              "& .MuiDataGrid-cell:focus-within": {
                outline: "none !important"
              }
            }}
            initialState={{
              sorting: {
                sortModel: [{ field: 'impressions', sort: 'desc' }],
              },
            }}
          />
        )}
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