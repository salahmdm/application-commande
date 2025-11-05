/**
 * ================================================================
 * API ADMIN COMPLÈTE - Blossom Café
 * ================================================================
 * Routes CRUD complètes pour l'administration
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const multer = require('multer');
const upload = require('./upload-config');
const uploadNews = require('./upload-config-news');
const path = require('path');
const fs = require('fs');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// ================================================================
// FONCTION UTILITAIRE : Génération de numéro de commande
// ================================================================
/**
 * Génère un numéro de commande unique au format CMD-XXXX
 * Format: CMD-0001, CMD-0002, etc. (réinitialisé chaque jour)
 * @param {Object} connection - Connexion MySQL
 * @returns {Promise<string>} - Numéro de commande au format CMD-XXXX
 */
async function generateOrderNumber(connection) {
  try {
    console.log('🔢 [generateOrderNumber] Début de la génération...');
    
    // Utiliser une sous-requête pour obtenir le maximum de manière atomique
    // Cela évite les problèmes de concurrence
    const [result] = await connection.query(
      `SELECT 
        COALESCE(MAX(CAST(SUBSTRING(order_number, 5) AS UNSIGNED)), 0) as max_number
       FROM orders 
       WHERE DATE(created_at) = CURDATE() 
       AND order_number REGEXP '^CMD-[0-9]{4}$'`
    );
    
    let dailyCount = 1;
    
    if (result.length > 0 && result[0].max_number !== null) {
      const maxNumber = parseInt(result[0].max_number, 10);
      if (!isNaN(maxNumber) && maxNumber >= 0) {
        dailyCount = maxNumber + 1;
      }
    }
    
    // Générer le nouveau numéro au format CMD-XXXX
    const orderNumber = `CMD-${String(dailyCount).padStart(4, '0')}`;
    
    console.log('📌 [generateOrderNumber] Génération numéro de commande:');
    console.log('   - Max numéro aujourd\'hui:', result[0]?.max_number || 0);
    console.log('   - Nouveau numéro généré:', orderNumber);
    console.log('   - Format vérifié:', orderNumber.match(/^CMD-\d{4}$/) ? '✅' : '❌');
    
    // Vérifier que le format est correct
    if (!orderNumber.match(/^CMD-\d{4}$/)) {
      console.error('❌ [generateOrderNumber] Format invalide généré:', orderNumber);
      throw new Error(`Format de numéro de commande invalide: ${orderNumber}`);
    }
    
    return orderNumber;
  } catch (error) {
    console.error('❌ [generateOrderNumber] Erreur lors de la génération:', error);
    console.error('   Stack:', error.stack);
    // En cas d'erreur, utiliser un timestamp comme fallback (mais format CMD)
    const timestamp = Date.now().toString().slice(-4);
    const fallbackNumber = `CMD-${timestamp}`;
    console.error('   ⚠️ Utilisation du fallback:', fallbackNumber);
    return fallbackNumber;
  }
}

// Middleware CORS - Configuration simplifiée et robuste
// Accepter toutes les requêtes en développement (localhost)
app.use(cors({
  origin: true, // Accepter toutes les origines en développement
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
}));
app.use(express.json());

// Middleware de logging pour diagnostiquer les problèmes de connexion
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`  Origin: ${req.headers.origin || 'N/A'}`);
  console.log(`  Referer: ${req.headers.referer || 'N/A'}`);
  next();
});

// Servir les fichiers statiques (images uploads)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Route de test santé
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Blossom Café API est active',
    timestamp: new Date().toISOString()
  });
});

// ================================================================
// CONFIGURATION BASE DE DONNÉES
// ================================================================
const pool = mysql.createPool({
  host: '127.0.0.1', // Utiliser 127.0.0.1 au lieu de localhost
  port: 3306,
  user: 'root',
  password: 'Muheko,1991@',
  database: 'blossom_cafe',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000 // 10 secondes
});

// Test de connexion avec gestion d'erreur améliorée
pool.getConnection()
  .then(connection => {
    console.log('✅ Connexion MySQL réussie');
    console.log('📊 Base de données: blossom_cafe');
    console.log('🔌 Host: 127.0.0.1:3306');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MySQL:', err.message);
    console.error('');
    console.error('🔍 Vérifications:');
    console.error('   1. MySQL est-il démarré ?');
    console.error('   2. Mot de passe correct: Muheko,1991@');
    console.error('   3. Base blossom_cafe existe-t-elle ?');
    console.error('   4. Port 3306 accessible ?');
    console.error('');
    console.error('💡 Lancez: node verify-and-fix-db.js');
    process.exit(1);
  });

// ================================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ================================================================
const JWT_SECRET = 'your_super_secret_key_change_in_production';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('❌ Erreur vérification token:', err.message);
      console.error('  - Token reçu:', token.substring(0, 20) + '...');
      return res.status(403).json({ error: 'Token invalide', details: err.message });
    }
    console.log('✅ Token valide pour utilisateur:', user.id, 'role:', user.role);
    req.user = user;
    next();
  });
};

// Middleware d'authentification optionnel (accepte token ou invité)
const authenticateOptional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // Si pas de token, vérifier si c'est un invité
  if (!token) {
    const guestName = req.body.guestName || req.headers['x-guest-name'];
    if (guestName) {
      // Utilisateur invité
      req.user = {
        id: null, // Pas d'ID dans la base de données pour les invités
        role: 'client',
        isGuest: true,
        guestName: guestName
      };
      return next();
    }
    return res.status(401).json({ error: 'Token manquant ou nom invité manquant' });
  }

  // Token présent, vérifier
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    req.user.isGuest = false;
    next();
  });
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Droits admin requis.' });
  }
  next();
};

// Middleware pour vérifier le rôle manager ou admin
const requireManager = (req, res, next) => {
  if (!['manager', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Accès refusé. Droits manager requis.' });
  }
  next();
};

// ================================================================
// ROUTES PUBLIQUES (Pas d'authentification requise)
// ================================================================

// Route de santé pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Blossom Café API Server', timestamp: new Date().toISOString() });
});

// Route de santé API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API Server is running', timestamp: new Date().toISOString() });
});

