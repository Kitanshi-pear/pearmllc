const {pool} = require("../models/db");

/**
 * Middleware to log user activities
 */
exports.logActivity = (module, activityType) => {
  return async (req, res, next) => {
    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function
    res.send = function(data) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        try {
          const description = getActivityDescription(activityType, req);
          const ipAddress = req.ip || req.connection.remoteAddress;
          
          // Log the activity
          pool.query(
            "INSERT INTO user_activities (user_id, activity_type, module, description, ip_address) VALUES (?, ?, ?, ?, ?)",
            [req.user.user_id, activityType, module, description, ipAddress]
          );
        } catch (error) {
          console.error("Error logging activity:", error);
        }
      }
      
      // Call the original send function
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Generate a description based on activity type and request data
 */
function getActivityDescription(activityType, req) {
  switch (activityType) {
    case 'LOGIN':
      return `User logged in`;
    case 'LOGOUT':
      return `User logged out`;
    case 'CREATE_USER':
      return `Created new user: ${req.body.name} (${req.body.email}) with role ${req.body.role}`;
    case 'UPDATE_USER':
      return `Updated user ID: ${req.params.id}`;
    case 'DELETE_USER':
      return `Deleted user ID: ${req.params.id}`;
    case 'ASSIGN_ROLE':
      return `Assigned role ${req.body.role} to user ID: ${req.params.id}`;
    case 'CREATE_ROLE':
      return `Created new role: ${req.body.role_name}`;
    case 'UPDATE_ROLE':
      return `Updated role ID: ${req.params.id}`;
    case 'DELETE_ROLE':
      return `Deleted role ID: ${req.params.id}`;
    case 'ASSIGN_PERMISSION':
      return `Assigned permissions to role ID: ${req.params.id}`;
    default:
      return `Performed ${activityType} operation`;
  }
}