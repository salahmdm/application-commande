# Configuration Supabase pour Vercel

## Variables d'environnement dans Vercel

Vous avez correctement configuré :
- ✅ `NEXT_PUBLIC_SUPABASE_URL` : https://crkpunuoliiqyuxtgqlr.supabase.co
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## Corrections apportées

### 1. Backend Node.js (`database/supabase-backend-service.js`)
✅ **Corrigé** : Le backend utilise maintenant `NEXT_PUBLIC_SUPABASE_URL` en fallback
- Cherche d'abord `SUPABASE_URL` (pour compatibilité locale)
- Puis `NEXT_PUBLIC_SUPABASE_URL` (pour Vercel)
- Puis la valeur par défaut

### 2. Frontend (`src/services/supabaseClient.js`)
✅ **Corrigé** : Utilise maintenant `NEXT_PUBLIC_SUPABASE_URL` au lieu d'une valeur en dur

## Vérifications supplémentaires

### Si vous avez un backend Express séparé sur Vercel

Si votre backend Express (`admin-api.js`) tourne sur Vercel via Serverless Functions, assurez-vous que :

1. **Les variables sont accessibles côté serveur** :
   - Les variables `NEXT_PUBLIC_*` sont disponibles côté serveur dans Vercel
   - Mais pour plus de sécurité, vous pouvez aussi ajouter :
     - `SUPABASE_URL` (sans NEXT_PUBLIC_)
     - `SUPABASE_SERVICE_ROLE_KEY` (pour bypass RLS si nécessaire)

2. **Configuration Vercel** :
   - Allez dans votre projet Vercel → Settings → Environment Variables
   - Vérifiez que les variables sont définies pour **Production**, **Preview**, et **Development**

### Recommandation pour la production

Pour plus de sécurité, ajoutez aussi dans Vercel :
- `SUPABASE_SERVICE_ROLE_KEY` : Clé service role (bypass RLS) - **NE JAMAIS exposer côté client**
- Cette clé doit être utilisée uniquement côté serveur

## Test de connexion

Pour vérifier que tout fonctionne :

1. **Frontend** : Les appels depuis le navigateur devraient fonctionner
2. **Backend** : Les routes API devraient pouvoir accéder à Supabase

## Dépannage

Si vous avez encore des erreurs :

1. **Vérifiez les logs Vercel** :
   - Allez dans votre déploiement → Functions → Logs
   - Cherchez les erreurs de connexion Supabase

2. **Vérifiez les variables** :
   ```bash
   # Dans Vercel, les variables NEXT_PUBLIC_* sont disponibles côté serveur
   # Mais vérifiez qu'elles sont bien définies
   ```

3. **Test local avec les mêmes variables** :
   ```bash
   # Créez un .env.local avec les mêmes valeurs
   NEXT_PUBLIC_SUPABASE_URL=https://crkpunuoliiqyuxtgqlr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

## Note importante

⚠️ **RLS (Row Level Security)** : Avec `NEXT_PUBLIC_SUPABASE_ANON_KEY`, les politiques RLS de Supabase s'appliquent. Si vous avez besoin de bypass RLS pour certaines opérations backend, utilisez `SUPABASE_SERVICE_ROLE_KEY` (à ne jamais exposer côté client).

