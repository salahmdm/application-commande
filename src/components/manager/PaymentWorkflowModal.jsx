import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  X,
  Minus,
  Plus,
  Trash2,
  CreditCard,
  Wallet,
  CheckCircle2,
  FileText,
  Gift,
  Ticket,
  ArrowLeft,
  Mail
} from 'lucide-react';
import { formatPrice } from '../../constants/pricing';
import { formatOrderNumber } from '../../utils/orderHelpers';
import businessInfoService, { DEFAULT_BUSINESS_INFO, DEFAULT_TICKET_DISPLAY } from '../../services/businessInfoService';
import { downloadReceipt } from '../../services/receiptService';
import settingsService from '../../services/settingsService';
import { apiCall } from '../../services/api';
import logger from '../../utils/logger';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Espèces', icon: Wallet },
  { id: 'card', label: 'Carte', icon: CreditCard },
  { id: 'ticket', label: 'Tickets restaurant', icon: Ticket }
];

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

// STEP_ORDER non utilisé (était utilisé par StepIndicator qui a été supprimé)
// const STEP_ORDER = ['gestion', 'terminee'];

const clampDecimals = (value) => {
  const num = Number.parseFloat(String(value).replace(',', '.'));
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100) / 100;
};

const Button = React.forwardRef(({ className = '', type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={`px-5 py-3 rounded-xl font-heading font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-40 disabled:cursor-not-allowed ${className}`.trim()}
    {...props}
  />
));

Button.displayName = 'Button';

const pickFirstValue = (...values) => values.find((value) => value !== null && value !== undefined && value !== '');

const parseAmountOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number.parseFloat(String(value).replace(',', '.'));
  if (Number.isNaN(num)) return null;
  return Math.round(num * 100) / 100;
};

const parseItems = (order) => {
  if (!order) {
    logger.debug('⚠️ parseItems - order est null/undefined');
    return [];
  }
  
  let rawItems = [];
  
  // ✅ PRIORITÉ 1: order.parsedItems (déjà parsé)
  if (Array.isArray(order.parsedItems) && order.parsedItems.length > 0) {
    logger.debug('✅ parseItems - Utilisation de order.parsedItems:', order.parsedItems.length);
    rawItems = order.parsedItems;
  }
  // ✅ PRIORITÉ 2: order.items (tableau)
  else if (Array.isArray(order.items) && order.items.length > 0) {
    logger.debug('✅ parseItems - Utilisation de order.items (array):', order.items.length);
    rawItems = order.items;
  }
  // ✅ PRIORITÉ 3: order.items (string JSON)
  else if (typeof order.items === 'string' && order.items.trim()) {
    try {
      const parsed = JSON.parse(order.items);
      if (Array.isArray(parsed) && parsed.length > 0) {
        logger.debug('✅ parseItems - Utilisation de order.items (JSON parsed):', parsed.length);
        rawItems = parsed;
      } else {
        logger.debug('⚠️ parseItems - order.items (string) parsé mais vide ou non-array');
      }
    } catch (err) {
      logger.warn('⚠️ parseItems - Impossible de parser items JSON:', err.message);
    }
  }
  // ✅ PRIORITÉ 4: order.order_items (table relationnelle)
  else if (Array.isArray(order.order_items) && order.order_items.length > 0) {
    logger.debug('✅ parseItems - Utilisation de order.order_items:', order.order_items.length);
    rawItems = order.order_items;
  }
  else {
    logger.debug('⚠️ parseItems - Aucune source d\'articles trouvée:', {
      hasParsedItems: !!order.parsedItems,
      parsedItemsLength: order.parsedItems?.length || 0,
      hasItems: !!order.items,
      itemsType: typeof order.items,
      hasOrderItems: !!order.order_items,
      orderItemsLength: order.order_items?.length || 0
    });
  }

  // ✅ Normaliser et mapper les articles
  const normalizedItems = rawItems
    .filter(Boolean)
    .map((item) => {
      const quantity = clampDecimals(item.quantity ?? 0);
      const unitPrice = clampDecimals(item.unit_price ?? item.price ?? item.unitPrice ?? 0);
      const subtotal = clampDecimals(item.subtotal ?? quantity * unitPrice);
      const rawTaxRate =
        item.tax_rate ??
        item.taxRate ??
        item.tva_rate ??
        item.tvaRate ??
        item.vat_rate ??
        item.vatRate ??
        null;
      const taxRate =
        rawTaxRate === null || rawTaxRate === undefined || rawTaxRate === ''
          ? null
          : clampDecimals(rawTaxRate);
      return {
        id: item.id ?? null,
        productId: item.product_id ?? item.productId ?? null,
        name: item.product_name || item.name || 'Produit',
        quantity,
        unitPrice,
        subtotal,
        category: item.category_type || item.category || 'plat',
        taxRate
      };
    })
    .filter((item) => item.quantity > 0 || item.unitPrice > 0);
    
  logger.debug(`✅ parseItems - Résultat final: ${normalizedItems.length} article(s) normalisé(s)`);
  
  return normalizedItems;
};

const parsePayments = (order) => {
  if (!order) return [];

  const normalizePayment = (payment, index) => {
    const amount = clampDecimals(
      payment.amount ?? payment.value ?? payment.total ?? payment.montant ?? 0
    );
    if (amount <= 0) return null;
    return {
      id: payment.id ?? null,
      tempId: payment.tempId ?? `existing-${payment.id ?? index}`,
      method: (payment.method || payment.payment_method || payment.mode || 'cash').toLowerCase(),
      amount,
      reference: payment.reference || payment.note || ''
    };
  };

  if (Array.isArray(order.parsedPayments)) {
    return order.parsedPayments.map(normalizePayment).filter(Boolean);
  }

  const raw = order.payments || order.paymentDetails || order.payment_details;
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(normalizePayment).filter(Boolean);
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(normalizePayment).filter(Boolean);
      }
      if (parsed && Array.isArray(parsed.payments)) {
        return parsed.payments.map(normalizePayment).filter(Boolean);
      }
    } catch (err) {
      logger.warn('Impossible de parser payments JSON', err);
    }
  }

  if (raw && Array.isArray(raw.payments)) {
    return raw.payments.map(normalizePayment).filter(Boolean);
  }

  return [];
};

