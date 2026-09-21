import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Clock, ChevronRight, Share2, Send, PenTool, MessageCircle, Search, CalendarDays, Hash, ChevronDown, Check, LayoutGrid, List, AlignJustify, LayoutDashboard } from 'lucide-react';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { NeuralBanner } from '../../components/NeuralBanner';
import { Footer } from '../../components/Footer';
import { ThemeToggle } from '../../components/ThemeToggle';
import { setPageSeo } from '../../lib/seo';
import 'sahel-font/dist/font-face.css';

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

const formatDateTime = (dateString: string) => {
 const date = parseDbDate(dateString);
 const dDate = date.toLocaleDateString('fa-IR', { 
 timeZone: 'Asia/Tehran',
 year: 'numeric', 
 month: 'long', 
 day: 'numeric' 
 });
 const dTime = date.toLocaleTimeString('fa-IR', { 
 timeZone: 'Asia/Tehran',
 hour: '2-digit', 
 minute: '2-digit' 
 });
 return `${dDate}، ساعت ${dTime}`;
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

export function Blog() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const [news, setNews] = useState<NewsItem[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedPost, setSelectedPost] = useState<NewsItem | null>(null);

 // Filters State
 const [searchQuery, setSearchQuery] = useState('');
 const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
 const [selectedTag, setSelectedTag] = useState<string | null>(null);
 const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
 const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
 const [visibleCount, setVisibleCount] = useState(7);
 const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');

 // Reset pagination on filter change
 useEffect(() => {
 setVisibleCount(7);
 }, [searchQuery, timeFilter, selectedTag]);

 // Extract Unique Tags
 const uniqueTags = Array.from(new Set(news.flatMap(item => {
 try {
 const parsed = JSON.parse(item.tags || '[]');
 return Array.isArray(parsed) ? parsed : [];
 } catch {
 return [];
 }
 })));

 // Filter Logic
 const filteredNews = news.filter(item => {
 // Search Filter
 if (searchQuery) {
 const query = searchQuery.toLowerCase();
 if (!item.title.toLowerCase().includes(query) && !item.content.toLowerCase().includes(query)) {
 return false;
 }
 }
 
 // Tag Filter
 if (selectedTag) {
 try {
 const parsed = JSON.parse(item.tags || '[]');
 if (!Array.isArray(parsed) || !parsed.includes(selectedTag)) return false;
 } catch {
 return false;
 }
 }
 
 // Time Filter
 if (timeFilter !== 'all') {
 const itemDate = parseDbDate(item.createdAt);
 const now = new Date();
 
 if (timeFilter === 'today') {
 if (itemDate.toDateString() !== now.toDateString()) return false;
 } else if (timeFilter === 'week') {
 const weekAgo = new Date();
 weekAgo.setDate(now.getDate() - 7);
 if (itemDate < weekAgo) return false;
 } else if (timeFilter === 'month') {
 const monthAgo = new Date();
 monthAgo.setMonth(now.getMonth() - 1);
 if (itemDate < monthAgo) return false;
 } else if (timeFilter === 'year') {
 if (itemDate.getFullYear() !== now.getFullYear()) return false;
 }
 }
 
 return true;
 });

 const displayedNews = filteredNews.slice(0, visibleCount);

 useEffect(() => {
 let attempts = 0;
 let isMounted = true;

 const loadNews = () => {
 fetch('/api/news')
 .then(res => {
 if (!res.ok) throw new Error('خطا در دریافت اخبار');
 return res.json();
 })
 .then(data => {
 if (!isMounted) return;
 if (Array.isArray(data)) {
 setNews(data);
 if (id) {
 const found = data.find(item => item.id.toString() === id);
 if (found) setSelectedPost(found);
 }
 }
 setLoading(false);
 })
 .catch(err => {
 if (!isMounted) return;
 if (attempts < 2) {
 attempts++;
 setTimeout(loadNews, 1200);
 } else {
 console.error('Failed to load news', err);
 setLoading(false);
 }
 });
 };

 loadNews();

 return () => {
 isMounted = false;
 };
 }, [id]);

 useEffect(() => {
 if (selectedPost) {
 const cleanSnippet = (selectedPost.content || '')
 .replace(/[#*`_\[\]()\-!>]/g, '')
 .slice(0, 160)
 .trim();

 let postKeywords = 'هوش مصنوعی, اخبار فناوری';
 if (selectedPost.tags) {
 try {
 const parsed = JSON.parse(selectedPost.tags);
 if (Array.isArray(parsed) && parsed.length > 0) {
 postKeywords = parsed.join(', ');
 }
 } catch {}
 }

 const postCanonical = `${window.location.origin}/blog/${selectedPost.id}`;

 setPageSeo({
 title: `${selectedPost.title} | مجله هوش مصنوعی`,
 description: cleanSnippet || 'مقاله و خبر هوش مصنوعی در دستیار هوشمند',
 canonical: postCanonical,
 ogImage: selectedPost.image,
 ogType: 'article',
 schema: {
 '@context': 'https://schema.org',
 '@graph': [
 {
 '@type': 'BlogPosting',
 headline: selectedPost.title,
 description: cleanSnippet,
 image: selectedPost.image ? [selectedPost.image] : undefined,
 datePublished: selectedPost.createdAt,
 dateModified: selectedPost.createdAt,
 mainEntityOfPage: {
 '@type': 'WebPage',
 '@id': postCanonical
 },
 keywords: postKeywords,
 inLanguage: 'fa-IR',
 author: {
 '@type': 'Organization',
 name: 'دستیار هوشمند'
 },
 publisher: {
 '@type': 'Organization',
 name: 'دستیار هوشمند',
 logo: {
 '@type': 'ImageObject',
 url: `${window.location.origin}/pwa-512x512.png`
 }
 }
 },
 {
 '@type': 'BreadcrumbList',
 itemListElement: [
 { '@type': 'ListItem', position: 1, name: 'خانه', item: `${window.location.origin}/` },
 { '@type': 'ListItem', position: 2, name: 'مجله هوش مصنوعی', item: `${window.location.origin}/blog` },
 { '@type': 'ListItem', position: 3, name: selectedPost.title, item: postCanonical }
 ]
 }
 ]
 }
 });
 } else {
 setPageSeo({
 title: 'مجله و اخبار هوش مصنوعی | آخرین رویدادها، تحلیل‌ها و آموزش‌ها',
 description: 'تازه‌ترین اخبار هوش مصنوعی، بررسی مدل‌های جدید زبان طبیعی، مقالات و آموزش‌های تخصصی هوش مصنوعی به زبان فارسی.',
 canonical: `${window.location.origin}/blog`,
 ogType: 'website',
 schema: {
 '@context': 'https://schema.org',
 '@graph': [
 {
 '@type': 'Blog',
 name: 'مجله و اخبار هوش مصنوعی دستیار هوشمند',
 description: 'تازه‌ترین اخبار و مقالات تخصصی هوش مصنوعی به زبان فارسی',
 url: `${window.location.origin}/blog`,
 inLanguage: 'fa-IR',
 publisher: {
 '@type': 'Organization',
 name: 'دستیار هوشمند',
 logo: {
 '@type': 'ImageObject',
 url: `${window.location.origin}/pwa-512x512.png`
 }
 }
 },
 {
 '@type': 'BreadcrumbList',
 itemListElement: [
 { '@type': 'ListItem', position: 1, name: 'خانه', item: `${window.location.origin}/` },
 { '@type': 'ListItem', position: 2, name: 'مجله هوش مصنوعی', item: `${window.location.origin}/blog` }
 ]
 }
 ]
 }
 });
 }
 }, [selectedPost]);

 const handleBack = () => {
 if (selectedPost) {
 setSelectedPost(null);
 if (id) navigate('/blog', { replace: true });
 window.scrollTo({ top: 0, behavior: 'smooth' });
 } else {
 navigate('/');
 }
 };

 const shareOnTelegram = () => {
 const url = encodeURIComponent(window.location.href);
 const text = encodeURIComponent(selectedPost?.title || 'مقاله هوش مصنوعی');
 window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
 };

 const shareOnX = () => {
 const url = encodeURIComponent(window.location.href);
 const text = encodeURIComponent(selectedPost?.title || 'مقاله هوش مصنوعی');
 window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
 };

 return (
 <div className="flex flex-col min-h-screen clay-landing-bg transition-colors duration-300 font-sans">
 <header className="sticky top-0 z-40 clay-header backdrop-blur-xl border-b border-[var(--border-subtle)]">
 <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
{selectedPost ? (
  <span className="text-xl font-black bg-[var(--gemini-gradient)] bg-clip-text text-transparent flex items-center gap-2">
  مجله هوش مصنوعی
  </span>
  ) : (
  <h1 className="text-xl font-black bg-[var(--gemini-gradient)] bg-clip-text text-transparent flex items-center gap-2">
  <BookOpen size={24} className="text-[var(--color-accent-primary)]" />
  مجله هوش مصنوعی
  </h1>
  )}
 <div className="flex items-center gap-2.5">
            <Link 
              to="/dashboard"
              className="h-10 px-3.5 clay-btn flex items-center gap-2 text-sm font-bold text-[var(--color-text-main)] transition-all cursor-pointer hover:text-[var(--color-accent-primary)] dark:hover:text-[var(--color-accent-text)]"
              title="داشبورد کاربری"
              aria-label="داشبورد کاربری"
            >
              <LayoutDashboard size={17} />
              <span className="hidden sm:inline">داشبورد</span>
            </Link>

            <ThemeToggle 
              variant="clay" 
              className="!h-10 !w-10 !rounded-xl !p-0 flex items-center justify-center shrink-0" 
            />

            <button 
              onClick={handleBack}
              className="h-10 px-3.5 clay-btn flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-main)] transition-all cursor-pointer hover:text-[var(--color-accent-primary)] dark:hover:text-[var(--color-accent-text)]"
              title={selectedPost ? 'بازگشت به لیست اخبار' : 'بازگشت به چت'}
              aria-label={selectedPost ? 'بازگشت به لیست اخبار' : 'بازگشت به چت'}
            >
              {selectedPost ? (
                <>
                  <ChevronRight size={17} />
                  <span>بازگشت</span>
                </>
              ) : (
                <>
                  <Home size={17} />
                  <span className="hidden sm:inline">خانه</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

 <main className="flex-1 container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
 {!selectedPost && <NeuralBanner />}
 
 {loading ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
 </div>
 ) : selectedPost ? (
 <article className="max-w-3xl mx-auto animate-fadeIn">
{selectedPost.image && (
  <div className="mb-8 w-full overflow-hidden rounded-card shadow-sm border border-[var(--card-border)]  aspect-video">
  <img 
  src={selectedPost.image} 
  alt={selectedPost.title} 
  className="w-full h-full object-cover"
  />
  </div>
  )}
 
 <div className="mb-8 text-right">
 <h1 className="text-xl md:text-2xl font-black leading-snug mb-4 clay-news-title">
              {selectedPost.title}
            </h1>
 
 <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[var(--card-border)]  text-sm text-[#525d75] dark:text-[#9aa5bc]">
 <div className="flex flex-wrap items-center gap-4 md:gap-6">
 <div className="flex items-center gap-1.5">
 <PenTool size={16} className="text-emerald-600" />
 <span className="font-bold text-zinc-700 dark:text-zinc-300">هوش مصنوعی</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Clock size={16} />
 <span>{formatDateTime(selectedPost.createdAt)}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <BookOpen size={16} />
 <span>{getReadingTime(selectedPost.content)}</span>
 </div>
 </div>
 
<div className="flex items-center gap-2">
<button onClick={shareOnTelegram} className="p-2 bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] dark:bg-[var(--color-accent-primary)]/20 dark:text-[var(--color-accent-text)] rounded-badge hover:bg-[var(--color-accent-primary)]/20 dark:hover:bg-[var(--color-accent-primary)]/30 transition-colors">
<Send size={16} />
</button>
<button onClick={shareOnX} className="p-2 clay-surface rounded-badge text-[var(--color-text-muted)] dark:text-[var(--color-text-dim)] transition-colors">
<Share2 size={16} />
</button>
</div>
 </div>
 </div>
 
 <div className="font-reading prose prose-zinc dark:prose-invert max-w-none text-base text-zinc-700 dark:text-zinc-300 leading-relaxed
 prose-headings:font-bold prose-headings:tracking-tight prose-headings:font-display
 prose-h1:text-base md:prose-h1:text-lg 
 prose-h2:text-sm md:prose-h2:text-base 
 prose-h3:text-xs md:prose-h3:text-sm
 prose-p:mb-5 prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-img:rounded-2xl">
 <MarkdownRenderer content={selectedPost.content} />
 </div>

 {/* Tags Section */}
 {selectedPost.tags && (
 <div className="mt-8 flex flex-wrap gap-2">
 {(() => {
 try {
 const parsedTags = JSON.parse(selectedPost.tags);
 if (Array.isArray(parsedTags)) {
 return parsedTags.map((tag, idx) => (
 <Link 
 key={idx} 
 to={`/blog/tag/${encodeURIComponent(tag)}`}
 style={{ borderRadius: "10px" }} className="px-3.5 py-1.5 clay-btn text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-semibold transition-all border border-[var(--card-border)] "
 >
 #{tag}
 </Link>
 ));
 }
 } catch (e) {}
 return null;
 })()}
 </div>
 )}

 {/* CTA Banner */}
 <div className="mt-12 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-sm group">
 <div className="flex-1">
 <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white mb-2">
 سوالی درباره این خبر دارید؟
 </h3>
 <p className="text-sm text-[#525d75] dark:text-[#9aa5bc]">
 برای درک بهتر مفاهیم تخصصی این مقاله، با دستیار هوشمند ما گفتگو کنید!
 </p>
 </div>
 <Link 
 to="/" 
 className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md hover: hover:-translate-y-0.5"
 >
 <MessageCircle className="w-5 h-5" />
 شروع گفتگو
 </Link>
 </div>
 </article>
 ) : (
 <div className="space-y-8 animate-fadeIn">
 {/* Minimalist Inline Filter Toolbar */}
 <div style={{ borderRadius: "16px" }} className="flex flex-col md:flex-row items-center gap-3 clay-card-thick p-3 border border-[var(--card-border)] backdrop-blur-md mb-8 w-full max-w-4xl mx-auto relative z-30 shadow-sm">
 
 {/* Search Bar - Flex 1 to take remaining space */}
 <div style={{ borderRadius: "12px" }} className="relative flex-1 w-full clay-surface-inset flex items-center px-3">
 <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
 <Search className="h-4 w-4 text-zinc-400" />
 </div>
 <input
 type="text"
 id="searchQuery"
 name="search"
 placeholder="جستجو در اخبار..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="block w-full bg-transparent border-none py-2 pr-9 pl-4 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-0 focus:outline-none outline-none placeholder-zinc-500"
 />
 </div>

 <div className="h-px w-full md:h-8 md:w-px clay-btn-thick hidden md:block"></div>

 {/* View Mode Toggle */}
 <div style={{ borderRadius: "12px" }} className="flex items-center clay-surface p-1 shrink-0 border border-[var(--card-border)] ">
 <button
 onClick={() => setViewMode('grid')}
 className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'clay-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-[#525d75] dark:hover:text-zinc-300'}`}
 title="نمایش شبکه‌ای"
 >
 <LayoutGrid size={18} />
 </button>
 <button
 onClick={() => setViewMode('list')}
 className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'clay-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-[#525d75] dark:hover:text-zinc-300'}`}
 title="نمایش لیستی"
 >
 <List size={18} />
 </button>
 <button
 onClick={() => setViewMode('compact')}
 className={`p-1.5 rounded-lg transition-all ${viewMode === 'compact' ? 'clay-card text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-[#525d75] dark:hover:text-zinc-300'}`}
 title="نمایش فشرده"
 >
 <AlignJustify size={18} />
 </button>
 </div>

 <div className="h-px w-full md:h-8 md:w-px clay-btn-thick hidden md:block"></div>

 <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end relative">
 
 {/* Time Filter Dropdown */}
 <div className="relative">
 <button 
                  onClick={() => {
                    setTimeDropdownOpen(!timeDropdownOpen);
                    setTagDropdownOpen(false);
                  }}
                  style={{ borderRadius: "10px" }} className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold transition-all cursor-pointer ${timeFilter !== 'all' ? 'clay-btn bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'clay-btn text-zinc-700 dark:text-zinc-300'}`}
 >
 <CalendarDays size={16} />
 <span>{
 timeFilter === 'all' ? 'زمان' : 
 timeFilter === 'today' ? 'امروز' : 
 timeFilter === 'week' ? 'این هفته' : 
 timeFilter === 'month' ? 'این ماه' : 'امسال'
 }</span>
 <ChevronDown size={14} className={`transition-transform ${timeDropdownOpen ? 'rotate-180' : ''}`} />
 </button>

 {timeDropdownOpen && (
 <div className="absolute top-full right-0 mt-2 w-48 clay-card-thick rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
 {[
 { id: 'all', label: 'همه زمان‌ها' },
 { id: 'today', label: 'امروز' },
 { id: 'week', label: 'این هفته' },
 { id: 'month', label: 'این ماه' },
 { id: 'year', label: 'امسال' }
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => {
 setTimeFilter(tab.id as any);
 setTimeDropdownOpen(false);
 }}
 className="w-full text-right px-4 py-2.5 text-sm flex items-center justify-between hover:clay-surface dark:hover:bg-zinc-800/50 transition-colors"
 >
 <span className={timeFilter === tab.id ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}>{tab.label}</span>
 {timeFilter === tab.id && <Check size={16} className="text-emerald-600 dark:text-emerald-400" />}
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Tag Filter Dropdown */}
 {uniqueTags.length > 0 && (
 <div className="relative">
 <button 
                  onClick={() => {
                    setTagDropdownOpen(!tagDropdownOpen);
                    setTimeDropdownOpen(false);
                  }}
                  style={{ borderRadius: "10px" }} className={`flex items-center gap-2 px-3.5 py-2 text-sm font-semibold transition-all cursor-pointer ${selectedTag ? 'clay-btn bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'clay-btn text-zinc-700 dark:text-zinc-300'}`}
 >
 <Hash size={16} />
 <span>{selectedTag ? `#${selectedTag.substring(0, 10)}${selectedTag.length > 10 ? '...' : ''}` : 'برچسب‌ها'}</span>
 <ChevronDown size={14} className={`transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`} />
 </button>

 {tagDropdownOpen && (
 <div className="absolute top-full left-0 md:right-0 md:left-auto mt-2 w-56 clay-card-thick rounded-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-64 overflow-y-auto custom-scrollbar">
 <button
 onClick={() => {
 setSelectedTag(null);
 setTagDropdownOpen(false);
 }}
 className="w-full text-right px-4 py-2.5 text-sm flex items-center justify-between hover:clay-surface dark:hover:bg-zinc-800/50 transition-colors border-b border-[var(--card-border)] "
 >
 <span className={!selectedTag ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}>همه برچسب‌ها</span>
 {!selectedTag && <Check size={16} className="text-emerald-600 dark:text-emerald-400" />}
 </button>
 {uniqueTags.map((tag, idx) => (
 <button
 key={idx}
 onClick={() => {
 setSelectedTag(tag);
 setTagDropdownOpen(false);
 }}
 className="w-full text-right px-4 py-2.5 text-sm flex items-center justify-between hover:clay-surface dark:hover:bg-zinc-800/50 transition-colors"
 >
 <span className={selectedTag === tag ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}>#{tag}</span>
 {selectedTag === tag && <Check size={16} className="text-emerald-600 dark:text-emerald-400" />}
 </button>
 ))}
 </div>
 )}
 </div>
 )}
 
 </div>
 </div>

 {/* Results */}
 {displayedNews.length > 0 ? (
 <div className="space-y-12 animate-fadeIn">
 {/* Featured Post (Latest) - Only show if no search/filter to keep UI clean, or just always show first as featured */}
 <div 
 onClick={() => {
 setSelectedPost(displayedNews[0]);
 navigate(`/blog/${displayedNews[0].id}`);
 }}
 className="group cursor-pointer clay-card-elevated rounded-[32px] overflow-hidden hover:-translate-y-1.5 transition-all duration-300 flex flex-col md:flex-row"
 >
 {displayedNews[0].image ? (
 <div className="w-full md:w-1/2 aspect-square md:aspect-auto overflow-hidden relative">
 <img 
 src={displayedNews[0].image} 
 alt={displayedNews[0].title} 
 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
 />
 {displayedNews[0].id === news[0]?.id && (
 <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
 جدیدترین خبر
 </div>
 )}
 </div>
 ) : (
 <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/30 flex items-center justify-center">
 <BookOpen size={64} className="text-emerald-600/30" />
 </div>
 )}
 
 <div className="p-6 md:p-8 w-full md:w-1/2 flex flex-col justify-center">
 <h3 className="text-lg md:text-xl font-bold mb-5 clay-news-title leading-snug">
              {displayedNews[0].title}
            </h3>
 <p className="text-[#525d75] dark:text-[#9aa5bc] mb-4 line-clamp-3 text-xs md:text-sm leading-relaxed">
 {displayedNews[0].content.replace(/[*_#`\[\]]/g, '').substring(0, 200)}...
 </p>
 <div className="flex items-center gap-4 text-zinc-400 text-xs mt-auto font-medium">
 <div className="flex items-center gap-1.5">
 <Clock size={15} />
 <span>{formatDateTime(displayedNews[0].createdAt)}</span>
 </div>
 </div>
 </div>
 </div>

 {/* Grid/List/Compact for remaining posts */}
 {displayedNews.length > 1 && (
 <div className={
 viewMode === 'grid' ?"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" :"flex flex-col gap-4 md:gap-6"
 }>
 {displayedNews.slice(1).map((item) => (
 <div 
 key={item.id}
 onClick={() => {
 setSelectedPost(item);
 navigate(`/blog/${item.id}`);
 }}
 className={`group cursor-pointer clay-card-thick hover:clay-card-elevated hover:-translate-y-2 transition-all duration-300 overflow-hidden ${
                viewMode === 'grid' ? 'flex flex-col rounded-[28px]' : 
                viewMode === 'list' ? 'flex flex-col sm:flex-row rounded-[28px]' : 
                'flex flex-col sm:flex-row items-center p-4 md:p-5 rounded-2xl hover:-translate-y-1'
              }`}
 >
 
 {/* Image Logic */}
 {viewMode !== 'compact' && (
 <div className={
 viewMode === 'grid' ? "aspect-[16/9] w-full overflow-hidden relative shrink-0" : "aspect-video sm:aspect-square sm:w-48 overflow-hidden relative shrink-0"
 }>
 {item.image ? (
 <img 
 src={item.image} 
 alt={item.title} 
 className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
 />
 ) : (
 <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-50 dark:from-emerald-950/30 dark:to-teal-900/30 flex items-center justify-center">
 <BookOpen size={48} className="text-emerald-600/30" />
 </div>
 )}
 </div>
 )}
 
              {/* Content Logic */}
              <div className={
                viewMode === 'compact' ? "flex-1 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4" : "p-5 sm:p-6 flex-1 flex flex-col justify-between"
              }>
                <div className={viewMode === 'compact' ? "flex-1" : ""}>
                  <h3 className={`font-bold clay-news-title transition-all leading-snug ${
                    viewMode === 'compact' ? 'text-sm mb-1' : 'text-sm md:text-[15px] mb-5 sm:mb-6 line-clamp-2'
                  }`}>
                    {item.title}
                  </h3>
                  
                  {viewMode !== 'compact' && (
                    <p className="text-[#525d75] dark:text-[#9aa5bc] mb-3 line-clamp-3 text-xs leading-relaxed">
                      {item.content.replace(/[*_#`\[\]]/g, '').substring(0, 220)}...
                    </p>
                  )}
                </div>

 <div className={`flex items-center gap-4 text-zinc-400 font-medium ${
 viewMode === 'compact' ? 'text-xs shrink-0' : 'text-xs mt-auto'
 }`}>
 <div className="flex items-center gap-1.5">
 <Clock size={viewMode === 'compact' ? 14 : 14} />
 <span>{formatDateOnly(item.createdAt)}</span>
 </div>
 <div className="flex items-center gap-1.5">
 <BookOpen size={viewMode === 'compact' ? 14 : 14} />
 <span>{getReadingTime(item.content)}</span>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 
 {/* Load More Button */}
 {visibleCount < filteredNews.length ? (
 <div className="flex justify-center pt-8">
 <button
 onClick={() => setVisibleCount(prev => prev + 6)}
 className="px-8 py-3.5 clay-btn text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl transition-all shadow-sm active:scale-95 flex items-center gap-2 cursor-pointer"
 >
 مشاهده مقالات بیشتر
 <ChevronDown size={18} />
 </button>
 </div>
 ) : displayedNews.length > 0 && (
 <div className="flex justify-center pt-8 pb-4">
 <p className="text-sm text-zinc-400 dark:text-[#525d75] clay-surface px-6 py-2 rounded-full">
 شما تمام اخبار را خواندید! 🎉
 </p>
 </div>
 )}
 
 {/* End Results */}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center h-[40vh] opacity-50 clay-surface rounded-3xl border border-[var(--card-border)] backdrop-blur-sm">
 <div className="w-20 h-20 rounded-full clay-btn-thick flex items-center justify-center mb-6">
 <Search size={32} className="text-zinc-400" />
 </div>
 <h2 className="text-xl font-bold mb-2">نتیجه‌ای یافت نشد</h2>
 <p className="text-[#525d75]">مقاله‌ای با این مشخصات پیدا نکردیم.</p>
 <button 
 onClick={() => {
 setSearchQuery('');
 setTimeFilter('all');
 setSelectedTag(null);
 }}
 className="mt-4 px-6 py-2 clay-btn-thick hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-bold rounded-xl transition-colors"
 >
 پاک کردن فیلترها
 </button>
 </div>
 )}
 </div>
 )}
 </main>
 <Footer />
 </div>
 );
}
