import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

const GOOGLE_CLIENT_ID = '471947379169-237jmoal7gd9e5vflqs5br3851bngchn.apps.googleusercontent.com';

const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};

export default GoogleAuthProvider;