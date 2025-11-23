# 🔧 Résolution du problème : Port 5000 déjà utilisé

## ❌ Erreur
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```

## 🔍 Cause
Un processus Node.js utilise déjà le port 5000 (backend).

## ✅ Solutions

### Solution 1 : Script PowerShell automatique (Recommandé)

```powershell
.\kill-servers.ps1
```

Ce script :
- ✅ Trouve tous les processus Node.js
- ✅ Les arrête automatiquement
- ✅ Vérifie que les ports sont libres

### Solution 2 : Arrêt manuel

**Étape 1 : Trouver le processus qui utilise le port 5000**
```powershell
netstat -ano | findstr ":5000" | findstr "LISTENING"
```
Note le PID (Process ID) affiché dans la dernière colonne.

**Étape 2 : Arrêter le processus**
```powershell
taskkill /PID <PID> /F
```
Remplace `<PID>` par le numéro trouvé à l'étape 1.

**Étape 3 : Ou arrêter tous les processus Node.js**
```powershell
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### Solution 3 : Redémarrer l'application

Après avoir libéré les ports, redémarre l'application :
```powershell
npm run start
```

---

## ⚠️ Avertissement SESSION_SECRET

L'avertissement `SESSION_SECRET non défini dans .env` n'est pas bloquant, mais tu peux le corriger :

**Dans `database/.env`, ajoute :**
```env
SESSION_SECRET=ton_secret_session_aleatoire
```

Ou laisse le système générer un secret automatiquement (non recommandé pour la production).

---

## 🔄 Après résolution

Une fois les ports libres, tu peux démarrer l'application :

```powershell
npm run start
```

Vérifie que les serveurs démarrent correctement :
- ✅ Backend : http://localhost:5000/api/health
- ✅ Frontend : http://localhost:3000






