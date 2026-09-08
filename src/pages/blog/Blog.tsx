import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Clock, ChevronRight, Share2, Send, PenTool, MessageCircle, Search, CalendarDays, Hash, ChevronDown, Check, LayoutGrid, List, AlignJustify } from 'lucide-react';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { NeuralBanner } from '../../components/NeuralBanner';
import { Footer } from '../../components/Footer';
import { ThemeToggle } from '../../components/ThemeToggle';

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

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const dDate = date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  const dTime = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  return `${dDate}، ساعت ${dTime}`;
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
      const itemDate = new Date(item.createdAt);
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
    fetch('/api/news')
      .then(res => res.json())
      .then(data => {
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
        console.error('Failed to load news', err);
        setLoading(false);
      });
  }, [id]);

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
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-300 font-sans">
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
          <h1 className="text-xl font-black bg-gradient-to-l from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            {!selectedPost && <BookOpen size={24} className="text-emerald-600" />}
            مجله هوش مصنوعی
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle variant="minimal" />
            <button 
              onClick={handleBack}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors text-zinc-600 dark:text-zinc-400 flex items-center gap-2 text-sm font-bold cursor-pointer"
              title={selectedPost ? 'بازگشت به لیست اخبار' : 'بازگشت به چت'}
            >
              {selectedPost ? (
                <>
                  <span>بازگشت</span>
                  <ChevronRight size={18} />
                </>
              ) : (
                <Home size={22} />
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
              <div className="mb-8 w-full overflow-hidden rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800/50 aspect-video">
                <img 
                  src={selectedPost.image} 
                  alt={selectedPost.title} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="mb-8 text-right">
              <h1 className="text-lg md:text-xl font-black leading-snug mb-4 text-zinc-900 dark:text-white">
                {selectedPost.title}
              </h1>
              
              <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-zinc-200 dark:border-zinc-800/60 text-sm text-zinc-500 dark:text-zinc-400">
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
                  <button onClick={shareOnTelegram} className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
                    <Send size={16} />
                  </button>
                  <button onClick={shareOnX} className="p-2 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
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
                          className="px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-zinc-700 dark:text-zinc-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-sm font-medium transition-colors border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
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
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  برای درک بهتر مفاهیم تخصصی این مقاله، با دستیار هوشمند ما گفتگو کنید!
                </p>
              </div>
              <Link 
                to="/" 
                className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                شروع گفتگو
              </Link>
            </div>
          </article>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            {/* Minimalist Inline Filter Toolbar */}
            <div className="flex flex-col md:flex-row items-center gap-4 bg-white/50 dark:bg-zinc-900/40 p-2 md:p-3 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 backdrop-blur-md shadow-sm mb-8 w-full max-w-4xl mx-auto relative z-30">
              
              {/* Search Bar - Flex 1 to take remaining space */}
              <div className="relative flex-1 w-full">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-zinc-400" />
                </div>
                <input
                  type="text"
                  placeholder="جستجو در اخبار..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full bg-transparent border-none py-2 pr-9 pl-4 text-sm text-zinc-900 dark:text-zinc-100 focus:ring-0 focus:outline-none outline-none placeholder-zinc-500"
                />
              </div>

              <div className="h-px w-full md:h-8 md:w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl shrink-0">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                  title="نمایش شبکه‌ای"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                  title="نمایش لیستی"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'compact' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'}`}
                  title="نمایش فشرده"
                >
                  <AlignJustify size={18} />
                </button>
              </div>

              <div className="h-px w-full md:h-8 md:w-px bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end relative">
                
                {/* Time Filter Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => {
                      setTimeDropdownOpen(!timeDropdownOpen);
                      setTagDropdownOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${timeFilter !== 'all' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
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
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
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
                          className="w-full text-right px-4 py-2.5 text-sm flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${selectedTag ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
                    >
                      <Hash size={16} />
                      <span>{selectedTag ? `#${selectedTag.substring(0, 10)}${selectedTag.length > 10 ? '...' : ''}` : 'برچسب‌ها'}</span>
                      <ChevronDown size={14} className={`transition-transform ${tagDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {tagDropdownOpen && (
                      <div className="absolute top-full left-0 md:right-0 md:left-auto mt-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-64 overflow-y-auto custom-scrollbar">
                        <button
                          onClick={() => {
                            setSelectedTag(null);
                            setTagDropdownOpen(false);
                          }}
                          className="w-full text-right px-4 py-2.5 text-sm flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-zinc-100 dark:border-zinc-800"
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
                            className="w-full text-right px-4 py-2.5 text-sm flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
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
                  className="group cursor-pointer bg-white dark:bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row shadow-sm"
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
                    <h3 className="text-lg md:text-xl font-bold mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug text-zinc-900 dark:text-zinc-100">
                      {displayedNews[0].title}
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-3 text-xs md:text-sm leading-relaxed">
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
                    viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" :
                    "flex flex-col gap-4 md:gap-6"
                  }>
                    {displayedNews.slice(1).map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedPost(item);
                          navigate(`/blog/${item.id}`);
                        }}
                        className={`group cursor-pointer bg-white dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden ${
                          viewMode === 'grid' ? 'flex flex-col' : 
                          viewMode === 'list' ? 'flex flex-col sm:flex-row' : 
                          'flex flex-col sm:flex-row items-center p-4 md:p-5 hover:-translate-y-0.5'
                        }`}
                      >
                        
                        {/* Image Logic */}
                        {viewMode !== 'compact' && (
                          <div className={
                            viewMode === 'grid' ? "aspect-square w-full overflow-hidden relative shrink-0" : 
                            "aspect-video sm:aspect-square sm:w-48 overflow-hidden relative shrink-0"
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
                          viewMode === 'compact' ? "flex-1 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4" : 
                          "p-5 flex-1 flex flex-col justify-center"
                        }>
                          <div className={viewMode === 'compact' ? "flex-1" : ""}>
                            <h3 className={`font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug text-zinc-900 dark:text-zinc-100 ${
                              viewMode === 'compact' ? 'text-base mb-1' : 'text-sm md:text-base mb-2 line-clamp-2'
                            }`}>
                              {item.title}
                            </h3>
                            
                            {viewMode !== 'compact' && (
                              <p className="text-zinc-500 dark:text-zinc-400 mb-3 line-clamp-2 text-xs md:text-sm leading-relaxed">
                                {item.content.replace(/[*_#`\[\]]/g, '').substring(0, 150)}...
                              </p>
                            )}
                          </div>
                          
                          <div className={`flex items-center gap-4 text-zinc-400 font-medium ${
                            viewMode === 'compact' ? 'text-xs shrink-0' : 'text-xs mt-auto'
                          }`}>
                            <div className="flex items-center gap-1.5">
                              <Clock size={viewMode === 'compact' ? 14 : 14} />
                              <span>{new Date(item.createdAt).toLocaleDateString('fa-IR')}</span>
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
                  className="px-8 py-3 bg-white/50 dark:bg-zinc-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold rounded-2xl border border-emerald-200 dark:border-emerald-800/50 transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
                >
                  مشاهده مقالات بیشتر
                  <ChevronDown size={18} />
                </button>
              </div>
            ) : displayedNews.length > 0 && (
              <div className="flex justify-center pt-8 pb-4">
                <p className="text-sm text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-6 py-2 rounded-full">
                  شما تمام اخبار را خواندید! 🎉
                </p>
              </div>
            )}
            
            {/* End Results */}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[40vh] opacity-50 bg-white/30 dark:bg-zinc-900/30 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/30 backdrop-blur-sm">
              <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center mb-6">
                <Search size={32} className="text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">نتیجه‌ای یافت نشد</h2>
              <p className="text-zinc-500">مقاله‌ای با این مشخصات پیدا نکردیم.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setTimeFilter('all');
                  setSelectedTag(null);
                }}
                className="mt-4 px-6 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-sm font-bold rounded-xl transition-colors"
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
