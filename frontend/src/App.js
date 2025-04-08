import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Campaigns from "./components/Campaigns";
import TrafficChannels from "./components/TrafficChannels";
import Offers from "./components/Offers";
import OfferSource from "./components/OfferSource";
import DomainsPage from "./components/Domains";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/traffic-channels" element={<TrafficChannels />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/offer-source" element={<OfferSource />} />
        <Route path="/domains" element={<DomainsPage />} />
      </Routes>
    </Router>
  );
};

export default App;
