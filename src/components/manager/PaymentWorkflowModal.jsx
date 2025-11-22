import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  X,
  Minus,
  Plus,
  Trash2,
  RotateCcw,
  CreditCard,
  Wallet,
  CheckCircle2,
  FileText,
  Loader2,
  Gift,
  Ticket,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { formatPrice } from '../../constants/pricing';
import { formatOrderNumber } from '../../utils/orderHelpers';
import businessInfoService, { DEFAULT_BUSINESS_INFO, DEFAULT_TICKET_DISPLAY } from '../../services/businessInfoService';
import { downloadReceipt } from '../../services/receiptService';
import settingsService from '../../services/settingsService';
import logger from '../../utils/logger';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Espèces', icon: Wallet },
  { id: 'card', label: 'Carte', icon: CreditCard },
  { id: 'ticket', label: 'Tickets restaurant', icon: Ticket }
];

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

const STEP_ORDER = ['gestion', 'terminee'];

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
  if (!order) return [];
  const rawItems = Array.isArray(order.parsedItems)
    ? order.parsedItems
    : (() => {
        if (Array.isArray(order.items)) return order.items;
        if (typeof order.items === 'string') {
          try {
            const parsed = JSON.parse(order.items);
            return Array.isArray(parsed) ? parsed : [];
          } catch (err) {
            logger.warn('Impossible de parser items JSON', err);
            return [];
          }
        }
        return [];
      })();

  return rawItems
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

