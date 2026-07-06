import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      // #region agent log
      fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H3,H4',location:'src/lib/AuthContext.jsx:27',message:'checkAppState started',data:{hasToken:Boolean(appParams.token),hasAppId:Boolean(appParams.appId),path:window.location.pathname,hash:window.location.hash},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      
      // First, check app public settings (with token if available)
      // This will tell us if auth is required, user not registered, etc.
      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: {
          'X-App-Id': appParams.appId
        },
        token: appParams.token, // Include token if available
        interceptResponses: true
      });
      
      try {
        const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
        setAppPublicSettings(publicSettings);
        // #region agent log
        fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H3,H4',location:'src/lib/AuthContext.jsx:44',message:'public settings loaded',data:{hasToken:Boolean(appParams.token),willCheckUserAuth:Boolean(appParams.token),publicSettingsKeys:Object.keys(publicSettings||{})},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        
        // If we got the app public settings successfully, check if user is authenticated
        if (appParams.token) {
          await checkUserAuth();
        } else {
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
          setAuthChecked(true);
        }
        setIsLoadingPublicSettings(false);
      } catch (appError) {
        console.error('App state check failed:', appError);
        // #region agent log
        fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H3,H4',location:'src/lib/AuthContext.jsx:59',message:'public settings failed',data:{status:appError?.status,responseStatus:appError?.response?.status,reason:appError?.data?.extra_data?.reason||appError?.response?.data?.extra_data?.reason,message:appError?.message,hasToken:Boolean(appParams.token)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        
        // Handle app-level errors
        if (appError.status === 403 && appError.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          if (reason === 'auth_required') {
            setAuthError({
              type: 'auth_required',
              message: 'Authentication required'
            });
          } else if (reason === 'user_not_registered') {
            setAuthError({
              type: 'user_not_registered',
              message: 'User not registered for this app'
            });
          } else {
            setAuthError({
              type: reason,
              message: appError.message
            });
          }
        } else {
          setAuthError({
            type: 'unknown',
            message: appError.message || 'Failed to load app'
          });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      // #region agent log
      fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H3,H4',location:'src/lib/AuthContext.jsx:105',message:'checkUserAuth started',data:{hasToken:Boolean(appParams.token),path:window.location.pathname,hash:window.location.hash},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const currentUser = await base44.auth.me();
      // #region agent log
      fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H3,H4',location:'src/lib/AuthContext.jsx:110',message:'checkUserAuth succeeded',data:{hasUser:Boolean(currentUser),hasUserId:Boolean(currentUser?.id),userKeys:Object.keys(currentUser||{})},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      // #region agent log
      fetch('http://127.0.0.1:7756/ingest/0c742865-deee-4e9e-a01c-70568e0f44ff',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'eaa759'},body:JSON.stringify({sessionId:'eaa759',runId:'initial',hypothesisId:'H3,H4',location:'src/lib/AuthContext.jsx:120',message:'checkUserAuth failed',data:{status:error?.status,responseStatus:error?.response?.status,reason:error?.data?.extra_data?.reason||error?.response?.data?.extra_data?.reason,message:error?.message,hasToken:Boolean(appParams.token)},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);
      
      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};