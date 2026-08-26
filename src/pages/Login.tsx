import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassInput } from '../components/ui/GlassInput';
import { Button } from '../components/ui/Button';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Veuillez saisir votre adresse e-mail.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Veuillez saisir votre mot de passe.');
      setLoading(false);
      return;
    }

    const result = await signIn(trimmedEmail, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Identifiants invalides. Veuillez réessayer.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-animated-gradient relative overflow-hidden">
      {/* Decorative background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#110195] rounded-full mix-blend-screen filter blur-[120px] opacity-40 animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#FC9905] rounded-full mix-blend-screen filter blur-[120px] opacity-30 animate-pulse pointer-events-none" style={{ animationDelay: '2.5s' }} />

      <div className="w-full max-w-md animate-fadeIn relative z-10">
        {/* Titre de l'application au-dessus de la carte */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-serif font-bold tracking-tight drop-shadow-sm">
            <span className="text-[#110195]">Oversea </span>
            <span className="text-[#FC9905]">ClockIn</span>
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm mt-1 font-medium tracking-wide">
            Système de Pointage & Gestion de Présence
          </p>
        </div>

        <GlassCard className="!p-7 sm:!p-10 !rounded-3xl border border-white/40 shadow-[0_20px_60px_-15px_rgba(17,1,149,0.15)] backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#110195]/10 border border-[#110195]/15 text-[#110195] text-xs font-semibold tracking-wider uppercase mb-3">
              Portail Agent Sécurisé
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
              Connexion
            </h2>
            <p className="text-gray-500 text-sm mt-1.5 font-light">
              Identifiez-vous pour accéder à votre espace de pointage
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Champ Email */}
            <GlassInput
              id="login-email"
              label="Adresse e-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent@oversea.com"
              required
              autoComplete="email"
              autoFocus
              icon={<Mail className="h-5 w-5" />}
            />

            {/* Champ Mot de passe */}
            <GlassInput
              id="login-password"
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              icon={<Lock className="h-5 w-5" />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors rounded-lg"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
            />

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm p-3.5 rounded-2xl flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Bouton de soumission */}
            <Button 
              type="submit" 
              variant="secondary" 
              fullWidth 
              loading={loading}
              className="mt-6 text-base font-bold py-3.5 rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all"
              icon={!loading ? <LogIn className="w-4 h-4 ml-1" /> : undefined}
            >
              Se connecter
            </Button>
          </form>

          {/* Footer discret */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-400 text-xs font-light">
              Oversea ClockIn &bull; Accès restreint aux agents autorisés
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

export default Login;


