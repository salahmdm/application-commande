/**
 * Tests pour la sécurité du middleware
 * Vérifie que le bypass dev est correctement sécurisé
 */

const { authenticateToken, requireAdmin } = require('../security-middleware');
const jwt = require('jsonwebtoken');
const config = require('../config');

// Mock Express request/response
const createMockReq = (options = {}) => ({
  cookies: options.cookies || {},
  headers: options.headers || {},
  ip: options.ip || '127.0.0.1',
  path: options.path || '/api/test',
  ...options
});

const createMockRes = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  };
  return res;
};

describe('Security Middleware - Dev Bypass', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });
  
  afterAll(() => {
    process.env = originalEnv;
  });

  describe('canUseDevBypass', () => {
    it('should NEVER allow bypass in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEV_BYPASS = 'true';
      process.env.DEV_BYPASS_SECRET = 'test-secret';
      
      const req = createMockReq({
        headers: { 'x-dev-bypass-secret': 'test-secret' }
      });
      
      // Recharger le module pour prendre en compte les nouvelles variables d'env
      delete require.cache[require.resolve('../security-middleware')];
      const { authenticateToken } = require('../security-middleware');
      
      const res = createMockRes();
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      // En production, même avec le secret, le bypass ne doit pas fonctionner
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentification requise' });
    });

    it('should NOT allow bypass if ALLOW_DEV_BYPASS is not "true"', () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_DEV_BYPASS = 'false';
      process.env.DEV_BYPASS_SECRET = 'test-secret';
      
      const req = createMockReq({
        headers: { 'x-dev-bypass-secret': 'test-secret' }
      });
      
      delete require.cache[require.resolve('../security-middleware')];
      const { authenticateToken } = require('../security-middleware');
      
      const res = createMockRes();
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      // Sans ALLOW_DEV_BYPASS=true, le bypass ne doit pas fonctionner
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should NOT allow bypass without secret header', () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_DEV_BYPASS = 'true';
      process.env.DEV_BYPASS_SECRET = 'test-secret';
      
      const req = createMockReq({
        headers: {} // Pas de header secret
      });
      
      delete require.cache[require.resolve('../security-middleware')];
      const { authenticateToken } = require('../security-middleware');
      
      const res = createMockRes();
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      // Sans le header secret, le bypass ne doit pas fonctionner
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should NOT allow bypass with wrong secret', () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_DEV_BYPASS = 'true';
      process.env.DEV_BYPASS_SECRET = 'correct-secret';
      
      const req = createMockReq({
        headers: { 'x-dev-bypass-secret': 'wrong-secret' }
      });
      
      delete require.cache[require.resolve('../security-middleware')];
      const { authenticateToken } = require('../security-middleware');
      
      const res = createMockRes();
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      // Avec un secret incorrect, le bypass ne doit pas fonctionner
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should allow bypass ONLY with all conditions met', () => {
      process.env.NODE_ENV = 'development';
      process.env.ALLOW_DEV_BYPASS = 'true';
      process.env.DEV_BYPASS_SECRET = 'test-secret';
      
      const req = createMockReq({
        headers: { 'x-dev-bypass-secret': 'test-secret' }
      });
      
      delete require.cache[require.resolve('../security-middleware')];
      const { authenticateToken } = require('../security-middleware');
      
      const res = createMockRes();
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      // Avec toutes les conditions remplies, le bypass doit fonctionner
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: 0,
        email: 'dev@local',
        role: 'manager',
        devBypass: true
      });
    });
  });

  describe('authenticateToken with valid JWT', () => {
    it('should authenticate with valid JWT token', () => {
      const token = jwt.sign(
        { id: 1, email: 'test@example.com', role: 'admin' },
        config.jwt.secret,
        { expiresIn: '1h' }
      );
      
      const req = createMockReq({
        headers: { 'authorization': `Bearer ${token}` }
      });
      
      const res = createMockRes();
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({
        id: 1,
        email: 'test@example.com',
        role: 'admin'
      });
    });
  });
});

