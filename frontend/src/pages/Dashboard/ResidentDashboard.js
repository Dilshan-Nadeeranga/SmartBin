import React, { useState, useEffect } from 'react';
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
  Eye
} from 'lucide-react';

const ResidentDashboard = () => {
  const { user } = useAuth();
  const [nearbyBins, setNearbyBins] = useState([]);

  // Fetch nearby bins
  const { data: binsData, isLoading: binsLoading } = useQuery(
    'nearbyBins',
    async () => {
      // In a real app, you'd get user's location
      const response = await axios.get('/api/bins/nearby?latitude=40.7128&longitude=-74.0060&radius=5');
      return response.data;
    },
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  // Fetch user statistics
  const { data: userStats } = useQuery(
    'userStats',
    async () => {
      const response = await axios.get('/api/auth/profile');
      return response.data.user.statistics;
    }
  );

  useEffect(() => {
    if (binsData?.bins) {
      setNearbyBins(binsData.bins.slice(0, 5)); // Show top 5 nearest bins
    }
  }, [binsData]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'empty':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'full':
        return 'bg-orange-100 text-orange-800';
      case 'overflowing':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFillLevelColor = (fillLevel) => {
    if (fillLevel >= 80) return 'bg-red-500';
    if (fillLevel >= 60) return 'bg-orange-500';
    if (fillLevel >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name}!</h1>
            <p className="text-primary-100 mt-1">
              Help keep your community clean by properly disposing of waste
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-sm text-primary-100">Total Disposals</p>
              <p className="text-3xl font-bold">{userStats?.totalDisposals || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <Link
          to="/upgrade"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow card-hover relative"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upgrade to Premium</h3>
              <p className="text-sm text-gray-500">Get bulk collection features</p>
            </div>
          </div>
          <span className="absolute top-2 right-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
            Pro
          </span>
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
              <p className="text-sm text-gray-500">Recycling Score</p>
              <p className="text-2xl font-bold text-gray-900">{userStats?.recyclingScore || 0}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Last Disposal</p>
              <p className="text-sm font-medium text-gray-900">
                {userStats?.lastDisposal 
                  ? new Date(userStats.lastDisposal).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Account Type</p>
              <p className="text-sm font-medium text-gray-900">Free Resident</p>
            </div>
            <Star className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Nearby Bins */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Nearby Bins</h2>
            <Link
              to="/map"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="p-6">
          {binsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : nearbyBins.length > 0 ? (
            <div className="space-y-4">
              {nearbyBins.map((bin) => (
                <div key={bin._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{bin.location.name}</h3>
                      <p className="text-sm text-gray-500">
                        {bin.distance ? `${bin.distance.toFixed(1)} km away` : bin.location.address}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(bin.status)}`}>
                          {bin.status}
                        </span>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getFillLevelColor(bin.currentFillLevel)}`}
                          style={{ width: `${bin.currentFillLevel}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{bin.currentFillLevel}% full</p>
                    </div>
                    
                    <Link
                      to={`/scanner?binId=${bin._id}`}
                      className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                      title="Scan QR Code"
                    >
                      <QrCode className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No nearby bins found</p>
              <p className="text-sm text-gray-400">Try expanding your search radius</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Waste Disposal Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <div>
              <p className="font-medium text-blue-900">Sort Your Waste</p>
              <p className="text-sm text-blue-700">Separate recyclables from general waste to help the environment.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div>
              <p className="font-medium text-blue-900">Check Bin Status</p>
              <p className="text-sm text-blue-700">Use the map to find bins with available capacity before visiting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
