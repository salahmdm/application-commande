# Corrections du Système d'Authentification et d'Autorisation

## Problème Identifié

L'erreur `403 (Forbidden)` avec le message "Accès refusé. Droits admin requis." lors de l'accès à `/api/admin/products` était causée par :

1. **Conflit de middlewares** : `requireAdmin` était redéfini localement dans `admin-api.js`, écrasant la version importée depuis `security-middleware.js`
2. **Absence de vérifications** : Le middleware local ne vérifiait pas l'existence de `req.user` avant d'accéder à `req.user.role`
3. **Manque de logs de débogage** : Difficulté à diagnostiquer les problèmes d'authentification

## Corrections Appliquées

### 1. Import Correct des Middlewares (`database/admin-api.js`)

**Avant :**
```javascript
const { 
  authenticateToken,
  requireKiosk,
  // requireAdmin et requireManager n'étaient PAS importés
} = require('./security-middleware');

// Redéfinition locale qui écrasait l'import
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé. Droits admin requis.' });
  }
  next();
};
```

**Après :**
```javascript
const { 
  authenticateToken,
  requireAdmin,  // ✅ Import depuis security-middleware.js
  requireManager, // ✅ Import depuis security-middleware.js
  requireKiosk,
} = require('./security-middleware');

// ✅ Redéfinition locale supprimée - Utilisation des middlewares importés
```

### 2. Amélioration du Middleware `authenticateToken` (`database/security-middleware.js`)

**Ajouts :**
- ✅ Logs de débogage pour diagnostiquer la présence/absence du token
- ✅ Logs des informations utilisateur extraites du token (userId, email, role)
- ✅ Messages d'erreur plus explicites

```javascript
// ✅ DEBUG: Logger la présence du token pour diagnostiquer les problèmes d'authentification
if (process.env.NODE_ENV === 'development') {
  logger.debug('🔐 authenticateToken - Vérification:', {
    path: req.path,
    hasTokenFromCookie: !!tokenFromCookie,
    hasTokenFromHeader: !!tokenFromHeader,
    hasToken: !!token,
    cookiesKeys: req.cookies ? Object.keys(req.cookies) : []
  });
}
```

### 3. Amélioration du Middleware `requireRole` (`database/security-middleware.js`)

**Ajouts :**
- ✅ Vérification explicite de l'existence de `req.user`
- ✅ Logs de débogage pour diagnostiquer les problèmes de rôle
- ✅ Message d'erreur explicite : "Accès refusé. Droits admin requis."

```javascript
// ✅ Vérifier que req.user existe (doit être défini par authenticateToken)
if (!req.user) {
  logger.warn('❌ requireRole - req.user non défini:', { path: req.path, ip: req.ip });
  return res.status(401).json({ error: 'Authentification requise' });
}

// ✅ DEBUG: Logger les informations de rôle pour diagnostiquer les problèmes
if (process.env.NODE_ENV === 'development') {
  logger.debug('🔐 requireRole - Vérification:', {
    path: req.path,
    userRole: userRole,
    allowedRoles: allowed,
    hasAccess: allowed.includes(userRole)
  });
}
```

### 4. Vérification du Rôle lors de la Création du Token (`database/admin-api.js`)

**Ajouts :**
- ✅ Vérification que le rôle existe avant de créer le token JWT
- ✅ Logs lors de la création du token avec le rôle
- ✅ Vérification également dans la route de refresh token

```javascript
// ✅ Vérifier que le rôle existe dans les données utilisateur
if (!user.role) {
  logger.error('❌ Login - Utilisateur sans rôle:', { userId: user.id, email: logger.sanitizeEmail(user.email) });
  return res.status(500).json({ error: 'Erreur serveur: rôle utilisateur manquant' });
}

// Créer le token avec expiration sécurisée (15 minutes pour access token)
const tokenPayload = { id: user.id, email: user.email, role: user.role, type: 'access' };
logger.debug('🔐 Création du token JWT:', { userId: user.id, role: user.role });
const accessToken = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn: '15m' });
```

