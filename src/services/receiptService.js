import pdfMake from 'pdfmake/build/pdfmake.min';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { formatOrderNumber } from '../utils/orderHelpers';
import { DEFAULT_BUSINESS_INFO, DEFAULT_TICKET_DISPLAY } from './businessInfoService';
import logger from '../utils/logger';

if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

// Configuration de la police Courier
// Variable pour suivre si la police est chargée
let courierFontLoaded = false;

// Fonction pour charger la police Courier personnalisée
const loadCourierFont = async () => {
  if (courierFontLoaded) return true;
  
  try {
    const fontModule = await import('../config/courier-font-base64.js');
    const courierFontBase64 = fontModule?.courierFontBase64 || fontModule?.default;
    
    if (courierFontBase64) {
      // Ajouter la police au VFS
      pdfMake.vfs['Courier-Regular.ttf'] = courierFontBase64;
      
      // Configurer la police pour pdfMake
      pdfMake.fonts = {
        ...(pdfMake.fonts || {}),
        Courier: {
          normal: 'Courier-Regular.ttf',
          bold: 'Courier-Regular.ttf',
          italics: 'Courier-Regular.ttf',
          bolditalics: 'Courier-Regular.ttf'
        }
      };
      
      courierFontLoaded = true;
      logger.log('✅ Police Courier chargée avec succès');
      return true;
    } else {
      logger.log('ℹ️ Police Courier personnalisée non configurée');
    }
  } catch (error) {
    // Si le fichier n'existe pas ou erreur, ignorer
    logger.log('ℹ️ Police Courier personnalisée non trouvée');
  }
  return false;
};

