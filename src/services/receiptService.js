import pdfMake from 'pdfmake/build/pdfmake.min';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { formatOrderNumber } from '../utils/orderHelpers';

// Initialiser les polices
if (pdfFonts && pdfFonts.pdfMake && pdfFonts.pdfMake.vfs) {
  pdfMake.vfs = pdfFonts.pdfMake.vfs;
}

/**
 * Service de génération de tickets de caisse
 */

// Informations de l'établissement (à configurer selon vos besoins)
const ESTABLISHMENT_INFO = {
  name: '☕ Blossom Café',
  address: '123 Rue de la Gastronomie',
  postalCode: '75001',
  city: 'Paris',
  phone: '+33 1 23 45 67 89',
  email: 'contact@blossomcafe.fr',
  siret: '123 456 789 00012',
  tvaNumber: 'FR12 123456789',
  legalMention: 'SAS au capital de 10 000€ - RCS Paris B 123 456 789'
};

/**
 * Formater un prix en euros
 */
const formatPrice = (price) => {
  return `${parseFloat(price).toFixed(2)}€`;
};

/**
 * Formater une date
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Générer un ticket de caisse en PDF
 * @param {Object} order - Commande complète
 * @param {Object} options - Options de génération
 * @param {string} options.clientType - 'particulier' ou 'professionnel'
 * @param {Object} options.clientInfo - Informations du client (nom, email, société, etc.)
 */
