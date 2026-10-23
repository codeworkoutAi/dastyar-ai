import { Header } from '../../components/Header';
import { Sidebar } from '../../components/Sidebar';
import { ChatBox } from '../../components/ChatBox';
import { MessageInput } from '../../components/MessageInput';
import { ErrorCapsule } from '../../components/ErrorCapsule';
import { InfoCircleBoldIcon } from '@solar-icons/react';
import { useUIStore } from '../../store/uiStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { GuestLanding } from '../../components/GuestLanding';
import { CheckCircle2, XCircle, X, Wallet } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toPersianDigits } from '../../lib/persianUtils';

import { useEffect, useState } from 'react';
import { setPageSeo } from '../../lib/seo';

export function ChatApp() {
 const { videoNotice, metricsNotice, setIsWalletOpen } = useUIStore();
 const { conversations, activeId } = useChatStore();
 const isAuthenticated = useAuthStore(state => state.isAuthenticated);
 const checkAuth = useAuthStore(state => state.checkAuth);

 const [searchParams, setSearchParams] = useSearchParams();
 const [paymentBanner, setPaymentBanner] = useState<{ status: 'success' | 'failed'; message: string; sub?: string } | null>(null);

 useEffect(() => {
   const paymentStatus = searchParams.get('payment');
   if (paymentStatus === 'success') {
     checkAuth();
     const paymentAmount = searchParams.get('amount');
     const amtText = paymentAmount 
       ? `مبلغ ${toPersianDigits(Number(paymentAmount).toLocaleString('fa-IR'))} تومان به کیف پول شما افزوده شد.` 
       : 'کیف پول شما با موفقیت شارژ گردید.';
     setPaymentBanner({
       status: 'success',
       message: 'پرداخت با موفقیت انجام شد!',
       sub: amtText
     });
     const next = new URLSearchParams(searchParams);
     next.delete('payment');
     next.delete('orderId');
     next.delete('refId');
     next.delete('amount');
     next.delete('tab');
     setSearchParams(next, { replace: true });
   } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
     const paymentMsg = searchParams.get('msg');
     setPaymentBanner({
       status: 'failed',
       message: 'پرداخت ناموفق بود یا لغو شد.',
       sub: paymentMsg ? decodeURIComponent(paymentMsg) : undefined
     });
     const next = new URLSearchParams(searchParams);
     next.delete('payment');
     next.delete('orderId');
     next.delete('refId');
     next.delete('amount');
     next.delete('msg');
     next.delete('tab');
     setSearchParams(next, { replace: true });
   }
 }, [searchParams, checkAuth, setSearchParams]);

 useEffect(() => {
 setPageSeo({
 title: 'دستیار هوشمند | چت با هوش مصنوعی رایگان و پیشرفته',
 description: 'چت با هوش مصنوعی رایگان فارسی با مدل‌های ChatGPT، Claude و Gemini. جستجوی زنده وب، تولید تصویر و ابزارهای پیشرفته AI بدون نیاز به فیلترشکن.',
 canonical: window.location.origin + '/',
 schema: {
 '@context': 'https://schema.org',
 '@type': 'FAQPage',
 mainEntity: [
 {
 '@type': 'Question',
 name: 'آیا چت با هوش مصنوعی در دستیار هوشمند رایگان است؟',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'بله، استفاده از مدل‌های پیشرفته هوش مصنوعی در دستیار هوشمند کاملاً رایگان است و کاربران بدون نیاز به فیلترشکن یا شماره خارجی می‌توانند به گفت‌وگو بپردازند.'
 }
 },
 {
 '@type': 'Question',
 name: 'دستیار هوشمند از چه مدل‌های هوش مصنوعی پشتیبانی می‌کند؟',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'دستیار هوشمند از مدل‌های برتر دنیا نظیر ChatGPT (GPT-4o)، Claude 3.5 Sonnet، Gemini 2.0 Flash و DeepSeek پشتیبانی می‌کند و قابلیت انتخاب دستی یا مسیریابی هوشمند (Smart Routing) را دارد.'
 }
 },
 {
 '@type': 'Question',
 name: 'آیا امکان جستجوی آنلاین در وب و ساخت عکس با هوش مصنوعی وجود دارد؟',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'بله، این پلتفرم مجهز به جستجوی زنده وب (Google Search Grounding) برای دسترسی به اخبار و داده‌های روز و استودیوی تولید تصویر با مدل‌های هوش مصنوعی است.'
 }
 }
 ]
 }
 });
 }, []);

 const activeConversation = conversations.find(c => c.id === activeId);
 const isEmpty = !activeConversation || activeConversation.messages.length === 0;

 return (
 <div className="flex h-dvh overflow-hidden clay-app-bg">
 <Sidebar />
 <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 relative z-0">
 <Header />
 
 <main className={`flex-1 overflow-hidden flex flex-col relative h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] transition-all duration-500 ease-in-out ${isEmpty ? 'justify-center items-center' : ''}`}>
 
 {/* Payment Status Banner */}
 {paymentBanner && (
   <div className="absolute top-3 left-4 right-4 z-50 max-w-lg mx-auto animate-slideDown">
     <div className={`p-3.5 sm:p-4 rounded-2xl clay-card-thick border flex items-center justify-between gap-3 shadow-xl backdrop-blur-xl ${
       paymentBanner.status === 'success' 
         ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' 
         : 'bg-rose-500/10 dark:bg-rose-950/40 border-rose-500/30 text-rose-800 dark:text-rose-200'
     }`}>
       <div className="flex items-center gap-3">
         <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
           paymentBanner.status === 'success' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
         }`}>
           {paymentBanner.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
         </div>
         <div>
           <h4 className="font-bold text-xs sm:text-sm">{paymentBanner.message}</h4>
           {paymentBanner.sub && <p className="text-[11px] opacity-90 mt-0.5">{paymentBanner.sub}</p>}
         </div>
       </div>
       <div className="flex items-center gap-1.5 shrink-0">
         {paymentBanner.status === 'success' && (
           <button
             onClick={() => {
               setPaymentBanner(null);
               setIsWalletOpen(true);
             }}
             className="px-2.5 py-1.5 clay-btn-thick text-[11px] font-bold rounded-xl flex items-center gap-1 cursor-pointer"
           >
             <Wallet className="w-3.5 h-3.5" />
             <span>کیف پول</span>
           </button>
         )}
         <button
           onClick={() => setPaymentBanner(null)}
           className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
         >
           <X className="w-4 h-4" />
         </button>
       </div>
     </div>
   </div>
 )}

 <div className={`flex flex-col w-full transition-all duration-500 ease-in-out ${isEmpty ? 'opacity-0 h-0 flex-none overflow-hidden' : 'flex-1 opacity-100 overflow-hidden'}`}>
 <ChatBox />
 </div>
 
 <div className="flex-none w-full transition-all duration-500 ease-in-out pb-3 sm:pb-0 px-2 sm:px-0">
 <MessageInput />
 </div>
 
 <ErrorCapsule />

 {/* Floating Action Notices */}
 {metricsNotice && (
 <div className="absolute bottom-28 right-4 md:right-8 clay-surface dark:bg-black/95 text-zinc-900 dark:text-zinc-100 dark:text-zinc-300 border border-[var(--card-border)] dark:border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-xl flex items-center gap-3 animate-slideUp z-50">
 <InfoCircleBoldIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-400" />
 <span className="text-sm font-bold">{metricsNotice}</span>
 </div>
 )}
 
 {videoNotice && (
 <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500/90 text-white px-4 py-2 rounded-2xl backdrop-blur-md flex items-center gap-2 animate-bounce z-50 text-sm font-bold">
 <InfoCircleBoldIcon className="w-5 h-5" />
 <span>{videoNotice}</span>
 </div>
 )}
 </main>
 </div>
 </div>
 );
}
