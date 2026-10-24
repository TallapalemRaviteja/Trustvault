import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrustVaultLogo } from '../components/TrustVaultLogo';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileKey2,
  Binary,
  HelpCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const isSessionExpired = location.search.includes('session_expired=1');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'owner') {
        navigate('/dashboard');
      } else {
        navigate('/viewer');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
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
    <div className="min-h-screen bg-[#0B1020] text-[#F4F7FC] flex flex-col lg:flex-row relative overflow-hidden font-sans">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#4F8CFF]/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-[#42D9E8]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* LEFT SECTION: Cyber Brand & Illustration */}
      <div className="lg:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-[#1E2C48]/60 bg-gradient-to-br from-[#0B1020] via-[#121A2B]/80 to-[#0B1020] cyber-grid">
        {/* Top: Logo */}
        <div className="relative z-10">
          <TrustVaultLogo size="lg" />
        </div>

        {/* Center: Hero Value Proposition & Cybersecurity Visual */}
        <div className="my-12 lg:my-0 max-w-lg relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18243C] border border-[#4F8CFF]/30 text-xs font-mono text-[#42D9E8] mb-5 shadow-cyber-sm">
            <span className="w-2 h-2 rounded-full bg-[#42D9E8] animate-pulse" />
            Zero-Trust Document Security Platform
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#F4F7FC] leading-tight">
            Your Documents.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8]">
              Your Rules.
            </span>
          </h1>

          <p className="mt-4 text-base text-[#9BA8BD] leading-relaxed">
            Secure sharing. Precise per-document permissions. Complete accountability backed by a tamper-evident SHA-256 hash-chained audit ledger.
          </p>

          {/* Abstract Cybersecurity Lock Matrix SVG Illustration */}
          <div className="mt-10 p-6 rounded-2xl bg-[#121A2B]/80 border border-[#1E2C48] shadow-cyber-md relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Binary className="w-28 h-28 text-[#4F8CFF]" />
            </div>

            <div className="grid grid-cols-3 gap-3 relative z-10">
              <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-[#1E2C48] flex flex-col items-center text-center">
                <FileKey2 className="w-5 h-5 text-[#4F8CFF] mb-2" />
                <span className="text-xs font-semibold text-white">Document ACL</span>
                <span className="text-[10px] text-[#9BA8BD] font-mono mt-0.5">Explicit Grants</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-[#1E2C48] flex flex-col items-center text-center">
                <ShieldCheck className="w-5 h-5 text-[#42D9E8] mb-2" />
                <span className="text-xs font-semibold text-white">Live Revocation</span>
                <span className="text-[10px] text-[#9BA8BD] font-mono mt-0.5">Zero-Cache</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0B1020]/90 border border-[#1E2C48] flex flex-col items-center text-center">
                <Lock className="w-5 h-5 text-emerald-400 mb-2" />
                <span className="text-xs font-semibold text-white">Hash Chained</span>
                <span className="text-[10px] text-[#9BA8BD] font-mono mt-0.5">SHA-256 Proof</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-[#1E2C48] flex items-center justify-between text-xs text-[#9BA8BD]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-[11px]">System Status: All Defense Layers Active</span>
              </div>
              <span className="text-[11px] font-mono text-[#4F8CFF]">v2.4 LTS</span>
            </div>
          </div>
        </div>

        {/* Bottom Security Indicator */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-[#9BA8BD] font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>FIPS 140-2 Compatible • Argon2id Key Derivation • Private Storage Isolation</span>
        </div>
      </div>

      {/* RIGHT SECTION: Minimalist Login Form */}
      <div className="lg:w-1/2 p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center relative z-10">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F4F7FC]">
              Sign in to TrustVault
            </h2>
            <p className="mt-1 text-sm text-[#9BA8BD]">
              Enter your enterprise credentials to access your protected workspace.
            </p>
          </div>

          {/* Session Expiration Notice */}
          {isSessionExpired && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-xs text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Your security session expired. Please authenticate with your corporate credentials.</span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#F4F7FC] mb-1.5">
                Corporate Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9BA8BD]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@trustvault.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#121A2B] border border-[#1E2C48] rounded-xl text-sm text-[#F4F7FC] placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all shadow-inner"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#F4F7FC] mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9BA8BD]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#121A2B] border border-[#1E2C48] rounded-xl text-sm text-[#F4F7FC] placeholder-[#9BA8BD]/60 focus:outline-none focus:border-[#4F8CFF] focus:ring-1 focus:ring-[#4F8CFF] transition-all shadow-inner font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#9BA8BD] hover:text-[#F4F7FC] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#121A2B] border-[#1E2C48] text-[#4F8CFF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-xs text-[#9BA8BD]">Remember session</span>
              </label>

              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(true)}
                className="text-xs text-[#4F8CFF] hover:text-[#42D9E8] transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Premium Blue Gradient Login Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-[#4F8CFF] to-[#42D9E8] hover:opacity-95 shadow-cyber-glow transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Verifying Argon2id Hash...
                </span>
              ) : (
                <>
                  <span>Authenticate & Enter Vault</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Test Identities Matrix */}
          <div className="mt-8 pt-6 border-t border-[#1E2C48]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9BA8BD]">
                1-Click Evaluator Identities:
              </span>
              <span className="text-[10px] text-[#42D9E8] font-mono">Pre-Configured</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('alice@trustvault.com', 'AlicePassword123!')}
                className="p-2.5 rounded-xl bg-[#121A2B] hover:bg-[#162137] border border-[#1E2C48] hover:border-[#4F8CFF]/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-[#4F8CFF] group-hover:text-[#42D9E8]">Alice (Owner)</div>
                <div className="text-[10px] text-[#9BA8BD] truncate">alice@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('carol@trustvault.com', 'CarolPassword123!')}
                className="p-2.5 rounded-xl bg-[#121A2B] hover:bg-[#162137] border border-[#1E2C48] hover:border-emerald-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-emerald-400">Carol (Viewer)</div>
                <div className="text-[10px] text-[#9BA8BD] truncate">carol@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin@trustvault.com', 'AdminPassword123!')}
                className="p-2.5 rounded-xl bg-[#121A2B] hover:bg-[#162137] border border-[#1E2C48] hover:border-purple-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-purple-400">Sec Admin</div>
                <div className="text-[10px] text-[#9BA8BD] truncate">admin@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('bob@trustvault.com', 'BobPassword123!')}
                className="p-2.5 rounded-xl bg-[#121A2B] hover:bg-[#162137] border border-[#1E2C48] hover:border-[#4F8CFF]/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-[#4F8CFF]">Bob (Owner B)</div>
                <div className="text-[10px] text-[#9BA8BD] truncate">bob@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dave@trustvault.com', 'DavePassword123!')}
                className="p-2.5 rounded-xl bg-[#121A2B] hover:bg-[#162137] border border-[#1E2C48] hover:border-emerald-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-emerald-400">Dave (Viewer B)</div>
                <div className="text-[10px] text-[#9BA8BD] truncate">dave@trustvault.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('eve.disabled@trustvault.com', 'EvePassword123!')}
                className="p-2.5 rounded-xl bg-[#121A2B] hover:bg-[#162137] border border-[#1E2C48] hover:border-rose-500/50 text-left transition-all group"
              >
                <div className="text-xs font-semibold text-rose-400">Eve (Disabled)</div>
                <div className="text-[10px] text-[#9BA8BD] truncate">eve.disabled@...</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121A2B] border border-[#1E2C48] rounded-2xl max-w-md w-full p-6 shadow-cyber-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-[#18243C] text-[#4F8CFF]">
                <HelpCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#F4F7FC]">Zero-Trust Credential Recovery</h3>
            </div>
            <p className="text-xs text-[#9BA8BD] leading-relaxed mb-5">
              In accordance with enterprise zero-trust policy, passwords are cryptographically hashed using Argon2id and cannot be recovered in plaintext.
              <br /><br />
              For testing and academic evaluation, you can use any of the pre-configured evaluator identities above or contact your Security Administrator (<code className="text-[#42D9E8] font-mono">admin@trustvault.com</code>).
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPasswordModal(false)}
                className="px-4 py-2 bg-[#1E2C48] hover:bg-[#2A3F66] text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