export const generateReceipt = (order, options = {}) => {
  const { clientType = 'particulier', clientInfo = {} } = options;
  
  // Calculer les totaux
  const items = order.items || [];
  const subtotalHT = items.reduce((sum, item) => {
    const priceHT = parseFloat(item.price || 0) / 1.10; // Prix HT = Prix TTC / 1.10
    return sum + (priceHT * item.quantity);
  }, 0);
  
  const tva = subtotalHT * 0.10; // TVA à 10%
  const totalTTC = subtotalHT + tva;
  
  // En-tête du document
  const header = [
    {
      text: ESTABLISHMENT_INFO.name,
      style: 'header',
      margin: [0, 0, 0, 5]
    },
    {
      text: [
        { text: `${ESTABLISHMENT_INFO.address}\n`, fontSize: 9 },
        { text: `${ESTABLISHMENT_INFO.postalCode} ${ESTABLISHMENT_INFO.city}\n`, fontSize: 9 },
        { text: `Tél: ${ESTABLISHMENT_INFO.phone}\n`, fontSize: 9 },
        { text: `Email: ${ESTABLISHMENT_INFO.email}\n`, fontSize: 9 }
      ],
      alignment: 'center',
      margin: [0, 0, 0, 5]
    }
  ];
  
  // Informations légales (pour professionnels)
  if (clientType === 'professionnel') {
    header.push({
      text: [
        { text: `SIRET: ${ESTABLISHMENT_INFO.siret}\n`, fontSize: 8 },
        { text: `TVA: ${ESTABLISHMENT_INFO.tvaNumber}\n`, fontSize: 8 },
        { text: `${ESTABLISHMENT_INFO.legalMention}\n`, fontSize: 8 }
      ],
      alignment: 'center',
      margin: [0, 0, 0, 10],
      color: '#666'
    });
  }
  
  // Ligne de séparation
  header.push({
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 515,
        y2: 0,
        lineWidth: 1
      }
    ],
    margin: [0, 5, 0, 10]
  });
  
  // Informations client
  const clientSection = [];
  if (clientType === 'professionnel' || clientInfo.name) {
    clientSection.push({
      text: 'INFORMATIONS CLIENT',
      style: 'sectionHeader',
      margin: [0, 0, 0, 5]
    });
    
    const clientDetails = [];
    if (clientInfo.name) {
      clientDetails.push({ text: `Nom: ${clientInfo.name}`, fontSize: 9 });
    }
    if (clientInfo.company) {
      clientDetails.push({ text: `Société: ${clientInfo.company}`, fontSize: 9, bold: true });
    }
    if (clientInfo.email) {
      clientDetails.push({ text: `Email: ${clientInfo.email}`, fontSize: 9 });
    }
    if (clientInfo.siret && clientType === 'professionnel') {
      clientDetails.push({ text: `SIRET: ${clientInfo.siret}`, fontSize: 9 });
    }
    
    clientSection.push({
      ul: clientDetails,
      margin: [0, 0, 0, 10]
    });
  }
  
  // Informations commande
  const orderInfo = [
    {
      text: 'DÉTAILS DE LA COMMANDE',
      style: 'sectionHeader',
      margin: [0, 5, 0, 5]
    },
    {
      columns: [
        {
          width: '50%',
          text: [
            { text: 'N° Commande: ', bold: true, fontSize: 10 },
            { text: formatOrderNumber(order.order_number || order.orderNumber, order.id), fontSize: 10 }
          ]
        },
        {
          width: '50%',
          text: [
            { text: 'Date: ', bold: true, fontSize: 10 },
            { text: formatDate(order.created_at || order.createdAt || new Date()), fontSize: 10 }
          ],
          alignment: 'right'
        }
      ],
      margin: [0, 0, 0, 10]
    }
  ];
  
  // Tableau des produits
  const productsTable = {
    style: 'tableExample',
    table: {
      headerRows: 1,
      widths: clientType === 'professionnel' ? ['*', 'auto', 'auto', 'auto', 'auto'] : ['*', 'auto', 'auto'],
      body: [
        // En-tête
        clientType === 'professionnel' 
          ? [
              { text: 'Désignation', style: 'tableHeader' },
              { text: 'Qté', style: 'tableHeader', alignment: 'center' },
              { text: 'PU HT', style: 'tableHeader', alignment: 'right' },
              { text: 'TVA', style: 'tableHeader', alignment: 'right' },
              { text: 'Total TTC', style: 'tableHeader', alignment: 'right' }
            ]
          : [
              { text: 'Désignation', style: 'tableHeader' },
              { text: 'Qté', style: 'tableHeader', alignment: 'center' },
              { text: 'Prix', style: 'tableHeader', alignment: 'right' }
            ],
        // Lignes de produits
        ...items.map(item => {
          const priceHT = parseFloat(item.price || 0) / 1.10;
          const itemTVA = priceHT * 0.10;
          const priceTTC = parseFloat(item.price || 0);
          const quantity = item.quantity || 1;
          const totalTTC = priceTTC * quantity;
          
          return clientType === 'professionnel'
            ? [
                { text: item.name || item.productName || 'Produit', fontSize: 9 },
                { text: quantity.toString(), fontSize: 9, alignment: 'center' },
                { text: formatPrice(priceHT), fontSize: 9, alignment: 'right' },
                { text: formatPrice(itemTVA), fontSize: 9, alignment: 'right' },
                { text: formatPrice(totalTTC), fontSize: 9, alignment: 'right', bold: true }
              ]
            : [
                { text: item.name || item.productName || 'Produit', fontSize: 9 },
                { text: quantity.toString(), fontSize: 9, alignment: 'center' },
                { text: formatPrice(totalTTC), fontSize: 9, alignment: 'right', bold: true }
              ];
        })
      ]
    },
    layout: {
      hLineWidth: function (i, node) {
        return (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5;
      },
      vLineWidth: function () {
        return 0;
      },
      hLineColor: function (i) {
        return i === 1 ? 'black' : '#aaa';
      },
      paddingLeft: function () {
        return 5;
      },
      paddingRight: function () {
        return 5;
      },
      paddingTop: function () {
        return 3;
      },
      paddingBottom: function () {
        return 3;
      }
    },
    margin: [0, 0, 0, 10]
  };
  
  // Totaux
  const totalsSection = [
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 0.5
        }
      ],
      margin: [0, 5, 0, 10]
    }
  ];
  
  if (clientType === 'professionnel') {
    totalsSection.push({
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto',
          table: {
            widths: [120, 80],
            body: [
              [
                { text: 'Sous-total HT:', fontSize: 10, border: [false, false, false, false] },
                { text: formatPrice(subtotalHT), fontSize: 10, alignment: 'right', border: [false, false, false, false] }
              ],
              [
                { text: 'TVA (10%):', fontSize: 10, border: [false, false, false, false] },
                { text: formatPrice(tva), fontSize: 10, alignment: 'right', border: [false, false, false, false] }
              ],
              [
                { text: 'TOTAL TTC:', fontSize: 12, bold: true, border: [false, true, false, false], borderColor: ['', 'black', '', ''] },
                { text: formatPrice(totalTTC), fontSize: 12, bold: true, alignment: 'right', border: [false, true, false, false], borderColor: ['', 'black', '', ''] }
              ]
            ]
          },
          layout: 'noBorders'
        }
      ],
      margin: [0, 0, 0, 15]
    });
  } else {
    totalsSection.push({
      columns: [
        { width: '*', text: '' },
        {
          width: 'auto',
          table: {
            widths: [120, 80],
            body: [
              [
                { text: 'TOTAL:', fontSize: 14, bold: true, border: [false, true, false, false], borderColor: ['', 'black', '', ''] },
                { text: formatPrice(totalTTC), fontSize: 14, bold: true, alignment: 'right', border: [false, true, false, false], borderColor: ['', 'black', '', ''] }
              ]
            ]
          },
          layout: 'noBorders'
        }
      ],
      margin: [0, 0, 0, 15]
    });
  }
  
  // Mode de paiement
  const paymentSection = [
    {
      text: 'MODE DE PAIEMENT',
      style: 'sectionHeader',
      margin: [0, 10, 0, 5]
    },
    {
      text: order.payment_method || order.paymentMethod || 'Espèces',
      fontSize: 10,
      bold: true,
      margin: [0, 0, 0, 15]
    }
  ];
  
  // Mentions légales
  const legalSection = [
    {
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 0.5
        }
      ],
      margin: [0, 10, 0, 10]
    },
    {
      text: [
        { text: 'TVA applicable sur les prestations de restauration.\n', fontSize: 7, color: '#666' },
        { text: 'Article non remboursable sauf défaut de conformité.\n', fontSize: 7, color: '#666' },
        { text: 'Merci de votre visite !', fontSize: 8, bold: true }
      ],
      alignment: 'center',
      margin: [0, 0, 0, 10]
    }
  ];
  
  // Définition du document PDF
  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 40],
    content: [
      ...header,
      ...clientSection,
      ...orderInfo,
      productsTable,
      ...totalsSection,
      ...paymentSection,
      ...legalSection
    ],
    styles: {
      header: {
        fontSize: 20,
        bold: true,
        alignment: 'center',
        color: '#10b981'
      },
      sectionHeader: {
        fontSize: 11,
        bold: true,
        color: '#374151',
        background: '#f3f4f6',
        margin: [0, 5, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 10,
        color: 'white',
        fillColor: '#10b981',
        alignment: 'left'
      },
      tableExample: {
        margin: [0, 5, 0, 15]
      }
    },
    defaultStyle: {
      font: 'Roboto'
    }
  };
  
  return docDefinition;
};

/**
 * Télécharger un ticket de caisse en PDF
 */
export const downloadReceipt = (order, options = {}) => {
  const docDefinition = generateReceipt(order, options);
  const orderNumber = order.order_number || order.orderNumber || `CMD-${String(order.id || 'XXXX').padStart(4, '0')}`;
  const fileName = `Ticket-BlossomCafe-${orderNumber}.pdf`;
  
  pdfMake.createPdf(docDefinition).download(fileName);
};

/**
 * Ouvrir un ticket de caisse dans un nouvel onglet
 */
export const printReceipt = (order, options = {}) => {
  const docDefinition = generateReceipt(order, options);
  
  pdfMake.createPdf(docDefinition).open();
};

/**
 * Obtenir le blob PDF pour envoi par email ou autre traitement
 */
export const getReceiptBlob = async (order, options = {}) => {
  const docDefinition = generateReceipt(order, options);
  
  return new Promise((resolve, reject) => {
    pdfMake.createPdf(docDefinition).getBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Impossible de générer le PDF'));
      }
    });
  });
};

export default {
  generateReceipt,
  downloadReceipt,
  printReceipt,
  getReceiptBlob
};

