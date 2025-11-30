# 🚨 Rapport d'Incohérences Critiques MySQL/Supabase

## ❌ ERREURS RUNTIME DÉTECTÉES

### 1. **Transactions MySQL (`getConnection`, `beginTransaction`, `commit`, `rollback`)**
**Fichiers**: `database/admin-api.js` lignes 1481, 1943, 2181, etc.
**Problème**: 
- `pool.getConnection()` n'existe pas dans `supabaseService`
- `connection.beginTransaction()`, `connection.commit()`, `connection.rollback()` n'existent pas
- Supabase ne supporte pas les transactions de la même manière que MySQL

**Impact**: ❌ **ERREUR RUNTIME** - Ces appels vont planter
**Endpoints affectés**:
- `POST /api/kiosk/orders` (ligne 1481)
- `POST /api/orders` (ligne 1943)
- Protection ultime dans création commande (ligne 2181)

**Solution**: 
- Supabase supporte les transactions via RPC ou en utilisant plusieurs appels
- Pour l'instant, supprimer les transactions ou les remplacer par des appels Supabase directs

### 2. **Endpoint `/api/db/status` - `poolMonitor`**
**Fichier**: `database/admin-api.js` ligne 434 (CORRIGÉ ✅)
**Problème**: Utilisait `poolMonitor.getSummary()` qui n'existe plus
**Solution**: ✅ CORRIGÉ - Utilise maintenant `supabaseService.ping()`

### 3. **Endpoint `/api/db/status` - `information_schema`**
**Fichier**: `database/admin-api.js` ligne 428 (CORRIGÉ ✅)
**Problème**: Tentait d'utiliser `information_schema.TABLES` (spécifique MySQL)
**Solution**: ✅ CORRIGÉ - Supprimé, Supabase utilise une structure différente

## ⚠️ INCOHÉRENCES NON-CRITIQUES

### 1. **Fallback MySQL dans Login**
**Fichier**: `database/admin-api.js` lignes 834-841 (CORRIGÉ ✅)
**Problème**: Code de fallback MySQL qui ne sera jamais exécuté
**Solution**: ✅ CORRIGÉ - Remplacé par erreur si configuration incorrecte

### 2. **Logs mentionnant MySQL**
**Fichier**: `database/admin-api.js` lignes 2162, 2191 (CORRIGÉ ✅)
**Problème**: Logs mentionnent "MySQL" au lieu de "Supabase"
**Solution**: ✅ CORRIGÉ - Logs mis à jour

## 📊 ÉTAT ACTUEL

### ✅ CORRIGÉ
- Endpoint `/api/db/status` - poolMonitor
- Endpoint `/api/db/status` - information_schema
- Fallback MySQL dans login
- Logs mentionnant MySQL

### ❌ À CORRIGER URGENTEMENT
- **Transactions MySQL** dans création de commandes (2 endpoints)
  - `POST /api/kiosk/orders`
  - `POST /api/orders`

## 🎯 ACTIONS REQUISES

### URGENT
1. **Supprimer ou remplacer les transactions MySQL** dans les endpoints de création de commandes
2. **Tester** que les commandes se créent correctement sans transactions

### RECOMMANDÉ
3. Migrer progressivement les autres endpoints vers méthodes natives Supabase
4. Documenter que la configuration MySQL dans `config.js` est uniquement pour scripts de migration

