import { ClayButton } from './ui/ClayButton';
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { X, Loader2, ArrowRight, Mail, Lock, LogIn, UserPlus, UserCircle, Check } from 'lucide-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';

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
 className="w-full flex items-center justify-center gap-2.5 py-2.5 clay-btn-secondary text-zinc-700 dark:text-zinc-200 rounded-xl font-medium transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
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
 className="w-full flex items-center justify-center gap-2.5 py-2.5 clay-surface hover:clay-surface text-[#229ED9] dark:clay-surface dark:hover:clay-surface border /30 rounded-xl font-medium shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
 >
 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
 </svg>
 <span>تلگرام</span>
 </ClayButton>
 );
}

export default function AuthModal() {
 const { isAuthModalOpen, setAuthModalOpen, login } = useAuthStore();
 // Form View State
 const [isEmailLogin, setIsEmailLogin] = useState(true);
 const [isForgotPassword, setIsForgotPassword] = useState(false);
 // User Info & Form Fields
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [selectedAvatar, setSelectedAvatar] = useState<string>('');
 const [resetToken, setResetToken] = useState('');
 // Telegram Auth State
 const [telegramWaiting, setTelegramWaiting] = useState(false);
 const [telegramToken, setTelegramToken] = useState('');
 const [telegramBotUrl, setTelegramBotUrl] = useState('');

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
 setIsForgotPassword(false);
 window.history.replaceState({}, '', window.location.pathname);
 }
 }, [setAuthModalOpen]);

 // Reset states on modal open
 useEffect(() => {
 if (isAuthModalOpen) {
 setEmail('');
 setPassword('');
 setName('');
 setError('');
 setSuccessMsg('');
 setTelegramWaiting(false);
 setTelegramToken('');
 if (!resetToken) {
 setIsForgotPassword(false);
 }
 }
 }, [isAuthModalOpen, resetToken]);

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
 // Network hiccup - ignore and keep checking
 }
 }, 1500);

 return () => clearInterval(interval);
 }, [telegramWaiting, telegramToken, login, setAuthModalOpen]);

 if (!isAuthModalOpen) return null;

 // Telegram Login Handler
 const handleTelegramLogin = async () => {
 setLoading(true);
 setError('');
 setSuccessMsg('');

 try {
 const res = await fetch('/api/auth/telegram/session', { method: 'POST' });
 const data = await res.json();

 if (!res.ok || !data.token) {
 throw new Error(data.error || 'خطا در برقراری ارتباط با ربات تلگرام');
 }

 setTelegramToken(data.token);
 setTelegramBotUrl(data.botUrl);
 setTelegramWaiting(true);

 // Open Telegram Bot in a new window/tab
 window.open(data.botUrl, '_blank');
 } catch (err: any) {
 setError(err.message || 'خطا در ارتباط با ربات تلگرام.');
 } finally {
 setLoading(false);
 }
 };

 // Email Submit Handler (Login or Register)
 const handleEmailSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 setError('');

 const endpoint = isEmailLogin ? '/api/auth/login' : '/api/auth/register';
 const payload = isEmailLogin ? { email, password }
 : { email, password, name, avatar: selectedAvatar || defaultAvatars[0] };

 try {
 const res = await fetch(endpoint, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload)
 });
 const data = await res.json();

 if (!res.ok) {
 setError(data.error || 'خطایی رخ داده است.');
 } else {
 login(data.user, data.token);
 setAuthModalOpen(false);
 }
 } catch (err) {
 setError('خطا در برقراری ارتباط با سرور.');
 } finally {
 setLoading(false);
 }
 };

 // Forgot Password Handler
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
 setSuccessMsg(data.message || 'لینک بازیابی رمز عبور ارسال شد.');
 setIsForgotPassword(false);
 }
 } catch (err) {
 setError('خطا در ارتباط با سرور.');
 } finally {
 setLoading(false);
 }
 };

 // Reset Password Handler
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
 setSuccessMsg(data.message || 'رمز عبور با موفقیت تغییر کرد.');
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

 // Google Login Success Handler
 const handleGoogleSuccess = async (token: string) => {
 setLoading(true);
 setError('');

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
 setAuthModalOpen(false);
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
 className={`relative rounded-full p-0.5 transition-all flex-shrink-0 ${
 (selectedAvatar === url || (!selectedAvatar && i === 0))
 ? 'ring-2 ring-blue-500 scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'
 }`}
 >
 <img src={url} alt={`avatar-${i}`} className="w-10 h-10 rounded-full shadow-md transition-all" />
 </ClayButton>
 ))}
 </div>
 </div>
 <div>
 <label className="block mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">نام نمایشی</label>
 <div className="relative">
 <UserCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
 <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ paddingRight: '2.85rem' }} className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100 text-sm"
 placeholder="مثال: علی رضایی"
 />
 </div>
 </div>
 </div>
 );

 return (
 <GoogleOAuthProvider clientId={clientId}>
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
 onClick={() => setAuthModalOpen(false)}
 />
 <div className="relative w-full max-w-md clay-modal overflow-hidden animate-in fade-in zoom-in-95 duration-200">
 {/* Header */}
 <div className="flex items-center justify-between p-5 border-b border-[var(--card-border)]">
 <div className="flex items-center gap-3">
 {(isForgotPassword || telegramWaiting) && (
 <ClayButton variant="text" onClick={() => {
 setIsForgotPassword(false);
 setTelegramWaiting(false);
 setError('');
 }}
 className="p-1.5 clay-icon-btn"
 >
 <ArrowRight size={20} />
 </ClayButton>
 )}
 <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">
 {telegramWaiting ? 'ورود با تلگرام'
 : resetToken ? 'تغییر رمز عبور' : (isForgotPassword ? 'بازیابی رمز عبور' : (isEmailLogin ? 'ورود به حساب کاربری' : 'ثبت‌نام حساب کاربری'))}
 </h2>
 </div>
 <ClayButton variant="text" onClick={() => setAuthModalOpen(false)}
 className="p-2 clay-icon-btn rounded-full"
 >
 <X size={18} />
 </ClayButton>
 </div>

 {/* Login / Register Tabs */}
 {!resetToken && !isForgotPassword && !telegramWaiting && (
 <div className="flex p-1.5 mx-6 mt-4 clay-surface-inset rounded-2xl">
 <ClayButton variant="text"
 type="button"
 onClick={() => { setIsEmailLogin(true); setError(''); setSuccessMsg(''); }}
 className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
 isEmailLogin ? 'clay-tab-active text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
 }`}
 >
 ورود
 </ClayButton>
 <ClayButton variant="text"
 type="button"
 onClick={() => { setIsEmailLogin(false); setError(''); setSuccessMsg(''); }}
 className={`flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
 !isEmailLogin ? 'clay-tab-active text-blue-600 dark:text-blue-400' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
 }`}
 >
 ثبت‌نام جدید
 </ClayButton>
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

 {/* Telegram Waiting Screen */}
 {telegramWaiting ? (
 <div className="text-center py-5 space-y-4">
 <div className="w-16 h-16 mx-auto rounded-2xl clay-surface flex items-center justify-center text-[#229ED9] animate-pulse shadow-sm">
 <svg className="w-9 h-9 fill-current" viewBox="0 0 24 24">
 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
 </svg>
 </div>
 <div className="space-y-1">
 <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">در انتظار تأیید در تلگرام...</h3>
 <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto leading-relaxed">
 ربات تلگرام باز شد. لطفاً در چت ربات روی دکمه <b>«تایید و ورود به سایت»</b> کلیک کنید.
 </p>
 </div>

 {/* VPN Notice */}
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
 className="w-full py-2.5 clay-surface hover:clay-surface text-white text-sm font-medium rounded-xl shadow-sm transition-all text-center"
 >
 باز کردن مجدد ربات تلگرام
 </a>
 <ClayButton variant="text"
 type="button"
 onClick={() => { setTelegramWaiting(false); setTelegramToken(''); }}
 className="w-full py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 text-xs font-medium transition-colors"
 >
 انصراف و بازگشت
 </ClayButton>
 </div>
 </div>
 ) : resetToken ? (
 /* Reset Password Form */
 <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
 <div>
 <label className="block mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">رمز عبور جدید</label>
 <div className="relative">
 <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
 <input type="password" value={password} onChange={e => setPassword(e.target.value)}
 className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100 text-sm"
 placeholder="حداقل ۶ کاراکتر"
 required
 dir="ltr"
 minLength={6}
 />
 </div>
 </div>

 <ClayButton variant="primary" type="submit" disabled={loading}
 className="w-full flex items-center justify-center gap-2 py-3  disabled:opacity-70 disabled:cursor-not-allowed text-sm"
 >
 {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
 تایید و تغییر رمز
 </ClayButton>
 </form>
 ) : isForgotPassword ? (
 /* Forgot Password Form */
 <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
 <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
 ایمیل حساب خود را وارد کنید تا لینک اختصاصی بازیابی رمز عبور برای شما ارسال شود.
 </p>
 <div>
 <label className="block mb-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">ایمیل</label>
 <div className="relative">
 <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
 <input type="email" value={email} onChange={e => setEmail(e.target.value)}
 className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100 text-sm"
 placeholder="example@mail.com"
 required
 dir="ltr"
 />
 </div>
 </div>

 <ClayButton variant="primary" type="submit" disabled={loading}
 className="w-full flex items-center justify-center gap-2 py-3  disabled:opacity-70 disabled:cursor-not-allowed text-sm"
 >
 {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
 ارسال لینک بازیابی
 </ClayButton>

 <div className="text-center pt-2">
 <ClayButton variant="text" type="button" onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
 className="text-xs text-zinc-500 dark:text-zinc-400 font-medium hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
 >
 بازگشت به صفحه ورود
 </ClayButton>
 </div>
 </form>
 ) : (
 /* Main Email / Password Form (Login & Register) */
 <form onSubmit={handleEmailSubmit} className="space-y-4">
 {/* 1-Click Social Logins at the top */}
 <div className="space-y-2.5">
 <span className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 text-center">ورود سریع با یک کلیک:</span>
 <div className="grid grid-cols-2 gap-2.5">
 <GoogleLoginButton onSuccess={handleGoogleSuccess} onError={() => setError('ورود با گوگل لغو شد یا با خطا مواجه شد.')}
 loading={loading}
 />
 <TelegramLoginButton onClick={handleTelegramLogin}
 loading={loading}
 />
 </div>
 </div>

 <div className="relative my-4">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-[var(--card-border)]"></div>
 </div>
 <div className="relative flex justify-center text-xs">
 <span className="px-3 text-zinc-400" style={{ background: 'var(--card-bg)' }}>یا با ایمیل و رمز عبور</span>
 </div>
 </div>

 {!isEmailLogin && renderUserInfoFields()}

 <div>
 <label className="block mb-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">ایمیل</label>
 <div className="relative">
 <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
 <input type="email" value={email} onChange={e => setEmail(e.target.value)}
 className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100 text-sm"
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
 <ClayButton variant="text" type="button" onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
 className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
 >
 فراموشی رمز عبور؟
 </ClayButton>
 )}
 </div>
 <div className="relative">
 <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
 <input type="password" value={password} onChange={e => setPassword(e.target.value)}
 className="w-full pl-3 pr-10 py-2.5 clay-input rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-zinc-900 dark:text-zinc-100 text-sm"
 placeholder="حداقل ۶ کاراکتر"
 required
 dir="ltr"
 minLength={6}
 />
 </div>
 </div>

 <ClayButton variant="primary" type="submit" disabled={loading}
 className="w-full flex items-center justify-center gap-2 py-3  disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2"
 >
 {loading ? <Loader2 size={18} className="animate-spin" /> : (isEmailLogin ? <LogIn size={18} /> : <UserPlus size={18} />)}
 {isEmailLogin ? 'ورود به حساب کاربری' : 'تکمیل ثبت‌نام'}
 </ClayButton>

 <div className="text-center pt-3 text-xs text-zinc-500 dark:text-zinc-400">
 {isEmailLogin ? 'حساب کاربری ندارید؟ ' : 'قبلاً ثبت‌نام کرده‌اید؟ '}
 <ClayButton variant="text" type="button" onClick={() => { setIsEmailLogin(!isEmailLogin); setError(''); setSuccessMsg(''); }}
 className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
 >
 {isEmailLogin ? 'ثبت‌نام کنید' : 'وارد شوید'}
 </ClayButton>
 </div>
 </form>
 )}
 </div>
 </div>
 </div>
 </GoogleOAuthProvider>
 );
}
