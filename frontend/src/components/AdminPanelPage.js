import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Modal,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

// Main role options
const roleOptions = ["Admin", "Manager", "TL", "STL", "Media Buyer", "Accounts"];

// Reporting structure definition
const reportingOptions = {
  "Manager": ["Admin"],
  "TL": ["Manager"],
  "STL": ["TL"],
  "Media Buyer": ["STL"],
  "Accounts": ["STL"]
};

// Traffic platform options
const platforms = [
  "Facebook Ads",
  "Google Ads",
  "TikTok Ads",
  "Snapchat Ads",
  "Twitter Ads",
  "LinkedIn Ads"
];

const defaultUser = {
  name: "",
  email: "",
  phone: "",
  role: "",
  reportsTo: "",
  platforms: []  // Connected platforms
};

const AdminPanelPage = () => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(defaultUser);
  const [platformAccountModal, setPlatformAccountModal] = useState(false);
  const [platformForm, setPlatformForm] = useState({ platform: "", accountId: "" });

  const handleOpen = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setFormData(users[index]);
    } else {
      setFormData(defaultUser);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setFormData(defaultUser);
    setEditingIndex(null);
    setOpen(false);
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    
    // If role is changing, reset the reportsTo field
    if (field === "role") {
      setFormData({ 
        ...formData, 
        [field]: value,
        reportsTo: "" // Reset reporting relationship
      });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const handleSave = () => {
    if (editingIndex !== null) {
      const updatedUsers = [...users];
      updatedUsers[editingIndex] = formData;
      setUsers(updatedUsers);
    } else {
      setUsers([...users, formData]);
    }
    handleClose();
  };

  const handleDelete = (index) => {
    const filtered = [...users];
    filtered.splice(index, 1);
    setUsers(filtered);
  };

  // Get possible reporting options based on selected role
  const getReportingOptions = () => {
    if (!formData.role || !reportingOptions[formData.role]) {
      return [];
    }
    
    const possibleSuperiors = reportingOptions[formData.role];
    
    // Filter users that have the appropriate roles to be a superior
    return users.filter(user => possibleSuperiors.includes(user.role));
  };

  // Platform account management
  const openPlatformModal = () => {
    setPlatformForm({ platform: platforms[0], accountId: "" });
    setPlatformAccountModal(true);
  };

  const closePlatformModal = () => {
    setPlatformAccountModal(false);
  };

  const handlePlatformChange = (field) => (e) => {
    setPlatformForm({ ...platformForm, [field]: e.target.value });
  };

  const addPlatform = () => {
    const newPlatforms = [...formData.platforms, platformForm];
    setFormData({ ...formData, platforms: newPlatforms });
    closePlatformModal();
  };

  const removePlatform = (index) => {
    const newPlatforms = [...formData.platforms];
    newPlatforms.splice(index, 1);
    setFormData({ ...formData, platforms: newPlatforms });
  };

  // Get superior's name by ID
  const getSuperiorName = (userId) => {
    if (!userId) return "None";
    const superior = users.find(user => user.id === userId);
    return superior ? superior.name : "Unknown";
  };

  return (
    <Box sx={{ p: 3, maxWidth: "1200px", mx: "auto" }}>
      <Card elevation={3} sx={{ mb: 4 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="bold">
              Admin Panel - User Management
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              size="large"
            >
              Add New User
            </Button>
          </Box>

          <Paper>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Reports To</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Platform Accounts</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f9f9f9' } }}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.email}</Typography>
                      <Typography variant="body2" color="text.secondary">{user.phone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === "Admin" ? "error" : 
                              user.role === "Manager" ? "warning" : 
                              user.role === "TL" ? "success" : 
                              user.role === "STL" ? "info" : "default"} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {user.reportsTo ? 
                        users.find(u => u.id === user.reportsTo)?.name || "Unknown" : 
                        "None"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.platforms.map((platform, idx) => (
                          <Chip 
                            key={idx} 
                            label={`${platform.platform}: ${platform.accountId}`} 
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {user.platforms.length === 0 && (
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit User">
                        <IconButton onClick={() => handleOpen(index)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton onClick={() => handleDelete(index)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No users added yet</Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => handleOpen()}
                        sx={{ mt: 1 }}
                      >
                        Add Your First User
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </CardContent>
      </Card>

      {/* User Form Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            width: { xs: "90%", sm: 500 },
            p: 4,
            bgcolor: "white",
            boxShadow: 24,
            borderRadius: 2,
            mx: "auto",
            mt: "5%",
            maxHeight: "90vh",
            overflow: "auto"
          }}
        >
          <Typography variant="h5" mb={3} fontWeight="bold">
            {editingIndex !== null ? "Edit User" : "Add New User"}
          </Typography>
          
          <Typography variant="subtitle1" mb={1} color="primary">
            User Information
          </Typography>
          <TextField
            fullWidth
            label="Full Name"
            value={formData.name}
            onChange={handleChange("name")}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Email Address"
            value={formData.email}
            onChange={handleChange("email")}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange("phone")}
            sx={{ mb: 3 }}
          />
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="subtitle1" mb={1} color="primary">
            Role & Reporting
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>User Role</InputLabel>
            <Select
              value={formData.role}
              label="User Role"
              onChange={handleChange("role")}
            >
              {roleOptions.map((role) => (
                <MenuItem key={role} value={role}>{role}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {formData.role && formData.role !== "Admin" && (
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Reports To</InputLabel>
              <Select
                value={formData.reportsTo}
                label="Reports To"
                onChange={handleChange("reportsTo")}
                disabled={!formData.role || formData.role === "Admin"}
              >
                {getReportingOptions().map((superior) => (
                  <MenuItem key={superior.id || superior.email} value={superior.id || superior.email}>
                    {superior.name} ({superior.role})
                  </MenuItem>
                ))}
                {getReportingOptions().length === 0 && (
                  <MenuItem value="" disabled>
                    No available superiors - add them first
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          )}
          
          <Divider sx={{ mb: 3 }} />
          
          <Typography variant="subtitle1" mb={1} color="primary">
            Platform Accounts
          </Typography>
          
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            {formData.platforms.length > 0 ? (
              <Grid container spacing={1}>
                {formData.platforms.map((platform, index) => (
                  <Grid item key={index}>
                    <Chip 
                      label={`${platform.platform}: ${platform.accountId}`} 
                      onDelete={() => removePlatform(index)}
                      sx={{ my: 0.5 }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary" align="center" sx={{ py: 1 }}>
                No platforms connected
              </Typography>
            )}
          </Paper>
          
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />} 
            onClick={openPlatformModal}
            fullWidth
            sx={{ mb: 3 }}
          >
            Connect Platform Account
          </Button>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              fullWidth 
              onClick={handleSave}
              color="primary"
            >
              {editingIndex !== null ? "Update User" : "Save User"}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Platform Account Modal */}
      <Modal open={platformAccountModal} onClose={closePlatformModal}>
        <Box
          sx={{
            width: { xs: "90%", sm: 400 },
            p: 4,
            bgcolor: "white",
            boxShadow: 24,
            borderRadius: 2,
            mx: "auto",
            mt: "15%",
          }}
        >
          <Typography variant="h6" mb={2}>
            Connect Platform Account
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Platform</InputLabel>
            <Select
              value={platformForm.platform}
              label="Platform"
              onChange={handlePlatformChange("platform")}
            >
              {platforms.map((platform) => (
                <MenuItem key={platform} value={platform}>{platform}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Account ID"
            value={platformForm.accountId}
            onChange={handlePlatformChange("accountId")}
            sx={{ mb: 3 }}
            placeholder="Enter account ID or username"
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" fullWidth onClick={closePlatformModal}>
              Cancel
            </Button>
            <Button variant="contained" fullWidth onClick={addPlatform}>
              Connect
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminPanelPage;