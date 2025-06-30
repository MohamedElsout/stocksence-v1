import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Shield, 
  Hash, 
  Eye, 
  EyeOff, 
  Edit, 
  Save, 
  X, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Crown,
  Briefcase,
  Lock,
  Settings as SettingsIcon,
  AlertTriangle,
  Building,
  Mail,
  Globe
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Sidebar from '../components/Layout/Sidebar';

const UserProfile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { 
    theme, 
    currentUser, 
    users, 
    addNotification 
  } = useStore();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    username: currentUser?.username || '',
    password: currentUser?.password || ''
  });

  const isRTL = i18n.language === 'ar';
  const isAdmin = currentUser?.role === 'admin';

  const handleSaveProfile = () => {
    // Here you would typically update the user profile
    // For now, we'll just show a success message
    addNotification({
      type: 'success',
      message: isRTL ? 'تم تحديث الملف الشخصي بنجاح!' : 'Profile updated successfully!'
    });
    setIsEditingProfile(false);
  };

  const userStats = [
    {
      icon: Users,
      label: isRTL ? 'إجمالي المستخدمين' : 'Total Users',
      value: users.length,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      adminOnly: true
    },
    {
      icon: Calendar,
      label: isRTL ? 'تاريخ الانضمام' : 'Member Since',
      value: currentUser ? new Date(currentUser.createdAt).toLocaleDateString() : '',
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      adminOnly: false
    },
    {
      icon: Shield,
      label: isRTL ? 'حالة الأمان' : 'Security Status',
      value: currentUser?.twoFactorEnabled ? (isRTL ? 'محمي' : 'Protected') : (isRTL ? 'عادي' : 'Standard'),
      color: currentUser?.twoFactorEnabled ? 'text-green-500' : 'text-yellow-500',
      bgColor: currentUser?.twoFactorEnabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20',
      adminOnly: false
    },
    {
      icon: CheckCircle,
      label: isRTL ? 'حالة الحساب' : 'Account Status',
      value: currentUser?.isActive ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير نشط' : 'Inactive'),
      color: currentUser?.isActive ? 'text-green-500' : 'text-red-500',
      bgColor: currentUser?.isActive ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20',
      adminOnly: false
    }
  ];

  const filteredStats = userStats.filter(stat => !stat.adminOnly || isAdmin);

  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className={`text-center ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">{isRTL ? 'لم يتم العثور على بيانات المستخدم' : 'User data not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="w-full" style={{ paddingTop: '4rem' }}>
        <div className="p-4 sm:p-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isRTL ? 'الملف الشخصي' : 'User Profile'}
                </h1>
                <p className={`${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {isRTL ? 'إدارة معلومات حسابك الشخصي' : 'Manage your account information'}
                </p>
              </div>
              
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className={`p-3 rounded-full ${
                  currentUser.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                } shadow-lg`}
              >
                {currentUser.role === 'admin' ? (
                  <Crown className="w-8 h-8 text-white" />
                ) : (
                  <Briefcase className="w-8 h-8 text-white" />
                )}
              </motion.div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {filteredStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`p-4 sm:p-6 rounded-xl shadow-lg ${
                    theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                  } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-xl transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`p-3 rounded-lg ${stat.bgColor}`}
                    >
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </motion.div>
                  </div>
                  
                  <div>
                    <p className={`text-sm font-medium mb-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {stat.label}
                    </p>
                    <div className={`text-xl sm:text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* User Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className={`lg:col-span-2 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className={`text-xl font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    {isRTL ? 'معلومات الحساب' : 'Account Information'}
                  </h3>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className={`flex items-center px-4 py-2 rounded-lg transition-all duration-300 ${
                      isEditingProfile
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isEditingProfile ? (
                      <>
                        <X className="w-4 h-4 mr-2" />
                        {isRTL ? 'إلغاء' : 'Cancel'}
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-2" />
                        {isRTL ? 'تعديل' : 'Edit'}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Profile Picture & Role */}
                <div className="flex items-center space-x-6 rtl:space-x-reverse">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center ${
                      currentUser.role === 'admin' 
                        ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                        : 'bg-gradient-to-br from-blue-500 to-blue-700'
                    } shadow-lg`}
                  >
                    {currentUser.picture ? (
                      <img 
                        src={currentUser.picture} 
                        alt={currentUser.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : currentUser.role === 'admin' ? (
                      <Crown className="w-12 h-12 text-white" />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </motion.div>
                  
                  <div>
                    <h2 className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {currentUser.username}
                    </h2>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentUser.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {currentUser.role === 'admin' ? (
                          <>
                            <Crown className="w-4 h-4 inline mr-1" />
                            {isRTL ? 'مدير النظام' : 'Administrator'}
                          </>
                        ) : (
                          <>
                            <Briefcase className="w-4 h-4 inline mr-1" />
                            {isRTL ? 'موظف' : 'Employee'}
                          </>
                        )}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        currentUser.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {currentUser.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4 inline mr-1" />
                            {isRTL ? 'نشط' : 'Active'}
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 inline mr-1" />
                            {isRTL ? 'غير نشط' : 'Inactive'}
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* User Details Form */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Username */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {isRTL ? 'اسم المستخدم' : 'Username'}
                    </label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                      />
                    ) : (
                      <div className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 border rounded-lg ${
                        theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                      }`}>
                        <User className={`w-5 h-5 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        <span className={`${
                          theme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          {currentUser.username}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {isRTL ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <div className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 border rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <Mail className={`w-5 h-5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentUser.email || (isRTL ? 'غير محدد' : 'Not specified')}
                      </span>
                      {currentUser.isGoogleUser && (
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                          Google
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company ID */}
                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {isRTL ? 'رقم الشركة' : 'Company ID'}
                    </label>
                    <div className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 border rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <Building className={`w-5 h-5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`font-mono text-lg ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentUser.companyId || (isRTL ? 'غير محدد' : 'Not assigned')}
                      </span>
                      <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
                        currentUser.companyId
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {currentUser.companyId ? (isRTL ? 'مُعيّن' : 'Assigned') : (isRTL ? 'غير مُعيّن' : 'Unassigned')}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {isRTL ? 'رقم الشركة مطلوب لتسجيل الدخول' : 'Company ID required for login'}
                    </p>
                  </div>

                  {/* Created At */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {isRTL ? 'تاريخ الإنشاء' : 'Created At'}
                    </label>
                    <div className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 border rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <Calendar className={`w-5 h-5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {new Date(currentUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* User ID */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {isRTL ? 'معرف المستخدم' : 'User ID'}
                    </label>
                    <div className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 border rounded-lg ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <Hash className={`w-5 h-5 ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`} />
                      <span className={`font-mono text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentUser.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                {isEditingProfile && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditingProfile(false)}
                      className={`px-4 py-2 border rounded-lg ${
                        theme === 'dark'
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      } transition-colors`}
                    >
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex items-center space-x-2 rtl:space-x-reverse"
                    >
                      <Save className="w-4 h-4" />
                      <span>{isRTL ? 'حفظ التغييرات' : 'Save Changes'}</span>
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Additional Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className={`rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isRTL ? 'معلومات إضافية' : 'Additional Information'}
                </h3>
              </div>

              <div className="p-4 sm:p-6 space-y-4">
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-blue-900/20' : 'bg-blue-50'
                } border border-blue-500/30`}>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Briefcase className="w-5 h-5 text-blue-500" />
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {isRTL ? 'صلاحيات المستخدم' : 'User Permissions'}
                    </span>
                  </div>
                  <p className={`text-sm mt-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {isRTL 
                      ? 'يمكنك عرض وإدارة المنتجات والمبيعات والتقارير'
                      : 'You can view and manage products, sales, and reports'
                    }
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50'
                } border border-green-500/30`}>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {isRTL ? 'الأمان' : 'Security'}
                    </span>
                  </div>
                  <p className={`text-sm mt-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {isRTL 
                      ? 'حسابك محمي برقم شركة فريد وكلمة مرور آمنة'
                      : 'Your account is protected with a unique company ID and secure password'
                    }
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-purple-900/20' : 'bg-purple-50'
                } border border-purple-500/30`}>
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <SettingsIcon className="w-5 h-5 text-purple-500" />
                    <span className={`font-medium ${
                      theme === 'dark' ? 'text-purple-400' : 'text-purple-600'
                    }`}>
                      {isRTL ? 'الإعدادات' : 'Settings'}
                    </span>
                  </div>
                  <p className={`text-sm mt-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {isRTL 
                      ? 'يمكنك تخصيص إعدادات النظام من صفحة الإعدادات'
                      : 'You can customize system settings from the settings page'
                    }
                  </p>
                </div>

                {currentUser.isGoogleUser && (
                  <div className={`p-4 rounded-lg ${
                    theme === 'dark' ? 'bg-orange-900/20' : 'bg-orange-50'
                  } border border-orange-500/30`}>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <Globe className="w-5 h-5 text-orange-500" />
                      <span className={`font-medium ${
                        theme === 'dark' ? 'text-orange-400' : 'text-orange-600'
                      }`}>
                        {isRTL ? 'حساب جوجل' : 'Google Account'}
                      </span>
                    </div>
                    <p className={`text-sm mt-2 ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {isRTL 
                        ? 'تم ربط حسابك بحساب جوجل للدخول السريع والآمن'
                        : 'Your account is linked with Google for quick and secure login'
                      }
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;