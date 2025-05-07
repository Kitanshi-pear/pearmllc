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
  Tooltip,
  Tab,
  Tabs,
  Paper,
  FormControl,
  FormControlLabel,
  Switch,
  InputLabel,
  CircularProgress,
  Snackbar,
  Alert,
  Container,
  useTheme,
  alpha,
  styled,
  Badge,
  Chip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import TuneIcon from "@mui/icons-material/Tune";
import SendIcon from "@mui/icons-material/Send";
import CodeIcon from "@mui/icons-material/Code";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import LinkIcon from "@mui/icons-material/Link";
import Layout from "./Layout";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Import regular icons from free-solid-svg-icons
import {
  faCalendarAlt,
  faChevronLeft,
  faChevronRight,
  faExchangeAlt,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";

// Import brand icons from free-brands-svg-icons
import {
  faFacebookF,
  faGoogle,
} from "@fortawesome/free-brands-svg-icons";

// Import our custom date components
import DateRangePicker from "./DateRange";
import DateFormatter, { DATE_FORMAT } from "./DateFormat";

// Create date formatter instance
const dateFormatter = new DateFormatter();

// Modern styled components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
  transition: 'transform 0.3s, box-shadow 0.3s',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
  },
}));

const GradientButton = styled(Button)(({ theme, colorStart = '#4776E6', colorEnd = '#8E54E9' }) => ({
  background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
  boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s',
  color: 'white',
  fontWeight: 600,
  '&:hover': {
    boxShadow: '0 6px 15px rgba(0, 0, 0, 0.25)',
    transform: 'translateY(-2px)',
  },
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
}));

const AnimatedIconButton = styled(IconButton)(({ theme }) => ({
  transition: 'transform 0.2s, background 0.2s',
  '&:hover': {
    transform: 'scale(1.1)',
    background: alpha(theme.palette.primary.main, 0.1),
  },
}));

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  border: 'none',
  borderRadius: 16,
  '& .MuiDataGrid-columnHeader': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    padding: '12px 16px',
    '&:first-of-type': {
      borderTopLeftRadius: 16,
    },
    '&:last-of-type': {
      borderTopRightRadius: 16,
    },
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 600,
  },
  '& .MuiDataGrid-cell': {
    padding: '16px',
    fontSize: '0.95rem',
  },
  '& .MuiDataGrid-row': {
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
    },
    '&.Mui-selected': {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.12),
      },
    },
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.08)',
  ...(status === 'active' && {
    background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    color: '#05603a',
  }),
  ...(status === 'inactive' && {
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    color: '#4b4b4b',
  }),
}));

const GradientBox = styled(Box)(({ theme, colorStart = '#a1c4fd', colorEnd = '#c2e9fb' }) => ({
  background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
  borderRadius: 16,
  padding: theme.spacing(3),
  color: theme.palette.getContrastText(theme.palette.primary.light),
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
}));

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && <>{children}</>}
    </div>
  );
};

// Enhanced Postback Macros - RedTrack style
const POSTBACK_MACROS = {
  CLICKID: '{click_id}',
  PAYOUT: '{payout}',
  STATUS: '{status}',
  SOURCE: '{source}',
  CAMPAIGN: '{campaign}',
  REVENUE: '{revenue}',
  OFFER_ID: '{offer_id}',
  CUSTOM1: '{custom1}',
  CUSTOM2: '{custom2}',
  CUSTOM3: '{custom3}'
};

// Generate RedTrack-style postback URL format
const generatePostbackTemplate = (baseUrl = window.location.origin, sourceType = '') => {
  const apiPostbackUrl = `${baseUrl}/api/postback?click_id=${POSTBACK_MACROS.CLICKID}&payout=${POSTBACK_MACROS.PAYOUT}&status=${POSTBACK_MACROS.STATUS}`;
  return apiPostbackUrl;
};

// Parse a postback URL template and replace macros with test values
const parsePostbackUrl = (template, data) => {
  if (!template) return '';
  
  let url = template;
  
  // Replace all macros with test values
  Object.entries(POSTBACK_MACROS).forEach(([key, macro]) => {
    const valueKey = key.toLowerCase();
    const value = data[valueKey] || '';
    url = url.replace(new RegExp(macro.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), encodeURIComponent(value));
  });
  
  return url;
};

