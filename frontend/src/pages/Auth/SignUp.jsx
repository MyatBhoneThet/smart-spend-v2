import React, { useContext, useState } from 'react';
import AuthLayout from '../../components/layout/AuthLayout';
import { useNavigate, Link } from 'react-router-dom';
import Input from '../../components/Inputs/Input';
import { validateEmail } from '../../utils/helper';
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import { API_PATHS } from '../../utils/apiPaths';
import axiosInstance from '../../utils/axiosInstance';
import { UserContext } from '../../context/UserContext';
import uploadImage from '../../utils/uploadImage';
import { GoogleLogin } from '@react-oauth/google';
import { setStoredToken } from '../../utils/authSession';

const SignUp = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const { prefs, updateUser } = useContext(UserContext);
  const navigate = useNavigate();

  const isDarkTheme = prefs?.theme === 'dark';

  const handleSignUp = async (e) => {
    e.preventDefault();
    let profileImageUrl = '';

    if (!fullName) { setError('Please enter your full name'); return; }
    if (!validateEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Password is required'); return; }
    setError('');

    try {
      if (profilePic) {
        const imgUploadRes = await uploadImage(profilePic);
        profileImageUrl = imgUploadRes.data.imageUrl;
      }

      const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
        fullName, email, password, profileImageUrl,
      });

      const { token, user } = response.data;
      if (token) {
        setStoredToken(token);
        updateUser(user);
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error?.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) {
        setError('No Google credential received.');
        return;
      }
      const res = await axiosInstance.post(API_PATHS.AUTH.GOOGLE, { credential });
      const { token, user } = res.data;

      if (token) {
        setStoredToken(token);
        updateUser(user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Google sign-in failed. Please try again.');
    }
  };

  // Dynamic background with different gradient for signup
  const dynamicBackgroundStyles = {
    background: isDarkTheme
      ? `
        radial-gradient(circle at 10% 20%, rgba(255, 131, 122, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, rgba(255, 207, 84, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.3) 0%, transparent 50%),
        linear-gradient(135deg, #1a0f2e 0%, #2d1b69 25%, #1e3a8a 50%, #0f172a 75%, #1a0f2e 100%)
      `
      : `
        radial-gradient(circle at 10% 20%, rgba(251, 113, 133, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 90% 80%, rgba(252, 165, 165, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(196, 181, 253, 0.15) 0%, transparent 50%),
        linear-gradient(135deg, #fef7ff 0%, #fdf4ff 25%, #fae8ff 50%, #f3e8ff 75%, #e9d5ff 100%)
      `,
    position: 'relative',
    overflow: 'hidden'
  };

  // Animated particles/geometric shapes
  const AnimatedShapes = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating geometric shapes */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + Math.random() * 3}s`,
          }}
        >
          {i % 3 === 0 ? (
            <div 
              className={`w-8 h-8 rotate-45 ${isDarkTheme ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20' : 'bg-gradient-to-br from-purple-400/30 to-pink-400/30'}`}
              style={{ transform: `rotate(${Math.random() * 360}deg)` }}
            />
          ) : i % 3 === 1 ? (
            <div 
              className={`w-6 h-6 rounded-full ${isDarkTheme ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20' : 'bg-gradient-to-br from-yellow-400/30 to-orange-400/30'}`}
            />
          ) : (
            <div 
              className={`w-10 h-1 ${isDarkTheme ? 'bg-gradient-to-r from-blue-400/20 to-cyan-400/20' : 'bg-gradient-to-r from-blue-400/30 to-cyan-400/30'}`}
              style={{ transform: `rotate(${Math.random() * 360}deg)` }}
            />
          )}
        </div>
      ))}
      
      {/* Animated wave pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: isDarkTheme
            ? `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(147, 51, 234, 0.05) 20px,
                rgba(147, 51, 234, 0.05) 40px
              )
            `
            : `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 20px,
                rgba(147, 51, 234, 0.03) 20px,
                rgba(147, 51, 234, 0.03) 40px
              )
            `,
          animation: 'slide 8s linear infinite'
        }}
      />
    </div>
  );

  // Enhanced styling with glassmorphism
  const cardClass = isDarkTheme
    ? 'bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 text-gray-100 shadow-2xl rounded-2xl relative z-10'
    : 'bg-white/85 backdrop-blur-xl border border-white/30 text-gray-900 shadow-2xl rounded-2xl relative z-10';
  
  const inputClass = isDarkTheme
    ? 'w-full px-3 py-2 rounded-md border bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300'
    : 'w-full px-3 py-2 rounded-md border bg-white/60 backdrop-blur-sm border-gray-300/50 text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300';
  
  const buttonClass = isDarkTheme
    ? 'w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl'
    : 'w-full py-2 rounded-md bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl';
  
  const textClass = isDarkTheme ? 'text-gray-300' : 'text-gray-600';
  const linkClass = 'text-purple-400 hover:text-purple-300 font-medium underline transition-colors duration-200';

  return (
    <AuthLayout>
      <div className="w-full">
        <div className="text-center mb-6">
          <h3 className="text-3xl font-black tracking-tight bg-gradient-to-r from-[#84cc16] via-[#d9ff34] to-[#47d7ff] bg-clip-text text-transparent">
            Create an Account
          </h3>
          <p className={`mt-2 text-sm ${textClass}`}>
            Join us today by entering your details below.
          </p>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              value={fullName}
              onChange={({ target }) => setFullName(target.value)}
              label="Full Name"
              placeholder="John Doe"
              type="text"
            />
            <Input
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Email Address"
              placeholder="john@example.com"
              type="text"
            />
            <div className="md:col-span-2">
              <Input
                value={password}
                onChange={({ target }) => setPassword(target.value)}
                label="Password"
                placeholder="Minimum 8 characters"
                type="password"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-3">
              <p className="text-center text-sm text-rose-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl border border-white/20 bg-[#d9ff34] px-5 py-3 text-sm font-black text-black shadow-[0_18px_40px_rgba(217,255,52,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#cbf029] disabled:cursor-not-allowed disabled:opacity-60"
          >
            SIGN UP
          </button>

          <div className="flex items-center gap-3 py-1">
            <hr className="flex-1 border-white/60 dark:border-white/10" />
            <span className={`px-2 text-xs font-bold uppercase tracking-[0.22em] ${textClass}`}>OR</span>
            <hr className="flex-1 border-white/60 dark:border-white/10" />
          </div>

          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="oauth-pop flex h-12 w-12 items-center justify-center">
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
          </div>

          <p className={`text-center text-sm ${textClass}`}>
            Already have an account?{' '}
            <Link className="font-semibold text-[#84cc16] underline decoration-[#84cc16]/40 underline-offset-4" to="/login">
              Login
            </Link>
          </p>
        </form>
      </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          @keyframes slide {
            0% { background-position: 0 0; }
            100% { background-position: 40px 40px; }
          }
          
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-scale-in {
            animation: scale-in 0.5s ease-out;
          }
          
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
    </AuthLayout>
    );
  };

export default SignUp;
