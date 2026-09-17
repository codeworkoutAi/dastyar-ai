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

import { useEffect } from 'react';
import { setPageSeo } from '../../lib/seo';

export function ChatApp() {
 const { videoNotice, metricsNotice } = useUIStore();
 const { conversations, activeId } = useChatStore();
 const isAuthenticated = useAuthStore(state => state.isAuthenticated);

 useEffect(() => {
 setPageSeo({
 title: 'دستیار هوشمند | چت با هوش مصنوعی رایگان، فارسی و پیشرفته',
 description: 'چت‌باکس هوش مصنوعی فارسی با پشتیبانی از مدل‌های برتر (ChatGPT, Claude, Gemini)، جستجوی زنده وب، تولید تصویر، مجله اخبار هوش مصنوعی و فروشگاه اختصاصی.',
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
 text: 'بله، این پلتفرم مجهز به جستجوی زنده وب (Google Search Grounding) برای دسترسی به اخبار و داده‌های روز و استودیوی تولید تصویر با مدل‌های Flux و Stable Diffusion است.'
 }
 },
 {
 '@type': 'Question',
 name: 'فروشگاه هوش مصنوعی چه خدماتی ارائه می‌دهد؟',
 acceptedAnswer: {
 '@type': 'Answer',
 text: 'در فروشگاه دستیار هوشمند، اشتراک‌های قانونی ChatGPT Plus، کلیدهای اختصاصی API و آموزش‌های تخصصی هوش مصنوعی با امکان پرداخت ریالی و تحویل آنی عرضه می‌شوند.'
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
 <div className={`flex flex-col w-full transition-all duration-500 ease-in-out ${isEmpty ? 'opacity-0 h-0 flex-none overflow-hidden' : 'flex-1 opacity-100 overflow-hidden'}`}>
 <ChatBox />
 </div>
 
 <div className="flex-none w-full transition-all duration-500 ease-in-out">
 <MessageInput />
 </div>
 
 <ErrorCapsule />

 {/* Floating Action Notices */}
 {metricsNotice && (
 <div className="absolute bottom-28 right-4 md:right-8 bg-zinc-50 dark:bg-zinc-900/95 dark:bg-black/95 text-zinc-900 dark:text-zinc-100 dark:text-zinc-300 border border-[var(--card-border)] dark:border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-xl flex items-center gap-3 animate-slideUp z-50">
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
