# Analyse des paramètres du pool MySQL pour Blossom Café

## 📊 Caractéristiques de l'application

### Requêtes complexes identifiées
- **157 appels** à `pool.query` dans `admin-api.js`
- **58 requêtes** avec `JSON_ARRAYAGG`, `LEFT JOIN`, `GROUP BY`
- **Requête la plus lourde** : `/api/admin/orders` avec :
  - Plusieurs sous-requêtes `JSON_ARRAYAGG`
  - `LEFT JOIN` sur users, products, categories
  - Pagination avec `LIMIT/OFFSET`
- **Dashboard** : Requête avec **20+ sous-requêtes SELECT** pour les statistiques

### Patterns d'utilisation
1. **Managers** (1-3 simultanés) :
   - Dashboard ouvert en permanence
   - Requêtes complexes toutes les X secondes
   - WebSocket pour mises à jour temps réel
   - Polling de fallback toutes les 30s si WebSocket déconnecté

2. **Clients** :
   - Requêtes simples (GET /api/products, /api/categories)
   - Création de commandes (INSERT)
   - Consultation historique

3. **Pics de charge** :
   - Ouverture du dashboard manager (requête très lourde)
   - Rafraîchissement manuel des commandes
   - Statistiques du dashboard

## ⚠️ Problèmes potentiels avec les paramètres actuels

### 1. `connectionLimit: 20 (dev) / 50 (prod)`
**Risque** : Insuffisant si :
- 3 managers + 10-20 clients simultanés = 13-23 connexions
- Requêtes complexes qui prennent 5-10 secondes
- Polling de fallback toutes les 30s = connexions supplémentaires

**Recommandation** : 
- Dev : **30-35 connexions** (marge pour tests)
- Prod : **60-70 connexions** (marge pour pics de charge)

### 2. `timeout: 30s (prod) / 60s (dev)`
**Risque** : Trop court pour :
- Requêtes avec `JSON_ARRAYAGG` sur beaucoup de données (peut prendre 10-20s)
- Dashboard avec 20+ sous-requêtes (peut prendre 15-25s)
- Requêtes statistiques complexes

**Recommandation** :
- Dev : **90s** (plus permissif pour le développement)
- Prod : **60s** (équilibré entre performance et timeout)

### 3. `queueLimit: 100`
**OK** mais peut être augmenté pour gérer les pics

**Recommandation** : **150** (marge supplémentaire)

## ✅ Paramètres recommandés

### Développement
```env
DB_CONNECTION_LIMIT=35
DB_QUEUE_LIMIT=150
DB_ACQUIRE_TIMEOUT=60000
DB_CONNECT_TIMEOUT=10000
DB_QUERY_TIMEOUT=90000  # 90s pour requêtes complexes
DB_IDLE_TIMEOUT=14400000
```

### Production
```env
DB_CONNECTION_LIMIT=70
DB_QUEUE_LIMIT=150
DB_ACQUIRE_TIMEOUT=30000
DB_CONNECT_TIMEOUT=5000
DB_QUERY_TIMEOUT=60000  # 60s pour requêtes complexes
DB_IDLE_TIMEOUT=28800000
```

## 📈 Justification

1. **ConnectionLimit augmenté** :
   - Gère 3-5 managers + 20-30 clients simultanés
   - Marge pour requêtes longues et polling
   - Évite les erreurs "Too many connections"

2. **Timeout augmenté** :
   - Permet aux requêtes complexes de se terminer
   - Évite les timeouts prématurés sur `/api/admin/orders`
   - Dashboard peut charger complètement

3. **QueueLimit augmenté** :
   - Gère les pics de charge (ouverture simultanée de plusieurs dashboards)
   - Évite les erreurs "Queue limit exceeded"

## 🔍 Monitoring recommandé

Surveiller via `/api/db/status` :
- `utilization` : Doit rester < 80%
- `queued` : Doit rester < 50 en temps normal
- `errors` : Doit rester à 0

Si `utilization > 80%` régulièrement → Augmenter `DB_CONNECTION_LIMIT`
Si `queued > 50` régulièrement → Augmenter `DB_QUEUE_LIMIT`

