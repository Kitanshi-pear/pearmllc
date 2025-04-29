import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard"; 
import TrafficChannels from "./components/TrafficChannels";
import Offers from "./components/Offers";
import OfferSource from "./components/OfferSource";
import DomainsPage from "./components/Domains";
import LandingPage from "./components/Landers";
import CampaignsPage from "./components/Campaigns";
import AdminPanelPage from "./components/AdminPanelPage";
import ClickLogs from "../src/components/logs/click-log";
import ConversionLogs from "../src/components/logs/conversion-log";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminPanelPage />} />
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/traffic-channels" element={<TrafficChannels />} />
        <Route path="/logs/click-log" element={<ClickLogs />} />
        <Route path="/logs/conversion-log" element={<ConversionLogs />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/offer-source" element={<OfferSource />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/landers" element={<LandingPage />} />
      </Routes>
    </Router>
  );
};

export default App;