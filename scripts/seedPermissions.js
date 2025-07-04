import mongoose from 'mongoose';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import User from '../models/UserUpdated.js';
import dotenv from 'dotenv';

dotenv.config();

// Complete permissions structure
const permissions = [
  // Suppliers (الشركات) - previously companies
  { name: 'suppliers.view_own', displayName: 'عرض الشركات الخاصة', description: 'عرض الشركات التي أنشأها المستخدم فقط', module: 'suppliers', action: 'view_own' },
  { name: 'suppliers.view_all', displayName: 'عرض جميع الشركات', description: 'عرض جميع الشركات في النظام', module: 'suppliers', action: 'view_all' },
  { name: 'suppliers.create', displayName: 'إنشاء شركة', description: 'إضافة شركات جديدة', module: 'suppliers', action: 'create' },
  { name: 'suppliers.update', displayName: 'تعديل شركة', description: 'تعديل بيانات الشركات', module: 'suppliers', action: 'update' },
  { name: 'suppliers.delete', displayName: 'حذف شركة', description: 'حذف الشركات من النظام', module: 'suppliers', action: 'delete' },
  
  // Clients (العملاء)
  { name: 'clients.view_own', displayName: 'عرض العملاء الخاصة', description: 'عرض العملاء التي أنشأها المستخدم فقط', module: 'clients', action: 'view_own' },
  { name: 'clients.view_all', displayName: 'عرض جميع العملاء', description: 'عرض جميع العملاء في النظام', module: 'clients', action: 'view_all' },
  { name: 'clients.create', displayName: 'إنشاء عميل', description: 'إضافة عملاء جدد', module: 'clients', action: 'create' },
  { name: 'clients.update', displayName: 'تعديل عميل', description: 'تعديل بيانات العملاء', module: 'clients', action: 'update' },
  { name: 'clients.delete', displayName: 'حذف عميل', description: 'حذف العملاء من النظام', module: 'clients', action: 'delete' },
  
  // Files (الملفات)
  { name: 'files.view_own', displayName: 'عرض الملفات الخاصة', description: 'عرض الملفات التي أنشأها المستخدم فقط', module: 'files', action: 'view_own' },
  { name: 'files.view_all', displayName: 'عرض جميع الملفات', description: 'عرض جميع الملفات في النظام', module: 'files', action: 'view_all' },
  { name: 'files.create', displayName: 'إنشاء ملف', description: 'رفع ملفات جديدة', module: 'files', action: 'create' },
  { name: 'files.update', displayName: 'تعديل ملف', description: 'تعديل بيانات الملفات', module: 'files', action: 'update' },
  { name: 'files.delete', displayName: 'حذف ملف', description: 'حذف الملفات من النظام', module: 'files', action: 'delete' },
  
  // Orders (الطلبات) - previously invoices
  { name: 'orders.view_own', displayName: 'عرض الطلبات الخاصة', description: 'عرض الطلبات المُعيّنة للمستخدم فقط', module: 'orders', action: 'view_own' },
  { name: 'orders.view_all', displayName: 'عرض جميع الطلبات', description: 'عرض جميع الطلبات في النظام', module: 'orders', action: 'view_all' },
  { name: 'orders.create', displayName: 'إنشاء طلب', description: 'إنشاء طلبات جديدة', module: 'orders', action: 'create' },
  { name: 'orders.update', displayName: 'تعديل طلب', description: 'تعديل بيانات الطلبات', module: 'orders', action: 'update' },
  { name: 'orders.delete', displayName: 'حذف طلب', description: 'حذف الطلبات من النظام', module: 'orders', action: 'delete' },
  
  // Agents (الوُسطاء) - previously distributors
  { name: 'agents.view_own', displayName: 'عرض الوُسطاء الخاصة', description: 'عرض معلومات المستخدم الشخصية فقط', module: 'agents', action: 'view_own' },
  { name: 'agents.view_all', displayName: 'عرض جميع الوُسطاء', description: 'عرض جميع الوُسطاء في النظام', module: 'agents', action: 'view_all' },
  { name: 'agents.create', displayName: 'إنشاء وسيط', description: 'إضافة وُسطاء جدد', module: 'agents', action: 'create' },
  { name: 'agents.update', displayName: 'تعديل وسيط', description: 'تعديل بيانات الوُسطاء', module: 'agents', action: 'update' },
  { name: 'agents.delete', displayName: 'حذف وسيط', description: 'حذف الوُسطاء من النظام', module: 'agents', action: 'delete' },
  
  // Reports (التقارير)
  { name: 'reports.view_own', displayName: 'عرض التقارير الخاصة', description: 'عرض التقارير الخاصة بالمستخدم فقط', module: 'reports', action: 'view_own' },
  { name: 'reports.view_all', displayName: 'عرض جميع التقارير', description: 'عرض جميع التقارير في النظام', module: 'reports', action: 'view_all' },
  { name: 'reports.export', displayName: 'تصدير التقارير', description: 'تصدير التقارير بصيغ مختلفة', module: 'reports', action: 'manage' },
  
  // Commission Tiers (مستويات العمولة)
  { name: 'commission-tiers.create', displayName: 'إنشاء مستوى عمولة', description: 'إضافة مستويات عمولة جديدة', module: 'commission-tiers', action: 'create' },
  { name: 'commission-tiers.read', displayName: 'عرض مستويات العمولة', description: 'عرض مستويات العمولة', module: 'commission-tiers', action: 'read' },
  { name: 'commission-tiers.update', displayName: 'تعديل مستوى عمولة', description: 'تعديل مستويات العمولة', module: 'commission-tiers', action: 'update' },
  { name: 'commission-tiers.delete', displayName: 'حذف مستوى عمولة', description: 'حذف مستويات العمولة', module: 'commission-tiers', action: 'delete' },
  
  // Roles & Permissions
  { name: 'roles.create', displayName: 'إنشاء دور', description: 'إنشاء أدوار جديدة', module: 'roles', action: 'create' },
  { name: 'roles.read', displayName: 'عرض الأدوار', description: 'عرض الأدوار والصلاحيات', module: 'roles', action: 'read' },
  { name: 'roles.update', displayName: 'تعديل دور', description: 'تعديل الأدوار والصلاحيات', module: 'roles', action: 'update' },
  { name: 'roles.delete', displayName: 'حذف دور', description: 'حذف الأدوار من النظام', module: 'roles', action: 'delete' },
  { name: 'roles.assign', displayName: 'تعيين الأدوار', description: 'تعيين الأدوار للمستخدمين', module: 'roles', action: 'manage' },
  
  { name: 'permissions.create', displayName: 'إنشاء صلاحية', description: 'إنشاء صلاحيات جديدة', module: 'permissions', action: 'create' },
  { name: 'permissions.read', displayName: 'عرض الصلاحيات', description: 'عرض الصلاحيات المتاحة', module: 'permissions', action: 'read' },
  { name: 'permissions.update', displayName: 'تعديل صلاحية', description: 'تعديل الصلاحيات الموجودة', module: 'permissions', action: 'update' },
  { name: 'permissions.delete', displayName: 'حذف صلاحية', description: 'حذف الصلاحيات من النظام', module: 'permissions', action: 'delete' },
  
  // System
  { name: 'system.settings', displayName: 'إعدادات النظام', description: 'إدارة إعدادات النظام العامة', module: 'system', action: 'manage' },
  { name: 'system.backup', displayName: 'النسخ الاحتياطي', description: 'إنشاء واستعادة النسخ الاحتياطية', module: 'system', action: 'manage' },
  { name: 'system.logs', displayName: 'سجلات النظام', description: 'عرض سجلات النظام والأخطاء', module: 'system', action: 'read' }
];

