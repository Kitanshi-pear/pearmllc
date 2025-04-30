import React, { useEffect, useState } from 'react';
import {
  Box, CircularProgress, Typography, Button, Select, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel,
  Chip, MenuItem, TextField
} from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import Layout from "./Layout";
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';


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
      // Extract the domain and parameters from the full URL
      const domain = landerToEdit.domain || '';
      // Extract the part after "/click" (query parameters)
      const urlParts = landerToEdit.url?.split('/click');
      const queryParams = urlParts?.length > 1 ? urlParts[1] : '';
      
      setLanderData({
        name: landerToEdit.name || '',
        type: landerToEdit.type || 'LANDING',
        url: queryParams || '',
        domain: domain,
        tags: landerToEdit.tags || []
      });
    } else {
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



// Main page component
const LandingPage = () => {
  const [landers, setLanders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editLander, setEditLander] = useState(null);

  const fetchLanders = () => {
    setLoading(true);
    fetch('https://pearmllc.onrender.com/api/landers')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((lander, index) => ({
          id: lander.id || lander.Serial_No || index + 1,
          ...lander
        }));
        setLanders(formatted);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLanders();
  }, []);

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
    { field: 'clicks', headerName: 'Clicks', width: 100 },
    { field: 'lp_clicks', headerName: 'LP Clicks', width: 100 },
    { field: 'lp_views', headerName: 'LP Views', width: 100 },
    { field: 'conversion', headerName: 'Conversions', width: 100 },
    { 
      field: 'total_cpa', 
      headerName: 'Total CPA ($)', 
      width: 130,
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'epc', 
      headerName: 'EPC ($)', 
      width: 100,
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'total_revenue', 
      headerName: 'Revenue ($)', 
      width: 130,
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'cost', 
      headerName: 'Cost ($)', 
      width: 100,
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'profit', 
      headerName: 'Profit ($)', 
      width: 100,
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return params.value.toFixed(2);
      }
    },
    { 
      field: 'total_roi', 
      headerName: 'ROI (%)', 
      width: 100,
      valueFormatter: (params) => {
        if (!params || params.value == null) return '';
        return `${params.value.toFixed(2)}%`;
      }
    },
    { field: 'impressions', headerName: 'Impressions', width: 120 }
  ];

  return (
    <Layout>
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">Landers</Typography>
          <Button variant="contained" color="primary" onClick={handleOpen}>
            + New Lander
          </Button>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : (
          <DataGrid
            rows={landers}
            columns={columns}
            autoHeight
            pageSize={100}
            rowsPerPageOptions={[100, 200, 500]}
            checkboxSelection
            disableSelectionOnClick
            onRowClick={handleRowClick}
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