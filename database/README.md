# 📊 Base de données Blossom Café

Documentation complète de la base de données MySQL pour l'application Blossom Café PWA.

## 📁 Contenu du dossier

| Fichier | Description |
|---------|-------------|
| `blossom_cafe_schema.sql` | **Script SQL complet** pour créer la base de données |
| `INSTALLATION.md` | **Guide d'installation détaillé** étape par étape |
| `SCHEMA_DIAGRAM.md` | **Diagrammes et documentation** de la structure |
| `install.ps1` | **Script PowerShell** pour installation automatique (Windows) |
| `README.md` | Ce fichier |

## 🚀 Installation rapide

### Option 1 : Script PowerShell automatique (recommandé pour Windows)

```powershell
cd database
.\install.ps1
```

Le script vous demandera :
- Le mot de passe MySQL root
- Trouvera automatiquement mysql.exe
- Créera la base de données
- Insérera les données de test

### Option 2 : MySQL Workbench (méthode graphique)

1. Ouvrez MySQL Workbench
2. Connectez-vous à votre serveur local (127.0.0.1:3306)
3. Menu `File` → `Open SQL Script...`
4. Sélectionnez `blossom_cafe_schema.sql`
5. Cliquez sur ⚡ Execute (ou Ctrl+Shift+Enter)

### Option 3 : Ligne de commande

```bash
mysql -u root -p < blossom_cafe_schema.sql
```

## 📊 Structure de la base de données

### 13 Tables principales

| Table | Description | Lignes |
|-------|-------------|--------|
| **users** | Utilisateurs (clients, managers, admins) | 5 |
| **categories** | Catégories de produits | 5 |
| **products** | Catalogue de produits | 14 |
| **orders** | Commandes clients | 4 |
| **order_items** | Détails des commandes | 12 |
| **promo_codes** | Codes promotionnels | 4 |
| **favorites** | Favoris des utilisateurs | 7 |
| **loyalty_transactions** | Historique points de fidélité | 5 |
| **notifications** | Notifications utilisateurs | 4 |
| **reviews** | Avis et notes produits | 4 |
| **inventory_logs** | Journal des mouvements de stock | 0 |
| **settings** | Paramètres de l'application | 8 |
| **audit_logs** | Journal d'audit | 0 |

### 3 Vues

- **product_stats** : Statistiques détaillées par produit
- **user_order_stats** : Statistiques de commandes par utilisateur
- **today_orders** : Commandes du jour en temps réel

### 3 Procédures stockées

- **add_loyalty_points()** : Gérer les points de fidélité
- **update_order_status()** : Mettre à jour le statut d'une commande
- **update_stock_after_order()** : Gérer les stocks automatiquement

### 2 Triggers

- **increment_promo_usage** : Compteur d'utilisation des codes promo
- **calculate_order_item_subtotal** : Calcul automatique des sous-totaux

## 👥 Comptes de test

```
Client :
  📧 Email: client@blossom.com
  🔑 Password: client123 (à implémenter)
  ⭐ Points: 150

Manager :
  📧 Email: manager@blossom.com
  🔑 Password: manager123 (à implémenter)

Admin :
  📧 Email: admin@blossom.com
  🔑 Password: admin123 (à implémenter)
```

## 🎫 Codes promo de test

| Code | Type | Réduction | Min. commande | Validité |
|------|------|-----------|---------------|----------|
| `WELCOME10` | % | 10% | 15€ | 31/12/2025 |
| `SUMMER20` | % | 20% | 25€ | 31/08/2025 |
| `VIP30` | % | 30% | 50€ | 31/12/2025 |
| `FIRST5` | fixe | 5€ | 20€ | 31/12/2025 |

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           FRONTEND (React)              │
│   - ProductsView                        │
│   - CartDrawer                          │
│   - OrdersView                          │
└──────────────┬──────────────────────────┘
               │ HTTP/REST API
               ▼
┌─────────────────────────────────────────┐
│        BACKEND (À créer)                │
│   - Node.js/Express                     │
│   - Python/Flask                        │
│   - PHP/Laravel                         │
│   - Ou autre...                         │
└──────────────┬──────────────────────────┘
               │ MySQL Driver
               ▼
┌─────────────────────────────────────────┐
│       MySQL Database                    │
│   - blossom_cafe                        │
│   - 13 tables                           │
│   - Vues, procédures, triggers          │
└─────────────────────────────────────────┘
```

## 🔗 Connexion à la base de données

### Configuration recommandée (.env)

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=blossom_cafe
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
```

### Exemple Node.js (avec mysql2)

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Utilisation
const [rows] = await pool.query('SELECT * FROM products WHERE is_available = ?', [true]);
```

### Exemple Python (avec mysql-connector)

```python
import mysql.connector
import os

conn = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    port=os.getenv('DB_PORT'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
)

cursor = conn.cursor(dictionary=True)
cursor.execute("SELECT * FROM products WHERE is_available = %s", (True,))
products = cursor.fetchall()
```

## 📝 Requêtes SQL utiles

### Voir tous les produits disponibles

```sql
SELECT p.*, c.name AS category_name 
FROM products p 
JOIN categories c ON p.category_id = c.id
WHERE p.is_available = TRUE
ORDER BY c.display_order, p.name;
```

### Top 5 des produits les plus vendus

```sql
SELECT * FROM product_stats 
ORDER BY total_quantity_sold DESC 
LIMIT 5;
```

### Commandes du jour

```sql
SELECT * FROM today_orders;
```

### Statistiques utilisateur

```sql
SELECT * FROM user_order_stats 
ORDER BY total_spent DESC;
```

### Revenus par catégorie

```sql
SELECT 
    c.name AS category,
    COUNT(DISTINCT o.id) AS orders,
    SUM(oi.subtotal) AS revenue
FROM categories c
JOIN products p ON c.id = p.category_id
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.payment_status = 'completed'
GROUP BY c.id, c.name
ORDER BY revenue DESC;
```

## 🛠️ Maintenance

### Backup

```bash
# Backup complet
mysqldump -u root -p blossom_cafe > backup_$(date +%Y%m%d).sql

# Backup structure uniquement
mysqldump -u root -p --no-data blossom_cafe > schema_backup.sql
```

### Restauration

```bash
mysql -u root -p blossom_cafe < backup_20251007.sql
```

### Optimisation

```sql
-- Analyser les performances
EXPLAIN SELECT * FROM product_stats;

-- Optimiser les tables
OPTIMIZE TABLE users, products, orders, order_items;

-- Vérifier les index
SHOW INDEX FROM products;
```

## 🔐 Sécurité en production

### 1. Créer un utilisateur dédié

```sql
CREATE USER 'blossom_app'@'localhost' IDENTIFIED BY 'mot_de_passe_fort_et_securise';
GRANT SELECT, INSERT, UPDATE, DELETE ON blossom_cafe.* TO 'blossom_app'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Activer SSL

```sql
SHOW VARIABLES LIKE '%ssl%';
```

### 3. Limiter les connexions

```sql
-- Dans my.cnf ou my.ini
max_connections = 100
max_user_connections = 50
```

### 4. Backups automatiques

Configurez un cron job (Linux) ou une tâche planifiée (Windows) pour sauvegarder quotidiennement.

## 📚 Documentation

- **[INSTALLATION.md](INSTALLATION.md)** - Guide d'installation complet
- **[SCHEMA_DIAGRAM.md](SCHEMA_DIAGRAM.md)** - Schémas et diagrammes détaillés
- **[MySQL Documentation](https://dev.mysql.com/doc/)** - Documentation officielle MySQL

## 🐛 Dépannage

### Erreur : "Access denied"

**Solution** : Vérifiez votre mot de passe MySQL

```bash
mysql -u root -p
```

### Erreur : "Database already exists"

**Solution** : Le script supprime automatiquement l'ancienne base. Si le problème persiste :

```sql
DROP DATABASE blossom_cafe;
```

### Erreur : "Can't connect to MySQL server"

**Solution** : Vérifiez que MySQL Server est démarré

```bash
# Windows
net start MySQL80

# Linux
sudo systemctl start mysql
```

## 📊 Statistiques de la base

- **13 tables** principales
- **3 vues** pour les requêtes fréquentes
- **3 procédures stockées** pour la logique métier
- **2 triggers** pour l'automatisation
- **~50 colonnes** au total
- **Données de test** : 5 utilisateurs, 14 produits, 4 commandes

## 🎯 Prochaines étapes

1. ✅ **Base de données créée**
2. 📝 **Créer le backend API**
   - Node.js + Express
   - Python + Flask/FastAPI
   - PHP + Laravel
   - Ou autre framework
3. 🔌 **Connecter React à l'API**
   - Remplacer les services mock
   - Implémenter les endpoints
4. 🔐 **Implémenter l'authentification**
   - JWT tokens
   - Hashage des mots de passe (bcrypt)
   - Sessions
5. 🧪 **Tester l'application**
6. 🚀 **Déployer en production**

## 💡 Conseils

- 📖 Lisez d'abord `INSTALLATION.md` pour l'installation détaillée
- 📊 Consultez `SCHEMA_DIAGRAM.md` pour comprendre la structure
- 🔍 Utilisez les vues SQL pour simplifier vos requêtes
- 🛡️ N'exposez jamais directement MySQL à Internet
- 💾 Faites des backups réguliers
- 📈 Monitorer les performances avec `EXPLAIN`

## 📞 Support

Pour toute question ou problème :
1. Consultez la documentation dans ce dossier
2. Vérifiez les logs MySQL
3. Testez les requêtes manuellement dans MySQL Workbench

---

**Blossom Café Database** v1.0.0  
Créé pour l'application PWA Blossom Café 🌸☕  
Octobre 2025

