import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import technicianRoutes from './routes/technicians.js';
import dashboardRoutes from './routes/dashboard.js';
import settingsRoutes from './routes/settings.js';
import leaveRequestRoutes from './routes/leaveRequests.js';
import customerVerificationRoutes from './routes/customerVerification.js';
import profileRoutes from './routes/profile.js';
import forgotPasswordRoutes from './routes/forgotPassword.js';
import pauseTimerRoutes from './routes/pauseTimer.js';
import chatRoutes from './routes/chat.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      // Allow localhost, local network IPs, and no-origin (mobile apps)
      callback(null, true);
    },
    methods: ['GET', 'POST']
  }
});

// Make io accessible to routes
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Join a complaint chat room
  socket.on('join-chat', (complaintId) => {
    socket.join(`complaint-${complaintId}`);
    console.log(`Socket ${socket.id} joined complaint-${complaintId}`);
  });

  // Leave a complaint chat room
  socket.on('leave-chat', (complaintId) => {
    socket.leave(`complaint-${complaintId}`);
  });

  // Typing indicator
  socket.on('typing', ({ complaintId, userName }) => {
    socket.to(`complaint-${complaintId}`).emit('user-typing', { userName });
  });

  socket.on('stop-typing', ({ complaintId }) => {
    socket.to(`complaint-${complaintId}`).emit('user-stop-typing');
  });

  // User personal room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Socket ${socket.id} joined user-${userId}`);
  });

  socket.on('leave-user-room', (userId) => {
    socket.leave(`user-${userId}`);
    console.log(`Socket ${socket.id} left user-${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files with proper MIME types for audio
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.webm')) {
      res.set('Content-Type', 'audio/webm');
    } else if (filePath.endsWith('.ogg')) {
      res.set('Content-Type', 'audio/ogg');
    } else if (filePath.endsWith('.m4a')) {
      res.set('Content-Type', 'audio/mp4');
    }
    // Allow range requests for audio streaming
    res.set('Accept-Ranges', 'bytes');
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/complaints', customerVerificationRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/leave-requests', leaveRequestRoutes);
app.use('/api/forgot-password', forgotPasswordRoutes);
app.use('/api/complaints', pauseTimerRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'TCN API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 TCN Server running on port ${PORT}`);
});