// Charger la police au démarrage (de manière asynchrone)
loadCourierFont().catch(() => {
  // Ignorer les erreurs silencieusement
});

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

  // ✅ Récupérer les informations du code promo si présent
  const promoCodeInfo = order.promo_code || order.promoCode || null;
  const promoCodeDescription = order.promo_code_description || order.promoCodeDescription || null;
  const promoDiscountType = order.promo_discount_type || order.promoDiscountType || null;
  const promoDiscountValue = order.promo_discount_value || order.promoDiscountValue || null;
  const discountAmount = parseFloat(order.discount_amount ?? order.discountAmount ?? 0) || 0;

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
  // CONSTRUCTION DU TICKET - STYLE MINIMALISTE
  // ==========================================

  const content = [];

  // Nom de l'établissement
  if (displayPrefs.showName && safeBusinessInfo.name) {
    content.push({
      text: safeBusinessInfo.name.toUpperCase(),
      fontSize: 16,
      bold: true,
      color: '#000000',
      alignment: 'center',
      margin: [0, 15, 0, 10]
    });
  }

  // Adresse
  if (displayPrefs.showAddress && safeBusinessInfo.address) {
    content.push({
      text: safeBusinessInfo.address,
      fontSize: 10,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Téléphone
  if (displayPrefs.showPhone && safeBusinessInfo.phone) {
    content.push({
      text: `Tél: ${safeBusinessInfo.phone}`,
      fontSize: 10,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Email
  if (displayPrefs.showEmail && safeBusinessInfo.email) {
    content.push({
      text: safeBusinessInfo.email,
      fontSize: 10,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Site web
  if (displayPrefs.showWebsite && safeBusinessInfo.website) {
    content.push({
      text: safeBusinessInfo.website,
      fontSize: 10,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Service client
  if (displayPrefs.showCustomerService && safeBusinessInfo.customerService) {
    content.push({
      text: safeBusinessInfo.customerService,
      fontSize: 10,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // SIRET
  if (displayPrefs.showSiret && safeBusinessInfo.siret) {
    content.push({
      text: `SIRET: ${safeBusinessInfo.siret}`,
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Numéro de TVA
  if (displayPrefs.showVat && safeBusinessInfo.vatNumber) {
    content.push({
      text: `SIRET: ${safeBusinessInfo.vatNumber}`,
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Forme juridique
  if (displayPrefs.showLegalForm && safeBusinessInfo.legalForm) {
    content.push({
      text: safeBusinessInfo.legalForm,
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Capital social
  if (displayPrefs.showLegalForm && safeBusinessInfo.shareCapital) {
    content.push({
      text: `Capital: ${safeBusinessInfo.shareCapital}`,
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // RCS
  if (displayPrefs.showRcs && safeBusinessInfo.rcs) {
    content.push({
      text: `RCS: ${safeBusinessInfo.rcs}`,
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Ligne de séparation pointillée
  content.push({
    text: '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
    fontSize: 9,
    color: '#000000',
    alignment: 'center',
    margin: [0, 0, 0, 1]
  });

  // Numéro de commande
  content.push({
    text: formattedOrderNumber,
    fontSize: 11,
    bold: true,
    color: '#000000',
    alignment: 'center',
    margin: [0, 0, 0, 3]
  });

  // Date et heure
  content.push({
    text: `${formattedDate} - ${formattedTime}`,
    fontSize: 10,
    color: '#000000',
    alignment: 'center',
    margin: [0, 0, 0, 1]
  });

  // Ligne de séparation
  content.push({
    text: '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
    fontSize: 9,
    color: '#000000',
    alignment: 'center',
    margin: [0, 0, 0, 1]
  });

  // Articles
  parsedItems.forEach((item) => {
    const displayName = item.quantity > 1 
      ? `${item.name} x${item.quantity}`
      : item.name;
    
    content.push({
      columns: [
        {
          text: displayName,
          fontSize: 11,
          color: '#000000',
          width: '*'
        },
        {
          text: formatPrice(item.priceTTC * item.quantity),
          fontSize: 11,
          color: '#000000',
          alignment: 'right',
          width: 70
        }
      ],
      margin: [0, 0, 0, 5]
    });
  });

  // Ligne de séparation
  content.push({
    text: '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
    fontSize: 9,
    color: '#000000',
    alignment: 'center',
    margin: [0, 1, 0, 1]
  });

  // Récompense de fidélité (si utilisée)
  const loyaltyReward = order.loyaltyReward || order.loyalty_reward;
  if (loyaltyReward) {
    const rewardType = typeof loyaltyReward === 'object' ? (loyaltyReward.type || 'tier') : 'tier';
    
    if (rewardType === 'product') {
      const productName = loyaltyReward.name || 'Produit offert';
      content.push({
        columns: [
          {
            text: `${productName} (OFFERT)`,
            fontSize: 11,
            color: '#9333ea',
            width: '*',
            bold: true
          },
          {
            text: 'GRATUIT',
            fontSize: 11,
            color: '#9333ea',
            alignment: 'right',
            bold: true,
            width: 70
          }
        ],
        margin: [0, 0, 0, 5]
      });
    } else if (rewardType === 'percentage') {
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
              fontSize: 11,
              color: '#9333ea',
              width: '*'
            },
            {
              text: `-${formatPrice(rewardDiscountAmount)}`,
              fontSize: 11,
              color: '#9333ea',
              alignment: 'right',
              bold: true,
              width: 70
            }
          ],
          margin: [0, 0, 0, 5]
        });
        
        subtotalHT = Math.max(0, subtotalHT - rewardDiscountAmount);
        totalTTC = Math.max(0, totalTTC - rewardDiscountAmount);
      }
    } else {
      const rewardText = typeof loyaltyReward === 'string' 
        ? loyaltyReward 
        : loyaltyReward.reward || `Récompense fidélité (${loyaltyReward.tier || ''} points)`;
      const discountValue = typeof loyaltyReward === 'object' && loyaltyReward.discount
        ? loyaltyReward.discount
        : 0;
      
      const rewardDiscountAmount = discountValue > 0 
        ? (subtotalHT * discountValue) / 100 
        : 0;
      
      if (rewardDiscountAmount > 0) {
        content.push({
          columns: [
            {
              text: rewardText,
              fontSize: 11,
              color: '#9333ea',
              width: '*'
            },
            {
              text: `-${formatPrice(rewardDiscountAmount)}`,
              fontSize: 11,
              color: '#9333ea',
              alignment: 'right',
              bold: true,
              width: 70
            }
          ],
          margin: [0, 0, 0, 5]
        });
        
        subtotalHT = Math.max(0, subtotalHT - rewardDiscountAmount);
        totalTTC = Math.max(0, totalTTC - rewardDiscountAmount);
      }
    }
  }

  // ✅ Afficher le code promo si présent (uniquement si pas de récompense de fidélité)
  if (promoCodeInfo && discountAmount > 0 && !loyaltyReward) {
    const promoText = promoCodeDescription 
      ? `${promoCodeInfo} - ${promoCodeDescription}`
      : promoCodeInfo;
    const promoDiscountText = promoDiscountType === 'percentage' && promoDiscountValue
      ? `(-${promoDiscountValue}%)`
      : '';
    
    content.push({
      columns: [
        {
          text: `Code promo: ${promoText} ${promoDiscountText}`,
          fontSize: 11,
          color: '#16a34a',
          width: '*'
        },
        {
          text: `-${formatPrice(discountAmount)}`,
          fontSize: 11,
          color: '#16a34a',
          alignment: 'right',
          bold: true,
          width: 70
        }
      ],
      margin: [0, 0, 0, 5]
    });
    
    subtotalHT = Math.max(0, subtotalHT - discountAmount);
    totalTTC = Math.max(0, totalTTC - discountAmount);
  }

  // Sous-total HT
  content.push({
    columns: [
      { 
        text: 'SOUS-TOTAL HT:', 
        fontSize: 11, 
        color: '#000000',
        width: '*' 
      },
      {
        text: formatPrice(subtotalHT),
        fontSize: 11,
        color: '#000000',
        alignment: 'right',
        width: 70
      }
    ],
    margin: [0, 0, 0, 5]
  });

  // TVA
  content.push({
    columns: [
      { 
        text: 'TVA:', 
        fontSize: 11, 
        color: '#000000',
        width: '*' 
      },
      {
        text: formatPrice(tva),
        fontSize: 11,
        color: '#000000',
        alignment: 'right',
        width: 70
      }
    ],
    margin: [0, 0, 0, 5]
  });

  // Total TTC
  content.push({
    columns: [
      { 
        text: 'TOTAL TTC:', 
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
        width: 70
      }
    ],
    margin: [0, 0, 0, 12]
  });

  // Ligne de séparation
  content.push({
    text: '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
    fontSize: 9,
    color: '#000000',
    alignment: 'center',
    margin: [0, 0, 0, 1]
  });

  // Paiements
  if (parsedPayments.length > 0) {
    parsedPayments.forEach((payment) => {
      const paymentType = payment.type || payment.method || 'CASH';
      const paymentAmt = parseFloat(payment.amount || 0);
      content.push({
        columns: [
          { 
            text: paymentType.toUpperCase() + ':', 
            fontSize: 11, 
            color: '#000000',
            width: '*' 
          },
          {
            text: formatPrice(paymentAmt),
            fontSize: 11,
            color: '#000000',
            alignment: 'right',
            width: 70
          }
        ],
        margin: [0, 0, 0, 12]
      });
    });

    // Ligne de séparation
    content.push({
      text: '- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -',
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 15]
    });
  }

  // Mentions de paiement
  if (displayPrefs.showPaymentMention && safeBusinessInfo.paymentMention) {
    content.push({
      text: safeBusinessInfo.paymentMention,
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 10, 0, 5]
    });
  }

  // Informations alimentaires
  if (displayPrefs.showFoodInfo && safeBusinessInfo.foodInfo) {
    content.push({
      text: safeBusinessInfo.foodInfo,
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Politique de retour
  if (displayPrefs.showReturnPolicy && safeBusinessInfo.returnPolicy) {
    content.push({
      text: safeBusinessInfo.returnPolicy,
      fontSize: 9,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Mentions légales
  if (displayPrefs.showLegalMentions && safeBusinessInfo.legalMentions) {
    content.push({
      text: safeBusinessInfo.legalMentions,
      fontSize: 8,
      color: '#000000',
      alignment: 'center',
      margin: [0, 0, 0, 5]
    });
  }

  // Message de remerciement
  content.push({
    text: 'MERCI DE VOTRE VISITE!',
    fontSize: 13,
    alignment: 'center',
    bold: true,
    color: '#000000',
    margin: [0, 0, 0, 5]
  });

  content.push({
    text: 'Au plaisir de vous revoir',
    fontSize: 10,
    alignment: 'center',
    color: '#000000',
    margin: [0, 0, 0, 20]
  });

  // Calcul hauteur
  const receiptWidth = 210;
  const baseHeight = 400;
  const perItemHeight = 20;
  const perPaymentHeight = 15;

  const itemsHeight = parsedItems.length * perItemHeight;
  const paymentsHeight = parsedPayments.length * perPaymentHeight;
  const extraHeight = itemsHeight + paymentsHeight;

  const computedHeight = Math.ceil(baseHeight + extraHeight);
  const finalHeight = Math.max(computedHeight + 50, 500);

  // Vérifier si la police Courier est disponible dans pdfMake, sinon utiliser Roboto
  // Note: Pour utiliser Courier, téléchargez la police et exécutez: node scripts/convert-font-to-base64.js
  const defaultFont = (pdfMake.fonts && pdfMake.fonts.Courier) ? 'Courier' : 'Roboto';
  
  const docDefinition = {
    pageSize: { width: receiptWidth, height: finalHeight },
    pageMargins: [20, 10, 20, 20],
    content: {
      stack: content,
      unbreakable: true
    },
    defaultStyle: {
      font: defaultFont, // Utilise Courier si chargée, sinon Roboto
      fontSize: 11
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

export const previewReceipt = async (order, options = {}) => {
  if (typeof window === 'undefined') {
    logger.error('previewReceipt ne peut être appelé que côté client');
    return;
  }

  try {
    logger.log('🔍 Génération de l\'aperçu du ticket...');
    
    // Vérifier que pdfMake est disponible
    if (!pdfMake || typeof pdfMake.createPdf !== 'function') {
      logger.error('❌ pdfMake n\'est pas disponible');
      alert('Erreur: pdfMake n\'est pas chargé. Veuillez recharger la page.');
      return;
    }
    
    // S'assurer que la police Courier est chargée avant de générer le PDF
    await loadCourierFont();
    
    const docDefinition = generateReceipt(order, options);
    logger.log('✅ Document défini, génération du PDF...');

    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      if (!blob) {
        logger.error("❌ Impossible de générer le PDF pour l'aperçu");
        alert("Impossible de générer l'aperçu du ticket. Veuillez réessayer.");
        return;
      }

      logger.log('✅ PDF généré, ouverture dans une nouvelle fenêtre...');
      const blobUrl = URL.createObjectURL(blob);
      const previewWindow = window.open(blobUrl, '_blank');

      if (!previewWindow) {
        logger.error("❌ Impossible d'ouvrir une nouvelle fenêtre (popup bloquée)");
        alert(
          'Votre navigateur bloque les pop-ups. Veuillez autoriser les pop-ups pour ce site.'
        );
        URL.revokeObjectURL(blobUrl);
        return;
      }

      logger.log('✅ Fenêtre d\'aperçu ouverte');
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 10000);
    });
  } catch (error) {
    logger.error("❌ Erreur lors de la génération de l'aperçu:", error);
    logger.error("   Stack:", error.stack);
    alert(`Erreur lors de la génération de l'aperçu: ${error.message}. Vérifiez la console pour plus de détails.`);
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