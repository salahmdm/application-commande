import React from 'react';

/**
 * Écran de sélection du type de commande
 */
const OrderTypeSelection = ({ onSelect, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-800 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-serif font-extrabold text-white mb-2">
            Comment souhaitez-vous commander ?
          </h2>
          <p className="text-gray-300">Choisissez l&apos;option qui vous convient</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            onClick={() => onSelect('dine-in')}
            className="group bg-gradient-to-br from-emerald-600 to-emerald-800 text-white p-12 rounded-3xl transition transform hover:scale-105 shadow-2xl"
          >
            <div className="text-8xl mb-6 group-hover:animate-bounce">🍽️</div>
            <h3 className="text-2xl font-serif font-bold mb-2">Sur place</h3>
            <p className="text-emerald-100">Dégustez confortablement installé</p>
            <div className="mt-6 inline-block bg-white/10 px-3 py-1 rounded-full text-white">
              Service à table
            </div>
          </button>
          
          <button
            onClick={() => onSelect('takeaway')}
            className="group bg-gradient-to-br from-sky-600 to-indigo-700 text-white p-12 rounded-3xl transition transform hover:scale-105 shadow-2xl"
          >
            <div className="text-8xl mb-6 group-hover:animate-bounce">🚶‍♂️</div>
            <h3 className="text-2xl font-serif font-bold mb-2">À Emporter</h3>
            <p className="text-sky-100">Récupérez votre commande rapidement</p>
            <div className="mt-6 inline-block bg-white/10 px-3 py-1 rounded-full text-white">
              Prêt en 15-20 min
            </div>
          </button>
        </div>
        
        <div className="text-center mt-10">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-white transition"
          >
            ← Retour
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderTypeSelection;

