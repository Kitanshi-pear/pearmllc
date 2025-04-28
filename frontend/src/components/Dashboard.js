import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { Calendar, ArrowUp, ArrowDown, DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

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
  const [activeTab, setActiveTab] = useState("week");
  const [timeRange, setTimeRange] = useState("week"); // day, week, month, year
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch dashboard data based on the selected time range
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch data from your API endpoint
        const response = await fetch(`/api/dashboard?timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchDashboardData();
  }, [timeRange, isRefreshing]);

  // Function to handle time range changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setTimeRange(tab);
  };

  // Function to refresh data
  const refreshData = () => {
    setIsRefreshing(true);
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

  // Modern chart theme
  const chartTheme = {
    backgroundColor: [
      'rgba(99, 102, 241, 0.7)',
      'rgba(16, 185, 129, 0.7)',
      'rgba(245, 158, 11, 0.7)',
      'rgba(239, 68, 68, 0.7)',
      'rgba(139, 92, 246, 0.7)',
      'rgba(20, 184, 166, 0.7)'
    ],
    borderColor: [
      'rgb(99, 102, 241)',
      'rgb(16, 185, 129)',
      'rgb(245, 158, 11)',
      'rgb(239, 68, 68)',
      'rgb(139, 92, 246)',
      'rgb(20, 184, 166)'
    ],
    gridColor: 'rgba(243, 244, 246, 1)',
    textColor: 'rgba(107, 114, 128, 1)',
    tooltipBgColor: 'rgba(17, 24, 39, 0.9)'
  };

  // Chart.js options for consistent styling
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: chartTheme.textColor,
          font: {
            family: "'Inter', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBgColor,
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: chartTheme.textColor,
          font: {
            family: "'Inter', sans-serif"
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: chartTheme.gridColor
        },
        ticks: {
          color: chartTheme.textColor,
          font: {
            family: "'Inter', sans-serif"
          },
          callback: function(value) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  // Prepare data for Revenue vs Ad Spend chart
  const revenueVsAdSpendData = {
    labels: dashboardData.dailyData.map(item => item.name),
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData.dailyData.map(item => item.revenue),
        backgroundColor: chartTheme.backgroundColor[1],
        borderColor: chartTheme.borderColor[1],
        borderWidth: 1,
        borderRadius: 4
      },
      {
        label: 'Ad Spend',
        data: dashboardData.dailyData.map(item => item.adSpend),
        backgroundColor: chartTheme.backgroundColor[0],
        borderColor: chartTheme.borderColor[0],
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  // Prepare data for Monthly Trends chart
  const monthlyTrendsData = {
    labels: dashboardData.revenueData.map(item => item.name),
    datasets: [
      {
        label: 'Revenue',
        data: dashboardData.revenueData.map(item => item.value),
        borderColor: chartTheme.borderColor[1],
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'white',
        pointBorderColor: chartTheme.borderColor[1],
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Ad Spend',
        data: dashboardData.adSpendData.map(item => item.value),
        borderColor: chartTheme.borderColor[0],
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'white',
        pointBorderColor: chartTheme.borderColor[0],
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  // Prepare data for Campaign Performance chart
  const campaignPerformanceData = {
    labels: dashboardData.campaignPerformance.map(item => item.name),
    datasets: [
      {
        data: dashboardData.campaignPerformance.map(item => item.value),
        backgroundColor: chartTheme.backgroundColor,
        borderColor: chartTheme.borderColor,
        borderWidth: 2,
        hoverOffset: 10
      }
    ]
  };

  // Doughnut chart options (for Campaign Performance)
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          color: chartTheme.textColor,
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: chartTheme.tooltipBgColor,
        titleColor: 'white',
        bodyColor: 'white',
        padding: 12,
        cornerRadius: 8,
        boxPadding: 6,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = formatCurrency(context.raw);
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (isLoading && !dashboardData.dailyData.length) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen p-4 lg:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Marketing Dashboard</h1>
            <p className="text-gray-500 mt-1">Analytics and performance metrics</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center bg-white rounded-lg shadow-sm p-1">
              <button 
                className={`px-3 py-2 text-sm rounded-md transition-all ${activeTab === "today" ? "bg-indigo-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => handleTabChange("today")}
              >
                Today
              </button>
              <button 
                className={`px-3 py-2 text-sm rounded-md transition-all ${activeTab === "week" ? "bg-indigo-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => handleTabChange("week")}
              >
                This Week
              </button>
              <button 
                className={`px-3 py-2 text-sm rounded-md transition-all ${activeTab === "month" ? "bg-indigo-500 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                onClick={() => handleTabChange("month")}
              >
                This Month
              </button>
            </div>
            
            <button 
              className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 px-4 py-2 rounded-lg shadow-sm transition-all"
              onClick={refreshData}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} /> 
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Error loading data: {error}. Showing cached or sample data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-indigo-500 hover:shadow-md transition duration-300">
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
              <div className="bg-indigo-100 p-3 rounded-lg">
                <DollarSign size={24} className="text-indigo-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500 hover:shadow-md transition duration-300">
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
              <div className="bg-emerald-100 p-3 rounded-lg">
                <DollarSign size={24} className="text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500 hover:shadow-md transition duration-300">
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
              <div className="bg-amber-100 p-3 rounded-lg">
                <TrendingUp size={24} className="text-amber-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Using Chart.js */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Ad Spend</h3>
            <div className="h-64">
              {dashboardData.dailyData.length > 0 ? (
                <Bar data={revenueVsAdSpendData} options={chartOptions} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Performance</h3>
            <div className="h-64">
              {dashboardData.campaignPerformance.length > 0 ? (
                <Doughnut data={campaignPerformanceData} options={doughnutOptions} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
          <div className="h-64">
            {dashboardData.revenueData.length > 0 && dashboardData.adSpendData.length > 0 ? (
              <Line data={monthlyTrendsData} options={chartOptions} />
            ) : (
              <div className="flex justify-center items-center h-full">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Table */}
        <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Best Performing Campaigns</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{dashboardData.campaignPerformance.length} campaigns</span>
          </div>
          
          {dashboardData.campaignPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 rounded-tl-lg">Campaign</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Revenue</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Conversions</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">ROAS</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 rounded-tr-lg">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.campaignPerformance.map((campaign, index) => {
                    // Calculate adSpend as percentage of revenue (dynamic calculation)
                    const adSpend = campaign.value * (0.3 + Math.random() * 0.3); // Random between 30-60% for demonstration
                    const roas = calculateRoas(campaign.value, adSpend);
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">{campaign.name}</td>
                        <td className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{formatCurrency(campaign.value)}</td>
                        <td className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{campaign.conversions.toLocaleString()}</td>
                        <td className="py-4 px-4 text-sm text-gray-700 whitespace-nowrap">{roas}%</td>
                        <td className="py-4 px-4 text-sm whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs inline-flex items-center font-medium rounded-full ${
                            roas > 200 ? 'bg-green-100 text-green-800' : 
                            roas > 120 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                              roas > 200 ? 'bg-green-600' : 
                              roas > 120 ? 'bg-amber-600' : 'bg-red-600'
                            }`}></span>
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
            <div className="flex justify-center items-center h-32 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No campaign data available</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;