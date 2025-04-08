import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "./Layout";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [authUrl, setAuthUrl] = useState("");
  const [fbAuthUrl, setFbAuthUrl] = useState("");
  const [refreshToken, setRefreshToken] = useState("");

  useEffect(() => {
    // Fetch Campaigns
    const fetchCampaigns = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/campaigns");
        setCampaigns(response.data);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };
    fetchCampaigns();

    // Get Google Auth URL
    const getAuthUrl = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/google");
        setAuthUrl(response.data.authUrl);
      } catch (error) {
        console.error("Error fetching Google auth URL:", error);
      }
    };
    getAuthUrl();

    // Get Facebook Auth URL
    const getFacebookAuthUrl = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/facebook");
        setFbAuthUrl(response.data.authUrl);
      } catch (error) {
        console.error("Error fetching Facebook auth URL:", error);
      }
    };
    getFacebookAuthUrl();
  }, []);

  // Handle Google Login Redirect
  const handleGoogleLogin = () => {
    if (authUrl) {
      window.location.href = authUrl;
    } else {
      console.error("Google authentication URL not available.");
    }
  };

  // Handle Facebook Login Redirect
  const handleFacebookLogin = () => {
    if (fbAuthUrl) {
      window.location.href = fbAuthUrl;
    } else {
      console.error("Facebook authentication URL not available.");
    }
  };

  // Fetch Google Ads Campaigns After Login
  const fetchGoogleAdsCampaigns = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/auth/google/campaigns?refresh_token=${refreshToken}`);
      setCampaigns(response.data);
    } catch (error) {
      console.error("Error fetching Google Ads campaigns:", error);
    }
  };

  return (
    <Layout>
      <div style={{ marginTop: "80px", padding: "20px" }}>
        <h2>Campaigns</h2>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          style={{
            marginBottom: "10px",
            padding: "10px 15px",
            backgroundColor: "#4285F4",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            borderRadius: "5px",
            fontSize: "16px",
            marginRight: "10px",
          }}
        >
          Login with Google
        </button>

        {/* Facebook Login Button */}
        <button
          onClick={handleFacebookLogin}
          style={{
            marginBottom: "10px",
            padding: "10px 15px",
            backgroundColor: "#1877F2",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            borderRadius: "5px",
            fontSize: "16px",
          }}
        >
          Login with Facebook
        </button>

        {/* Fetch Google Ads Campaigns Button */}
        {refreshToken && (
          <button
            onClick={fetchGoogleAdsCampaigns}
            style={{
              marginTop: "10px",
              padding: "10px 15px",
              backgroundColor: "#0F9D58",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              borderRadius: "5px",
              fontSize: "16px",
            }}
          >
            Fetch Google Ads Campaigns
          </button>
        )}

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Traffic Channel</th>
              <th>Clicks</th>
              <th>LP Clicks</th>
              <th>Conversion</th>
              <th>Total Revenue</th>
              <th>Cost</th>
              <th>Profit</th>
              <th>ROI</th>
              <th>EPC</th>
              <th>LP Views</th>
              <th>Impressions</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign, index) => (
              <tr key={index}>
                <td>{campaign.campaign_status}</td>
                <td>{campaign.traffic_channel_name}</td>
                <td>{campaign.clicks}</td>
                <td>{campaign.lp_clicks}</td>
                <td>{campaign.conversion}</td>
                <td>${campaign.total_revenue.toFixed(2)}</td>
                <td>${campaign.cost.toFixed(2)}</td>
                <td>${campaign.profit.toFixed(2)}</td>
                <td>{campaign.total_roi.toFixed(2)}%</td>
                <td>${campaign.epc.toFixed(2)}</td>
                <td>{campaign.lp_views}</td>
                <td>{campaign.impressions}</td>
                <td>{campaign.Tags}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default Campaigns;
