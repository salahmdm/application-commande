import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, Info } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import CategoryFilterPOS from '../../components/manager/CategoryFilterPOS';
import ProductModal from '../../components/manager/ProductModal';
import PaymentWorkflowModal from '../../components/manager/PaymentWorkflowModal';
import useProducts from '../../hooks/useProducts';
import useProductStore from '../../store/productStore';
import useNotifications from '../../hooks/useNotifications';
import useSettings from '../../hooks/useSettings';
import orderService from '../../services/orderService';
import { ORDER_STATUS } from '../../constants/orderStatuses';
import { calculateTTC, formatPrice, TAX_RATE } from '../../constants/pricing';
import logger from '../../utils/logger';

/**
 * Point de Vente (POS) - Manager
 * Interface pour créer des commandes directement
 */
const ManagerPOS = () => {
  const { allProducts, categories } = useProducts();
  const { fetchAllProductsAdmin } = useProductStore();
  const { success, error: showError } = useNotifications();
  const { tableNumberEnabled } = useSettings();
  
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [orderType, setOrderType] = useState('dine-in');
  const [tableNumber, setTableNumber] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const paymentMethod = 'cash';
  const [productNotes, setProductNotes] = useState({}); // { productId: "note" }
  const [paymentWorkflowState, setPaymentWorkflowState] = useState({ isOpen: false, order: null });

  const parseWorkflowItems = useCallback((order) => {
    if (!order) return [];

    const rawItems = order.parsedItems ?? order.items ?? [];

    if (Array.isArray(rawItems)) {
      return rawItems;
    }

    if (typeof rawItems === 'string') {
      try {
        const parsed = JSON.parse(rawItems || '[]');
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (parsed && Array.isArray(parsed.items)) {
          return parsed.items;
        }
      } catch (error) {
        logger.warn('ManagerPOS - parseWorkflowItems: impossible de parser items', error);
      }
    }

    return [];
  }, []);

  const parseWorkflowPayments = useCallback((order) => {
    if (!order) return [];

    const rawPayments = order.parsedPayments ?? order.payments ?? order.payment_details ?? order.paymentDetails ?? null;

    const normalize = (payment, index) => {
      if (!payment) return null;
      const amount = parseFloat(payment.amount ?? payment.value ?? payment.total ?? 0) || 0;
      if (amount <= 0) return null;
      return {
        id: payment.id ?? index ?? null,
        method: (payment.method || payment.payment_method || payment.mode || 'cash').toLowerCase(),
        amount,
        reference: payment.reference || payment.note || ''
      };
    };

    if (Array.isArray(rawPayments)) {
      return rawPayments.map((payment, index) => normalize(payment, index)).filter(Boolean);
    }

    if (typeof rawPayments === 'string') {
      try {
        const parsed = JSON.parse(rawPayments);
        if (Array.isArray(parsed)) {
          return parsed.map((payment, index) => normalize(payment, index)).filter(Boolean);
        }
        if (parsed && Array.isArray(parsed.payments)) {
          return parsed.payments.map((payment, index) => normalize(payment, index)).filter(Boolean);
        }
      } catch (error) {
        logger.warn('ManagerPOS - parseWorkflowPayments: impossible de parser le JSON', error);
      }
    }

    if (rawPayments && Array.isArray(rawPayments.payments)) {
      return rawPayments.payments.map((payment, index) => normalize(payment, index)).filter(Boolean);
    }

    return [];
  }, []);

  const resetPOSForm = useCallback(() => {
    setCart([]);
    setCustomerName('');
    setTableNumber('');
    setPromoCode('');
    setPromoDiscount(0);
    setProductNotes({});
    setShowMobileCart(false);
  }, [setCart, setCustomerName, setTableNumber, setPromoCode, setPromoDiscount, setProductNotes, setShowMobileCart]);

  const paymentWorkflowOrder = paymentWorkflowState.order;
  const isPaymentWorkflowOpen = paymentWorkflowState.isOpen;

  const handlePaymentWorkflowClose = useCallback((updatedOrder = null) => {
    setPaymentWorkflowState({ isOpen: false, order: null });

    if (updatedOrder) {
      resetPOSForm();
      success('Paiement réalisé. Commande envoyée en préparation.');
    } else {
      resetPOSForm();
      showError('Paiement non finalisé. La commande reste en attente dans Gestion de commande.');
    }
  }, [resetPOSForm, success, showError]);

  const handlePaymentWorkflowSubmit = useCallback(async (payload) => {
    if (!paymentWorkflowOrder) {
      return { success: false, error: 'Commande introuvable pour le paiement.' };
    }

    try {
      const response = await orderService.completePaymentWorkflow(paymentWorkflowOrder.id, payload);

      if (!response.success) {
        throw new Error(response.error || "Erreur lors de l'enregistrement du paiement");
      }

      const updatedOrderRaw = response.data || {};
      const updatedOrder = {
        ...paymentWorkflowOrder,
        ...updatedOrderRaw,
        parsedItems: parseWorkflowItems(updatedOrderRaw),
        parsedPayments: parseWorkflowPayments(updatedOrderRaw)
      };

      return { success: true, updatedOrder };
    } catch (error) {
      logger.error('❌ ManagerPOS - Erreur workflow paiement:', error);
      showError(error.message || "Impossible d'enregistrer le paiement");
      return { success: false, error: error.message };
    }
  }, [paymentWorkflowOrder, parseWorkflowItems, parseWorkflowPayments, showError]);
  
  // Charger tous les produits (actifs ET inactifs) pour le POS
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        logger.log('🔄 ManagerPOS - Chargement de tous les produits...');
        await fetchAllProductsAdmin();
        logger.log('✅ ManagerPOS - Tous les produits chargés');
      } catch (error) {
        logger.error('❌ ManagerPOS - Erreur chargement produits:', error);
      }
    };
    
    loadAllProducts();
  }, [fetchAllProductsAdmin]);
  
  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];
    
    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(p => {
        const matchSlug = p.category_slug === selectedCategory;
        const matchId = p.category_id === parseInt(selectedCategory);
        const matchName = p.category_name === selectedCategory;
        const matchIdString = p.category_id?.toString() === selectedCategory;
        const matchSlugString = p.category_slug === selectedCategory;
        return matchSlug || matchId || matchName || matchIdString || matchSlugString;
      });
    }
    
    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query)) ||
        (p.category_name && p.category_name.toLowerCase().includes(query))
      );
    }
    
    // Tri par nom (par défaut)
    filtered.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
    
    return filtered;
  }, [allProducts, selectedCategory, searchQuery]);
  
  // Ajouter au panier
  const addToCart = (product) => {
    if (!product.is_available) {
      showError('Ce produit n\'est pas disponible');
      return;
    }
    
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };
  
  // Modifier la quantité
  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean));
  };
  
  // Retirer du panier
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  // Vider le panier
  const clearCart = () => {
    if (window.confirm('Vider le panier ?')) {
      setCart([]);
      setCustomerName('');
      setTableNumber('');
    }
  };
  
  // Calculer les totaux
  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price || 0) * item.quantity), 0);
  const discountAmount = promoDiscount;
  const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = subtotalAfterDiscount * TAX_RATE; // TVA
  const total = subtotalAfterDiscount + taxAmount;
  
  // Vérifier le code promo (à implémenter avec l'API)
  const handlePromoCodeCheck = async () => {
    if (!promoCode.trim()) {
      setPromoDiscount(0);
      return;
    }
    
    try {
      // TODO: Implémenter la vérification du code promo via API
      showError('Vérification des codes promo à implémenter');
    } catch (error) {
      showError('Erreur lors de la vérification du code promo');
    }
  };
  
  // Créer la commande
  const handleCreateOrder = async () => {
    if (cart.length === 0) {
      showError('Le panier est vide');
      return;
    }
    
    setProcessing(true);
    try {
      const trimmedName = customerName.trim();
      const orderData = {
        orderType,
        customerName: trimmedName || null,
        tableNumber: orderType === 'dine-in' ? tableNumber : null,
        items: cart.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
          notes: productNotes[item.id] || null
        })),
        subtotal: subtotalAfterDiscount,
        discountAmount,
        taxAmount,
        totalAmount: total,
        status: ORDER_STATUS.PENDING,
        paymentMethod,
        promoCode: promoCode.trim() || null,
        notes: trimmedName || null
      };
      
      // ✅ SÉCURITÉ: Ne logger que les informations non sensibles
      logger.debug('🚀 FRONTEND - ManagerPOS - Envoi commande');
      logger.debug('📌 orderType:', orderType);
      // ✅ SÉCURITÉ: Ne pas logger les données complètes (contiennent customerName, etc.)
      
      const response = await orderService.createOrder(orderData);
      
      if (response.success) {
        const createdOrderId = response.data?.orderId || response.data?.id;
        const createdOrderNumber = response.data?.orderNumber;

        if (!createdOrderId) {
          throw new Error("Identifiant de commande manquant dans la réponse.");
        }

        try {
          const orderDetailsResp = await orderService.getOrderById(createdOrderId);

          if (!orderDetailsResp?.success || !orderDetailsResp.data) {
            throw new Error(orderDetailsResp?.error || 'Impossible de récupérer les détails de la commande.');
          }

          const orderDetails = orderDetailsResp.data;
          const normalizedOrder = {
            ...orderDetails,
            parsedItems: parseWorkflowItems(orderDetails),
            parsedPayments: parseWorkflowPayments(orderDetails)
          };

          setPaymentWorkflowState({ isOpen: true, order: normalizedOrder });
          success(`Commande ${createdOrderNumber || orderDetails.order_number || createdOrderId} créée. Procédez au paiement.`);
          // ✅ SÉCURITÉ: Ne pas logger les données complètes de la commande (contiennent customerName, etc.)
          logger.debug('✅ Commande créée avec succès');
        } catch (detailError) {
          logger.error('⚠️ Commande créée mais échec du chargement pour le paiement:', detailError);
          showError(`Commande créée (n° ${createdOrderNumber || createdOrderId}) mais impossible d'ouvrir la confirmation de paiement. Finalisez-la depuis Gestion de commande.`);
          resetPOSForm();
        }
      }
    } catch (error) {
      logger.error('❌ Erreur création commande:', error);
      logger.error('   Type:', error.name);
      logger.error('   Message:', error.message);
      logger.error('   Détails:', error);
      
      // Message d'erreur plus détaillé
      const errorMessage = error.message || error.error || 'Erreur lors de la création de la commande';
      showError(`Erreur: ${errorMessage}`);
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-[calc(100vh-6rem)] lg:h-[calc(100vh-7rem)] pl-5 sm:pl-5 md:pl-10 pr-0 overflow-hidden">
      {/* En-tête - Fixe en haut */}
      <div className="flex-shrink-0 pr-0 pt-6 md:pt-8 pb-4">
        {/* En-tête amélioré */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-heading font-bold text-black leading-tight"></h1>
          </div>
        </div>
      </div>
      
      {/* Zone principale - Flex pour prendre toute la hauteur restante */}
      <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">
        {/* Catalogue Produits - Colonnes adaptées avec scroll */}
        <div className="flex-1 flex flex-col min-h-0 pr-3">
          {/* Filtres de catégories POS avec recherche - Fixe en haut */}
          <div className="flex-shrink-0 sticky top-0 z-20 bg-white pb-3 pt-3 shadow-md overflow-visible">
            <CategoryFilterPOS 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isSearchExpanded={isSearchExpanded}
              onSearchToggle={setIsSearchExpanded}
            />
          </div>
          
          {/* Grille de produits responsive, compacte - Scrollable */}
          <div className="flex-1 overflow-y-auto space-y-3">
          <div className="grid gap-3 sm:gap-4 md:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                padding="sm"
                onClick={() => {
                  if (product.is_available) {
                    addToCart(product);
                  }
                }}
                className={`rounded-xl p-3 sm:p-2 md:p-3 transition-all min-h-[200px] sm:min-h-[225px] border-2 bg-white ${
                  product.is_available 
                    ? 'cursor-pointer shadow-lg scale-[1.02] active:scale-[0.98] border-neutral-600' 
                    : 'opacity-60 cursor-not-allowed border-neutral-400 shadow-sm'
                }`}
              >
                <div className="flex flex-col h-full relative min-h-[200px] sm:min-h-[225px]">
                  {/* Prix en haut à gauche dans un petit cadre */}
                  <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-lg shadow-lg">
                    <div className="text-base sm:text-lg font-heading font-bold text-white">
                      {formatPrice(calculateTTC(product.price))}
                    </div>
                  </div>
                  
                  {/* Icône d'information en haut à droite - point d'exclamation */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    className="absolute top-2 right-2 z-10 w-7 h-7 bg-neutral-400/50 hover:bg-neutral-400/70 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 backdrop-blur-sm"
                    title="Voir les ingrédients"
                  >
                    <Info className="w-6 h-6 text-neutral-60" />
                  </button>

                  {/* Image produit - Supprimée pour manager/admin */}
                  
                  {/* Badges améliorés */}
                  {!product.is_available && (
                    <div className="mb-3 mt-4 flex flex-wrap gap-1">
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-heading font-bold">
                        Inactif
                      </span>
                    </div>
                  )}
                  
                  {/* Nom du produit */}
                  <div className="mb-3 mt-auto">
                    <div 
                      className="font-heading font-semibold text-xl sm:text-lg line-clamp-2 text-black leading-tight transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProduct(product);
                      }}
                    >
                      {product.name}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          </div>
        </div>
        
        {/* Panier - Pleine hauteur, sans bordure à droite, jusqu'au bout de la page */}
        <div className="hidden xl:flex xl:flex-col flex-1 min-w-[24.64rem] max-w-[24.64rem] h-full">
          <div className="bg-white overflow-hidden h-full flex flex-col border-l border-t border-b border-neutral-200">
            {/* Header compact */}
            <div className="px-4 py-3 bg-black flex items-center justify-between border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-white" />
                <h3 className="text-base font-heading font-bold text-white">Panier</h3>
                {cart.length > 0 && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-semibold text-white">
                    {cart.length}
                  </span>
                )}
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  title="Vider le panier"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>

            {/* Type de commande - Compact */}
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
              <div className="flex gap-2">
                <button
                  onClick={() => setOrderType('dine-in')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    orderType === 'dine-in'
                      ? 'bg-black text-white'
                      : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  Sur place
                </button>
                <button
                  onClick={() => setOrderType('takeaway')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    orderType === 'takeaway'
                      ? 'bg-black text-white'
                      : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-neutral-300'
                  }`}
                >
                  À emporter
                </button>
              </div>
            </div>

            {/* Informations client - Compact */}
            <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 space-y-2">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nom du client (optionnel)"
                className="w-full px-3 py-2 rounded-lg border-2 border-neutral-200 bg-white text-sm focus:outline-none focus:border-black transition-colors"
              />
              {tableNumberEnabled && orderType === 'dine-in' && (
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Numéro de table"
                  className="w-full px-3 py-2 rounded-lg border-2 border-neutral-200 bg-white text-sm focus:outline-none focus:border-black transition-colors"
                />
              )}
            </div>

            {cart.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                  <ShoppingCart className="w-8 h-8 text-neutral-400" />
                </div>
                <p className="text-sm font-medium text-neutral-600">Panier vide</p>
                <p className="text-xs text-neutral-500 mt-1">Ajoutez des produits pour commencer</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Liste des articles */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-neutral-50 rounded-lg p-3 border-2 border-transparent hover:border-neutral-200 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-semibold text-sm text-neutral-900 line-clamp-2">{item.name}</h4>
                            <span className="text-sm font-bold text-neutral-900 whitespace-nowrap">
                              {formatPrice(calculateTTC(item.price) * item.quantity)}
                            </span>
                          </div>
                          
                          {/* Contrôles quantité */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-white border-2 border-neutral-200 rounded-lg overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                                aria-label="Diminuer"
                              >
                                <Minus className="w-3.5 h-3.5 text-neutral-600" />
                              </button>
                              <span className="w-8 text-center text-sm font-bold text-neutral-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                                aria-label="Augmenter"
                              >
                                <Plus className="w-3.5 h-3.5 text-neutral-600" />
                              </button>
                            </div>
                            
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 rounded hover:bg-red-50 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                            
                            {productNotes[item.id] && (
                              <span className="text-xs text-blue-600 italic truncate flex-1">
                                📝 {productNotes[item.id]}
                              </span>
                            )}
                          </div>
                          
                          {/* Bouton note */}
                          <button
                            onClick={() => {
                              const note = prompt('Note:', productNotes[item.id] || '');
                              if (note !== null) {
                                setProductNotes(prev => ({
                                  ...prev,
                                  [item.id]: note.trim() || undefined
                                }));
                              }
                            }}
                            className="mt-2 text-xs text-neutral-500 hover:text-black transition-colors"
                          >
                            {productNotes[item.id] ? 'Modifier note' : '+ Note'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Résumé et actions - Fixe en bas */}
                <div className="border-t-2 border-neutral-200 bg-white px-4 py-4 space-y-3 flex-shrink-0">
                  {/* Code promo - Compact */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Code promo"
                      className="flex-1 px-3 py-2 rounded-lg border-2 border-neutral-200 text-sm focus:outline-none focus:border-black transition-colors"
                    />
                    <button
                      onClick={handlePromoCodeCheck}
                      className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-sm font-semibold hover:bg-black transition-colors"
                    >
                      OK
                    </button>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex items-center justify-between text-sm bg-green-50 px-3 py-2 rounded-lg">
                      <span className="text-green-700 font-medium">Réduction appliquée</span>
                      <span className="text-green-700 font-bold">-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}

                  {/* Totaux simplifiés */}
                  <div className="space-y-1.5 pt-2 border-t border-neutral-200">
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>Sous-total HT</span>
                      <span className="font-semibold">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>TVA (10%)</span>
                      <span className="font-semibold">{formatPrice(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-neutral-200 mt-2">
                      <span className="text-base font-bold text-neutral-900">Total TTC</span>
                      <span className="text-xl font-bold text-black">{formatPrice(total)}</span>
                    </div>
                  </div>

                  {/* Bouton validation */}
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleCreateOrder}
                    disabled={cart.length === 0 || processing}
                    className="bg-black hover:bg-neutral-800 text-white font-bold py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    {processing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Traitement...
                      </span>
                    ) : (
                      'Valider la commande'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bouton flottant Panier (mobile/tablette) */}
      <div className="fixed bottom-20 right-4 xl:hidden z-40">
        <button
          onClick={() => setShowMobileCart(true)}
          className="bg-black text-white rounded-full shadow-elegant px-5 py-3 flex items-center gap-2 active:scale-95"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="font-heading font-semibold">Panier ({cart.length})</span>
        </button>
      </div>

      {/* Modal Panier Mobile/Tablette */}
      {showMobileCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 xl:hidden">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[90vh] overflow-hidden">
            {/* Header du modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-heading font-bold text-black text-lg">
                  Panier ({cart.length})
                </h3>
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Contenu du modal */}
            <div className="p-4 space-y-5 overflow-y-auto max-h-[calc(90vh-64px)]">
              {cart.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-200 flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-neutral-500" />
                  </div>
                  <p className="text-sm text-neutral-600 font-medium">Panier vide</p>
                  <p className="text-xs text-neutral-500 mt-1">Ajoutez des produits pour commencer la commande.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-white border border-neutral-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="font-heading font-semibold text-base text-neutral-900 truncate">{item.name}</h4>
                              <span className="text-sm font-semibold text-neutral-700">{formatPrice(calculateTTC(item.price) * item.quantity)}</span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">{formatPrice(calculateTTC(item.price))} / unité</p>
                          </div>

                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center bg-neutral-100 border border-neutral-200 rounded-xl overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-8 h-8 flex items-center justify-center text-neutral-700 hover:bg-neutral-200 transition-colors"
                                aria-label="Retirer"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-10 text-center font-heading font-semibold text-neutral-800 bg-white border-x border-neutral-200">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-8 h-8 flex items-center justify-center text-neutral-700 hover:bg-neutral-200 transition-colors"
                                aria-label="Ajouter"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-white border border-purple-200 rounded-2xl p-4 space-y-3">
                    {promoDiscount > 0 && (
                      <div className="flex justify-end">
                        <span className="text-xs font-semibold text-green-600">✓ -{formatPrice(promoDiscount, true)}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Code promo"
                        className="flex-1 px-3 py-2 rounded-xl border border-purple-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                      />
                      <button
                        onClick={handlePromoCodeCheck}
                        className="px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
                      >
                        Appliquer
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-3">
                    <div className="grid grid-cols-2 text-sm text-neutral-600">
                      <span>Sous-total HT</span>
                      <span className="text-right font-semibold text-neutral-800">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="grid grid-cols-2 text-sm text-neutral-600">
                      <span>TVA (10%)</span>
                      <span className="text-right font-semibold text-neutral-800">{formatPrice(taxAmount)}</span>
                    </div>
                    <div className="border-t border-dashed border-neutral-300 pt-3 flex items-center justify-between">
                      <span className="text-lg font-heading font-semibold text-neutral-900">Total TTC</span>
                      <span className="text-2xl font-heading font-bold text-neutral-900">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center justify-between text-sm text-neutral-600">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-4 h-4" />
                      <span>{cart.length} {cart.length > 1 ? 'articles' : 'article'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-700">
                      <span className="font-semibold">Total TTC</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-neutral-200 bg-white">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCreateOrder}
                  loading={processing}
                  disabled={processing}
                  className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-black hover:from-black hover:to-neutral-900 text-white font-heading font-bold py-4 rounded-2xl shadow-lg hover:shadow-xl transition-transform duration-200 transform hover:scale-[1.01]"
                >
                  {processing ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création en cours...
                    </span>
                  ) : (
                    <span>Paiement</span>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal détails produit */}
      <ProductModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
      />

      <PaymentWorkflowModal
        isOpen={isPaymentWorkflowOpen}
        order={paymentWorkflowOrder}
        onClose={handlePaymentWorkflowClose}
        onSubmit={handlePaymentWorkflowSubmit}
      />
    </div>
  );
};

export default ManagerPOS;
