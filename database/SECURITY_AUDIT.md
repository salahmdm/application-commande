# 🔒 Audit de Sécurité - Blossom Café

**Date** : $(date)  
**Version** : 1.0  
**Statut** : ⚠️ **CRITIQUE** - Actions immédiates requises

---

## 📊 Résumé Exécutif

**Score de Sécurité** : 🔴 **3/10** (Critique)

- ✅ **Points Positifs** :
  - Utilisation de requêtes paramétrées (protection SQL Injection)
  - Variables d'environnement pour les secrets
  - Middlewares de sécurité définis (mais non appliqués)
  - Validation des uploads de fichiers

- ❌ **Problèmes Critiques** :
  - Authentification désactivée
  - CORS trop permissif
  - Pas de protection Helmet
  - Pas de rate limiting appliqué

---

## 🚨 PROBLÈMES CRITIQUES (À CORRIGER IMMÉDIATEMENT)

### 1. ⚠️ **AUTHENTIFICATION DÉSACTIVÉE** 
**Fichier** : `database/admin-api.js:409`  
**Sévérité** : 🔴 **CRITIQUE**

```javascript
// ❌ PROBLÈME ACTUEL
const isValid = true; // Pour les tests
```

**Impact** : N'importe qui peut se connecter avec n'importe quel email/mot de passe !

**Solution** :
```javascript
// ✅ CORRECTION REQUISE
const isValid = await bcrypt.compare(password, user.password_hash);
if (!isValid) {
  return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
}
```

---

### 2. ⚠️ **CORS TROP PERMISSIF**
**Fichier** : `database/admin-api.js:23-28, 92-98`  
**Sévérité** : 🔴 **CRITIQUE**

```javascript
// ❌ PROBLÈME ACTUEL
const io = new Server(httpServer, {
  cors: {
    origin: '*',  // Accepte TOUTES les origines !
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: true,  // Accepte toutes les origines !
  credentials: true,
}));
```

**Impact** : N'importe quel site web peut faire des requêtes vers votre API !

**Solution** :
```javascript
// ✅ CORRECTION REQUISE
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://votre-domaine.com']
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  },
});

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? config.cors.origins
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: config.cors.methods,
  allowedHeaders: config.cors.allowedHeaders
}));
```

---

### 3. ⚠️ **PAS DE HELMET APPLIQUÉ**
**Fichier** : `database/admin-api.js`  
**Sévérité** : 🔴 **HAUTE**

**Problème** : Le middleware `helmetConfig` existe dans `security-middleware.js` mais n'est jamais utilisé dans `admin-api.js`.

**Impact** : Pas de protection contre les attaques XSS, clickjacking, etc.

**Solution** :
```javascript
// ✅ AJOUTER AU DÉBUT DE admin-api.js
const { helmetConfig } = require('./security-middleware');
app.use(helmetConfig);
```

---

### 4. ⚠️ **PAS DE RATE LIMITING APPLIQUÉ**
**Fichier** : `database/admin-api.js`  
**Sévérité** : 🔴 **HAUTE**

**Problème** : Le middleware `authRateLimit` existe mais n'est pas appliqué sur `/api/auth/login`.

**Impact** : Attaques par force brute possibles sur les comptes.

**Solution** :
```javascript
// ✅ AJOUTER SUR LES ROUTES D'AUTHENTIFICATION
const { authRateLimit } = require('./security-middleware');

app.post('/api/auth/login', authRateLimit, async (req, res) => {
  // ...
});
```

---

## ⚠️ PROBLÈMES HAUTE PRIORITÉ

### 5. **JWT EXPIRATION TROP LONGUE**
**Fichier** : `database/admin-api.js:422`  
**Sévérité** : 🟠 **HAUTE**

```javascript
// ❌ PROBLÈME ACTUEL
{ expiresIn: '7d' } // 7 jours - TROP LONG !
```

**Impact** : Si un token est volé, il reste valide pendant 7 jours.

**Solution** :
```javascript
// ✅ CORRECTION RECOMMANDÉE
{ expiresIn: '1h' } // 1 heure + refresh token pour les sessions longues
```

---

### 6. **LOGS EXCESSIFS AVEC INFORMATIONS SENSIBLES**
**Fichier** : `database/admin-api.js` (multiples endroits)  
**Sévérité** : 🟠 **MOYENNE**

**Problème** : Les logs contiennent :
- Tokens JWT (partiels mais toujours sensibles)
- Emails utilisateurs
- Détails SQL complets
- Stack traces complètes

