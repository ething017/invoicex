import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import User from '../models/UserUpdated.js';

// Enhanced permission checking middleware
export const requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.session.user) {
        req.flash('error', 'يجب تسجيل الدخول للوصول إلى هذه الصفحة');
        return res.redirect('/auth/login');
      }

      const user = await User.findById(req.session.user.id).populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      });

      if (!user) {
        req.flash('error', 'المستخدم غير موجود');
        return res.redirect('/auth/login');
      }

      const hasPermission = await user.hasPermission(permissionName);
      
      if (!hasPermission) {
        req.flash('error', 'ليس لديك صلاحية للوصول إلى هذه الصفحة');
        return res.redirect('/dashboard');
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      req.flash('error', 'حدث خطأ أثناء التحقق من الصلاحيات');
      res.redirect('/dashboard');
    }
  };
};

// Check multiple permissions (user needs ALL of them)
export const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.session.user) {
        req.flash('error', 'يجب تسجيل الدخول للوصول إلى هذه الصفحة');
        return res.redirect('/auth/login');
      }

      const user = await User.findById(req.session.user.id).populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      });

      if (!user) {
        req.flash('error', 'المستخدم غير موجود');
        return res.redirect('/auth/login');
      }

      for (const permission of permissions) {
        const hasPermission = await user.hasPermission(permission);
        if (!hasPermission) {
          req.flash('error', 'ليس لديك صلاحية للوصول إلى هذه الصفحة');
          return res.redirect('/dashboard');
        }
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      req.flash('error', 'حدث خطأ أثناء التحقق من الصلاحيات');
      res.redirect('/dashboard');
    }
  };
};

// Check multiple permissions (user needs ANY of them)
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.session.user) {
        req.flash('error', 'يجب تسجيل الدخول للوصول إلى هذه الصفحة');
        return res.redirect('/auth/login');
      }

      const user = await User.findById(req.session.user.id).populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      });

      if (!user) {
        req.flash('error', 'المستخدم غير موجود');
        return res.redirect('/auth/login');
      }

      let hasAnyPermission = false;
      for (const permission of permissions) {
        if (await user.hasPermission(permission)) {
          hasAnyPermission = true;
          break;
        }
      }

      if (!hasAnyPermission) {
        req.flash('error', 'ليس لديك صلاحية للوصول إلى هذه الصفحة');
        return res.redirect('/dashboard');
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      req.flash('error', 'حدث خطأ أثناء التحقق من الصلاحيات');
      res.redirect('/dashboard');
    }
  };
};

// Middleware to add user permissions to response locals
export const addPermissionsToLocals = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user.id).populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      });

      if (user) {
        const permissions = await user.getAllPermissions();
        res.locals.userPermissions = permissions.map(p => p.name);
        res.locals.hasPermission = (permissionName) => {
          return user.hasPermission(permissionName);
        };
      }
    }
    next();
  } catch (error) {
    console.error('Error adding permissions to locals:', error);
    next();
  }
};