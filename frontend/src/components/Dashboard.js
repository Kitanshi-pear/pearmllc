import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { Calendar, ArrowUp, ArrowDown, DollarSign, TrendingUp } from "lucide-react";

const Dashboard = () => {
  // States for dynamic data
  const [dashboardData, setDashboardData] = useState({
    adSpend: { today: 0, yesterday: 0, thisMonth: 0 },
    revenue: { today: 0, yesterday: 0, thisMonth: 0 },
    roas: { today: 0, yesterday: 0 },
    campaignPerformance: [],
    revenueData: [],
    adSpendData: [],
    dailyData: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("today");
  const [timeRange, setTimeRange] = useState("week"); // day, week, month, year

  // Fetch dashboard data based on the selected time range
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Replace with your actual API endpoints
        const response = await fetch(`/api/dashboard?timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        // Use sample data for demonstration if API fails
        setDashboardData({
          adSpend: { today: 106.73, yesterday: 291.26, thisMonth: 4621.78 },
          revenue: { today: 360.00, yesterday: 540.00, thisMonth: 4720.00 },
          roas: { 
            today: calculateRoas(360.00, 106.73), 
            yesterday: calculateRoas(540.00, 291.26) 
          },
          campaignPerformance: [
            { name: "New-antivirus-Newdomain", value: 360, conversions: 119 },
            { name: "Security-Premium", value: 240, conversions: 76 },
            { name: "Aqua Sculpt 1", value: 180, conversions: 42 },
            { name: "Anti-Malware-Pro", value: 120, conversions: 36 }
          ],
          revenueData: [
            { name: "Jan", value: 3200 },
            { name: "Feb", value: 2800 },
            { name: "Mar", value: 3900 },
            { name: "Apr", value: 4720 },
            { name: "May", value: 5100 },
            { name: "Jun", value: 4800 }
          ],
          adSpendData: [
            { name: "Jan", value: 2700 },
            { name: "Feb", value: 2900 },
            { name: "Mar", value: 3200 },
            { name: "Apr", value: 4621 },
            { name: "May", value: 4100 },
            { name: "Jun", value: 3800 }
          ],
          dailyData: [
            { name: "Mon", revenue: 520, adSpend: 410 },
            { name: "Tue", revenue: 380, adSpend: 290 },
            { name: "Wed", revenue: 670, adSpend: 380 },
            { name: "Thu", revenue: 440, adSpend: 320 },
            { name: "Fri", revenue: 540, adSpend: 291 },
            { name: "Sat", revenue: 620, adSpend: 410 },
            { name: "Sun", revenue: 360, adSpend: 106 }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  // Function to handle time range changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTimeRange(tab); // Update the time range based on the selected tab
  };

  // Calculate ROAS
  function calculateRoas(revenue, adSpend) {
    return adSpend === 0 ? 0 : ((revenue / adSpend) * 100).toFixed(1);
  }

  // Helper function to format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Get max value for charts
  const getMaxValue = (data, key) => {
    if (!data || data.length === 0) return 100;
    return Math.max(...data.map(item => key ? item[key] : item.value)) * 1.2;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error && !dashboardData.adSpend) {
    return (
      <Layout>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Marketing Dashboard</h1>
          <div className="flex items-center bg-white rounded-lg shadow-sm p-1">
            <button 
              className={`px-4 py-2 rounded-md ${activeTab === "today" ? "bg-blue-500 text-white" : "text-gray-600"}`}
              onClick={() => handleTabChange("today")}
            >
              Today
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${activeTab === "week" ? "bg-blue-500 text-white" : "text-gray-600"}`}
              onClick={() => handleTabChange("week")}
            >
              This Week
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${activeTab === "month" ? "bg-blue-500 text-white" : "text-gray-600"}`}
              onClick={() => handleTabChange("month")}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition duration-300">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Ad Spend</p>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(dashboardData.adSpend.thisMonth)}</h3>
                <div className="flex items-center mt-2">
                  {dashboardData.adSpend.today > dashboardData.adSpend.yesterday ? (
                    <>
                      <ArrowUp size={16} className="text-red-500 mr-1" />
                      <p className="text-sm text-red-500">
                        {(((dashboardData.adSpend.today - dashboardData.adSpend.yesterday) / dashboardData.adSpend.yesterday) * 100).toFixed(1)}% vs yesterday
                      </p>
                    </>
                  ) : (
                    <>
                      <ArrowDown size={16} className="text-green-500 mr-1" />
                      <p className="text-sm text-green-500">
                        {(((dashboardData.adSpend.yesterday - dashboardData.adSpend.today) / dashboardData.adSpend.yesterday) * 100).toFixed(1)}% vs yesterday
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <DollarSign size={24} className="text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition duration-300">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Revenue</p>
                <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(dashboardData.revenue.thisMonth)}</h3>
                <div className="flex items-center mt-2">
                  {dashboardData.revenue.today > dashboardData.revenue.yesterday ? (
                    <>
                      <ArrowUp size={16} className="text-green-500 mr-1" />
                      <p className="text-sm text-green-500">
                        {(((dashboardData.revenue.today - dashboardData.revenue.yesterday) / dashboardData.revenue.yesterday) * 100).toFixed(1)}% vs yesterday
                      </p>
                    </>
                  ) : (
                    <>
                      <ArrowDown size={16} className="text-red-500 mr-1" />
                      <p className="text-sm text-red-500">
                        {(((dashboardData.revenue.yesterday - dashboardData.revenue.today) / dashboardData.revenue.yesterday) * 100).toFixed(1)}% vs yesterday
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign size={24} className="text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition duration-300">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">ROAS</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {calculateRoas(dashboardData.revenue.thisMonth, dashboardData.adSpend.thisMonth)}%
                </h3>
                <div className="flex items-center mt-2">
                  {dashboardData.roas.today > dashboardData.roas.yesterday ? (
                    <>
                      <ArrowUp size={16} className="text-green-500 mr-1" />
                      <p className="text-sm text-green-500">
                        {(dashboardData.roas.today - dashboardData.roas.yesterday).toFixed(1)}% vs yesterday
                      </p>
                    </>
                  ) : (
                    <>
                      <ArrowDown size={16} className="text-red-500 mr-1" />
                      <p className="text-sm text-red-500">
                        {(dashboardData.roas.yesterday - dashboardData.roas.today).toFixed(1)}% vs yesterday
                      </p>
                    </>
                  )}
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp size={24} className="text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Using CSS for visual representation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Ad Spend</h3>
            {dashboardData.dailyData.length > 0 ? (
              <div className="h-64">
                <div className="flex h-full">
                  {dashboardData.dailyData.map((item, index) => {
                    const maxValue = Math.max(
                      ...dashboardData.dailyData.map(d => Math.max(d.revenue, d.adSpend))
                    );
                    const revenueHeight = (item.revenue / maxValue) * 100;
                    const adSpendHeight = (item.adSpend / maxValue) * 100;
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col justify-end items-center mx-1">
                        <div className="w-full flex justify-center space-x-1">
                          <div
                            className="w-1/2 bg-green-200 hover:bg-green-300 transition-all relative group"
                            style={{ height: `${revenueHeight}%` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded p-1">
                              {formatCurrency(item.revenue)}
                            </div>
                          </div>
                          <div
                            className="w-1/2 bg-blue-200 hover:bg-blue-300 transition-all relative group"
                            style={{ height: `${adSpendHeight}%` }}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded p-1">
                              {formatCurrency(item.adSpend)}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs mt-2">{item.name}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center mt-4 space-x-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-200 mr-1"></div>
                    <span className="text-xs">Revenue</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-200 mr-1"></div>
                    <span className="text-xs">Ad Spend</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Performance</h3>
            {dashboardData.campaignPerformance.length > 0 ? (
              <div className="h-64">
                <div className="relative w-full h-full flex justify-center items-center">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full w-32 h-32 bg-gray-50"></div>
                  </div>
                  
                  {dashboardData.campaignPerformance.map((campaign, index) => {
                    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
                    const total = dashboardData.campaignPerformance.reduce((sum, c) => sum + c.value, 0);
                    const percentage = (campaign.value / total) * 100;
                    const rotation = index === 0 ? 0 : dashboardData.campaignPerformance
                      .slice(0, index)
                      .reduce((sum, c) => sum + (c.value / total) * 360, 0);
                    
                    return (
                      <div key={index} className="absolute inset-0">
                        <div className="relative w-full h-full">
                          <div
                            className="absolute w-full h-full"
                            style={{
                              clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.cos(((rotation + percentage * 3.6) * Math.PI) / 180)}% ${50 - 50 * Math.sin(((rotation + percentage * 3.6) * Math.PI) / 180)}%, ${50 + 50 * Math.cos((rotation * Math.PI) / 180)}% ${50 - 50 * Math.sin((rotation * Math.PI) / 180)}%)`,
                              backgroundColor: COLORS[index % COLORS.length],
                              transform: 'rotate(0deg)',
                              transformOrigin: 'center',
                              opacity: 0.8
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap justify-center mt-6 space-x-4">
                  {dashboardData.campaignPerformance.map((campaign, index) => {
                    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
                    return (
                      <div key={index} className="flex items-center mx-2 my-1">
                        <div className="w-3 h-3 mr-1" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                        <span className="text-xs">{campaign.name}: {formatCurrency(campaign.value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center h-64">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
          {dashboardData.revenueData.length > 0 && dashboardData.adSpendData.length > 0 ? (
            <div className="h-64">
              <div className="flex h-full items-end">
                {dashboardData.revenueData.map((item, index) => {
                  const maxValue = Math.max(
                    Math.max(...dashboardData.revenueData.map(d => d.value)),
                    Math.max(...dashboardData.adSpendData.map(d => d.value))
                  );
                  const revenueHeight = (item.value / maxValue) * 100;
                  const adSpendHeight = (dashboardData.adSpendData[index]?.value || 0) / maxValue * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col justify-end items-center mx-1">
                      <div className="w-full flex justify-center space-x-1">
                        <div
                          className="w-1/2 bg-green-500 hover:bg-green-600 transition-all relative group rounded-t"
                          style={{ height: `${revenueHeight}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded p-1">
                            {formatCurrency(item.value)}
                          </div>
                        </div>
                        <div
                          className="w-1/2 bg-blue-500 hover:bg-blue-600 transition-all relative group rounded-t"
                          style={{ height: `${adSpendHeight}%` }}
                        >
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs rounded p-1">
                            {formatCurrency(dashboardData.adSpendData[index]?.value || 0)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs mt-2">{item.name}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center mt-4 space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 mr-1"></div>
                  <span className="text-xs">Revenue</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 mr-1"></div>
                  <span className="text-xs">Ad Spend</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">No data available</p>
            </div>
          )}
        </div>

        {/* Campaign Table */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Best Performing Campaigns</h3>
          {dashboardData.campaignPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboardData.campaignPerformance.map((campaign, index) => {
                    // Assume adSpend is 40% of revenue for the sample data
                    const adSpend = campaign.value * 0.4;
                    const roas = calculateRoas(campaign.value, adSpend);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm font-medium text-gray-900">{campaign.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-800">{formatCurrency(campaign.value)}</td>
                        <td className="py-4 px-4 text-sm text-gray-800">{campaign.conversions}</td>
                        <td className="py-4 px-4 text-sm text-gray-800">{roas}%</td>
                        <td className="py-4 px-4 text-sm">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            roas > 200 ? 'bg-green-100 text-green-800' : 
                            roas > 120 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {roas > 200 ? 'Excellent' : roas > 120 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex justify-center items-center h-32">
              <p className="text-gray-500">No campaign data available</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;