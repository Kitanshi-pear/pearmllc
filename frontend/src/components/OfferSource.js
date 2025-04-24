import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box, Typography, Modal, Button, Card, CardContent, Grid, TextField,
  Select, MenuItem, IconButton, Divider
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import Layout from "./Layout";

const OffersourcePage = () => {
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [rows, setRows] = useState([]);
   const [filterText, setFilterText] = useState('');
  const [date, setDate] = useState("");
  const [titleText, setTitle] = useState("");

  const currencies = ["USD", "EUR", "INR", "GBP"];
  const roles = [
    "Event ID", "First Name", "Last Name", "Phone", "Gender", "Email", "Zip Code", "Birthday",
    "Content IDs", "Contents", "Product Name", "Content Category",
    "Consent User data", "Consent Personalization", "None"
  ];

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    alias: "",
    postbackUrl: "",
    currency: "",
    offerUrl: "",
    clickid: "",
    sum: "",
    parameter: "",
    token: "",
    description: "",
    role: "",
  });

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };

  const fetchOfferSources = async () => {
    try {
      const response = await axios.get("https://pearmllc.onrender.com/offersource/list");
      const data = response.data;

      const formatted = data.map((item, index) => ({
        id: item.id,
        serial_no: index + 1,
        source_name: item.name,
        Timestamp: item.createdAt,
        postback: item.postback_url,
        currency: item.currency,
        offer_url: item.offer_url,
        clickid: item.clickid,
        sum: item.sum,
        parameter: item.parameter,
        token: item.token,
        description: item.description,
        role: item.role,
        clicks: 0,
        lp_clicks: 0,
        conversion: 0,
        total_cpa: 0,
        epc: 0,
        total_revenue: 0,
        cost: 0,
        profit: 0,
        total_roi: 0,
        lp_views: 0,
      }));

      setRows(formatted);
    } catch (err) {
      console.error("Failed to fetch offer sources:", err.message);
    }
  };

  useEffect(() => {
    fetchOfferSources();
  }, []);

  const handleEditClick = (row) => {
    setSelectedRowId(row.id);
    setEditMode(true);
    setNewTemplate({
      name: row.source_name,
      alias: row.source_name.toLowerCase().replace(/\s+/g, "-"),
      postbackUrl: row.postback || "",
      currency: row.currency || "",
      offerUrl: row.offer_url || "",
      clickid: row.clickid || "",
      sum: row.sum || "",
      parameter: row.parameter || "",
      token: row.token || "",
      description: row.description || "",
      role: row.role || "",
    });
    setOpenTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const payload = {
        name: newTemplate.name,
        alias: newTemplate.alias,
        postback_url: newTemplate.postbackUrl,
        currency: newTemplate.currency,
        offer_url: newTemplate.offerUrl,
        clickid: newTemplate.clickid,
        sum: newTemplate.sum,
        parameter: newTemplate.parameter,
        token: newTemplate.token,
        description: newTemplate.description,
        role: newTemplate.role,
      };

      if (editMode && selectedRowId) {
        await axios.put(`https://pearmllc.onrender.com/offersource/update/${selectedRowId}`, payload);
        console.log("Updated successfully");
      } else {
        await axios.post("https://pearmllc.onrender.com/offersource/create", payload);
        console.log("Created successfully");
      }

      fetchOfferSources();
      setOpenTemplateModal(false);
      setEditMode(false);
      setSelectedRowId(null);
      setNewTemplate({
        name: "",
        alias: "",
        postbackUrl: "",
        currency: "",
        offerUrl: "",
        clickid: "",
        sum: "",
        parameter: "",
        token: "",
        description: "",
        role: "",
      });
    } catch (error) {
      console.error("Error saving template:", error.message);
    }
  };

  const columns = [
    { field: 'serial_no', headerName: 'Serial No', width: 100, align: 'center' },
    {
      field: 'source_name',
      headerName: 'Source Name',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <Typography sx={{ flexGrow: 1 }}>{params.value}</Typography>
          <IconButton size="small" onClick={() => handleEditClick(params.row)} title="Edit">
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      )
    },
    {
      field: 'Timestamp',
      headerName: 'Timestamp',
      width: 200,
      valueGetter: (params) =>
        params?.value ? new Date(params?.value).toLocaleString() : 'N/A',
    },
    { field: 'postback', headerName: 'Postback', width: 180 },
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
  ];

  return (
    <Layout>
      <Box sx={{  }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Offer Source</Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setOpenTemplateModal(true);
              setEditMode(false);
              setSelectedRowId(null);
              setNewTemplate({
                name: "",
                alias: "",
                postbackUrl: "",
                currency: "",
                offerUrl: "",
                clickid: "",
                sum: "",
                parameter: "",
                token: "",
                description: "",
                role: "",
              });
            }}
          >
            Add New Template
          </Button>
        </Box>

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
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={4} sm={2}>
                                  <Button
                                      variant="contained"
                                      color="primary"
                                      fullWidth
                                      onClick={() => setFilterText('')}
                                  >
                                      Apply
                                  </Button>
                              </Grid>
        </Grid>

        <Box sx={{ height: 700, width: "100%", mt: 3, bgcolor: "white", boxShadow: 2, p: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={5}
            rowsPerPageOptions={[5, 10, 15]}
            disableSelectionOnClick
          />
        </Box>

        {/* Modal Component */}
        <Modal open={openTemplateModal} onClose={() => setOpenTemplateModal(false)}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "900px",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              {editMode ? "Edit Offer Source" : "Add New Template"}
            </Typography>

            {/* Template Details */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
           
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} sm={12}>
                    <TextField
                      fullWidth
                      label="Name *"
                      value={newTemplate.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewTemplate({
                          ...newTemplate,
                          name: value,
                          alias: value.toLowerCase().replace(/\s+/g, "-"),
                        });
                      }}
                    />
                  </Grid>
                  <Grid item md={4} or lg={3}>
                    <TextField fullWidth label="Alias Offer Source" value={newTemplate.alias} disabled />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  label="Postback URL"
                  value={newTemplate.postbackUrl}
                  onChange={(e) => setNewTemplate({ ...newTemplate, postbackUrl: e.target.value })}
                  sx={{ mt: 2 }}
                  InputProps={{
                    endAdornment: (
                      <IconButton>
                        <ContentCopyIcon />
                      </IconButton>
                    ),
                  }}
                />
                <Select
                  fullWidth
                  value={newTemplate.currency}
                  onChange={(e) => setNewTemplate({ ...newTemplate, currency: e.target.value })}
                  sx={{ mt: 2 }}
                >
                  {currencies.map((currency) => (
                    <MenuItem key={currency} value={currency}>
                      {currency}
                    </MenuItem>
                  ))}
                </Select>
                <TextField
                  fullWidth
                  label="Offer URL Template"
                  value={newTemplate.offerUrl}
                  onChange={(e) => setNewTemplate({ ...newTemplate, offerUrl: e.target.value })}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>

            {/* Postback Parameters */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1">Postback Parameters</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="CLICKID"
                      value={newTemplate.clickid}
                      onChange={(e) => setNewTemplate({ ...newTemplate, clickid: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="SUM"
                      value={newTemplate.sum}
                      onChange={(e) => setNewTemplate({ ...newTemplate, sum: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Additional Parameters */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1">Additional Parameters</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Parameter"
                      value={newTemplate.parameter}
                      onChange={(e) => setNewTemplate({ ...newTemplate, parameter: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Macro / Token"
                      value={newTemplate.token}
                      onChange={(e) => setNewTemplate({ ...newTemplate, token: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Name / Description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Select
                      fullWidth
                      value={newTemplate.role}
                      onChange={(e) => setNewTemplate({ ...newTemplate, role: e.target.value })}
                    >
                      {roles.map((role) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={() => setOpenTemplateModal(false)} sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSaveTemplate}>
                {editMode ? "Save Changes" : "Save Changes"}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Layout>
  );
};

export default OffersourcePage;
