/**
 * Service Supabase pour remplacer les appels MySQL
 * Utilise le client Supabase pour toutes les opérations de base de données
 */

import supabaseClient from './supabaseClient';

class SupabaseService {
  /**
   * Obtenir le client Supabase
   */
  getClient() {
    return supabaseClient;
  }

  /**
   * ============================================
   * UTILISATEURS (USERS)
   * ============================================
   */

  async getUsers(filters = {}) {
    try {
      let query = this.getClient().from('users').select('*');

      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getUsers:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserById(userId) {
    try {
      const { data, error } = await this.getClient()
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getUserById:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserByEmail(email) {
    try {
      const { data, error } = await this.getClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
      return { success: true, data: data || null };
    } catch (error) {
      console.error('❌ Supabase - Erreur getUserByEmail:', error);
      return { success: false, error: error.message };
    }
  }

  async createUser(userData) {
    try {
      const { data, error } = await this.getClient()
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur createUser:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUser(userId, updates) {
    try {
      const { data, error } = await this.getClient()
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur updateUser:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId) {
    try {
      const { error } = await this.getClient()
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Supabase - Erreur deleteUser:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Récupérer un utilisateur par email
   */
  async getUserByEmail(email) {
    try {
      const { data, error } = await this.getClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle(); // Utiliser maybeSingle pour éviter erreur si non trouvé

      if (error) throw error;
      return { success: true, data: data || null };
    } catch (error) {
      console.error('❌ Supabase - Erreur getUserByEmail:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ============================================
   * PRODUITS (PRODUCTS)
   * ============================================
   */

  async getProducts(filters = {}) {
    try {
      // ✅ CORRECTION: Sélectionner les champs nécessaires avec la relation categories
      // Utiliser select explicite pour s'assurer que category_id et les données de catégorie sont incluses
      let query = this.getClient()
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description,
            icon,
            display_order,
            is_active
          )
        `);

      if (filters.categoryId) {
        // ✅ CORRECTION: Filtrer par category_id (convertir en nombre pour éviter les problèmes de type)
        const categoryIdNum = typeof filters.categoryId === 'string' ? parseInt(filters.categoryId, 10) : filters.categoryId;
        query = query.eq('category_id', categoryIdNum);
        console.log(`🔍 Supabase getProducts - Filtrage par catégorie ID: ${categoryIdNum}`);
      }
      
      // ✅ CORRECTION: Dans Supabase, la colonne s'appelle 'is_available' et non 'is_active'
      // ✅ CORRECTION: Supabase attend un smallint (0 ou 1), pas un boolean
      if (filters.isActive !== undefined) {
        // Convertir en smallint (0 ou 1) pour Supabase
        const isActiveValue = (filters.isActive === 1 || filters.isActive === true) ? 1 : 0;
        query = query.eq('is_available', isActiveValue);
      }
      // Si isActive est undefined, on ne filtre pas (pour l'admin qui veut tous les produits)
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase - Erreur getProducts:', error);
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Détails:', error.details);
        throw error;
      }
      
      // ✅ CORRECTION: Enrichir les produits avec les données de catégorie pour compatibilité
      const enrichedData = (data || []).map(product => {
        // Si categories est un tableau (relation Supabase), prendre le premier élément
        const category = Array.isArray(product.categories) && product.categories.length > 0
          ? product.categories[0]
          : product.categories || null;
        
        return {
          ...product,
          // ✅ CORRECTION: S'assurer que category_id est toujours présent
          category_id: product.category_id || (category ? category.id : null),
          // ✅ CORRECTION: Ajouter category_name et category_slug pour compatibilité
          category_name: category?.name || product.category_name || null,
          category_slug: category?.slug || product.category_slug || null,
          // Garder l'objet categories pour référence
          categories: category
        };
      });
      
      // ✅ Log de débogage pour Vercel
      if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
        console.log(`✅ Supabase getProducts - ${enrichedData.length} produits récupérés`);
        if (filters.categoryId) {
          const productsInCategory = enrichedData.filter(p => 
            p.category_id === (typeof filters.categoryId === 'string' ? parseInt(filters.categoryId, 10) : filters.categoryId)
          );
          console.log(`   → ${productsInCategory.length} produits dans la catégorie ${filters.categoryId}`);
        }
        // Afficher les premiers produits pour debug
        if (enrichedData.length > 0) {
          console.log('   → Exemple produits:', enrichedData.slice(0, 3).map(p => ({
            id: p.id,
            name: p.name,
            category_id: p.category_id,
            category_name: p.category_name
          })));
        }
      }
      
      return { success: true, data: enrichedData };
    } catch (error) {
      console.error('❌ Supabase - Erreur getProducts:', error);
      return { success: false, error: error.message || error.toString() };
    }
  }

  async getProductById(productId) {
    try {
      const { data, error } = await this.getClient()
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            slug,
            description,
            icon,
            display_order,
            is_active
          )
        `)
        .eq('id', productId)
        .single();

      if (error) throw error;
      
      // ✅ CORRECTION: Enrichir le produit avec les données de catégorie
      const category = Array.isArray(data.categories) && data.categories.length > 0
        ? data.categories[0]
        : data.categories || null;
      
      const enrichedData = {
        ...data,
        category_id: data.category_id || (category ? category.id : null),
        category_name: category?.name || data.category_name || null,
        category_slug: category?.slug || data.category_slug || null,
        categories: category
      };
      
      return { success: true, data: enrichedData };
    } catch (error) {
      console.error('❌ Supabase - Erreur getProductById:', error);
      return { success: false, error: error.message };
    }
  }

  async createProduct(productData) {
    try {
      const { data, error } = await this.getClient()
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur createProduct:', error);
      return { success: false, error: error.message };
    }
  }

  async updateProduct(productId, updates) {
    try {
      const { data, error } = await this.getClient()
        .from('products')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur updateProduct:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteProduct(productId) {
    try {
      const { error } = await this.getClient()
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('❌ Supabase - Erreur deleteProduct:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ============================================
   * CATÉGORIES (CATEGORIES)
   * ============================================
   */

  async getCategories(filters = {}) {
    try {
      let query = this.getClient().from('categories').select('*');
      
      // ✅ CORRECTION: Appliquer les filtres seulement si spécifiés
      if (filters.isActive !== undefined) {
        // ✅ CORRECTION: Supabase attend un smallint (0 ou 1), pas un boolean
        const isActiveValue = (filters.isActive === 1 || filters.isActive === true) ? 1 : 0;
        query = query.eq('is_active', isActiveValue);
      }
      // ✅ Si isActive n'est pas défini, ne pas filtrer (récupérer toutes les catégories)
      
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      query = query.order('display_order', { ascending: true });
      
      const { data, error } = await query;

      if (error) {
        console.error('❌ Supabase - Erreur getCategories:', error);
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        console.error('   Détails:', error.details);
        throw error;
      }
      
      // ✅ Log de débogage pour Vercel
      if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
        console.log(`✅ Supabase getCategories - ${data?.length || 0} catégories récupérées`);
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getCategories:', error);
      return { success: false, error: error.message || error.toString() };
    }
  }

  /**
   * ============================================
   * ACTUALITÉS (NEWS)
   * ============================================
   */

  async getNews(filters = {}) {
    try {
      let query = this.getClient().from('news').select('*');

      // Filtrer par is_active si spécifié
      if (filters.isActive !== undefined) {
        const isActiveValue = (filters.isActive === 1 || filters.isActive === true) ? 1 : 0;
        query = query.eq('is_active', isActiveValue);
      } else {
        // Par défaut, seulement les actualités actives
        query = query.eq('is_active', 1);
      }

      // Trier par display_order puis par date
      const { data, error } = await query
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Supabase - Erreur getNews:', error);
        throw error;
      }

      if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
        console.log(`✅ Supabase getNews - ${data?.length || 0} actualités récupérées`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getNews:', error);
      return { success: false, error: error.message || error.toString() };
    }
  }

  /**
   * ============================================
   * PARAMÈTRES (SETTINGS)
   * ============================================
   */

  async getSetting(key) {
    try {
      // ✅ Essayer d'abord la table 'settings'
      let { data, error } = await this.getClient()
        .from('settings')
        .select('*')
        .eq('setting_key', key)
        .single();

      // ✅ Si erreur 406 (RLS bloqué) ou table n'existe pas, essayer 'app_settings'
      if (error && (error.code === 'PGRST301' || error.status === 406)) {
        console.warn(`⚠️ Supabase - Table 'settings' inaccessible, essai avec 'app_settings' pour ${key}`);
        
        // Essayer avec app_settings
        const result = await this.getClient()
          .from('app_settings')
          .select('*')
          .eq('setting_key', key)
          .single();
        
        if (result.error) {
          // Si le paramètre n'existe pas, ce n'est pas une erreur critique
          if (result.error.code === 'PGRST116') {
            return { success: false, error: 'Paramètre non trouvé', data: null };
          }
          // Si RLS bloque aussi app_settings, retourner une erreur gracieuse
          if (result.error.code === 'PGRST301' || result.error.status === 406) {
            console.warn(`⚠️ Supabase - Accès refusé à app_settings pour ${key} (RLS probablement activé)`);
            return { success: false, error: 'Paramètre non accessible (RLS)', data: null };
          }
          throw result.error;
        }
        
        // Vérifier que result.data existe
        if (!result.data) {
          return { success: false, error: 'Paramètre non trouvé', data: null };
        }
        
        // Convertir app_settings vers le format settings
        return { 
          success: true, 
          data: {
            id: result.data.id,
            setting_key: result.data.setting_key,
            setting_value: result.data.setting_value,
            value: result.data.setting_value, // Alias pour compatibilité
            description: result.data.description,
            setting_type: result.data.setting_type
          }
        };
      }

      if (error) {
        // Si le paramètre n'existe pas, ce n'est pas une erreur critique
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Paramètre non trouvé', data: null };
        }
        // Si RLS bloque ou autre erreur, retourner une erreur gracieuse
        if (error.code === 'PGRST301' || error.status === 406) {
          console.warn(`⚠️ Supabase - Accès refusé à settings pour ${key} (RLS probablement activé)`);
          return { success: false, error: 'Paramètre non accessible (RLS)', data: null };
        }
        throw error;
      }

      // Convertir vers le format attendu
      return { 
        success: true, 
        data: {
          ...data,
          value: data.setting_value // Alias pour compatibilité
        }
      };
    } catch (error) {
      console.error(`❌ Supabase - Erreur getSetting ${key}:`, error);
      // ✅ Gestion gracieuse : retourner une erreur non-bloquante
      return { success: false, error: error.message || error.toString(), data: null };
    }
  }

  async getAllSettings() {
    try {
      // ✅ Essayer d'abord la table 'settings'
      let { data, error } = await this.getClient()
        .from('settings')
        .select('*')
        .order('setting_key', { ascending: true });

      // ✅ Si erreur 406 (RLS bloqué), essayer 'app_settings'
      if (error && (error.code === 'PGRST301' || error.status === 406)) {
        console.warn('⚠️ Supabase - Table \'settings\' inaccessible, essai avec \'app_settings\'');
        
        const result = await this.getClient()
          .from('app_settings')
          .select('*')
          .order('setting_key', { ascending: true });
        
        if (result.error) {
          throw result.error;
        }
        
        // Convertir app_settings vers le format settings
        data = result.data.map(item => ({
          id: item.id,
          setting_key: item.setting_key,
          setting_value: item.setting_value,
          value: item.setting_value, // Alias pour compatibilité
          description: item.description,
          setting_type: item.setting_type
        }));
      } else if (error) {
        throw error;
      } else {
        // Convertir vers le format attendu
        data = data.map(item => ({
          ...item,
          value: item.setting_value // Alias pour compatibilité
        }));
      }

      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getAllSettings:', error);
      return { success: false, error: error.message || error.toString() };
    }
  }

  /**
   * ============================================
   * COMMANDES (ORDERS)
   * ============================================
   */

  async getOrders(filters = {}) {
    try {
      let query = this.getClient()
        .from('orders')
        .select('*, users(*), order_items(*, products(*))');

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.orderType) {
        query = query.eq('order_type', filters.orderType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getOrders:', error);
      return { success: false, error: error.message };
    }
  }

  async getOrderById(orderId) {
    try {
      // ✅ Récupérer la commande avec les informations du code promo
      const { data: orderData, error: orderError } = await this.getClient()
        .from('orders')
        .select('*, users(*), order_items(*, products(*))')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      
      // ✅ Récupérer les informations du code promo si présent
      if (orderData.promo_code_id) {
        try {
          const { data: promoCodeData, error: promoError } = await this.getClient()
            .from('promo_codes')
            .select('code, description, discount_type, discount_value')
            .eq('id', orderData.promo_code_id)
            .single();
          
          if (!promoError && promoCodeData) {
            orderData.promo_code = promoCodeData.code;
            orderData.promo_code_description = promoCodeData.description;
            orderData.promo_discount_type = promoCodeData.discount_type;
            orderData.promo_discount_value = promoCodeData.discount_value;
          }
        } catch (promoErr) {
          console.warn('⚠️ Supabase - Erreur récupération code promo:', promoErr);
        }
      }
      
      return { success: true, data: orderData };
    } catch (error) {
      console.error('❌ Supabase - Erreur getOrderById:', error);
      return { success: false, error: error.message };
    }
  }

  async createOrder(orderData) {
    try {
      // ✅ Récupérer les informations utilisateur pour associer la commande
      let userId = null;
      let userName = null;
      
      if (typeof window !== 'undefined') {
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user && !user.isGuest) {
              userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Client';
              userId = user.id || user.uid || orderData.userId || userId;
            } else if (user && user.isGuest) {
              userName = user.name || user.firstName || 'Invité';
            }
          }
        } catch (e) {
          console.warn('⚠️ Erreur récupération user depuis localStorage:', e);
        }
      }
      
      // Si un userId est fourni explicitement (pour compatibilité backend MySQL)
      if (orderData.userId && typeof orderData.userId === 'number') {
        userId = orderData.userId;
      }
      
      // ✅ SOLUTION DE CONTOURNEMENT : Si userId est NULL et que la contrainte NOT NULL existe encore
      // Essayer de trouver ou créer un utilisateur "invité système" dans Supabase
      if (userId === null) {
        try {
          console.log('🔍 Recherche utilisateur invité système...');
          
          // Chercher un utilisateur invité système (email spécial)
          const { data: guestUser, error: guestError } = await this.getClient()
            .from('users')
            .select('id')
            .eq('email', 'guest@system.local')
            .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour éviter erreur si non trouvé
          
          if (guestError && guestError.code !== 'PGRST116') {
            // PGRST116 = not found, c'est OK
            console.warn('⚠️ Erreur recherche utilisateur invité:', guestError);
          }
          
          if (!guestError && guestUser && guestUser.id) {
            // Utiliser l'utilisateur invité système existant
            userId = guestUser.id;
            console.log('✅ Utilisation utilisateur invité système existant:', userId);
          } else {
            // Essayer de créer un utilisateur invité système
            console.log('📝 Création utilisateur invité système...');
            // Note: password_hash est requis, on utilise un hash spécial
            const { data: newGuestUser, error: createError } = await this.getClient()
              .from('users')
              .insert({
                email: 'guest@system.local',
                password_hash: '$2b$10$SYSTEM_GUEST_USER_NO_LOGIN_ALLOWED', // Hash spécial, jamais utilisé
                first_name: 'Invité',
                last_name: 'Système',
                role: 'client',
                is_active: 0 // Désactivé pour éviter les connexions
              })
              .select('id')
              .single();
            
            if (createError) {
              console.warn('⚠️ Erreur création utilisateur invité système:', createError);
              // Si la création échoue (peut-être email déjà existant), essayer de le récupérer à nouveau
              if (createError.code === '23505') { // Violation contrainte unique (email déjà existant)
                console.log('🔄 Email déjà existant, récupération de l\'utilisateur...');
                const { data: existingUser, error: fetchError } = await this.getClient()
                  .from('users')
                  .select('id')
                  .eq('email', 'guest@system.local')
                  .maybeSingle();
                
                if (!fetchError && existingUser && existingUser.id) {
                  userId = existingUser.id;
                  console.log('✅ Utilisateur invité système récupéré:', userId);
                } else {
                  console.error('❌ Impossible de récupérer utilisateur invité:', fetchError);
                }
              } else {
                // Si la création échoue pour une autre raison, essayer avec un email différent
                console.warn('⚠️ Tentative avec email alternatif...');
                const timestamp = Date.now();
                const { data: altGuestUser, error: altError } = await this.getClient()
                  .from('users')
                  .insert({
                    email: `guest-${timestamp}@system.local`,
                    password_hash: '$2b$10$SYSTEM_GUEST_USER_NO_LOGIN_ALLOWED',
                    first_name: 'Invité',
                    last_name: 'Système',
                    role: 'client',
                    is_active: 0
                  })
                  .select('id')
                  .single();
                
                if (!altError && altGuestUser && altGuestUser.id) {
                  userId = altGuestUser.id;
                  console.log('✅ Utilisateur invité système créé (alternatif):', userId);
                } else {
                  console.error('❌ Impossible de créer utilisateur invité système (alternatif):', altError);
                  // Si tout échoue, on laissera userId = null et l'erreur se produira
                  // L'utilisateur devra exécuter la migration SQL
                  throw new Error('Impossible de créer ou trouver un utilisateur système. Veuillez exécuter la migration SQL : ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;');
                }
              }
            } else if (newGuestUser && newGuestUser.id) {
              userId = newGuestUser.id;
              console.log('✅ Utilisateur invité système créé:', userId);
            }
          }
        } catch (e) {
          console.error('❌ Erreur lors de la recherche/création utilisateur invité:', e);
          // Si tout échoue, on laissera userId = null et l'erreur se produira
          // L'utilisateur devra exécuter la migration SQL
          throw new Error(`Erreur lors de la création de l'utilisateur système : ${e.message}. Veuillez exécuter la migration SQL dans Supabase : ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;`);
        }
      }
      
      // Vérifier que userId n'est toujours pas null avant de continuer
      if (userId === null) {
        throw new Error('user_id est NULL et la contrainte NOT NULL est active. Veuillez exécuter cette migration SQL dans Supabase : ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;');
      }

      // ✅ Générer le numéro de commande si non fourni
      let orderNumber = orderData.orderNumber;
      if (!orderNumber) {
        // Récupérer la dernière commande pour générer le numéro suivant
        const { data: lastOrders, error: lastOrderError } = await this.getClient()
          .from('orders')
          .select('order_number')
          .order('id', { ascending: false })
          .limit(1);

        if (lastOrderError) {
          console.warn('⚠️ Erreur récupération dernière commande:', lastOrderError);
        }

        let nextNumber = 1;
        if (lastOrders && lastOrders.length > 0 && lastOrders[0].order_number) {
          const lastNumStr = lastOrders[0].order_number.replace('CMD-', '');
          const lastNum = parseInt(lastNumStr, 10);
          if (!isNaN(lastNum)) {
            nextNumber = lastNum + 1;
          }
        }

        orderNumber = `CMD-${String(nextNumber).padStart(4, '0')}`;
      }

      // ✅ Calculer les totaux si non fournis
      let subtotal = orderData.subtotal || 0;
      let discountAmount = orderData.discountAmount || 0;
      let taxAmount = orderData.taxAmount || 0;
      let totalAmount = orderData.totalAmount || 0;

      // Si les totaux ne sont pas fournis, les calculer depuis les items
      if (!subtotal && orderData.items && orderData.items.length > 0) {
        subtotal = orderData.items.reduce((sum, item) => {
          const itemPrice = item.price || 0;
          const itemQuantity = item.quantity || 1;
          return sum + (itemPrice * itemQuantity);
        }, 0);
      }

      // Calculer la TVA (10%) sur le montant après réduction
      if (!taxAmount && subtotal > 0) {
        const baseTaxable = subtotal - discountAmount;
        taxAmount = Math.round(baseTaxable * 0.1 * 100) / 100; // TVA 10%
      }

      // Calculer le total si non fourni
      if (!totalAmount && subtotal > 0) {
        totalAmount = subtotal - discountAmount + taxAmount;
      }

      // ✅ Récupérer les noms des produits pour les items
      const orderItemsToInsert = [];
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          // Récupérer le produit pour obtenir son nom et prix
          let productName = item.productName || item.name || 'Produit';
          let unitPrice = item.price || item.unitPrice || 0;
          let itemSubtotal = item.subtotal || (unitPrice * (item.quantity || 1));

          // Si le nom ou prix n'est pas fourni, essayer de récupérer depuis Supabase
          if (!item.productName || !item.price) {
            try {
              const { data: product, error: productError } = await this.getClient()
                .from('products')
                .select('name, price')
                .eq('id', item.productId)
                .single();

              if (!productError && product) {
                productName = product.name || productName;
                unitPrice = product.price || unitPrice;
                itemSubtotal = unitPrice * (item.quantity || 1);
              }
            } catch (e) {
              console.warn('⚠️ Erreur récupération produit:', e);
            }
          }

          orderItemsToInsert.push({
            order_id: null, // Sera mis à jour après création de la commande
            product_id: item.productId,
            product_name: productName,
            quantity: item.quantity || 1,
            unit_price: unitPrice,
            subtotal: itemSubtotal,
            special_instructions: item.notes || item.special_instructions || null
          });
        }
      }

      // ✅ Construire les notes avec les informations utilisateur
      let orderNotes = orderData.notes || '';
      if (userName && !orderNotes.includes(userName)) {
        const clientInfo = `Client: ${userName}`;
        orderNotes = orderNotes ? `${orderNotes}\n${clientInfo}` : clientInfo;
      }
      
      // ✅ Créer la commande
      const { data: order, error: orderError } = await this.getClient()
        .from('orders')
        .insert({
          user_id: userId,
          order_number: orderNumber,
          order_type: orderData.orderType || 'dine-in',
          status: orderData.status || 'pending',
          subtotal: subtotal,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          payment_method: orderData.paymentMethod || 'cash',
          payment_status: orderData.paymentStatus || 'pending',
          notes: orderNotes || null,
          table_number: orderData.tableNumber || null,
          delivery_address: orderData.deliveryAddress || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // ✅ Créer les items de commande avec l'ID de la commande
      if (orderItemsToInsert.length > 0) {
        const orderItems = orderItemsToInsert.map(item => ({
          ...item,
          order_id: order.id
        }));

        const { error: itemsError } = await this.getClient()
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      console.log('✅ Supabase createOrder - Commande créée:', orderNumber);
      return { success: true, data: order };
    } catch (error) {
      console.error('❌ Supabase - Erreur createOrder:', error);
      return { success: false, error: error.message || 'Erreur lors de la création de la commande' };
    }
  }

  async updateOrder(orderId, updates) {
    try {
      const { data, error } = await this.getClient()
        .from('orders')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur updateOrder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * ============================================
   * AUTHENTIFICATION
   * ============================================
   */

  async login(email, password) {
    try {
      // Récupérer l'utilisateur
      const { data: user, error: userError } = await this.getClient()
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', 1) // ✅ CORRECTION: Supabase attend un smallint (0 ou 1)
        .single();

      if (userError || !user) {
        return { success: false, error: 'Identifiants invalides' };
      }

      // Vérifier le mot de passe (nécessite bcrypt côté serveur ou Supabase Auth)
      // Pour l'instant, on retourne l'utilisateur (le hash sera vérifié côté serveur)
      return { success: true, user };
    } catch (error) {
      console.error('❌ Supabase - Erreur login:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton
const supabaseService = new SupabaseService();
export default supabaseService;

