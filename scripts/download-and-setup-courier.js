/**
 * Script pour télécharger et configurer automatiquement la police Courier pour pdfMake
 * 
 * Usage: node scripts/download-and-setup-courier.js
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Dossiers
const fontsDir = path.join(projectRoot, 'public', 'fonts');
const configDir = path.join(projectRoot, 'src', 'config');
const fontPath = path.join(fontsDir, 'Courier-Regular.ttf');
const outputPath = path.join(configDir, 'courier-font-base64.js');

// URLs alternatives pour télécharger la police Courier
const fontUrls = [
  'https://github.com/google/fonts/raw/main/apache/courierprime/CourierPrime-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/apache/courierprime/CourierPrime-Regular.ttf',
  'https://fonts.gstatic.com/s/courierprime/v9/u-450q2lgwslOqpF_6gQ8kELWwZjA.woff2'
];

/**
 * Télécharge un fichier depuis une URL
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`📥 Tentative de téléchargement depuis: ${url}`);
    
    const file = fs.createWriteStream(dest);
    
    protocol.get(url, (response) => {
      // Gérer les redirections
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`Erreur HTTP: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(dest);
        console.log(`✅ Fichier téléchargé: ${dest} (${(stats.size / 1024).toFixed(2)} KB)`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(dest)) {
        fs.unlinkSync(dest);
      }
      reject(err);
    });
  });
}

/**
 * Convertit le fichier de police en base64
 */
function convertToBase64(fontPath) {
  console.log('🔄 Conversion en base64...');
  const fontData = fs.readFileSync(fontPath);
  const base64 = fontData.toString('base64');
  console.log(`   Taille base64: ${(base64.length / 1024).toFixed(2)} KB`);
  return base64;
}

/**
 * Crée le fichier de configuration
 */
function createConfigFile(base64) {
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`📁 Dossier créé: ${configDir}`);
  }
  
  const output = `/**
 * Police Courier en base64 pour pdfMake
 * Généré automatiquement par download-and-setup-courier.js
 * Ne pas modifier manuellement
 */

export const courierFontBase64 = '${base64}';

export default courierFontBase64;
`;

  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`✅ Fichier de configuration créé: ${outputPath}`);
}

async function main() {
  console.log('🚀 Configuration automatique de la police Courier pour pdfMake\n');
  
  // Créer le dossier des polices
  if (!fs.existsSync(fontsDir)) {
    fs.mkdirSync(fontsDir, { recursive: true });
    console.log(`📁 Dossier créé: ${fontsDir}`);
  }
  
  // Vérifier si la police est déjà téléchargée
  if (fs.existsSync(fontPath)) {
    console.log('✅ La police Courier est déjà téléchargée.');
    console.log(`   Emplacement: ${fontPath}\n`);
  } else {
    // Essayer de télécharger depuis différentes sources
    let downloaded = false;
    for (const url of fontUrls) {
      try {
        await downloadFile(url, fontPath);
        downloaded = true;
        break;
      } catch (error) {
        console.log(`❌ Échec: ${error.message}`);
        continue;
      }
    }
    
    if (!downloaded) {
      console.error('\n❌ Impossible de télécharger la police automatiquement.\n');
      console.log('💡 Solution manuelle:');
      console.log('   1. Téléchargez la police depuis:');
      console.log('      https://fonts.google.com/specimen/Courier+Prime');
      console.log('   2. Extrayez le fichier ZIP');
      console.log('   3. Copiez CourierPrime-Regular.ttf dans:');
      console.log(`      ${fontsDir}`);
      console.log('   4. Renommez-le en: Courier-Regular.ttf');
      console.log('   5. Relancez ce script\n');
      process.exit(1);
    }
  }
  
  // Convertir en base64
  const base64 = convertToBase64(fontPath);
  
  // Créer le fichier de configuration
  createConfigFile(base64);
  
  console.log('\n✅ Configuration terminée avec succès!');
  console.log('\n📝 La police Courier est maintenant configurée.');
  console.log('   Redémarrez l\'application pour que les changements prennent effet.\n');
}

main().catch((error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});

