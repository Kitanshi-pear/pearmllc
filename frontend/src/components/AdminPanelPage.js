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
  Container,
  Divider,
  alpha,
  useTheme,
  TableContainer,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Badge,
  styled,
  Tabs,
  Tab,
  Stack,
  Switch,
  FormControlLabel,
  InputAdornment,
  TablePagination,
  Breadcrumbs,
  Link
} from "@mui/material";

// Icons
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
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SecurityIcon from "@mui/icons-material/Security";
import SortIcon from "@mui/icons-material/Sort";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FaceIcon from "@mui/icons-material/Face";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearIcon from "@mui/icons-material/Clear";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import ArchiveIcon from "@mui/icons-material/Archive";
import RestoreIcon from "@mui/icons-material/Restore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import Layout from "./Layout";

// Professional styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: "0 2px 12px 0 rgba(0,0,0,0.05)",
  overflow: "visible",
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 18px 0 rgba(0,0,0,0.07)",
  },
}));

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3, 0),
}));

const ActionButton = styled(Button)(({ theme, variant }) => ({
  textTransform: "none",
  borderRadius: 8,
  fontWeight: 500,
  boxShadow: "none",
  padding: theme.spacing(1, 2.5),
  ...(variant === "contained" && {
    "&:hover": {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.07)",
    },
  }),
}));

const UserAvatar = styled(Avatar)(({ theme, role }) => {
  const getColorByRole = (role) => {
    switch (role) {
      case "Admin": return theme.palette.error.main;
      case "Manager": return theme.palette.warning.main;
      case "TL": return theme.palette.success.main;
      case "STL": return theme.palette.info.main;
      case "Media Buyer": return theme.palette.primary.main;
      case "Accounts": return theme.palette.secondary.main;
      default: return theme.palette.grey[500];
    }
  };

  return {
    backgroundColor: alpha(getColorByRole(role), 0.12),
    color: getColorByRole(role),
    fontWeight: 600,
    width: 40,
    height: 40,
  };
});

const StatusBadge = styled(Badge)(({ theme, status }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: status === "active" ? theme.palette.success.main : theme.palette.error.main,
    color: status === "active" ? theme.palette.success.main : theme.palette.error.main,
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      content: '""',
    },
  },
}));

const TabPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3, 0),
}));

const TableWrapper = styled(StyledCard)(({ theme }) => ({
  overflow: "hidden",
}));

const SearchField = styled(TextField)(({ theme }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    backgroundColor: alpha(theme.palette.common.white, 0.09),
    transition: "all 0.2s",
    "&.Mui-focused": {
      backgroundColor: alpha(theme.palette.common.white, 0.15),
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
        borderWidth: 1,
      },
    },
    "&:hover": {
      backgroundColor: alpha(theme.palette.common.white, 0.12),
    },
  },
  "& .MuiInputBase-input": {
    padding: theme.spacing(1.5, 2),
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
  },
  "&.Mui-selected": {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
}));

const StyledTableHeadCell = styled(StyledTableCell)(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
  fontWeight: 600,
  color: theme.palette.text.primary,
  padding: theme.spacing(1.5, 2),
  position: "relative",
  "&:after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.05)}`,
  },
}));

