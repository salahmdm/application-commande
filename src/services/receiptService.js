import pdfMake from 'pdfmake/build/pdfmake.min';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { formatOrderNumber } from '../utils/orderHelpers';
import { DEFAULT_BUSINESS_INFO, DEFAULT_TICKET_DISPLAY } from './businessInfoService';
import logger from '../utils/logger';

if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

const formatPrice = (price) => {
  const formatted = parseFloat(price || 0).toFixed(2).replace('.', ',');
  return `${formatted} €`;
};

export const generateReceipt = (order, options = {}) => {
  const {
    businessInfo: businessInfoOption = {},
    ticketDisplay: ticketDisplayOption = {}
  } = options;

  const businessInfo = { ...DEFAULT_BUSINESS_INFO, ...businessInfoOption };
  const displayPrefs = {
    ...DEFAULT_TICKET_DISPLAY,
    ...(businessInfoOption?.displayPreferences || {}),
    ...(ticketDisplayOption || {})
  };

  const sanitize = (value) => {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  };

  const safeBusinessInfo = {
    name: sanitize(businessInfo.name),
    address: sanitize(businessInfo.address),
    phone: sanitize(businessInfo.phone),
    website: sanitize(businessInfo.website),
    email: sanitize(businessInfo.email),
    siret: sanitize(businessInfo.siret),
    vatNumber: sanitize(businessInfo.vatNumber),
    legalForm: sanitize(businessInfo.legalForm),
    shareCapital: sanitize(businessInfo.shareCapital),
    rcs: sanitize(businessInfo.rcs),
    paymentMention: sanitize(businessInfo.paymentMention),
    legalMentions: sanitize(businessInfo.legalMentions),
    returnPolicy: sanitize(businessInfo.returnPolicy),
    foodInfo: sanitize(businessInfo.foodInfo),
    customerService: sanitize(businessInfo.customerService)
  };

  // Parse items
  const parsedItems = (order.items || []).map((item) => {
    const quantity = parseFloat(item.quantity ?? 1) || 1;
    const priceTTC = parseFloat(item.price ?? item.unit_price ?? 0) || 0;
    const rawRate = parseFloat(
      item.tax_rate ?? item.taxRate ?? item.tva_rate ?? item.tvaRate ?? 20
    );
    const taxRate = Number.isFinite(rawRate) ? rawRate : 20;
    const priceHT = priceTTC / (1 + taxRate / 100);
    const taxAmount = priceTTC - priceHT;

    return {
      name: item.name || item.product_name || 'Produit',
      quantity,
      priceTTC,
      priceHT,
      taxRate,
      taxAmount
    };
  });

  let subtotalHT = parsedItems.reduce((sum, item) => sum + item.priceHT * item.quantity, 0);
  let tva = parsedItems.reduce((sum, item) => sum + item.taxAmount * item.quantity, 0);
  let totalTTC = parsedItems.reduce((sum, item) => sum + item.priceTTC * item.quantity, 0);

  if (!Number.isFinite(totalTTC) || totalTTC === 0) {
    totalTTC = parseFloat(order.total_amount ?? order.totalAmount ?? 0) || 0;
  }
  if (!Number.isFinite(tva) || tva === 0) {
    tva = parseFloat(order.tax_amount ?? order.taxAmount ?? 0) || 0;
  }
  if (!Number.isFinite(subtotalHT) || subtotalHT === 0) {
    subtotalHT = Math.max(0, totalTTC - tva);
  }

  // Payment
  const paymentDetailsRaw =
    typeof order.payment_details === 'string'
      ? (() => {
          try {
            return JSON.parse(order.payment_details);
          } catch {
            return null;
          }
        })()
      : order.payment_details || order.paymentDetails || null;

  const parsedPayments = Array.isArray(paymentDetailsRaw?.payments)
    ? paymentDetailsRaw.payments
    : Array.isArray(order.payments)
    ? order.payments
    : [];

  // Date
  const orderDate = (() => {
    const raw = order.completed_at || order.updated_at || order.created_at;
    if (!raw) return new Date();
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  })();

  const formattedDate = orderDate.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const formattedTime = orderDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedOrderNumber = formatOrderNumber(
    order.order_number || order.orderNumber,
    order.id
  );

  // ==========================================
  // CONSTRUCTION DU TICKET - STYLE AMÉLIORÉ
  // ==========================================

  const content = [];

  // Espacement en haut réduit
  content.push({
    text: '',
    fontSize: 8,
    margin: [0, 5, 0, 0]
  });

  // En-tête - Logo/Website mis en valeur
  if (displayPrefs.showWebsite && safeBusinessInfo.website) {
    content.push({
      text: safeBusinessInfo.website,
      fontSize: 16,
      bold: true,
      color: '#1a1a1a',
      alignment: 'center',
      margin: [0, 0, 0, 8]
    });
  }

  // Nom de l'établissement
  if (displayPrefs.showName && safeBusinessInfo.name) {
    content.push({
      text: safeBusinessInfo.name.toUpperCase(),
      fontSize: 13,
      bold: true,
      color: '#2d2d2d',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Informations de contact - groupe compact
  const contactInfo = [];
  if (displayPrefs.showAddress && safeBusinessInfo.address) {
    contactInfo.push(safeBusinessInfo.address);
  }
  if (displayPrefs.showPhone && safeBusinessInfo.phone) {
    contactInfo.push(safeBusinessInfo.phone);
  }
  if (displayPrefs.showEmail && safeBusinessInfo.email) {
    contactInfo.push(safeBusinessInfo.email);
  }

  if (contactInfo.length > 0) {
    content.push({
      text: contactInfo.join(' • '),
      fontSize: 7,
      color: '#666666',
      alignment: 'center',
      margin: [0, 0, 0, 8]
    });
  }

  // Informations légales / règlementaires
  const legalLines = [];

  if (displayPrefs.showLegalForm && safeBusinessInfo.legalForm) {
    const legalFormLine = safeBusinessInfo.shareCapital
      ? `${safeBusinessInfo.legalForm} - Capital : ${safeBusinessInfo.shareCapital}`
      : safeBusinessInfo.legalForm;
    legalLines.push(legalFormLine);
  } else if (displayPrefs.showLegalForm && safeBusinessInfo.shareCapital) {
    legalLines.push(`Capital : ${safeBusinessInfo.shareCapital}`);
  }

  if (displayPrefs.showSiret && safeBusinessInfo.siret) {
    legalLines.push(`SIRET : ${safeBusinessInfo.siret}`);
  }

  if (displayPrefs.showVat && safeBusinessInfo.vatNumber) {
    legalLines.push(`TVA : ${safeBusinessInfo.vatNumber}`);
  }

  if (displayPrefs.showRcs && safeBusinessInfo.rcs) {
    legalLines.push(`RCS : ${safeBusinessInfo.rcs}`);
  }

  if (displayPrefs.showPaymentMention && safeBusinessInfo.paymentMention) {
    legalLines.push(safeBusinessInfo.paymentMention);
  }

  if (displayPrefs.showLegalMentions && safeBusinessInfo.legalMentions) {
    legalLines.push(safeBusinessInfo.legalMentions);
  }

  if (displayPrefs.showReturnPolicy && safeBusinessInfo.returnPolicy) {
    legalLines.push(safeBusinessInfo.returnPolicy);
  }

  if (displayPrefs.showFoodInfo && safeBusinessInfo.foodInfo) {
    legalLines.push(safeBusinessInfo.foodInfo);
  }

  if (displayPrefs.showCustomerService && safeBusinessInfo.customerService) {
    legalLines.push(`Service client : ${safeBusinessInfo.customerService}`);
  }

  if (legalLines.length > 0) {
    content.push({
      stack: legalLines.map((line, index) => ({
        text: line,
        fontSize: 7,
        color: '#555555',
        alignment: 'center',
        margin: [0, index === 0 ? 0 : 2, 0, 0]
      })),
      margin: [0, 0, 0, 8]
    });
  }

  // Ligne de séparation élégante
  content.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 190,
        y2: 0,
        lineWidth: 0.5,
        lineColor: '#cccccc'
      }
    ],
    margin: [0, 0, 0, 8]
  });

  // Numéro de ticket - mis en valeur
  content.push({
    text: formattedOrderNumber,
    fontSize: 12,
    bold: true,
    color: '#000000',
    alignment: 'center',
    margin: [0, 0, 0, 6]
  });

  // Date et heure
  content.push({
    text: `${formattedDate} | ${formattedTime}`,
    fontSize: 9,
    color: '#666666',
    alignment: 'center',
    margin: [0, 0, 0, 8]
  });

  // Ligne de séparation avant les articles
  content.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 190,
        y2: 0,
        lineWidth: 0.5,
        lineColor: '#cccccc'
      }
    ],
    margin: [0, 0, 0, 6]
  });

  // Articles - Section avec espacement optimisé
  parsedItems.forEach((item, index) => {
    // Ligne avec nom du produit
    content.push({
      text: item.name,
      fontSize: 10,
      bold: false,
      color: '#1a1a1a',
      margin: [0, index === 0 ? 0 : 4, 0, 1]
    });

    // Ligne avec date/heure (si disponible)
    const itemDate = item.created_at || item.date;
    if (itemDate) {
      const iDate = new Date(itemDate);
      const iFormattedDate = iDate.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const iFormattedTime = iDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      content.push({
        text: `${iFormattedDate} ${iFormattedTime}`,
        fontSize: 7,
        color: '#999999',
        margin: [0, 0, 0, 2]
      });
    }

    // Ligne avec quantité et prix
    content.push({
      columns: [
        { text: '', width: '*' },
        {
          text: `x${item.quantity}`,
          width: 35,
          alignment: 'right',
          fontSize: 9,
          color: '#666666'
        },
        {
          text: formatPrice(item.priceTTC * item.quantity),
          width: 65,
          alignment: 'right',
          fontSize: 10,
          bold: true,
          color: '#1a1a1a'
        }
      ],
      margin: [0, 0, 0, 3]
    });
  });

  // Ligne de séparation avant les totaux
  content.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 190,
        y2: 0,
        lineWidth: 0.8,
        lineColor: '#999999'
      }
    ],
    margin: [0, 6, 0, 6]
  });

  // Récompense de fidélité (si utilisée)
  const loyaltyReward = order.loyaltyReward || order.loyalty_reward;
  if (loyaltyReward) {
    const rewardType = typeof loyaltyReward === 'object' ? (loyaltyReward.type || 'tier') : 'tier';
    
    if (rewardType === 'product') {
      // Produit offert
      const productName = loyaltyReward.name || 'Produit offert';
      content.push({
        columns: [
          {
            text: `${productName} (OFFERT)`,
            fontSize: 9,
            color: '#9333ea',
            width: '*',
            bold: true
          },
          {
            text: 'GRATUIT',
            fontSize: 9,
            color: '#9333ea',
            alignment: 'right',
            bold: true,
            width: 'auto'
          }
        ],
        margin: [0, 0, 0, 3]
      });
    } else if (rewardType === 'percentage') {
      // Réduction en pourcentage
      const rewardText = loyaltyReward.name || `Réduction fidélité`;
      const discountValue = parseFloat(loyaltyReward.discountValue) || 0;
      const rewardDiscountAmount = discountValue > 0 
        ? (subtotalHT * discountValue) / 100 
        : 0;
      
      if (rewardDiscountAmount > 0) {
        content.push({
          columns: [
            {
              text: `${rewardText} (-${discountValue}%)`,
              fontSize: 9,
              color: '#9333ea',
              width: '*'
            },
            {
              text: `-${formatPrice(rewardDiscountAmount)}`,
              fontSize: 9,
              color: '#9333ea',
              alignment: 'right',
              bold: true,
              width: 'auto'
            }
          ],
          margin: [0, 0, 0, 3]
        });
        
        // Ajuster les totaux avec la réduction
        subtotalHT = Math.max(0, subtotalHT - rewardDiscountAmount);
        totalTTC = Math.max(0, totalTTC - rewardDiscountAmount);
      }
    } else {
      // Ancien système (paliers)
      const rewardText = typeof loyaltyReward === 'string' 
        ? loyaltyReward 
        : loyaltyReward.reward || `Récompense fidélité (${loyaltyReward.tier || ''} points)`;
      const discountValue = typeof loyaltyReward === 'object' && loyaltyReward.discount
        ? loyaltyReward.discount
        : 0;
      
      // Calculer le montant de la réduction
      const rewardDiscountAmount = discountValue > 0 
        ? (subtotalHT * discountValue) / 100 
        : 0;
      
      if (rewardDiscountAmount > 0) {
        content.push({
          columns: [
            {
              text: rewardText,
              fontSize: 9,
              color: '#9333ea',
              width: '*'
            },
            {
              text: `-${formatPrice(rewardDiscountAmount)}`,
              fontSize: 9,
              color: '#9333ea',
              alignment: 'right',
              bold: true,
              width: 'auto'
            }
          ],
          margin: [0, 0, 0, 3]
        });
        
        // Ajuster les totaux avec la réduction
        subtotalHT = Math.max(0, subtotalHT - rewardDiscountAmount);
        totalTTC = Math.max(0, totalTTC - rewardDiscountAmount);
      }
    }
  }

  // Section Totaux - mise en valeur
  // Total TTC - principal
  content.push({
    columns: [
      { 
        text: 'TOTAL TTC', 
        fontSize: 12, 
        bold: true, 
        color: '#000000',
        width: '*' 
      },
      {
        text: formatPrice(totalTTC),
        fontSize: 12,
        bold: true,
        color: '#000000',
        alignment: 'right',
        width: 'auto'
      }
    ],
    margin: [0, 0, 0, 5]
  });

  // Détails fiscaux - plus discrets
  content.push({
    columns: [
      { 
        text: 'Total HT', 
        fontSize: 8, 
        color: '#666666',
        width: '*' 
      },
      {
        text: formatPrice(subtotalHT),
        fontSize: 8,
        color: '#666666',
        alignment: 'right',
        width: 'auto'
      }
    ],
    margin: [0, 0, 0, 2]
  });

  content.push({
    columns: [
      { 
        text: 'TVA', 
        fontSize: 8, 
        color: '#666666',
        width: '*' 
      },
      {
        text: formatPrice(tva),
        fontSize: 8,
        color: '#666666',
        alignment: 'right',
        width: 'auto'
      }
    ],
    margin: [0, 0, 0, 5]
  });

  // Encaissements (si disponibles)
  if (parsedPayments.length > 0) {
    content.push({
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 190,
          y2: 0,
          lineWidth: 0.5,
          lineColor: '#cccccc'
        }
      ],
      margin: [0, 5, 0, 5]
    });

    content.push({
      text: 'PAIEMENT',
      fontSize: 9,
      bold: true,
      color: '#333333',
      margin: [0, 0, 0, 4]
    });

    parsedPayments.forEach((payment) => {
      const paymentType = payment.type || payment.method || 'Espèces';
      const paymentAmt = parseFloat(payment.amount || 0);
      content.push({
        columns: [
          { 
            text: paymentType, 
            fontSize: 9, 
            color: '#666666',
            width: '*' 
          },
          {
            text: formatPrice(paymentAmt),
            fontSize: 9,
            bold: true,
            color: '#1a1a1a',
            alignment: 'right',
            width: 'auto'
          }
        ],
        margin: [0, 0, 0, 3]
      });
    });
  }

  // Ligne de séparation finale
  content.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 190,
        y2: 0,
        lineWidth: 0.5,
        lineColor: '#cccccc'
      }
    ],
    margin: [0, 8, 0, 8]
  });

  // Footer - Message de remerciement mis en valeur
  content.push({
    text: 'Merci de votre visite',
    fontSize: 11,
    alignment: 'center',
    bold: true,
    color: '#1a1a1a',
    margin: [0, 0, 0, 6]
  });

  // Nom de l'établissement en bas
  if (safeBusinessInfo.name) {
    content.push({
      text: safeBusinessInfo.name.toUpperCase(),
      fontSize: 9,
      alignment: 'center',
      bold: true,
      color: '#666666',
      margin: [0, 0, 0, 0] // La marge de page de 2cm en bas sera appliquée automatiquement
    });
  }

  // Calcul hauteur - optimisé pour une seule page
  const receiptWidth = 210;
  const baseHeight = 350; // Hauteur de base augmentée pour éviter la pagination
  const perItemHeight = 28; // Hauteur par article augmentée
  const perPaymentHeight = 15; // Hauteur par paiement

  // Calculer la hauteur totale nécessaire
  const itemsHeight = parsedItems.length * perItemHeight;
  const paymentsHeight = parsedPayments.length * perPaymentHeight;
  const extraHeight = itemsHeight + paymentsHeight;

  const computedHeight = Math.ceil(baseHeight + extraHeight);
  // Augmenter la hauteur minimale et ajouter une marge de sécurité
  const finalHeight = Math.max(computedHeight + 50, 500); // Marge de sécurité de 50 points

  const docDefinition = {
    pageSize: { width: receiptWidth, height: finalHeight },
    pageMargins: [10, 10, 10, 20],
    content: {
      stack: content,
      unbreakable: true // Empêcher les sauts de page
    },
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9
    },
    info: {
      title: 'Ticket de caisse'
    }
  };

  return docDefinition;
};

