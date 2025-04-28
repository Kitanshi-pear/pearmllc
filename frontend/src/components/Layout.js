import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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

  // Enhanced modern green theme colors
  const greenTheme = {
    primary: {
      main: "#2e7d32", // Medium green
      light: "#4caf50", // Light green
      dark: "#1b5e20", // Dark green
      contrastText: "#ffffff" // White text
    },
    secondary: {
      main: "#81c784", // Lighter accent green
      light: "#c8e6c9", // Very light green
      dark: "#388e3c", // Medium-dark green
      contrastText: "#1b5e20" // Dark green text for contrast
    },
    background: {
      paper: "#f9fbf9", // Very light green tint for paper
      default: "#f0f4f0" // Light green tint for default background
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
      {/* User Profile Section */}
      <Box
        sx={{
          py: 3,
          px: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          borderBottom: 1,
          borderColor: "divider",
          background: `linear-gradient(135deg, ${alpha(greenTheme.primary.main, 0.1)}, ${alpha(greenTheme.primary.light, 0.2)})`,
          mb: 2
        }}
      >
        <Avatar
          sx={{
            width: 80,
            height: 80,
            mb: 2,
            backgroundColor: greenTheme.primary.main,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.05)",
              boxShadow: "0 6px 16px rgba(0,0,0,0.2)"
            }
          }}
        >
          <AccountCircleIcon sx={{ fontSize: 50, color: "#ffffff" }} />
        </Avatar>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
          {userEmail}
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <List component="nav" sx={{ flexGrow: 1, px: 1 }}>
        <ListItem
          button
          component={Link}
          to="/dashboard"
          sx={{
            borderRadius: 2,
            mb: 1,
            backgroundColor: isActive("/dashboard") ? greenTheme.primary.light : "transparent",
            color: isActive("/dashboard") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/dashboard") ? "#ffffff" : greenTheme.primary.main,
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
            backgroundColor: isActive("/admin") ? greenTheme.primary.light : "transparent",
            color: isActive("/admin") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/admin") ? "#ffffff" : greenTheme.primary.main,
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
            backgroundColor: isActive("/campaigns") ? greenTheme.primary.light : "transparent",
            color: isActive("/campaigns") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/campaigns") ? "#ffffff" : greenTheme.primary.main,
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
            backgroundColor: isActive("/traffic-channels") ? greenTheme.primary.light : "transparent",
            color: isActive("/traffic-channels") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/traffic-channels") ? "#ffffff" : greenTheme.primary.main,
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
            backgroundColor: isActive("/offers") ? greenTheme.primary.light : "transparent",
            color: isActive("/offers") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/offers") ? "#ffffff" : greenTheme.primary.main,
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
            backgroundColor: isActive("/offer-source") ? greenTheme.primary.light : "transparent",
            color: isActive("/offer-source") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/offer-source") ? "#ffffff" : greenTheme.primary.main,
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
            backgroundColor: currentPath.includes("/logs") ? greenTheme.primary.light : "transparent",
            color: currentPath.includes("/logs") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: currentPath.includes("/logs") ? "#ffffff" : greenTheme.primary.main,
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
              to="/logs/click-logs"
              sx={{
                pl: 4,
                borderRadius: 2,
                ml: 2,
                mb: 1,
                backgroundColor: isActive("/logs/click-logs") ? greenTheme.primary.light : alpha(greenTheme.primary.light, 0.1),
                color: isActive("/logs/click-logs") ? "#ffffff" : "text.primary",
                "&:hover": {
                  backgroundColor: greenTheme.primary.main,
                  color: "#ffffff",
                  "& .MuiListItemIcon-root": {
                    color: "#ffffff"
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive("/logs/click-logs") ? "#ffffff" : greenTheme.primary.main,
                minWidth: 40
              }}>
                <ClickIcon />
              </ListItemIcon>
              <ListItemText primary="Click Logs" />
            </ListItem>
            <ListItem
              button
              component={Link}
              to="/logs/conversion-logs"
              sx={{
                pl: 4,
                borderRadius: 2,
                ml: 2,
                mb: 1,
                backgroundColor: isActive("/logs/conversion-logs") ? greenTheme.primary.light : alpha(greenTheme.primary.light, 0.1),
                color: isActive("/logs/conversion-logs") ? "#ffffff" : "text.primary",
                "&:hover": {
                  backgroundColor: greenTheme.primary.main,
                  color: "#ffffff",
                  "& .MuiListItemIcon-root": {
                    color: "#ffffff"
                  }
                }
              }}
            >
              <ListItemIcon sx={{ 
                color: isActive("/logs/conversion-logs") ? "#ffffff" : greenTheme.primary.main,
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
            backgroundColor: isActive("/landers") ? greenTheme.primary.light : "transparent",
            color: isActive("/landers") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/landers") ? "#ffffff" : greenTheme.primary.main,
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
            backgroundColor: isActive("/domains") ? greenTheme.primary.light : "transparent",
            color: isActive("/domains") ? "#ffffff" : "text.primary",
            "&:hover": {
              backgroundColor: greenTheme.primary.main,
              color: "#ffffff",
              "& .MuiListItemIcon-root": {
                color: "#ffffff"
              }
            }
          }}
        >
          <ListItemIcon sx={{ 
            color: isActive("/domains") ? "#ffffff" : greenTheme.primary.main,
            minWidth: 40
          }}>
            <DomainIcon />
          </ListItemIcon>
          <ListItemText primary="Domains" />
        </ListItem>
      </List>

      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
        <ListItem
          button
          component={Link}
          to="/logout"
          sx={{
            borderRadius: 2,
            backgroundColor: alpha(greenTheme.primary.dark, 0.8),
            color: "#ffffff",
            "&:hover": {
              backgroundColor: greenTheme.primary.dark,
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(27, 94, 32, 0.3)"
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
          background: `linear-gradient(135deg, ${greenTheme.primary.dark}, ${greenTheme.primary.main})`,
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid",
          borderColor: alpha(greenTheme.primary.light, 0.2),
          transition: "all 0.3s ease",
          "&:hover": {
            background: `linear-gradient(135deg, ${greenTheme.primary.main}, ${greenTheme.primary.dark})`,
          }
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
                  backgroundColor: alpha("#ffffff", 0.2),
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
                  background: "linear-gradient(45deg, #ffffff, #e0e0e0)",
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
                backgroundColor: alpha("#ffffff", 0.1),
                transition: "all 0.3s ease",
                "&:hover": {
                  backgroundColor: alpha("#ffffff", 0.2),
                }
              }}>
                <EmailIcon sx={{ mr: 1 }} />
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
          backgroundColor: greenTheme.background.default,
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