# 🔍 Vérification Configuration Supabase - Authentification

## Problème Signalé

✅ **Application fonctionne en invité** (pas de problème avec les routes publiques)  
❌ **Impossible de se connecter** (problème avec l'authentification)

## Points de Vérification

### 1. Configuration Backend Supabase

Le backend utilise `database/supabase-backend-service.js` qui lit :
- `SUPABASE_URL` ou `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_KEY` ou `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Valeurs par défaut hardcodées** (si variables non définies) :
- URL : `https://brygzpxiemwthickhuqb.supabase.co`
- Key : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key)

⚠️ **IMPORTANT** : Le backend devrait utiliser **SERVICE_ROLE_KEY** pour bypass RLS, pas l'anon key.

### 2. Vérification Variables d'Environnement Backend

Dans `database/.env`, vérifiez :

```env
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

**Où trouver la SERVICE_ROLE_KEY** :
1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Settings → API
4. Copiez la **"service_role" key** (⚠️ SECRET, ne jamais exposer au frontend)

### 3. Politiques RLS (Row Level Security)

Vérifiez que les politiques RLS permettent au backend de lire la table `users` :

**Dans Supabase Dashboard** :
1. Table Editor → `users`
2. Authentication → Policies
3. Vérifiez qu'il y a une policy pour SELECT sur `users`

**Policy recommandée pour le backend** :
```sql
-- Le backend utilise SERVICE_ROLE_KEY qui bypass RLS automatiquement
-- Mais si vous utilisez ANON_KEY, vous devez avoir cette policy :

CREATE POLICY "Allow public read access to users"
ON users FOR SELECT
USING (true);
```

### 4. Structure Table Users

Vérifiez que la table `users` a les colonnes nécessaires :
- `id` (SERIAL)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `role` (VARCHAR: 'client', 'manager', 'admin', 'kiosk')
- `is_active` (SMALLINT: 0 ou 1)

### 5. Vérification Utilisateur Existant

**Test dans Supabase Dashboard** :
1. Table Editor → `users`
2. Vérifiez qu'il y a des utilisateurs
3. Vérifiez qu'un utilisateur a :
   - `is_active = 1`
   - `password_hash` non vide
   - `email` valide

### 6. Test de Connexion Backend → Supabase

**Créer un script de test** (`database/test-supabase-connection.js`) :

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './database/.env' });

const supabaseUrl = process.env.SUPABASE_URL || 'https://brygzpxiemwthickhuqb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

console.log('🔍 Test connexion Supabase');
console.log('URL:', supabaseUrl);
console.log('Key présent:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    // Test 1: Lire les utilisateurs
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, is_active')
      .limit(5);
    
    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return;
    }
    
    console.log('✅ Connexion réussie');
    console.log('Utilisateurs trouvés:', users.length);
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - Active: ${u.is_active}`);
    });
    
    // Test 2: Chercher un utilisateur spécifique
    const testEmail = 'admin@example.com'; // Remplacez par un email de test
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .eq('is_active', 1)
      .maybeSingle();
    
    if (userError) {
      console.error('❌ Erreur recherche utilisateur:', userError);
    } else if (user) {
      console.log('✅ Utilisateur trouvé:', user.email);
      console.log('  - ID:', user.id);
      console.log('  - Role:', user.role);
      console.log('  - Password hash présent:', !!user.password_hash);
    } else {
      console.log('⚠️ Utilisateur non trouvé:', testEmail);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

test();
```

**Exécuter** :
```bash
cd database
node test-supabase-connection.js
```

### 7. Logs Backend

**Vérifier les logs lors d'une tentative de connexion** :

1. Démarrez le backend : `npm run backend`
2. Tentez de vous connecter depuis le frontend
3. Regardez les logs du backend :
   - `🔐 Login attempt`
   - `Using Supabase client for login query`
   - `Supabase query result`
   - `User found` ou `No user found`

### 8. Erreurs Courantes

#### Erreur : "Configuration Supabase incorrecte"
- **Cause** : `pool.getClient()` n'existe pas
- **Solution** : Vérifier que `database/admin-api.js` utilise bien `supabaseService`

#### Erreur : "Email ou mot de passe incorrect"
- **Causes possibles** :
  1. Utilisateur n'existe pas dans Supabase
  2. `is_active = 0` (utilisateur désactivé)
  3. Email ne correspond pas exactement (casse, espaces)
  4. Password hash incorrect ou manquant

#### Erreur : "RLS policy violation"
- **Cause** : Le backend utilise ANON_KEY au lieu de SERVICE_ROLE_KEY
- **Solution** : Utiliser `SUPABASE_SERVICE_ROLE_KEY` dans `database/.env`

#### Erreur : "Cannot read property 'getClient' of undefined"
- **Cause** : `pool` n'est pas correctement initialisé
- **Solution** : Vérifier que `pool = supabaseService` dans `admin-api.js`

## Checklist de Vérification

- [ ] Variables d'environnement configurées dans `database/.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` utilisé (pas ANON_KEY)
- [ ] Table `users` existe dans Supabase
- [ ] Utilisateurs existent avec `is_active = 1`
- [ ] `password_hash` présent pour les utilisateurs
- [ ] RLS activé avec policy permettant la lecture
- [ ] Backend peut se connecter à Supabase (test script)
- [ ] Logs backend montrent les requêtes Supabase
- [ ] Email normalisé (lowercase, trim) dans le code

## Actions Correctives

### Si le backend n'utilise pas SERVICE_ROLE_KEY :

1. **Récupérer la SERVICE_ROLE_KEY** :
   - Supabase Dashboard → Settings → API
   - Copier la "service_role" key

2. **Ajouter dans `database/.env`** :
   ```env
   SUPABASE_URL=https://votre-projet.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
   ```

3. **Vérifier `database/supabase-backend-service.js`** :
   - Ligne 23 : Doit utiliser `SUPABASE_SERVICE_ROLE_KEY` en priorité

### Si les utilisateurs n'existent pas :

1. **Créer un utilisateur admin** :
   ```sql
   INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
   VALUES (
     'admin@example.com',
     '$2b$12$...', -- Hash bcrypt du mot de passe
     'Admin',
     'User',
     'admin',
     1
   );
   ```

2. **Ou utiliser le script de création** :
   - Vérifier s'il existe un script dans `database/scripts/`

### Si RLS bloque les requêtes :

1. **Option 1** : Utiliser SERVICE_ROLE_KEY (recommandé)
   - Bypass automatique de RLS

2. **Option 2** : Créer une policy permissive :
   ```sql
   CREATE POLICY "Allow service role to read users"
   ON users FOR SELECT
   USING (true);
   ```

## Test Final

Après corrections, tester :

1. **Backend** : `npm run backend`
2. **Frontend** : `npm run dev`
3. **Tentative de connexion** avec un utilisateur existant
4. **Vérifier les logs** backend et frontend
5. **Vérifier la console** navigateur (F12) pour les erreurs

## Support

Si le problème persiste après ces vérifications :
1. Partager les logs backend lors d'une tentative de connexion
2. Partager les erreurs de la console navigateur
3. Vérifier que Supabase est accessible depuis le backend