**Exemple** :
```javascript
// ❌ PROBLÈME ACTUEL
console.log('   - Token (premiers caractères):', token.substring(0, 30) + '...');
console.log('   - User Email:', user.email);
console.error('SQL:', error.sql);
console.error('Stack:', error.stack);
```

**Solution** :
```javascript
// ✅ CORRECTION RECOMMANDÉE
// Ne jamais logger les tokens
// Logger seulement en développement
if (process.env.NODE_ENV === 'development') {
  console.log('   - Token présent: OUI');
}
// Masquer les emails dans les logs de production
console.log('   - User ID:', user.id); // Pas d'email
```

---

### 7. **GESTION D'ERREURS EXPOSE DES DÉTAILS SQL**
**Fichier** : `database/admin-api.js:933-938`  
**Sévérité** : 🟠 **MOYENNE**

```javascript
// ❌ PROBLÈME ACTUEL
res.status(500).json({
  success: false,
  error: errorMessage,
  details: error.message,        // ⚠️ Expose des détails
  sqlCode: error.code,           // ⚠️ Expose des codes SQL
  sqlState: error.sqlState       // ⚠️ Expose des états SQL
});
```

**Impact** : En production, cela peut révéler la structure de la base de données.

**Solution** :
```javascript
// ✅ CORRECTION RECOMMANDÉE
res.status(500).json({
  success: false,
  error: 'Erreur lors de la création de la commande',
  ...(process.env.NODE_ENV === 'development' && {
    details: error.message,
    sqlCode: error.code
  })
});
```

---

## ⚠️ PROBLÈMES MOYENNE PRIORITÉ

### 8. **VALIDATION DES UPLOADS PEUT ÊTRE AMÉLIORÉE**
**Fichier** : `database/upload-config.js`  
**Sévérité** : 🟡 **MOYENNE**

**Problème** : 
- Vérification basée uniquement sur l'extension et le mimetype
- Pas de scan antivirus
- Pas de vérification du contenu réel du fichier

**Recommandation** :
- Ajouter une vérification du contenu réel (magic bytes)
- Limiter la taille des fichiers (déjà fait : 5MB)
- Scanner les fichiers uploadés

---

### 9. **PAS DE VALIDATION STRICTE SUR CERTAINS ENDPOINTS**
**Fichier** : `database/admin-api.js`  
**Sévérité** : 🟡 **MOYENNE**

**Problème** : Certains endpoints n'utilisent pas `express-validator` pour valider les entrées.

**Recommandation** : Utiliser les validators de `security-middleware.js` partout.

---

### 10. **PAS DE PROTECTION CSRF**
**Sévérité** : 🟡 **MOYENNE**

**Problème** : Pas de protection contre les attaques CSRF.

**Recommandation** : Implémenter `csurf` ou utiliser des tokens CSRF.

---

## 📋 PROBLÈMES BASSE PRIORITÉ

### 11. **PAS DE HTTPS FORCÉ**
**Sévérité** : 🟢 **BASSE**

**Recommandation** : En production, forcer HTTPS avec un middleware.

### 12. **PAS DE SESSION TIMEOUT**
**Sévérité** : 🟢 **BASSE**

**Recommandation** : Implémenter un timeout de session après inactivité.

---

## ✅ POINTS POSITIFS

1. ✅ **Requêtes SQL paramétrées** : Protection contre les injections SQL
2. ✅ **Variables d'environnement** : Secrets non hardcodés
3. ✅ **Bcrypt pour les mots de passe** : Hachage sécurisé (quand activé)
4. ✅ **Validation des uploads** : Filtrage des types de fichiers
5. ✅ **Middleware de sécurité définis** : Infrastructure prête (à appliquer)

---

## 🎯 PLAN D'ACTION PRIORITAIRE

### Phase 1 - CRITIQUE (À faire immédiatement)
1. ✅ Activer la vérification bcrypt dans `/api/auth/login`
2. ✅ Restreindre CORS aux origines autorisées
3. ✅ Appliquer Helmet
4. ✅ Appliquer rate limiting sur `/api/auth/login`

### Phase 2 - HAUTE PRIORITÉ (Cette semaine)
5. ✅ Réduire l'expiration JWT à 1h
6. ✅ Nettoyer les logs pour masquer les informations sensibles
7. ✅ Masquer les détails d'erreurs en production

### Phase 3 - MOYENNE PRIORITÉ (Ce mois)
8. ✅ Améliorer la validation des uploads
9. ✅ Ajouter validation stricte sur tous les endpoints
10. ✅ Implémenter protection CSRF

---

## 📚 RESSOURCES

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

---

**⚠️ IMPORTANT** : Corriger les problèmes critiques AVANT de déployer en production !