const StepIndicator = ({ current }) => (
  <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-center gap-4 mb-6 w-full">
    {STEP_ORDER.map((step, index) => {
      const isActive = current === step;
      const isCompleted = STEP_ORDER.indexOf(current) > index;
      const labelMap = {
        gestion: 'Paiement',
        terminee: 'Terminé'
      };

      return (
        <React.Fragment key={step}>
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-black text-white shadow-lg'
                  : isCompleted
                  ? 'bg-neutral-300 text-neutral-800 border border-neutral-400'
                  : 'bg-neutral-100 text-neutral-500 border border-neutral-300'
              }`}
            >
              {index + 1}
            </div>
            <span
              className={`text-sm font-semibold ${
                isActive
                  ? 'text-black'
                  : isCompleted
                  ? 'text-neutral-700'
                  : 'text-neutral-500'
              }`}
            >
              {labelMap[step]}
            </span>
          </div>
          {index < STEP_ORDER.length - 1 && (
            <>
              <div className={`hidden sm:block w-12 h-[2px] ${STEP_ORDER.indexOf(current) > index ? 'bg-black' : 'bg-neutral-300'}`}></div>
              <div className={`sm:hidden w-[2px] h-8 ${STEP_ORDER.indexOf(current) > index ? 'bg-black' : 'bg-neutral-300'}`}></div>
            </>
          )}
        </React.Fragment>
      );
    })}
  </div>
);

const PaymentWorkflowModal = ({ isOpen, order, onClose, onSubmit }) => {
  const [step, setStep] = useState('gestion');
  const [items, setItems] = useState([]);
  const [initialItems, setInitialItems] = useState([]);
  const [removedItemIds, setRemovedItemIds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [initialPayments, setInitialPayments] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [currentAmountInput, setCurrentAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(DEFAULT_BUSINESS_INFO);
  const [promos, setPromos] = useState([]);
  const [showPromoDropdown, setShowPromoDropdown] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);

  const resetState = useCallback(() => {
    const parsedItems = parseItems(order);
    const parsedPayments = parsePayments(order);

    const clonedItems = parsedItems.map(item => ({ ...item }));
    const clonedItemsForInitial = parsedItems.map(item => ({ ...item }));
    const clonedPayments = parsedPayments.map(payment => ({ ...payment }));
    const clonedPaymentsForInitial = parsedPayments.map(payment => ({ ...payment }));

    setItems(clonedItems);
    setInitialItems(clonedItemsForInitial);
    setRemovedItemIds([]);
    setPayments(clonedPayments);
    setInitialPayments(clonedPaymentsForInitial);
    setSelectedMethod(parsedPayments.length > 0 ? parsedPayments[parsedPayments.length - 1].method : 'cash');
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

  // Charger les promos depuis les settings
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
              setPromos(promosData.filter(p => p.isActive !== false));
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

  const sanitizeValue = useCallback((value) => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  }, []);

  const sanitizedBusinessInfo = useMemo(() => ({
    name: sanitizeValue(businessInfo?.name),
    address: sanitizeValue(businessInfo?.address),
    phone: sanitizeValue(businessInfo?.phone),
    website: sanitizeValue(businessInfo?.website),
    customerService: sanitizeValue(businessInfo?.customerService),
    email: sanitizeValue(businessInfo?.email),
    siret: sanitizeValue(businessInfo?.siret),
    vatNumber: sanitizeValue(businessInfo?.vatNumber),
    legalForm: sanitizeValue(businessInfo?.legalForm),
    shareCapital: sanitizeValue(businessInfo?.shareCapital),
    rcs: sanitizeValue(businessInfo?.rcs),
    paymentMention: sanitizeValue(businessInfo?.paymentMention),
    legalMentions: sanitizeValue(businessInfo?.legalMentions),
    returnPolicy: sanitizeValue(businessInfo?.returnPolicy),
    foodInfo: sanitizeValue(businessInfo?.foodInfo)
  }), [businessInfo, sanitizeValue]);

  const totals = useMemo(() => {
    const discount = clampDecimals(order?.discount_amount ?? 0);
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
  }, [items, payments, order?.discount_amount, order?.tax_amount, appliedPromo]);

  const ticketTaxDetails = useMemo(() => {
    return items.reduce((acc, item) => {
      const parsedRate = typeof item.taxRate === 'number' ? item.taxRate : Number.parseFloat(item.taxRate);
      const rate = Number.isFinite(parsedRate) ? parsedRate : 20;
      const roundedRate = Math.round(rate * 10) / 10;
      const key = roundedRate.toFixed(1);
      if (!acc[key]) {
        acc[key] = { base: 0, tax: 0 };
      }
      const lineTotal = clampDecimals(item.unitPrice * item.quantity);
      const baseHT = clampDecimals(lineTotal / (1 + rate / 100));
      const taxAmount = clampDecimals(lineTotal - baseHT);
      acc[key].base = clampDecimals(acc[key].base + baseHT);
      acc[key].tax = clampDecimals(acc[key].tax + taxAmount);
      return acc;
    }, {});
  }, [items]);

  const ticketTaxEntries = useMemo(() => {
    return Object.entries(ticketTaxDetails)
      .map(([rate, data]) => {
        const rateValue = Number.parseFloat(rate);
        let label = `TVA ${rate}%`;
        if (rateValue >= 9 && rateValue <= 11) {
          label = 'TVA 10% (Restauration)';
        } else if (rateValue <= 6) {
          label = 'TVA 5,5% (Boissons)';
        } else if (rateValue >= 19) {
          label = 'TVA 20%';
        }
        return {
          label,
          base: clampDecimals(data.base),
          tax: clampDecimals(data.tax),
          rateValue
        };
      })
      .filter((entry) => entry.base > 0 || entry.tax > 0)
      .sort((a, b) => b.rateValue - a.rateValue);
  }, [ticketTaxDetails]);

  const ticketLegalLines = useMemo(() => {
    const lines = [];
    if (!businessInfo) return lines;

    if (ticketDisplay.showLegalForm && sanitizedBusinessInfo.legalForm) {
      lines.push(
        `${sanitizedBusinessInfo.legalForm}${
          sanitizedBusinessInfo.shareCapital ? ` - Capital : ${sanitizedBusinessInfo.shareCapital}` : ''
        }`
      );
    } else if (ticketDisplay.showLegalForm && sanitizedBusinessInfo.shareCapital) {
      lines.push(`Capital : ${sanitizedBusinessInfo.shareCapital}`);
    }

    if (ticketDisplay.showRcs && sanitizedBusinessInfo.rcs) {
      lines.push(`RCS : ${sanitizedBusinessInfo.rcs}`);
    }
    if (ticketDisplay.showPaymentMention && sanitizedBusinessInfo.paymentMention) {
      lines.push(sanitizedBusinessInfo.paymentMention);
    }
    if (ticketDisplay.showLegalMentions && sanitizedBusinessInfo.legalMentions) {
      lines.push(sanitizedBusinessInfo.legalMentions);
    }
    if (ticketDisplay.showReturnPolicy && sanitizedBusinessInfo.returnPolicy) {
      lines.push(sanitizedBusinessInfo.returnPolicy);
    }
    if (ticketDisplay.showFoodInfo && sanitizedBusinessInfo.foodInfo) {
      lines.push(sanitizedBusinessInfo.foodInfo);
    }
    if (ticketDisplay.showCustomerService && sanitizedBusinessInfo.customerService) {
      lines.push(`Service client : ${sanitizedBusinessInfo.customerService}`);
    }
    if (ticketDisplay.showWebsite && sanitizedBusinessInfo.website) {
      lines.push(`Site web : ${sanitizedBusinessInfo.website}`);
    }
    if (ticketDisplay.showEmail && sanitizedBusinessInfo.email) {
      lines.push(`Email : ${sanitizedBusinessInfo.email}`);
    }
    return lines;
  }, [businessInfo, sanitizedBusinessInfo, ticketDisplay]);

  const amountPaid = clampDecimals(totals.amountPaid);
  const changeAmount = clampDecimals(totals.change);
  const mainPayment = payments.length > 0 ? payments[payments.length - 1] : null;
  const paymentMethodLabels = {
    cash: 'Espèces',
    card: 'Carte bancaire',
    stripe: 'Carte bancaire',
    paypal: 'PayPal',
    mixed: 'Paiement mixte',
    voucher: 'Bon / chèque cadeau',
    other: 'Autre',
    check: 'Chèque',
    transfer: 'Virement'
  };
  const displayedPaymentMethod = mainPayment ? (paymentMethodLabels[mainPayment.method] || mainPayment.method) : '—';
  const authorizationNumber = mainPayment?.reference || order?.payment_reference || order?.paymentReference || '—';

  const loyaltyPointsEarned = useMemo(() => {
    const raw =
      order?.loyalty_points_earned ??
      order?.loyaltyPointsEarned ??
      order?.rewards_points ??
      order?.pointsEarned ??
      0;
    return clampDecimals(raw);
  }, [order]);

  const loyaltyPointsTotal = useMemo(() => {
    const raw =
      order?.loyalty_points_total ??
      order?.loyaltyPointsTotal ??
      order?.customer_points_total ??
      order?.customerPointsTotal ??
      0;
    return clampDecimals(raw);
  }, [order]);

  const createdAtDate = useMemo(() => {
    if (!order) return null;
    const rawDate = order.completed_at || order.updated_at || order.created_at || order.createdAt;
    if (!rawDate) return null;
    const date = new Date(rawDate);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [order]);

  const formattedDate = createdAtDate
    ? createdAtDate.toLocaleDateString('fr-FR')
    : '—';
  const formattedTime = createdAtDate
    ? createdAtDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

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

  const resetArticles = () => {
    setItems(initialItems.map((item) => ({ ...item })));
    setRemovedItemIds([]);
  };

  const resetPayments = () => {
    setPayments(initialPayments.map((payment) => ({ ...payment })));
    setCurrentAmountInput('');
    setError(null);
    setAppliedPromo(null);
  };

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

  const handleExactAmount = () => {
    setCurrentAmountInput(String(totals.remaining.toFixed(2)));
  };

  const handleApplyPromo = (promo) => {
    setAppliedPromo(promo);
    setShowPromoDropdown(false);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  const handleAddPayment = () => {
    const amount = clampDecimals(currentAmountInput);
    if (amount <= 0) {
      setError('Veuillez saisir un montant valide supérieur à zéro.');
      return;
    }

    const newPayment = {
      tempId: `temp-${Date.now()}`,
      method: selectedMethod,
      amount,
      reference: ''
    };

    setPayments((prev) => [...prev, newPayment]);
    setCurrentAmountInput('');
    setError(null);
  };

  const handleRemovePayment = (tempId) => {
    setPayments((prev) => prev.filter((payment) => payment.tempId !== tempId));
  };

  const handleFinalize = async () => {
    if (!order) return;

    if (items.length === 0) {
      setError('Impossible de finaliser une commande sans article.');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        orderId: order.id,
        orderNumber: order.order_number,
        items: items.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: clampDecimals(item.quantity),
          unitPrice: clampDecimals(item.unitPrice),
          subtotal: clampDecimals(item.quantity * item.unitPrice)
        })),
        removedItemIds,
        payments: payments.map((payment) => ({
          method: payment.method,
          amount: clampDecimals(payment.amount),
          reference: payment.reference || null
        })),
        totals: {
          subtotal: totals.subtotal,
          discount: totals.discount,
          promoDiscount: totals.promoDiscount || 0,
          tax: totals.tax,
          total: totals.total,
          amountPaid: totals.amountPaid,
          remaining: totals.remaining,
          change: totals.change
        },
        appliedPromo: appliedPromo ? {
          label: appliedPromo.label,
          discountType: appliedPromo.discountType,
          discountValue: appliedPromo.discountValue
        } : null,
        notes,
        statusNext: 'preparing'
      };

      const result = await onSubmit(payload);

      if (result?.success === false) {
        setError(result?.error || 'Erreur lors de la finalisation du paiement.');
        setSubmitting(false);
        return;
      }

      onClose(result?.updatedOrder || null);
    } catch (err) {
      logger.error('Erreur finale workflow paiement', err);
      setError(err.message || 'Impossible de finaliser le paiement.');
      setSubmitting(false);
    }
  };

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

  if (!isOpen || !order) {
    return null;
  }

  const keypadLayout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'DEL']
  ];

  const canProceedToSummary = items.length > 0 && payments.length > 0 && totals.amountPaid >= totals.total;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full h-full bg-gradient-to-br from-white to-neutral-50 flex flex-col overflow-hidden">
        {/* Header simplifié */}
        <div className="relative bg-gradient-to-r from-neutral-900 to-black px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 border-b border-neutral-800">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Fermer"
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

        {/* Indicateur d'étape simplifié */}
        <div className="px-3 sm:px-4 lg:px-5 py-1.5 sm:py-2 bg-neutral-100 border-b border-neutral-200">
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

        <div className="flex-1 overflow-hidden px-3 sm:px-4 lg:px-5 py-2 sm:py-3 lg:py-4 overflow-y-auto">
          {step === 'gestion' && (
            <div className="h-full grid gap-3 sm:gap-4 lg:gap-5 grid-cols-1 lg:grid-cols-[1fr,1.1fr]">
              {/* Colonne gauche - Articles et résumé */}
              <div className="flex flex-col h-full gap-2 sm:gap-3 overflow-hidden">
                {/* Articles */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-neutral-200 shadow-md flex flex-col h-full overflow-hidden">
                  <div className="px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 border-b border-neutral-200 flex items-center justify-between bg-gradient-to-r from-neutral-50 to-white">
                    <h4 className="text-sm sm:text-base font-heading font-bold text-gray-900 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-700 flex-shrink-0" />
                      <span className="truncate">Articles</span>
                    </h4>
                    <button
                      type="button"
                      onClick={resetArticles}
                    className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-md transition-colors flex-shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Réinitialiser</span>
                      <span className="sm:hidden">Reset</span>
                    </button>
                  </div>

                  {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                      <div className="text-center">
                        <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-neutral-300 mx-auto mb-2" />
                        <p className="text-xs font-medium text-neutral-500">Aucun article</p>
                        <p className="text-xs text-neutral-400 mt-1">Réinitialisez pour restaurer</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 min-h-0 overflow-auto p-2 sm:p-2.5 space-y-1.5">
                      {items.map((item) => (
                        <div key={item.id ?? item.productId} className="flex items-center gap-1.5 sm:gap-2 bg-neutral-50 rounded-md sm:rounded-lg px-2 sm:px-2.5 py-1.5 sm:py-2 border border-neutral-200 hover:border-neutral-300 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-semibold text-gray-900 truncate text-sm sm:text-base">{item.name}</p>
                            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 truncate">{item.category}</p>
                          </div>
                          <div className="flex items-center gap-1 bg-white rounded-md border border-neutral-200 p-0.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                            <span className="w-5 sm:w-6 text-center font-bold text-gray-900 text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-700 transition-colors"
                            >
                              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>
                          <div className="text-right min-w-[55px] sm:min-w-[65px] flex-shrink-0">
                            <p className="text-xs font-bold text-gray-900">{formatPrice(item.quantity * item.unitPrice)}</p>
                            <p className="text-xs text-neutral-500">{formatPrice(item.unitPrice)}/u</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Résumé des totaux */}
                  <div className="px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 border-t border-neutral-200 bg-gradient-to-br from-neutral-50 to-white">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-600">Total dû</span>
                        <span className="font-bold text-sm sm:text-base text-gray-900">{formatPrice(totals.total)}</span>
                      </div>
                      {appliedPromo && totals.promoDiscount > 0 && (
                        <div className="flex justify-between items-center text-xs bg-purple-50 px-2 py-1 rounded">
                          <span className="text-purple-700 font-medium">Promo: {appliedPromo.label}</span>
                          <span className="font-semibold text-purple-700">-{formatPrice(totals.promoDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-neutral-600">Déjà encaissé</span>
                        <span className="font-semibold text-neutral-700">{formatPrice(totals.amountPaid)}</span>
                      </div>
                      <div className="pt-1.5 border-t border-neutral-200 flex justify-between items-center">
                        <span className="font-semibold text-neutral-700 text-xs">Reste à payer</span>
                        <span className={`font-bold text-sm sm:text-base ${totals.remaining > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatPrice(totals.remaining)}
                        </span>
                      </div>
                      {totals.change > 0 && (
                        <div className="flex justify-between items-center text-xs pt-1">
                          <span className="text-green-600 font-medium">Monnaie à rendre</span>
                          <span className="font-bold text-green-600">{formatPrice(totals.change)}</span>
                        </div>
                      )}
                    </div>

                    {/* Paiements enregistrés */}
                    <div className="mt-2 pt-2 border-t border-neutral-200">
                      <h5 className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-1.5">Paiements</h5>
                      {payments.length === 0 ? (
                        <p className="text-xs text-neutral-400">Aucun paiement enregistré</p>
                      ) : (
                        <div className="space-y-1">
                          {payments.map((payment) => (
                            <div
                              key={payment.tempId}
                              className="flex items-center justify-between bg-white rounded-md px-2 py-1 border border-neutral-200"
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {payment.method === 'cash' ? (
                                  <Wallet className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                ) : (
                                  <CreditCard className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                                )}
                                <span className="text-xs font-semibold text-gray-900 capitalize truncate">{payment.method}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-xs font-bold text-gray-900">{formatPrice(payment.amount)}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePayment(payment.tempId)}
                                  className="w-5 h-5 rounded bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Colonne droite - Clavier et paiement */}
              <div className="flex flex-col h-full gap-2 sm:gap-3 min-h-0">
                {/* Affichage du montant - Toujours visible en haut */}
                <div className="bg-gradient-to-br from-neutral-900 to-black rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 border border-neutral-800 shadow-lg flex-shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs sm:text-sm font-medium text-white/80">Montant saisi</p>
                    <button
                      type="button"
                      onClick={resetPayments}
                      className="px-1.5 sm:px-2 py-0.5 text-xs font-semibold text-white/60 hover:text-white bg-white/10 rounded-md transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5 inline mr-0.5" />
                      <span className="hidden sm:inline">Reset</span>
                    </button>
                  </div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-heading font-bold text-white mb-1.5 break-all">
                    {currentAmountInput ? formatPrice(clampDecimals(currentAmountInput)) : '0 €'}
                  </p>
                  <div className="pt-1.5 border-t border-white/20">
                    <p className="text-xs text-white/60">Reste: <span className="font-semibold text-white">{formatPrice(totals.remaining)}</span></p>
                  </div>
                </div>

                {/* Clavier numérique - Optimisé avec plus d'espace */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-neutral-200 shadow-md p-2 sm:p-3 flex flex-col gap-2 sm:gap-2.5 flex-1 min-h-0 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                    {keypadLayout.map((row, rowIndex) => (
                      <React.Fragment key={`row-${rowIndex}`}>
                        {row.map((key) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleKeypadInput(key)}
                            className={`py-3.5 sm:py-4 rounded-lg border font-bold text-lg sm:text-xl transition-all active:scale-95 ${
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

                  {/* Montants rapides */}
                  <div className="flex flex-col gap-1 sm:gap-1.5">
                    <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleAmountQuickSet(amount)}
                        className="py-2 sm:py-2.5 rounded-md bg-neutral-900 text-white font-semibold hover:bg-neutral-800 transition-colors text-xs sm:text-sm"
                      >
                        {formatPrice(amount)}
                      </button>
                    ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleExactAmount}
                      className="py-2 sm:py-2.5 rounded-md bg-black text-white font-bold hover:bg-neutral-900 transition-colors text-xs sm:text-sm"
                    >
                      <span className="hidden sm:inline">Montant exact ({formatPrice(totals.remaining)})</span>
                      <span className="sm:hidden">Exact: {formatPrice(totals.remaining)}</span>
                    </button>
                  </div>
                </div>

                {/* Bouton Promo */}
                {promos.length > 0 && (
                  <div className="promo-dropdown-container bg-white rounded-lg sm:rounded-xl border border-neutral-200 shadow-md p-2 sm:p-3 flex-shrink-0 relative">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPromoDropdown(!showPromoDropdown)}
                        className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg border py-2 sm:py-2.5 font-semibold text-xs sm:text-sm transition-all ${
                          appliedPromo
                            ? 'border-purple-500 bg-purple-50 text-purple-700'
                            : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <Gift className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>{appliedPromo ? appliedPromo.label : 'Promo'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${showPromoDropdown ? 'rotate-180' : ''}`} />
                      </button>
                      {appliedPromo && (
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Retirer la promo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {showPromoDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                        {promos.map((promo, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleApplyPromo(promo)}
                            className="w-full px-3 py-2 text-left hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-b-0"
                          >
                            <div className="font-semibold text-sm text-black">{promo.label}</div>
                            <div className="text-xs text-neutral-600">
                              {promo.discountType === 'percentage' 
                                ? `${promo.discountValue}%` 
                                : `${formatPrice(promo.discountValue)}`}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Sélection méthode et ajout paiement - Toujours visible en bas */}
                <div className="bg-white rounded-lg sm:rounded-xl border border-neutral-200 shadow-md p-2 sm:p-3 flex flex-col gap-2 sm:gap-2.5 flex-shrink-0">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">Méthode de paiement</p>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const isSelected = selectedMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setSelectedMethod(method.id)}
                            className={`flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg border py-2 sm:py-2.5 font-semibold text-xs sm:text-sm transition-all ${
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

                  <button
                    type="button"
                    onClick={handleAddPayment}
                    disabled={clampDecimals(currentAmountInput) <= 0}
                    className={`w-full py-2 sm:py-2.5 rounded-lg font-heading font-bold text-xs sm:text-sm lg:text-base transition-all ${
                      clampDecimals(currentAmountInput) <= 0
                        ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                        : selectedMethod === 'cash'
                        ? 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg active:scale-95'
                        : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg active:scale-95'
                    }`}
                  >
                    Ajouter paiement
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'terminee' && (
            <div className="h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-auto">
              <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6 max-w-lg w-full">
                {/* Confirmation de paiement */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 lg:p-6 shadow-lg text-center">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                    <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 text-white" />
                  </div>
                  <h4 className="text-xl sm:text-2xl font-heading font-bold text-gray-900 mb-2">Paiement confirmé</h4>
                  <p className="text-xs sm:text-sm text-neutral-600 mb-3 sm:mb-4 px-2">
                    Le paiement a été enregistré avec succès. Vous pouvez maintenant lancer la préparation.
                  </p>
                  <div className="bg-white rounded-xl p-3 sm:p-4 border border-green-200">
                    <p className="text-xs sm:text-sm text-neutral-600 mb-1">Total payé</p>
                    <p className="text-2xl sm:text-3xl font-heading font-bold text-green-600">{formatPrice(totals.amountPaid)}</p>
                  </div>
                </div>

                {/* Détails des paiements */}
                <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-neutral-200 shadow-lg p-4 sm:p-5">
                  <h5 className="text-xs sm:text-sm font-bold text-gray-900 mb-3 sm:mb-4 uppercase tracking-wide">Paiements enregistrés</h5>
                  <div className="space-y-1.5 sm:space-y-2">
                    {payments.map((payment) => (
                      <div
                        key={payment.tempId}
                        className="flex items-center justify-between bg-neutral-50 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 border border-neutral-200"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          {payment.method === 'cash' ? (
                            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                          )}
                          <span className="font-semibold text-gray-900 capitalize text-sm sm:text-base truncate">{payment.method}</span>
                        </div>
                        <span className="font-bold text-base sm:text-lg text-gray-900 flex-shrink-0 ml-2">{formatPrice(payment.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes si présentes */}
                {notes && (
                  <div className="bg-neutral-50 rounded-xl sm:rounded-2xl border-2 border-neutral-200 px-4 sm:px-5 py-3 sm:py-4">
                    <p className="text-xs sm:text-sm font-semibold text-neutral-600 uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-xs sm:text-sm text-neutral-700 break-words">{notes}</p>
                  </div>
                )}

                {/* Bouton télécharger ticket */}
                <Button
                  onClick={handleDownloadTicket}
                  className="w-full border-2 border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 hover:border-neutral-400 font-semibold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
                >
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  <span className="hidden sm:inline">Télécharger le ticket PDF</span>
                  <span className="sm:hidden">Télécharger PDF</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer avec actions */}
        <div className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3">
          <Button
            onClick={handleClose}
            disabled={submitting}
            className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 font-semibold rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          
          {step === 'terminee' && (
            <Button
              onClick={() => setStep('gestion')}
              disabled={submitting}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 font-semibold rounded-lg transition-colors disabled:opacity-50 text-xs sm:text-sm"
            >
              Retour au paiement
            </Button>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
            {step === 'gestion' && (
              <Button
                onClick={() => setStep('terminee')}
                disabled={!canProceedToSummary}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white font-heading font-bold text-sm sm:text-base hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                Valider le paiement
              </Button>
            )}

            {step === 'terminee' && (
              <Button
                onClick={handleFinalize}
                disabled={submitting}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-gradient-to-r from-black to-neutral-900 text-white font-heading font-bold text-sm sm:text-base hover:from-neutral-900 hover:to-black shadow-md hover:shadow-lg rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span>Finalisation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Finaliser et démarrer la préparation</span>
                    <span className="sm:hidden">Finaliser</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentWorkflowModal;

