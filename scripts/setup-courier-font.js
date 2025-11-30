/**
 * Script pour télécharger et configurer la police Courier pour pdfMake
 * 
 * Usage: node scripts/setup-courier-font.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Dossier pour les polices
const fontsDir = path.join(projectRoot, 'public', 'fonts');
const courierFontPath = path.join(fontsDir, 'Courier-Regular.ttf');

// URL de téléchargement de la police Courier
// Utilisation d'une source alternative pour la police monospace
const courierFontUrl = 'https://fonts.gstatic.com/s/courierprime/v9/u-450q2lgwslOqpF_6gQ8kELWwZjA.woff2';

/**
 * Télécharge un fichier depuis une URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Téléchargement de ${url}...`);
    
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Suivre la redirection
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Erreur HTTP: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Fichier téléchargé: ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Supprimer le fichier en cas d'erreur
      reject(err);
    });
  });
}

/**
 * Crée le dossier des polices s'il n'existe pas
 */
function ensureFontsDirectory() {
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
    console.log(`📁 Dossier créé: ${fontsDir}`);
  }
}

/**
 * Vérifie si la police est déjà téléchargée
 */
function isFontDownloaded() {
  return fs.existsSync(courierFontPath);
}

/**
 * Crée le fichier de configuration des polices pour pdfMake
 */
function createFontConfig() {
  const fontConfigPath = path.join(projectRoot, 'src', 'config', 'pdfFonts.js');
  const configDir = path.dirname(fontConfigPath);
  
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  const fontConfig = `/**
 * Configuration des polices pour pdfMake
 * Ce fichier est généré automatiquement par setup-courier-font.js
 */

// Note: Pour utiliser des polices personnalisées dans pdfMake,
// il faut les convertir en base64 et les ajouter au VFS (Virtual File System)
// 
// Pour l'instant, nous utilisons les polices système disponibles.
// La police Courier sera utilisée via le nom de police système.

export const pdfFonts = {
  // Polices disponibles par défaut dans pdfMake
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  },
  // Note: Pour utiliser Courier, pdfMake utilisera la police système
  // si elle est disponible sur la machine
};

export default pdfFonts;
`;

  fs.writeFileSync(fontConfigPath, fontConfig, 'utf8');
  console.log(`✅ Configuration créée: ${fontConfigPath}`);
}

async function main() {
  try {
    console.log('🚀 Configuration de la police Courier pour pdfMake\n');
    
    // Créer le dossier des polices
    ensureFontsDirectory();
    
    // Vérifier si la police est déjà téléchargée
    if (isFontDownloaded()) {
      console.log('✅ La police Courier est déjà téléchargée.');
      console.log(`   Emplacement: ${courierFontPath}\n`);
    } else {
      // Télécharger la police
      await downloadFile(courierFontUrl, courierFontPath);
    }
    
    // Créer la configuration
    createFontConfig();
    
    console.log('\n✅ Configuration terminée !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. La police Courier sera utilisée via le nom système');
    console.log('   2. Modifiez receiptService.js pour utiliser "Courier" dans defaultStyle');
    console.log('   3. Testez l\'aperçu du ticket\n');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('\n💡 Alternative:');
    console.log('   Vous pouvez télécharger manuellement la police Courier depuis:');
    console.log('   https://fonts.google.com/specimen/Courier+Prime');
    console.log('   Et la placer dans: public/fonts/Courier-Regular.ttf\n');
    process.exit(1);
  }
}

main();

