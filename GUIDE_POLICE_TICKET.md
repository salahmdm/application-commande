# Guide : Modifier la police du ticket de caisse

## ✅ C'est possible de modifier la police !

Vous pouvez modifier la police du ticket de caisse. Voici comment faire :

## Option 1 : Utiliser une police monospace disponible (Recommandé)

Le code est déjà configuré pour utiliser **Courier** si disponible, sinon **Roboto** par défaut.

Pour utiliser Courier, vous devez télécharger et configurer la police :

### Étapes :

1. **Télécharger la police** :
   - Allez sur : https://fonts.google.com/specimen/Courier+Prime
   - Cliquez sur **"Download family"**
   - Extrayez le fichier ZIP téléchargé

2. **Copier le fichier** :
   - Trouvez le fichier `CourierPrime-Regular.ttf` dans le dossier extrait
   - Copiez-le dans : `public/fonts/`
   - Renommez-le en : `Courier-Regular.ttf`

3. **Convertir en base64** :
   ```bash
   node scripts/convert-font-to-base64.js
   ```

4. **Redémarrer l'application** :
   - La police sera automatiquement chargée au prochain démarrage

## Option 2 : Utiliser une autre police monospace

Si vous préférez une autre police monospace, vous pouvez :

1. Télécharger n'importe quelle police `.ttf` monospace
2. La placer dans `public/fonts/` avec le nom `Courier-Regular.ttf`
3. Exécuter `node scripts/convert-font-to-base64.js`
4. Modifier `receiptService.js` ligne 508 pour changer `'Courier'` par le nom de votre police

## Option 3 : Utiliser Roboto (par défaut)

Si vous ne souhaitez pas télécharger de police, le ticket utilisera **Roboto** par défaut, qui est déjà disponible dans pdfMake.

## Vérification

Après configuration, testez l'aperçu du ticket pour voir la nouvelle police.

