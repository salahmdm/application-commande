# Guide d'Export de la Base de Données

## Méthode 1 : Script automatique (Recommandé)

```bash
cd database
node export-database.js
```

Le fichier sera créé dans le dossier `database/` avec le nom :
`blossom_cafe_backup_YYYY-MM-DDTHH-MM-SS.sql`

## Méthode 2 : Utilisation directe de mysqldump

Si vous avez MySQL Client installé, vous pouvez utiliser directement :

```bash
mysqldump -h 127.0.0.1 -P 3306 -u root -pMuheko,1991@ blossom_cafe > backup.sql
```

Ou en mode interactif (plus sécurisé) :

```bash
mysqldump -h 127.0.0.1 -P 3306 -u root -p blossom_cafe > backup.sql
```

## Méthode 3 : Via phpMyAdmin

1. Ouvrez phpMyAdmin
2. Sélectionnez la base `blossom_cafe`
3. Cliquez sur "Exporter"
4. Choisissez "Méthode d'exportation : Personnalisée"
5. Sélectionnez les tables à exporter
6. Cliquez sur "Exécuter"

## Restauration de la base de données

Pour restaurer un fichier SQL :

```bash
mysql -h 127.0.0.1 -P 3306 -u root -pMuheko,1991@ blossom_cafe < backup.sql
```

Ou en mode interactif :

```bash
mysql -h 127.0.0.1 -P 3306 -u root -p blossom_cafe < backup.sql
```

## Notes importantes

- Le fichier exporté contient la structure ET les données de toutes les tables
- Le fichier peut être assez volumineux selon la quantité de données
- Sauvegardez régulièrement votre base de données
- Conservez plusieurs sauvegardes à différents moments

