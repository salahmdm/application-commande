# Solution Erreur 403 - Activation Automatique du Fallback Supabase

## Problème

L'erreur `403 (Forbidden)` avec le message "Accès refusé. Droits admin requis." se produit lors de l'accès à `/api/admin/products`, et le fallback Supabase ne se déclenche pas automatiquement.

## Corrections Appliquées

### 1. Amélioration de la Détection des Erreurs 403 (`src/services/productService.js`)

**Problème :** La détection de l'erreur 403 n'était pas assez robuste et ne capturait pas toutes les variantes du message d'erreur.

**Solution :**
- ✅ Détection du statut HTTP (403, 401)
- ✅ Détection du flag `isAuthError`
- ✅ Détection dans le message d'erreur principal
- ✅ Détection dans `errorData.error` et `errorData.message`
- ✅ Détection insensible à la casse (lowercase)
- ✅ Détection de toutes les variantes : "Accès refusé", "Forbidden", "Droits admin requis", "Droits admin", etc.

**Code :**
```javascript
const errorStatus = error?.status || error?.statusCode || error?.responseStatus || null;
const errorMessage = String(error?.message || error?.error || '').toLowerCase();
const errorDataMessage = String(error?.errorData?.error || error?.errorData?.message || '').toLowerCase();
const fullErrorMessage = `${errorMessage} ${errorDataMessage}`.toLowerCase();

const isAuthError = errorStatus === 401 || 
                   errorStatus === 403 || 
                   error?.isAuthError === true ||
                   fullErrorMessage.includes('401') || 
                   fullErrorMessage.includes('403') ||
                   fullErrorMessage.includes('accès refusé') ||
                   fullErrorMessage.includes('forbidden') ||
                   fullErrorMessage.includes('droits admin requis') ||
                   fullErrorMessage.includes('droits admin') ||
                   fullErrorMessage.includes('unauthorized') ||
                   fullErrorMessage.includes('access denied');
```

### 2. Logs de Diagnostic Améliorés

**Ajouts :**
- ✅ Logs détaillés pour comprendre pourquoi le fallback ne se déclenche pas
- ✅ Affichage de toutes les propriétés de l'erreur
- ✅ Logs avant et après la détection

**Code :**
```javascript
logger.debug('🔍 getAllProductsAdmin - Analyse erreur:', {
  errorStatus,
  errorMessage: error?.message,
  isAuthError,
  hasErrorData: !!error?.errorData,
  errorDataMessage: error?.errorData?.error || error?.errorData?.message
});
```

### 3. Activation Immédiate du Fallback

**Comportement :**
1. Détection de l'erreur 403
2. Activation immédiate du flag `forceSupabaseAdmin = true`
3. Tentative de fallback Supabase
4. Retour des produits depuis Supabase si succès
5. Logs clairs du processus

## Flux de Fallback

```
1. Appel API → /api/admin/products
   ↓
2. Erreur 403 reçue
   ↓
3. Détection automatique de l'erreur d'authentification
   ↓
4. Activation du flag forceSupabaseAdmin = true
   ↓
5. Tentative de récupération depuis Supabase direct
   ↓
6. Retour des produits depuis Supabase (fallback)
```

## Vérifications à Faire

### 1. Vérifier que l'erreur est correctement propagée

Dans la console du navigateur, vérifier :
- ✅ Le message d'erreur contient "Accès refusé. Droits admin requis."
- ✅ L'erreur a un `status` ou `statusCode` égal à 403
- ✅ L'erreur a `isAuthError = true`

### 2. Vérifier les logs de diagnostic

Dans la console, chercher :
- `🔍 getAllProductsAdmin - Analyse erreur:` → Doit montrer `isAuthError: true`
- `🔐 productService.getAllProductsAdmin - Accès refusé (401/403), fallback automatique vers Supabase`
- `🔄 Tentative de fallback Supabase...`
- `✅ productService.getAllProductsAdmin - X produits récupérés depuis Supabase (fallback)`

### 3. Vérifier que le fallback Supabase fonctionne

Si le fallback Supabase échoue, vous verrez :
- `❌ productService.getAllProductsAdmin - Fallback Supabase échoué:`

**Causes possibles :**
- Credentials Supabase manquants ou incorrects
- Problème de connexion réseau
- Problème de permissions Supabase

## Si le Problème Persiste

### Option 1 : Forcer l'utilisation de Supabase

Ajouter dans `.env` :
```
VITE_FORCE_SUPABASE_ADMIN=true
```

### Option 2 : Vérifier les logs backend

Dans les logs du backend, vérifier :
- ✅ Le middleware `authenticateToken` extrait bien le rôle
- ✅ Le middleware `requireAdmin` vérifie bien `req.user.role === 'admin'`
- ✅ Le token JWT contient bien `role: 'admin'`

### Option 3 : Vérifier le token dans le navigateur

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Application" → "Cookies"
3. Vérifier que le cookie `token` existe
4. Décoder le token JWT sur jwt.io pour vérifier qu'il contient `role: 'admin'`

## Résultat Attendu

Après les corrections :
1. ✅ L'erreur 403 est détectée automatiquement
2. ✅ Le fallback Supabase est activé immédiatement
3. ✅ Les produits sont chargés depuis Supabase
4. ✅ Les logs indiquent clairement le processus
5. ✅ Les prochains appels utilisent directement Supabase (via `forceSupabaseAdmin`)

## Test

1. Recharger la page
2. Vérifier les logs dans la console
3. Vérifier que les produits s'affichent (depuis Supabase en fallback)
4. Les prochains appels devraient utiliser Supabase directement sans erreur 403

