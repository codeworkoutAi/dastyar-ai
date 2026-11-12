import { ChatSeoContent } from '../../components/ChatSeoContent';
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
      title: 'چت با هوش مصنوعی فارسی رایگان و نامحدود | Dastyar AI',
      description: 'سوال دارید؟ همین حالا رایگان و نامحدود با هوش مصنوعی فارسی چت کنید؛ ۱۵ پیام بدون ثبت‌نام، پاسخ آنی به فارسی روان و دسترسی مستقیم از ایران.',
      canonical: window.location.origin + '/chat',
      schema: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'آیا چت با Dastyar AI رایگان است؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'بله. چت با مدل‌های پایه پس از ورود کاملاً رایگان و نامحدود است؛ برای مدل‌های پیشرفته از پرداخت به‌ازای مصرف استفاده می‌شود.'
            }
          },
          {
            '@type': 'Question',
            name: 'آیا باید ثبت‌نام کنم؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'برای ۱۵ پیام اول نیازی نیست. برای ادامه گفتگوی نامحدود و ذخیره تاریخچه، ثبت‌نام با شماره موبایل یا گوگل.'
            }
          },
          {
            '@type': 'Question',
            name: 'آیا می‌توانم هر سوالی به فارسی بپرسم؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'بله، هر سوالی دارید کافیست به فارسی بنویسید تا دستیار هوشمند پاسخ دقیق، مستقیم و روان به زبان فارسی ارائه دهد.'
            }
          },
          {
            '@type': 'Question',
            name: 'آیا پاسخ‌ها به فارسی هستند؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'بله. پاسخ‌ها به فارسی روان ارائه می‌شوند.'
            }
          },
          {
            '@type': 'Question',
            name: 'آیا از ایران قابل دسترسی است؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'بله، بدون محدودیت تحریمی.'
            }
          },
          {
            '@type': 'Question',
            name: 'آیا می‌توانم تاریخچه گفتگو را ذخیره کنم؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'بله، با ورود به حساب کاربری.'
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
 
 <main className="flex-1 overflow-hidden flex flex-col relative h-[calc(100dvh-4rem)] md:h-[calc(100dvh-5rem)] transition-all duration-500 ease-in-out">
  
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

  {isEmpty ? (
    <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col">
      <div className="min-h-[calc(100dvh-5rem)] flex flex-col justify-center items-center px-2 sm:px-4 py-6">
        <div className="w-full max-w-3xl text-center mb-4 px-2 space-y-1.5">
          <h1
            className="type-h2 font-black text-[var(--color-text-main)]"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            چت با هوش مصنوعی فارسی رایگان
          </h1>
          <p className="type-secondary text-[var(--color-text-muted)]">
            هر سوالی دارید به فارسی بپرسید — {toPersianDigits(15)} پیام بدون ورود و چت رایگان نامحدود پس از ورود
          </p>
        </div>
        <div className="w-full max-w-3xl">
          <MessageInput />
        </div>
      </div>
      <ChatSeoContent />
    </div>
  ) : (
    <div className="flex-1 w-full overflow-hidden flex flex-col">
      <div className="flex-1 opacity-100 overflow-hidden flex flex-col">
        <ChatBox />
      </div>
      <div className="flex-none w-full pb-3 sm:pb-0 px-2 sm:px-0">
        <MessageInput />
      </div>
    </div>
  )}

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
