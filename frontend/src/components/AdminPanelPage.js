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
  Link,
  Menu,
  ListItemIcon,
  ListItemText,
  ListItem,
  List,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  AppBar,
  Toolbar,
  Collapse,
  Menu as MenuComponent
} from "@mui/material";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import WorkIcon from "@mui/icons-material/Work";
import BusinessIcon from "@mui/icons-material/Business";
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
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FaceIcon from "@mui/icons-material/Face";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearIcon from "@mui/icons-material/Clear";
import DoDisturbIcon from "@mui/icons-material/DoDisturb";
import ArchiveIcon from "@mui/icons-material/Archive";
import RestoreIcon from "@mui/icons-material/Restore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import EventIcon from "@mui/icons-material/Event";
import NoteIcon from "@mui/icons-material/Note";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import ChatIcon from "@mui/icons-material/Chat";
import PhoneCallbackIcon from "@mui/icons-material/PhoneCallback";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import LanguageIcon from "@mui/icons-material/Language";
import DescriptionIcon from "@mui/icons-material/Description";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CallIcon from "@mui/icons-material/Call";
import FolderIcon from "@mui/icons-material/Folder";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import MenuIcon from "@mui/icons-material/Menu";
import AssessmentIcon from "@mui/icons-material/Assessment";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

// For data visualization
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';

import Layout from "./Layout";

// Styled components for CRM styling
const CRMCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: "0 2px 10px 0 rgba(0,0,0,0.05)",
  overflow: "visible",
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 18px 0 rgba(0,0,0,0.07)",
  },
}));

const StatsCard = styled(CRMCard)(({ theme, color }) => ({
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    width: 6,
    height: "100%",
    backgroundColor: theme.palette[color || "primary"].main,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  }
}));

const DashboardMetricCard = styled(CRMCard)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
}));

const MetricCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
}));

const MetricCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: theme.spacing(2),
}));

