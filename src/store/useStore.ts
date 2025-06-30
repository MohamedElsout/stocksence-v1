import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  encryptData, 
  decryptData, 
  hashPassword, 
  verifyPassword, 
  generateSecureId,
  validatePasswordStrength,
  sanitizeInput,
  validateEmail,
  BruteForceProtection,
  SecurityLogger,
  SecureStorage
} from '../utils/security';

export interface Product {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  category: string;
  serialNumber: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  companyId?: string;
  isEncrypted?: boolean;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  totalAmount: number;
  saleDate: Date;
  barcodeScan?: boolean;
  soldBy?: string;
  companyId?: string;
  isEncrypted?: boolean;
}

export interface DeletedSale extends Sale {
  deletedAt: Date;
  deletedBy?: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  nameAr: string;
  rate: number;
}

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'employee';
  companyId: string;
  createdAt: Date;
  isActive: boolean;
  email?: string;
  googleId?: string;
  picture?: string;
  isGoogleUser?: boolean;
  lastLogin?: Date;
  loginAttempts?: number;
  isLocked?: boolean;
  lockoutUntil?: Date;
  sessionToken?: string;
  passwordStrength?: number;
  twoFactorEnabled?: boolean;
  securityQuestions?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
}

export interface SerialNumber {
  id: string;
  serialNumber: string;
  isUsed: boolean;
  createdAt: Date;
  usedBy?: string;
  usedAt?: Date;
  companyId: string;
  isEncrypted?: boolean;
}

export interface SecurityEvent {
  id: string;
  type: 'login' | 'logout' | 'failed_login' | 'data_access' | 'data_modification' | 'suspicious_activity';
  userId?: string;
  timestamp: Date;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
}

interface StoreState {
  // Authentication
  currentUser: User | null;
  users: User[];
  serialNumbers: SerialNumber[];
  isAuthenticated: boolean;
  autoLoginWithGoogle: boolean;
  currentCompanyId: string | null;
  sessionToken: string | null;
  securityEvents: SecurityEvent[];
  
  // Enhanced Security Methods
  login: (username: string, password: string, companyId?: string) => Promise<boolean>;
  loginWithGoogle: (googleUserInfo: GoogleUserInfo) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, email?: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  enableTwoFactor: () => Promise<boolean>;
  disableTwoFactor: () => Promise<boolean>;
  verifyTwoFactor: (code: string) => Promise<boolean>;
  
  // Security Management
  addSecurityEvent: (event: Omit<SecurityEvent, 'id' | 'timestamp'>) => void;
  getSecurityEvents: (userId?: string) => SecurityEvent[];
  clearSecurityEvents: () => void;
  lockUser: (userId: string, reason: string) => void;
  unlockUser: (userId: string) => void;
  
  // Data Protection
  encryptSensitiveData: () => void;
  decryptSensitiveData: () => void;
  validateDataIntegrity: () => boolean;
  backupData: () => string;
  restoreData: (backupData: string) => boolean;
  
  addSerialNumber: (serialNumber: string) => void;
  removeSerialNumber: (id: string) => void;
  setAutoLoginWithGoogle: (enabled: boolean) => void;
  clearAllData: () => void;
  clearSalesHistory: () => void;
  
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'serialNumber' | 'createdBy' | 'companyId'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  sales: Sale[];
  deletedSales: DeletedSale[];
  addSale: (sale: Omit<Sale, 'id' | 'saleDate' | 'soldBy' | 'companyId'>) => void;
  deleteSale: (id: string) => void;
  restoreSale: (id: string) => void;
  permanentlyDeleteSale: (id: string) => void;
  emptyTrash: () => void;
  cleanupOldDeletedSales: () => void;
  
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  toggleTheme: () => void;
  setLanguage: (lang: 'en' | 'ar') => void;
  
  currencies: Currency[];
  currentCurrency: string;
  setCurrency: (currencyCode: string) => void;
  convertPrice: (price: number, fromCurrency?: string, toCurrency?: string) => number;
  formatPrice: (price: number, currencyCode?: string) => string;
  
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning';
    message: string;
  }>;
  addNotification: (notification: { type: 'success' | 'error' | 'warning'; message: string }) => void;
  removeNotification: (id: string) => void;
}

