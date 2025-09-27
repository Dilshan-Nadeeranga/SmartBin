import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { 
  MapPin, 
  QrCode, 
  Trash2, 
  TrendingUp, 
  Clock, 
  Star,
  ArrowRight,
  Plus,
  CreditCard,
  Truck,
  Package
} from 'lucide-react';

const PremiumDashboard = () => {
  const { user } = useAuth();
  const [showBulkRequest, setShowBulkRequest] = useState(false);

  // Fetch user statistics
  const { data: userStats } = useQuery(
    'userStats',
    async () => {
      const response = await axios.get('/api/auth/profile');
      return response.data.user.statistics;
    }
  );

  // Fetch recent collections
  const { data: collectionsData, isLoading: collectionsLoading } = useQuery(
    'recentCollections',
    async () => {
      const response = await axios.get('/api/collections?limit=5');
      return response.data;
    }
  );

  // Fetch payment history
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery(
    'recentPayments',
    async () => {
      const response = await axios.get('/api/payments?limit=3');
      return response.data;
    }
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-purple-100">
              Enjoy premium features including bulk waste collection and priority service
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-purple-100">Premium Member</p>
              <p className="text-3xl font-bold">Since {new Date(user?.premiumExpiry).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link
          to="/scanner"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow card-hover"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Scan QR Code</h3>
              <p className="text-sm text-gray-500">Scan bin QR code to dispose waste</p>
            </div>
          </div>
        </Link>

        <Link
          to="/map"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow card-hover"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Find Bins</h3>
              <p className="text-sm text-gray-500">View nearby bins on map</p>
            </div>
          </div>
        </Link>

        <button
          onClick={() => setShowBulkRequest(true)}
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow card-hover relative"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Bulk Collection</h3>
              <p className="text-sm text-gray-500">Request bulk waste pickup</p>
            </div>
          </div>
          <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
            Premium
          </span>
        </button>

        <Link
          to="/payments"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow card-hover"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Payments</h3>
              <p className="text-sm text-gray-500">View payment history</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Disposals</p>
              <p className="text-2xl font-bold text-gray-900">{userStats?.totalDisposals || 0}</p>
            </div>
            <Trash2 className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Bulk Collections</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <Truck className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">$0.00</p>
            </div>
            <CreditCard className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Premium Status</p>
              <p className="text-sm font-medium text-purple-600">Active</p>
            </div>
            <Star className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Collections */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Collections</h2>
            <Link
              to="/collections"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="p-6">
          {collectionsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : collectionsData?.collections?.length > 0 ? (
            <div className="space-y-4">
              {collectionsData.collections.map((collection) => (
                <div key={collection._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {collection.type === 'bulk' ? 'Bulk Collection' : 'Regular Collection'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {collection.bin?.location?.name || 'Collection Point'}
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
                      {new Date(collection.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No collections yet</p>
              <p className="text-sm text-gray-400">Request your first bulk collection</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
            <Link
              to="/payments"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="p-6">
          {paymentsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : paymentsData?.payments?.length > 0 ? (
            <div className="space-y-4">
              {paymentsData.payments.map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {payment.type === 'subscription' ? 'Premium Subscription' :
                         payment.type === 'bulk_collection' ? 'Bulk Collection' :
                         payment.description || payment.type}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${payment.amount.toFixed(2)}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No payments yet</p>
              <p className="text-sm text-gray-400">Your payment history will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Premium Features */}
      <div className="bg-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-4">🌟 Premium Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Package className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="font-medium text-purple-900">Bulk Collection</p>
              <p className="text-sm text-purple-700">Schedule pickup for large items like furniture and appliances.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Star className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="font-medium text-purple-900">Priority Service</p>
              <p className="text-sm text-purple-700">Get faster response times for your collection requests.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Truck className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="font-medium text-purple-900">Scheduled Pickups</p>
              <p className="text-sm text-purple-700">Schedule regular pickups at your convenience.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Collection Modal would go here */}
      {showBulkRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Request Bulk Collection</h3>
            <p className="text-gray-600 mb-4">
              This feature allows you to request pickup for large items that don't fit in regular bins.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBulkRequest(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBulkRequest(false)}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumDashboard;
