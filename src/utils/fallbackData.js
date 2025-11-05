/**
 * Données de secours si l'API MySQL n'est pas accessible
 * Permet à l'application de fonctionner même sans backend
 */

export const fallbackProducts = [
  { id: 1, name: 'Thé Vert Sencha', category_id: 1, category_name: 'Thés', price: 4.50, stock: 50, is_available: true, is_featured: true, description: 'Thé vert japonais', calories: 0, preparation_time: 5 },
  { id: 2, name: 'Thé Noir Earl Grey', category_id: 1, category_name: 'Thés', price: 4.00, stock: 45, is_available: true, is_featured: false, description: 'Thé noir à la bergamote', calories: 0, preparation_time: 5 },
  { id: 3, name: 'Croissant au Beurre', category_id: 2, category_name: 'Pâtisseries', price: 2.80, stock: 25, is_available: true, is_featured: true, description: 'Croissant pur beurre', calories: 220, preparation_time: 15 },
  { id: 4, name: 'Macaron Framboise', category_id: 2, category_name: 'Pâtisseries', price: 3.20, stock: 40, is_available: true, is_featured: false, description: 'Macaron à la framboise', calories: 85, preparation_time: 10 },
  { id: 5, name: 'Cappuccino', category_id: 3, category_name: 'Boissons Chaudes', price: 3.80, stock: 100, is_available: true, is_featured: true, description: 'Espresso avec mousse de lait', calories: 120, preparation_time: 7 },
  { id: 6, name: 'Chocolat Chaud', category_id: 3, category_name: 'Boissons Chaudes', price: 4.20, stock: 80, is_available: true, is_featured: false, description: 'Chocolat chaud maison', calories: 250, preparation_time: 8 },
  { id: 7, name: 'Salade César', category_id: 4, category_name: 'Salades', price: 8.90, stock: 20, is_available: true, is_featured: false, description: 'Salade romaine, poulet, parmesan', calories: 350, preparation_time: 12 },
  { id: 8, name: 'Cookie Chocolat', category_id: 5, category_name: 'Snacks', price: 2.50, stock: 50, is_available: true, is_featured: false, description: 'Cookie aux pépites de chocolat', calories: 180, preparation_time: 5 }
];

export const fallbackCategories = [
  { id: 1, name: 'Thés', slug: 'thes', icon: 'Coffee', display_order: 1, is_active: true },
  { id: 2, name: 'Pâtisseries', slug: 'patisseries', icon: 'Cake', display_order: 2, is_active: true },
  { id: 3, name: 'Boissons Chaudes', slug: 'boissons-chaudes', icon: 'Coffee', display_order: 3, is_active: true },
  { id: 4, name: 'Salades', slug: 'salades', icon: 'Salad', display_order: 4, is_active: true },
  { id: 5, name: 'Snacks', slug: 'snacks', icon: 'Cookie', display_order: 5, is_active: true }
];

export default {
  fallbackProducts,
  fallbackCategories
};

