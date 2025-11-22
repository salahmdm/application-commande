# Guide de Push Git - Dépannage

## Erreurs courantes lors du push

### 1. Erreur d'authentification (403)
```
remote: Permission denied to ...
fatal: unable to access 'https://github.com/...': The requested URL returned error: 403
```

**Solution :**
```powershell
# Vérifier les credentials Windows
cmdkey /list

# Supprimer les anciennes credentials si nécessaire
cmdkey /delete:git:https://github.com

# Reconfigurer Git avec votre compte
git config --global user.name "salahmdm"
git config --global user.email "votre-email@example.com"
```

### 2. Erreur de branche distante
```
error: failed to push some refs to 'origin'
hint: Updates were rejected because the remote contains work that you do not have locally
```

**Solution :**
```powershell
# Récupérer les changements distants d'abord
git pull origin main --rebase

# Puis pousser
git push origin main
```

### 3. Erreur de connexion
```
fatal: unable to access 'https://github.com/...': Failed to connect to github.com
```

**Solution :**
- Vérifier votre connexion Internet
- Vérifier les paramètres de proxy si vous en avez un

## Commandes de push standard

```powershell
# 1. Vérifier l'état
git status

# 2. Ajouter les fichiers modifiés
git add .

# 3. Faire un commit
git commit -m "Migration Supabase: schéma et données transférées"

# 4. Pousser vers le dépôt distant
git push origin main
```

## Vérification de la configuration

```powershell
# Vérifier le remote
git remote -v

# Vérifier la branche actuelle
git branch

# Vérifier les credentials
git config --list | findstr user
```

