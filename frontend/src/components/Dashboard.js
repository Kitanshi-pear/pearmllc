
import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import "./Dashboard.css";


const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  return (
    <Layout>
      <div className="dashboard">
        <h1 className="dashboard-title">Dashboard</h1>

        <div className="dashboard-metrics">
          <div className="metric-box ad-spend">
            <h3>Ad Spend</h3>
            <p>Today: <strong>$106.73</strong></p>
            <p>Yesterday: <strong>$291.26</strong></p>
            <p>This Month: <strong>$4621.78</strong></p>
          </div>
          <div className="metric-box revenue">
            <h3>Revenue</h3>
            <p>Today: <strong>$360.00</strong></p>
            <p>Yesterday: <strong>$540.00</strong></p>
            <p>This Month: <strong>$4720.00</strong></p>
          </div>
          <div className="metric-box roas">
            <h3>ROAS</h3>
            <p>Today: <strong>$3.37 / 337.30%</strong></p>
            <p>Yesterday: <strong>$1.85 / 185.40%</strong></p>
          </div>
        </div>

        <div className="dashboard-tables">
          <div className="table-box">
            <h3>Best Performing Campaigns</h3>
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Revenue</th>
                  <th>Conversions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>New-antivirus-Newdomain</td>
                  <td>$360.00</td>
                  <td>119</td>
                </tr>
                <tr>
                  <td>Aqua Sculpt 1</td>
                  <td>$0.00</td>
                  <td>0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