const RoleChip = styled(Chip)(({ theme, role }) => {
  const getColorByRole = (role) => {
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

  return {
    borderRadius: 6,
    height: 26,
    fontWeight: 500,
    backgroundColor: role ? alpha(theme.palette[getColorByRole(role)].main, 0.08) : undefined,
    color: role ? theme.palette[getColorByRole(role)].main : undefined,
    border: role ? `1px solid ${alpha(theme.palette[getColorByRole(role)].main, 0.2)}` : undefined,
    "& .MuiChip-label": {
      padding: "0 8px",
    },
  };
});

const PlatformChip = styled(Chip)(({ theme, platform }) => {
  const getColorByPlatform = (platform) => {
    const platformMap = {
      "Facebook Ads": "primary",
      "Google Ads": "success",
      "TikTok Ads": "error",
      "Snapchat Ads": "warning",
      "Twitter Ads": "info",
      "LinkedIn Ads": "secondary"
    };
    return platformMap[platform] || "default";
  };

  return {
    borderRadius: 6,
    height: 26,
    fontWeight: 500,
    backgroundColor: platform ? alpha(theme.palette[getColorByPlatform(platform)].main, 0.08) : undefined,
    color: platform ? theme.palette[getColorByPlatform(platform)].main : undefined,
    border: platform ? `1px solid ${alpha(theme.palette[getColorByPlatform(platform)].main, 0.2)}` : undefined,
    "& .MuiChip-label": {
      padding: "0 8px",
    },
    "& .MuiChip-deleteIcon": {
      color: alpha(theme.palette[getColorByPlatform(platform)].main, 0.7),
      margin: "0 2px 0 -6px",
      "&:hover": {
        color: theme.palette[getColorByPlatform(platform)].main,
      },
    },
  };
});

const FormSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const FormTitle = styled(Typography)(({ theme }) => ({
  fontSize: 15,
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  "& svg": {
    marginRight: theme.spacing(1),
    fontSize: 20,
    color: theme.palette.text.secondary,
  },
}));

const FormCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(3),
  boxShadow: "0 2px 12px 0 rgba(0,0,0,0.05)",
  marginBottom: theme.spacing(3),
}));

const ModalForm = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
  padding: theme.spacing(4),
  width: 600,
  maxWidth: "calc(100% - 32px)",
  maxHeight: "calc(100% - 64px)",
  overflow: "auto",
  outline: "none",
}));

const UserCardGrid = styled(Grid)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const UserCardContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
}));

const UserCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2),
}));

const UserCardDetails = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
}));

const UserCardActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  marginTop: theme.spacing(2),
  padding: theme.spacing(2, 0, 0),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
}));

const FilterBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: theme.palette.primary.main,
    color: "white",
    fontSize: 10,
    height: 16,
    minWidth: 16,
  },
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

// Default user data
const defaultUser = {
  name: "",
  email: "",
  phone: "",
  role: "",
  parentRole: "",
  platforms: [],
  status: "active"
};

