import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, Trash2, Edit2, Plus, ArrowRight, CheckCircle2, 
  HelpCircle, Eye, EyeOff, RefreshCw, AlertCircle, Sparkles, Zap,
  Clock, ShieldCheck, Star, MessageSquare, Check, X, Filter, Search,
  Upload, Image as ImageIcon
} from 'lucide-react';
import { AddSquareOutlineIcon, BoxLinearIcon } from '@solar-icons/react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { toPersianDigits, toEnglishDigits } from '../../lib/persianUtils';
import { formatTehranDateTime } from '../../lib/dateUtils';
import { adminFetch } from '../../lib/adminApi';
import { AdminToast } from './AdminToast';
import { AdminConfirmModal } from './AdminConfirmModal';
import { AdminLicenseManager } from './AdminLicenseManager';
import { AdminReviewsSubTab } from './AdminReviewsSubTab';

interface FaqItem {
  q: string;
  a: string;
}

interface ProductVariation {
  id: string;
  title: string;
  price: number;
}

interface ProductFormData {
  title: string;
  price: string;
  category: string;
  status: 'active' | 'out_of_stock' | 'inactive';
  description: string;
  longDescription: string;
  faqs: FaqItem[];
  image: string;
  bannerImage: string;
  baseUrl: string;
  deliveryGuide: string;
  deliveryTime: string;
  deliveryType: 'hybrid' | 'instant' | 'manual';
  badge: string;
  features: string;
  tokenEstimate: string;
  isPopular: boolean;
  showOnLanding: boolean;
  variations: ProductVariation[];
}

const INITIAL_FORM_DATA: ProductFormData = {
  title: '',
  price: '',
  category: 'account',
  status: 'active',
  description: '',
  longDescription: '',
  faqs: [],
  image: '',
  bannerImage: '',
  baseUrl: '',
  deliveryGuide: '',
  deliveryTime: '۱ تا ۲۴ ساعت کاری',
  deliveryType: 'hybrid',
  badge: '',
  features: '',
  tokenEstimate: '',
  isPopular: false,
  showOnLanding: true,
  variations: []
};

