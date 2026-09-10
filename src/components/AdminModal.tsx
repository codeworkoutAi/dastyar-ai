import React, { useState, useEffect, useRef } from 'react';
import { 
  CloseCircleOutlineIcon, 
  ShopLinearIcon,
  AddSquareOutlineIcon,
  BoxLinearIcon
} from '@solar-icons/react';
import { 
  Edit2, 
  Trash2, 
  Key, 
  ArrowRight,
  Check,
  X,
  Eye,
  Copy,
  CheckCircle2,
  XCircle,
  Search,
  AlertCircle,
  RefreshCw,
  Clock,
  Package,
  User,
  Phone,
  Mail,
  ExternalLink,
  Cpu,
  Plus,
  Sparkles,
  Code2,
  EyeOff,
  ShieldCheck,
  Activity
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { toEnglishDigits } from '../lib/persianUtils';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({ isOpen, onClose }) => {
  const { token, user } = useAuthStore();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tabs state
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'news' | 'settings'>('products');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Orders management state
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'success' | 'failed'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderActionLoadingId, setOrderActionLoadingId] = useState<string | null>(null);
  const [customLicenseInput, setCustomLicenseInput] = useState('');
  const [orderFeedback, setOrderFeedback] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [copiedKeyText, setCopiedKeyText] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  // New product form state
  const [isAdding, setIsAdding] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('account');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [image, setImage] = useState<string>('');
  const [bannerImage, setBannerImage] = useState<string>('');
  const [baseUrl, setBaseUrl] = useState('');
  const [deliveryGuide, setDeliveryGuide] = useState('');

  // Licenses state
  const [selectedProductForLicenses, setSelectedProductForLicenses] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [newLicensesText, setNewLicensesText] = useState('');
  const [licensesLoading, setLicensesLoading] = useState(false);

  // News state
  const [news, setNews] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState<string>('');
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [editingNews, setEditingNews] = useState<any | null>(null);
  const [editNewsTitle, setEditNewsTitle] = useState('');
  const [editNewsContent, setEditNewsContent] = useState('');
  const [editNewsImage, setEditNewsImage] = useState<string>('');
  const [editNewsRebroadcast, setEditNewsRebroadcast] = useState(false);
  const [editNewsLoading, setEditNewsLoading] = useState(false);

  // System Default AI Profiles (Free Cards) state
  const [defaultProfiles, setDefaultProfiles] = useState<any[]>([]);
  const [defaultProfilesLoading, setDefaultProfilesLoading] = useState(false);
  const [editingDefaultProfile, setEditingDefaultProfile] = useState<any | null>(null);
  const [isAddingDefaultProfile, setIsAddingDefaultProfile] = useState(false);
  const [profileFormName, setProfileFormName] = useState('');
  const [profileFormBaseUrl, setProfileFormBaseUrl] = useState('');
  const [profileFormApiKey, setProfileFormApiKey] = useState('');
  const [profileFormModelName, setProfileFormModelName] = useState('');
  const [profileFormCustomHeaders, setProfileFormCustomHeaders] = useState('');
  const [profileFormRole, setProfileFormRole] = useState<'default' | 'coding' | 'vision'>('default');
  const [profileFormOrderIndex, setProfileFormOrderIndex] = useState(0);
  const [profileFormIsActive, setProfileFormIsActive] = useState(true);
  const [testingProfileId, setTestingProfileId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string; latencyMs?: number } | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

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

  const fetchDefaultProfiles = async () => {
    try {
      setDefaultProfilesLoading(true);
      setError(null);
      const res = await fetch('/api/admin/default-profiles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت پروفایل‌های پیش‌فرض');
      const data = await res.json();
      setDefaultProfiles(data);
    } catch (err: any) {
      setError(err.message || 'خطای سرور');
    } finally {
      setDefaultProfilesLoading(false);
    }
  };

  const resetDefaultProfileForm = () => {
    setProfileFormName('');
    setProfileFormBaseUrl('');
    setProfileFormApiKey('');
    setProfileFormModelName('');
    setProfileFormCustomHeaders('');
    setProfileFormRole('default');
    setProfileFormOrderIndex(0);
    setProfileFormIsActive(true);
    setEditingDefaultProfile(null);
    setIsAddingDefaultProfile(false);
  };

  const openEditDefaultProfile = (profile: any) => {
    setEditingDefaultProfile(profile);
    setIsAddingDefaultProfile(true);
    setProfileFormName(profile.name || '');
    setProfileFormBaseUrl(profile.baseUrl || '');
    setProfileFormApiKey(profile.apiKey || '');
    setProfileFormModelName(profile.modelName || '');
    setProfileFormCustomHeaders(profile.customHeaders || '');
    setProfileFormRole(profile.role || 'default');
    setProfileFormOrderIndex(profile.orderIndex || 0);
    setProfileFormIsActive(profile.isActive === 1);
  };

  const handleSaveDefaultProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileFormName.trim() || !profileFormBaseUrl.trim() || !profileFormModelName.trim()) {
      alert('لطفاً نام، آدرس پایه (Base URL) و نام مدل را وارد کنید.');
      return;
    }

    try {
      setDefaultProfilesLoading(true);
      setError(null);

      const payload = {
        name: profileFormName.trim(),
        baseUrl: profileFormBaseUrl.trim(),
        apiKey: profileFormApiKey.trim(),
        modelName: profileFormModelName.trim(),
        customHeaders: profileFormCustomHeaders.trim(),
        role: profileFormRole,
        orderIndex: Number(profileFormOrderIndex) || 0,
        isActive: profileFormIsActive ? 1 : 0
      };

      let res;
      if (editingDefaultProfile) {
        res = await fetch(`/api/admin/default-profiles/${editingDefaultProfile.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/admin/default-profiles', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در ذخیره پروفایل');
      }

      resetDefaultProfileForm();
      await fetchDefaultProfiles();
    } catch (err: any) {
      setError(err.message || 'خطای سرور');
    } finally {
      setDefaultProfilesLoading(false);
    }
  };

  const handleDeleteDefaultProfile = async (id: string) => {
    if (!window.confirm('آیا از حذف این کارت مدل پیش‌فرض اطمینان دارید؟')) return;
    try {
      setDefaultProfilesLoading(true);
      const res = await fetch(`/api/admin/default-profiles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در حذف پروفایل');
      }
      await fetchDefaultProfiles();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDefaultProfilesLoading(false);
    }
  };

  const handleToggleDefaultProfileActive = async (profile: any) => {
    try {
      const res = await fetch(`/api/admin/default-profiles/${profile.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ isActive: profile.isActive === 1 ? 0 : 1 })
      });
      if (!res.ok) throw new Error('خطا در تغییر وضعیت کارت');
      await fetchDefaultProfiles();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleTestDefaultProfile = async (profile: any) => {
    try {
      setTestingProfileId(profile.id);
      setTestResult(null);

      const res = await fetch('/api/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'custom',
          customBaseUrl: profile.baseUrl,
          customApiKey: profile.apiKey || '',
          modelName: profile.modelName,
          customHeaders: profile.customHeaders,
          profileId: profile.id
        })
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          id: profile.id,
          success: true,
          message: `اتصال موفقیت‌آمیز بود! زمان پاسخ: ${data.latencyMs || 0} میلی‌ثانیه`,
          latencyMs: data.latencyMs
        });
      } else {
        setTestResult({
          id: profile.id,
          success: false,
          message: data.error || 'خطا در برقراری ارتباط با مدل'
        });
      }
    } catch (err: any) {
      setTestResult({
        id: profile.id,
        success: false,
        message: err.message || 'خطا در ارسال درخواست تست'
      });
    } finally {
      setTestingProfileId(null);
    }
  };

  useEffect(() => {
    if (isOpen && token && user?.role === 'admin') {
      if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'orders') {
        fetchOrders();
      } else if (activeTab === 'users') {
        fetchUsers();
      } else if (activeTab === 'news') {
        fetchNews();
      } else if (activeTab === 'settings') {
        fetchDefaultProfiles();
      }
    }
  }, [isOpen, token, user, activeTab]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در دریافت کاربران');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'خطای سرور');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('آیا از حذف این کاربر اطمینان دارید؟ این عمل غیرقابل بازگشت است.')) return;
    try {
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'خطا در حذف کاربر');
      }
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'خطای سرور');
    }
  };

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

  const handleUpdateOrderStatus = async (orderId: string, status: 'success' | 'failed' | 'pending') => {
    try {
      setOrderActionLoadingId(orderId);
      setOrderFeedback(null);
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در بروزرسانی وضعیت سفارش');

      if (data.warning) {
        setOrderFeedback({ type: 'warning', text: data.warning });
      } else {
        setOrderFeedback({ 
          type: 'success', 
          text: status === 'success' 
            ? 'سفارش تایید شد و لایسنس به صورت خودکار تخصیص یافت.' 
            : status === 'failed' 
            ? 'سفارش رد شد و در صورت وجود لایسنس، به انبار بازگشت.' 
            : 'وضعیت سفارش به حالت در انتظار تغییر یافت.' 
        });
      }

      await fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await fetch(`/api/admin/orders/${orderId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      setOrderFeedback({ type: 'error', text: err.message || 'خطای سرور' });
    } finally {
      setOrderActionLoadingId(null);
    }
  };

  const handleAssignLicense = async (orderId: string) => {
    if (!customLicenseInput.trim()) {
      setOrderFeedback({ type: 'error', text: 'لطفاً کلید یا متن لایسنس را وارد کنید.' });
      return;
    }
    try {
      setOrderActionLoadingId(orderId);
      setOrderFeedback(null);
      const res = await fetch(`/api/admin/orders/${orderId}/assign-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ licenseKey: customLicenseInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در تخصیص لایسنس');

      setOrderFeedback({ type: 'success', text: 'لایسنس با موفقیت به سفارش اختصاص داده شد و سفارش تایید شد.' });
      setCustomLicenseInput('');
      await fetchOrders();
      const updated = await fetch(`/api/admin/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(r => r.json());
      setSelectedOrder(updated);
    } catch (err: any) {
      setOrderFeedback({ type: 'error', text: err.message || 'خطا در تخصیص لایسنس' });
    } finally {
      setOrderActionLoadingId(null);
    }
  };

  const executeDeleteOrder = async () => {
    if (!orderToDelete) return;
    const orderId = orderToDelete;
    try {
      setOrderActionLoadingId(orderId);
      setOrderFeedback(null);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در حذف سفارش');

      setOrderFeedback({ type: 'success', text: 'سفارش با موفقیت حذف شد.' });
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
      setOrderToDelete(null);
      await fetchOrders();
    } catch (err: any) {
      setOrderFeedback({ type: 'error', text: err.message || 'خطا در حذف سفارش' });
    } finally {
      setOrderActionLoadingId(null);
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'key', idKey: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedOrderId(idKey);
      setTimeout(() => setCopiedOrderId(null), 2000);
    } else {
      setCopiedKeyText(idKey);
      setTimeout(() => setCopiedKeyText(null), 2000);
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

  const fetchNews = async () => {
    try {
      setNewsLoading(true);
      setError(null);
      const res = await fetch('/api/news');
      if (!res.ok) throw new Error('خطا در دریافت اخبار');
      const data = await res.json();
      setNews(data);
    } catch (err: any) {
      setError(err.message || 'خطای سرور');
    } finally {
      setNewsLoading(false);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsContent) {
      setError('عنوان و متن خبر اجباری است');
      return;
    }
    
    try {
      setError(null);
      setNewsLoading(true);
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          title: newsTitle,
          content: newsContent,
          image: newsImage
        })
      });
      
      if (!res.ok) throw new Error('خطا در انتشار خبر');
      
      setNewsTitle('');
      setNewsContent('');
      setNewsImage('');
      setIsAddingNews(false);
      
      fetchNews();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setNewsLoading(false);
    }
  };

  const handleDeleteNews = async (id: number) => {
    if (!window.confirm('آیا از حذف این خبر مطمئن هستید؟')) return;
    try {
      setNewsLoading(true);
      const res = await fetch(`/api/news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در حذف خبر');
      fetchNews();
    } catch (err: any) {
      setError(err.message);
      setNewsLoading(false);
    }
  };

  const handleNewsImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewsImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditNews = (item: any) => {
    setEditingNews(item);
    setEditNewsTitle(item.title || '');
    setEditNewsContent(item.content || '');
    setEditNewsImage(item.image || '');
    setEditNewsRebroadcast(false);
    setIsAddingNews(false);
    setError(null);
  };

  const cancelEditNews = () => {
    setEditingNews(null);
    setEditNewsTitle('');
    setEditNewsContent('');
    setEditNewsImage('');
    setEditNewsRebroadcast(false);
  };

  const handleEditNewsImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditNewsImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNews) return;
    if (!editNewsTitle.trim() || !editNewsContent.trim()) {
      setError('عنوان و متن خبر اجباری است');
      return;
    }

    try {
      setError(null);
      setEditNewsLoading(true);
      const res = await fetch(`/api/news/${editingNews.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editNewsTitle.trim(),
          content: editNewsContent.trim(),
          image: editNewsImage,
          rebroadcastTelegram: editNewsRebroadcast
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در ویرایش خبر');
      }

      cancelEditNews();
      await fetchNews();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setEditNewsLoading(false);
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
          longDescription,
          image,
          bannerImage,
          baseUrl,
          deliveryGuide
        })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در ذخیره محصول');
      }
      
      setTitle('');
      setPrice('');
      setDescription('');
      setLongDescription('');
      setImage('');
      setBannerImage('');
      setBaseUrl('');
      setDeliveryGuide('');
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
    setLongDescription(p.longDescription || '');
    setCategory(p.category);
    setImage(p.image || '');
    setBannerImage(p.bannerImage || '');
    setBaseUrl(p.baseUrl || '');
    setDeliveryGuide(p.deliveryGuide || '');
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

  if (!isOpen || user?.role !== 'admin') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
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
                  مدیریت محصولات، اکانت‌ها، سفارشات و لایسنس‌ها
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold text-xs transition-all shadow-sm active:scale-95 border border-red-200/80 dark:border-red-800/60"
                title="بستن پنل و بازگشت به محیط چت"
              >
                <X className="w-4 h-4" />
                <span>خروج از مدیریت</span>
              </button>
            </div>
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
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'orders' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <span>سفارشات</span>
              {orders.filter(o => o.paymentStatus === 'pending').length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white animate-pulse">
                  {orders.filter(o => o.paymentStatus === 'pending').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'users' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              کاربران
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'news' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              اخبار و وبلاگ
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === 'settings' ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-400' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              تنظیمات سیستم
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-zinc-50 dark:bg-black/20" ref={formRef}>
          {activeTab === 'users' ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  مدیریت کاربران
                </h3>
                <button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="p-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                  title="بروزرسانی لیست"
                >
                  <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold border border-red-200 dark:border-red-800/50 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto min-h-[400px]">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-700">
                        <th className="py-4 px-6 font-bold whitespace-nowrap">شناسه</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">کاربر</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">تماس</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">ربات تلگرام</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">نقش</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap">تاریخ ثبت‌نام</th>
                        <th className="py-4 px-6 font-bold whitespace-nowrap text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {users.length > 0 ? (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                            <td className="py-4 px-6 font-mono text-zinc-500">{u.id}</td>
                            <td className="py-4 px-6">
                              <div className="font-bold text-zinc-800 dark:text-zinc-200">{u.name || 'نامشخص'}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                                {u.email && <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> <span className="dir-ltr">{u.email}</span></div>}
                                {u.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> <span className="dir-ltr">{u.phone}</span></div>}
                                {!u.email && !u.phone && <span className="text-zinc-400">ثبت نشده</span>}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {u.telegramId ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md inline-block w-fit">
                                    {u.telegramId}
                                  </span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full w-fit ${u.botState === 'support' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                    {u.botState === 'support' ? 'در حال پشتیبانی' : 'عادی'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-400">ندارد</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                u.role === 'admin' 
                                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400' 
                                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}>
                                {u.role === 'admin' ? 'مدیر' : 'کاربر'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-xs text-zinc-500">
                              {new Date(u.createdAt).toLocaleDateString('fa-IR')}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center">
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  disabled={u.id === user?.id}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors disabled:opacity-30"
                                  title={u.id === user?.id ? "شما نمی‌توانید اکانت خودتان را حذف کنید" : "حذف کاربر"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-zinc-500">
                            {usersLoading ? 'در حال دریافت اطلاعات...' : 'هیچ کاربری یافت نشد.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'settings' ? (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* Default AI Profiles Management Section */}
              <div className="bg-white dark:bg-zinc-800/50 p-5 sm:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-rokh">
                        مدل‌های هوش مصنوعی پیش‌فرض سیستم (کارت‌های رایگان)
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        این کارت‌ها به صورت عمومی و رایگان برای تمامی کاربران نمایش داده می‌شوند. کلیدهای API در سرور نگهداری شده و کاربران همچنین می‌توانند کارت‌های سفارشی خود را بدون تداخل اضافه کنند.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={fetchDefaultProfiles}
                      disabled={defaultProfilesLoading}
                      className="p-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-700/60 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                      title="تازه‌سازی لیست"
                    >
                      <RefreshCw className={`w-4 h-4 ${defaultProfilesLoading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">تازه‌سازی</span>
                    </button>
                    <button
                      onClick={() => {
                        resetDefaultProfileForm();
                        setIsAddingDefaultProfile(true);
                      }}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن کارت مدل</span>
                    </button>
                  </div>
                </div>

                {/* Form to Add or Edit Default Profile */}
                {isAddingDefaultProfile && (
                  <form onSubmit={handleSaveDefaultProfile} className="mt-5 p-5 bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl border border-blue-200/60 dark:border-blue-800/40 animate-fadeIn space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                      <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-blue-500" />
                        {editingDefaultProfile ? 'ویرایش کارت مدل پیش‌فرض' : 'افزودن کارت مدل پیش‌فرض جدید'}
                      </h4>
                      <button
                        type="button"
                        onClick={resetDefaultProfileForm}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                      <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1.5">
                          نام نمایشی کارت <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileFormName}
                          onChange={(e) => setProfileFormName(e.target.value)}
                          placeholder="مثال: Qwen 3.6 27B (رایگان)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1.5">
                          شناسه مدل (Model Name) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileFormModelName}
                          onChange={(e) => setProfileFormModelName(e.target.value)}
                          placeholder="مثال: qwen/qwen3.6-27b یا gemini-3.1-flash-lite"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                          dir="ltr"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1.5">
                          نقش مدل در سیستم
                        </label>
                        <select
                          value={profileFormRole}
                          onChange={(e) => setProfileFormRole(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                        >
                          <option value="default">عمومی (چت و مکالمه پیش‌فرض)</option>
                          <option value="coding">برنامه‌نویسی و کدنویسی</option>
                          <option value="vision">بینایی و تحلیل تصویر</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1.5">
                          آدرس پایه اندپوینت (Base URL) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={profileFormBaseUrl}
                          onChange={(e) => setProfileFormBaseUrl(e.target.value)}
                          placeholder="مثال: https://api.groq.com/openai/v1 یا https://generativelanguage.googleapis.com/v1beta/openai"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                          dir="ltr"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1.5">
                          کلید دسترسی سرور (API Key)
                        </label>
                        <input
                          type="password"
                          value={profileFormApiKey}
                          onChange={(e) => setProfileFormApiKey(e.target.value)}
                          placeholder={editingDefaultProfile ? '(بدون تغییر - مقدار قبلی حفظ می‌شود)' : 'کلید دسترسی سرور'}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                          dir="ltr"
                        />
                        <span className="text-[10px] text-zinc-400 mt-1 block">
                          این کلید در سرور ذخیره می‌شود و هرگز به مرورگر کاربران ارسال نخواهد شد.
                        </span>
                      </div>

                      <div>
                        <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1.5">
                          ترتیب نمایش (اعداد کمتر بالاتر هستند)
                        </label>
                        <input
                          type="number"
                          value={profileFormOrderIndex}
                          onChange={(e) => setProfileFormOrderIndex(parseInt(toEnglishDigits(e.target.value)) || 0)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
                          min={0}
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input
                          type="checkbox"
                          id="profileFormIsActive"
                          checked={profileFormIsActive}
                          onChange={(e) => setProfileFormIsActive(e.target.checked)}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                        />
                        <label htmlFor="profileFormIsActive" className="text-zinc-700 dark:text-zinc-300 font-bold cursor-pointer">
                          این کارت فعال باشد و برای کاربران نمایش داده شود
                        </label>
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-zinc-700 dark:text-zinc-300 font-bold mb-1.5">
                          هدرهای سفارشی (Custom Headers - اختیاری)
                        </label>
                        <input
                          type="text"
                          value={profileFormCustomHeaders}
                          onChange={(e) => setProfileFormCustomHeaders(e.target.value)}
                          placeholder='مثال: {"HTTP-Referer": "https://ai.studio"} یا هدر: مقدار'
                          className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors font-mono"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={resetDefaultProfileForm}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        disabled={defaultProfilesLoading}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {defaultProfilesLoading ? (
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>{editingDefaultProfile ? 'ذخیره تغییرات کارت' : 'ایجاد کارت مدل'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* List of Default Profiles */}
                <div className="mt-5 space-y-3">
                  {defaultProfilesLoading && defaultProfiles.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-500">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-xs">در حال بارگذاری کارت‌های پیش‌فرض سیستم...</span>
                    </div>
                  ) : defaultProfiles.length === 0 ? (
                    <div className="py-10 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs">
                      هیچ کارت مدل پیش‌فرضی ثبت نشده است. با کلیک روی «افزودن کارت مدل» یک مدل جدید بسازید.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {defaultProfiles.map((p) => {
                        const isTesting = testingProfileId === p.id;
                        const result = testResult && testResult.id === p.id ? testResult : null;

                        return (
                          <div
                            key={p.id}
                            className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                              p.isActive === 1
                                ? 'bg-white dark:bg-zinc-850 border-zinc-200 dark:border-zinc-700/80 shadow-sm'
                                : 'bg-zinc-100/60 dark:bg-zinc-900/50 border-zinc-200/60 dark:border-zinc-800/80 opacity-70'
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header & Badges */}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    {p.isActive === 1 ? (
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" title="فعال" />
                                    ) : (
                                      <span className="w-2 h-2 rounded-full bg-zinc-400" title="غیرفعال" />
                                    )}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      p.role === 'coding'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                        : p.role === 'vision'
                                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                                    }`}>
                                      {p.role === 'coding' ? <Code2 className="w-3 h-3" /> : p.role === 'vision' ? <Eye className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                                      <span>{p.role === 'coding' ? 'کدنویسی' : p.role === 'vision' ? 'بینایی و تصویر' : 'عمومی'}</span>
                                    </span>
                                    <span className="text-[10px] text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-mono">
                                      ترتیب: {p.orderIndex || 0}
                                    </span>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3" />
                                      {p.apiKey ? 'کلید سرور فعال' : 'بدون کلید اختصاصی'}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleToggleDefaultProfileActive(p)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                    p.isActive === 1
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300'
                                  }`}
                                  title={p.isActive === 1 ? 'کلیک برای غیرفعال‌سازی' : 'کلیک برای فعال‌سازی'}
                                >
                                  {p.isActive === 1 ? 'فعال' : 'غیرفعال'}
                                </button>
                              </div>

                              {/* Details */}
                              <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between font-mono text-[11px]">
                                  <span className="text-zinc-400">Model:</span>
                                  <span className="font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded" dir="ltr">
                                    {p.modelName}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between font-mono text-[10px]">
                                  <span className="text-zinc-400">Endpoint:</span>
                                  <span className="text-zinc-500 truncate max-w-[200px]" dir="ltr" title={p.baseUrl}>
                                    {p.baseUrl ? p.baseUrl.replace(/^https?:\/\//, '') : '-'}
                                  </span>
                                </div>
                              </div>

                              {/* Test Result Message */}
                              {result && (
                                <div className={`p-2.5 rounded-xl text-[11px] leading-tight flex items-start gap-1.5 animate-fadeIn ${
                                  result.success
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                                }`}>
                                  {result.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                                  <span>{result.message}</span>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-1 pt-4 mt-3 border-t border-zinc-100 dark:border-zinc-800">
                              <button
                                onClick={() => handleTestDefaultProfile(p)}
                                disabled={isTesting}
                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-1"
                                title="آزمایش سرعت پاسخ و اتصال به این مدل"
                              >
                                {isTesting ? (
                                  <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Activity className="w-3 h-3 text-blue-500" />
                                )}
                                <span>تست پینگ</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openEditDefaultProfile(p)}
                                  className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                  title="ویرایش این کارت"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDefaultProfile(p.id)}
                                  className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                  title="حذف این کارت"
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
              </div>

              {/* Danger Zone Section */}
              <div className="bg-white dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700/50">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  منطقه خطر (Danger Zone)
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                  با کلیک روی دکمه زیر، تمامی اطلاعات دیتابیس (شامل محصولات، سفارشات، لایسنس‌ها و غیره) به جز حساب کاربری فعلی شما پاک خواهد شد. این عملیات غیرقابل بازگشت است و مخصوص تست سیستم می‌باشد.
                </p>
                
                <button
                  onClick={async () => {
                    if (window.confirm('آیا از پاک کردن کل دیتابیس مطمئن هستید؟ این عملیات غیرقابل بازگشت است!')) {
                      try {
                        const res = await fetch('/api/admin/reset-database', {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (res.ok) {
                          alert('دیتابیس با موفقیت صفر شد. صفحه رفرش می‌شود.');
                          window.location.reload();
                        } else {
                          alert(data.error || 'خطا در ریست دیتابیس');
                        }
                      } catch (e) {
                        alert('خطا در ارتباط با سرور');
                      }
                    }
                  }}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 max-w-xs shadow-lg shadow-red-600/20"
                >
                  <Trash2 className="w-4 h-4" />
                  پاکسازی کامل دیتابیس
                </button>
              </div>
            </div>
          ) : activeTab === 'products' ? (
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
                  setLongDescription('');
                  setCategory('account');
                  setImage('');
                  setBannerImage('');
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
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">توضیحات کوتاه (کارت محصول)</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-sm outline-none transition-all min-h-[80px]"
                    placeholder="نمایش مختصر روی کارت فروشگاه..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">توضیحات کامل (پاپ‌آپ)</label>
                  <textarea 
                    value={longDescription}
                    onChange={(e) => setLongDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-sm outline-none transition-all min-h-[150px]"
                    placeholder="توضیحات کامل محصول که در پاپ‌آپ نمایش داده می‌شود..."
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">آدرس سرور / Base URL (اختیاری برای کلید API)</label>
                  <input 
                    type="text" 
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-sm outline-none transition-all"
                    placeholder="مثال: https://api.openai.com/v1/chat/completions"
                    dir="ltr"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">راهنمای تحویل / Delivery Guide (اختیاری)</label>
                  <textarea 
                    value={deliveryGuide}
                    onChange={(e) => setDeliveryGuide(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 text-sm outline-none transition-all min-h-[100px]"
                    placeholder="راهنمای استفاده یا اطلاعات بیشتر که پس از خرید به کاربر نمایش داده می‌شود..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">تصویر محصول (مربعی)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center text-zinc-600 dark:text-zinc-400">
                        <span>{image ? 'تغییر تصویر' : 'انتخاب تصویر'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'image')} />
                      </label>
                      {image && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                          <img src={image} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setImage('')} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-bl-lg text-[10px]">✕</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">تصویر بنر (عریض - اختیاری)</label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-center text-zinc-600 dark:text-zinc-400">
                        <span>{bannerImage ? 'تغییر بنر' : 'انتخاب بنر'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'banner')} />
                      </label>
                      {bannerImage && (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                          <img src={bannerImage} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setBannerImage('')} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center rounded-bl-lg text-[10px]">✕</button>
                        </div>
                      )}
                    </div>
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
          ) : activeTab === 'news' ? (
            <div className="flex flex-col h-full animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">مدیریت اخبار و مقالات</h3>
                <button 
                  onClick={() => {
                    setIsAddingNews(!isAddingNews);
                    if (!isAddingNews) setEditingNews(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
                >
                  <AddSquareOutlineIcon className="w-4 h-4" />
                  {isAddingNews ? 'انصراف' : 'انتشار خبر جدید'}
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-bold">
                  {error}
                </div>
              )}

              {/* Edit News Form */}
              {editingNews && (
                <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-blue-500/40 dark:border-blue-500/30 shadow-lg animate-fadeIn">
                  <div className="flex items-center justify-between pb-4 mb-5 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Edit2 size={18} />
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                          ویرایش خبر #{editingNews.id}
                        </h4>
                        <span className="text-[11px] text-zinc-400">عنوان فعلی: {editingNews.title}</span>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={cancelEditNews}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="انصراف و بستن"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateNews} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">عنوان خبر</label>
                      <input 
                        type="text" 
                        value={editNewsTitle}
                        onChange={(e) => setEditNewsTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-blue-500 outline-none transition-all font-medium text-sm text-zinc-800 dark:text-zinc-100"
                        placeholder="عنوان جدید خبر..."
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">متن کامل خبر (پشتیبانی از پاراگراف‌بندی و مارک‌داون)</label>
                      <textarea 
                        value={editNewsContent}
                        onChange={(e) => setEditNewsContent(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-blue-500 outline-none transition-all min-h-[160px] text-sm text-zinc-800 dark:text-zinc-100 leading-relaxed custom-scrollbar"
                        placeholder="متن کامل مقاله یا خبر..."
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">تصویر کاور خبر</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-sm cursor-pointer text-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                          <span>انتخاب یا تغییر تصویر</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleEditNewsImageChange} />
                        </label>
                        {editNewsImage && (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                            <img src={editNewsImage} className="w-full h-full object-cover" />
                            <button 
                              type="button" 
                              onClick={() => setEditNewsImage('')} 
                              className="absolute top-1 right-1 bg-red-500/90 hover:bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow"
                              title="حذف کاور"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <input 
                        type="checkbox" 
                        id="rebroadcastTelegram" 
                        checked={editNewsRebroadcast} 
                        onChange={(e) => setEditNewsRebroadcast(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
                      />
                      <label htmlFor="rebroadcastTelegram" className="text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                        ارسال مجدد این خبر به کانال تلگرام پس از ذخیره تغییرات
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={cancelEditNews}
                        className="px-5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        انصراف
                      </button>
                      <button 
                        type="submit" 
                        disabled={editNewsLoading} 
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-sm flex items-center gap-2"
                      >
                        {editNewsLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {isAddingNews && (
                <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                  <form onSubmit={handleAddNews} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">عنوان خبر</label>
                      <input 
                        type="text" 
                        value={newsTitle}
                        onChange={(e) => setNewsTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 outline-none transition-all"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">متن کامل خبر (پشتیبانی از پاراگراف‌بندی)</label>
                      <textarea 
                        value={newsContent}
                        onChange={(e) => setNewsContent(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 focus:border-zinc-400 outline-none transition-all min-h-[150px]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400">کاور خبر (اختیاری)</label>
                      <div className="flex items-center gap-4">
                        <label className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 text-sm cursor-pointer text-center">
                          <span>انتخاب تصویر</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleNewsImageChange} />
                        </label>
                        {newsImage && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0">
                            <img src={newsImage} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setNewsImage('')} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 flex items-center justify-center text-[10px]">✕</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button type="submit" disabled={newsLoading} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {newsLoading ? 'در حال ارسال به تلگرام...' : 'انتشار خبر در سایت و تلگرام'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {newsLoading && !isAddingNews ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-8 h-8 border-2 border-zinc-200 border-t-blue-600 rounded-full animate-spin" />
                </div>
              ) : news.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 opacity-50">
                  <span className="text-sm font-bold">هیچ خبری ثبت نشده است.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {news.map(n => (
                    <div key={n.id} className="flex flex-col bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden relative group">
                      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                        <button 
                          onClick={() => startEditNews(n)} 
                          className="p-1.5 bg-white/90 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 text-blue-600 dark:text-blue-400 rounded-lg backdrop-blur-sm transition-all shadow-sm"
                          title="ویرایش خبر"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteNews(n.id)} 
                          className="p-1.5 bg-white/90 hover:bg-white dark:bg-black/60 dark:hover:bg-black/80 text-red-500 rounded-lg backdrop-blur-sm transition-all shadow-sm"
                          title="حذف خبر"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {n.image && <img src={n.image} className="w-full h-32 object-cover" />}
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="font-bold mb-2 line-clamp-1">{n.title}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-2">{n.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Orders View
            <div className="flex flex-col h-full animate-fadeIn space-y-6">
              {/* Orders Header & Actions Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">مدیریت و تایید سفارشات</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    بررسی فاکتورها، تایید دستی پرداخت، و تخصیص خودکار یا دستی لایسنس به خریداران
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchOrders}
                    disabled={ordersLoading}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors shrink-0 disabled:opacity-50 shadow-sm"
                    title="بروزرسانی لیست سفارشات"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? 'animate-spin' : ''}`} />
                    <span>بروزرسانی لیست</span>
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {orderFeedback && (
                <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm font-bold animate-slideUpScale ${
                  orderFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                  orderFeedback.type === 'warning' ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                  'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    {orderFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> :
                     orderFeedback.type === 'warning' ? <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" /> :
                     <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                    <span>{orderFeedback.text}</span>
                  </div>
                  <button 
                    onClick={() => setOrderFeedback(null)} 
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Filters & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    onClick={() => setOrderStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      orderStatusFilter === 'all'
                        ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    همه ({orders.length})
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                      orderStatusFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                    }`}
                  >
                    <span>در انتظار تایید</span>
                    {orders.filter(o => o.paymentStatus === 'pending').length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-600 text-white text-[10px] rounded-full">
                        {orders.filter(o => o.paymentStatus === 'pending').length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('success')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      orderStatusFilter === 'success'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                  >
                    موفق ({orders.filter(o => o.paymentStatus === 'success').length})
                  </button>
                  <button
                    onClick={() => setOrderStatusFilter('failed')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      orderStatusFilter === 'failed'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                    }`}
                  >
                    ناموفق / لغو ({orders.filter(o => o.paymentStatus === 'failed').length})
                  </button>
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="جستجوی سفارش، خریدار، محصول..."
                    className="w-full pr-9 pl-4 py-1.5 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 focus:border-blue-500 focus:outline-none transition-all placeholder:text-zinc-400"
                  />
                  {orderSearch && (
                    <button
                      onClick={() => setOrderSearch('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Table / Empty State */}
              {ordersLoading ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                  <div className="w-8 h-8 border-2 border-zinc-200 dark:border-zinc-800 border-t-blue-600 rounded-full animate-spin mb-3" />
                  <span className="text-xs text-zinc-500">در حال دریافت لیست سفارشات...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4 opacity-50 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                  <ShopLinearIcon className="w-12 h-12 text-zinc-400" />
                  <span className="text-sm font-bold text-zinc-600 dark:text-zinc-400">هیچ سفارشی ثبت نشده است.</span>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm custom-scrollbar">
                  <table className="w-full text-sm text-right">
                    <thead className="text-xs font-bold text-zinc-500 bg-zinc-100/70 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="px-4 py-3.5 rounded-tr-2xl">شماره سفارش</th>
                        <th className="px-4 py-3.5">خریدار</th>
                        <th className="px-4 py-3.5">محصول</th>
                        <th className="px-4 py-3.5">مبلغ</th>
                        <th className="px-4 py-3.5">وضعیت پرداخت</th>
                        <th className="px-4 py-3.5">لایسنس / دسترسی</th>
                        <th className="px-4 py-3.5">تاریخ</th>
                        <th className="px-4 py-3.5 text-center rounded-tl-2xl">عملیات مدیریت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {orders
                        .filter((o: any) => {
                          if (orderStatusFilter !== 'all' && o.paymentStatus !== orderStatusFilter) return false;
                          if (orderSearch.trim()) {
                            const q = orderSearch.toLowerCase();
                            const idM = o.id?.toLowerCase().includes(q);
                            const userM = (o.userPhone || o.userEmail || o.userName || '').toLowerCase().includes(q);
                            const prodM = (o.productTitle || '').toLowerCase().includes(q);
                            const keyM = (o.licenseKey || '').toLowerCase().includes(q);
                            return idM || userM || prodM || keyM;
                          }
                          return true;
                        })
                        .map((o: any) => {
                          const isProcessing = orderActionLoadingId === o.id;
                          return (
                            <tr 
                              key={o.id} 
                              className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors ${
                                o.paymentStatus === 'pending' ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                              }`}
                            >
                              {/* Order ID */}
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                  <span>{o.id}</span>
                                  <button
                                    onClick={() => copyToClipboard(o.id, 'id', o.id)}
                                    className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-zinc-400 hover:text-zinc-600 transition-colors"
                                    title="کپی شناسه سفارش"
                                  >
                                    {copiedOrderId === o.id ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </td>

                              {/* Buyer Info */}
                              <td className="px-4 py-3.5">
                                <div className="flex flex-col">
                                  <span className="font-bold text-zinc-900 dark:text-zinc-100 text-xs">
                                    {o.userName || 'کاربر'}
                                  </span>
                                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 dir-ltr text-right truncate max-w-[150px]">
                                    {o.userPhone || o.userEmail || 'فاقد شماره/ایمیل'}
                                  </span>
                                </div>
                              </td>

                              {/* Product Info */}
                              <td className="px-4 py-3.5">
                                <div className="flex flex-col">
                                  <span className="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate max-w-[160px]" title={o.productTitle}>
                                    {o.productTitle}
                                  </span>
                                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                                    {o.productCategory === 'package' ? 'پکیج دانلودی' : o.productCategory === 'api' ? 'کلید API' : 'اکانت پرمیوم'}
                                  </span>
                                </div>
                              </td>

                              {/* Amount */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                                  {Number(o.amount).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-zinc-500 mr-1">تومان</span>
                              </td>

                              {/* Status Badge */}
                              <td className="px-4 py-3.5 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg ${
                                  o.paymentStatus === 'success' 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' 
                                    : o.paymentStatus === 'failed' 
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' 
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-400/50 animate-pulse'
                                }`}>
                                  {o.paymentStatus === 'success' ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      موفق
                                    </>
                                  ) : o.paymentStatus === 'failed' ? (
                                    <>
                                      <XCircle className="w-3 h-3" />
                                      ناموفق
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-3 h-3" />
                                      در انتظار تایید
                                    </>
                                  )}
                                </span>
                              </td>

                              {/* License / Delivery Status */}
                              <td className="px-4 py-3.5">
                                {o.productCategory === 'package' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                    پکیج دانلودی
                                  </span>
                                ) : o.licenseKey ? (
                                  <div className="flex items-center gap-1 max-w-[170px] bg-zinc-100 dark:bg-zinc-800 p-1 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700">
                                    <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate dir-ltr flex-1" title={o.licenseKey}>
                                      {o.licenseKey}
                                    </span>
                                    <button
                                      onClick={() => copyToClipboard(o.licenseKey, 'key', o.id)}
                                      className="text-zinc-400 hover:text-blue-600 transition-colors p-0.5"
                                      title="کپی لایسنس"
                                    >
                                      {copiedKeyText === o.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                ) : o.paymentStatus === 'success' ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400" title="موجودی تمام شده است">
                                    فاقد لایسنس (انبار خالی)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-zinc-400">
                                    در انتظار پرداخت
                                  </span>
                                )}
                              </td>

                              {/* Date */}
                              <td className="px-4 py-3.5 text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap" dir="ltr">
                                {new Date(o.createdAt).toLocaleDateString('fa-IR', {
                                  month: 'numeric',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>

                              {/* Actions */}
                              <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  {/* Quick Approve Button for Pending Orders */}
                                  {o.paymentStatus === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateOrderStatus(o.id, 'success');
                                      }}
                                      disabled={isProcessing}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                      title="تایید سفارش و تخصیص خودکار لایسنس"
                                    >
                                      {isProcessing ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                      <span>تایید</span>
                                    </button>
                                  )}

                                  {/* Quick Reject Button for Pending Orders */}
                                  {o.paymentStatus === 'pending' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateOrderStatus(o.id, 'failed');
                                      }}
                                      disabled={isProcessing}
                                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-400 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-50"
                                      title="رد کردن یا لغو سفارش"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>رد</span>
                                    </button>
                                  )}

                                  {/* View Details / Manual Edit */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrder(o);
                                    }}
                                    className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors"
                                    title="مشاهده جزئیات و مدیریت لایسنس"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>

                                  {/* Delete Order */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOrderToDelete(o.id);
                                    }}
                                    disabled={isProcessing}
                                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors disabled:opacity-50"
                                    title="حذف سفارش"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Order Details Modal */}
              {selectedOrder && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
                  <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedOrder(null)}
                  />
                  
                  <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUpScale">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            جزئیات سفارش <span className="font-mono text-blue-600 dark:text-blue-400">{selectedOrder.id}</span>
                          </h4>
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {new Date(selectedOrder.createdAt).toLocaleDateString('fa-IR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Buyer Info */}
                        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/50 flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            مشخصات مشتری
                          </span>
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                            {selectedOrder.userName || 'کاربر بدون نام'}
                          </span>
                          <div className="text-xs text-zinc-600 dark:text-zinc-300 font-mono dir-ltr text-right truncate">
                            {selectedOrder.userPhone || selectedOrder.userEmail || 'فاقد ایمیل یا شماره'}
                          </div>
                        </div>

                        {/* Product & Price Info */}
                        <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/50 flex flex-col gap-1.5">
                          <span className="text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                            <ShopLinearIcon className="w-3.5 h-3.5" />
                            محصول و مبلغ
                          </span>
                          <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                            {selectedOrder.productTitle}
                          </span>
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {Number(selectedOrder.amount).toLocaleString()} تومان
                          </span>
                        </div>
                      </div>

                      {/* Status Management */}
                      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/50 space-y-2.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                          تغییر وضعیت پرداخت این سفارش:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(selectedOrder.id, 'success');
                            }}
                            disabled={orderActionLoadingId === selectedOrder.id}
                            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              selectedOrder.paymentStatus === 'success'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>موفق (تایید)</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(selectedOrder.id, 'pending');
                            }}
                            disabled={orderActionLoadingId === selectedOrder.id}
                            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              selectedOrder.paymentStatus === 'pending'
                                ? 'bg-amber-500 text-white shadow-md'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600'
                            }`}
                          >
                            <Clock className="w-4 h-4" />
                            <span>در انتظار</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateOrderStatus(selectedOrder.id, 'failed');
                            }}
                            disabled={orderActionLoadingId === selectedOrder.id}
                            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                              selectedOrder.paymentStatus === 'failed'
                                ? 'bg-red-600 text-white shadow-md'
                                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>رد / لغو</span>
                          </button>
                        </div>
                      </div>

                      {/* License Management Section (if not package) */}
                      {selectedOrder.productCategory !== 'package' && (
                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/50 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                              <Key className="w-4 h-4 text-blue-600" />
                              لایسنس متصل به سفارش
                            </span>
                            <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              موجودی آزاد انبار: <span className="font-bold text-blue-600">{selectedOrder.availableStock ?? 0}</span> عدد
                            </span>
                          </div>

                          {selectedOrder.licenseKey ? (
                            <div className="p-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 space-y-2">
                              <div className="flex items-center justify-between text-[11px] text-zinc-500">
                                <span>کلید تحویل داده شده به کاربر:</span>
                                <button
                                  onClick={() => copyToClipboard(selectedOrder.licenseKey, 'key', 'modal')}
                                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 text-xs"
                                >
                                  {copiedKeyText === 'modal' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  {copiedKeyText === 'modal' ? 'کپی شد!' : 'کپی کلید'}
                                </button>
                              </div>
                              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/70 rounded-lg font-mono text-xs text-zinc-800 dark:text-zinc-200 dir-ltr break-all select-all">
                                {selectedOrder.licenseKey}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs">
                              هنوز لایسنسی به این سفارش تخصیص نیافته است.
                            </div>
                          )}

                          {/* Manual License Form */}
                          <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 space-y-2">
                            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block">
                              تخصیص یا جایگزینی دستی لایسنس برای این سفارش:
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={customLicenseInput}
                                onChange={(e) => setCustomLicenseInput(e.target.value)}
                                placeholder="کلید لایسنس جدید را وارد کنید..."
                                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:outline-none"
                                dir="ltr"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAssignLicense(selectedOrder.id);
                                }}
                                disabled={orderActionLoadingId === selectedOrder.id || !customLicenseInput.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
                              >
                                ثبت و تخصیص
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end shrink-0">
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors"
                      >
                        بستن
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Delete Order Confirmation Dialog */}
              {orderToDelete && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 animate-fadeIn">
                  <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOrderToDelete(null);
                    }}
                  />
                  
                  <div 
                    className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center animate-slideUpScale"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
                      <Trash2 className="w-6 h-6" />
                    </div>
                    
                    <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                      حذف سفارش
                    </h4>
                    
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
                      آیا از حذف کامل سفارش <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{orderToDelete}</span> اطمینان دارید؟
                      <br />
                      (در صورت موفق بودن سفارش، لایسنس به انبار آزاد می‌شود)
                    </p>
                    
                    <div className="flex items-center gap-3 w-full">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrderToDelete(null);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        انصراف
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          executeDeleteOrder();
                        }}
                        disabled={orderActionLoadingId === orderToDelete}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center justify-center gap-1.5 shadow-sm shadow-red-600/20 disabled:opacity-50"
                      >
                        {orderActionLoadingId === orderToDelete ? (
                          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          'بله، حذف کن'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
