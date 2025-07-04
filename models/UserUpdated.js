import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Check if model already exists to prevent overwrite error
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'distributor', 'manager', 'employee'],
    default: 'distributor'
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  commissionRate: {
    type: Number,
    default: 0
  },
  // Legacy permissions for backward compatibility
  permissions: {
    canCreateCompanies: { type: Boolean, default: false },
    canCreateInvoices: { type: Boolean, default: false },
    canManageClients: { type: Boolean, default: false },
    canViewReports: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true
}));

// Add methods only if they don't exist
if (!User.schema.methods.comparePassword) {
  User.schema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
  });

  User.schema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  };

  // Method to check if user has specific permission
  User.schema.methods.hasPermission = async function(permissionName) {
    // Admin always has all permissions
    if (this.role === 'admin') return true;
    
    // Check legacy permissions first for backward compatibility
    const legacyPermissionMap = {
      'companies.create': this.permissions.canCreateCompanies,
      'companies.read': true,
      'companies.update': this.permissions.canCreateCompanies,
      'companies.delete': this.permissions.canCreateCompanies,
      'invoices.create': this.permissions.canCreateInvoices,
      'invoices.read': true,
      'invoices.update': this.permissions.canCreateInvoices,
      'invoices.delete': this.permissions.canCreateInvoices,
      'clients.create': this.permissions.canManageClients,
      'clients.read': true,
      'clients.update': this.permissions.canManageClients,
      'clients.delete': this.permissions.canManageClients,
      'reports.read': this.permissions.canViewReports
    };
    
    if (legacyPermissionMap.hasOwnProperty(permissionName)) {
      return legacyPermissionMap[permissionName];
    }
    
    // Check new role-based permissions
    await this.populate('roles');
    for (const role of this.roles) {
      await role.populate('permissions');
      if (role.hasPermission && role.hasPermission(permissionName)) {
        return true;
      }
    }
    
    return false;
  };

  // Method to get all user permissions
  User.schema.methods.getAllPermissions = async function() {
    if (this.role === 'admin') {
      // Admin has all permissions
      const Permission = mongoose.model('Permission');
      return await Permission.find({ isActive: true });
    }
    
    await this.populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });
    
    const permissions = new Set();
    this.roles.forEach(role => {
      role.permissions.forEach(permission => {
        permissions.add(permission);
      });
    });
    
    return Array.from(permissions);
  };

  // Method to check if account is locked
  User.schema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
  };
}

export default User;