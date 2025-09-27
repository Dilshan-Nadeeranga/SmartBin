import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { 
  Users, 
  Trash2, 
  Truck, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  BarChart3,
  Settings,
  Bell,
  Eye
} from 'lucide-react';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7');

  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery(
    ['adminDashboard', selectedTimeframe],
    async () => {
      const response = await axios.get('/api/admin/dashboard');
      return response.data;
    },
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  // Fetch system health
  const { data: systemHealth } = useQuery(
    'systemHealth',
    async () => {
      const response = await axios.get('/api/admin/health');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch recent activity
  const { data: recentActivity } = useQuery(
    'recentActivity',
    async () => {
      const [collectionsRes, usersRes] = await Promise.all([
        axios.get('/api/collections?limit=5'),
        axios.get('/api/users?limit=5')
      ]);
      return {
        collections: collectionsRes.data.collections,
        users: usersRes.data.users
      };
    }
  );

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-red-100 mt-1">
              Monitor system performance and manage operations across the platform
            </p>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-red-100">System Status</p>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemHealth?.database || 'healthy')}
                <span className={`text-sm font-medium ${getStatusColor(systemHealth?.database || 'healthy')}`}>
                  {systemHealth?.database || 'Healthy'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Alerts */}
      {systemHealth?.alerts?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">System Alerts</h3>
          </div>
          <div className="space-y-2">
            {systemHealth.alerts.map((alert, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  alert.type === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                }`} />
                <span className={alert.type === 'critical' ? 'text-red-700' : 'text-yellow-700'}>
                  {alert.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.overview?.totalUsers || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Bins</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.overview?.activeBins || 0}</p>
            </div>
            <Trash2 className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Collections Today</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.today?.collections || 0}</p>
            </div>
            <Truck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revenue Today</p>
              <p className="text-2xl font-bold text-gray-900">
                ${dashboardStats?.today?.payments?.totalAmount?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">User Breakdown</h2>
          </div>
          <div className="p-6">
            {dashboardStats?.userBreakdown?.length > 0 ? (
              <div className="space-y-4">
                {dashboardStats.userBreakdown.map((userType) => (
                  <div key={userType._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-primary-600" />
                      <span className="font-medium text-gray-900 capitalize">
                        {userType._id.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{userType.count}</p>
                      <p className="text-sm text-gray-500">
                        {userType.activeCount} active
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No user data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Bins Needing Collection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Bins Needing Collection</h2>
          </div>
          <div className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {dashboardStats?.overview?.binsNeedingCollection || 0}
              </div>
              <p className="text-gray-600 mb-4">Bins require immediate attention</p>
              <Link
                to="/admin/bins"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                <span>View Details</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Collections */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Collections</h2>
              <Link
                to="/admin/collections"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentActivity?.collections?.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.collections.map((collection) => (
                  <div key={collection._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Trash2 className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {collection.bin?.location?.name || 'Collection Point'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {collection.collector?.name || 'Unknown Collector'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        collection.status === 'completed' ? 'bg-green-100 text-green-800' :
                        collection.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {collection.status}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(collection.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent collections</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
              <Link
                to="/admin/users"
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </Link>
            </div>
          </div>
          <div className="p-6">
            {recentActivity?.users?.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.users.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'role-admin' :
                        user.role === 'collector' ? 'role-collector' :
                        user.role === 'premium_resident' ? 'role-premium' :
                        'role-resident'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent users</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/bins"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow card-hover"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Bins</h3>
              <p className="text-sm text-gray-500">Add, edit, or remove bins</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow card-hover"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Manage Users</h3>
              <p className="text-sm text-gray-500">View and manage user accounts</p>
            </div>
          </div>
        </Link>

        <Link
          to="/admin/reports"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow card-hover"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Generate Reports</h3>
              <p className="text-sm text-gray-500">Create system reports</p>
            </div>
          </div>
        </Link>
      </div>

      {/* System Performance */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 System Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {dashboardStats?.performance?.avgCollectionTimeMinutes || 0}m
            </div>
            <p className="text-sm text-gray-600">Average Collection Time</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {systemHealth?.uptime ? Math.floor(systemHealth.uptime / 3600) : 0}h
            </div>
            <p className="text-sm text-gray-600">System Uptime</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {systemHealth?.memory ? Math.round(systemHealth.memory.used / 1024 / 1024) : 0}MB
            </div>
            <p className="text-sm text-gray-600">Memory Usage</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
