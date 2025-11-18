/**
 * Tests pour la protection CSRF
 * Vérifie que les tokens CSRF sont correctement générés et validés
 */

const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { csrfProtection, generateCsrfToken } = require('../security-middleware');

describe('CSRF Protection', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(cookieParser());
    app.use(express.json());
    
    // Route pour obtenir le token CSRF
    app.get('/api/csrf-token', generateCsrfToken, (req, res) => {
      res.json({ csrfToken: req.csrfToken });
    });
    
    // Route protégée pour tester
    app.post('/api/test', csrfProtection, (req, res) => {
      res.json({ success: true });
    });
    
    // Route publique (ne nécessite pas CSRF)
    app.post('/api/auth/login', csrfProtection, (req, res) => {
      res.json({ success: true });
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate a CSRF token and set it in cookie and header', async () => {
      const response = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      // Vérifier que le token est retourné dans le body
      expect(response.body.csrfToken).toBeDefined();
      expect(response.body.csrfToken).toMatch(/^[a-f0-9]{64}$/); // 64 caractères hex

      // Vérifier que le token est dans le header
      expect(response.headers['x-csrf-token']).toBeDefined();
      expect(response.headers['x-csrf-token']).toBe(response.body.csrfToken);

      // Vérifier que le cookie est défini
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.includes('_csrf='))).toBe(true);
    });
  });

  describe('csrfProtection', () => {
    it('should allow GET requests without CSRF token', async () => {
      // GET requests should be allowed
      app.get('/api/test-get', csrfProtection, (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/api/test-get')
        .expect(200);
    });

    it('should allow public routes without CSRF token', async () => {
      await request(app)
        .post('/api/auth/login')
        .expect(200);
    });

    it('should reject POST requests without CSRF token', async () => {
      await request(app)
        .post('/api/test')
        .expect(403)
        .expect((res) => {
          expect(res.body.error).toBe('Token CSRF manquant');
        });
    });

    it('should reject POST requests with only cookie token', async () => {
      // Obtenir un token CSRF
      const tokenResponse = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const token = tokenResponse.body.csrfToken;
      const cookie = tokenResponse.headers['set-cookie'][0];

      // Faire une requête avec seulement le cookie (pas de header)
      await request(app)
        .post('/api/test')
        .set('Cookie', cookie)
        .expect(403)
        .expect((res) => {
          expect(res.body.error).toBe('Token CSRF manquant');
        });
    });

    it('should reject POST requests with only header token', async () => {
      // Obtenir un token CSRF
      const tokenResponse = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const token = tokenResponse.body.csrfToken;

      // Faire une requête avec seulement le header (pas de cookie)
      await request(app)
        .post('/api/test')
        .set('X-CSRF-Token', token)
        .expect(403)
        .expect((res) => {
          expect(res.body.error).toBe('Token CSRF manquant');
        });
    });

    it('should reject POST requests with mismatched tokens', async () => {
      // Obtenir un token CSRF
      const tokenResponse = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const cookie = tokenResponse.headers['set-cookie'][0];
      const wrongToken = 'a'.repeat(64); // Token incorrect

      // Faire une requête avec cookie correct mais header incorrect
      await request(app)
        .post('/api/test')
        .set('Cookie', cookie)
        .set('X-CSRF-Token', wrongToken)
        .expect(403)
        .expect((res) => {
          expect(res.body.error).toBe('Token CSRF invalide');
        });
    });

    it('should accept POST requests with valid CSRF token', async () => {
      // Obtenir un token CSRF
      const tokenResponse = await request(app)
        .get('/api/csrf-token')
        .expect(200);

      const token = tokenResponse.body.csrfToken;
      const cookie = tokenResponse.headers['set-cookie'][0];

      // Faire une requête avec cookie et header valides
      await request(app)
        .post('/api/test')
        .set('Cookie', cookie)
        .set('X-CSRF-Token', token)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });
});

