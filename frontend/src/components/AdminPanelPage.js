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
  Container,
  Divider,
  alpha,
  useTheme,
  TableContainer,
  CircularProgress,
  styled
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import WorkIcon from "@mui/icons-material/Work";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import LinkIcon from "@mui/icons-material/Link";
import CloseIcon from "@mui/icons-material/Close";
import Layout from "./Layout";

// Elegant styled components
const ElegantPaper = styled(Paper)(({ theme }) => ({
  borderRadius: 8,
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  border: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
  overflow: "hidden",
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: theme.spacing(3, 3, 3, 3),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
}));

const ElegantButton = styled(Button)(({ theme, primary, danger }) => ({
  textTransform: "none",
  borderRadius: 6,
  padding: theme.spacing(0.8, 2),
  fontWeight: 500,
  boxShadow: "none",
  ...(primary && {
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
    },
  }),
  ...(danger && {
    color: theme.palette.error.main,
    borderColor: alpha(theme.palette.error.main, 0.5),
    "&:hover": {
      backgroundColor: alpha(theme.palette.error.main, 0.04),
      borderColor: theme.palette.error.main,
    },
  }),
}));

const ElegantIconButton = styled(IconButton)(({ theme, color }) => ({
  padding: 8,
  color: color === "error" ? theme.palette.error.main : theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: color === "error" 
      ? alpha(theme.palette.error.main, 0.04)
      : alpha(theme.palette.primary.main, 0.04),
  },
}));

const ElegantModal = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: theme.palette.background.paper,
  borderRadius: 8,
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
  padding: theme.spacing(3.5),
  width: 480,
  maxWidth: "95%",
  maxHeight: "90vh",
  overflow: "auto",
}));

const ElegantTextField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 6,
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 1,
    }
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
  "& .MuiOutlinedInput-input": {
    padding: "10px 14px",
  }
}));

const ElegantFormControl = styled(FormControl)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 6,
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.palette.primary.main,
      borderWidth: 1,
    }
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.875rem",
    color: theme.palette.text.secondary,
  },
  "& .MuiSelect-select": {
    padding: "10px 14px",
  }
}));

const ElegantTableContainer = styled(TableContainer)(({ theme }) => ({
  maxHeight: "calc(100vh - 220px)",
  "&::-webkit-scrollbar": {
    width: 6,
    height: 6,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    borderRadius: 6,
  },
}));

const ElegantTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  fontSize: "0.875rem",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
}));

const ElegantTableHeadCell = styled(ElegantTableCell)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

