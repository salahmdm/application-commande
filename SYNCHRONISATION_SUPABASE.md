# 🔄 Synchronisation MySQL ↔ Supabase

## ✅ Oui, c'est possible !

Il existe plusieurs façons de connecter/synchroniser votre base MySQL avec Supabase :

---

## 📋 Option 1 : Synchronisation Unidirectionnelle (MySQL → Supabase)

**Script créé** : `database/sync-mysql-to-supabase.js`

### Utilisation

```bash
# Synchroniser toutes les tables
cd database
node sync-mysql-to-supabase.js all

# Synchroniser une table spécifique
node sync-mysql-to-supabase.js table users

# Vider Supabase avant de synchroniser
node sync-mysql-to-supabase.js all --clear
```

### Fonctionnalités
- ✅ Synchronise toutes les tables MySQL vers Supabase
- ✅ Gère les conversions de types (dates, buffers, etc.)
- ✅ Synchronisation par batch (évite les timeouts)
- ✅ Utilise `upsert` pour éviter les doublons
- ✅ Logs détaillés

---

## 📋 Option 2 : Synchronisation Bidirectionnelle (MySQL ↔ Supabase)

### Scénario A : MySQL = Source principale
- Les modifications se font dans MySQL
- Script de synchronisation périodique vers Supabase
- Supabase sert de backup/mirror

### Scénario B : Supabase = Source principale
- Les modifications se font dans Supabase
- Script de synchronisation vers MySQL (pour compatibilité)

### Scénario C : Synchronisation en temps réel
- Utiliser des triggers MySQL pour détecter les changements
- Webhook ou script qui synchronise automatiquement

---

## 📋 Option 3 : Migration Complète (Remplacer MySQL)

1. **Migrer le schéma** : Utiliser `schema_supabase_blossom_cafe_*.sql`
2. **Migrer les données** : Utiliser les CSV ou le script de sync
3. **Adapter le code** : Remplacer MySQL par Supabase
4. **Désactiver MySQL** : Une fois tout migré

---

## 📋 Option 4 : Utiliser les deux en parallèle

### Architecture hybride
- **MySQL** : Backend actuel (port 5000)
- **Supabase** : Nouveau backend (pour nouvelles fonctionnalités)
- **Frontend** : Utilise les deux selon le besoin

### Avantages
- Migration progressive
- Pas de downtime
- Test de Supabase en parallèle

---

## 🚀 Script de Synchronisation

### Installation des dépendances

```bash
cd database
npm install @supabase/supabase-js
```

### Configuration

Le script utilise :
- **MySQL** : Configuration depuis `database/config.js`
- **Supabase** : URL et clé depuis `.env.local` ou hardcodée

### Exemple d'utilisation

```bash
# 1. Synchroniser toutes les tables (première fois)
node sync-mysql-to-supabase.js all --clear

# 2. Synchroniser seulement les nouvelles/modifiées (incrémental)
# (nécessite d'adapter le script pour détecter les changements)

# 3. Synchroniser une table spécifique
node sync-mysql-to-supabase.js table products
```

---

## ⚙️ Synchronisation Automatique

### Option A : Cron Job (Linux/Mac)

```bash
# Synchroniser toutes les heures
0 * * * * cd /path/to/project/database && node sync-mysql-to-supabase.js all
```

### Option B : Task Scheduler (Windows)

Créer une tâche planifiée qui exécute :
```powershell
cd C:\Users\Salah\Music\application prise de commande\database
node sync-mysql-to-supabase.js all
```

### Option C : Webhook depuis MySQL

Utiliser un trigger MySQL qui appelle un endpoint qui synchronise.

---

## 📊 Monitoring de la Synchronisation

Le script génère des logs détaillés :
- ✅ Nombre de lignes synchronisées
- ❌ Erreurs éventuelles
- 📊 Statistiques par table

---

## ⚠️ Points d'Attention

1. **Clés primaires** : Doivent être identiques dans les deux bases
2. **Types de données** : Certaines conversions peuvent être nécessaires
3. **Contraintes** : Vérifier que les clés étrangères sont respectées
4. **Performance** : La synchronisation peut prendre du temps pour de grandes tables
5. **Conflits** : Si les deux bases sont modifiées, gérer les conflits

---

## 🔄 Prochaines Étapes

1. **Tester la synchronisation** :
   ```bash
   cd database
   node sync-mysql-to-supabase.js table categories
   ```

2. **Vérifier dans Supabase** : Les données sont-elles bien synchronisées ?

3. **Synchroniser toutes les tables** :
   ```bash
   node sync-mysql-to-supabase.js all
   ```

4. **Mettre en place la synchronisation automatique** (optionnel)

---

## 💡 Recommandation

Pour commencer, je recommande :
1. ✅ Synchroniser une fois toutes les données (migration initiale)
2. ✅ Tester que tout fonctionne avec Supabase
3. ✅ Adapter progressivement le code pour utiliser Supabase
4. ✅ Une fois tout migré, désactiver MySQL

**Voulez-vous que je vous aide à tester la synchronisation maintenant ?**

