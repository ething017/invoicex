export const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    req.flash('error', 'يجب تسجيل الدخول للوصول إلى هذه الصفحة');
    return res.redirect('/auth/login');
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    req.flash('error', 'ليس لديك صلاحية للوصول إلى هذه الصفحة');
    return res.redirect('/dashboard');
  }
  next();
};

export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.session.user.role === 'admin') {
      return next();
    }
    
    if (!req.session.user.permissions[permission]) {
      req.flash('error', 'ليس لديك صلاحية لتنفيذ هذا الإجراء');
      return res.redirect('/dashboard');
    }
    next();
  };
};