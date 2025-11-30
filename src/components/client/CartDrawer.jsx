import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Tag, CreditCard, Image as ImageIcon, Trash2, Gift } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import useOrders from '../../hooks/useOrders';
import useCartStore from '../../store/cartStore';
import useNotifications from '../../hooks/useNotifications';
import useSettings from '../../hooks/useSettings';
import { calculateTTC, formatPrice, calculateOrderTotal } from '../../constants/pricing';
import settingsService from '../../services/settingsService';
import { apiCall } from '../../services/api';
import logger from '../../utils/logger';

/**
 * Panier latéral avec paiement
 */
const CartDrawer = ({ isOpen, onClose }) => {
  const { 
    items, 
    orderType, 
    promoCode, 
    discountPercentage,
    promoData,
    loyaltyReward: appliedReward,
    subtotal, // HT maintenant
    discountAmount,
    promoDiscountAmount,
    loyaltyDiscountAmount,
    total, 
    increment, 
    decrement, 
    remove,
    applyPromo,
    removePromo,
    applyLoyaltyReward,
    removeLoyaltyReward,
    selectOrderType
  } = useCart();
  const { user, isGuest } = useAuth();
  const { createOrder } = useOrders();
  const { clearCart } = useCartStore();
  const { success, error: showError } = useNotifications();
  const { tableNumberEnabled } = useSettings();
  
  const [promoInput, setPromoInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [guestName, setGuestName] = useState(''); // Nom pour les invités
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loyaltyTiers, setLoyaltyTiers] = useState([]);
  const [loyaltyRewards, setLoyaltyRewards] = useState([]);
  const [selectedLoyaltyReward, setSelectedLoyaltyReward] = useState(null);
  const [selectedLoyaltyTier, setSelectedLoyaltyTier] = useState(null);
  
  // Récupérer le token pour l'utiliser dans le JSX
  // Utiliser useState pour que React détecte les changements
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });
  
  // Mettre à jour le token quand localStorage change
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem('token');
      if (currentToken !== token) {
        setToken(currentToken);
      }
    };
    
    // Vérifier immédiatement
    checkToken();
    
    // Écouter les changements de localStorage (si d'autres onglets modifient le token)
    window.addEventListener('storage', checkToken);
    
    return () => {
      window.removeEventListener('storage', checkToken);
    };
  }, [token]);
  
  // Variable calculée pour le token (pour le JSX) - récupère directement depuis localStorage
  const tokenForJSX = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Charger les paliers et récompenses de fidélité
  useEffect(() => {
    const loadLoyaltyData = async () => {
      try {
        // Charger les paliers depuis les settings (si nécessaire)
        const tiersResponse = await settingsService.getSetting('loyalty_reward_tiers');
        if (tiersResponse.success && tiersResponse.data?.value) {
          let tiers = [];
          try {
            tiers = typeof tiersResponse.data.value === 'string' 
              ? JSON.parse(tiersResponse.data.value) 
              : tiersResponse.data.value;
          } catch {
            tiers = [];
          }
          setLoyaltyTiers(Array.isArray(tiers) ? tiers : []);
        }

        // Charger les récompenses depuis la base de données
        const response = await apiCall('/loyalty-rewards');
        if (response.success && response.data) {
          // Convertir les données de la BDD au format attendu par le frontend
          const rewardsList = response.data.map(reward => ({
            name: reward.name || '',
            description: reward.description || '',
            pointsRequired: reward.points_required || 0,
            type: reward.reward_type || 'percentage',
            discountValue: reward.discount_value || 0,
            productId: reward.product_id || null,
            icon: reward.icon || '🎁'
          }));
          setLoyaltyRewards(Array.isArray(rewardsList) ? rewardsList : []);
        } else {
          setLoyaltyRewards([]);
        }
      } catch (error) {
        logger.error('❌ Erreur chargement données fidélité:', error);
        // Fallback : essayer de charger depuis les settings si l'API échoue
        try {
          const rewardsResponse = await settingsService.getSetting('loyalty_rewards');
          if (rewardsResponse.success && rewardsResponse.data?.value) {
            let rewards = [];
            try {
              rewards = typeof rewardsResponse.data.value === 'string' 
                ? JSON.parse(rewardsResponse.data.value) 
                : rewardsResponse.data.value;
            } catch {
              rewards = [];
            }
            setLoyaltyRewards(Array.isArray(rewards) ? rewards : []);
          }
        } catch (fallbackError) {
          logger.error('❌ Erreur fallback settings:', fallbackError);
        }
      }
    };
    
    if (isOpen && !isGuest && user?.points !== undefined) {
      loadLoyaltyData();
    }
  }, [isOpen, isGuest, user?.points]);

  // Calculer les paliers disponibles selon les points du client
  const availableTiers = loyaltyTiers.filter(tier => 
    user?.points >= (tier.points || 0)
  );

  // Calculer les récompenses disponibles selon les points du client
  const availableRewards = loyaltyRewards.filter(reward => 
    user?.points >= (reward.pointsRequired || 0)
  );

  // Appliquer la récompense sélectionnée
  const handleSelectLoyaltyReward = (reward) => {
    if (selectedLoyaltyReward?.pointsRequired === reward.pointsRequired) {
      // Désélectionner si déjà sélectionné
      setSelectedLoyaltyReward(null);
      removeLoyaltyReward(); // Retirer la récompense du store
      setSelectedLoyaltyTier(null);
    } else {
      setSelectedLoyaltyReward(reward);
      setSelectedLoyaltyTier(null); // Désélectionner les paliers si on sélectionne une récompense
      
      // Appliquer la récompense dans le store (calcule automatiquement la réduction)
      applyLoyaltyReward(reward);
    }
  };

  // Appliquer la réduction du palier sélectionné (ancien système)
  const handleSelectLoyaltyTier = (tier) => {
    if (selectedLoyaltyTier?.points === tier.points) {
      // Désélectionner si déjà sélectionné
      setSelectedLoyaltyTier(null);
      removeLoyaltyReward(); // Retirer la récompense du store
      setSelectedLoyaltyReward(null);
    } else {
      setSelectedLoyaltyTier(tier);
      setSelectedLoyaltyReward(null); // Désélectionner les récompenses si on sélectionne un palier
      
      // Extraire le pourcentage de réduction depuis la description
      const match = tier.description?.match(/(\d+)%/);
      const discountPercent = match ? parseFloat(match[1]) : 0;
      
      // Créer un objet récompense temporaire pour le palier
      if (discountPercent > 0) {
        const tierReward = {
          type: 'percentage',
          discountValue: discountPercent,
          name: tier.name || 'Réduction palier',
          description: tier.description
        };
        applyLoyaltyReward(tierReward);
      } else {
        removeLoyaltyReward();
      }
    }
  };

  // Logs de debug pour valeurs critiques (uniquement en développement)
  useEffect(() => {
    if (isOpen) {
      logger.debug('🛒 CartDrawer - État du panier:');
      logger.debug('  - items:', items, 'length:', items?.length);
      logger.debug('  - total:', total, 'type:', typeof total);
      logger.debug('  - subtotal:', subtotal, 'type:', typeof subtotal);
      logger.debug('  - discountAmount:', discountAmount, 'type:', typeof discountAmount);
      logger.debug('  - orderType:', orderType, 'type:', typeof orderType);
      logger.debug('  - promoCode:', promoCode);
      logger.debug('  - discountPercentage:', discountPercentage);
      logger.debug('  - promoData:', promoData);
      
      if (!items || items.length === 0) {
        logger.warn('⚠️ Panier vide ou items undefined');
      }
      if (total === undefined || total === null || isNaN(total)) {
        logger.warn('⚠️ Total invalide:', total);
      }
      if (!orderType) {
        logger.warn('⚠️ orderType non défini');
      }
    }
  }, [isOpen, items, total, subtotal, discountAmount, orderType, promoCode, discountPercentage, promoData]);
  
  const handleApplyPromo = async () => {
    if (!applyPromo) {
      logger.error('❌ applyPromo function not available');
      showError('Service de code promo indisponible');
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await applyPromo(promoInput);
      if (result && result.success) {
        const discountPercent = result.discountPercentage || result.discount || 0;
        success(`Code promo appliqué ! -${discountPercent}%`);
        setPromoInput('');
      } else {
        showError(result?.error || 'Code promo invalide');
      }
    } catch (error) {
      logger.error('Erreur lors de l\'application du code promo:', error);
      showError('Erreur lors de l\'application du code promo');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handlePayment = () => {
    // Vérifications préalables
    if (!items || items.length === 0) {
      logger.error('❌ Panier vide');
      showError('Votre panier est vide');
      return;
    }
    
    if (!orderType) {
      logger.error('❌ Type de commande non défini');
      showError('Veuillez sélectionner un type de commande (Sur place ou À emporter)');
      return;
    }
    
    // Vérifier le numéro de table si activé et commande sur place
    if (tableNumberEnabled && orderType === 'dine-in' && !tableNumber) {
      logger.error('❌ Numéro de table requis');
      showError('Veuillez indiquer votre numéro de table');
      return;
    }
    
    // Ouvrir la modale de sélection du mode de paiement
    setShowPaymentModal(true);
  };

  const handleConfirmPayment = async (paymentMethod) => {
    if (!createOrder) {
      logger.error('❌ createOrder function not available');
      showError('Service de commande indisponible');
      return;
    }
    
    setShowPaymentModal(false);
    
    // Vérifier l'authentification
    // Le token et user sont déjà disponibles au niveau du composant
    logger.debug('🔐 Vérification authentification:');
    logger.debug('   Token présent:', token ? 'OUI ✅' : 'NON ❌');
    // ✅ SÉCURITÉ: Ne jamais logger les tokens, même partiellement
    logger.debug('   User présent:', user ? 'OUI ✅' : 'NON ❌');
    // ✅ SÉCURITÉ: Email masqué automatiquement par le logger
    logger.debug('   User email:', user?.email || 'NON');
    logger.debug('   User isGuest:', user?.isGuest || false);
    logger.debug('   Hook isGuest:', isGuest);
    // ✅ SÉCURITÉ: Ne pas logger les noms/prénoms et rôle (données personnelles RGPD)
    
    // Déterminer si c'est un client authentifié ou un invité
    // Récupérer le token directement depuis localStorage pour éviter les problèmes de timing
    const currentToken = localStorage.getItem('token');
    const hasToken = !!currentToken;
    const hasEmail = user && user.email;
    // Un invité est défini par isGuest === true, pas par l'absence de token ou d'email
    const isGuestUser = user && (user.isGuest === true || isGuest === true);
    // Un client authentifié a un token ET un email ET n'est pas un invité
    const isAuthenticatedClient = hasToken && hasEmail && user && !user.isGuest && !isGuest;
    
    // Mettre à jour le state du token si nécessaire
    if (currentToken && currentToken !== token) {
      setToken(currentToken);
    }
    
    logger.debug('   Is Authenticated Client:', isAuthenticatedClient);
    logger.debug('   currentToken présent:', hasToken);
    // ✅ SÉCURITÉ: Ne jamais logger les tokens, même partiellement
    logger.debug('   hasEmail:', hasEmail);
    logger.debug('   user.isGuest:', user?.isGuest);
    logger.debug('   hook isGuest:', isGuest);
    logger.debug('   isGuestUser calculé:', isGuestUser);
    logger.debug('   user object complet:', JSON.stringify(user, null, 2));
    
    // Si l'utilisateur a un email mais pas de token, c'est anormal
    // MAIS on ne bloque que si on est absolument sûr que c'est un client authentifié
    // Si l'utilisateur a un email ET n'est pas un invité ET n'a pas de token, c'est une erreur
    // Cependant, on peut aussi considérer qu'un utilisateur avec email mais sans token
    // peut être traité comme invité temporairement (fallback)
    if (hasEmail && !hasToken && user && !user.isGuest && !isGuest) {
      logger.warn('⚠️ Client avec email mais token non trouvé');
      logger.warn('   Cela peut arriver juste après la connexion (timing)');
      logger.warn('   On va traiter comme invité temporairement et demander le nom');
      // Ne pas bloquer, mais traiter comme invité et demander le nom
      // Cela permet de continuer même si le token n'est pas encore disponible
    }
    
    // Déterminer le nom à utiliser
    // Si l'utilisateur a un token ET un email (compte authentifié), utiliser son nom
    // Sinon (invité ou pas de token), utiliser le nom saisi dans le champ
    let finalGuestName = null;
    let clientName = null;
    
    if (isAuthenticatedClient) {
      // Client authentifié avec email ET token - utiliser le nom du compte
      clientName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email;
      logger.debug('✅ Client authentifié - Nom utilisé:', clientName);
    } else {
      // Invité ou pas de token/email - utiliser le nom saisi ou celui du localStorage
      // Si l'utilisateur a un email mais pas de token, utiliser quand même son nom du compte
      if (hasEmail && user && !user.isGuest) {
        // Client avec email mais sans token (problème de timing) - utiliser le nom du compte
        finalGuestName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name || user.email || guestName;
        logger.debug('⚠️ Client avec email mais sans token - Utilisation du nom du compte:', finalGuestName);
      } else {
        // Vrai invité - utiliser le nom saisi
        finalGuestName = guestName || user?.first_name || '';
        if (!finalGuestName?.trim()) {
          logger.error('❌ ERREUR: Invité sans nom');
          logger.error('   guestName:', guestName);
          logger.error('   user?.first_name:', user?.first_name);
          showError('Veuillez saisir votre nom pour finaliser la commande.');
          setIsProcessing(false);
          return;
        }
        logger.debug('✅ Invité - Nom utilisé:', finalGuestName);
      }
    }
    
    setIsProcessing(true);
    
    try {
      const paymentMethodLabel = paymentMethod === 'cash' ? 'en caisse' : 'par carte bancaire';
      logger.debug(`💵 Paiement ${paymentMethodLabel} - Création de la commande`);
      
      // Préparer les items de la commande avec toutes les informations nécessaires
      let orderItems = Array.isArray(items) ? items.map(item => ({
        productId: item?.id || item?.productId,
        quantity: item?.quantity || 1,
        price: item?.price || 0,
        productName: item?.name || item?.productName || 'Produit',
        subtotal: (item?.price || 0) * (item?.quantity || 1),
        notes: item?.notes || null
      })) : [];

      // Utiliser la récompense appliquée depuis HomeView ou celle sélectionnée dans le panier
      const rewardToUse = appliedReward || selectedLoyaltyReward;
      
      // Si une récompense de type produit est sélectionnée, ajouter le produit offert
      if (rewardToUse && rewardToUse.type === 'product' && rewardToUse.productId) {
        // Récupérer les informations du produit depuis les items du panier ou utiliser des valeurs par défaut
        const rewardProduct = items.find(item => (item?.id || item?.productId) === rewardToUse.productId);
        orderItems.push({
          productId: rewardToUse.productId,
          quantity: 1,
          price: rewardProduct?.price || 0,
          productName: rewardProduct?.name || rewardToUse.name || 'Produit offert',
          subtotal: 0, // Produit offert, donc subtotal = 0
          isReward: true, // Marquer comme produit offert
          notes: 'Produit offert via programme de fidélité'
        });
      }

      // Calculer les totaux pour la commande
      const orderTotal = calculateOrderTotal(subtotal, discountAmount);
      
      const orderData = {
        orderType: orderType,
        items: orderItems,
        promoCode: promoCode || null,
        loyaltyReward: rewardToUse ? {
          type: rewardToUse.type,
          name: rewardToUse.name,
          pointsRequired: rewardToUse.pointsRequired,
          discountValue: rewardToUse.discountValue || 0,
          productId: rewardToUse.productId || null,
          description: rewardToUse.description || ''
        } : selectedLoyaltyTier ? {
          type: 'tier',
          tier: selectedLoyaltyTier.points,
          reward: selectedLoyaltyTier.reward,
          discount: loyaltyDiscountAmount || 0
        } : null,
        paymentMethod: paymentMethod,
        notes: `Commande client ${clientName || finalGuestName || user?.first_name || user?.name || 'Invité'} - Paiement ${paymentMethodLabel}`,
        tableNumber: (tableNumberEnabled && orderType === 'dine-in' && tableNumber) ? tableNumber : null,
        // ✅ Ajouter les totaux pour Supabase
        subtotal: subtotal,
        discountAmount: discountAmount,
        taxAmount: orderTotal.tva,
        totalAmount: orderTotal.totalTTC
      };
        
      // Toujours envoyer un guestName pour s'assurer que le backend accepte la requête
      const nameForOrder = finalGuestName || clientName;
      if (nameForOrder) {
        orderData.guestName = nameForOrder;
        logger.debug('✅ Nom ajouté à la commande (guestName):', nameForOrder);
      }
      
      logger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.debug('🚀 FRONTEND - CartDrawer - Envoi commande');
      logger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.debug('📌 orderType:', orderType, `(type: ${typeof orderType})`);
      logger.debug('📌 Valeur exacte:', JSON.stringify(orderType));
      logger.debug('📌 Données complètes:', JSON.stringify(orderData, null, 2));
      logger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      logger.debug('🔄 Appel de createOrder...');
      const orderResult = await createOrder(orderData);
      
      logger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.debug('📊 RÉSULTAT CRÉATION COMMANDE');
      logger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.debug('✅ Success:', orderResult?.success);
      logger.debug('📦 Order:', orderResult?.order);
      logger.debug('❌ Error:', orderResult?.error);
      logger.debug('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      if (orderResult && orderResult.success) {
        // Les points de fidélité seront ajoutés automatiquement lorsque la commande sera payée (statut "completed")
        let message;
        
        const paymentText = paymentMethod === 'cash' ? 'en caisse' : 'par carte bancaire';
        if (!isGuest) {
          const points = Math.floor(safeTotalTTC);
          message = `Commande créée ! Payez ${formatPrice(safeTotalTTC, true)} ${paymentText}. Vous obtiendrez ${points} points lorsque la commande sera payée.`;
        } else {
          message = `Commande créée ! Payez ${formatPrice(safeTotalTTC, true)} ${paymentText}.`;
        }
        
        success(message);
        onClose();
        
        // Vider le panier
        if (clearCart) {
          clearCart();
        }
        
        // Recharger pour actualiser les commandes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(orderResult?.error || 'La création de la commande a échoué');
      }
    } catch (err) {
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('❌ ERREUR PAIEMENT/COMMANDE');
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.error('Type:', err?.name);
      logger.error('Message:', err?.message);
      logger.error('Stack:', err?.stack);
      logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      showError(`Erreur lors de la création de la commande: ${err?.message || 'Erreur inconnue'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Sécurisation des valeurs pour l'affichage
  const safeItems = Array.isArray(items) ? items : [];
  const safeSubtotal = parseFloat(subtotal) || 0;
  
  // Utiliser les montants de réduction depuis le store (déjà calculés)
  const safePromoDiscountAmount = parseFloat(promoDiscountAmount) || 0;
  const safeLoyaltyDiscountAmount = parseFloat(loyaltyDiscountAmount) || 0;
  const safeTotalDiscountAmount = parseFloat(discountAmount) || 0; // Total des réductions
  
  // Calculer le pourcentage de réduction du code promo pour l'affichage
  let promoDiscountPercentage = 0;
  if (promoCode && safePromoDiscountAmount > 0 && safeSubtotal > 0) {
    if (discountPercentage && discountPercentage > 0) {
      promoDiscountPercentage = parseFloat(discountPercentage);
    } else if (promoData) {
      if (promoData.discount_type === 'percentage' && promoData.discount_value) {
        promoDiscountPercentage = parseFloat(promoData.discount_value) || 0;
      } else if (promoData.discount_type === 'fixed' && safeSubtotal > 0) {
        promoDiscountPercentage = parseFloat(((safePromoDiscountAmount / safeSubtotal) * 100).toFixed(2)) || 0;
      }
    } else {
      promoDiscountPercentage = parseFloat(((safePromoDiscountAmount / safeSubtotal) * 100).toFixed(2)) || 0;
    }
  }
  
  // Calculer le pourcentage de réduction de fidélité pour l'affichage
  let loyaltyDiscountPercentage = 0;
  if (appliedReward && appliedReward.type === 'percentage' && safeLoyaltyDiscountAmount > 0 && safeSubtotal > 0) {
    loyaltyDiscountPercentage = parseFloat(appliedReward.discountValue) || 0;
    if (loyaltyDiscountPercentage === 0) {
      loyaltyDiscountPercentage = parseFloat(((safeLoyaltyDiscountAmount / safeSubtotal) * 100).toFixed(2)) || 0;
    }
  } else if (selectedLoyaltyReward && selectedLoyaltyReward.type === 'percentage' && safeLoyaltyDiscountAmount > 0 && safeSubtotal > 0) {
    loyaltyDiscountPercentage = parseFloat(selectedLoyaltyReward.discountValue) || 0;
  }
  
  // Calcul du total TTC avec TVA (sous-total HT - toutes les réductions HT, puis TVA)
  // Le safeSubtotal est maintenant HT (depuis cartStore.getSubtotal())
  const orderTotal = calculateOrderTotal(safeSubtotal, safeTotalDiscountAmount);
  const safeTotalTTC = orderTotal.totalTTC;
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 pt-20 md:pt-24 lg:pt-28 h-full lg:h-full pb-20 lg:pb-0 w-full md:w-96 bg-white shadow-elegant z-50 overflow-y-auto animate-slide-in">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h2 className="text-2xl font-heading font-bold text-black">Votre Panier</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-neutral-100 transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Fermer le panier"
            >
              <X className="w-6 h-6 text-black" />
            </button>
          </div>
          
          {/* Contenu */}
          {safeItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-neutral-400" />
              </div>
              <p className="text-neutral-600 font-sans">Votre panier est vide</p>
            </div>
          ) : (
            <>
              {/* Sélection du type de commande - AVANT les produits */}
              <div className="mb-4 p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Type de commande <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      if (selectOrderType) {
                        selectOrderType('dine-in');
                      } else {
                        // Fallback direct vers le store
                        useCartStore.setState({ orderType: 'dine-in' });
                      }
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      orderType === 'dine-in'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    Sur place
                  </button>
                  <button
                    onClick={() => {
                      if (selectOrderType) {
                        selectOrderType('takeaway');
                      } else {
                        // Fallback direct vers le store
                        useCartStore.setState({ orderType: 'takeaway' });
                      }
                    }}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                      orderType === 'takeaway'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-purple-400'
                    }`}
                  >
                    À emporter
                  </button>
                </div>
              </div>
              
              {/* Articles - Design inspiré de l'image */}
              <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-5rem-16rem)] md:max-h-[calc(100vh-6rem-16rem)] lg:max-h-[calc(100vh-7rem-16rem)]">
                {safeItems.map((item) => {
                  const itemPrice = parseFloat(item?.price) || 0;
                  const itemQuantity = parseInt(item?.quantity) || 0;
                  const itemTotal = itemPrice * itemQuantity;
                  
                  return (
                    <div 
                      key={item?.id || Math.random()} 
                      className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        {/* Image produit - horizontale comme dans l'image */}
                        <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item?.image_url ? (
                            <img 
                              src={`http://localhost:5000${item.image_url}`}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {item?.image ? (
                                <span className="text-2xl">{item.image}</span>
                              ) : (
                                <ImageIcon className="w-8 h-8 text-gray-400" />
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Informations produit */}
                        <div className="flex-1 min-w-0">
                          {/* Nom du produit et prix */}
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-gray-900 text-base leading-tight pr-2">
                              {item?.name || 'Produit'}
                            </h3>
                            <span className="font-bold text-gray-900 text-lg whitespace-nowrap">
                              {formatPrice(calculateTTC(itemTotal), true)}
                            </span>
                          </div>
                          
                          {/* Prix unitaire */}
                          <div className="text-sm text-gray-600 mb-3">
                            {formatPrice(calculateTTC(itemPrice), true)} par unité
                          </div>
                          
                          {/* Sélecteur de quantité - boutons circulaires */}
                          <div className="flex items-center gap-3 mb-3">
                            <button
                              onClick={() => decrement && decrement(item?.id)}
                              className="w-8 h-8 rounded-full border-2 border-red-500 bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors duration-200"
                              aria-label="Diminuer"
                            >
                              <Minus className="w-3 h-3 text-red-500" />
                            </button>
                            <span className="font-bold text-gray-900 text-lg min-w-[20px] text-center">
                              {itemQuantity}
                            </span>
                            <button
                              onClick={() => increment && increment(item?.id)}
                              className="w-8 h-8 rounded-full border-2 border-red-500 bg-white flex items-center justify-center hover:bg-red-50 transition-colors duration-200"
                              aria-label="Augmenter"
                            >
                              <Plus className="w-3 h-3 text-red-500" />
                            </button>
                            <button
                              onClick={() => remove && remove(item?.id)}
                              className="ml-auto w-8 h-8 rounded-full border-2 border-red-500 bg-white flex items-center justify-center hover:bg-red-50 transition-colors duration-200"
                              aria-label="Supprimer le produit"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Récompense appliquée depuis HomeView */}
              {appliedReward && (
                <div className="mb-4 p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="font-bold text-sm text-emerald-900">
                          Récompense appliquée : {appliedReward.name}
                        </div>
                        <div className="text-xs text-emerald-700">
                          {appliedReward.type === 'percentage' 
                            ? `Réduction de ${appliedReward.discountValue || 0}%`
                            : 'Produit gratuit'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600">
                      -{appliedReward.pointsRequired || 0} pts
                    </div>
                  </div>
                </div>
              )}
              
              {/* Récompenses de fidélité */}
              {!isGuest && user?.points !== undefined && (availableTiers.length > 0 || availableRewards.length > 0) && !appliedReward && (
                <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-sm text-purple-900">Récompenses fidélité</span>
                    <span className="text-xs text-purple-600">({user.points} points)</span>
                  </div>
                  
                  {/* Récompenses configurées */}
                  {availableRewards.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {availableRewards.map((reward, index) => {
                        const isSelected = selectedLoyaltyReward?.pointsRequired === reward.pointsRequired;
                        const rewardLabel = reward.type === 'product' 
                          ? `${reward.name || 'Produit offert'} (Gratuit)`
                          : `${reward.name || 'Réduction'} (-${reward.discountValue || 0}%)`;
                        
                        return (
                          <button
                            key={`reward-${index}`}
                            onClick={() => handleSelectLoyaltyReward(reward)}
                            className={`w-full p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'bg-purple-600 border-purple-700 text-white'
                                : 'bg-white border-purple-200 hover:border-purple-400 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                <div className={`font-bold ${isSelected ? 'text-white' : 'text-purple-700'}`}>
                                  {rewardLabel}
                                </div>
                                <div className={`text-xs ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
                                  {reward.pointsRequired} points requis
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-white font-bold">✓</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Paliers (ancien système - pour compatibilité) */}
                  {availableTiers.length > 0 && (
                    <div className="space-y-2">
                      {availableTiers.map((tier, index) => {
                        const isSelected = selectedLoyaltyTier?.points === tier.points && !selectedLoyaltyReward;
                        
                        return (
                          <button
                            key={`tier-${index}`}
                            onClick={() => handleSelectLoyaltyTier(tier)}
                            className={`w-full p-3 rounded-lg border-2 transition-all ${
                              isSelected
                                ? 'bg-purple-600 border-purple-700 text-white'
                                : 'bg-white border-purple-200 hover:border-purple-400 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                <div className={`font-bold ${isSelected ? 'text-white' : 'text-purple-700'}`}>
                                  {tier.reward || `Palier ${tier.points} points`}
                                </div>
                                <div className={`text-xs ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
                                  {tier.points} points requis
                                </div>
                              </div>
                              {isSelected && (
                                <div className="text-white font-bold">✓</div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Code promo */}
              <div className="mb-4 p-3 bg-neutral-50 rounded-xl border-2 border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-sm">Code promo</span>
                </div>
                {promoCode ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                      <div className="font-bold text-green-700">{promoCode}</div>
                      <div className="text-sm text-green-600">-{parseFloat(promoDiscountPercentage).toFixed(2)}%</div>
                    </div>
                    <button
                      onClick={removePromo}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Retirer
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Entrer un code"
                      value={promoInput}
                      onChange={(e) => setPromoInput((e?.target?.value || '').toUpperCase())}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={!promoInput}
                    >
                      Appliquer
                    </Button>
                  </div>
                )}
              </div>
              
              {/* Récapitulatif des réductions */}
              {(safeLoyaltyDiscountAmount > 0 || safePromoDiscountAmount > 0) && (
                <div className="mb-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-5 h-5 text-green-600" />
                      <h3 className="font-heading font-bold text-sm text-green-900">Réductions appliquées</h3>
                    </div>
                    <div className="px-3 py-1 bg-green-100 rounded-full">
                      <span className="font-bold text-sm text-green-700">
                        -{formatPrice(safeTotalDiscountAmount * 1.10)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {safeLoyaltyDiscountAmount > 0 && (
                      <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Gift className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-purple-900 truncate">
                              {appliedReward?.name || selectedLoyaltyReward?.name || 'Récompense fidélité'}
                            </div>
                            <div className="text-xs text-purple-600">
                              {parseFloat(loyaltyDiscountPercentage).toFixed(2)}% de réduction
                            </div>
                          </div>
                          <button
                            onClick={async () => {
                              try {
                                const rewardToRemove = appliedReward || selectedLoyaltyReward;
                                
                                if (rewardToRemove && user?.id) {
                                  try {
                                    const pointsRequired = rewardToRemove.pointsRequired || 0;
                                    const rewardName = rewardToRemove.name || '';
                                    const rewardId = `${pointsRequired}_${rewardName}`;
                                    
                                    const stored = localStorage.getItem(`usedRewards_${user.id}`);
                                    if (stored) {
                                      try {
                                        const usedRewards = JSON.parse(stored);
                                        const newUsedRewards = usedRewards.filter(id => id !== rewardId);
                                        localStorage.setItem(`usedRewards_${user.id}`, JSON.stringify(newUsedRewards));
                                        
                                        setTimeout(() => {
                                          window.dispatchEvent(new CustomEvent('rewardRemoved', { 
                                            detail: { rewardId, userId: user.id, newUsedRewards } 
                                          }));
                                        }, 50);
                                      } catch (e) {
                                        localStorage.setItem(`usedRewards_${user.id}`, JSON.stringify([]));
                                      }
                                    } else {
                                      localStorage.setItem(`usedRewards_${user.id}`, JSON.stringify([]));
                                      setTimeout(() => {
                                        window.dispatchEvent(new CustomEvent('rewardRemoved', { 
                                          detail: { rewardId, userId: user.id, newUsedRewards: [] } 
                                        }));
                                      }, 50);
                                    }
                                  } catch (e) {
                                    logger.error('❌ Erreur mise à jour localStorage:', e);
                                  }
                                }
                                
                                success('Promotion de fidélité retirée');
                                removeLoyaltyReward();
                                setSelectedLoyaltyReward(null);
                                setSelectedLoyaltyTier(null);
                              } catch (error) {
                                logger.error('❌ Erreur retrait récompense:', error);
                                showError('Erreur lors du retrait de la promotion');
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                            title="Retirer la promotion"
                            aria-label="Retirer la promotion de fidélité"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="ml-2">
                          <span className="font-bold text-sm text-purple-700">
                            -{formatPrice(safeLoyaltyDiscountAmount * 1.10)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {safePromoDiscountAmount > 0 && (
                      <div className="flex items-center justify-between p-2 bg-white/60 rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Tag className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs text-green-900 truncate">
                              Code promo: {promoCode}
                            </div>
                            <div className="text-xs text-green-600">
                              {parseFloat(promoDiscountPercentage).toFixed(2)}% de réduction
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              removePromo();
                              success('Code promo retiré');
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                            title="Retirer le code promo"
                            aria-label="Retirer le code promo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="ml-2">
                          <span className="font-bold text-sm text-green-700">
                            -{formatPrice(safePromoDiscountAmount * 1.10)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Total économisé - mise en évidence */}
                  <div className="mt-3 pt-3 border-t-2 border-green-200">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-green-900">Total économisé</span>
                      <span className="font-bold text-lg text-green-700">
                        -{formatPrice(safeTotalDiscountAmount * 1.10)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Résumé */}
              <div className="border-t border-gray-200 pt-3 mb-4 space-y-2">
                {/* Affichage du sous-total TTC pour correspondre à l'affichage des articles */}
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 font-sans">Sous-total TTC</span>
                  <span className="font-heading font-semibold text-black">{formatPrice(orderTotal.subtotalTTC)}</span>
                </div>
                {/* Affichage du sous-total HT pour information */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-sans">dont HT</span>
                  <span className="font-heading">{formatPrice(orderTotal.subtotalHT)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="font-sans">TVA (10%)</span>
                  <span className="font-heading font-semibold">{formatPrice(orderTotal.tva)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-2">
                  <span>Total TTC</span>
                  <span className="text-amber-500">{formatPrice(orderTotal.totalTTC)}</span>
                </div>
              </div>
              
              {/* Champ nom invité (si invité - pas de compte avec email ET token) */}
              {(!tokenForJSX || !user || !user.email || user.isGuest || isGuest) && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Votre nom <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Entrez votre nom"
                    value={guestName || user?.first_name || ''}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Ce nom sera associé à votre commande
                  </p>
                </div>
              )}
              
              {/* Affichage du nom du client connecté (si compte avec email ET token) */}
              {tokenForJSX && user && user.email && !user.isGuest && !isGuest && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Commande pour :</span>
                    <span className="text-sm font-bold text-blue-700">
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {user.email}
                  </p>
                </div>
              )}
              
              {/* Champ numéro de table (si activé et commande sur place) */}
              {tableNumberEnabled && orderType === 'dine-in' && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Numéro de table <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Entrez le numéro de table"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
              )}
              
              {/* Bouton commander */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handlePayment}
                icon={<CreditCard className="w-5 h-5" />}
                loading={isProcessing}
                disabled={isProcessing}
              >
                Commander • {formatPrice(safeTotalTTC, true)}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Modale de sélection du mode de paiement */}
      {showPaymentModal && (() => {
        // ✅ CORRECTION: Utiliser directement les items du hook useCart() qui sont déjà disponibles
        // Les items sont déjà récupérés via le hook useCart() au début du composant
        // Utiliser safeItems qui est déjà défini et sécurisé
        const modalItems = safeItems && safeItems.length > 0 
          ? safeItems 
          : (Array.isArray(items) && items.length > 0 
              ? items 
              : useCartStore.getState().items || []);
        
        logger.debug('🛒 Modal Payment - Items récupérés:', {
          safeItems: safeItems?.length || 0,
          hookItems: items?.length || 0,
          modalItems: modalItems?.length || 0
        });
        
        // ✅ S'assurer que modalItems est toujours un tableau
        const displayItems = Array.isArray(modalItems) ? modalItems : [];
        
        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4 pt-20 md:pt-24 lg:pt-28">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[calc(100vh-5rem-2rem)] md:max-h-[calc(100vh-6rem-2rem)] lg:max-h-[calc(100vh-7rem-2rem)] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-heading font-bold text-gray-900">
                Récapitulatif de la commande
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 rounded-xl hover:bg-neutral-100 transition-all duration-200"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Liste des produits - Affichage des articles */}
            {displayItems && displayItems.length > 0 ? (
              <div className="mb-6 border-b border-gray-200 pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Articles ({displayItems.length})
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {displayItems.map((item, index) => {
                    const itemPrice = parseFloat(item?.price) || 0;
                    const itemQuantity = parseInt(item?.quantity) || 1;
                    const itemSubtotal = calculateTTC(itemPrice) * itemQuantity;
                    const itemName = item?.name || item?.productName || 'Produit sans nom';
                    const itemImage = item?.image_url || item?.image || null;
                    const itemId = item?.id || item?.productId || `item-${index}`;

                    return (
                      <div key={itemId} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {itemImage ? (
                          <img
                            src={itemImage.startsWith('http') ? itemImage : `http://localhost:5000${itemImage}`}
                            alt={itemName}
                            className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        {!itemImage && (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {itemName}
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Quantité: <span className="font-bold">{itemQuantity}</span>
                          </p>
                          <p className="text-sm font-bold text-gray-900 mt-1">
                            {formatPrice(itemSubtotal, true)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="mb-6 border-b border-gray-200 pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Articles</h4>
                <p className="text-sm text-gray-500 text-center py-4">Aucun article dans le panier</p>
              </div>
            )}

            {/* Récapitulatif des totaux */}
            <div className="mb-6 border-b border-gray-200 pb-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 font-sans">Sous-total TTC</span>
                  <span className="font-heading font-semibold text-black">{formatPrice(orderTotal.subtotalTTC)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span className="font-sans">dont HT</span>
                  <span className="font-heading">{formatPrice(orderTotal.subtotalHT)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span className="font-sans">TVA (10%)</span>
                  <span className="font-heading font-semibold">{formatPrice(orderTotal.tva)}</span>
                </div>
                {safeTotalDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="font-sans">Réduction</span>
                    <span className="font-heading font-semibold">-{formatPrice(safeTotalDiscountAmount * 1.10)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t border-gray-300 pt-2 mt-2">
                  <span>Total TTC</span>
                  <span className="text-amber-500">{formatPrice(orderTotal.totalTTC)}</span>
                </div>
              </div>
            </div>

            {/* Type de commande */}
            {orderType && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Type de commande</p>
                <p className="text-sm font-semibold text-gray-900">
                  {orderType === 'dine-in' ? '🍽️ Sur place' : '🥡 À emporter'}
                </p>
              </div>
            )}

            <p className="text-gray-600 mb-6 text-sm">
              Sélectionnez votre mode de paiement pour finaliser la commande
            </p>
            
            <div className="space-y-3 mb-6">
              <button
                onClick={() => handleConfirmPayment('cash')}
                className="w-full p-4 border-2 border-gray-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <span className="text-2xl">💵</span>
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">En caisse</div>
                    <div className="text-sm text-gray-600">Paiement à la caisse</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => handleConfirmPayment('card')}
                className="w-full p-4 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-gray-900">Carte Bancaire</div>
                    <div className="text-sm text-gray-600">Paiement par CB</div>
                  </div>
                </div>
              </button>
            </div>
            
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowPaymentModal(false)}
            >
              Annuler
            </Button>
          </div>
        </div>
        );
      })()}
    </>
  );
};

export default CartDrawer;
