# Guide : Configuration de la police Courier pour pdfMake

## Étape 1 : Télécharger la police Courier

1. Allez sur [Google Fonts - Courier Prime](https://fonts.google.com/specimen/Courier+Prime)
2. Cliquez sur "Download family"
3. Extrayez le fichier ZIP
4. Copiez le fichier `CourierPrime-Regular.ttf` dans le dossier `public/fonts/` de votre projet
5. Renommez-le en `Courier-Regular.ttf`

## Étape 2 : Convertir la police en base64

Pour utiliser la police dans pdfMake, il faut la convertir en base64 et l'ajouter au VFS (Virtual File System).

### Option A : Utiliser un script Node.js (recommandé)

Créez un fichier `scripts/convert-font-to-base64.js` :

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = path.join(__dirname, '..', 'public', 'fonts', 'Courier-Regular.ttf');
const outputPath = path.join(__dirname, '..', 'src', 'config', 'courier-font-base64.js');

if (!fs.existsSync(fontPath)) {
  console.error('❌ Fichier de police non trouvé:', fontPath);
  console.log('💡 Veuillez d\'abord télécharger la police Courier et la placer dans public/fonts/');
  process.exit(1);
}

const fontData = fs.readFileSync(fontPath);
const base64 = fontData.toString('base64');

const output = `/**
 * Police Courier en base64 pour pdfMake
 * Généré automatiquement - Ne pas modifier manuellement
 */

export const courierFontBase64 = '${base64}';

export default courierFontBase64;
`;

fs.writeFileSync(outputPath, output, 'utf8');
console.log('✅ Police convertie en base64:', outputPath);
```

Exécutez : `node scripts/convert-font-to-base64.js`

### Option B : Utiliser un outil en ligne

1. Allez sur [base64encode.org](https://www.base64encode.org/)
2. Uploadez votre fichier `Courier-Regular.ttf`
3. Copiez le résultat base64

## Étape 3 : Configurer pdfMake

Une fois la police convertie, modifiez `src/services/receiptService.js` pour charger la police.

## Alternative : Utiliser une police monospace disponible

Si vous ne souhaitez pas télécharger la police, pdfMake peut utiliser les polices système disponibles. 
La police 'Courier' devrait fonctionner si elle est disponible sur le système.

