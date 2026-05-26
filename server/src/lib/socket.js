import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

const onlineUsers = new Map(); // userId -> socketId

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL 
        ? process.env.CLIENT_URL.split(',').map(s => s.trim())
        : 'http://localhost:5173',
      credentials: true,
    },
  });

  // Authentication middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.cookie?.split('accessToken=')[1]?.split(';')[0];
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role, name } = socket.user;
    console.log(`🔌 Connected: ${name} (${role})`);

    // Track online status
    onlineUsers.set(userId, socket.id);
    
    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Admin joins admin room
    if (role === 'ADMIN') {
      socket.join('admin');
    }

    // Broadcast online status
    io.to('admin').emit('employee:online', {
      userId,
      name,
      timestamp: new Date().toISOString(),
    });

    // Emit current online users to the connecting client
    socket.emit('online:users', Array.from(onlineUsers.keys()));

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${name}`);
      onlineUsers.delete(userId);
      io.to('admin').emit('employee:offline', {
        userId,
        name,
        timestamp: new Date().toISOString(),
      });
    });
  });

  // Helper methods
  io.emitTaskEvent = (event, data) => {
    io.to('admin').emit(event, data);
    io.to(`user:${data.userId}`).emit(event, data);
  };

  io.getOnlineUsers = () => Array.from(onlineUsers.keys());

  return io;
}
