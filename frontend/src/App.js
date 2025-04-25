import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Import your page components here
import AdminPanel from "./components/AdminPanel";
import CampaignsPage from "./components/CampaignsPage";
import TrafficChannelsPage from "./components/TrafficChannelsPage";
import OffersPage from "./components/OffersPage";
import OfferSourcePage from "./components/OfferSourcePage";
import ClickLogsPage from "./components/ClickLogsPage";
import ConversionLogsPage from "./components/ConversionLogsPage";
import LandersPage from "./components/LandersPage";
import DomainsPage from "./components/DomainsPage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/traffic-channels" element={<TrafficChannelsPage />} />
          <Route path="/offers" element={<OffersPage />} />
          <Route path="/offer-source" element={<OfferSourcePage />} />
          <Route path="/logs/click-logs" element={<ClickLogsPage />} />
          <Route path="/logs/conversion-logs" element={<ConversionLogsPage />} />
          <Route path="/landers" element={<LandersPage />} />
          <Route path="/domains" element={<DomainsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
