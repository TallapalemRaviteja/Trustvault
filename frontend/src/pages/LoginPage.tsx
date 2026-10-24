import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSessionExpired = location.search.includes('session_expired=1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      // Route intelligently based on user role
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'owner') {
        navigate('/dashboard');
      } else {
        navigate('/viewer');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing gradient effects */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-vault-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-vault-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-vault-600 to-vault-400 flex items-center justify-center shadow-xl shadow-vault-900/50">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold tracking-tight text-white">
          TRUST<span className="text-vault-400">VAULT</span>
        </h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-mono tracking-widest uppercase">
          Enterprise Zero-Trust Document Security
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-800">
          {isSessionExpired && (
            <div className="mb-5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Your session expired or was terminated. Please re-authenticate.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@trustvault.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-950/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-vault-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 bg-slate-950/60 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-vault-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-vault-600 hover:bg-vault-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-vault-900/50 hover:shadow-vault-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Authenticating with Argon2id...</span>
              ) : (
                <>
                  <span>Access Secure Vault</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Matrix */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Quick Role Test Identities:
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@trustvault.com', 'AdminPassword123!')}
                className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors"
              >
                <div className="font-semibold text-purple-400">Admin A</div>
                <div className="text-[10px] text-slate-400 truncate">admin@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('alice@trustvault.com', 'AlicePassword123!')}
                className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors"
              >
                <div className="font-semibold text-sky-400">Owner A (Alice)</div>
                <div className="text-[10px] text-slate-400 truncate">alice@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bob@trustvault.com', 'BobPassword123!')}
                className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors"
              >
                <div className="font-semibold text-sky-400">Owner B (Bob)</div>
                <div className="text-[10px] text-slate-400 truncate">bob@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('carol@trustvault.com', 'CarolPassword123!')}
                className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors"
              >
                <div className="font-semibold text-emerald-400">Viewer A (Carol)</div>
                <div className="text-[10px] text-slate-400 truncate">carol@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dave@trustvault.com', 'DavePassword123!')}
                className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors"
              >
                <div className="font-semibold text-emerald-400">Viewer B (Dave)</div>
                <div className="text-[10px] text-slate-400 truncate">dave@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('eve.disabled@trustvault.com', 'EvePassword123!')}
                className="px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-colors"
              >
                <div className="font-semibold text-rose-400">Disabled (Eve)</div>
                <div className="text-[10px] text-slate-400 truncate">eve.disabled@...</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
