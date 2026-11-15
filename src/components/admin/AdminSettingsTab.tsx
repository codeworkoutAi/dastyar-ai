import React, { useState, useEffect } from 'react';
import { 
  Cpu, Key, RefreshCw, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, ShieldAlert, DollarSign, Sliders, Sparkles, 
  CreditCard, Globe, Zap, Check, X, ShieldCheck, Save
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { adminFetch } from '../../lib/adminApi';
import { AdminToast } from './AdminToast';
import { AdminConfirmModal } from './AdminConfirmModal';

interface ProfileFormData {
  id: string;
  role: string;
  title: string;
  description: string;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  orderIndex: number;
  isActive: boolean;
}

const INITIAL_PROFILE_FORM: ProfileFormData = {
  id: '',
  role: 'default',
  title: '',
  description: '',
  modelName: '',
  baseUrl: '',
  apiKey: '',
  orderIndex: 0,
  isActive: true
};

export const AdminSettingsTab: React.FC = () => {
  const { syncSystemProfiles } = useSettingsStore();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // 1. AI Profiles state
  const [defaultProfiles, setDefaultProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormData>(INITIAL_PROFILE_FORM);
  const [profSaving, setProfSaving] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  // Model connection test
  const [testingProfileId, setTestingProfileId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string; latencyMs?: number } | null>(null);

  // 2. Gateways & Rates state
  const [zarinpalMerchantId, setZarinpalMerchantId] = useState('');
  const [zarinpalSandbox, setZarinpalSandbox] = useState(false);
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<{ valid: boolean; message: string; serverIp?: string } | null>(null);

  const [bazaarpayDestination, setBazaarpayDestination] = useState('');
  const [bazaarpayToken, setBazaarpayToken] = useState('');
  const [bazaarpayEnabled, setBazaarpayEnabled] = useState(false);
  const [testingBazaar, setTestingBazaar] = useState(false);
  const [bazaarTestResult, setBazaarTestResult] = useState<{ valid: boolean; message: string } | null>(null);

  // Rates & Bonus
  const [sellingRate, setSellingRate] = useState('200000');
  const [welcomeBonus, setWelcomeBonus] = useState('50000');
  const [welcomeBonusEnabled, setWelcomeBonusEnabled] = useState(true);
  const [freeKeyPool, setFreeKeyPool] = useState('');

  // Multi-Pool state
  const [geminiKeysPool, setGeminiKeysPool] = useState('');
  const [groqKeysPool, setGroqKeysPool] = useState('');
  const [poolStats, setPoolStats] = useState<{
    gemini?: { total: number; ready: number; cooling: number; quarantined: number };
    groq?: { total: number; ready: number; cooling: number; quarantined: number };
  } | null>(null);
  const [loadingPoolStats, setLoadingPoolStats] = useState(false);
  const [savingPool, setSavingPool] = useState<'gemini' | 'groq' | null>(null);
  const [poolFeedback, setPoolFeedback] = useState<{ pool: 'gemini' | 'groq'; success: boolean; message: string } | null>(null);

  // 3. Site Limits & Quotas
  const [freeDailyLimitGuest, setFreeDailyLimitGuest] = useState('15');
  const [freeCooldownHours, setFreeCooldownHours] = useState('24');
  const [freeDailyImageLimit, setFreeDailyImageLimit] = useState('4');
  const [newsAutoPublish, setNewsAutoPublish] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Reset database modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const showToast = (message: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const updateProfileField = <K extends keyof ProfileFormData>(key: K, value: ProfileFormData[K]) => {
    setProfileForm(prev => ({ ...prev, [key]: value }));
  };

  const fetchAllSettings = async () => {
    setLoading(true);
    await Promise.allSettled([
      fetchDefaultProfiles(),
      fetchSiteSettings(),
      fetchGatewaysAndRates(),
      fetchPoolStats(),
    ]);
    setLoading(false);
  };

  const fetchPoolStats = async () => {
    try {
      setLoadingPoolStats(true);
      const data = await adminFetch<any>('/api/admin/pools/health');
      setPoolStats(data);
    } catch (err) {
      console.warn('Error fetching pool stats:', err);
    } finally {
      setLoadingPoolStats(false);
    }
  };

  const fetchDefaultProfiles = async () => {
    try {
      setProfilesLoading(true);
      const data = await adminFetch<any[]>('/api/admin/default-profiles');
      setDefaultProfiles(data);
    } catch (err: any) {
      console.error('Error fetching default profiles:', err);
    } finally {
      setProfilesLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const data = await adminFetch<any>('/api/admin/settings');
      if (data.news_auto_publish !== undefined) setNewsAutoPublish(data.news_auto_publish === '1' || data.news_auto_publish === true || data.news_auto_publish === 'true');
      if (data.api_dollar_rate !== undefined) setSellingRate(String(data.api_dollar_rate));
      if (data.welcome_bonus_amount !== undefined) setWelcomeBonus(String(data.welcome_bonus_amount));
      if (data.welcome_bonus_enabled !== undefined) setWelcomeBonusEnabled(data.welcome_bonus_enabled === 'true' || data.welcome_bonus_enabled === '1');
      if (data.free_daily_limit_guest !== undefined) setFreeDailyLimitGuest(String(data.free_daily_limit_guest));
      if (data.free_cooldown_hours !== undefined) setFreeCooldownHours(String(data.free_cooldown_hours));
      if (data.free_daily_image_limit !== undefined) setFreeDailyImageLimit(String(data.free_daily_image_limit));
      if (data.gemini_keys_pool !== undefined) setGeminiKeysPool(String(data.gemini_keys_pool));
      if (data.groq_keys_pool !== undefined) setGroqKeysPool(String(data.groq_keys_pool));
    } catch (err) {
      console.error('Error fetching site settings:', err);
    }
  };

  const fetchGatewaysAndRates = async () => {
    try {
      const [gwRes, bazaarRes, finRes] = await Promise.allSettled([
        adminFetch<any>('/api/admin/gateway-status'),
        adminFetch<any>('/api/admin/bazaarpay-status'),
        adminFetch<any>('/api/admin/financial-summary')
      ]);

      if (gwRes.status === 'fulfilled') {
        const d = gwRes.value;
        if (d.merchantId) setZarinpalMerchantId(d.merchantId);
        setZarinpalSandbox(Boolean(d.sandbox));
        setGatewayEnabled(Boolean(d.enabled));
      }

      if (bazaarRes.status === 'fulfilled') {
        const d = bazaarRes.value;
        if (d.destination) setBazaarpayDestination(d.destination);
        if (d.token) setBazaarpayToken(d.token);
        setBazaarpayEnabled(Boolean(d.enabled));
      }

      if (finRes.status === 'fulfilled') {
        if (finRes.value.sellingRate) setSellingRate(String(finRes.value.sellingRate));
        if (finRes.value.freeKeyPool) setFreeKeyPool(finRes.value.freeKeyPool);
      }
    } catch (err) {
      console.error('Error fetching gateways:', err);
    }
  };

  const handleTestProfileConnection = async (profileId: string) => {
    try {
      setTestingProfileId(profileId);
      setTestResult(null);
      const res = await adminFetch<any>(`/api/admin/default-profiles/${profileId}/test-connection`, {
        method: 'POST'
      });
      setTestResult({
        id: profileId,
        success: res.success,
        message: res.message,
        latencyMs: res.latencyMs
      });
    } catch (err: any) {
      setTestResult({
        id: profileId,
        success: false,
        message: err.message || 'خطا در برقراری ارتباط'
      });
    } finally {
      setTestingProfileId(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.id.trim() || !profileForm.title.trim() || !profileForm.modelName.trim()) {
      showToast('لطفاً فیلدهای شناسه، عنوان و نام مدل را پر کنید.', 'warning');
      return;
    }

    try {
      setProfSaving(true);
      const url = editingProfileId ? `/api/admin/default-profiles/${editingProfileId}` : '/api/admin/default-profiles';
      const method = editingProfileId ? 'PUT' : 'POST';

      await adminFetch(url, {
        method,
        body: JSON.stringify({
          id: profileForm.id,
          role: profileForm.role,
          title: profileForm.title,
          description: profileForm.description,
          modelName: profileForm.modelName,
          baseUrl: profileForm.baseUrl,
          apiKey: profileForm.apiKey,
          orderIndex: Number(profileForm.orderIndex),
          isActive: profileForm.isActive ? 1 : 0
        })
      });

      showToast(editingProfileId ? 'کارت مدل با موفقیت ویرایش شد.' : 'کارت مدل جدید با موفقیت اضافه شد.', 'success');
      setIsAddingProfile(false);
      setEditingProfileId(null);
      setProfileForm(INITIAL_PROFILE_FORM);
      await fetchDefaultProfiles();
      syncSystemProfiles();
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره کارت مدل', 'error');
    } finally {
      setProfSaving(false);
    }
  };

  const handleEditProfileClick = (p: any) => {
    setProfileForm({
      id: p.id,
      role: p.role || 'default',
      title: p.title || '',
      description: p.description || '',
      modelName: p.modelName || '',
      baseUrl: p.baseUrl || '',
      apiKey: p.apiKey || '',
      orderIndex: p.orderIndex || 0,
      isActive: p.isActive !== 0
    });
    setEditingProfileId(p.id);
    setIsAddingProfile(true);
  };

  const executeDeleteProfile = async () => {
    if (!profileToDelete) return;
    try {
      setIsDeletingProfile(true);
      await adminFetch(`/api/admin/default-profiles/${profileToDelete}`, { method: 'DELETE' });
      showToast('کارت مدل با موفقیت حذف شد.', 'success');
      setProfileToDelete(null);
      fetchDefaultProfiles();
    } catch (err: any) {
      showToast(err.message || 'خطا در حذف کارت مدل', 'error');
    } finally {
      setIsDeletingProfile(false);
    }
  };

  // Save Site setting helper
  const handleSaveSetting = async (key: string, value: any) => {
    try {
      setSettingsSaving(true);
      await adminFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value })
      });
      showToast('تنظیمات با موفقیت به‌روزرسانی شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره تنظیم', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Batch Save Rates & Quotas
  const handleBatchSaveRatesAndQuotas = async () => {
    try {
      setSettingsSaving(true);
      await Promise.all([
        adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'selling_rate', value: sellingRate }) }),
        adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'welcome_bonus', value: welcomeBonus }) }),
        adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'welcome_bonus_enabled', value: welcomeBonusEnabled ? 'true' : 'false' }) }),
        adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'free_daily_limit_guest', value: freeDailyLimitGuest }) }),
        adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'free_cooldown_hours', value: freeCooldownHours }) }),
        adminFetch('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key: 'free_daily_image_limit', value: freeDailyImageLimit }) }),
      ]);
      showToast('تمامی نرخ‌ها، سهمیه‌ها و محدودیت‌ها با موفقیت ذخیره شدند.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره دسته‌ای تنظیمات', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Save Multi-Pool keys
  const handleSavePool = async (provider: 'gemini' | 'groq') => {
    try {
      setSavingPool(provider);
      setPoolFeedback(null);
      const keysText = provider === 'gemini' ? geminiKeysPool : groqKeysPool;
      const count = keysText.split(/[\n,;]+/).map(k => k.trim()).filter(Boolean).length;

      await adminFetch('/api/admin/pools/keys', {
        method: 'PUT',
        body: JSON.stringify({ provider, keys: keysText })
      });

      const msg = `استخر ${provider === 'gemini' ? 'Gemini' : 'Groq'} با ${count} کلید معتبر ذخیره و همگام‌سازی شد.`;
      setPoolFeedback({ pool: provider, success: true, message: msg });
      showToast(msg, 'success');
      await fetchPoolStats();
    } catch (err: any) {
      const errMsg = err.message || 'خطا در ذخیره استخر کلیدها';
      setPoolFeedback({ pool: provider, success: false, message: errMsg });
      showToast(errMsg, 'error');
    } finally {
      setSavingPool(null);
    }
  };

  // Test Zarinpal Gateway
  const handleTestGateway = async () => {
    try {
      setTestingGateway(true);
      setGatewayTestResult(null);
      const data = await adminFetch<any>('/api/admin/test-gateway', {
        method: 'POST',
        body: JSON.stringify({
          merchantId: zarinpalMerchantId.trim(),
          sandbox: zarinpalSandbox
        })
      });
      setGatewayTestResult(data);
    } catch (err: any) {
      setGatewayTestResult({ valid: false, message: err.message || 'خطای شبکه در تست درگاه' });
    } finally {
      setTestingGateway(false);
    }
  };

  // Save Zarinpal Gateway
  const handleSaveGateway = async () => {
    try {
      setSettingsSaving(true);
      await adminFetch('/api/admin/gateway-settings', {
        method: 'PUT',
        body: JSON.stringify({
          merchantId: zarinpalMerchantId.trim(),
          sandbox: zarinpalSandbox,
          enabled: gatewayEnabled
        })
      });
      showToast('تنظیمات درگاه شاپرک با موفقیت ذخیره شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره درگاه', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Test BazaarPay Gateway
  const handleTestBazaar = async () => {
    try {
      setTestingBazaar(true);
      setBazaarTestResult(null);
      const data = await adminFetch<any>('/api/admin/test-bazaarpay', {
        method: 'POST',
        body: JSON.stringify({
          destination: bazaarpayDestination.trim(),
          token: bazaarpayToken.trim()
        })
      });
      setBazaarTestResult(data);
    } catch (err: any) {
      setBazaarTestResult({ valid: false, message: err.message || 'خطای شبکه در تست بازارپی' });
    } finally {
      setTestingBazaar(false);
    }
  };

  // Save BazaarPay Gateway
  const handleSaveBazaar = async () => {
    try {
      setSettingsSaving(true);
      await adminFetch('/api/admin/bazaarpay-settings', {
        method: 'PUT',
        body: JSON.stringify({
          destination: bazaarpayDestination.trim(),
          token: bazaarpayToken.trim(),
          enabled: bazaarpayEnabled
        })
      });
      showToast('تنظیمات بازارپی با موفقیت ذخیره شد.', 'success');
    } catch (err: any) {
      showToast(err.message || 'خطا در ذخیره بازارپی', 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Reset DB handler
  const executeResetDatabase = async () => {
    try {
      setResetLoading(true);
      await adminFetch('/api/admin/reset-database', {
        method: 'POST',
        body: JSON.stringify({ confirm: 'RESET-DB' })
      });
      showToast('دیتابیس با موفقیت صفر شد. صفحه بارگذاری مجدد می‌شود.', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      showToast(err.message || 'خطا در ریست دیتابیس', 'error');
      setResetLoading(false);
    }
  };

  return (
    <div dir="rtl" className="space-y-8 animate-fadeIn">
      {/* Toast */}
      {toast && (
        <AdminToast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Confirmation Modal for Profile Delete */}
      <AdminConfirmModal
        isOpen={Boolean(profileToDelete)}
        title="حذف کارت مدل"
        description={`آیا از حذف کارت پیش‌فرض «${profileToDelete}» اطمینان دارید؟`}
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        isDanger={true}
        loading={isDeletingProfile}
        onConfirm={executeDeleteProfile}
        onClose={() => setProfileToDelete(null)}
      />

      {/* Confirmation Modal for Reset Database */}
      <AdminConfirmModal
        isOpen={showResetModal}
        title="ریست کامل دیتابیس (هشدار بسیار خطرناک)"
        description="هشدار: با اجرای این عملیات تمام پیام‌ها، تراکنش‌ها، سفارش‌ها، سهمیه‌ها و کاربران به طور دائمی پاک شده و دیتابیس به تنظیمات اولیه کارخانه بازمی‌گردد. جهت تأیید قطعی، لطفاً عبارت RESET-DB را در کادر زیر تایپ نمایید:"
        confirmLabel="صفر کردن و بازنشانی قطعی دیتابیس"
        cancelLabel="انصراف"
        isDanger={true}
        requireInputText="RESET-DB"
        loading={resetLoading}
        onConfirm={executeResetDatabase}
        onClose={() => setShowResetModal(false)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
        <div>
          <h2 className="text-xl font-black text-[var(--text-main)] flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-500" />
            تنظیمات کلی سیستم
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            پیکربندی هوش‌های مصنوعی پیش‌فرض، درگاه‌های بانکی، نرخ تبدیل ارز و ریست پایگاه داده
          </p>
        </div>

        <button
          onClick={fetchAllSettings}
          disabled={loading}
          className="clay-btn px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>بروزرسانی داده‌ها</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. AI Profiles Management */}
      {/* ========================================================================= */}
      <div className="clay-card p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-base text-[var(--text-main)]">مدیریت کارت‌های هوش مصنوعی</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                تنظیم ۶ مدل پیش‌فرض سیستم برای نقش‌های مختلف و تست پینگ هر مدل
              </p>
            </div>
          </div>

          {!isAddingProfile && (
            <button
              onClick={() => {
                setEditingProfileId(null);
                setProfileForm(INITIAL_PROFILE_FORM);
                setIsAddingProfile(true);
              }}
              className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کارت مدل جدید</span>
            </button>
          )}
        </div>

        {/* Form Modal/Section */}
        {isAddingProfile && (
          <form onSubmit={handleSaveProfile} className="clay-subcard p-5 rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-subtle pb-3">
              <h4 className="font-bold text-sm text-[var(--text-main)]">
                {editingProfileId ? `ویرایش کارت مدل: ${editingProfileId}` : 'افزودن کارت مدل جدید'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingProfile(false);
                  setEditingProfileId(null);
                }}
                className="clay-btn p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">شناسه کارت (ID) *</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingProfileId)}
                  value={profileForm.id}
                  onChange={e => updateProfileField('id', e.target.value)}
                  placeholder="مثال: free_default"
                  className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">نقش سیستم (Role) *</label>
                <select
                  value={profileForm.role}
                  onChange={e => updateProfileField('role', e.target.value)}
                  className="clay-input w-full px-3 py-2 rounded-xl text-xs"
                >
                  <option value="default">پیش‌فرض چت (default)</option>
                  <option value="coding">برنامه‌نویسی (coding)</option>
                  <option value="vision">بینایی و اسناد (vision)</option>
                  <option value="paid_default">چت پیشرفته پولی (paid_default)</option>
                  <option value="paid_coding">کدنویسی پیشرفته پولی (paid_coding)</option>
                  <option value="paid_vision">اسناد پیشرفته پولی (paid_vision)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">عنوان فارسی کارت *</label>
                <input
                  type="text"
                  required
                  value={profileForm.title}
                  onChange={e => updateProfileField('title', e.target.value)}
                  placeholder="مثال: دستیار چت و گفتگو"
                  className="clay-input w-full px-3 py-2 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">نام فنی مدل *</label>
                <input
                  type="text"
                  required
                  value={profileForm.modelName}
                  onChange={e => updateProfileField('modelName', e.target.value)}
                  placeholder="مثال: gemini-2.5-flash یا claude-3-5-sonnet"
                  className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">آدرس پایه API (Base URL)</label>
                <input
                  type="text"
                  value={profileForm.baseUrl}
                  onChange={e => updateProfileField('baseUrl', e.target.value)}
                  placeholder="https://generativelanguage.googleapis.com یا خالی"
                  className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-muted)]">کلید اختصاصی API (اختیاری)</label>
                <input
                  type="password"
                  value={profileForm.apiKey}
                  onChange={e => updateProfileField('apiKey', e.target.value)}
                  placeholder="در صورت خالی بودن از کلیدهای استخر استفاده می‌شود"
                  className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-muted)]">توضیح کوتاه کارت</label>
              <input
                type="text"
                value={profileForm.description}
                onChange={e => updateProfileField('description', e.target.value)}
                placeholder="توضیح عملکرد این کارت در رابط کاربری..."
                className="clay-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={profileForm.isActive}
                  onChange={e => updateProfileField('isActive', e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500"
                />
                <span>فعال و قابل استفاده در سیستم</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingProfile(false)}
                  className="clay-btn px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={profSaving}
                  className="clay-btn-primary px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {profSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingProfileId ? 'ذخیره تغییرات کارت' : 'ثبت کارت جدید'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Profiles Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-subtle text-[var(--text-muted)] font-semibold">
                <th className="pb-3 pr-2">شناسه و عنوان</th>
                <th className="pb-3">نقش</th>
                <th className="pb-3">مدل فنی</th>
                <th className="pb-3">وضعیت</th>
                <th className="pb-3">تست پینگ</th>
                <th className="pb-3 pl-2 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {defaultProfiles.map((p) => {
                const isTesting = testingProfileId === p.id;
                const result = testResult?.id === p.id ? testResult : null;

                return (
                  <tr key={p.id} className="hover:bg-zinc-500/5 transition-colors">
                    <td className="py-3 pr-2">
                      <div className="font-bold text-[var(--text-main)]">{p.title}</div>
                      <div className="font-mono text-[10px] text-[var(--text-muted)]" dir="ltr">{p.id}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-md clay-surface text-[10px] font-mono">
                        {p.role}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-[var(--text-main)]" dir="ltr">
                      {p.modelName}
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isActive !== 0
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                        {p.isActive !== 0 ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestProfileConnection(p.id)}
                          disabled={isTesting}
                          className="clay-btn px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1"
                        >
                          <Zap className={`w-3 h-3 text-amber-500 ${isTesting ? 'animate-spin' : ''}`} />
                          <span>{isTesting ? 'در حال تست...' : 'تست اتصال'}</span>
                        </button>
                        {result && (
                          <span className={`text-[10px] font-bold ${result.success ? 'text-emerald-500' : 'text-red-500'}`}>
                            {result.success ? `✓ (${result.latencyMs}ms)` : '✗ خطا'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pl-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditProfileClick(p)}
                          className="clay-btn p-1.5 rounded-lg text-[var(--text-muted)] hover:text-emerald-500"
                          title="ویرایش"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setProfileToDelete(p.id)}
                          className="clay-btn p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Gateways (Zarinpal & BazaarPay) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ZarinPal Gateway */}
        <div className="clay-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-[var(--text-main)]">درگاه پرداخت شاپرک (زرین‌پال)</h3>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[var(--text-main)]">
              <input
                type="checkbox"
                checked={gatewayEnabled}
                onChange={e => setGatewayEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500"
              />
              <span>درگاه فعال باشد</span>
            </label>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-muted)]">کد پذیرنده (Merchant ID) *</label>
              <input
                type="text"
                value={zarinpalMerchantId}
                onChange={e => setZarinpalMerchantId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                dir="ltr"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-[var(--text-muted)]">
              <input
                type="checkbox"
                checked={zarinpalSandbox}
                onChange={e => setZarinpalSandbox(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-amber-500"
              />
              <span>محیط آزمایشی (Sandbox)</span>
            </label>

            {gatewayTestResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                gatewayTestResult.valid 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {gatewayTestResult.valid ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{gatewayTestResult.message}</p>
                  {gatewayTestResult.serverIp && (
                    <p className="text-[10px] mt-0.5 font-mono" dir="ltr">Server IP: {gatewayTestResult.serverIp}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestGateway}
                disabled={testingGateway || !zarinpalMerchantId.trim()}
                className="clay-btn px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
              >
                <Zap className={`w-3.5 h-3.5 text-amber-500 ${testingGateway ? 'animate-spin' : ''}`} />
                <span>{testingGateway ? 'در حال تست...' : 'تست اتصال درگاه'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveGateway}
                disabled={settingsSaving}
                className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <span>ذخیره درگاه زرین‌پال</span>
              </button>
            </div>
          </div>
        </div>

        {/* BazaarPay Gateway */}
        <div className="clay-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-subtle pb-3">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-sm text-[var(--text-main)]">درگاه پرداخت سریع بازارپی</h3>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-[var(--text-main)]">
              <input
                type="checkbox"
                checked={bazaarpayEnabled}
                onChange={e => setBazaarpayEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-500"
              />
              <span>بازارپی فعال باشد</span>
            </label>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-muted)]">نام مقصد پرداخت (Destination) *</label>
              <input
                type="text"
                value={bazaarpayDestination}
                onChange={e => setBazaarpayDestination(e.target.value)}
                placeholder="مثال: dastyar_ai"
                className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[var(--text-muted)]">توکن احراز هویت بازارپی *</label>
              <input
                type="password"
                value={bazaarpayToken}
                onChange={e => setBazaarpayToken(e.target.value)}
                placeholder="Token..."
                className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                dir="ltr"
              />
            </div>

            {bazaarTestResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                bazaarTestResult.valid 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {bazaarTestResult.valid ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <p className="font-bold">{bazaarTestResult.message}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestBazaar}
                disabled={testingBazaar || !bazaarpayToken.trim()}
                className="clay-btn px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
              >
                <Zap className={`w-3.5 h-3.5 text-blue-500 ${testingBazaar ? 'animate-spin' : ''}`} />
                <span>{testingBazaar ? 'در حال تست...' : 'تست اتصال بازارپی'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveBazaar}
                disabled={settingsSaving}
                className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                <span>ذخیره تنظیمات بازارپی</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Economic Rates & Site Limitations */}
      {/* ========================================================================= */}
      <div className="clay-card p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-base text-[var(--text-main)]">نرخ‌های تبدیل و سهمیه‌های سایت</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                تعیین نرخ برابری تومان به دلار برای محاسبه هزینه توکن‌ها، پاداش خوش‌آمدگویی و سهمیه کاربران مهمان
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBatchSaveRatesAndQuotas}
            disabled={settingsSaving}
            className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Save size={13} />
            <span>{settingsSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره نرخ‌ها و سهمیه‌ها'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {/* Dollar Selling Rate */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <label className="text-xs font-bold text-[var(--text-main)]">نرخ فروش هر دلار API (تومان)</label>
            <input
              type="text"
              value={sellingRate}
              onChange={e => setSellingRate(e.target.value)}
              className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              dir="ltr"
            />
            <p className="text-[10px] text-[var(--text-muted)]">مبنای کسر موجودی به ازای هر توکن مصرفی مدل‌های پیشرفته</p>
          </div>

          {/* Welcome Bonus Amount */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-main)]">مبلغ هدیه ثبت‌نام (تومان)</label>
              <input
                type="checkbox"
                checked={welcomeBonusEnabled}
                onChange={e => setWelcomeBonusEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-emerald-500"
              />
            </div>
            <input
              type="text"
              value={welcomeBonus}
              onChange={e => setWelcomeBonus(e.target.value)}
              className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              dir="ltr"
            />
            <p className="text-[10px] text-[var(--text-muted)]">شارژ هدیه کیف پول که بلافاصله پس از ثبت‌نام به کاربر داده می‌شود</p>
          </div>

          {/* Guest Daily Messages Limit */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <label className="text-xs font-bold text-[var(--text-main)]">سهمیه پیام کاربر مهمان (تعداد)</label>
            <input
              type="text"
              value={freeDailyLimitGuest}
              onChange={e => setFreeDailyLimitGuest(e.target.value)}
              className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              dir="ltr"
            />
            <p className="text-[10px] text-[var(--text-muted)]">حداکثر پیام رایگان مجاز قبل از اجبار به ثبت‌نام (پیش‌فرض: ۱۵)</p>
          </div>

          {/* Cooldown Hours */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <label className="text-xs font-bold text-[var(--text-main)]">دوره بازنشانی سهمیه (ساعت)</label>
            <input
              type="text"
              value={freeCooldownHours}
              onChange={e => setFreeCooldownHours(e.target.value)}
              className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              dir="ltr"
            />
            <p className="text-[10px] text-[var(--text-muted)]">بازه زمانی برای بازنشانی سهمیه‌های روزانه (پیش‌فرض: ۲۴)</p>
          </div>

          {/* Free Daily Image Limit */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <label className="text-xs font-bold text-[var(--text-main)]">سهمیه تصاویر استودیویی رایگان</label>
            <input
              type="text"
              value={freeDailyImageLimit}
              onChange={e => setFreeDailyImageLimit(e.target.value)}
              className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              dir="ltr"
            />
            <p className="text-[10px] text-[var(--text-muted)]">تعداد تولید رایگان تصویر در استودیو با موتورهای Imagen 3 / DALL-E 3</p>
          </div>

          {/* News Auto Publish */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <label className="text-xs font-bold text-[var(--text-main)]">انتشار خودکار اخبار هوش مصنوعی</label>
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={newsAutoPublish}
                  onChange={e => {
                    setNewsAutoPublish(e.target.checked);
                    handleSaveSetting('news_auto_publish', e.target.checked ? '1' : '0');
                  }}
                  className="w-4 h-4 rounded text-emerald-500"
                />
                <span>انتشار مستقیم اخبار از کرون‌جاب در وبلاگ</span>
              </label>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">اگر خاموش باشد اخبار به صورت پیش‌نویس ذخیره می‌شوند</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Multi-Pool Key Management */}
      {/* ========================================================================= */}
      <div className="clay-card p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-base text-[var(--text-main)]">استخرهای کلید هوشمند چندپروایدری</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                تعریف چندین کلید برای Gemini و Groq جهت توزیع بار، چرخش خودکار و فیلتر کردن کلیدهای نامعتبر
              </p>
            </div>
          </div>

          <button
            onClick={fetchPoolStats}
            disabled={loadingPoolStats}
            className="clay-btn px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingPoolStats ? 'animate-spin' : ''}`} />
            <span>بررسی سلامت استخرها</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Gemini Pool */}
          <div className="clay-subcard p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-main)]">استخر کلیدهای Gemini (Google)</span>
              {poolStats?.gemini && (
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-500 font-bold">{poolStats.gemini.ready} فعال</span>
                  {poolStats.gemini.cooling > 0 && <span className="text-amber-500">{poolStats.gemini.cooling} در حال استراحت</span>}
                  {poolStats.gemini.quarantined > 0 && <span className="text-red-500">{poolStats.gemini.quarantined} نامعتبر</span>}
                </div>
              )}
            </div>

            <textarea
              rows={4}
              value={geminiKeysPool}
              onChange={e => setGeminiKeysPool(e.target.value)}
              placeholder="کلیدهای Gemini را با کاما یا در خطوط جداگانه وارد کنید...&#10;AIzaSy...&#10;AIzaSy..."
              className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              dir="ltr"
            />

            {poolFeedback?.pool === 'gemini' && (
              <p className={`text-xs ${poolFeedback.success ? 'text-emerald-500' : 'text-red-500'}`}>
                {poolFeedback.message}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSavePool('gemini')}
                disabled={savingPool === 'gemini'}
                className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {savingPool === 'gemini' ? 'در حال ذخیره...' : 'ذخیره استخر Gemini'}
              </button>
            </div>
          </div>

          {/* Groq Pool */}
          <div className="clay-subcard p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-main)]">استخر کلیدهای Groq</span>
              {poolStats?.groq && (
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-500 font-bold">{poolStats.groq.ready} فعال</span>
                  {poolStats.groq.cooling > 0 && <span className="text-amber-500">{poolStats.groq.cooling} در حال استراحت</span>}
                  {poolStats.groq.quarantined > 0 && <span className="text-red-500">{poolStats.groq.quarantined} نامعتبر</span>}
                </div>
              )}
            </div>

            <textarea
              rows={4}
              value={groqKeysPool}
              onChange={e => setGroqKeysPool(e.target.value)}
              placeholder="کلیدهای Groq را با کاما یا در خطوط جداگانه وارد کنید...&#10;gsk_...&#10;gsk_..."
              className="clay-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              dir="ltr"
            />

            {poolFeedback?.pool === 'groq' && (
              <p className={`text-xs ${poolFeedback.success ? 'text-emerald-500' : 'text-red-500'}`}>
                {poolFeedback.message}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleSavePool('groq')}
                disabled={savingPool === 'groq'}
                className="clay-btn-primary px-4 py-2 rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {savingPool === 'groq' ? 'در حال ذخیره...' : 'ذخیره استخر Groq'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. Danger Zone: Database Reset */}
      {/* ========================================================================= */}
      <div className="clay-card p-6 rounded-2xl border-red-500/20 space-y-4">
        <div className="flex items-center gap-2.5 text-red-500">
          <ShieldAlert className="w-5 h-5" />
          <h3 className="font-bold text-sm">منطقه حساس و عملیات غیرقابل بازگشت</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          با بازنشانی پایگاه داده، تمام جداول پاک شده و داده‌های آزمایشی، سفارش‌ها و چت‌ها ریست می‌شوند. این گزینه فقط برای تست است.
        </p>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 text-xs font-bold transition-all"
          >
            ریست کامل دیتابیس (Factory Reset)
          </button>
        </div>
      </div>
    </div>
  );
};
