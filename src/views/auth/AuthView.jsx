import React, { useState } from 'react';
import { Mail, Lock, User, Phone, MapPin, UserCircle, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';

/**
 * Vue d'authentification (Login/Register)
 */
const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, register, loginAsGuest } = useAuth();
  const { success, error: showError } = useNotifications();
  
  const [guestName, setGuestName] = useState('');
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('📝 AuthView.handleLogin - Début');
    console.log('   Email:', loginData.email);
    console.log('   Password:', loginData.password ? '***' : 'vide');
    setIsLoading(true);
    
    try {
      console.log('🔄 AuthView - Appel de login()...');
      const result = await login(loginData.email, loginData.password);
      console.log('📊 AuthView - Résultat login:', result);
      
      if (result.success) {
        console.log('✅ AuthView - Connexion réussie !');
        success('Connexion réussie !');
      } else {
        console.log('❌ AuthView - Connexion échouée:', result.error);
        showError(result.error || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('❌ AuthView - Exception:', err);
      showError(err.message || 'Erreur inattendue');
    } finally {
      setIsLoading(false);
      console.log('🏁 AuthView.handleLogin - Fin');
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      showError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...userData } = registerData;
      const result = await register(userData);
      if (result.success) {
        success('Inscription réussie ! Bienvenue chez Blossom Café 🌸');
      } else {
        showError(result.error);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGuestLogin = async (e) => {
    e.preventDefault();
    
    if (!guestName.trim()) {
      showError('Veuillez entrer votre nom');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await loginAsGuest(guestName.trim());
      if (result.success) {
        success(`Bienvenue ${guestName} ! Profitez de votre visite 🌸`);
        setShowGuestModal(false);
        setGuestName('');
      } else {
        showError(result.error);
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Connexions rapides pour le développement
  const handleQuickLogin = async (role) => {
    const credentials = {
      client: { email: 'client@blossom.com', password: 'client123' },
      manager: { email: 'manager@blossom.com', password: 'manager123' },
      admin: { email: 'admin@blossom.com', password: 'admin123' }
    };
    
    const { email, password } = credentials[role];
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      if (result.success) {
        success(`Connexion rapide ${role} réussie !`);
      } else {
        showError(result.error || 'Erreur de connexion');
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-800 via-indigo-800 to-violet-800 p-4">
      <div className="w-full max-w-6xl flex gap-6">
        {/* Boutons de connexion rapide pour développement */}
        <div className="hidden md:flex flex-col gap-3 w-48 flex-shrink-0">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <h3 className="text-white text-sm font-semibold mb-3">🚀 Développement</h3>
            <div className="space-y-2">
              <Button
                onClick={() => handleQuickLogin('client')}
                variant="outline"
                size="md"
                fullWidth
                disabled={isLoading}
                className="border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                👤 Client
              </Button>
              <Button
                onClick={() => handleQuickLogin('manager')}
                variant="outline"
                size="md"
                fullWidth
                disabled={isLoading}
                className="border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                👨‍💼 Manager
              </Button>
              <Button
                onClick={() => handleQuickLogin('admin')}
                variant="outline"
                size="md"
                fullWidth
                disabled={isLoading}
                className="border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                👑 Admin
              </Button>
            </div>
            <p className="text-white/60 text-xs mt-3">
              Connexion rapide
            </p>
          </div>
        </div>
        
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-serif font-extrabold text-white mb-2">
            Blossom Café
          </h1>
        </div>
        
        <Card padding="lg">
          {/* Boutons de développement mobile */}
          <div className="md:hidden mb-4 grid grid-cols-3 gap-2">
            <Button
              onClick={() => handleQuickLogin('client')}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              👤 Client
            </Button>
            <Button
              onClick={() => handleQuickLogin('manager')}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              👨‍💼 Manager
            </Button>
            <Button
              onClick={() => handleQuickLogin('admin')}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              👑 Admin
            </Button>
          </div>
          
          {/* Onglets */}
          <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                isLogin ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              Connexion
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition ${
                !isLogin ? 'bg-white shadow' : 'text-gray-600'
              }`}
            >
              Inscription
            </button>
          </div>
          
          {/* Formulaires */}
          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="votre@email.com"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                icon={<Mail className="w-5 h-5" />}
                required
              />
              
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
              >
                Se connecter
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                <p className="mb-2">Comptes de test :</p>
                <div className="space-y-1 text-xs">
                  <p>Client: client@blossom.com / client123</p>
                  <p>Manager: manager@blossom.com / manager123</p>
                  <p>Admin: admin@blossom.com / admin123</p>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Nom complet"
                type="text"
                placeholder="Jean Dupont"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                icon={<User className="w-5 h-5" />}
                required
              />
              
              <Input
                label="Email"
                type="email"
                placeholder="votre@email.com"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                icon={<Mail className="w-5 h-5" />}
                required
              />
              
              <Input
                label="Téléphone"
                type="tel"
                placeholder="06 12 34 56 78"
                value={registerData.phone}
                onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                icon={<Phone className="w-5 h-5" />}
              />
              
              <Input
                label="Adresse"
                type="text"
                placeholder="12 Rue de la Paix, Paris"
                value={registerData.address}
                onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                icon={<MapPin className="w-5 h-5" />}
              />
              
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
              >
                S&apos;inscrire
              </Button>
            </form>
          )}
          
          {/* Bouton continuer en tant qu'invité */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button
              onClick={() => setShowGuestModal(true)}
              variant="outline"
              size="lg"
              fullWidth
              className="border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-700"
              icon={<UserCircle className="w-5 h-5" />}
            >
              Continuer en tant qu&apos;invité
            </Button>
            <p className="text-xs text-gray-500 text-center mt-2">
              Accès rapide sans compte (pas de points de fidélité)
            </p>
          </div>
        </Card>
        
        {/* Modal pour connexion invité */}
        {showGuestModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card padding="lg" className="max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Connexion invité</h3>
                <button
                  onClick={() => {
                    setShowGuestModal(false);
                    setGuestName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleGuestLogin} className="space-y-4">
                <div className="text-center mb-4">
                  <UserCircle className="w-16 h-16 mx-auto text-indigo-600 mb-2" />
                  <p className="text-sm text-gray-600">
                    Entrez votre nom pour continuer en tant qu&apos;invité
                  </p>
                </div>
                
                <Input
                  label="Votre nom"
                  type="text"
                  placeholder="Entrez votre nom"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  icon={<User className="w-5 h-5" />}
                  required
                  autoFocus
                />
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      setShowGuestModal(false);
                      setGuestName('');
                    }}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Continuer
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AuthView;