export const downloadReceipt = (order, options = {}) => {
  try {
    const docDefinition = generateReceipt(order, options);
    const orderNumber =
      order.order_number ||
      order.orderNumber ||
      `CMD-${String(order.id || 'XXXX').padStart(4, '0')}`;
    const fileName = `Ticket-${orderNumber}.pdf`;

    pdfMake.createPdf(docDefinition).download(fileName);
  } catch (error) {
    logger.error('Erreur lors du téléchargement du ticket:', error);
    alert('Erreur lors du téléchargement du ticket. Veuillez réessayer.');
  }
};

export const printReceipt = (order, options = {}) => {
  try {
    const docDefinition = generateReceipt(order, options);
    pdfMake.createPdf(docDefinition).open();
  } catch (error) {
    logger.error("Erreur lors de l'ouverture du ticket:", error);
    alert("Erreur lors de l'ouverture du ticket. Veuillez réessayer.");
  }
};

export const previewReceipt = (order, options = {}) => {
  if (typeof window === 'undefined') {
    logger.error('previewReceipt ne peut être appelé que côté client');
    return;
  }

  try {
    const docDefinition = generateReceipt(order, options);

    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      if (!blob) {
        logger.error("Impossible de générer le PDF pour l'aperçu");
        alert("Impossible de générer l'aperçu du ticket. Veuillez réessayer.");
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const previewWindow = window.open(blobUrl, '_blank');

      if (!previewWindow) {
        logger.error("Impossible d'ouvrir une nouvelle fenêtre (popup bloquée)");
        alert(
          'Votre navigateur bloque les pop-ups. Veuillez autoriser les pop-ups pour ce site.'
        );
        URL.revokeObjectURL(blobUrl);
        return;
      }

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 10000);
    });
  } catch (error) {
    logger.error("Erreur lors de la génération de l'aperçu:", error);
    alert("Erreur lors de la génération de l'aperçu. Veuillez réessayer.");
  }
};

export const getReceiptBlob = async (order, options = {}) => {
  const docDefinition = generateReceipt(order, options);

  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(docDefinition).getBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Impossible de générer le PDF'));
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

export const exportReceiptDataToFile = (order, options = {}) => {
  const docDefinition = generateReceipt(order, options);
  const orderNumber =
    order.order_number ||
    order.orderNumber ||
    `CMD-${String(order.id || 'XXXX').padStart(4, '0')}`;
  const fileName = `ticket-data-${orderNumber}.json`;

  const payload = {
    generatedAt: new Date().toISOString(),
    orderId: order.id ?? null,
    orderNumber: orderNumber,
    clientType: options.clientType ?? 'particulier',
    docDefinition
  };

  const json = JSON.stringify(payload, null, 2);

  if (typeof window !== 'undefined') {
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      logger.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export des données. Veuillez réessayer.");
    }
  }

  return fileName;
};

export default {
  generateReceipt,
  downloadReceipt,
  printReceipt,
  previewReceipt,
  getReceiptBlob,
  exportReceiptDataToFile
};