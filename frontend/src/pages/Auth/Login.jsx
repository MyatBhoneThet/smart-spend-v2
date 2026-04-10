import React, { useContext, useState, useEffect } from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
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

  const textClass = isDarkTheme ? 'text-gray-400' : 'text-gray-600';

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#84cc16] via-[#d9ff34] to-[#47d7ff] bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className={`mt-2 text-sm ${textClass}`}>
            Enter your details to access your account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="john@example.com"
            type="text"
          />

          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Minimum 8 characters"
            type="password"
          />

          {error && (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3">
              <p className="text-center text-sm text-rose-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl border border-white/20 bg-[#d9ff34] px-5 py-3 text-sm font-black text-black shadow-[0_18px_40px_rgba(217,255,52,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#cbf029] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-b-2 border-black"></div>
                Logging in...
              </div>
            ) : (
              'LOGIN'
            )}
          </button>

          <div className="flex items-center gap-3 py-2">
            <hr className="flex-1 border-white/60 dark:border-white/10" />
            <span className={`px-2 text-xs font-bold uppercase tracking-[0.22em] ${textClass}`}>OR</span>
            <hr className="flex-1 border-white/60 dark:border-white/10" />
          </div>

          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="oauth-pop flex h-14 w-14 items-center justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google sign-in failed. Please try again.')}
                useOneTap={false}
                theme={isDarkTheme ? "filled_black" : "outline"}
                size="large"
                shape="circle"
                type="icon"
              />
            </div>

            <button
              type="button"
              onClick={handleGitHubLogin}
              className="oauth-icon-btn oauth-pop"
              aria-label="Continue with GitHub"
              disabled={loading}
            >
              <FaGithub className="text-xl text-white" />
            </button>
          </div>
        </form>

        <p className={`mt-6 text-center text-sm ${textClass}`}>
          Don't have an account?{' '}
          <Link className="font-semibold text-[#84cc16] underline decoration-[#84cc16]/40 underline-offset-4" to="/signup">
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
    </AuthLayout>
    );
  };


export default Login;
