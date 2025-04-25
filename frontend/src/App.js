import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Import your page components here
import AdminPanel from "./pages/AdminPanel";
import CampaignsPage from "./pages/CampaignsPage";
import TrafficChannelsPage from "./pages/TrafficChannelsPage";
import OffersPage from "./pages/OffersPage";
import OfferSourcePage from "./pages/OfferSourcePage";
import ClickLogsPage from "./pages/ClickLogsPage";
import ConversionLogsPage from "./pages/ConversionLogsPage";
import LandersPage from "./pages/LandersPage";
import DomainsPage from "./pages/DomainsPage";

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
