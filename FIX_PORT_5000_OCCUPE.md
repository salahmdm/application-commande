# 🔧 Résoudre l'erreur "Port 5000 déjà utilisé"

## ❌ Erreur

```
Error: listen EADDRINUSE: address already in use 0.0.0.0:5000
```

Cette erreur signifie qu'un processus utilise déjà le port 5000.

## 🔍 Solutions

### Solution 1 : Trouver et arrêter le processus (recommandé)

#### Étape 1 : Trouver le processus

**Windows PowerShell :**
```powershell
Get-NetTCPConnection -LocalPort 5000 | Select-Object -Property LocalPort, OwningProcess
```

**Windows CMD :**
```cmd
netstat -ano | findstr :5000
```

Vous obtiendrez un **PID** (Process ID), par exemple : `12345`

#### Étape 2 : Arrêter le processus

**Windows PowerShell :**
```powershell
Stop-Process -Id <PID> -Force
```

**Windows CMD :**
```cmd
taskkill /PID <PID> /F
```

**Exemple :**
```powershell
Stop-Process -Id 12345 -Force
```

#### Étape 3 : Redémarrer le serveur

```bash
npm run backend
```

ou

```bash
npm start
```

### Solution 2 : Utiliser un autre port

Si vous ne pouvez pas arrêter le processus, modifiez le port dans la configuration :

1. **Ouvrez** `database/config.js`
2. **Modifiez** le port :
   ```javascript
   server: {
     port: 5001, // Changez de 5000 à 5001 (ou un autre port libre)
     // ...
   }
   ```
3. **Redémarrez** le serveur

### Solution 3 : Vérifier les processus Node.js en cours

Si plusieurs instances de Node.js tournent :

**Windows PowerShell :**
```powershell
Get-Process node | Select-Object Id, ProcessName, Path
```

**Arrêter tous les processus Node.js :**
```powershell
Stop-Process -Name node -Force
```

⚠️ **Attention** : Cela arrêtera **tous** les processus Node.js en cours d'exécution.

### Solution 4 : Redémarrer l'application complètement

1. **Arrêtez** tous les processus Node.js :
   ```powershell
   Stop-Process -Name node -Force
   ```
2. **Attendez** 2-3 secondes
3. **Redémarrez** l'application :
   ```bash
   npm start
   ```

## 🔍 Vérifier que le port est libre

Après avoir arrêté le processus, vérifiez que le port est libre :

**Windows PowerShell :**
```powershell
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
```

Si rien ne s'affiche, le port est libre ✅

## 📝 Commandes utiles

| Commande | Description |
|----------|-------------|
| `Get-NetTCPConnection -LocalPort 5000` | Trouver le processus utilisant le port 5000 |
| `Stop-Process -Id <PID> -Force` | Arrêter un processus par son ID |
| `Get-Process node` | Lister tous les processus Node.js |
| `Stop-Process -Name node -Force` | Arrêter tous les processus Node.js |

## ⚠️ Problèmes courants

### Problème 1 : Le processus ne s'arrête pas

**Solution** : Utilisez l'option `-Force` :
```powershell
Stop-Process -Id <PID> -Force
```

### Problème 2 : Plusieurs processus Node.js

**Solution** : Arrêtez-les tous :
```powershell
Get-Process node | Stop-Process -Force
```

### Problème 3 : Le port est toujours occupé après avoir arrêté le processus

**Solution** : 
1. Attendez 10-20 secondes (le port peut être en état TIME_WAIT)
2. Ou utilisez un autre port (Solution 2)

## 🎯 Après avoir résolu le problème

1. ✅ **Vérifiez** que le port est libre
2. ✅ **Redémarrez** le serveur :
   ```bash
   npm run backend
   ```
3. ✅ **Vérifiez** que le serveur démarre correctement :
   ```
   ✅ Serveur démarré sur http://0.0.0.0:5000
   ```

## 💡 Prévention

Pour éviter ce problème à l'avenir :

1. **Arrêtez** toujours le serveur proprement avec `Ctrl+C`
2. **Vérifiez** qu'aucun processus Node.js ne tourne avant de redémarrer
3. **Utilisez** un gestionnaire de processus comme `pm2` pour gérer les serveurs

