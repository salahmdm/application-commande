/**
 * Page de démonstration des nouveaux composants
 * Affiche tous les boutons et composants modernes créés
 */

import React, { useState } from 'react';
import { Package, ClipboardList, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import ModernActionButton, { CompactActionButton } from '../common/ModernActionButton';
import ActionButton, { ConfirmButton, SuccessButton, CounterButton } from '../common/ActionButton';
import StatusIndicator, { NotificationBadge, ProgressIndicator } from '../common/StatusIndicator';
import ToastContainer, { useToast } from '../common/Toast';
import QuickDashboard from '../manager/QuickDashboard';

/**
 * Page de démonstration des composants modernes
 */
const ComponentDemo = () => {
  const { toasts, success, error, warning, info, removeToast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);

  const handleSuccessAction = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    success('Action réussie', 'L\'opération a été effectuée avec succès');
  };

  const handleErrorAction = () => {
    error('Erreur', 'Une erreur est survenue lors de l\'opération');
  };

  const handleWarningAction = () => {
    warning('Attention', 'Cette action nécessite votre attention');
  };

  const handleInfoAction = () => {
    info('Information', 'Voici une information importante');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold text-gray-900 mb-4">
            Démonstration des Composants Modernes
          </h1>
          <p className="text-lg text-gray-600">
            Nouveaux boutons et composants avec effets visuels avancés
          </p>
        </div>

        {/* Boutons d'action modernes */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            Boutons d'Action Modernes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Boutons Principaux</h3>
              
              <ModernActionButton
                variant="primary"
                size="lg"
                icon={Package}
                subtitle="Point de vente"
                onClick={handleSuccessAction}
              >
                Prise de commande
              </ModernActionButton>
              
              <ModernActionButton
                variant="success"
                size="lg"
                icon={ClipboardList}
                subtitle="Suivi & contrôle"
                onClick={handleSuccessAction}
              >
                Gestion de commande
              </ModernActionButton>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Boutons Compacts</h3>
              
              <CompactActionButton
                variant="primary"
                icon={Package}
                onClick={handleSuccessAction}
              >
                POS
              </CompactActionButton>
              
              <CompactActionButton
                variant="success"
                icon={ClipboardList}
                onClick={handleSuccessAction}
              >
                ORDERS
              </CompactActionButton>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Boutons avec États</h3>
              
              <ActionButton
                variant="primary"
                onClick={handleSuccessAction}
                icon={CheckCircle}
              >
                Action Simple
              </ActionButton>
              
              <SuccessButton
                variant="success"
                onClick={handleSuccessAction}
                successMessage="Terminé !"
              >
                Action avec Succès
              </SuccessButton>
              
              <ConfirmButton
                variant="danger"
                onConfirm={() => alert('Action confirmée !')}
                confirmText="Confirmer"
              >
                Action de Confirmation
              </ConfirmButton>
              
              <CounterButton
                variant="warning"
                maxClicks={3}
                onClick={() => alert('Action déclenchée après 3 clics !')}
              >
                Bouton Compteur
              </CounterButton>
            </div>
          </div>
        </div>

        {/* Indicateurs d'état */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            Indicateurs d'État
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Indicateurs de Statut</h3>
              
              <div className="flex items-center gap-4">
                <StatusIndicator isActive={true} variant="primary" />
                <span>Statut Actif</span>
              </div>
              
              <div className="flex items-center gap-4">
                <StatusIndicator isActive={false} variant="success" />
                <span>Statut Inactif</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Badges de Notification</h3>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <NotificationBadge count={5} variant="danger" />
                </div>
                <span>Notifications</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700">Indicateur de Progression</h3>
              
              <div className="space-y-2">
                <ProgressIndicator 
                  currentStep={currentStep} 
                  totalSteps={4} 
                  variant="primary" 
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    className="px-3 py-1 bg-gray-200 rounded text-sm"
                  >
                    Précédent
                  </button>
                  <button 
                    onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard rapide */}
        <QuickDashboard />

        {/* Boutons de test des notifications */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">
            Test des Notifications
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <ActionButton
              variant="success"
              onClick={handleSuccessAction}
              icon={CheckCircle}
            >
              Notification de Succès
            </ActionButton>
            
            <ActionButton
              variant="danger"
              onClick={handleErrorAction}
              icon={XCircle}
            >
              Notification d'Erreur
            </ActionButton>
            
            <ActionButton
              variant="warning"
              onClick={handleWarningAction}
              icon={AlertCircle}
            >
              Notification d'Avertissement
            </ActionButton>
            
            <ActionButton
              variant="primary"
              onClick={handleInfoAction}
              icon={Info}
            >
              Notification d'Information
            </ActionButton>
          </div>
        </div>

        {/* Conteneur de notifications */}
        <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
      </div>
    </div>
  );
};

export default ComponentDemo;
