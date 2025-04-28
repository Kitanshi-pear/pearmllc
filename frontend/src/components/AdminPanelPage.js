import React, { useState, useEffect } from "react";
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
  Divider
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

// Role hierarchy definition
const roleHierarchy = {
  "Admin": {
    "Manager": {
      "TL": {
        "STL": {
          "Media Buyer": null,
          "Accounts": null
        }
      }
    }
  }
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
  roleChain: ["Media Buyer"], // Default role path
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
    setFormData({ ...formData, [field]: e.target.value });
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

  // Role chain management
  const handleRoleChange = (index) => (e) => {
    const value = e.target.value;
    const newRoleChain = [...formData.roleChain.slice(0, index), value];
    
    // Reset lower-level roles when higher-level role changes
    setFormData({ ...formData, roleChain: newRoleChain });
  };

  // Get available options for role level based on the current role chain
  const getOptionsForLevel = (level) => {
    if (level === 0) return Object.keys(roleHierarchy);
    
    let currentLevel = roleHierarchy;
    for (let i = 0; i < level; i++) {
      if (!formData.roleChain[i]) return [];
      currentLevel = currentLevel[formData.roleChain[i]];
      if (!currentLevel) return [];
    }
    
    return Object.keys(currentLevel || {});
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

  // Render role selection based on hierarchy
  const renderRoleSelections = () => {
    return formData.roleChain.map((role, index) => (
      <FormControl key={index} fullWidth sx={{ mb: 2 }}>
        <InputLabel>{index === 0 ? "Role" : `Reporting to ${formData.roleChain[index-1]}`}</InputLabel>
        <Select
          value={role}
          label={index === 0 ? "Role" : `Reporting to ${formData.roleChain[index-1]}`}
          onChange={handleRoleChange(index)}
        >
          {getOptionsForLevel(index).map((option) => (
            <MenuItem key={option} value={option}>{option}</MenuItem>
          ))}
        </Select>
      </FormControl>
    ));
  };

  // Add next level in role chain if possible
  const canAddNextLevel = () => {
    if (!formData.roleChain.length) return false;
    
    let currentLevel = roleHierarchy;
    for (const role of formData.roleChain) {
      currentLevel = currentLevel[role];
      if (!currentLevel) return false;
    }
    
    return Object.keys(currentLevel).length > 0;
  };

  const addNextRoleLevel = () => {
    if (!canAddNextLevel()) return;
    
    let currentLevel = roleHierarchy;
    for (const role of formData.roleChain) {
      currentLevel = currentLevel[role];
    }
    
    const nextOptions = Object.keys(currentLevel);
    if (nextOptions.length > 0) {
      setFormData({ 
        ...formData, 
        roleChain: [...formData.roleChain, nextOptions[0]] 
      });
    }
  };

  const removeLastRoleLevel = () => {
    if (formData.roleChain.length <= 1) return;
    
    setFormData({
      ...formData,
      roleChain: formData.roleChain.slice(0, -1)
    });
  };

  // Get last role in chain (user's actual role)
  const getUserRole = (roleChain) => {
    return roleChain[roleChain.length - 1];
  };

  // Format role chain for display
  const formatRoleChain = (roleChain) => {
    return roleChain.join(" → ");
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Admin Panel - User Management
        </Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add User
        </Button>
      </Box>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Reporting Structure</TableCell>
              <TableCell>Connected Platforms</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={index}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>{getUserRole(user.roleChain)}</TableCell>
                <TableCell>{formatRoleChain(user.roleChain)}</TableCell>
                <TableCell>
                  {user.platforms.map((platform, idx) => (
                    <Chip 
                      key={idx} 
                      label={`${platform.platform}: ${platform.accountId}`} 
                      size="small" 
                      sx={{ mr: 0.5, mb: 0.5 }} 
                    />
                  ))}
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
                <TableCell colSpan={7} align="center">
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
          <Typography variant="h6" mb={2}>
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
          
          <Box mb={3}>
            <Typography variant="subtitle1" mb={1}>Role Hierarchy</Typography>
            <Box mb={1}>
              {renderRoleSelections()}
            </Box>
            <Box display="flex" justifyContent="flex-end" gap={1}>
              {formData.roleChain.length > 1 && (
                <Button 
                  startIcon={<RemoveIcon />} 
                  onClick={removeLastRoleLevel}
                  size="small"
                  color="error"
                >
                  Remove Level
                </Button>
              )}
              {canAddNextLevel() && (
                <Button 
                  startIcon={<AddIcon />} 
                  onClick={addNextRoleLevel}
                  size="small"
                >
                  Add Subrole
                </Button>
              )}
            </Box>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <Box mb={3}>
            <Typography variant="subtitle1" mb={1}>Connected Platforms</Typography>
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
                <Typography color="text.secondary" align="center">No platforms connected</Typography>
              )}
            </Paper>
            <Button 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={openPlatformModal}
              fullWidth
            >
              Connect Platform
            </Button>
          </Box>
          
          <Button variant="contained" fullWidth onClick={handleSave}>
            Save User
          </Button>
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
          />
          
          <Button variant="contained" fullWidth onClick={addPlatform}>
            Connect Account
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminPanelPage;