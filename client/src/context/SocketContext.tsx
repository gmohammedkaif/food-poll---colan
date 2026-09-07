import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinPollRoom: (pollId: string) => void;
  leavePollRoom: (pollId: string) => void;
  joinAdminRoom: () => void;
  leaveAdminRoom: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinPollRoom: () => {},
  leavePollRoom: () => {},
  joinAdminRoom: () => {},
  leaveAdminRoom: () => {}
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server with smooth upgrade
    const socket = io('/', {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinPollRoom = (pollId: string) => {
    if (socketRef.current && pollId) {
      socketRef.current.emit('join_poll', pollId);
    }
  };

  const leavePollRoom = (pollId: string) => {
    if (socketRef.current && pollId) {
      socketRef.current.emit('leave_poll', pollId);
    }
  };

  const joinAdminRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('join_admin');
    }
  };

  const leaveAdminRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('leave_admin');
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinPollRoom,
        leavePollRoom,
        joinAdminRoom,
        leaveAdminRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
