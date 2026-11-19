import React, { useState, useEffect } from 'react';
import { 
  Cpu, Key, RefreshCw, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, ShieldAlert, DollarSign, Sliders, Sparkles, 
  CreditCard, Globe, Zap, Check, X, ShieldCheck, Save
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { adminFetch } from '../../lib/adminApi';
import { AdminToast } from './AdminToast';
import { AdminConfirmModal } from './AdminConfirmModal';

export const AdminSettingsTab: React.FC = () => {

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // 1. Gateways & Rates state
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

  
  const fetchAllSettings = async () => {
    setLoading(true);
    await Promise.allSettled([
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
      {/* 1. AI Shopping Advisor */}
      <div className="clay-card p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="font-bold text-base text-[var(--text-main)]">مشاور هوشمند خرید (AI Shopping Advisor)</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                دستیار آنلاین متصل به کاتالوگ محصولات فعال فروشگاه با پیشنهاد خودکار کارت خرید و پاسخ به سوالات قبل از خرید
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 size={13} />
              <span>وضعیت: فعال و آنلاین</span>
            </span>
            <a href="/?advisor=open" target="_blank" rel="noreferrer" className="clay-btn px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all">
              تست مشاور خرید ↗
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl clay-subcard space-y-1.5">
            <span className="text-[var(--text-muted)] font-medium block">موتور هوش مصنوعی</span>
            <span className="font-bold text-[var(--text-main)] block">Gemini 3.6 Flash + Groq Llama 3.3</span>
            <p className="text-[10px] text-[var(--text-dim)]">استفاده هوشمند از استخر کلیدها با فال‌بک خودکار</p>
          </div>
          <div className="p-4 rounded-xl clay-subcard space-y-1.5">
            <span className="text-[var(--text-muted)] font-medium block">محدودکننده ضد اسپم (Rate Limit)</span>
            <span className="font-bold text-[var(--text-main)] block">۳۰ درخواست / ۱۰ دقیقه برای هر IP</span>
            <p className="text-[10px] text-[var(--text-dim)]">محافظت از منابع سرور در برابر اسپم و بات</p>
          </div>
          <div className="p-4 rounded-xl clay-subcard space-y-1.5">
            <span className="text-[var(--text-muted)] font-medium block">اتصال به کاتالوگ فروشگاه</span>
            <span className="font-bold text-emerald-500 block">پویا و بلادرنگ (Real-time SQL)</span>
            <p className="text-[10px] text-[var(--text-dim)]">پاسخ‌گویی بر اساس قیمت و موجودی فعلی محصولات</p>
          </div>
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
