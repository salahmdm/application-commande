# 🚀 Démarrer le serveur local

## ❌ Problème : Page indisponible sur http://localhost:3000/

Cela signifie que le serveur de développement n'est **pas démarré**.

## ✅ Solution : Démarrer le serveur

### Méthode 1 : Frontend uniquement (recommandé pour tester Supabase)

Ouvrez un **nouveau terminal** dans le dossier du projet et exécutez :

```bash
npm run dev
```

Le serveur devrait démarrer et afficher :
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Méthode 2 : Frontend + Backend

Si vous avez besoin du backend aussi :

```bash
npm start
```

Cela démarre :
- **Backend** sur le port 5000
- **Frontend** sur le port 3000

### Méthode 3 : Tout (Frontend + Backend + Kiosk)

```bash
npm run start:all
```

## 🔍 Vérifier que le serveur fonctionne

1. **Attendez** que le serveur démarre (vous verrez les messages dans le terminal)
2. **Ouvrez** http://localhost:3000 dans votre navigateur
3. **Vous devriez voir** l'application se charger

## ⚠️ Problèmes courants

### Problème 1 : Port 3000 déjà utilisé

**Erreur** : `Port 3000 is already in use`

**Solution** :
```powershell
# Trouver le processus
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Arrêter le processus (remplacez <PID> par le numéro trouvé)
Stop-Process -Id <PID> -Force
```

### Problème 2 : Module non trouvé

**Erreur** : `Cannot find module 'xxx'`

**Solution** :
```bash
npm install
```

### Problème 3 : Le serveur démarre mais la page ne charge pas

**Vérifications** :
1. **Vérifiez** que le serveur est bien démarré (messages dans le terminal)
2. **Vérifiez** l'URL : http://localhost:3000 (pas https)
3. **Vérifiez** la console du navigateur (F12) pour voir les erreurs
4. **Essayez** de recharger la page (Ctrl+F5)

### Problème 4 : Erreurs de compilation

**Symptôme** : Le serveur démarre mais affiche des erreurs

**Solution** :
1. **Vérifiez** les erreurs dans le terminal
2. **Corrigez** les erreurs de syntaxe
3. **Redémarrez** le serveur

## 📝 Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer le serveur de développement (port 3000) |
| `npm start` | Démarrer frontend + backend |
| `npm run start:all` | Démarrer frontend + backend + kiosk |
| `Ctrl+C` | Arrêter le serveur |

## 🎯 Après le démarrage

Une fois le serveur démarré :

1. ✅ **Ouvrez** http://localhost:3000
2. ✅ **Testez Supabase** dans la console :
   ```javascript
   testSupabaseConnection()
   ```
3. ✅ **Testez Firebase** dans la console :
   ```javascript
   testFirebaseConnection()
   ```

## 💡 Note importante

- Le serveur doit **rester en cours d'exécution** dans le terminal
- **Ne fermez pas** le terminal tant que vous utilisez l'application
- Les modifications du code sont **rechargées automatiquement** (hot reload)
- Pour arrêter le serveur, appuyez sur **Ctrl+C** dans le terminal

