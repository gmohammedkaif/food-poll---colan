import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from '../config/env.js';

let ioInstance: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    // Join poll-specific room for real-time live updates
    socket.on('join_poll', (pollId: string) => {
      if (pollId) {
        socket.join(`poll_${pollId}`);
      }
    });

    socket.on('leave_poll', (pollId: string) => {
      if (pollId) {
        socket.leave(`poll_${pollId}`);
      }
    });

    // Admin room for security & admin live counters
    socket.on('join_admin', () => {
      socket.join('admin_channel');
    });

    socket.on('leave_admin', () => {
      socket.leave('admin_channel');
    });
  });

  return ioInstance;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function broadcastVoteUpdate(pollId: string, results: unknown): void {
  if (ioInstance) {
    ioInstance.to(`poll_${pollId}`).emit('vote_updated', results);
    ioInstance.to('admin_channel').emit('admin_vote_updated', { pollId, results });
  }
}

export function broadcastPollStatusChange(pollId: string, status: string, poll: unknown): void {
  if (ioInstance) {
    ioInstance.emit('poll_status_changed', { pollId, status, poll });
  }
}

export function broadcastSecurityAlert(alert: unknown): void {
  if (ioInstance) {
    ioInstance.to('admin_channel').emit('security_alert', alert);
  }
}