const StyledChip = styled(Chip)(({ theme, color }) => ({
  height: 24,
  fontSize: "0.75rem",
  borderRadius: 4,
  backgroundColor: color ? alpha(theme.palette[color].main, 0.08) : alpha(theme.palette.primary.main, 0.08),
  color: color ? theme.palette[color].main : theme.palette.primary.main,
  border: color ? `1px solid ${alpha(theme.palette[color].main, 0.3)}` : `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  '& .MuiChip-deleteIcon': {
    fontSize: '1rem',
    color: color ? alpha(theme.palette[color].main, 0.7) : alpha(theme.palette.primary.main, 0.7),
    margin: '0 4px 0 -6px',
    '&:hover': {
      color: color ? theme.palette[color].main : theme.palette.primary.main,
    },
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.875rem",
  fontWeight: 500,
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(1),
}));

const FormDivider = styled(Divider)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

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

// Platform colors for visual distinction
const platformColors = {
  "Facebook Ads": "primary",
  "Google Ads": "success",
  "TikTok Ads": "error",
  "Snapchat Ads": "warning",
  "Twitter Ads": "info",
  "LinkedIn Ads": "secondary"
};

const defaultUser = {
  name: "",
  email: "",
  phone: "",
  role: "",
  parentRole: "",
  platforms: []
};

const AdminPanelPage = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(defaultUser);
  const [platformAccountModal, setPlatformAccountModal] = useState(false);
  const [platformForm, setPlatformForm] = useState({ platform: "", accountId: "" });
  const [loading, setLoading] = useState(false);

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
    setLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      if (editingIndex !== null) {
        const updatedUsers = [...users];
        updatedUsers[editingIndex] = formData;
        setUsers(updatedUsers);
      } else {
        setUsers([...users, formData]);
      }
      setLoading(false);
      handleClose();
    }, 600);
  };

  const handleDelete = (index) => {
    setLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      const filtered = [...users];
      filtered.splice(index, 1);
      setUsers(filtered);
      setLoading(false);
    }, 400);
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

  const getRoleChipColor = (role) => {
    switch (role) {
      case "Admin": return "error";
      case "Manager": return "warning";
      case "TL": return "success";
      case "STL": return "info";
      case "Media Buyer": return "primary";
      case "Accounts": return "secondary";
      default: return undefined;
    }
  };

  return (
    <Layout>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Elegant Header */}
        <HeaderContainer mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                User Management
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Manage team members and their access levels
              </Typography>
            </Box>
            <ElegantButton
              primary
              startIcon={<AddIcon />}
              onClick={() => handleOpen()}
              sx={{ px: 2.5 }}
            >
              Add User
            </ElegantButton>
          </Box>
        </HeaderContainer>

        {/* Elegant Table */}
        <ElegantPaper sx={{ mt: 2 }}>
          <ElegantTableContainer>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <ElegantTableHeadCell>Name</ElegantTableHeadCell>
                  <ElegantTableHeadCell>Contact Info</ElegantTableHeadCell>
                  <ElegantTableHeadCell>Role</ElegantTableHeadCell>
                  <ElegantTableHeadCell>Reports To</ElegantTableHeadCell>
                  <ElegantTableHeadCell>Connected Platforms</ElegantTableHeadCell>
                  <ElegantTableHeadCell align="right">Actions</ElegantTableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={index} hover>
                    <ElegantTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.palette.primary.main,
                            mr: 1.5,
                          }}
                        >
                          <PersonIcon fontSize="small" />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {user.name}
                        </Typography>
                      </Box>
                    </ElegantTableCell>
                    <ElegantTableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.9rem' }} />
                          <Typography variant="body2">{user.email}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.9rem' }} />
                          <Typography variant="body2" color="text.secondary">{user.phone}</Typography>
                        </Box>
                      </Box>
                    </ElegantTableCell>
                    <ElegantTableCell>
                      <StyledChip 
                        label={user.role} 
                        size="small" 
                        color={getRoleChipColor(user.role)}
                      />
                    </ElegantTableCell>
                    <ElegantTableCell>
                      {user.parentRole ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SupervisorAccountIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1, fontSize: '0.9rem' }} />
                          <Typography variant="body2">{user.parentRole}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">None</Typography>
                      )}
                    </ElegantTableCell>
                    <ElegantTableCell>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {user.platforms.map((platform, idx) => (
                          <StyledChip 
                            key={idx} 
                            label={`${platform.platform.split(' ')[0]}: ${platform.accountId}`} 
                            size="small"
                            color={platformColors[platform.platform]}
                          />
                        ))}
                        {user.platforms.length === 0 && (
                          <Typography variant="body2" color="text.secondary">None</Typography>
                        )}
                      </Box>
                    </ElegantTableCell>
                    <ElegantTableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Tooltip title="Edit">
                          <ElegantIconButton onClick={() => handleOpen(index)}>
                            <EditIcon fontSize="small" />
                          </ElegantIconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <ElegantIconButton color="error" onClick={() => handleDelete(index)}>
                            <DeleteIcon fontSize="small" />
                          </ElegantIconButton>
                        </Tooltip>
                      </Box>
                    </ElegantTableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <ElegantTableCell colSpan={6}>
                      <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 1,
                            backgroundColor: alpha(theme.palette.primary.main, 0.06),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: theme.palette.primary.main,
                            mb: 1,
                          }}
                        >
                          <PersonIcon />
                        </Box>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                          No users added yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Get started by adding your first team member
                        </Typography>
                        <ElegantButton
                          primary
                          startIcon={<AddIcon />}
                          onClick={() => handleOpen()}
                          size="small"
                        >
                          Add User
                        </ElegantButton>
                      </Box>
                    </ElegantTableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ElegantTableContainer>
        </ElegantPaper>

        {/* User Form Modal */}
        <Modal 
          open={open} 
          onClose={handleClose}
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: alpha(theme.palette.background.paper, 0.2),
                backdropFilter: 'blur(2px)',
              }
            }
          }}
        >
          <ElegantModal>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {editingIndex !== null ? "Edit User" : "Add New User"}
              </Typography>
              <ElegantIconButton onClick={handleClose} size="small">
                <CloseIcon fontSize="small" />
              </ElegantIconButton>
            </Box>
            
            <SectionTitle sx={{ mt: 2 }}>
              Personal Information
            </SectionTitle>
            
            <ElegantTextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={handleChange("name")}
              sx={{ mb: 2 }}
              size="small"
            />
            
            <ElegantTextField
              fullWidth
              label="Email Address"
              value={formData.email}
              onChange={handleChange("email")}
              sx={{ mb: 2 }}
              size="small"
            />
            
            <ElegantTextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange("phone")}
              sx={{ mb: 2 }}
              size="small"
            />
            
            <FormDivider />
            
            <SectionTitle>
              Role Assignment
            </SectionTitle>
            
            <ElegantFormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Reports To</InputLabel>
              <Select
                value={formData.parentRole}
                label="Reports To"
                onChange={handleChange("parentRole")}
              >
                <MenuItem value="">No Manager (Top Level)</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </ElegantFormControl>
            
            <ElegantFormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                label="Role"
                onChange={handleChange("role")}
              >
                {getAvailableChildRoles(formData.parentRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StyledChip 
                        label={role} 
                        size="small" 
                        color={getRoleChipColor(role)} 
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2">{role}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </ElegantFormControl>
            
            <FormDivider />
            
            <SectionTitle>
              Platform Access
            </SectionTitle>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 1, borderColor: alpha(theme.palette.divider, 0.7) }}>
              {formData.platforms.length > 0 ? (
                <Grid container spacing={1}>
                  {formData.platforms.map((platform, index) => (
                    <Grid item key={index}>
                      <StyledChip 
                        label={`${platform.platform}: ${platform.accountId}`} 
                        onDelete={() => removePlatform(index)}
                        color={platformColors[platform.platform]}
                        deleteIcon={<CloseIcon />}
                      />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                  <LinkIcon sx={{ color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary" variant="body2" align="center">
                    No platform accounts connected
                  </Typography>
                </Box>
              )}
            </Paper>
            
            <ElegantButton 
              variant="outlined" 
              startIcon={<AddIcon />} 
              onClick={openPlatformModal}
              fullWidth
              sx={{ mb: 3 }}
            >
              Connect Platform Account
            </ElegantButton>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <ElegantButton 
                variant="outlined" 
                onClick={handleClose} 
                sx={{ flex: 1 }}
                disabled={loading}
              >
                Cancel
              </ElegantButton>
              <ElegantButton 
                primary
                onClick={handleSave} 
                sx={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  editingIndex !== null ? "Update User" : "Save User"
                )}
              </ElegantButton>
            </Box>
          </ElegantModal>
        </Modal>

        {/* Platform Account Modal */}
        <Modal 
          open={platformAccountModal} 
          onClose={closePlatformModal}
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: alpha(theme.palette.background.paper, 0.2),
                backdropFilter: 'blur(2px)',
              }
            }
          }}
        >
          <ElegantModal sx={{ width: 400 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Connect Platform
              </Typography>
              <ElegantIconButton onClick={closePlatformModal} size="small">
                <CloseIcon fontSize="small" />
              </ElegantIconButton>
            </Box>
            
            <ElegantFormControl fullWidth sx={{ mb: 2 }} size="small">
              <InputLabel>Platform</InputLabel>
              <Select
                value={platformForm.platform}
                label="Platform"
                onChange={handlePlatformChange("platform")}
              >
                {platforms.map((platform) => (
                  <MenuItem key={platform} value={platform}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StyledChip 
                        label={platform.split(' ')[0]} 
                        size="small" 
                        color={platformColors[platform]} 
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2">{platform}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </ElegantFormControl>
            
            <ElegantTextField
              fullWidth
              label="Account ID"
              value={platformForm.accountId}
              onChange={handlePlatformChange("accountId")}
              sx={{ mb: 3 }}
              placeholder="Enter account or business ID"
              size="small"
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <ElegantButton variant="outlined" onClick={closePlatformModal} sx={{ flex: 1 }}>
                Cancel
              </ElegantButton>
              <ElegantButton 
                primary 
                onClick={addPlatform} 
                sx={{ flex: 1 }}
                disabled={!platformForm.platform || !platformForm.accountId}
              >
                Connect
              </ElegantButton>
            </Box>
          </ElegantModal>
        </Modal>
      </Container>
    </Layout>
  );
};

export default AdminPanelPage;