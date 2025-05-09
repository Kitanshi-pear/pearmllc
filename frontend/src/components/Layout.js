import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext"; // Add this import
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CssBaseline,
  Avatar,
  Tooltip,
  ListItemIcon,
  Collapse,
  useMediaQuery,
  useTheme,
  Container,
  alpha
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import EmailIcon from "@mui/icons-material/Email";
import ListAltIcon from "@mui/icons-material/ListAlt";
import TrafficIcon from "@mui/icons-material/Traffic";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import SourceIcon from "@mui/icons-material/Source";
import DomainIcon from "@mui/icons-material/Language";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ClickIcon from "@mui/icons-material/TouchApp";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import pmLogo from "./pm1.png"; // Path to the transparent logo

const drawerWidth = 280;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  
  // Get the logout function from AuthContext
  const { logout } = useAuth();
  
  // Handle logout function
  const handleLogout = () => {
    logout();
    navigate("/");
  };
  
  // Get current path for active state highlighting
  const currentPath = location.pathname;
  
  useEffect(() => {
    // Close mobile drawer after navigation on mobile
    if (isMobile && mobileOpen) {
      setMobileOpen(false);
    }
  }, [currentPath, isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab === activeTab ? null : tab);
  };

  const userEmail = localStorage.getItem("userEmail") || "user@example.com";

  const navigateToDashboard = () => {
    navigate("/dashboard");
  };

  // Helper function to check if a path is active
  const isActive = (path) => {
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  // Effect to open the logs tab if we're on a logs page
  useEffect(() => {
    if (currentPath.includes("/logs/")) {
      setActiveTab("logs");
    }
  }, [currentPath]);

  // Elegant black and sea green theme colors
  const elegantTheme = {
    primary: {
      main: "#1c2a35", // Deep charcoal black
      light: "#2d3c49", // Medium charcoal
      dark: "#121920", // Very dark charcoal
      contrastText: "#ffffff" // White text
    },
    secondary: {
      main: "#20b2aa", // Sea green
      light: "#4ebeaf", // Light sea green
      dark: "#187f79", // Dark sea green
      contrastText: "#ffffff" // White text
    },
    accent: {
      light: "#e0f2f1", // Very light sea green
      main: "#b2dfdb", // Light sea green background
      highlight: "#80cbc4" // Medium sea green highlight
    },
    background: {
      paper: "#ffffff", // Pure white for paper background
      default: "#f5f7f9", // Very light bluish-gray for default background
      dark: "#1c2a35" // Dark charcoal for contrast areas
    }
  };

  const drawer = (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "background.paper",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column"
      }}
    >

      {/* Navigation Menu */}
      <List component="nav" sx={{ flexGrow: 1, px: 1 }}>
        <ListItem
          button
          component={Link}
          to="/dashboard"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/dashboard") ? elegantTheme.secondary.main : "transparent",
            color: isActive("/dashboard") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/dashboard") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        <ListItem
          button
          component={Link}
          to="/admin"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/admin") ? elegantTheme.secondary.main : "transparent",
            color: isActive("/admin") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/admin") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <AdminPanelSettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Admin Panel" />
        </ListItem>

        <ListItem
          button
          component={Link}
          to="/campaigns"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/campaigns") ? elegantTheme.secondary.main : "transparent",
            color: isActive("/campaigns") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/campaigns") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Campaigns" />
        </ListItem>

        <ListItem
          button
          component={Link}
          to="/traffic-channels"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/traffic-channels") ? elegantTheme.secondary.main : "transparent",
            color: isActive("/traffic-channels") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/traffic-channels") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <TrafficIcon />
          </ListItemIcon>
          <ListItemText primary="Traffic Channels" />
        </ListItem>

        <ListItem
          button
          component={Link}
          to="/offers"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/offers") ? elegantTheme.secondary.main : "transparent",
            color: isActive("/offers") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/offers") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <LocalOfferIcon />
          </ListItemIcon>
          <ListItemText primary="Offers" />
        </ListItem>

        <ListItem
          button
          component={Link}
          to="/offer-source"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/offer-source") ? elegantTheme.secondary.main : "transparent",
            color: isActive("/offer-source") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/offer-source") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <SourceIcon />
          </ListItemIcon>
          <ListItemText primary="Offer Source" />
        </ListItem>

        <ListItem
          button
          onClick={() => handleTabClick("logs")}
          sx={{
            borderRadius: 2,
            mb: activeTab === "logs" ? 0 : 1,
            backgroundColor: currentPath.includes("/logs") ? elegantTheme.secondary.main : "transparent",
            color: currentPath.includes("/logs") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: currentPath.includes("/logs") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <ListAltIcon />
          </ListItemIcon>
          <ListItemText primary="Logs" />
          {activeTab === "logs" ? <ExpandLess /> : <ExpandMore />}
        </ListItem>

        <Collapse in={activeTab === "logs"} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem
              button
              component={Link}
              to="/logs/click-log"
              sx={{
                pl: 4,
                borderRadius: 2,
                ml: 2,
                mb: 1,
                backgroundColor: isActive("/logs/click-log") ? elegantTheme.secondary.main : alpha(elegantTheme.secondary.light, 0.1),
                color: isActive("/logs/click-log") ? "#ffffff" : "text.primary",
                "&:hover": {
                  backgroundColor: elegantTheme.secondary.light,
                  color: "#ffffff",
                  "& .MuiListItemIcon-root": {
                    color: "#ffffff"
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive("/logs/click-log") ? "#ffffff" : elegantTheme.secondary.main,
                minWidth: 40
              }}>
                <ClickIcon />
              </ListItemIcon>
              <ListItemText primary="Click Logs" />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/logs/conversion-log"
              sx={{
                pl: 4,
                borderRadius: 2,
                ml: 2,
                mb: 1,
                backgroundColor: isActive("/logs/conversion-log") ? elegantTheme.secondary.main : alpha(elegantTheme.secondary.light, 0.1),
                color: isActive("/logs/conversion-log") ? "#ffffff" : "text.primary",
                "&:hover": {
                  backgroundColor: elegantTheme.secondary.light,
                  color: "#ffffff",
                  "& .MuiListItemIcon-root": {
                    color: "#ffffff"
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive("/logs/conversion-log") ? "#ffffff" : elegantTheme.secondary.main,
                minWidth: 40
              }}>
                <SwapHorizIcon />
              </ListItemIcon>
              <ListItemText primary="Conversion Logs" />
            </ListItem>
          </List>
        </Collapse>

        <ListItem
          button
          component={Link}
          to="/landers"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/landers") ? elegantTheme.secondary.main : "transparent",
            color: isActive("/landers") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/landers") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <VisibilityIcon />
          </ListItemIcon>
          <ListItemText primary="Landers" />
        </ListItem>

        <ListItem
          button
          component={Link}
          to="/domains"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/domains") ? elegantTheme.secondary.main : "transparent",
            color: isActive("/domains") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: elegantTheme.secondary.light,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/domains") ? "#ffffff" : elegantTheme.secondary.main,
            minWidth: 40
          }}>
            <DomainIcon />
          </ListItemIcon>
          <ListItemText primary="Domains" />
        </ListItem>
      </List>

      {/* Logout Button - Updated to use handleLogout function */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <ListItem
          button
          onClick={handleLogout}
          sx={{
            borderRadius: 2,
            backgroundColor: elegantTheme.primary.main,
            color: "#ffffff",
            "&:hover": {
              backgroundColor: elegantTheme.primary.light,
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)"
            },
            transition: "all 0.2s ease"
          }}
        >
          <ListItemIcon sx={{ color: "#ffffff", minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: `linear-gradient(135deg, ${elegantTheme.primary.dark}, ${elegantTheme.primary.main})`,
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid",
          borderColor: alpha("#ffffff", 0.1),
          transition: "all 0.3s ease"
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { md: "none" },
                "&:hover": {
                  backgroundColor: alpha("#ffffff", 0.1),
                  transform: "rotate(90deg)",
                  transition: "transform 0.3s ease"
                }
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Clickable logo */}
            <Box
              sx={{ 
                display: "flex", 
                alignItems: "center", 
                cursor: "pointer",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "scale(1.05)"
                }
              }}
              onClick={navigateToDashboard}
            >
              <Avatar 
                src={pmLogo} 
                alt="PearMedia" 
                sx={{ 
                  width: 45, 
                  height: 45, 
                  mr: 2,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  p: 0.5,
                  backgroundColor: "white",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                  }
                }} 
              />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  letterSpacing: 0.5,
                  background: "linear-gradient(45deg, #ffffff, #b2dfdb)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent"
                }}
              >
                PearMedia
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title={userEmail}>
              <Box sx={{ 
                display: "flex", 
                alignItems: "center",
                px: 2,
                py: 1,
                borderRadius: 2,
                backgroundColor: alpha("#ffffff", 0.07),
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: alpha("#ffffff", 0.15),
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
                }
              }}>
                <EmailIcon sx={{ mr: 1, color: elegantTheme.secondary.main }} />
                <Typography 
                  variant="body2"
                  sx={{
                    display: { xs: "none", sm: "block" }
                  }}
                >
                  {userEmail}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            borderRight: "none",
            top: 64,
            height: "calc(100% - 64px)"
          },
          display: { xs: "none", md: "block" },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: "border-box",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 2, md: 3 },
          px: { xs: 2, md: 4 },
          pb: 3,
          mt: "64px",
          backgroundColor: elegantTheme.background.default,
          minHeight: "calc(100vh - 64px)",
          transition: "all 0.3s ease",
        }}
      >
        <Container maxWidth="xl" disableGutters>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;