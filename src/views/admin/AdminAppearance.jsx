import React from 'react';
import { Palette } from 'lucide-react';
import Card from '../../components/common/Card';

/**
 * Vue Gestion de l'Apparence Admin
 * Page vide - La gestion des catégories a été déplacée dans Paramètres
 */
const AdminAppearance = () => {
  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8 animate-fade-in w-full overflow-x-hidden">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-black flex items-center gap-3">
            <Palette className="w-6 h-6 md:w-8 md:h-8" />
            Gestion de l&apos;Apparence
          </h1>
        </div>
      </div>
      
      <Card padding="lg">
        <div className="text-center py-12">
          <Palette className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
          <h2 className="text-xl font-heading font-bold text-black mb-2">
            Page en cours de développement
          </h2>
          <p className="text-neutral-600 font-sans">
            La gestion des catégories a été déplacée dans la section &quot;Paramètres&quot;
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminAppearance;
