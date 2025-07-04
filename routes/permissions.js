import express from 'express';
import Permission from '../models/Permission.js';
import { requireAuth } from '../middleware/auth.js';
import { requirePermission } from '../middleware/permissions.js';

const router = express.Router();

// List permissions
router.get('/', requireAuth, requirePermission('permissions.read'), async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, action: 1 });
    
    // Group permissions by module
    const groupedPermissions = permissions.reduce((acc, permission) => {
      if (!acc[permission.module]) {
        acc[permission.module] = [];
      }
      acc[permission.module].push(permission);
      return acc;
    }, {});
    
    res.render('permissions/index', { groupedPermissions });
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحميل الصلاحيات');
    res.render('permissions/index', { groupedPermissions: {} });
  }
});

// New permission form
router.get('/new', requireAuth, requirePermission('permissions.create'), (req, res) => {
  res.render('permissions/new');
});

// Create permission
router.post('/', requireAuth, requirePermission('permissions.create'), async (req, res) => {
  try {
    const { name, displayName, description, module, action } = req.body;
    
    const permission = new Permission({
      name,
      displayName,
      description,
      module,
      action
    });
    
    await permission.save();
    req.flash('success', 'تم إنشاء الصلاحية بنجاح');
    res.redirect('/permissions');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء إنشاء الصلاحية');
    res.redirect('/permissions/new');
  }
});

// Edit permission form
router.get('/:id/edit', requireAuth, requirePermission('permissions.update'), async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    if (!permission) {
      req.flash('error', 'الصلاحية غير موجودة');
      return res.redirect('/permissions');
    }
    res.render('permissions/edit', { permission });
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحميل بيانات الصلاحية');
    res.redirect('/permissions');
  }
});

// Update permission
router.put('/:id', requireAuth, requirePermission('permissions.update'), async (req, res) => {
  try {
    const { name, displayName, description, module, action, isActive } = req.body;
    
    await Permission.findByIdAndUpdate(req.params.id, {
      name,
      displayName,
      description,
      module,
      action,
      isActive: isActive === 'on'
    });
    
    req.flash('success', 'تم تحديث الصلاحية بنجاح');
    res.redirect('/permissions');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء تحديث الصلاحية');
    res.redirect('/permissions');
  }
});

// Delete permission
router.delete('/:id', requireAuth, requirePermission('permissions.delete'), async (req, res) => {
  try {
    await Permission.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف الصلاحية بنجاح');
    res.redirect('/permissions');
  } catch (error) {
    req.flash('error', 'حدث خطأ أثناء حذف الصلاحية');
    res.redirect('/permissions');
  }
});

export default router;