import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

// Layout components
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Dashboard pages
import ResidentDashboard from './pages/Dashboard/ResidentDashboard';
import PremiumDashboard from './pages/Dashboard/PremiumDashboard';
import CollectorDashboard from './pages/Dashboard/CollectorDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';

// Common pages
import QRScanner from './pages/QRScanner/QRScanner';
import Profile from './pages/Profile/Profile';
import BinsMap from './pages/BinsMap/BinsMap';
import NotFound from './pages/NotFound/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <div className="App">
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
              
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes with role-based access */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  {/* Default redirect based on user role */}
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Role-based dashboard routes */}
                  <Route path="dashboard" element={<Navigate to="/dashboard/resident" replace />} />
                  <Route path="dashboard/resident" element={
                    <ProtectedRoute allowedRoles={['resident']}>
                      <ResidentDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="dashboard/premium" element={
                    <ProtectedRoute allowedRoles={['premium_resident']}>
                      <PremiumDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="dashboard/collector" element={
                    <ProtectedRoute allowedRoles={['collector']}>
                      <CollectorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="dashboard/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  
                  {/* Common routes */}
                  <Route path="scanner" element={<QRScanner />} />
                  <Route path="map" element={<BinsMap />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
