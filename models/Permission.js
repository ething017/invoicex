import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
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
  module: {
    type: String,
    required: true,
    enum: [
      'companies', 'clients', 'files', 'invoices', 'distributors', 'reports', 'commission-tiers', 'system',
      'suppliers', 'orders', 'agents', 'roles', 'permissions' // Added new modules
    ]
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create', 'read', 'update', 'delete', 'read_all', 'read_own', 'manage',
      'view_own', 'view_all' // Added new actions
    ]
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for module and action
permissionSchema.index({ module: 1, action: 1 }, { unique: true });

export default mongoose.model('Permission', permissionSchema);