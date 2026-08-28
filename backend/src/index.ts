import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';

import { config } from './config/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSocketIO } from './realtime/socketHandler.js';

// Route imports
import { authRouter } from './routes/auth.routes.js';
import { campaignRouter } from './routes/campaign.routes.js';
import { characterRouter } from './routes/character.routes.js';
import { monsterRouter } from './routes/monster.routes.js';
import { itemRouter } from './routes/item.routes.js';
import { locationRouter } from './routes/location.routes.js';
import { npcRouter } from './routes/npc.routes.js';
import { questRouter } from './routes/quest.routes.js';
import { storyRouter } from './routes/story.routes.js';
import { noteRouter } from './routes/note.routes.js';
import { imageRouter } from './routes/image.routes.js';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }
});

// Setup realtime socket handler
setupSocketIO(io);

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(config.uploadDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Grimoire Backend API'
  });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/characters', characterRouter);
app.use('/api/monsters', monsterRouter);
app.use('/api/items', itemRouter);
app.use('/api/locations', locationRouter);
app.use('/api/npcs', npcRouter);
app.use('/api/quests', questRouter);
app.use('/api/story', storyRouter);
app.use('/api/notes', noteRouter);
app.use('/api/images', imageRouter);

// Global error handler
app.use(errorHandler);

server.listen(config.port, '0.0.0.0', () => {
  console.log(`=============================================`);
  console.log(`🧙 Grimoire API Server running on port ${config.port}`);
  console.log(`🌐 Ready for local & remote connections: http://localhost:${config.port}`);
  console.log(`📁 Uploads served at: ${config.uploadDir}`);
  console.log(`=============================================`);
});

export { app, server, io };