export const AdminProductsTab: React.FC = () => {
  const { settings } = useSettingsStore();
  const usePersianDigits = settings?.appearance?.persianNumerals ?? false;

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'reviews'>('products');
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_DATA);
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Temporary inputs for Variations & FAQ
  const [newVarTitle, setNewVarTitle] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // Licenses sub-view
  const [selectedProductForLicenses, setSelectedProductForLicenses] = useState<any>(null);

  // Confirm delete modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const updateFormField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: 'حجم تصویر نباید بیشتر از ۲ مگابایت باشد.', type: 'warning' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const webpData = canvas.toDataURL('image/webp', 0.85);
          setFormData(prev => ({
            ...prev,
            image: webpData,
            bannerImage: prev.bannerImage || webpData
          }));
          setToast({ message: 'تصویر با موفقیت فشرده و به WebP تبدیل شد.', type: 'success' });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    fetchProducts();
    fetchPendingReviewsCount();
  }, []);

  const fetchPendingReviewsCount = async () => {
    try {
      const data = await adminFetch<any[]>('/api/admin/reviews?status=pending');
      setPendingReviewsCount(data.length);
    } catch {
      // Non-critical, ignore
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await adminFetch<any[]>('/api/admin/products');
      setProducts(data);
    } catch (err: any) {
      setToast({ message: err.message || 'خطا در بارگذاری محصولات', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (product: any) => {
    setEditingProductId(product.id);
    let parsedFaqs: FaqItem[] = [];
    try {
      if (product.faqs) {
        parsedFaqs = typeof product.faqs === 'string' ? JSON.parse(product.faqs) : product.faqs;
      }
    } catch {
      parsedFaqs = [];
    }

    let parsedVariations: ProductVariation[] = [];
    try {
      if (product.variations) {
        parsedVariations = typeof product.variations === 'string' ? JSON.parse(product.variations) : product.variations;
      }
    } catch {
      parsedVariations = [];
    }

    let parsedFeatures = '';
    try {
      if (product.features) {
        const featArr = typeof product.features === 'string' ? JSON.parse(product.features) : product.features;
        parsedFeatures = Array.isArray(featArr) ? featArr.join('\n') : '';
      }
    } catch {
      parsedFeatures = product.features || '';
    }

    setFormData({
      title: product.title || '',
      price: product.price ? String(product.price) : '',
      category: product.category || 'account',
      status: (product.status || 'active') as any,
      description: product.description || '',
      longDescription: product.long_description || '',
      faqs: parsedFaqs,
      image: product.image || '',
      bannerImage: product.banner_image || '',
      baseUrl: product.base_url || '',
      deliveryGuide: product.delivery_guide || '',
      deliveryTime: product.delivery_time || product.deliveryTime || '۱ تا ۲۴ ساعت کاری',
      deliveryType: (product.delivery_type || product.deliveryType || 'hybrid') as any,
      badge: product.badge || '',
      features: parsedFeatures,
      tokenEstimate: product.token_estimate || '',
      isPopular: Boolean(product.is_popular),
      showOnLanding: product.show_on_landing !== undefined ? Boolean(product.show_on_landing) : true,
      variations: parsedVariations
    });

    setIsAdding(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingProductId(null);
    setFormData(INITIAL_FORM_DATA);
    setNewVarTitle('');
    setNewVarPrice('');
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setToast({ message: 'لطفاً عنوان محصول را وارد کنید.', type: 'warning' });
      return;
    }
    const cleanPrice = Number(toEnglishDigits(formData.price)) || 0;

    let featuresArray: string[] = [];
    if (formData.features.trim()) {
      featuresArray = formData.features.split('\n').map(s => s.trim()).filter(Boolean);
    }

    const payload = {
      title: formData.title.trim(),
      price: cleanPrice,
      category: formData.category,
      status: formData.status,
      description: formData.description.trim(),
      long_description: formData.longDescription.trim(),
      faqs: formData.faqs,
      image: formData.image.trim(),
      banner_image: formData.bannerImage.trim(),
      base_url: formData.baseUrl.trim(),
      delivery_guide: formData.deliveryGuide.trim(),
      delivery_time: formData.deliveryTime.trim(),
      delivery_type: formData.deliveryType,
      badge: formData.badge.trim(),
      features: featuresArray,
      token_estimate: formData.tokenEstimate.trim(),
      is_popular: formData.isPopular,
      show_on_landing: formData.showOnLanding,
      variations: formData.variations
    };

    try {
      setLoading(true);
      if (editingProductId) {
        await adminFetch(`/api/admin/products/${editingProductId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'محصول با موفقیت به‌روزرسانی شد.', type: 'success' });
      } else {
        await adminFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToast({ message: 'محصول جدید با موفقیت ایجاد شد.', type: 'success' });
      }
      handleCancelForm();
      fetchProducts();
    } catch (err: any) {
      setToast({ message: err.message || 'خطا در ذخیره محصول', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await adminFetch(`/api/admin/products/${deleteTarget.id}`, { method: 'DELETE' });
      setToast({ message: `محصول «${deleteTarget.title}» حذف شد.`, type: 'success' });
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      setToast({ message: err.message || 'خطا در حذف محصول', type: 'error' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddVariation = () => {
    if (!newVarTitle.trim() || !newVarPrice.trim()) {
      setToast({ message: 'عنوان پلن و قیمت را وارد کنید.', type: 'warning' });
      return;
    }
    const cleanP = Number(toEnglishDigits(newVarPrice)) || 0;
    const newVar: ProductVariation = {
      id: 'var_' + Date.now(),
      title: newVarTitle.trim(),
      price: cleanP
    };
    updateFormField('variations', [...formData.variations, newVar]);
    setNewVarTitle('');
    setNewVarPrice('');
  };

  const handleRemoveVariation = (id: string) => {
    updateFormField('variations', formData.variations.filter(v => v.id !== id));
  };

  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) {
      setToast({ message: 'پرسش و پاسخ هر دو الزامی هستند.', type: 'warning' });
      return;
    }
    const newFaq: FaqItem = { q: newFaqQ.trim(), a: newFaqA.trim() };
    updateFormField('faqs', [...formData.faqs, newFaq]);
    setNewFaqQ('');
    setNewFaqA('');
  };

  const handleRemoveFaq = (index: number) => {
    updateFormField('faqs', formData.faqs.filter((_, i) => i !== index));
  };

  // If viewing licenses for a specific product
  if (selectedProductForLicenses) {
    return (
      <AdminLicenseManager 
        product={selectedProductForLicenses}
        onBack={() => {
          setSelectedProductForLicenses(null);
          fetchProducts();
        }}
      />
    );
  }

  const handleToggleProductStatus = async (product: any) => {
    try {
      setTogglingId(product.id);
      const isCurrentlyInactive = product.status === 'inactive';
      const targetStatus = isCurrentlyInactive ? 'active' : 'inactive';

      await adminFetch<any>(`/api/admin/products/${product.id}/toggle-status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus })
      });

      setProducts(prev => prev.map(p => {
        if (p.id === product.id) {
          return { ...p, status: targetStatus };
        }
        return p;
      }));

      setToast({
        message: targetStatus === 'active'
          ? `محصول «${product.title}» فعال شد و در فروشگاه نمایش داده می‌شود.`
          : `محصول «${product.title}» غیرفعال شد و از فروشگاه مخفی گردید.`,
        type: 'success'
      });
    } catch (err: any) {
      setToast({
        message: err.message || 'خطا در تغییر وضعیت محصول',
        type: 'error'
      });
    } finally {
      setTogglingId(null);
    }
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery.trim() || 
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && (p.status === 'active' || !p.status)) ||
      (statusFilter === 'inactive' && p.status === 'inactive') ||
      (statusFilter === 'out_of_stock' && p.status === 'out_of_stock');
    return matchesSearch && matchesCat && matchesStatus;
  });

  return (
    <div dir="rtl" className="space-y-6">
      {/* Toast feedback */}
      {toast && (
        <AdminToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Confirmation Dialog for Product Deletion */}
      <AdminConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="حذف محصول"
        description={`آیا از حذف محصول «${deleteTarget?.title}» اطمینان دارید؟ تمام لایسنس‌ها و داده‌های وابسته به این محصول نیز حذف خواهند شد.`}
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isDanger={true}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-subtle pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('products')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'products'
                ? 'clay-btn-primary shadow-sm'
                : 'clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <BoxLinearIcon className="w-4 h-4" />
            <span>محصولات و اشتراک‌ها</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/20">
              {usePersianDigits ? toPersianDigits(products.length) : products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('reviews')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeSubTab === 'reviews'
                ? 'clay-btn-primary shadow-sm'
                : 'clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>دیدگاه‌های مشتریان</span>
            {pendingReviewsCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold animate-pulse">
                {usePersianDigits ? toPersianDigits(pendingReviewsCount) : pendingReviewsCount} جدید
              </span>
            )}
          </button>
        </div>

        {activeSubTab === 'products' && !isAdding && (
          <button
            onClick={() => {
              setIsAdding(true);
              setEditingProductId(null);
              setFormData(INITIAL_FORM_DATA);
            }}
            className="clay-btn-primary px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن محصول جدید</span>
          </button>
        )}
      </div>

      {/* Reviews SubTab */}
      {activeSubTab === 'reviews' ? (
        <AdminReviewsSubTab />
      ) : (
        /* Products Catalog View */
        <div className="space-y-6">
          {/* Add / Edit Form Modal/Card */}
          {isAdding && (
            <div ref={formRef} className="clay-card p-6 rounded-2xl border-strong space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-subtle pb-4">
                <div className="flex items-center gap-2">
                  <AddSquareOutlineIcon className="w-6 h-6 text-emerald-500" />
                  <h3 className="font-bold text-base text-[var(--text-main)]">
                    {editingProductId ? 'ویرایش مشخصات محصول' : 'افزودن محصول جدید'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="clay-btn p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">عنوان محصول *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={e => updateFormField('title', e.target.value)}
                      placeholder="مثال: اکانت اختصاصی Claude Pro"
                      className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">دسته‌بندی</label>
                    <select
                      value={formData.category}
                      onChange={e => updateFormField('category', e.target.value)}
                      className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    >
                      <option value="account">اکانت هوش مصنوعی (Account)</option>
                      <option value="api">کلید و سهمیه API</option>
                      <option value="license">لایسنس نرم‌افزار</option>
                      <option value="credit">شارژ و اعتبار</option>
                    </select>
                  </div>
                </div>

                {/* Price and Delivery */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">قیمت پایه (تومان) *</label>
                    <input
                      type="text"
                      required
                      value={formData.price}
                      onChange={e => updateFormField('price', e.target.value)}
                      placeholder="مثال: ۱۲۰۰۰۰۰"
                      className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">وضعیت موجودی و فروش</label>
                    <select
                      value={formData.status}
                      onChange={e => updateFormField('status', e.target.value as any)}
                      className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm font-bold"
                    >
                      <option value="active">فعال و در حال فروش</option>
                      <option value="out_of_stock">ناموجود (غیرقابل خرید)</option>
                      <option value="inactive">غیرفعال (مخفی)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">نوع و متد تحویل</label>
                    <select
                      value={formData.deliveryType}
                      onChange={e => updateFormField('deliveryType', e.target.value as any)}
                      className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    >
                      <option value="hybrid">ترکیبی (آنی در صورت موجودی، وگرنه دستی)</option>
                      <option value="instant">تحویل ۱۰۰٪ آنی (الزام وجود لایسنس)</option>
                      <option value="manual">تحویل دستی توسط پشتیبانی</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">زمان تحویل</label>
                    <input
                      type="text"
                      value={formData.deliveryTime}
                      onChange={e => updateFormField('deliveryTime', e.target.value)}
                      placeholder="مثال: ۱ تا ۲۴ ساعت کاری"
                      className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-muted)]">بج یا نشان تبلیغاتی</label>
                    <input
                      type="text"
                      value={formData.badge}
                      onChange={e => updateFormField('badge', e.target.value)}
                      placeholder="مثال: تخفیف ویژه، پرفروش"
                      className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                    />
                  </div>
                </div>

                {/* Short & Long Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">توضیح کوتاه (کارت محصول)</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={e => updateFormField('description', e.target.value)}
                    placeholder="توضیح خلاصه محصول برای نمایش در فروشگاه..."
                    className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">توضیحات کامل و راهنمای محصول</label>
                  <textarea
                    rows={4}
                    value={formData.longDescription}
                    onChange={e => updateFormField('longDescription', e.target.value)}
                    placeholder="توضیحات مفصل محصول، شرایط استفاده و گارانتی..."
                    className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                {/* Features (one per line) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">
                    ویژگی‌ها و مزایا (هر مورد در یک خط)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.features}
                    onChange={e => updateFormField('features', e.target.value)}
                    placeholder="دسترسی به تمامی مدل‌ها&#10;بدون محدودیت آی‌پی ایران&#10;پشتیبانی ۲۴ ساعته"
                    className="clay-input w-full px-3.5 py-2.5 rounded-xl text-sm"
                  />
                </div>

                {/* Images and URLs */}
                <div className="space-y-3 p-4 rounded-xl clay-subcard">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-500" />
                      تصویر و کاور محصول
                    </span>
                    <label className="clay-btn-primary px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>انتخاب و آپلود تصویر (WebP / PNG / JPG)</span>
                      <input 
                        type="file" 
                        accept="image/webp,image/png,image/jpeg,image/avif" 
                        className="hidden" 
                        onChange={handleImageFileChange} 
                      />
                    </label>
                  </div>

                  {/* Image Preview Box if image exists */}
                  {(formData.image || formData.bannerImage) && (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden border border-subtle bg-black/5 dark:bg-white/5 flex items-center justify-center group">
                      <img
                        src={formData.image || formData.bannerImage}
                        alt="پیش‌نمایش تصویر محصول"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, image: '', bannerImage: '' }))}
                        className="absolute top-2 left-2 p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                        title="حذف تصویر"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-muted)]">آدرس تصویر محصول (URL یا Base64)</label>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={e => updateFormField('image', e.target.value)}
                        placeholder="data:image/webp;base64,... یا https://..."
                        className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--text-muted)]">آدرس بنر یا کاور عریض (اختیاری)</label>
                      <input
                        type="text"
                        value={formData.bannerImage}
                        onChange={e => updateFormField('bannerImage', e.target.value)}
                        placeholder="data:image/webp;base64,... یا https://..."
                        className="clay-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Variations (Plans) Section */}
                <div className="clay-subcard p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      پلن‌ها و تنوع‌های قیمت (Variations)
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {formData.variations.length} پلن تعریف شده
                    </span>
                  </div>

                  {formData.variations.length > 0 && (
                    <div className="space-y-2">
                      {formData.variations.map(v => (
                        <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg clay-surface text-xs">
                          <span className="font-medium text-[var(--text-main)]">{v.title}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-500 font-bold">
                              {usePersianDigits ? toPersianDigits(v.price.toLocaleString('fa-IR')) : v.price.toLocaleString('fa-IR')} تومان
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveVariation(v.id)}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="عنوان پلن (مثال: اشتراک ۳ ماهه)"
                      value={newVarTitle}
                      onChange={e => setNewVarTitle(e.target.value)}
                      className="clay-input flex-1 px-3 py-2 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      placeholder="قیمت (تومان)"
                      value={newVarPrice}
                      onChange={e => setNewVarPrice(e.target.value)}
                      className="clay-input w-36 px-3 py-2 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="clay-btn px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن</span>
                    </button>
                  </div>
                </div>

                {/* FAQ Section */}
                <div className="clay-subcard p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-sky-500" />
                      سوالات متداول این محصول (FAQ)
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {formData.faqs.length} سوال ثبت شده
                    </span>
                  </div>

                  {formData.faqs.length > 0 && (
                    <div className="space-y-2">
                      {formData.faqs.map((f, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg clay-surface space-y-1 text-xs">
                          <div className="flex items-center justify-between font-semibold text-[var(--text-main)]">
                            <span>س: {f.q}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFaq(idx)}
                              className="text-red-500 hover:text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[var(--text-muted)] text-[11px]">ج: {f.a}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <input
                      type="text"
                      placeholder="پرسش متداول..."
                      value={newFaqQ}
                      onChange={e => setNewFaqQ(e.target.value)}
                      className="clay-input w-full px-3 py-2 rounded-lg text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="پاسخ کوتاه..."
                        value={newFaqA}
                        onChange={e => setNewFaqA(e.target.value)}
                        className="clay-input flex-1 px-3 py-2 rounded-lg text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddFaq}
                        className="clay-btn px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن سوال</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-main)]">
                    <input
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={e => updateFormField('isPopular', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500"
                    />
                    <span>نمایش به عنوان محصول پرطرفدار (Popular)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-main)]">
                    <input
                      type="checkbox"
                      checked={formData.showOnLanding}
                      onChange={e => updateFormField('showOnLanding', e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500"
                    />
                    <span>نمایش در صفحه اصلی و لندینگ</span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-subtle">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="clay-btn px-5 py-2.5 rounded-xl text-sm font-semibold"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="clay-btn-primary px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>{editingProductId ? 'ذخیره تغییرات محصول' : 'ایجاد محصول'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="جستجو در نام و توضیحات محصولات..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="clay-input w-full pr-10 pl-4 py-2 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="clay-input px-3 py-2 rounded-xl text-xs flex-1 sm:flex-initial"
              >
                <option value="all">همه دسته‌ها</option>
                <option value="account">اکانت هوش مصنوعی</option>
                <option value="api">سهمیه و کلید API</option>
                <option value="license">لایسنس نرم‌افزار</option>
                <option value="credit">شارژ و اعتبار</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="clay-input px-3 py-2 rounded-xl text-xs flex-1 sm:flex-initial"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="active">فقط فعال در فروشگاه</option>
                <option value="inactive">فقط مخفی / غیرفعال</option>
                <option value="out_of_stock">فقط ناموجود</option>
              </select>

              <button
                onClick={fetchProducts}
                title="تازه‌سازی لیست"
                className="clay-btn p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Products Grid */}
          {loading && products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm">در حال بارگذاری لیست محصولات...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 clay-card rounded-2xl p-8 space-y-3">
              <BoxLinearIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
              <h4 className="font-bold text-sm text-[var(--text-main)]">محصولی یافت نشد</h4>
              <p className="text-xs text-[var(--text-muted)]">
                {searchQuery ? 'هیچ محصولی با این عبارت مطابقت ندارد.' : 'هنوز محصولی ثبت نشده است.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => {
                const priceFormatted = usePersianDigits
                  ? toPersianDigits(Number(product.price).toLocaleString('fa-IR'))
                  : Number(product.price).toLocaleString('fa-IR');

                return (
                  <div 
                    key={product.id}
                    className={`clay-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500/30 transition-all group ${
                      product.status === 'inactive' ? 'opacity-70 border-dashed border-amber-500/40 bg-amber-500/5' : ''
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Product Thumbnail in Admin Card */}
                      <div className="w-full h-36 rounded-xl overflow-hidden relative bg-black/5 dark:bg-white/5 border border-subtle flex items-center justify-center">
                        {product.image || product.bannerImage ? (
                          <img 
                            src={product.image || product.bannerImage} 
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = 'none';
                              if (target.nextElementSibling) {
                                (target.nextElementSibling as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          style={{ display: product.image || product.bannerImage ? 'none' : 'flex' }}
                          className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] gap-1.5"
                        >
                          <BoxLinearIcon className="w-8 h-8 opacity-40" />
                          <span className="text-[10px] font-medium">بدون تصویر</span>
                        </div>
                        {product.badge && (
                          <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500 text-white font-bold shadow-xs">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      {/* Card Header & Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-[var(--text-main)] group-hover:text-emerald-500 transition-colors">
                            {product.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="inline-block text-[10px] px-2 py-0.5 rounded-md clay-surface text-[var(--text-muted)]">
                              {product.category === 'account' ? 'اکانت هوش مصنوعی' : 
                               product.category === 'api' ? 'کلید API' : 
                               product.category === 'license' ? 'لایسنس' : 'اعتبار'}
                            </span>
                            {product.status === 'inactive' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
                                <EyeOff className="w-3 h-3" />
                                مخفی از فروشگاه
                              </span>
                            ) : product.status === 'out_of_stock' || product.stock <= 0 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 font-bold border border-red-500/20">
                                ناموجود ({product.stock || 0} لایسنس)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20">
                                موجود ({product.stock} لایسنس)
                              </span>
                            )}
                          </div>
                        </div>

                        {product.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold border border-emerald-500/20 shrink-0">
                            {product.badge}
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                        {product.description || 'بدون توضیحات'}
                      </p>

                      {/* Price & Delivery */}
                      <div className="flex items-center justify-between pt-2 border-t border-subtle text-xs">
                        <div className="flex items-center gap-1 text-emerald-500 font-bold">
                          <span>{priceFormatted}</span>
                          <span className="text-[10px] font-normal text-[var(--text-muted)]">تومان</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <Clock className="w-3 h-3" />
                          <span>{product.delivery_time || 'فوری'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-subtle flex items-center justify-between gap-2">
                      <button
                        onClick={() => setSelectedProductForLicenses(product)}
                        className="clay-btn px-3 py-1.5 rounded-xl text-xs font-medium text-sky-500 hover:text-sky-600 flex items-center gap-1.5 flex-1 justify-center"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>مدیریت لایسنس‌ها</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={togglingId === product.id}
                          onClick={() => handleToggleProductStatus(product)}
                          title={product.status === 'inactive' ? 'فعال‌سازی و نمایش در فروشگاه' : 'غیرفعال‌سازی و مخفی کردن از فروشگاه'}
                          className={`clay-btn px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            product.status === 'inactive' 
                              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10' 
                              : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                          }`}
                        >
                          {togglingId === product.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : product.status === 'inactive' ? (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              <span>نمایش</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                              <span>مخفی‌سازی</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleEditClick(product)}
                          title="ویرایش محصول"
                          className="clay-btn p-1.5 rounded-xl text-[var(--text-muted)] hover:text-emerald-500"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: product.id, title: product.title })}
                          title="حذف محصول"
                          className="clay-btn p-1.5 rounded-xl text-[var(--text-muted)] hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
