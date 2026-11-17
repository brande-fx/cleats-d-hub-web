import React, {useState} from 'react';
import {ArrowLeft, Lock, ShieldAlert} from 'lucide-react';
import {Link} from 'react-router-dom';
import {useAuth} from '../hooks/useAuth';
import {useStoreData} from '../hooks/useStoreData';

export const AdminLoginPage: React.FC = () => {
  const {signIn, enterPreviewAdmin, isPreviewMode} = useAuth();
  const {settings} = useStoreData();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter both your administrator email and password.');
      return;
    }

    setSubmitting(true);
    const res = await signIn(email, password);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error || 'Authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#DDDCDB] flex flex-col justify-center px-4 py-12">
      <div className="max-w-md w-full mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3C4044] hover:text-[#1F2225]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {settings.store_name}</span>
          </Link>
        </div>

        <div className="bg-[#F7F6F5] border border-[#3C4044]/15 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="space-y-1.5 border-b border-[#3C4044]/10 pb-5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#FD7B41] uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Store Administration</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold text-[#1F2225]">Admin Sign In</h1>
            <p className="text-xs text-[#3C4044]/80">
              Authorized administrators only. Manage products, UK size inventory, discounts, orders, and store settings.
            </p>
          </div>

          {isPreviewMode && (
            <div className="bg-[#EDBF9B]/45 border border-[#3C4044]/15 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2.5 text-xs text-[#1F2225]">
                <ShieldAlert className="w-4 h-4 text-[#3C4044] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Local Preview Mode Active</p>
                  <p className="text-[#3C4044] leading-relaxed">
                    Supabase environment variables (<code className="font-mono-num">VITE_SUPABASE_URL</code>,{' '}
                    <code className="font-mono-num">VITE_SUPABASE_ANON_KEY</code>) are not configured yet. You can explore and test the full admin dashboard locally below, then connect Supabase Auth for live production security.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => enterPreviewAdmin(email || 'admin@calcitefootwear.com')}
                className="w-full py-2.5 px-4 min-h-[42px] bg-[#3C4044] hover:bg-[#1F2225] text-[#F7F6F5] text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                Open Admin Dashboard (Local Preview)
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-semibold text-[#3C4044]">
                Administrator Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourdomain.com"
                className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#3C4044]/25 rounded-md text-sm text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-semibold text-[#3C4044]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your Supabase Auth password"
                className="w-full px-3.5 py-2.5 min-h-[42px] bg-white border border-[#3C4044]/25 rounded-md text-sm text-[#1F2225] focus:outline-2 focus:outline-[#FD7B41]"
              />
            </div>

            {error && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isPreviewMode}
              className="w-full py-3 px-4 min-h-[44px] bg-[#FD7B41] hover:bg-[#fc6b2b] disabled:bg-[#DDDCDB] disabled:text-[#3C4044]/50 text-[#1F2225] font-bold text-sm rounded-md transition-colors cursor-pointer"
            >
              {submitting ? 'Verifying Credentials…' : 'Sign In with Supabase Auth'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
