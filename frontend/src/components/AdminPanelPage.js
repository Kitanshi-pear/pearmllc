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
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import Layout from "./Layout";

const roles = ["Admin", "Manager", "TL", "STL", "Media Buyer", "Accounts"];

const defaultUser = {
  name: "",
  email: "",
  role: "Media Buyer",
};

const AdminPanelPage = () => {
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(defaultUser);

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
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user, index) => (
              <TableRow key={index}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
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
                <TableCell colSpan={4} align="center">
                  No users added yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Modal open={open} onClose={handleClose}>
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
            select
            label="Role"
            value={formData.role}
            onChange={handleChange("role")}
            sx={{ mb: 3 }}
          >
            {roles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" fullWidth onClick={handleSave}>
            Save
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default AdminPanelPage;
