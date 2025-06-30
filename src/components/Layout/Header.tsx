import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { 
  LogIn,
  LogOut,
  UserCircle,
  Sun,
  Moon,
  Shield,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useSecurityMonitor } from '../../hooks/useSecurityMonitor';
import SecurityDashboard from '../Security/SecurityDashboard';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { theme, currentUser, isAuthenticated, logout, toggleTheme } = useStore();
  const { SecurityLogger } = useSecurityMonitor();
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const isRTL = i18n.language === 'ar';

  const handleLogout = () => {
    logout();
  };

  // إحصائيات الأمان
  const securityLogs = SecurityLogger.getLogs();
  const criticalEvents = securityLogs.filter(log => log.severity === 'critical' || log.severity === 'high').length;
  const hasSecurityAlerts = criticalEvents > 0;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-gray-900/80 border-gray-700'
            : 'bg-white/80 border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center cursor-pointer space-x-3 rtl:space-x-reverse"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img 
                    src="/logo2 copy copy.png" 
                    alt="StockSence Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <motion.h2 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className={`font-bold text-xl bg-gradient-to-r ${
                    theme === 'dark' 
                      ? 'from-blue-400 via-purple-400 to-pink-400' 
                      : 'from-blue-600 via-purple-600 to-pink-600'
                  } bg-clip-text text-transparent`}
                >
                  StockSence
                </motion.h2>
              </motion.div>
            </Link>

            {/* Right Section */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              {/* Security Dashboard Button - للمستخدمين المسجلين فقط */}
              {isAuthenticated && currentUser?.role === 'admin' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSecurityDashboard(true)}
                  className={`relative p-3 rounded-xl transition-all duration-500 group ${
                    hasSecurityAlerts
                      ? 'bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg animate-pulse'
                      : theme === 'dark'
                      ? 'bg-gradient-to-br from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-gray-600 shadow-lg'
                      : 'bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 border border-gray-200 shadow-md'
                  }`}
                  title={isRTL ? 'لوحة الأمان والمراقبة' : 'Security & Monitoring Dashboard'}
                >
                  <motion.div
                    animate={{ 
                      rotate: hasSecurityAlerts ? [0, 10, -10, 0] : 0,
                      scale: hasSecurityAlerts ? [1, 1.1, 1] : 1
                    }}
                    transition={{ 
                      duration: hasSecurityAlerts ? 0.5 : 0,
                      repeat: hasSecurityAlerts ? Infinity : 0
                    }}
                    className="relative"
                  >
                    <Shield className={`w-5 h-5 ${
                      hasSecurityAlerts 
                        ? 'text-white' 
                        : theme === 'dark' 
                        ? 'text-blue-400' 
                        : 'text-blue-600'
                    }`} />
                    
                    {/* Security Alert Badge */}
                    {hasSecurityAlerts && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
                      >
                        {criticalEvents > 9 ? '9+' : criticalEvents}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Glow Effect for Alerts */}
                  {hasSecurityAlerts && (
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0, 0.5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 rounded-xl bg-red-500 shadow-lg"
                    />
                  )}
                </motion.button>
              )}

              {/* Theme Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                className={`relative p-3 rounded-xl transition-all duration-500 group ${
                  theme === 'dark'
                    ? 'bg-gradient-to-br from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 border border-gray-600 shadow-lg'
                    : 'bg-gradient-to-br from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 border border-gray-200 shadow-md'
                }`}
                title={theme === 'dark' ? (t('lightMode') || 'Switch to Light Mode') : (t('darkMode') || 'Switch to Dark Mode')}
              >
                <motion.div
                  animate={{ 
                    rotate: theme === 'dark' ? 0 : 180,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 0.6, ease: "easeInOut" },
                    scale: { duration: 0.3 }
                  }}
                  className="relative"
                >
                  <motion.div
                    animate={{ 
                      opacity: theme === 'dark' ? 0 : 1,
                      scale: theme === 'dark' ? 0.8 : 1,
                      rotate: theme === 'dark' ? -90 : 0
                    }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Sun className={`w-5 h-5 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-yellow-500'
                    }`} />
                  </motion.div>

                  <motion.div
                    animate={{ 
                      opacity: theme === 'dark' ? 1 : 0,
                      scale: theme === 'dark' ? 1 : 0.8,
                      rotate: theme === 'dark' ? 0 : 90
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center justify-center"
                  >
                    <Moon className={`w-5 h-5 ${
                      theme === 'dark' ? 'text-blue-400' : 'text-gray-500'
                    }`} />
                  </motion.div>
                </motion.div>

                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0, 0.3, 0]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`absolute inset-0 rounded-xl ${
                    theme === 'dark' 
                      ? 'bg-blue-400 shadow-blue-400/50' 
                      : 'bg-yellow-400 shadow-yellow-400/50'
                  } shadow-lg`}
                />
              </motion.button>

              {/* User Section */}
              {isAuthenticated && currentUser ? (
                <>
                  {/* Profile Link */}
                  <Link to="/profile">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`hidden sm:flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 ${
                        location.pathname === '/profile'
                          ? theme === 'dark'
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-500 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-800 hover:bg-gray-700'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {currentUser.picture ? (
                        <img 
                          src={currentUser.picture} 
                          alt={currentUser.username}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <UserCircle className={`w-4 h-4 ${
                          currentUser.role === 'admin' ? 'text-purple-500' : 'text-blue-500'
                        } ${location.pathname === '/profile' ? 'text-white' : ''}`} />
                      )}
                      <span className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {currentUser.username}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        currentUser.role === 'admin'
                          ? location.pathname === '/profile'
                            ? 'bg-white/20 text-white'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                          : location.pathname === '/profile'
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {currentUser.role === 'admin' ? 'Admin' : 'Employee'}
                      </span>
                      
                      {/* Security Status Indicator */}
                      {currentUser.twoFactorEnabled && (
                        <Shield className="w-3 h-3 text-green-500" title="2FA Enabled" />
                      )}
                    </motion.div>
                  </Link>

                  {/* Logout Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className={`flex items-center space-x-2 rtl:space-x-reverse px-3 py-2 rounded-lg transition-all duration-200 ${
                      theme === 'dark'
                        ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                        : 'text-red-600 hover:text-red-500 hover:bg-red-50'
                    }`}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('logout')}</span>
                  </motion.button>
                </>
              ) : (
                /* Login Button */
                <Link to="/auth">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 rtl:space-x-reverse px-4 py-2 rounded-lg transition-all duration-200 ${
                      theme === 'dark'
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{t('login')}</span>
                  </motion.button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Security Dashboard Modal */}
      <SecurityDashboard 
        isOpen={showSecurityDashboard}
        onClose={() => setShowSecurityDashboard(false)}
      />
    </>
  );
};

export default Header;