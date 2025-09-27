import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { QrCode, Camera, AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

const QRScanner = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  const [scannedBin, setScannedBin] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [fillLevel, setFillLevel] = useState(0);
  const [wasteType, setWasteType] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const binId = searchParams.get('binId');

  useEffect(() => {
    // Check for camera permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => setHasPermission(true))
      .catch(() => setHasPermission(false));
  }, []);

  useEffect(() => {
    if (binId) {
      // Pre-load bin data if binId is provided
      fetchBinData(binId);
    }
  }, [binId]);

  const fetchBinData = async (id) => {
    try {
      const response = await axios.get(`/api/bins/${id}`);
      setScannedBin(response.data.bin);
      setShowScanner(false);
    } catch (error) {
      toast.error('Bin not found');
    }
  };

  const handleQRScan = async (data) => {
    if (data) {
      try {
        const qrData = JSON.parse(data);
        const response = await axios.get(`/api/bins/${qrData.binId}`);
        setScannedBin(response.data.bin);
        setScannedCode(data);
        setShowScanner(false);
        toast.success('QR Code scanned successfully!');
      } catch (error) {
        toast.error('Invalid QR code or bin not found');
      }
    }
  };

  const simulateQRScan = () => {
    // Simulate scanning a QR code for demo purposes
    const mockQRData = JSON.stringify({
      binId: '507f1f77bcf86cd799439011',
      location: 'Central Park',
      type: 'general',
      createdAt: new Date()
    });
    handleQRScan(mockQRData);
  };

  const handleSubmitDisposal = async () => {
    if (!scannedBin || fillLevel <= 0) {
      toast.error('Please scan a bin and enter fill level');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.put(`/api/bins/${scannedBin._id}/status`, {
        fillLevel: parseInt(fillLevel),
        wasteType: wasteType
      });

      toast.success('Waste disposal recorded successfully!');
      
      // Reset form
      setScannedBin(null);
      setScannedCode('');
      setFillLevel(0);
      setWasteType('general');
      
      // Navigate back to dashboard
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to record disposal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetScanner = () => {
    setScannedBin(null);
    setScannedCode('');
    setFillLevel(0);
    setWasteType('general');
    setShowScanner(true);
  };

  if (hasPermission === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Camera Access Required</h2>
            <p className="text-gray-600 mb-6">
              Please allow camera access to scan QR codes for waste disposal.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">QR Code Scanner</h1>
              <p className="text-sm text-gray-500">Scan bin QR codes to dispose waste</p>
            </div>
          </div>

          {!scannedBin && !showScanner && (
            <button
              onClick={() => setShowScanner(true)}
              className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2"
            >
              <Camera className="w-5 h-5" />
              <span>Start Scanning</span>
            </button>
          )}
        </div>

        {/* Scanner */}
        {showScanner && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Scan QR Code</h2>
              <p className="text-sm text-gray-500">Point your camera at the bin's QR code</p>
            </div>
            
            <div className="relative bg-gray-100 rounded-lg h-64 flex items-center justify-center">
              <div className="text-center">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Camera scanner would be here</p>
                <p className="text-sm text-gray-500 mt-2">
                  In a real implementation, this would show the camera feed
                </p>
              </div>
            </div>

            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => setShowScanner(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={simulateQRScan}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Simulate Scan (Demo)
              </button>
            </div>
          </div>
        )}

        {/* Bin Information */}
        {scannedBin && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-lg font-semibold text-gray-900">Bin Scanned Successfully</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Bin Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium">{scannedBin.location.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium capitalize">{scannedBin.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Fill Level:</span>
                      <span className="font-medium">{scannedBin.currentFillLevel}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        scannedBin.status === 'empty' ? 'bg-green-100 text-green-800' :
                        scannedBin.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                        scannedBin.status === 'full' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {scannedBin.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Fill Level</h3>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full ${
                        scannedBin.currentFillLevel >= 80 ? 'bg-red-500' :
                        scannedBin.currentFillLevel >= 60 ? 'bg-orange-500' :
                        scannedBin.currentFillLevel >= 40 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${scannedBin.currentFillLevel}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {scannedBin.currentFillLevel}% full
                  </p>
                </div>
              </div>
            </div>

            {/* Disposal Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Waste Disposal</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waste Type
                  </label>
                  <select
                    value={wasteType}
                    onChange={(e) => setWasteType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="general">General Waste</option>
                    <option value="recyclable">Recyclable</option>
                    <option value="organic">Organic</option>
                    <option value="hazardous">Hazardous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fill Level to Add (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={fillLevel}
                    onChange={(e) => setFillLevel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter fill level percentage"
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Trash2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Current Status</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        After disposal, this bin will be {Math.min(scannedBin.currentFillLevel + parseInt(fillLevel || 0), 100)}% full.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={resetScanner}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Scan Another Bin
                  </button>
                  <button
                    onClick={handleSubmitDisposal}
                    disabled={isSubmitting || !fillLevel}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    <span>{isSubmitting ? 'Recording...' : 'Record Disposal'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
