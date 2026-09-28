import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import {
 Send,
 Twitter,
 Github,
 Bot,
 Sliders,
 BookOpen,
 MessageSquare,
 ShoppingBag,
 Mail,
 Info,
 Headphones,
 ShieldCheck,
 Sparkles,
 ArrowLeft
} from 'lucide-react';
import { toPersianDigits } from '../lib/persianUtils';

export function Footer() {
 const { setIsAboutOpen, setIsContactOpen, setIsSettingsOpen } = useUIStore();

 const [footerData, setFooterData] = useState({
 brandTitle: 'دستیار هوشمند',
 brandDesc: 'پنجره‌ای رو به آینده. همراه هوشمند شما برای خلق، یادگیری و کشف ناشناخته‌ها در دنیای بی‌کران هوش مصنوعی.',
 supportEmail: 'support@dastyarai.com',
 telegramChannel: 'https://t.me/dastyarai',
 copyrightText: 'دستیار هوشمند. تمامی حقوق محفوظ است.'
 });

 useEffect(() => {
 fetch('/api/landing-content')
 .then((r) => r.json())
 .then((d) => {
 if (d.footer && d.footer.brandTitle) {
 setFooterData(d.footer);
 }
 })
 .catch(() => {});
 }, []);

 return (
 <footer className="relative mt-20 pt-8 pb-12 overflow-hidden border-t border-black/5 dark:border-white/5 backdrop-blur-2xl">
 {/* Ambient background glow accents */}
 <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-36 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl pointer-events-none" />
 <div className="absolute top-0 right-1/4 translate-x-1/2 w-96 h-36 bg-amber-500/5 dark:bg-amber-500/10 blur-3xl pointer-events-none" />

 <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
 {/* Main Claymorphic Mega Card */}
 <div className="clay-card p-6 sm:p-10">
 <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-10">
 {/* 1. Brand & Description (Col 5) */}
 <div className="col-span-2 md:col-span-5 space-y-5 text-right">
 <div className="flex items-center gap-3.5">
 <div className="clay-debossed-socket p-1.5 rounded-2xl flex-shrink-0">
 <div className="clay-indigo w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-[0_4px_18px_rgba(99,102,241,0.45)]">
 <Bot className="w-6 h-6" />
 </div>
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2
 className="text-xl sm:text-2xl font-black text-zinc-800 dark:text-zinc-100 dark:text-white tracking-tight"
 style={{ fontFamily:"'Estedad', sans-serif" }}
 >
 {footerData.brandTitle || 'دستیار هوشمند'}
 </h2>
 <span className="clay-pill-thick text-[10px] font-black text-indigo-600 dark:text-indigo-400 px-2 py-0.5">
 نسخه ۲.۵
 </span>
 </div>
 <p className="text-[11px] font-bold text-[#64748b] dark:text-[#94a3b8] mt-0.5">
 هوش مصنوعی یکپارچه به زبان فارسی
 </p>
 </div>
 </div>

 <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] leading-relaxed max-w-md">
 {footerData.brandDesc}
 </p>

 {footerData.supportEmail && (
 <div className="pt-1">
 <a
 href={`mailto:${footerData.supportEmail}`}
 className="clay-btn-thick inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-mono text-zinc-800 dark:text-zinc-100 dark:text-[#e1e7f0] hover:text-[#2563eb] dark:hover:text-[#60a5fa] transition-all active:scale-95"
 dir="ltr"
 >
 <div className="clay-debossed-socket w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
 <Mail className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 </div>
 <span>{footerData.supportEmail}</span>
 </a>
 </div>
 )}
 </div>

 {/* 2. Quick Links (Col 2) */}
 <div className="col-span-1 md:col-span-2 space-y-4 text-right">
 <h3
 className="text-sm font-black text-zinc-800 dark:text-zinc-100 dark:text-white flex items-center gap-2"
 style={{ fontFamily:"'Estedad', sans-serif" }}
 >
 <Sparkles className="w-4 h-4 text-amber-500" />
 <span>دسترسی سریع</span>
 </h3>
 <ul className="space-y-2.5 text-xs sm:text-sm">
 <li>
 <Link
 to="/chat"
 className="group inline-flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-white transition-all"
 >
 <div className="clay-debossed-socket w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
 <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 </div>
 <span className="font-bold group-hover:-translate-x-1 transition-transform">چت هوشمند</span>
 </Link>
 </li>
 <li>
 <Link
 to="/blog"
 className="group inline-flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-white transition-all"
 >
 <div className="clay-debossed-socket w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
 <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
 </div>
 <span className="font-bold group-hover:-translate-x-1 transition-transform">مجله مقالات</span>
 </Link>
 </li>
 <li>
 <Link
 to="/store"
 className="group inline-flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-white transition-all"
 >
 <div className="clay-debossed-socket w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
 <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
 </div>
 <span className="font-bold group-hover:-translate-x-1 transition-transform">فروشگاه بسته</span>
 </Link>
 </li>
 </ul>
 </div>

 {/* 3. Platform & Services (Col 2) */}
 <div className="col-span-1 md:col-span-2 space-y-4 text-right">
 <h3
 className="text-sm font-black text-zinc-800 dark:text-zinc-100 dark:text-white flex items-center gap-2"
 style={{ fontFamily:"'Estedad', sans-serif" }}
 >
 <Headphones className="w-4 h-4 text-indigo-500" />
 <span>پلتفرم ما</span>
 </h3>
 <ul className="space-y-2.5 text-xs sm:text-sm">
 <li>
 <button
 onClick={() => setIsAboutOpen(true)}
 className="group inline-flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-white transition-all cursor-pointer"
 >
 <div className="clay-debossed-socket w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
 <Info className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
 </div>
 <span className="font-bold group-hover:-translate-x-1 transition-transform">درباره ما</span>
 </button>
 </li>
 <li>
 <button
 onClick={() => setIsContactOpen(true)}
 className="group inline-flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-white transition-all cursor-pointer"
 >
 <div className="clay-debossed-socket w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
 <Send className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
 </div>
 <span className="font-bold group-hover:-translate-x-1 transition-transform">ارتباط با ما</span>
 </button>
 </li>
 <li>
 <button
 onClick={() => setIsSettingsOpen(true)}
 className="group inline-flex items-center gap-2.5 text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-white transition-all cursor-pointer"
 >
 <div className="clay-debossed-socket w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
 <Sliders className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
 </div>
 <span className="font-bold group-hover:-translate-x-1 transition-transform">تنظیمات</span>
 </button>
 </li>
 </ul>
 </div>

 {/* 4. Trust Seal (eNamad) - Strictly Preserved (Col 3) */}
 <div className="col-span-2 md:col-span-3 space-y-3.5 text-right flex flex-col items-start mt-4 md:mt-0 pt-6 md:pt-0 border-t md:border-0 border-black/5 dark:border-white/5">
 <h3
 className="text-sm font-black text-zinc-800 dark:text-zinc-100 dark:text-white flex items-center gap-2"
 style={{ fontFamily:"'Estedad', sans-serif" }}
 >
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 <span>نماد اعتماد الکترونیکی</span>
 </h3>
 <div className="clay-debossed-socket p-3 rounded-2xl bg-white/70 dark:clay-surface inline-block transition-transform hover:scale-105">
 <a
 referrerPolicy="origin"
 target="_blank"
 rel="noreferrer"
 href="https://trustseal.enamad.ir/?id=7675736&Code=Gx87lRnRBjSnMfkfeXWDlWi88ZzK41Oj"
 className="inline-block"
 >
 <img
 referrerPolicy="origin"
 src="https://trustseal.enamad.ir/logo.aspx?id=7675736&Code=Gx87lRnRBjSnMfkfeXWDlWi88ZzK41Oj"
 alt="نماد تجارت الکترونیکی (اینماد)"
 style={{ cursor: 'pointer', width: '96px', height: 'auto' }}
 />
 </a>
 </div>

 <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8] font-medium leading-relaxed">
 پرداخت آنلاین امن با درگاه شاپرک و زرین‌پال
 </p>
 </div>

 </div>
 </div>

 {/* Bottom Bar: System Status, Copyright & Socials */}
 <div className="clay-card-thick px-5 sm:px-8 py-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
 {/* Copyright & Made with */}
 <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] font-medium text-center sm:text-right">
 <span>© {toPersianDigits(new Date().getFullYear().toString())}</span>
 <span>{footerData.copyrightText || 'دستیار هوشمند. تمامی حقوق محفوظ است.'}</span>
 </div>

 {/* Social Icons & Status Badge */}
 <div className="flex items-center gap-3.5">
 {/* System Status Pill */}
 <div className="clay-pill-thick px-3 py-1.5 inline-flex items-center gap-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
 <span>سیستم فعال</span>
 </div>

 {/* Social Buttons */}
 <div className="flex items-center gap-2">
 {footerData.telegramChannel && (
 <a
 href={
 footerData.telegramChannel.startsWith('http')
 ? footerData.telegramChannel
 : `https://t.me/${footerData.telegramChannel.replace('@', '')}`
 }
 target="_blank"
 rel="noreferrer"
 className="clay-btn-thick w-9 h-9 rounded-xl flex items-center justify-center text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 hover:scale-110 active:scale-95 transition-all shadow-[0_2px_10px_rgba(14,165,233,0.2)]"
 title="کانال تلگرام"
 >
 <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
 </a>
 )}
 <a
 href="https://twitter.com"
 target="_blank"
 rel="noreferrer"
 className="clay-btn-thick w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-white hover:scale-110 active:scale-95 transition-all"
 title="توییتر / X"
 >
 <Twitter className="w-4 h-4" />
 </a>
 <a
 href="https://github.com"
 target="_blank"
 rel="noreferrer"
 className="clay-btn-thick w-9 h-9 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400 dark:text-[#9aa5bc] hover:text-zinc-800 dark:text-zinc-100 dark:hover:text-white hover:scale-110 active:scale-95 transition-all"
 title="گیت‌هاب"
 >
 <Github className="w-4 h-4" />
 </a>
 </div>
 </div>

 </div>
 </div>
 </footer>
 );
}

