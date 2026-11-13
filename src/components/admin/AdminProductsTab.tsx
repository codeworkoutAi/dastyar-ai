import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, Trash2, Edit2, Plus, ArrowRight, CheckCircle2, 
  HelpCircle, Eye, RefreshCw, AlertCircle, Sparkles, Zap,
  Clock, ShieldCheck, Star, MessageSquare, Check, X, Filter
} from 'lucide-react';
import { AddSquareOutlineIcon, BoxLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits, toEnglishDigits } from '../../lib/persianUtils';
import { formatTehranDateTime } from '../../lib/dateUtils';

interface FaqItem {
  q: string;
  a: string;
}

interface ProductVariation {
  id: string;
  title: string;
  price: number;
}

export const AdminProductsTab: React.FC = () => {
  const { token } = useAuthStore();
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'reviews'>('products');
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<string>('account');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [image, setImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [deliveryGuide, setDeliveryGuide] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('۱ تا ۲۴ ساعت کاری');
  const [badge, setBadge] = useState('');
  const [features, setFeatures] = useState('');
  const [tokenEstimate, setTokenEstimate] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [showOnLanding, setShowOnLanding] = useState(true);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Variations state
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [newVarTitle, setNewVarTitle] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');

  // FAQ input temporary state
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Licenses management state
  const [selectedProductForLicenses, setSelectedProductForLicenses] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [newLicensesText, setNewLicensesText] = useState('');

  // Reviews moderation state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [adminReplyTexts, setAdminReplyTexts] = useState<Record<number, string>>({});

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
    fetchReviews();
  }, []);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت لیست محصولات');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'خطای سرور در بارگذاری محصولات');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (status = reviewFilter) => {
    try {
      setReviewsLoading(true);
      const res = await fetch(`/api/admin/reviews?status=${status}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت دیدگاه‌ها');
      const data = await res.json();
      setReviews(data);

      // Pre-fill existing replies
      const repliesMap: Record<number, string> = {};
      data.forEach((r: any) => {
        if (r.reply) repliesMap[r.id] = r.reply;
      });
      setAdminReplyTexts(prev => ({ ...prev, ...repliesMap }));

      // Fetch pending count separately if current filter isn't pending
      if (status !== 'pending') {
        const pendingRes = await fetch('/api/admin/reviews?status=pending', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (pendingRes.ok) {
          const pendingData = await pendingRes.json();
          setPendingReviewsCount(pendingData.length);
        }
      } else {
        setPendingReviewsCount(data.length);
      }
    } catch (err: any) {
      console.error('[Admin Reviews] Error:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleUpdateReviewStatus = async (reviewId: number, status: 'approved' | 'rejected' | 'pending', reply?: string) => {
    try {
      const bodyPayload: any = { status };
      if (reply !== undefined) {
        bodyPayload.reply = reply;
      }

      const res = await fetch(`/api/admin/reviews/${reviewId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در تغییر وضعیت دیدگاه');
      }

      showNotification('وضعیت دیدگاه با موفقیت بروزرسانی شد.');
      fetchReviews(reviewFilter);
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!window.confirm('آیا از حذف دائمی این دیدگاه اطمینان دارید؟')) return;
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در حذف دیدگاه');
      }
      showNotification('دیدگاه با موفقیت حذف شد.');
      fetchReviews(reviewFilter);
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  const resetForm = () => {
    setTitle('');
    setPrice('');
    setDescription('');
    setLongDescription('');
    setFaqs([]);
    setImage('');
    setBannerImage('');
    setBaseUrl('');
    setDeliveryGuide('');
    setDeliveryTime('۱ تا ۲۴ ساعت کاری');
    setVariations([]);
    setNewVarTitle('');
    setNewVarPrice('');
    setBadge('');
    setFeatures('');
    setTokenEstimate('');
    setIsPopular(false);
    setShowOnLanding(true);
    setCategory('account');
    setIsAdding(false);
    setEditingProductId(null);
    setShowLivePreview(false);
  };

  const handleEditClick = (p: any) => {
    setTitle(p.title);
    setPrice(String(p.price));
    setDescription(p.description || '');
    setLongDescription(p.longDescription || '');
    try {
      setFaqs(p.faqs ? JSON.parse(p.faqs) : []);
    } catch {
      setFaqs([]);
    }
    setCategory(p.category || 'account');
    setImage(p.image || '');
    setBannerImage(p.bannerImage || '');
    setBaseUrl(p.baseUrl || '');
    setDeliveryGuide(p.deliveryGuide || '');
    setDeliveryTime(p.deliveryTime || '۱ تا ۲۴ ساعت کاری');
    try {
      if (p.variations) {
        setVariations(typeof p.variations === 'string' ? JSON.parse(p.variations) : p.variations);
      } else {
        setVariations([]);
      }
    } catch {
      setVariations([]);
    }
    setNewVarTitle('');
    setNewVarPrice('');
    setBadge(p.badge || '');
    setFeatures(p.features || '');
    setTokenEstimate(p.tokenEstimate || '');
    setIsPopular(Boolean(p.isPopular));
    setShowOnLanding(p.showOnLanding === undefined ? true : Boolean(p.showOnLanding));
    setEditingProductId(p.id);
    setIsAdding(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('آیا از حذف این محصول مطمئن هستید؟ این عملیات غیرقابل بازگشت است.')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در حذف محصول');
      }
      showNotification('محصول با موفقیت حذف شد.');
      fetchProducts();
    } catch (err: any) {
      showNotification(err.message, true);
      setLoading(false);
    }
  };

  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setFaqs([...faqs, { q: newFaqQ.trim(), a: newFaqA.trim() }]);
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleRemoveFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleAddVariation = () => {
    if (!newVarTitle.trim() || !newVarPrice.trim()) return;
    const numPrice = parseInt(toEnglishDigits(newVarPrice).replace(/\D/g, ''), 10) || 0;
    const newVar: ProductVariation = {
      id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: newVarTitle.trim(),
      price: numPrice
    };
    setVariations([...variations, newVar]);
    setNewVarTitle('');
    setNewVarPrice('');
  };

  const handleRemoveVariation = (id: string) => {
    setVariations(variations.filter(v => v.id !== id));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'banner' = 'image') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') setImage(reader.result as string);
        else setBannerImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category) {
      showNotification('پر کردن عنوان، قیمت و دسته‌بندی اجباری است.', true);
      return;
    }

    try {
      setError(null);
      const url = editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          price: parseInt(toEnglishDigits(price).replace(/\D/g, ''), 10) || 0,
          category,
          description,
          longDescription,
          faqs: faqs.length > 0 ? JSON.stringify(faqs) : '',
          image,
          bannerImage,
          baseUrl,
          deliveryGuide,
          deliveryTime: deliveryTime || '۱ تا ۲۴ ساعت کاری',
          variations: variations.length > 0 ? JSON.stringify(variations) : '',
          badge,
          features,
          tokenEstimate,
          isPopular: isPopular ? 1 : 0,
          showOnLanding: showOnLanding ? 1 : 0
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در ذخیره محصول');
      }

      showNotification(editingProductId ? 'تغییرات محصول با موفقیت ذخیره شد.' : 'محصول جدید با موفقیت ایجاد شد.');
      resetForm();
      fetchProducts();
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // License management
  const openLicenseManager = async (p: any) => {
    if (p.category === 'plan') {
      handleEditClick(p);
      return;
    }
    setSelectedProductForLicenses(p);
    setNewLicensesText('');
    await fetchLicenses(p.id);
  };

  const closeLicenseManager = () => {
    setSelectedProductForLicenses(null);
    setLicenses([]);
    fetchProducts();
  };

  const fetchLicenses = async (productId: number) => {
    try {
      setLicensesLoading(true);
      const res = await fetch(`/api/admin/products/${productId}/licenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت لایسنس‌ها');
      const data = await res.json();
      setLicenses(data);
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setLicensesLoading(false);
    }
  };

  const handleAddLicenses = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLicensesText.trim()) return;

    const keys = newLicensesText.split('\n').map(k => k.trim()).filter(k => k);
    if (keys.length === 0) return;

    try {
      setLicensesLoading(true);
      const res = await fetch(`/api/admin/products/${selectedProductForLicenses.id}/licenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ keys })
      });

      if (!res.ok) throw new Error('خطا در ثبت لایسنس‌ها');

      setNewLicensesText('');
      showNotification(`${keys.length} لایسنس با موفقیت اضافه شد.`);
      await fetchLicenses(selectedProductForLicenses.id);
    } catch (err: any) {
      showNotification(err.message, true);
      setLicensesLoading(false);
    }
  };

  const handleDeleteLicense = async (id: number) => {
    if (!window.confirm('آیا از حذف این لایسنس مطمئن هستید؟')) return;
    try {
      setLicensesLoading(true);
      const res = await fetch(`/api/admin/licenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در حذف لایسنس');
      }
      showNotification('لایسنس حذف شد.');
      await fetchLicenses(selectedProductForLicenses.id);
    } catch (err: any) {
      showNotification(err.message, true);
      setLicensesLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* License Manager View */}
      {selectedProductForLicenses ? (
        <div className="flex flex-col h-full animate-fadeIn">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={closeLicenseManager}
              className="p-2.5 clay-btn rounded-xl transition-all cursor-pointer"
            >
              <ArrowRight size={18} className="text-[var(--text-muted)]" />
            </button>
            <div className="flex flex-col">
              <h3 className="text-lg font-black text-[var(--text-main)]">مدیریت انبار لایسنس‌ها</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                محصول: <span className="font-bold text-[var(--color-accent-primary)]">{selectedProductForLicenses.title}</span>
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add Licenses Form */}
            <div className="lg:col-span-1">
              <div className="p-5 rounded-2xl clay-card">
                <h4 className="text-sm font-bold text-[var(--text-main)] mb-3">افزودن انبوه لایسنس یا کلید</h4>
                <p className="text-xs text-[var(--text-muted)] mb-4 leading-relaxed">
                  هر کلید، اکانت یا لینک اختصاصی را در یک خط جداگانه قرار دهید:
                </p>
                <form onSubmit={handleAddLicenses} className="flex flex-col gap-4">
                  <textarea
                    value={newLicensesText}
                    onChange={(e) => setNewLicensesText(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl clay-surface text-sm outline-none transition-all min-h-[220px] font-mono text-left"
                    placeholder="ACC-GEMINI-XXXXX&#10;user:password&#10;https://activation-link.com"
                    dir="ltr"
                  />
                  <button
                    type="submit"
                    disabled={licensesLoading || !newLicensesText.trim()}
                    className="w-full py-3 clay-btn-primary font-bold transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {licensesLoading ? 'در حال ثبت...' : 'ثبت در انبار'}
                  </button>
                </form>
              </div>
            </div>

            {/* Licenses List */}
            <div className="lg:col-span-2">
              <div className="p-5 rounded-2xl clay-card h-full">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--card-border)]">
                  <h4 className="text-sm font-bold text-[var(--text-main)]">لیست لایسنس‌ها و موجودی انبار</h4>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    {licenses.filter(l => l.status === 'available').length} عدد آماده تحویل
                  </span>
                </div>

                {licensesLoading && licenses.length === 0 ? (
                  <div className="flex justify-center p-8">
                    <div className="w-7 h-7 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : licenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 opacity-60">
                    <Key className="w-10 h-10 mb-3 text-[var(--text-dim)]" />
                    <span className="text-sm font-bold">هیچ لایسنسی برای این محصول ثبت نشده است.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                    {licenses.map((l: any) => (
                      <div key={l.id} className="flex items-center justify-between p-3.5 rounded-xl clay-surface">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-xs font-mono text-[var(--text-main)] truncate" dir="ltr">{l.key}</span>
                          <span className={`text-[10px] mt-1.5 w-max px-2.5 py-0.5 rounded-full font-bold ${
                            l.status === 'available' 
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {l.status === 'available' ? 'آماده تحویل' : 'تحویل داده‌شده'}
                          </span>
                        </div>
                        {l.status === 'available' && (
                          <button
                            onClick={() => handleDeleteLicense(l.id)}
                            className="p-2 text-[var(--text-dim)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0 cursor-pointer"
                            title="حذف لایسنس"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Main Product & Reviews View */
        <div className="flex flex-col gap-6">
          {/* Top Sub-Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 p-1.5 rounded-2xl clay-surface-inset w-fit">
              <button
                type="button"
                onClick={() => setActiveSubTab('products')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSubTab === 'products'
                    ? 'clay-btn-primary shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <BoxLinearIcon className="w-4 h-4" />
                <span>محصولات و انبار فروشگاه</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/15">
                  {products.filter((p: any) => p.category !== 'wallet_topup').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('reviews');
                  fetchReviews();
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                  activeSubTab === 'reviews'
                    ? 'clay-btn-primary shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <MessageSquare size={14} />
                <span>نظارت بر دیدگاه‌های خریداران</span>
                {pendingReviewsCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-black animate-pulse">
                    {pendingReviewsCount} در انتظار
                  </span>
                )}
              </button>
            </div>

            {activeSubTab === 'products' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchProducts}
                  disabled={loading}
                  className="p-2.5 clay-btn rounded-xl transition-all cursor-pointer"
                  title="تازه‌سازی لیست"
                >
                  <RefreshCw className={`w-4 h-4 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => {
                    if (isAdding) {
                      resetForm();
                    } else {
                      setIsAdding(true);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 clay-btn-primary font-bold text-xs rounded-xl transition-all cursor-pointer"
                >
                  <AddSquareOutlineIcon className="w-4 h-4" />
                  {isAdding ? 'انصراف' : 'تعریف محصول جدید'}
                </button>
              </div>
            )}

            {activeSubTab === 'reviews' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchReviews(reviewFilter)}
                  disabled={reviewsLoading}
                  className="flex items-center gap-2 px-3.5 py-2 clay-btn rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${reviewsLoading ? 'animate-spin' : ''}`} />
                  <span>بروزرسانی دیدگاه‌ها</span>
                </button>
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ==================== SUB-TAB 1: PRODUCTS ==================== */}
          {activeSubTab === 'products' && (
            <>
              {/* Add / Edit Form */}
              {isAdding && (
                <div ref={formRef} className="p-6 rounded-2xl clay-card-thick border border-[var(--color-accent-primary)]/30 animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-[var(--card-border)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center font-bold">
                        {editingProductId ? <Edit2 size={16} /> : <Plus size={16} />}
                      </div>
                      <h4 className="text-base font-black text-[var(--text-main)]">
                        {editingProductId ? 'ویرایش مشخصات محصول' : 'تعریف محصول یا بسته جدید'}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLivePreview(!showLivePreview)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        showLivePreview ? 'clay-btn-primary' : 'clay-btn'
                      }`}
                    >
                      <Eye size={14} />
                      <span>{showLivePreview ? 'مخفی‌سازی پیش‌نمایش' : 'پیش‌نمایش زنده کارت'}</span>
                    </button>
                  </div>

                  {/* Live Preview Box */}
                  {showLivePreview && (
                    <div className="mb-8 p-5 rounded-2xl clay-surface-inset">
                      <span className="text-xs font-bold text-[var(--color-accent-primary)] block mb-3">
                        🔍 پیش‌نمایش نحوه نمایش کارت در ویترین فروشگاه:
                      </span>
                      <div className="max-w-sm mx-auto">
                        <div className="clay-card-thick overflow-hidden rounded-2xl flex flex-col">
                          <div className="w-full aspect-video relative overflow-hidden bg-[var(--card-bg)] border-b border-[var(--card-border)]">
                            {bannerImage || image ? (
                              <img src={bannerImage || image} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-accent-primary)] gap-2">
                                <Sparkles className="w-10 h-10 opacity-40" />
                                <span className="text-xs font-bold opacity-60">بدون تصویر</span>
                              </div>
                            )}
                            <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--color-input-bg)]/80 text-[var(--text-main)] backdrop-blur-md border border-[var(--card-border)]">
                              {category === 'plan' ? 'پلن تعرفه' : category === 'api' ? 'کلید API' : category === 'account' ? 'اکانت اختصاصی' : 'پکیج'}
                            </span>
                            {badge && (
                              <span className="absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 bg-[var(--color-accent-primary)] text-white rounded-md shadow-xs">
                                {badge}
                              </span>
                            )}
                          </div>

                          <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-black text-sm text-[var(--text-main)] mb-1.5">{title || 'عنوان محصول...'}</h4>
                            {tokenEstimate && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--color-accent-primary)] mb-2">
                                <Zap size={12} />
                                <span>{tokenEstimate}</span>
                              </div>
                            )}
                            <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed">
                              {description || 'توضیحات کوتاه محصول در این بخش قرار می‌گیرد...'}
                            </p>

                            <div className="mt-auto pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
                              <span className="text-xs font-black text-[var(--color-accent-primary)]">
                                {variations.length > 0
                                  ? `از ${Math.min(...variations.map(v => v.price)).toLocaleString('fa-IR')} تومان`
                                  : price ? `${parseInt(price, 10).toLocaleString('fa-IR')} تومان` : 'تعیین نشده'}
                              </span>
                              <span className="text-[11px] font-bold text-[var(--text-dim)]">{deliveryTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSaveProduct} className="flex flex-col gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Title */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--text-main)]">عنوان محصول / ابزار هوش مصنوعی *</label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all"
                          placeholder="مثال: خرید اکانت قانونی Gemini Pro و Gemini Advanced"
                          required
                        />
                      </div>

                      {/* Base Price */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--text-main)]">قیمت پایه (تومان) *</label>
                        <input
                          type="text"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all font-mono"
                          placeholder="مثال: 799000"
                          dir="ltr"
                          required
                        />
                      </div>

                      {/* Category */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--text-main)]">دسته‌بندی محصول *</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all"
                        >
                          <option value="account">اکانت پرمیوم و اختصاصی هوش مصنوعی</option>
                          <option value="api">کلید API و دسترسی توسعه‌دهنده</option>
                          <option value="package">پکیج یا سرویس تخصصی</option>
                          <option value="plan">پلن چت‌باکس داخلی</option>
                        </select>
                      </div>

                      {/* Delivery Time */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                          <Clock size={14} className="text-[var(--color-accent-primary)]" />
                          <span>زمان و نحوه تحویل</span>
                        </label>
                        <input
                          type="text"
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all"
                          placeholder="مثال: ۱ تا ۲۴ ساعت کاری"
                        />
                      </div>

                      {/* Badge */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--text-main)]">بج یا برچسب ویژه</label>
                        <input
                          type="text"
                          value={badge}
                          onChange={(e) => setBadge(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all"
                          placeholder="مثال: پرفروش، تحویل ۱ تا ۲۴ ساعت، ۱۰۰٪ قانونی"
                        />
                      </div>

                      {/* Token Estimate */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--text-main)]">تخمین توکن / ظرفیت</label>
                        <input
                          type="text"
                          value={tokenEstimate}
                          onChange={(e) => setTokenEstimate(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all"
                          placeholder="مثال: فضای ابری 2TB + دسترسی Gemini 1.5 Pro"
                        />
                      </div>
                    </div>

                    {/* Variations Manager (Multi-Period Duration & Custom Pricing) */}
                    <div className="p-4 rounded-xl clay-surface-inset space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                          <Clock size={15} className="text-[var(--color-accent-primary)]" />
                          دوره‌ها و پلن‌های مدت‌دار (پلن‌های زمانی محصول)
                        </span>
                        <span className="text-[11px] font-bold text-[var(--color-accent-primary)]">
                          {variations.length > 0 ? `${variations.length} دوره تعریف‌شده` : 'تک‌پلن (قیمت پایه)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        در صورتی که این محصول دارای دوره‌های ۶ ماهه، ۱۲ ماهه، ۲۴ ماهه یا پلن‌های متفاوت است، آنها را اینجا اضافه نمایید. خریدار در صفحه محصول می‌تواند دوره مورد نظر را انتخاب کند.
                      </p>

                      {variations.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {variations.map((v) => (
                            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg clay-card text-xs">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-[var(--text-main)]">{v.title}</span>
                                <span className="text-[11px] font-bold text-[var(--color-accent-primary)]">
                                  {v.price.toLocaleString('fa-IR')} تومان
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveVariation(v.id)}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                                title="حذف دوره"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-[var(--card-border)]">
                        <input
                          type="text"
                          placeholder="عنوان دوره (مثال: اشتراک ۱۲ ماهه اختصاصی)"
                          value={newVarTitle}
                          onChange={(e) => setNewVarTitle(e.target.value)}
                          className="sm:col-span-7 px-3 py-2 rounded-lg clay-surface text-xs outline-none"
                        />
                        <input
                          type="text"
                          placeholder="قیمت (تومان)"
                          value={newVarPrice}
                          onChange={(e) => setNewVarPrice(e.target.value)}
                          className="sm:col-span-3 px-3 py-2 rounded-lg clay-surface text-xs outline-none font-mono"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={handleAddVariation}
                          className="sm:col-span-2 px-3 py-2 clay-btn-primary rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>افزودن دوره</span>
                        </button>
                      </div>
                    </div>

                    {/* Short Description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[var(--text-main)]">توضیح کوتاه ویترین (۱ الی ۲ جمله)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all leading-relaxed"
                        placeholder="خلاصه‌ای جذاب از ارزش و کاربرد این محصول در کارت فروشگاه..."
                      />
                    </div>

                    {/* Long Description (Markdown) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[var(--text-main)]">توضیحات جامع صفحه جزئیات (Markdown)</label>
                      <textarea
                        value={longDescription}
                        onChange={(e) => setLongDescription(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all leading-relaxed font-mono"
                        placeholder="### توضیحات کامل&#10;ویژگی‌های کامل محصول، نحوه تحویل و مزایای استفاده..."
                      />
                    </div>

                    {/* Features (one per line) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[var(--text-main)]">مزایای کلیدی محصول (هر سطر یک مزیت)</label>
                      <textarea
                        value={features}
                        onChange={(e) => setFeatures(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all leading-relaxed"
                        placeholder="فعال‌سازی قانونی روی جیمیل اختصاصی شما&#10;بدون قطعی و بدون ریسک مسدودی&#10;پشتیبانی و ضمانت تا آخرین روز اشتراک&#10;تحویل مطمئن بین ۱ تا ۲۴ ساعت کاری"
                      />
                    </div>

                    {/* Delivery Guide */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[var(--text-main)]">راهنمای تحویل و فعال‌سازی (ارسال پس از خرید)</label>
                      <textarea
                        value={deliveryGuide}
                        onChange={(e) => setDeliveryGuide(e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 rounded-xl clay-surface text-sm outline-none transition-all leading-relaxed"
                        placeholder="پس از ثبت سفارش، اطلاعات اکانت شما حداکثر تا ۲۴ ساعت فعال شده و از طریق تلگرام @DastyaraiAdmin یا ایمیل به شما تحویل داده می‌شود."
                      />
                    </div>

                    {/* Image Selection / Upload */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--text-main)]">تصویر کارت (مسیر عمومی یا آپلود)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl clay-surface text-xs outline-none font-mono text-left"
                            placeholder="/images/products/gemini-advanced.webp"
                            dir="ltr"
                          />
                          <label className="px-3 py-2.5 clay-btn rounded-xl text-xs cursor-pointer shrink-0">
                            <span>آپلود</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'image')} />
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[var(--text-main)]">تصویر بنر هدر محصول</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={bannerImage}
                            onChange={(e) => setBannerImage(e.target.value)}
                            className="flex-1 px-4 py-2.5 rounded-xl clay-surface text-xs outline-none font-mono text-left"
                            placeholder="/images/products/gemini-advanced.webp"
                            dir="ltr"
                          />
                          <label className="px-3 py-2.5 clay-btn rounded-xl text-xs cursor-pointer shrink-0">
                            <span>آپلود</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'banner')} />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Structured FAQs */}
                    <div className="p-4 rounded-xl clay-surface-inset space-y-3">
                      <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                        <HelpCircle size={15} className="text-[var(--color-accent-primary)]" />
                        سوالات متداول خریداران (FAQ)
                      </span>

                      {faqs.length > 0 && (
                        <div className="space-y-2">
                          {faqs.map((faq, i) => (
                            <div key={i} className="flex items-start justify-between p-3 rounded-lg clay-card text-xs">
                              <div className="space-y-1">
                                <span className="font-bold text-[var(--text-main)] block">❓ {faq.q}</span>
                                <span className="text-[var(--text-muted)] block leading-relaxed">💡 {faq.a}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFaq(i)}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <input
                          type="text"
                          placeholder="پرسش متداول..."
                          value={newFaqQ}
                          onChange={(e) => setNewFaqQ(e.target.value)}
                          className="px-3 py-2 rounded-lg clay-surface text-xs outline-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="پاسخ کوتاه..."
                            value={newFaqA}
                            onChange={(e) => setNewFaqA(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg clay-surface text-xs outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleAddFaq}
                            className="px-3 py-2 clay-btn rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                          >
                            افزودن
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Switches */}
                    <div className="flex flex-wrap items-center gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[var(--text-main)]">
                        <input
                          type="checkbox"
                          checked={isPopular}
                          onChange={(e) => setIsPopular(e.target.checked)}
                          className="w-4 h-4 rounded text-[var(--color-accent-primary)] cursor-pointer"
                        />
                        <span>نمایش به عنوان برگزیده و پرفروش</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[var(--text-main)]">
                        <input
                          type="checkbox"
                          checked={showOnLanding}
                          onChange={(e) => setShowOnLanding(e.target.checked)}
                          className="w-4 h-4 rounded text-[var(--color-accent-primary)] cursor-pointer"
                        />
                        <span>نمایش در ویترین فروشگاه</span>
                      </label>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-[var(--card-border)]">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-5 py-2.5 clay-btn font-bold text-xs rounded-xl cursor-pointer"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        className="px-7 py-2.5 clay-btn-primary font-bold text-xs rounded-xl cursor-pointer"
                      >
                        {editingProductId ? 'ذخیره تغییرات' : 'ایجاد محصول'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Product Grid */}
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 opacity-60 clay-card rounded-2xl">
                  <BoxLinearIcon className="w-12 h-12 text-[var(--text-dim)]" />
                  <span className="text-sm font-bold text-[var(--text-main)]">هنوز محصولی ثبت نشده است.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {products
                    .filter((p: any) => p.category !== 'wallet_topup')
                    .map((p: any) => {
                      let parsedVars: ProductVariation[] = [];
                      try {
                        if (p.variations) {
                          parsedVars = typeof p.variations === 'string' ? JSON.parse(p.variations) : p.variations;
                        }
                      } catch {}

                      return (
                        <div
                          key={p.id}
                          className="group flex flex-col clay-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-all relative"
                        >
                          {/* Top Action Hover Bar */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[var(--card-bg)]/90 backdrop-blur-md p-1 rounded-xl shadow-md border border-[var(--card-border)]">
                            <button
                              type="button"
                              onClick={() => handleEditClick(p)}
                              className="p-1.5 text-[var(--text-muted)] hover:text-blue-500 rounded-lg transition-colors cursor-pointer"
                              title="ویرایش محصول"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                              title="حذف محصول"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* Image Banner */}
                          <div className="w-full aspect-video bg-[var(--card-bg)] border-b border-[var(--card-border)] relative flex-shrink-0 overflow-hidden">
                            {p.bannerImage || p.image ? (
                              <img src={p.bannerImage || p.image} alt={p.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center opacity-40">
                                <BoxLinearIcon className="w-12 h-12 text-[var(--text-dim)]" />
                              </div>
                            )}

                            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[var(--color-input-bg)]/90 text-[var(--text-main)] backdrop-blur-sm border border-[var(--card-border)]">
                                {p.category === 'plan' ? 'پلن تعرفه' : p.category === 'package' ? 'پکیج' : p.category === 'api' ? 'کلید API' : 'اکانت اختصاصی'}
                              </span>
                              {p.isPopular ? (
                                <span className="text-[10px] px-2 py-0.5 bg-amber-500 text-white font-black rounded-md shadow-xs">
                                  ویژه
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-black text-sm text-[var(--text-main)] mb-1.5 line-clamp-2 leading-snug" title={p.title}>
                              {usePersianDigits ? toPersianDigits(p.title) : p.title}
                            </h4>

                            {p.deliveryTime && (
                              <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] mb-2">
                                <Clock size={12} className="text-[var(--color-accent-primary)]" />
                                <span>تحویل: {p.deliveryTime}</span>
                              </div>
                            )}

                            {p.description && (
                              <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3 leading-relaxed">
                                {p.description}
                              </p>
                            )}

                            {/* Stock & Price Footer */}
                            <div className="mt-auto pt-3 border-t border-[var(--card-border)] flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-[var(--text-dim)]">قیمت:</span>
                                <span className="text-xs font-black text-[var(--color-accent-primary)]">
                                  {parsedVars.length > 0 ? (
                                    <>
                                      <span className="text-[10px] font-normal text-[var(--text-muted)] ml-1">از</span>
                                      {Math.min(...parsedVars.map(v => v.price)).toLocaleString('fa-IR')} تومان
                                    </>
                                  ) : p.price ? (
                                    `${parseInt(p.price, 10).toLocaleString('fa-IR')} تومان`
                                  ) : (
                                    'رایگان'
                                  )}
                                </span>
                              </div>

                              {p.category !== 'plan' && p.category !== 'package' ? (
                                <button
                                  type="button"
                                  onClick={() => openLicenseManager(p)}
                                  className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg clay-btn text-[var(--color-accent-primary)] cursor-pointer"
                                >
                                  <Key size={13} />
                                  <span>انبار ({p.stock || 0})</span>
                                </button>
                              ) : (
                                <span className="text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  تحویل خودکار
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </>
          )}

          {/* ==================== SUB-TAB 2: REVIEWS MODERATION ==================== */}
          {activeSubTab === 'reviews' && (
            <div className="flex flex-col gap-5 animate-fadeIn">
              {/* Header and Filter Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl clay-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[var(--text-main)]">سیستم نظارت و تایید دیدگاه‌های کاربران</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      دیدگاه‌های جدید جهت جلوگیری از اسپم تا زمان تایید ادمین در حالت در انتظار باقی می‌مانند.
                    </p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 p-1 rounded-xl clay-surface-inset">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilter('all');
                      fetchReviews('all');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === 'all' ? 'clay-btn-primary' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    همه
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilter('pending');
                      fetchReviews('pending');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      reviewFilter === 'pending' ? 'clay-btn-primary' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    <span>در انتظار تایید</span>
                    {pendingReviewsCount > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilter('approved');
                      fetchReviews('approved');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === 'approved' ? 'clay-btn-primary' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    تایید شده
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReviewFilter('rejected');
                      fetchReviews('rejected');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reviewFilter === 'rejected' ? 'clay-btn-primary' : 'text-[var(--text-muted)]'
                    }`}
                  >
                    رد شده
                  </button>
                </div>
              </div>

              {/* Reviews List */}
              {reviewsLoading && reviews.length === 0 ? (
                <div className="flex justify-center p-12">
                  <div className="w-8 h-8 border-2 border-[var(--color-accent-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 gap-3 opacity-60 clay-card rounded-2xl">
                  <MessageSquare className="w-12 h-12 text-[var(--text-dim)]" />
                  <span className="text-sm font-bold text-[var(--text-main)]">دیدگاهی در این دسته‌بندی یافت نشد.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {reviews.map((rev: any) => (
                    <div key={rev.id} className="p-5 rounded-2xl clay-card flex flex-col gap-4">
                      {/* Top Info */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[var(--card-border)]">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center font-bold text-sm shrink-0">
                            {(rev.userName || rev.userEmail || 'ک').charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-[var(--text-main)]">{rev.userName || 'کاربر گرامی'}</span>
                              {rev.userEmail && (
                                <span className="text-[11px] text-[var(--text-muted)] font-mono" dir="ltr">{rev.userEmail}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-[var(--text-dim)]">محصول:</span>
                              <span className="text-xs font-bold text-[var(--color-accent-primary)]">
                                {rev.productTitle || `محصول کد ${rev.productId}`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Stars */}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={14}
                                className={star <= (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
                              />
                            ))}
                          </div>

                          {/* Status Badge */}
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black border ${
                            rev.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : rev.status === 'rejected'
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {rev.status === 'approved' ? 'تایید و منتشر شده' : rev.status === 'rejected' ? 'رد شده' : 'در انتظار تایید ادمین'}
                          </span>

                          <span className="text-[11px] text-[var(--text-dim)]">
                            {formatTehranDateTime(rev.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Comment Body */}
                      <div className="clay-surface-inset p-4 rounded-xl text-xs text-[var(--text-main)] leading-relaxed">
                        {rev.comment}
                      </div>

                      {/* Admin Reply Form / Display */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--card-border)]">
                        <label className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1.5">
                          <MessageSquare size={13} className="text-[var(--color-accent-primary)]" />
                          <span>پاسخ رسمی پشتیبانی و ادمین به این نظر:</span>
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={adminReplyTexts[rev.id] || ''}
                            onChange={(e) => setAdminReplyTexts({ ...adminReplyTexts, [rev.id]: e.target.value })}
                            className="flex-1 px-3 py-2 rounded-xl clay-surface text-xs outline-none"
                            placeholder="متن پاسخ پشتیبانی جهت نمایش عمومی زیر این دیدگاه..."
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateReviewStatus(rev.id, rev.status, adminReplyTexts[rev.id] || '')}
                            className="px-4 py-2 clay-btn font-bold text-xs rounded-xl hover:text-[var(--color-accent-primary)] transition-colors cursor-pointer"
                          >
                            ثبت / ویرایش پاسخ
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          {rev.status !== 'approved' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReviewStatus(rev.id, 'approved', adminReplyTexts[rev.id])}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <Check size={14} />
                              <span>تایید و انتشار دیدگاه</span>
                            </button>
                          )}

                          {rev.status !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateReviewStatus(rev.id, 'rejected', adminReplyTexts[rev.id])}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              <X size={14} />
                              <span>رد دیدگاه</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:bg-red-500/10 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          title="حذف دائمی دیدگاه"
                        >
                          <Trash2 size={14} />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