const AdminPanelPage = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(defaultUser);
  const [platformModal, setPlatformModal] = useState(false);
  const [platformForm, setPlatformForm] = useState({ platform: "", accountId: "" });
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState("table"); // table or grid
  const [filters, setFilters] = useState({
    role: "",
    status: "all",
    platform: ""
  });

  // Generate some mock data for initial display
  useEffect(() => {
    const mockUsers = [
      {
        name: "Alex Johnson",
        email: "alex.johnson@company.com",
        phone: "+1 (555) 123-4567",
        role: "Admin",
        parentRole: "",
        platforms: [
          { platform: "Facebook Ads", accountId: "FB7890123" },
          { platform: "Google Ads", accountId: "GA4567890" }
        ],
        status: "active"
      },
      {
        name: "Sarah Williams",
        email: "sarah.w@company.com",
        phone: "+1 (555) 234-5678",
        role: "Manager",
        parentRole: "Admin",
        platforms: [
          { platform: "Facebook Ads", accountId: "FB1234567" }
        ],
        status: "active"
      },
      {
        name: "Michael Chen",
        email: "michael.c@company.com",
        phone: "+1 (555) 345-6789",
        role: "TL",
        parentRole: "Manager",
        platforms: [
          { platform: "TikTok Ads", accountId: "TT9876543" },
          { platform: "Snapchat Ads", accountId: "SC6543210" }
        ],
        status: "active"
      },
      {
        name: "Emily Rodriguez",
        email: "emily.r@company.com",
        phone: "+1 (555) 456-7890",
        role: "STL",
        parentRole: "TL",
        platforms: [
          { platform: "Google Ads", accountId: "GA7654321" }
        ],
        status: "inactive"
      },
      {
        name: "David Kim",
        email: "david.k@company.com",
        phone: "+1 (555) 567-8901",
        role: "Media Buyer",
        parentRole: "STL",
        platforms: [
          { platform: "LinkedIn Ads", accountId: "LI2345678" },
          { platform: "Twitter Ads", accountId: "TW8765432" }
        ],
        status: "active"
      }
    ];
    setUsers(mockUsers);
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Handle form open for add/edit
  const handleOpenForm = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setFormData(users[index]);
    } else {
      setFormData(defaultUser);
    }
    setOpen(true);
  };

  // Handle form close
  const handleCloseForm = () => {
    setFormData(defaultUser);
    setEditingIndex(null);
    setOpen(false);
  };

  // Handle form field changes
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

  // Handle form submission
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
      handleCloseForm();
    }, 600);
  };

  // Handle user deletion
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

  // Handle bulk deletion of selected users
  const handleBulkDelete = () => {
    setLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      const updatedUsers = users.filter((_, index) => !selectedUsers.includes(index));
      setUsers(updatedUsers);
      setSelectedUsers([]);
      setLoading(false);
    }, 600);
  };

  // Handle bulk status change
  const handleBulkStatusChange = (status) => {
    setLoading(true);
    // Simulate API call with timeout
    setTimeout(() => {
      const updatedUsers = [...users];
      selectedUsers.forEach(index => {
        updatedUsers[index] = { ...updatedUsers[index], status };
      });
      setUsers(updatedUsers);
      setSelectedUsers([]);
      setLoading(false);
    }, 600);
  };

  // Handle user status toggle
  const handleStatusToggle = (index) => {
    const updatedUsers = [...users];
    updatedUsers[index] = { 
      ...updatedUsers[index], 
      status: updatedUsers[index].status === "active" ? "inactive" : "active" 
    };
    setUsers(updatedUsers);
  };

  // Handle selection of a user row
  const handleSelectUser = (event, index) => {
    const selectedIndex = selectedUsers.indexOf(index);
    let newSelected = [];
    
    if (selectedIndex === -1) {
      newSelected = [...selectedUsers, index];
    } else {
      newSelected = selectedUsers.filter(i => i !== index);
    }
    
    setSelectedUsers(newSelected);
  };

  // Handle select all click
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredUsers.map((_, index) => index);
      setSelectedUsers(newSelected);
      return;
    }
    setSelectedUsers([]);
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
    setPlatformModal(true);
  };

  const closePlatformModal = () => {
    setPlatformModal(false);
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

  // Filter users based on search and filter criteria
  const filteredUsers = users.filter(user => {
    // Search by name, email, or phone
    const matchesSearch = searchQuery === "" ||
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);
    
    // Filter by role
    const matchesRole = filters.role === "" || user.role === filters.role;
    
    // Filter by status
    const matchesStatus = filters.status === "all" || user.status === filters.status;
    
    // Filter by platform
    const matchesPlatform = filters.platform === "" || 
      user.platforms.some(p => p.platform === filters.platform);
    
    return matchesSearch && matchesRole && matchesStatus && matchesPlatform;
  });

  // Get the current page of users
  const paginatedUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => value !== "" && value !== "all").length;

  // Check if a user is selected
  const isSelected = (index) => selectedUsers.includes(index);

  return (
    <Layout>
      <Container maxWidth="xl">
        <PageHeader>
          <Box mb={2}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
              <Link color="inherit" href="#" underline="hover">
                Dashboard
              </Link>
              <Link color="inherit" href="#" underline="hover">
                User Management
              </Link>
              <Typography color="text.primary">Team Members</Typography>
            </Breadcrumbs>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight={600} gutterBottom>
                User Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your team members, their roles, and platform access
              </Typography>
            </Box>
            <Box>
              <ActionButton
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => handleOpenForm()}
              >
                Add User
              </ActionButton>
            </Box>
          </Box>
        </PageHeader>

        <StyledCard sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" gap={2} alignItems="center">
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab label="All Users" />
                  <Tab label="Active" />
                  <Tab label="Inactive" />
                </Tabs>
              </Box>
              <Box display="flex" gap={2} alignItems="center">
                <SearchField
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <IconButton 
                          size="small" 
                          onClick={() => setSearchQuery("")}
                          edge="end"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                  size="small"
                />
                <Tooltip title="Filter Users">
                  <FilterBadge badgeContent={activeFilterCount} color="primary">
                    <ActionButton
                      variant="outlined"
                      startIcon={<FilterAltIcon />}
                      onClick={() => {}} // Would open a filter panel
                    >
                      Filters
                    </ActionButton>
                  </FilterBadge>
                </Tooltip>
              </Box>
            </Box>

            {/* View Mode Tabs */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Stack direction="row" spacing={1}>
                {selectedUsers.length > 0 && (
                  <>
                    <ActionButton
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleBulkDelete}
                    >
                      Delete Selected
                    </ActionButton>
                    <ActionButton
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<DoDisturbIcon />}
                      onClick={() => handleBulkStatusChange("inactive")}
                    >
                      Deactivate
                    </ActionButton>
                    <ActionButton
                      variant="outlined"
                      color="success"
                      size="small"
                      startIcon={<CheckCircleIcon />}
                      onClick={() => handleBulkStatusChange("active")}
                    >
                      Activate
                    </ActionButton>
                  </>
                )}
              </Stack>
              <FormControlLabel
                control={
                  <Switch
                    checked={viewMode === "grid"}
                    onChange={(e) => setViewMode(e.target.checked ? "grid" : "table")}
                    size="small"
                  />
                }
                label={viewMode === "grid" ? "Card View" : "Table View"}
              />
            </Box>

            {/* Tab Panels */}
            <TabPanel hidden={tabValue !== 0}>
              {viewMode === "table" ? (
                /* Table View */
                <TableWrapper>
                  <TableContainer sx={{ maxHeight: 650 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <StyledTableHeadCell padding="checkbox">
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                                  onChange={handleSelectAllClick}
                                  disabled={filteredUsers.length === 0}
                                />
                              }
                              label=""
                            />
                          </StyledTableHeadCell>
                          <StyledTableHeadCell>User</StyledTableHeadCell>
                          <StyledTableHeadCell>Role & Reports To</StyledTableHeadCell>
                          <StyledTableHeadCell>Platform Access</StyledTableHeadCell>
                          <StyledTableHeadCell>Status</StyledTableHeadCell>
                          <StyledTableHeadCell align="right">Actions</StyledTableHeadCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedUsers.map((user, index) => {
                          const actualIndex = users.indexOf(user);
                          const isItemSelected = isSelected(actualIndex);
                          
                          return (
                            <StyledTableRow 
                              key={index}
                              hover
                              onClick={(event) => handleSelectUser(event, actualIndex)}
                              selected={isItemSelected}
                            >
                              <StyledTableCell padding="checkbox">
                                <Switch
                                  size="small"
                                  checked={isItemSelected}
                                  onChange={(event) => handleSelectUser(event, actualIndex)}
                                />
                              </StyledTableCell>
                              <StyledTableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <StatusBadge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    variant="dot"
                                    status={user.status}
                                  >
                                    <UserAvatar role={user.role}>
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </UserAvatar>
                                  </StatusBadge>
                                  <Box sx={{ ml: 2 }}>
                                    <Typography variant="subtitle2" fontWeight={600}>
                                      {user.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                        <EmailIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                        {user.email}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PhoneIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                        {user.phone}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </StyledTableCell>
                              <StyledTableCell>
                                <Box>
                                  <RoleChip 
                                    role={user.role}
                                    label={user.role} 
                                    size="small"
                                    sx={{ mb: 1 }}
                                  />
                                  {user.parentRole && (
                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                                      <SupervisorAccountIcon fontSize="inherit" sx={{ mr: 0.5 }} />
                                      Reports to: {user.parentRole}
                                    </Typography>
                                  )}
                                </Box>
                              </StyledTableCell>
                              <StyledTableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {user.platforms.map((platform, idx) => (
                                    <PlatformChip 
                                      key={idx} 
                                      platform={platform.platform}
                                      label={`${platform.platform.split(' ')[0]}: ${platform.accountId}`} 
                                      size="small"
                                    />
                                  ))}
                                  {user.platforms.length === 0 && (
                                    <Typography variant="caption" color="text.secondary">
                                      No platforms connected
                                    </Typography>
                                  )}
                                </Box>
                              </StyledTableCell>
                              <StyledTableCell>
                                <Chip
                                  label={user.status === "active" ? "Active" : "Inactive"}
                                  size="small"
                                  color={user.status === "active" ? "success" : "error"}
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              </StyledTableCell>
                              <StyledTableCell align="right">
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Tooltip title="Edit User">
                                    <IconButton 
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenForm(actualIndex);
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title={user.status === "active" ? "Deactivate" : "Activate"}>
                                    <IconButton 
                                      size="small"
                                      color={user.status === "active" ? "error" : "success"} 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusToggle(actualIndex);
                                      }}
                                    >
                                      {user.status === "active" ? (
                                        <DoDisturbIcon fontSize="small" />
                                      ) : (
                                        <CheckCircleIcon fontSize="small" />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete User">
                                    <IconButton 
                                      size="small"
                                      color="error"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(actualIndex);
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              </StyledTableCell>
                            </StyledTableRow>
                          );
                        })}
                        {paginatedUsers.length === 0 && (
                          <TableRow>
                            <StyledTableCell colSpan={6} align="center" sx={{ py: 6 }}>
                              <Box sx={{ textAlign: 'center' }}>
                                <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
                                <Typography variant="h6" gutterBottom>No users found</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                  {searchQuery || activeFilterCount > 0 ? 
                                    "Try adjusting your search or filters" : 
                                    "Get started by adding your first team member"}
                                </Typography>
                                {!searchQuery && activeFilterCount === 0 && (
                                  <ActionButton
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={() => handleOpenForm()}
                                  >
                                    Add User
                                  </ActionButton>
                                )}
                              </Box>
                            </StyledTableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filteredUsers.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </TableWrapper>
              ) : (
                /* Grid/Card View */
                <UserCardGrid container spacing={3}>
                  {paginatedUsers.map((user, index) => {
                    const actualIndex = users.indexOf(user);
                    const isItemSelected = isSelected(actualIndex);
                    
                    return (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                        <StyledCard 
                          sx={{
                            height: '100%',
                            outline: isItemSelected ? `2px solid ${theme.palette.primary.main}` : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <CardContent sx={{ p: 0, height: '100%' }}>
                            <UserCardContent>
                              <Box 
                                sx={{ 
                                  p: 2,
                                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <FormControlLabel
                                  control={
                                    <Switch
                                      size="small"
                                      checked={isItemSelected}
                                      onChange={(event) => handleSelectUser(event, actualIndex)}
                                    />
                                  }
                                  label=""
                                />
                                <RoleChip 
                                  role={user.role}
                                  label={user.role} 
                                  size="small"
                                />
                              </Box>
                              
                              <Box sx={{ p: 2, pt: 3 }}>
                                <UserCardHeader>
                                  <StatusBadge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    variant="dot"
                                    status={user.status}
                                  >
                                    <UserAvatar role={user.role} sx={{ width: 50, height: 50 }}>
                                      {user.name.split(' ').map(n => n[0]).join('')}
                                    </UserAvatar>
                                  </StatusBadge>
                                  <Box sx={{ ml: 2 }}>
                                    <Typography variant="h6" fontWeight={600}>
                                      {user.name}
                                    </Typography>
                                    <Chip
                                      label={user.status === "active" ? "Active" : "Inactive"}
                                      size="small"
                                      color={user.status === "active" ? "success" : "error"}
                                      variant="outlined"
                                      sx={{ fontWeight: 500, mt: 0.5 }}
                                    />
                                  </Box>
                                </UserCardHeader>
                                
                                <UserCardDetails>
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                      <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                                      {user.email}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                      <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                                      {user.phone}
                                    </Typography>
                                  </Box>
                                  
                                  {user.parentRole && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                                        <SupervisorAccountIcon fontSize="small" sx={{ mr: 1 }} />
                                        Reports to: {user.parentRole}
                                      </Typography>
                                    </Box>
                                  )}
                                  
                                  <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>
                                      Connected Platforms:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                      {user.platforms.map((platform, idx) => (
                                        <PlatformChip 
                                          key={idx} 
                                          platform={platform.platform}
                                          label={`${platform.platform.split(' ')[0]}: ${platform.accountId}`} 
                                          size="small"
                                        />
                                      ))}
                                      {user.platforms.length === 0 && (
                                        <Typography variant="caption" color="text.secondary">
                                          No platforms connected
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                </UserCardDetails>
                                
                                <UserCardActions>
                                  <Stack direction="row" spacing={1}>
                                    <Tooltip title="Edit User">
                                      <IconButton 
                                        size="small" 
                                        onClick={() => handleOpenForm(actualIndex)}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title={user.status === "active" ? "Deactivate" : "Activate"}>
                                      <IconButton 
                                        size="small"
                                        color={user.status === "active" ? "error" : "success"} 
                                        onClick={() => handleStatusToggle(actualIndex)}
                                      >
                                        {user.status === "active" ? (
                                          <DoDisturbIcon fontSize="small" />
                                        ) : (
                                          <CheckCircleIcon fontSize="small" />
                                        )}
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Delete User">
                                      <IconButton 
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(actualIndex)}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </UserCardActions>
                              </Box>
                            </UserCardContent>
                          </CardContent>
                        </StyledCard>
                      </Grid>
                    );
                  })}
                  
                  {paginatedUsers.length === 0 && (
                    <Grid item xs={12}>
                      <StyledCard sx={{ py: 6 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 2 }} />
                          <Typography variant="h6" gutterBottom>No users found</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {searchQuery || activeFilterCount > 0 ? 
                              "Try adjusting your search or filters" : 
                              "Get started by adding your first team member"}
                          </Typography>
                          {!searchQuery && activeFilterCount === 0 && (
                            <ActionButton
                              variant="contained"
                              color="primary"
                              startIcon={<AddIcon />}
                              onClick={() => handleOpenForm()}
                            >
                              Add User
                            </ActionButton>
                          )}
                        </Box>
                      </StyledCard>
                    </Grid>
                  )}
                </UserCardGrid>
              )}
              
              {viewMode === "grid" && paginatedUsers.length > 0 && (
                <TablePagination
                  component="div"
                  count={filteredUsers.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[8, 12, 24, 36]}
                />
              )}
            </TabPanel>
            
            <TabPanel hidden={tabValue !== 1}>
              {/* Active Users Tab - Similar content with filtered users */}
            </TabPanel>
            
            <TabPanel hidden={tabValue !== 2}>
              {/* Inactive Users Tab - Similar content with filtered users */}
            </TabPanel>
          </CardContent>
        </StyledCard>

        {/* User Form Modal */}
        <Modal 
          open={open} 
          onClose={handleCloseForm}
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: alpha(theme.palette.background.paper, 0.3),
                backdropFilter: 'blur(4px)',
              }
            }
          }}
        >
          <ModalForm>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={600}>
                {editingIndex !== null ? "Edit User" : "Add New User"}
              </Typography>
              <IconButton onClick={handleCloseForm}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormCard>
                  <FormTitle>
                    <FaceIcon /> Personal Information
                  </FormTitle>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={handleChange("name")}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={formData.email}
                        onChange={handleChange("email")}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={formData.phone}
                        onChange={handleChange("phone")}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.status === "active"}
                            onChange={(e) => setFormData({
                              ...formData,
                              status: e.target.checked ? "active" : "inactive"
                            })}
                          />
                        }
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {formData.status === "active" ? (
                              <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                            ) : (
                              <DoDisturbIcon color="error" sx={{ mr: 1 }} />
                            )}
                            <Typography>
                              {formData.status === "active" ? "Active Account" : "Inactive Account"}
                            </Typography>
                          </Box>
                        }
                      />
                    </Grid>
                  </Grid>
                </FormCard>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormCard>
                  <FormTitle>
                    <WorkIcon /> Role & Permissions
                  </FormTitle>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Reports To</InputLabel>
                        <Select
                          value={formData.parentRole}
                          label="Reports To"
                          onChange={handleChange("parentRole")}
                        >
                          <MenuItem value="">
                            <em>No Manager (Top Level)</em>
                          </MenuItem>
                          {roles.map((role) => (
                            <MenuItem key={role} value={role}>{role}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Role</InputLabel>
                        <Select
                          value={formData.role}
                          label="Role"
                          onChange={handleChange("role")}
                        >
                          {getAvailableChildRoles(formData.parentRole).map((role) => (
                            <MenuItem key={role} value={role}>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <RoleChip 
                                  role={role} 
                                  label={role} 
                                  size="small" 
                                  sx={{ mr: 1 }}
                                />
                                <Typography variant="body2">{role}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </FormCard>
                
                <FormCard>
                  <FormTitle>
                    <LinkIcon /> Platform Access
                  </FormTitle>
                  
                  <Box sx={{ mb: 2 }}>
                    {formData.platforms.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {formData.platforms.map((platform, index) => (
                          <PlatformChip 
                            key={index} 
                            platform={platform.platform}
                            label={`${platform.platform}: ${platform.accountId}`} 
                            onDelete={() => removePlatform(index)}
                            deleteIcon={<CloseIcon />}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2 }}>
                        <LinkIcon sx={{ color: 'text.secondary', mb: 1 }} />
                        <Typography color="text.secondary" variant="body2" align="center">
                          No platform accounts connected
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <ActionButton 
                    variant="outlined" 
                    startIcon={<AddIcon />} 
                    onClick={openPlatformModal}
                    fullWidth
                  >
                    Connect Platform Account
                  </ActionButton>
                </FormCard>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <ActionButton 
                variant="outlined" 
                color="inherit"
                onClick={handleCloseForm} 
                disabled={loading}
              >
                Cancel
              </ActionButton>
              <ActionButton 
                variant="contained"
                color="primary"
                onClick={handleSave} 
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  editingIndex !== null ? "Update User" : "Save User"
                )}
              </ActionButton>
            </Box>
          </ModalForm>
        </Modal>

        {/* Platform Account Modal */}
        <Modal 
          open={platformModal} 
          onClose={closePlatformModal}
          slotProps={{
            backdrop: {
              sx: {
                backgroundColor: alpha(theme.palette.background.paper, 0.3),
                backdropFilter: 'blur(4px)',
              }
            }
          }}
        >
          <ModalForm sx={{ width: 450 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight={600}>
                Connect Platform
              </Typography>
              <IconButton onClick={closePlatformModal}>
                <CloseIcon />
              </IconButton>
            </Box>
            
            <FormCard>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect this user to advertising platform accounts they'll manage.
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Platform</InputLabel>
                    <Select
                      value={platformForm.platform}
                      label="Platform"
                      onChange={handlePlatformChange("platform")}
                    >
                      {platforms.map((platform) => (
                        <MenuItem key={platform} value={platform}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PlatformChip 
                              platform={platform}
                              label={platform.split(' ')[0]} 
                              size="small" 
                              sx={{ mr: 1 }}
                            />
                            <Typography variant="body2">{platform}</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Account ID"
                    value={platformForm.accountId}
                    onChange={handlePlatformChange("accountId")}
                    variant="outlined"
                    placeholder="Enter account or business ID"
                    helperText="Unique identifier for this platform account"
                  />
                </Grid>
              </Grid>
            </FormCard>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
              <ActionButton variant="outlined" color="inherit" onClick={closePlatformModal}>
                Cancel
              </ActionButton>
              <ActionButton 
                variant="contained"
                color="primary" 
                onClick={addPlatform} 
                disabled={!platformForm.platform || !platformForm.accountId}
              >
                Connect Account
              </ActionButton>
            </Box>
          </ModalForm>
        </Modal>
      </Container>
    </Layout>
  );
};

export default AdminPanelPage;