import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminPanel.css';
import { useAuth } from './AuthContext'; // Use your existing AuthContext

// API base URL
const API_URL = 'https://pearmllc.onrender.com/api/auth';

// Sidebar Component
function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isAdminOrManager = isAdmin || isManager;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!isAdminOrManager) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>Admin Panel</h1>
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <Link to="/admin">Admin Dashboard</Link>
          </li>
          <li>
            <Link to="/admin/users">User Management</Link>
          </li>
          <li>
            <Link to="/admin/roles">Role Management</Link>
          </li>
          <li>
            <Link to="/admin/activity">Activity Logs</Link>
          </li>
          <li>
            <Link to="/dashboard">Back to Main Dashboard</Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

// Main Layout Component
function Layout({ children }) {
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="content-container">{children}</div>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/dashboard`);
        setStats(response.data);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!stats) return null;

  return (
    <div className="dashboard-container">
      <h2>Dashboard</h2>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Users</h3>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        
        <div className="stat-card">
          <h3>Users by Role</h3>
          <div className="stat-list">
            {stats.usersByRole.map(role => (
              <div key={role.role} className="stat-item">
                <span>{role.role}</span>
                <span className="stat-count">{role.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="dashboard-sections">
        <div className="dashboard-section">
          <h3>Recent Activities</h3>
          <div className="activity-list">
            {stats.recentActivities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div className="activity-user">{activity.name}</div>
                <div className="activity-details">
                  <span className="activity-type">{activity.activity_type}</span>
                  <span className="activity-module">{activity.module}</span>
                </div>
                <div className="activity-description">{activity.description}</div>
                <div className="activity-time">
                  {new Date(activity.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="dashboard-section">
          <h3>Recently Added Users</h3>
          <div className="user-list">
            {stats.recentUsers.map(user => (
              <div key={user.id} className="user-item">
                <div className="user-name">{user.name}</div>
                <div className="user-email">{user.email}</div>
                <div className="user-role">{user.role}</div>
                <div className="user-created">
                  {new Date(user.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// User Management Component
function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'manager'
  });
  const [editMode, setEditMode] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/admin/users`);
      setUsers(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserForm({
      ...userForm,
      [name]: value
    });
  };

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      password: '',
      role: 'manager'
    });
    setEditMode(false);
    setCurrentUserId(null);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating user with data:', userForm);
      console.log('API URL:', `${API_URL}/auth/signup`);
      
      const response = await axios.post(`${API_URL}/auth/signup`, userForm);
      console.log('Signup response:', response.data);
      
      fetchUsers();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      console.error('Signup error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // Remove password if it's empty (no password change)
      const userData = { ...userForm };
      if (!userData.password) {
        delete userData.password;
      }
      
      await axios.put(`${API_URL}/admin/users/${currentUserId}`, userData);
      fetchUsers();
      setModalOpen(false);
      resetForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const openEditModal = (user) => {
    setUserForm({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password
      role: user.role
    });
    setCurrentUserId(user.id);
    setEditMode(true);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  if (loading && !users.length) return <div className="loading">Loading users...</div>;

  return (
    <div className="user-management-container">
      <div className="header-actions">
        <h2>User Management</h2>
        <button className="add-button" onClick={openCreateModal}>Add New User</button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td><span className={`role-badge ${user.role}`}>{user.role}</span></td>
                <td>{new Date(user.created_at).toLocaleString()}</td>
                <td className="actions-cell">
                  <button className="edit-button" onClick={() => openEditModal(user)}>
                    Edit
                  </button>
                  {isAdmin && (
                    <button 
                      className="delete-button" 
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editMode ? 'Edit User' : 'Create New User'}</h3>
              <button className="close-button" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <form onSubmit={editMode ? handleUpdateUser : handleCreateUser}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={userForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>{editMode ? 'New Password (leave blank to keep current)' : 'Password'}</label>
                <input
                  type="password"
                  name="password"
                  value={userForm.password}
                  onChange={handleInputChange}
                  required={!editMode}
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  name="role"
                  value={userForm.role}
                  onChange={handleInputChange}
                  required
                >
                  {isAdmin && <option value="admin">Admin</option>}
                  <option value="manager">Manager</option>
                  <option value="media_buyer">Media Buyer</option>
                  <option value="tl">Team Lead</option>
                  <option value="stl">Senior Team Lead</option>
                  <option value="accounts">Accounts</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-button">
                  {editMode ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Role Management Component
function RoleManagement() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        axios.get(`${API_URL}/roles`),
        axios.get(`${API_URL}/permissions`)
      ]);
      setRoles(rolesRes.data);
      setPermissions(permissionsRes.data);
      setError(null);
    } catch (err) {
      setError('Failed to load roles and permissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenRolePermissions = async (role) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/roles/${role.id}`);
      setSelectedRole(response.data);
      setSelectedPermissions(
        response.data.permissions.map(p => p.permission_id)
      );
      setModalOpen(true);
    } catch (err) {
      setError('Failed to load role details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (permissionId) => {
    if (selectedPermissions.includes(permissionId)) {
      setSelectedPermissions(
        selectedPermissions.filter(id => id !== permissionId)
      );
    } else {
      setSelectedPermissions([...selectedPermissions, permissionId]);
    }
  };

  const handleSavePermissions = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/roles/${selectedRole.id}/permissions`,
        { permissions: selectedPermissions }
      );
      setModalOpen(false);
      fetchRoles();
    } catch (err) {
      setError('Failed to update permissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !roles.length) return <div className="loading">Loading roles...</div>;

  return (
    <div className="role-management-container">
      <h2>Role Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="roles-container">
        {roles.map(role => (
          <div key={role.id} className="role-card">
            <div className="role-header">
              <h3>{role.role_name}</h3>
            </div>
            <div className="role-actions">
              <button 
                className="permissions-button"
                onClick={() => handleOpenRolePermissions(role)}
                disabled={!isAdmin}
              >
                Manage Permissions
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {modalOpen && selectedRole && (
        <div className="modal-overlay">
          <div className="modal-content permissions-modal">
            <div className="modal-header">
              <h3>Permissions for {selectedRole.role_name}</h3>
              <button className="close-button" onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className="permissions-list">
              {permissions.map(permission => (
                <div key={permission.permission_id} className="permission-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedPermissions.includes(permission.permission_id)}
                      onChange={() => handlePermissionChange(permission.permission_id)}
                      disabled={!isAdmin}
                    />
                    {permission.permission_name}
                  </label>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button type="button" className="cancel-button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className="submit-button"
                  onClick={handleSavePermissions}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Permissions'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Activity Logs Component
function ActivityLogs() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 50 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    user_id: '',
    module: '',
    activity_type: ''
  });

  const fetchActivities = async () => {
    try {
      setLoading(true);
      // Build query params
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      });
      
      const response = await axios.get(`${API_URL}/admin/activity?${params}`);
      setActivities(response.data.activities);
      setPagination({
        ...pagination,
        ...response.data.pagination
      });
      setError(null);
    } catch (err) {
      setError('Failed to load activity logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [pagination.page, filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
    // Reset to page 1 when changing filters
    setPagination({
      ...pagination,
      page: 1
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    setPagination({
      ...pagination,
      page: newPage
    });
  };

  if (loading && !activities.length) {
    return <div className="loading">Loading activity logs...</div>;
  }

  return (
    <div className="activity-logs-container">
      <h2>Activity Logs</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters-container">
        <div className="filter-group">
          <label>Module</label>
          <select
            name="module"
            value={filters.module}
            onChange={handleFilterChange}
          >
            <option value="">All Modules</option>
            <option value="auth">Authentication</option>
            <option value="users">Users</option>
            <option value="roles">Roles</option>
            <option value="permissions">Permissions</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Activity Type</label>
          <select
            name="activity_type"
            value={filters.activity_type}
            onChange={handleFilterChange}
          >
            <option value="">All Activities</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="CREATE_USER">Create User</option>
            <option value="UPDATE_USER">Update User</option>
            <option value="DELETE_USER">Delete User</option>
            <option value="CREATE_ROLE">Create Role</option>
            <option value="UPDATE_ROLE">Update Role</option>
            <option value="DELETE_ROLE">Delete Role</option>
            <option value="ASSIGN_PERMISSION">Assign Permissions</option>
          </select>
        </div>
      </div>
      
      <div className="activity-table-container">
        <table className="activity-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Activity</th>
              <th>Module</th>
              <th>Description</th>
              <th>IP Address</th>
              <th>Date/Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.map(activity => (
              <tr key={activity.id}>
                <td>{activity.name}</td>
                <td><span className={`role-badge ${activity.role}`}>{activity.role}</span></td>
                <td>{activity.activity_type}</td>
                <td>{activity.module}</td>
                <td>{activity.description}</td>
                <td>{activity.ip_address}</td>
                <td>{new Date(activity.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="pagination-controls">
        <button
          onClick={() => handlePageChange(1)}
          disabled={pagination.page === 1}
        >
          First
        </button>
        <button
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
        </span>
        <button
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          Next
        </button>
        <button
          onClick={() => handlePageChange(pagination.totalPages)}
          disabled={pagination.page === pagination.totalPages}
        >
          Last
        </button>
      </div>
    </div>
  );
}

// Unauthorized Component
function Unauthorized() {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <h2>Access Denied</h2>
        <p>You don't have permission to access this page.</p>
        <Link to="/dashboard">Return to Dashboard</Link>
      </div>
    </div>
  );
}

// Main AdminPanel Component
function AdminPanelPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isAdminOrManager = isAdmin || isManager;

  if (!isAdminOrManager) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/roles" element={<RoleManagement />} />
        <Route path="/activity" element={<ActivityLogs />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    </Layout>
  );
}

export default AdminPanelPage;