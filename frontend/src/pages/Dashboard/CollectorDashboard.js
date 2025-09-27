import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowRight,
  Navigation,
  TrendingUp,
  Star,
  Package
} from 'lucide-react';

const CollectorDashboard = () => {
  const { user } = useAuth();
  const [selectedRoute, setSelectedRoute] = useState(null);

  // Fetch assigned routes
  const { data: routesData, isLoading: routesLoading, refetch: refetchRoutes } = useQuery(
    'collectorRoutes',
    async () => {
      const response = await axios.get('/api/routes');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch today's collections
  const { data: collectionsData, isLoading: collectionsLoading } = useQuery(
    'todayCollections',
    async () => {
      const response = await axios.get('/api/collections?status=assigned&limit=10');
      return response.data;
    }
  );

  // Fetch performance stats
  const { data: performanceData } = useQuery(
    'collectorPerformance',
    async () => {
      const response = await axios.get('/api/collections?status=completed&limit=100');
      const collections = response.data.collections;
      
      // Calculate performance metrics
      const totalCollections = collections.length;
      const avgRating = collections.reduce((sum, c) => sum + (c.rating || 0), 0) / totalCollections || 0;
      const totalWeight = collections.reduce((sum, c) => sum + (c.totalWeight || 0), 0);
      
      return {
        totalCollections,
        avgRating: avgRating.toFixed(1),
        totalWeight,
        completedToday: collections.filter(c => 
          new Date(c.completedDate).toDateString() === new Date().toDateString()
        ).length
      };
    }
  );

  const startRoute = async (routeId) => {
    try {
      await axios.put(`/api/routes/${routeId}/start`);
      refetchRoutes();
      // Show success message
    } catch (error) {
      console.error('Failed to start route:', error);
    }
  };

  const completeCollection = async (collectionId) => {
    try {
      await axios.put(`/api/collections/${collectionId}/status`, {
        status: 'completed',
        fillLevelAfter: 0,
        wasteType: {
          general: { weight: 10, volume: 5 },
          recyclable: { weight: 5, volume: 3 }
        }
      });
      // Refetch data
    } catch (error) {
      console.error('Failed to complete collection:', error);
    }
  };

  const getRouteProgress = (route) => {
    return Math.round((route.completedBins?.length || 0) / route.bins?.length * 100) || 0;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Good day, {user?.name}!</h1>
            <p className="text-green-100 mt-1">
              Ready to keep the community clean? Check your assigned routes below.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-green-100">Today's Collections</p>
              <p className="text-3xl font-bold">{performanceData?.completedToday || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Collections</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData?.totalCollections || 0}</p>
            </div>
            <Truck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData?.avgRating || 0}</p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Weight</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData?.totalWeight || 0} kg</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Routes</p>
              <p className="text-2xl font-bold text-gray-900">
                {routesData?.routes?.filter(r => r.status === 'active').length || 0}
              </p>
            </div>
            <Navigation className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Today's Routes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Today's Routes</h2>
            <Link
              to="/routes"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="p-6">
          {routesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : routesData?.routes?.length > 0 ? (
            <div className="space-y-4">
              {routesData.routes.map((route) => (
                <div key={route._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{route.name}</h3>
                      <p className="text-sm text-gray-500">
                        {route.bins?.length || 0} bins • {route.estimatedDuration} minutes
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        route.status === 'active' ? 'bg-green-100 text-green-800' :
                        route.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {route.status}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{getRouteProgress(route)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getRouteProgress(route)}%` }}
                      />
                    </div>
                  </div>

                  {/* Route Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(route.scheduledDate).toLocaleDateString()} at{' '}
                        {new Date(route.scheduledDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      {route.status === 'active' && (
                        <button
                          onClick={() => startRoute(route._id)}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Start Route
                        </button>
                      )}
                      <Link
                        to={`/routes/${route._id}`}
                        className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No routes assigned today</p>
              <p className="text-sm text-gray-400">Check back later for new assignments</p>
            </div>
          )}
        </div>
      </div>

      {/* Today's Collections */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pending Collections</h2>
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
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {collection.bin?.location?.name || 'Collection Point'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {collection.type === 'bulk' ? 'Bulk Collection' : 'Regular Collection'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Scheduled: {new Date(collection.scheduledDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        collection.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        collection.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {collection.status}
                      </span>
                    </div>
                    
                    {collection.status === 'assigned' && (
                      <button
                        onClick={() => completeCollection(collection._id)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500">No pending collections</p>
              <p className="text-sm text-gray-400">All collections completed for today</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Tips */}
      <div className="bg-green-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">💡 Performance Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-green-900">Follow the Route Order</p>
              <p className="text-sm text-green-700">Complete bins in the assigned order for optimal efficiency.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-green-900">Update Status Regularly</p>
              <p className="text-sm text-green-700">Keep the system updated with real-time collection status.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectorDashboard;