const PaymentWorkflowModal = ({ isOpen, order, onClose, onSubmit: _onSubmit }) => {
  const [step, setStep] = useState('gestion');
  const [items, setItems] = useState([]);
  const [initialItems, setInitialItems] = useState([]);
  const [removedItemIds, setRemovedItemIds] = useState([]);
  const [payments, setPayments] = useState([]);
  // initialPayments défini mais non utilisé (était utilisé dans resetPayments qui est commenté)
  // const [initialPayments, setInitialPayments] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null); // ✅ Aucun mode de paiement pré-sélectionné
  const [currentAmountInput, setCurrentAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(DEFAULT_BUSINESS_INFO);
  const [promos, setPromos] = useState([]);
  const [allPromos, setAllPromos] = useState([]); // Toutes les promos (non filtrées) pour conserver l'index
  const [showPromoDropdown, setShowPromoDropdown] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [showChangeConfirmationModal, setShowChangeConfirmationModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(null);

  const resetState = useCallback(() => {
    // ✅ DEBUG: Logger la structure de la commande pour comprendre le problème
    logger.debug('🔍 PaymentWorkflowModal.resetState - Structure de la commande:', {
      hasOrder: !!order,
      orderId: order?.id,
      orderNumber: order?.order_number,
      hasItems: !!order?.items,
      itemsType: typeof order?.items,
      itemsValue: typeof order?.items === 'string' ? order.items.substring(0, 100) : (Array.isArray(order?.items) ? `[Array(${order.items.length})]` : order?.items),
      hasParsedItems: !!order?.parsedItems,
      parsedItemsLength: order?.parsedItems?.length || 0,
      hasOrderItems: !!order?.order_items,
      orderItemsLength: order?.order_items?.length || 0,
      orderKeys: order ? Object.keys(order).filter(k => k.includes('item') || k.includes('Item') || k === 'items') : []
    });
    
    let finalItems = parseItems(order);
    
    // ✅ DEBUG: Logger le résultat du parsing
    logger.debug('🔍 PaymentWorkflowModal.resetState - Articles après parseItems:', {
      finalItemsLength: finalItems?.length || 0,
      finalItems: finalItems?.map(item => ({ id: item.id, name: item.name, quantity: item.quantity }))
    });
    
    // ✅ CORRECTION: Si toujours vide, essayer directement depuis order.items brut
    if (!finalItems || finalItems.length === 0) {
      logger.warn('⚠️ PaymentWorkflowModal.resetState - parseItems retourne vide, tentative de récupération directe');
      
      // Essayer directement depuis order.items brut avec différents formats
      if (order?.items) {
        try {
          let rawItems = null;
          if (Array.isArray(order.items)) {
            rawItems = order.items;
          } else if (typeof order.items === 'string') {
            rawItems = JSON.parse(order.items);
          }
          
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            logger.debug('✅ PaymentWorkflowModal.resetState - Récupération directe depuis order.items:', rawItems.length);
            finalItems = rawItems.map((item, idx) => ({
              id: item.id ?? item.order_item_id ?? item.product_id ?? `temp-${idx}`,
              productId: item.product_id ?? item.productId ?? null,
              name: item.product_name || item.name || 'Produit',
              quantity: clampDecimals(item.quantity ?? 1),
              unitPrice: clampDecimals(item.unit_price ?? item.price ?? item.unitPrice ?? 0),
              subtotal: clampDecimals((item.quantity ?? 1) * (item.unit_price ?? item.price ?? item.unitPrice ?? 0)),
              category: item.category_type || item.category || 'plat',
              taxRate: item.tax_rate ?? item.taxRate ?? null
            })).filter(item => item.quantity > 0);
          }
        } catch (e) {
          logger.error('❌ PaymentWorkflowModal.resetState - Erreur récupération directe:', e);
        }
      }
    }
    
    // ✅ DEBUG: Logger le résultat final
    logger.debug('🔍 PaymentWorkflowModal.resetState - Résultat final:', {
      finalItemsLength: finalItems?.length || 0,
      hasFinalItems: finalItems && finalItems.length > 0
    });

    const parsedPayments = parsePayments(order);

    const clonedItems = finalItems.map(item => ({ ...item }));
    const clonedItemsForInitial = finalItems.map(item => ({ ...item }));
    const clonedPayments = parsedPayments.map(payment => ({ ...payment }));
    // clonedPaymentsForInitial non utilisé (était utilisé pour initialPayments qui est commenté)
    // const clonedPaymentsForInitial = parsedPayments.map(payment => ({ ...payment }));

    // ✅ DEBUG: Logger ce qui sera stocké dans le state
    logger.debug('🔍 PaymentWorkflowModal.resetState - État final:', {
      clonedItemsLength: clonedItems?.length || 0,
      clonedPaymentsLength: clonedPayments?.length || 0
    });

    setItems(clonedItems);
    setInitialItems(clonedItemsForInitial);
    setRemovedItemIds([]);
    setPayments(clonedPayments);
    // setInitialPayments(clonedPaymentsForInitial); // initialPayments est commenté car non utilisé
    setSelectedMethod(null); // ✅ Aucun mode de paiement pré-sélectionné
    setCurrentAmountInput('');

    const rawNote = typeof order?.notes === 'string' ? order.notes.trim() : '';
    const normalizedNote = rawNote
      ? rawNote
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
      : '';
    const isLegacyNote = normalizedNote === 'commande cree par le manager';
    setNotes(isLegacyNote ? '' : (order?.notes || ''));
    setError(null);
    setSubmitting(false);
    setStep('gestion');
    setAppliedPromo(null);
    setShowPromoDropdown(false);
  }, [order]);

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen, resetState]);

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const loadBusinessInfo = async () => {
      try {
        const info = await businessInfoService.getBusinessInfo();
        if (active) {
          setBusinessInfo(info);
        }
      } catch (error) {
        logger.error('❌ Impossible de charger les informations entreprise:', error);
        if (active) {
          setBusinessInfo(DEFAULT_BUSINESS_INFO);
        }
      }
    };

    loadBusinessInfo();

    return () => {
      active = false;
    };
  }, [isOpen]);

  // Charger les promos depuis les settings et filtrer selon les limites
  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    const loadPromos = async () => {
      try {
        const response = await settingsService.getSetting('payment_promos');
        if (active && response.success && response.data) {
          try {
            const promosData = typeof response.data.value === 'string' 
              ? JSON.parse(response.data.value) 
              : response.data.value;
            if (Array.isArray(promosData)) {
              // Stocker toutes les promos pour conserver l'index original
              setAllPromos(promosData);
              
              // Filtrer les promos actives et valides pour l'affichage
              const now = new Date();
              const validPromos = promosData.filter(p => {
                // Vérifier si la promo est active
                if (p.isActive === false) return false;
                
                // Vérifier la date de début
                if (p.validFrom) {
                  const validFrom = new Date(p.validFrom);
                  if (validFrom > now) return false; // Pas encore commencé
                }
                
                // Vérifier la date de fin
                if (p.validUntil) {
                  const validUntil = new Date(p.validUntil);
                  if (validUntil < now) return false; // Déjà expiré
                }
                
                // Vérifier le nombre max d'utilisations
                if (p.maxUses !== null && p.maxUses !== undefined) {
                  const usesCount = p.usesCount || 0;
                  if (usesCount >= p.maxUses) return false;
                }
                
                return true;
              });
              
              setPromos(validPromos);
            }
          } catch (e) {
            logger.error('❌ Erreur parsing promos:', e);
          }
        }
      } catch (error) {
        logger.error('❌ Erreur chargement promos:', error);
      }
    };

    loadPromos();

    return () => {
      active = false;
    };
  }, [isOpen]);

  // Fermer le dropdown promo en cliquant en dehors
  useEffect(() => {
    if (!showPromoDropdown) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest('.promo-dropdown-container')) {
        setShowPromoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPromoDropdown]);

  const ticketDisplay = useMemo(() => ({
    ...DEFAULT_TICKET_DISPLAY,
    ...(businessInfo?.displayPreferences || {})
  }), [businessInfo]);

  // sanitizeValue défini mais non utilisé (était utilisé dans sanitizedBusinessInfo qui est commenté)
  // const sanitizeValue = useCallback((value) => {
  //   if (value === null || value === undefined) return '';
  //   return String(value).trim();
  // }, []);

  // sanitizedBusinessInfo calculé mais non utilisé (était utilisé dans ticketLegalLines qui est commenté)
  // const sanitizedBusinessInfo = useMemo(() => ({
  //   name: sanitizeValue(businessInfo?.name),
  //   address: sanitizeValue(businessInfo?.address),
  //   phone: sanitizeValue(businessInfo?.phone),
  //   website: sanitizeValue(businessInfo?.website),
  //   customerService: sanitizeValue(businessInfo?.customerService),
  //   email: sanitizeValue(businessInfo?.email),
  //   siret: sanitizeValue(businessInfo?.siret),
  //   vatNumber: sanitizeValue(businessInfo?.vatNumber),
  //   legalForm: sanitizeValue(businessInfo?.legalForm),
  //   shareCapital: sanitizeValue(businessInfo?.shareCapital),
  //   rcs: sanitizeValue(businessInfo?.rcs),
  //   paymentMention: sanitizeValue(businessInfo?.paymentMention),
  //   legalMentions: sanitizeValue(businessInfo?.legalMentions),
  //   returnPolicy: sanitizeValue(businessInfo?.returnPolicy),
  //   foodInfo: sanitizeValue(businessInfo?.foodInfo)
  // }), [businessInfo, sanitizeValue]);

  const totals = useMemo(() => {
    // ✅ Debug: Vérifier les données du code promo dans la commande
    if (order && (order.promo_code || order.promoCode || order.promo_code_id)) {
      logger.debug('🔍 PaymentWorkflowModal - Code promo détecté dans order:', {
        promo_code: order.promo_code,
        promoCode: order.promoCode,
        promo_code_id: order.promo_code_id,
        promo_code_description: order.promo_code_description,
        promo_discount_type: order.promo_discount_type,
        promo_discount_value: order.promo_discount_value,
        discount_amount: order.discount_amount,
        discountAmount: order.discountAmount
      });
    }
    
    const discount = clampDecimals(order?.discount_amount ?? order?.discountAmount ?? 0);
    const tax = clampDecimals(order?.tax_amount ?? 0);
    
    const subtotalFromItems = items.reduce((sum, item) => sum + clampDecimals(item.quantity * item.unitPrice), 0);
    
    const orderSubtotalRaw = pickFirstValue(
      order?.subtotal_amount,
      order?.subtotal,
      order?.sub_total,
      order?.amount_ht,
      order?.total_ht
    );
    const orderSubtotal = parseAmountOrNull(orderSubtotalRaw);
    const subtotal = orderSubtotal !== null ? orderSubtotal : subtotalFromItems;
    
    // Calculer la réduction de la promo si appliquée
    let promoDiscount = 0;
    if (appliedPromo) {
      if (appliedPromo.discountType === 'percentage') {
        promoDiscount = clampDecimals((orderSubtotal !== null ? orderSubtotal : subtotalFromItems) * (appliedPromo.discountValue / 100));
      } else {
        promoDiscount = clampDecimals(appliedPromo.discountValue);
      }
    }

    const orderTotalRaw = pickFirstValue(
      order?.total_amount,
      order?.total,
      order?.grand_total,
      order?.amount_ttc,
      order?.total_ttc
    );
    const orderTotal = parseAmountOrNull(orderTotalRaw);
    const totalBeforePromo = orderTotal !== null
      ? orderTotal
      : Math.max(0, subtotal - discount + tax);
    
    const total = Math.max(0, totalBeforePromo - promoDiscount);
    const amountPaid = payments.reduce((sum, payment) => sum + clampDecimals(payment.amount), 0);
    const remaining = Math.max(0, clampDecimals(total - amountPaid));
    const change = Math.max(0, clampDecimals(amountPaid - total));
    const itemCount = items.reduce((sum, item) => sum + clampDecimals(item.quantity), 0);

    return {
      discount,
      originalTotal: totalBeforePromo,
      promoDiscount,
      tax,
      subtotal: clampDecimals(subtotal),
      total: clampDecimals(total),
      amountPaid: clampDecimals(amountPaid),
      remaining,
      change,
      itemCount
    };
  }, [items, payments, order, appliedPromo]);

  // ticketTaxDetails calculé mais non utilisé (était utilisé dans ticketTaxEntries qui est commenté)
  // const ticketTaxDetails = useMemo(() => {
  //   return items.reduce((acc, item) => {
  //     const parsedRate = typeof item.taxRate === 'number' ? item.taxRate : Number.parseFloat(item.taxRate);
  //     const rate = Number.isFinite(parsedRate) ? parsedRate : 20;
  //     const roundedRate = Math.round(rate * 10) / 10;
  //     const key = roundedRate.toFixed(1);
  //     if (!acc[key]) {
  //       acc[key] = { base: 0, tax: 0 };
  //     }
  //     const lineTotal = clampDecimals(item.unitPrice * item.quantity);
  //     const baseHT = clampDecimals(lineTotal / (1 + rate / 100));
  //     const taxAmount = clampDecimals(lineTotal - baseHT);
  //     acc[key].base = clampDecimals(acc[key].base + baseHT);
  //     acc[key].tax = clampDecimals(acc[key].tax + taxAmount);
  //     return acc;
  //   }, {});
  // }, [items]);

  // ticketTaxEntries calculé mais non utilisé actuellement
  // const ticketTaxEntries = useMemo(() => {
  //   return Object.entries(ticketTaxDetails)
  //     .map(([rate, data]) => {
  //       const rateValue = Number.parseFloat(rate);
  //       let label = `TVA ${rate}%`;
  //       if (rateValue >= 9 && rateValue <= 11) {
  //         label = 'TVA 10% (Restauration)';
  //       } else if (rateValue <= 6) {
  //         label = 'TVA 5,5% (Boissons)';
  //       } else if (rateValue >= 19) {
  //         label = 'TVA 20%';
  //       }
  //       return {
  //         label,
  //         base: clampDecimals(data.base),
  //         tax: clampDecimals(data.tax),
  //         rateValue
  //       };
  //     })
  //     .filter((entry) => entry.base > 0 || entry.tax > 0)
  //     .sort((a, b) => b.rateValue - a.rateValue);
  // }, [ticketTaxDetails]);

  // ticketLegalLines calculé mais non utilisé actuellement
  // const ticketLegalLines = useMemo(() => {
  //   const lines = [];
  //   if (!businessInfo) return lines;
  //
  //   if (ticketDisplay.showLegalForm && sanitizedBusinessInfo.legalForm) {
  //     lines.push(
  //       `${sanitizedBusinessInfo.legalForm}${
  //         sanitizedBusinessInfo.shareCapital ? ` - Capital : ${sanitizedBusinessInfo.shareCapital}` : ''
  //       }`
  //     );
  //   } else if (ticketDisplay.showLegalForm && sanitizedBusinessInfo.shareCapital) {
  //     lines.push(`Capital : ${sanitizedBusinessInfo.shareCapital}`);
  //   }
  //
  //   if (ticketDisplay.showRcs && sanitizedBusinessInfo.rcs) {
  //     lines.push(`RCS : ${sanitizedBusinessInfo.rcs}`);
  //   }
  //   if (ticketDisplay.showPaymentMention && sanitizedBusinessInfo.paymentMention) {
  //     lines.push(sanitizedBusinessInfo.paymentMention);
  //   }
  //   if (ticketDisplay.showLegalMentions && sanitizedBusinessInfo.legalMentions) {
  //     lines.push(sanitizedBusinessInfo.legalMentions);
  //   }
  //   if (ticketDisplay.showReturnPolicy && sanitizedBusinessInfo.returnPolicy) {
  //     lines.push(sanitizedBusinessInfo.returnPolicy);
  //   }
  //   if (ticketDisplay.showFoodInfo && sanitizedBusinessInfo.foodInfo) {
  //     lines.push(sanitizedBusinessInfo.foodInfo);
  //   }
  //   if (ticketDisplay.showCustomerService && sanitizedBusinessInfo.customerService) {
  //     lines.push(`Service client : ${sanitizedBusinessInfo.customerService}`);
  //   }
  //   if (ticketDisplay.showWebsite && sanitizedBusinessInfo.website) {
  //     lines.push(`Site web : ${sanitizedBusinessInfo.website}`);
  //   }
  //   if (ticketDisplay.showEmail && sanitizedBusinessInfo.email) {
  //     lines.push(`Email : ${sanitizedBusinessInfo.email}`);
  //   }
  //   return lines;
  // }, [businessInfo, sanitizedBusinessInfo, ticketDisplay]);

  // amountPaid et changeAmount calculés mais non utilisés (utiliser totals.amountPaid et totals.change directement)
  // const amountPaid = clampDecimals(totals.amountPaid);
  // const changeAmount = clampDecimals(totals.change);
  const mainPayment = payments.length > 0 ? payments[payments.length - 1] : null;
  // paymentMethodLabels défini mais non utilisé (était utilisé dans displayedPaymentMethod qui est commenté)
  // const paymentMethodLabels = {
  //   cash: 'Espèces',
  //   card: 'Carte bancaire',
  //   stripe: 'Carte bancaire',
  //   paypal: 'PayPal',
  //   mixed: 'Paiement mixte',
  //   voucher: 'Bon / chèque cadeau',
  //   other: 'Autre',
  //   check: 'Chèque',
  //   transfer: 'Virement'
  // };
  // displayedPaymentMethod calculé mais non utilisé
  // const displayedPaymentMethod = mainPayment ? (paymentMethodLabels[mainPayment.method] || mainPayment.method) : '—';
  const authorizationNumber = mainPayment?.reference || order?.payment_reference || order?.paymentReference || '—';

  // loyaltyPointsEarned et loyaltyPointsTotal calculés mais non utilisés
  // const loyaltyPointsEarned = useMemo(() => {
  //   const raw =
  //     order?.loyalty_points_earned ??
  //     order?.loyaltyPointsEarned ??
  //     order?.rewards_points ??
  //     order?.pointsEarned ??
  //     0;
  //   return clampDecimals(raw);
  // }, [order]);
  //
  // const loyaltyPointsTotal = useMemo(() => {
  //   const raw =
  //     order?.loyalty_points_total ??
  //     order?.loyaltyPointsTotal ??
  //     order?.customer_points_total ??
  //     order?.customerPointsTotal ??
  //     0;
  //   return clampDecimals(raw);
  // }, [order]);

  // createdAtDate calculé mais non utilisé (était utilisé dans formattedDate et formattedTime qui sont commentés)
  // const createdAtDate = useMemo(() => {
  //   if (!order) return null;
  //   const rawDate = order.completed_at || order.updated_at || order.created_at || order.createdAt;
  //   if (!rawDate) return null;
  //   const date = new Date(rawDate);
  //   return Number.isNaN(date.getTime()) ? null : date;
  // }, [order]);

  // formattedDate et formattedTime calculés mais non utilisés
  // const formattedDate = createdAtDate
  //   ? createdAtDate.toLocaleDateString('fr-FR')
  //   : '—';
  // const formattedTime = createdAtDate
  //   ? createdAtDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  //   : '—';

  const formattedOrderNumber = formatOrderNumber(order?.order_number || order?.orderNumber, order?.id);

  const updateQuantity = (itemId, delta) => {
    let itemRemoved = false;

    setItems((prev) => {
      const nextItems = [];

      prev.forEach((item) => {
        if (item.id !== itemId) {
          nextItems.push(item);
          return;
        }

        const nextQuantity = Math.max(0, clampDecimals(item.quantity + delta));

        if (nextQuantity <= 0) {
          itemRemoved = true;
          return;
        }

        nextItems.push({
          ...item,
          quantity: nextQuantity,
          subtotal: clampDecimals(nextQuantity * item.unitPrice)
        });
      });

      return nextItems;
    });

    if (itemRemoved) {
      setRemovedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    }
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    setRemovedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
  };

  // resetArticles et resetPayments définis mais non utilisés
  // const resetArticles = () => {
  //   setItems(initialItems.map((item) => ({ ...item })));
  //   setRemovedItemIds([]);
  // };
  //
  // const resetPayments = () => {
  //   setPayments(initialPayments.map((payment) => ({ ...payment })));
  //   setCurrentAmountInput('');
  //   setError(null);
  //   setAppliedPromo(null);
  // };

  const handleKeypadInput = (value) => {
    setCurrentAmountInput((prev) => {
      if (value === '.') {
        if (!prev) return '0.';
        if (prev.includes('.')) return prev;
        return `${prev}.`;
      }

      if (value === 'DEL') {
        return prev.slice(0, -1);
      }

      return `${prev}${value}`;
    });
  };

  const handleAmountQuickSet = (amount) => {
    setCurrentAmountInput(String(clampDecimals(amount).toFixed(2)));
  };

  // ✅ BOUTON "MONTANT EXACT" : toujours le montant restant à payer, quelle que soit la méthode
  const handleExactAmount = () => {
    // Montant exact = reste à payer
    setCurrentAmountInput(String(totals.remaining.toFixed(2)));
  };

  const handleApplyPromo = async (promo, promoIndex) => {
    // Vérifier à nouveau les limites avant d'appliquer
    const now = new Date();
    
    // Vérifier la date de début
    if (promo.validFrom) {
      const validFrom = new Date(promo.validFrom);
      if (validFrom > now) {
        setError('Cette promo n\'est pas encore active');
        return;
      }
    }
    
    // Vérifier la date de fin
    if (promo.validUntil) {
      const validUntil = new Date(promo.validUntil);
      if (validUntil < now) {
        setError('Cette promo a expiré');
        return;
      }
    }
    
    // Vérifier le nombre max d'utilisations
    if (promo.maxUses !== null && promo.maxUses !== undefined) {
      const usesCount = promo.usesCount || 0;
      if (usesCount >= promo.maxUses) {
        setError('Cette promo a atteint son nombre maximum d\'utilisations');
        return;
      }
    }
    
    // Appliquer la promo
    setAppliedPromo(promo);
    setShowPromoDropdown(false);
    
    // Incrémenter le compteur d'utilisations si la promo a un maxUses
    if (promo.maxUses !== null && promo.maxUses !== undefined && promoIndex !== undefined) {
      try {
        await apiCall(`/admin/promos/${promoIndex}/increment`, {
          method: 'POST'
        });
        // Recharger les promos pour mettre à jour le compteur
        const response = await settingsService.getSetting('payment_promos');
        if (response.success && response.data) {
          try {
            const promosData = typeof response.data.value === 'string' 
              ? JSON.parse(response.data.value) 
              : response.data.value;
            if (Array.isArray(promosData)) {
              // Stocker toutes les promos
              setAllPromos(promosData);
              
              // Filtrer les promos valides
              const now = new Date();
              const validPromos = promosData.filter(p => {
                if (p.isActive === false) return false;
                if (p.validFrom && new Date(p.validFrom) > now) return false; // Pas encore commencé
                if (p.validUntil && new Date(p.validUntil) < now) return false; // Déjà expiré
                if (p.maxUses !== null && p.maxUses !== undefined && (p.usesCount || 0) >= p.maxUses) return false;
                return true;
              });
              setPromos(validPromos);
            }
          } catch (e) {
            logger.error('❌ Erreur parsing promos après incrément:', e);
          }
        }
      } catch (error) {
        logger.error('❌ Erreur incrément compteur promo:', error);
        // Ne pas bloquer l'application de la promo si l'incrément échoue
      }
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  // ✅ FONCTION PROFESSIONNELLE : Gérer l'ajout de paiement selon la méthode
  const handleAddPayment = () => {
    const amount = clampDecimals(currentAmountInput);
    if (amount <= 0) {
      setError('Veuillez saisir un montant valide supérieur à zéro.');
      return;
    }

    if (!selectedMethod) {
      setError('Veuillez sélectionner un mode de paiement.');
      return;
    }

    setError(null);

    let paymentAmount = amount;

    // ✅ LOGIQUE PROFESSIONNELLE : Pour les espèces, si montant reçu > reste à payer
    // on enregistre seulement le reste à payer et la monnaie est calculée automatiquement
    if (selectedMethod === 'cash') {
      if (amount >= totals.remaining) {
        // Le client donne plus ou exactement ce qu'il doit : on enregistre le reste à payer
        paymentAmount = totals.remaining;
      } else {
        // Le client donne moins : paiement partiel (pour paiements mixtes)
        paymentAmount = amount;
      }
    } else {
      // Pour carte/tickets : on limite au reste à payer
      if (amount > totals.remaining) {
        paymentAmount = totals.remaining;
      }
    }

    const newPayment = {
      tempId: `temp-${Date.now()}`,
      method: selectedMethod,
      amount: paymentAmount,
      reference: ''
    };

    setPayments((prev) => [...prev, newPayment]);
    setCurrentAmountInput('');
    setError(null);
  };

  // ✅ FONCTION: Gérer le bouton "Total" - Ajoute le paiement et gère la monnaie à rendre
  const handleTotal = () => {
    if (!selectedMethod) {
      setError('Veuillez sélectionner un mode de paiement.');
      return;
    }

    if (items.length === 0) {
      setError('Impossible de finaliser une commande sans article.');
      return;
    }

    const remainingAmount = totals.remaining;
    
    if (remainingAmount <= 0) {
      setError('Le montant restant doit être supérieur à zéro.');
      return;
    }

    setError(null);

    // ✅ Calculer le montant du paiement selon la méthode
    let paymentAmount = remainingAmount;
    let changeAmount = 0;

    if (selectedMethod === 'cash') {
      // Pour espèces : utiliser le montant saisi (ou le reste à payer si non saisi)
      const receivedAmount = clampDecimals(currentAmountInput || remainingAmount);
      
      paymentAmount = receivedAmount >= remainingAmount ? remainingAmount : receivedAmount;
      changeAmount = receivedAmount > remainingAmount ? receivedAmount - remainingAmount : 0;
    } else {
      // Pour carte/tickets : utiliser le reste à payer directement
      paymentAmount = remainingAmount;
      changeAmount = 0;
    }

    // ✅ Préparer le paiement
    const newPayment = {
      tempId: `temp-${Date.now()}`,
      method: selectedMethod,
      amount: paymentAmount,
      reference: ''
    };

    // ✅ Si monnaie à rendre > 0, ouvrir la modal de confirmation
    if (changeAmount > 0) {
      setPendingPayment(newPayment);
      setShowChangeConfirmationModal(true);
      return;
    }

    // ✅ Sinon, ajouter le paiement et passer à l'étape suivante
    setPayments((prev) => [...prev, newPayment]);
    setCurrentAmountInput('');
    
    setTimeout(() => {
      setStep('terminee');
    }, 100);
  };

  // ✅ Fonction pour confirmer et valider le paiement avec monnaie à rendre
  const handleConfirmChangePayment = () => {
    if (pendingPayment) {
      setPayments((prev) => [...prev, pendingPayment]);
      setCurrentAmountInput('');
      setPendingPayment(null);
      setShowChangeConfirmationModal(false);
      
      setTimeout(() => {
        setStep('terminee');
      }, 100);
    }
  };

  // ✅ Fonction pour annuler la modal de monnaie à rendre
  const handleCancelChangePayment = () => {
    setPendingPayment(null);
    setShowChangeConfirmationModal(false);
  };

  const handleRemovePayment = (tempId) => {
    setPayments((prev) => prev.filter((payment) => payment.tempId !== tempId));
  };

  // handleFinalize défini mais non utilisé
  // const handleFinalize = async () => {
  //   // ✅ PROTECTION IMMÉDIATE contre les double-clics
  //   if (submitting) {
  //     logger.warn('⚠️ handleFinalize - Tentative de double-clic, ignorée');
  //     return;
  //   }
  //
  //   if (!order) return;
  //
  //   if (items.length === 0) {
  //     setError('Impossible de finaliser une commande sans article.');
  //     return;
  //   }
  //
  //   // ✅ Définir submitting AVANT toute opération async
  //   setError(null);
  //   setSubmitting(true);
  //
  //   try {
  //     const payload = {
  //       orderId: order.id,
  //       orderNumber: order.order_number,
  //       items: items.map((item) => ({
  //         id: item.id,
  //         productId: item.productId,
  //         quantity: clampDecimals(item.quantity),
  //         unitPrice: clampDecimals(item.unitPrice),
  //         subtotal: clampDecimals(item.quantity * item.unitPrice)
  //       })),
  //       removedItemIds,
  //       payments: payments.map((payment) => ({
  //         method: payment.method,
  //         amount: clampDecimals(payment.amount),
  //         reference: payment.reference || null
  //       })),
  //       totals: {
  //         subtotal: totals.subtotal,
  //         discount: totals.discount,
  //         promoDiscount: totals.promoDiscount || 0,
  //         tax: totals.tax,
  //         total: totals.total,
  //         amountPaid: totals.amountPaid,
  //         remaining: totals.remaining,
  //         change: totals.change
  //       },
  //       appliedPromo: appliedPromo ? {
  //         label: appliedPromo.label,
  //         discountType: appliedPromo.discountType,
  //         discountValue: appliedPromo.discountValue
  //       } : null,
  //       notes,
  //       statusNext: 'preparing'
  //     };
  //
  //     logger.debug('✅ handleFinalize - Envoi du payload:', {
  //       orderId: order.id,
  //       itemsCount: items.length,
  //       paymentsCount: payments.length,
  //       total: totals.total,
  //       amountPaid: totals.amountPaid
  //     });
  //
  //     const result = await onSubmit(payload);
  //
  //     logger.debug('✅ handleFinalize - Résultat reçu:', {
  //       success: result?.success,
  //       hasError: !!result?.error,
  //       hasData: !!result?.data || !!result?.updatedOrder
  //     });
  //
  //     if (result?.success === false) {
  //       const errorMessage = result?.error || 'Erreur lors de la finalisation du paiement.';
  //       logger.error('❌ handleFinalize - Erreur dans la réponse:', errorMessage);
  //       setError(errorMessage);
  //       setSubmitting(false);
  //       return;
  //     }
  //
  //     logger.debug('✅ handleFinalize - Succès, fermeture de la modal');
  //     onClose(result?.updatedOrder || null);
  //   } catch (err) {
  //     logger.error('❌ handleFinalize - Exception:', {
  //       message: err.message,
  //       stack: err.stack,
  //       name: err.name,
  //       orderId: order?.id
  //     });
  //     setError(err.message || 'Impossible de finaliser le paiement.');
  //     setSubmitting(false);
  //   }
  // };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleDownloadTicket = useCallback(() => {
    if (!order) return;
    downloadReceipt(order, {
      clientType: 'particulier',
      businessInfo,
      ticketDisplay
    });
  }, [order, businessInfo, ticketDisplay]);

  const handleSendEmail = useCallback(async () => {
    if (!order) return;
    
    // Récupérer l'email du client depuis la commande
    const clientEmail = order?.customer_email || order?.email || null;
    
    if (!clientEmail) {
      logger.warn('Aucun email client disponible pour l\'envoi du ticket');
      // TODO: Afficher une notification d'erreur ou ouvrir un modal pour saisir l'email
      alert('⚠️ Aucun email client disponible. Veuillez ajouter un email à la commande.');
      return;
    }

    try {
      setSubmitting(true);
      // TODO: Implémenter l'API backend pour l'envoi par email
      // Pour l'instant, on génère le PDF et on propose de l'envoyer manuellement
      logger.info('Envoi du ticket par email à:', clientEmail);
      
      // Générer le PDF en mémoire et l'envoyer via l'API
      // En attendant l'implémentation backend, on affiche un message
      alert(`📧 Fonctionnalité d'envoi par email en cours de développement.\n\nLe ticket sera envoyé à: ${clientEmail}`);
      
      // TODO: Appel API à implémenter
      // await apiCall('/api/orders/:orderId/send-receipt', {
      //   method: 'POST',
      //   body: { email: clientEmail }
      // });
      
    } catch (err) {
      logger.error('Erreur envoi email:', err);
      alert('❌ Erreur lors de l\'envoi par email');
    } finally {
      setSubmitting(false);
    }
  }, [order]);

  if (!isOpen || !order) {
    return null;
  }

  const keypadLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'DEL']
  ];

  // canProceedToSummary calculé mais non utilisé
  // const canProceedToSummary = items.length > 0 && payments.length > 0 && totals.amountPaid >= totals.total;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full h-full bg-gradient-to-br from-white to-neutral-50 flex flex-col overflow-hidden">
        {/* ✅ Header simplifié - Compact pour éviter scroll */}
        <div className="relative bg-gradient-to-r from-neutral-900 to-black px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 border-b border-neutral-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              if (step === 'terminee') {
                setStep('gestion');
              } else {
                handleClose();
              }
            }}
            className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label={step === 'terminee' ? 'Retour au paiement' : 'Fermer'}
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 pr-12 sm:pr-16">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-heading font-bold text-white truncate">
                Confirmation paiement
              </h3>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-10">
            <p className="text-base sm:text-lg text-white font-heading font-bold truncate text-center">
              {formattedOrderNumber?.replace(/^#+/, '')}
            </p>
          </div>
        </div>

        {/* ✅ Indicateur d'étape simplifié - Compact */}
        <div className="px-3 sm:px-4 lg:px-5 py-1 sm:py-1.5 bg-neutral-100 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-colors flex-shrink-0 ${
              step === 'gestion' 
                ? 'bg-black text-white' 
                : 'bg-white text-neutral-600 border border-neutral-300'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                step === 'gestion' ? 'bg-white' : 'bg-neutral-400'
              }`}></div>
              <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Paiement</span>
            </div>
            <div className="h-px flex-1 bg-neutral-300"></div>
            <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md transition-colors flex-shrink-0 ${
              step === 'terminee' 
                ? 'bg-green-600 text-white' 
                : 'bg-white text-neutral-600 border border-neutral-300'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                step === 'terminee' ? 'bg-white' : 'bg-neutral-400'
              }`}></div>
              <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Terminé</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-3 sm:mx-4 lg:mx-5 mt-2 sm:mt-3 rounded-lg border border-red-300 bg-red-50 px-2.5 sm:px-3 py-2 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
              <X className="w-2.5 h-2.5 text-white" />
            </div>
            <p className="text-xs font-semibold text-red-800">{error}</p>
          </div>
        )}

        {/* ✅ Zone principale - Pas de scroll vertical, utilise toute la hauteur */}
        <div className="flex-1 overflow-hidden px-2 sm:px-3 md:px-4 lg:px-5 py-1.5 sm:py-2 md:py-2.5 lg:py-3">
          {step === 'gestion' && (
            /* ✅ Layout adaptatif : colonne sur mobile, 2 colonnes sur tablette+ - Optimisé pour ZERO scroll */
            <div className="h-full grid gap-2 sm:gap-2.5 md:gap-3 lg:gap-3.5 grid-cols-1 md:grid-cols-[1fr,1.15fr]">
              {/* ✅ Colonne droite - Clavier et paiement (affiché en premier sur mobile, second sur tablette+) */}
              <div className="flex flex-col h-full gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 min-h-0 order-1 md:order-2">
                {/* ✅ Bouton Promo - Bouton carré entre articles et clavier */}
                {promos.length > 0 && (
                  <div className="promo-dropdown-container bg-white rounded-lg sm:rounded-xl border border-neutral-200 shadow-md p-1.5 sm:p-2 flex-shrink-0 relative">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPromoDropdown(!showPromoDropdown)}
                        className={`aspect-square w-full max-w-[60px] sm:max-w-[70px] md:max-w-[80px] flex items-center justify-center gap-1 rounded-lg border font-semibold text-xs sm:text-sm transition-all ${
                          appliedPromo
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      {appliedPromo && (
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="aspect-square w-full max-w-[60px] sm:max-w-[70px] md:max-w-[80px] rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
                          title="Retirer la promo"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      )}
                    </div>
                    {showPromoDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {promos.map((promo) => {
                          // Trouver l'index original dans allPromos
                          const originalIndex = allPromos.findIndex(p => 
                            p.label === promo.label && 
                            p.discountType === promo.discountType && 
                            p.discountValue === promo.discountValue
                          );
                          
                          return (
                            <button
                              key={originalIndex}
                              type="button"
                              onClick={() => handleApplyPromo(promo, originalIndex)}
                              className="w-full px-3 py-2 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                            >
                              <div className="font-semibold text-sm text-black">{promo.label}</div>
                              <div className="text-xs text-neutral-600">
                                {promo.discountType === 'percentage' 
                                  ? `${promo.discountValue}%` 
                                  : `${formatPrice(promo.discountValue)}`}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ✅ Affichage professionnel : Montant reçu (espèces) ou Montant à payer (autres méthodes) - Compact pour éviter scroll */}
                <div className="bg-gradient-to-br from-neutral-900 to-black rounded-lg sm:rounded-xl md:rounded-2xl p-2 sm:p-2.5 md:p-3 lg:p-3.5 border border-neutral-800 shadow-lg flex-shrink-0">
                  <div className="mb-1 sm:mb-1.5 md:mb-2">
                    <p className="text-xs sm:text-sm font-medium text-white/80">
                      {selectedMethod === 'cash' ? 'Montant reçu' : 'Montant à payer'}
                    </p>
                  </div>
                  <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-white mb-1 sm:mb-1.5 md:mb-2 break-all">
                    {currentAmountInput ? formatPrice(clampDecimals(currentAmountInput)) : '0,00 €'}
                  </p>
                  <div className="pt-1.5 sm:pt-2 border-t border-white/20 space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-xs sm:text-sm md:text-base text-white/60">Reste à payer</p>
                      <span className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-white">{formatPrice(totals.remaining)}</span>
                    </div>
                    {/* ✅ Afficher la monnaie à rendre en temps réel pour les espèces */}
                    {selectedMethod === 'cash' && currentAmountInput && clampDecimals(currentAmountInput) > 0 && (
                      (() => {
                        const receivedAmount = clampDecimals(currentAmountInput);
                        const changeToGive = Math.max(0, receivedAmount - totals.remaining);
                        return changeToGive > 0 ? (
                          <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                            <p className="text-xs sm:text-sm md:text-base font-semibold text-green-400">Monnaie à rendre</p>
                            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-green-400">{formatPrice(changeToGive)}</span>
                          </div>
                        ) : receivedAmount < totals.remaining ? (
                          <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
                            <p className="text-xs sm:text-sm md:text-base font-semibold text-orange-400">Manque</p>
                            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-orange-400">{formatPrice(totals.remaining - receivedAmount)}</span>
                          </div>
                        ) : null;
                      })()
                    )}
                  </div>
                </div>

                {/* ✅ Clavier numérique optimisé - Compact pour éviter scroll */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border border-neutral-200 shadow-md p-1.5 sm:p-2 md:p-2.5 lg:p-3 flex gap-1.5 sm:gap-2 flex-shrink-0">
                  {/* Clavier numérique - Largeur réduite */}
                  <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                    <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                      {keypadLayout.map((row, rowIndex) => (
                        <React.Fragment key={`row-${rowIndex}`}>
                          {row.map((key) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => handleKeypadInput(key)}
                              className={`py-1.5 sm:py-2 md:py-2.5 rounded-lg border font-bold text-sm sm:text-base md:text-lg transition-all active:scale-95 ${
                                key === 'DEL' 
                                  ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' 
                                  : 'bg-white border-neutral-200 text-gray-900 hover:bg-neutral-50 hover:border-neutral-300'
                              }`}
                            >
                              {key === 'DEL' ? '⌫' : key}
                            </button>
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                    
                    {/* Bouton montant exact/reçu - Compact */}
                    <button
                      type="button"
                      onClick={handleExactAmount}
                      className="py-1.5 sm:py-2 md:py-2.5 rounded-md bg-black text-white font-bold hover:bg-neutral-900 transition-colors text-xs sm:text-sm"
                      title="Saisir automatiquement le montant exact restant à payer"
                    >
                      <span>Montant exact ({formatPrice(totals.remaining)})</span>
                    </button>
                  </div>

                  {/* Montants rapides (billets) - À droite du clavier */}
                  <div className="flex flex-col gap-1 sm:gap-1.5 md:gap-2">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountQuickSet(amount)}
                        className="py-1.5 sm:py-2 md:py-2.5 px-2 sm:px-3 rounded-md bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors text-xs sm:text-sm whitespace-nowrap"
                        title={`${formatPrice(amount)}`}
                      >
                        {formatPrice(amount)}
                      </button>
                    ))}
                  </div>
                </div>


                {/* ✅ Sélection méthode et boutons d'action - Compact pour éviter scroll */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-neutral-200 shadow-md p-1.5 sm:p-2 flex flex-col gap-1.5 sm:gap-2 flex-shrink-0">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1">Méthode de paiement</p>
                    <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethod(method.id)}
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border py-1.5 sm:py-2 font-semibold text-xs sm:text-sm transition-all ${
                              isSelected
                                ? 'border-black bg-black text-white shadow-md scale-105'
                                : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{method.label}</span>
                            <span className="sm:hidden">{method.label.split(' ')[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ✅ RÈGLES DE PAIEMENT: Boutons conditionnels selon le montant saisi */}
                  {(() => {
                    const currentAmount = clampDecimals(currentAmountInput || 0);
                    // isAmountLessThanRemaining calculé mais non utilisé
                    // const isAmountLessThanRemaining = currentAmount > 0 && currentAmount < totals.remaining;
                    const isAmountGreaterOrEqual = currentAmount >= totals.remaining && totals.remaining > 0;
                    
                    return (
                      <>
                        {/* ✅ Bouton "Ajouter paiement" - Grisé si montant >= reste à payer */}
                        <button
                          type="button"
                          onClick={handleAddPayment}
                          disabled={!selectedMethod || currentAmount <= 0 || isAmountGreaterOrEqual}
                          className={`w-full py-2 sm:py-2.5 rounded-lg font-heading font-bold text-xs sm:text-sm transition-all ${
                            !selectedMethod || currentAmount <= 0 || isAmountGreaterOrEqual
                              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                              : selectedMethod === 'cash'
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg active:scale-95'
                              : selectedMethod === 'card'
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg active:scale-95'
                              : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg active:scale-95'
                          }`}
                        >
                          {selectedMethod === 'cash' ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Ajouter paiement
                            </span>
                          ) : (
                            <span>Ajouter paiement</span>
                          )}
                        </button>

                        {/* ✅ BOUTON TOTAL: Toujours visible, actif si montant >= reste à payer, grisé sinon */}
                        <button
                          type="button"
                          onClick={handleTotal}
                          disabled={!selectedMethod || items.length === 0 || totals.remaining <= 0 || !isAmountGreaterOrEqual}
                          className={`w-full py-2.5 sm:py-3 rounded-lg font-heading font-bold text-sm sm:text-base transition-all border-2 ${
                            !selectedMethod || items.length === 0 || totals.remaining <= 0 || !isAmountGreaterOrEqual
                              ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed'
                              : selectedMethod === 'cash'
                              ? 'bg-gradient-to-r from-green-600 to-green-700 text-white border-green-800 hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg active:scale-95'
                              : selectedMethod === 'card'
                              ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-800 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg active:scale-95'
                              : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-purple-800 hover:from-purple-700 hover:to-purple-800 shadow-md hover:shadow-lg active:scale-95'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            <span className="text-sm sm:text-base">Total</span>
                            <span className="text-base sm:text-lg font-bold">
                              {formatPrice(totals.remaining)}
                            </span>
                          </div>
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* ✅ Colonne gauche - Articles et résumé (affichée en second sur mobile, première sur tablette+) */}
              <div className="flex flex-col h-full gap-1.5 sm:gap-2 overflow-hidden order-2 md:order-1">
                {/* Articles - Utilise toute la hauteur disponible avec scroll interne */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-neutral-200 shadow-md flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 border-b border-neutral-200 flex items-center bg-gradient-to-r from-neutral-50 to-white flex-shrink-0">
                    <h4 className="text-sm sm:text-base font-heading font-bold text-gray-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-700 flex-shrink-0" />
                      <span className="truncate">Articles</span>
                    </h4>
                  </div>

                  {(() => {
                    // ✅ CORRECTION: Récupération FORCÉE des articles depuis order si items est vide
                    let displayItems = null;
                    
                    // 1. Essayer items (articles modifiés) - SEULEMENT s'ils existent
                    if (items && Array.isArray(items) && items.length > 0) {
                      displayItems = items;
                      logger.debug('✅ PaymentWorkflowModal - Utilisation de items state:', items.length);
                    } 
                    // 2. Essayer initialItems (articles initiaux) - SEULEMENT s'ils existent
                    else if (initialItems && Array.isArray(initialItems) && initialItems.length > 0) {
                      displayItems = initialItems;
                      logger.debug('✅ PaymentWorkflowModal - Utilisation de initialItems state:', initialItems.length);
                    } 
                    // 3. FORCER la récupération depuis order (source de vérité)
                    else {
                      logger.debug('⚠️ PaymentWorkflowModal - items et initialItems vides, récupération depuis order');
                      
                      // Essayer parseItems d'abord
                      displayItems = parseItems(order);
                      
                      // ✅ Si toujours vide, essayer order.order_items (table relationnelle)
                      if (!displayItems || displayItems.length === 0) {
                        if (order?.order_items && Array.isArray(order.order_items) && order.order_items.length > 0) {
                          logger.debug('✅ PaymentWorkflowModal - Utilisation de order.order_items');
                          displayItems = order.order_items.map((item, idx) => ({
                            id: item.id ?? item.order_item_id ?? `temp-${idx}`,
                            productId: item.product_id ?? item.productId ?? null,
                            name: item.product_name || item.name || item.product?.name || 'Produit',
                            quantity: clampDecimals(item.quantity ?? 1),
                            unitPrice: clampDecimals(item.unit_price ?? item.price ?? item.unitPrice ?? item.product?.price ?? 0),
                            subtotal: clampDecimals((item.quantity ?? 1) * (item.unit_price ?? item.price ?? item.unitPrice ?? item.product?.price ?? 0)),
                            category: item.category_type || item.category || item.product?.category || 'plat',
                            taxRate: item.tax_rate ?? item.taxRate ?? null
                          })).filter(item => item.quantity > 0);
                        }
                      }
                      
                      // ✅ Fallback: récupérer directement depuis order.items
                      if (!displayItems || displayItems.length === 0) {
                        if (order?.items) {
                          try {
                            const rawItems = typeof order.items === 'string' 
                              ? JSON.parse(order.items) 
                              : (Array.isArray(order.items) ? order.items : []);
                            
                            if (Array.isArray(rawItems) && rawItems.length > 0) {
                              logger.debug('✅ PaymentWorkflowModal - Utilisation de order.items (parsed)');
                              displayItems = rawItems.map((item, idx) => ({
                                id: item.id ?? item.product_id ?? `temp-${idx}`,
                                productId: item.product_id ?? item.productId ?? null,
                                name: item.product_name || item.name || 'Produit',
                                quantity: clampDecimals(item.quantity ?? 1),
                                unitPrice: clampDecimals(item.unit_price ?? item.price ?? item.unitPrice ?? 0),
                                subtotal: clampDecimals((item.quantity ?? 1) * (item.unit_price ?? item.price ?? item.unitPrice ?? 0)),
                                category: item.category_type || item.category || 'plat',
                                taxRate: item.tax_rate ?? item.taxRate ?? null
                              })).filter(item => item.quantity > 0);
                            }
                          } catch (e) {
                            logger.debug('Erreur parsing items:', e);
                          }
                        }
                        
                        // ✅ Dernier fallback: order.parsedItems
                        if ((!displayItems || displayItems.length === 0) && order?.parsedItems && Array.isArray(order.parsedItems)) {
                          logger.debug('✅ PaymentWorkflowModal - Utilisation de order.parsedItems');
                          displayItems = order.parsedItems;
                        }
                      }
                    }
                    
                    // ✅ Filtrer les articles supprimés
                    if (displayItems && Array.isArray(displayItems) && removedItemIds && removedItemIds.length > 0) {
                      displayItems = displayItems.filter(item => 
                        item && item.id && !removedItemIds.includes(item.id)
                      );
                    }
                    
                    // ✅ DEBUG: Log pour comprendre pourquoi les articles ne s'affichent pas
                    if (!displayItems || !Array.isArray(displayItems) || displayItems.length === 0) {
                      logger.debug('🔍 PaymentWorkflowModal - Aucun article à afficher:', {
                        hasItems: !!items,
                        itemsLength: items?.length || 0,
                        hasInitialItems: !!initialItems,
                        initialItemsLength: initialItems?.length || 0,
                        hasOrder: !!order,
                        hasOrderItems: !!order?.items,
                        orderItemsType: typeof order?.items,
                        hasParsedItems: !!order?.parsedItems,
                        parsedItemsLength: order?.parsedItems?.length || 0,
                        removedItemIdsLength: removedItemIds?.length || 0
                      });
                      
                      return (
                        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                          <div className="text-center">
                            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-300 mx-auto mb-2" />
                            <p className="text-xs font-medium text-neutral-500">Aucun article</p>
                            <p className="text-xs text-neutral-400 mt-1">Réinitialisez pour restaurer</p>
                          </div>
                        </div>
                      );
                    }
                    
                    // ✅ DEBUG: Log le nombre d'articles affichés
                    logger.debug(`✅ PaymentWorkflowModal - Affichage de ${displayItems.length} article(s) dans l'étape paiement`);
                    
                    return (
                      <div className="flex-1 min-h-0 overflow-y-auto p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
                        {displayItems.map((item, index) => {
                          const itemName = item.name || item.product_name || 'Produit sans nom';
                          const itemQuantity = item.quantity || 0;
                          const itemPrice = item.unitPrice || item.price || item.unit_price || 0;
                          
                          return (
                          <div key={item.id ?? item.productId ?? `item-${index}`} className="flex items-center gap-1.5 sm:gap-2 bg-neutral-50 rounded-md sm:rounded-lg px-2 sm:px-2.5 py-1.5 sm:py-2 border border-neutral-200 hover:border-neutral-300 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="font-heading font-semibold text-gray-900 truncate text-xs sm:text-sm">
                                {itemName}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {item.category && (
                                  <span className="text-xs text-neutral-500 capitalize truncate">
                                    {item.category || item.category_type}
                                  </span>
                                )}
                                <span className="text-xs font-bold text-blue-600 whitespace-nowrap">
                                  Qty: {itemQuantity}
                                </span>
                              </div>
                            </div>
                          <div className="flex items-center gap-0.5 bg-white rounded-md border border-neutral-200 p-0.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                            <span className="w-5 sm:w-6 text-center font-bold text-gray-900 text-xs">{itemQuantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                          <div className="text-right min-w-[50px] sm:min-w-[55px] flex-shrink-0">
                            <p className="text-xs sm:text-sm font-bold text-gray-900">{formatPrice(itemQuantity * itemPrice)}</p>
                            <p className="text-xs text-neutral-500">{formatPrice(itemPrice)}/u</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                          </div>
                          );
                        })}
                        
                        {/* ✅ Afficher le code promo dans la section articles (style similaire au panier) */}
                        {(() => {
                          // ✅ Vérifier plusieurs sources pour le code promo
                          const promoCode = order?.promo_code || order?.promoCode || null;
                          // promoCodeId calculé mais non utilisé dans cette IIFE
                          // const promoCodeId = order?.promo_code_id || order?.promoCodeId || null;
                          const discountAmount = parseFloat(order?.discount_amount || order?.discountAmount || totals?.discount || 0);
                          const promoDiscountType = order?.promo_discount_type || order?.promoDiscountType || null;
                          const promoDiscountValue = order?.promo_discount_value || order?.promoDiscountValue || null;
                          
                          // Calculer le pourcentage de réduction pour l'affichage
                          let promoDiscountPercentage = 0;
                          if (promoDiscountType === 'percentage' && promoDiscountValue) {
                            promoDiscountPercentage = parseFloat(promoDiscountValue);
                          } else if (discountAmount > 0 && totals?.subtotal > 0) {
                            promoDiscountPercentage = parseFloat(((discountAmount / totals.subtotal) * 100).toFixed(2));
                          }
                          
                          // ✅ Afficher si on a une réduction (style similaire au panier)
                          if (discountAmount > 0 && !appliedPromo) {
                            return (
                              <div className="flex items-center justify-between bg-green-50 p-2 sm:p-2.5 rounded-lg mt-1.5 sm:mt-2 border border-green-200">
                                <div>
                                  <div className="font-bold text-green-700 text-xs sm:text-sm">
                                    {promoCode || 'Code promo appliqué'}
                                  </div>
                                  {promoDiscountPercentage > 0 && (
                                    <div className="text-xs text-green-600">
                                      -{promoDiscountPercentage.toFixed(2)}%
                                    </div>
                                  )}
                                </div>
                                <div className="font-bold text-xs sm:text-sm text-green-700">
                                  -{formatPrice(discountAmount)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    );
                  })()}

                  {/* ✅ Résumé des totaux - Compact pour éviter scroll */}
                  <div className="px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 border-t border-neutral-200 bg-gradient-to-br from-neutral-50 to-white flex-shrink-0">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-600">Total dû</span>
                        <span className="font-bold text-xs sm:text-sm text-gray-900">{formatPrice(totals.total)}</span>
                      </div>
                      {appliedPromo && totals.promoDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs bg-purple-50 px-1.5 py-1 rounded">
                          <span className="text-purple-700 font-medium">Promo: {appliedPromo.label}</span>
                          <span className="font-semibold text-purple-700">-{formatPrice(totals.promoDiscount)}</span>
                        </div>
                      )}
                      {/* ✅ Code promo client dans le résumé (style similaire au panier) */}
                      {(() => {
                        const promoCode = order?.promo_code || order?.promoCode || null;
                        const discountAmount = parseFloat(order?.discount_amount || order?.discountAmount || totals?.discount || 0);
                        const promoDiscountType = order?.promo_discount_type || order?.promoDiscountType || null;
                        const promoDiscountValue = order?.promo_discount_value || order?.promoDiscountValue || null;
                        
                        let promoDiscountPercentage = 0;
                        if (promoDiscountType === 'percentage' && promoDiscountValue) {
                          promoDiscountPercentage = parseFloat(promoDiscountValue);
                        } else if (discountAmount > 0 && totals?.subtotal > 0) {
                          promoDiscountPercentage = parseFloat(((discountAmount / totals.subtotal) * 100).toFixed(2));
                        }
                        
                        if (discountAmount > 0 && !appliedPromo) {
                          return (
                            <div className="flex justify-between items-center text-xs bg-green-50 px-1.5 py-1 rounded">
                              <span className="text-green-700 font-medium">
                                {promoCode || 'Code promo appliqué'}
                                {promoDiscountPercentage > 0 && ` (-${promoDiscountPercentage.toFixed(2)}%)`}
                              </span>
                              <span className="font-semibold text-green-700">-{formatPrice(discountAmount)}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-600">Déjà encaissé</span>
                        <span className="font-semibold text-xs sm:text-sm text-neutral-700">{formatPrice(totals.amountPaid)}</span>
                      </div>
                      <div className="pt-1 border-t border-neutral-200 flex justify-between items-center">
                        <span className="font-semibold text-neutral-700 text-xs">Reste à payer</span>
                        <span className={`font-bold text-xs sm:text-sm ${totals.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatPrice(totals.remaining)}
                        </span>
                      </div>
                      {/* ✅ Affichage professionnel de la monnaie à rendre */}
                      {totals.change > 0 && (
                        <div className="flex justify-between items-center text-xs pt-1 bg-green-50 rounded px-1.5 py-1 border border-green-200">
                          <span className="text-green-700 font-semibold">💰 Monnaie</span>
                          <span className="font-bold text-green-700 text-xs sm:text-sm">{formatPrice(totals.change)}</span>
                        </div>
                      )}
                      {/* ✅ Avertissement si le montant est insuffisant */}
                      {totals.remaining > 0 && payments.length > 0 && (
                        <div className="flex justify-between items-center text-xs pt-1">
                          <span className="text-orange-600 font-medium">⚠️ Incomplet</span>
                          <span className="font-bold text-orange-600 text-xs sm:text-sm">{formatPrice(totals.remaining)}</span>
                        </div>
                      )}
                    </div>

                    {/* ✅ Récapitulatif professionnel des paiements - Compact */}
                    <div className="mt-1.5 pt-1.5 border-t border-neutral-200 flex-shrink-0 max-h-[120px] overflow-y-auto">
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">Paiements</h5>
                        {payments.length > 1 && (
                          <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                            Mixte ({payments.length})
                          </span>
                        )}
                      </div>
                      {payments.length === 0 ? (
                        <p className="text-xs text-neutral-400">Aucun paiement enregistré</p>
                      ) : (
                        <>
                          {/* ✅ Résumé par méthode de paiement (comme les caisses professionnelles) */}
                          {(() => {
                            const summaryByMethod = payments.reduce((acc, payment) => {
                              const method = payment.method || 'other';
                              if (!acc[method]) {
                                acc[method] = { total: 0, count: 0 };
                              }
                              acc[method].total += payment.amount;
                              acc[method].count += 1;
                              return acc;
                            }, {});

                            const methodLabels = {
                              cash: 'Espèces',
                              card: 'Carte',
                              ticket: 'Tickets'
                            };

                            const methodIcons = {
                              cash: Wallet,
                              card: CreditCard,
                              ticket: Ticket
                            };

                            return Object.keys(summaryByMethod).length > 1 ? (
                              <div className="mb-2 p-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-md border border-purple-200">
                                <p className="text-xs font-semibold text-purple-700 mb-1.5">Résumé par méthode :</p>
                                <div className="space-y-1">
                                  {Object.entries(summaryByMethod).map(([method, data]) => {
                                    const Icon = methodIcons[method] || CreditCard;
                                    const label = methodLabels[method] || method;
                                    const iconColor = method === 'cash' ? 'text-green-600' : method === 'card' ? 'text-blue-600' : 'text-purple-600';
                                    return (
                                      <div key={method} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5">
                                          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                                          <span className="font-semibold text-gray-700">{label}</span>
                                          {data.count > 1 && (
                                            <span className="text-neutral-500">({data.count}x)</span>
                                          )}
                                        </div>
                                        <span className="font-bold text-gray-900">{formatPrice(clampDecimals(data.total))}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null;
                          })()}
                          <div className="space-y-1">
                            {payments.map((payment) => {
                            // ✅ Déterminer l'icône et la couleur selon la méthode de paiement
                            let Icon;
                            let iconColor;
                            let label;
                            
                            if (payment.method === 'cash') {
                              Icon = Wallet;
                              iconColor = 'text-green-600';
                              label = 'Espèces';
                            } else if (payment.method === 'card') {
                              Icon = CreditCard;
                              iconColor = 'text-blue-600';
                              label = 'Carte';
                            } else if (payment.method === 'ticket') {
                              Icon = Ticket;
                              iconColor = 'text-purple-600';
                              label = 'Tickets';
                            } else {
                              Icon = CreditCard;
                              iconColor = 'text-neutral-600';
                              label = payment.method || 'Autre';
                            }
                            
                            return (
                              <div
                                key={payment.tempId}
                                className="flex items-center justify-between bg-white rounded-md px-2 py-1.5 border border-neutral-200 hover:border-neutral-300 transition-colors"
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <Icon className={`w-4 h-4 ${iconColor} flex-shrink-0`} />
                                  <span className="text-xs font-semibold text-gray-900 truncate">{label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className="text-xs font-bold text-gray-900">{formatPrice(payment.amount)}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePayment(payment.tempId)}
                                    className="w-5 h-5 rounded bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                    title="Supprimer ce paiement"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* ✅ Bouton retour en bas de la colonne gauche */}
                <div className="mt-1.5 sm:mt-2 flex justify-start">
                  {step === 'terminee' ? (
                    <Button
                      onClick={() => setStep('gestion')}
                      disabled={submitting}
                      className="w-1/2 px-3 sm:px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Retour au paiement
                    </Button>
                  ) : (
                    <Button
                      onClick={handleClose}
                      disabled={submitting}
                      className="w-1/2 px-3 sm:px-4 py-2 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Retour
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ✅ Étape Terminé - Optimisée pour mobile/tablette */}
          {step === 'terminee' && (
            <div className="h-full flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 overflow-auto">
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-lg w-full">
                {/* ✅ Confirmation de paiement - Adaptée mobile/tablette */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-lg text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4 shadow-lg">
                    <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <h4 className="text-lg sm:text-xl md:text-2xl font-heading font-bold text-gray-900 mb-1.5 sm:mb-2">Paiement confirmé</h4>
                  <p className="text-xs sm:text-sm text-neutral-600 mb-2 sm:mb-3 md:mb-4 px-2">
                    Le paiement a été enregistré avec succès. Vous pouvez maintenant lancer la préparation.
                  </p>
                  <div className="bg-white rounded-lg sm:rounded-xl p-2.5 sm:p-3 md:p-4 border border-green-200">
                    <p className="text-xs sm:text-sm text-neutral-600 mb-0.5 sm:mb-1">Total payé</p>
                    <p className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-green-600">{formatPrice(totals.amountPaid)}</p>
                  </div>
                </div>

                {/* Articles de la commande - Récupération directe depuis order si items est vide */}
                {(() => {
                  // ✅ Récupérer les items depuis order directement si items est vide
                  const displayItems = items && items.length > 0 
                    ? items 
                    : (initialItems && initialItems.length > 0 
                        ? initialItems 
                        : parseItems(order));
                  
                  const itemsTotal = displayItems.reduce((sum, item) => {
                    return sum + ((item.quantity || 0) * (item.unitPrice || 0));
                  }, 0);
                  
                  return displayItems && displayItems.length > 0 ? (
                    /* ✅ Articles de la commande - Optimisé pour mobile/tablette */
                    <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-neutral-200 shadow-lg p-3 sm:p-4 md:p-5">
                      <h5 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 uppercase tracking-wide">
                        Articles de la commande ({displayItems.length})
                      </h5>
                      <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 max-h-48 sm:max-h-56 md:max-h-64 overflow-y-auto">
                        {displayItems.map((item, index) => (
                          <div
                            key={item.id ?? item.productId ?? `item-${index}`}
                            className="flex items-center justify-between bg-neutral-50 rounded-md sm:rounded-lg md:rounded-xl px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 border border-neutral-200"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate text-xs sm:text-sm md:text-base">
                                {item.name || item.product_name || 'Produit sans nom'}
                              </p>
                              <p className="text-xs text-neutral-600 mt-0.5">
                                {item.category && (
                                  <>
                                    <span className="capitalize">{item.category}</span>
                                    {' • '}
                                  </>
                                )}
                                <span className="font-medium">Quantité: {item.quantity || 0}</span>
                              </p>
                            </div>
                            <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                              <p className="font-bold text-gray-900 text-xs sm:text-sm md:text-base">
                                {formatPrice((item.quantity || 0) * (item.unitPrice || item.price || item.unit_price || 0))}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {formatPrice(item.unitPrice || item.price || item.unit_price || 0)}/u
                              </p>
                            </div>
                          </div>
                        ))}
                        {/* ✅ Afficher le code promo dans la section articles (style similaire au panier) */}
                        {(() => {
                          // ✅ Vérifier plusieurs sources pour le code promo
                          const promoCode = order?.promo_code || order?.promoCode || null;
                          const promoCodeId = order?.promo_code_id || order?.promoCodeId || null;
                          const discountAmount = parseFloat(order?.discount_amount || order?.discountAmount || totals?.discount || 0);
                          const promoDiscountType = order?.promo_discount_type || order?.promoDiscountType || null;
                          const promoDiscountValue = order?.promo_discount_value || order?.promoDiscountValue || null;
                          
                          // ✅ Debug: Logger pour voir pourquoi le code promo ne s'affiche pas
                          logger.debug('🔍 PaymentWorkflowModal TERMINEE - Vérification affichage code promo dans articles:', {
                            promoCode,
                            promoCodeId,
                            discountAmount,
                            appliedPromo: !!appliedPromo,
                            orderKeys: order ? Object.keys(order).filter(k => k.includes('promo') || k.includes('discount')) : [],
                            condition: discountAmount > 0 && !appliedPromo,
                            willDisplay: discountAmount > 0 && !appliedPromo
                          });
                          
                          // Calculer le pourcentage de réduction pour l'affichage
                          let promoDiscountPercentage = 0;
                          if (promoDiscountType === 'percentage' && promoDiscountValue) {
                            promoDiscountPercentage = parseFloat(promoDiscountValue);
                          } else if (discountAmount > 0 && totals?.subtotal > 0) {
                            promoDiscountPercentage = parseFloat(((discountAmount / totals.subtotal) * 100).toFixed(2));
                          }
                          
                          // ✅ Afficher si on a une réduction (style similaire au panier)
                          // IMPORTANT: Afficher même si promoCode n'est pas récupéré, tant qu'on a une réduction
                          if (discountAmount > 0 && !appliedPromo) {
                            logger.debug('✅ PaymentWorkflowModal TERMINEE - Affichage du code promo:', {
                              promoCode: promoCode || 'Code promo appliqué',
                              discountAmount,
                              promoDiscountPercentage
                            });
                            return (
                              <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg mt-2 border border-green-200">
                                <div>
                                  <div className="font-bold text-green-700 text-sm">
                                    {promoCode || 'Code promo appliqué'}
                                  </div>
                                  {promoDiscountPercentage > 0 && (
                                    <div className="text-sm text-green-600">
                                      -{promoDiscountPercentage.toFixed(2)}%
                                    </div>
                                  )}
                                </div>
                                <div className="font-bold text-sm text-green-700">
                                  -{formatPrice(discountAmount)}
                                </div>
                              </div>
                            );
                          }
                          logger.debug('❌ PaymentWorkflowModal TERMINEE - Code promo NON affiché:', {
                            reason: discountAmount <= 0 ? 'discountAmount est 0 ou négatif' : appliedPromo ? 'appliedPromo est true' : 'condition non remplie',
                            discountAmount,
                            appliedPromo: !!appliedPromo
                          });
                          return null;
                        })()}
                      </div>
                      <div className="mt-2 sm:mt-3 md:mt-4 pt-2 sm:pt-3 md:pt-4 border-t border-neutral-200 space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Sous-total</span>
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">{formatPrice(totals.subtotal || itemsTotal)}</span>
                        </div>
                        {/* ✅ Promo de paiement manager */}
                        {appliedPromo && totals.promoDiscount > 0 && (
                          <div className="flex justify-between items-center bg-purple-50 px-2 py-1.5 rounded-lg border border-purple-200">
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-purple-700">Promo: {appliedPromo.label}</span>
                              {appliedPromo.discountType === 'percentage' && (
                                <span className="text-xs text-purple-600">-{appliedPromo.discountValue}%</span>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-purple-700">-{formatPrice(totals.promoDiscount)}</span>
                          </div>
                        )}
                        {/* ✅ Code promo client (style similaire au panier) */}
                        {(() => {
                          // ✅ Vérifier plusieurs sources pour le code promo
                          const promoCode = order?.promo_code || order?.promoCode || null;
                          const discountAmount = parseFloat(order?.discount_amount || order?.discountAmount || totals?.discount || 0);
                          const promoDiscountType = order?.promo_discount_type || order?.promoDiscountType || null;
                          const promoDiscountValue = order?.promo_discount_value || order?.promoDiscountValue || null;
                          
                          // Calculer le pourcentage de réduction pour l'affichage
                          let promoDiscountPercentage = 0;
                          if (promoDiscountType === 'percentage' && promoDiscountValue) {
                            promoDiscountPercentage = parseFloat(promoDiscountValue);
                          } else if (discountAmount > 0 && totals?.subtotal > 0) {
                            promoDiscountPercentage = parseFloat(((discountAmount / totals.subtotal) * 100).toFixed(2));
                          }
                          
                          // ✅ Afficher si on a une réduction (style similaire au panier)
                          if (discountAmount > 0 && !appliedPromo) {
                            return (
                              <div className="flex items-center justify-between bg-green-50 px-2 py-1.5 rounded-lg border border-green-200">
                                <div>
                                  <div className="text-xs font-bold text-green-700">
                                    {promoCode || 'Code promo appliqué'}
                                  </div>
                                  {promoDiscountPercentage > 0 && (
                                    <div className="text-xs text-green-600">
                                      -{promoDiscountPercentage.toFixed(2)}%
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs sm:text-sm font-bold text-green-700">
                                  -{formatPrice(discountAmount)}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {totals.tax > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs sm:text-sm text-gray-600">TVA (10%)</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-700">{formatPrice(totals.tax)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1.5 border-t border-neutral-200">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700">Total articles</span>
                          <span className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(totals.total || itemsTotal)}</span>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* ✅ Détails des paiements - Optimisé pour mobile/tablette */}
                <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-neutral-200 shadow-lg p-3 sm:p-4 md:p-5">
                  <h5 className="text-xs sm:text-sm font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 uppercase tracking-wide">Paiements enregistrés</h5>
                  <div className="space-y-1.5 sm:space-y-2">
                    {payments.map((payment) => {
                      // ✅ Déterminer l'icône selon la méthode
                      let Icon;
                      let iconColor;
                      let label;
                      
                      if (payment.method === 'cash') {
                        Icon = Wallet;
                        iconColor = 'text-green-600';
                        label = 'Espèces';
                      } else if (payment.method === 'card') {
                        Icon = CreditCard;
                        iconColor = 'text-blue-600';
                        label = 'Carte';
                      } else if (payment.method === 'ticket') {
                        Icon = Ticket;
                        iconColor = 'text-purple-600';
                        label = 'Tickets';
                      } else {
                        Icon = CreditCard;
                        iconColor = 'text-neutral-600';
                        label = payment.method || 'Autre';
                      }
                      
                      return (
                        <div
                          key={payment.tempId}
                          className="bg-neutral-50 rounded-md sm:rounded-lg md:rounded-xl px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 border border-neutral-200"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-1">
                              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ${iconColor} flex-shrink-0`} />
                              <span className="font-semibold text-gray-900 capitalize text-xs sm:text-sm md:text-base truncate">{label}</span>
                            </div>
                            <span className="font-bold text-sm sm:text-base md:text-lg text-gray-900 flex-shrink-0 ml-2">{formatPrice(payment.amount)}</span>
                          </div>
                          {/* ✅ Monnaie rendue pour paiement en espèces */}
                          {payment.method === 'cash' && totals.change > 0 && (
                            <div className="flex items-center justify-between bg-green-50 rounded px-2 py-1 mt-1.5 border border-green-200">
                              <span className="text-xs text-green-700 font-medium">💰 Monnaie rendue</span>
                              <span className="text-xs sm:text-sm font-bold text-green-700">{formatPrice(totals.change)}</span>
                            </div>
                          )}
                          {/* ✅ Référence de transaction pour paiement par carte */}
                          {payment.method === 'card' && (() => {
                            const transactionRef = payment.reference || authorizationNumber || null;
                            return transactionRef && transactionRef !== '—' && transactionRef.trim() !== '' ? (
                              <div className="flex items-center justify-between bg-blue-50 rounded px-2 py-1 mt-1.5 border border-blue-200">
                                <span className="text-xs text-blue-700 font-medium">🔗 Référence</span>
                                <span className="text-xs font-mono font-semibold text-blue-700 truncate ml-2" title={transactionRef}>{transactionRef}</span>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ✅ Notes si présentes - Optimisé pour mobile/tablette */}
                {notes && (
                  <div className="bg-neutral-50 rounded-lg sm:rounded-xl md:rounded-2xl border-2 border-neutral-200 px-3 sm:px-4 md:px-5 py-2 sm:py-3 md:py-4">
                    <p className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-1.5 sm:mb-2">Notes</p>
                    <p className="text-xs sm:text-sm text-neutral-700 break-words">{notes}</p>
                  </div>
                )}

                {/* ✅ Actions ticket - Optimisé pour mobile/tablette */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button
                    onClick={handleDownloadTicket}
                    className="flex-1 border-2 border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 font-semibold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm md:text-base"
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 inline mr-1.5 sm:mr-2" />
                    <span className="hidden md:inline">Télécharger le ticket PDF</span>
                    <span className="md:hidden">Télécharger PDF</span>
                  </Button>
                  <Button
                    onClick={handleSendEmail}
                    disabled={submitting}
                    className="flex-1 border-2 border-blue-300 text-blue-700 bg-white hover:bg-blue-50 hover:border-blue-400 font-semibold py-2.5 sm:py-3 md:py-4 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 inline mr-1.5 sm:mr-2" />
                    <span className="hidden md:inline">Envoyer le ticket par email</span>
                    <span className="md:hidden">Envoyer email</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Modal de confirmation pour la monnaie à rendre */}
      {showChangeConfirmationModal && pendingPayment && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-heading font-bold text-white">Confirmation de paiement</h3>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Récapitulatif */}
              <div className="bg-neutral-50 rounded-lg p-3 sm:p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-neutral-600">Montant total à payer</span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(totals.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base text-neutral-600">Montant reçu</span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(clampDecimals(currentAmountInput || 0))}</span>
                </div>
                <div className="pt-2 border-t border-neutral-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base font-semibold text-neutral-700">Déjà payé</span>
                    <span className="text-base sm:text-lg font-semibold text-neutral-700">{formatPrice(totals.amountPaid)}</span>
                  </div>
                </div>
              </div>

              {/* Monnaie à rendre - Mise en valeur */}
              {(() => {
                const receivedAmount = clampDecimals(currentAmountInput || 0);
                const changeToGive = receivedAmount > totals.remaining ? receivedAmount - totals.remaining : 0;
                
                if (changeToGive > 0) {
                  return (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 sm:p-5 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500 rounded-full flex items-center justify-center">
                          <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                      </div>
                      <p className="text-sm sm:text-base text-neutral-600 mb-2">Monnaie à rendre au client</p>
                      <p className="text-3xl sm:text-4xl font-heading font-bold text-green-600">{formatPrice(changeToGive)}</p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Footer avec boutons */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button
                onClick={handleCancelChangePayment}
                className="w-full sm:flex-1 px-4 py-2.5 border-2 border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 font-semibold rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Retour au paiement
              </Button>
              <Button
                onClick={handleConfirmChangePayment}
                className="w-full sm:flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-heading font-bold rounded-lg hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all"
              >
                <CheckCircle2 className="w-4 h-4 inline mr-2" />
                Valider
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentWorkflowModal;

