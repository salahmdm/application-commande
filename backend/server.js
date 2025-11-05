import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import gatewayRoutes from './routes/gateway.js';
import { gatewayConfig } from './config/gateway.config.js';
import { gatewayService } from './services/gatewayService.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

let io = null;
if (gatewayConfig.websocket.enabled) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connecté: ${socket.id}`);
    socket.emit('gateway-status', gatewayService.getStatus());
    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client déconnecté: ${socket.id}`);
    });
  });

  setInterval(() => {
    if (io && gatewayService.connected) {
      try {
        gatewayService.getSystemInfo().then((info) => {
          io.emit('gateway-data', info);
        }).catch((error) => {
          console.error('[WebSocket] Erreur:', error);
        });
      } catch (error) {
        console.error('[WebSocket] Erreur:', error);
      }
    }
  }, 5000);
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: gatewayConfig.security.rateLimitWindowMs,
  max: gatewayConfig.security.rateLimitMaxRequests,
  message: { success: false, error: 'Trop de requêtes, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/gateway/ports' || req.path === '/api/gateway/ports/detect';
  },
});

app.use('/api/', limiter);

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Gateway opérationnelle',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/gateway', gatewayRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route non trouvée' });
});

app.use((err, req, res, next) => {
  console.error('[Server] Erreur non gérée:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Erreur interne du serveur',
    ...(gatewayConfig.server.nodeEnv === 'development' && { stack: err.stack }),
  });
});

export const emitWebSocket = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

const PORT = gatewayConfig.server.port;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Serveur Gateway API démarré sur le port ${PORT}`);
  console.log(`📡 Protocole configuré: ${gatewayConfig.protocol.toUpperCase()}`);
  console.log(`🌐 Passerelle IP: ${gatewayConfig.ip}:${gatewayConfig.port}`);
  console.log(`📦 Numéro de série: ${gatewayConfig.serialNumber}`);
  console.log(`🔌 WebSocket: ${gatewayConfig.websocket.enabled ? 'Activé' : 'Désactivé'}`);
  console.log(`\n✅ API disponible sur http://localhost:${PORT}/api`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health\n`);
});

process.on('SIGTERM', async () => {
  console.log('\n[SIGTERM] Arrêt du serveur...');
  if (gatewayService.connected) {
    await gatewayService.disconnect();
  }
  if (io) {
    io.close();
  }
  httpServer.close(() => {
    console.log('[SIGTERM] Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n[SIGINT] Arrêt du serveur...');
  if (gatewayService.connected) {
    await gatewayService.disconnect();
  }
  if (io) {
    io.close();
  }
  httpServer.close(() => {
    console.log('[SIGINT] Serveur arrêté proprement');
    process.exit(0);
  });
});

export default app;

