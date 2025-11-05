import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Gift, Edit2, Save } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';

/**
 * Vue Profil utilisateur
 */
const ProfileView = () => {
  const { user, update } = useAuth();
  const { success, error: showError } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || user?.name?.split(' ')[0] || '',
    last_name: user?.last_name || user?.name?.split(' ')[1] || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });
  
  const handleSave = async () => {
    try {
      const result = await update(formData);
      if (result.success) {
        success('Profil mis à jour avec succès !');
        setIsEditing(false);
      } else {
        showError(result.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      showError(error?.message || 'Erreur lors de la mise à jour');
    }
  };
  
  const pointsToNextReward = 500;
  const progress = ((user?.points || 0) / pointsToNextReward) * 100;
  
  return (
    <div className="space-y-5 pl-5 sm:pl-5 md:pl-10 pr-5 sm:pr-5 md:pr-10 pt-6 md:pt-8">
      <h1 className="text-4xl font-serif font-bold">👤 Mon Profil</h1>
      
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Informations personnelles</h2>
              {!isEditing ? (
                <Button
                  variant="outline"
                  icon={<Edit2 className="w-4 h-4" />}
                  onClick={() => setIsEditing(true)}
                >
                  Modifier
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        first_name: user?.first_name || user?.name?.split(' ')[0] || '',
                        last_name: user?.last_name || user?.name?.split(' ')[1] || '',
                        email: user?.email || '',
                        phone: user?.phone || ''
                      });
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="success"
                    icon={<Save className="w-4 h-4" />}
                    onClick={handleSave}
                  >
                    Enregistrer
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Prénom"
                      value={formData.first_name}
                      onChange={(e) => setFormData({...formData, first_name: e?.target?.value || ''})}
                      icon={<User className="w-5 h-5" />}
                      required
                    />
                    <Input
                      label="Nom"
                      value={formData.last_name}
                      onChange={(e) => setFormData({...formData, last_name: e?.target?.value || ''})}
                      icon={<User className="w-5 h-5" />}
                      required
                    />
                  </div>
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e?.target?.value || ''})}
                    icon={<Mail className="w-5 h-5" />}
                    required
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e?.target?.value || ''})}
                    icon={<Phone className="w-5 h-5" />}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Nom complet</div>
                      <div className="font-semibold">
                        {user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Non renseigné'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Email</div>
                      <div className="font-semibold">{user?.email || 'Non renseigné'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Téléphone</div>
                      <div className="font-semibold">{user?.phone || 'Non renseigné'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-600">Rôle</div>
                      <div className="font-semibold capitalize">{user?.role || 'Client'}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
          
          {/* Statistiques */}
          <Card padding="lg">
            <h2 className="text-2xl font-bold mb-6">📊 Mes statistiques</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-sky-50 rounded-xl">
                <div className="text-3xl font-bold text-sky-700">{user?.points || 0}</div>
                <div className="text-sm text-gray-600 mt-1">Points</div>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-xl">
                <div className="text-3xl font-bold text-amber-700">0</div>
                <div className="text-sm text-gray-600 mt-1">Commandes</div>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl">
                <div className="text-3xl font-bold text-emerald-700">0€</div>
                <div className="text-sm text-gray-600 mt-1">Dépensé</div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Fidélité */}
        <div className="space-y-6">
          <Card padding="lg" className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">💎</div>
              <h3 className="text-2xl font-bold mb-2">Programme Fidélité</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold">Points actuels</span>
                  <span className="font-bold text-violet-700">{user?.points || 0}</span>
                </div>
                <div className="bg-white/50 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-center text-sm text-gray-600 mt-2">
                  {Math.max(0, pointsToNextReward - (user?.points || 0))} points pour la prochaine récompense
                </div>
              </div>
              
              <div className="pt-4 border-t border-violet-200">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Récompenses disponibles
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-white/50 rounded-lg">
                    <div className="font-semibold">Café offert</div>
                    <div className="text-gray-600">100 points</div>
                  </div>
                  <div className="p-3 bg-white/50 rounded-lg">
                    <div className="font-semibold">Pâtisserie offerte</div>
                    <div className="text-gray-600">200 points</div>
                  </div>
                  <div className="p-3 bg-white/50 rounded-lg">
                    <div className="font-semibold">-20% sur commande</div>
                    <div className="text-gray-600">500 points</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          
          {/* Badge membre */}
          <Card padding="md" className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
            <div className="text-center">
              <div className="text-4xl mb-2">⭐</div>
              <div className="font-bold">Membre Bronze</div>
              <div className="text-sm text-gray-600">Depuis le {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;

