import { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, UserCircle, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import logger from '../../utils/logger';

/**
 * Vue d'authentification (Login/Register)
 */
const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockUntil, setBlockUntil] = useState(null);
  const { login, register, loginAsGuest, resetPassword } = useAuth();
  const { success, error: showError } = useNotifications();
  
  // ✅ Vérifier si le compte est bloqué
  useEffect(() => {
    const checkBlock = () => {
      if (blockUntil && new Date() < new Date(blockUntil)) {
        setIsBlocked(true);
        const remaining = Math.ceil((new Date(blockUntil) - new Date()) / 1000 / 60);
        setLoginError(`Trop de tentatives. Veuillez attendre ${remaining} minute(s) ou réinitialisez votre mot de passe.`);
      } else {
        setIsBlocked(false);
        setBlockUntil(null);
      }
    };
    
    checkBlock();
    const interval = setInterval(checkBlock, 60000); // Vérifier toutes les minutes
    
    return () => clearInterval(interval);
  }, [blockUntil]);
  
  const [guestName, setGuestName] = useState('');
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  // ✅ États pour les erreurs de validation du mot de passe
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // ✅ Fonction de validation du mot de passe
  const validatePassword = (password) => {
    const errors = [];
    
    if (!password) {
      return errors; // Ne pas afficher d'erreurs si le champ est vide (géré par required)
    }
    
    if (password.length < 8) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre minuscule');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une lettre majuscule');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }
    
    return errors;
  };

  // ✅ Handler pour la modification du mot de passe avec validation en temps réel
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setRegisterData({...registerData, password: newPassword});
    
    // Valider en temps réel (uniquement si le champ n'est pas vide)
    if (newPassword.length > 0) {
      const errors = validatePassword(newPassword);
      setPasswordErrors(errors);
    } else {
      // Réinitialiser les erreurs si le champ est vide
      setPasswordErrors([]);
    }
    
    // Valider la correspondance avec la confirmation si elle existe
    if (registerData.confirmPassword) {
      if (newPassword !== registerData.confirmPassword) {
        setConfirmPasswordError('Les mots de passe ne correspondent pas');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  // ✅ Handler pour la modification de la confirmation du mot de passe
  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setRegisterData({...registerData, confirmPassword: newConfirmPassword});
    
    // Valider la correspondance (uniquement si les deux champs ont une valeur)
    if (registerData.password && newConfirmPassword) {
      if (newConfirmPassword !== registerData.password) {
        setConfirmPasswordError('Les mots de passe ne correspondent pas');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      // Réinitialiser l'erreur si un des champs est vide
      setConfirmPasswordError('');
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    // ✅ Empêcher les tentatives si le compte est bloqué
    if (isBlocked && blockUntil && new Date() < new Date(blockUntil)) {
      const remaining = Math.ceil((new Date(blockUntil) - new Date()) / 1000 / 60);
      showError(`Trop de tentatives. Veuillez attendre ${remaining} minute(s) ou réinitialisez votre mot de passe.`);
      return;
    }
    
    logger.log('📝 AuthView.handleLogin - Début');
    logger.log('   Email:', loginData.email);
    logger.log('   Password:', loginData.password ? '***' : 'vide');
    setIsLoading(true);
    setLoginError(null); // Réinitialiser l'erreur
    
    try {
      logger.log('🔄 AuthView - Appel de login()...');
      const result = await login(loginData.email, loginData.password);
      logger.log('📊 AuthView - Résultat login:', result);
      
      if (result.success) {
        logger.log('✅ AuthView - Connexion réussie !');
        success('Connexion réussie !');
        setLoginError(null);
      } else {
        logger.log('❌ AuthView - Connexion échouée:', result.error);
        const errorMsg = result.error || 'Erreur de connexion';
        setLoginError(errorMsg);
        showError(errorMsg);
        
        // ✅ Si erreur too-many-requests, bloquer les tentatives pendant 15 minutes
        if (errorMsg.includes('trop de tentatives') || errorMsg.includes('too-many-requests')) {
          const blockTime = new Date();
          blockTime.setMinutes(blockTime.getMinutes() + 15); // Bloquer pendant 15 minutes
          setBlockUntil(blockTime);
          setIsBlocked(true);
          logger.warn('⚠️ AuthView - Compte bloqué jusqu\'à:', blockTime);
        }
      }
    } catch (err) {
      logger.error('❌ AuthView - Exception:', err);
      setLoginError(err.message || 'Erreur inattendue');
      showError(err.message || 'Erreur inattendue');
    } finally {
      setIsLoading(false);
      logger.log('🏁 AuthView.handleLogin - Fin');
    }
  };
  
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!resetPasswordEmail.trim()) {
      showError('Veuillez entrer votre adresse email');
      return;
    }
    
    setIsResettingPassword(true);
    
    try {
      const result = await resetPassword(resetPasswordEmail.trim());
      if (result.success) {
        success('Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.');
        setShowResetPasswordModal(false);
        setResetPasswordEmail('');
      } else {
        showError(result.error || 'Erreur lors de l\'envoi de l\'email');
      }
    } catch (err) {
      showError(err.message || 'Erreur inattendue');
    } finally {
      setIsResettingPassword(false);
    }
  };
  
  const handleRegister = async (e) => {
    e.preventDefault();
    
    // ✅ Validation côté client avant l'envoi
    if (!registerData.firstName || !registerData.firstName.trim()) {
      showError('Le prénom est requis');
      return;
    }
    if (!registerData.lastName || !registerData.lastName.trim()) {
      showError('Le nom est requis');
      return;
    }
    if (!registerData.email || !registerData.email.trim()) {
      showError('L\'email est requis');
      return;
    }
    if (!registerData.password || !registerData.password.trim()) {
      showError('Le mot de passe est requis');
      return;
    }
    // ✅ Valider le mot de passe avant l'envoi
    const passwordValidationErrors = validatePassword(registerData.password);
    if (passwordValidationErrors.length > 0) {
      setPasswordErrors(passwordValidationErrors);
      showError('Le mot de passe ne respecte pas les critères requis');
      return;
    }
    
    if (registerData.password !== registerData.confirmPassword) {
      setConfirmPasswordError('Les mots de passe ne correspondent pas');
      showError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirmPassword, ...userData } = registerData;
      // ✅ S'assurer que les champs sont bien trimés
      userData.firstName = userData.firstName.trim();
      userData.lastName = userData.lastName.trim();
      userData.email = userData.email.trim();
      if (userData.phone) {
        userData.phone = userData.phone.trim();
      }
      
      const result = await register(userData);
      if (result.success) {
        // ✅ Vérifier si l'email doit être confirmé
        if (result.requiresEmailConfirmation) {
          success(result.message || 'Compte créé avec succès ! Vérifiez votre boîte email et cliquez sur le lien de confirmation avant de vous connecter.');
          setIsLogin(true); // Revenir à la page de connexion
          setRegisterData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            phone: ''
          });
          setPasswordErrors([]);
          setConfirmPasswordError('');
        } else if (result.warning) {
          // Afficher un message de succès avec un avertissement
          success('Compte créé avec succès ! Veuillez vous connecter.');
          showError(result.warning);
        } else {
          // Connexion automatique réussie
          success('Inscription réussie ! Bienvenue chez Blossom Café 🌸');
        }
      } else {
        // ✅ Afficher le message d'erreur détaillé (inclut les détails de validation)
        showError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      // ✅ Afficher le message d'erreur avec tous les détails de validation
      showError(err.message || 'Erreur lors de l\'inscription');
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
  
  // ✅ Remplir les emails dans le champ de connexion
  const handleFillClientEmail = () => {
    setIsLogin(true); // S'assurer qu'on est sur l'onglet connexion
    setLoginData({
      ...loginData,
      email: import.meta.env.VITE_TEST_CLIENT_EMAIL || 'client@blossom.com'
    });
  };

  const handleFillManagerEmail = () => {
    setIsLogin(true); // S'assurer qu'on est sur l'onglet connexion
    setLoginData({
      ...loginData,
      email: import.meta.env.VITE_TEST_MANAGER_EMAIL || 'manager@blossom.com'
    });
  };

  const handleFillAdminEmail = () => {
    setIsLogin(true); // S'assurer qu'on est sur l'onglet connexion
    setLoginData({
      ...loginData,
      email: import.meta.env.VITE_TEST_ADMIN_EMAIL || 'admin@blossom.com'
    });
  };

  // Connexions rapides pour le développement (UNIQUEMENT EN DÉVELOPPEMENT)
  const handleQuickLogin = async (role) => {
    // ✅ SÉCURITÉ: Ne pas exposer les mots de passe en production
    if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
      showError('Connexion rapide désactivée en production');
      return;
    }
    
    // ✅ Utiliser des variables d'environnement pour les credentials de test
    const credentials = {
      client: { 
        email: import.meta.env.VITE_TEST_CLIENT_EMAIL || 'client@blossom.com', 
        password: import.meta.env.VITE_TEST_CLIENT_PASS || '' 
      },
      manager: { 
        email: import.meta.env.VITE_TEST_MANAGER_EMAIL || 'manager@blossom.com', 
        password: import.meta.env.VITE_TEST_MANAGER_PASS || '' 
      },
      admin: { 
        email: import.meta.env.VITE_TEST_ADMIN_EMAIL || 'admin@blossom.com', 
        password: import.meta.env.VITE_TEST_ADMIN_PASS || '' 
      }
    };
    
    const creds = credentials[role];
    if (!creds.password) {
      showError('Credentials de test non configurés');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await login(creds.email, creds.password);
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
                onClick={handleFillClientEmail}
                variant="outline"
                size="md"
                fullWidth
                disabled={isLoading}
                className="border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                👤 Client
              </Button>
              <Button
                onClick={handleFillManagerEmail}
                variant="outline"
                size="md"
                fullWidth
                disabled={isLoading}
                className="border-white/30 text-white hover:bg-white/20 hover:border-white/50"
              >
                👨‍💼 Manager
              </Button>
              <Button
                onClick={handleFillAdminEmail}
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
              onClick={handleFillClientEmail}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              👤 Client
            </Button>
            <Button
              onClick={handleFillManagerEmail}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="text-xs border-indigo-300 text-indigo-700 hover:bg-indigo-50"
            >
              👨‍💼 Manager
            </Button>
            <Button
              onClick={handleFillAdminEmail}
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
                onChange={(e) => {
                  setLoginData({...loginData, email: e.target.value});
                  setLoginError(null); // ✅ Réinitialiser l'erreur quand l'utilisateur modifie l'email
                }}
                icon={<Mail className="w-5 h-5" />}
                required
              />
              
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                value={loginData.password}
                onChange={(e) => {
                  setLoginData({...loginData, password: e.target.value});
                  setLoginError(null); // ✅ Réinitialiser l'erreur quand l'utilisateur modifie le mot de passe
                }}
                icon={<Lock className="w-5 h-5" />}
                required
              />
              
              {/* Lien "Mot de passe oublié" */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setResetPasswordEmail(loginData.email);
                    setShowResetPasswordModal(true);
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              
              {/* ✅ Message d'erreur général pour toutes les erreurs de connexion */}
              {loginError && (
                <div className={`rounded-lg p-4 border ${
                  loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className={`text-lg ${
                      loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}>
                      {loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                        ? '⚠️'
                        : '❌'}
                    </span>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                          ? 'text-amber-800'
                          : 'text-red-800'
                      }`}>
                        {loginError}
                      </p>
                      {/* Bouton de réinitialisation pour les erreurs "trop de tentatives" */}
                      {(loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')) && (
                        <button
                          type="button"
                          onClick={() => {
                            setResetPasswordEmail(loginData.email);
                            setShowResetPasswordModal(true);
                          }}
                          className="text-sm text-amber-700 hover:text-amber-900 font-semibold underline mt-2"
                        >
                          Réinitialiser mon mot de passe maintenant
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isBlocked}
              >
                {isBlocked ? 'Compte temporairement bloqué' : 'Se connecter'}
              </Button>
              
              {/* ✅ SÉCURITÉ: Ne pas afficher les mots de passe en production */}
              {!import.meta.env.PROD && import.meta.env.MODE !== 'production' && (
                <div className="text-center text-sm text-gray-600">
                  <p className="mb-2">Mode développement activé</p>
                  <p className="text-xs text-gray-500">Utilisez les boutons de connexion rapide ci-dessus</p>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Prénom"
                  type="text"
                  placeholder="Jean"
                  value={registerData.firstName}
                  onChange={(e) => setRegisterData({...registerData, firstName: e.target.value})}
                  icon={<User className="w-5 h-5" />}
                  required
                />
                <Input
                  label="Nom"
                  type="text"
                  placeholder="Dupont"
                  value={registerData.lastName}
                  onChange={(e) => setRegisterData({...registerData, lastName: e.target.value})}
                  icon={<User className="w-5 h-5" />}
                  required
                />
              </div>
              
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
              
              <div>
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={registerData.password}
                  onChange={handlePasswordChange}
                  icon={<Lock className="w-5 h-5" />}
                  required
                  error={passwordErrors.length > 0 ? passwordErrors[0] : undefined}
                />
                {/* ✅ Afficher toutes les erreurs de validation du mot de passe en rouge */}
                {passwordErrors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {passwordErrors.map((error, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-red-600 font-medium animate-fade-in-up">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <Input
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                value={registerData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                icon={<Lock className="w-5 h-5" />}
                required
                error={confirmPasswordError || undefined}
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
        
        {/* Modal pour réinitialisation de mot de passe */}
        {showResetPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card padding="lg" className="max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Réinitialiser le mot de passe</h3>
                <button
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setResetPasswordEmail('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <p className="text-gray-600 mb-4">
                Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
              </p>
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="votre@email.com"
                  value={resetPasswordEmail}
                  onChange={(e) => setResetPasswordEmail(e.target.value)}
                  icon={<Mail className="w-5 h-5" />}
                  required
                />
                
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    fullWidth
                    onClick={() => {
                      setShowResetPasswordModal(false);
                      setResetPasswordEmail('');
                    }}
                    disabled={isResettingPassword}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    loading={isResettingPassword}
                  >
                    Envoyer
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
        
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

