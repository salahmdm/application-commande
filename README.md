# 🌸 Blossom Café - Application de Prise de Commande

Application complète de gestion de restaurant avec système de commandes, gestion de produits, inventaire, et interface kiosk pour bornes tactiles.

## 📋 Table des matières

- [Description](#description)
- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet)
- [Technologies utilisées](#technologies-utilisées)
- [URLs et ports](#urls-et-ports)
- [Base de données](#base-de-données)
- [Scripts disponibles](#scripts-disponibles)
- [Dépannage](#dépannage)
- [Documentation supplémentaire](#documentation-supplémentaire)

---

## 📖 Description

**Blossom Café** est une application web complète pour la gestion d'un restaurant/café, comprenant :

### 🎯 Fonctionnalités principales

- **Application principale** (port 3000) :
  - Interface client pour passer des commandes
  - Tableau de bord manager/admin
  - Gestion des produits et catégories
  - Gestion de l'inventaire et des stocks
  - Historique des commandes
  - Système de fidélité et récompenses
  - Codes promo
  - Gestion des utilisateurs et rôles

- **Interface Kiosk** (port 3010) :
  - Interface optimisée pour bornes tactiles
  - Workflow simplifié : Accueil → Catégories → Produits → Panier → Paiement
  - Support multi-langue (FR/EN)
  - Sélection type de commande (Sur place / À emporter)
  - Codes promo
  - Impression de tickets
  - Reset automatique après inactivité

- **Backend API** (port 5000) :
  - API REST complète
  - Authentification JWT
  - Gestion des commandes
  - Gestion des produits et inventaire
  - Système de sécurité (CSRF, rate limiting, validation)

---

## 🏗️ Architecture

L'application est composée de **3 parties distinctes** :

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │     Kiosk    │  │    Backend   │ │
│  │  (Port 3000) │  │  (Port 3010) │  │  (Port 5000) │ │
│  │              │  │              │  │              │ │
│  │  React + Vite│  │  React + Vite│  │  Node.js +   │ │
│  │  Zustand     │  │  Zustand     │  │  Express     │ │
│  │  TailwindCSS │  │  CSS Custom  │  │  MySQL       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                   │                  │        │
│         └───────────────────┴──────────────────┘        │
│                          │                              │
│                    ┌──────▼──────┐                      │
│                    │   MySQL     │                      │
│                    │  Database   │                      │
│                    └─────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Prérequis

### Logiciels requis

1. **Node.js** (version 18 ou supérieure)
   - Télécharger depuis : https://nodejs.org/
   - Vérifier l'installation : `node --version`

2. **MySQL** (version 8.0 ou supérieure)
   - Télécharger depuis : https://dev.mysql.com/downloads/mysql/
   - Vérifier l'installation : `mysql --version`

3. **npm** (inclus avec Node.js)
   - Vérifier l'installation : `npm --version`

4. **Git** (optionnel, pour cloner le projet)
   - Télécharger depuis : https://git-scm.com/

### Système d'exploitation

- ✅ Windows 10/11 (testé et optimisé)
- ✅ Linux (Ubuntu/Debian)
- ✅ macOS

---

## 🚀 Installation

### Étape 1 : Cloner ou télécharger le projet

```bash
# Si vous utilisez Git
git clone <url-du-repo>
cd "application prise de commande"

# Ou simplement extraire l'archive ZIP
```

### Étape 2 : Installer les dépendances

```bash
# Installer les dépendances du projet principal
npm install

# Installer les dépendances du backend
cd database
npm install
cd ..
```

### Étape 3 : Configurer MySQL

1. **Démarrer MySQL** :
   ```bash
   # Windows (Service)
   # MySQL devrait démarrer automatiquement
   
   # Linux
   sudo systemctl start mysql
   
   # macOS
   brew services start mysql
   ```

2. **Créer la base de données** :
   ```sql
   -- Se connecter à MySQL
   mysql -u root -p
   
   -- Créer la base de données
   CREATE DATABASE blossom_cafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- Quitter MySQL
   EXIT;
   ```

### Étape 4 : Configurer les variables d'environnement

1. **Créer le fichier `.env` dans le dossier `database/`** :
   ```bash
   cd database
   copy env.example.txt .env
   # Ou sur Linux/macOS : cp env.example.txt .env
   ```

2. **Éditer `database/.env`** avec vos informations :
   ```env
   # Configuration MySQL
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe_mysql
   DB_NAME=blossom_cafe
   
   # Configuration JWT
   JWT_SECRET=votre_secret_jwt_tres_long_et_aleatoire
   JWT_REFRESH_SECRET=votre_refresh_secret_jwt_tres_long_et_aleatoire
   
   # Configuration serveur
   PORT=5000
   NODE_ENV=development
   
   # Configuration CORS (optionnel)
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3010
   ```

   ⚠️ **Important** : Remplacez `votre_mot_de_passe_mysql` et les secrets JWT par des valeurs sécurisées !

### Étape 5 : Initialiser la base de données

```bash
cd database

# Exécuter les migrations SQL
# Windows PowerShell
node migrations/create-tables.js

# Ou exécuter directement les fichiers SQL dans MySQL
mysql -u root -p blossom_cafe < migrations/sql/blossom_cafe_schema.sql
```

---

## ⚙️ Configuration

### Ports utilisés

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5000 | http://localhost:5000 |
| Frontend (App principale) | 3000 | http://localhost:3000 |
| Kiosk | 3010 | http://localhost:3010 |

### Fichiers de configuration importants

- `database/.env` - Variables d'environnement (MySQL, JWT, etc.)
- `database/config.js` - Configuration backend
- `vite.config.js` - Configuration Vite (Frontend)
- `vite.config.kiosk.js` - Configuration Vite (Kiosk)
- `tailwind.config.js` - Configuration TailwindCSS

---

## 🎬 Démarrage

### Option 1 : Démarrer tout en une commande (Recommandé)

```bash
# Démarrer Backend + Frontend + Kiosk
npm run start:all
```

Cette commande démarre automatiquement :
- ✅ Backend (port 5000)
- ✅ Frontend (port 3000)
- ✅ Kiosk (port 3010)

### Option 2 : Démarrer Backend + Frontend uniquement

```bash
npm run start
```

### Option 3 : Démarrer séparément (pour le développement)

**Terminal 1 - Backend :**
```bash
npm run backend
```

**Terminal 2 - Frontend :**
```bash
npm run dev
```

**Terminal 3 - Kiosk (optionnel) :**
```bash
npm run dev:kiosk
```

### Option 4 : Utiliser les scripts PowerShell/Batch (Windows)

```powershell
# PowerShell
.\DEMARRER_SERVEURS.ps1

# Ou Batch
START_APP.bat
```

---

## 📁 Structure du projet

```
application prise de commande/
│
├── 📂 database/                    # Backend Node.js + MySQL
│   ├── admin-api.js               # API principale (Express)
│   ├── config.js                  # Configuration
│   ├── security-middleware.js     # Middleware de sécurité
│   ├── .env                       # Variables d'environnement (à créer)
│   ├── migrations/                # Migrations SQL
│   │   └── sql/
│   │       └── blossom_cafe_schema.sql
│   └── utils/                     # Utilitaires backend
│
├── 📂 src/                        # Code source Frontend
│   ├── App.jsx                    # Application principale
│   ├── main.jsx                   # Point d'entrée Frontend
│   ├── main-kiosk.jsx             # Point d'entrée Kiosk
│   │
│   ├── 📂 components/             # Composants React
│   │   ├── common/                # Composants communs
│   │   ├── client/                # Composants client
│   │   ├── manager/               # Composants manager
│   │   └── admin/                 # Composants admin
│   │
│   ├── 📂 kiosk/                  # Application Kiosk
│   │   ├── KioskApp.jsx           # App principale kiosk
│   │   ├── screens/               # Écrans kiosk
│   │   ├── views/                 # Vues kiosk
│   │   ├── components/            # Composants kiosk
│   │   └── styles/                # Styles CSS kiosk
│   │
│   ├── 📂 services/               # Services API
│   │   ├── api.js                 # Client API
│   │   ├── authService.js         # Service authentification
│   │   ├── productService.js      # Service produits
│   │   ├── orderService.js        # Service commandes
│   │   └── kioskService.js        # Service kiosk
│   │
│   ├── 📂 store/                  # Stores Zustand
│   │   ├── authStore.js           # Store authentification
│   │   ├── cartStore.js           # Store panier
│   │   ├── kioskStore.js          # Store kiosk
│   │   └── orderStore.js          # Store commandes
│   │
│   ├── 📂 views/                  # Vues principales
│   └── 📂 utils/                  # Utilitaires
│
├── 📂 public/                     # Fichiers statiques
│   └── uploads/                   # Images uploadées
│
├── 📂 dist/                       # Build de production
│
├── package.json                   # Dépendances npm
├── vite.config.js                 # Config Vite (Frontend)
├── vite.config.kiosk.js           # Config Vite (Kiosk)
├── tailwind.config.js             # Config TailwindCSS
│
└── 📄 README.md                   # Ce fichier
```

---

## 🛠️ Technologies utilisées

### Frontend

- **React 18.2** - Bibliothèque UI
- **Vite 5.0** - Build tool et dev server
- **Zustand 4.4** - Gestion d'état
- **TailwindCSS 3.3** - Framework CSS
- **Lucide React** - Icônes
- **Recharts** - Graphiques
- **PDFMake** - Génération PDF

### Backend

- **Node.js** - Runtime JavaScript
- **Express 5.1** - Framework web
- **MySQL2** - Driver MySQL
- **JWT** - Authentification
- **dotenv** - Variables d'environnement
- **express-rate-limit** - Rate limiting
- **helmet** - Sécurité HTTP

### Base de données

- **MySQL 8.0+** - Base de données relationnelle

---

## 🌐 URLs et ports

### Application principale
- **URL** : http://localhost:3000
- **Description** : Interface complète pour clients, managers et administrateurs
- **Fonctionnalités** :
  - Passage de commandes
  - Gestion des produits
  - Tableau de bord
  - Historique des commandes
  - Gestion des utilisateurs

### Interface Kiosk
- **URL** : http://localhost:3010
- **Description** : Interface optimisée pour bornes tactiles
- **Fonctionnalités** :
  - Sélection de catégories et produits
  - Panier et paiement
  - Codes promo
  - Multi-langue (FR/EN)

### Backend API
- **URL** : http://localhost:5000
- **Health Check** : http://localhost:5000/api/health
- **Documentation** : Endpoints REST disponibles dans `database/admin-api.js`

---

## 🗄️ Base de données

### Structure principale

- **users** - Utilisateurs (clients, managers, admins, kiosk)
- **products** - Produits du menu
- **categories** - Catégories de produits
- **orders** - Commandes
- **order_items** - Items des commandes
- **inventory** - Inventaire et stocks
- **promo_codes** - Codes promotionnels
- **loyalty_rewards** - Récompenses fidélité

### Comptes par défaut

Après l'initialisation de la base de données, vous pouvez vous connecter avec :

- **Admin** : `admin@blossom-cafe.local` / `admin123`
- **Manager** : `manager@blossom-cafe.local` / `manager123`
- **Client** : Créer un compte depuis l'interface
- **Kiosk** : Authentification automatique (pas de login manuel)

### Scripts de test

```bash
cd database

# Tester la connexion MySQL
node test-db-simple.js

# Tester toutes les connexions
node test-all-connections.js

# Diagnostic rapide
node diagnostic-rapide.js
```

---

## 📜 Scripts disponibles

### Scripts npm principaux

| Commande | Description |
|----------|-------------|
| `npm run start` | Démarre Backend + Frontend |
| `npm run start:all` | Démarre Backend + Frontend + Kiosk |
| `npm run backend` | Démarre uniquement le Backend |
| `npm run dev` | Démarre uniquement le Frontend (port 3000) |
| `npm run dev:kiosk` | Démarre uniquement le Kiosk (port 3010) |
| `npm run build` | Build de production (Frontend) |
| `npm run build:kiosk` | Build de production (Kiosk) |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run preview` | Prévisualiser le build de production |

### Scripts de diagnostic

```bash
cd database

# Vérifier les tables
node verify-tables.js

# Vérifier les produits
node check-products.js

# Vérifier les commandes
node test-user-orders.js

# Diagnostic complet
node diagnostic-rapide.js
```

---

## 🔧 Dépannage

### ❌ Port déjà utilisé

**Windows :**
```powershell
# Trouver le processus
netstat -ano | findstr ":5000"
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3010"

# Tuer le processus (remplacer <PID> par le numéro)
taskkill /PID <PID> /F

# Ou tuer tous les processus Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

**Linux/macOS :**
```bash
# Trouver le processus
lsof -i :5000
lsof -i :3000
lsof -i :3010

# Tuer le processus
kill -9 <PID>
```

### ❌ Erreur de connexion MySQL

1. **Vérifier que MySQL est démarré** :
   ```bash
   # Windows
   # Vérifier dans les Services
   
   # Linux
   sudo systemctl status mysql
   
   # macOS
   brew services list
   ```

2. **Vérifier le fichier `.env`** :
   - Le fichier doit être dans `database/.env`
   - Vérifier les valeurs : `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

3. **Tester la connexion** :
   ```bash
   cd database
   node test-db-simple.js
   ```

### ❌ Erreur "Variables d'environnement manquantes"

1. **Créer le fichier `.env`** :
   ```bash
   cd database
   copy env.example.txt .env
   ```

2. **Remplir les valeurs** dans `database/.env`

3. **Redémarrer le serveur**

### ❌ Erreur "Cannot find module"

```bash
# Réinstaller les dépendances
npm install
cd database
npm install
cd ..
```

### ❌ Erreur CORS

Vérifier que les origines sont autorisées dans `database/config.js` :
```javascript
allowedOrigins: [
  'http://localhost:3000',
  'http://localhost:3010',
  // ...
]
```

### ❌ Page blanche dans le navigateur

1. **Vérifier la console du navigateur** (F12)
2. **Vérifier que le backend est démarré** : http://localhost:5000/api/health
3. **Vérifier les erreurs dans le terminal**

### ❌ Kiosk ne s'affiche pas

1. **Vérifier que le port 3010 est libre**
2. **Vérifier que le backend est démarré** (le kiosk a besoin du backend)
3. **Vérifier la console du navigateur** (F12)

---

## 📚 Documentation supplémentaire

### Fichiers de documentation dans le projet

- `DEMARRER_APP.md` - Guide de démarrage rapide
- `FONCTIONNALITES_KIOSK.md` - Liste des fonctionnalités kiosk
- `database/README_ENV.md` - Documentation des variables d'environnement
- `PLAN_IMPLEMENTATION_KIOSK.md` - Plan d'implémentation du kiosk
- `ISOLATION_KIOSK_APP.md` - Architecture d'isolation kiosk

### Endpoints API principaux

#### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription
- `POST /api/auth/refresh` - Rafraîchir le token

#### Produits
- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détails d'un produit
- `GET /api/categories` - Liste des catégories

#### Commandes
- `POST /api/orders` - Créer une commande
- `GET /api/orders` - Liste des commandes
- `GET /api/orders/:id` - Détails d'une commande

#### Kiosk
- `POST /api/kiosk/login` - Authentification kiosk
- `GET /api/kiosk/categories` - Catégories kiosk
- `GET /api/kiosk/products` - Produits kiosk
- `POST /api/kiosk/orders` - Créer commande depuis kiosk
- `POST /api/kiosk/promo-codes/validate` - Valider code promo
- `POST /api/kiosk/orders/:orderNumber/print` - Imprimer ticket

---

## 🔐 Sécurité

### Bonnes pratiques

1. **Ne jamais commiter le fichier `.env`**
2. **Utiliser des secrets JWT forts**
3. **Changer les mots de passe par défaut en production**
4. **Activer HTTPS en production**
5. **Configurer CORS correctement**

### Middleware de sécurité

- **CSRF Protection** - Protection contre les attaques CSRF
- **Rate Limiting** - Limitation du nombre de requêtes
- **Helmet** - Headers de sécurité HTTP
- **Input Validation** - Validation des entrées utilisateur
- **JWT Authentication** - Authentification par tokens

---

## 🚀 Déploiement en production

### Build de production

```bash
# Build Frontend
npm run build

# Build Kiosk
npm run build:kiosk
```

### Variables d'environnement production

Créer `database/.env` avec :
```env
NODE_ENV=production
DB_HOST=votre_serveur_mysql
DB_PASSWORD=mot_de_passe_securise
JWT_SECRET=secret_tres_long_et_aleatoire
```

### Serveur de production

- Utiliser **PM2** ou **systemd** pour gérer les processus
- Configurer **nginx** ou **Apache** comme reverse proxy
- Activer **HTTPS** avec Let's Encrypt

---

## 📞 Support

### En cas de problème

1. **Vérifier les logs** dans la console
2. **Consulter la documentation** dans le projet
3. **Vérifier les issues** connues
4. **Tester la connexion MySQL** : `node database/test-db-simple.js`

### Logs importants

- **Backend** : Logs dans la console du terminal
- **Frontend** : Console du navigateur (F12)
- **Kiosk** : Console du navigateur (F12)

---

## 📝 Notes importantes

### Pour les développeurs

- **Hot Module Replacement (HMR)** : Activé en développement
- **Source Maps** : Désactivés en production
- **Code Splitting** : Activé automatiquement par Vite
- **Tree Shaking** : Activé automatiquement

### Architecture

- **Frontend et Kiosk** sont **complètement isolés**
- **Stores Zustand** séparés (localStorage vs sessionStorage)
- **Routes API** séparées (`/api/*` vs `/api/kiosk/*`)
- **Authentification** séparée pour le kiosk

---

## ✅ Checklist de démarrage

- [ ] Node.js installé (v18+)
- [ ] MySQL installé et démarré
- [ ] Base de données `blossom_cafe` créée
- [ ] Fichier `database/.env` créé et configuré
- [ ] Dépendances installées (`npm install` dans la racine et `database/`)
- [ ] Migrations SQL exécutées
- [ ] Backend démarré et accessible (http://localhost:5000/api/health)
- [ ] Frontend démarré et accessible (http://localhost:3000)
- [ ] Kiosk démarré et accessible (http://localhost:3010)

---

## 🎉 Prêt à démarrer !

Une fois toutes les étapes complétées, vous pouvez démarrer l'application avec :

```bash
npm run start:all
```

Puis accéder à :
- **Application principale** : http://localhost:3000
- **Kiosk** : http://localhost:3010
- **API Health Check** : http://localhost:5000/api/health

**Bon développement ! 🚀**

