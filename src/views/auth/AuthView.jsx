import { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, UserCircle, X } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';
import useAuth from '../../hooks/useAuth';
import useNotifications from '../../hooks/useNotifications';
import logger from '../../utils/logger';

/**
 * Vue d'authentification (Login/Register) - Design Neutre et Professionnel
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
    const interval = setInterval(checkBlock, 60000);
    
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

  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validatePassword = (password) => {
    const errors = [];
    
    if (!password) {
      return errors;
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

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setRegisterData({...registerData, password: newPassword});
    
    if (newPassword.length > 0) {
      const errors = validatePassword(newPassword);
      setPasswordErrors(errors);
    } else {
      setPasswordErrors([]);
    }
    
    if (registerData.confirmPassword) {
      if (newPassword !== registerData.confirmPassword) {
        setConfirmPasswordError('Les mots de passe ne correspondent pas');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setRegisterData({...registerData, confirmPassword: newConfirmPassword});
    
    if (registerData.password && newConfirmPassword) {
      if (newConfirmPassword !== registerData.password) {
        setConfirmPasswordError('Les mots de passe ne correspondent pas');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (isBlocked && blockUntil && new Date() < new Date(blockUntil)) {
      const remaining = Math.ceil((new Date(blockUntil) - new Date()) / 1000 / 60);
      showError(`Trop de tentatives. Veuillez attendre ${remaining} minute(s) ou réinitialisez votre mot de passe.`);
      return;
    }
    
    logger.log('📝 AuthView.handleLogin - Début');
    logger.log('   Email:', loginData.email);
    logger.log('   Password:', loginData.password ? '***' : 'vide');
    setIsLoading(true);
    setLoginError(null);
    
    try {
      logger.log('🔄 AuthView - Appel de login()...');
      const result = await login(loginData.email, loginData.password);
      logger.log('📊 AuthView - Résultat login:', result);
      
      if (result.success) {
        logger.log('✅ AuthView - Connexion réussie !');
        setLoginError(null);
      } else {
        logger.log('❌ AuthView - Connexion échouée:', result.error);
        const errorMsg = result.error || 'Erreur de connexion';
        setLoginError(errorMsg);
        showError(errorMsg);
        
        if (errorMsg.includes('trop de tentatives') || errorMsg.includes('too-many-requests')) {
          const blockTime = new Date();
          blockTime.setMinutes(blockTime.getMinutes() + 15);
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
      userData.firstName = userData.firstName.trim();
      userData.lastName = userData.lastName.trim();
      userData.email = userData.email.trim();
      if (userData.phone) {
        userData.phone = userData.phone.trim();
      }
      
      const result = await register(userData);
      if (result.success) {
        if (result.warning) {
          success('Compte créé avec succès ! Veuillez vous connecter.');
          showError(result.warning);
        } else {
          success('Inscription réussie ! Bienvenue chez Blossom Café');
        }
      } else {
        showError(result.error || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
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
        success(`Bienvenue ${guestName} ! Profitez de votre visite`);
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
  
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Fond subtil */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gray-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md drop-shadow-2xl">
          {/* Header avec logo */}
          <div className="mb-10 text-center">
            <div className="inline-block relative">
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-clip-text text-transparent mb-2 drop-shadow-lg relative z-10">
                Blossom Café
              </h1>
              <div className="absolute inset-0 blur-xl bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400 opacity-30 -z-0" />
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent via-gray-300 to-gray-300" />
              <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              <div className="h-px w-12 bg-gradient-to-l from-transparent via-gray-300 to-gray-300" />
            </div>
          </div>

          {/* Carte formulaire */}
          <Card padding="xl" className="relative rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-200/70 bg-white">
            
            {/* Onglets modernes */}
            <div className="mb-8">
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg shadow-inner">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 font-semibold text-sm rounded-md transition-all duration-300 ${
                    isLogin
                      ? 'bg-white text-gray-900 shadow-lg shadow-gray-200'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Connexion
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 font-semibold text-sm rounded-md transition-all duration-300 ${
                    !isLogin
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Inscription
                </button>
              </div>
            </div>
            
            {/* Formulaires */}
            {isLogin ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-4">
                  <Input
                    label="Email"
                    type="email"
                    placeholder="votre@email.com"
                    value={loginData.email}
                    onChange={(e) => {
                      setLoginData({...loginData, email: e.target.value});
                      setLoginError(null);
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
                      setLoginError(null);
                    }}
                    icon={<Lock className="w-5 h-5" />}
                    required
                  />
                </div>
                
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setResetPasswordEmail(loginData.email);
                      setShowResetPasswordModal(true);
                    }}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                
                {loginError && (
                  <div className={`rounded-lg p-4 border ${
                    loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <span className={`text-xl flex-shrink-0 ${
                        loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}>
                        {loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                          ? '⚠️'
                          : '❌'}
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                            ? 'text-amber-900'
                            : 'text-red-900'
                        }`}>
                          {loginError}
                        </p>
                        {(loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')) && (
                          <button
                            type="button"
                            onClick={() => {
                              setResetPasswordEmail(loginData.email);
                              setShowResetPasswordModal(true);
                            }}
                            className={`text-sm font-semibold underline mt-2 ${
                              loginError.includes('trop de tentatives') || loginError.includes('too-many-requests')
                                ? 'text-amber-900 hover:text-amber-800'
                                : 'text-red-900 hover:text-red-800'
                            }`}
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
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                >
                  {isBlocked ? 'Compte temporairement bloqué' : 'Se connecter'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
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
                  {passwordErrors.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {passwordErrors.map((error, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-red-700 font-medium">
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
                  className="bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all"
                >
                  S&apos;inscrire
                </Button>
              </form>
            )}
            
            {/* Bouton continuer en tant qu'invité */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={() => setShowGuestModal(true)}
                variant="outline"
                size="lg"
                fullWidth
                className="border-2 border-gray-300 text-gray-900 hover:border-gray-400 hover:bg-gray-50 transition-all shadow-md hover:shadow-lg"
                icon={<UserCircle className="w-5 h-5" />}
              >
                Continuer en tant qu&apos;invité
              </Button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Accès rapide sans compte (pas de points de fidélité)
              </p>
            </div>
          </Card>

          {/* Lien vers CGU */}
          <p className="text-center text-xs text-gray-500 mt-6">
            En continuant, vous acceptez nos <span className="text-gray-700 font-medium cursor-pointer hover:underline">Conditions d&apos;utilisation</span>
          </p>
        </div>
      </div>

      {/* Modal réinitialisation de mot de passe */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <Card padding="lg" className="w-full max-w-md rounded-xl border border-gray-200 shadow-xl bg-white">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                Réinitialiser le mot de passe
              </h3>
              <button
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setResetPasswordEmail('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <p className="mb-6 text-gray-600 text-sm leading-relaxed">
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
              
              <div className="flex gap-3 pt-2">
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
                  className="border-gray-300 hover:border-gray-400 text-gray-900"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={isResettingPassword}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Envoyer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      
      {/* Modal connexion invité */}
      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <Card padding="lg" className="w-full max-w-md rounded-xl border border-gray-200 shadow-xl bg-white">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-900">
                Connexion invité
              </h3>
              <button
                onClick={() => {
                  setShowGuestModal(false);
                  setGuestName('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleGuestLogin} className="space-y-4">
              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                  <UserCircle className="w-10 h-10 text-gray-700" />
                </div>
                <p className="text-sm text-gray-600 font-medium">
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
              
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => {
                    setShowGuestModal(false);
                    setGuestName('');
                  }}
                  className="border-gray-300 hover:border-gray-400 text-gray-900"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Continuer
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuthView;