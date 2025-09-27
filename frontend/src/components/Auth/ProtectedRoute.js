import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../Common/LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const dashboardPath = getDashboardPath(user.role);
    return <Navigate to={dashboardPath} replace />;
  }

  return children;
};

const getDashboardPath = (role) => {
  switch (role) {
    case 'resident':
      return '/dashboard/resident';
    case 'premium_resident':
      return '/dashboard/premium';
    case 'collector':
      return '/dashboard/collector';
    case 'admin':
      return '/dashboard/admin';
    default:
      return '/dashboard/resident';
  }
};

export default ProtectedRoute;
