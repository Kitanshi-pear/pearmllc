import React, { useState, useEffect } from "react";
import Layout from "./Layout";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, Tooltip, Legend, 
  CartesianGrid, XAxis, YAxis, ResponsiveContainer 
} from "recharts";
import { Calendar, ArrowUp, ArrowDown, DollarSign, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("today");

  // Sample data for charts
  const revenueData = [
    { name: "Jan", value: 3200 },
    { name: "Feb", value: 2800 },
    { name: "Mar", value: 3900 },
    { name: "Apr", value: 4720 },
    { name: "May", value: 5100 },
    { name: "Jun", value: 4800 }
  ];

  const adSpendData = [
    { name: "Jan", value: 2700 },
    { name: "Feb", value: 2900 },
    { name: "Mar", value: 3200 },
    { name: "Apr", value: 4621 },
    { name: "May", value: 4100 },
    { name: "Jun", value: 3800 }
  ];

  const dailyData = [
    { name: "Mon", revenue: 520, adSpend: 410 },
    { name: "Tue", revenue: 380, adSpend: 290 },
    { name: "Wed", revenue: 670, adSpend: 380 },
    { name: "Thu", revenue: 440, adSpend: 320 },
    { name: "Fri", revenue: 540, adSpend: 291 },
    { name: "Sat", revenue: 620, adSpend: 410 },
    { name: "Sun", revenue: 360, adSpend: 106 }
  ];

  const campaignPerformance = [
    { name: "New-antivirus-Newdomain", value: 360, conversions: 119 },
    { name: "Security-Premium", value: 240, conversions: 76 },
    { name: "Aqua Sculpt 1", value: 180, conversions: 42 },
    { name: "Anti-Malware-Pro", value: 120, conversions: 36 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const calculateRoas = (revenue, adSpend) => {
    return adSpend === 0 ? 0 : ((revenue / adSpend) * 100).toFixed(1);
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Marketing Dashboard</h1>
          <div className="flex items-center bg-white rounded-lg shadow-sm p-1">
            <button 
              className={`px-4 py-2 rounded-md ${activeTab === "today" ? "bg-blue-500 text-white" : "text-gray-600"}`}
              onClick={() => setActiveTab("today")}
            >
              Today
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${activeTab === "week" ? "bg-blue-500 text-white" : "text-gray-600"}`}
              onClick={() => setActiveTab("week")}
            >
              This Week
            </button>
            <button 
              className={`px-4 py-2 rounded-md ${activeTab === "month" ? "bg-blue-500 text-white" : "text-gray-600"}`}
              onClick={() => setActiveTab("month")}
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
                <h3 className="text-2xl font-bold text-gray-800">$4,621.78</h3>
                <div className="flex items-center mt-2">
                  <ArrowUp size={16} className="text-red-500 mr-1" />
                  <p className="text-sm text-red-500">12.4% vs last month</p>
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
                <h3 className="text-2xl font-bold text-gray-800">$4,720.00</h3>
                <div className="flex items-center mt-2">
                  <ArrowUp size={16} className="text-green-500 mr-1" />
                  <p className="text-sm text-green-500">8.2% vs last month</p>
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
                <h3 className="text-2xl font-bold text-gray-800">{calculateRoas(4720, 4621)}%</h3>
                <div className="flex items-center mt-2">
                  <ArrowDown size={16} className="text-red-500 mr-1" />
                  <p className="text-sm text-red-500">3.7% vs last month</p>
                </div>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp size={24} className="text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Ad Spend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={dailyData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAdSpend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="adSpend"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorAdSpend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Campaign Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={campaignPerformance}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name}: $${value}`}
                >
                  {campaignPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={revenueData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Legend />
              <Bar dataKey="value" name="Revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign Table */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Best Performing Campaigns</h3>
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
                {campaignPerformance.map((campaign, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{campaign.name}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">${campaign.value.toFixed(2)}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">{campaign.conversions}</td>
                    <td className="py-4 px-4 text-sm text-gray-800">
                      {calculateRoas(campaign.value, campaign.value * 0.4)}%
                    </td>
                    <td className="py-4 px-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        index % 3 === 0 ? 'bg-green-100 text-green-800' : 
                        index % 3 === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Pending' : 'Running'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;