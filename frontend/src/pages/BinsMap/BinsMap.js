import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import axios from 'axios';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { MapPin, Filter, Search, Trash2, Navigation } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Ensure default Leaflet marker icons work in CRA
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Use inline SVG-based icons to avoid broken marker images and ensure consistent rendering
const createSvgIcon = (color) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 48'><path fill='${color}' d='M16 0c-8.8 0-16 7.2-16 16 0 12 16 32 16 32s16-20 16-32C32 7.2 24.8 0 16 0z'/><circle cx='16' cy='16' r='6' fill='#ffffff'/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -30],
  });
};

const BinsMap = () => {
  const { user } = useAuth();
  const [selectedBin, setSelectedBin] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    radius: 5
  });
  const [userLocation, setUserLocation] = useState(null);

  // Fetch nearby bins
  const { data: binsData, isLoading: binsLoading, refetch } = useQuery(
    ['nearbyBins', userLocation, filters],
    async () => {
      if (!userLocation) return null;
      
      const response = await axios.get('/api/bins/nearby', {
        params: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: filters.radius
        }
      });
      return response.data;
    },
    {
      enabled: !!userLocation,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to NYC coordinates for demo
          setUserLocation({
            latitude: 40.7128,
            longitude: -74.0060
          });
        }
      );
    } else {
      // Default to NYC coordinates for demo
      setUserLocation({
        latitude: 40.7128,
        longitude: -74.0060
      });
    }
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'empty':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'full':
        return 'bg-orange-500';
      case 'overflowing':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'recyclable':
        return '♻️';
      case 'organic':
        return '🍃';
      case 'hazardous':
        return '⚠️';
      default:
        return '🗑️';
    }
  };

  const filteredBins = binsData?.bins?.filter(bin => {
    if (filters.type !== 'all' && bin.type !== filters.type) return false;
    if (filters.status !== 'all' && bin.status !== filters.status) return false;
    return true;
  }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Bins Map</h1>
                <p className="text-sm text-gray-500">Find nearby waste bins</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search location..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={() => refetch()}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-4 h-4 text-gray-500" />
              <h2 className="font-medium text-gray-900">Filters</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bin Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="general">General Waste</option>
                  <option value="recyclable">Recyclable</option>
                  <option value="organic">Organic</option>
                  <option value="hazardous">Hazardous</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="empty">Empty</option>
                  <option value="partial">Partial</option>
                  <option value="full">Full</option>
                  <option value="overflowing">Overflowing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius: {filters.radius} km
                </label>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={filters.radius}
                  onChange={(e) => setFilters({ ...filters, radius: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Bins List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Nearby Bins</h3>
                <span className="text-sm text-gray-500">
                  {filteredBins.length} found
                </span>
              </div>

              {binsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredBins.length > 0 ? (
                <div className="space-y-3">
                  {filteredBins.map((bin) => (
                    <div
                      key={bin._id}
                      onClick={() => setSelectedBin(bin)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedBin?._id === bin._id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(bin.status)}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-lg">{getTypeIcon(bin.type)}</span>
                            <h4 className="font-medium text-gray-900 truncate">
                              {bin.location.name}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {bin.location.address}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              {bin.distance ? `${bin.distance.toFixed(1)} km` : 'Unknown distance'}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              bin.status === 'empty' ? 'bg-green-100 text-green-800' :
                              bin.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              bin.status === 'full' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {bin.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Fill Level Bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Fill Level</span>
                          <span>{bin.currentFillLevel}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${getStatusColor(bin.status)}`}
                            style={{ width: `${bin.currentFillLevel}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trash2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No bins found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-gray-100 relative">
          {userLocation ? (
            <MapContainer
              center={[userLocation.latitude, userLocation.longitude]}
              zoom={13}
              scrollWheelZoom
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* User location marker and search radius */}
              <Marker position={[userLocation.latitude, userLocation.longitude]} icon={createSvgIcon('#2563eb')}>
                <Popup>You are here</Popup>
              </Marker>
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={filters.radius * 1000}
                pathOptions={{ color: '#2563eb', fillOpacity: 0.06 }}
              />

              {/* Bin markers */}
              {filteredBins.map((bin) => (
                <Marker
                  key={bin._id}
                  position={[
                    bin.location.coordinates.latitude,
                    bin.location.coordinates.longitude,
                  ]}
                  icon={createSvgIcon(
                    bin.status === 'empty' ? '#22c55e' :
                    bin.status === 'partial' ? '#eab308' :
                    bin.status === 'full' ? '#f97316' : '#ef4444'
                  )}
                  eventHandlers={{ click: () => setSelectedBin(bin) }}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-medium mb-1">{bin.location.name}</div>
                      <div className="text-gray-600 mb-1 capitalize">{bin.type} • {bin.status}</div>
                      <div className="text-gray-500">{bin.location.address}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Selected Bin Info Overlay */}
          {selectedBin && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">{getTypeIcon(selectedBin.type)}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedBin.location.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{selectedBin.type} waste</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    selectedBin.status === 'empty' ? 'bg-green-100 text-green-800' :
                    selectedBin.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                    selectedBin.status === 'full' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedBin.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fill Level:</span>
                  <span className="font-medium">{selectedBin.currentFillLevel}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Distance:</span>
                  <span className="font-medium">
                    {selectedBin.distance ? `${selectedBin.distance.toFixed(1)} km` : 'Unknown'}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => setSelectedBin(null)}
                  className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Navigate to scanner with this bin
                    window.location.href = `/scanner?binId=${selectedBin._id}`;
                  }}
                  className="flex-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
                >
                  Scan QR
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BinsMap;
