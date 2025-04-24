import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Divider,
  Tooltip
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
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ClickIcon from "@mui/icons-material/TouchApp";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import pmLogo from "./pm1.png"; // Path to the transparent logo

const drawerWidth = 260;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab === activeTab ? null : tab);
  };

  const userEmail = localStorage.getItem("userEmail") || "user@example.com";

  const navigateToFirstTab = () => {
    navigate("/dashboard");
  };

  const drawer = (
    <Box
      sx={{
        width: drawerWidth,
        height: "100%",
        bgcolor: "#ffffff",
        color: "#333",
        display: "flex",
        flexDirection: "column",
        boxShadow: "3px 0 10px rgba(0,0,0,0.1)"
      }}>


      <List>
        <Tooltip title="Admin Panel" placement="right">
          <ListItem button component={Link} to="/Admin Panel">
            <AdminPanelSettingsIcon sx={{ mr: 2 }} />
            <ListItemText primary="Admin panel" />
          </ListItem>
        </Tooltip>

        <Tooltip title="Campaigns" placement="right">
          <ListItem button component={Link} to="/campaigns">
            <HomeIcon sx={{ mr: 2 }} />
            <ListItemText primary="Campaigns" />
          </ListItem>
        </Tooltip>

        <Tooltip title="Traffic Channels" placement="right">
          <ListItem button component={Link} to="/traffic-channels">
            <TrafficIcon sx={{ mr: 2 }} />
            <ListItemText primary="Traffic Channels" />
          </ListItem>
        </Tooltip>

        <Tooltip title="Offers" placement="right">
          <ListItem button component={Link} to="/offers">
            <LocalOfferIcon sx={{ mr: 2 }} />
            <ListItemText primary="Offers" />
          </ListItem>
        </Tooltip>

        <Tooltip title="Offer Source" placement="right">
          <ListItem button component={Link} to="/offer-source">
            <SourceIcon sx={{ mr: 2 }} />
            <ListItemText primary="Offer Source" />
          </ListItem>
        </Tooltip>

        <ListItem button onClick={() => handleTabClick("logs")}>
          <ListAltIcon sx={{ mr: 2 }} />
          <ListItemText primary="Logs" />
        </ListItem>

        {activeTab === "logs" && (
          <Box sx={{ pl: 4 }}>
            <ListItem button component={Link} to="/logs/click-logs">
              <ClickIcon sx={{ mr: 2 }} />
              <ListItemText primary="Click Logs" />
            </ListItem>
            <ListItem button component={Link} to="/logs/conversion-logs">
              <SwapHorizIcon sx={{ mr: 2 }} />
              <ListItemText primary="Conversion Logs" />
            </ListItem>
          </Box>
        )}

        <Tooltip title="Landers" placement="right">
          <ListItem button component={Link} to="/landers">
            <VisibilityIcon sx={{ mr: 2 }} />
            <ListItemText primary="Landers" />
          </ListItem>
        </Tooltip>

        <Tooltip title="Domains" placement="right">
          <ListItem button component={Link} to="/domains">
            <DomainIcon sx={{ mr: 2 }} />
            <ListItemText primary="Domains" />
          </ListItem>
        </Tooltip>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "#263238",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Clickable logo */}
          <Box
            sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={navigateToFirstTab}
          >
            <Avatar src={pmLogo} alt="PearMedia" sx={{ width: 40, height: 40, mr: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#ffffff" }}>
              PearMedia Dashboard
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          <Tooltip title="User Email" placement="bottom">
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <EmailIcon sx={{ mr: 1 }} />
              <Typography variant="body1">{userEmail}</Typography>
            </Box>
          </Tooltip>
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
            top: 64,
          },
          display: { xs: "none", sm: "block" },
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
          display: { xs: "block", sm: "none" },
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: "#f5f5f5",
          minHeight: "100vh",
          mt: 8,
          overflowY: "auto",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
