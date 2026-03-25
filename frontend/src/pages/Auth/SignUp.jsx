import React, { useContext, useState } from 'react';
import AuthLayout from '../../components/layouts/AuthLayout';
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
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={dynamicBackgroundStyles}
    >
      <AnimatedShapes />
      
      {/* Hexagonal pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: isDarkTheme
            ? `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23a855f7' fill-opacity='0.1'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            : `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.08'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      <div className={`w-full max-w-md md:max-w-lg lg:max-w-xl p-8 ${cardClass} animate-scale-in`}>
          <div className="text-center mb-6">
            <h3 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Create an Account
            </h3>
            <p className={`text-sm ${textClass}`}>
              Join us today by entering your details below.
            </p>
          </div>

          <form onSubmit={handleSignUp} className="space-y-5">
            <div className="flex justify-center mb-6">
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="transform transition-all duration-300 hover:scale-105">
                <Input
                  value={fullName}
                  onChange={({ target }) => setFullName(target.value)}
                  label="Full Name"
                  placeholder="John Doe"
                  type="text"
                  className={inputClass}
                />
              </div>
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
              <div className="col-span-full transform transition-all duration-300 hover:scale-105">
                <Input
                  value={password}
                  onChange={({ target }) => setPassword(target.value)}
                  label="Password"
                  placeholder="Minimum 8 characters"
                  type="password"
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 animate-shake">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button type="submit" className={buttonClass}>
              SIGN UP
            </button>

            <div className="flex items-center my-4">
              <hr className={`flex-1 border-gray-500/30`} />
              <span className={`px-3 text-sm font-medium ${textClass}`}>OR</span>
              <hr className={`flex-1 border-gray-500/30`} />
            </div>

            <div className="w-full flex justify-center">
              <div className="transform transition-all duration-300 hover:scale-105">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError('Google sign-in failed. Please try again.')}
                  useOneTap={false}
                  theme={isDarkTheme ? "filled_black" : "outline"}
                  size="large"
                  shape="rectangular"
                  text="continue_with"
                />
              </div>
            </div>

            <p className={`text-sm mt-4 text-center ${textClass}`}>
              Already have an account?{' '}
              <Link className={linkClass} to="/login">
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
      </div>
    );
  };

export default SignUp;
