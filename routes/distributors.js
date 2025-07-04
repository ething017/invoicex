import express from 'express';
import User from '../models/UserUpdated.js';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Default permissions for new distributors based on the image requirements
const getDefaultDistributorPermissions = async () => {
  const defaultPermissionNames = [
    // الشركات: عرض الخاصة + عرض الكل
    'suppliers.view_own', 'suppliers.view_all',
    // العملاء: عرض الخاصة + إنشاء + تعديل + حذف
    'clients.view_own', 'clients.create', 'clients.update', 'clients.delete',
    // الملفات: عرض الخاصة + عرض الكل + إنشاء + تعديل + حذف
    'files.view_own', 'files.view_all', 'files.create', 'files.update', 'files.delete',
    // الطلبات: عرض الخاصة + إنشاء + تعديل + حذف
    'orders.view_own', 'orders.create', 'orders.update', 'orders.delete',
    // الوُسطاء: عرض الخاصة
    'agents.view_own'
  ];
  
  const permissions = await Permission.find({ name: { $in: defaultPermissionNames } });
  return permissions.map(p => p._id);
};

// List distributors
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const distributors = await User.find({ role: 'distributor' })
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      })
      .sort({ createdAt: -1 });
    res.render('distributors/index', { distributors });
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحميل الموزعين');
    res.render('distributors/index', { distributors: [] });
  }
});

// New distributor form
router.get('/new', requireAuth, requireAdmin, async (req, res) => {
  try {
    const permissions = await Permission.find({ 
      isActive: true,
      module: { $in: ['suppliers', 'clients', 'files', 'orders', 'agents'] }
    }).sort({ module: 1, action: 1 });
    
    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
    
    // Get default permissions for distributors
    const defaultPermissions = await getDefaultDistributorPermissions();
    
    res.render('distributors/new', { 
      groupedPermissions,
      defaultPermissions: defaultPermissions.map(id => id.toString())
    });
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحميل البيانات');
    res.redirect('/distributors');
  }
});

// Create distributor
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, password, commissionRate, permissions } = req.body;
    
    // Create the distributor user
    const distributor = new User({
      username,
      password,
      role: 'distributor',
      commissionRate: parseFloat(commissionRate) || 0,
      // Keep legacy permissions for backward compatibility
      permissions: {
        canCreateCompanies: false,
        canCreateInvoices: true,
        canManageClients: true,
        canViewReports: true
      }
    });
    
    await distributor.save();
    
    // Create or get distributor role
    let distributorRole = await Role.findOne({ name: 'distributor' });
    if (!distributorRole) {
      distributorRole = new Role({
        name: 'distributor',
        displayName: 'موزع',
        description: 'صلاحيات أساسية للموزعين',
        isSystemRole: true,
        permissions: Array.isArray(permissions) ? permissions : [permissions].filter(Boolean)
      });
      await distributorRole.save();
    } else {
      // Update role permissions with selected permissions
      distributorRole.permissions = Array.isArray(permissions) ? permissions : [permissions].filter(Boolean);
      await distributorRole.save();
    }
    
    // Assign role to distributor
    distributor.roles = [distributorRole._id];
    await distributor.save();
    
    req.flash('success', 'تم إضافة الموزع بنجاح مع الصلاحيات المحددة');
    res.redirect('/distributors');
  } catch (error) {
    console.error('Error creating distributor:', error);
    req.flash('error', 'حدث خطأ أثناء إضافة الموزع');
    res.redirect('/distributors/new');
  }
});

// Edit distributor form
router.get('/:id/edit', requireAuth, requireAdmin, async (req, res) => {
  try {
    const distributor = await User.findById(req.params.id)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      });
      
    if (!distributor) {
      req.flash('error', 'الموزع غير موجود');
      return res.redirect('/distributors');
    }
    
    const permissions = await Permission.find({ 
      isActive: true,
      module: { $in: ['suppliers', 'clients', 'files', 'orders', 'agents'] }
    }).sort({ module: 1, action: 1 });
    
    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
    
    // Get current user permissions
    const userPermissions = [];
    distributor.roles.forEach(role => {
      role.permissions.forEach(permission => {
        userPermissions.push(permission._id.toString());
      });
    });
    
    res.render('distributors/edit', { 
      distributor, 
      groupedPermissions,
      userPermissions
    });
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحميل بيانات الموزع');
    res.redirect('/distributors');
  }
});

// Update distributor
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { username, commissionRate, permissions, isActive } = req.body;
    
    const distributor = await User.findById(req.params.id).populate('roles');
    if (!distributor) {
      req.flash('error', 'الموزع غير موجود');
      return res.redirect('/distributors');
    }
    
    // Update basic distributor info
    const updateData = {
      username,
      commissionRate: parseFloat(commissionRate) || 0,
      isActive: isActive === 'on'
    };
    
    await User.findByIdAndUpdate(req.params.id, updateData);
    
    // Update role permissions
    if (distributor.roles && distributor.roles.length > 0) {
      const role = distributor.roles[0];
      role.permissions = Array.isArray(permissions) ? permissions : [permissions].filter(Boolean);
      await role.save();
    } else {
      // Create new role if none exists
      const newRole = new Role({
        name: `distributor_${distributor.username}`,
        displayName: `صلاحيات ${distributor.username}`,
        description: 'صلاحيات مخصصة للموزع',
        permissions: Array.isArray(permissions) ? permissions : [permissions].filter(Boolean)
      });
      await newRole.save();
      
      distributor.roles = [newRole._id];
      await distributor.save();
    }
    
    req.flash('success', 'تم تحديث بيانات الموزع والصلاحيات بنجاح');
    res.redirect('/distributors');
  } catch (error) {
    console.error('Error updating distributor:', error);
    req.flash('error', 'حدث خطأ أثناء تحديث بيانات الموزع');
    res.redirect('/distributors');
  }
});

// Delete distributor
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const distributor = await User.findById(req.params.id);
    if (!distributor) {
      req.flash('error', 'الموزع غير موجود');
      return res.redirect('/distributors');
    }
    
    // Delete associated custom roles (not system roles)
    if (distributor.roles) {
      for (const roleId of distributor.roles) {
        const role = await Role.findById(roleId);
        if (role && !role.isSystemRole) {
          await Role.findByIdAndDelete(roleId);
        }
      }
    }
    
    await User.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف الموزع بنجاح');
    res.redirect('/distributors');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء حذف الموزع');
    res.redirect('/distributors');
  }
});

export default router;