# 🔧 Résoudre l'erreur "auth/invalid-credential"

## ⚠️ Erreur

```
❌ Firebase Auth - Erreur connexion: auth/invalid-credential
Code: auth/invalid-credential
Message: Email ou mot de passe incorrect
```

## 🔍 Causes possibles

1. **L'utilisateur n'existe pas dans Firebase Authentication**
2. **Le mot de passe est incorrect**
3. **L'email est incorrect ou mal orthographié**

## ✅ Solutions

### Solution 1 : Vérifier que l'utilisateur existe

1. Allez sur [Firebase Console - Authentication](https://console.firebase.google.com/project/prise-de-commande-pos/authentication/users)
2. Vérifiez si l'utilisateur existe dans la liste
3. Si l'utilisateur n'existe pas, créez-le (voir Solution 2)

### Solution 2 : Créer l'utilisateur dans Firebase

Si l'utilisateur n'existe pas, créez-le avec le script :

```bash
npm run create-firebase-user <email> <password>
```

**Exemple** :
```bash
npm run create-firebase-user admin@blossom.com MonMotDePasse123
```

### Solution 3 : Réinitialiser le mot de passe

Si l'utilisateur existe mais que vous avez oublié le mot de passe :

```bash
npm run reset-firebase-password <email>
```

**Exemple** :
```bash
npm run reset-firebase-password admin@blossom.com
```

Un email de réinitialisation sera envoyé à l'adresse email.

### Solution 4 : Créer l'utilisateur manuellement dans Firebase Console

1. Allez sur [Firebase Console - Authentication](https://console.firebase.google.com/project/prise-de-commande-pos/authentication/users)
2. Cliquez sur **"Ajouter un utilisateur"** (Add user)
3. Entrez l'email et le mot de passe
4. Cliquez sur **"Ajouter"** (Add)

### Solution 5 : Vérifier l'orthographe de l'email

Assurez-vous que l'email est correctement orthographié :
- Pas d'espaces avant/après
- Format correct : `email@domaine.com`
- Majuscules/minuscules : Firebase est sensible à la casse pour les emails

## 🔍 Vérification

Pour vérifier qu'un utilisateur existe dans Firebase :

1. Allez sur [Firebase Console - Authentication](https://console.firebase.google.com/project/prise-de-commande-pos/authentication/users)
2. Recherchez l'email dans la liste
3. Si l'utilisateur existe, vous pouvez :
   - Voir son UID
   - Réinitialiser son mot de passe
   - Voir la date de création

## 📋 Utilisateurs par défaut

Selon votre configuration, ces utilisateurs devraient exister :

- **Admin** : `admin@blossom.com` (rôle: `admin`)
- **Manager** : `manager@blossom.com` (rôle: `manager`)
- **Client** : Les autres utilisateurs (rôle: `client`)

## 🚀 Créer tous les utilisateurs nécessaires

Si vous devez créer plusieurs utilisateurs :

```bash
# Créer l'admin
npm run create-firebase-user admin@blossom.com AdminPassword123

# Créer le manager
npm run create-firebase-user manager@blossom.com ManagerPassword123

# Créer un client (exemple)
npm run create-firebase-user client@example.com ClientPassword123
```

## ⚠️ Note importante

Après avoir créé un utilisateur dans Firebase Authentication, vous devez aussi :

1. **Synchroniser avec Supabase** (si vous utilisez la synchronisation) :
   ```bash
   npm run sync-firebase-users
   ```

2. **Vérifier le rôle dans Supabase** :
   ```bash
   npm run update-user-role-supabase admin@blossom.com admin
   npm run update-user-role-supabase manager@blossom.com manager
   ```

## 🔒 Sécurité

- Utilisez des mots de passe forts (au moins 8 caractères, avec majuscules, minuscules, chiffres)
- Ne partagez jamais les mots de passe
- Réinitialisez les mots de passe régulièrement

## 📞 Besoin d'aide ?

Si le problème persiste après avoir essayé ces solutions :

1. Vérifiez que Firebase Authentication est bien activé
2. Vérifiez que la méthode "Email/Password" est activée dans Firebase Console → Authentication → Sign-in method
3. Vérifiez les logs de la console pour plus de détails

