import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isSystemRole: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Method to check if role has specific permission
roleSchema.methods.hasPermission = function(permissionName) {
  return this.permissions.some(permission => 
    permission.name === permissionName || 
    (typeof permission === 'string' && permission === permissionName)
  );
};

// Method to get permissions by module
roleSchema.methods.getModulePermissions = function(module) {
  return this.permissions.filter(permission => permission.module === module);
};

export default mongoose.model('Role', roleSchema);