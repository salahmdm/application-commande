# 🚀 Guide de démarrage de l'application

## Démarrage rapide

### Option 1 : Démarrer les serveurs ensemble (Recommandé)
```powershell
npm run start
```
Cette commande démarre automatiquement :
- ✅ **Backend** (port 5000) - API Node.js + MySQL
- ✅ **Frontend** (port 3000) - React + Vite (Application principale)

### Option 1b : Démarrer tous les serveurs (Backend + Frontend + Kiosk)
```powershell
npm run start:all
```
Cette commande démarre :
- ✅ **Backend** (port 5000) - API Node.js + MySQL
- ✅ **Frontend** (port 3000) - React + Vite (Application principale)
- ✅ **Kiosk** (port 3010) - Interface kiosk pour les bornes tactiles

### Option 2 : Démarrer séparément

**Terminal 1 - Backend:**
```powershell
npm run backend
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

**Terminal 3 - Kiosk (optionnel):**
```powershell
npm run dev:kiosk
```

---

## Vérification du démarrage

Une fois démarré, vérifier que les serveurs sont opérationnels :

### 1. Backend API
- URL : http://localhost:5000/api/health
- Doit retourner : `{"status":"OK","message":"API Server is running",...}`

### 2. Frontend
- URL : http://localhost:3000
- Doit afficher l'interface de l'application principale

### 3. Kiosk
- URL : http://localhost:3010
- Doit afficher l'interface kiosk pour les bornes tactiles

---

## Problèmes courants

### ❌ Port 5000 déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr ":5000" | findstr "LISTENING"

# Tuer le processus
taskkill /PID <PID> /F

# Ou tuer tous les processus Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### ❌ Port 3000 déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr ":3000" | findstr "LISTENING"

# Tuer le processus
taskkill /PID <PID> /F
```

### ❌ Erreur de connexion MySQL
Vérifier que :
1. MySQL est démarré
2. Le fichier `database/.env` existe et contient les bonnes valeurs
3. La base de données `blossom_cafe` existe

---

## Configuration requise

### Fichier `database/.env`
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=blossom_cafe
JWT_SECRET=votre_secret_jwt
PORT=5000
```

---

## Scripts disponibles

- `npm run start` : Démarre backend + frontend
- `npm run start:all` : Démarre backend + frontend + kiosk
- `npm run backend` : Démarre uniquement le backend
- `npm run dev` : Démarre uniquement le frontend (port 3000)
- `npm run dev:kiosk` : Démarre uniquement le kiosk (port 3010)
- `npm run build` : Build de production (frontend)
- `npm run build:kiosk` : Build de production (kiosk)
- `npm run lint` : Vérifier le code

---

## Tests de diagnostic

### Test connexion BDD
```powershell
cd database
node test-db-simple.js
```

### Test connexion complète (BDD + Backend)
```powershell
cd database
node test-all-connections.js
```

### Diagnostic rapide
```powershell
cd database
node diagnostic-rapide.js
```

---

## URLs importantes

- **Application principale** : http://localhost:3000
  - Interface pour les clients, managers et administrateurs
  - Gestion des commandes, produits, inventaire, etc.
  
- **Kiosk (Borne tactile)** : http://localhost:3010
  - Interface dédiée pour les bornes tactiles en restaurant
  - Optimisée pour écrans tactiles 27"-32"
  - Workflow simplifié pour la prise de commande
  
- **Backend API** : http://localhost:5000/api
- **Health Check** : http://localhost:5000/api/health

## Différences entre les applications

### Application principale (port 3000)
- Interface complète avec toutes les fonctionnalités
- Gestion des comptes utilisateurs
- Tableau de bord admin/manager
- Gestion des produits et inventaire
- Historique des commandes

### Kiosk (port 3010)
- Interface simplifiée pour les bornes tactiles
- Workflow linéaire : Accueil → Catégories → Produits → Panier → Paiement
- Optimisée pour écrans tactiles
- Pas de gestion de compte (authentification automatique)
- Reset automatique après inactivité





