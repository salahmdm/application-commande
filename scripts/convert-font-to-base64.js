/**
 * Script pour convertir la police Courier en base64 pour pdfMake
 * 
 * Usage: node scripts/convert-font-to-base64.js
 * 
 * Prérequis: 
 * - Le fichier Courier-Regular.ttf doit être dans public/fonts/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const fontPath = path.join(projectRoot, 'public', 'fonts', 'Courier-Regular.ttf');
const outputPath = path.join(projectRoot, 'src', 'config', 'courier-font-base64.js');
const configDir = path.dirname(outputPath);

console.log('🔄 Conversion de la police Courier en base64...\n');

// Vérifier si le fichier de police existe
if (!fs.existsSync(fontPath)) {
  console.error('❌ Fichier de police non trouvé:', fontPath);
  console.log('\n💡 Instructions:');
  console.log('   1. Téléchargez la police Courier depuis:');
  console.log('      https://fonts.google.com/specimen/Courier+Prime');
  console.log('   2. Extrayez le fichier ZIP');
  console.log('   3. Copiez CourierPrime-Regular.ttf dans: public/fonts/');
  console.log('   4. Renommez-le en: Courier-Regular.ttf');
  console.log('   5. Relancez ce script\n');
  process.exit(1);
}

try {
  // Lire le fichier de police
  console.log('📖 Lecture du fichier de police...');
  const fontData = fs.readFileSync(fontPath);
  console.log(`   Taille: ${(fontData.length / 1024).toFixed(2)} KB`);
  
  // Convertir en base64
  console.log('🔄 Conversion en base64...');
  const base64 = fontData.toString('base64');
  console.log(`   Taille base64: ${(base64.length / 1024).toFixed(2)} KB`);
  
  // Créer le dossier de configuration si nécessaire
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
    console.log(`📁 Dossier créé: ${configDir}`);
  }
  
  // Générer le fichier de configuration
  const output = `/**
 * Police Courier en base64 pour pdfMake
 * Généré automatiquement par convert-font-to-base64.js
 * Ne pas modifier manuellement
 */

export const courierFontBase64 = '${base64}';

export default courierFontBase64;
`;

  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(`✅ Fichier généré: ${outputPath}\n`);
  
  console.log('✅ Conversion terminée avec succès!');
  console.log('\n📝 Prochaine étape:');
  console.log('   Modifiez receiptService.js pour charger cette police\n');
  
} catch (error) {
  console.error('❌ Erreur lors de la conversion:', error.message);
  process.exit(1);
}

