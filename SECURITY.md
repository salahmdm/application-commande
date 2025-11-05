# 🔐 Guide de Sécurité - Blossom Café

## Vue d'ensemble
Ce document décrit les mesures de sécurité implémentées dans l'application Blossom Café pour protéger les données utilisateurs et prévenir les attaques courantes.

## 🛡️ Mesures de Sécurité Implémentées

### 1. Authentification et Autorisation
- **JWT Tokens sécurisés** avec expiration courte (1h) et refresh tokens (7j)
- **Hachage des mots de passe** avec bcrypt (12 rounds)
- **Validation des mots de passe** avec critères de complexité
- **Middleware d'authentification** sur toutes les routes sensibles
- **Vérification des rôles** (admin, manager, client)

### 2. Protection du Backend
- **Helmet.js** pour les en-têtes de sécurité HTTP
- **Rate Limiting** pour prévenir le spam et DDoS
- **CORS configuré** avec whitelist d'origines
- **Validation des entrées** avec express-validator
- **Nettoyage des réponses** pour masquer les données sensibles

### 3. Sécurité de la Base de Données
- **Utilisateur MySQL dédié** avec privilèges limités
- **Requêtes préparées** pour éviter les injections SQL
- **Validation des paramètres** avant exécution des requêtes
- **Logging des modifications** de données sensibles

### 4. Sécurité des Uploads
- **Validation des types de fichiers** (images uniquement)
- **Vérification des signatures magiques** des fichiers
- **Scan du contenu** pour détecter du code malveillant
- **Limitation de taille** des fichiers (2MB max)
- **Noms de fichiers sécurisés** générés automatiquement

### 5. Logging et Monitoring
- **Logs de sécurité** pour toutes les actions sensibles
- **Détection d'activité suspecte** avec alertes automatiques
- **Surveillance des tentatives d'authentification** échouées
- **Analyse des patterns** d'attaque

## 🚨 Alertes de Sécurité

Le système génère des alertes pour :
- Tentatives d'authentification échouées multiples
- Accès non autorisés aux ressources
- Uploads de fichiers suspects
- Activité suspecte détectée
- Dépassement des limites de taux

## 📁 Fichiers de Sécurité

### Configuration
- `database/config.js` - Configuration sécurisée
- `database/security-middleware.js` - Middlewares de sécurité
- `database/security-utils.js` - Utilitaires de sécurité
- `database/security-logger.js` - Système de logging
- `database/secure-upload.js` - Uploads sécurisés

### Base de Données
- `database/create-secure-user.sql` - Script de création d'utilisateur MySQL

### Protection
- `.gitignore` - Exclusion des fichiers sensibles

## 🔧 Configuration Requise

### Variables d'Environnement
```bash
# Base de données
DB_HOST=127.0.0.1
DB_USER=blossom_user
DB_PASSWORD=SecurePassword123!@#
DB_NAME=blossom_cafe

# JWT
JWT_SECRET=super_secret_jwt_key_blossom_cafe_2024_production_ready_very_long_and_complex
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Sécurité
HELMET_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=100
```

### Utilisateur MySQL Sécurisé
Exécuter le script `create-secure-user.sql` pour créer un utilisateur avec des privilèges limités.

## 🚀 Déploiement en Production

### Recommandations
1. **HTTPS obligatoire** avec certificats SSL valides
2. **Reverse proxy** (Nginx) avec configuration sécurisée
3. **Firewall** configuré pour limiter l'accès
4. **Sauvegardes chiffrées** de la base de données
5. **Monitoring externe** des logs de sécurité
6. **Mise à jour régulière** des dépendances

### Checklist de Sécurité
- [ ] Variables d'environnement configurées
- [ ] Utilisateur MySQL sécurisé créé
- [ ] Certificats SSL installés
- [ ] Firewall configuré
- [ ] Monitoring activé
- [ ] Sauvegardes automatisées
- [ ] Tests de sécurité effectués

## 🔍 Tests de Sécurité

### Tests Automatisés
- Validation des mots de passe
- Vérification des tokens JWT
- Test des middlewares de sécurité
- Validation des uploads

### Tests Manuels
- Tentatives d'injection SQL
- Tests de rate limiting
- Validation des autorisations
- Tests d'upload de fichiers malveillants

## 📞 Support Sécurité

En cas de découverte d'une faille de sécurité :
1. Ne pas publier publiquement
2. Contacter l'équipe de développement
3. Fournir des détails techniques
4. Attendre la correction avant divulgation

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [MySQL Security](https://dev.mysql.com/doc/refman/8.0/en/security.html)
