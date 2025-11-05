import React, { useState } from 'react';
import { X, Download, Printer, Mail, User, Briefcase } from 'lucide-react';
import Button from './Button';
import Input from './Input';
import { downloadReceipt, printReceipt } from '../../services/receiptService';
import useNotifications from '../../hooks/useNotifications';
import { formatOrderNumber } from '../../utils/orderHelpers';

/**
 * Modal de génération de ticket de caisse
 */
const ReceiptModal = ({ isOpen, onClose, order }) => {
  const { success, error: showError } = useNotifications();
  const [clientType, setClientType] = useState('particulier');
  const [clientInfo, setClientInfo] = useState({
    name: '',
    email: '',
    company: '',
    siret: ''
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleDownload = () => {
    try {
      setLoading(true);
      downloadReceipt(order, { clientType, clientInfo });
      success('✅ Ticket téléchargé avec succès !');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Erreur génération ticket:', err);
      showError('❌ Erreur lors de la génération du ticket');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    try {
      setLoading(true);
      printReceipt(order, { clientType, clientInfo });
      success('✅ Ticket ouvert pour impression !');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Erreur génération ticket:', err);
      showError('❌ Erreur lors de la génération du ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!clientInfo.email) {
      showError('⚠️ Veuillez saisir une adresse email');
      return;
    }

    try {
      setLoading(true);
      // TODO: Implémenter l'envoi par email via l'API backend
      showError('🚧 Fonctionnalité d\'envoi par email en cours de développement');
    } catch (err) {
      console.error('Erreur envoi email:', err);
      showError('❌ Erreur lors de l\'envoi par email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🧾</span>
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-gray-900">
                Générer un Ticket de Caisse
              </h2>
              <p className="text-sm text-gray-600 font-sans">
                {formatOrderNumber(order.order_number || order.orderNumber, order.id)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-6">
          {/* Type de client */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 font-sans">
              Type de client
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setClientType('particulier')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  clientType === 'particulier'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300 hover:bg-green-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    clientType === 'particulier' ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <User className={`w-6 h-6 ${
                      clientType === 'particulier' ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className={`font-semibold font-sans ${
                    clientType === 'particulier' ? 'text-green-700' : 'text-gray-700'
                  }`}>
                    Particulier
                  </span>
                  <span className="text-xs text-gray-600 text-center font-sans">
                    Ticket simplifié
                  </span>
                </div>
              </button>

              <button
                onClick={() => setClientType('professionnel')}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  clientType === 'professionnel'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    clientType === 'professionnel' ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Briefcase className={`w-6 h-6 ${
                      clientType === 'professionnel' ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <span className={`font-semibold font-sans ${
                    clientType === 'professionnel' ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    Professionnel
                  </span>
                  <span className="text-xs text-gray-600 text-center font-sans">
                    Avec détails comptables
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Informations client */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 font-sans">
              Informations client (optionnel)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nom du client"
                value={clientInfo.name}
                onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                placeholder="Jean Dupont"
              />
              
              <Input
                label="Email"
                type="email"
                value={clientInfo.email}
                onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                placeholder="client@example.com"
              />
            </div>

            {clientType === 'professionnel' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Société"
                  value={clientInfo.company}
                  onChange={(e) => setClientInfo({ ...clientInfo, company: e.target.value })}
                  placeholder="Nom de la société"
                />
                
                <Input
                  label="SIRET"
                  value={clientInfo.siret}
                  onChange={(e) => setClientInfo({ ...clientInfo, siret: e.target.value })}
                  placeholder="123 456 789 00012"
                />
              </div>
            )}
          </div>

          {/* Résumé de la commande */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 font-sans">
              Résumé de la commande
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-sans">
                <span className="text-gray-600">Nombre d'articles:</span>
                <span className="font-semibold text-gray-900">
                  {order.items?.length || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm font-sans">
                <span className="text-gray-600">Montant total:</span>
                <span className="font-bold text-green-700 text-lg">
                  {parseFloat(order.total_price || order.totalPrice || 0).toFixed(2)}€
                </span>
              </div>
              {clientType === 'professionnel' && (
                <>
                  <div className="border-t border-gray-300 my-2"></div>
                  <div className="flex justify-between text-xs font-sans text-gray-600">
                    <span>HT (TVA 10%):</span>
                    <span>
                      {(parseFloat(order.total_price || order.totalPrice || 0) / 1.10).toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-sans text-gray-600">
                    <span>TVA:</span>
                    <span>
                      {(parseFloat(order.total_price || order.totalPrice || 0) - 
                        parseFloat(order.total_price || order.totalPrice || 0) / 1.10).toFixed(2)}€
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pied de page - Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            
            <Button
              onClick={handlePrint}
              disabled={loading}
              variant="outline"
              className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            
            <Button
              onClick={handleSendEmail}
              disabled={loading || !clientInfo.email}
              variant="outline"
              className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!clientInfo.email ? 'Veuillez saisir un email' : ''}
            >
              <Mail className="w-4 h-4 mr-2" />
              Envoyer par email
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 text-center mt-4 font-sans">
            💡 Le ticket sera généré au format PDF avec tous les détails de la commande
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;

