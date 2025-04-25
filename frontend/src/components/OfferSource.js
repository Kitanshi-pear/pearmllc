import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Modal,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Divider,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import Layout from "./Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarAlt,
  faChevronLeft,
  faChevronRight,
  faExchangeAlt,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";

const OffersourcePage = () => {
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [rows, setRows] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [date, setDate] = useState("");
  const [titleText, setTitle] = useState("");

  const currencies = ["USD", "EUR", "INR", "GBP"];
  const roles = [
    "Event ID",
    "First Name",
    "Last Name",
    "Phone",
    "Gender",
    "Email",
    "Zip Code",
    "Birthday",
    "Content IDs",
    "Contents",
    "Product Name",
    "Content Category",
    "Consent User data",
    "Consent Personalization",
    "None",
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
      const response = await axios.get(
        "https://pearmllc.onrender.com/offersource/list"
      );
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
        await axios.put(
          `https://pearmllc.onrender.com/offersource/update/${selectedRowId}`,
          payload
        );
        console.log("Updated successfully");
      } else {
        await axios.post(
          "https://pearmllc.onrender.com/offersource/create",
          payload
        );
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
    { field: "serial_no", headerName: "Serial No", width: 100, align: "center" },
    {
      field: "source_name",
      headerName: "Source Name",
      width: 200,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Typography sx={{ flexGrow: 1 }}>{params.value}</Typography>
          <IconButton
            size="small"
            onClick={() => handleEditClick(params.row)}
            title="Edit"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
    {
      field: "Timestamp",
      headerName: "Timestamp",
      width: 200,
      valueGetter: (params) =>
        params?.value ? new Date(params?.value).toLocaleString() : "N/A",
    },
    { field: "postback", headerName: "Postback", width: 180 },
    { field: "clicks", headerName: "Clicks", width: 100, type: "number" },
    { field: "lp_clicks", headerName: "LP Clicks", width: 120, type: "number" },
    { field: "conversion", headerName: "Conversions", width: 150, type: "number" },
    { field: "total_cpa", headerName: "Total CPA ($)", width: 150, type: "number" },
    { field: "epc", headerName: "EPC ($)", width: 120, type: "number" },
    {
      field: "total_revenue",
      headerName: "Total Revenue ($)",
      width: 180,
      type: "number",
    },
    { field: "cost", headerName: "Cost ($)", width: 150, type: "number" },
    { field: "profit", headerName: "Profit ($)", width: 150, type: "number" },
    { field: "total_roi", headerName: "Total ROI (%)", width: 150, type: "number" },
    { field: "lp_views", headerName: "LP Views", width: 150, type: "number" },
  ];

  // Date grid component from the image, converted to React + MUI + Tailwind style
  // Using inline styles and MUI components for layout, FontAwesome for icons
  // This component can be placed above the DataGrid or wherever needed

  const DateGrid = () => {
    return (
      <Box className="max-w-full p-4 bg-white font-sans text-gray-800">
        <Box className="flex space-x-2 mb-6 flex-wrap">
          <Button
            variant="outlined"
            className="flex items-center w-48 justify-start"
            sx={{ borderColor: "#d1d5db", textTransform: "none" }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
              <Typography variant="caption" color="text.secondary" sx={{ userSelect: "none" }}>
                Date 2025-04-10 - 2025-04-10
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: "400" }}>
                Today
              </Typography>
            </Box>
            <FontAwesomeIcon
              icon={faCalendarAlt}
              style={{ marginLeft: "auto", color: "#374151", fontSize: "1.125rem" }}
            />
          </Button>
          <Button
            variant="outlined"
            sx={{ borderColor: "#d1d5db", minWidth: 40, px: 1 }}
            aria-label="Previous"
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ color: "#374151" }} />
          </Button>
          <Button
            variant="outlined"
            sx={{ borderColor: "#d1d5db", minWidth: 40, px: 1 }}
            aria-label="Next"
          >
            <FontAwesomeIcon icon={faChevronRight} style={{ color: "#374151" }} />
          </Button>
          <Button
            sx={{
              bgcolor: "#d1d5db",
              "&:hover": { bgcolor: "#9ca3af" },
              minWidth: 40,
              width: 40,
              height: 40,
              borderRadius: "9999px",
              ml: 2,
            }}
            aria-label="Swap Dates"
          >
            <FontAwesomeIcon icon={faExchangeAlt} style={{ color: "#374151" }} />
          </Button>
          <Box
            sx={{
              border: "1px solid #d1d5db",
              borderRadius: 1,
              px: 2,
              py: 1,
              width: 240,
              ml: 4,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ userSelect: "none" }}>
              Time zone
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: "600" }}>
              America/New_York
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", borderTop: "1px solid #d1d5db", pt: 4, flexWrap: "wrap" }}>
          <Box
            component="nav"
            sx={{
              display: "flex",
              flexDirection: "column",
              pr: 3,
              borderRight: "1px solid #d1d5db",
              minWidth: 140,
              fontSize: "0.875rem",
              color: "#1f2937",
              fontWeight: 400,
              flexShrink: 0,
            }}
          >
            {[
              "Today",
              "Last 60 minutes",
              "Yesterday",
              "This week",
              "Last 7 days",
              "Last week",
              "This month",
              "Last 30 days",
              "Last month",
            ].map((item) => (
              <Button
                key={item}
                sx={{
                  justifyContent: "flex-start",
                  textTransform: "none",
                  color: "#1f2937",
                  fontWeight: 400,
                  fontSize: "0.875rem",
                  mb: 1,
                  p: 0,
                  minWidth: "auto",
                }}
              >
                {item}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: "flex", px: 6, gap: 12, flexWrap: "wrap" }}>
            {/* Left calendar */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  mb: 1,
                  fontSize: "0.875rem",
                  color: "#1f2937",
                  fontWeight: 400,
                  userSelect: "none",
                }}
              >
                <Button sx={{ minWidth: 24, p: 0, color: "#1f2937" }} aria-label="Previous month">
                  <FontAwesomeIcon icon={faChevronLeft} />
                </Button>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <Typography>Apr</Typography>
                  <FontAwesomeIcon icon={faCaretDown} style={{ fontSize: "0.75rem" }} />
                </Box>
                <Box
                  sx={{
                    borderBottom: "1px solid #9ca3af",
                    fontWeight: 400,
                    cursor: "pointer",
                    userSelect: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Typography>2025</Typography>
                  <FontAwesomeIcon icon={faCaretDown} style={{ fontSize: "0.75rem" }} />
                </Box>
                <Button sx={{ minWidth: 24, p: 0, color: "#1f2937" }} aria-label="Next month">
                  <FontAwesomeIcon icon={faChevronRight} />
                </Button>
              </Box>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "#4b5563",
                  userSelect: "none",
                }}
              >
                <thead>
                  <tr>
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <th key={d} style={{ paddingBottom: 8, fontWeight: 400 }}>
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ color: "#374151", fontSize: "0.875rem", fontWeight: 400 }}>
                  {[
                    [30, 31, 1, 2, 3, 4, 5],
                    [6, 7, 8, 9, 10, 11, 12],
                    [13, 14, 15, 16, 17, 18, 19],
                    [20, 21, 22, 23, 24, 25, 26],
                    [27, 28, 29, 30, 1, 2, 3],
                  ].map((week, i) => (
                    <tr key={i}>
                      {week.map((day, j) => {
                        const isGray = i === 4 && day <= 3;
                        const isSelected = day === 10 && i === 1;
                        return (
                          <td
                            key={j}
                            style={{
                              paddingTop: 4,
                              paddingBottom: 4,
                              color: isGray ? "#9ca3af" : "#374151",
                              position: "relative",
                            }}
                          >
                            {day}
                            {isSelected && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: "50%",
                                  left: "50%",
                                  transform: "translate(-50%, -50%)",
                                  width: 32,
                                  height: 32,
                                  borderRadius: "9999px",
                                  border: "1.5px solid #1f2937",
                                  pointerEvents: "none",
                                }}
                              />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>

            {/* Right calendar */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  mb: 1,
                  fontSize: "0.875rem",
                  color: "#1f2937",
                  fontWeight: 400,
                  userSelect: "none",
                }}
              >
                <Button sx={{ minWidth: 24, p: 0, color: "#1f2937" }} aria-label="Previous month">
                  <FontAwesomeIcon icon={faChevronLeft} />
                </Button>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <Typography>May</Typography>
                  <FontAwesomeIcon icon={faCaretDown} style={{ fontSize: "0.75rem" }} />
                </Box>
                <Box
                  sx={{
                    borderBottom: "1px solid #9ca3af",
                    fontWeight: 400,
                    cursor: "pointer",
                    userSelect: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <Typography>2025</Typography>
                  <FontAwesomeIcon icon={faCaretDown} style={{ fontSize: "0.75rem" }} />
                </Box>
                <Button sx={{ minWidth: 24, p: 0, color: "#1f2937" }} aria-label="Next month">
                  <FontAwesomeIcon icon={faChevronRight} />
                </Button>
              </Box>
              <Box
                component="table"
                sx={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "center",
                  fontSize: "0.75rem",
                  color: "#4b5563",
                  userSelect: "none",
                }}
              >
                <thead>
                  <tr>
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                      <th key={d} style={{ paddingBottom: 8, fontWeight: 400 }}>
                        {d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody style={{ color: "#374151", fontSize: "0.875rem", fontWeight: 400 }}>
                  {[
                    [27, 28, 29, 30, 1, 2, 3],
                    [4, 5, 6, 7, 8, 9, 10],
                    [11, 12, 13, 14, 15, 16, 17],
                    [18, 19, 20, 21, 22, 23, 24],
                    [25, 26, 27, 28, 29, 30, 31],
                  ].map((week, i) => (
                    <tr key={i}>
                      {week.map((day, j) => {
                        const isGray = i === 0 && day <= 30;
                        return (
                          <td
                            key={j}
                            style={{
                              paddingTop: 4,
                              paddingBottom: 4,
                              color: isGray ? "#9ca3af" : "#374151",
                            }}
                          >
                            {day}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Layout>
      <Box>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 2 }}
        >
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
              onClick={() => setFilterText("")}
            >
              Apply
            </Button>
          </Grid>
        </Grid>

        {/* Insert the DateGrid component here */}
        <DateGrid />

        <Box
          sx={{
            height: 700,
            width: "100%",
            mt: 3,
            bgcolor: "white",
            boxShadow: 2,
            p: 2,
          }}
        >
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
                    <TextField
                      fullWidth
                      label="Alias Offer Source"
                      value={newTemplate.alias}
                      disabled
                    />
                  </Grid>
                </Grid>
                <TextField
                  fullWidth
                  label="Postback URL"
                  value={newTemplate.postbackUrl}
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, postbackUrl: e.target.value })
                  }
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
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, currency: e.target.value })
                  }
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
                  onChange={(e) =>
                    setNewTemplate({ ...newTemplate, offerUrl: e.target.value })
                  }
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
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, clickid: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="SUM"
                      value={newTemplate.sum}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, sum: e.target.value })
                      }
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
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, parameter: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Macro / Token"
                      value={newTemplate.token}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, token: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <TextField
                      fullWidth
                      label="Name / Description"
                      value={newTemplate.description}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, description: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Select
                      fullWidth
                      value={newTemplate.role}
                      onChange={(e) =>
                        setNewTemplate({ ...newTemplate, role: e.target.value })
                      }
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