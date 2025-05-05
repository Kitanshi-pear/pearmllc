import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  ThemeProvider,
  createTheme,
  Card,
  CardContent,
  IconButton,
  CircularProgress,
  Tooltip
} from "@mui/material";

// Import MUI icons
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import PercentIcon from "@mui/icons-material/Percent";
import CircleIcon from "@mui/icons-material/Circle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LinkIcon from "@mui/icons-material/Link";
import BarChartIcon from "@mui/icons-material/BarChart";
import TrafficIcon from "@mui/icons-material/Traffic";
import CampaignIcon from "@mui/icons-material/Campaign";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import Layout from "./Layout";

// Import charts
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip as ChartTooltip, Legend, ArcElement } from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import axios from "axios";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, ChartTooltip, Legend, ArcElement);

// Create a custom theme to match RedTrack's style
const theme = createTheme({
  palette: {
    primary: {
      main: "#5569ff", // RedTrack uses a bright blue as primary
      light: "#e8eaff",
      dark: "#3846c6",
    },
    secondary: {
      main: "#f53d57", // RedTrack uses a bright red as secondary color
    },
    success: {
      main: "#47c97a",
      light: "#e6f7ee",
    },
    error: {
      main: "#f53d57",
      light: "#ffecef",
    },
    warning: {
      main: "#ffb74d",
      light: "#fff5e6",
    },
    background: {
      default: "#f5f5f9", // Light gray background
      paper: "#ffffff",
    },
    text: {
      primary: "#101127", // Dark blue/black text
      secondary: "#5b6084", // Lighter text for less important elements
    },
  },
  typography: {
    fontFamily: "'Inter', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: "none", // RedTrack doesn't use uppercase buttons
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8, // Rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
        containedPrimary: {
          "&:hover": {
            backgroundColor: "#4356e6",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.05)",
          borderRadius: 10,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.05)",
          borderRadius: 10,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: "#5b6084",
          backgroundColor: "#f8f8fb",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0px 2px 10px rgba(0, 0, 0, 0.05)",
        },
      },
    },
  },
});

