import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import orderService from '../services/orderService';
import { calculateTTC } from '../constants/pricing';
import logger from '../utils/logger';

/**
 * Store du panier
 * Gère les articles, quantités, type de commande et calculs
 * ✅ SÉCURITÉ: Chaque utilisateur a son propre panier isolé
 */

// ✅ Fonction pour obtenir la clé de stockage basée sur l'ID utilisateur
const getCartStorageKey = () => {
  try {
    if (typeof window === 'undefined') return 'blossom-cart-storage';
    
    // Récupérer l'utilisateur actuel depuis localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const userId = user?.id || user?.isGuest ? `guest-${Date.now()}` : 'anonymous';
      return `blossom-cart-storage-${userId}`;
    }
    
    // Si pas d'utilisateur, utiliser un panier temporaire pour invité
    const guestCartKey = sessionStorage.getItem('guest-cart-key');
    if (guestCartKey) {
      return `blossom-cart-storage-${guestCartKey}`;
    }
    
    // Créer une clé temporaire pour l'invité
    const newGuestKey = `guest-${Date.now()}`;
    sessionStorage.setItem('guest-cart-key', newGuestKey);
    return `blossom-cart-storage-${newGuestKey}`;
  } catch (error) {
    logger.error('❌ Erreur lors de la récupération de la clé de panier:', error);
    return 'blossom-cart-storage';
  }
};