// Produits disponibles (pour les clients non authentifiés)
app.get('/api/products', async (req, res) => {
  try {
    console.log('📦 GET /api/products - Route publique');
    
    const [products] = await pool.query(`
      SELECT 
        p.*,
        c.name as category_name,
        c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_available = TRUE
      ORDER BY c.display_order, p.name
    `);
    
    console.log(`✅ ${products.length} produits récupérés`);
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/products:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Catégories disponibles (pour les clients non authentifiés)
app.get('/api/categories', async (req, res) => {
  try {
    console.log('📂 GET /api/categories - Route publique');
    
    const [categories] = await pool.query(`
      SELECT * FROM categories 
      WHERE is_active = TRUE 
      ORDER BY display_order
    `);
    
    console.log(`✅ ${categories.length} catégories récupérées`);
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('❌ Erreur GET /api/categories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTES D'AUTHENTIFICATION
// ================================================================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];

    // En production, utilisez bcrypt.compare()
    // const isValid = await bcrypt.compare(password, user.password_hash);
    const isValid = true; // Pour les tests

    if (!isValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Mettre à jour last_login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Créer le token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' } // 7 jours au lieu de 24h pour éviter les déconnexions fréquentes
    );

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
// ROUTES COMMANDES (Client)
// ================================================================

// Créer une commande (Client authentifié ou invité)
app.post('/api/orders', authenticateOptional, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 CRÉATION DE COMMANDE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 User ID:', req.user.id);
    console.log('👤 Role:', req.user.role);
    console.log('👤 Email:', req.user.email);
    console.log('👤 Is Guest:', req.user.isGuest || false);
    console.log('👤 Guest Name:', req.user.guestName || 'N/A');
    console.log('📦 Body complet:', JSON.stringify(req.body, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const { orderType, items, promoCode, paymentMethod, notes, tableNumber } = req.body;
    
    // Validation des données
    console.log('🔍 Validation...');
    console.log('   - orderType:', orderType);
    console.log('   - items:', items);
    console.log('   - items.length:', items?.length);
    console.log('   - paymentMethod:', paymentMethod);
    
    if (!items || items.length === 0) {
      console.error('❌ VALIDATION ÉCHOUÉE: Panier vide');
      throw new Error('Le panier est vide');
    }
    
    if (!orderType) {
      console.error('❌ VALIDATION ÉCHOUÉE: Type de commande manquant');
      throw new Error('Type de commande manquant');
    }
    
    // Validation du type de commande (doit correspondre à l'ENUM MySQL)
    const validOrderTypes = ['dine-in', 'takeaway', 'delivery'];
    if (!validOrderTypes.includes(orderType)) {
      console.error('❌ VALIDATION ÉCHOUÉE: Type de commande invalide:', orderType);
      throw new Error(`Type de commande invalide. Valeurs acceptées: ${validOrderTypes.join(', ')}`);
    }
    
    // Validation de la méthode de paiement (doit correspondre à l'ENUM MySQL)
    const validPaymentMethods = ['cash', 'card', 'stripe', 'paypal'];
    const finalPaymentMethod = paymentMethod || 'cash';
    if (!validPaymentMethods.includes(finalPaymentMethod)) {
      console.error('❌ VALIDATION ÉCHOUÉE: Méthode de paiement invalide:', finalPaymentMethod);
      throw new Error(`Méthode de paiement invalide. Valeurs acceptées: ${validPaymentMethods.join(', ')}`);
    }
    
    console.log('✅ Validation réussie');

    // Générer un numéro de commande unique au format CMD-XXXX
    // IMPORTANT: Utiliser UNIQUEMENT la fonction generateOrderNumber()
    // NE JAMAIS utiliser l'ancien format ORD-YYYY-XXXXXXXXXX
    console.log('🔢 Appel de generateOrderNumber()...');
    const orderNumber = await generateOrderNumber(connection);
    
    // Vérification stricte du format
    if (!orderNumber || !orderNumber.match(/^CMD-\d{4}$/)) {
      console.error('❌❌❌ ERREUR CRITIQUE: Format de numéro invalide généré!');
      console.error('   Numéro reçu:', orderNumber);
      console.error('   Type:', typeof orderNumber);
      throw new Error(`Format de numéro de commande invalide. Attendu: CMD-XXXX, Reçu: ${orderNumber}`);
    }
    
    console.log('✅✅✅ Numéro de commande validé:', orderNumber);

    // Calculer le sous-total
    let subtotal = 0;
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT price FROM products WHERE id = ?',
        [item.productId || item.id]
      );
      if (products.length > 0) {
        subtotal += parseFloat(products[0].price) * parseInt(item.quantity);
      }
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
        [promoCode.toUpperCase(), subtotal]
      );

      if (promoCodes.length > 0) {
        const promo = promoCodes[0];
        promoCodeId = promo.id;

        if (promo.discount_type === 'percentage') {
          discountAmount = (subtotal * parseFloat(promo.discount_value)) / 100;
        } else {
          discountAmount = parseFloat(promo.discount_value);
        }
      }
    }

    const taxAmount = (subtotal - discountAmount) * 0.10; // 10% TVA
    const totalAmount = subtotal - discountAmount + taxAmount;

    // Déterminer le statut de paiement selon la méthode
    const paymentStatus = (finalPaymentMethod === 'cash') ? 'pending' : 'completed';
    
    // Protection finale : Vérifier que le numéro n'est PAS au format ORD-
    // CETTE PROTECTION EST CRITIQUE - NE JAMAIS SUPPRIMER
    if (!orderNumber || orderNumber.startsWith('ORD-') || !orderNumber.match(/^CMD-\d{4}$/)) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌❌❌ ERREUR CRITIQUE: Format de numéro invalide!');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('   Numéro reçu:', orderNumber);
      console.error('   Type:', typeof orderNumber);
      console.error('   Format attendu: CMD-XXXX (ex: CMD-0014)');
      console.error('   Format reçu:', orderNumber?.startsWith('ORD-') ? 'ORD-YYYY-... (OBSOLÈTE)' : 'Format invalide');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await connection.rollback();
      throw new Error(`Format de numéro de commande invalide. Attendu: CMD-XXXX, Reçu: ${orderNumber}. L'ancien format ORD- est obsolète. Le serveur doit être redémarré avec le nouveau code.`);
    }

    // ⚠️ LOG AVANT INSERTION MYSQL
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 INSERTION DANS MYSQL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 order_type     :', orderType, `(type: ${typeof orderType})`);
    console.log('📌 payment_method :', finalPaymentMethod, `(type: ${typeof finalPaymentMethod})`);
    console.log('📌 payment_status :', paymentStatus);
    console.log('📌 order_number   :', orderNumber, '(format: CMD-XXXX ✅)');
    console.log('📌 user_id        :', req.user.id);
    console.log('📌 table_number   :', tableNumber);
    console.log('📌 subtotal       :', subtotal);
    console.log('📌 total_amount   :', totalAmount);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Protection ULTIME : Vérifier une dernière fois avant insertion SQL
    // Cette vérification est critique car elle empêche l'insertion de formats invalides
    if (!orderNumber || !orderNumber.match(/^CMD-\d{4}$/)) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('🚨🚨🚨 PROTECTION ULTIME ACTIVÉE 🚨🚨🚨');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ BLOCAGE avant insertion SQL');
      console.error('   Numéro reçu:', orderNumber);
      console.error('   Format attendu: CMD-XXXX');
      console.error('   ⚠️ Le serveur backend doit être redémarré avec le nouveau code!');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await connection.rollback();
      throw new Error(`BLOCAGE: Format de numéro invalide détecté avant insertion. Le serveur backend doit être redémarré. Format reçu: ${orderNumber}`);
    }

    // Créer la commande
    console.log('💾 Insertion dans MySQL avec order_number:', orderNumber);
    console.log('✅ Format validé avant insertion: CMD-XXXX');
    
    const [orderResult] = await connection.query(
      `INSERT INTO orders (
        user_id, order_number, order_type, status, 
        subtotal, discount_amount, tax_amount, total_amount,
        promo_code_id, payment_method, payment_status, notes, table_number
      ) VALUES (?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      // Note: user_id peut être NULL pour les invités
      [
        req.user.isGuest ? null : req.user.id, // NULL pour les invités
        orderNumber, orderType,
        subtotal, discountAmount, taxAmount, totalAmount,
        promoCodeId, finalPaymentMethod, paymentStatus, notes, tableNumber
      ]
    );
    
    // Vérification POST-INSERTION : S'assurer que le numéro inséré est correct
    const [verifyInsert] = await connection.query(
      'SELECT order_number FROM orders WHERE id = ?',
      [orderResult.insertId]
    );
    
    if (verifyInsert.length > 0 && !verifyInsert[0].order_number.match(/^CMD-\d{4}$/)) {
      console.error('❌❌❌ ERREUR POST-INSERTION: Le numéro inséré ne correspond pas au format!');
      console.error('   Numéro dans la base:', verifyInsert[0].order_number);
      await connection.rollback();
      throw new Error(`Erreur: Le numéro inséré (${verifyInsert[0].order_number}) ne correspond pas au format CMD-XXXX`);
    }
    
    console.log('✅ Vérification post-insertion réussie:', verifyInsert[0].order_number);

    const orderId = orderResult.insertId;

    // Ajouter les items
    for (const item of items) {
      const [products] = await connection.query(
        'SELECT name, price FROM products WHERE id = ?',
        [item.productId || item.id]
      );

      if (products.length > 0) {
        const product = products[0];
        const itemSubtotal = parseFloat(product.price) * parseInt(item.quantity);

        await connection.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, quantity, unit_price, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.productId || item.id, product.name, item.quantity, product.price, itemSubtotal]
        );
      }
    }

    await connection.commit();

    console.log('✅✅✅ COMMANDE CRÉÉE AVEC SUCCÈS ! ✅✅✅');
    console.log('   - Order ID:', orderId);
    console.log('   - Order Number:', orderNumber);
    console.log('   - Total Amount:', totalAmount);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Récupérer la commande complète pour l'événement WebSocket
    try {
      const [newOrder] = await connection.query(`
        SELECT 
          o.*,
          COALESCE(u.first_name, '') as first_name, 
          COALESCE(u.last_name, 'Invité') as last_name, 
          COALESCE(u.email, '') as email,
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
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);
      
      // Émettre l'événement WebSocket pour mise à jour en temps réel
      if (newOrder.length > 0) {
        emitOrderUpdate('order:created', newOrder[0]);
        emitOrderUpdate('orders:refresh', {});
        console.log('📡 Événement WebSocket émis: order:created');
      }
    } catch (wsError) {
      console.error('⚠️ Erreur lors de l\'émission WebSocket (non bloquant):', wsError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: {
        id: orderId,
        orderId,
        orderNumber,
        totalAmount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERREUR CRÉATION COMMANDE');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Type:', error.name);
    console.error('Message:', error.message);
    console.error('Code SQL:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('SQL Message:', error.sqlMessage);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Message d'erreur détaillé basé sur le type d'erreur
    let errorMessage = error.message || 'Erreur lors de la création de la commande';
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = 'Produit ou utilisateur introuvable dans la base de données';
    } else if (error.code === 'ER_BAD_NULL_ERROR') {
      errorMessage = 'Données manquantes (vérifiez les champs requis)';
    } else if (error.code === 'ER_DUP_ENTRY') {
      errorMessage = 'Numéro de commande en double (erreur système)';
    } else if (error.code === 'ER_TRUNCATED_WRONG_VALUE' || error.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Valeur invalide pour un champ (vérifiez order_type, payment_method)';
    } else if (error.sqlMessage) {
      errorMessage = `Erreur SQL: ${error.sqlMessage}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.error('📤 Message d\'erreur envoyé au frontend:', errorMessage);
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: error.message,
      sqlCode: error.code,
      sqlState: error.sqlState
    });
  } finally {
    if (connection) {
    connection.release();
      console.log('🔌 Connexion MySQL libérée');
    }
  }
});

// ================================================================
// ROUTE: Mettre à jour le profil utilisateur
// ================================================================
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone, email } = req.body;
    
    console.log('📝 Mise à jour profil utilisateur:', userId);
    console.log('   Données:', { first_name, last_name, phone, email });
    
    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    if (email) {
      const [existingUsers] = await pool.query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId]
      );
      
      if (existingUsers.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cet email est déjà utilisé par un autre compte'
        });
      }
    }
    
    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];
    
    if (first_name !== undefined) {
      updates.push('first_name = ?');
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updates.push('last_name = ?');
      values.push(last_name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune donnée à mettre à jour'
      });
    }
    
    values.push(userId);
    
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Récupérer les données mises à jour
    const [users] = await pool.query(
      'SELECT id, email, first_name, last_name, phone, role, loyalty_points, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur introuvable'
      });
    }
    
    const updatedUser = users[0];
    
    console.log('✅ Profil mis à jour avec succès');
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        points: updatedUser.loyalty_points,
        createdAt: updatedUser.created_at
      }
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour du profil'
    });
  }
});

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

// ================================================================
// ADMIN - GESTION DES UTILISATEURS
// ================================================================

// Liste tous les utilisateurs
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT id, email, first_name, last_name, phone, role, 
             loyalty_points, is_active, email_verified, 
             created_at, last_login
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un utilisateur
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;

    // Vérifier si l'email existe
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [email, passwordHash, firstName, lastName, phone, role || 'client']
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un utilisateur
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, role, loyaltyPoints, isActive } = req.body;

    await pool.query(
      `UPDATE users SET 
        email = ?,
        first_name = ?,
        last_name = ?,
        phone = ?,
        role = ?,
        loyalty_points = ?,
        is_active = ?
       WHERE id = ?`,
      [email, firstName, lastName, phone, role, loyaltyPoints, isActive, id]
    );

    res.json({ success: true, message: 'Utilisateur modifié' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Ne pas permettre de se supprimer soi-même
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous supprimer vous-même' });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES CATÉGORIES
// ================================================================

// Liste toutes les catégories
app.get('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY display_order');
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une catégorie
app.post('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, slug, description, icon, displayOrder } = req.body;

    const [result] = await pool.query(
      `INSERT INTO categories (name, slug, description, icon, display_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, slug, description, icon, displayOrder || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Catégorie créée',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier une catégorie
app.put('/api/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, displayOrder, isActive } = req.body;

    await pool.query(
      `UPDATE categories SET 
        name = ?,
        slug = ?,
        description = ?,
        icon = ?,
        display_order = ?,
        is_active = ?
       WHERE id = ?`,
      [name, slug, description, icon, displayOrder, isActive, id]
    );

    res.json({ success: true, message: 'Catégorie modifiée' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une catégorie
app.delete('/api/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si des produits utilisent cette catégorie
    const [products] = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
      [id]
    );

    if (products[0].count > 0) {
      return res.status(400).json({
        error: `Impossible de supprimer. ${products[0].count} produit(s) utilisent cette catégorie.`
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES PRODUITS
// ================================================================

// Liste tous les produits
app.get('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un produit
app.post('/api/admin/products', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      categoryId, name, slug, description, price, imageUrl,
      stock, isAvailable, isFeatured, calories, preparationTime, allergens
    } = req.body;

    // Convertir allergens en JSON si c'est un array, sinon utiliser une chaîne vide
    const allergensJson = Array.isArray(allergens) ? JSON.stringify(allergens) : (allergens || '');
    
    const [result] = await pool.query(
      `INSERT INTO products (
        category_id, name, slug, description, price, image_url,
        stock, is_available, is_featured, calories, preparation_time, allergens
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, name, slug, description, price, imageUrl, stock, isAvailable, isFeatured, calories, preparationTime, allergensJson]
    );

    res.status(201).json({
      success: true,
      message: 'Produit créé',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un produit
app.put('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      categoryId, name, slug, description, price, imageUrl,
      stock, isAvailable, isFeatured, calories, preparationTime, allergens
    } = req.body;

    console.log('📝 Modification produit ID:', id);
    console.log('   Données reçues:', { categoryId, name, price, stock, isAvailable, isFeatured });

    // Convertir allergens en JSON si c'est un array
    const allergensJson = Array.isArray(allergens) ? JSON.stringify(allergens) : allergens;

    // Convertir les booléens explicitement
    const isAvailableValue = isAvailable ? 1 : 0;
    const isFeaturedValue = isFeatured ? 1 : 0;

    const params = [
      categoryId, 
      name, 
      slug, 
      description, 
      price, 
      imageUrl, 
      stock, 
      isAvailableValue, 
      isFeaturedValue, 
      calories, 
      preparationTime, 
      allergensJson, 
      id
    ];

    console.log('   Paramètres SQL:', params);

    const [result] = await pool.query(
      `UPDATE products SET 
        category_id = ?,
        name = ?,
        slug = ?,
        description = ?,
        price = ?,
        image_url = ?,
        stock = ?,
        is_available = ?,
        is_featured = ?,
        calories = ?,
        preparation_time = ?,
        allergens = ?
       WHERE id = ?`,
      params
    );

    console.log('✅ Produit modifié, lignes affectées:', result.affectedRows);

    res.json({ success: true, message: 'Produit modifié', affectedRows: result.affectedRows });
  } catch (error) {
    console.error('❌ Erreur modification produit:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Toggle disponibilité produit (Admin ET Manager)
app.put('/api/admin/products/:id/toggle', authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'état actuel
    const [products] = await pool.query('SELECT is_available FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const currentStatus = products[0].is_available;
    const newStatus = currentStatus ? 0 : 1;
    
    // Mettre à jour
    await pool.query('UPDATE products SET is_available = ? WHERE id = ?', [newStatus, id]);
    
    console.log(`🔄 Produit ${id} - Disponibilité changée: ${currentStatus ? 'Actif' : 'Inactif'} → ${newStatus ? 'Actif' : 'Inactif'}`);
    
    res.json({ 
      success: true, 
      message: newStatus ? 'Produit activé' : 'Produit désactivé',
      is_available: newStatus
    });
  } catch (error) {
    console.error('❌ Erreur toggle produit:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un produit (Admin uniquement)
app.delete('/api/admin/products/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete au lieu de suppression physique
    await pool.query('UPDATE products SET deleted_at = NOW() WHERE id = ?', [id]);
    
    console.log(`✅ Produit ${id} supprimé (soft delete)`);
    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES CODES PROMO
// ================================================================

// Liste tous les codes promo
app.get('/api/admin/promo-codes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [codes] = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
    res.json({ success: true, data: codes });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un code promo
app.post('/api/admin/promo-codes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxUses, validFrom, validUntil
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO promo_codes (
        code, description, discount_type, discount_value,
        min_order_amount, max_uses, valid_from, valid_until
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, description, discountType, discountValue, minOrderAmount, maxUses, validFrom, validUntil]
    );

    res.status(201).json({
      success: true,
      message: 'Code promo créé',
      promoCodeId: result.insertId
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un code promo
app.put('/api/admin/promo-codes/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code, description, discountType, discountValue,
      minOrderAmount, maxUses, validFrom, validUntil, isActive
    } = req.body;

    await pool.query(
      `UPDATE promo_codes SET 
        code = ?,
        description = ?,
        discount_type = ?,
        discount_value = ?,
        min_order_amount = ?,
        max_uses = ?,
        valid_from = ?,
        valid_until = ?,
        is_active = ?
       WHERE id = ?`,
      [code, description, discountType, discountValue, minOrderAmount, maxUses, validFrom, validUntil, isActive, id]
    );

    res.json({ success: true, message: 'Code promo modifié' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un code promo
app.delete('/api/admin/promo-codes/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM promo_codes WHERE id = ?', [id]);
    res.json({ success: true, message: 'Code promo supprimé' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES COMMANDES
// ================================================================

// Liste toutes les commandes
app.get('/api/admin/orders', authenticateToken, requireManager, async (req, res) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📦 GET /api/admin/orders - Début');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 Utilisateur:', req.user.id, 'Role:', req.user.role);
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    console.log('🔍 Exécution de la requête SQL...');
    
    // Requête optimisée avec JOINs au lieu de sous-requêtes corrélées
    // Performance améliorée : ~10x plus rapide
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        COALESCE(u.first_name, '') as first_name, 
        COALESCE(u.last_name, 'Invité') as last_name, 
        COALESCE(u.email, '') as email,
        COUNT(DISTINCT oi.id) as items_count,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', oi.id,
            'product_id', oi.product_id,
            'product_name', oi.product_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'subtotal', oi.subtotal,
            'image_url', p.image_url,
            'category_name', c.name,
            'category_type', CASE 
              WHEN LOWER(c.name) LIKE '%entrée%' OR LOWER(c.name) LIKE '%entree%' OR LOWER(c.name) LIKE '%starter%' THEN 'entree'
              WHEN LOWER(c.name) LIKE '%dessert%' OR LOWER(c.name) LIKE '%sweet%' THEN 'dessert'
              ELSE 'plat'
            END
          )
        ) AS items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN order_items oi ON oi.order_id = o.id
      LEFT JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    console.log('✅ Requête SQL réussie');
    console.log('📊 Nombre de commandes récupérées:', orders.length);
    
    if (orders.length > 0) {
      console.log('📋 Première commande:', {
        id: orders[0].id,
        order_number: orders[0].order_number,
        status: orders[0].status,
        client: `${orders[0].first_name} ${orders[0].last_name}`
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ GET /api/admin/orders - Succès');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌❌❌ ERREUR GET /api/admin/orders ❌❌❌');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('SQL State:', error.sqlState);
    console.error('Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors du chargement des commandes',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code,
      sqlState: error.sqlState
    });
  }
});

// Détails d'une commande (Admin ET Manager)
app.get('/api/admin/orders/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(`
      SELECT o.*, 
        COALESCE(u.first_name, '') as first_name, 
        COALESCE(u.last_name, 'Invité') as last_name, 
        COALESCE(u.email, '') as email, 
        COALESCE(u.phone, '') as phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const [items] = await pool.query(`
      SELECT * FROM order_items WHERE order_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        ...orders[0],
        items
      }
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier le statut d'une commande (Admin ET Manager)
app.put('/api/admin/orders/:id/status', authenticateToken, requireManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Récupérer l'ancien statut pour gérer les timestamps
    const [currentOrder] = await pool.query(
      'SELECT status, taken_at FROM orders WHERE id = ?',
      [id]
    );

    if (currentOrder.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const oldStatus = currentOrder[0].status;
    const newStatus = status;

    // Préparer la requête de mise à jour avec les timestamps
    let updateQuery = 'UPDATE orders SET status = ?';
    let updateParams = [newStatus];

    // Si on passe de "pending" à "preparing", enregistrer le temps de prise en charge
    if (oldStatus === 'pending' && newStatus === 'preparing') {
      updateQuery += ', taken_at = NOW()';
      console.log(`📌 Commande ${id}: Prise en charge - taken_at enregistré`);
    }

    // Si on passe de "preparing" à "served" ou "ready" à "served", enregistrer le temps de fin de préparation
    if ((oldStatus === 'preparing' || oldStatus === 'ready') && newStatus === 'served') {
      // Si taken_at n'est pas encore défini, le définir maintenant (cas où on passe directement de pending à served)
      if (!currentOrder[0].taken_at && oldStatus !== 'ready') {
        updateQuery += ', taken_at = NOW()';
        console.log(`📌 Commande ${id}: Prise en charge tardive - taken_at enregistré`);
      }
      updateQuery += ', prepared_at = NOW()';
      console.log(`📌 Commande ${id}: Préparation terminée - prepared_at enregistré`);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

    // Créer une notification pour le client
    const [order] = await pool.query('SELECT user_id FROM orders WHERE id = ?', [id]);
    
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, related_order_id)
       VALUES (?, ?, ?, 'order', ?)`,
      [
        order[0].user_id,
        'Statut de commande mis à jour',
        `Votre commande est maintenant: ${status}`,
        id
      ]
    );

    // Émettre l'événement WebSocket pour mise à jour en temps réel
    emitOrderUpdate('order:status_changed', { orderId: id, status: newStatus, oldStatus });
    emitOrderUpdate('orders:refresh', {});

    res.json({ success: true, message: 'Statut mis à jour' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - PARAMÈTRES
// ================================================================

// Liste tous les paramètres
app.get('/api/admin/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM app_settings ORDER BY setting_key');
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Erreur récupération settings:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un paramètre spécifique (route publique pour le frontend)
app.get('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const [settings] = await pool.query('SELECT * FROM app_settings WHERE setting_key = ?', [key]);
    
    if (settings.length === 0) {
      return res.status(404).json({ error: 'Paramètre non trouvé' });
    }
    
    const setting = settings[0];
    let value = setting.setting_value;
    
    // Convertir selon le type
    if (setting.setting_type === 'boolean') {
      value = value === 'true' || value === '1';
    } else if (setting.setting_type === 'number') {
      value = parseFloat(value);
    } else if (setting.setting_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        console.error('Erreur parse JSON:', e);
      }
    }
    
    res.json({ success: true, data: { key: setting.setting_key, value, type: setting.setting_type } });
  } catch (error) {
    console.error('Erreur récupération setting:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Modifier un paramètre (Admin only)
app.put('/api/admin/settings/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    console.log('🔧 PUT /api/admin/settings/:key');
    console.log('   Key:', key);
    console.log('   Value reçue:', value, '(type:', typeof value, ')');
    console.log('   String(value):', String(value));

    const [result] = await pool.query(
      'UPDATE app_settings SET setting_value = ? WHERE setting_key = ?',
      [String(value), key]
    );

    console.log('   Rows affected:', result.affectedRows);

    // Si la clé n'existe pas encore, l'insérer (UPSERT simplifié)
    if (result.affectedRows === 0) {
      console.log('   ⚠️ Clé inexistante, insertion...');
      await pool.query(
        'INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, String(value)]
      );
    }

    // Vérifier la nouvelle valeur
    const [rows] = await pool.query(
      'SELECT setting_value FROM app_settings WHERE setting_key = ?',
      [key]
    );
    
    console.log('   Nouvelle valeur en BDD:', rows[0]?.setting_value);
    console.log('   ✅ Paramètre modifié avec succès');

    res.json({ 
      success: true, 
      message: 'Paramètre modifié',
      newValue: rows[0]?.setting_value 
    });
  } catch (error) {
    console.error('❌ Erreur UPDATE setting:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// RESTAURANT INFO (via app_settings)
// ================================================================

// Helper: get setting by key
async function getSettingValue(pool, key) {
  const [rows] = await pool.query('SELECT setting_value FROM app_settings WHERE setting_key = ?', [key]);
  return rows[0]?.setting_value ?? null;
}

// Helper: upsert setting
async function upsertSetting(pool, key, value) {
  const [result] = await pool.query('UPDATE app_settings SET setting_value = ? WHERE setting_key = ?', [String(value), key]);
  if (result.affectedRows === 0) {
    await pool.query('INSERT INTO app_settings (setting_key, setting_value) VALUES (?, ?)', [key, String(value)]);
  }
}

// GET restaurant info agrégée
app.get('/api/restaurant-info', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM app_settings');
    const map = Object.fromEntries(rows.map(r => [r.setting_key, r.setting_value]));
    let openingHours = {};
    try { openingHours = map.opening_hours ? JSON.parse(map.opening_hours) : {}; } catch { openingHours = {}; }
    res.json({
      success: true,
      data: {
        opening_hours: openingHours,
        address: {
          street: map.address_street || map.restaurant_address || '',
          city: map.address_city || '',
          postal: map.address_postal || '',
          country: map.address_country || 'France'
        },
        contact: {
          phone_main: map.phone_main || map.contact_phone || '',
          phone_mobile: map.phone_mobile || '',
          email_contact: map.email_contact || map.contact_email || '',
          email_reservation: map.email_reservation || ''
        }
      }
    });
  } catch (error) {
    console.error('❌ GET /api/restaurant-info:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT horaires
app.put('/api/restaurant-info/hours', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { hours } = req.body;
    if (!hours || typeof hours !== 'object') {
      return res.status(400).json({ success: false, error: 'Paramètre "hours" invalide' });
    }
    await upsertSetting(pool, 'opening_hours', JSON.stringify(hours));
    res.json({ success: true, message: 'Horaires mis à jour' });
  } catch (error) {
    console.error('❌ PUT /api/restaurant-info/hours:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT adresse
app.put('/api/restaurant-info/address', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { street = '', city = '', postal = '', country = 'France' } = req.body || {};
    await Promise.all([
      upsertSetting(pool, 'address_street', street),
      upsertSetting(pool, 'address_city', city),
      upsertSetting(pool, 'address_postal', postal),
      upsertSetting(pool, 'address_country', country),
      upsertSetting(pool, 'restaurant_address', [street, postal, city].filter(Boolean).join(' '))
    ]);
    res.json({ success: true, message: 'Adresse mise à jour' });
  } catch (error) {
    console.error('❌ PUT /api/restaurant-info/address:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT contact
app.put('/api/restaurant-info/contact', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { phone_main = '', phone_mobile = '', email_contact = '', email_reservation = '' } = req.body || {};
    await Promise.all([
      upsertSetting(pool, 'phone_main', phone_main),
      upsertSetting(pool, 'phone_mobile', phone_mobile),
      upsertSetting(pool, 'email_contact', email_contact),
      upsertSetting(pool, 'email_reservation', email_reservation),
      upsertSetting(pool, 'contact_phone', phone_main),
      upsertSetting(pool, 'contact_email', email_contact)
    ]);
    res.json({ success: true, message: 'Contacts mis à jour' });
  } catch (error) {
    console.error('❌ PUT /api/restaurant-info/contact:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - STATISTIQUES
// ================================================================

app.get('/api/admin/dashboard', authenticateToken, requireManager, async (req, res) => {
  try {
    console.log('📊 GET /api/admin/dashboard - Statistiques complètes');
    
    const [stats] = await pool.query(`
      SELECT 
        -- Clients
        (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
        (SELECT COUNT(DISTINCT user_id) FROM orders) as active_clients,
        
        -- Produits
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM products WHERE is_available = 1) as active_products,
        (SELECT COUNT(*) FROM products WHERE is_available = 0) as inactive_products,
        
        -- Commandes - Totales
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE()) as orders_today,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as orders_yesterday,
        
        -- Commandes par statut
        (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'preparing') as preparing_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'ready') as ready_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'served') as served_orders,
        (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') as cancelled_orders,
        
        -- Revenus - Tous statuts (sauf annulées)
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status != 'cancelled') as total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') as revenue_today,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status != 'cancelled') as revenue_yesterday,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status != 'cancelled') as revenue_7days,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND status != 'cancelled') as revenue_30days,
        
        -- Ticket moyen
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status != 'cancelled') as average_order_value,
        (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') as average_order_value_today,
        
        -- Articles
        (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status != 'cancelled') as total_items_sold,
        (SELECT COALESCE(AVG(items_count), 0) FROM (SELECT COUNT(oi.id) as items_count FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.status != 'cancelled' GROUP BY o.id) as subq) as average_items_per_order
    `);
    
    console.log('✅ Statistiques dashboard calculées:', stats[0]);
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('❌ Erreur dashboard:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - ANALYTICS AVANCÉS
// ================================================================

// Statistiques de ventes par période
app.get('/api/admin/analytics/sales', authenticateToken, requireManager, async (req, res) => {
  try {
    const { period = '7days' } = req.query;
    
    console.log('📈 GET /api/admin/analytics/sales - Période:', period);
    
    let dateCondition = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    let intervalDays = 7;
    
    if (period === '30days') {
      dateCondition = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      intervalDays = 30;
    } else if (period === '90days') {
      dateCondition = 'DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)';
      intervalDays = 90;
    } else if (period === 'today') {
      dateCondition = 'DATE(created_at) = CURDATE()';
      intervalDays = 1;
    }
    
    const [sales] = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(AVG(total_amount), 0) as average_order,
        COUNT(DISTINCT user_id) as unique_customers
      FROM orders
      WHERE ${dateCondition} AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    console.log(`✅ ${sales.length} jours de données retournés`);
    res.json({ success: true, data: sales });
  } catch (error) {
    console.error('❌ Erreur analytics/sales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Top produits vendus
app.get('/api/admin/analytics/top-products', authenticateToken, requireManager, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    console.log('🏆 GET /api/admin/analytics/top-products - Limit:', limit);
    
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.name as product_name,
        p.price,
        p.image_url,
        p.category_id,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as total_quantity,
        COALESCE(COUNT(DISTINCT oi.order_id), 0) as order_count,
        COALESCE(SUM(oi.subtotal), 0) as total_revenue
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY p.id, p.name, p.price, p.image_url, p.category_id, c.name
      HAVING total_quantity > 0
      ORDER BY total_quantity DESC, total_revenue DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    console.log(`✅ ${products.length} produits top retournés`);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('❌ Erreur top-products:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Revenus par catégorie
app.get('/api/admin/analytics/revenue-by-category', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [revenues] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(oi.subtotal), 0) as revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'completed'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `);
    
    res.json({ success: true, data: revenues });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTE: Statistiques CA avec comparaison de périodes (DONNÉES RÉELLES)
// ================================================================
app.get('/api/admin/analytics/revenue-comparison', authenticateToken, requireManager, async (req, res) => {
  try {
    const { startDate, endDate, compareStartDate, compareEndDate } = req.query;
    
    console.log('📊 GET /api/admin/analytics/revenue-comparison');
    console.log('   Période actuelle:', startDate, '→', endDate);
    console.log('   Période comparaison:', compareStartDate, '→', compareEndDate);
    
    // Statistiques période actuelle (TOUTES les commandes sauf annulées)
    const [currentStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM orders o
      WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        AND o.status != 'cancelled'
    `, [startDate, endDate]);
    
    // Statistiques période précédente (TOUTES les commandes sauf annulées)
    const [previousStats] = await pool.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM orders o
      WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        AND o.status != 'cancelled'
    `, [compareStartDate, compareEndDate]);
    
    // Vérifier si c'est une seule journée pour affichage heure par heure
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isSingleDay = start.toDateString() === end.toDateString();
    
    console.log('   Mode:', isSingleDay ? 'HEURE PAR HEURE' : 'JOUR PAR JOUR');
    
    let dailyStats;
    
    if (isSingleDay) {
      // Une seule journée : détails HEURE PAR HEURE
      [dailyStats] = await pool.query(`
        SELECT 
          HOUR(o.created_at) as hour,
          DATE(o.created_at) as date,
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(o.total_amount), 0) as total_revenue
        FROM orders o
        WHERE DATE(o.created_at) = ?
          AND o.status != 'cancelled'
        GROUP BY HOUR(o.created_at), DATE(o.created_at)
        ORDER BY hour ASC
      `, [startDate]);
    } else {
      // Plusieurs jours : détails JOUR PAR JOUR
      [dailyStats] = await pool.query(`
      SELECT 
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_revenue
      FROM orders o
      WHERE o.created_at >= ? AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
        AND o.status != 'cancelled'
      GROUP BY DATE(o.created_at)
      ORDER BY date ASC
    `, [startDate, endDate]);
    }
    
    const current = currentStats[0];
    const previous = previousStats[0];
    
    // Calcul des variations réelles
    const revenueCurrent = parseFloat(current.total_revenue) || 0;
    const revenuePrevious = parseFloat(previous.total_revenue) || 0;
    const ordersCurrent = parseInt(current.total_orders) || 0;
    const ordersPrevious = parseInt(previous.total_orders) || 0;
    
    const revenueGrowth = revenuePrevious > 0 
      ? ((revenueCurrent - revenuePrevious) / revenuePrevious) * 100 
      : 0;
    
    const ordersGrowth = ordersPrevious > 0 
      ? ((ordersCurrent - ordersPrevious) / ordersPrevious) * 100 
      : 0;
    
    const avgOrderCurrent = ordersCurrent > 0 ? revenueCurrent / ordersCurrent : 0;
    const avgOrderPrevious = ordersPrevious > 0 ? revenuePrevious / ordersPrevious : 0;
    const avgOrderGrowth = avgOrderPrevious > 0 
      ? ((avgOrderCurrent - avgOrderPrevious) / avgOrderPrevious) * 100 
      : 0;
    
    // Calcul TVA (10%)
    const totalHT = revenueCurrent / 1.1;
    const totalTVA = revenueCurrent - totalHT;
    
    console.log('✅ Statistiques calculées:');
    console.log('   CA actuel:', revenueCurrent.toFixed(2), '€');
    console.log('   CA précédent:', revenuePrevious.toFixed(2), '€');
    console.log('   Croissance CA:', revenueGrowth.toFixed(2), '%');
    console.log('   Croissance commandes:', ordersGrowth.toFixed(2), '%');
    console.log('   Croissance panier moyen:', avgOrderGrowth.toFixed(2), '%');
    
    res.json({
      success: true,
      data: {
        current: {
          totalRevenue: revenueCurrent,
          totalOrders: ordersCurrent,
          avgOrder: avgOrderCurrent,
          totalHT: totalHT,
          totalTVA: totalTVA
        },
        previous: {
          totalRevenue: revenuePrevious,
          totalOrders: ordersPrevious,
          avgOrder: avgOrderPrevious
        },
        growth: {
          revenue: revenueGrowth,
          orders: ordersGrowth,
          avgOrder: avgOrderGrowth
        },
        details: dailyStats
      }
    });
  } catch (error) {
    console.error('❌ Erreur revenue-comparison:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur',
      details: error.message 
    });
  }
});

// Commandes du jour (Manager)
app.get('/api/manager/today-orders', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const [orders] = await pool.query(`
      SELECT 
        o.*,
        u.first_name, u.last_name, u.email, u.phone,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE DATE(o.created_at) = CURDATE()
      ORDER BY o.created_at DESC
    `);
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques du jour (Manager)
app.get('/api/manager/today-stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue,
        COALESCE(AVG(CASE WHEN payment_status = 'completed' THEN total_amount ELSE NULL END), 0) as avg_order,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing,
        SUM(CASE WHEN status = 'ready' THEN 1 ELSE 0 END) as ready,
        SUM(CASE WHEN status = 'served' THEN 1 ELSE 0 END) as served
      FROM orders
      WHERE DATE(created_at) = CURDATE()
    `);
    
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - GESTION DES IMAGES PRODUITS
// ================================================================

// Upload d'une image produit
app.post('/api/admin/products/upload-image', authenticateToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    const imageUrl = `/uploads/products/${req.file.filename}`;
    
    console.log('📸 Image uploadée:', imageUrl);
    
    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      imageUrl: imageUrl
    });
  } catch (error) {
    console.error('❌ Erreur upload image:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'upload' });
  }
});

// Supprimer une image produit
app.delete('/api/admin/products/:id/image', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'image actuelle
    const [products] = await pool.query('SELECT image_url FROM products WHERE id = ?', [id]);
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const imageUrl = products[0].image_url;
    
    // Supprimer le fichier si il existe
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, '../public', imageUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log('🗑️ Image supprimée:', imagePath);
      }
    }
    
    // Mettre à jour la BDD
    await pool.query('UPDATE products SET image_url = NULL WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Image supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression image:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ADMIN - STATISTIQUES REVENUS DÉTAILLÉES
// ================================================================

// Statistiques de revenus avec calculs HT/TVA/TTC
app.get('/api/stats/revenue', authenticateToken, requireManager, async (req, res) => {
  try {
    const { start, end, period = 'daily' } = req.query;
    
    console.log('💰 GET /api/stats/revenue - Période:', start, 'à', end);
    
    if (!start || !end) {
      return res.status(400).json({ error: 'Dates de début et fin requises' });
    }
    
    // Validation des dates
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Format de date invalide' });
    }
    
    if (startDate > endDate) {
      return res.status(400).json({ error: 'La date de début doit être antérieure à la date de fin' });
    }
    
    // Calculer le CA avec HT/TVA/TTC
    const [revenueStats] = await pool.query(`
      SELECT 
        DATE(created_at) AS date,
        COUNT(*) AS orders_count,
        SUM(total_amount) AS total_ttc,
        SUM(total_amount / 1.20) AS total_ht,
        SUM(total_amount - (total_amount / 1.20)) AS total_tva,
        AVG(total_amount) AS average_basket,
        COUNT(DISTINCT user_id) AS unique_customers
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ? 
        AND status != 'cancelled'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `, [start, end]);
    
    // Calculer les totaux pour la période
    const [totals] = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_ttc,
        SUM(total_amount / 1.20) AS total_ht,
        SUM(total_amount - (total_amount / 1.20)) AS total_tva,
        AVG(total_amount) AS average_basket,
        COUNT(DISTINCT user_id) AS total_customers
      FROM orders
      WHERE DATE(created_at) BETWEEN ? AND ? 
        AND status != 'cancelled'
    `, [start, end]);
    
    // Statistiques par période (jour/semaine/mois)
    let periodStats = [];
    
    if (period === 'weekly') {
      const [weeklyStats] = await pool.query(`
        SELECT 
          YEARWEEK(created_at) AS period,
          DATE(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY)) AS week_start,
          COUNT(*) AS orders_count,
          SUM(total_amount) AS total_ttc,
          SUM(total_amount / 1.20) AS total_ht,
          SUM(total_amount - (total_amount / 1.20)) AS total_tva,
          AVG(total_amount) AS average_basket
        FROM orders
        WHERE DATE(created_at) BETWEEN ? AND ? 
          AND status != 'cancelled'
        GROUP BY YEARWEEK(created_at)
        ORDER BY period ASC
      `, [start, end]);
      periodStats = weeklyStats;
    } else if (period === 'monthly') {
      const [monthlyStats] = await pool.query(`
        SELECT 
          YEAR(created_at) AS year,
          MONTH(created_at) AS month,
          CONCAT(YEAR(created_at), '-', LPAD(MONTH(created_at), 2, '0')) AS period,
          COUNT(*) AS orders_count,
          SUM(total_amount) AS total_ttc,
          SUM(total_amount / 1.20) AS total_ht,
          SUM(total_amount - (total_amount / 1.20)) AS total_tva,
          AVG(total_amount) AS average_basket
        FROM orders
        WHERE DATE(created_at) BETWEEN ? AND ? 
          AND status != 'cancelled'
        GROUP BY YEAR(created_at), MONTH(created_at)
        ORDER BY year ASC, month ASC
      `, [start, end]);
      periodStats = monthlyStats;
    } else {
      periodStats = revenueStats;
    }
    
    console.log(`✅ ${revenueStats.length} jours de statistiques retournés`);
    console.log('💰 Totaux période:', totals[0]);
    
    res.json({ 
      success: true, 
      data: {
        daily: revenueStats,
        period: periodStats,
        totals: totals[0],
        period_type: period,
        date_range: { start, end }
      }
    });
  } catch (error) {
    console.error('❌ Erreur stats/revenue:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques rapides (aujourd'hui, semaine, mois)
app.get('/api/stats/revenue/quick', authenticateToken, requireManager, async (req, res) => {
  try {
    console.log('⚡ GET /api/stats/revenue/quick - Statistiques rapides');
    
    const [quickStats] = await pool.query(`
      SELECT 
        -- Aujourd'hui
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') AS today_revenue,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = CURDATE() AND status != 'cancelled') AS today_orders,
        
        -- Cette semaine
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE()) AND status != 'cancelled') AS week_revenue,
        (SELECT COUNT(*) FROM orders WHERE YEARWEEK(created_at) = YEARWEEK(CURDATE()) AND status != 'cancelled') AS week_orders,
        
        -- Ce mois
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND status != 'cancelled') AS month_revenue,
        (SELECT COUNT(*) FROM orders WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE()) AND status != 'cancelled') AS month_orders,
        
        -- Hier (pour comparaison)
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status != 'cancelled') AS yesterday_revenue,
        (SELECT COUNT(*) FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND status != 'cancelled') AS yesterday_orders
    `);
    
    const stats = quickStats[0];
    
    // Calculer les variations
    const todayVariation = stats.yesterday_revenue > 0 
      ? ((stats.today_revenue - stats.yesterday_revenue) / stats.yesterday_revenue) * 100 
      : 0;
    
    console.log('⚡ Statistiques rapides calculées:', stats);
    
    res.json({ 
      success: true, 
      data: {
        today: {
          revenue: parseFloat(stats.today_revenue) || 0,
          orders: parseInt(stats.today_orders) || 0,
          variation: todayVariation
        },
        week: {
          revenue: parseFloat(stats.week_revenue) || 0,
          orders: parseInt(stats.week_orders) || 0
        },
        month: {
          revenue: parseFloat(stats.month_revenue) || 0,
          orders: parseInt(stats.month_orders) || 0
        },
        yesterday: {
          revenue: parseFloat(stats.yesterday_revenue) || 0,
          orders: parseInt(stats.yesterday_orders) || 0
        }
      }
    });
  } catch (error) {
    console.error('❌ Erreur stats/revenue/quick:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// DASHBOARD CA - ROUTES AMÉLIORÉES
// ================================================================

// 1. Produits les plus vendus
app.get('/api/dashboard/top-products', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 8 } = req.query;
    
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.category_id,
        c.name as category_name,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.total_price) AS revenue_ht,
        SUM(oi.total_price * (1 + p.tva_rate / 100)) AS revenue_ttc,
        COUNT(DISTINCT oi.order_id) AS nb_orders
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ?
    `, [startDate, endDate, parseInt(limit)]);
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('❌ Erreur top produits:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 2. Heures de pointe
app.get('/api/dashboard/peak-hours', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const [hours] = await pool.query(`
      SELECT 
        HOUR(created_at) AS hour,
        COUNT(*) AS nb_orders,
        SUM(total_amount) AS revenue,
        AVG(total_amount) AS avg_order
      FROM orders
      WHERE created_at BETWEEN ? AND ?
        AND status != 'cancelled'
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `, [startDate, endDate]);
    
    res.json({ success: true, data: hours });
  } catch (error) {
    console.error('❌ Erreur heures de pointe:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 3. Répartition par catégories
app.get('/api/dashboard/category-distribution', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const [categories] = await pool.query(`
      SELECT 
        c.id,
        c.name AS category,
        c.icon,
        COUNT(DISTINCT oi.order_id) AS nb_orders,
        SUM(oi.quantity) AS total_items,
        SUM(oi.total_price) AS revenue_ht,
        SUM(oi.total_price * (1 + p.tva_rate / 100)) AS revenue_ttc
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY revenue_ttc DESC
    `, [startDate, endDate]);
    
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('❌ Erreur répartition catégories:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 4. Alertes stock
app.get('/api/dashboard/stock-alerts', authenticateToken, async (req, res) => {
  try {
    const [products] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.stock,
        p.category_id,
        c.name as category_name,
        CASE
          WHEN p.stock = 0 THEN 'critical'
          WHEN p.stock <= 5 THEN 'warning'
          WHEN p.stock <= 10 THEN 'low'
          ELSE 'ok'
        END as alert_level
      FROM products p
      JOIN categories c ON c.id = p.category_id
      WHERE p.stock <= 10
      ORDER BY p.stock ASC, p.name ASC
    `);
    
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('❌ Erreur alertes stock:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. Stats détaillées par jour ou par heure
app.get('/api/dashboard/daily-stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Vérifier si c'est une seule journée
    const start = new Date(startDate);
    const end = new Date(endDate);
    const isSingleDay = start.toDateString() === end.toDateString();
    
    console.log(`📊 Stats détaillées: ${startDate} à ${endDate} (${isSingleDay ? 'HEURE PAR HEURE' : 'JOUR PAR JOUR'})`);
    
    let stats;
    
    if (isSingleDay) {
      // Une seule journée : retourner les stats HEURE PAR HEURE
      [stats] = await pool.query(`
        SELECT 
          HOUR(created_at) AS hour,
          DATE(created_at) AS date,
          COUNT(*) AS nb_orders,
          SUM(total_amount) AS total_ttc,
          SUM(total_amount / 1.1) AS total_ht,
          SUM(total_amount - (total_amount / 1.1)) AS tva,
          AVG(total_amount) AS avg_order
        FROM orders
        WHERE DATE(created_at) = ?
          AND status != 'cancelled'
        GROUP BY HOUR(created_at), DATE(created_at)
        ORDER BY hour ASC
      `, [startDate]);
      
      console.log(`✅ ${stats.length} heures avec activité`);
    } else {
      // Plusieurs jours : retourner les stats JOUR PAR JOUR
      [stats] = await pool.query(`
        SELECT 
          DATE(created_at) AS date,
          COUNT(*) AS nb_orders,
          SUM(total_amount) AS total_ttc,
          SUM(total_amount / 1.1) AS total_ht,
          SUM(total_amount - (total_amount / 1.1)) AS tva,
          AVG(total_amount) AS avg_order
        FROM orders
        WHERE created_at BETWEEN ? AND ?
          AND status != 'cancelled'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `, [startDate, endDate]);
      
      console.log(`✅ ${stats.length} jours avec activité`);
    }
    
    res.json({ 
      success: true, 
      data: stats,
      isSingleDay: isSingleDay
    });
  } catch (error) {
    console.error('❌ Erreur stats quotidiennes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 6. Dashboard complet (toutes les données en une seule requête)
app.get('/api/dashboard/complete', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Stats globales
    const [globalStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_ttc,
        SUM(total_amount / 1.1) AS total_ht,
        SUM(total_amount - (total_amount / 1.1)) AS tva,
        AVG(total_amount) AS avg_order
      FROM orders
      WHERE created_at BETWEEN ? AND ?
        AND status != 'cancelled'
    `, [startDate, endDate]);
    
    res.json({ 
      success: true, 
      data: {
        stats: globalStats[0]
      }
    });
  } catch (error) {
    console.error('❌ Erreur dashboard complet:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ================================================================
// ROUTE HOME PAGE - DONNÉES DYNAMIQUES
// ================================================================

// Statistiques pour la page d'accueil
app.get('/api/home/stats', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    try {
      // 1. Total de commandes
      const [ordersCount] = await connection.query(
        'SELECT COUNT(*) as total FROM orders WHERE status != ?',
        ['cancelled']
      );
      
      // 2. Produits les plus populaires (top 10 pour le tableau)
      console.log('🔍 Récupération des top products...');
      
      // Récupérer TOUS les produits avec leurs stats de vente
      const [allProductsWithStats] = await connection.query(`
        SELECT 
          p.id, 
          p.name, 
          p.description, 
          p.price, 
          p.image_url,
          COALESCE(SUM(oi.quantity), 0) as total_sold,
          COUNT(DISTINCT oi.order_id) as order_count
        FROM products p
        LEFT JOIN order_items oi ON p.id = oi.product_id
        LEFT JOIN orders o ON oi.order_id = o.id AND o.status != 'cancelled'
        WHERE p.is_available = 1
        GROUP BY p.id, p.name, p.description, p.price, p.image_url
        ORDER BY total_sold DESC, p.created_at DESC
        LIMIT 10
      `);
      
      const topProducts = allProductsWithStats;
      
      console.log('📊 Top Products récupérés:', topProducts.length);
      topProducts.forEach((p, idx) => {
        console.log(`  ${idx + 1}. ${p.name}: ${p.total_sold} vendus, ${p.order_count} commandes`);
      });
      
      // 3. Codes promo actifs
      const [activePromos] = await connection.query(`
        SELECT code, discount_value, discount_type, description, valid_until
        FROM promo_codes
        WHERE is_active = 1 AND (valid_until IS NULL OR valid_until > NOW())
        ORDER BY discount_value DESC
        LIMIT 3
      `);
      
      // 4. Statistiques des événements (prochaines commandes programmées ou stats générales)
      const [upcomingOrders] = await connection.query(`
        SELECT COUNT(*) as pending_orders
        FROM orders
        WHERE status = 'pending'
      `);
      
      // 5. Heures de pointe (pour suggestions d'événements)
      const [peakHours] = await connection.query(`
        SELECT 
          HOUR(created_at) as hour,
          COUNT(*) as order_count
        FROM orders
        WHERE status != 'cancelled'
        GROUP BY HOUR(created_at)
        ORDER BY order_count DESC
        LIMIT 3
      `);
      
      console.log('📤 Envoi de la réponse avec', topProducts.length, 'produits');
      
      res.json({
        success: true,
        data: {
          totalOrders: ordersCount[0]?.total || 0,
          topProducts: topProducts.map(p => {
            const mapped = {
              id: p.id,
              name: p.name,
              description: p.description,
              price: parseFloat(p.price) || 0,
              image_url: p.image_url,
              orderCount: parseInt(p.order_count) || 0,
              totalSold: parseInt(p.total_sold) || 0
            };
            console.log(`  ✓ ${mapped.name}: ${mapped.totalSold} vendus`);
            return mapped;
          }),
          activePromos: activePromos.map(promo => ({
            code: promo.code,
            discount: parseInt(promo.discount_value),
            discountType: promo.discount_type,
            description: promo.description,
            validUntil: promo.valid_until
          })),
          pendingOrders: upcomingOrders[0]?.pending_orders || 0,
          peakHours: peakHours.map(h => ({
            hour: h.hour,
            orderCount: parseInt(h.order_count)
          }))
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Erreur stats home:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des statistiques' 
    });
  }
});

// ================================================================
// ROUTES ACTUALITÉS (NEWS)
// ================================================================

// Récupérer toutes les actualités (publique)
app.get('/api/home/news', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [news] = await connection.query(`
        SELECT id, title, description, date, image_url, icon, gradient, bg_pattern as bgPattern, \`order\`, is_active, is_new
        FROM news
        WHERE is_active = TRUE
        ORDER BY \`order\` ASC, created_at DESC
      `);
      
      res.json({
        success: true,
        data: news
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ Erreur récupération actualités:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des actualités'
    });
  }
});

// Créer une actualité (Admin/Manager)
app.post('/api/admin/news', authenticateToken, requireManager, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { title, description, date, image_url, icon, gradient, bgPattern, order, is_new } = req.body;
    
    if (!title) {
      return res.status(400).json({ success: false, error: 'Le titre est requis' });
    }
    
    const [result] = await connection.query(`
      INSERT INTO news (title, description, date, image_url, icon, gradient, bg_pattern, \`order\`, is_new)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [title, description || null, date || null, image_url || null, icon && icon !== '' ? icon : null, gradient && gradient !== '' ? gradient : 'from-emerald-400 via-teal-500 to-cyan-600', bgPattern || null, order || 0, is_new === true || is_new === 1 || is_new === 'true' ? true : false]);
    
    await connection.commit();
    
    res.status(201).json({
      success: true,
      message: 'Actualité créée avec succès',
      data: { id: result.insertId }
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erreur création actualité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de l\'actualité'
    });
  } finally {
    connection.release();
  }
});

// Mettre à jour une actualité (Admin/Manager)
app.put('/api/admin/news/:id', authenticateToken, requireManager, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    console.log('📝 PUT /api/admin/news/:id - Début');
    console.log('  - ID paramètre:', req.params.id);
    console.log('  - Body reçu:', JSON.stringify(req.body, null, 2));
    
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { title, description, date, image_url, icon, gradient, bgPattern, order, is_active, is_new } = req.body;
    
    // Vérifier que l'actualité existe
    const [existingNews] = await connection.query('SELECT id FROM news WHERE id = ?', [id]);
    if (existingNews.length === 0) {
      await connection.rollback();
      return res.status(404).json({ 
        success: false, 
        error: `Actualité avec l'ID ${id} non trouvée` 
      });
    }
    
    const updateFields = [];
    const values = [];
    
    if (title !== undefined) { updateFields.push('title = ?'); values.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); values.push(description); }
    if (date !== undefined) { updateFields.push('date = ?'); values.push(date !== null && date !== '' ? date : null); }
    if (image_url !== undefined) { updateFields.push('image_url = ?'); values.push(image_url !== null && image_url !== '' ? image_url : null); }
    if (icon !== undefined) { updateFields.push('icon = ?'); values.push(icon !== null && icon !== '' ? icon : null); }
    if (gradient !== undefined) { updateFields.push('gradient = ?'); values.push(gradient !== null && gradient !== '' ? gradient : null); }
    if (bgPattern !== undefined) { updateFields.push('bg_pattern = ?'); values.push(bgPattern !== null && bgPattern !== '' ? bgPattern : null); }
    if (order !== undefined) { updateFields.push('`order` = ?'); values.push(order); }
    if (is_active !== undefined) { updateFields.push('is_active = ?'); values.push(is_active); }
    if (req.body.is_new !== undefined) { 
      const isNewValue = req.body.is_new === true || req.body.is_new === 1 || req.body.is_new === 'true';
      updateFields.push('is_new = ?'); 
      values.push(isNewValue); 
    }
    
    if (updateFields.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: 'Aucune donnée à mettre à jour' });
    }
    
    values.push(id);
    
    console.log('📝 Requête SQL:', `UPDATE news SET ${updateFields.join(', ')} WHERE id = ?`);
    console.log('📝 Valeurs:', values);
    
    await connection.query(`
      UPDATE news
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, values);
    
    await connection.commit();
    
    console.log('✅ Actualité modifiée avec succès');
    
    res.json({
      success: true,
      message: 'Actualité modifiée avec succès'
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erreur modification actualité:', error);
    console.error('  - Message:', error.message);
    console.error('  - Code:', error.code);
    console.error('  - Stack:', error.stack);
    console.error('  - Données reçues:', req.body);
    console.error('  - ID:', req.params.id);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la modification de l\'actualité',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  } finally {
    connection.release();
  }
});

// Supprimer une actualité (Admin/Manager)
app.delete('/api/admin/news/:id', authenticateToken, requireManager, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    
    await connection.query('DELETE FROM news WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Actualité supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression actualité:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'actualité'
    });
  } finally {
    connection.release();
  }
});

// Test route pour vérifier que les routes news fonctionnent
app.get('/api/admin/news/test', authenticateToken, requireManager, (req, res) => {
  res.json({ success: true, message: 'Route news accessible' });
});

// Route upload-image déplacée juste avant app.listen() pour éviter les problèmes d'ordre

// ================================================================
// ROUTES INVENTAIRE
// ================================================================

// GET - Récupérer tous les articles d'inventaire (matières premières)
app.get('/api/inventory', authenticateToken, async (req, res) => {
  console.log('📦 GET /api/inventory - Récupération inventaire (matières premières)');
  try {
    const [inventory] = await pool.query(`
      SELECT 
        i.id,
        i.name,
        COALESCE(i.category_inventory, 'Autres') as category,
        i.quantity,
        i.price_per_unit as price,
        COALESCE(i.min_quantity, 0) as minQuantity,
        i.unit,
        i.supplier,
        i.description,
        i.created_at as dateAdded,
        CASE 
          WHEN i.quantity = 0 THEN 'out'
          WHEN i.quantity <= COALESCE(i.min_quantity, 0) THEN 'low'
          ELSE 'available'
        END as status
      FROM ingredients i
      WHERE i.deleted_at IS NULL
      ORDER BY i.name ASC
    `);
    
    console.log(`✅ ${inventory.length} matières premières récupérées`);
    res.json({ 
      success: true, 
      data: inventory 
    });
  } catch (error) {
    console.error('❌ Erreur récupération inventaire:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de l\'inventaire' 
    });
  }
});

// POST - Ajouter un ingrédient (matière première)
app.post('/api/inventory', authenticateToken, requireAdmin, async (req, res) => {
  console.log('📦 POST /api/inventory - Ajout ingrédient (matière première)');
  const { name, category, quantity, price, minQuantity, unit, supplier, description } = req.body;
  
  try {
    // Validation des données
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le nom et la catégorie sont obligatoires' 
      });
    }

    // Valider la catégorie d'inventaire
    const validInventoryCategories = ['Surgelé', 'Frais', 'Autres'];
    if (!validInventoryCategories.includes(category)) {
      console.error('❌ Catégorie d\'inventaire non valide:', category);
      return res.status(400).json({ 
        success: false, 
        error: `Catégorie "${category}" non valide. Catégories valides: ${validInventoryCategories.join(', ')}` 
      });
    }

    // Générer un slug unique à partir du nom
    let baseSlug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Retirer les accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Vérifier si le slug existe déjà dans ingredients
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await pool.query('SELECT id FROM ingredients WHERE slug = ?', [slug]);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    console.log('   Nom:', name);
    console.log('   Slug généré:', slug);
    console.log('   Catégorie inventaire:', category);
    console.log('   Unité:', unit || 'kg');
    
    // Calculer automatiquement le statut en fonction de la quantité
    const qty = quantity || 0;
    const isAvailable = qty > 0 ? 1 : 0;
    console.log('   Quantité:', qty, '→ Statut:', isAvailable ? 'disponible' : 'rupture');
    
    const [result] = await pool.query(
      `INSERT INTO ingredients (
        name, 
        slug, 
        category_inventory,
        quantity, 
        unit,
        price_per_unit, 
        min_quantity, 
        supplier,
        description,
        is_available,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        slug,
        category,
        qty,
        unit || 'kg',
        price || 0,
        minQuantity || 0,
        supplier || '',
        description || 'Ingrédient ajouté depuis l\'inventaire',
        isAvailable
      ]
    );
    
    console.log('✅ Ingrédient ajouté, ID:', result.insertId);
    res.json({ 
      success: true, 
      message: 'Ingrédient ajouté avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur ajout ingrédient:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de l\'ajout de l\'ingrédient' 
    });
  }
});

// PUT - Modifier un ingrédient (matière première)
app.put('/api/inventory/:id', authenticateToken, requireAdmin, async (req, res) => {
  console.log('📦 PUT /api/inventory/:id - Modification ingrédient');
  const { id } = req.params;
  const { name, category, quantity, price, minQuantity, unit, supplier, description } = req.body;
  
  try {
    const [existing] = await pool.query(
      `SELECT * FROM ingredients WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ingrédient non trouvé' 
      });
    }

    const currentIngredient = existing[0];

    // Si c'est juste une mise à jour de quantité (depuis les boutons +/-)
    if (quantity !== undefined && !name && !category) {
      console.log(`📦 MAJ quantité uniquement: ${currentIngredient.name} → ${quantity}`);
      
      // Calculer le statut automatiquement en fonction de la quantité
      const isAvailable = quantity > 0 ? 1 : 0;
      
      await pool.query(
        `UPDATE ingredients 
         SET quantity = ?, is_available = ?, updated_at = NOW()
         WHERE id = ? AND deleted_at IS NULL`,
        [quantity, isAvailable, id]
      );
      
      console.log(`✅ Quantité mise à jour, ID: ${id}, Statut: ${isAvailable ? 'disponible' : 'rupture'}`);
      return res.json({ 
        success: true, 
        message: 'Quantité mise à jour avec succès' 
      });
    }

    // Mise à jour complète - valider les champs requis
    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        error: 'Le nom et la catégorie sont obligatoires pour une modification complète' 
      });
    }

    // Valider la catégorie d'inventaire
    const validInventoryCategories = ['Surgelé', 'Frais', 'Autres'];
    if (!validInventoryCategories.includes(category)) {
      return res.status(400).json({ 
        success: false, 
        error: `Catégorie "${category}" non valide. Catégories valides: ${validInventoryCategories.join(', ')}` 
      });
    }

    // Générer un nouveau slug si le nom change
    let baseSlug = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Vérifier unicité (sauf pour l'ingrédient actuel)
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const [existing] = await pool.query('SELECT id FROM ingredients WHERE slug = ? AND id != ?', [slug, id]);
      if (existing.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Calculer automatiquement le statut en fonction de la quantité
    const qty = quantity || 0;
    const isAvailable = qty > 0 ? 1 : 0;
    console.log(`   Quantité: ${qty} → Statut: ${isAvailable ? 'disponible' : 'rupture'}`);
    
    await pool.query(
      `UPDATE ingredients 
       SET name = ?, slug = ?, category_inventory = ?, quantity = ?, unit = ?, price_per_unit = ?, min_quantity = ?, 
           supplier = ?, description = ?, is_available = ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [name, slug, category, qty, unit || 'kg', price || 0, minQuantity || 0, supplier || '', description || '', isAvailable, id]
    );
    
    console.log('✅ Ingrédient modifié, ID:', id);
    res.json({ 
      success: true, 
      message: 'Ingrédient modifié avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur modification ingrédient:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la modification de l\'ingrédient' 
    });
  }
});

// DELETE - Supprimer un ingrédient (soft delete)
app.delete('/api/inventory/:id', authenticateToken, requireAdmin, async (req, res) => {
  console.log('📦 DELETE /api/inventory/:id - Suppression ingrédient');
  const { id } = req.params;
  
  try {
    const [existing] = await pool.query('SELECT name FROM ingredients WHERE id = ? AND deleted_at IS NULL', [id]);
    
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ingrédient non trouvé' 
      });
    }
    
    // Soft delete
    await pool.query('UPDATE ingredients SET deleted_at = NOW() WHERE id = ?', [id]);
    
    console.log('✅ Ingrédient supprimé (soft delete), ID:', id);
    res.json({ 
      success: true, 
      message: 'Ingrédient supprimé avec succès' 
    });
  } catch (error) {
    console.error('❌ Erreur suppression ingrédient:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erreur lors de la suppression de l\'ingrédient' 
    });
  }
});

// GET - Récupérer les catégories de produits
app.get('/api/products/categories', async (req, res) => {
  console.log('📦 GET /api/products/categories - Récupération catégories');
  try {
    const [categories] = await pool.query(`
      SELECT name 
      FROM categories 
      ORDER BY name ASC
    `);
    
    const categoryList = categories.map(c => c.name);
    console.log('✅ Catégories récupérées:', categoryList);
    
    res.json({ 
      success: true, 
      data: categoryList 
    });
  } catch (error) {
    console.error('❌ Erreur récupération catégories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des catégories' 
    });
  }
});

// ============================================
// 📊 ANALYTICS DASHBOARD CA - ROUTES AVANCÉES
// ============================================

// 🧁 TOP PRODUITS VENDUS SUR UNE PÉRIODE
app.get('/api/admin/analytics/top-products-period', authenticateToken, async (req, res) => {
  const { startDate, endDate, limit = 8 } = req.query;
  
  console.log('📊 GET /api/admin/analytics/top-products-period');
  console.log('   Période:', startDate, '→', endDate);
  console.log('   Limite:', limit);
  
  try {
    const [topProducts] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.image_url,
        c.name AS category,
        SUM(oi.quantity) AS total_sold,
        SUM(oi.subtotal) AS revenue_ttc,
        SUM(oi.subtotal / 1.10) AS revenue_ht,
        COUNT(DISTINCT o.id) AS total_orders
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT ?
    `, [startDate, endDate, parseInt(limit)]);
    
    console.log(`✅ ${topProducts.length} produits récupérés`);
    
    res.json({
      success: true,
      data: topProducts.map((p, index) => ({
        ...p,
        rank: index + 1,
        total_sold: parseInt(p.total_sold),
        revenue_ttc: parseFloat(p.revenue_ttc),
        revenue_ht: parseFloat(p.revenue_ht),
        total_orders: parseInt(p.total_orders)
      }))
    });
  } catch (error) {
    console.error('❌ Erreur récupération top products:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des top produits' 
    });
  }
});

// ⏰ HEURES DE POINTE
app.get('/api/admin/analytics/peak-hours', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  console.log('📊 GET /api/admin/analytics/peak-hours');
  console.log('   Période:', startDate, '→', endDate);
  
  try {
    const [peakHours] = await pool.query(`
      SELECT 
        HOUR(created_at) AS hour,
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_revenue,
        AVG(total_amount) AS avg_order_value
      FROM orders
      WHERE created_at BETWEEN ? AND ?
        AND status != 'cancelled'
      GROUP BY HOUR(created_at)
      ORDER BY hour ASC
    `, [startDate, endDate]);
    
    // Remplir les heures manquantes avec 0
    const allHours = Array.from({ length: 24 }, (_, i) => {
      const hourData = peakHours.find(h => h.hour === i);
      return {
        hour: i,
        label: `${i}h`,
        total_orders: hourData ? parseInt(hourData.total_orders) : 0,
        total_revenue: hourData ? parseFloat(hourData.total_revenue) : 0,
        avg_order_value: hourData ? parseFloat(hourData.avg_order_value) : 0
      };
    });
    
    console.log(`✅ Données heures de pointe récupérées (24h)`);
    
    res.json({
      success: true,
      data: allHours
    });
  } catch (error) {
    console.error('❌ Erreur récupération heures de pointe:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des heures de pointe' 
    });
  }
});

// 📊 RÉPARTITION PAR CATÉGORIE
app.get('/api/admin/analytics/category-distribution', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  console.log('📊 GET /api/admin/analytics/category-distribution');
  console.log('   Période:', startDate, '→', endDate);
  
  try {
    const [categoryData] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.icon,
        SUM(oi.subtotal) AS revenue_ttc,
        SUM(oi.subtotal / 1.10) AS revenue_ht,
        SUM(oi.quantity) AS total_quantity,
        COUNT(DISTINCT o.id) AS total_orders
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      GROUP BY c.id
      ORDER BY revenue_ttc DESC
    `, [startDate, endDate]);
    
    // Calculer le total pour les pourcentages
    const totalRevenue = categoryData.reduce((sum, cat) => sum + parseFloat(cat.revenue_ttc), 0);
    
    const result = categoryData.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      revenue_ttc: parseFloat(cat.revenue_ttc),
      revenue_ht: parseFloat(cat.revenue_ht),
      total_quantity: parseInt(cat.total_quantity),
      total_orders: parseInt(cat.total_orders),
      percentage: totalRevenue > 0 ? (parseFloat(cat.revenue_ttc) / totalRevenue * 100) : 0
    }));
    
    console.log(`✅ ${result.length} catégories récupérées`);
    console.log(`   Total CA: ${totalRevenue.toFixed(2)}€`);
    
    res.json({
      success: true,
      data: result,
      total_revenue: totalRevenue
    });
  } catch (error) {
    console.error('❌ Erreur récupération répartition catégories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la répartition par catégorie' 
    });
  }
});

// ADMIN - LISTE DES COMMANDES PAR PERIODE (détail transactions)
app.get('/api/admin/analytics/orders-period', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('📊 GET /api/admin/analytics/orders-period');
    console.log('   Période:', startDate, '→', endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate et endDate requis (YYYY-MM-DD)' });
    }

    const [orders] = await pool.query(`
      SELECT 
        o.id,
        o.order_number,
        o.created_at,
        o.updated_at,
        o.total_amount,
        o.payment_method,
        o.payment_status,
        o.status,
        COALESCE((SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id), 0) AS items_count,
        u.first_name,
        u.last_name,
        u.email
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status != 'cancelled'
      ORDER BY o.created_at DESC
    `, [startDate, endDate + ' 23:59:59']);

    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    console.error('❌ Erreur orders-period:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur', details: error.message });
  }
});

// ⚠️ PRODUITS EN STOCK CRITIQUE
app.get('/api/admin/analytics/critical-stock', authenticateToken, async (req, res) => {
  console.log('📊 GET /api/admin/analytics/critical-stock');
  
  try {
    const [criticalProducts] = await pool.query(`
      SELECT 
        p.id,
        p.name,
        p.image_url,
        c.name AS category,
        p.stock AS current_stock,
        COALESCE(p.min_stock, 0) AS min_stock,
        CASE 
          WHEN p.stock = 0 THEN 'out'
          WHEN p.stock <= COALESCE(p.min_stock, 0) THEN 'critical'
          WHEN p.stock <= COALESCE(p.min_stock, 0) * 1.5 THEN 'low'
          ELSE 'ok'
        END AS status,
        CASE 
          WHEN p.stock = 0 THEN 100
          WHEN COALESCE(p.min_stock, 0) > 0 THEN 
            GREATEST(0, LEAST(100, (1 - (p.stock / COALESCE(p.min_stock, 1))) * 100))
          ELSE 0
        END AS urgency_level
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.deleted_at IS NULL
        AND (p.stock = 0 OR p.stock <= COALESCE(p.min_stock, 0) * 1.5)
      ORDER BY 
        CASE 
          WHEN p.stock = 0 THEN 0
          WHEN p.stock <= COALESCE(p.min_stock, 0) THEN 1
          ELSE 2
        END,
        p.stock ASC
    `);
    
    console.log(`✅ ${criticalProducts.length} produits en stock critique`);
    
    res.json({
      success: true,
      data: criticalProducts.map(p => ({
        ...p,
        current_stock: parseInt(p.current_stock),
        min_stock: parseInt(p.min_stock),
        urgency_level: parseFloat(p.urgency_level)
      })),
      total_critical: criticalProducts.filter(p => p.status === 'critical' || p.status === 'out').length,
      total_low: criticalProducts.filter(p => p.status === 'low').length
    });
  } catch (error) {
    console.error('❌ Erreur récupération stock critique:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur lors de la récupération des produits en stock critique' 
    });
  }
});

// ================================================================
// ROUTE UPLOAD NEWS (définie juste avant le démarrage du serveur)
// ================================================================
console.log('📝 Enregistrement de la route /api/admin/news/upload-image...');
try {
  app.post('/api/admin/news/upload-image', authenticateToken, requireManager, uploadNews.single('image'), async (req, res) => {
    try {
      console.log('📸 Upload image actualité - Requête reçue');
      
      if (!req.file) {
        console.error('❌ Aucun fichier reçu');
        return res.status(400).json({ success: false, error: 'Aucune image fournie' });
      }

      console.log('  - File:', req.file.originalname);
      console.log('  - User:', req.user ? `${req.user.role} (ID: ${req.user.id})` : 'Non authentifié');

      // S'assurer que le dossier existe
      const newsUploadsDir = path.join(__dirname, '../public/uploads/news');
      if (!fs.existsSync(newsUploadsDir)) {
        fs.mkdirSync(newsUploadsDir, { recursive: true });
        console.log('📁 Dossier news créé:', newsUploadsDir);
      }

      const imageUrl = `/uploads/news/${req.file.filename}`;
      const fullPath = path.join(newsUploadsDir, req.file.filename);
      
      // Vérifier que le fichier existe bien
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Fichier non trouvé après upload: ${fullPath}`);
      }
      
      console.log('✅ Image actualité uploadée:', imageUrl);
      console.log('  - Chemin complet:', fullPath);
      console.log('  - Taille:', req.file.size, 'bytes');
      
      res.json({
        success: true,
        message: 'Image uploadée avec succès',
        imageUrl: imageUrl
      });
    } catch (error) {
      console.error('❌ Erreur upload image actualité:', error);
      console.error('  - Stack:', error.stack);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Erreur lors de l\'upload',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  console.log('✅ Route /api/admin/news/upload-image enregistrée');
} catch (error) {
  console.error('❌ ERREUR lors de l\'enregistrement de la route:', error);
}

// ================================================================
// DÉMARRAGE DU SERVEUR
// ================================================================

// Vérifier que la route upload-image est bien enregistrée
console.log('🔍 Vérification des routes news...');
const routes = [];
app._router?.stack?.forEach((middleware) => {
  if (middleware.route) {
    const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
    const path = middleware.route.path;
    routes.push({ method: methods, path });
    if (path.includes('/news/upload-image')) {
      console.log(`  ✅ Route trouvée: ${methods} ${path}`);
    }
  }
});

if (!routes.some(r => r.path === '/api/admin/news/upload-image')) {
  console.error('  ❌ ERREUR: Route /api/admin/news/upload-image non trouvée !');
  console.error('  Routes news trouvées:');
  routes.filter(r => r.path.includes('/news')).forEach(r => {
    console.error(`    ${r.method} ${r.path}`);
  });
}

// ================================================================
// WEBSOCKET - Gestion des connexions et événements
// ================================================================
io.on('connection', (socket) => {
  console.log(`[WebSocket] Client connecté: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[WebSocket] Client déconnecté: ${socket.id}`);
  });
});

// Fonction helper pour émettre des événements WebSocket
const emitOrderUpdate = (event, data) => {
  io.emit(event, data);
  console.log(`[WebSocket] Événement émis: ${event}`);
};

// Exporter pour utilisation dans les routes
app.emitOrderUpdate = emitOrderUpdate;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('========================================');
  console.log(`🌸 Blossom Café - API Admin`);
  console.log('========================================');
  console.log(`✅ Serveur démarré sur http://0.0.0.0:${PORT}`);
  console.log(`✅ Accessible via http://localhost:${PORT}`);
  console.log(`✅ Accessible via http://127.0.0.1:${PORT}`);
  console.log(`📊 Base de données: blossom_cafe`);
  console.log(`🔐 CORS: Activé pour toutes les origines localhost`);
  console.log(`⚡ WebSocket: Activé pour mises à jour temps réel`);
  console.log('');
  console.log('🔐 Routes Admin (requiert authentification):');
  console.log('  GET/POST/PUT/DELETE /api/admin/users');
  console.log('  GET/POST/PUT/DELETE /api/admin/categories');
  console.log('  GET/POST/PUT/DELETE /api/admin/products');
  console.log('  GET/POST/PUT/DELETE /api/admin/promo-codes');
  console.log('  GET                 /api/admin/orders');
  console.log('  GET                 /api/admin/orders/:id');
  console.log('  PUT                 /api/admin/orders/:id/status');
  console.log('  GET/PUT             /api/admin/settings');
  console.log('  GET                 /api/admin/dashboard');
  console.log('  GET                 /api/admin/analytics/sales');
  console.log('  GET                 /api/admin/analytics/top-products');
  console.log('  GET                 /api/admin/analytics/revenue-by-category');
  console.log('  GET                 /api/stats/revenue');
  console.log('  GET                 /api/stats/revenue/quick');
  console.log('');
  console.log('👔 Routes Manager:');
  console.log('  GET                 /api/manager/today-orders');
  console.log('  GET                 /api/manager/today-stats');
  console.log('');
  console.log('🔓 Routes publiques:');
  console.log('  POST                /api/auth/login');
  console.log('  POST                /api/auth/register');
  console.log('');
  console.log('Appuyez sur Ctrl+C pour arrêter');
  console.log('========================================');
  console.log('');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

