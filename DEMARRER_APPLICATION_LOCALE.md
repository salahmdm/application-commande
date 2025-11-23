# 🚀 Démarrer l'application en local

## 📋 Prérequis

1. **Node.js** installé (version 18 ou supérieure)
2. **npm** installé
3. **Dépendances** installées

## 🔧 Installation des dépendances

Si vous n'avez pas encore installé les dépendances :

```bash
npm install
```

## 🚀 Démarrer le serveur de développement

### Option 1 : Frontend uniquement (recommandé pour tester Supabase)

```bash
npm run dev
```

Le serveur démarre sur **http://localhost:3000**

### Option 2 : Frontend + Backend

```bash
npm start
```

Démarre :
- **Backend** sur le port 5000
- **Frontend** sur le port 3000

### Option 3 : Tout (Frontend + Backend + Kiosk)

```bash
npm run start:all
```

## ✅ Vérifier que le serveur fonctionne

1. **Ouvrez** http://localhost:3000 dans votre navigateur
2. **Vous devriez voir** l'application se charger
3. **Ouvrez la console** (F12) pour voir les logs

## 🔍 Problèmes courants

### Problème 1 : Port 3000 déjà utilisé

**Erreur** : `Port 3000 is already in use`

**Solution** :
1. **Trouvez** le processus qui utilise le port :
   ```bash
   netstat -ano | findstr :3000
   ```
2. **Arrêtez** le processus (remplacez PID par le numéro trouvé) :
   ```bash
   taskkill /PID <PID> /F
   ```
3. **Redémarrez** le serveur :
   ```bash
   npm run dev
   ```

### Problème 2 : Module non trouvé

**Erreur** : `Cannot find module 'xxx'`

**Solution** :
```bash
npm install
```

### Problème 3 : Variables d'environnement manquantes

**Symptôme** : L'application démarre mais ne peut pas se connecter à Supabase

**Solution** : Créez un fichier `.env` à la racine du projet :

```env
VITE_SUPABASE_URL=https://brygzpxiemwthickhuqb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyeWd6cHhpZW13dGhpY2todXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzcxMjAsImV4cCI6MjA3OTQxMzEyMH0.4zQVUddszbsFu168NsQ7C1YiwmsPc_Tni48fY2otR1A
```

**Note** : Si vous ne créez pas le fichier `.env`, l'application utilisera les valeurs par défaut codées en dur dans le code.

### Problème 4 : Erreurs de connexion WebSocket

**Erreur** : `WebSocket connection to 'ws://localhost:3000/...' failed`

**Solution** : C'est normal si vous accédez à l'application déployée sur Vercel. Ces erreurs peuvent être ignorées. Si vous êtes en local, assurez-vous que le serveur est bien démarré.

## 📝 Commandes utiles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer le serveur de développement (port 3000) |
| `npm run build` | Construire l'application pour la production |
| `npm run preview` | Prévisualiser la version de production |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm start` | Démarrer frontend + backend |
| `npm run start:all` | Démarrer frontend + backend + kiosk |

## 🎯 Après le démarrage

Une fois le serveur démarré :

1. **Ouvrez** http://localhost:3000
2. **Testez Supabase** dans la console :
   ```javascript
   testSupabaseConnection()
   ```
3. **Vérifiez** que les données s'affichent correctement

## ⚠️ Note importante

- Le serveur doit rester **en cours d'exécution** pour que l'application fonctionne
- Pour arrêter le serveur, appuyez sur **Ctrl+C** dans le terminal
- Les modifications du code sont **rechargées automatiquement** (hot reload)