// ✅ Nettoyer les paniers des autres utilisateurs (garder seulement le panier de l'utilisateur actuel)
const cleanupOldCarts = () => {
  try {
    if (typeof window === 'undefined') return;
    
    const currentKey = getCartStorageKey();
    const prefix = 'blossom-cart-storage-';
    
    // Parcourir toutes les clés localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix) && key !== currentKey) {
        logger.log('🧹 Nettoyage du panier d\'un autre utilisateur:', key);
        localStorage.removeItem(key);
      }
    }
  } catch (error) {
    logger.error('❌ Erreur lors du nettoyage des paniers:', error);
  }
};

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      orderType: '', // 'dine-in' | 'takeaway' | 'delivery' (valeurs MySQL ENUM)
      _userId: null, // ✅ ID utilisateur associé à ce panier (pour isolation)
      promoCode: null,
      discount: 0, // Montant de réduction en euros (calculé dynamiquement)
      discountPercentage: 0, // Pourcentage de réduction pour les codes promo en pourcentage
      promoData: null, // Données complètes du code promo
      loyaltyReward: null, // Récompense de fidélité appliquée
      loyaltyDiscountPercentage: 0, // Pourcentage de réduction de fidélité
      loyaltyDiscountAmount: 0, // Montant de réduction de fidélité en euros
      
      // Migration automatique des anciennes valeurs
      _hasHydrated: false,
      _migrateOldValues: () => {
        const state = get();
        let needsMigration = false;
        const updates = {};
        
        // Migrer orderType
        if (state.orderType === 'sur place') {
          updates.orderType = 'dine-in';
          needsMigration = true;
          logger.log('🔄 Migration: "sur place" → "dine-in"');
        } else if (state.orderType === 'à emporter') {
          updates.orderType = 'takeaway';
          needsMigration = true;
          logger.log('🔄 Migration: "à emporter" → "takeaway"');
        } else if (state.orderType === 'livraison') {
          updates.orderType = 'delivery';
          needsMigration = true;
          logger.log('🔄 Migration: "livraison" → "delivery"');
        }
        
        if (needsMigration) {
          logger.log('✅ Migration appliquée, nouvelles valeurs:', updates);
          set(updates);
        }
        
        set({ _hasHydrated: true });
      },
      
      // Actions
      addItem: (product) => {
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        get().checkUserCart();
        
        const { items } = get();
        const existingItem = items.find(item => item.id === product.id);
        
        if (existingItem) {
          set({
            items: items.map(item =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          });
        } else {
          set({ items: [...items, { ...product, quantity: 1 }] });
        }
      },
      
      updateQuantity: (productId, change) => {
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        get().checkUserCart();
        
        const { items } = get();
        set({
          items: items
            .map(item => {
              if (item.id === productId) {
                const newQuantity = item.quantity + change;
                return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
              }
              return item;
            })
            .filter(Boolean)
        });
      },
      
      removeItem: (productId) => {
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        get().checkUserCart();
        
        set(state => ({
          items: state.items.filter(item => item.id !== productId)
        }));
      },
      
      clearCart: () => {
        logger.log('🧹 Vider le panier');
        set({ 
          items: [], 
          orderType: '',
          promoCode: null, 
          discount: 0, 
          discountPercentage: 0, 
          promoData: null,
          loyaltyReward: null,
          loyaltyDiscountPercentage: 0,
          loyaltyDiscountAmount: 0
        });
      },
      
      // ✅ Nettoyer complètement le panier et changer de panier pour un nouvel utilisateur
      switchUserCart: () => {
        logger.log('🔄 Changement d\'utilisateur - Nettoyage du panier actuel');
        
        // Obtenir l'ID utilisateur actuel
        let currentUserId = null;
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            currentUserId = user?.id || null;
          }
        } catch (error) {
          logger.error('❌ Erreur lors de la récupération de l\'ID utilisateur:', error);
        }
        
        // Vider le panier et mettre à jour l'ID utilisateur
        set({ 
          items: [], 
          orderType: '',
          promoCode: null, 
          discount: 0, 
          discountPercentage: 0, 
          promoData: null,
          loyaltyReward: null,
          loyaltyDiscountPercentage: 0,
          loyaltyDiscountAmount: 0,
          _userId: currentUserId // ✅ Mettre à jour l'ID utilisateur associé
        });
        
        cleanupOldCarts();
      },
      
      // ✅ Vérifier si le panier appartient à l'utilisateur actuel
      checkUserCart: () => {
        const state = get();
        let currentUserId = null;
        
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            currentUserId = user?.id || null;
          }
        } catch (error) {
          logger.error('❌ Erreur lors de la vérification de l\'ID utilisateur:', error);
          return false;
        }
        
        // Si l'ID utilisateur ne correspond pas, vider le panier
        if (state._userId !== null && state._userId !== currentUserId) {
          logger.log('⚠️ Panier d\'un autre utilisateur détecté - Nettoyage...');
          logger.log('   - Panier actuel:', state._userId);
          logger.log('   - Utilisateur actuel:', currentUserId);
          get().switchUserCart();
          return false;
        }
        
        // Mettre à jour l'ID utilisateur si nécessaire
        if (state._userId !== currentUserId) {
          set({ _userId: currentUserId });
        }
        
        return true;
      },
      
      setOrderType: (type) => {
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        get().checkUserCart();
        
        // Normaliser les anciennes valeurs vers les nouvelles
        let normalizedType = type;
        if (type === 'sur place') normalizedType = 'dine-in';
        if (type === 'à emporter') normalizedType = 'takeaway';
        if (type === 'livraison') normalizedType = 'delivery';
        
        logger.log('📍 setOrderType - Migration:', type, '→', normalizedType);
        set({ orderType: normalizedType });
      },
      
      applyPromoCode: async (code) => {
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        get().checkUserCart();
        
        try {
          // Calculer le total actuel pour validation
          const subtotal = get().getSubtotal();
          
          // Valider le code via API MySQL
          const result = await orderService.validatePromoCode(code, subtotal);
          
          if (result.success && result.data) {
            const promo = result.data;
            let discountAmount = 0;
            let discountPercentage = 0;
            
            if (promo.discount_type === 'percentage') {
              discountPercentage = parseFloat(promo.discount_value);
              discountAmount = (subtotal * discountPercentage) / 100;
            } else {
              // Pour les réductions fixes, on calcule le pourcentage équivalent
              discountAmount = parseFloat(promo.discount_value);
              discountPercentage = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
            }
            
            // Supprimer la réduction de fidélité si elle existe (une seule promotion à la fois)
            set({ 
              promoCode: code.toUpperCase(), 
              discount: discountAmount,
              discountPercentage: discountPercentage,
              promoData: promo,
              // Supprimer la réduction de fidélité
              loyaltyReward: null,
              loyaltyDiscountPercentage: 0,
              loyaltyDiscountAmount: 0
            });
            
            return { success: true, discount: discountAmount, discountPercentage: discountPercentage };
          }
          
          return { success: false, error: 'Code promo invalide' };
        } catch (error) {
          logger.error('Erreur applyPromoCode:', error);
          // En cas d'erreur API, utiliser les codes par défaut
          const promoCodes = {
            'WELCOME10': 10,
            'SUMMER20': 20,
            'VIP30': 30,
          };
          
          const discount = promoCodes[code.toUpperCase()];
          if (discount) {
            const subtotal = get().getSubtotal();
            const discountPercentage = discount;
            const discountAmount = (subtotal * discountPercentage) / 100;
            // Supprimer la réduction de fidélité si elle existe (une seule promotion à la fois)
            set({ 
              promoCode: code.toUpperCase(), 
              discount: discountAmount,
              discountPercentage: discountPercentage,
              promoData: { discount_type: 'percentage', discount_value: discountPercentage },
              // Supprimer la réduction de fidélité
              loyaltyReward: null,
              loyaltyDiscountPercentage: 0,
              loyaltyDiscountAmount: 0
            });
            return { success: true, discount: discountAmount, discountPercentage: discountPercentage };
          }
          
          return { success: false, error: error.message || 'Code promo invalide' };
        }
      },
      
      removePromoCode: () => {
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        get().checkUserCart();
        
        set({ promoCode: null, discount: 0, discountPercentage: 0, promoData: null });
        // Note: Ne pas supprimer les réductions de fidélité, elles sont séparées
      },
      
      // Appliquer une récompense de fidélité
      applyLoyaltyReward: (reward) => {
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        get().checkUserCart();
        
        // Si un code promo est déjà appliqué, le supprimer (une seule promotion à la fois)
        const subtotal = get().getSubtotal();
        let discountPercentage = 0;
        let discountAmount = 0;
        
        // Si c'est une réduction en pourcentage, calculer le montant sur le sous-total
        if (reward && reward.type === 'percentage') {
          discountPercentage = parseFloat(reward.discountValue || 0);
          discountAmount = (subtotal * discountPercentage) / 100;
        }
        
        // Supprimer le code promo si il existe (une seule promotion à la fois)
        set({ 
          loyaltyReward: reward,
          loyaltyDiscountPercentage: discountPercentage,
          loyaltyDiscountAmount: discountAmount,
          // Supprimer le code promo
          promoCode: null,
          discount: 0,
          discountPercentage: 0,
          promoData: null
        });
      },
      
      // Retirer la récompense de fidélité
      removeLoyaltyReward: () => {
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        get().checkUserCart();
        
        set({ 
          loyaltyReward: null, 
          loyaltyDiscountPercentage: 0,
          loyaltyDiscountAmount: 0
        });
      },
      
      // Getters
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getSubtotal: () => {
        // Retourner le sous-total HT (sans TVA) pour correspondre au backend
        // Le backend calcule : taxAmount = (subtotal - discountAmount) * 0.10
        // Donc le subtotal doit être HT
        return get().items.reduce((sum, item) => sum + parseFloat(item.price || 0) * item.quantity, 0);
      },
      
      getSubtotalTTC: () => {
        // Retourner le sous-total TTC (avec TVA) pour l'affichage
        const subtotalHT = get().getSubtotal();
        return subtotalHT * 1.10; // TTC = HT * 1.10
      },
      
      getPromoDiscountAmount: () => {
        const { promoData, promoCode, discountPercentage } = get();
        const subtotalHT = get().getSubtotal(); // Utiliser le subtotal HT
        
        // Si on a un code promo actif et des données promo, recalculer le montant
        if (promoCode && promoData) {
          if (promoData.discount_type === 'percentage') {
            // Recalculer le montant basé sur le pourcentage et le nouveau subtotal HT
            return (subtotalHT * parseFloat(promoData.discount_value)) / 100;
          } else {
            // Pour les réductions fixes, utiliser le montant fixe (déjà en HT)
            return parseFloat(promoData.discount_value);
          }
        }
        
        // Si on a un pourcentage stocké pour le code promo, l'utiliser
        if (discountPercentage > 0 && promoCode) {
          return (subtotalHT * discountPercentage) / 100;
        }
        
        return 0;
      },
      
      getLoyaltyDiscountAmount: () => {
        const { loyaltyReward, loyaltyDiscountPercentage } = get();
        const subtotalHT = get().getSubtotal(); // Utiliser le subtotal HT
        
        // Si on a une récompense de fidélité avec un pourcentage
        if (loyaltyReward && loyaltyReward.type === 'percentage') {
          // Recalculer le montant basé sur le pourcentage et le nouveau subtotal HT
          const discountPercentage = parseFloat(loyaltyReward.discountValue || loyaltyDiscountPercentage || 0);
          return (subtotalHT * discountPercentage) / 100;
        }
        
        // Si on a un pourcentage stocké pour la fidélité
        if (loyaltyDiscountPercentage > 0) {
          return (subtotalHT * loyaltyDiscountPercentage) / 100;
        }
        
        return 0;
      },
      
      getDiscountAmount: () => {
        // Une seule promotion peut être appliquée à la fois
        // Priorité à la réduction de fidélité si elle existe
        const { loyaltyReward, promoCode } = get();
        
        if (loyaltyReward) {
          // Si une réduction de fidélité est appliquée, utiliser uniquement celle-ci
          return get().getLoyaltyDiscountAmount();
        } else if (promoCode) {
          // Sinon, utiliser le code promo
          return get().getPromoDiscountAmount();
        }
        
        // Aucune promotion appliquée
        return 0;
      },
      
      getTotal: () => {
        // Logique : Total TTC = (Sous-total HT - Réduction HT) × 1.10 (comme avant, inchangé)
        const subtotalHT = get().getSubtotal();
        const totalDiscountAmount = get().getDiscountAmount(); // Déjà en HT
        const baseTaxableHT = Math.max(0, subtotalHT - totalDiscountAmount);
        return baseTaxableHT * 1.10; // Total TTC (comme avant)
      }
    }),
    {
      name: 'blossom-cart-storage', // ✅ Clé fixe - l'isolation est gérée via _userId dans les données
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Migrer les anciennes valeurs après la réhydratation
        if (state && state._migrateOldValues) {
          logger.log('🔄 Réhydratation du cart - Vérification des migrations...');
          state._migrateOldValues();
        }
        
        // ✅ Vérifier que le panier appartient à l'utilisateur actuel
        if (state && typeof state.checkUserCart === 'function') {
          state.checkUserCart();
        } else {
          // Si la fonction n'existe pas encore, vérifier manuellement
          let currentUserId = null;
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const user = JSON.parse(userStr);
              currentUserId = user?.id || null;
            }
          } catch (error) {
            logger.error('❌ Erreur lors de la vérification de l\'ID utilisateur:', error);
          }
          
          // Si l'ID utilisateur ne correspond pas, vider le panier
          if (state._userId !== null && state._userId !== currentUserId) {
            logger.log('⚠️ Panier d\'un autre utilisateur détecté au démarrage - Nettoyage...');
            state.items = [];
            state.orderType = '';
            state.promoCode = null;
            state.discount = 0;
            state.discountPercentage = 0;
            state.promoData = null;
            state.loyaltyReward = null;
            state.loyaltyDiscountPercentage = 0;
            state.loyaltyDiscountAmount = 0;
            state._userId = currentUserId;
          } else if (state._userId !== currentUserId) {
            // Mettre à jour l'ID utilisateur si nécessaire
            state._userId = currentUserId;
          }
        }
        
        // ✅ Nettoyer les paniers des autres utilisateurs au démarrage
        cleanupOldCarts();
      }
    }
  )
);

export default useCartStore;

