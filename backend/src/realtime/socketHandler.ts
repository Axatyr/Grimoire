import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { TokenPayload } from '../types/index.js';

export const setupSocketIO = (io: SocketIOServer) => {
  // Authentication middleware for Socket.io
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload;
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as TokenPayload;
    console.log(`[Socket.IO] User connected: ${user.username} (${user.userId})`);

    // Join campaign room
    socket.on('join_campaign', (campaignId: string) => {
      socket.join(`campaign:${campaignId}`);
      console.log(`[Socket.IO] User ${user.username} joined campaign room: campaign:${campaignId}`);
    });

    // Leave campaign room
    socket.on('leave_campaign', (campaignId: string) => {
      socket.leave(`campaign:${campaignId}`);
    });

    // Master live broadcast of handout (image, note, quest, monster)
    socket.on('live_broadcast', (data: { campaignId: string; type: string; payload: any }) => {
      if (user.role === 'MASTER' || user.role === 'ADMIN') {
        io.to(`campaign:${data.campaignId}`).emit('handout_received', {
          type: data.type,
          payload: data.payload,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Loot transferred event
    socket.on('loot_transferred', (data: { campaignId: string; itemId: string; targetCharacterId: string; itemName: string }) => {
      io.to(`campaign:${data.campaignId}`).emit('loot_updated', data);
    });

    // Story node status changed
    socket.on('story_node_progressed', (data: { campaignId: string; nodeId: string; status: string }) => {
      io.to(`campaign:${data.campaignId}`).emit('story_progress_sync', data);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${user.username}`);
    });
  });
};
