import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Lock, 
  Activity, 
  Clock, 
  User, 
  Globe,
  RefreshCw,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { SecurityLogger, BruteForceProtection } from '../../utils/security';

interface SecurityDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { theme, currentUser } = useStore();
  const [logs, setLogs] = useState(SecurityLogger.getLogs());
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setLogs(SecurityLogger.getLogs());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const filteredLogs = selectedSeverity === 'all' 
    ? logs 
    : logs.filter(log => log.severity === selectedSeverity);

  const severityCounts = {
    low: logs.filter(log => log.severity === 'low').length,
    medium: logs.filter(log => log.severity === 'medium').length,
    high: logs.filter(log => log.severity === 'high').length,
    critical: logs.filter(log => log.severity === 'critical').length
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-500 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'high': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
      case 'critical': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return CheckCircle;
      case 'medium': return Info;
      case 'high': return AlertTriangle;
      case 'critical': return XCircle;
      default: return Info;
    }
  };

  const exportLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Event,Severity,User ID,IP,User Agent\n"
      + filteredLogs.map(log => 
          `"${log.timestamp.toISOString()}","${log.event}","${log.severity}","${log.userId || 'N/A'}","${log.ip || 'N/A'}","${log.userAgent || 'N/A'}"`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `security-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
      >
        {/* Header */}
        <div className={`p-6 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="p-2 rounded-lg bg-red-500/20"
              >
                <Shield className="w-6 h-6 text-red-500" />
              </motion.div>
              <div>
                <h3 className={`text-xl font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {isRTL ? 'لوحة الأمان والمراقبة' : 'Security & Monitoring Dashboard'}
                </h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {isRTL ? 'مراقبة الأنشطة الأمنية في الوقت الفعلي' : 'Real-time security activity monitoring'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportLogs}
                className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                {isRTL ? 'تصدير' : 'Export'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  SecurityLogger.clearLogs();
                  setLogs([]);
                }}
                className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isRTL ? 'مسح' : 'Clear'}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className={`p-2 rounded-lg ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } transition-colors`}
              >
                <XCircle className={`w-5 h-5 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(severityCounts).map(([severity, count]) => {
              const Icon = getSeverityIcon(severity);
              return (
                <motion.div
                  key={severity}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setSelectedSeverity(selectedSeverity === severity ? 'all' : severity)}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedSeverity === severity 
                      ? getSeverityColor(severity) 
                      : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-medium ${
                        selectedSeverity === severity 
                          ? '' 
                          : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {severity.charAt(0).toUpperCase() + severity.slice(1)}
                      </p>
                      <p className={`text-2xl font-bold ${
                        selectedSeverity === severity 
                          ? '' 
                          : theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {count}
                      </p>
                    </div>
                    <Icon className={`w-6 h-6 ${
                      selectedSeverity === severity 
                        ? '' 
                        : getSeverityColor(severity).split(' ')[0]
                    }`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className={`text-center py-8 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{isRTL ? 'لا توجد سجلات أمنية' : 'No security logs found'}</p>
              </div>
            ) : (
              filteredLogs.slice().reverse().map((log, index) => {
                const Icon = getSeverityIcon(log.severity);
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${
                      theme === 'dark' 
                        ? 'border-gray-700 bg-gray-700/50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3 rtl:space-x-reverse">
                      <div className={`p-2 rounded-lg ${getSeverityColor(log.severity)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {log.event}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(log.severity)}`}>
                            {log.severity.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 rtl:space-x-reverse mt-2 text-sm">
                          <div className="flex items-center space-x-1 rtl:space-x-reverse">
                            <Clock className={`w-3 h-3 ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`} />
                            <span className={`${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              {log.timestamp.toLocaleString()}
                            </span>
                          </div>
                          
                          {log.userId && (
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <User className={`w-3 h-3 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                              <span className={`${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {log.userId}
                              </span>
                            </div>
                          )}
                          
                          {log.ip && (
                            <div className="flex items-center space-x-1 rtl:space-x-reverse">
                              <Globe className={`w-3 h-3 ${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`} />
                              <span className={`${
                                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {log.ip}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SecurityDashboard;