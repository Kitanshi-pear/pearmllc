// src/components/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import Layout from './Layout';
import { chartTheme } from '../utils/chartConfig';
// Note: The chart registration is already done when importing chartConfig

const Dashboard = () => {
  const [lineChartData, setLineChartData] = useState({
    labels: [],
    datasets: []
  });
  
  const [barChartData, setBarChartData] = useState({
    labels: [],
    datasets: []
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    const fetchData = async () => {
      try {
        // Replace with your actual API calls
        // const response = await fetch('your-api-endpoint');
        // const data = await response.json();
        
        // Sample data for line chart
        const mockLineData = {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          traffic: [65, 59, 80, 81, 56, 55, 40],
          revenue: [70, 62, 85, 90, 60, 59, 45]
        };
        
        // Sample data for bar chart
        const mockBarData = {
          labels: ['Facebook', 'Google', 'TikTok', 'Instagram', 'Twitter'],
          visits: [120, 190, 80, 110, 75],
          conversions: [50, 80, 20, 40, 15]
        };
        
        // Set line chart data
        setLineChartData({
          labels: mockLineData.labels,
          datasets: [
            {
              label: 'Traffic',
              data: mockLineData.traffic,
              borderColor: chartTheme.colors.primary,
              backgroundColor: chartTheme.colors.primaryLight,
              fill: true,  // This now works with Filler plugin registered
            },
            {
              label: 'Revenue',
              data: mockLineData.revenue,
              borderColor: chartTheme.colors.secondary,
              backgroundColor: chartTheme.colors.secondaryLight,
              fill: true,  // This now works with Filler plugin registered
            }
          ]
        });
        
        // Set bar chart data
        setBarChartData({
          labels: mockBarData.labels,
          datasets: [
            {
              label: 'Visits',
              data: mockBarData.visits,
              backgroundColor: chartTheme.colors.primaryLight,
              borderColor: chartTheme.colors.primary,
              borderWidth: 1,
            },
            {
              label: 'Conversions',
              data: mockBarData.conversions,
              backgroundColor: chartTheme.colors.secondaryLight,
              borderColor: chartTheme.colors.secondary,
              borderWidth: 1,
            }
          ]
        });
        
        setLoading(false);
        console.log("Postback system check complete");
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Line chart options
  const lineChartOptions = {
    ...chartTheme.defaultOptions,
    plugins: {
      ...chartTheme.defaultOptions.plugins,
      title: {
        display: true,
        text: 'Performance Overview',
      },
    }
  };
  
  // Bar chart options
  const barChartOptions = {
    ...chartTheme.defaultOptions,
    plugins: {
      ...chartTheme.defaultOptions.plugins,
      title: {
        display: true,
        text: 'Traffic Source Analysis',
      },
    }
  };

  return (
    <Layout>
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        
        <div className="chart-grid">
          <div className="chart-card">
            <h2>Performance Trends</h2>
            {loading ? (
              <div className="loading">Loading chart data...</div>
            ) : (
              <Line options={lineChartOptions} data={lineChartData} />
            )}
          </div>
          
          <div className="chart-card">
            <h2>Traffic Sources</h2>
            {loading ? (
              <div className="loading">Loading chart data...</div>
            ) : (
              <Bar options={barChartOptions} data={barChartData} />
            )}
          </div>
        </div>
        
        {/* Add more dashboard widgets as needed */}
      </div>
    </Layout>
  );
};

export default Dashboard;