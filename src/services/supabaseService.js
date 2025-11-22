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
   * ============================================
   * PRODUITS (PRODUCTS)
   * ============================================
   */

  async getProducts(filters = {}) {
    try {
      let query = this.getClient().from('products').select('*, categories(*)');

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.isActive !== undefined) {
        // Si isActive est un nombre (1/0), convertir en booléen
        const isActiveValue = filters.isActive === 1 || filters.isActive === true;
        query = query.eq('is_active', isActiveValue);
      } else {
        // Par défaut, ne récupérer que les produits actifs
        query = query.eq('is_active', true);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getProducts:', error);
      return { success: false, error: error.message };
    }
  }

  async getProductById(productId) {
    try {
      const { data, error } = await this.getClient()
        .from('products')
        .select('*, categories(*)')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return { success: true, data };
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
      let query = this.getClient().from('categories');
      
      // Appliquer les filtres
      if (filters.isActive !== undefined) {
        // Si isActive est un nombre (1/0), convertir en booléen
        const isActiveValue = filters.isActive === 1 || filters.isActive === true;
        query = query.eq('is_active', isActiveValue);
      } else {
        // Par défaut, ne récupérer que les catégories actives
        query = query.eq('is_active', true);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getCategories:', error);
      return { success: false, error: error.message };
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
      const { data, error } = await this.getClient()
        .from('orders')
        .select('*, users(*), order_items(*, products(*))')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('❌ Supabase - Erreur getOrderById:', error);
      return { success: false, error: error.message };
    }
  }

  async createOrder(orderData) {
    try {
      // Créer la commande
      const { data: order, error: orderError } = await this.getClient()
        .from('orders')
        .insert({
          user_id: orderData.userId,
          order_number: orderData.orderNumber,
          order_type: orderData.orderType,
          status: orderData.status || 'pending',
          subtotal: orderData.subtotal,
          discount_amount: orderData.discountAmount || 0,
          tax_amount: orderData.taxAmount || 0,
          total_amount: orderData.totalAmount,
          payment_method: orderData.paymentMethod,
          payment_status: orderData.paymentStatus || 'pending',
          notes: orderData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Créer les items de commande
      if (orderData.items && orderData.items.length > 0) {
        const orderItems = orderData.items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        }));

        const { error: itemsError } = await this.getClient()
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      return { success: true, data: order };
    } catch (error) {
      console.error('❌ Supabase - Erreur createOrder:', error);
      return { success: false, error: error.message };
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
        .eq('is_active', true)
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