// System roles with proper permissions
const roles = [
  {
    name: 'admin',
    displayName: 'مدير النظام',
    description: 'صلاحيات كاملة لجميع أجزاء النظام',
    isSystemRole: true,
    permissions: [] // Will be populated with all permissions
  },
  {
    name: 'manager',
    displayName: 'مدير',
    description: 'صلاحيات إدارية محدودة',
    isSystemRole: true,
    permissions: [
      'suppliers.view_all', 'suppliers.create', 'suppliers.update',
      'clients.view_all', 'clients.create', 'clients.update',
      'files.view_all', 'files.create', 'files.update',
      'orders.view_all', 'orders.create', 'orders.update',
      'agents.view_all', 'agents.create', 'agents.update',
      'reports.view_all', 'reports.export',
      'commission-tiers.read', 'commission-tiers.create', 'commission-tiers.update'
    ]
  },
  {
    name: 'distributor',
    displayName: 'موزع',
    description: 'صلاحيات أساسية للموزعين حسب التصميم الجديد',
    isSystemRole: true,
    permissions: [
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
    ]
  },
  {
    name: 'employee',
    displayName: 'موظف',
    description: 'صلاحيات محدودة للموظفين',
    isSystemRole: true,
    permissions: [
      'clients.view_own',
      'files.view_own',
      'orders.view_own',
      'suppliers.view_own',
      'agents.view_own'
    ]
  }
];

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/arabic-invoice-system')
  .then(async () => {
    console.log('MongoDB connected');
    
    try {
      // Clear existing permissions and roles
      await Permission.deleteMany({});
      await Role.deleteMany({});
      console.log('Cleared existing permissions and roles');
      
      // Create permissions
      const createdPermissions = await Permission.insertMany(permissions);
      console.log(`Created ${createdPermissions.length} permissions`);
      
      // Create permission map for easy lookup
      const permissionMap = {};
      createdPermissions.forEach(permission => {
        permissionMap[permission.name] = permission._id;
      });
      
      // Create roles with proper permission references
      for (const roleData of roles) {
        const role = new Role({
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          isSystemRole: roleData.isSystemRole,
          permissions: roleData.name === 'admin' 
            ? createdPermissions.map(p => p._id) // Admin gets all permissions
            : roleData.permissions.map(permName => permissionMap[permName]).filter(Boolean)
        });
        
        await role.save();
        console.log(`Created role: ${role.displayName} with ${role.permissions.length} permissions`);
      }
      
      // Update existing users to use new role system
      const users = await User.find();
      for (const user of users) {
        if (user.role === 'admin') {
          const adminRole = await Role.findOne({ name: 'admin' });
          if (adminRole) {
            user.roles = [adminRole._id];
            await user.save();
            console.log(`Updated admin user: ${user.username}`);
          }
        } else if (user.role === 'distributor') {
          const distributorRole = await Role.findOne({ name: 'distributor' });
          if (distributorRole) {
            user.roles = [distributorRole._id];
            await user.save();
            console.log(`Updated distributor user: ${user.username}`);
          }
        }
      }
      
      console.log('✅ Permissions and roles seeded successfully!');
      console.log('\nSystem Roles:');
      const allRoles = await Role.find().populate('permissions');
      allRoles.forEach(role => {
        console.log(`- ${role.displayName} (${role.permissions.length} permissions)`);
      });
      
      console.log('\nDistributor Default Permissions:');
      const distributorRole = await Role.findOne({ name: 'distributor' }).populate('permissions');
      if (distributorRole) {
        distributorRole.permissions.forEach(permission => {
          console.log(`  - ${permission.displayName} (${permission.module}.${permission.action})`);
        });
      }
      
    } catch (error) {
      console.error('Error seeding permissions and roles:', error);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });