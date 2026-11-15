import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, RefreshCw, Send, AlertCircle, CheckCircle2, 
  X, Image as ImageIcon, Sparkles, ExternalLink, Search, Clock, FileText, Wand2, Lightbulb, BookOpen
} from 'lucide-react';
import { AddSquareOutlineIcon, BoxLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../../store/authStore';
import { formatTehranDate } from '../../lib/dateUtils';

interface NewsItem {
  id: number;
  title: string;
  summary?: string;
  content: string;
  image?: string;
  tags?: string;
  slug?: string;
  source?: string;
  sourceUrl?: string;
  createdAt: string;
}

export const AdminNewsTab: React.FC = () => {
  const { token } = useAuthStore();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Compose / Edit state
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [postType, setPostType] = useState<'guide' | 'news'>('guide');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [tags, setTags] = useState('مقالات آموزشی, آموزش, راهنما');
  const [rebroadcastTelegram, setRebroadcastTelegram] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // AI Educational Guide Generator state
  const [guideTopic, setGuideTopic] = useState('');
  const [guideLoading, setGuideLoading] = useState(false);

  const GUIDE_IDEAS = [
    '۵ ترفند شگفت‌انگیز اکسل با هوش مصنوعی',
    'راهنمای گام‌به‌گام نوشتن رزومه حرفه‌ای',
    'پرامپت‌نویسی دقیق برای کارهای روزمره',
    'یادگیری مکالمه زبان انگلیسی با هوش مصنوعی',
    'خلاصه‌سازی اسناد و کتاب‌های طولانی',
    'برنامه‌ریزی هفتگی و افزایش بهره‌وری فردی'
  ];

  const handleGenerateGuide = async (topicToUse?: string) => {
    const topic = topicToUse !== undefined ? topicToUse : guideTopic;
    try {
      setGuideLoading(true);
      setIsAdding(true);
      const res = await fetch('/api/news/admin/generate-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topic: topic.trim() || undefined })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تولید مقاله');
      
      const g = data.guide;
      setPostType('guide');
      setTitle(g.title);
      setSlug(g.slug || '');
      setContent(g.content);
      const generatedTags = Array.isArray(g.tags) ? g.tags : ['مقالات آموزشی', 'آموزش', 'راهنما'];
      if (!generatedTags.includes('مقالات آموزشی')) generatedTags.unshift('مقالات آموزشی');
      setTags(generatedTags.join(', '));
      if (g.image) setImage(g.image);
      showFeedback(`مقاله آموزشی «${g.title}» با موفقیت تولید و در بخش مقالات آموزشی درج شد. می‌توانید بررسی و منتشر کنید.`, 'success');
    } catch (err: any) {
      showFeedback(err.message || 'خطا در تولید مقاله هوشمند', 'error');
    } finally {
      setGuideLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('خطا در دریافت لیست مقالات');
      const data = await res.json();
      setNews(data);
    } catch (err: any) {
      showFeedback(err.message || 'خطای سرور', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerCron = async () => {
    try {
      setTriggerLoading(true);
      const res = await fetch('/api/news/admin/trigger', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در اجرای فرآیند اخبار');

      showFeedback('فرآیند استخراج اخبار از RSS و بازنویسی با موفقیت اجرا شد.');
      await fetchNews();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setTriggerLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      showFeedback('حجم تصویر نباید بیشتر از ۲۰۰ کیلوبایت باشد. ترجیحاً از فرمت بهینه WebP استفاده کنید.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditClick = (item: NewsItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setSlug(item.slug || '');
    setContent(item.content);
    setImage(item.image || '');
    const isGuide = item.source === 'guide' || (item.tags && (item.tags.includes('آموزش') || item.tags.includes('مقالات آموزشی')));
    setPostType(isGuide ? 'guide' : 'news');
    let formattedTags = item.tags || '';
    try {
      const parsed = JSON.parse(formattedTags);
      if (Array.isArray(parsed)) formattedTags = parsed.join(', ');
    } catch {}
    setTags(formattedTags || (isGuide ? 'مقالات آموزشی, آموزش, راهنما' : 'اخبار, هوش مصنوعی'));
    setRebroadcastTelegram(false);
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingItem(null);
    setPostType('guide');
    setTitle('');
    setSlug('');
    setContent('');
    setImage('');
    setTags('مقالات آموزشی, آموزش, راهنما');
    setRebroadcastTelegram(false);
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showFeedback('عنوان و متن مقاله اجباری است.', 'error');
      return;
    }

    try {
      setSaveLoading(true);
      const url = editingItem ? `/api/news/${editingItem.id}` : '/api/news';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          image: image.trim() || undefined,
          tags: tags.trim() || undefined,
          slug: slug.trim() || undefined,
          source: postType === 'guide' ? 'guide' : 'news',
          rebroadcastTelegram
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در ذخیره مطلب');

      showFeedback(editingItem ? 'مطلب با موفقیت ویرایش شد.' : 'مطلب جدید با موفقیت منتشر شد.');
      resetForm();
      fetchNews();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('آیا از حذف این مقاله مطمئن هستید؟')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در حذف خبر');
      }
      showFeedback('مطلب با موفقیت حذف شد.');
      fetchNews();
    } catch (err: any) {
      showFeedback(err.message, 'error');
      setLoading(false);
    }
  };

  const filteredNews = news.filter((item) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        (item.tags && item.tags.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] shadow-xl min-w-[320px] p-4 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm font-black animate-slideUpScale ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30' 
            : 'bg-red-500/15 text-red-500 border border-red-500/30'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-main)]">مدیریت مجله و مقالات هوش مصنوعی</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">انتشار خودکار از RSS، بازنویسی، وب‌پی و ارسال به کانال تلگرام</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleGenerateGuide()}
            disabled={guideLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 clay-btn font-bold text-xs rounded-xl transition-all text-purple-600 dark:text-purple-400 hover:scale-105 active:scale-95"
            title="تولید فوری یک مقاله آموزشی و کاربردی هوش مصنوعی"
          >
            <Wand2 className={`w-3.5 h-3.5 ${guideLoading ? 'animate-spin' : ''}`} />
            <span>{guideLoading ? 'در حال نگارش هوشمند...' : '✨ تولید مقاله هوشمند با AI'}</span>
          </button>

          <button
            onClick={handleTriggerCron}
            disabled={triggerLoading}
            className="flex items-center gap-1.5 px-4 py-2.5 clay-btn font-bold text-xs rounded-xl transition-all"
            title="اجرای فوری دریافت اخبار از RSS و بازنویسی با مدل هوشمند"
          >
            <Sparkles className={`w-3.5 h-3.5 text-purple-500 ${triggerLoading ? 'animate-spin' : ''}`} />
            <span>{triggerLoading ? 'در حال دریافت...' : 'دریافت فوری RSS'}</span>
          </button>

          <button
            onClick={fetchNews}
            disabled={loading}
            className="p-2.5 clay-btn rounded-xl transition-all"
            title="بروزرسانی لیست مقالات"
          >
            <RefreshCw className={`w-4 h-4 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              if (isAdding) resetForm();
              else setIsAdding(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 clay-btn-primary font-bold text-xs rounded-xl transition-all"
          >
            <AddSquareOutlineIcon className="w-4 h-4" />
            {isAdding ? 'انصراف' : 'نگارش مقاله جدید'}
          </button>
        </div>
      </div>

      {/* Add / Edit Article Form */}
      {isAdding && (
        <div className="p-6 rounded-2xl clay-card-thick border border-[var(--color-accent-primary)]/30 animate-fadeIn">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--card-border)]">
            <h4 className="text-base font-black text-[var(--text-main)]">
              {editingItem ? `ویرایش مقاله #${editingItem.id}` : 'نگارش و انتشار مقاله جدید'}
            </h4>
            <button onClick={resetForm} className="p-1.5 clay-btn rounded-lg text-[var(--text-dim)]">
              <X size={16} />
            </button>
          </div>

          {/* AI Educational Guide Generator Panel */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-l from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-black text-[var(--text-main)]">
                  دستیار هوشمند نگارش مقالات آموزشی و ترفندهای کاربردی
                </span>
              </div>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">
                نگارش محاوره‌ای و روان
              </span>
            </div>

            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              تولید مقالات آموزشی عمیق و خواندنی درباره نحوه استفاده از هوش مصنوعی در زندگی روزمره، مهارت‌های فردی، اکسل، رزومه و پرامپت‌های آماده:
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={guideTopic}
                onChange={(e) => setGuideTopic(e.target.value)}
                placeholder="موضوع دلخواه خود را بنویسید (یا از پیشنهادهای زیر انتخاب کنید)..."
                className="flex-1 px-3.5 py-2 rounded-xl clay-surface text-xs outline-none font-bold"
              />
              <button
                type="button"
                onClick={() => handleGenerateGuide()}
                disabled={guideLoading}
                className="flex items-center justify-center gap-1.5 px-5 py-2 clay-btn-primary rounded-xl font-bold text-xs text-white disabled:opacity-50 shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 ${guideLoading ? 'animate-spin' : ''}`} />
                <span>{guideLoading ? 'در حال تولید مقاله...' : 'تولید مقاله با AI'}</span>
              </button>
            </div>

            {/* Quick Idea Pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-[var(--text-dim)] flex items-center gap-1 shrink-0">
                <Lightbulb size={12} className="text-amber-500" />
                ایده‌های پیشنهادی:
              </span>
              {GUIDE_IDEAS.map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => {
                    setGuideTopic(idea);
                    handleGenerateGuide(idea);
                  }}
                  disabled={guideLoading}
                  className="text-[10px] px-2.5 py-1 rounded-lg clay-surface hover:text-purple-500 hover:border-purple-500/30 transition-all font-bold cursor-pointer disabled:opacity-50"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSaveArticle} className="space-y-4">
            {/* Category / Section Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">بخش و دسته‌بندی انتشار در وبلاگ *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPostType('guide');
                    if (!tags.includes('مقالات آموزشی')) {
                      setTags('مقالات آموزشی, آموزش, راهنما, کاربرد هوش مصنوعی');
                    }
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-black transition-all cursor-pointer ${
                    postType === 'guide'
                      ? 'clay-btn-primary text-white border-transparent shadow-md'
                      : 'clay-surface text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'
                  }`}
                >
                  <BookOpen size={16} />
                  <span>📚 بخش مقالات آموزشی و راهنماها</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPostType('news');
                    setTags('اخبار, هوش مصنوعی, رویداد');
                  }}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-black transition-all cursor-pointer ${
                    postType === 'news'
                      ? 'clay-btn-primary text-white border-transparent shadow-md'
                      : 'clay-surface text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]'
                  }`}
                >
                  <Sparkles size={16} />
                  <span>📰 بخش اخبار هوش مصنوعی</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">عنوان مقاله یا خبر *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان جذاب برای مقاله..."
                className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none font-bold"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">شناسه انگلیسی آدرس (URL Slug - اختیاری برای سئو)</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="مثال: how-to-use-ai-for-excel"
                className="w-full px-4 py-2 rounded-xl clay-surface text-xs font-mono outline-none text-left"
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-main)]">متن کامل مقاله (پشتیبانی از Markdown و تیترها) *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="متن کامل خبر، تحلیل یا آموزش همراه با قالب‌بندی مارک‌داون..."
                className="w-full px-4 py-3 rounded-xl clay-surface text-sm outline-none leading-relaxed font-mono custom-scrollbar"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tags */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-main)]">برچسب‌ها (با کاما جدا کنید)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="news, prompt, tools"
                  className="w-full px-4 py-2.5 rounded-xl clay-surface text-xs outline-none font-mono"
                  dir="ltr"
                />
              </div>

              {/* Cover Image Upload / URL */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-main)]">تصویر کاور (فرمت WebP حداکثر ۱۰۰KB)</label>
                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>حذف تصویر</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {image ? (
                    <img
                      src={image}
                      alt="پیش‌نمایش کاور"
                      className="w-12 h-10 object-cover rounded-xl border border-[var(--card-border)] shrink-0 shadow-sm"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  ) : null}

                  {image.startsWith('data:image/') ? (
                    <div className="flex-1 px-4 py-2.5 rounded-xl clay-surface text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>✓ تصویر آپلود و بهینه شد (Base64)</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        ~{Math.round(image.length * 0.75 / 1024)} KB
                      </span>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      placeholder="/default-news-cover.webp یا https://..."
                      className="flex-1 px-4 py-2.5 rounded-xl clay-surface text-xs outline-none font-mono text-left"
                      dir="ltr"
                    />
                  )}

                  <label className="px-3.5 py-2.5 clay-btn rounded-xl text-xs font-bold cursor-pointer shrink-0">
                    <span>{image ? 'تغییر فایل' : 'انتخاب فایل'}</span>
                    <input type="file" accept="image/webp,image/png,image/jpeg" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
            </div>

            {/* Telegram Broadcast checkbox */}
            <label className="flex items-center gap-2 pt-2 cursor-pointer select-none text-xs font-bold text-[var(--text-main)]">
              <input
                type="checkbox"
                checked={rebroadcastTelegram}
                onChange={(e) => setRebroadcastTelegram(e.target.checked)}
                className="w-4 h-4 rounded text-blue-500 focus:ring-0 cursor-pointer"
              />
              <span>ارسال فوری این مقاله به کانال رسمی تلگرام پس از ثبت</span>
            </label>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 clay-btn text-xs font-bold rounded-xl"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-2.5 clay-btn-primary text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {saveLoading ? 'در حال ثبت...' : editingItem ? 'ذخیره تغییرات' : 'انتشار مقاله'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Input */}
      <div className="p-4 rounded-2xl clay-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs font-bold text-[var(--text-muted)]">
          مجموع مقالات ثبت‌شده: <span className="font-black text-[var(--text-main)]">{news.length} مطلب</span>
        </span>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان یا متن مقالات..."
            className="w-full pr-10 pl-4 py-2 rounded-xl clay-surface text-xs outline-none transition-all placeholder:text-[var(--text-dim)]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)] hover:text-[var(--text-main)]"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* News Cards Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 clay-subcard rounded-2xl">
          <div className="w-8 h-8 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs text-[var(--text-muted)] font-bold">در حال بارگذاری مقالات...</span>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 clay-card rounded-2xl opacity-60">
          <BoxLinearIcon className="w-12 h-12 text-[var(--text-dim)]" />
          <span className="text-sm font-bold text-[var(--text-main)]">مطلبی یافت نشد.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNews.map((item) => (
            <div key={item.id} className="clay-card rounded-2xl overflow-hidden flex flex-col group relative">
              {/* Top Action Hover Bar */}
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--card-bg)]/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-[var(--card-border)]">
                <button
                  type="button"
                  onClick={() => handleEditClick(item)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-blue-500 rounded-lg transition-colors"
                  title="ویرایش مقاله"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteArticle(item.id)}
                  className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-colors"
                  title="حذف مقاله"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Cover Image */}
              <div className="w-full aspect-video bg-[var(--card-bg)] border-b border-[var(--card-border)] relative flex-shrink-0 overflow-hidden">
                <img
                  src={item.image || '/default-news-cover.webp'}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  onError={(e: any) => {
                    e.currentTarget.src = '/default-news-cover.webp';
                  }}
                />
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-center justify-between text-[10px] text-[var(--text-dim)] mb-2">
                  <span>{formatTehranDate(item.createdAt)}</span>
                  {item.source === 'guide' || (item.tags && (item.tags.includes('آموزش') || item.tags.includes('مقالات آموزشی'))) ? (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                      📚 مقاله آموزشی
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20">
                      📰 خبر
                    </span>
                  )}
                </div>

                <h4 className="font-black text-sm text-[var(--text-main)] mb-2 line-clamp-2 leading-relaxed" title={item.title}>
                  {item.title}
                </h4>

                <p className="text-xs text-[var(--text-muted)] line-clamp-3 mb-4 leading-relaxed">
                  {item.summary || item.content}
                </p>

                <div className="mt-auto pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
                  <a
                    href={`/blog/${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-accent-primary)] hover:underline"
                  >
                    <span>مشاهده در وبلاگ</span>
                    <ExternalLink size={12} />
                  </a>

                  <span className="text-[10px] text-[var(--text-dim)]">شناسه #{item.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