const CustomerAvatar = styled(Avatar)(({ theme, status }) => {
  const getColorByStatus = (status) => {
    switch (status) {
      case "new": return theme.palette.info.main;
      case "active": return theme.palette.success.main;
      case "inactive": return theme.palette.warning.main;
      case "churned": return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  return {
    backgroundColor: alpha(getColorByStatus(status), 0.12),
    color: getColorByStatus(status),
    fontWeight: 600,
    width: 40,
    height: 40,
  };
});

const StatusBadge = styled(Badge)(({ theme, status }) => {
  const getColorByStatus = (status) => {
    switch (status) {
      case "new": return theme.palette.info.main;
      case "active": return theme.palette.success.main;
      case "inactive": return theme.palette.warning.main;
      case "churned": return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  return {
    "& .MuiBadge-badge": {
      backgroundColor: getColorByStatus(status),
      color: getColorByStatus(status),
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
  };
});

// Helper function to get stage details
const getStageDetails = (stage) => {
  switch (stage) {
    case "Lead":
      return { color: "info", icon: <PersonAddIcon fontSize="small" /> };
    case "Qualified":
      return { color: "success", icon: <CheckCircleIcon fontSize="small" /> };
    case "Proposal":
      return { color: "warning", icon: <DescriptionIcon fontSize="small" /> };
    case "Negotiation":
      return { color: "secondary", icon: <AttachMoneyIcon fontSize="small" /> };
    case "Closed":
      return { color: "primary", icon: <ShoppingCartIcon fontSize="small" /> };
    case "Churned":
      return { color: "error", icon: <DoDisturbIcon fontSize="small" /> };
    default:
      return { color: "default", icon: <InfoOutlinedIcon fontSize="small" /> };
  }
};

const CustomerStageChip = styled(Chip)(({ theme, stage }) => {
  const { color, icon } = getStageDetails(stage);

  return {
    borderRadius: 6,
    height: 26,
    fontWeight: 500,
    backgroundColor: alpha(theme.palette[color].main, 0.08),
    color: theme.palette[color].main,
    border: `1px solid ${alpha(theme.palette[color].main, 0.2)}`,
    "& .MuiChip-label": {
      padding: "0 8px",
    },
    "& .MuiChip-icon": {
      color: theme.palette[color].main,
    },
  };
});

const TagChip = styled(Chip)(({ theme, color }) => ({
  borderRadius: 4,
  height: 24,
  fontSize: "0.75rem",
  backgroundColor: color ? alpha(theme.palette[color].main, 0.08) : alpha(theme.palette.primary.main, 0.08),
  color: color ? theme.palette[color].main : theme.palette.primary.main,
  border: color ? `1px solid ${alpha(theme.palette[color].main, 0.2)}` : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  "& .MuiChip-label": {
    padding: "0 6px",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:hover": {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    cursor: "pointer",
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

const QuickActionButton = styled(Button)(({ theme, color }) => ({
  textTransform: "none",
  borderRadius: 8,
  fontWeight: 500,
  padding: theme.spacing(0.75, 1.5),
  backgroundColor: color ? alpha(theme.palette[color].main, 0.08) : alpha(theme.palette.primary.main, 0.08),
  color: color ? theme.palette[color].main : theme.palette.primary.main,
  border: color ? `1px solid ${alpha(theme.palette[color].main, 0.2)}` : `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  "&:hover": {
    backgroundColor: color ? alpha(theme.palette[color].main, 0.12) : alpha(theme.palette.primary.main, 0.12),
  },
}));

const TimelineCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: 8,
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  transition: "all 0.2s ease",
  "&:hover": {
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  },
}));

const TimelineIcon = styled(Box)(({ theme, color }) => ({
  width: 36,
  height: 36,
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: color ? alpha(theme.palette[color].main, 0.12) : alpha(theme.palette.primary.main, 0.12),
  color: color ? theme.palette[color].main : theme.palette.primary.main,
  marginRight: theme.spacing(2),
}));

const StageProgressBar = styled(LinearProgress)(({ theme }) => ({
  height: 6,
  borderRadius: 3,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  "& .MuiLinearProgress-bar": {
    borderRadius: 3,
  },
}));

const DetailSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const DetailHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2),
}));

const DetailTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  display: "flex",
  alignItems: "center",
  "& svg": {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}));

const DetailCard = styled(Card)(({ theme }) => ({
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  marginBottom: theme.spacing(3),
}));

const DetailCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

const DetailCardContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const SidebarSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const SidebarSectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1.5),
  display: "flex",
  alignItems: "center",
  "& svg": {
    marginRight: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
}));

const ContactInfoItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(1.5),
  "& svg": {
    marginRight: theme.spacing(1.5),
    color: theme.palette.text.secondary,
  },
}));

const CustomerDetail = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginBottom: theme.spacing(1),
}));

const CustomerDetailLabel = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(0.5),
}));

const CustomerDetailValue = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
}));

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  padding: theme.spacing(3, 0),
}));

const AppBarStyled = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  zIndex: theme.zIndex.drawer + 1,
}));

const DrawerStyled = styled(Drawer)(({ theme }) => ({
  width: 280,
  flexShrink: 0,
  '& .MuiDrawer-paper': {
    width: 280,
    boxSizing: 'border-box',
    borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
    backgroundColor: theme.palette.background.paper,
  },
}));

const DrawerHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const SidebarLink = styled(ListItem)(({ theme, active }) => ({
  borderRadius: 8,
  marginBottom: theme.spacing(0.5),
  padding: theme.spacing(1, 2),
  ...(active && {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    color: theme.palette.primary.main,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  }),
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
  },
}));

// Customer lifecycle stage visualization data
const stageData = [
  { name: 'Lead', value: 35 },
  { name: 'Qualified', value: 25 },
  { name: 'Proposal', value: 15 },
  { name: 'Negotiation', value: 10 },
  { name: 'Closed', value: 15 },
];

// Color palette for charts
const stageColors = [
  '#3498db', // blue
  '#2ecc71', // green
  '#f39c12', // orange
  '#9b59b6', // purple
  '#1abc9c', // teal
];

// Sample revenue data for charts
const revenueData = [
  { month: 'Jan', revenue: 4000, target: 3800 },
  { month: 'Feb', revenue: 3500, target: 3800 },
  { month: 'Mar', revenue: 4200, target: 4000 },
  { month: 'Apr', revenue: 5000, target: 4200 },
  { month: 'May', revenue: 4800, target: 4500 },
  { month: 'Jun', revenue: 5200, target: 4800 },
];

// Sample customer data
const customerData = [
  {
    id: 1,
    name: "Acme Corporation",
    contactName: "John Smith",
    email: "john.smith@acme.com",
    phone: "+1 (555) 123-4567",
    industry: "Technology",
    stage: "Qualified",
    tags: ["Enterprise", "High Value"],
    status: "active",
    lastContact: "2023-05-01",
    value: 75000,
    city: "New York",
    state: "NY",
    assignedTo: "Alex Johnson",
    nextAction: "Follow-up call",
    nextActionDate: "2023-05-10"
  },
  {
    id: 2,
    name: "Global Innovations",
    contactName: "Sarah Williams",
    email: "sarah.w@globalinnovations.com",
    phone: "+1 (555) 234-5678",
    industry: "Healthcare",
    stage: "Proposal",
    tags: ["Mid-Market", "Growth"],
    status: "active",
    lastContact: "2023-04-28",
    value: 45000,
    city: "Boston",
    state: "MA",
    assignedTo: "Michael Chen",
    nextAction: "Send proposal",
    nextActionDate: "2023-05-05"
  },
  {
    id: 3,
    name: "Summit Solutions",
    contactName: "David Rodriguez",
    email: "david.r@summit.com",
    phone: "+1 (555) 345-6789",
    industry: "Finance",
    stage: "Lead",
    tags: ["Small Business"],
    status: "new",
    lastContact: "2023-05-02",
    value: 15000,
    city: "Chicago",
    state: "IL",
    assignedTo: "Emily Kim",
    nextAction: "Introductory call",
    nextActionDate: "2023-05-08"
  },
  {
    id: 4,
    name: "Pinnacle Partners",
    contactName: "Jennifer Lee",
    email: "jennifer@pinnacle.com",
    phone: "+1 (555) 456-7890",
    industry: "Retail",
    stage: "Negotiation",
    tags: ["Enterprise", "International"],
    status: "active",
    lastContact: "2023-04-25",
    value: 120000,
    city: "Los Angeles",
    state: "CA",
    assignedTo: "Robert Wilson",
    nextAction: "Contract review",
    nextActionDate: "2023-05-04"
  },
  {
    id: 5,
    name: "Elite Enterprises",
    contactName: "Michael Brown",
    email: "michael.b@elite.com",
    phone: "+1 (555) 567-8901",
    industry: "Manufacturing",
    stage: "Closed",
    tags: ["Mid-Market"],
    status: "active",
    lastContact: "2023-04-15",
    value: 85000,
    city: "Dallas",
    state: "TX",
    assignedTo: "Alex Johnson",
    nextAction: "Implementation kickoff",
    nextActionDate: "2023-05-12"
  }
];

// Sample activity timeline data
const activityTimelineData = [
  {
    id: 1,
    type: "call",
    title: "Phone call with John Smith",
    description: "Discussed implementation timeline and requirements",
    date: "2023-05-02T14:30:00",
    customer: "Acme Corporation",
    user: "Alex Johnson",
    icon: <CallIcon />,
    color: "primary"
  },
  {
    id: 2,
    type: "email",
    title: "Sent follow-up email",
    description: "Shared additional case studies and pricing options",
    date: "2023-05-01T11:15:00",
    customer: "Global Innovations",
    user: "Michael Chen",
    icon: <EmailIcon />,
    color: "info"
  },
  {
    id: 3,
    type: "meeting",
    title: "Demo presentation",
    description: "Product demonstration with technical team",
    date: "2023-04-28T10:00:00",
    customer: "Pinnacle Partners",
    user: "Robert Wilson",
    icon: <EventIcon />,
    color: "success"
  },
  {
    id: 4,
    type: "note",
    title: "Added notes from discovery call",
    description: "Customer is interested in enterprise plan with custom integration",
    date: "2023-04-27T15:45:00",
    customer: "Summit Solutions",
    user: "Emily Kim",
    icon: <NoteIcon />,
    color: "warning"
  },
  {
    id: 5,
    type: "task",
    title: "Prepare implementation plan",
    description: "Create detailed timeline for onboarding process",
    date: "2023-04-26T09:30:00",
    customer: "Elite Enterprises",
    user: "Alex Johnson",
    icon: <AssignmentIcon />,
    color: "secondary"
  }
];

// Main CRM Page Component
const AdminPanelPage = () => {
  const theme = useTheme();
  const [customers, setCustomers] = useState(customerData);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState(null);
  const [addActivityOpen, setAddActivityOpen] = useState(false);
  const [activityType, setActivityType] = useState("call");
  const [activityFormData, setActivityFormData] = useState({
    title: "",
    description: "",
    date: new Date().toISOString().slice(0, 16),
    customer: "",
  });

  // Handle drawer toggle
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
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

  // Handle customer row click
  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setCustomerDetailOpen(true);
  };

  // Close customer detail panel
  const handleCloseCustomerDetail = () => {
    setCustomerDetailOpen(false);
  };

  // Handle menu open
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Open activity form dialog
  const handleOpenActivityForm = () => {
    setAddActivityOpen(true);
    handleMenuClose();
  };

  // Close activity form dialog
  const handleCloseActivityForm = () => {
    setAddActivityOpen(false);
    setActivityFormData({
      title: "",
      description: "",
      date: new Date().toISOString().slice(0, 16),
      customer: selectedCustomer ? selectedCustomer.id : "",
    });
  };

  // Handle activity type change
  const handleActivityTypeChange = (event) => {
    setActivityType(event.target.value);
  };

  // Handle activity form field changes
  const handleActivityFormChange = (field) => (event) => {
    setActivityFormData({
      ...activityFormData,
      [field]: event.target.value,
    });
  };

  // Handle activity form submission
  const handleActivitySubmit = () => {
    // Add new activity logic would go here
    // For now, just close the form
    handleCloseActivityForm();
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginated customers
  const paginatedCustomers = filteredCustomers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBarStyled position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            CRM Dashboard
          </Typography>
          <SearchField
            placeholder="Search customers, deals, contacts..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ width: 300, mr: 2 }}
          />
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <IconButton color="inherit">
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBarStyled>

      {/* Sidebar */}
      <DrawerStyled
        variant="persistent"
        anchor="left"
        open={drawerOpen}
      >
        <DrawerHeader>
          <Typography variant="h6" fontWeight={600}>
            Sales CRM
          </Typography>
        </DrawerHeader>
        <List sx={{ p: 2 }}>
          <SidebarLink button active={true}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </SidebarLink>
          <SidebarLink button>
            <ListItemIcon>
              <PeopleOutlineIcon />
            </ListItemIcon>
            <ListItemText primary="Customers" />
          </SidebarLink>
          <SidebarLink button>
            <ListItemIcon>
              <ShoppingCartIcon />
            </ListItemIcon>
            <ListItemText primary="Deals" />
          </SidebarLink>
          <SidebarLink button>
            <ListItemIcon>
              <ScheduleIcon />
            </ListItemIcon>
            <ListItemText primary="Activities" />
          </SidebarLink>
          <SidebarLink button>
            <ListItemIcon>
              <AssessmentIcon />
            </ListItemIcon>
            <ListItemText primary="Reports" />
          </SidebarLink>
          <SidebarLink button>
            <ListItemIcon>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </SidebarLink>
        </List>
      </DrawerStyled>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          padding: theme.spacing(3),
          marginTop: '64px',
          marginLeft: drawerOpen ? '280px' : 0,
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Dashboard Header */}
        <PageHeader>
          <Box mb={2}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
              <Link color="inherit" href="#" underline="hover">
                Dashboard
              </Link>
              <Typography color="text.primary">Customer Management</Typography>
            </Breadcrumbs>
          </Box>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h4" fontWeight={600} gutterBottom>
                Customer Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Manage your customer relationships and track interactions
              </Typography>
            </Box>
            <Box>
              <ActionButton
                variant="contained"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={() => {}}
              >
                Add Customer
              </ActionButton>
            </Box>
          </Box>
        </PageHeader>

        {/* Dashboard Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={3}>
            <StatsCard color="primary">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Total Customers
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  154
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +12% from last month
                  </Typography>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard color="success">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Active Deals
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  28
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +5% from last month
                  </Typography>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard color="warning">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Pipeline Value
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  $1.2M
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUpIcon color="success" fontSize="small" sx={{ mr: 0.5 }} />
                  <Typography variant="body2" color="success.main">
                    +18% from last month
                  </Typography>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid item xs={12} md={3}>
            <StatsCard color="error">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Churn Rate
                </Typography>
                <Typography variant="h4" fontWeight={600}>
                  4.2%
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <TrendingUpIcon color="error" fontSize="small" sx={{ mr: 0.5, transform: 'rotate(180deg)' }} />
                  <Typography variant="body2" color="error.main">
                    -1.5% from last month
                  </Typography>
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>

        {/* Data Visualization */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <DashboardMetricCard>
              <MetricCardHeader>
                <Typography variant="subtitle1" fontWeight={600}>
                  Sales Performance
                </Typography>
                <Box>
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </MetricCardHeader>
              <MetricCardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={revenueData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <RechartsTooltip />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke={theme.palette.warning.main}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </MetricCardContent>
            </DashboardMetricCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <DashboardMetricCard>
              <MetricCardHeader>
                <Typography variant="subtitle1" fontWeight={600}>
                  Customer Lifecycle Stage
                </Typography>
                <Box>
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </MetricCardHeader>
              <MetricCardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stageData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {stageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={stageColors[index % stageColors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </MetricCardContent>
            </DashboardMetricCard>
          </Grid>
        </Grid>

        {/* Customer Management Section */}
        <CRMCard sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" gap={2} alignItems="center">
                <Tabs
                  value={currentTab}
                  onChange={handleTabChange}
                  textColor="primary"
                  indicatorColor="primary"
                >
                  <Tab label="All Customers" />
                  <Tab label="Active" />
                  <Tab label="New" />
                  <Tab label="Inactive" />
                </Tabs>
              </Box>
              <Box display="flex" gap={2} alignItems="center">
                <SearchField
                  placeholder="Search customers..."
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
                <ActionButton
                  variant="outlined"
                  startIcon={<FilterAltIcon />}
                >
                  Filter
                </ActionButton>
              </Box>
            </Box>

            {/* Customer Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableHeadCell>Customer</StyledTableHeadCell>
                    <StyledTableHeadCell>Stage</StyledTableHeadCell>
                    <StyledTableHeadCell>Value</StyledTableHeadCell>
                    <StyledTableHeadCell>Last Contact</StyledTableHeadCell>
                    <StyledTableHeadCell>Next Action</StyledTableHeadCell>
                    <StyledTableHeadCell>Assigned To</StyledTableHeadCell>
                    <StyledTableHeadCell align="right">Actions</StyledTableHeadCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                    <StyledTableRow
                      key={customer.id}
                      onClick={() => handleCustomerClick(customer)}
                    >
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <StatusBadge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            status={customer.status}
                          >
                            <CustomerAvatar status={customer.status}>
                              {customer.name.charAt(0)}
                            </CustomerAvatar>
                          </StatusBadge>
                          <Box sx={{ ml: 2 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {customer.name}
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {customer.contactName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {customer.industry}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <CustomerStageChip 
                          stage={customer.stage}
                          label={customer.stage} 
                          size="small"
                          icon={getStageDetails(customer.stage).icon}
                        />
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2" fontWeight={500}>
                          ${customer.value.toLocaleString()}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTimeIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(customer.lastContact).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box>
                          <Typography variant="body2">
                            {customer.nextAction}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(customer.nextActionDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Typography variant="body2">
                          {customer.assignedTo}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Quick Call">
                            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                              <CallIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Quick Email">
                            <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="More Options">
                            <IconButton size="small" onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e);
                            }}>
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              component="div"
              count={filteredCustomers.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </CardContent>
        </CRMCard>

        {/* Activity Timeline */}
        <CRMCard>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight={600}>
                Recent Activities
              </Typography>
              <ActionButton
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleOpenActivityForm}
              >
                Add Activity
              </ActionButton>
            </Box>

            {activityTimelineData.map((activity) => (
              <TimelineCard key={activity.id}>
                <Box display="flex">
                  <TimelineIcon color={activity.color}>
                    {activity.icon}
                  </TimelineIcon>
                  <Box flex={1}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {activity.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.date).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      {activity.description}
                    </Typography>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.primary">
                          {activity.customer}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        By: {activity.user}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </TimelineCard>
            ))}
          </CardContent>
        </CRMCard>
      </Box>

      {/* Customer Detail Drawer */}
      <Drawer
        anchor="right"
        open={customerDetailOpen}
        onClose={handleCloseCustomerDetail}
        PaperProps={{
          sx: { width: '40%', maxWidth: 600, px: 3, py: 2 }
        }}
      >
        {selectedCustomer && (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h5" fontWeight={600}>
                Customer Details
              </Typography>
              <IconButton onClick={handleCloseCustomerDetail}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box display="flex" alignItems="center" mb={4}>
              <CustomerAvatar 
                status={selectedCustomer.status} 
                sx={{ width: 64, height: 64, fontSize: 24 }}
              >
                {selectedCustomer.name.charAt(0)}
              </CustomerAvatar>
              <Box ml={2}>
                <Typography variant="h5" fontWeight={600}>
                  {selectedCustomer.name}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <CustomerStageChip 
                    stage={selectedCustomer.stage}
                    label={selectedCustomer.stage} 
                    icon={getStageDetails(selectedCustomer.stage).icon}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  {selectedCustomer.tags.map((tag, index) => (
                    <TagChip 
                      key={index}
                      label={tag}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <DetailSection>
                  <DetailHeader>
                    <DetailTitle variant="subtitle1">
                      <InfoOutlinedIcon /> Overview
                    </DetailTitle>
                  </DetailHeader>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <CustomerDetail>
                        <CustomerDetailLabel>Industry</CustomerDetailLabel>
                        <CustomerDetailValue variant="body2">
                          {selectedCustomer.industry}
                        </CustomerDetailValue>
                      </CustomerDetail>
                    </Grid>
                    <Grid item xs={6}>
                      <CustomerDetail>
                        <CustomerDetailLabel>Deal Value</CustomerDetailLabel>
                        <CustomerDetailValue variant="body2">
                          ${selectedCustomer.value.toLocaleString()}
                        </CustomerDetailValue>
                      </CustomerDetail>
                    </Grid>
                    <Grid item xs={6}>
                      <CustomerDetail>
                        <CustomerDetailLabel>Location</CustomerDetailLabel>
                        <CustomerDetailValue variant="body2">
                          {selectedCustomer.city}, {selectedCustomer.state}
                        </CustomerDetailValue>
                      </CustomerDetail>
                    </Grid>
                    <Grid item xs={6}>
                      <CustomerDetail>
                        <CustomerDetailLabel>Assigned To</CustomerDetailLabel>
                        <CustomerDetailValue variant="body2">
                          {selectedCustomer.assignedTo}
                        </CustomerDetailValue>
                      </CustomerDetail>
                    </Grid>
                  </Grid>
                </DetailSection>

                <DetailSection>
                  <DetailHeader>
                    <DetailTitle variant="subtitle1">
                      <ScheduleIcon /> Next Actions
                    </DetailTitle>
                  </DetailHeader>

                  <Box mb={2}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {selectedCustomer.nextAction}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Due: {new Date(selectedCustomer.nextActionDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                        <Box>
                          <Chip 
                            label="High Priority" 
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        </Box>
                        <Box>
                          <QuickActionButton color="primary" size="small" sx={{ mr: 1 }}>
                            Mark Complete
                          </QuickActionButton>
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  </Box>

                  <Box display="flex" justifyContent="center">
                    <ActionButton
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleOpenActivityForm}
                    >
                      Add New Task
                    </ActionButton>
                  </Box>
                </DetailSection>

                <DetailSection>
                  <DetailHeader>
                    <DetailTitle variant="subtitle1">
                      <TrendingUpIcon /> Deal Progress
                    </DetailTitle>
                  </DetailHeader>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2">Current Stage: {selectedCustomer.stage}</Typography>
                      <Typography variant="body2" color="text.secondary">75% Complete</Typography>
                    </Box>
                    <StageProgressBar variant="determinate" value={75} color="success" />

                    <Box display="flex" justifyContent="space-between" mt={2}>
                      {['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Closed'].map((stage, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            textAlign: 'center',
                            opacity: selectedCustomer.stage === stage ? 1 : 0.6,
                            fontWeight: selectedCustomer.stage === stage ? 600 : 400,
                          }}
                        >
                          <Tooltip title={stage}>
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                backgroundColor: selectedCustomer.stage === stage 
                                  ? alpha(theme.palette.success.main, 0.2)
                                  : alpha(theme.palette.grey[500], 0.1),
                                border: selectedCustomer.stage === stage 
                                  ? `2px solid ${theme.palette.success.main}`
                                  : `1px solid ${theme.palette.grey[300]}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto',
                                mb: 0.5,
                              }}
                            >
                              {selectedCustomer.stage === stage && <CheckCircleIcon color="success" fontSize="small" />}
                            </Box>
                          </Tooltip>
                          <Typography variant="caption" display="block">{stage}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </DetailSection>
              </Grid>

              <Grid item xs={12} md={5}>
                <SidebarSection>
                  <SidebarSectionTitle variant="subtitle1">
                    <PersonIcon /> Contact Information
                  </SidebarSectionTitle>
                  <Box border={`1px solid ${alpha(theme.palette.divider, 0.08)}`} borderRadius={2} p={2} mb={3}>
                    <ContactInfoItem>
                      <PersonIcon fontSize="small" />
                      <Typography variant="body2">{selectedCustomer.contactName}</Typography>
                    </ContactInfoItem>
                    <ContactInfoItem>
                      <EmailIcon fontSize="small" />
                      <Typography variant="body2">{selectedCustomer.email}</Typography>
                    </ContactInfoItem>
                    <ContactInfoItem>
                      <PhoneIcon fontSize="small" />
                      <Typography variant="body2">{selectedCustomer.phone}</Typography>
                    </ContactInfoItem>
                    <ContactInfoItem>
                      <LocationOnIcon fontSize="small" />
                      <Typography variant="body2">
                        {selectedCustomer.city}, {selectedCustomer.state}
                      </Typography>
                    </ContactInfoItem>
                    <Box display="flex" justifyContent="space-between" mt={2}>
                      <QuickActionButton color="primary" size="small" startIcon={<CallIcon />}>
                        Call
                      </QuickActionButton>
                      <QuickActionButton color="info" size="small" startIcon={<EmailIcon />}>
                        Email
                      </QuickActionButton>
                      <QuickActionButton color="secondary" size="small" startIcon={<EventIcon />}>
                        Meeting
                      </QuickActionButton>
                    </Box>
                  </Box>
                </SidebarSection>

                <SidebarSection>
                  <SidebarSectionTitle variant="subtitle1">
                    <AccessTimeIcon /> Activity History
                  </SidebarSectionTitle>

                  <Box maxHeight={400} overflow="auto" pr={1}>
                    {activityTimelineData
                      .filter(activity => activity.customer === selectedCustomer.name)
                      .map((activity) => (
                        <TimelineCard key={activity.id}>
                          <Box display="flex">
                            <TimelineIcon color={activity.color}>
                              {activity.icon}
                            </TimelineIcon>
                            <Box flex={1}>
                              <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {activity.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(activity.date).toLocaleString(undefined, { 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" mb={0.5}>
                                {activity.description}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                By: {activity.user}
                              </Typography>
                            </Box>
                          </Box>
                        </TimelineCard>
                      ))}

                    {activityTimelineData.filter(activity => 
                      activity.customer === selectedCustomer.name
                    ).length === 0 && (
                      <Box textAlign="center" py={3}>
                        <NoteIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                        <Typography color="text.secondary">
                          No activity history yet
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Box display="flex" justifyContent="center" mt={2}>
                    <ActionButton
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleOpenActivityForm}
                    >
                      Log Activity
                    </ActionButton>
                  </Box>
                </SidebarSection>

                <SidebarSection>
                  <SidebarSectionTitle variant="subtitle1">
                    <FolderIcon /> Files & Documents
                  </SidebarSectionTitle>

                  <Box border={`1px solid ${alpha(theme.palette.divider, 0.08)}`} borderRadius={2} p={2}>
                    <Box textAlign="center" py={2}>
                      <DescriptionIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary" gutterBottom>
                        No documents attached yet
                      </Typography>
                      <ActionButton
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                      >
                        Upload Document
                      </ActionButton>
                    </Box>
                  </Box>
                </SidebarSection>
              </Grid>
            </Grid>
          </>
        )}
      </Drawer>

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleOpenActivityForm}>
          <ListItemIcon>
            <EventIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Schedule Meeting</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenActivityForm}>
          <ListItemIcon>
            <NoteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Add Note</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleOpenActivityForm}>
          <ListItemIcon>
            <AssignmentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Task</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Customer</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DoDisturbIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Mark as Inactive</ListItemText>
        </MenuItem>
      </Menu>

      {/* Add Activity Dialog */}
      <Dialog
        open={addActivityOpen}
        onClose={handleCloseActivityForm}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Log New Activity</Typography>
            <IconButton onClick={handleCloseActivityForm} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3, mt: 1 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Activity Type</InputLabel>
              <Select
                value={activityType}
                label="Activity Type"
                onChange={handleActivityTypeChange}
              >
                <MenuItem value="call">
                  <Box display="flex" alignItems="center">
                    <CallIcon fontSize="small" sx={{ mr: 1, color: theme.palette.primary.main }} />
                    Phone Call
                  </Box>
                </MenuItem>
                <MenuItem value="email">
                  <Box display="flex" alignItems="center">
                    <EmailIcon fontSize="small" sx={{ mr: 1, color: theme.palette.info.main }} />
                    Email
                  </Box>
                </MenuItem>
                <MenuItem value="meeting">
                  <Box display="flex" alignItems="center">
                    <EventIcon fontSize="small" sx={{ mr: 1, color: theme.palette.success.main }} />
                    Meeting
                  </Box>
                </MenuItem>
                <MenuItem value="note">
                  <Box display="flex" alignItems="center">
                    <NoteIcon fontSize="small" sx={{ mr: 1, color: theme.palette.warning.main }} />
                    Note
                  </Box>
                </MenuItem>
                <MenuItem value="task">
                  <Box display="flex" alignItems="center">
                    <AssignmentIcon fontSize="small" sx={{ mr: 1, color: theme.palette.secondary.main }} />
                    Task
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Title"
              value={activityFormData.title}
              onChange={handleActivityFormChange("title")}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Description"
              value={activityFormData.description}
              onChange={handleActivityFormChange("description")}
              multiline
              rows={3}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Date & Time"
              type="datetime-local"
              value={activityFormData.date}
              onChange={handleActivityFormChange("date")}
              InputLabelProps={{ shrink: true }}
              margin="normal"
            />

            {!selectedCustomer && (
              <FormControl fullWidth margin="normal">
                <InputLabel>Customer</InputLabel>
                <Select
                  value={activityFormData.customer}
                  label="Customer"
                  onChange={handleActivityFormChange("customer")}
                >
                  {customerData.map((customer) => (
                    <MenuItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseActivityForm}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleActivitySubmit}
            disabled={!activityFormData.title || !activityFormData.date}
          >
            Save Activity
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanelPage;