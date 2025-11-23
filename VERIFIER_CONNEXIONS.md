# 🔍 Guide de vérification des connexions

## Tests disponibles

### 1. Test complet de connexion (BDD + Backend)
```powershell
cd database
node test-all-connections.js
```

### 2. Test de connexion à la base de données uniquement
```powershell
cd database
node verify-and-fix-db.js
```

### 3. Test d'authentification (BDD + Backend)
```powershell
cd database
node test-auth.js
```

### 4. Test simple de connexion BDD
```powershell
cd database
node test-db-simple.js
```

## Vérification manuelle

### Base de données MySQL
- **Host:** Localhost (127.0.0.1)
- **Port:** 3306
- **Database:** `blossom_cafe`
- **Config:** `database/.env`

### Backend API
- **URL:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health
- **Port:** 5000

### Frontend
- **URL:** http://localhost:3000
- **Port:** 3000

## Démarrage des serveurs

### Option 1: Démarrer les deux serveurs ensemble
```powershell
npm run start
```

### Option 2: Démarrer séparément

**Terminal 1 - Backend:**
```powershell
npm run backend
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

## Résolution de problèmes

### Port 5000 déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr ":5000" | findstr "LISTENING"

# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F

# Ou tuer tous les processus Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Port 3000 déjà utilisé
```powershell
# Trouver le processus
netstat -ano | findstr ":3000" | findstr "LISTENING"

# Tuer le processus
taskkill /PID <PID> /F
```






