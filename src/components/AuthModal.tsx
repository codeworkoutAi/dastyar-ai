import { ClayButton } from './ui/ClayButton';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  X, Loader2, ArrowRight, ArrowLeft, Mail, Lock, LogIn,
  UserPlus, UserCircle, Check, Smartphone, RefreshCw, KeyRound, ShieldCheck
} from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { toPersianDigits, toEnglishDigits } from '../lib/persianUtils';

function GoogleLoginButton({ onSuccess, onError, loading }: { onSuccess: (token: string) => void, onError: () => void, loading: boolean }) {
  const login = useGoogleLogin({
    onSuccess: tokenResponse => onSuccess(tokenResponse.access_token),
    onError: () => onError(),
    flow: 'implicit'
  });

  return (
    <ClayButton variant="text" type="button"
      disabled={loading}
      onClick={() => login()}
      className="w-full flex items-center justify-center gap-2 py-2.5 clay-btn text-zinc-800 dark:text-zinc-200 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-4 h-4" />
      <span>گوگل</span>
    </ClayButton>
  );
}

function TelegramLoginButton({ onClick, loading }: { onClick: () => void, loading: boolean }) {
  return (
    <ClayButton variant="text"
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-2.5 clay-btn text-[#229ED9] rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm"
    >
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
      </svg>
      <span>تلگرام</span>
    </ClayButton>
  );
}

export default function AuthModal() {
  const { isAuthModalOpen, setAuthModalOpen, login } = useAuthStore();

  // Method: 'phone' (Default per user instruction) or 'email'
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');

  // Phone OTP Flow State
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Email Flow State
  const [isEmailLogin, setIsEmailLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');
  const [resetToken, setResetToken] = useState('');

  // Telegram Auth State
  const [telegramWaiting, setTelegramWaiting] = useState(false);
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramBotUrl, setTelegramBotUrl] = useState('');

  // Refs
  const otpInputRef = useRef<HTMLInputElement>(null);
  const otpFormRef = useRef<HTMLFormElement>(null);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-client-id.apps.googleusercontent.com';

  const defaultAvatars = [
    '/avatars/avatar-1.svg',
    '/avatars/avatar-2.svg',
    '/avatars/avatar-3.svg',
    '/avatars/avatar-4.svg',
    '/avatars/avatar-5.svg',
    '/avatars/avatar-6.svg'
  ];

  // Detect password reset token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setAuthModalOpen(true);
      setResetToken(token);
      setAuthMethod('email');
      setIsForgotPassword(false);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [setAuthModalOpen]);

  // Reset states on modal open
  useEffect(() => {
    if (isAuthModalOpen) {
      if (!resetToken) {
        setAuthMethod('phone');
        setPhoneStep('input');
        setIsForgotPassword(false);
      }
      setPhone('');
      setOtpCode('');
      setCountdown(0);
      setEmail('');
      setPassword('');
      setName('');
      setError('');
      setSuccessMsg('');
      setTelegramWaiting(false);
      setTelegramToken('');
    }
  }, [isAuthModalOpen, resetToken]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus OTP input when switching to OTP step
  useEffect(() => {
    if (phoneStep === 'otp' && otpInputRef.current) {
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }
  }, [phoneStep]);

  // Pre-select first avatar on modal open
  useEffect(() => {
    if (isAuthModalOpen && !selectedAvatar) {
      setSelectedAvatar(defaultAvatars[0]);
    }
  }, [isAuthModalOpen, selectedAvatar]);

  // Polling for Telegram Bot Auth confirmation
  useEffect(() => {
    if (!telegramWaiting || !telegramToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/auth/telegram/check?token=${telegramToken}`);
        const data = await res.json();

        if (data.status === 'authenticated') {
          clearInterval(interval);
          setTelegramWaiting(false);
          login(data.user, data.token);
          setAuthModalOpen(false);
        } else if (data.status === 'expired') {
          clearInterval(interval);
          setTelegramWaiting(false);
          setError('نشست ورود تلگرام منقضی شد. لطفاً دوباره امتحان کنید.');
        }
      } catch (err) {
        // Network hiccup - ignore
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [telegramWaiting, telegramToken, login, setAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  // --- Handlers ---

  // 1. Phone OTP: Send Code
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanedPhone = toEnglishDigits(phone).replace(/[^\d]/g, '');
    if (!cleanedPhone.startsWith('09') || cleanedPhone.length !== 11) {
      setError('شماره موبایل نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanedPhone })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ارسال کد تایید');
      } else {
        setPhoneStep('otp');
        setCountdown(data.expiresIn || 120);
        setSuccessMsg('کد ۵ رقمی ورود به شماره شما پیامک شد.');
      }
    } catch (err) {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Phone OTP: Verify Code
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanedPhone = toEnglishDigits(phone).replace(/[^\d]/g, '');
    const cleanedCode = toEnglishDigits(otpCode).trim();

    if (cleanedCode.length !== 5) {
      setError('کد تایید ۵ رقم است.');
      return;
    }

    setLoading(true);
    try {
      const promo = localStorage.getItem('chatbox_promo');
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanedPhone,
          code: cleanedCode,
          promoCode: promo
        })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'کد وارد شده اشتباه یا منقضی شده است.');
      } else {
        localStorage.removeItem('chatbox_promo');
        login(data.user, data.token);
        setAuthModalOpen(false);
      }
    } catch (err) {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Telegram Login Handler
  const handleTelegramLogin = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/auth/telegram/session', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ایجاد نشست تلگرام');
      } else {
        setTelegramToken(data.token);
        setTelegramBotUrl(data.botUrl);
        setTelegramWaiting(true);
        window.open(data.botUrl, '_blank');
      }
    } catch (err) {
      setError('خطا در اتصال به سرور تلگرام');
    } finally {
      setLoading(false);
    }
  };

  // 4. Email / Password Login & Register Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('لطفاً آدرس ایمیل خود را وارد نمایید.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('فرمت آدرس ایمیل نامعتبر است (مثال: example@mail.com).');
      return;
    }
    if (!password || password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isEmailLogin ? '/api/auth/login' : '/api/auth/register';
      const promo = localStorage.getItem('chatbox_promo');
      const body = isEmailLogin
        ? { email: trimmedEmail, password }
        : { email: trimmedEmail, password, name, avatar: selectedAvatar || defaultAvatars[0], promoCode: promo };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در انجام عملیات');
      } else {
        if (!isEmailLogin) {
          localStorage.removeItem('chatbox_promo');
        }
        login(data.user, data.token);
        setAuthModalOpen(false);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Google Login Handler
  const handleGoogleSuccess = async (token: string) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: token, promoCode: localStorage.getItem('chatbox_promo') })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطا در ورود با گوگل');
      } else {
        localStorage.removeItem('chatbox_promo');
        login(data.user, data.token);
        setAuthModalOpen(false);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password Handler
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
        setError(data.error || 'خطا در ارسال ایمیل');
      } else {
        setSuccessMsg(data.message || 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد.');
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset Password Handler
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
        setError(data.error || 'خطا در تغییر رمز عبور');
      } else {
        setSuccessMsg('رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.');
        setResetToken('');
        setAuthMethod('email');
        setIsEmailLogin(true);
      }
    } catch (err) {
      setError('خطا در ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  const renderUserInfoFields = () => (
    <div className="space-y-4 mb-4">
      <div>
        <label className="block mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">انتخاب تصویر نمایه</label>
        <div className="flex gap-3 justify-center items-center py-1.5 overflow-x-auto">
          {defaultAvatars.map((url, i) => (
            <ClayButton variant="text"
              key={i}
              type="button"
              onClick={() => setSelectedAvatar(url)}
              className={`relative rounded-full p-0.5 transition-all flex-shrink-0 ${(selectedAvatar === url || (!selectedAvatar && i === 0))
                ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'
                }`}
            >
              <img src={url} alt={`avatar-${i}`} className="w-10 h-10 rounded-full shadow-md transition-all" />
            </ClayButton>
          ))}
        </div>
      </div>
      <div>
        <label className="block mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">نام</label>
        <div className="relative">
          <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ paddingRight: '2.85rem' }} className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl  transition-all outline-none text-zinc-900 dark:text-zinc-100 text-sm"
            placeholder="مثال: علی رضایی"
            required
            minLength={2}
            maxLength={50}
          />
        </div>
      </div>
    </div>
  );


  const renderStatusMessages = () => (
    <>
      {error && (
        <div className="mb-4 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
    </>
  );

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setAuthModalOpen(false)}
        />
        <div className="relative w-full max-w-md clay-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              {(isForgotPassword || telegramWaiting || (authMethod === 'phone' && phoneStep === 'otp') || authMethod === 'email') && (
                <button
                  type="button"
                  onClick={() => {
                    if (telegramWaiting) {
                      setTelegramWaiting(false);
                    } else if (isForgotPassword) {
                      setIsForgotPassword(false);
                    } else if (authMethod === 'phone' && phoneStep === 'otp') {
                      setPhoneStep('input');
                    } else if (authMethod === 'email') {
                      setAuthMethod('phone');
                    }
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                  title="بازگشت"
                >
                  <ArrowRight size={18} />
                </button>
              )}
              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                {telegramWaiting ? (
                  'ورود با تلگرام'
                ) : resetToken ? (
                  'تغییر رمز عبور'
                ) : isForgotPassword ? (
                  'بازیابی رمز عبور'
                ) : authMethod === 'phone' ? (
                  phoneStep === 'input' ? 'ورود با شماره موبایل' : 'تایید کد پیامک‌شده'
                ) : (
                  isEmailLogin ? 'ورود با ایمیل' : 'ثبت‌نام جدید با ایمیل'
                )}
              </h2>
            </div>
            <button
              onClick={() => setAuthModalOpen(false)}
              className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6">


            {/* Telegram Waiting Screen */}
            {telegramWaiting && renderStatusMessages()}
            {telegramWaiting ? (
              <div className="text-center py-5 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center animate-pulse shadow-sm">
                  <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">در انتظار تأیید در تلگرام...</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
                    ربات تلگرام باز شد. لطفاً در چت ربات روی دکمه <b>«تایید و ورود به سایت»</b> کلیک کنید.
                  </p>
                </div>

                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-800 dark:text-amber-300 text-right leading-relaxed flex items-start gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <span>
                    <b>نکته:</b> برای باز شدن تلگرام، حتماً از اتصال <b>فیلترشکن (VPN)</b> خود اطمینان حاصل کرده و سپس دکمه زیر را لمس کنید.
                  </span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={telegramBotUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-[#229ED9] hover:bg-[#1f8ec4] text-white text-sm font-bold rounded-xl shadow-sm transition-all text-center"
                  >
                    باز کردن مجدد ربات تلگرام
                  </a>
                  <button
                    type="button"
                    onClick={() => { setTelegramWaiting(false); setTelegramToken(''); }}
                    className="w-full py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-medium transition-colors"
                  >
                    انصراف و بازگشت
                  </button>
                </div>
              </div>
            ) : resetToken ? (
              /* Reset Password Form */
              <form noValidate onSubmit={handleResetPasswordSubmit} className="space-y-5">
                <div>
                  <label className="block mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">رمز عبور جدید</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:outline-none transition-all text-zinc-900 dark:text-zinc-100 text-sm"
                      placeholder="حداقل ۶ کاراکتر"
                      required
                      dir="ltr"
                      minLength={6}
                    />
                  </div>
                </div>

                {renderStatusMessages()}
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 clay-btn-primary text-white rounded-xl font-bold disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  تایید و تغییر رمز
                </button>
              </form>
            ) : isForgotPassword ? (
              /* Forgot Password Form */
              <form noValidate onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  ایمیل حساب خود را وارد کنید تا لینک اختصاصی بازیابی رمز عبور برای شما ارسال شود.
                </p>
                <div>
                  <label className="block mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">ایمیل</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                      className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:outline-none transition-all text-zinc-900 dark:text-zinc-100 text-sm"
                      placeholder="example@mail.com"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                {renderStatusMessages()}
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 clay-btn-primary text-white rounded-xl font-bold disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                  ارسال لینک بازیابی
                </button>

                <div className="text-center pt-2">
                  <button type="button" onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
                    className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    بازگشت به صفحه ورود
                  </button>
                </div>
              </form>
            ) : authMethod === 'phone' ? (
              /* --- Mobile OTP Flow (Default) --- */
              phoneStep === 'input' ? (
                /* Step 1: Input Phone Number */
                <form noValidate onSubmit={handleSendOtp} className="space-y-4">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    شماره موبایل خود را وارد نمایید تا کد تایید ۵ رقمی پیامک شود:
                  </p>

                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      شماره موبایل
                    </label>
                    <div className="relative" dir="ltr">
                      <input
                        type="tel"
                        value={phone ? toPersianDigits(phone) : ''}
                        onChange={e => {
                          const val = toEnglishDigits(e.target.value).replace(/[^\d]/g, '');
                          if (val.length <= 11) setPhone(val);
                        }}
                        className="w-full pl-4 pr-11 py-2.5 clay-input rounded-xl focus:outline-none transition-all text-zinc-900 dark:text-zinc-100 text-sm font-semibold tracking-wider text-left placeholder:text-left placeholder:text-zinc-400"
                        style={{ fontFamily: "'Vazirmatn', sans-serif" }}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        dir="ltr"
                        required
                        autoFocus
                      />
                      <Smartphone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  {renderStatusMessages()}
                  <button
                    type="submit"
                    disabled={loading || phone.length < 11}
                    className="w-full flex items-center justify-center gap-2 py-3 clay-btn-primary text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <span>دریافت کد تایید</span>
                        <ArrowLeft size={16} />
                      </>
                    )}
                  </button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-subtle"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 clay-surface text-zinc-500 rounded-full">یا سایر روش‌های ورود</span>
                    </div>
                  </div>

                  {/* Switch to Email Mode */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('email');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 clay-btn text-zinc-700 dark:text-zinc-200 rounded-xl font-bold transition-all text-xs sm:text-sm border border-subtle"
                  >
                    <Mail size={16} className="text-zinc-500" />
                    <span>ورود با ایمیل و رمز عبور</span>
                  </button>

                  {/* 1-Click Social Logins */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={() => setError('ورود با گوگل لغو شد یا با خطا مواجه شد.')} loading={loading} />
                    <TelegramLoginButton onClick={handleTelegramLogin} loading={loading} />
                  </div>
                </form>
              ) : (
                /* Step 2: Input 5-Digit OTP Code */
                <form noValidate ref={otpFormRef} onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                      <ShieldCheck size={24} />
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      کد تایید ۵ رقمی به شماره <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{phone}</span> پیامک شد.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('input');
                        setOtpCode('');
                        setError('');
                      }}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    >
                      ویرایش شماره موبایل
                    </button>
                  </div>

                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 text-center">
                      کد تایید پیامک‌شده
                    </label>
                    <div className="relative max-w-[220px] mx-auto">
                      <input
                        ref={otpInputRef}
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={otpCode ? toPersianDigits(otpCode) : ''}
                        onChange={e => {
                          const val = toEnglishDigits(e.target.value).replace(/[^\d]/g, '');
                          if (val.length <= 5) {
                            setOtpCode(val);
                            if (val.length === 5) {
                              setTimeout(() => {
                                otpFormRef.current?.requestSubmit();
                              }, 100);
                            }
                          }
                        }}
                        className="w-full text-center py-2.5 tracking-[0.4em] text-xl font-bold clay-input rounded-xl focus:outline-none transition-all text-zinc-900 dark:text-zinc-100"
                        style={{ fontFamily: "'Vazirmatn', sans-serif" }}
                        placeholder="•••••"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    id="btn-verify-otp"
                    type="submit"
                    disabled={loading || otpCode.length !== 5}
                    className="w-full flex items-center justify-center gap-2 py-3 clay-btn-primary text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    <span>تایید و ورود به سامانه</span>
                  </button>

                  {/* Resend OTP / Countdown */}
                  <div className="text-center pt-2">
                    {countdown > 0 ? (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                        ارسال مجدد کد پس از{' '}
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {Math.floor(countdown / 60).toString().padStart(2, '0')}:
                          {(countdown % 60).toString().padStart(2, '0')}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold"
                      >
                        <RefreshCw size={14} />
                        <span>ارسال مجدد کد تایید</span>
                      </button>
                    )}
                  </div>
                </form>
              )
            ) : (
              /* --- Email & Password Mode --- */
              <form noValidate onSubmit={handleEmailSubmit} className="space-y-4">
                {/* Switch between Login / Register tabs */}
                <div className="flex p-1 clay-surface rounded-xl border border-subtle mb-3">
                  <button
                    type="button"
                    onClick={() => { setIsEmailLogin(true); setError(''); setSuccessMsg(''); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${isEmailLogin ? 'clay-btn-primary text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                      }`}
                  >
                    ورود
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsEmailLogin(false); setError(''); setSuccessMsg(''); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${!isEmailLogin ? 'clay-btn-primary text-white shadow-sm' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                      }`}
                  >
                    ثبت‌ نام جدید
                  </button>
                </div>

                {!isEmailLogin && renderUserInfoFields()}

                <div>
                  <label className="block mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">ایمیل</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                      className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:outline-none transition-all text-zinc-900 dark:text-zinc-100 text-sm"
                      placeholder="example@mail.com"
                      required
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">رمز عبور</label>
                    {isEmailLogin && (
                      <button type="button" onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        فراموشی رمز عبور؟
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                      className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:outline-none transition-all text-zinc-900 dark:text-zinc-100 text-sm"
                      placeholder="حداقل ۶ کاراکتر"
                      required
                      dir="ltr"
                      minLength={6}
                    />
                  </div>
                </div>

                {renderStatusMessages()}
                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 clay-btn-primary text-white rounded-xl font-bold disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-sm"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : (isEmailLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
                  {isEmailLogin ? 'ورود به حساب کاربری' : 'تکمیل ثبت‌نام'}
                </button>

                {/* Back to Mobile OTP Mode */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('phone');
                      setPhoneStep('input');
                      setError('');
                      setSuccessMsg('');
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                  >
                    <Smartphone size={14} />
                    <span>ورود سریع با شماره موبایل (پیامک)</span>
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
