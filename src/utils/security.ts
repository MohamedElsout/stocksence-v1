import CryptoJS from 'crypto-js';

// مفتاح التشفير الأساسي (في التطبيق الحقيقي يجب أن يكون في متغيرات البيئة)
const ENCRYPTION_KEY = 'StockSence2024SecureKey!@#$%^&*()';

// تشفير البيانات الحساسة
export const encryptData = (data: string): string => {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return data;
  }
};

// فك تشفير البيانات
export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedData;
  }
};

// تشفير كلمات المرور باستخدام bcrypt-like hashing
export const hashPassword = (password: string): string => {
  const salt = CryptoJS.lib.WordArray.random(128/8);
  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize: 256/32,
    iterations: 10000
  });
  return salt.toString() + ':' + hash.toString();
};

// التحقق من كلمة المرور
export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  try {
    const [salt, hash] = hashedPassword.split(':');
    const computedHash = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse(salt), {
      keySize: 256/32,
      iterations: 10000
    });
    return computedHash.toString() === hash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
};

// إنشاء رمز مميز آمن
export const generateSecureToken = (): string => {
  return CryptoJS.lib.WordArray.random(256/8).toString();
};

// التحقق من قوة كلمة المرور
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain numbers');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain special characters');
  }

  return {
    isValid: score >= 4,
    score,
    feedback
  };
};

// تنظيف البيانات من XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

// التحقق من صحة البريد الإلكتروني
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// إنشاء معرف فريد آمن
export const generateSecureId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = CryptoJS.lib.WordArray.random(64/8).toString();
  return `${timestamp}_${randomPart}`;
};

// التحقق من صحة الرقم التسلسلي
export const validateSerialNumber = (serial: string): boolean => {
  return /^\d{6,16}$/.test(serial);
};

// حماية من هجمات Brute Force
export class BruteForceProtection {
  private static attempts: Map<string, { count: number; lastAttempt: number }> = new Map();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_TIME = 15 * 60 * 1000; // 15 دقيقة

  static isBlocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    if (!record) return false;

    if (record.count >= this.MAX_ATTEMPTS) {
      const timePassed = Date.now() - record.lastAttempt;
      if (timePassed < this.LOCKOUT_TIME) {
        return true;
      } else {
        // إعادة تعيين العداد بعد انتهاء فترة الحظر
        this.attempts.delete(identifier);
        return false;
      }
    }
    return false;
  }

  static recordAttempt(identifier: string, success: boolean): void {
    if (success) {
      this.attempts.delete(identifier);
      return;
    }

    const record = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
    record.count += 1;
    record.lastAttempt = Date.now();
    this.attempts.set(identifier, record);
  }

  static getRemainingTime(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record || record.count < this.MAX_ATTEMPTS) return 0;

    const timePassed = Date.now() - record.lastAttempt;
    const remaining = this.LOCKOUT_TIME - timePassed;
    return Math.max(0, Math.ceil(remaining / 1000));
  }
}

// تسجيل الأنشطة الأمنية
export class SecurityLogger {
  private static logs: Array<{
    timestamp: Date;
    event: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }> = [];

  static log(event: string, severity: 'low' | 'medium' | 'high' | 'critical' = 'low', userId?: string): void {
    this.logs.push({
      timestamp: new Date(),
      event,
      userId,
      severity,
      ip: 'localhost', // في التطبيق الحقيقي سيتم الحصول على IP الحقيقي
      userAgent: navigator.userAgent
    });

    // الاحتفاظ بآخر 1000 سجل فقط
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }

    // طباعة السجلات الحرجة في وحدة التحكم
    if (severity === 'critical' || severity === 'high') {
      console.warn(`🚨 Security Event [${severity.toUpperCase()}]:`, event, { userId, timestamp: new Date() });
    }
  }

  static getLogs(severity?: 'low' | 'medium' | 'high' | 'critical'): typeof this.logs {
    if (severity) {
      return this.logs.filter(log => log.severity === severity);
    }
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }
}

// فئة إدارة الجلسات
export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 دقيقة
  private static sessionData: Map<string, {
    userId: string;
    lastActivity: number;
    token: string;
  }> = new Map();

  static createSession(userId: string): string {
    const token = generateSecureToken();
    this.sessionData.set(token, {
      userId,
      lastActivity: Date.now(),
      token
    });
    return token;
  }

  static validateSession(token: string): boolean {
    const session = this.sessionData.get(token);
    if (!session) return false;

    const timePassed = Date.now() - session.lastActivity;
    if (timePassed > this.SESSION_TIMEOUT) {
      this.sessionData.delete(token);
      return false;
    }

    // تحديث وقت النشاط الأخير
    session.lastActivity = Date.now();
    return true;
  }

  static destroySession(token: string): void {
    this.sessionData.delete(token);
  }

  static cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.sessionData.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        this.sessionData.delete(token);
      }
    }
  }
}

// حماية البيانات الحساسة في localStorage
export class SecureStorage {
  private static readonly STORAGE_KEY = 'stocksence_secure_data';

  static setItem(key: string, value: any): void {
    try {
      const data = this.getData();
      data[key] = encryptData(JSON.stringify(value));
      localStorage.setItem(this.STORAGE_KEY, encryptData(JSON.stringify(data)));
    } catch (error) {
      console.error('Secure storage set error:', error);
    }
  }

  static getItem(key: string): any {
    try {
      const data = this.getData();
      if (data[key]) {
        return JSON.parse(decryptData(data[key]));
      }
      return null;
    } catch (error) {
      console.error('Secure storage get error:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      const data = this.getData();
      delete data[key];
      localStorage.setItem(this.STORAGE_KEY, encryptData(JSON.stringify(data)));
    } catch (error) {
      console.error('Secure storage remove error:', error);
    }
  }

  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private static getData(): Record<string, string> {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_KEY);
      if (encryptedData) {
        return JSON.parse(decryptData(encryptedData));
      }
      return {};
    } catch (error) {
      console.error('Secure storage data retrieval error:', error);
      return {};
    }
  }
}