const OfferSourcePage = () => {
  const theme = useTheme();
  
  // State for dates
  const [dateRange, setDateRange] = useState({
    startDate: dateFormatter.prepareDate(dateFormatter.getDateRange('today').startDate),
    endDate: dateFormatter.prepareDate(dateFormatter.getDateRange('today').endDate),
    label: 'Today'
  });
  
  const [openTemplateModal, setOpenTemplateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [titleText, setTitle] = useState("");
  const [tabValue, setTabValue] = useState(0);
  const [postbackTestDialogOpen, setPostbackTestDialogOpen] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Enhanced postback testing state
  const [testPostbackData, setTestPostbackData] = useState({
    click_id: 'test_' + Math.random().toString(36).substring(2, 10),
    payout: '10.00',
    status: 'approved',
    source: '',
    campaign: 'test_campaign',
    revenue: '12.50',
    offer_id: '123',
    custom1: 'test1',
    custom2: 'test2',
    custom3: 'test3'
  });
  const [processedUrl, setProcessedUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const currencies = ["USD", "EUR", "INR", "GBP", "CAD", "AUD", "JPY", "CNY"];
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
  
  const source_types = [
    "Facebook",
    "Google",
    "TikTok",
    "Taboola",
    "Outbrain",
    "Snapchat",
    "Pinterest",
    "Twitter",
    "LinkedIn",
    "Reddit",
    "Other"
  ];

  // Enhanced template with conversion API settings
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    alias: "",
    postbackUrl: "",
    sourceType: "",
    currency: "USD",
    offerUrl: "",
    clickid: "click_id", 
    sum: "payout",
    parameter: "",
    token: "",
    description: "",
    role: "",
    is_active: true,
    // Conversion API settings removed from default state
  });

  // Handle date range change
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    // Auto-fetch when date range changes
    fetchOfferSources(newRange);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const fetchOfferSources = async (dateRangeToUse = null) => {
    setLoading(true);
    try {
      // Use provided date range or current state
      const dateParams = dateRangeToUse || dateRange;
      
      // Include date range in the API request
      const response = await axios.get(
        "https://pearmllc.onrender.com/offersource/list", {
          params: {
            date_from: dateParams.startDate,
            date_to: dateParams.endDate
          }
        }
      );
      const data = response.data;

      const formatted = data.map((item, index) => ({
        id: item.id,
        serial_no: index + 1,
        source_name: item.name,
        source_type: item.sourceType || "Other",
        timestamp: item.createdAt,
        postback: item.postback_url,
        currency: item.currency,
        offer_url: item.offer_url,
        clickid: item.clickid,
        sum: item.sum,
        parameter: item.parameter,
        token: item.token,
        description: item.description,
        role: item.role,
        is_active: item.is_active !== false,
        clicks: item.clicks || 0,
        lp_clicks: item.lp_clicks || 0,
        conversion: item.conversions || 0,
        total_cpa: item.total_cpa || 0,
        epc: item.epc || 0,
        total_revenue: item.total_revenue || 0,
        cost: item.cost || 0,
        profit: item.profit || 0,
        total_roi: item.total_roi || 0,
        lp_views: item.lp_views || 0,
      }));

      setRows(formatted);
      setSnackbar({
        open: true,
        message: 'Sources loaded successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error("Failed to fetch offer sources:", err.message);
      setSnackbar({
        open: true,
        message: 'Failed to load sources: ' + (err.response?.data?.message || err.message),
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchOfferSources();
  }, []);

  const handleEditClick = (row) => {
    setSelectedRowId(row.id);
    setEditMode(true);
    setNewTemplate({
      name: row.source_name,
      alias: row.source_name.toLowerCase().replace(/\s+/g, "-"),
      postbackUrl: row.postback || "",
      sourceType: row.source_type || "Other",
      currency: row.currency || "USD",
      offerUrl: row.offer_url || "",
      clickid: row.clickid || "click_id",
      sum: row.sum || "payout",
      parameter: row.parameter || "",
      token: row.token || "",
      description: row.description || "",
      role: row.role || "",
      is_active: row.is_active !== false,
    });
    setOpenTemplateModal(true);
  };

  const handleDeleteClick = (row) => {
    setSelectedRowId(row.id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(
        `https://pearmllc.onrender.com/offersource/delete/${selectedRowId}`
      );
      
      setSnackbar({
        open: true,
        message: 'Source deleted successfully',
        severity: 'success'
      });
      
      fetchOfferSources();
      setDeleteConfirmOpen(false);
      setSelectedRowId(null);
    } catch (error) {
      console.error("Error deleting source:", error.message);
      setSnackbar({
        open: true,
        message: 'Failed to delete source: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const payload = {
        name: newTemplate.name,
        alias: newTemplate.alias,
        sourceType: newTemplate.sourceType,
        postback_url: newTemplate.postbackUrl,
        currency: newTemplate.currency,
        offer_url: newTemplate.offerUrl,
        clickid: newTemplate.clickid,
        sum: newTemplate.sum,
        parameter: newTemplate.parameter,
        token: newTemplate.token,
        description: newTemplate.description,
        role: newTemplate.role,
        is_active: newTemplate.is_active,
      };

      if (editMode && selectedRowId) {
        await axios.put(
          `https://pearmllc.onrender.com/offersource/update/${selectedRowId}`,
          payload
        );
        setSnackbar({
          open: true,
          message: 'Source updated successfully',
          severity: 'success'
        });
      } else {
        await axios.post(
          "https://pearmllc.onrender.com/offersource/create",
          payload
        );
        setSnackbar({
          open: true,
          message: 'Source created successfully',
          severity: 'success'
        });
      }

      fetchOfferSources();
      setOpenTemplateModal(false);
      setEditMode(false);
      setSelectedRowId(null);
      setNewTemplate({
        name: "",
        alias: "",
        postbackUrl: "",
        sourceType: "",
        currency: "USD",
        offerUrl: "",
        clickid: "click_id",
        sum: "payout",
        parameter: "",
        token: "",
        description: "",
        role: "",
        is_active: true,
      });
    } catch (error) {
      console.error("Error saving template:", error.message);
      setSnackbar({
        open: true,
        message: 'Failed to save source: ' + (error.response?.data?.message || error.message),
        severity: 'error'
      });
    }
  };

  const handleSourceTypeChange = (e) => {
    const sourceType = e.target.value;
    setNewTemplate({
      ...newTemplate,
      sourceType,
      postbackUrl: generatePostbackTemplate(window.location.origin, sourceType)
    });
  };

  const handleCopyPostback = () => {
    navigator.clipboard.writeText(newTemplate.postbackUrl);
    setSnackbar({
      open: true,
      message: 'Postback URL copied to clipboard',
      severity: 'success'
    });
  };

  const handleGeneratePostbackTemplate = () => {
    const template = generatePostbackTemplate(window.location.origin, newTemplate.sourceType);
    setNewTemplate({
      ...newTemplate,
      postbackUrl: template
    });
  };

  const handleInsertMacro = (macro) => {
    setNewTemplate({
      ...newTemplate,
      postbackUrl: newTemplate.postbackUrl + macro
    });
  };

  const handleOpenPostbackTest = (source) => {
    setSelectedSource(source);
    setTestPostbackData(prev => ({
      ...prev,
      source: source.source_name || '',
      click_id: 'test_' + Math.random().toString(36).substring(2, 10)
    }));
    setPostbackTestDialogOpen(true);
  };

  const handleClosePostbackTest = () => {
    setPostbackTestDialogOpen(false);
    setProcessedUrl('');
    setTestResult(null);
  };

  // Enhanced postback testing functions
  const handleTestDataChange = (e) => {
    const { name, value } = e.target;
    setTestPostbackData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerateTestUrl = () => {
    if (!selectedSource) return '';
    
    const url = parsePostbackUrl(selectedSource.postback, testPostbackData);
    setProcessedUrl(url);
    return url;
  };

  const handleTestPostback = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const url = handleGenerateTestUrl();
      
      // Actually send the test postback request
      const response = await axios.get(url);
      
      setTestResult({
        success: true,
        message: 'Postback test completed successfully! Response: ' + JSON.stringify(response.data),
        data: response.data
      });
      
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error.response?.data?.error || error.message}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  // Modern source type renderer with custom icons
  const renderSourceTypeIcon = (type) => {
    switch (type) {
      case 'Facebook':
        return <FontAwesomeIcon icon={faFacebookF} style={{ color: '#1877F2' }} />;
      case 'Google':
        return <FontAwesomeIcon icon={faGoogle} style={{ color: '#4285F4' }} />;
      case 'TikTok':
        return <Box component="span" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>TT</Box>;
      default:
        return <LinkIcon fontSize="small" />;
    }
  };

  // Enhanced columns with modern styling
  const columns = [
    { field: "serial_no", headerName: "#", width: 60, align: "center" },
    {
      field: "source_name",
      headerName: "Source Name",
      width: 230,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              mr: 1,
              width: 30,
              height: 30,
              borderRadius: '50%',
              justifyContent: 'center',
              background: alpha(theme.palette.primary.main, 0.1)
            }}
          >
            {renderSourceTypeIcon(params.row.source_type)}
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography sx={{ fontWeight: 600 }}>{params.value}</Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.source_type}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex' }}>
            <AnimatedIconButton
              size="small"
              onClick={() => handleEditClick(params.row)}
              title="Edit"
              sx={{ color: theme.palette.primary.main }}
            >
              <EditIcon fontSize="small" />
            </AnimatedIconButton>
            <AnimatedIconButton
              size="small"
              onClick={() => handleDeleteClick(params.row)}
              title="Delete"
              sx={{ color: theme.palette.error.main }}
            >
              <DeleteIcon fontSize="small" />
            </AnimatedIconButton>
          </Box>
        </Box>
      ),
    },
    {
      field: "is_active",
      headerName: "Status",
      width: 120,
      renderCell: (params) => (
        <StatusChip
          label={params.value ? "Active" : "Inactive"}
          status={params.value ? "active" : "inactive"}
          icon={params.value ? <CheckCircleIcon /> : <CancelIcon />}
          size="small"
        />
      ),
    },
    { 
      field: "postback", 
      headerName: "Postback URL", 
      width: 220,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={params.value || "No postback URL"}>
            <Typography sx={{ 
              overflow: "hidden", 
              textOverflow: "ellipsis", 
              whiteSpace: "nowrap",
              flexGrow: 1,
              maxWidth: 130,
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              color: theme.palette.text.secondary
            }}>
              {params.value || "—"}
            </Typography>
          </Tooltip>
          {params.value && (
            <Box sx={{ display: 'flex' }}>
              <AnimatedIconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(params.value);
                  setSnackbar({
                    open: true,
                    message: 'Postback URL copied to clipboard',
                    severity: 'success'
                  });
                }}
                title="Copy Postback"
                sx={{ color: theme.palette.info.main }}
              >
                <ContentCopyIcon fontSize="small" />
              </AnimatedIconButton>
              <AnimatedIconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPostbackTest(params.row);
                }}
                title="Test Postback"
                sx={{ color: theme.palette.warning.main }}
              >
                <VisibilityIcon fontSize="small" />
              </AnimatedIconButton>
            </Box>
          )}
        </Box>
      )
    },
    { 
      field: "clicks", 
      headerName: "Clicks", 
      width: 90, 
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600 }}>
          {params.value.toLocaleString()}
        </Typography>
      )
    },
    { 
      field: "conversion", 
      headerName: "Conv", 
      width: 90, 
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 600 }}>
          {params.value.toLocaleString()}
        </Typography>
      )
    },
    { 
      field: "total_cpa", 
      headerName: "CPA ($)", 
      width: 110,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const value = params.value || 0;
        return (
          <Typography sx={{ 
            fontWeight: 600,
            color: value > 10 ? theme.palette.error.main : theme.palette.success.main 
          }}>
            ${value.toFixed(2)}
          </Typography>
        );
      }
    },
    { 
      field: "epc", 
      headerName: "EPC ($)", 
      width: 110,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const value = params.value || 0;
        return (
          <Typography sx={{ 
            fontWeight: 600,
            color: value > 0.5 ? theme.palette.success.main : theme.palette.text.primary 
          }}>
            ${value.toFixed(2)}
          </Typography>
        );
      }
    },
    { 
      field: "total_revenue", 
      headerName: "Revenue", 
      width: 120,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const value = params.value || 0;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ fontWeight: 600, pr: 1 }}>
              ${value.toFixed(2)}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: "profit", 
      headerName: "Profit", 
      width: 120,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const value = params.value || 0;
        const isPositive = value >= 0;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isPositive ? 
              <ArrowUpwardIcon fontSize="small" sx={{ color: theme.palette.success.main, mr: 0.5 }} /> :
              <ArrowDownwardIcon fontSize="small" sx={{ color: theme.palette.error.main, mr: 0.5 }} />
            }
            <Typography sx={{ 
              fontWeight: 600,
              color: isPositive ? theme.palette.success.main : theme.palette.error.main
            }}>
              ${Math.abs(value).toFixed(2)}
            </Typography>
          </Box>
        );
      }
    },
    { 
      field: "total_roi", 
      headerName: "ROI", 
      width: 100,
      align: "right",
      headerAlign: "right",
      renderCell: (params) => {
        const value = params.value || 0;
        const isPositive = value >= 0;
        return (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            bgcolor: isPositive ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
            px: 1,
            py: 0.5,
            borderRadius: 1
          }}>
            <Typography sx={{ 
              fontWeight: 600,
              color: isPositive ? theme.palette.success.main : theme.palette.error.main
            }}>
              {value.toFixed(2)}%
            </Typography>
          </Box>
        );
      }
    },
  ];

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Custom styled modal container
  const ModalContainer = styled(Box)(({ theme }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "900px",
    maxWidth: "95vw",
    maxHeight: "90vh",
    overflow: "auto",
    backgroundColor: theme.palette.background.paper,
    borderRadius: 16,
    boxShadow: '0 24px 40px rgba(0, 0, 0, 0.2)',
    padding: 0,
  }));

  // Custom styled tab
  const StyledTab = styled(Tab)(({ theme }) => ({
    fontWeight: 600,
    textTransform: 'none',
    minWidth: 120,
  }));

  return (
    <Layout>
      <Container maxWidth="xl">
        <Box sx={{ pt: 4, pb: 8 }}>
          {/* Dashboard Header with Stats */}
          <GradientBox 
            sx={{ mb: 4 }}
            colorStart="#4facfe"
            colorEnd="#00f2fe"
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Offer Sources
                </Typography>
                <Typography variant="body1">
                  Manage your traffic sources, postbacks and conversions
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="inherit"
                  startIcon={<RefreshIcon />}
                  onClick={fetchOfferSources}
                  disabled={loading}
                  sx={{ 
                    bgcolor: 'rgba(255, 255, 255, 0.9)', 
                    color: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 1)',
                    }
                  }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <GradientButton
                  startIcon={<AddIcon />}
                  colorStart="#FF416C"
                  colorEnd="#FF4B2B"
                  onClick={() => {
                    setOpenTemplateModal(true);
                    setEditMode(false);
                    setSelectedRowId(null);
                    setNewTemplate({
                      name: "",
                      alias: "",
                      postbackUrl: "",
                      sourceType: "",
                      currency: "USD",
                      offerUrl: "",
                      clickid: "click_id",
                      sum: "payout",
                      parameter: "",
                      token: "",
                      description: "",
                      role: "",
                      is_active: true,
                    });
                  }}
                >
                  Add New Source
                </GradientButton>
              </Box>
            </Box>

            {/* Stats Overview */}
            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={3}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(5px)', 
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <Badge 
                      badgeContent={rows.length} 
                      color="primary"
                      sx={{ 
                        '& .MuiBadge-badge': {
                          fontSize: '0.9rem',
                          height: '1.5rem',
                          minWidth: '1.5rem',
                        }
                      }}
                    >
                      <Box sx={{ mr: 2 }}>Sources</Box>
                    </Badge>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {rows.filter(row => row.is_active).length} active
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(5px)', 
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                    <ShowChartIcon sx={{ mr: 1 }} /> 
                    Conversions
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {rows.reduce((total, row) => total + (row.conversion || 0), 0).toLocaleString()}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(5px)', 
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>Revenue</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    ${rows.reduce((total, row) => total + (row.total_revenue || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={3}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255, 255, 255, 0.9)', 
                    backdropFilter: 'blur(5px)', 
                    borderRadius: 2,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 1 }}>Profit</Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      color: rows.reduce((total, row) => total + (row.profit || 0), 0) >= 0 ? 
                        theme.palette.success.main : theme.palette.error.main
                    }}
                  >
                    ${rows.reduce((total, row) => total + (row.profit || 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </GradientBox>

          {/* Filter Controls */}
          <StyledCard sx={{ mb: 4 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: { xs: "wrap", md: "nowrap" },
                  gap: 2
                }}
              >
                {/* Date range picker */}
                <Box sx={{ flexGrow: 1 }}>
                  <DateRangePicker onDateRangeChange={handleDateRangeChange} />
                </Box>
                
                {/* Filter button */}
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  sx={{ 
                    borderRadius: 2,
                    height: 56
                  }}
                >
                  Filters
                </Button>
                
                {/* Apply button */}
                <GradientButton
                  onClick={() => fetchOfferSources()}
                  sx={{ height: 56 }}
                >
                  Apply
                </GradientButton>
              </Box>
            </CardContent>
          </StyledCard>

          {/* DataGrid for displaying offer sources */}
          <StyledCard sx={{ mb: 4, overflow: 'visible' }}>
            <Box sx={{ position: 'relative', height: 700 }}>
              {loading ? (
                <Box 
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    zIndex: 10,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <CircularProgress />
                </Box>
              ) : null}
              
              <StyledDataGrid
                rows={rows}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[5, 10, 15, 20, 50]}
                disableSelectionOnClick
                components={{
                  NoRowsOverlay: () => (
                    <Box 
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        p: 5
                      }}
                    >
                      <img 
                        src="https://cdn-icons-png.flaticon.com/512/6134/6134065.png" 
                        alt="No sources" 
                        style={{ width: 100, height: 100, marginBottom: 24, opacity: 0.5 }}
                      />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        No Traffic Sources Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center', maxWidth: 400 }}>
                        Add your first traffic source to start tracking your campaigns and conversions
                      </Typography>
                      <GradientButton
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setOpenTemplateModal(true);
                          setEditMode(false);
                        }}
                      >
                        Add Your First Source
                      </GradientButton>
                    </Box>
                  ),
                }}
                sx={{
                  '& .MuiDataGrid-virtualScroller': {
                    overflowX: 'hidden',
                  }
                }}
              />
            </Box>
          </StyledCard>
        </Box>

        {/* Source Modal with 2 tabs - Basic Details and Postback URL */}
        <Modal 
          open={openTemplateModal} 
          onClose={() => setOpenTemplateModal(false)}
          closeAfterTransition
        >
          <ModalContainer>
            <Box sx={{ bgcolor: theme.palette.primary.main, color: 'white', p: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {editMode ? "Edit Offer Source" : "Add New Source"}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                {editMode ? "Modify the existing source details" : "Configure a new traffic source to track"}
              </Typography>
            </Box>

            <Box sx={{ p: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                  TabIndicatorProps={{
                    style: {
                      height: 3,
                      borderRadius: '3px',
                      background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
                    }
                  }}
                >
                  <StyledTab 
                    label="Basic Details" 
                    icon={<TuneIcon />} 
                    iconPosition="start"
                  />
                  <StyledTab 
                    label="Postback URL" 
                    icon={<CodeIcon />}
                    iconPosition="start"
                  />
                </Tabs>
              </Box>

              {/* Tab 1: Basic Details */}
              <TabPanel value={tabValue} index={0}>
                <StyledCard sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Source Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Source Name *"
                          value={newTemplate.name}
                          onChange={(e) => {
                            const value = e.target.value;
                            setNewTemplate({
                              ...newTemplate,
                              name: value,
                              alias: value.toLowerCase().replace(/\s+/g, "-"),
                            });
                          }}
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="Alias"
                          value={newTemplate.alias}
                          disabled
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel>Source Type</InputLabel>
                          <Select
                            value={newTemplate.sourceType}
                            onChange={handleSourceTypeChange}
                            label="Source Type"
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="" disabled>Select Source Type</MenuItem>
                            {source_types.map((type) => (
                              <MenuItem key={type} value={type}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    mr: 1.5,
                                    width: 24,
                                    height: 24
                                  }}>
                                    {renderSourceTypeIcon(type)}
                                  </Box>
                                  {type}
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 3 }}>
                      <FormControl fullWidth>
                        <InputLabel>Currency</InputLabel>
                        <Select
                          value={newTemplate.currency}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, currency: e.target.value })
                          }
                          label="Currency"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="" disabled>Select Currency</MenuItem>
                          {currencies.map((currency) => (
                            <MenuItem key={currency} value={currency}>
                              {currency}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    
                    <Box sx={{ mt: 3 }}>
                      <TextField
                        fullWidth
                        label="Offer URL Template"
                        value={newTemplate.offerUrl}
                        onChange={(e) =>
                          setNewTemplate({ ...newTemplate, offerUrl: e.target.value })
                        }
                        helperText="Template for generating tracking links (optional)"
                        InputProps={{
                          sx: { borderRadius: 2 }
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Status
                      </Typography>
                      <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={newTemplate.is_active}
                              onChange={(e) => setNewTemplate({ ...newTemplate, is_active: e.target.checked })}
                              color="primary"
                            />
                          }
                          label={
                            <Typography sx={{ fontWeight: newTemplate.is_active ? 600 : 400 }}>
                              {newTemplate.is_active ? "Active" : "Inactive"}
                            </Typography>
                          }
                        />
                      </Paper>
                    </Box>
                  </CardContent>
                </StyledCard>

                {/* Postback Parameters - Enhanced for RedTrack */}
                <StyledCard sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Postback Parameters
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="CLICKID Parameter"
                          value={newTemplate.clickid}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, clickid: e.target.value })
                          }
                          helperText="Parameter name for tracking clicks (default: click_id)"
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="PAYOUT Parameter"
                          value={newTemplate.sum}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, sum: e.target.value })
                          }
                          helperText="Parameter name for payout value (default: payout)"
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </StyledCard>

                {/* Additional Parameters */}
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      Additional Parameters
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Parameter"
                          value={newTemplate.parameter}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, parameter: e.target.value })
                          }
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Macro / Token"
                          value={newTemplate.token}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, token: e.target.value })
                          }
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Description"
                          value={newTemplate.description}
                          onChange={(e) =>
                            setNewTemplate({ ...newTemplate, description: e.target.value })
                          }
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel>Role</InputLabel>
                          <Select
                            value={newTemplate.role}
                            onChange={(e) =>
                              setNewTemplate({ ...newTemplate, role: e.target.value })
                            }
                            label="Role"
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="" disabled>Select Role</MenuItem>
                            {roles.map((role) => (
                              <MenuItem key={role} value={role}>
                                {role}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </CardContent>
                </StyledCard>
              </TabPanel>

              {/* Tab 2: Postback URL Editor - Enhanced for RedTrack */}
              <TabPanel value={tabValue} index={1}>
                <StyledCard>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                      Postback URL Configuration
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create a postback URL template with tracking parameters. Traffic sources will use this URL to notify your system about conversions.
                    </Typography>
                    
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        mb: 3, 
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                        <TextField
                          fullWidth
                          label="Postback URL"
                          value={newTemplate.postbackUrl}
                          onChange={(e) => setNewTemplate({ ...newTemplate, postbackUrl: e.target.value })}
                          multiline
                          rows={3}
                          sx={{ mr: 1 }}
                          InputProps={{
                            sx: { 
                              borderRadius: 2,
                              fontFamily: 'monospace',
                              fontSize: '0.9rem'
                            }
                          }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <AnimatedIconButton onClick={handleCopyPostback} title="Copy URL">
                            <ContentCopyIcon />
                          </AnimatedIconButton>
                          <AnimatedIconButton onClick={handleGeneratePostbackTemplate} title="Generate Template">
                            <HelpOutlineIcon />
                          </AnimatedIconButton>
                        </Box>
                      </Box>
                    </Paper>
                    
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Available Parameters
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                      {Object.entries(POSTBACK_MACROS).map(([key, value]) => (
                        <Chip
                          key={key}
                          label={value}
                          onClick={() => handleInsertMacro(value)}
                          sx={{ 
                            borderRadius: 2,
                            fontFamily: 'monospace',
                            fontWeight: 500,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                            '&:hover': {
                              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                            }
                          }}
                          clickable
                        />
                      ))}
                    </Box>
                    
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      Example Preview
                    </Typography>
                    
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        bgcolor: alpha(theme.palette.info.main, 0.05), 
                        borderRadius: 2,
                        mb: 3
                      }}
                    >
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          wordBreak: 'break-all',
                          color: theme.palette.text.secondary
                        }}
                      >
                        {parsePostbackUrl(newTemplate.postbackUrl, {
                          click_id: 'abc123',
                          payout: '10.00',
                          status: 'approved'
                        }) || 'No URL template configured'}
                      </Typography>
                    </Paper>
                    
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: 2, 
                        bgcolor: alpha(theme.palette.warning.main, 0.05), 
                        borderRadius: 2,
                        borderLeft: `4px solid ${theme.palette.warning.main}`
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        <strong>Note:</strong> This URL will be used to receive conversion data from your traffic sources. The system will track
                        clicks using the {'{click_id}'} parameter, payout values using the {'{payout}'} parameter, and
                        conversion status with the {'{status}'} parameter.
                      </Typography>
                    </Paper>
                  </CardContent>
                </StyledCard>
              </TabPanel>

              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", px: 3, pb: 3 }}>
                <Button 
                  variant="outlined"
                  onClick={() => setOpenTemplateModal(false)} 
                  sx={{ mr: 2, borderRadius: 2, px: 3 }}
                >
                  Cancel
                </Button>
                <GradientButton 
                  onClick={handleSaveTemplate}
                  endIcon={editMode ? <EditIcon /> : <AddIcon />}
                  sx={{ px: 3 }}
                >
                  {editMode ? "Save Changes" : "Create Source"}
                </GradientButton>
              </Box>
            </Box>
          </ModalContainer>
        </Modal>
        
        {/* Enhanced Postback Testing Dialog */}
        <Modal 
          open={postbackTestDialogOpen} 
          onClose={handleClosePostbackTest}
          closeAfterTransition
        >
          <ModalContainer sx={{ width: '800px' }}>
            <Box sx={{ bgcolor: theme.palette.warning.main, color: 'white', p: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <VisibilityIcon sx={{ mr: 1.5 }} /> Test Postback URL
              </Typography>
              {selectedSource && (
                <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
                  {selectedSource.source_name} ({selectedSource.source_type})
                </Typography>
              )}
            </Box>
            
            {selectedSource && (
              <Box sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                  Postback URL Template:
                </Typography>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 2, 
                    mb: 3, 
                    bgcolor: alpha(theme.palette.warning.main, 0.05),
                    borderRadius: 2
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontFamily: 'monospace',
                      wordBreak: 'break-all'
                    }}
                  >
                    {selectedSource.postback || 'No postback URL configured'}
                  </Typography>
                </Paper>
                
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Test Parameters:
                </Typography>
                
                <StyledCard sx={{ mb: 3 }}>
                  <CardContent>
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Click ID"
                          name="click_id"
                          value={testPostbackData.click_id}
                          onChange={handleTestDataChange}
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Payout"
                          name="payout"
                          value={testPostbackData.payout}
                          onChange={handleTestDataChange}
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Status</InputLabel>
                          <Select
                            name="status"
                            value={testPostbackData.status}
                            onChange={handleTestDataChange}
                            label="Status"
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="approved">Approved</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="rejected">Rejected</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Revenue"
                          name="revenue"
                          value={testPostbackData.revenue}
                          onChange={handleTestDataChange}
                          InputProps={{
                            sx: { borderRadius: 2 }
                          }}
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </StyledCard>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={handleGenerateTestUrl}
                    disabled={!selectedSource.postback}
                    sx={{ borderRadius: 2, px: 3 }}
                    startIcon={<CodeIcon />}
                  >
                    Generate Test URL
                  </Button>
                  <GradientButton
                    onClick={handleTestPostback}
                    disabled={!selectedSource.postback || isTesting}
                    colorStart="#f5af19"
                    colorEnd="#f12711"
                    endIcon={<SendIcon />}
                    sx={{ px: 3 }}
                  >
                    {isTesting ? 'Testing...' : 'Send Test Postback'}
                  </GradientButton>
                </Box>
                
                {processedUrl && (
                  <StyledCard sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                        Generated URL:
                      </Typography>
                      <Box sx={{ position: 'relative' }}>
                        <TextField
                          fullWidth
                          value={processedUrl}
                          multiline
                          rows={2}
                          InputProps={{
                            readOnly: true,
                            sx: { 
                              borderRadius: 2,
                              fontFamily: 'monospace',
                              fontSize: '0.85rem',
                              pr: 5
                            }
                          }}
                        />
                        <Box sx={{ position: 'absolute', right: 8, top: 8 }}>
                          <AnimatedIconButton
                            onClick={() => {
                              navigator.clipboard.writeText(processedUrl);
                              setSnackbar({
                                open: true,
                                message: 'URL copied to clipboard',
                                severity: 'success'
                              });
                            }}
                            title="Copy URL"
                          >
                            <ContentCopyIcon />
                          </AnimatedIconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </StyledCard>
                )}
                
                {testResult && (
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3, 
                      bgcolor: testResult.success ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                      borderRadius: 2,
                      borderLeft: `4px solid ${testResult.success ? theme.palette.success.main : theme.palette.error.main}`,
                      mb: 3
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
                      {testResult.success ? 
                        <><CheckCircleIcon sx={{ mr: 1, color: theme.palette.success.main }} /> Test Successful</> : 
                        <><CancelIcon sx={{ mr: 1, color: theme.palette.error.main }} /> Test Failed</>
                      }
                    </Typography>
                    
                    <Typography variant="body2">
                      {testResult.message}
                    </Typography>
                    
                    {testResult.success && testResult.data && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>Response Data:</Typography>
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            bgcolor: 'background.paper', 
                            borderRadius: 2
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'monospace',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {JSON.stringify(testResult.data, null, 2)}
                          </Typography>
                        </Paper>
                      </Box>
                    )}
                  </Paper>
                )}
                
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  <Button 
                    variant="outlined"
                    onClick={handleClosePostbackTest}
                    sx={{ borderRadius: 2, px: 3 }}
                  >
                    Close
                  </Button>
                </Box>
              </Box>
            )}
          </ModalContainer>
        </Modal>
        
        {/* Delete Confirmation Dialog */}
        <Modal
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          closeAfterTransition
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "400px",
              bgcolor: "background.paper",
              boxShadow: '0 24px 40px rgba(0, 0, 0, 0.2)',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ bgcolor: theme.palette.error.main, color: 'white', p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <DeleteIcon sx={{ mr: 1.5 }} /> Confirm Deletion
              </Typography>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Are you sure you want to delete this traffic source? This action cannot be undone.
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button 
                  variant="outlined"
                  onClick={() => setDeleteConfirmOpen(false)} 
                  sx={{ mr: 2, borderRadius: 2 }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  color="error" 
                  onClick={handleConfirmDelete}
                  startIcon={<DeleteIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          </Box>
        </Modal>
        
        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ 
              width: '100%',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
};

export default OfferSourcePage;