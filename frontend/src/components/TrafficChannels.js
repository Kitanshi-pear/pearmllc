import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Row, Col, Card, Table, Button, 
  Modal, Form, Tabs, Tab, Badge, Spinner, Alert, 
  OverlayTrigger, Tooltip 
} from 'react-bootstrap';
import { 
  PlusCircle, Pencil, Trash2, RefreshCw, 
  Facebook, Google, Link, Calendar,
  BarChart2, Settings, ExternalLink, 
  DollarSign, Activity, List, Key 
} from 'react-feather';
import DateRangePicker from 'react-bootstrap-daterangepicker';
import 'bootstrap-daterangepicker/daterangepicker.css';
import Layout from "./Layout";
import './TrafficChannels.css';

// Using the correct API endpoint
const API_BASE_URL = 'https://pearmllc.onrender.com/api/traffic';

const TrafficChannelsPage = () => {
  // State variables
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [channelForm, setChannelForm] = useState({
    channelName: '',
    aliasChannel: 'Custom',
    costUpdateDepth: 30,
    costUpdateFrequency: 'daily',
    currency: 'USD',
    s2sPostbackUrl: '',
    clickRefId: '',
    externalId: '',
    pixelId: '',
    apiAccessToken: '',
    defaultEventName: 'Purchase',
    customConversionMatching: false,
    googleAdsAccountId: '',
    googleMccAccountId: '',
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date()
  });
  const [authStatus, setAuthStatus] = useState({
    facebook: { connected: false },
    google: { connected: false }
  });
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [channelMetrics, setChannelMetrics] = useState([]);
  const [showConversionSettingsModal, setShowConversionSettingsModal] = useState(false);
  const [conversionSettings, setConversionSettings] = useState({
    forward_to_facebook: false,
    forward_to_google: false,
    conversion_id: '',
    conversion_label: '',
    default_event_name: 'Purchase'
  });

  // Channel alias options (traffic sources)
  const channelAliasOptions = [
    { value: 'Custom', label: 'Custom' },
    { value: 'Facebook', label: 'Facebook' },
    { value: 'Google', label: 'Google Ads' },
    { value: 'TikTok', label: 'TikTok' },
    { value: 'Taboola', label: 'Taboola' },
    { value: 'Outbrain', label: 'Outbrain' },
    { value: 'Twitter', label: 'Twitter Ads' },
    { value: 'Snapchat', label: 'Snapchat' },
    { value: 'Pinterest', label: 'Pinterest' },
  ];

  // Fetch all traffic channels
  const fetchChannels = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}`);
      setChannels(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching traffic channels:', err);
      setError('Failed to load traffic channels. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Check OAuth status
  const checkAuthStatus = async () => {
    try {
      // Get session token from localStorage if available
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (sessionToken) {
        const response = await axios.get(`${API_BASE_URL}/auth/status`, {
          headers: {
            Authorization: `Bearer ${sessionToken}`
          }
        });
        
        setAuthStatus(response.data);
      }
    } catch (err) {
      console.error('Error checking auth status:', err);
    }
  };

  // Fetch channel details
  const fetchChannelDetails = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      setSelectedChannel(response.data);
      
      // Fetch channel metrics
      const metricsResponse = await axios.get(
        `${API_BASE_URL}/${id}/metrics`,
        {
          params: {
            start_date: dateRange.startDate.toISOString().split('T')[0],
            end_date: dateRange.endDate.toISOString().split('T')[0],
            dimension: 'day'
          }
        }
      );
      
      setChannelMetrics(metricsResponse.data);
    } catch (err) {
      console.error('Error fetching channel details:', err);
      setError('Failed to load channel details. Please try again.');
    }
  };

  // Fetch conversion settings
  const fetchConversionSettings = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${id}/conversion-settings`);
      
      setConversionSettings({
        forward_to_facebook: response.data.facebook.enabled,
        forward_to_google: response.data.google.enabled,
        conversion_id: response.data.google.conversion_id,
        conversion_label: response.data.google.conversion_label,
        default_event_name: response.data.facebook.default_event_name
      });
    } catch (err) {
      console.error('Error fetching conversion settings:', err);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchChannels();
    checkAuthStatus();
    
    // Check URL for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      const platform = urlParams.get('platform');
      const sessionToken = urlParams.get('session');
      
      if (sessionToken) {
        localStorage.setItem('sessionToken', sessionToken);
      }
      
      // Show success message
      setError(`Successfully connected to ${platform}!`);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Refresh auth status
      checkAuthStatus();
    }
  }, []);

  // Handle adding a new channel
  const handleAddChannel = async () => {
    try {
      const response = await axios.post(API_BASE_URL, channelForm);
      setChannels([...channels, response.data]);
      setShowAddModal(false);
      resetChannelForm();
    } catch (err) {
      console.error('Error adding channel:', err);
      setError('Failed to add channel. Please try again.');
    }
  };

  // Handle updating a channel
  const handleUpdateChannel = async () => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/${currentChannel.id}`, 
        channelForm
      );
      
      setChannels(channels.map(channel => 
        channel.id === currentChannel.id ? response.data : channel
      ));
      
      setShowEditModal(false);
      resetChannelForm();
    } catch (err) {
      console.error('Error updating channel:', err);
      setError('Failed to update channel. Please try again.');
    }
  };

  // Handle deleting a channel
  const handleDeleteChannel = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/${currentChannel.id}`);
      setChannels(channels.filter(channel => channel.id !== currentChannel.id));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting channel:', err);
      setError('Failed to delete channel. Please try again.');
    }
  };

  // Handle saving conversion settings
  const handleSaveConversionSettings = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/${currentChannel.id}/conversion-settings`,
        conversionSettings
      );
      
      setShowConversionSettingsModal(false);
      
      // Refresh channel details if needed
      if (selectedChannel && selectedChannel.id === currentChannel.id) {
        fetchChannelDetails(currentChannel.id);
      }
    } catch (err) {
      console.error('Error saving conversion settings:', err);
      setError('Failed to save conversion settings. Please try again.');
    }
  };

  // Reset form state
  const resetChannelForm = () => {
    setChannelForm({
      channelName: '',
      aliasChannel: 'Custom',
      costUpdateDepth: 30,
      costUpdateFrequency: 'daily',
      currency: 'USD',
      s2sPostbackUrl: '',
      clickRefId: '',
      externalId: '',
      pixelId: '',
      apiAccessToken: '',
      defaultEventName: 'Purchase',
      customConversionMatching: false,
      googleAdsAccountId: '',
      googleMccAccountId: '',
    });
  };

  // Handle edit button click
  const handleEditClick = (channel) => {
    setCurrentChannel(channel);
    setChannelForm({
      channelName: channel.channelName,
      aliasChannel: channel.aliasChannel,
      costUpdateDepth: channel.costUpdateDepth,
      costUpdateFrequency: channel.costUpdateFrequency,
      currency: channel.currency,
      s2sPostbackUrl: channel.s2sPostbackUrl,
      clickRefId: channel.clickRefId,
      externalId: channel.externalId,
      pixelId: channel.pixelId,
      apiAccessToken: channel.apiAccessToken,
      defaultEventName: channel.defaultEventName,
      customConversionMatching: channel.customConversionMatching,
      googleAdsAccountId: channel.googleAdsAccountId,
      googleMccAccountId: channel.googleMccAccountId,
    });
    setShowEditModal(true);
  };

  // Handle delete button click
  const handleDeleteClick = (channel) => {
    setCurrentChannel(channel);
    setShowDeleteModal(true);
  };

  // Handle channel selection for details view
  const handleChannelSelect = (channel) => {
    setSelectedChannel(null); // Clear previous selection
    setActiveTab('overview');
    fetchChannelDetails(channel.id);
  };

  // Handle date range change
  const handleDateRangeChange = (event, picker) => {
    setDateRange({
      startDate: picker.startDate.toDate(),
      endDate: picker.endDate.toDate()
    });
    
    // Refresh metrics if a channel is selected
    if (selectedChannel) {
      fetchChannelDetails(selectedChannel.id);
    }
  };

  // Handle conversion settings button click
  const handleConversionSettingsClick = (channel) => {
    setCurrentChannel(channel);
    fetchConversionSettings(channel.id);
    setShowConversionSettingsModal(true);
  };

  // OAuth connection handlers
  const connectFacebook = () => {
    window.location.href = `${API_BASE_URL}/auth/facebook`;
  };

  const connectGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const disconnectGoogle = async () => {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (sessionToken) {
        await axios.post(
          `${API_BASE_URL}/auth/google/disconnect`,
          {},
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`
            }
          }
        );
        
        // Update auth status
        setAuthStatus({
          ...authStatus,
          google: { connected: false }
        });
        
        // Clear session if needed
        if (sessionToken.startsWith('google_')) {
          localStorage.removeItem('sessionToken');
        }
      }
    } catch (err) {
      console.error('Error disconnecting Google:', err);
      setError('Failed to disconnect Google. Please try again.');
    }
  };

  // Format currency
  const formatCurrency = (value, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  // Format number
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
  };

  // Calculate metrics
  const calculateMetrics = (channel) => {
    const metrics = channel.metrics || {};
    
    return {
      clicks: metrics.clicks || 0,
      conversions: metrics.conversions || 0,
      cr: ((metrics.conversions || 0) / (metrics.clicks || 1)) * 100,
      cost: metrics.cost || 0,
      revenue: metrics.revenue || 0,
      profit: (metrics.revenue || 0) - (metrics.cost || 0),
      roi: (((metrics.revenue || 0) - (metrics.cost || 0)) / (metrics.cost || 1)) * 100,
      cpc: (metrics.cost || 0) / (metrics.clicks || 1),
      cpa: (metrics.cost || 0) / (metrics.conversions || 1),
      epc: (metrics.revenue || 0) / (metrics.clicks || 1),
      rpm: ((metrics.revenue || 0) / (metrics.clicks || 1)) * 1000
    };
  };

  return (
    <Layout>
      <Container fluid className="traffic-channels-container">
        {/* Header with date range picker */}
        <Row className="header-row my-3">
          <Col md={6}>
            <h2>Traffic Channels</h2>
            <p className="text-muted">Manage your traffic sources and integrations</p>
          </Col>
          <Col md={6} className="text-right">
            <div className="d-flex justify-content-end align-items-center">
              <DateRangePicker
                initialSettings={{
                  startDate: dateRange.startDate,
                  endDate: dateRange.endDate,
                  ranges: {
                    'Today': [new Date(), new Date()],
                    'Yesterday': [new Date(new Date().setDate(new Date().getDate() - 1)), new Date(new Date().setDate(new Date().getDate() - 1))],
                    'Last 7 Days': [new Date(new Date().setDate(new Date().getDate() - 6)), new Date()],
                    'Last 30 Days': [new Date(new Date().setDate(new Date().getDate() - 29)), new Date()],
                    'This Month': [new Date(new Date().setDate(1)), new Date()]
                  }
                }}
                onApply={handleDateRangeChange}
              >
                <Button variant="outline-secondary">
                  <Calendar className="mr-2" size={16} />
                  {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
                </Button>
              </DateRangePicker>
              
              <Button 
                variant="primary" 
                className="ml-2" 
                onClick={() => setShowAddModal(true)}
              >
                <PlusCircle size={16} className="mr-1" /> Add Channel
              </Button>
            </div>
          </Col>
        </Row>

        {/* Error message */}
        {error && (
          <Alert 
            variant={error.includes('Successfully') ? 'success' : 'danger'} 
            dismissible 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Main content */}
        <Row>
          {/* First view: Channels list */}
          {!selectedChannel && (
            <Col md={12}>
              <Card>
                <Card.Body>
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Loading traffic channels...</p>
                    </div>
                  ) : channels.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="empty-state mb-4">
                        <Activity size={48} className="text-muted" />
                      </div>
                      <h4>No Traffic Channels Found</h4>
                      <p className="text-muted">Create your first traffic channel to start tracking</p>
                      <Button 
                        variant="primary" 
                        onClick={() => setShowAddModal(true)}
                      >
                        <PlusCircle size={16} className="mr-1" /> Add Channel
                      </Button>
                    </div>
                  ) : (
                    <Table responsive hover className="channels-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Type</th>
                          <th>Clicks</th>
                          <th>Conversions</th>
                          <th>CR %</th>
                          <th>Cost</th>
                          <th>Revenue</th>
                          <th>Profit</th>
                          <th>ROI %</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {channels.map(channel => {
                          const metrics = calculateMetrics(channel);
                          
                          return (
                            <tr key={channel.id}>
                              <td>
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleChannelSelect(channel);
                                  }}
                                  className="channel-name-link"
                                >
                                  {channel.channelName}
                                </a>
                                {channel.status === 'Inactive' && (
                                  <Badge variant="secondary" className="ml-2">Inactive</Badge>
                                )}
                              </td>
                              <td>
                                {channel.aliasChannel === 'Facebook' ? (
                                  <Badge variant="primary" className="source-badge">
                                    <Facebook size={12} className="mr-1" /> {channel.aliasChannel}
                                  </Badge>
                                ) : channel.aliasChannel === 'Google' ? (
                                  <Badge variant="danger" className="source-badge">
                                    <Google size={12} className="mr-1" /> {channel.aliasChannel}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="source-badge">
                                    {channel.aliasChannel}
                                  </Badge>
                                )}
                              </td>
                              <td>{formatNumber(metrics.clicks)}</td>
                              <td>{formatNumber(metrics.conversions)}</td>
                              <td>{metrics.cr.toFixed(2)}%</td>
                              <td>{formatCurrency(metrics.cost, channel.currency)}</td>
                              <td>{formatCurrency(metrics.revenue, channel.currency)}</td>
                              <td className={metrics.profit >= 0 ? 'text-success' : 'text-danger'}>
                                {formatCurrency(metrics.profit, channel.currency)}
                              </td>
                              <td className={metrics.roi >= 0 ? 'text-success' : 'text-danger'}>
                                {metrics.roi.toFixed(2)}%
                              </td>
                              <td className="actions-cell">
                                <Button
                                  variant="light"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => handleEditClick(channel)}
                                  title="Edit Channel"
                                >
                                  <Pencil size={16} />
                                </Button>
                                
                                <Button
                                  variant="light"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => handleConversionSettingsClick(channel)}
                                  title="Conversion Settings"
                                >
                                  <Settings size={16} />
                                </Button>
                                
                                <Button
                                  variant="light"
                                  size="sm"
                                  className="action-btn"
                                  onClick={() => handleDeleteClick(channel)}
                                  title="Delete Channel"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
              
              {/* API Integrations Card */}
              <Card className="mt-4">
                <Card.Header>
                  <h5 className="mb-0">API Integrations</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Card className="integration-card">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <Facebook size={24} className="text-primary mb-2" />
                              <h5>Facebook Ads</h5>
                              <p className="text-muted mb-0">
                                {authStatus.facebook.connected ? (
                                  <>Connected as {authStatus.facebook.email}</>
                                ) : (
                                  <>Connect to import costs and push conversions</>
                                )}
                              </p>
                            </div>
                            
                            <Button
                              variant={authStatus.facebook.connected ? "outline-secondary" : "outline-primary"}
                              onClick={connectFacebook}
                            >
                              {authStatus.facebook.connected ? "Reconnect" : "Connect"}
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    <Col md={6}>
                      <Card className="integration-card">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <Google size={24} className="text-danger mb-2" />
                              <h5>Google Ads</h5>
                              <p className="text-muted mb-0">
                                {authStatus.google.connected ? (
                                  <>Connected as {authStatus.google.email}</>
                                ) : (
                                  <>Connect to import costs and push conversions</>
                                )}
                              </p>
                            </div>
                            
                            {authStatus.google.connected ? (
                              <div>
                                <Button
                                  variant="outline-secondary"
                                  className="mr-2"
                                  onClick={connectGoogle}
                                >
                                  Reconnect
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  onClick={disconnectGoogle}
                                >
                                  Disconnect
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline-danger"
                                onClick={connectGoogle}
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          )}
          
          {/* Second view: Channel details */}
          {selectedChannel && (
            <>
              <Col md={12} className="mb-3">
                <Button 
                  variant="link" 
                  className="p-0" 
                  onClick={() => setSelectedChannel(null)}
                >
                  &lt; Back to Traffic Channels
                </Button>
              </Col>
              
              <Col md={12}>
                <Card className="channel-details-card">
                  <Card.Header>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h4 className="mb-0">
                          {selectedChannel.channelName}
                          {selectedChannel.status === 'Inactive' && (
                            <Badge variant="secondary" className="ml-2">Inactive</Badge>
                          )}
                        </h4>
                        <div className="mt-1">
                          {selectedChannel.aliasChannel === 'Facebook' ? (
                            <Badge variant="primary" className="source-badge">
                              <Facebook size={12} className="mr-1" /> {selectedChannel.aliasChannel}
                            </Badge>
                          ) : selectedChannel.aliasChannel === 'Google' ? (
                            <Badge variant="danger" className="source-badge">
                              <Google size={12} className="mr-1" /> {selectedChannel.aliasChannel}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="source-badge">
                              {selectedChannel.aliasChannel}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <Button
                          variant="outline-secondary"
                          className="mr-2"
                          onClick={() => {
                            handleEditClick(selectedChannel);
                          }}
                        >
                          <Pencil size={16} className="mr-1" /> Edit
                        </Button>
                        
                        <Button
                          variant="outline-primary"
                          onClick={() => {
                            handleConversionSettingsClick(selectedChannel);
                          }}
                        >
                          <Settings size={16} className="mr-1" /> Conversion Settings
                        </Button>
                      </div>
                    </div>
                  </Card.Header>
                  
                  <Card.Body>
                    {/* Metrics summary */}
                    <div className="metrics-summary mb-4">
                      <Row>
                        {[
                          { label: 'Clicks', value: formatNumber(selectedChannel.metrics?.clicks || 0), icon: <ExternalLink size={20} /> },
                          { label: 'Conversions', value: formatNumber(selectedChannel.metrics?.conversions || 0), icon: <Activity size={20} /> },
                          { label: 'Cost', value: formatCurrency(selectedChannel.metrics?.cost || 0, selectedChannel.currency), icon: <DollarSign size={20} /> },
                          { label: 'Revenue', value: formatCurrency(selectedChannel.metrics?.revenue || 0, selectedChannel.currency), icon: <DollarSign size={20} /> },
                          { label: 'Profit', value: formatCurrency((selectedChannel.metrics?.revenue || 0) - (selectedChannel.metrics?.cost || 0), selectedChannel.currency), 
                            className: (selectedChannel.metrics?.revenue || 0) - (selectedChannel.metrics?.cost || 0) >= 0 ? 'text-success' : 'text-danger',
                            icon: <DollarSign size={20} /> 
                          },
                          { 
                            label: 'ROI', 
                            value: `${(((selectedChannel.metrics?.revenue || 0) - (selectedChannel.metrics?.cost || 0)) / (selectedChannel.metrics?.cost || 1) * 100).toFixed(2)}%`,
                            className: ((selectedChannel.metrics?.revenue || 0) - (selectedChannel.metrics?.cost || 0)) / (selectedChannel.metrics?.cost || 1) * 100 >= 0 ? 'text-success' : 'text-danger',
                            icon: <BarChart2 size={20} />
                          }
                        ].map((metric, index) => (
                          <Col md={2} key={index}>
                            <Card className="metric-card">
                              <Card.Body>
                                <div className="d-flex align-items-center">
                                  <div className="metric-icon mr-3">
                                    {metric.icon}
                                  </div>
                                  <div>
                                    <div className="metric-label">{metric.label}</div>
                                    <div className={`metric-value ${metric.className || ''}`}>{metric.value}</div>
                                  </div>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    </div>
                    
                    {/* Tabs for different sections */}
                    <Tabs
                      activeKey={activeTab}
                      onSelect={(key) => setActiveTab(key)}
                      className="mb-4"
                    >
                      <Tab eventKey="overview" title="Overview">
                        <Card>
                          <Card.Body>
                            <h5>Performance Over Time</h5>
                            {/* Placeholder for chart - would use a library like Chart.js or Recharts */}
                            <div className="chart-placeholder">
                              {channelMetrics.length > 0 ? (
                                <p>Chart would be rendered here with {channelMetrics.length} data points</p>
                              ) : (
                                <p>No data available for the selected date range</p>
                              )}
                            </div>
                          </Card.Body>
                        </Card>
                      </Tab>
                      
                      <Tab eventKey="campaigns" title="Campaigns">
                        <Card>
                          <Card.Body>
                            <h5>Associated Campaigns</h5>
                            {selectedChannel.campaigns && selectedChannel.campaigns.length > 0 ? (
                              <Table responsive hover>
                                <thead>
                                  <tr>
                                    <th>Campaign</th>
                                    <th>Status</th>
                                    <th>Clicks</th>
                                    <th>Conversions</th>
                                    <th>CR %</th>
                                    <th>Cost</th>
                                    <th>Revenue</th>
                                    <th>Profit</th>
                                    <th>ROI %</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {selectedChannel.campaigns.map(campaign => (
                                    <tr key={campaign.id}>
                                      <td>{campaign.name}</td>
                                      <td>
                                        <Badge variant={campaign.status === 'Active' ? 'success' : 'secondary'}>
                                          {campaign.status}
                                        </Badge>
                                      </td>
                                      <td>{formatNumber(campaign.metrics?.clicks || 0)}</td>
                                      <td>{formatNumber(campaign.metrics?.conversions || 0)}</td>
                                      <td>
                                        {((campaign.metrics?.conversions || 0) / (campaign.metrics?.clicks || 1) * 100).toFixed(2)}%
                                      </td>
                                      <td>{formatCurrency(campaign.metrics?.cost || 0, selectedChannel.currency)}</td>
                                      <td>{formatCurrency(campaign.metrics?.revenue || 0, selectedChannel.currency)}</td>
                                      <td className={(campaign.metrics?.revenue || 0) - (campaign.metrics?.cost || 0) >= 0 ? 'text-success' : 'text-danger'}>
                                        {formatCurrency((campaign.metrics?.revenue || 0) - (campaign.metrics?.cost || 0), selectedChannel.currency)}
                                      </td>
                                      <td className={((campaign.metrics?.revenue || 0) - (campaign.metrics?.cost || 0)) / (campaign.metrics?.cost || 1) * 100 >= 0 ? 'text-success' : 'text-danger'}>
                                        {(((campaign.metrics?.revenue || 0) - (campaign.metrics?.cost || 0)) / (campaign.metrics?.cost || 1) * 100).toFixed(2)}%
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            ) : (
                              <div className="text-center py-4">
                                <p>No campaigns associated with this traffic channel</p>
                              </div>
                            )}
                          </Card.Body>
                        </Card>
                      </Tab>
                      
                      <Tab eventKey="macros" title="Tracking Macros">
                        <Card>
                          <Card.Body>
                            <h5>Tracking Macros</h5>
                            <p className="text-muted">Use these macros in your traffic source URL parameters</p>
                            
                            <h6 className="mt-4">System Macros</h6>
                            <Table responsive>
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Token</th>
                                  <th>Description</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Click ID</td>
                                  <td><code>{'{click_id}'}</code></td>
                                  <td>Unique identifier for the click</td>
                                </tr>
                                <tr>
                                  <td>Campaign ID</td>
                                  <td><code>{'{campaign_id}'}</code></td>
                                  <td>Campaign identifier</td>
                                </tr>
                                <tr>
                                  <td>Campaign Name</td>
                                  <td><code>{'{campaign_name}'}</code></td>
                                  <td>Campaign name</td>
                                </tr>
                                <tr>
                                  <td>Payout</td>
                                  <td><code>{'{payout}'}</code></td>
                                  <td>Conversion payout amount</td>
                                </tr>
                              </tbody>
                            </Table>
                            
                            <h6 className="mt-4">Custom Parameters</h6>
                            <Table responsive>
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Token</th>
                                  <th>Description</th>
                                  <th>Sample Values</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedChannel.macros && selectedChannel.macros.length > 0 ? (
                                  selectedChannel.macros.map((macro, index) => (
                                    <tr key={index}>
                                      <td>{macro.name}</td>
                                      <td><code>{`{${macro.name}}`}</code></td>
                                      <td>Custom parameter {macro.name}</td>
                                      <td>
                                        {macro.samples && macro.samples.map((sample, i) => (
                                          <Badge variant="light" key={i} className="mr-1">{sample}</Badge>
                                        ))}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="text-center">No custom parameters detected yet</td>
                                  </tr>
                                )}
                              </tbody>
                            </Table>
                            
                            <h6 className="mt-4">Postback URL</h6>
                            <div className="postback-url-box p-3 bg-light rounded">
                              <p className="mb-0">
                                <small className="text-muted">S2S Postback URL:</small><br />
                                {selectedChannel.s2sPostbackUrl || 'Not configured'}
                              </p>
                            </div>
                            
                            <h6 className="mt-4">Example Tracking URL</h6>
                            <div className="tracking-url-box p-3 bg-light rounded">
                              <code>
                                https://yourdomain.com/track?tid={selectedChannel.id}&cid={'{campaign_id}'}&clickid={'{click_id}'}
                                {selectedChannel.macros && selectedChannel.macros.length > 0 && 
                                  selectedChannel.macros.map(macro => `&${macro.name}={${macro.name}}`).join('')
                                }
                              </code>
                            </div>
                          </Card.Body>
                        </Card>
                      </Tab>
                      
                      <Tab eventKey="conversions" title="Conversions">
                        <Card>
                          <Card.Body>
                            <h5>Recent Conversions</h5>
                            {/* Placeholder for conversions table */}
                            <div className="text-center py-4">
                              <Button variant="outline-primary">
                                <RefreshCw size={16} className="mr-1" /> Load Conversions
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Tab>
                      
                      <Tab eventKey="settings" title="Settings">
                        <Card>
                          <Card.Body>
                            <h5>Channel Settings</h5>
                            <Row>
                              <Col md={6}>
                                <dl>
                                  <dt>Channel Name</dt>
                                  <dd>{selectedChannel.channelName}</dd>
                                  
                                  <dt>Channel Type</dt>
                                  <dd>{selectedChannel.aliasChannel}</dd>
                                  
                                  <dt>Currency</dt>
                                  <dd>{selectedChannel.currency}</dd>
                                  
                                  <dt>Cost Update Settings</dt>
                                  <dd>
                                    Update every {selectedChannel.costUpdateFrequency}, 
                                    looking back {selectedChannel.costUpdateDepth} days
                                  </dd>
                                </dl>
                              </Col>
                              
                              <Col md={6}>
                                <dl>
                                  <dt>S2S Postback URL</dt>
                                  <dd>{selectedChannel.s2sPostbackUrl || 'Not configured'}</dd>
                                  
                                  <dt>Status</dt>
                                  <dd>
                                    <Badge variant={selectedChannel.status === 'Active' ? 'success' : 'secondary'}>
                                      {selectedChannel.status}
                                    </Badge>
                                  </dd>
                                  
                                  <dt>Created</dt>
                                  <dd>{new Date(selectedChannel.createdAt).toLocaleString()}</dd>
                                  
                                  <dt>Last Updated</dt>
                                  <dd>{new Date(selectedChannel.updatedAt).toLocaleString()}</dd>
                                </dl>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Tab>
                    </Tabs>
                  </Card.Body>
                </Card>
              </Col>
            </>
          )}
        </Row>

        {/* Add Channel Modal */}
        <Modal 
          show={showAddModal} 
          onHide={() => {
            setShowAddModal(false);
            resetChannelForm();
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Add Traffic Channel</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Channel Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      value={channelForm.channelName}
                      onChange={(e) => setChannelForm({...channelForm, channelName: e.target.value})}
                      placeholder="e.g. Facebook Main, Google Search"
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Channel Type <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      as="select"
                      value={channelForm.aliasChannel}
                      onChange={(e) => setChannelForm({...channelForm, aliasChannel: e.target.value})}
                    >
                      {channelAliasOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Currency</Form.Label>
                    <Form.Control 
                      as="select"
                      value={channelForm.currency}
                      onChange={(e) => setChannelForm({...channelForm, currency: e.target.value})}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>S2S Postback URL</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={channelForm.s2sPostbackUrl}
                      onChange={(e) => setChannelForm({...channelForm, s2sPostbackUrl: e.target.value})}
                      placeholder="https://traffic-source.com/postback?clickid={click_id}"
                    />
                    <Form.Text className="text-muted">
                      URL to send conversion data back to your traffic source
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Cost Update Frequency</Form.Label>
                    <Form.Control 
                      as="select"
                      value={channelForm.costUpdateFrequency}
                      onChange={(e) => setChannelForm({...channelForm, costUpdateFrequency: e.target.value})}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="manual">Manual</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Cost Update Depth (days)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={channelForm.costUpdateDepth}
                      onChange={(e) => setChannelForm({...channelForm, costUpdateDepth: e.target.value})}
                      min="1"
                      max="90"
                    />
                    <Form.Text className="text-muted">
                      How many days back to update costs
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              {/* Additional fields for Facebook */}
              {channelForm.aliasChannel === 'Facebook' && (
                <>
                  <h6 className="mt-4">Facebook Integration Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Pixel ID</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={channelForm.pixelId}
                          onChange={(e) => setChannelForm({...channelForm, pixelId: e.target.value})}
                          placeholder="e.g. 1234567890123456"
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Default Event Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={channelForm.defaultEventName}
                          onChange={(e) => setChannelForm({...channelForm, defaultEventName: e.target.value})}
                          placeholder="e.g. Purchase"
                        />
                        <Form.Text className="text-muted">
                          Default event name for conversions (Purchase, Lead, etc.)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              
              {/* Additional fields for Google */}
              {channelForm.aliasChannel === 'Google Ads' && (
                <>
                  <h6 className="mt-4">Google Ads Integration Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Google Ads Account ID</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={channelForm.googleAdsAccountId}
                          onChange={(e) => setChannelForm({...channelForm, googleAdsAccountId: e.target.value})}
                          placeholder="e.g. 123-456-7890"
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>MCC Account ID (optional)</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={channelForm.googleMccAccountId}
                          onChange={(e) => setChannelForm({...channelForm, googleMccAccountId: e.target.value})}
                          placeholder="e.g. 123-456-7890"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowAddModal(false);
                resetChannelForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleAddChannel}
              disabled={!channelForm.channelName}
            >
              Add Channel
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Edit Channel Modal */}
        <Modal 
          show={showEditModal} 
          onHide={() => {
            setShowEditModal(false);
            resetChannelForm();
          }}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Edit Traffic Channel</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Channel Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      type="text" 
                      value={channelForm.channelName}
                      onChange={(e) => setChannelForm({...channelForm, channelName: e.target.value})}
                      placeholder="e.g. Facebook Main, Google Search"
                      required
                    />
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Channel Type <span className="text-danger">*</span></Form.Label>
                    <Form.Control 
                      as="select"
                      value={channelForm.aliasChannel}
                      onChange={(e) => setChannelForm({...channelForm, aliasChannel: e.target.value})}
                    >
                      {channelAliasOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Currency</Form.Label>
                    <Form.Control 
                      as="select"
                      value={channelForm.currency}
                      onChange={(e) => setChannelForm({...channelForm, currency: e.target.value})}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                      <option value="AUD">AUD - Australian Dollar</option>
                      <option value="INR">INR - Indian Rupee</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>S2S Postback URL</Form.Label>
                    <Form.Control 
                      type="text" 
                      value={channelForm.s2sPostbackUrl}
                      onChange={(e) => setChannelForm({...channelForm, s2sPostbackUrl: e.target.value})}
                      placeholder="https://traffic-source.com/postback?clickid={click_id}"
                    />
                    <Form.Text className="text-muted">
                      URL to send conversion data back to your traffic source
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Cost Update Frequency</Form.Label>
                    <Form.Control 
                      as="select"
                      value={channelForm.costUpdateFrequency}
                      onChange={(e) => setChannelForm({...channelForm, costUpdateFrequency: e.target.value})}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="manual">Manual</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Cost Update Depth (days)</Form.Label>
                    <Form.Control 
                      type="number" 
                      value={channelForm.costUpdateDepth}
                      onChange={(e) => setChannelForm({...channelForm, costUpdateDepth: e.target.value})}
                      min="1"
                      max="90"
                    />
                    <Form.Text className="text-muted">
                      How many days back to update costs
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
              
              <Row>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Control 
                      as="select"
                      value={channelForm.status}
                      onChange={(e) => setChannelForm({...channelForm, status: e.target.value})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
              </Row>
              
              {/* Additional fields for Facebook */}
              {channelForm.aliasChannel === 'Facebook' && (
                <>
                  <h6 className="mt-4">Facebook Integration Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Pixel ID</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={channelForm.pixelId}
                          onChange={(e) => setChannelForm({...channelForm, pixelId: e.target.value})}
                          placeholder="e.g. 1234567890123456"
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Default Event Name</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={channelForm.defaultEventName}
                          onChange={(e) => setChannelForm({...channelForm, defaultEventName: e.target.value})}
                          placeholder="e.g. Purchase"
                        />
                        <Form.Text className="text-muted">
                          Default event name for conversions (Purchase, Lead, etc.)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
              
              {/* Additional fields for Google */}
              {channelForm.aliasChannel === 'Google Ads' && (
                <>
                  <h6 className="mt-4">Google Ads Integration Settings</h6>
                  <Row>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Google Ads Account ID</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={channelForm.googleAdsAccountId}
                          onChange={(e) => setChannelForm({...channelForm, googleAdsAccountId: e.target.value})}
                          placeholder="e.g. 123-456-7890"
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>MCC Account ID (optional)</Form.Label>
                        <Form.Control 
                          type="text" 
                          value={channelForm.googleMccAccountId}
                          onChange={(e) => setChannelForm({...channelForm, googleMccAccountId: e.target.value})}
                          placeholder="e.g. 123-456-7890"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowEditModal(false);
                resetChannelForm();
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleUpdateChannel}
              disabled={!channelForm.channelName}
            >
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Channel Modal */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Delete Traffic Channel</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete the traffic channel <strong>{currentChannel?.channelName}</strong>?</p>
            <p className="text-danger">This action cannot be undone if the channel has no associated data.</p>
            <p>If the channel has clicks and conversions, it will be marked as inactive instead of deleted.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteChannel}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Conversion Settings Modal */}
        <Modal 
          show={showConversionSettingsModal} 
          onHide={() => setShowConversionSettingsModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Conversion Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="text-muted mb-4">
              Configure how conversion data is forwarded to traffic sources
            </p>
            
            <Card className="mb-4">
              <Card.Header className="bg-light">
                <h6 className="mb-0 d-flex align-items-center">
                  <Facebook size={20} className="text-primary mr-2" /> Facebook Conversion API
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Check 
                    type="switch"
                    id="facebook-toggle"
                    label="Forward conversions to Facebook"
                    checked={conversionSettings.forward_to_facebook}
                    onChange={(e) => setConversionSettings({
                      ...conversionSettings,
                      forward_to_facebook: e.target.checked
                    })}
                  />
                  <Form.Text className="text-muted">
                    Send server-side conversion events to Facebook
                  </Form.Text>
                </Form.Group>
                
                {conversionSettings.forward_to_facebook && (
                  <>
                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Default Event Name</Form.Label>
                          <Form.Control 
                            as="select"
                            value={conversionSettings.default_event_name}
                            onChange={(e) => setConversionSettings({
                              ...conversionSettings,
                              default_event_name: e.target.value
                            })}
                          >
                            <option value="Purchase">Purchase</option>
                            <option value="Lead">Lead</option>
                            <option value="CompleteRegistration">Complete Registration</option>
                            <option value="Subscribe">Subscribe</option>
                            <option value="AddToCart">Add To Cart</option>
                            <option value="InitiateCheckout">Initiate Checkout</option>
                          </Form.Control>
                          <Form.Text className="text-muted">
                            Default event type to send to Facebook
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Pixel ID</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={currentChannel?.pixelId || ''}
                            disabled
                          />
                          <Form.Text className="text-muted">
                            Set in channel settings
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Alert variant="info">
                      <small>
                        Make sure you have connected your Facebook account in the Traffic Channels page to use the Conversion API.
                      </small>
                    </Alert>
                  </>
                )}
              </Card.Body>
            </Card>
            
            <Card>
              <Card.Header className="bg-light">
                <h6 className="mb-0 d-flex align-items-center">
                  <Google size={20} className="text-danger mr-2" /> Google Ads Conversion API
                </h6>
              </Card.Header>
              <Card.Body>
                <Form.Group>
                  <Form.Check 
                    type="switch"
                    id="google-toggle"
                    label="Forward conversions to Google"
                    checked={conversionSettings.forward_to_google}
                    onChange={(e) => setConversionSettings({
                      ...conversionSettings,
                      forward_to_google: e.target.checked
                    })}
                  />
                  <Form.Text className="text-muted">
                    Send server-side conversion events to Google Ads
                  </Form.Text>
                </Form.Group>
                
                {conversionSettings.forward_to_google && (
                  <>
                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Conversion ID</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={conversionSettings.conversion_id}
                            onChange={(e) => setConversionSettings({
                              ...conversionSettings,
                              conversion_id: e.target.value
                            })}
                            placeholder="e.g. AW-123456789"
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Conversion Label</Form.Label>
                          <Form.Control 
                            type="text" 
                            value={conversionSettings.conversion_label}
                            onChange={(e) => setConversionSettings({
                              ...conversionSettings,
                              conversion_label: e.target.value
                            })}
                            placeholder="e.g. abcDEF123ghiJKL456"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Alert variant="info">
                      <small>
                        Make sure you have connected your Google Ads account in the Traffic Channels page to use the Conversion API.
                      </small>
                    </Alert>
                  </>
                )}
              </Card.Body>
            </Card>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConversionSettingsModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveConversionSettings}>
              Save Settings
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </Layout>
  );
};

export default TrafficChannelsPage;