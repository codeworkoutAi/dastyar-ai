import React, { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const PromoCodesManager: React.FC = () => {
  const { token } = useAuthStore();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [newCode, setNewCode] = useState('');
  const [newType, setNewType] = useState('registration_bonus');
  const [newValue, setNewValue] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-codes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCodes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newValue) {
      setError('کد و مبلغ/درصد الزامی است');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code: newCode,
          type: newType,
          value: Number(newValue),
          maxUses: newMaxUses ? Number(newMaxUses) : 0
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setNewCode('');
      setNewValue('');
      setNewMaxUses('');
      fetchCodes();
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت کد');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('آیا از حذف این کد مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (id: number, currentActive: number) => {
    try {
      const res = await fetch(`/api/admin/promo-codes/${id}/toggle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: currentActive ? 0 : 1 })
      });
      if (res.ok) fetchCodes();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'registration_bonus': return 'پاداش ثبت‌نام';
      case 'discount_percent': return 'درصد تخفیف';
      case 'extra_charge_percent': return 'درصد شارژ اضافه';
      default: return type;
    }
  };

  return (
    <div className="clay-card rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-[var(--color-accent-primary)]/10 flex items-center justify-center text-[var(--color-accent-primary)] font-bold">
          <Gift size={20} />
        </div>
        <div>
          <h3 className="text-base font-black text-[var(--text-main)]">مدیریت کدهای پروموشن و تخفیف</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">ساخت کدهای تخفیف، پاداش ورود و شارژ هدیه</p>
        </div>
      </div>

      <form onSubmit={handleAddCode} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6 p-4 clay-subcard rounded-2xl">
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">کد (لاتین) *</label>
          <input type="text" value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="YALDA" className="w-full px-3 py-2 text-xs rounded-xl clay-surface outline-none font-mono" dir="ltr" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">نوع جایزه</label>
          <select value={newType} onChange={e => setNewType(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl clay-surface outline-none font-bold text-[var(--text-main)] cursor-pointer">
            <option value="registration_bonus">پاداش ورود ثابت</option>
            <option value="discount_percent">تخفیف درصد</option>
            <option value="extra_charge_percent">شارژ هدیه درصد</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">مبلغ / درصد *</label>
          <input type="number" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="50000" className="w-full px-3 py-2 text-xs rounded-xl clay-surface outline-none font-mono font-bold" dir="ltr" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-[var(--text-main)] mb-1.5">سقف (0=نامحدود)</label>
          <input type="number" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} placeholder="0" className="w-full px-3 py-2 text-xs rounded-xl clay-surface outline-none font-mono" dir="ltr" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={actionLoading} className="w-full h-[36px] flex justify-center items-center gap-1.5 clay-btn-primary rounded-xl font-bold text-xs transition-transform active:scale-95">
            {actionLoading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            <span>افزودن کد</span>
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-500/15 text-red-500 text-xs font-bold rounded-xl border border-red-500/30 flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 size={24} className="animate-spin text-[var(--color-accent-primary)]" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-xs text-right text-[var(--text-main)]">
            <thead className="bg-[var(--color-input-bg)]/40 text-[var(--text-muted)] border-b border-[var(--card-border)]">
              <tr>
                <th className="px-4 py-3 font-bold">کد</th>
                <th className="px-4 py-3 font-bold">نوع</th>
                <th className="px-4 py-3 font-bold">مقدار</th>
                <th className="px-4 py-3 font-bold text-center">استفاده</th>
                <th className="px-4 py-3 font-bold text-center">وضعیت</th>
                <th className="px-4 py-3 font-bold text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--card-border)]">
              {codes.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--color-input-bg)]/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold" dir="ltr">{c.code}</td>
                  <td className="px-4 py-3">{getTypeLabel(c.type)}</td>
                  <td className="px-4 py-3 font-mono font-bold">{c.value.toLocaleString('fa-IR')} {c.type === 'registration_bonus' ? 'تومان' : '%'}</td>
                  <td className="px-4 py-3 text-center font-mono">{c.currentUses} / {c.maxUses === 0 ? '∞' : c.maxUses}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleToggle(c.id, c.isActive)} 
                      className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer inline-flex items-center ${
                        c.isActive ? 'bg-emerald-500 justify-end' : 'bg-zinc-400 justify-start'
                      }`}
                      title={c.isActive ? 'فعال - کلیک برای غیرفعال‌سازی' : 'غیرفعال - کلیک برای فعال‌سازی'}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => handleDelete(c.id)} 
                      className="p-1.5 rounded-lg clay-btn text-red-500 hover:bg-red-500/10 transition-colors"
                      title="حذف کد تخفیف"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
