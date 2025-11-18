/**
 * Tests pour le rate limiting
 * Vérifie que les limites sont correctement appliquées
 */

const request = require('supertest');
const express = require('express');
const { generalRateLimit, authRateLimit, adminRateLimit } = require('../security-middleware');

describe('Rate Limiting', () => {
  describe('generalRateLimit', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use('/api', generalRateLimit);
      
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests within the limit', async () => {
      // Faire 10 requêtes (bien en dessous de la limite de 100)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get('/api/test')
          .expect(200);
      }
    });

    it('should return 429 when limit is exceeded', async () => {
      // Faire 101 requêtes (au-dessus de la limite de 100)
      let lastResponse;
      for (let i = 0; i < 101; i++) {
        lastResponse = await request(app)
          .get('/api/test');
      }

      // La dernière requête devrait être bloquée
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.error).toBe('Trop de requêtes');
      expect(lastResponse.body.retryAfter).toBeDefined();
    });

    it('should include RateLimit headers', async () => {
      const response = await request(app)
        .get('/api/test')
        .expect(200);

      // Vérifier que les headers RateLimit sont présents
      expect(response.headers['ratelimit-limit']).toBeDefined();
      expect(response.headers['ratelimit-remaining']).toBeDefined();
    });
  });

  describe('authRateLimit', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      
      app.post('/api/auth/login', authRateLimit, (req, res) => {
        // Simuler une connexion réussie
        if (req.body.email === 'test@example.com' && req.body.password === 'correct') {
          res.json({ success: true });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      });
    });

    it('should allow successful login attempts', async () => {
      // Les connexions réussies ne comptent pas (skipSuccessfulRequests: true)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'correct' })
          .expect(200);
      }
    });

    it('should block after 5 failed login attempts', async () => {
      // Faire 5 tentatives échouées
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'test@example.com', password: 'wrong' })
          .expect(401);
      }

      // La 6ème tentative devrait être bloquée
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(429);

      expect(response.body.error).toBe('Trop de tentatives de connexion');
      expect(response.body.retryAfter).toBe(900); // 15 minutes
    });
  });

  describe('adminRateLimit', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use('/api/admin', adminRateLimit);
      
      app.get('/api/admin/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should allow requests within the admin limit (50)', async () => {
      // Faire 10 requêtes (bien en dessous de la limite de 50)
      for (let i = 0; i < 10; i++) {
        await request(app)
          .get('/api/admin/test')
          .expect(200);
      }
    });

    it('should block after 50 admin requests', async () => {
      // Faire 51 requêtes (au-dessus de la limite de 50)
      let lastResponse;
      for (let i = 0; i < 51; i++) {
        lastResponse = await request(app)
          .get('/api/admin/test');
      }

      // La dernière requête devrait être bloquée
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.error).toBe('Trop de requêtes');
    });
  });

  describe('IP-based limiting', () => {
    let app;

    beforeEach(() => {
      app = express();
      app.use(express.json());
      app.use('/api', generalRateLimit);
      
      app.get('/api/test', (req, res) => {
        res.json({ success: true });
      });
    });

    it('should limit per IP address', async () => {
      // IP 1 fait 100 requêtes (limite atteinte)
      for (let i = 0; i < 100; i++) {
        await request(app)
          .get('/api/test')
          .set('X-Forwarded-For', '192.168.1.1')
          .expect(200);
      }

      // IP 1 devrait être bloquée
      const response1 = await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', '192.168.1.1')
        .expect(429);

      expect(response1.body.error).toBe('Trop de requêtes');

      // IP 2 devrait encore pouvoir faire des requêtes
      const response2 = await request(app)
        .get('/api/test')
        .set('X-Forwarded-For', '192.168.1.2')
        .expect(200);

      expect(response2.body.success).toBe(true);
    });
  });
});

