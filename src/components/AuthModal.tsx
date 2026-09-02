import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { X, Smartphone, KeyRound, Loader2, ArrowRight, Mail, Lock, LogIn, UserPlus, UserCircle, Check } from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';


function GoogleLoginButton({ onSuccess, onError, loading }: { onSuccess: (token: string) => void, onError: () => void, loading: boolean }) {
  const login = useGoogleLogin({
    onSuccess: tokenResponse => onSuccess(tokenResponse.credential || tokenResponse.access_token),
    onError: () => onError(),
    flow: 'implicit'
  });

  return (
    <button 
      type="button"
      disabled={loading}
      onClick={() => login()}
      className="w-full flex items-center justify-center gap-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl font-medium shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
      ورود با گوگل
    </button>
  );
}

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, login } = useAuthStore();
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  
  // User Info State
  const [name, setName] = useState('');

  // Phone State
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(120);
  
  // Email State
  const [isEmailLogin, setIsEmailLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id.apps.googleusercontent.com';

  useEffect(() => {
    let timer: any;
    if (authMethod === 'phone' && step === 2 && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft, authMethod]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setAuthModalOpen(true);
      setAuthMethod('email');
      setResetToken(token);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setAuthModalOpen]);

  useEffect(() => {
    if (isAuthModalOpen) {
      if (!resetToken) {
        setAuthMethod('phone');
      }
      setStep(1);
      setPhone('');
      setCode('');
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setSuccessMsg('');
      if (!resetToken) {
        setIsForgotPassword(false);
      }
    }
  }, [isAuthModalOpen, resetToken]);

  if (!isAuthModalOpen) return null;

  // Phone Methods
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^09\d{9}$/.test(phone)) {
      setError('شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ارسال پیامک.');
      } else {
        setStep(2);
        setTimeLeft(120);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 5) {
      setError('کد تایید باید ۵ رقم باشد.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, name })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'کد تایید اشتباه است.');
      } else {
        login(data.user, data.token);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // Email Methods
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = isEmailLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطایی رخ داده است.');
      } else {
        login(data.user, data.token);
      }
    } catch (err) {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطایی رخ داده است.');
      } else {
        setSuccessMsg(data.message || 'لینک بازیابی ارسال شد.');
        setIsForgotPassword(false);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, newPassword: password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطایی رخ داده است.');
      } else {
        setSuccessMsg(data.message || 'رمز عبور تغییر کرد.');
        setResetToken('');
        setPassword('');
        setIsEmailLogin(true);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Method
  const handleGoogleSuccess = async (token: string) => {
    setLoading(true);
    setError('');
    
    // Fallback: When using implicit flow, tokenResponse might only have access_token.
    // The backend endpoint can either decode ID Token or use google API for access_token.
    // For safety, let's pass it and let backend verify.
    
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: token })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ورود با گوگل');
      } else {
        login(data.user, data.token);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderUserInfoFields = () => (
    <div className="mb-4">
      <label className="block mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">نام کاربری (اختیاری)</label>
      <div className="relative">
        <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input 
          type="text" 
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100"
          placeholder="نام شما..."
        />
      </div>
    </div>
  );

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
        />
        <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/50 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              {authMethod === 'phone' && step === 2 && (
                <button 
                  onClick={() => setStep(1)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ArrowRight size={20} />
                </button>
              )}
              <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
                {authMethod === 'phone' 
                  ? (step === 1 ? 'ورود / ثبت‌نام' : 'تایید موبایل') 
                  : (resetToken 
                      ? 'تغییر رمز عبور' 
                      : (isForgotPassword ? 'بازیابی رمز عبور' : (isEmailLogin ? 'ورود' : 'ثبت‌نام')))}
              </h2>
            </div>
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Tabs */}
          {((authMethod === 'phone' && step === 1) || (authMethod === 'email' && !resetToken && !isForgotPassword)) && (
            <div className="flex p-2 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
              <button
                onClick={() => { setAuthMethod('phone'); setError(''); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  authMethod === 'phone' 
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-700' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                شماره موبایل
              </button>
              <button
                onClick={() => { setAuthMethod('email'); setError(''); }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  authMethod === 'email' 
                    ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm border border-zinc-200 dark:border-zinc-700' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                ایمیل
              </button>
            </div>
          )}

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="mb-5 p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800/30 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}
            
            {successMsg && (
              <div className="mb-5 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-xl border border-green-100 dark:border-green-800/30 flex items-center gap-2">
                <Check className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            {/* Form Container */}

            {authMethod === 'phone' ? (
              step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-6">
                  {renderUserInfoFields()}
                  <div className="mb-4">
                    <label className="block mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">شماره موبایل</label>
                    <div className="relative">
                      <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100 text-left font-mono tracking-widest text-lg"
                        placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
                        maxLength={11}
                        required
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <GoogleLoginButton 
                      onSuccess={handleGoogleSuccess} 
                      onError={() => setError('ورود با گوگل لغو شد یا با خطا مواجه شد.')}
                      loading={loading}
                    />
                  </div>

                  <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500 text-xs font-medium">یا با پیامک</span>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || phone.length !== 11}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                    ادامه
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* Live Preview Card */}
                  <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase shrink-0">
                      {name ? name.charAt(0).toUpperCase() : (phone ? phone.slice(-2) : 'U')}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{name || 'کاربر چت‌باکس'}</div>
                      <div className="text-xs text-zinc-500 font-mono tracking-wider" dir="ltr">{phone}</div>
                    </div>
                  </div>

                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    کد پیامک شده را وارد کنید:
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                      <input 
                        type="text" 
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100 text-center font-mono tracking-[0.5em] text-2xl"
                        placeholder="•••••"
                        maxLength={5}
                        required
                        dir="ltr"
                        autoComplete="one-time-code"
                        autoFocus
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading || code.length !== 5}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : null}
                    تایید و ورود
                  </button>

                  <div className="text-center pt-2">
                    {timeLeft > 0 ? (
                      <span className="text-sm text-zinc-500 dark:text-zinc-400">
                        ارسال مجدد تا {formatTime(timeLeft)}
                      </span>
                    ) : (
                      <button 
                        type="button" 
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline disabled:opacity-50"
                      >
                        ارسال مجدد کد
                      </button>
                    )}
                  </div>
                </form>
              )
            ) : resetToken ? (
              <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
                <div className="mb-4">
                  <label className="block mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">رمز عبور جدید</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100"
                      placeholder="حداقل ۶ کاراکتر"
                      required
                      dir="ltr"
                      minLength={6}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  تایید و تغییر رمز
                </button>
              </form>
            ) : isForgotPassword ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  ایمیل خود را وارد کنید تا لینک بازیابی رمز عبور برای شما ارسال شود.
                </p>
                <div className="mb-4">
                  <label className="block mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">ایمیل</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100"
                      placeholder="example@mail.com"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  ارسال لینک بازیابی
                </button>

                <div className="text-center pt-4">
                  <button 
                    type="button" 
                    onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
                    className="text-sm text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    بازگشت به ورود
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                {/* Username and Avatar fields for Email form conditionally based on registration */}
                {!isEmailLogin && renderUserInfoFields()}

                <div className="mb-4">
                  <label className="block mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">ایمیل</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100"
                      placeholder="example@mail.com"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">رمز عبور</label>
                    {isEmailLogin && (
                      <button 
                        type="button" 
                        onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        فراموشی رمز؟
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100"
                      placeholder="حداقل ۶ کاراکتر"
                      required
                      dir="ltr"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <GoogleLoginButton 
                    onSuccess={handleGoogleSuccess} 
                    onError={() => setError('ورود با گوگل لغو شد یا با خطا مواجه شد.')}
                    loading={loading}
                  />
                </div>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200 dark:border-zinc-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500 text-xs font-medium">یا ثبت/ورود با ایمیل</span>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : (isEmailLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                  {isEmailLogin ? 'ورود' : 'ثبت‌نام'}
                </button>

                <div className="text-center pt-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {isEmailLogin ? 'حساب کاربری ندارید؟ ' : 'قبلاً ثبت‌نام کرده‌اید؟ '}
                  <button 
                    type="button" 
                    onClick={() => { setIsEmailLogin(!isEmailLogin); setError(''); setSuccessMsg(''); }}
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                  >
                    {isEmailLogin ? 'ثبت‌نام کنید' : 'وارد شوید'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
