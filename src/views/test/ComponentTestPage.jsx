/**
 * Page de test des nouveaux composants
 * Permet de tester tous les boutons et effets visuels
 */

import React, { useState } from 'react';
import { 
  Package, 
  ClipboardList, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import ModernActionButton, { CompactActionButton } from '../common/ModernActionButton';
import ActionButton, { ConfirmButton, SuccessButton, CounterButton } from '../common/ActionButton';
import StatusIndicator, { NotificationBadge, ProgressIndicator } from '../common/StatusIndicator';
import ToastContainer, { useToast } from '../common/Toast';

/**
 * Page de test des composants
 */
const ComponentTestPage = () => {
  const { toasts, success, error, warning, info, removeToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleTestAction = async () => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
    
    // Simuler une action
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simuler un succès ou une erreur
    const random = Math.random();
    if (random > 0.5) {
      setIsSuccess(true);
      success('Test réussi', 'L\'action a été effectuée avec succès');
    } else {
      setIsError(true);
      error('Test échoué', 'Une erreur est survenue');
    }
    
    setIsLoading(false);
    
    // Reset après 3 secondes
    setTimeout(() => {
      setIsSuccess(false);
      setIsError(false);
    }, 3000);
  };

  const handleNotificationTest = (type) => {
    switch (type) {
      case 'success':
        success('Succès', 'Opération réussie avec succès');
        break;
      case 'error':
        error('Erreur', 'Une erreur critique est survenue');
        break;
      case 'warning':
        warning('Attention', 'Cette action nécessite votre attention');
        break;
      case 'info':
        info('Information', 'Voici une information importante');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="text-center bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            🎨 Test des Composants Modernes
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Testez tous les nouveaux boutons et effets visuels
          </p>
          
          {/* Boutons de contrôle */}
          <div className="flex justify-center gap-4">
            <ActionButton
              variant="primary"
              icon={Play}
              onClick={handleTestAction}
              loading={isLoading}
              success={isSuccess}
              error={isError}
            >
              {isLoading ? 'Test en cours...' : 'Tester Action'}
            </ActionButton>
            
            <ActionButton
              variant="secondary"
              icon={RotateCcw}
              onClick={() => {
                setIsLoading(false);
                setIsSuccess(false);
                setIsError(false);
              }}
            >
              Reset
            </ActionButton>
          </div>
        </div>

        {/* Section des boutons modernes */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            🚀 Boutons d'Action Modernes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Boutons principaux */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Boutons Principaux</h3>
              
              <ModernActionButton
                variant="primary"
                size="lg"
                icon={Package}
                subtitle="Point de vente"
                onClick={() => handleNotificationTest('success')}
              >
                Prise de commande
              </ModernActionButton>
              
              <ModernActionButton
                variant="success"
                size="lg"
                icon={ClipboardList}
                subtitle="Suivi & contrôle"
                onClick={() => handleNotificationTest('info')}
              >
                Gestion de commande
              </ModernActionButton>
              
              <ModernActionButton
                variant="warning"
                size="lg"
                icon={AlertCircle}
                subtitle="Alertes système"
                onClick={() => handleNotificationTest('warning')}
              >
                Alertes
              </ModernActionButton>
            </div>
            
            {/* Boutons compacts */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Boutons Compacts</h3>
              
              <CompactActionButton
                variant="primary"
                icon={Package}
                onClick={() => handleNotificationTest('success')}
              >
                POS
              </CompactActionButton>
              
              <CompactActionButton
                variant="success"
                icon={ClipboardList}
                onClick={() => handleNotificationTest('info')}
              >
                ORDERS
              </CompactActionButton>
              
              <CompactActionButton
                variant="warning"
                icon={AlertCircle}
                onClick={() => handleNotificationTest('warning')}
              >
                ALERTS
              </CompactActionButton>
            </div>
            
            {/* Boutons avec états */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Boutons avec États</h3>
              
              <ActionButton
                variant="primary"
                onClick={() => handleNotificationTest('success')}
                icon={CheckCircle}
              >
                Action Simple
              </ActionButton>
              
              <SuccessButton
                variant="success"
                onClick={() => handleNotificationTest('success')}
                successMessage="Terminé !"
              >
                Action avec Succès
              </SuccessButton>
              
              <ConfirmButton
                variant="danger"
                onConfirm={() => handleNotificationTest('error')}
                confirmText="Confirmer"
              >
                Action de Confirmation
              </ConfirmButton>
              
              <CounterButton
                variant="warning"
                maxClicks={3}
                onClick={() => handleNotificationTest('warning')}
              >
                Bouton Compteur
              </CounterButton>
            </div>
          </div>
        </div>

        {/* Section des indicateurs */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            🎯 Indicateurs d'État
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Indicateurs de statut */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Indicateurs de Statut</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <StatusIndicator isActive={true} variant="primary" />
                  <span>Statut Actif (Primary)</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <StatusIndicator isActive={true} variant="success" />
                  <span>Statut Actif (Success)</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <StatusIndicator isActive={false} variant="warning" />
                  <span>Statut Inactif (Warning)</span>
                </div>
              </div>
            </div>
            
            {/* Badges de notification */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Badges de Notification</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <NotificationBadge count={5} variant="danger" />
                  </div>
                  <span>Notifications (5)</span>
                </div>
                
                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="relative">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <NotificationBadge count={12} variant="warning" />
                  </div>
                  <span>Succès (12)</span>
                </div>
              </div>
            </div>
            
            {/* Indicateur de progression */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Indicateur de Progression</h3>
              
              <div className="space-y-4">
                <ProgressIndicator 
                  currentStep={currentStep} 
                  totalSteps={4} 
                  variant="primary" 
                />
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    className="px-3 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 transition-colors"
                  >
                    Précédent
                  </button>
                  <button 
                    onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                  >
                    Suivant
                  </button>
                </div>
                
                <p className="text-sm text-gray-600">
                  Étape {currentStep + 1} sur 4
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section des tests de notifications */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            🔔 Test des Notifications
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionButton
              variant="success"
              onClick={() => handleNotificationTest('success')}
              icon={CheckCircle}
            >
              Succès
            </ActionButton>
            
            <ActionButton
              variant="danger"
              onClick={() => handleNotificationTest('error')}
              icon={XCircle}
            >
              Erreur
            </ActionButton>
            
            <ActionButton
              variant="warning"
              onClick={() => handleNotificationTest('warning')}
              icon={AlertCircle}
            >
              Avertissement
            </ActionButton>
            
            <ActionButton
              variant="primary"
              onClick={() => handleNotificationTest('info')}
              icon={Info}
            >
              Information
            </ActionButton>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 rounded-2xl border-2 border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📋 Instructions de Test
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Cliquez sur les boutons pour tester les animations</li>
            <li>• Observez les effets de brillance au survol</li>
            <li>• Testez les boutons de confirmation (double-clic)</li>
            <li>• Utilisez le bouton compteur (3 clics requis)</li>
            <li>• Vérifiez les notifications toast</li>
            <li>• Testez l'indicateur de progression</li>
          </ul>
        </div>

        {/* Conteneur de notifications */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </div>
  );
};

export default ComponentTestPage;
