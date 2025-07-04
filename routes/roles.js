import express from 'express';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import User from '../models/UserUpdated.js';
import UserRole from '../models/UserRole.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

// List roles
router.get('/', requireAuth, requirePermission('roles.read'), async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissions')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    
    res.render('roles/index', { roles });
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحميل الأدوار');
    res.render('roles/index', { roles: [] });
  }
});

// New role form
router.get('/new', requireAuth, requirePermission('roles.create'), async (req, res) => {
  try {
    const permissions = await Permission.find({ isActive: true }).sort({ module: 1, action: 1 });
    
    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
    
    res.render('roles/new', { groupedPermissions });
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحميل الصلاحيات');
    res.redirect('/roles');
  }
});

// Create role
router.post('/', requireAuth, requirePermission('roles.create'), async (req, res) => {
  try {
    const { name, displayName, description, permissions } = req.body;
    
    const role = new Role({
      name,
      displayName,
      description,
      permissions: Array.isArray(permissions) ? permissions : [permissions].filter(Boolean),
      createdBy: req.session.user.id
    });
    
    await role.save();
    req.flash('success', 'تم إنشاء الدور بنجاح');
    res.redirect('/roles');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء إنشاء الدور');
    res.redirect('/roles/new');
  }
});

// Edit role form
router.get('/:id/edit', requireAuth, requirePermission('roles.update'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions');
    if (!role) {
      req.flash('error', 'الدور غير موجود');
      return res.redirect('/roles');
    }
    
    const permissions = await Permission.find({ isActive: true }).sort({ module: 1, action: 1 });
    
    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
    
    res.render('roles/edit', { role, groupedPermissions });
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحميل بيانات الدور');
    res.redirect('/roles');
  }
});

// Update role
router.put('/:id', requireAuth, requirePermission('roles.update'), async (req, res) => {
  try {
    const { name, displayName, description, permissions, isActive } = req.body;
    
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.flash('error', 'الدور غير موجود');
      return res.redirect('/roles');
    }
    
    // Prevent editing system roles
    if (role.isSystemRole) {
      req.flash('error', 'لا يمكن تعديل أدوار النظام');
      return res.redirect('/roles');
    }
    
    await Role.findByIdAndUpdate(req.params.id, {
      name,
      displayName,
      description,
      permissions: Array.isArray(permissions) ? permissions : [permissions].filter(Boolean),
      isActive: isActive === 'on'
    });
    
    req.flash('success', 'تم تحديث الدور بنجاح');
    res.redirect('/roles');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحديث الدور');
    res.redirect('/roles');
  }
});

// Delete role
router.delete('/:id', requireAuth, requirePermission('roles.delete'), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.flash('error', 'الدور غير موجود');
      return res.redirect('/roles');
    }
    
    // Prevent deleting system roles
    if (role.isSystemRole) {
      req.flash('error', 'لا يمكن حذف أدوار النظام');
      return res.redirect('/roles');
    }
    
    // Check if role is assigned to any users
    const userRoles = await UserRole.find({ role: req.params.id, isActive: true });
    if (userRoles.length > 0) {
      req.flash('error', 'لا يمكن حذف الدور لأنه مُعيّن لمستخدمين');
      return res.redirect('/roles');
    }
    
    await Role.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف الدور بنجاح');
    res.redirect('/roles');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء حذف الدور');
    res.redirect('/roles');
  }
});

// Assign role to user
router.post('/assign', requireAuth, requirePermission('roles.assign'), async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    // Check if assignment already exists
    const existingAssignment = await UserRole.findOne({ user: userId, role: roleId });
    if (existingAssignment) {
      if (existingAssignment.isActive) {
        req.flash('error', 'الدور مُعيّن بالفعل لهذا المستخدم');
      } else {
        // Reactivate existing assignment
        existingAssignment.isActive = true;
        existingAssignment.assignedBy = req.session.user.id;
        existingAssignment.assignedAt = new Date();
        await existingAssignment.save();
        req.flash('success', 'تم تعيين الدور بنجاح');
      }
    } else {
      // Create new assignment
      const userRole = new UserRole({
        user: userId,
        role: roleId,
        assignedBy: req.session.user.id
      });
      await userRole.save();
      req.flash('success', 'تم تعيين الدور بنجاح');
    }
    
    res.redirect('/roles');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تعيين الدور');
    res.redirect('/roles');
  }
});

// Remove role from user
router.post('/remove', requireAuth, requirePermission('roles.assign'), async (req, res) => {
  try {
    const { userId, roleId } = req.body;
    
    await UserRole.findOneAndUpdate(
      { user: userId, role: roleId },
      { isActive: false }
    );
    
    req.flash('success', 'تم إلغاء تعيين الدور بنجاح');
    res.redirect('/roles');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء إلغاء تعيين الدور');
    res.redirect('/roles');
  }
});

export default router;