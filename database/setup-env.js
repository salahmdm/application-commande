/**
 * Script d'aide pour configurer le fichier .env
 * Vérifie si .env existe et guide l'utilisateur
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('🔧 Configuration des variables d\'environnement\n');

// Vérifier si .env existe
if (fs.existsSync(envPath)) {
  console.log('✅ Fichier .env trouvé');
  
  // Vérifier les variables essentielles
  require('dotenv').config();
  
  const requiredVars = ['DB_PASSWORD', 'JWT_SECRET'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('\n⚠️ Variables manquantes dans .env:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n💡 Éditez database/.env et ajoutez ces variables');
  } else {
    console.log('✅ Toutes les variables essentielles sont configurées');
  }
} else {
  console.log('❌ Fichier .env non trouvé');
  
  if (fs.existsSync(envExamplePath)) {
    console.log('\n📋 Création du fichier .env depuis .env.example...');
    
    // Copier .env.example vers .env
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envPath, exampleContent);
    
    console.log('✅ Fichier .env créé !');
    console.log('\n⚠️ IMPORTANT: Éditez database/.env et configurez:');
    console.log('   - DB_PASSWORD: Votre mot de passe MySQL');
    console.log('   - JWT_SECRET: Un secret aléatoire sécurisé');
    console.log('   - SESSION_SECRET: Un secret aléatoire sécurisé');
  } else {
    console.log('\n❌ Fichier .env.example non trouvé');
    console.log('💡 Créez manuellement database/.env avec vos variables');
  }
}

console.log('\n📚 Documentation: Consultez database/README_ENV.md');

