/**
 * Script d'aide pour configurer le fichier .env
 * Vérifie si .env existe et guide l'utilisateur
 */

const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

logger.log('🔧 Configuration des variables d\'environnement\n');

// Vérifier si .env existe
if (fs.existsSync(envPath)) {
  logger.log('✅ Fichier .env trouvé');
  
  // Vérifier les variables essentielles
  require('dotenv').config();
  
  const requiredVars = ['DB_PASSWORD', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.log('\n⚠️ Variables manquantes dans .env:');
    missingVars.forEach(varName => {
      logger.log(`   - ${varName}`);
    });
    logger.log('\n💡 Éditez database/.env et ajoutez ces variables');
  } else {
    logger.log('✅ Toutes les variables essentielles sont configurées');
  }
} else {
  logger.log('❌ Fichier .env non trouvé');
  
  if (fs.existsSync(envExamplePath)) {
    logger.log('\n📋 Création du fichier .env depuis .env.example...');
    
    // Copier .env.example vers .env
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, exampleContent);
    
    logger.log('✅ Fichier .env créé !');
    logger.log('\n⚠️ IMPORTANT: Éditez database/.env et configurez:');
    logger.log('   - DB_PASSWORD: Votre mot de passe MySQL');
    logger.log('   - JWT_SECRET: Un secret aléatoire sécurisé');
    logger.log('   - SESSION_SECRET: Un secret aléatoire sécurisé');
  } else {
    logger.log('\n❌ Fichier .env.example non trouvé');
    logger.log('💡 Créez manuellement database/.env avec vos variables');
  }
}

logger.log('\n📚 Documentation: Consultez database/README_ENV.md');