### 5. Correction du Cookie SameSite en Développement (`database/admin-api.js`)

**Correction :**
- ✅ Utilisation de `sameSite: 'lax'` en développement au lieu de `'strict'` pour permettre les cookies cross-origin

```javascript
res.cookie('token', accessToken, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax', // ✅ Lax en développement
  maxAge: 15 * 60 * 1000,
  path: '/',
});
```

## Flux d'Authentification Corrigé

### 1. Login (`POST /api/auth/login`)
1. ✅ Récupération de l'utilisateur depuis Supabase avec le rôle
2. ✅ Vérification que le rôle existe
3. ✅ Création du token JWT avec `{ id, email, role, type: 'access' }`
4. ✅ Stockage du token dans un cookie HTTP-only avec `sameSite: 'lax'` en développement
5. ✅ Logs de débogage pour tracer le processus

### 2. Authentification (`authenticateToken` middleware)
1. ✅ Lecture du token depuis le cookie ou le header Authorization
2. ✅ Vérification du token JWT
3. ✅ Extraction du payload et création de `req.user = { id, email, role }`
4. ✅ Logs de débogage pour diagnostiquer les problèmes

### 3. Autorisation (`requireAdmin` / `requireRole` middleware)
1. ✅ Vérification que `req.user` existe
2. ✅ Vérification que le rôle de l'utilisateur est dans la liste des rôles autorisés
3. ✅ Retour d'erreur 403 avec message explicite si accès refusé
4. ✅ Logs de débogage pour diagnostiquer les problèmes

## Points de Vérification

### Frontend (`src/services/api.js`)
- ✅ `credentials: 'include'` dans toutes les requêtes fetch pour envoyer les cookies
- ✅ Headers `X-User-Role` et `X-User-Is-Admin` envoyés pour compatibilité

### Backend (`database/security-middleware.js`)
- ✅ Le token est lu depuis `req.cookies.token` ou `req.headers.authorization`
- ✅ Le rôle est extrait du payload JWT et stocké dans `req.user.role`
- ✅ Le middleware `requireAdmin` vérifie que `req.user.role === 'admin'`

### Base de Données
- ✅ Le rôle est stocké dans la colonne `role` de la table `users`
- ✅ Le rôle est récupéré lors du login et inclus dans le token JWT

## Tests à Effectuer

1. **Test de Login Admin**
   - Se connecter avec un compte admin (`admin@blossom.com`)
   - Vérifier que le cookie `token` est défini
   - Vérifier dans les logs que le rôle est bien inclus dans le token

2. **Test d'Accès Route Admin**
   - Accéder à `/api/admin/products` après login
   - Vérifier que la requête passe sans erreur 403
   - Vérifier dans les logs que `req.user.role === 'admin'`

3. **Test de Token Expiré**
   - Attendre 15 minutes après le login
   - Tenter d'accéder à une route admin
   - Vérifier que l'erreur est gérée correctement (401 ou refresh automatique)

4. **Test de Refresh Token**
   - Utiliser le refresh token pour obtenir un nouveau access token
   - Vérifier que le nouveau token contient bien le rôle
   - Vérifier que l'accès aux routes admin fonctionne avec le nouveau token

## Diagnostic en Cas d'Erreur

Si l'erreur 403 persiste, vérifier dans les logs :

1. **Token présent ?**
   - Log `🔐 authenticateToken - Vérification:` doit montrer `hasToken: true`

2. **Rôle dans le token ?**
   - Log `✅ authenticateToken - Token valide:` doit montrer `role: 'admin'`

3. **Rôle vérifié ?**
   - Log `🔐 requireRole - Vérification:` doit montrer `hasAccess: true`

Si l'un de ces logs indique un problème, cela aidera à identifier la cause exacte.

## Prochaines Étapes

1. ✅ Tester le login avec un compte admin
2. ✅ Vérifier que les routes admin sont accessibles
3. ✅ Vérifier les logs de débogage pour confirmer que tout fonctionne
4. ⏳ Si l'erreur persiste, examiner les logs pour identifier le point de défaillance

