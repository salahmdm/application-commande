/**
 * ================================================================
 * BLOSSOM CAFÉ - Exemple de Backend API avec Node.js + Express
 * ================================================================
 * 
 * Ce fichier est un exemple pour vous montrer comment créer
 * un backend qui se connecte à la base de données MySQL.
 * 
 * Installation :
 * npm install express mysql2 dotenv cors bcrypt jsonwebtoken
 * 
 * Utilisation :
 * node backend-example.js
 */

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ================================================================
// CONFIGURATION DE LA BASE DE DONNÉES
// ================================================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Tester la connexion
pool.getConnection()
  .then(connection => {
    console.log('✅ Connexion à MySQL réussie !');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MySQL:', err.message);
  });

// ================================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ================================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secret_dev', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// ================================================================
// ROUTES D'AUTHENTIFICATION
// ================================================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Récupérer l'utilisateur
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // Vérifier le mot de passe (NOTE: hashage à implémenter en production)
    // const isValidPassword = await bcrypt.compare(password, user.password_hash);
    // Pour les tests, on accepte le mot de passe tel quel
    const isValidPassword = true; // À REMPLACER en production

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Créer le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_dev',
      { expiresIn: '24h' }
    );

    // Retourner les données utilisateur (sans le mot de passe)
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Vérifier si l'email existe déjà
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role) 
       VALUES (?, ?, ?, ?, ?, 'client')`,
      [email, passwordHash, firstName, lastName, phone]
    );

    // Bonus de bienvenue
    await pool.query(
      'CALL add_loyalty_points(?, NULL, 50, "Bonus d\'inscription")',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTES PRODUITS
// ================================================================

// Récupérer tous les produits
app.get('/api/products', async (req, res) => {
  try {
    const { category, search, featured } = req.query;
    let query = `
      SELECT p.*, c.name AS category_name 
      FROM products p 
      JOIN categories c ON p.category_id = c.id 
      WHERE p.is_available = TRUE
    `;
    const params = [];

    if (category) {
      query += ' AND c.slug = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (featured === 'true') {
      query += ' AND p.is_featured = TRUE';
    }

    query += ' ORDER BY c.display_order, p.name';

    const [products] = await pool.query(query, params);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Erreur products:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un produit par ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const [products] = await pool.query(
      `SELECT p.*, c.name AS category_name 
       FROM products p 
       JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ success: true, data: products[0] });
  } catch (error) {
    console.error('Erreur product:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques produits (utilise la vue product_stats)
app.get('/api/products/stats/all', async (req, res) => {
  try {
    const [stats] = await pool.query('SELECT * FROM product_stats ORDER BY total_revenue DESC');
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erreur stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTES CATÉGORIES
// ================================================================

app.get('/api/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE is_active = TRUE ORDER BY display_order'
    );
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Erreur categories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTES COMMANDES (protégées)
// ================================================================

// Récupérer les commandes de l'utilisateur connecté
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, 
        (SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Erreur orders:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une commande
app.post('/api/orders', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { orderType, items, promoCode, paymentMethod, notes, tableNumber } = req.body;

    // ⚠️ ANCIEN CODE SUPPRIMÉ - Utiliser generateOrderNumber() au lieu de cette ligne
    // Format ORD-YYYY-XXXXXXXXXX est OBSOLÈTE
    // Utiliser le format CMD-XXXX uniquement
    throw new Error('Ce fichier est un exemple. Utilisez database/admin-api.js avec generateOrderNumber()');

    // Calculer le sous-total
    let subtotal = 0;
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT price FROM products WHERE id = ?',
        [item.productId]
      );
      subtotal += products[0].price * item.quantity;
    }

    // Appliquer le code promo si fourni
    let discountAmount = 0;
    let promoCodeId = null;

    if (promoCode) {
      const [promoCodes] = await connection.query(
        `SELECT * FROM promo_codes 
         WHERE code = ? AND is_active = TRUE 
         AND (valid_until IS NULL OR valid_until > NOW())
         AND (max_uses IS NULL OR uses_count < max_uses)
         AND ? >= min_order_amount`,
        [promoCode, subtotal]
      );

      if (promoCodes.length > 0) {
        const promo = promoCodes[0];
        promoCodeId = promo.id;

        if (promo.discount_type === 'percentage') {
          discountAmount = (subtotal * promo.discount_value) / 100;
        } else {
          discountAmount = promo.discount_value;
        }
      }
    }

    const taxAmount = (subtotal - discountAmount) * 0.10; // 10% TVA
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Créer la commande
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id, order_number, order_type, status, 
        subtotal, discount_amount, tax_amount, total_amount,
        promo_code_id, payment_method, payment_status, notes, table_number
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [
        req.user.id, orderNumber, orderType,
        subtotal, discountAmount, taxAmount, totalAmount,
        promoCodeId, paymentMethod, notes, tableNumber
      ]
    );

    const orderId = orderResult.insertId;

    // Ajouter les items
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT name, price FROM products WHERE id = ?',
        [item.productId]
      );

      const product = products[0];
      const itemSubtotal = product.price * item.quantity;

      await connection.query(
        `INSERT INTO order_items (
          order_id, product_id, product_name, quantity, unit_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [orderId, item.productId, product.name, item.quantity, product.price, itemSubtotal]
      );
    }

    // Ajouter des points de fidélité (1 point par euro)
    const points = Math.floor(totalAmount);
    await connection.query(
      'CALL add_loyalty_points(?, ?, ?, ?)',
      [req.user.id, orderId, points, `Points gagnés sur commande ${orderNumber}`]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: {
        orderId,
        orderNumber,
        totalAmount,
        pointsEarned: points
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Erreur create order:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    connection.release();
  }
});

// Mettre à jour le statut d'une commande (Manager/Admin)
app.put('/api/orders/:id/status', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est manager ou admin
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { status } = req.body;
    const orderId = req.params.id;

    await pool.query(
      'CALL update_order_status(?, ?, ?)',
      [orderId, status, req.user.id]
    );

    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    console.error('Erreur update status:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTES FAVORIS
// ================================================================

// Récupérer les favoris de l'utilisateur
app.get('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const [favorites] = await pool.query(
      `SELECT f.*, p.*, c.name AS category_name
       FROM favorites f
       JOIN products p ON f.product_id = p.id
       JOIN categories c ON p.category_id = c.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, data: favorites });
  } catch (error) {
    console.error('Erreur favorites:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Ajouter un favori
app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;

    await pool.query(
      'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)',
      [req.user.id, productId]
    );

    res.status(201).json({ success: true, message: 'Favori ajouté' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Déjà dans les favoris' });
    }
    console.error('Erreur add favorite:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un favori
app.delete('/api/favorites/:productId', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
      [req.user.id, req.params.productId]
    );

    res.json({ success: true, message: 'Favori supprimé' });
  } catch (error) {
    console.error('Erreur delete favorite:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTES ANALYTICS (Admin)
// ================================================================

app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    // Statistiques générales
    const [stats] = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'client') AS total_clients,
        (SELECT COUNT(*) FROM products WHERE is_available = TRUE) AS total_products,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) AS orders_today,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'completed') AS total_revenue
    `);

    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Erreur analytics:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTE DE TEST
// ================================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Blossom Café API est opérationnelle',
    timestamp: new Date().toISOString()
  });
});

// ================================================================
// DÉMARRAGE DU SERVEUR
// ================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('========================================');
  console.log(`🌸 Blossom Café API`);
  console.log('========================================');
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 Base de données: ${process.env.DB_NAME || 'blossom_cafe'}`);
  console.log('');
  console.log('Endpoints disponibles:');
  console.log('  POST   /api/auth/login');
  console.log('  POST   /api/auth/register');
  console.log('  GET    /api/products');
  console.log('  GET    /api/products/:id');
  console.log('  GET    /api/categories');
  console.log('  GET    /api/orders');
  console.log('  POST   /api/orders');
  console.log('  GET    /api/favorites');
  console.log('  POST   /api/favorites');
  console.log('  GET    /api/analytics/dashboard');
  console.log('');
  console.log('Appuyez sur Ctrl+C pour arrêter');
  console.log('========================================');
  console.log('');
});

// Gestion des erreurs non gérées
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

