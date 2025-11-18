const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Magic bytes (signatures de fichiers) pour les formats d'images supportés
 * Permet de vérifier le contenu réel du fichier, pas seulement l'extension
 */
const MAGIC_BYTES = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG standard
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG avec APP0
    [0xFF, 0xD8, 0xFF, 0xE1]  // JPEG avec APP1 (EXIF)
  ],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]] // RIFF (WebP commence par RIFF)
};

/**
 * Vérifier les magic bytes d'un fichier
 * @param {Buffer} buffer - Les premiers octets du fichier
 * @param {string} mimetype - Le type MIME déclaré
 * @returns {boolean} - true si les magic bytes correspondent
 */
const verifyMagicBytes = (buffer, mimetype) => {
  if (!buffer || buffer.length < 8) {
    return false;
  }

  const signatures = MAGIC_BYTES[mimetype];
  if (!signatures) {
    return false;
  }

  // Pour WebP, vérifier que c'est bien un WebP (RIFF...WEBP)
  if (mimetype === 'image/webp') {
    if (buffer.length < 12) {
      return false;
    }
    const webpHeader = buffer.slice(0, 12);
    const riff = webpHeader.toString('ascii', 0, 4);
    const webp = webpHeader.toString('ascii', 8, 12);
    // ✅ AMÉLIORATION: Vérification plus souple pour WebP
    return riff === 'RIFF' && webp === 'WEBP';
  }

  // Pour les autres formats, vérifier les signatures
  for (const signature of signatures) {
    const fileHeader = buffer.slice(0, signature.length);
    let matches = true;
    
    for (let i = 0; i < signature.length; i++) {
      if (fileHeader[i] !== signature[i]) {
        matches = false;
        break;
      }
    }
    
    if (matches) {
      return true;
    }
  }

  return false;
};

// Créer le dossier uploads/news s'il n'existe pas
const uploadsDir = path.join(__dirname, '../public/uploads/news');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuration du stockage pour les actualités
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Générer un nom unique : timestamp + nom original nettoyé
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase();
    cb(null, `news-${uniqueSuffix}-${nameWithoutExt}${ext}`);
  }
});

// Filtre pour n'accepter que les images avec validation magic bytes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (!mimetype || !extname) {
    return cb(new Error('Seules les images (JPEG, PNG, WEBP, GIF) sont autorisées'));
  }

  // ✅ SÉCURITÉ: Vérification des magic bytes sera faite après l'upload
  // Multer ne permet pas de lire le buffer avant l'upload complet
  // On validera dans le middleware après multer
  cb(null, true);
};

/**
 * Middleware pour valider les magic bytes après l'upload
 * À utiliser après multer dans les routes
 * ✅ AMÉLIORATION: Messages d'erreur plus détaillés pour faciliter le diagnostic
 */
const validateFileMagicBytes = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const filePath = req.file.path;
  
  try {
    // Lire les premiers octets du fichier
    const buffer = fs.readFileSync(filePath);
    const mimetype = req.file.mimetype;
    const originalName = req.file.originalname;

    console.log('🔍 Validation magic bytes:', {
      filename: originalName,
      mimetype: mimetype,
      size: buffer.length,
      firstBytes: Array.from(buffer.slice(0, 8)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')
    });

    if (!verifyMagicBytes(buffer, mimetype)) {
      console.error('❌ Validation magic bytes échouée:', {
        filename: originalName,
        mimetype: mimetype,
        expectedTypes: Object.keys(MAGIC_BYTES).join(', ')
      });
      
      // Supprimer le fichier invalide
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({ 
        success: false,
        error: 'Fichier invalide',
        message: `Le fichier "${originalName}" ne correspond pas à son type déclaré (${mimetype}). Seules les images authentiques (JPEG, PNG, WEBP, GIF) sont autorisées.`,
        details: process.env.NODE_ENV === 'development' ? {
          receivedMimetype: mimetype,
          allowedTypes: Object.keys(MAGIC_BYTES).join(', '),
          fileSize: req.file.size
        } : undefined
      });
    }

    console.log('✅ Validation magic bytes réussie pour:', originalName);
    next();
  } catch (error) {
    console.error('❌ Erreur lors de la validation magic bytes:', error);
    // En cas d'erreur, supprimer le fichier et renvoyer une erreur
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({ 
      success: false,
      error: 'Erreur lors de la validation du fichier',
      message: error.message || 'Impossible de vérifier le fichier uploadé',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Configuration de l'upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

module.exports = {
  upload,
  validateFileMagicBytes,
  verifyMagicBytes
};

