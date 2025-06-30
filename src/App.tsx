import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from './store/useStore';
import { useSecurityMonitor } from './hooks/useSecurityMonitor';
import Header from './components/Layout/Header';
import Notification from './components/UI/Notification';
import GoogleAuthProvider from './components/Auth/GoogleAuthProvider';
import './i18n';

// Lazy load components for better performance
const Landing = React.lazy(() => import('./pages/Landing'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Sales = React.lazy(() => import('./pages/Sales'));
const Reports = React.lazy(() => import('./pages/Reports'));
const About = React.lazy(() => import('./pages/About'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Download = React.lazy(() => import('./pages/Download'));
const Auth = React.lazy(() => import('./pages/Auth'));
const UserProfile = React.lazy(() => import('./pages/UserProfile'));

// Enhanced Loading component with security check
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading securely...</p>
    </div>
  </div>
);

// Enhanced Protected Route Component with security validation
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, currentUser, sessionToken, validateDataIntegrity } = useStore();
  
  // التحقق من صحة الجلسة والبيانات
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // التحقق من تكامل البيانات
      const isDataValid = validateDataIntegrity();
      if (!isDataValid) {
        console.warn('Data integrity check failed');
      }
      
      // التحقق من صحة الجلسة
      if (!sessionToken) {
        console.warn('Invalid session token');
      }
    }
  }, [isAuthenticated, currentUser, sessionToken, validateDataIntegrity]);
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { 
    theme, 
    language, 
    currentCurrency, 
    setCurrency, 
    addNotification, 
    isAuthenticated,
    encryptSensitiveData,
    currentUser
  } = useStore();
  const { i18n } = useTranslation();
  
  // تفعيل مراقبة الأمان
  useSecurityMonitor();

  useEffect(() => {
    try {
      // Apply theme to document
      document.documentElement.classList.toggle('dark', theme === 'dark');
      
      // Apply language direction
      document.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      
      // Change i18n language
      i18n.changeLanguage(language);
      
      // Load saved currency
      const savedCurrency = localStorage.getItem('currency');
      if (savedCurrency && savedCurrency !== currentCurrency) {
        setCurrency(savedCurrency);
      }

      // تشفير البيانات الحساسة عند تسجيل الدخول
      if (isAuthenticated && currentUser) {
        encryptSensitiveData();
      }

      // Register Service Worker for PWA with enhanced security
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
              console.log('✅ SW registered: ', registration);
              
              // Check for updates
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      addNotification({
                        type: 'success',
                        message: language === 'ar' 
                          ? 'تحديث أمني جديد متاح! أعد تحميل الصفحة للحصول على أحدث إصدار.'
                          : 'New security update available! Reload the page to get the latest version.'
                      });
                    }
                  });
                }
              });
            })
            .catch((registrationError) => {
              console.log('❌ SW registration failed: ', registrationError);
            });
        });
      }

      // Handle PWA install prompt with security notice
      let deferredPrompt: any;
      
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install notification after 3 seconds
        setTimeout(() => {
          addNotification({
            type: 'success',
            message: language === 'ar' 
              ? '📱 يمكنك تثبيت StockSence كتطبيق آمن! اذهب لصفحة "تحميل النظام"'
              : '📱 You can install StockSence as a secure app! Go to "Download System" page'
          });
        }, 3000);
      };

      const handleAppInstalled = () => {
        addNotification({
          type: 'success',
          message: language === 'ar' 
            ? '🎉 تم تثبيت StockSence بنجاح مع الحماية المتقدمة! يمكنك الآن استخدامه بدون إنترنت'
            : '🎉 StockSence installed successfully with advanced security! You can now use it offline'
        });
        deferredPrompt = null;
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);

      // Enhanced security: Disable right-click context menu in production (مع تحسين)
      const handleContextMenu = (e: MouseEvent) => {
        if (process.env.NODE_ENV === 'production') {
          e.preventDefault();
        }
      };

      // Enhanced security: Disable F12 and other dev tools shortcuts (مع تحسين لتجنب الإشعارات المتكررة)
      let lastKeydownNotification = 0;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (process.env.NODE_ENV === 'production') {
          // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
          if (e.key === 'F12' || 
              (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
              (e.ctrlKey && e.key === 'U')) {
            e.preventDefault();
            
            // إرسال إشعار واحد فقط كل 10 ثوانٍ
            const now = Date.now();
            if (now - lastKeydownNotification > 10000) {
              addNotification({
                type: 'warning',
                message: language === 'ar' 
                  ? '⚠️ تم تعطيل أدوات المطور لحماية النظام' 
                  : '⚠️ Developer tools disabled for system security'
              });
              lastKeydownNotification = now;
            }
          }
        }
      };

      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      };
    } catch (error) {
      console.error('Error in App useEffect:', error);
      addNotification({
        type: 'error',
        message: language === 'ar' 
          ? 'حدث خطأ في تهيئة النظام' 
          : 'System initialization error occurred'
      });
    }
  }, [theme, language, i18n, currentCurrency, setCurrency, addNotification, isAuthenticated, currentUser, encryptSensitiveData]);

  return (
    <GoogleAuthProvider>
      <Router>
        <div className={`min-h-screen transition-colors duration-300 ${
          theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
        }`}>
          <Header />
          <main>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<About />} />
                <Route path="/download" element={<Download />} />
                
                {/* Protected Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/sales" element={
                  <ProtectedRoute>
                    <Sales />
                  </ProtectedRoute>
                } />
                <Route path="/reports" element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } />
                
                {/* Redirect unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </main>
          <Notification />
        </div>
      </Router>
    </GoogleAuthProvider>
  );
}

export default App;