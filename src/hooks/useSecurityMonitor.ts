import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import { SecurityLogger, SessionManager, BruteForceProtection } from '../utils/security';

export const useSecurityMonitor = () => {
  const { currentUser, addNotification, language } = useStore();
  
  // استخدام useRef لتتبع الإشعارات المرسلة لتجنب التكرار
  const notificationsSent = useRef({
    devTools: false,
    lastDevToolsCheck: 0,
    lastMemoryCheck: 0,
    lastSecurityAlert: 0
  });

  // مراقبة النشاط المشبوه
  const monitorSuspiciousActivity = useCallback(() => {
    // مراقبة محاولات الوصول المتكررة
    const handleVisibilityChange = () => {
      if (document.hidden) {
        SecurityLogger.log('User left tab/window', 'low', currentUser?.id);
      } else {
        SecurityLogger.log('User returned to tab/window', 'low', currentUser?.id);
      }
    };

    // مراقبة محاولات فتح أدوات المطور - مع تحسين لتجنب الإشعارات المتكررة
    const handleDevToolsOpen = () => {
      const now = Date.now();
      // إرسال إشعار واحد فقط كل 5 دقائق
      if (now - notificationsSent.current.lastSecurityAlert > 5 * 60 * 1000) {
        SecurityLogger.log('Developer tools opened - potential security risk', 'medium', currentUser?.id);
        addNotification({
          type: 'warning',
          message: language === 'ar' 
            ? '⚠️ تم اكتشاف فتح أدوات المطور - يرجى الحذر' 
            : '⚠️ Developer tools detected - please be cautious'
        });
        notificationsSent.current.lastSecurityAlert = now;
      }
    };

    // مراقبة محاولات النسخ المشبوهة
    const handleSuspiciousCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString();
      if (selection && selection.length > 100) {
        SecurityLogger.log('Large text copied - potential data extraction', 'medium', currentUser?.id);
      }
    };

    // مراقبة محاولات الطباعة
    const handlePrint = () => {
      SecurityLogger.log('Print attempt detected', 'medium', currentUser?.id);
      addNotification({
        type: 'warning',
        message: language === 'ar' 
          ? '🖨️ تم اكتشاف محاولة طباعة - تأكد من أمان البيانات' 
          : '🖨️ Print attempt detected - ensure data security'
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('copy', handleSuspiciousCopy);
    window.addEventListener('beforeprint', handlePrint);

    // فحص أدوات المطور - مع تحسين للتكرار
    const devToolsChecker = setInterval(() => {
      const now = Date.now();
      // فحص كل 5 ثوانٍ بدلاً من كل ثانية
      if (now - notificationsSent.current.lastDevToolsCheck > 5000) {
        const threshold = 160;
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
          
          // إرسال إشعار واحد فقط إذا لم يتم إرساله من قبل في هذه الجلسة
          if (!notificationsSent.current.devTools) {
            handleDevToolsOpen();
            notificationsSent.current.devTools = true;
            
            // إعادة تعيين العلامة بعد 10 دقائق
            setTimeout(() => {
              notificationsSent.current.devTools = false;
            }, 10 * 60 * 1000);
          }
        } else {
          // إعادة تعيين العلامة إذا تم إغلاق أدوات المطور
          notificationsSent.current.devTools = false;
        }
        notificationsSent.current.lastDevToolsCheck = now;
      }
    }, 5000); // فحص كل 5 ثوانٍ بدلاً من كل ثانية

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('copy', handleSuspiciousCopy);
      window.removeEventListener('beforeprint', handlePrint);
      clearInterval(devToolsChecker);
    };
  }, [currentUser, addNotification, language]);

  // تنظيف الجلسات المنتهية الصلاحية
  const cleanupSessions = useCallback(() => {
    const cleanup = () => {
      SessionManager.cleanupExpiredSessions();
      SecurityLogger.log('Session cleanup performed', 'low');
    };

    const interval = setInterval(cleanup, 5 * 60 * 1000); // كل 5 دقائق
    return () => clearInterval(interval);
  }, []);

  // مراقبة محاولات الهجوم - مع تحسين للأداء
  const monitorAttackAttempts = useCallback(() => {
    // مراقبة محاولات SQL Injection في المدخلات
    const checkForSQLInjection = (input: string): boolean => {
      const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
        /(--|\/\*|\*\/)/,
        /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i
      ];
      
      return sqlPatterns.some(pattern => pattern.test(input));
    };

    // مراقبة محاولات XSS
    const checkForXSS = (input: string): boolean => {
      const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ];
      
      return xssPatterns.some(pattern => pattern.test(input));
    };

    // فحص جميع المدخلات - مع تحسين لتجنب الفحص المتكرر
    const monitorInputs = () => {
      const inputs = document.querySelectorAll('input, textarea');
      inputs.forEach(input => {
        // التحقق من وجود مستمع مسبق لتجنب التكرار
        if (!input.hasAttribute('data-security-monitored')) {
          input.setAttribute('data-security-monitored', 'true');
          
          input.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            
            if (checkForSQLInjection(value)) {
              SecurityLogger.log('SQL Injection attempt detected', 'critical', currentUser?.id);
              addNotification({
                type: 'error',
                message: language === 'ar' 
                  ? '🚨 تم اكتشاف محاولة هجوم SQL - تم حظر المدخل' 
                  : '🚨 SQL Injection attempt detected - input blocked'
              });
              (e.target as HTMLInputElement).value = '';
            }
            
            if (checkForXSS(value)) {
              SecurityLogger.log('XSS attempt detected', 'critical', currentUser?.id);
              addNotification({
                type: 'error',
                message: language === 'ar' 
                  ? '🚨 تم اكتشاف محاولة هجوم XSS - تم حظر المدخل' 
                  : '🚨 XSS attempt detected - input blocked'
              });
              (e.target as HTMLInputElement).value = '';
            }
          });
        }
      });
    };

    // تشغيل المراقبة عند تحميل الصفحة
    monitorInputs();
    
    // مراقبة التغييرات في DOM مع تحسين الأداء
    const observer = new MutationObserver((mutations) => {
      let shouldMonitor = false;
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldMonitor = true;
        }
      });
      
      if (shouldMonitor) {
        // تأخير قصير لتجنب الفحص المتكرر
        setTimeout(monitorInputs, 100);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [currentUser, addNotification, language]);

  // مراقبة استهلاك الذاكرة - مع تحسين التكرار
  const monitorPerformance = useCallback(() => {
    const checkPerformance = () => {
      const now = Date.now();
      // فحص كل دقيقة بدلاً من كل 30 ثانية
      if (now - notificationsSent.current.lastMemoryCheck > 60000) {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const usedMB = memory.usedJSHeapSize / 1024 / 1024;
          const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
          
          if (usedMB > limitMB * 0.8) {
            SecurityLogger.log('High memory usage detected', 'medium', currentUser?.id);
            addNotification({
              type: 'warning',
              message: language === 'ar' 
                ? '⚠️ استهلاك ذاكرة عالي - قد يؤثر على الأداء' 
                : '⚠️ High memory usage - may affect performance'
            });
          }
        }
        notificationsSent.current.lastMemoryCheck = now;
      }
    };

    const interval = setInterval(checkPerformance, 60000); // كل دقيقة
    return () => clearInterval(interval);
  }, [currentUser, addNotification, language]);

  useEffect(() => {
    if (!currentUser) return;

    const cleanups = [
      monitorSuspiciousActivity(),
      cleanupSessions(),
      monitorAttackAttempts(),
      monitorPerformance()
    ];

    SecurityLogger.log('Security monitoring started', 'low', currentUser.id);

    return () => {
      cleanups.forEach(cleanup => cleanup?.());
      SecurityLogger.log('Security monitoring stopped', 'low', currentUser.id);
      // إعادة تعيين العلامات عند إلغاء التحميل
      notificationsSent.current = {
        devTools: false,
        lastDevToolsCheck: 0,
        lastMemoryCheck: 0,
        lastSecurityAlert: 0
      };
    };
  }, [currentUser, monitorSuspiciousActivity, cleanupSessions, monitorAttackAttempts, monitorPerformance]);

  return {
    SecurityLogger,
    SessionManager,
    BruteForceProtection
  };
};