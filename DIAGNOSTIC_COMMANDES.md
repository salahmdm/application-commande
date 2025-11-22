# 🔍 DIAGNOSTIC - Commandes non affichées dans "Gestion des commandes"

## Liste exhaustive des causes possibles

### ✅ À VÉRIFIER UNE PAR UNE

---

## 1. 🔌 CONNEXION BACKEND
- [ ] Le serveur backend est-il démarré sur le port 5000 ?
- [ ] Y a-t-il des erreurs dans les logs du backend ?
- [ ] Le frontend peut-il atteindre `http://localhost:5000/api/admin/orders` ?
- [ ] Y a-t-il des erreurs CORS dans la console du navigateur ?

---

## 2. 🔐 AUTHENTIFICATION & AUTORISATION
- [ ] L'utilisateur est-il connecté ?
- [ ] L'utilisateur a-t-il le rôle `manager` ou `admin` ?
- [ ] Le token d'authentification est-il valide ?
- [ ] Le token est-il envoyé dans les headers de la requête ?
- [ ] Y a-t-il une erreur 401 (Non autorisé) ou 403 (Accès refusé) ?
- [ ] Le middleware `devBypass` fonctionne-t-il en développement ?

---

## 3. 🗄️ BASE DE DONNÉES
- [ ] MySQL est-il démarré ?
- [ ] La connexion à la base de données fonctionne-t-elle ?
- [ ] Y a-t-il des commandes dans la table `orders` ?
- [ ] Les commandes ont-elles un statut valide (pending, preparing, ready, etc.) ?
- [ ] Y a-t-il des erreurs SQL dans les logs du backend ?
- [ ] La requête SQL s'exécute-t-elle sans erreur ?

---

## 4. 📡 REQUÊTE API
- [ ] La requête `GET /api/admin/orders` est-elle appelée ?
- [ ] Quelle est la réponse HTTP (200, 400, 500, etc.) ?
- [ ] Le format de la réponse est-il correct (`{ success: true, data: [...] }`) ?
- [ ] Y a-t-il des erreurs dans la console du navigateur (Network tab) ?
- [ ] Le timeout de 6 secondes est-il dépassé ?

---

## 5. 🔄 CACHE
- [ ] Le cache contient-il des données obsolètes ?
- [ ] Le cache est-il vidé correctement ?
- [ ] Le cache retourne-t-il un tableau vide `[]` ?

---

## 6. 📦 PARSING DES DONNÉES
- [ ] Les données reçues sont-elles au bon format ?
- [ ] Le champ `response.success` est-il `true` ?
- [ ] Le champ `response.data` est-il un tableau ?
- [ ] Les items des commandes sont-ils correctement parsés ?
- [ ] Y a-t-il des erreurs lors du parsing JSON ?

---

## 7. 🎨 AFFICHAGE FRONTEND
- [ ] Le composant `ManagerDashboard` est-il monté ?
- [ ] La fonction `loadAllOrders` est-elle appelée ?
- [ ] Le state `orders` est-il mis à jour ?
- [ ] Y a-t-il des filtres qui excluent toutes les commandes ?
- [ ] La fonction `filterAndSearch` filtre-t-elle toutes les commandes ?
- [ ] Le tri `smartSort` exclut-il des commandes ?

---

## 8. 🐛 ERREURS JAVASCRIPT
- [ ] Y a-t-il des erreurs dans la console du navigateur ?
- [ ] Y a-t-il des erreurs React (erreurs de rendu) ?
- [ ] Y a-t-il des warnings dans la console ?

---

## 9. 🔧 CONFIGURATION
- [ ] L'URL de l'API backend est-elle correcte dans `.env` ?
- [ ] Les variables d'environnement sont-elles chargées ?
- [ ] Le mode développement/production est-il correct ?

---

## 10. 📊 DONNÉES
- [ ] Les commandes dans la BDD ont-elles un `status` valide ?
- [ ] Les commandes ont-elles des `order_items` associés ?
- [ ] Les commandes ont-elles un `user_id` valide ?
- [ ] Y a-t-il des commandes avec `status = 'cancelled'` qui sont filtrées ?

---

## PROTOCOLE DE VÉRIFICATION

### Étape 1 : Vérifier les logs backend
```bash
# Dans le terminal du backend, vérifier les logs lors de l'appel à /api/admin/orders
```

### Étape 2 : Vérifier la console navigateur
```javascript
// Ouvrir la console (F12) et vérifier :
// - Les requêtes réseau (Network tab)
// - Les erreurs JavaScript
// - Les logs console.log
```

### Étape 3 : Tester l'endpoint directement
```bash
# Tester avec curl ou Postman
curl http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Cookie: token=YOUR_COOKIE"
```

### Étape 4 : Vérifier la base de données
```sql
-- Vérifier qu'il y a des commandes
SELECT COUNT(*) FROM orders;

-- Vérifier les statuts
SELECT status, COUNT(*) FROM orders GROUP BY status;

-- Vérifier une commande complète
SELECT o.*, COUNT(oi.id) as items_count 
FROM orders o 
LEFT JOIN order_items oi ON oi.order_id = o.id 
GROUP BY o.id 
LIMIT 5;
```

