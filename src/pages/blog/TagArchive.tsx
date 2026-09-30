import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Clock, ChevronRight, Hash, MessageCircle, LayoutDashboard } from 'lucide-react';
import { NeuralBanner } from '../../components/NeuralBanner';
import { Footer } from '../../components/Footer';
import { GlobalHeader } from '../../components/GlobalHeader';
import { setPageSeo } from '../../lib/seo';

interface NewsItem {
 id: number;
 title: string;
 content: string;
 image?: string;
 createdAt: string;
 tags?: string;
}

const getReadingTime = (text: string) => {
 const words = text.split(/\s+/).length;
 const minutes = Math.max(1, Math.ceil(words / 200));
 return `${minutes} دقیقه`;
};

const parseDbDate = (dateString: string): Date => {
 if (!dateString) return new Date();
 let str = dateString.trim();
 if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
 str = str.replace(' ', 'T') + 'Z';
 } else if (!str.endsWith('Z') && !str.includes('+') && str.includes('T')) {
 str = str + 'Z';
 }
 return new Date(str);
};

const formatDateOnly = (dateString: string) => {
 const date = parseDbDate(dateString);
 return date.toLocaleDateString('fa-IR', { 
 timeZone: 'Asia/Tehran',
 year: 'numeric', 
 month: 'long', 
 day: 'numeric' 
 });
};

export function TagArchive() {
 const { tagName } = useParams<{ tagName: string }>();
 const navigate = useNavigate();
 const [news, setNews] = useState<NewsItem[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 if (!tagName) return;
 const tagCanonical = `${window.location.origin}/blog/tag/${encodeURIComponent(tagName)}`;
 setPageSeo({
 title: `مقالات برچسب ${tagName} | مجله هوش مصنوعی`,
 description: `مجموعه اخبار، مقالات و رویدادهای مرتبط با ${tagName} در مجله هوش مصنوعی دستیار هوشمند.`,
 canonical: tagCanonical,
 ogType: 'website',
 schema: {
 '@context': 'https://schema.org',
 '@graph': [
 {
 '@type': 'CollectionPage',
 name: `مقالات برچسب ${tagName}`,
 description: `مجموعه مقالات هوش مصنوعی با برچسب ${tagName}`,
 url: tagCanonical
 },
 {
 '@type': 'BreadcrumbList',
 itemListElement: [
 { '@type': 'ListItem', position: 1, name: 'خانه', item: `${window.location.origin}/` },
 { '@type': 'ListItem', position: 2, name: 'مجله هوش مصنوعی', item: `${window.location.origin}/blog` },
 { '@type': 'ListItem', position: 3, name: tagName, item: tagCanonical }
 ]
 }
 ]
 }
 });
 setLoading(true);
 fetch(`/api/news/tag/${encodeURIComponent(tagName)}`)
 .then(res => res.json())
 .then(data => {
 if (Array.isArray(data)) {
 setNews(data);
 }
 setLoading(false);
 })
 .catch(err => {
 console.error('Failed to load news for tag', err);
 setLoading(false);
 });
 }, [tagName]);

 return (
 <div className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300 font-sans">
 <GlobalHeader />

 <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
 {/* Interactive Prompt Banner */}
 <div className="mb-12 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-sm">
 <div className="flex-1">
 <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-2">
 <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-xl text-sm font-mono">#{tagName}</span>
 </h2>
 <p className="text-sm md:text-base text-[#525d75] dark:text-[#9aa5bc]">
 درباره {tagName} کنجکاو هستید؟ همین حالا با هوش مصنوعی گفتگو کنید و سوالات خود را بپرسید!
 </p>
 </div>
 <Link 
 to={`/?prompt=${encodeURIComponent('درباره ' + (tagName || '') + ' بیشتر توضیح بده')}`}
 className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md hover: hover:-translate-y-0.5 w-full md:w-auto justify-center"
 >
 <MessageCircle className="w-5 h-5" />
 شروع گفتگو با هوش مصنوعی
 </Link>
 </div>

 {loading ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
 </div>
 ) : news.length > 0 ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {news.map((item) => (
 <div 
 key={item.id}
 onClick={() => navigate(`/blog/${item.id}`)}
 className="group cursor-pointer clay-card-thick hover:clay-card-elevated hover:-translate-y-2 rounded-[28px] overflow-hidden transition-all duration-300 flex flex-col"
 >
 {item.image ? (
 <div className="aspect-[16/9] w-full overflow-hidden relative">
 <img loading="lazy" decoding="async" src={item.image} 
 alt={item.title} 
 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
 />
 </div>
 ) : (
 <div className="aspect-[16/9] w-full bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/30 flex items-center justify-center">
 <BookOpen size={48} className="text-emerald-600/30" />
 </div>
 )}
 
 <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
 <div>
 <h3 className="type-h3 mb-4 sm:mb-5 clay-news-title line-clamp-2">
 {item.title}
 </h3>
 <p className="text-[#525d75] dark:text-[#9aa5bc] mb-4 line-clamp-3 type-secondary">
 {item.content.replace(/[*_#`\[\]]/g, '').substring(0, 220)}...
 </p>
 </div>
 <div className="flex items-center gap-4 text-zinc-400 type-meta mt-auto">
 <div className="flex items-center gap-1.5">
 <Clock size={14} />
 <span>{formatDateOnly(item.createdAt)}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <BookOpen size={14} />
 <span>{getReadingTime(item.content)}</span>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-[40vh] opacity-50">
 <div className="w-24 h-24 rounded-full clay-btn-thick flex items-center justify-center mb-6">
 <Hash size={48} className="text-zinc-400" />
 </div>
 <h2 className="text-xl font-bold mb-2">مقاله‌ای یافت نشد</h2>
 <p className="text-[#525d75]">مقاله‌ای با این تگ منتشر نشده است.</p>
 </div>
 )}
 </main>
 <Footer />
 </div>
 );
}
