import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import TrafficChannels from "./components/TrafficChannels";
import Offers from "./components/Offers";
import OfferSource from "./components/OfferSource";
import DomainsPage from "./components/Domains";
import LandingPage from "./components/Landers";
import CampaignsPage from "./components/Campaigns";
import AdminPanelPage from "./components/AdminPanelPage";
import ClickLogs from "./components/ClickLogs";
import ConversionLogs from "./components/ConversionLogs";
// Remove Logout import since we're handling logout in Layout component
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./components/AuthContext";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          
          {/* Protected Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanelPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/campaigns" 
            element={
              <ProtectedRoute>
                <CampaignsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/traffic-channels" 
            element={
              <ProtectedRoute>
                <TrafficChannels />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logs/click-log" 
            element={
              <ProtectedRoute>
                <ClickLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logs/conversion-log" 
            element={
              <ProtectedRoute>
                <ConversionLogs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/offers" 
            element={
              <ProtectedRoute>
                <Offers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/offer-source" 
            element={
              <ProtectedRoute>
                <OfferSource />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/domains" 
            element={
              <ProtectedRoute>
                <DomainsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/landers" 
            element={
              <ProtectedRoute>
                <LandingPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route - redirect to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;