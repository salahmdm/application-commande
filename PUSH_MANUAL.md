# Guide de Push Git - Commandes Manuelles

## Option 1 : Commandes Git Directes (Recommandé)

Exécutez ces commandes une par une dans PowerShell :

```powershell
# 1. Vérifier l'état
git status

# 2. Ajouter tous les fichiers modifiés
git add .

# 3. Créer un commit
git commit -m "Migration Supabase: schéma et données transférées"

# 4. Pousser vers GitHub
git push origin main
```

## Option 2 : Activer l'exécution de scripts PowerShell

Si vous voulez utiliser le script `push-changes.ps1`, vous devez d'abord activer l'exécution de scripts :

```powershell
# Ouvrir PowerShell en tant qu'Administrateur, puis :
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Note :** Cette commande nécessite des droits administrateur.

## Si vous avez une erreur lors du push

### Erreur 403 (Permission denied)
```powershell
# Vérifier les credentials Windows
cmdkey /list

# Supprimer les anciennes credentials GitHub
cmdkey /delete:git:https://github.com

# Le prochain push demandera vos identifiants
git push origin main
```

### Erreur "Updates were rejected"
```powershell
# Récupérer les changements distants d'abord
git pull origin main --rebase

# Puis pousser
git push origin main
```

### Erreur de connexion
- Vérifiez votre connexion Internet
- Vérifiez si vous êtes derrière un proxy

## Vérification rapide

```powershell
# Vérifier la configuration Git
git config --list | Select-String user

# Vérifier le remote
git remote -v

# Vérifier la branche actuelle
git branch
```

