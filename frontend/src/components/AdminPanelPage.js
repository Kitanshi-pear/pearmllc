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
  Grid
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import Layout from "./Layout";

// Role hierarchy definition
const roles = ["Admin", "Manager", "TL", "STL", "Media Buyer", "Accounts"];

// Define which roles can be selected for each parent role
const allowedSubroles = {
  "Admin": ["Manager", "TL", "STL", "Media Buyer", "Accounts"],
  "Manager": ["TL", "STL", "Media Buyer", "Accounts"],
  "TL": ["STL", "Media Buyer", "Accounts"],
  "STL": ["Media Buyer", "Accounts"],
  "Media Buyer": [],
  "Accounts": []
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
  parentRole: "",
  platforms: []
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
    
    if (field === "role") {
      setFormData({ 
        ...formData, 
        [field]: value,
        parentRole: "" // Reset parent role when role changes
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

  // Get available parent roles based on the selected role
  const getAvailableParentRoles = () => {
    const roleIndex = roles.indexOf(formData.role);
    if (roleIndex <= 0) return []; // Admin has no parent
    
    // Return all roles with higher rank (lower index)
    return roles.filter((_, index) => index < roleIndex);
  };

  // Get available child roles based on a parent role
  const getAvailableChildRoles = (parentRole) => {
    if (!parentRole) return roles; // If no parent role is selected, show all roles
    return allowedSubroles[parentRole] || [];
  };

  // Platform account management
  const openPlatformModal = () => {
    setPlatformForm({ platform: platforms[0] || "", accountId: "" });
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

  return (
    <Layout>
      <Box sx={{ p: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            Admin Panel - User Management
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpen()}
          >
            Add User
          </Button>
        </Box>

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact Info</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Parent Role</TableCell>
                <TableCell>Connected Platforms</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, index) => (
                <TableRow key={index}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                    <Typography variant="body2" color="textSecondary">{user.phone}</Typography>
                  </TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.parentRole || "None"}</TableCell>
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
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpen(index)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(index)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No users added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* User Form Modal */}
        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              width: 500,
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
            <Typography variant="h6" mb={3}>
              {editingIndex !== null ? "Edit User" : "Add User"}
            </Typography>
            
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={handleChange("name")}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Email"
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
            
            <Typography variant="subtitle1" mb={1}>
              Role Selection
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Parent Role</InputLabel>
              <Select
                value={formData.parentRole}
                label="Parent Role"
                onChange={handleChange("parentRole")}
              >
                <MenuItem value="">None (Top Level)</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>User Role</InputLabel>
              <Select
                value={formData.role}
                label="User Role"
                onChange={handleChange("role")}
              >
                {getAvailableChildRoles(formData.parentRole).map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="subtitle1" mb={1}>
              Connected Platform Accounts
            </Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              {formData.platforms.length > 0 ? (
                <Grid container spacing={1}>
                  {formData.platforms.map((platform, index) => (
                    <Grid item key={index}>
                      <Chip 
                        label={`${platform.platform}: ${platform.accountId}`} 
                        onDelete={() => removePlatform(index)}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography color="textSecondary" align="center" py={1}>
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
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={handleClose} sx={{ flex: 1 }}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave} 
                sx={{ flex: 1 }}
              >
                Save
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Platform Account Modal */}
        <Modal open={platformAccountModal} onClose={closePlatformModal}>
          <Box
            sx={{
              width: 400,
              p: 4,
              bgcolor: "white",
              boxShadow: 24,
              borderRadius: 2,
              mx: "auto",
              mt: "10%",
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
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="outlined" onClick={closePlatformModal} sx={{ flex: 1 }}>
                Cancel
              </Button>
              <Button variant="contained" onClick={addPlatform} sx={{ flex: 1 }}>
                Connect
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    </Layout>
  );
};

export default AdminPanelPage;