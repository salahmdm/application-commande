import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';

/**
 * Modal pour ajouter ou modifier un article d'inventaire
 */
const InventoryModal = ({ isOpen, onClose, onSubmit, item, categories }) => {
  const [formData, setFormData] = React.useState({
    name: '',
    category: '',
    quantity: 0,
    unit: 'kg',
    price: 0,
    minQuantity: 0,
    status: 'available'
  });

  // Fonction pour suggérer l'unité selon le nom du produit
  const suggestUnit = (productName) => {
    if (!productName) return 'kg';
    
    const nameLower = productName.toLowerCase();
    
    // Liquides → Litre
    if (nameLower.includes('lait') || nameLower.includes('eau') || 
        nameLower.includes('jus') || nameLower.includes('huile') || 
        nameLower.includes('vin') || nameLower.includes('bière') ||
        nameLower.includes('soda') || nameLower.includes('boisson') ||
        nameLower.includes('crème') || nameLower.includes('sauce') ||
        nameLower.includes('sirop') || nameLower.includes('liquide')) {
      return 'L';
    }
    
    // Produits en pièces → pièce
    if (nameLower.includes('oeuf') || nameLower.includes('œuf') ||
        nameLower.includes('pièce') || nameLower.includes('unité') ||
        nameLower.includes('sachet') || nameLower.includes('paquet') ||
        nameLower.includes('bouteille') || nameLower.includes('pot') ||
        nameLower.includes('boîte') || nameLower.includes('canette')) {
      return 'pièce';
    }
    
    // Produits très légers → gramme
    if (nameLower.includes('épice') || nameLower.includes('herbe') ||
        nameLower.includes('vanille') || nameLower.includes('cannelle') ||
        nameLower.includes('safran') || nameLower.includes('curcuma') ||
        nameLower.includes('poivre') || nameLower.includes('sel') ||
        nameLower.includes('levure') || nameLower.includes('poudre')) {
      return 'g';
    }
    
    // Par défaut → kg
    return 'kg';
  };

  // Initialiser le formulaire avec les données de l'article (mode édition)
  React.useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        quantity: item.quantity || 0,
        unit: item.unit || 'kg',
        price: item.price || 0,
        minQuantity: item.minQuantity || 0,
        status: item.status || 'available'
      });
    } else {
      // Réinitialiser le formulaire (mode ajout)
      setFormData({
        name: '',
        category: '',
        quantity: 0,
        unit: 'kg',
        price: 0,
        minQuantity: 0,
        status: 'available'
      });
    }
  }, [item, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: name === 'quantity' || name === 'price' || name === 'minQuantity' ? parseFloat(value) || 0 : value
    };
    
    // Si le nom change et qu'on n'est pas en mode édition, suggérer l'unité
    if (name === 'name' && !item && value) {
      newFormData.unit = suggestUnit(value);
    }
    
    setFormData(newFormData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20 md:pt-24 lg:pt-28">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[calc(100vh-5rem-2rem)] md:max-h-[calc(100vh-6rem-2rem)] lg:max-h-[calc(100vh-7rem-2rem)] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-heading font-bold">
                {item ? '✏️ Modifier l\'article' : '➕ Nouvel article'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nom */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-heading font-medium text-black mb-2">
                    Nom de l&apos;article *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Café Arabica"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-heading font-medium text-black mb-2">
                    Catégorie *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Quantité */}
                <div>
                  <label className="block text-sm font-heading font-medium text-black mb-2">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>

                {/* Unité de mesure */}
                <div>
                  <label className="block text-sm font-heading font-medium text-black mb-2">
                    Unité de mesure *
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  >
                    <option value="kg">Kilogramme (kg)</option>
                    <option value="g">Gramme (g)</option>
                    <option value="L">Litre (L)</option>
                    <option value="pièce">Pièce</option>
                  </select>
                </div>

                {/* Prix */}
                <div>
                  <label className="block text-sm font-heading font-medium text-black mb-2">
                    Prix unitaire (€) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>

                {/* Quantité Minimum */}
                <div>
                  <label className="block text-sm font-heading font-medium text-black mb-2">
                    Quantité minimum (alerte) *
                  </label>
                  <input
                    type="number"
                    name="minQuantity"
                    value={formData.minQuantity}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="5"
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  />
                </div>

                {/* Statut */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-heading font-medium text-black mb-2">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 bg-neutral-50 text-black focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-500 focus:bg-white transition-all duration-200"
                  >
                    <option value="available">✅ Disponible</option>
                    <option value="low">⚠️ Stock bas</option>
                    <option value="out">❌ Rupture</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {item ? 'Enregistrer' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InventoryModal;

