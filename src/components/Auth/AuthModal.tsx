import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  User, 
  Key, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  Mail, 
  Lock,
  LogOut,
  GraduationCap
} from 'lucide-react';
import { AuthUser } from '../../types';
import { triggerConfetti } from '../../utils/readiness';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authUser: AuthUser | null;
  onLoginSuccess: (user: AuthUser) => void;
  onSignOut: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authUser,
  onLoginSuccess,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const [mode, setMode] = useState<'switch' | 'register'>('switch');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDirectAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const isAdm = email.toLowerCase().includes('admin');
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload = mode === 'register'
        ? { name, email, password, role: isAdm ? 'admin' : 'student' }
        : { email, password, role: isAdm ? 'admin' : 'student' };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      triggerConfetti();
      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Token generation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">User Account & Token Session</h3>
            <p className="text-xs text-slate-500">Manage authorization token & role session</p>
          </div>
        </div>

        {/* Current Active Token Info */}
        {authUser && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Currently Logged In As</span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                authUser.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'
              }`}>
                {authUser.role}
              </span>
            </div>
            <div className="text-xs text-slate-900 font-bold">{authUser.name}</div>
            <div className="text-xs text-slate-500 font-mono truncate">{authUser.email}</div>
            <div className="text-[11px] text-slate-400 font-mono truncate">Token: {authUser.token || 'JWT_Active_Session'}</div>
          </div>
        )}

        {/* Custom Auth Form */}
        <form onSubmit={handleDirectAuth} className="space-y-3 pt-1">
          <label className="block text-xs font-bold text-slate-700">Sign In / Register with Custom Credentials</label>
          {errorMessage && (
            <div className="p-2 rounded-xl bg-red-50 text-red-700 text-xs">{errorMessage}</div>
          )}
          <input
            type="email"
            placeholder="Email Address"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-900"
          />
          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              {isLoading ? 'Tokenizing...' : 'Sign In & Authenticate'}
            </button>
            {authUser && (
              <button
                type="button"
                onClick={() => { onSignOut(); onClose(); }}
                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
