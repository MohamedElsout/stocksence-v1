import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { Chrome } from 'lucide-react';
import { useStore } from '../../store/useStore';

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ onSuccess }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { theme, addNotification, loginWithGoogle } = useStore();
  const isRTL = i18n.language === 'ar';

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // الحصول على معلومات المستخدم من Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          
          // تسجيل الدخول باستخدام معلومات Google
          const success = await loginWithGoogle({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            accessToken: tokenResponse.access_token
          });

          if (success) {
            addNotification({
              type: 'success',
              message: isRTL 
                ? `مرحباً ${userInfo.name}! تم تسجيل الدخول بنجاح` 
                : `Welcome ${userInfo.name}! Login successful`
            });
            
            if (onSuccess) onSuccess();
            navigate('/dashboard');
          }
        } else {
          throw new Error('Failed to fetch user info');
        }
      } catch (error) {
        console.error('Google login error:', error);
        addNotification({
          type: 'error',
          message: isRTL 
            ? 'حدث خطأ أثناء تسجيل الدخول بحساب جوجل' 
            : 'Error occurred during Google login'
        });
      }
    },
    onError: (error) => {
      console.error('Google login failed:', error);
      addNotification({
        type: 'error',
        message: isRTL 
          ? 'فشل تسجيل الدخول بحساب جوجل' 
          : 'Google login failed'
      });
    },
  });

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => googleLogin()}
      className={`w-full flex items-center justify-center space-x-3 rtl:space-x-reverse px-4 py-3 border-2 rounded-lg font-medium transition-all duration-300 ${
        theme === 'dark'
          ? 'border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:border-gray-500'
          : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400'
      } shadow-lg hover:shadow-xl`}
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="flex items-center justify-center"
      >
        <Chrome className="w-5 h-5 text-blue-500" />
      </motion.div>
      
      <span className="font-semibold">
        {isRTL ? 'تسجيل الدخول بحساب جوجل' : 'Sign in with Google'}
      </span>
      
      {/* Google Colors Accent */}
      <div className="flex space-x-1">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
      </div>
    </motion.button>
  );
};

export default GoogleLoginButton;