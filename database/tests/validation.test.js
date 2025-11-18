/**
 * Tests pour les validateurs
 * Vérifie que les validations sont correctement appliquées
 */

const request = require('supertest');
const express = require('express');
const { body } = require('express-validator');
const { validateUserCreate, validateProductCreate, validateCategory } = require('../security-middleware');

describe('Validation', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('validateUserCreate', () => {
    beforeEach(() => {
      app.post('/api/test/user', validateUserCreate, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/test/user')
        .send({
          email: 'invalid-email',
          password: 'Password123'
        })
        .expect(400);

      expect(response.body.error).toBe('Données invalides');
      expect(response.body.details).toBeDefined();
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/test/user')
        .send({
          email: 'test@example.com',
          password: 'weak'
        })
        .expect(400);

      expect(response.body.error).toBe('Données invalides');
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .post('/api/test/user')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          role: 'invalid-role'
        })
        .expect(400);

      expect(response.body.error).toBe('Données invalides');
    });

    it('should accept valid user data', async () => {
      const response = await request(app)
        .post('/api/test/user')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'client'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('validateProductCreate', () => {
    beforeEach(() => {
      app.post('/api/test/product', validateProductCreate, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should reject negative price', async () => {
      const response = await request(app)
        .post('/api/test/product')
        .send({
          categoryId: 1,
          name: 'Test Product',
          price: -10
        })
        .expect(400);

      expect(response.body.error).toBe('Données invalides');
    });

    it('should reject invalid categoryId', async () => {
      const response = await request(app)
        .post('/api/test/product')
        .send({
          categoryId: 0,
          name: 'Test Product',
          price: 10
        })
        .expect(400);

      expect(response.body.error).toBe('Données invalides');
    });

    it('should accept valid product data', async () => {
      const response = await request(app)
        .post('/api/test/product')
        .send({
          categoryId: 1,
          name: 'Test Product',
          price: 10.99,
          description: 'A test product'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('validateCategory', () => {
    beforeEach(() => {
      app.post('/api/test/category', validateCategory, (req, res) => {
        res.json({ success: true });
      });
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .post('/api/test/category')
        .send({
          name: ''
        })
        .expect(400);

      expect(response.body.error).toBe('Données invalides');
    });

    it('should reject name too long', async () => {
      const response = await request(app)
        .post('/api/test/category')
        .send({
          name: 'a'.repeat(101)
        })
        .expect(400);

      expect(response.body.error).toBe('Données invalides');
    });

    it('should accept valid category data', async () => {
      const response = await request(app)
        .post('/api/test/category')
        .send({
          name: 'Test Category',
          description: 'A test category'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});

