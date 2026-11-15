import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { formatAuthError } from '../../context/authUtils';

export const AuthPage: React.FC = () => {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage(null);

    // Basic validation
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your password.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, fullName);
      }
    } catch (err) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F7F5F0] text-[#252923] flex flex-col items-center justify-center p-4 sm:p-6 font-barlow relative overflow-hidden select-none">
      {/* Subtle Warm Atmospheric Background Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div
          className="absolute -left-[140px] top-[15%] w-[520px] h-[600px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(231, 225, 215, 0.75) 0%, rgba(247, 245, 240, 0) 70%)' }}
        />
        <div
          className="absolute left-[20%] -bottom-[120px] w-[560px] h-[380px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(198, 106, 61, 0.05) 0%, rgba(231, 225, 215, 0.3) 50%, transparent 80%)' }}
        />
        <div
          className="absolute -right-[120px] top-[25%] w-[480px] h-[540px] rounded-full blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(38, 59, 50, 0.04) 0%, rgba(231, 225, 215, 0.25) 60%, transparent 80%)' }}
        />
      </div>

      {/* Auth Card Container */}
      <div className="w-full max-w-[420px] bg-[#FFFFFF]/90 backdrop-blur-xl border border-[#E5E0D7] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col gap-6 relative z-10 animate-fade-in">
        {/* Logo and Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-4 rounded-[4px] bg-gradient-to-r from-[#263B32] via-[#34443B] to-[#C66A3D] shadow-xs shrink-0" />
            <span className="text-[18px] font-semibold text-[#252923] tracking-tight">
              HandoverX
            </span>
          </div>
          <h1 className="text-[20px] font-bold text-[#252923] tracking-tight mt-1">
            {mode === 'signin' ? 'Sign In to Workspace' : 'Create Your Account'}
          </h1>
          <p className="text-[12px] text-[#77766F] max-w-xs">
            {mode === 'signin'
              ? 'Access verified architectural findings and AI handover synthesis.'
              : 'Join HandoverX to capture institutional knowledge seamlessly.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#E7E1D7]/60 border border-[#E5E0D7] rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-1.5 text-[12px] font-medium rounded-md transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-xs'
                : 'text-[#77766F] hover:text-[#252923]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-1.5 text-[12px] font-medium rounded-md transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#263B32] text-[#FFFFFF] font-semibold shadow-xs'
                : 'text-[#77766F] hover:text-[#252923]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="p-3 bg-[#B94A48]/10 border border-[#B94A48]/30 rounded-lg text-[#B94A48] text-[11.5px] flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 text-[#B94A48] shrink-0 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="fullName"
                className="text-[10.5px] font-medium uppercase tracking-wider text-[#77766F]"
              >
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77766F]/60 w-4 h-4 pointer-events-none" />
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Taylor"
                  disabled={isSubmitting}
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-[#F7F5F0] border border-[#E5E0D7] text-[12px] text-[#252923] placeholder:text-[#77766F]/60 focus:outline-none focus:border-[#263B32] transition-colors disabled:opacity-60"
                />
              </div>
            </div>
          )}

          {/* Email Address */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="email"
              className="text-[10.5px] font-medium uppercase tracking-wider text-[#77766F]"
            >
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77766F]/60 w-4 h-4 pointer-events-none" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                disabled={isSubmitting}
                className="w-full h-9 pl-9 pr-3 rounded-md bg-[#F7F5F0] border border-[#E5E0D7] text-[12px] text-[#252923] placeholder:text-[#77766F]/60 focus:outline-none focus:border-[#263B32] transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="password"
              className="text-[10.5px] font-medium uppercase tracking-wider text-[#77766F]"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77766F]/60 w-4 h-4 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full h-9 pl-9 pr-9 rounded-md bg-[#F7F5F0] border border-[#E5E0D7] text-[12px] text-[#252923] placeholder:text-[#77766F]/60 focus:outline-none focus:border-[#263B32] transition-colors disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77766F] hover:text-[#252923] transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (in signup mode) */}
          {mode === 'signup' && (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="confirmPassword"
                className="text-[10.5px] font-medium uppercase tracking-wider text-[#77766F]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77766F]/60 w-4 h-4 pointer-events-none" />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-[#F7F5F0] border border-[#E5E0D7] text-[12px] text-[#252923] placeholder:text-[#77766F]/60 focus:outline-none focus:border-[#263B32] transition-colors disabled:opacity-60"
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-9 w-full rounded-md bg-[#263B32] hover:bg-[#34443B] text-[#FFFFFF] font-semibold text-[12px] transition-colors shadow-xs disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
              </>
            ) : (
              <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Security & System Info Footer */}
        <div className="pt-2 border-t border-[#E5E0D7] text-center">
          <p className="text-[10.5px] text-[#77766F]/80 leading-normal">
            Enterprise technical handover platform. Authentication secured via Firebase ID tokens.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
