import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, MapPin, Clock, Tag, CreditCard, Image as ImageIcon } from 'lucide-react';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import useCart from '../../hooks/useCart';
import useAuth from '../../hooks/useAuth';
import useOrders from '../../hooks/useOrders';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useNotifications from '../../hooks/useNotifications';
import useSettings from '../../hooks/useSettings';
import paymentService from '../../services/paymentService';
import { calculateTTC, formatPrice, calculateOrderTotal } from '../../constants/pricing';

/**
 * Panier latéral avec paiement
 */
const CartDrawer = ({ isOpen, onClose }) => {
  const { 
    items, 
    orderType, 
    promoCode, 
    discount,
    subtotal, 
    discountAmount, 
    total, 
    increment, 
    decrement, 
    remove,
    applyPromo,
    removePromo
  } = useCart();
  const { user, isGuest } = useAuth();
  const { createOrder } = useOrders();
  const { updatePoints } = useAuthStore();
  const { clearCart } = useCartStore();
  const { success, error: showError } = useNotifications();
  const { tableNumberEnabled } = useSettings();
  
  const [showPayment, setShowPayment] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Par défaut : en caisse
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  
  // Logs de debug pour valeurs critiques
  useEffect(() => {
    if (isOpen) {
      console.log('🛒 CartDrawer - État du panier:');
      console.log('  - items:', items, 'length:', items?.length);
      console.log('  - total:', total, 'type:', typeof total);
      console.log('  - subtotal:', subtotal, 'type:', typeof subtotal);
      console.log('  - discountAmount:', discountAmount, 'type:', typeof discountAmount);
      console.log('  - orderType:', orderType, 'type:', typeof orderType);
      
      if (!items || items.length === 0) {
        console.warn('⚠️ Panier vide ou items undefined');
      }
      if (total === undefined || total === null || isNaN(total)) {
        console.warn('⚠️ Total invalide:', total);
      }
      if (!orderType) {
        console.warn('⚠️ orderType non défini');
      }
    }
  }, [isOpen, items, total, subtotal, discountAmount, orderType]);
  
  const handleApplyPromo = () => {
    if (!applyPromo) {
      console.error('❌ applyPromo function not available');
      showError('Service de code promo indisponible');
      return;
    }
    
    const result = applyPromo(promoInput);
    if (result && result.success) {
      success(`Code promo appliqué ! -${result.discount}%`);
      setPromoInput('');
    } else {
      showError(result?.error || 'Code promo invalide');
    }
  };
  
  const handlePayment = async () => {
    // Vérifications préalables
    if (!items || items.length === 0) {
      console.error('❌ Panier vide');
      showError('Votre panier est vide');
      return;
    }
    
    if (!orderType) {
      console.error('❌ Type de commande non défini');
      showError('Veuillez sélectionner un type de commande (Sur place ou À emporter)');
      return;
    }
    
    // Vérifier le numéro de table si activé et commande sur place
    if (tableNumberEnabled && orderType === 'dine-in' && !tableNumber) {
      console.error('❌ Numéro de table requis');
      showError('Veuillez indiquer votre numéro de table');
      return;
    }
    
    if (!createOrder) {
      console.error('❌ createOrder function not available');
      showError('Service de commande indisponible');
      return;
    }
    
    if (!paymentService) {
      console.error('❌ paymentService not available');
      showError('Service de paiement indisponible');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let paymentResult = null;
      
      // Paiement en caisse : pas de traitement de paiement en ligne
      if (paymentMethod === 'cash') {
        console.log('💵 Paiement en caisse - Création directe de la commande');
        paymentResult = { 
          data: { 
            id: `CASH-${Date.now()}`,
            status: 'pending_payment' // Paiement à effectuer en caisse
          } 
        };
      } 
      // Paiement en ligne (carte ou PayPal)
      else if (paymentMethod === 'card') {
        if (!paymentService.processCardPayment) {
          throw new Error('Service de paiement par carte indisponible');
        }
        paymentResult = await paymentService.processCardPayment(cardDetails, total);
      } else if (paymentMethod === 'paypal') {
        if (!paymentService.processPayPalPayment) {
          throw new Error('Service PayPal indisponible');
        }
        paymentResult = await paymentService.processPayPalPayment(total);
      }
      
      if (paymentResult && paymentResult.data) {
        // Créer la commande avec les champs attendus par le backend
        const orderData = {
          orderType: orderType,
          items: Array.isArray(items) ? items.map(item => ({
            productId: item?.id || item?.productId, // Le backend attend "productId"
            quantity: item?.quantity || 1
          })) : [],
          promoCode: promoCode || null,
          paymentMethod: paymentMethod === 'cash' ? 'cash' : (paymentMethod === 'card' ? 'card' : 'paypal'),
          notes: `Commande client ${user?.name || 'Invité'} - ${paymentMethod === 'cash' ? 'Paiement en caisse' : 'Paiement en ligne'}`,
          tableNumber: (tableNumberEnabled && orderType === 'dine-in' && tableNumber) ? tableNumber : null
        };
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 FRONTEND - CartDrawer - Envoi commande');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📌 orderType:', orderType, `(type: ${typeof orderType})`);
        console.log('📌 Valeur exacte:', JSON.stringify(orderType));
        console.log('📌 Données complètes:', JSON.stringify(orderData, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('🔄 Appel de createOrder...');
        const orderResult = await createOrder(orderData);
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📊 RÉSULTAT CRÉATION COMMANDE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Success:', orderResult?.success);
        console.log('📦 Order:', orderResult?.order);
        console.log('❌ Error:', orderResult?.error);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        if (orderResult && orderResult.success) {
          // Ajouter des points de fidélité uniquement si l'utilisateur n'est pas invité
          let message;
          
          if (!isGuest) {
            // Ajouter des points de fidélité (1 point par euro TTC dépensé)
            const points = Math.floor(safeTotalTTC);
            
            if (updatePoints) {
              updatePoints(points);
            }
            
            message = paymentMethod === 'cash' 
              ? `Commande créée ! Payez ${formatPrice(safeTotalTTC, true)} en caisse. +${points} points`
              : `Commande confirmée ! +${points} points de fidélité`;
          } else {
            // Pas de points pour les invités
            message = paymentMethod === 'cash' 
              ? `Commande créée ! Payez ${formatPrice(safeTotalTTC, true)} en caisse.`
              : `Commande confirmée !`;
          }
          
          success(message);
          setShowPayment(false);
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
      } else {
        throw new Error('Réponse de paiement invalide');
      }
    } catch (err) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ ERREUR PAIEMENT/COMMANDE');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Type:', err?.name);
      console.error('Message:', err?.message);
      console.error('Stack:', err?.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      showError(`Erreur lors de la création de la commande: ${err?.message || 'Erreur inconnue'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!isOpen) return null;
  
  // Sécurisation des valeurs pour l'affichage
  const safeItems = Array.isArray(items) ? items : [];
  const safeSubtotal = parseFloat(subtotal) || 0;
  const safeDiscountAmount = parseFloat(discountAmount) || 0;
  const safeDiscount = parseFloat(discount) || 0;
  
  // Calcul du total TTC avec TVA
  const orderTotal = calculateOrderTotal(safeSubtotal, safeDiscountAmount);
  const safeTotalTTC = orderTotal.totalTTC;
  
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white shadow-elegant z-50 overflow-y-auto animate-slide-in">
        <div className="p-6">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-neutral-200">
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
              {/* Articles - Design inspiré de l'image */}
              <div className="space-y-4 mb-6">
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
                          </div>
                          
                          {/* Lien d'action - Retirer seulement */}
                          <div className="flex">
                            <button
                              onClick={() => remove && remove(item?.id)}
                              className="text-gray-900 underline hover:text-red-600 transition-colors duration-200 text-sm"
                            >
                              Retirer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Code promo */}
              <div className="mb-6 p-4 bg-neutral-50 rounded-xl border-2 border-neutral-200">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-sm">Code promo</span>
                </div>
                {promoCode ? (
                  <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                    <div>
                      <div className="font-bold text-green-700">{promoCode}</div>
                      <div className="text-sm text-green-600">-{safeDiscount}%</div>
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
              
              {/* Résumé */}
              <div className="border-t border-gray-200 pt-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600 font-sans">Sous-total HT</span>
                  <span className="font-heading font-semibold text-black">{formatPrice(orderTotal.subtotalHT)}</span>
                </div>
                {safeDiscountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="font-sans">Réduction ({safeDiscount}%)</span>
                    <span className="font-heading font-semibold">-{formatPrice(safeDiscountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-amber-500">{formatPrice(orderTotal.totalTTC)}</span>
                </div>
              </div>
              
              {/* Informations */}
              <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {orderType === 'dine-in' ? 'Sur place' : orderType === 'takeaway' ? 'À emporter' : (orderType || 'Type non défini')}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">15-20 min</span>
                </div>
              </div>
              
              {/* Bouton commander */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setShowPayment(true)}
                icon={<CreditCard className="w-5 h-5" />}
              >
                Commander • {formatPrice(safeTotalTTC, true)}
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Modal paiement */}
      <Modal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        title="Paiement"
        size="md"
      >
        <div className="space-y-6">
          {/* Numéro de Table (si activé et commande sur place) */}
          {tableNumberEnabled && orderType === 'dine-in' && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="text-3xl">🪑</div>
                <div className="flex-1">
                  <h4 className="font-heading font-semibold text-blue-900 mb-1">
                    Numéro de Table
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Indiquez votre numéro de table pour que nous puissions vous servir
                  </p>
                  <Input
                    label="Numéro de table"
                    placeholder="Ex: 5, A3, B12..."
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e?.target?.value || '')}
                    required
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Méthode de paiement */}
          <div>
            <h4 className="font-semibold mb-3">Méthode de paiement</h4>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 rounded-xl border-2 transition ${
                  paymentMethod === 'cash' 
                    ? 'border-emerald-700 bg-emerald-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">💵</div>
                <div className="font-semibold text-sm">En caisse</div>
              </button>
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 transition ${
                  paymentMethod === 'card' 
                    ? 'border-sky-700 bg-sky-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-8 h-8 mb-2 mx-auto" />
                <div className="font-semibold text-sm">Carte</div>
              </button>
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`p-4 rounded-xl border-2 transition ${
                  paymentMethod === 'paypal' 
                    ? 'border-sky-700 bg-sky-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-2">💳</div>
                <div className="font-semibold text-sm">PayPal</div>
              </button>
            </div>
          </div>
          
          {/* Message paiement en caisse */}
          {paymentMethod === 'cash' && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-3xl">💵</div>
                <div>
                  <div className="font-semibold text-emerald-900 mb-1">
                    Paiement en caisse
                  </div>
                  <p className="text-sm text-emerald-700">
                    Votre commande sera créée et vous paierez lors du retrait
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Formulaire carte */}
          {paymentMethod === 'card' && (
            <div className="space-y-4">
              <Input
                label="Numéro de carte"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({...cardDetails, number: e?.target?.value || ''})}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Date d&apos;expiration"
                  placeholder="MM/AA"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({...cardDetails, expiry: e?.target?.value || ''})}
                  required
                />
                <Input
                  label="CVC"
                  placeholder="123"
                  value={cardDetails.cvc}
                  onChange={(e) => setCardDetails({...cardDetails, cvc: e?.target?.value || ''})}
                  required
                />
              </div>
              <Input
                label="Nom sur la carte"
                placeholder="Jean Dupont"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({...cardDetails, name: e?.target?.value || ''})}
                required
              />
            </div>
          )}
          
          {/* Résumé */}
          <div className="bg-gray-50 p-4 rounded-xl space-y-2">
            {safeDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Réduction</span>
                <span>-{formatPrice(safeDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold text-amber-500">{formatPrice(orderTotal.totalTTC)}</span>
            </div>
          </div>
          
          {/* Bouton payer */}
          <Button
            variant="success"
            size="lg"
            fullWidth
            onClick={handlePayment}
            loading={isProcessing}
            disabled={isProcessing || (paymentMethod === 'card' && (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc))}
          >
            {isProcessing ? 'Traitement...' : (paymentMethod === 'cash' ? `Confirmer la commande • ${formatPrice(safeTotalTTC, true)}` : `Payer ${formatPrice(safeTotalTTC, true)}`)}
          </Button>
          
          <p className="text-xs text-center text-gray-500">
            🔒 Paiement sécurisé • Vos données sont protégées
          </p>
        </div>
      </Modal>
    </>
  );
};

export default CartDrawer;
