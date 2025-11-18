# Configuration des Variables d'Environnement

## 📋 Guide de Configuration

Ce guide explique comment configurer les variables d'environnement pour Blossom Café.

### 🚀 Démarrage Rapide

1. **Copier le fichier d'exemple**
   ```bash
   cd database
   cp .env.example .env
   ```

2. **Éditer le fichier `.env`**
   Ouvrez `database/.env` et configurez vos valeurs :
   ```env
   DB_PASSWORD=votre_mot_de_passe_mysql
   JWT_SECRET=votre_secret_jwt_super_securise
   ```

3. **Redémarrer le backend**
   Le backend chargera automatiquement les variables depuis `.env`

### 🔐 Variables Requises

#### Base de données MySQL
- `DB_HOST` : Adresse du serveur MySQL (défaut: `127.0.0.1`)
- `DB_PORT` : Port MySQL (défaut: `3306`)
- `DB_USER` : Utilisateur MySQL (défaut: `root`)
- `DB_PASSWORD` : **REQUIS** - Mot de passe MySQL
- `DB_NAME` : Nom de la base de données (défaut: `blossom_cafe`)

#### Sécurité JWT
- `JWT_SECRET` : **REQUIS** - Secret pour signer les tokens JWT
- `JWT_EXPIRES_IN` : Durée de validité des tokens (défaut: `1h`)
- `JWT_REFRESH_EXPIRES_IN` : Durée des refresh tokens (défaut: `7d`)
- `SESSION_SECRET` : Secret pour les sessions (défaut: généré)

#### Serveur
- `PORT` : Port du serveur API (défaut: `5000`)
- `NODE_ENV` : Environnement (`development` | `production`)

### ⚠️ Sécurité

**IMPORTANT** :
- ❌ **NE JAMAIS** commiter le fichier `.env` dans Git
- ✅ Le fichier `.env` est déjà dans `.gitignore`
- ✅ Utilisez `.env.example` comme template
- ✅ Changez tous les secrets en production
- ✅ Utilisez des secrets différents pour chaque environnement

### 📝 Exemple de Configuration

```env
# Base de données
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=blossom_cafe
DB_USER=root
DB_PASSWORD=MonMotDePasseSecurise123!

# JWT
JWT_SECRET=mon_secret_jwt_super_long_et_aleatoire_123456789
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Serveur
PORT=5000
NODE_ENV=development
```

### 🔍 Vérification

Pour vérifier que votre configuration est correcte :

```bash
cd database
node -e "require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST);"
```

### 🆘 Dépannage

**Erreur : "DB_PASSWORD non défini"**
- Vérifiez que le fichier `.env` existe dans `database/`
- Vérifiez que les variables sont correctement nommées
- Redémarrez le serveur après modification de `.env`

**Erreur de connexion MySQL**
- Vérifiez que MySQL est démarré
- Vérifiez les valeurs dans `.env`
- Testez la connexion avec : `mysql -u root -p`

### 📚 Documentation Complète

Consultez `database/.env.example` pour la liste complète des variables disponibles.

