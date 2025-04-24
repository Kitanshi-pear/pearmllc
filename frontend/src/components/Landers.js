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
      setLanderData({
        name: landerToEdit.name || '',
        type: landerToEdit.type || 'LANDING',
        url: landerToEdit.url?.replace(`${landerToEdit.domain}/click`, '') || '',
        domain: landerToEdit.domain || '',
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
      const baseMacros = landerData.url.split('?')[1] || '';
      const finalUrl = `${landerData.domain}/click${baseMacros ? '?' + baseMacros : ''}`;

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

        <TextField
          label="Append Macros (e.g., sub1={sub1})"
          name="url"
          fullWidth
          margin="normal"
          value={landerData.url}
          onChange={handleChange}
          placeholder="?sub1={sub1}&sub2={sub2}"
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

        <Box mt={2}>
          <Typography variant="subtitle2">Click URL</Typography>
          <TextField
            fullWidth
            value={`${landerData.domain}/click`}
            margin="dense"
            InputProps={{ readOnly: true }}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary" onClick={handleSave}>
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
  const [landerToEdit, setLanderToEdit] = useState(null);

  const fetchLanders = () => {
    setLoading(true);
    fetch('https://pearmllc.onrender.com/api/landers')
      .then(res => res.json())
      .then(data => {
        const formatted = data.map((lander, index) => ({
          id: lander.Serial_No ?? index + 1,
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
    setLanderToEdit(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setLanderToEdit(null);
  };

  const handleRowClick = (params) => {
    setLanderToEdit(params.row);
    setOpen(true);
  };

  const macros = [
    '{sub1}', '{sub2}', '{sub3}', '{clickid}', '{campaignid}', '{campaignname}',
    '{sourceid}', '{country}', '{city}', '{ip}', '{timestamp}', '{useragent}',
    '{os}', '{browser}', '{referrerdomain}'
  ];

const [editLander, setEditLander] = useState(null);

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'name',
      headerName: 'Name',
      width: 220,
      renderCell: (params) => {
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
                onClick={() => {
                  setEditLander(row);
                  setOpen(true);
                }}
              />
              <ContentCopyIcon
                fontSize="small"
                sx={{ cursor: 'pointer' }}
                onClick={() => navigator.clipboard.writeText(row.url)}
              />
            </Box>
          </Box>
        );
      }
    },
    { field: 'url', headerName: 'URL', width: 300 },
    // { field: 'domain', headerName: 'Domain', width: 200 },
    { field: 'createdAt', headerName: 'Created At', width: 180 },
    { field: 'updatedAt', headerName: 'Updated At', width: 180 },
    { field: 'clicks', headerName: 'Clicks', width: 100 },
    { field: 'lp_clicks', headerName: 'LP Clicks', width: 100 },
    { field: 'lp_views', headerName: 'LP Views', width: 100 },
    { field: 'conversion', headerName: 'Conversions', width: 100 },
    { field: 'total_cpa', headerName: 'Total CPA ($)', width: 130 },
    { field: 'epc', headerName: 'EPC ($)', width: 100 },
    { field: 'total_revenue', headerName: 'Revenue ($)', width: 130 },
    { field: 'cost', headerName: 'Cost ($)', width: 100 },
    { field: 'profit', headerName: 'Profit ($)', width: 100 },
    { field: 'total_roi', headerName: 'ROI (%)', width: 100 },
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
            onRowClick={(params) => handleRowClick(params)}
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
        )}
      </Box>

      <LanderModal
        open={open}
        onClose={() => {
          setOpen(false);
          setEditLander(null);
        }}
        macros={macros}
        onLanderCreated={fetchLanders}
        landerToEdit={editLander}
      />
    </Layout>
  );
};

export default LandingPage;