const generateId = () => generateSecureId();
const generateCompanyId = () => `COMP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

// دالة لإنشاء رقم تسلسلي للمنتج (6-16 رقم)
const generateProductSerial = () => {
  const min = 100000;
  const max = 9999999999999999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

// دالة لإنشاء رقم تسلسلي بسيط من 6 أرقام للمستخدمين
const generateSimpleSerial = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// دالة للتحقق من عمر المبيعة المحذوفة (30 يوم)
const isOlderThan30Days = (deletedAt: Date): boolean => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return new Date(deletedAt) < thirtyDaysAgo;
};

const currencies: Currency[] = [
  {
    code: 'EGP',
    symbol: 'ج.م',
    name: 'Egyptian Pound',
    nameAr: 'الجنيه المصري',
    rate: 1.0
  },
  {
    code: 'SAR',
    symbol: 'ر.س',
    name: 'Saudi Riyal',
    nameAr: 'الريال السعودي',
    rate: 0.13
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    nameAr: 'الدولار الأمريكي',
    rate: 0.032
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    nameAr: 'اليورو',
    rate: 0.030
  }
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Authentication state
      currentUser: null,
      users: [],
      serialNumbers: [],
      isAuthenticated: false,
      autoLoginWithGoogle: false,
      currentCompanyId: null,
      sessionToken: null,
      securityEvents: [],

      login: async (username: string, password: string, companyId?: string) => {
        const state = get();
        const clientId = `${username}_${companyId || 'unknown'}`;
        
        // التحقق من الحماية ضد Brute Force
        if (BruteForceProtection.isBlocked(clientId)) {
          const remainingTime = BruteForceProtection.getRemainingTime(clientId);
          SecurityLogger.log(`Blocked login attempt for ${username} - ${remainingTime}s remaining`, 'high', undefined);
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' 
              ? `تم حظر المحاولات لمدة ${Math.ceil(remainingTime / 60)} دقيقة` 
              : `Login blocked for ${Math.ceil(remainingTime / 60)} minutes` 
          });
          return false;
        }

        // تنظيف البيانات من المدخلات
        const cleanUsername = sanitizeInput(username);
        const cleanCompanyId = companyId ? sanitizeInput(companyId) : '';

        // 🧹 تنظيف المبيعات القديمة عند تسجيل الدخول
        get().cleanupOldDeletedSales();
        
        // Test account - رقم الشركة 0000
        if (cleanUsername === 'test' && password === 'test') {
          const testUser: User = {
            id: 'test-user',
            username: 'test',
            password: hashPassword('test'),
            role: 'admin',
            companyId: '0000',
            createdAt: new Date(),
            isActive: true,
            email: 'test@example.com',
            lastLogin: new Date(),
            passwordStrength: 3
          };
          
          BruteForceProtection.recordAttempt(clientId, true);
          SecurityLogger.log('Test account login successful', 'low', testUser.id);
          
          set({ 
            currentUser: testUser, 
            isAuthenticated: true,
            currentCompanyId: '0000',
            sessionToken: generateSecureId()
          });
          
          get().addSecurityEvent({
            type: 'login',
            userId: testUser.id,
            details: 'Test account login',
            severity: 'low'
          });
          
          get().addNotification({ 
            type: 'success', 
            message: state.language === 'ar' ? 'تم تسجيل الدخول بالحساب التجريبي! رقم الشركة: 0000' : 'Logged in with test account! Company ID: 0000' 
          });
          return true;
        }
        
        // Find user by username
        const user = state.users.find(u => u.username === cleanUsername && u.isActive);
        if (!user) {
          BruteForceProtection.recordAttempt(clientId, false);
          SecurityLogger.log(`Failed login attempt - user not found: ${cleanUsername}`, 'medium', undefined);
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password' 
          });
          return false;
        }

        // Check if user is locked
        if (user.isLocked && user.lockoutUntil && new Date() < user.lockoutUntil) {
          SecurityLogger.log(`Login attempt for locked user: ${cleanUsername}`, 'high', user.id);
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'الحساب مقفل مؤقتاً' : 'Account temporarily locked' 
          });
          return false;
        }

        // Verify password
        if (!verifyPassword(password, user.password)) {
          BruteForceProtection.recordAttempt(clientId, false);
          SecurityLogger.log(`Failed login attempt - wrong password: ${cleanUsername}`, 'medium', user.id);
          
          // Update failed login attempts
          const updatedUser = {
            ...user,
            loginAttempts: (user.loginAttempts || 0) + 1
          };
          
          // Lock user after 5 failed attempts
          if (updatedUser.loginAttempts >= 5) {
            updatedUser.isLocked = true;
            updatedUser.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            SecurityLogger.log(`User locked due to multiple failed attempts: ${cleanUsername}`, 'high', user.id);
          }
          
          set(state => ({
            users: state.users.map(u => u.id === user.id ? updatedUser : u)
          }));
          
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'Invalid username or password' 
          });
          return false;
        }

        // Check company ID
        if (!cleanCompanyId) {
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'رقم الشركة مطلوب' : 'Company ID is required' 
          });
          return false;
        }

        // Verify company ID
        if (user.companyId !== cleanCompanyId) {
          BruteForceProtection.recordAttempt(clientId, false);
          SecurityLogger.log(`Failed login attempt - wrong company ID: ${cleanUsername}`, 'medium', user.id);
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'رقم الشركة غير صحيح' : 'Invalid company ID' 
          });
          return false;
        }
        
        // Successful login
        BruteForceProtection.recordAttempt(clientId, true);
        SecurityLogger.log(`Successful login: ${cleanUsername}`, 'low', user.id);
        
        const updatedUser = {
          ...user,
          lastLogin: new Date(),
          loginAttempts: 0,
          isLocked: false,
          lockoutUntil: undefined,
          sessionToken: generateSecureId()
        };
        
        set(state => ({
          users: state.users.map(u => u.id === user.id ? updatedUser : u),
          currentUser: updatedUser, 
          isAuthenticated: true,
          currentCompanyId: user.companyId,
          sessionToken: updatedUser.sessionToken
        }));
        
        get().addSecurityEvent({
          type: 'login',
          userId: user.id,
          details: `Login from company ${cleanCompanyId}`,
          severity: 'low'
        });
        
        get().addNotification({ 
          type: 'success', 
          message: state.language === 'ar' ? 'تم تسجيل الدخول بنجاح!' : 'Login successful!' 
        });
        return true;
      },

      loginWithGoogle: async (googleUserInfo: GoogleUserInfo) => {
        const state = get();
        
        // تنظيف البيانات
        const cleanEmail = sanitizeInput(googleUserInfo.email);
        const cleanName = sanitizeInput(googleUserInfo.name);
        
        if (!validateEmail(cleanEmail)) {
          SecurityLogger.log(`Invalid email in Google login: ${cleanEmail}`, 'medium', undefined);
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'بريد إلكتروني غير صحيح' : 'Invalid email address' 
          });
          return false;
        }
        
        // 🧹 تنظيف المبيعات القديمة عند تسجيل الدخول
        get().cleanupOldDeletedSales();
        
        // البحث عن مستخدم موجود
        let existingUser = state.users.find(u => 
          u.googleId === googleUserInfo.id || 
          (u.email === cleanEmail && u.isGoogleUser)
        );
        
        if (existingUser) {
          // تحديث معلومات المستخدم الموجود
          const updatedUser = {
            ...existingUser,
            googleId: googleUserInfo.id,
            picture: googleUserInfo.picture,
            isGoogleUser: true,
            lastLogin: new Date(),
            sessionToken: generateSecureId()
          };
          
          SecurityLogger.log(`Google login successful: ${cleanEmail}`, 'low', existingUser.id);
          
          set(state => ({
            users: state.users.map(u => u.id === existingUser!.id ? updatedUser : u),
            currentUser: updatedUser,
            isAuthenticated: true,
            currentCompanyId: updatedUser.companyId,
            sessionToken: updatedUser.sessionToken
          }));
          
          get().addSecurityEvent({
            type: 'login',
            userId: existingUser.id,
            details: 'Google OAuth login',
            severity: 'low'
          });
          
          return true;
        } else {
          // إنشاء مستخدم جديد من Google
          const companyId = generateCompanyId();
          const newUser: User = {
            id: generateId(),
            username: cleanName.replace(/\s+/g, '_').toLowerCase(),
            password: hashPassword(generateSecureId()), // كلمة مرور عشوائية آمنة
            role: 'admin',
            companyId,
            createdAt: new Date(),
            isActive: true,
            email: cleanEmail,
            googleId: googleUserInfo.id,
            picture: googleUserInfo.picture,
            isGoogleUser: true,
            lastLogin: new Date(),
            passwordStrength: 5,
            sessionToken: generateSecureId()
          };
          
          // إنشاء رقم تسلسلي تلقائي
          const autoSerialNumber = generateSimpleSerial();
          const newSerial: SerialNumber = {
            id: generateId(),
            serialNumber: autoSerialNumber,
            isUsed: true,
            createdAt: new Date(),
            usedBy: newUser.id,
            usedAt: new Date(),
            companyId
          };
          
          SecurityLogger.log(`New Google user registered: ${cleanEmail}`, 'low', newUser.id);
          
          set(state => ({
            users: [...state.users, newUser],
            currentUser: newUser,
            isAuthenticated: true,
            currentCompanyId: companyId,
            serialNumbers: [...state.serialNumbers, newSerial],
            sessionToken: newUser.sessionToken
          }));
          
          get().addSecurityEvent({
            type: 'login',
            userId: newUser.id,
            details: 'New Google user registration and login',
            severity: 'low'
          });
          
          return true;
        }
      },

      register: async (username: string, password: string, email?: string) => {
        const state = get();
        
        // تنظيف البيانات
        const cleanUsername = sanitizeInput(username);
        const cleanEmail = email ? sanitizeInput(email) : '';
        
        // التحقق من قوة كلمة المرور
        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' 
              ? 'كلمة المرور ضعيفة. يجب أن تحتوي على 8 أحرف على الأقل مع أرقام وحروف كبيرة وصغيرة ورموز خاصة' 
              : 'Weak password. Must contain at least 8 characters with numbers, uppercase, lowercase and special characters' 
          });
          return false;
        }
        
        // التحقق من البريد الإلكتروني
        if (cleanEmail && !validateEmail(cleanEmail)) {
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'بريد إلكتروني غير صحيح' : 'Invalid email address' 
          });
          return false;
        }
        
        // التحقق من وجود اسم المستخدم
        if (state.users.find(u => u.username === cleanUsername)) {
          SecurityLogger.log(`Registration attempt with existing username: ${cleanUsername}`, 'medium', undefined);
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'اسم المستخدم موجود بالفعل' : 'Username already exists' 
          });
          return false;
        }
        
        // إنشاء شركة جديدة
        const companyId = generateCompanyId();
        
        const newUser: User = {
          id: generateId(),
          username: cleanUsername,
          password: hashPassword(password),
          role: 'admin',
          companyId,
          createdAt: new Date(),
          isActive: true,
          email: cleanEmail,
          passwordStrength: passwordValidation.score,
          sessionToken: generateSecureId()
        };
        
        // إنشاء رقم تسلسلي تلقائي
        const autoSerialNumber = generateSimpleSerial();
        const newSerial: SerialNumber = {
          id: generateId(),
          serialNumber: autoSerialNumber,
          isUsed: true,
          createdAt: new Date(),
          usedBy: newUser.id,
          usedAt: new Date(),
          companyId
        };
        
        SecurityLogger.log(`New user registered: ${cleanUsername}`, 'low', newUser.id);
        
        set(state => ({
          users: [...state.users, newUser],
          currentUser: newUser,
          isAuthenticated: true,
          currentCompanyId: companyId,
          serialNumbers: [...state.serialNumbers, newSerial],
          sessionToken: newUser.sessionToken
        }));
        
        get().addSecurityEvent({
          type: 'login',
          userId: newUser.id,
          details: 'New user registration',
          severity: 'low'
        });
        
        get().addNotification({ 
          type: 'success', 
          message: state.language === 'ar' 
            ? `تم إنشاء حساب الأدمن بنجاح! رقم الشركة: ${companyId}` 
            : `Admin account created successfully! Company ID: ${companyId}` 
        });
        return true;
      },

      changePassword: async (oldPassword: string, newPassword: string) => {
        const state = get();
        const user = state.currentUser;
        
        if (!user) {
          return false;
        }
        
        // التحقق من كلمة المرور القديمة
        if (!verifyPassword(oldPassword, user.password)) {
          SecurityLogger.log('Failed password change - wrong old password', 'medium', user.id);
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' ? 'كلمة المرور القديمة غير صحيحة' : 'Old password is incorrect' 
          });
          return false;
        }
        
        // التحقق من قوة كلمة المرور الجديدة
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' 
              ? 'كلمة المرور الجديدة ضعيفة' 
              : 'New password is too weak' 
          });
          return false;
        }
        
        // تحديث كلمة المرور
        const updatedUser = {
          ...user,
          password: hashPassword(newPassword),
          passwordStrength: passwordValidation.score
        };
        
        set(state => ({
          users: state.users.map(u => u.id === user.id ? updatedUser : u),
          currentUser: updatedUser
        }));
        
        SecurityLogger.log('Password changed successfully', 'low', user.id);
        get().addSecurityEvent({
          type: 'data_modification',
          userId: user.id,
          details: 'Password changed',
          severity: 'low'
        });
        
        get().addNotification({ 
          type: 'success', 
          message: state.language === 'ar' ? 'تم تغيير كلمة المرور بنجاح!' : 'Password changed successfully!' 
        });
        return true;
      },

      resetPassword: async (email: string) => {
        // في التطبيق الحقيقي، سيتم إرسال رابط إعادة تعيين كلمة المرور
        SecurityLogger.log(`Password reset requested for email: ${email}`, 'low', undefined);
        return true;
      },

      enableTwoFactor: async () => {
        const state = get();
        const user = state.currentUser;
        
        if (!user) return false;
        
        const updatedUser = {
          ...user,
          twoFactorEnabled: true
        };
        
        set(state => ({
          users: state.users.map(u => u.id === user.id ? updatedUser : u),
          currentUser: updatedUser
        }));
        
        SecurityLogger.log('Two-factor authentication enabled', 'low', user.id);
        return true;
      },

      disableTwoFactor: async () => {
        const state = get();
        const user = state.currentUser;
        
        if (!user) return false;
        
        const updatedUser = {
          ...user,
          twoFactorEnabled: false
        };
        
        set(state => ({
          users: state.users.map(u => u.id === user.id ? updatedUser : u),
          currentUser: updatedUser
        }));
        
        SecurityLogger.log('Two-factor authentication disabled', 'medium', user.id);
        return true;
      },

      verifyTwoFactor: async (code: string) => {
        // في التطبيق الحقيقي، سيتم التحقق من الرمز مع خدمة المصادقة الثنائية
        return code === '123456'; // رمز تجريبي
      },

      logout: () => {
        const state = get();
        const user = state.currentUser;
        
        if (user) {
          SecurityLogger.log('User logged out', 'low', user.id);
          get().addSecurityEvent({
            type: 'logout',
            userId: user.id,
            details: 'User logout',
            severity: 'low'
          });
        }
        
        set({ 
          currentUser: null, 
          isAuthenticated: false, 
          currentCompanyId: null,
          sessionToken: null
        });
        
        get().addNotification({ 
          type: 'success', 
          message: get().language === 'ar' ? 'تم تسجيل الخروج بنجاح!' : 'Logged out successfully!' 
        });
      },

      // Security Management
      addSecurityEvent: (event) => {
        const newEvent: SecurityEvent = {
          ...event,
          id: generateId(),
          timestamp: new Date()
        };
        
        set(state => ({
          securityEvents: [...state.securityEvents, newEvent].slice(-1000) // الاحتفاظ بآخر 1000 حدث
        }));
      },

      getSecurityEvents: (userId) => {
        const state = get();
        if (userId) {
          return state.securityEvents.filter(event => event.userId === userId);
        }
        return state.securityEvents;
      },

      clearSecurityEvents: () => {
        set({ securityEvents: [] });
        SecurityLogger.log('Security events cleared', 'low', get().currentUser?.id);
      },

      lockUser: (userId, reason) => {
        const state = get();
        const user = state.users.find(u => u.id === userId);
        
        if (user) {
          const updatedUser = {
            ...user,
            isLocked: true,
            lockoutUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 ساعة
          };
          
          set(state => ({
            users: state.users.map(u => u.id === userId ? updatedUser : u)
          }));
          
          SecurityLogger.log(`User locked: ${user.username} - Reason: ${reason}`, 'high', userId);
          get().addSecurityEvent({
            type: 'suspicious_activity',
            userId,
            details: `User locked - ${reason}`,
            severity: 'high'
          });
        }
      },

      unlockUser: (userId) => {
        const state = get();
        const user = state.users.find(u => u.id === userId);
        
        if (user) {
          const updatedUser = {
            ...user,
            isLocked: false,
            lockoutUntil: undefined,
            loginAttempts: 0
          };
          
          set(state => ({
            users: state.users.map(u => u.id === userId ? updatedUser : u)
          }));
          
          SecurityLogger.log(`User unlocked: ${user.username}`, 'low', userId);
        }
      },

      // Data Protection
      encryptSensitiveData: () => {
        const state = get();
        
        // تشفير كلمات المرور إذا لم تكن مشفرة بالفعل
        const encryptedUsers = state.users.map(user => ({
          ...user,
          password: user.password.includes(':') ? user.password : hashPassword(user.password)
        }));
        
        // تشفير الأرقام التسلسلية الحساسة
        const encryptedSerials = state.serialNumbers.map(serial => ({
          ...serial,
          serialNumber: serial.isEncrypted ? serial.serialNumber : encryptData(serial.serialNumber),
          isEncrypted: true
        }));
        
        set({
          users: encryptedUsers,
          serialNumbers: encryptedSerials
        });
        
        SecurityLogger.log('Sensitive data encrypted', 'low', state.currentUser?.id);
      },

      decryptSensitiveData: () => {
        const state = get();
        
        // فك تشفير الأرقام التسلسلية
        const decryptedSerials = state.serialNumbers.map(serial => ({
          ...serial,
          serialNumber: serial.isEncrypted ? decryptData(serial.serialNumber) : serial.serialNumber,
          isEncrypted: false
        }));
        
        set({
          serialNumbers: decryptedSerials
        });
        
        SecurityLogger.log('Sensitive data decrypted', 'medium', state.currentUser?.id);
      },

      validateDataIntegrity: () => {
        const state = get();
        
        // فحص تكامل البيانات
        const hasValidUsers = state.users.every(user => 
          user.id && user.username && user.companyId
        );
        
        const hasValidProducts = state.products.every(product => 
          product.id && product.name && product.serialNumber
        );
        
        const hasValidSales = state.sales.every(sale => 
          sale.id && sale.productId && sale.totalAmount >= 0
        );
        
        const isValid = hasValidUsers && hasValidProducts && hasValidSales;
        
        if (!isValid) {
          SecurityLogger.log('Data integrity validation failed', 'critical', state.currentUser?.id);
        }
        
        return isValid;
      },

      backupData: () => {
        const state = get();
        const backupData = {
          users: state.users,
          products: state.products,
          sales: state.sales,
          deletedSales: state.deletedSales,
          serialNumbers: state.serialNumbers,
          securityEvents: state.securityEvents,
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };
        
        const encryptedBackup = encryptData(JSON.stringify(backupData));
        SecurityLogger.log('Data backup created', 'low', state.currentUser?.id);
        
        return encryptedBackup;
      },

      restoreData: (backupData) => {
        try {
          const decryptedData = JSON.parse(decryptData(backupData));
          
          // التحقق من صحة البيانات المستعادة
          if (!decryptedData.version || !decryptedData.timestamp) {
            return false;
          }
          
          set({
            users: decryptedData.users || [],
            products: decryptedData.products || [],
            sales: decryptedData.sales || [],
            deletedSales: decryptedData.deletedSales || [],
            serialNumbers: decryptedData.serialNumbers || [],
            securityEvents: decryptedData.securityEvents || []
          });
          
          SecurityLogger.log('Data restored from backup', 'medium', get().currentUser?.id);
          return true;
        } catch (error) {
          SecurityLogger.log('Failed to restore data from backup', 'critical', get().currentUser?.id);
          return false;
        }
      },

      addSerialNumber: (serialNumber: string) => {
        const state = get();
        const cleanSerial = sanitizeInput(serialNumber);
        
        if (!/^\d{6}$/.test(cleanSerial)) {
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' 
              ? 'الرقم التسلسلي يجب أن يكون 6 أرقام فقط' 
              : 'Serial number must be exactly 6 digits' 
          });
          return;
        }
        
        if (state.serialNumbers.find(s => s.serialNumber === cleanSerial && s.companyId === state.currentCompanyId)) {
          get().addNotification({ 
            type: 'error', 
            message: state.language === 'ar' 
              ? 'هذا الرقم التسلسلي موجود بالفعل' 
              : 'This serial number already exists' 
          });
          return;
        }
        
        const newSerial: SerialNumber = {
          id: generateId(),
          serialNumber: cleanSerial,
          isUsed: false,
          createdAt: new Date(),
          companyId: state.currentCompanyId || ''
        };
        
        set(state => ({
          serialNumbers: [...state.serialNumbers, newSerial]
        }));
        
        SecurityLogger.log(`Serial number added: ${cleanSerial}`, 'low', state.currentUser?.id);
        get().addSecurityEvent({
          type: 'data_modification',
          userId: state.currentUser?.id,
          details: `Serial number added: ${cleanSerial}`,
          severity: 'low'
        });
        
        get().addNotification({ 
          type: 'success', 
          message: get().language === 'ar' ? 'تم إضافة الرقم التسلسلي بنجاح!' : 'Serial number added successfully!' 
        });
      },

      removeSerialNumber: (id: string) => {
        const state = get();
        const serial = state.serialNumbers.find(s => s.id === id);
        
        if (serial) {
          SecurityLogger.log(`Serial number removed: ${serial.serialNumber}`, 'medium', state.currentUser?.id);
          get().addSecurityEvent({
            type: 'data_modification',
            userId: state.currentUser?.id,
            details: `Serial number removed: ${serial.serialNumber}`,
            severity: 'medium'
          });
        }
        
        set(state => ({
          serialNumbers: state.serialNumbers.filter(s => s.id !== id)
        }));
        
        get().addNotification({ 
          type: 'success', 
          message: get().language === 'ar' ? 'تم حذف الرقم التسلسلي بنجاح!' : 'Serial number removed successfully!' 
        });
      },

      setAutoLoginWithGoogle: (enabled: boolean) => {
        set({ autoLoginWithGoogle: enabled });
        SecurityLogger.log(`Auto Google login ${enabled ? 'enabled' : 'disabled'}`, 'low', get().currentUser?.id);
      },

      clearAllData: () => {
        const state = get();
        SecurityLogger.log('All data cleared', 'critical', state.currentUser?.id);
        
        set({
          currentUser: null,
          users: [],
          serialNumbers: [],
          isAuthenticated: false,
          products: [],
          sales: [],
          deletedSales: [],
          currentCompanyId: null,
          sessionToken: null,
          securityEvents: []
        });
        
        get().addNotification({ 
          type: 'success', 
          message: get().language === 'ar' ? 'تم مسح جميع البيانات بنجاح!' : 'All data cleared successfully!' 
        });
      },

      clearSalesHistory: () => {
        const state = get();
        SecurityLogger.log('Sales history cleared', 'high', state.currentUser?.id);
        
        set({ sales: [] });
        
        get().addNotification({ 
          type: 'success', 
          message: get().language === 'ar' ? '🗑️ تم مسح هيستوري المبيعات نهائياً!' : '🗑️ Sales history permanently cleared!' 
        });
      },
      
      products: [],
      
      addProduct: (productData) => {
        const state = get();
        
        // تنظيف البيانات
        const cleanData = {
          name: sanitizeInput(productData.name),
          description: sanitizeInput(productData.description),
          category: sanitizeInput(productData.category),
          quantity: Math.max(0, productData.quantity),
          price: Math.max(0, productData.price)
        };
        
        const newProduct: Product = {
          ...cleanData,
          id: generateId(),
          serialNumber: generateProductSerial(),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: state.currentUser?.id,
          companyId: state.currentCompanyId || ''
        };
        
        set((state) => ({
          products: [...state.products, newProduct],
        }));
        
        SecurityLogger.log(`Product added: ${newProduct.name}`, 'low', state.currentUser?.id);
        get().addSecurityEvent({
          type: 'data_modification',
          userId: state.currentUser?.id,
          details: `Product added: ${newProduct.name}`,
          severity: 'low'
        });
        
        get().addNotification({ 
          type: 'success', 
          message: get().language === 'ar' 
            ? `تم إضافة المنتج بنجاح! الرقم التسلسلي: ${newProduct.serialNumber}` 
            : `Product added successfully! Serial: ${newProduct.serialNumber}` 
        });
      },
      
      updateProduct: (id, productData) => {
        const state = get();
        const product = state.products.find(p => p.id === id && p.companyId === state.currentCompanyId);
        
        if (product) {
          // تنظيف البيانات المحدثة
          const cleanData: any = {};
          if (productData.name) cleanData.name = sanitizeInput(productData.name);
          if (productData.description) cleanData.description = sanitizeInput(productData.description);
          if (productData.category) cleanData.category = sanitizeInput(productData.category);
          if (productData.quantity !== undefined) cleanData.quantity = Math.max(0, productData.quantity);
          if (productData.price !== undefined) cleanData.price = Math.max(0, productData.price);
          
          set((state) => ({
            products: state.products.map((product) =>
              product.id === id && product.companyId === state.currentCompanyId
                ? { ...product, ...cleanData, updatedAt: new Date() }
                : product
            ),
          }));
          
          SecurityLogger.log(`Product updated: ${product.name}`, 'low', state.currentUser?.id);
          get().addSecurityEvent({
            type: 'data_modification',
            userId: state.currentUser?.id,
            details: `Product updated: ${product.name}`,
            severity: 'low'
          });
        }
        
        get().addNotification({ 
          type: 'success', 
          message: get().language === 'ar' ? 'تم تحديث المنتج بنجاح!' : 'Product updated successfully!' 
        });
      },
      
      deleteProduct: (id) => {
        const state = get();
        const product = state.products.find(p => p.id === id && p.companyId === state.currentCompanyId);
        
        if (product) {
          SecurityLogger.log(`Product deleted: ${product.name}`, 'medium', state.currentUser?.id);
          get().addSecurityEvent({
            type: 'data_modification',
            userId: state.currentUser?.id,
            details: `Product deleted: ${product.name}`,
            severity: 'medium'
          });
        }
        
        set((state) => ({
          products: state.products.filter((product) => 
            !(product.id === id && product.companyId === state.currentCompanyId)
          ),
        }));
        
        get().addNotification({ 
          type: 'success', 
          message: get().language === 'ar' ? 'تم حذف المنتج بنجاح!' : 'Product deleted successfully!' 
        });
      },
      
      sales: [],
      deletedSales: [],
      
      addSale: (saleData) => {
        const state = get();
        
        // 🧹 تنظيف المبيعات القديمة عند إضافة مبيعة جديدة
        get().cleanupOldDeletedSales();
        
        const newSale: Sale = {
          ...saleData,
          id: generateId(),
          saleDate: new Date(),
          soldBy: state.currentUser?.id,
          companyId: state.currentCompanyId || ''
        };
        
        const product = get().products.find(p => p.id === saleData.productId && p.companyId === state.currentCompanyId);
        if (product && product.quantity >= saleData.quantity) {
          get().updateProduct(saleData.productId, { 
            quantity: product.quantity - saleData.quantity 
          });
          
          set((state) => ({
            sales: [...state.sales, newSale],
          }));
          
          SecurityLogger.log(`Sale completed: ${product.name} x${saleData.quantity}`, 'low', state.currentUser?.id);
          get().addSecurityEvent({
            type: 'data_modification',
            userId: state.currentUser?.id,
            details: `Sale completed: ${product.name} x${saleData.quantity}`,
            severity: 'low'
          });
          
          const saleMethod = saleData.barcodeScan ? 
            (get().language === 'ar' ? 'بمسح الباركود' : 'via barcode scan') : 
            (get().language === 'ar' ? 'يدوياً' : 'manually');
          
          get().addNotification({ 
            type: 'success', 
            message: get().language === 'ar' 
              ? `تم إتمام البيع بنجاح ${saleMethod}!` 
              : `Sale completed successfully ${saleMethod}!` 
          });
          
          if (product.quantity - saleData.quantity < 5) {
            get().addNotification({ 
              type: 'warning', 
              message: get().language === 'ar'
                ? `تحذير مخزون منخفض: ${product.name} متبقي ${product.quantity - saleData.quantity} قطعة!`
                : `Low stock warning: ${product.name} has ${product.quantity - saleData.quantity} items left!` 
            });
          }
        } else {
          get().addNotification({ 
            type: 'error', 
            message: get().language === 'ar' ? 'المخزون غير كافي!' : 'Insufficient stock available!' 
          });
        }
      },

      deleteSale: (id: string) => {
        const state = get();
        const sale = state.sales.find(s => s.id === id);
        
        if (sale) {
          const deletedSale: DeletedSale = {
            ...sale,
            deletedAt: new Date(),
            deletedBy: state.currentUser?.id
          };
          
          set(state => ({
            sales: state.sales.filter(s => s.id !== id),
            deletedSales: [...state.deletedSales, deletedSale]
          }));
          
          SecurityLogger.log(`Sale deleted: ${sale.productName}`, 'medium', state.currentUser?.id);
          get().addSecurityEvent({
            type: 'data_modification',
            userId: state.currentUser?.id,
            details: `Sale deleted: ${sale.productName}`,
            severity: 'medium'
          });
          
          get().addNotification({ 
            type: 'success', 
            message: get().language === 'ar' 
              ? '🗑️ تم نقل المبيعة إلى سلة القمامة!' 
              : '🗑️ Sale moved to trash!' 
          });
        }
      },

      restoreSale: (id: string) => {
        const state = get();
        const deletedSale = state.deletedSales.find(s => s.id === id && s.companyId === state.currentCompanyId);
        
        if (deletedSale) {
          const { deletedAt, deletedBy, ...restoredSale } = deletedSale;
          
          set(state => ({
            deletedSales: state.deletedSales.filter(s => s.id !== id),
            sales: [...state.sales, restoredSale]
          }));
          
          SecurityLogger.log(`Sale restored: ${deletedSale.productName}`, 'low', state.currentUser?.id);
          get().addSecurityEvent({
            type: 'data_modification',
            userId: state.currentUser?.id,
            details: `Sale restored: ${deletedSale.productName}`,
            severity: 'low'
          });
          
          get().addNotification({ 
            type: 'success', 
            message: get().language === 'ar' 
              ? '♻️ تم استعادة المبيعة من سلة القمامة!' 
              : '♻️ Sale restored from trash!' 
          });
        }
      },

      permanentlyDeleteSale: (id: string) => {
        const state = get();
        const deletedSale = state.deletedSales.find(s => s.id === id);
        
        if (deletedSale) {
          SecurityLogger.log(`Sale permanently deleted: ${deletedSale.productName}`, 'high', state.currentUser?.id);
          get().addSecurityEvent({
            type: 'data_modification',
            userId: state.currentUser?.id,
            details: `Sale permanently deleted: ${deletedSale.productName}`,
            severity: 'high'
          });
        }
        
        set(state => ({
          deletedSales: state.deletedSales.filter(s => s.id !== id)
        }));
        
        get().addNotification({ 
          type: 'warning', 
          message: get().language === 'ar' 
            ? '🔥 تم حذف المبيعة نهائياً!' 
            : '🔥 Sale permanently deleted!' 
        });
      },

      emptyTrash: () => {
        const state = get();
        const trashCount = state.deletedSales.filter(s => s.companyId === state.currentCompanyId).length;
        
        SecurityLogger.log(`Trash emptied: ${trashCount} items`, 'high', state.currentUser?.id);
        
        set(state => ({
          deletedSales: state.deletedSales.filter(s => s.companyId !== state.currentCompanyId)
        }));
        
        get().addNotification({ 
          type: 'warning', 
          message: get().language === 'ar' 
            ? `🗑️ تم إفراغ سلة القمامة! حُذف ${trashCount} عنصر نهائياً` 
            : `🗑️ Trash emptied! ${trashCount} items permanently deleted` 
        });
      },

      cleanupOldDeletedSales: () => {
        const state = get();
        const oldSales = state.deletedSales.filter(sale => isOlderThan30Days(sale.deletedAt));
        
        if (oldSales.length > 0) {
          set(state => ({
            deletedSales: state.deletedSales.filter(sale => !isOlderThan30Days(sale.deletedAt))
          }));
          
          SecurityLogger.log(`Auto-cleanup: Removed ${oldSales.length} old sales`, 'low', state.currentUser?.id);
        }
      },
      
      theme: 'light',
      language: 'en',
      
      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        }));
      },
      
      setLanguage: (lang) => {
        set({ language: lang });
        localStorage.setItem('language', lang);
      },
      
      currencies,
      currentCurrency: 'EGP',
      
      setCurrency: (currencyCode) => {
        set({ currentCurrency: currencyCode });
        localStorage.setItem('currency', currencyCode);
      },
      
      convertPrice: (price, fromCurrency = 'EGP', toCurrency) => {
        const state = get();
        const targetCurrency = toCurrency || state.currentCurrency;
        
        if (fromCurrency === targetCurrency) return price;
        
        const fromRate = state.currencies.find(c => c.code === fromCurrency)?.rate || 1;
        const toRate = state.currencies.find(c => c.code === targetCurrency)?.rate || 1;
        
        const egpPrice = price / fromRate;
        return egpPrice * toRate;
      },
      
      formatPrice: (price, currencyCode) => {
        const state = get();
        const currency = state.currencies.find(c => c.code === (currencyCode || state.currentCurrency));
        if (!currency) return price.toFixed(2);
        
        const convertedPrice = state.convertPrice(price, 'EGP', currency.code);
        return `${currency.symbol}${convertedPrice.toLocaleString('en-US', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        })}`;
      },
      
      notifications: [],
      
      addNotification: (notification) => {
        const id = generateId();
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));
        
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },
    }),
    {
      name: 'stocksence-store',
      partialize: (state) => ({
        products: state.products,
        sales: state.sales,
        deletedSales: state.deletedSales,
        theme: state.theme,
        language: state.language,
        currentCurrency: state.currentCurrency,
        users: state.users,
        serialNumbers: state.serialNumbers,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        autoLoginWithGoogle: state.autoLoginWithGoogle,
        currentCompanyId: state.currentCompanyId,
        sessionToken: state.sessionToken,
        securityEvents: state.securityEvents,
      }),
    }
  )
);