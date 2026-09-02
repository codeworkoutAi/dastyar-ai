import React, { useState, useEffect, useRef } from 'react';
import { 
  CloseCircleOutlineIcon, 
  ShopLinearIcon,
  AddSquareOutlineIcon,
  BoxLinearIcon
} from '@solar-icons/react';
import { Edit2, Trash2, Key, ArrowRight } from 'lucide-react';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { toEnglishDigits } from '../lib/persianUtils';

export const AdminModal: React.FC = () => {
  const { isAdminOpen, setIsAdminOpen } = useUIStore();
  const { token, user } = useAuthStore();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // New product form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('account');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string>('');

  // Licenses state
  const [selectedProductForLicenses, setSelectedProductForLicenses] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [newLicensesText, setNewLicensesText] = useState('');
  const [licensesLoading, setLicensesLoading] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (isAdminOpen && token && user?.role === 'admin') {
      if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'orders') {
        fetchOrders();
      }
    }
  }, [isAdminOpen, token, user, activeTab]);

  const fetchOrders = async () => {
    try {
      setOrdersLoading(true);
      setError(null);
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت سفارشات');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'خطای سرور');
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت لیست محصولات');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'خطای سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !category) {
      setError('پر کردن عنوان، قیمت و دسته‌بندی اجباری است');
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
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title,
          price: parseInt(toEnglishDigits(price).replace(/\D/g, ''), 10),
          category,
          description,
          image
        })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در ذخیره محصول');
      }
      
      setTitle('');
      setPrice('');
      setDescription('');
      setImage('');
      setCategory('account');
      setIsAdding(false);
      setEditingProductId(null);
      
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditClick = (p: any) => {
    setTitle(p.title);
    setPrice(String(p.price));
    setDescription(p.description || '');
    setCategory(p.category);
    setImage(p.image || '');
    setEditingProductId(p.id);
    setIsAdding(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('آیا از حذف این محصول مطمئن هستید؟')) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در حذف محصول');
      }
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // License Management Methods
  const openLicenseManager = async (p: any) => {
    setSelectedProductForLicenses(p);
    setNewLicensesText('');
    await fetchLicenses(p.id);
  };

  const closeLicenseManager = () => {
    setSelectedProductForLicenses(null);
    setLicenses([]);
    fetchProducts(); // refresh stock
  };

  const fetchLicenses = async (productId: number) => {
    try {
      setLicensesLoading(true);
      const res = await fetch(`/api/admin/products/${productId}/licenses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت لایسنس‌ها');
      const data = await res.json();
      setLicenses(data);
    } catch (err: any) {
      setError(err.message);
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
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ keys })
      });

      if (!res.ok) throw new Error('خطا در ثبت لایسنس‌ها');
      
      setNewLicensesText('');
      await fetchLicenses(selectedProductForLicenses.id);
    } catch (err: any) {
      setError(err.message);
      setLicensesLoading(false);
    }
  };

  const handleDeleteLicense = async (id: number) => {
    if (!window.confirm('آیا از حذف این لایسنس مطمئن هستید؟')) return;
    try {
      setLicensesLoading(true);
      const res = await fetch(`/api/admin/licenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در حذف لایسنس');
      }
      await fetchLicenses(selectedProductForLicenses.id);
    } catch (err: any) {
      setError(err.message);
      setLicensesLoading(false);
    }
  };

  if (!isAdminOpen || user?.role !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={() => setIsAdminOpen(false)}
      />
      <div className="relative w-full w-[95vw] max-w-6xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] md:h-[85vh] animate-slideUpScale">
        
        {/* Header */}
        <div className="flex flex-col border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center justify-between p-4 sm:p-6 pb-2 sm:pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <ShopLinearIcon className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 font-rokh">
                  پنل مدیریت فروشگاه
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                  مدیریت محصولات، اکانت‌ها و لایسنس‌ها
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAdminOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
            >
              <CloseCircleOutlineIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex items-center gap-6 px-4 sm:px-6">
            <button
              onClick={() => setActiveTab('products')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'products' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              محصولات و لایسنس‌ها
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'orders' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              سفارشات
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-50 dark:bg-black/20" ref={formRef}>
          {activeTab === 'products' ? (
          <div>
          {selectedProductForLicenses ? (
            // License Manager View
            <div className="flex flex-col h-full animate-fadeIn">
              <div className="flex items-center gap-4 mb-6">
                <button 
                  onClick={closeLicenseManager}
                  className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <ArrowRight size={20} className="text-zinc-600 dark:text-zinc-400" />
                </button>
                <div className="flex flex-col">
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">مدیریت لایسنس‌ها</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">محصول: {selectedProductForLicenses.title}</p>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Licenses Form */}
                <div className="lg:col-span-1">
                  <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4">افزودن لایسنس جدید (گروهی)</h4>
                    <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                      هر لایسنس یا اکانت را در یک خط جدید وارد کنید.
                    </p>
                    <form onSubmit={handleAddLicenses} className="flex flex-col gap-4">
                      <textarea 
                        value={newLicensesText}
                        onChange={(e) => setNewLicensesText(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 text-sm outline-none transition-all min-h-[200px]"
                        placeholder="apikey_12345&#10;apikey_67890&#10;user:pass"
                        dir="ltr"
                      />
                      <button 
                        type="submit" 
                        disabled={licensesLoading || !newLicensesText.trim()}
                        className="w-full py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {licensesLoading ? 'در حال ثبت...' : 'ثبت لایسنس‌ها'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Licenses List */}
                <div className="lg:col-span-2">
                  <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm h-full">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">لیست لایسنس‌های موجود</h4>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-lg">
                        {licenses.filter(l => l.status === 'available').length} عدد موجود
                      </span>
                    </div>

                    {licensesLoading && licenses.length === 0 ? (
                      <div className="flex justify-center p-8">
                        <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-800 rounded-full animate-spin" />
                      </div>
                    ) : licenses.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 opacity-50">
                        <Key className="w-10 h-10 mb-3" />
                        <span className="text-sm font-bold">هیچ لایسنسی برای این محصول ثبت نشده است.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {licenses.map((l: any) => (
                          <div key={l.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-mono text-zinc-800 dark:text-zinc-200 truncate" dir="ltr">{l.key}</span>
                              <span className={`text-[10px] mt-1 w-max px-2 py-0.5 rounded-md ${
                                l.status === 'available' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {l.status === 'available' ? 'آماده فروش' : 'فروخته شده'}
                              </span>
                            </div>
                            {l.status === 'available' && (
                              <button 
                                onClick={() => handleDeleteLicense(l.id)}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
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
            // Product List View
            <div className="w-full flex flex-col h-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">محصولات دیجیتال</h3>
            <button 
              onClick={() => {
                if (isAdding) {
                  setIsAdding(false);
                  setEditingProductId(null);
                  setTitle('');
                  setPrice('');
                  setDescription('');
                  setCategory('account');
                  setImage('');
                } else {
                  setIsAdding(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
              <AddSquareOutlineIcon className="w-4 h-4" />
              {isAdding ? 'انصراف' : 'افزودن محصول'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold">
              {error}
            </div>
          )}

          {isAdding && (
            <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto">
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">{editingProductId ? 'ویرایش محصول' : 'تعریف محصول جدید'}</h4>
              <form onSubmit={handleAddProduct} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">نام محصول</label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-sm outline-none transition-all"
                      placeholder="مثال: API Key 5$"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">دسته بندی</label>
                    <select 
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-sm outline-none transition-all"
                    >
                      <option value="account">اکانت پرمیوم</option>
                      <option value="api">کلید API</option>
                      <option value="package">پکیج آموزشی</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">قیمت (تومان)</label>
                  <input 
                    type="text" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-sm outline-none transition-all"
                    placeholder="مثال: 50000"
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">توضیحات کوتاه</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-sm outline-none transition-all min-h-[80px]"
                    placeholder="امکانات این محصول..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">تصویر محصول (اختیاری)</label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center text-zinc-600 dark:text-zinc-400">
                      <span>انتخاب تصویر</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    </label>
                    {image && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setImage('')} 
                          className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-bl-lg text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="px-6 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold rounded-xl hover:opacity-90 transition-opacity">
                    {editingProductId ? 'ذخیره تغییرات' : 'ثبت محصول'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Product List */}
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-zinc-900 dark:border-t-zinc-100 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-50">
              <BoxLinearIcon className="w-12 h-12" />
              <span className="text-sm font-bold">هیچ محصولی یافت نشد.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {products.map(p => (
                <div key={p.id} className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all overflow-hidden relative">
                  
                  {/* Actions (Absolute top-left) */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-1 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                    <button 
                      type="button"
                      onClick={() => handleEditClick(p)}
                      className="p-1.5 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 dark:text-zinc-400 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                      title="ویرایش"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-zinc-600 hover:text-red-600 hover:bg-red-50 dark:text-zinc-400 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Image Banner */}
                  <div className="w-full h-36 bg-zinc-100 dark:bg-zinc-800 relative flex-shrink-0">
                    {p.image ? (
                      <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <BoxLinearIcon className="w-10 h-10 opacity-50" />
                      </div>
                    )}
                    <span className="absolute bottom-3 right-3 text-xs px-2.5 py-1 bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 font-medium rounded-lg shadow-sm backdrop-blur-sm">
                      {p.category}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col flex-1 p-4">
                    <h5 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 leading-relaxed line-clamp-2" title={p.title}>{p.title}</h5>
                    {p.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 leading-loose">{p.description}</p>
                    )}
                    
                    <div className="mt-auto flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">قیمت</span>
                        <span className="text-[15px] font-black text-zinc-900 dark:text-zinc-100">{p.price.toLocaleString()} <span className="text-xs font-normal text-zinc-500">تومان</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end mr-2">
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">{p.category === 'package' ? 'وضعیت' : 'موجودی'}</span>
                          <span className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                            {p.category === 'package' ? 'موجود' : `${p.stock || 0} عدد`}
                          </span>
                        </div>
                        {p.category !== 'package' && (
                          <button 
                            onClick={() => openLicenseManager(p)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
                            title="مدیریت لایسنس‌ها"
                          >
                            <Key size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
          )}
          </div>
          ) : (
            // Orders View
            <div className="flex flex-col h-full animate-fadeIn">
              <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 mb-6">سفارشات اخیر</h3>
              
              {ordersLoading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-4 opacity-50">
                  <ShopLinearIcon className="w-12 h-12" />
                  <span className="text-sm font-bold">هیچ سفارشی یافت نشد.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right">
                    <thead className="text-xs text-zinc-500 bg-zinc-100/50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-xl">شماره سفارش</th>
                        <th className="px-4 py-3">خریدار</th>
                        <th className="px-4 py-3">محصول</th>
                        <th className="px-4 py-3">مبلغ (تومان)</th>
                        <th className="px-4 py-3">وضعیت</th>
                        <th className="px-4 py-3 rounded-tl-xl">تاریخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o: any) => (
                        <tr key={o.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs">{o.id.substring(0, 8)}...</td>
                          <td className="px-4 py-3 font-medium">{o.userPhone || o.userEmail || o.userName}</td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{o.productTitle}</td>
                          <td className="px-4 py-3 font-bold">{o.amount.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                              o.paymentStatus === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' :
                              o.paymentStatus === 'failed' ? 'bg-red-50 text-red-600 dark:bg-red-900/30' :
                              'bg-amber-50 text-amber-600 dark:bg-amber-900/30'
                            }`}>
                              {o.paymentStatus === 'success' ? 'موفق' : o.paymentStatus === 'failed' ? 'ناموفق' : 'در انتظار'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400" dir="ltr">
                            {new Date(o.createdAt).toLocaleDateString('fa-IR')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
