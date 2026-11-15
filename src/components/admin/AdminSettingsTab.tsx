import React, { useState, useEffect } from 'react';
import { 
  Cpu, Key, RefreshCw, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, ShieldAlert, DollarSign, Sliders, Sparkles, 
  CreditCard, Globe, Zap, Check, X, ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';

export const AdminSettingsTab: React.FC = () => {
  const { token } = useAuthStore();
  const { syncSystemProfiles } = useSettingsStore();

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. AI Profiles state
  const [defaultProfiles, setDefaultProfiles] = useState<any[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [isAddingProfile, setIsAddingProfile] = useState(false);

  // Profile form
  const [profId, setProfId] = useState('');
  const [profRole, setProfRole] = useState('default');
  const [profTitle, setProfTitle] = useState('');
  const [profDesc, setProfDesc] = useState('');
  const [profModelName, setProfModelName] = useState('');
  const [profBaseUrl, setProfBaseUrl] = useState('');
  const [profApiKey, setProfApiKey] = useState('');
  const [profOrderIndex, setProfOrderIndex] = useState(0);
  const [profIsActive, setProfIsActive] = useState(true);
  const [profSaving, setProfSaving] = useState(false);

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

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
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
      const res = await fetch('/api/admin/pools/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPoolStats(data);
      }
    } catch (err) {
      console.warn('Error fetching pool stats:', err);
    } finally {
      setLoadingPoolStats(false);
    }
  };

  const fetchDefaultProfiles = async () => {
    try {
      setProfilesLoading(true);
      const res = await fetch('/api/admin/default-profiles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDefaultProfiles(data);
      }
    } catch (err: any) {
      console.error('Error fetching default profiles:', err);
    } finally {
      setProfilesLoading(false);
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.news_auto_publish !== undefined) setNewsAutoPublish(data.news_auto_publish === '1' || data.news_auto_publish === true);
        if (data.free_daily_limit_guest !== undefined) setFreeDailyLimitGuest(String(data.free_daily_limit_guest));
        if (data.free_cooldown_hours !== undefined) setFreeCooldownHours(String(data.free_cooldown_hours));
        if (data.free_daily_image_limit !== undefined) setFreeDailyImageLimit(String(data.free_daily_image_limit));
        if (data.gemini_keys_pool !== undefined) setGeminiKeysPool(String(data.gemini_keys_pool));
        if (data.groq_keys_pool !== undefined) setGroqKeysPool(String(data.groq_keys_pool));
      }
    } catch (err) {
      console.error('Error fetching site settings:', err);
    }
  };

  const fetchGatewaysAndRates = async () => {
    try {
      // Gateway statuses
      const [gwRes, bzRes, finRes] = await Promise.allSettled([
        fetch('/api/admin/gateway-status', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/bazaarpay-status', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
        fetch('/api/admin/financial-summary', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
      ]);

      if (gwRes.status === 'fulfilled' && gwRes.value) {
        setZarinpalMerchantId(gwRes.value.merchantId || '');
        setZarinpalSandbox(Boolean(gwRes.value.sandbox));
        setGatewayEnabled(Boolean(gwRes.value.enabled));
      }

      if (bzRes.status === 'fulfilled' && bzRes.value) {
        setBazaarpayDestination(bzRes.value.destination || '');
        setBazaarpayToken(bzRes.value.token || '');
        setBazaarpayEnabled(Boolean(bzRes.value.enabled));
      }

      if (finRes.status === 'fulfilled' && finRes.value) {
        if (finRes.value.sellingRate) setSellingRate(String(finRes.value.sellingRate));
        if (finRes.value.welcomeBonus) setWelcomeBonus(String(finRes.value.welcomeBonus));
        if (finRes.value.welcomeBonusEnabled !== undefined) setWelcomeBonusEnabled(Boolean(finRes.value.welcomeBonusEnabled));
        if (finRes.value.freeKeyPool) setFreeKeyPool(finRes.value.freeKeyPool);
      }
    } catch (err) {
      console.error('Error fetching gateway/rate settings:', err);
    }
  };

  // Test AI profile model connection
  const handleTestProfileConnection = async (profile: any) => {
    try {
      setTestingProfileId(profile.id);
      setTestResult(null);

      const res = await fetch('/api/models/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          baseUrl: profile.baseUrl,
          apiKey: profile.apiKey,
          modelName: profile.modelName
        })
      });
      const data = await res.json();
      setTestResult({
        id: profile.id,
        success: data.success,
        message: data.message || (data.success ? 'اتصال با موفقیت برقرار شد.' : 'خطا در برقراری ارتباط'),
        latencyMs: data.latencyMs
      });
    } catch (err: any) {
      setTestResult({
        id: profile.id,
        success: false,
        message: err.message || 'خطای شبکه'
      });
    } finally {
      setTestingProfileId(null);
    }
  };

  // Save AI Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profId || !profTitle || !profModelName) {
      showFeedback('شناسه، عنوان و نام مدل اجباری هستند.', 'error');
      return;
    }

    try {
      setProfSaving(true);
      const url = editingProfileId ? `/api/admin/default-profiles/${editingProfileId}` : '/api/admin/default-profiles';
      const method = editingProfileId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: profId,
          role: profRole,
          title: profTitle,
          description: profDesc,
          modelName: profModelName,
          baseUrl: profBaseUrl,
          apiKey: profApiKey,
          orderIndex: Number(profOrderIndex),
          isActive: profIsActive ? 1 : 0
        })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'خطا در ذخیره کارت مدل');
      }

      showFeedback(editingProfileId ? 'کارت مدل با موفقیت ویرایش شد.' : 'کارت مدل جدید با موفقیت اضافه شد.');
      setIsAddingProfile(false);
      setEditingProfileId(null);
      await fetchDefaultProfiles();
      syncSystemProfiles();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setProfSaving(false);
    }
  };

  const handleEditProfileClick = (p: any) => {
    setProfId(p.id);
    setProfRole(p.role || 'default');
    setProfTitle(p.title || '');
    setProfDesc(p.description || '');
    setProfModelName(p.modelName || '');
    setProfBaseUrl(p.baseUrl || '');
    setProfApiKey(p.apiKey || '');
    setProfOrderIndex(p.orderIndex || 0);
    setProfIsActive(p.isActive !== 0);
    setEditingProfileId(p.id);
    setIsAddingProfile(true);
  };

  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm(`آیا از حذف کارت پیش‌فرض ${id} اطمینان دارید؟`)) return;
    try {
      const res = await fetch(`/api/admin/default-profiles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('خطا در حذف کارت مدل');
      showFeedback('کارت مدل با موفقیت حذف شد.');
      fetchDefaultProfiles();
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // Save Site setting helper
  const handleSaveSetting = async (key: string, value: any) => {
    try {
      setSettingsSaving(true);
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) throw new Error('خطا در ذخیره تنظیم');
      showFeedback('تنظیمات با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      showFeedback(err.message, 'error');
    } finally {
      setSettingsSaving(false);
    }
  };

  // Test Zarinpal Gateway
  const handleTestGateway = async () => {
    try {
      setTestingGateway(true);
      setGatewayTestResult(null);
      const res = await fetch('/api/admin/test-gateway', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          merchantId: zarinpalMerchantId.trim(),
          sandbox: zarinpalSandbox
        })
      });
      const data = await res.json();
      setGatewayTestResult(data);
    } catch (err: any) {
      setGatewayTestResult({ valid: false, message: err.message || 'خطا در تست درگاه' });
    } finally {
      setTestingGateway(false);
    }
  };

  // Test BazaarPay
  const handleTestBazaar = async () => {
    try {
      setTestingBazaar(true);
      setBazaarTestResult(null);
      const res = await fetch('/api/admin/test-bazaarpay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          destination: bazaarpayDestination.trim(),
          token: bazaarpayToken.trim()
        })
      });
      const data = await res.json();
      setBazaarTestResult(data);
    } catch (err: any) {
      setBazaarTestResult({ valid: false, message: err.message || 'خطا در تست بازارپی' });
    } finally {
      setTestingBazaar(false);
    }
  };

  // Multi-Pool Save Handlers with instant visual feedback
  const handleSaveGeminiPool = async () => {
    try {
      setSavingPool('gemini');
      setPoolFeedback(null);
      const trimmed = geminiKeysPool.trim();
      await handleSaveSetting('gemini_keys_pool', trimmed);
      await fetchPoolStats();
      const count = trimmed ? trimmed.split('\n').filter(k => k.trim()).length : 0;
      setPoolFeedback({
        pool: 'gemini',
        success: true,
        message: `استخر Gemini با موفقیت در دیتابیس ذخیره و در سرور فعال شد (${count} کلید شناسایی شد).`
      });
    } catch (err: any) {
      setPoolFeedback({
        pool: 'gemini',
        success: false,
        message: err?.message || 'خطا در ذخیره‌سازی استخر Gemini'
      });
    } finally {
      setSavingPool(null);
    }
  };

  const handleSaveGroqPool = async () => {
    try {
      setSavingPool('groq');
      setPoolFeedback(null);
      const trimmed = groqKeysPool.trim();
      await handleSaveSetting('groq_keys_pool', trimmed);
      await fetchPoolStats();
      const count = trimmed ? trimmed.split('\n').filter(k => k.trim()).length : 0;
      setPoolFeedback({
        pool: 'groq',
        success: true,
        message: `استخر Groq با موفقیت در دیتابیس ذخیره و در سرور فعال شد (${count} کلید شناسایی شد).`
      });
    } catch (err: any) {
      setPoolFeedback({
        pool: 'groq',
        success: false,
        message: err?.message || 'خطا در ذخیره‌سازی استخر Groq'
      });
    } finally {
      setSavingPool(null);
    }
  };

  // Reset DB handler
  const handleResetDatabase = async () => {
    const phrase = window.prompt(
      'برای تأیید این عملیات غیرقابل بازگشت، عبارت RESET-DB را دقیقاً تایپ کنید:'
    );
    if (phrase === null) return;
    if (phrase.trim() !== 'RESET-DB') {
      alert('عبارت تایپ‌شده مطابقت ندارد. عملیات لغو شد.');
      return;
    }
    try {
      const res = await fetch('/api/admin/reset-database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ confirm: 'RESET-DB' })
      });
      const data = await res.json();
      if (res.ok) {
        alert('دیتابیس با موفقیت صفر شد. صفحه بارگذاری مجدد می‌شود.');
        window.location.reload();
      } else {
        alert(data.error || 'خطا در ریست دیتابیس');
      }
    } catch {
      alert('خطا در ارتباط با سرور');
    }
  };

  return (
    <div className="flex flex-col gap-8 animate-fadeIn">
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

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--card-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-primary)]/10 text-[var(--color-accent-primary)] flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-[var(--text-main)]">تنظیمات یکپارچه سیستم و پیکربندی</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">مدل‌های هوش مصنوعی، درگاه‌های بانکی، نرخ‌ها و محدودیت‌ها</p>
          </div>
        </div>

        <button
          onClick={fetchAllSettings}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 clay-btn font-bold text-xs rounded-xl"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[var(--text-muted)] ${loading ? 'animate-spin' : ''}`} />
          <span>تازه‌سازی همه</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* SECTION 1: AI Profiles Management                         */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl clay-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-[var(--text-main)]">کارت‌ها و مدل‌های هوش مصنوعی سیستم</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                ۶ کارت استاندارد پلتفرم (۳ رایگان و ۳ پیشرفته). کلیدها امن در بک‌اند نگهداری می‌شوند.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (isAddingProfile) {
                setIsAddingProfile(false);
                setEditingProfileId(null);
              } else {
                setProfId('');
                setProfRole('default');
                setProfTitle('');
                setProfDesc('');
                setProfModelName('gemini-3.6-flash');
                setProfBaseUrl('https://generativelanguage.googleapis.com');
                setProfApiKey('');
                setProfOrderIndex(defaultProfiles.length);
                setProfIsActive(true);
                setIsAddingProfile(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 clay-btn-primary text-xs font-bold rounded-xl"
          >
            <Plus size={14} />
            <span>{isAddingProfile ? 'انصراف' : 'افزودن کارت مدل'}</span>
          </button>
        </div>

        {/* Profile Form */}
        {isAddingProfile && (
          <form onSubmit={handleSaveProfile} className="p-5 rounded-2xl clay-subcard space-y-4 animate-fadeIn">
            <h5 className="font-bold text-sm text-[var(--text-main)]">
              {editingProfileId ? `ویرایش کارت مدل [${editingProfileId}]` : 'تعریف کارت مدل جدید'}
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">شناسه کارت (ID) *</label>
                <input
                  type="text"
                  value={profId}
                  onChange={(e) => setProfId(e.target.value)}
                  disabled={!!editingProfileId}
                  placeholder="free_default یا custom_id"
                  className="px-3 py-2 rounded-xl clay-surface text-xs font-mono outline-none disabled:opacity-60"
                  dir="ltr"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">نقش سیستمی (Role) *</label>
                <select
                  value={profRole}
                  onChange={(e) => setProfRole(e.target.value)}
                  className="px-3 py-2 rounded-xl clay-surface text-xs outline-none"
                >
                  <option value="default">چت پیش‌فرض (free_default)</option>
                  <option value="coding">برنامه‌نویسی (free_coding)</option>
                  <option value="vision">بینایی و اسناد (free_vision)</option>
                  <option value="paid_default">چت پیشرفته (paid_default)</option>
                  <option value="paid_coding">برنامه‌نویسی پیشرفته (paid_coding)</option>
                  <option value="paid_vision">اسناد پیشرفته (paid_vision)</option>
                  <option value="custom">سفارشی (custom)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">عنوان کارت (بدون نام مدل‌های تجاری) *</label>
                <input
                  type="text"
                  value={profTitle}
                  onChange={(e) => setProfTitle(e.target.value)}
                  placeholder="دستیار برنامه‌نویسی پیشرفته"
                  className="px-3 py-2 rounded-xl clay-surface text-xs outline-none"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">مدل واقعی (Model Identifier) *</label>
                <input
                  type="text"
                  value={profModelName}
                  onChange={(e) => setProfModelName(e.target.value)}
                  placeholder="gemini-3.6-flash یا claude-sonnet-4-6"
                  className="px-3 py-2 rounded-xl clay-surface text-xs font-mono outline-none"
                  dir="ltr"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">Base URL سرویس‌دهنده</label>
                <input
                  type="text"
                  value={profBaseUrl}
                  onChange={(e) => setProfBaseUrl(e.target.value)}
                  placeholder="https://generativelanguage.googleapis.com"
                  className="px-3 py-2 rounded-xl clay-surface text-xs font-mono outline-none"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">کلید اختصاصی API (در صورت وجود)</label>
                <input
                  type="password"
                  value={profApiKey}
                  onChange={(e) => setProfApiKey(e.target.value)}
                  placeholder={editingProfileId ? 'برای عدم تغییر خالی بگذارید' : 'AIzaSy...'}
                  className="px-3 py-2 rounded-xl clay-surface text-xs font-mono outline-none"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingProfile(false)}
                className="px-4 py-2 clay-btn text-xs font-bold rounded-xl"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={profSaving}
                className="px-5 py-2 clay-btn-primary text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {profSaving ? 'در حال ذخیره...' : 'ذخیره کارت'}
              </button>
            </div>
          </form>
        )}

        {/* Profiles Table */}
        <div className="overflow-x-auto rounded-xl clay-subcard">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="border-b border-[var(--card-border)] clay-surface text-[11px] font-black text-[var(--text-muted)]">
                <th className="px-3.5 py-3">شناسه کارت</th>
                <th className="px-3.5 py-3">عنوان نمایشی</th>
                <th className="px-3.5 py-3">مدل داخلی سرور</th>
                <th className="px-3.5 py-3">وضعیت کلید</th>
                <th className="px-3.5 py-3">نقش</th>
                <th className="px-3.5 py-3 text-center">تست و عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {defaultProfiles.map((p) => {
                const isTesting = testingProfileId === p.id;
                const res = testResult?.id === p.id ? testResult : null;

                return (
                  <tr key={p.id} className="hover:bg-[var(--color-input-bg)]/40 transition-colors">
                    <td className="px-3.5 py-3 font-mono font-bold text-[var(--text-main)]" dir="ltr">
                      {p.id}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-[var(--text-main)]">
                      {p.title}
                    </td>
                    <td className="px-3.5 py-3 font-mono text-[var(--text-muted)]" dir="ltr">
                      {p.modelName}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        {p.hasApiKey ? 'کلید فعال' : 'پیش‌فرض سرور'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-[10px] font-bold text-[var(--text-dim)]">
                      {p.role}
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleTestProfileConnection(p)}
                          disabled={isTesting}
                          className="px-2.5 py-1 clay-btn rounded-lg text-[10px] font-bold text-[var(--color-accent-primary)] hover:scale-105 transition-transform"
                          title="تست ارتباط با سرور هوش مصنوعی"
                        >
                          {isTesting ? <RefreshCw size={12} className="animate-spin" /> : 'تست اتصال'}
                        </button>

                        <button
                          onClick={() => handleEditProfileClick(p)}
                          className="p-1.5 clay-btn rounded-lg text-[var(--text-muted)] hover:text-blue-500 transition-colors"
                          title="ویرایش مشخصات"
                        >
                          <Edit2 size={13} />
                        </button>

                        {!['free_default', 'free_coding', 'free_vision', 'paid_default', 'paid_coding', 'paid_vision'].includes(p.id) && (
                          <button
                            onClick={() => handleDeleteProfile(p.id)}
                            className="p-1.5 clay-btn rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                            title="حذف کارت سفارشی"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      {res && (
                        <div className={`mt-1.5 text-[10px] font-bold ${res.success ? 'text-emerald-500' : 'text-red-500'}`}>
                          {res.success ? `✓ اتصال موفق (${res.latencyMs || 0}ms)` : `✕ ${res.message}`}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 2: Multi-Pool API Key Orchestration               */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl clay-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--card-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-[var(--text-main)]">مدیریت استخرهای کلید هوش مصنوعی (Multi-Pool Orchestration)</h4>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">پایش سلامت زنده (Circuit Breaker)، غربالگری در لحظه صفر و سوئیچ بدون تاخیر (Zero-Lag Failover)</p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchPoolStats}
            disabled={loadingPoolStats}
            className="self-start sm:self-auto px-3 py-1.5 clay-btn text-xs font-bold rounded-xl flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loadingPoolStats ? 'animate-spin text-purple-500' : 'text-purple-500'} />
            <span>{loadingPoolStats ? 'در حال پایش...' : 'بروزرسانی وضعیت سلامت'}</span>
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 text-xs text-[var(--text-main)] leading-relaxed">
          💡 <span className="font-bold">سلف دیاگنوستیک هوشمند در حافظه (0ms):</span> قبل از ارسال چت، کلیدها در رم غربالگری می‌شوند. کلیدهای سوخته یا دارای خطای ۴۲۹ فوراً به قرنطینه منتقل شده و کاربر با هیچ تاخیری روبرو نمی‌شود. در صورت اتمام ظرفیت جیمینای، سیستم به صورت کاملاً خودکار و در لحظه به استخر فوق‌سریع Groq سوئیچ می‌کند.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gemini Pool Card */}
          <div className="p-5 rounded-2xl clay-subcard space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div>
                <span className="font-black text-sm text-[var(--text-main)]">استخر کلیدهای Gemini (Google)</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">موتور اصلی چت، برنامه‌نویسی و اسناد رایگان</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-[var(--text-muted)]">
                  کل: {poolStats?.gemini?.total ?? 0}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  آماده: {poolStats?.gemini?.ready ?? 0}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  خنک‌شدن: {poolStats?.gemini?.cooling ?? 0}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400">
                  قرنطینه: {poolStats?.gemini?.quarantined ?? 0}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                <label>کلیدهای API گوگل (هر خط یک کلید):</label>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--card-border)] text-[var(--text-muted)]">
                  {geminiKeysPool.trim() ? `${geminiKeysPool.trim().split('\n').filter(k => k.trim()).length} کلید` : 'خالی'}
                </span>
              </div>
              <textarea
                value={geminiKeysPool}
                onChange={(e) => setGeminiKeysPool(e.target.value)}
                placeholder="AIzaSy...\nAIzaSy..."
                rows={4}
                dir="ltr"
                className="w-full px-3 py-2 rounded-xl clay-surface text-xs font-mono resize-y min-h-[90px]"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveGeminiPool}
              disabled={savingPool === 'gemini' || settingsSaving}
              className="w-full py-2.5 clay-btn-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {savingPool === 'gemini' ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>در حال ذخیره و فعال‌سازی در سرور...</span>
                </>
              ) : (
                <span>ذخیره و بروزرسانی استخر Gemini</span>
              )}
            </button>

            {poolFeedback?.pool === 'gemini' && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                poolFeedback.success 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
              }`}>
                {poolFeedback.success ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                <span className="leading-relaxed">{poolFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Groq Pool Card */}
          <div className="p-5 rounded-2xl clay-subcard space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <div>
                <span className="font-black text-sm text-[var(--text-main)]">استخر کلیدهای Groq (LPU)</span>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">استنتاج پرسرعت Llama 3.3 / فال‌بک نجات چت</p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/10 text-[var(--text-muted)]">
                  کل: {poolStats?.groq?.total ?? 0}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  آماده: {poolStats?.groq?.ready ?? 0}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  خنک‌شدن: {poolStats?.groq?.cooling ?? 0}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 dark:text-red-400">
                  قرنطینه: {poolStats?.groq?.quarantined ?? 0}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-main)]">
                <label>کلیدهای API شرکت Groq (هر خط یک کلید):</label>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[var(--card-border)] text-[var(--text-muted)]">
                  {groqKeysPool.trim() ? `${groqKeysPool.trim().split('\n').filter(k => k.trim()).length} کلید` : 'خالی'}
                </span>
              </div>
              <textarea
                value={groqKeysPool}
                onChange={(e) => setGroqKeysPool(e.target.value)}
                placeholder="gsk_...\ngsk_..."
                rows={4}
                dir="ltr"
                className="w-full px-3 py-2 rounded-xl clay-surface text-xs font-mono resize-y min-h-[90px]"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveGroqPool}
              disabled={savingPool === 'groq' || settingsSaving}
              className="w-full py-2.5 clay-btn-primary text-xs font-bold rounded-xl flex items-center justify-center gap-2"
            >
              {savingPool === 'groq' ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>در حال ذخیره و فعال‌سازی در سرور...</span>
                </>
              ) : (
                <span>ذخیره و بروزرسانی استخر Groq</span>
              )}
            </button>

            {poolFeedback?.pool === 'groq' && (
              <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn ${
                poolFeedback.success 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
              }`}>
                {poolFeedback.success ? <CheckCircle2 size={16} className="shrink-0" /> : <AlertCircle size={16} className="shrink-0" />}
                <span className="leading-relaxed">{poolFeedback.message}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: Payment Gateways (Zarinpal & BazaarPay)        */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl clay-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--card-border)]">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-[var(--text-main)]">درگاه‌های پرداخت بانکی (شاپرک و بازارپی)</h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">پیکربندی مرچنت کد، تست زنده و کلیدهای ارتباطی درگاه‌ها</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zarinpal Card */}
          <div className="p-5 rounded-2xl clay-subcard space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <span className="font-black text-sm text-[var(--text-main)]">درگاه زرین‌پال (شاپرک)</span>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold">
                <input
                  type="checkbox"
                  checked={gatewayEnabled}
                  onChange={(e) => {
                    setGatewayEnabled(e.target.checked);
                    handleSaveSetting('zarinpal_enabled', e.target.checked ? '1' : '0');
                  }}
                  className="w-4 h-4 rounded text-emerald-500"
                />
                <span className={gatewayEnabled ? 'text-emerald-500' : 'text-[var(--text-dim)]'}>
                  {gatewayEnabled ? 'فعال' : 'غیرفعال'}
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">Merchant ID (کد مرچنت درگاه)</label>
                <input
                  type="text"
                  value={zarinpalMerchantId}
                  onChange={(e) => setZarinpalMerchantId(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className="px-3 py-2 rounded-xl clay-surface text-xs font-mono outline-none"
                  dir="ltr"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={zarinpalSandbox}
                  onChange={(e) => setZarinpalSandbox(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span>حالت سندباکس و آزمایشی (Sandbox)</span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={handleTestGateway}
                disabled={testingGateway}
                className="px-4 py-2 clay-btn text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Zap size={13} className="text-amber-500" />
                <span>{testingGateway ? 'در حال تست...' : 'تست اتصال شاپرک'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleSaveSetting('zarinpal_merchant_id', zarinpalMerchantId.trim());
                  await handleSaveSetting('zarinpal_sandbox', zarinpalSandbox ? '1' : '0');
                  await handleSaveSetting('zarinpal_enabled', gatewayEnabled ? '1' : '0');
                }}
                disabled={settingsSaving}
                className="px-5 py-2 clay-btn-primary text-xs font-bold rounded-xl"
              >
                ذخیره تنظیمات
              </button>
            </div>

            {gatewayTestResult && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                gatewayTestResult.valid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {gatewayTestResult.valid ? `✓ ${gatewayTestResult.message}` : `✕ ${gatewayTestResult.message}`}
              </div>
            )}
          </div>

          {/* BazaarPay Card */}
          <div className="p-5 rounded-2xl clay-subcard space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--card-border)]">
              <span className="font-black text-sm text-[var(--text-main)]">درگاه بازارپی (کافه‌بازار)</span>
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold">
                <input
                  type="checkbox"
                  checked={bazaarpayEnabled}
                  onChange={(e) => {
                    setBazaarpayEnabled(e.target.checked);
                    handleSaveSetting('bazaarpay_enabled', e.target.checked ? '1' : '0');
                  }}
                  className="w-4 h-4 rounded text-blue-500"
                />
                <span className={bazaarpayEnabled ? 'text-blue-500' : 'text-[var(--text-dim)]'}>
                  {bazaarpayEnabled ? 'فعال' : 'غیرفعال'}
                </span>
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">Destination (مقصد پرداخت بازارپی)</label>
                <input
                  type="text"
                  value={bazaarpayDestination}
                  onChange={(e) => setBazaarpayDestination(e.target.value)}
                  placeholder="مثال: dastyar_ai_store"
                  className="px-3 py-2 rounded-xl clay-surface text-xs font-mono outline-none"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[var(--text-main)]">Token / Client Secret بازارپی</label>
                <input
                  type="password"
                  value={bazaarpayToken}
                  onChange={(e) => setBazaarpayToken(e.target.value)}
                  placeholder="توکن محرمانه بازارپی..."
                  className="px-3 py-2 rounded-xl clay-surface text-xs font-mono outline-none"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--card-border)]">
              <button
                type="button"
                onClick={handleTestBazaar}
                disabled={testingBazaar}
                className="px-4 py-2 clay-btn text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Zap size={13} className="text-blue-500" />
                <span>{testingBazaar ? 'در حال تست...' : 'تست بازارپی'}</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleSaveSetting('bazaarpay_destination', bazaarpayDestination.trim());
                  await handleSaveSetting('bazaarpay_token', bazaarpayToken.trim());
                  await handleSaveSetting('bazaarpay_enabled', bazaarpayEnabled ? '1' : '0');
                }}
                disabled={settingsSaving}
                className="px-5 py-2 clay-btn-primary text-xs font-bold rounded-xl"
              >
                ذخیره تنظیمات
              </button>
            </div>

            {bazaarTestResult && (
              <div className={`p-3 rounded-xl text-xs font-bold ${
                bazaarTestResult.valid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {bazaarTestResult.valid ? `✓ ${bazaarTestResult.message}` : `✕ ${bazaarTestResult.message}`}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 3: Economic Rates & Site Limitations              */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl clay-card space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--card-border)]">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-[var(--text-main)]">نرخ‌های مالی، هدایا و سهمیه‌های مصرف</h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">تنظیم ضریب تبدیل توکن، اعتبار هدیه و محدودیت‌های چت مهمان</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Selling Rate */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <label className="text-xs font-bold text-[var(--text-main)]">نرخ فروش هر دلار به تومان</label>
            <input
              type="text"
              value={sellingRate}
              onChange={(e) => setSellingRate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl clay-surface text-xs font-mono font-bold"
              dir="ltr"
            />
            <button
              onClick={() => handleSaveSetting('selling_rate', sellingRate)}
              disabled={settingsSaving}
              className="w-full py-2 clay-btn-primary text-xs font-bold rounded-lg"
            >
              ذخیره نرخ
            </button>
          </div>

          {/* Welcome Bonus */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-main)]">هدیه ثبت‌نام (تومان)</label>
              <input
                type="checkbox"
                checked={welcomeBonusEnabled}
                onChange={(e) => {
                  setWelcomeBonusEnabled(e.target.checked);
                  handleSaveSetting('welcome_bonus_enabled', e.target.checked ? '1' : '0');
                }}
                className="w-4 h-4 rounded text-amber-500"
              />
            </div>
            <input
              type="text"
              value={welcomeBonus}
              onChange={(e) => setWelcomeBonus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl clay-surface text-xs font-mono font-bold"
              dir="ltr"
            />
            <button
              onClick={() => handleSaveSetting('welcome_bonus', welcomeBonus)}
              disabled={settingsSaving}
              className="w-full py-2 clay-btn-primary text-xs font-bold rounded-lg"
            >
              ذخیره بونوس
            </button>
          </div>

          {/* Guest Message Quota */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <label className="text-xs font-bold text-[var(--text-main)]">سهمیه پیام رایگان مهمان (پیام)</label>
            <input
              type="text"
              value={freeDailyLimitGuest}
              onChange={(e) => setFreeDailyLimitGuest(e.target.value)}
              className="w-full px-3 py-2 rounded-xl clay-surface text-xs font-mono font-bold"
              dir="ltr"
            />
            <button
              onClick={() => handleSaveSetting('free_daily_limit_guest', freeDailyLimitGuest)}
              disabled={settingsSaving}
              className="w-full py-2 clay-btn-primary text-xs font-bold rounded-lg"
            >
              ذخیره سهمیه مهمان
            </button>
          </div>

          {/* Daily Image Quota */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <label className="text-xs font-bold text-[var(--text-main)]">سقف روزانه تصاویر استودیو (تصویر)</label>
            <input
              type="text"
              value={freeDailyImageLimit}
              onChange={(e) => setFreeDailyImageLimit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl clay-surface text-xs font-mono font-bold"
              dir="ltr"
            />
            <button
              onClick={() => handleSaveSetting('free_daily_image_limit', freeDailyImageLimit)}
              disabled={settingsSaving}
              className="w-full py-2 clay-btn-primary text-xs font-bold rounded-lg"
            >
              ذخیره سقف تصویر
            </button>
          </div>

          {/* News Cron Auto Publish */}
          <div className="p-4 rounded-xl clay-subcard space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-main)]">انتشار خودکار اخبار از RSS</label>
              <input
                type="checkbox"
                checked={newsAutoPublish}
                onChange={(e) => {
                  setNewsAutoPublish(e.target.checked);
                  handleSaveSetting('news_auto_publish', e.target.checked ? '1' : '0');
                }}
                className="w-4 h-4 rounded text-purple-500"
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              اجرای منظم هر ساعت یک‌بار جهت استخراج اخبار و بازنویسی هوشمند.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION 4: Danger Zone (Database Reset)                   */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl clay-card border border-red-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-red-500">منطقه خطر (Danger Zone)</h4>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">عملیات حساس و غیرقابل بازگشت پاکسازی پایگاه داده</p>
          </div>
        </div>

        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          با کلیک روی دکمه زیر، تمامی اطلاعات دیتابیس (محصولات، سفارشات، لایسنس‌ها، تراکنش‌ها و گفتگوها) به جز حساب کاربری فعلی شما پاک خواهد شد. این کار نیازمند تایپ تاییدیه امنیتی است و فقط برای اهداف آزمایشی کاربرد دارد.
        </p>

        <div className="flex justify-start pt-2">
          <button
            type="button"
            onClick={handleResetDatabase}
            className="px-5 py-2.5 bg-red-500 text-white font-black text-xs rounded-xl hover:bg-red-600 transition-colors shadow-md"
          >
            صفر کردن پایگاه داده (Reset DB)
          </button>
        </div>
      </div>
    </div>
  );
};
