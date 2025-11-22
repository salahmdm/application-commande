/**
 * Configuration sécurisée des uploads pour Blossom Café
 * Protection contre les attaques de fichiers malveillants
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('./config');
const securityLogger = require('./security-logger');
const logger = require('./utils/logger');

/**
 * Vérifier si un fichier est une image valide
 */
const isImageFile = (file) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp'
  ];
  
  return allowedMimeTypes.includes(file.mimetype);
};

/**
 * Vérifier la signature magique du fichier
 */
const validateFileSignature = (file) => {
  const buffer = file.buffer;
  const signatures = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/webp': [0x52, 0x49, 0x46, 0x46]
  };

  const expectedSignature = signatures[file.mimetype];
  if (!expectedSignature) return false;

  for (let i = 0; i < expectedSignature.length; i++) {
    if (buffer[i] !== expectedSignature[i]) {
      return false;
    }
  }

  return true;
};

/**
 * Scanner le contenu du fichier pour détecter du code malveillant
 */
const scanFileContent = (file) => {
  const buffer = file.buffer;
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024));
  
  // Patterns suspects
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
    /<?php/i,
    /<%/i,
    /exec\(/i,
    /system\(/i
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(content)) {
      return false;
    }
  }

  return true;
};

/**
 * Configuration du stockage sécurisé
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/products');
    
    // Créer le dossier s'il n'existe pas
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier sécurisé
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname).toLowerCase();
    
    // Vérifier que l'extension est autorisée
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    if (!allowedExtensions.includes(extension)) {
      return cb(new Error('Extension de fichier non autorisée'));
    }
    
    const filename = `product-${timestamp}-${randomString}${extension}`;
    cb(null, filename);
  }
});

/**
 * Filtre de fichiers sécurisé
 */
const fileFilter = (req, file, cb) => {
  try {
    // Vérifier le type MIME
    if (!isImageFile(file)) {
      securityLogger.logSuspiciousActivity(
        'INVALID_FILE_TYPE',
        req.user?.id || 'anonymous',
        req.ip,
        { filename: file.originalname, mimetype: file.mimetype }
      );
      return cb(new Error('Type de fichier non autorisé. Seules les images sont acceptées.'));
    }

    // Vérifier la taille du fichier
    if (file.size > config.upload.maxFileSize) {
      securityLogger.logSuspiciousActivity(
        'FILE_TOO_LARGE',
        req.user?.id || 'anonymous',
        req.ip,
        { filename: file.originalname, size: file.size }
      );
      return cb(new Error(`Fichier trop volumineux. Taille maximale: ${config.upload.maxFileSize / 1024 / 1024}MB`));
    }

    // Vérifier le nom du fichier
    const filename = file.originalname.toLowerCase();
    const suspiciousNames = ['..', '/', '\\', '<', '>', ':', '"', '|', '?', '*'];
    
    for (const char of suspiciousNames) {
      if (filename.includes(char)) {
        securityLogger.logSuspiciousActivity(
          'SUSPICIOUS_FILENAME',
          req.user?.id || 'anonymous',
          req.ip,
          { filename: file.originalname }
        );
        return cb(new Error('Nom de fichier suspect détecté'));
      }
    }

    cb(null, true);
  } catch (error) {
    securityLogger.logSecurityError(error, {
      action: 'FILE_FILTER',
      filename: file.originalname
    });
    cb(new Error('Erreur lors de la validation du fichier'));
  }
};

/**
 * Middleware de validation post-upload
 */
const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const file = req.file;

    // Vérifier la signature magique
    if (!validateFileSignature(file)) {
      securityLogger.logSuspiciousActivity(
        'INVALID_FILE_SIGNATURE',
        req.user?.id || 'anonymous',
        req.ip,
        { filename: file.originalname, mimetype: file.mimetype }
      );
      
      // Supprimer le fichier uploadé
      fs.unlinkSync(file.path);
      
      return res.status(400).json({
        error: 'Fichier corrompu ou malveillant détecté'
      });
    }

    // Scanner le contenu
    if (!scanFileContent(file)) {
      securityLogger.logSuspiciousActivity(
        'MALICIOUS_FILE_CONTENT',
        req.user?.id || 'anonymous',
        req.ip,
        { filename: file.originalname }
      );
      
      // Supprimer le fichier uploadé
      fs.unlinkSync(file.path);
      
      return res.status(400).json({
        error: 'Contenu malveillant détecté dans le fichier'
      });
    }

    // Log de l'upload réussi
    securityLogger.logAccess(
      'FILE_UPLOAD',
      req.user?.id,
      req.ip,
      req.get('User-Agent'),
      'SUCCESS'
    );

    next();
  } catch (error) {
    securityLogger.logSecurityError(error, {
      action: 'FILE_VALIDATION',
      filename: req.file?.originalname
    });
    
    // Supprimer le fichier en cas d'erreur
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        logger.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({
      error: 'Erreur lors de la validation du fichier'
    });
  }
};

/**
 * Configuration Multer sécurisée
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 1 // Un seul fichier à la fois
  }
});

/**
 * Middleware de nettoyage des fichiers temporaires
 */
const cleanupTempFiles = (req, res, next) => {
  res.on('finish', () => {
    // Nettoyer les fichiers temporaires si nécessaire
    if (req.file && req.file.path && !res.headersSent) {
      try {
        // Vérifier si le fichier est toujours nécessaire
        // (par exemple, si la réponse est une erreur)
        if (res.statusCode >= 400) {
          fs.unlinkSync(req.file.path);
        }
      } catch (error) {
        logger.error('Error cleaning up temp file:', error);
      }
    }
  });
  
  next();
};

/**
 * Middleware de protection contre les attaques de déni de service
 */
const preventDoS = (req, res, next) => {
  const uploads = req.files || (req.file ? [req.file] : []);
  
  if (uploads.length > 5) {
    securityLogger.logSecurityAlert('FILE_UPLOAD_ABUSE', {
      userId: req.user?.id || 'anonymous',
      ip: req.ip,
      fileCount: uploads.length
    });
    
    return res.status(429).json({
      error: 'Trop de fichiers uploadés simultanément'
    });
  }
  
  next();
};

module.exports = {
  upload,
  validateUploadedFile,
  cleanupTempFiles,
  preventDoS,
  isImageFile,
  validateFileSignature,
  scanFileContent
};
