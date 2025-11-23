# 🔄 Guide de migration des utilisateurs Firebase → Supabase Auth

## ⚠️ Problème actuel

Les utilisateurs Firebase ne peuvent pas se connecter directement car leurs comptes n'existent pas encore dans Supabase Auth.

## ✅ Solutions

### Solution 1 : Utiliser "Mot de passe oublié" (Recommandé)

1. Sur la page de connexion, cliquez sur **"Mot de passe oublié ?"**
2. Entrez votre email
3. Vous recevrez un email de réinitialisation
4. Cliquez sur le lien dans l'email
5. Définissez un nouveau mot de passe
6. Votre compte sera créé automatiquement dans Supabase Auth
7. Vous pourrez ensuite vous connecter

### Solution 2 : Créer un nouveau compte

1. Sur la page de connexion, cliquez sur **"Inscription"**
2. Utilisez le même email que votre compte Firebase
3. Créez un nouveau mot de passe
4. Votre compte sera créé dans Supabase Auth
5. Vos données (rôle, points de fidélité) seront récupérées depuis la table `users` de Supabase

### Solution 3 : Migration automatique (Admin)

Si vous êtes admin, vous pouvez migrer tous les utilisateurs en une fois :

```bash
npm run migrate-firebase-auth
```

⚠️ **Note** : Les utilisateurs devront quand même utiliser "Mot de passe oublié" pour définir leur mot de passe car on ne peut pas récupérer les mots de passe depuis Firebase.

## 📋 Étapes pour chaque utilisateur

1. **Se connecter à l'application**
2. **Cliquer sur "Mot de passe oublié ?"**
3. **Entrer son email**
4. **Vérifier sa boîte email**
5. **Cliquer sur le lien de réinitialisation**
6. **Définir un nouveau mot de passe**
7. **Se connecter avec le nouveau mot de passe**

## 🔍 Vérification

Pour vérifier qu'un utilisateur existe dans Supabase Auth :

1. Aller sur https://supabase.com/dashboard
2. Sélectionner votre projet
3. Aller dans **Authentication** → **Users**
4. Vérifier que l'utilisateur est listé

## ⚙️ Configuration Supabase

Assurez-vous que :
- ✅ L'email de réinitialisation est configuré dans Supabase
- ✅ Les templates d'email sont configurés
- ✅ Le redirect URL est correctement configuré

## 📝 Notes importantes

- Les mots de passe Firebase ne peuvent **pas** être migrés vers Supabase
- Les utilisateurs **doivent** créer un nouveau mot de passe
- Les données utilisateur (rôle, points) sont conservées dans la table `users` de Supabase
- Une fois le compte créé dans Supabase Auth, l'utilisateur peut se connecter normalement

