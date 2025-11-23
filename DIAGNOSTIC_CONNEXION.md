# 🔍 Diagnostic de connexion API + BDD

## Problèmes courants et solutions

### ❌ Problème 1 : Backend ne peut pas se connecter à MySQL

**Symptômes :**
- Erreur : `❌ Erreur de connexion MySQL: ...`
- Le backend démarre mais ne peut pas accéder à la BDD
- Les requêtes API échouent

**Solutions :**

1. **Vérifier que le fichier `.env` existe :**
   ```powershell
   cd database
   dir .env
   ```

2. **Si le fichier n'existe pas, le créer :**
   ```powershell
   cd database
   copy env.example.txt .env
   # Puis éditer .env avec vos identifiants MySQL
   ```

3. **Vérifier les variables d'environnement dans `.env` :**
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=blossom_cafe
   ```

4. **Vérifier que MySQL est démarré :**
   - Windows : Vérifier dans les Services Windows
   - Ou : `mysql -u root -p` pour tester la connexion

5. **Tester la connexion manuellement :**
   ```powershell
   cd database
   node test-db-simple.js
   ```

---

### ❌ Problème 2 : Backend ne démarre pas (port 5000 utilisé)

**Symptômes :**
- Erreur : `Error: listen EADDRINUSE: address already in use 0.0.0.0:5000`
- Le backend ne peut pas démarrer

**Solutions :**

1. **Trouver le processus qui utilise le port 5000 :**
   ```powershell
   netstat -ano | findstr ":5000" | findstr "LISTENING"
   ```

2. **Tuer le processus :**
   ```powershell
   taskkill /PID <PID> /F
   ```

3. **Ou tuer tous les processus Node.js :**
   ```powershell
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```

4. **Relancer le backend :**
   ```powershell
   npm run backend
   ```

---

### ❌ Problème 3 : Frontend ne peut pas se connecter au Backend

**Symptômes :**
- Erreur dans la console : `Failed to fetch` ou `NetworkError`
- Erreur : `Impossible de se connecter au serveur`
- Les requêtes API échouent depuis le frontend

**Solutions :**

1. **Vérifier que le backend est démarré :**
   ```powershell
   netstat -ano | findstr ":5000" | findstr "LISTENING"
   ```

2. **Tester le backend manuellement :**
   - Ouvrir : http://localhost:5000/api/health
   - Doit retourner : `{"status":"OK",...}`

3. **Vérifier l'URL dans le frontend :**
   - Fichier : `src/services/api.js`
   - Ligne 22 : `const API_BASE_URL = 'http://localhost:5000/api';`

4. **Vérifier la configuration CORS :**
   - Fichier : `database/admin-api.js`
   - Ligne 128-146 : Configuration CORS avec `credentials: true`

5. **Démarrer le backend :**
   ```powershell
   npm run backend
   ```

---

### ❌ Problème 4 : Base de données n'existe pas

**Symptômes :**
- Erreur : `Unknown database 'blossom_cafe'`
- La connexion MySQL fonctionne mais la base de données est introuvable

**Solutions :**

1. **Créer la base de données :**
   ```sql
   CREATE DATABASE blossom_cafe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **Ou utiliser le script de migration :**
   ```powershell
   cd database
   node migrations/create-tables.js
   ```

---

## Tests de diagnostic

### Test 1 : Base de données MySQL
```powershell
cd database
node test-db-simple.js
```

### Test 2 : Backend API
```powershell
# Dans un navigateur ou avec curl
curl http://localhost:5000/api/health
```

### Test 3 : Connexion complète (BDD + Backend)
```powershell
cd database
node test-all-connections.js
```

---

## Démarrage correct

### Option 1 : Démarrer les deux serveurs ensemble
```powershell
npm run start
```

### Option 2 : Démarrer séparément

**Terminal 1 - Backend:**
```powershell
npm run backend
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

---

## Vérification finale

Une fois les serveurs démarrés, vérifier :

1. ✅ **Backend accessible** : http://localhost:5000/api/health
2. ✅ **Frontend accessible** : http://localhost:3000
3. ✅ **Base de données connectée** : Vérifier dans les logs du backend
4. ✅ **API fonctionne** : Tester une requête depuis le frontend

---

## Commandes utiles

```powershell
# Vérifier les ports utilisés
netstat -ano | findstr "LISTENING" | findstr ":3000 :5000"

# Vérifier les processus Node.js
Get-Process -Name node

# Tuer tous les processus Node.js
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Tester la connexion MySQL
mysql -u root -p
# Puis : USE blossom_cafe; SHOW TABLES;
```