// Stats card component for metrics
const StatsCard = ({ title, value, change, icon, color, borderColor }) => {
  const isPositiveChange = change > 0;
  
  return (
    <Card
      sx={{
        height: "100%",
        borderLeft: `4px solid ${borderColor}`,
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)"
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, my: 1 }}>
              {value}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
              {change ? (
                <>
                  {isPositiveChange ? (
                    title === "Ad Spend" ? (
                      <TrendingUpIcon fontSize="small" sx={{ color: "error.main", mr: 0.5 }} />
                    ) : (
                      <TrendingUpIcon fontSize="small" sx={{ color: "success.main", mr: 0.5 }} />
                    )
                  ) : title === "Ad Spend" ? (
                    <TrendingDownIcon fontSize="small" sx={{ color: "success.main", mr: 0.5 }} />
                  ) : (
                    <TrendingDownIcon fontSize="small" sx={{ color: "error.main", mr: 0.5 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ 
                      color: isPositiveChange 
                        ? title === "Ad Spend" 
                          ? "error.main" 
                          : "success.main" 
                        : title === "Ad Spend" 
                          ? "success.main" 
                          : "error.main"
                    }}
                  >
                    {isPositiveChange ? "+" : "-"}
                    {Math.abs(change).toFixed(1)}% vs yesterday
                  </Typography>
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No change
                </Typography>
              )}
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: 2,
              width: 56,
              height: 56,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// New component for Conversion Stats Card
const ConversionStatsCard = ({ title, value, previousValue, icon, color }) => {
  const change = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositiveChange = change > 0;
  
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              borderRadius: 1.5,
              width: 40,
              height: 40,
              mr: 2
            }}
          >
            {icon}
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          {value}
        </Typography>
        
        {previousValue && (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Chip 
              icon={isPositiveChange ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
              label={`${isPositiveChange ? '+' : ''}${change.toFixed(1)}%`}
              size="small"
              sx={{ 
                bgcolor: isPositiveChange ? 'success.light' : 'error.light',
                color: isPositiveChange ? 'success.dark' : 'error.dark',
                fontWeight: 500,
                '& .MuiChip-icon': {
                  color: 'inherit'
                }
              }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              vs. previous period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// New component for Postback Status Card
const PostbackStatusCard = ({ status, lastUpdated, sources }) => {
  const statusColor = status === 'active' ? 'success' : status === 'issues' ? 'warning' : 'error';
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Postback System Status
          </Typography>
          <Chip 
            icon={status === 'active' ? <CheckIcon fontSize="small" /> : <HelpOutlineIcon fontSize="small" />}
            label={status === 'active' ? 'Active' : status === 'issues' ? 'Issues Detected' : 'Down'}
            size="small"
            sx={{ 
              bgcolor: `${statusColor}.light`,
              color: `${statusColor}.dark`,
              '& .MuiChip-icon': {
                color: 'inherit'
              }
            }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          System monitoring active. Last updated {lastUpdated}.
        </Typography>
        
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
          Traffic Source Status
        </Typography>
        
        <Box sx={{ mt: 1 }}>
          {sources.map((source) => (
            <Box 
              key={source.name}
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: source.status === 'active' ? 'success.main' : source.status === 'issues' ? 'warning.main' : 'error.main',
                    mr: 1.5,
                  }}
                />
                <Typography variant="body2">{source.name}</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {source.conversions_24h} conversions (24h)
              </Typography>
            </Box>
          ))}
        </Box>
        
        <Button 
          variant="outlined" 
          color="primary" 
          fullWidth 
          startIcon={<VisibilityIcon />}
          sx={{ mt: 2, borderRadius: 2 }}
        >
          View Postback Logs
        </Button>
      </CardContent>
    </Card>
  );
};

// New component for Quick Actions Card
const QuickActionsCard = () => {
  const actions = [
    { 
      name: 'Create New Campaign', 
      icon: <CampaignIcon />, 
      color: 'primary.main',
      bgColor: 'primary.light'
    },
    { 
      name: 'Add Traffic Source', 
      icon: <TrafficIcon />, 
      color: 'success.main',
      bgColor: 'success.light'
    },
    { 
      name: 'Test Postbacks', 
      icon: <LinkIcon />, 
      color: 'warning.main',
      bgColor: 'warning.light'
    },
    { 
      name: 'Generate Report', 
      icon: <BarChartIcon />, 
      color: 'error.main',
      bgColor: 'error.light'
    }
  ];
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Quick Actions
        </Typography>
        
        <Grid container spacing={2}>
          {actions.map((action) => (
            <Grid item xs={6} key={action.name}>
              <Card
                sx={{
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'none',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    borderColor: action.color
                  },
                  cursor: 'pointer'
                }}
              >
                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: action.bgColor,
                      color: action.color,
                      borderRadius: 2,
                      width: 48,
                      height: 48,
                      mx: 'auto',
                      mb: 1.5
                    }}
                  >
                    {action.icon}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {action.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// New Component for Recent Conversions
const RecentConversionsCard = ({ conversions, isLoading }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Recent Conversions
          </Typography>
          <Button 
            size="small"
            endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          >
            View All
          </Button>
        </Box>
        
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : conversions.length > 0 ? (
          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Campaign</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conversions.map((conversion) => (
                  <TableRow key={conversion.id} hover>
                    <TableCell>
                      <Tooltip title={conversion.timestamp}>
                        <Typography variant="body2">{conversion.time_ago}</Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          component="span"
                          sx={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: conversion.source === 'Facebook' ? '#4267B2' : 
                                    conversion.source === 'Google' ? '#DB4437' : 'primary.main',
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2">{conversion.source}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        maxWidth: 120 
                      }}>
                        {conversion.campaign}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                        {conversion.revenue}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No recent conversions to display
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default function Dashboard() {
  // Theme instance
  const muiTheme = useTheme();
  
  // States for dynamic data
  const [dashboardData, setDashboardData] = useState({
    adSpend: { today: 14500, yesterday: 12800, thisMonth: 324500 },
    revenue: { today: 31200, yesterday: 28900, thisMonth: 752000 },
    roas: { today: 215.2, yesterday: 225.8 },
    campaignPerformance: [
      { name: "Summer Sale", value: 128000, conversions: 1250 },
      { name: "New Customer", value: 95000, conversions: 820 },
      { name: "Holiday Special", value: 74500, conversions: 650 },
      { name: "Retargeting", value: 55200, conversions: 410 },
      { name: "Product Launch", value: 47800, conversions: 320 }
    ],
    revenueData: [
      { name: "Jan", value: 65000 },
      { name: "Feb", value: 72000 },
      { name: "Mar", value: 68000 },
      { name: "Apr", value: 92000 },
      { name: "May", value: 110000 },
      { name: "Jun", value: 125000 },
      { name: "Jul", value: 148000 },
      { name: "Aug", value: 152000 }
    ],
    adSpendData: [
      { name: "Jan", value: 32500 },
      { name: "Feb", value: 36000 },
      { name: "Mar", value: 34000 },
      { name: "Apr", value: 41000 },
      { name: "May", value: 47000 },
      { name: "Jun", value: 54000 },
      { name: "Jul", value: 62000 },
      { name: "Aug", value: 64000 }
    ],
    dailyData: [
      { name: "Mon", revenue: 18500, adSpend: 7400 },
      { name: "Tue", revenue: 16200, adSpend: 6800 },
      { name: "Wed", revenue: 17800, adSpend: 7200 },
      { name: "Thu", revenue: 21500, adSpend: 8600 },
      { name: "Fri", revenue: 24300, adSpend: 9750 },
      { name: "Sat", revenue: 26700, adSpend: 10500 },
      { name: "Sun", revenue: 22900, adSpend: 9200 }
    ],
    conversionMetrics: {
      total: 3452,
      previousTotal: 3102,
      approved: 2890,
      previousApproved: 2620,
      pending: 345,
      previousPending: 325,
      rejected: 217,
      previousRejected: 157
    },
    postbackStatus: {
      status: 'active',
      lastUpdated: '10 minutes ago',
      sources: [
        { name: 'Facebook', status: 'active', conversions_24h: 145 },
        { name: 'Google', status: 'active', conversions_24h: 98 },
        { name: 'TikTok', status: 'issues', conversions_24h: 42 },
        { name: 'Taboola', status: 'active', conversions_24h: 31 }
      ]
    },
    recentConversions: [
      { 
        id: 1, 
        source: 'Facebook', 
        campaign: 'Summer Sale', 
        revenue: '$45.00', 
        time_ago: '2 min ago',
        timestamp: '2025-04-30 14:28:35' 
      },
      { 
        id: 2, 
        source: 'Google', 
        campaign: 'New Customer', 
        revenue: '$120.00', 
        time_ago: '15 min ago',
        timestamp: '2025-04-30 14:15:22' 
      },
      { 
        id: 3, 
        source: 'TikTok', 
        campaign: 'Product Launch', 
        revenue: '$75.50', 
        time_ago: '32 min ago',
        timestamp: '2025-04-30 13:58:12' 
      },
      { 
        id: 4, 
        source: 'Facebook', 
        campaign: 'Retargeting', 
        revenue: '$89.99', 
        time_ago: '1 hour ago',
        timestamp: '2025-04-30 13:30:45' 
      },
      { 
        id: 5, 
        source: 'Google', 
        campaign: 'Holiday Special', 
        revenue: '$59.95', 
        time_ago: '1 hour ago',
        timestamp: '2025-04-30 13:27:18' 
      }
    ]
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("week");
  const [timeRange, setTimeRange] = useState("week"); // day, week, month, year
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConversionsLoading, setIsConversionsLoading] = useState(false);

  // Function to handle time range changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTimeRange(tab);
    // In a real application, this would trigger a new data fetch
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Simulate data change based on tab
      if (tab === 'today') {
        // Update with daily data
        setDashboardData(prev => ({
          ...prev,
          adSpend: { ...prev.adSpend, thisMonth: prev.adSpend.today },
          revenue: { ...prev.revenue, thisMonth: prev.revenue.today }
        }));
      } else if (tab === 'week') {
        // Reset to original weekly data
        setDashboardData(prev => ({
          ...prev,
          adSpend: { ...prev.adSpend, thisMonth: 324500 },
          revenue: { ...prev.revenue, thisMonth: 752000 }
        }));
      } else if (tab === 'month') {
        // Show monthly data (higher numbers)
        setDashboardData(prev => ({
          ...prev,
          adSpend: { ...prev.adSpend, thisMonth: 645000 },
          revenue: { ...prev.revenue, thisMonth: 1520000 }
        }));
      }
    }, 800);
  };

  // Function to refresh data
  const refreshData = () => {
    setIsRefreshing(true);
    
    // Simulate a real data refresh with loading states
    setIsConversionsLoading(true);
    
    setTimeout(() => {
      // Mock data update with new conversions
      const updatedConversions = [
        { 
          id: Math.floor(Math.random() * 10000), 
          source: 'Facebook', 
          campaign: 'Summer Flash Sale', 
          revenue: '$' + (Math.floor(Math.random() * 100) + 20) + '.00', 
          time_ago: 'Just now',
          timestamp: '2025-04-30 14:30:00' 
        },
        ...dashboardData.recentConversions.slice(0, 4)
      ];
      
      setDashboardData(prev => ({
        ...prev,
        recentConversions: updatedConversions,
        postbackStatus: {
          ...prev.postbackStatus,
          lastUpdated: 'Just now'
        }
      }));
      
      setIsConversionsLoading(false);
      setIsRefreshing(false);
    }, 800);
  };

  // Effect to simulate fetching postback data on mount
  useEffect(() => {
    // Simulate a postback system check
    const checkPostbackSystem = async () => {
      try {
        // In a real app, you would fetch postback status from your API
        // const response = await axios.get('/api/postback/status');
        // setPostbackStatus(response.data);
        
        // For demo, we'll just use the mock data
        console.log('Postback system check complete');
      } catch (error) {
        console.error('Error checking postback system:', error);
      }
    };
    
    checkPostbackSystem();
  }, []);

  // Calculate ROAS
  function calculateRoas(revenue, adSpend) {
    return adSpend === 0 ? 0 : ((revenue / adSpend) * 100).toFixed(1);
  }

  // Helper function to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Chart theme matching RedTrack style
  const chartTheme = {
    backgroundColor: [
      'rgba(85, 105, 255, 0.7)',  // Primary blue
      'rgba(71, 201, 122, 0.7)',  // Success green
      'rgba(255, 183, 77, 0.7)',  // Warning orange
      'rgba(245, 61, 87, 0.7)',   // Error red
      'rgba(156, 39, 176, 0.7)',  // Purple
      'rgba(0, 188, 212, 0.7)',   // Cyan
    ],
    borderColor: [
      'rgb(85, 105, 255)',     // Primary blue
      'rgb(71, 201, 122)',     // Success green
      'rgb(255, 183, 77)',     // Warning orange
      'rgb(245, 61, 87)',      // Error red
      'rgb(156, 39, 176)',     // Purple
      'rgb(0, 188, 212)',      // Cyan
    ],
    gridColor: 'rgba(243, 244, 246, 1)',
    textColor: 'rgba(91, 96, 132, 1)',
    tooltipBgColor: 'rgba(16, 17, 39, 0.95)'
  };

  // Chart.js options for consistent styling
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: chartTheme.textColor,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBgColor,
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: chartTheme.textColor,
          font: {
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: chartTheme.gridColor
        },
        ticks: {
          color: chartTheme.textColor,
          font: {
            family: "'Inter', sans-serif"
          },
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  // Prepare data for Revenue vs Ad Spend chart
  const revenueVsAdSpendData = {
    labels: dashboardData.dailyData.map(item => item.name),
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData.dailyData.map(item => item.revenue),
        backgroundColor: chartTheme.backgroundColor[1],
        borderColor: chartTheme.borderColor[1],
        borderWidth: 1,
        borderRadius: 6
      },
      {
        label: 'Ad Spend',
        data: dashboardData.dailyData.map(item => item.adSpend),
        backgroundColor: chartTheme.backgroundColor[0],
        borderColor: chartTheme.borderColor[0],
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  // Prepare data for Monthly Trends chart
  const monthlyTrendsData = {
    labels: dashboardData.revenueData.map(item => item.name),
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData.revenueData.map(item => item.value),
        borderColor: chartTheme.borderColor[1],
        backgroundColor: 'rgba(71, 201, 122, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'white',
        pointBorderColor: chartTheme.borderColor[1],
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Ad Spend',
        data: dashboardData.adSpendData.map(item => item.value),
        borderColor: chartTheme.borderColor[0],
        backgroundColor: 'rgba(85, 105, 255, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'white',
        pointBorderColor: chartTheme.borderColor[0],
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  // Prepare data for Campaign Performance chart
  const campaignPerformanceData = {
    labels: dashboardData.campaignPerformance.map(item => item.name),
    datasets: [
      {
        data: dashboardData.campaignPerformance.map(item => item.value),
        backgroundColor: chartTheme.backgroundColor,
        borderColor: chartTheme.borderColor,
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  // Doughnut chart options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: chartTheme.textColor,
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBgColor,
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        boxPadding: 6,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatCurrency(context.raw);
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems={{ xs: "flex-start", md: "center" }} justifyContent="space-between">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "text.primary" }}>
                Marketing Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Performance analytics for {timeRange === "today" ? "Today" : timeRange === "week" ? "This Week" : "This Month"}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, justifyContent: { md: "flex-end" } }}>
              <ButtonGroup 
                variant="contained" 
                disableElevation 
                sx={{ 
                  bgcolor: "background.paper", 
                  "& .MuiButton-root": { 
                    color: "text.secondary",
                    borderColor: "divider",
                    "&.active": {
                      bgcolor: "primary.main",
                      color: "white"
                    }
                  } 
                }}
              >
                <Button 
                  className={activeTab === "today" ? "active" : ""}
                  onClick={() => handleTabChange("today")}
                >
                  Today
                </Button>
                <Button 
                  className={activeTab === "week" ? "active" : ""}
                  onClick={() => handleTabChange("week")}
                >
                  This Week
                </Button>
                <Button 
                  className={activeTab === "month" ? "active" : ""}
                  onClick={() => handleTabChange("month")}
                >
                  This Month
                </Button>
              </ButtonGroup>
              
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon className={isRefreshing ? "animate-spin" : ""} />}
                onClick={refreshData}
                disabled={isRefreshing}
                sx={{ whiteSpace: "nowrap" }}
              >
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Key Metrics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <StatsCard
              title="Ad Spend"
              value={formatCurrency(dashboardData.adSpend.thisMonth)}
              change={((dashboardData.adSpend.today - dashboardData.adSpend.yesterday) / dashboardData.adSpend.yesterday) * 100}
              icon={<AccountBalanceWalletIcon sx={{ fontSize: 28 }} />}
              color="primary"
              borderColor={theme.palette.primary.main}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <StatsCard
              title="Revenue"
              value={formatCurrency(dashboardData.revenue.thisMonth)}
              change={((dashboardData.revenue.today - dashboardData.revenue.yesterday) / dashboardData.revenue.yesterday) * 100}
              icon={<AttachMoneyIcon sx={{ fontSize: 28 }} />}
              color="success"
              borderColor={theme.palette.success.main}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <StatsCard
              title="ROAS"
              value={`${calculateRoas(dashboardData.revenue.thisMonth, dashboardData.adSpend.thisMonth)}%`}
              change={dashboardData.roas.today - dashboardData.roas.yesterday}
              icon={<PercentIcon sx={{ fontSize: 28 }} />}
              color="warning"
              borderColor={theme.palette.warning.main}
            />
          </Grid>
        </Grid>

        {/* Conversion Stats and Postback Status */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <ConversionStatsCard
                  title="Total Conversions"
                  value={dashboardData.conversionMetrics.total.toLocaleString()}
                  previousValue={dashboardData.conversionMetrics.previousTotal}
                  icon={<CheckCircleIcon sx={{ fontSize: 24 }} />}
                  color="primary"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ConversionStatsCard
                  title="Approved Conversions"
                  value={dashboardData.conversionMetrics.approved.toLocaleString()}
                  previousValue={dashboardData.conversionMetrics.previousApproved}
                  icon={<CheckIcon sx={{ fontSize: 24 }} />}
                  color="success"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ConversionStatsCard
                  title="Pending Conversions"
                  value={dashboardData.conversionMetrics.pending.toLocaleString()}
                  previousValue={dashboardData.conversionMetrics.previousPending}
                  icon={<HelpOutlineIcon sx={{ fontSize: 24 }} />}
                  color="warning"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ConversionStatsCard
                  title="Rejected Conversions"
                  value={dashboardData.conversionMetrics.rejected.toLocaleString()}
                  previousValue={dashboardData.conversionMetrics.previousRejected}
                  icon={<CloseIcon sx={{ fontSize: 24 }} />}
                  color="error"
                />
              </Grid>
            </Grid>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <PostbackStatusCard
              status={dashboardData.postbackStatus.status}
              lastUpdated={dashboardData.postbackStatus.lastUpdated}
              sources={dashboardData.postbackStatus.sources}
            />
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Revenue vs Ad Spend
                </Typography>
                <Box sx={{ height: 360 }}>
                  {dashboardData.dailyData.length > 0 ? (
                    <Bar data={revenueVsAdSpendData} options={chartOptions} />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Campaign Performance
                </Typography>
                <Box sx={{ height: 360 }}>
                  {dashboardData.campaignPerformance.length > 0 ? (
                    <Doughnut data={campaignPerformanceData} options={doughnutOptions} />
                  ) : (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        bgcolor: "background.default",
                        borderRadius: 1,
                      }}
                    >
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Conversions and Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <RecentConversionsCard 
              conversions={dashboardData.recentConversions}
              isLoading={isConversionsLoading}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <QuickActionsCard />
          </Grid>
        </Grid>

        {/* Monthly Trend */}
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Monthly Trends
            </Typography>
            <Box sx={{ height: 400 }}>
              {dashboardData.revenueData.length > 0 && dashboardData.adSpendData.length > 0 ? (
                <Line data={monthlyTrendsData} options={chartOptions} />
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    bgcolor: "background.default",
                    borderRadius: 1,
                  }}
                >
                  <Typography color="text.secondary">No data available</Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Campaign Table */}
        <Card>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Best Performing Campaigns
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Chip 
                  label={`${dashboardData.campaignPerformance.length} campaigns`} 
                  size="small" 
                  sx={{ bgcolor: "background.default", color: "text.secondary" }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={<AddIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  New Campaign
                </Button>
              </Box>
            </Box>
            
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Campaign</TableCell>
                    <TableCell>Revenue</TableCell>
                    <TableCell>Conversions</TableCell>
                    <TableCell>ROAS</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData.campaignPerformance.map((campaign, index) => {
                    // Calculate adSpend as percentage of revenue (dynamic calculation)
                    const adSpend = campaign.value * (0.3 + Math.random() * 0.3); // Random between 30-60% for demo
                    const roas = calculateRoas(campaign.value, adSpend);
                    return (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 500, color: "text.primary" }}>{campaign.name}</Typography>
                        </TableCell>
                        <TableCell>{formatCurrency(campaign.value)}</TableCell>
                        <TableCell>{campaign.conversions.toLocaleString()}</TableCell>
                        <TableCell>{roas}%</TableCell>
                        <TableCell>
                          <Chip
                            icon={<CircleIcon sx={{ fontSize: 8 }} />}
                            label={roas > 200 ? "Excellent" : roas > 120 ? "Good" : "Needs Improvement"}
                            size="small"
                            sx={{
                              bgcolor: roas > 200 
                                ? "success.light" 
                                : roas > 120 
                                ? "warning.light" 
                                : "error.light",
                              color: roas > 200 
                                ? "success.dark" 
                                : roas > 120 
                                ? "warning.dark" 
                                : "error.dark",
                              "& .MuiChip-icon": {
                                color: roas > 200 
                                  ? "success.main" 
                                  : roas > 120 
                                  ? "warning.main" 
                                  : "error.main",
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" sx={{ color: "text.secondary" }}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" sx={{ color: "text.secondary" }}>
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Layout>
    </ThemeProvider>
  );
}