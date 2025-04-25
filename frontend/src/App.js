import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import AdminPanelPage from "./components/AdminPanelPage";
import TrafficChannels from "./components/TrafficChannels";
import Offers from "./components/Offers";
import OfferSource from "./components/OfferSource";
import DomainsPage from "./components/Domains";
import LandingPage from "./components/Landers";
import CampaignsPage from "./components/Campaigns";
import Layout from "./components/Layout"; // Import your Layout

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Routes that use the Layout with Sidebar */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin-panel" element={<AdminPanelPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/traffic-channels" element={<TrafficChannels />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/offer-source" element={<OfferSource />} />
          <Route path="/domains" element={<DomainsPage />} />
          <Route path="/landers" element={<LandingPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
