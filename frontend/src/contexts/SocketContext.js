import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token'),
        },
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setIsConnected(true);
        
        // Join role-specific room
        newSocket.emit('join-room', user.role);
        
        // Join user-specific room for notifications
        newSocket.emit('join-room', `user-${user.id}`);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setIsConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [isAuthenticated, user]);

  // Real-time event listeners
  useEffect(() => {
    if (socket && user) {
      // Bin updates
      socket.on('binUpdated', (data) => {
        console.log('Bin updated:', data);
        // Handle bin updates (could trigger UI updates)
      });

      // Collection updates
      socket.on('collectionUpdated', (data) => {
        console.log('Collection updated:', data);
        // Handle collection updates
      });

      // New collection requests (for collectors)
      socket.on('newCollectionRequest', (data) => {
        console.log('New collection request:', data);
        // Handle new collection requests
      });

      // Route updates
      socket.on('routeStarted', (data) => {
        console.log('Route started:', data);
        // Handle route started
      });

      socket.on('routeCompleted', (data) => {
        console.log('Route completed:', data);
        // Handle route completed
      });

      // Admin notifications
      socket.on('adminNotification', (data) => {
        console.log('Admin notification:', data);
        // Handle admin notifications
      });

      return () => {
        socket.off('binUpdated');
        socket.off('collectionUpdated');
        socket.off('newCollectionRequest');
        socket.off('routeStarted');
        socket.off('routeCompleted');
        socket.off('adminNotification');
      };
    }
  }, [socket, user]);

  const emitEvent = (event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    }
  };

  const value = {
    socket,
    isConnected,
    emitEvent,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
