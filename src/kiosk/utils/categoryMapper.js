import { BKCategories, BKColors } from '../styles/kiosk-theme';
import logger from '../../utils/logger';

/**
 * Mapper les catégories de la BDD vers les catégories BK
 * Permet d'associer les catégories réelles de la BDD aux styles Burger King
 */

// Mapping des noms de catégories BDD vers les catégories BK
// Utilise une correspondance flexible (insensible à la casse, avec accents)
const categoryNameMapping = {
  // Boissons
  'boissons chaudes': 'boissons',
  'boissons froides': 'boissons',
  'boissons': 'boissons',
  'boisson': 'boissons',
  'drinks': 'boissons',
  'drink': 'boissons',
  'café': 'boissons',
  'cafe': 'boissons',
  'thé': 'boissons',
  'the': 'boissons',
  
  // Desserts
  'délices sucrés': 'desserts',
  'delices sucres': 'desserts',
  'desserts': 'desserts',
  'dessert': 'desserts',
  'pâtisseries': 'desserts',
  'patisseries': 'desserts',
  'gâteaux': 'desserts',
  'gateaux': 'desserts',
  
  // Salades / Sandwiches
  'délices salés': 'salades',
  'delices sales': 'salades',
  'salades': 'salades',
  'salade': 'salades',
  'sandwichs': 'salades',
  'sandwich': 'salades',
  'quiches': 'salades',
  
  // Burgers (si vous avez des burgers)
  'burgers': 'burgers',
  'burger': 'burgers',
  
  // Menus
  'menus': 'menus',
  'menu': 'menus',
  'combo': 'menus',
  'combos': 'menus',
  
  // Chicken (si vous avez du poulet)
  'chicken': 'chicken',
  'poulet': 'chicken',
  
  // Nouveautés (basé sur is_featured ou date de création)
  'nouveautés': 'nouveautes',
  'nouveautes': 'nouveautes',
  'featured': 'nouveautes',
  'en vedette': 'nouveautes',
};

/**
 * Trouver la catégorie BK correspondante à partir d'une catégorie BDD
 * @param {Object} dbCategory - Catégorie de la BDD
 * @returns {Object} Configuration BK avec dégradé et style
 */
export const mapCategoryToBK = (dbCategory) => {
  if (!dbCategory || !dbCategory.name) {
    logger.warn('⚠️ mapCategoryToBK - Catégorie invalide:', dbCategory);
    return BKCategories[0]; // Retourner la première catégorie par défaut
  }

  const categoryName = dbCategory.name.toLowerCase().trim();
  
  // Chercher dans le mapping
  const mappedId = categoryNameMapping[categoryName];
  
  if (mappedId) {
    const bkCategory = BKCategories.find(c => c.id === mappedId);
    if (bkCategory) {
      return {
        ...bkCategory,
        dbCategoryId: dbCategory.id, // Conserver l'ID de la BDD
        dbCategoryName: dbCategory.name, // Conserver le nom de la BDD
      };
    }
  }

  // Si pas de mapping trouvé, utiliser une catégorie par défaut selon le nom
  // ou créer une catégorie générique
  logger.log(`📋 mapCategoryToBK - Catégorie non mappée: ${categoryName}, utilisation par défaut`);
  
  // Essayer de deviner selon le nom
  if (categoryName.includes('boisson') || categoryName.includes('drink')) {
    return {
      ...BKCategories.find(c => c.id === 'boissons'),
      dbCategoryId: dbCategory.id,
      dbCategoryName: dbCategory.name,
    };
  }
  
  if (categoryName.includes('dessert') || categoryName.includes('sucré') || categoryName.includes('pâtisserie')) {
    return {
      ...BKCategories.find(c => c.id === 'desserts'),
      dbCategoryId: dbCategory.id,
      dbCategoryName: dbCategory.name,
    };
  }
  
  if (categoryName.includes('salade') || categoryName.includes('salé') || categoryName.includes('sandwich')) {
    return {
      ...BKCategories.find(c => c.id === 'salades'),
      dbCategoryId: dbCategory.id,
      dbCategoryName: dbCategory.name,
    };
  }

  // Par défaut, utiliser "nouveautés" ou la première catégorie
  return {
    ...BKCategories[0],
    dbCategoryId: dbCategory.id,
    dbCategoryName: dbCategory.name,
  };
};

/**
 * Enrichir les catégories de la BDD avec les styles BK
 * @param {Array} dbCategories - Catégories de la BDD
 * @returns {Array} Catégories enrichies avec styles BK
 */
export const enrichCategoriesWithBKStyles = (dbCategories) => {
  if (!dbCategories || !Array.isArray(dbCategories)) {
    logger.warn('⚠️ enrichCategoriesWithBKStyles - Catégories invalides');
    return [];
  }

  return dbCategories.map(dbCategory => {
    const bkConfig = mapCategoryToBK(dbCategory);
    
    return {
      // Données de la BDD
      id: dbCategory.id, // ID de la BDD (important pour filtrer les produits)
      name: dbCategory.name,
      slug: dbCategory.slug,
      description: dbCategory.description,
      icon: dbCategory.icon || bkConfig.icon,
      display_order: dbCategory.display_order,
      is_active: dbCategory.is_active,
      
      // Styles BK
      bkId: bkConfig.id, // ID de la catégorie BK (pour les styles)
      bkName: bkConfig.name, // Nom en MAJUSCULES pour l'affichage
      headerGradient: bkConfig.headerGradient,
      gradient: bkConfig.gradient,
    };
  });
};

/**
 * Filtrer les produits par catégorie BDD
 * @param {Array} products - Liste des produits
 * @param {Number} categoryId - ID de la catégorie dans la BDD
 * @returns {Array} Produits filtrés
 */
export const filterProductsByCategory = (products, categoryId) => {
  if (!products || !Array.isArray(products)) {
    return [];
  }

  if (!categoryId) {
    return products; // Retourner tous les produits si aucune catégorie sélectionnée
  }

  return products.filter(product => {
    // Vérifier category_id (format BDD standard)
    // Le backend retourne category_id directement dans le produit
    const productCategoryId = product.category_id || product.categoryId;
    
    // Comparer avec l'ID de catégorie sélectionné
    // Convertir en nombre pour éviter les problèmes de type
    return Number(productCategoryId) === Number(categoryId);
  });
};

/**
 * Déterminer si un produit est une nouveauté (pour badge NOUVEAU)
 * @param {Object} product - Produit de la BDD
 * @returns {Boolean}
 */
export const isProductNew = (product) => {
  if (!product) return false;
  
  // Produit créé il y a moins de 30 jours
  if (product.created_at) {
    const createdDate = new Date(product.created_at);
    const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreation < 30;
  }
  
  // Ou si marqué comme featured
  return product.is_featured === true || product.isFeatured === true;
};

/**
 * Déterminer si un produit est en promo (pour badge PROMO)
 * @param {Object} product - Produit de la BDD
 * @returns {Boolean}
 */
export const isProductPromo = (product) => {
  if (!product) return false;
  
  // Vérifier si le produit a un code promo actif
  // ou si le prix a été réduit (nécessite un champ promo_price ou similar)
  return product.is_promo === true || 
         product.isPromo === true ||
         (product.promo_price && product.promo_price < product.price);
};

export default {
  mapCategoryToBK,
  enrichCategoriesWithBKStyles,
  filterProductsByCategory,
  isProductNew,
  isProductPromo,
};

