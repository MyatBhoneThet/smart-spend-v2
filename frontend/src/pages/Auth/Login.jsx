import React, { useContext, useState, useEffect } from 'react';
import AuthLayout from '../../components/layouts/AuthLayout';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import { validateEmail } from '../../utils/helper';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/UserContext';
import { GoogleLogin } from '@react-oauth/google';
import { FaGithub } from 'react-icons/fa';
import { setStoredToken } from '../../utils/authSession';

const Login = () => {
  const { prefs, updateUser } = useContext(UserContext);
  const isDarkTheme = prefs?.theme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  // GitHub OAuth configuration
  const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
  // dynamic redirect URI based on the current browser URL
const REDIRECT_URI = `${window.location.origin}/auth/github/callback`;

  // Handle GitHub OAuth callback
  useEffect(() => {
    const handleGitHubCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');

      if (code) {
        setLoading(true);
        try {
          const response = await axiosInstance.post(API_PATHS.AUTH.GITHUB, { code });
          const { token, user } = response.data;

          if (token) {
            setStoredToken(token);
            updateUser(user);
            navigate('/dashboard');
          }
        } catch (err) {
          setError(err?.response?.data?.message || 'GitHub sign-in failed. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    };

    handleGitHubCallback();
  }, [location, navigate, updateUser]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, { email, password });
      const { token, user } = response.data;

      if (token) {
        setStoredToken(token);
        updateUser(user);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.message) setError(err.response.data.message);
      else setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) {
        setError('No Google credential received.');
        return;
      }

      setLoading(true);
      const res = await axiosInstance.post(API_PATHS.AUTH.GOOGLE, { credential });
      const { token, user } = res.data;

      if (token) {
        setStoredToken(token);
        updateUser(user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubLogin = () => {
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user:email`;
    window.location.href = githubAuthUrl;
  };

  const dynamicBackgroundStyles = {
    background: isDarkTheme
      ? `
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 199, 255, 0.3) 0%, transparent 50%),
        linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0f0f23 100%)
      `
      : `
        radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
        linear-gradient(135deg, #f8fafc 0%, #f1f5f9 25%, #e2e8f0 50%, #cbd5e1 75%, #94a3b8 100%)
      `,
    position: 'relative',
    overflow: 'hidden'
  };

  const FloatingOrbs = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`absolute rounded-full opacity-20 animate-pulse ${
            isDarkTheme ? 'bg-gradient-to-br from-blue-400 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
          }`}
          style={{
            width: `${Math.random() * 200 + 50}px`,
            height: `${Math.random() * 200 + 50}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
            filter: 'blur(1px)'
          }}
        />
      ))}
      
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: isDarkTheme
            ? `
              conic-gradient(from 0deg at 50% 50%, 
                transparent 0deg, 
                rgba(59, 130, 246, 0.1) 60deg, 
                transparent 120deg, 
                rgba(139, 92, 246, 0.1) 180deg, 
                transparent 240deg, 
                rgba(236, 72, 153, 0.1) 300deg, 
                transparent 360deg)
            `
            : `
              conic-gradient(from 0deg at 50% 50%, 
                transparent 0deg, 
                rgba(59, 130, 246, 0.08) 60deg, 
                transparent 120deg, 
                rgba(139, 92, 246, 0.08) 180deg, 
                transparent 240deg, 
                rgba(236, 72, 153, 0.08) 300deg, 
                transparent 360deg)
            `,
          animation: 'spin 20s linear infinite'
        }}
      />
    </div>
  );

  const cardClass = isDarkTheme
    ? 'bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 text-gray-100 shadow-2xl rounded-2xl p-8 relative z-10'
    : 'bg-white/80 backdrop-blur-xl border border-white/20 text-gray-900 shadow-2xl rounded-2xl p-8 relative z-10';
  
  const inputClass = isDarkTheme
    ? 'w-full px-4 py-3 rounded-lg bg-gray-800/50 backdrop-blur-sm text-gray-100 placeholder-gray-400 border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300'
    : 'w-full px-4 py-3 rounded-lg bg-white/50 backdrop-blur-sm text-gray-900 placeholder-gray-500 border border-gray-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300';
  
  const buttonClass = isDarkTheme
    ? 'w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl'
    : 'w-full py-3 mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl';

  const githubButtonClass = isDarkTheme
    ? 'w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2'
    : 'w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2';

  const textClass = isDarkTheme ? 'text-gray-400' : 'text-gray-600';
  const linkClass = 'text-blue-400 hover:text-blue-300 font-medium underline transition-colors duration-200';

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={dynamicBackgroundStyles}
    >
      <FloatingOrbs />
      
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: isDarkTheme
            ? `radial-gradient(circle, rgba(59, 130, 246, 0.1) 1px, transparent 1px)`
            : `radial-gradient(circle, rgba(100, 116, 139, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className={`${cardClass} max-w-md w-full animate-fade-in-up`}>
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h2>
            <p className={`text-sm ${textClass}`}>
              Enter your details to access your account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="transform transition-all duration-300 hover:scale-105">
              <Input
                value={email}
                onChange={({ target }) => setEmail(target.value)}
                label="Email Address"
                placeholder="john@example.com"
                type="text"
                className={inputClass}
              />
            </div>

            <div className="transform transition-all duration-300 hover:scale-105">
              <Input
                value={password}
                onChange={({ target }) => setPassword(target.value)}
                label="Password"
                placeholder="Minimum 8 characters"
                type="password"
                className={inputClass}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-shake">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              className={buttonClass} 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Logging in...
                </div>
              ) : (
                'LOGIN'
              )}
            </button>

            <div className="flex items-center my-6">
              <hr className={`flex-1 ${isDarkTheme ? 'border-gray-600/30' : 'border-gray-300/30'}`} />
              <span className={`px-3 text-sm font-medium ${textClass}`}>OR</span>
              <hr className={`flex-1 ${isDarkTheme ? 'border-gray-600/30' : 'border-gray-300/30'}`} />
            </div>

            <div className="space-y-3">
              <div className="w-full flex justify-center">
                <div className="transform transition-all duration-300 hover:scale-105">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError('Google sign-in failed. Please try again.')}
                    useOneTap={false}
                    theme={isDarkTheme ? "filled_black" : "outline"}
                    size="large"
                    shape="rectangular"
                    text="signin_with"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleGitHubLogin}
                className={githubButtonClass}
                disabled={loading}
              >
                <FaGithub className="text-xl" />
                Continue with GitHub
              </button>
            </div>
          </form>

          <p className={`text-sm mt-6 text-center ${textClass}`}>
            Don't have an account?{' '}
            <Link className={linkClass} to="/signup">
              Sign Up
            </Link>
          </p>
        </div>

        <style>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out;
          }
          
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </div>
    );
  };


export default Login;
