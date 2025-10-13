import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle, handleOAuthCallback } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const processOAuthCallback = async () => {
      console.log('[Login] Processing OAuth callback...');
      // Handle OAuth callback
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const isNewUser = searchParams.get('is_new_user') === 'true';
      const error = searchParams.get('error');

      console.log('[Login] OAuth params:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        isNewUser,
        error
      });

      if (error) {
        console.error('[Login] OAuth error:', error);
        toast.error(`Authentication failed: ${error}`);
        setIsProcessing(false);
        return;
      }

      if (accessToken && refreshToken) {
        console.log('[Login] Tokens found, processing callback...');
        setIsProcessing(true);

        try {
          // Handle OAuth callback (stores tokens + updates auth state)
          console.log('[Login] Calling handleOAuthCallback...');
          await handleOAuthCallback(accessToken, refreshToken);
          console.log('[Login] handleOAuthCallback completed successfully');

          // Show welcome message
          if (isNewUser) {
            toast.success('🎉 Welcome to Echoes of War! Your account has been created.');
          } else {
            toast.success('✅ Welcome back, warrior!');
          }

          // Redirect to lobby (auth state now updated!)
          console.log('[Login] Navigating to /lobby...');
          navigate('/lobby');
        } catch (err) {
          console.error('[Login] OAuth callback error:', err);
          toast.error('Authentication failed. Please try again.');
          setIsProcessing(false);
        }
      } else {
        console.log('[Login] No OAuth tokens in URL, showing login page');
      }
    };

    processOAuthCallback();
  }, [searchParams, navigate, handleOAuthCallback]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-amber-400 text-4xl mb-4 animate-pulse">🔐</div>
          <div className="text-2xl font-bold text-amber-400 animate-pulse">
            AUTHENTICATING...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Login Card */}
        <div className="bg-gray-800/95 border-2 border-amber-600/50 p-8 rounded-lg shadow-2xl backdrop-blur-sm">
          <h1 className="text-3xl font-bold text-amber-400 mb-2 text-center">
            ECHOES OF WAR
          </h1>
          <p className="text-gray-300 text-center mb-8 font-medium">
            AUTHENTICATION REQUIRED
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center px-6 py-4 border-2 border-amber-600/50 hover:border-amber-400 bg-amber-900/20 hover:bg-amber-800/30 text-amber-300 hover:text-amber-200 font-medium text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/50 mb-4 rounded"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z"/>
              <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z"/>
              <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z"/>
              <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z"/>
            </svg>
            SIGN IN WITH GOOGLE
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gray-800 text-gray-400 font-medium">
                OR CONTINUE AS GUEST
              </span>
            </div>
          </div>

          {/* Guest Mode Button */}
          <button
            onClick={() => navigate('/lobby')}
            className="w-full flex items-center justify-center px-6 py-4 border-2 border-gray-600/50 hover:border-gray-400 bg-gray-900/20 hover:bg-gray-800/30 text-gray-300 hover:text-gray-200 font-medium text-sm tracking-wide transition-all duration-300 rounded"
          >
            <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
            ENTER AS GUEST WARRIOR
          </button>

          <div className="mt-6 p-4 bg-gray-900/30 border border-gray-600/50 text-center rounded">
            <p className="text-gray-300 font-medium text-xs">
              ⚠ GUEST MODE: Progress is temporary<br/>
              Create account to save victories
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
