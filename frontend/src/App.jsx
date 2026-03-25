import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import SignUp from './pages/Auth/SignUp';
import GitHubCallback from './pages/Auth/GitHubCallback';
import Home from './pages/Dashboard/Home';
import Income from './pages/Dashboard/Income';
import Expense from './pages/Dashboard/Expense';
import Settings from './pages/Dashboard/Settings';
import ProfilePage from './pages/Dashboard/ProfilePage';
import RecurringPage from './pages/Dashboard/Recurring';
import SavingsPage from './pages/Dashboard/Savings'; 
import UserProvider from './context/UserContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { Toaster } from 'react-hot-toast';
import { isAuthenticated } from './utils/authSession';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// Landing route: redirect based on auth
const Root = () => {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <UserProvider>
      <CurrencyProvider>
        <Routes>
          {/* Landing */}
          <Route path="/" element={<Root />} />

          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* GitHub OAuth callback route */}
          <Route path="/auth/github/callback" element={<GitHubCallback />} />

          {/* Protected app routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statistics"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/income"
            element={
              <ProtectedRoute>
                <Income />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expense"
            element={
              <ProtectedRoute>
                <Expense />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recurring"
            element={
              <ProtectedRoute>
                <RecurringPage />
              </ProtectedRoute>
            }
          />
          {/* Savings (Goals & Jars) */}
          <Route
            path="/savings"
            element={
              <ProtectedRoute>
                <SavingsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        <Toaster
          toastOptions={{
            className: '',
            style: { fontSize: '13px' },
          }}
        />
      </CurrencyProvider>
    </UserProvider>
  );
};

export default App;
