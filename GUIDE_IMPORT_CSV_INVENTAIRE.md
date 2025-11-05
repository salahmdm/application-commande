# 📦 Guide d'Importation CSV - Inventaire

## Format du fichier CSV

Le fichier CSV doit respecter le format suivant pour être importé correctement dans l'inventaire.

### Structure du fichier

```csv
Nom,Catégorie,Quantité,Prix,Qté Min
"Cappuccino","Boissons Chaudes",50,4.50,10
"Espresso","Boissons Chaudes",75,3.00,15
"Coca-Cola","Boissons Froides",100,2.50,20
"Pain au Chocolat","Délices Salés",30,2.80,5
"Éclair au Chocolat","Délices Sucrés",25,3.50,5
```

### Colonnes requises

| Colonne      | Type    | Description                                    | Exemple                |
|--------------|---------|------------------------------------------------|------------------------|
| **Nom**      | Texte   | Nom de l'article (obligatoire)                | "Cappuccino"          |
| **Catégorie**| Texte   | Catégorie du produit (obligatoire)            | "Boissons Chaudes"    |
| **Quantité** | Nombre  | Quantité en stock                             | 50                     |
| **Prix**     | Nombre  | Prix unitaire en euros                        | 4.50                   |
| **Qté Min**  | Nombre  | Quantité minimale avant alerte de stock       | 10                     |

### Catégories disponibles

- **Boissons Chaudes** (Café, Thé, Chocolat chaud, etc.)
- **Boissons Froides** (Sodas, Jus, Eau, etc.)
- **Délices Salés** (Sandwichs, Viennoiseries salées, etc.)
- **Délices Sucrés** (Pâtisseries, Desserts, etc.)

## 📥 Comment importer un fichier CSV

### Étape 1 : Préparer votre fichier
1. Créez un fichier CSV avec les colonnes requises
2. Assurez-vous que la première ligne contient les en-têtes
3. Utilisez des guillemets pour les textes contenant des virgules
4. Encodage recommandé : UTF-8

### Étape 2 : Importer dans l'application
1. Connectez-vous en tant qu'**Admin**
2. Allez dans **Inventaire**
3. Cliquez sur le bouton **"Importer CSV"**
4. Sélectionnez votre fichier CSV
5. Attendez la confirmation d'importation

### Étape 3 : Vérifier l'importation
- Un message vous indiquera le nombre d'articles importés
- Les articles apparaîtront dans la liste d'inventaire
- En cas d'erreur, vérifiez le format de votre fichier

## ✅ Exemple de fichier valide

Téléchargez le fichier `exemple_inventaire.csv` pour voir un exemple complet.

## ⚠️ Erreurs courantes

### Erreur : "Le fichier CSV est vide"
- **Cause** : Aucune donnée après l'en-tête
- **Solution** : Ajoutez au moins une ligne de données

### Erreur : "Veuillez sélectionner un fichier CSV"
- **Cause** : Le fichier n'a pas l'extension .csv
- **Solution** : Assurez-vous que le fichier se termine par `.csv`

### Import partiel (X articles importés, Y erreurs)
- **Cause** : Certaines lignes ont des données manquantes ou invalides
- **Solution** : 
  - Vérifiez que chaque ligne a toutes les colonnes requises
  - Vérifiez que les nombres sont bien formatés (utilisez le point pour les décimales)
  - Vérifiez que les catégories correspondent aux catégories disponibles

## 💡 Conseils

1. **Testez avec peu de données** : Commencez par importer 2-3 articles pour vérifier le format
2. **Sauvegardez vos données** : Exportez votre inventaire actuel avant d'importer massivement
3. **Utilisez Excel ou LibreOffice** : Ces outils facilitent la création de fichiers CSV
4. **Évitez les doublons** : L'importation ajoute de nouveaux articles, elle ne met pas à jour les existants

## 📊 Export CSV

Vous pouvez également **exporter** votre inventaire actuel au format CSV :
1. Cliquez sur **"Exporter CSV"**
2. Le fichier sera téléchargé automatiquement
3. Utilisez ce fichier comme modèle pour vos futures importations

## 🔧 Dépannage

Si vous rencontrez des problèmes :
1. Vérifiez que votre fichier CSV est bien encodé en UTF-8
2. Assurez-vous qu'il n'y a pas de lignes vides au milieu du fichier
3. Vérifiez que les guillemets sont bien fermés
4. Utilisez l'export comme référence pour le format exact

---

**Besoin d'aide ?** Contactez l'administrateur système.

