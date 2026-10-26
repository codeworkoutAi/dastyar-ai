import React, { useState, useEffect } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, MessageCircle, Sparkles } from 'lucide-react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { Footer } from '../../components/Footer';
import { setPageSeo } from '../../lib/seo';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageSeo({
      title: 'تماس با Dastyar AI',
      description: 'راه‌های تماس با تیم Dastyar AI — ایمیل، تلگرام، و فرم تماس.',
      canonical: `${window.location.origin}/contact`,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: 'تماس با Dastyar AI',
        description: 'راه‌های تماس با تیم Dastyar AI — ایمیل، تلگرام، و فرم تماس.',
        url: `${window.location.origin}/contact`
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName) {
      setError('لطفاً نام خود را وارد کنید.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('لطفاً یک آدرس ایمیل معتبر وارد کنید.');
      return;
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      setError('متن پیام باید حداقل ۱۰ کاراکتر باشد.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          message: trimmedMessage
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ارسال پیام.');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen clay-landing-bg text-[#0f1420] dark:text-[#f3f5f9] flex flex-col justify-between transition-colors overflow-x-hidden" dir="rtl">
      <GlobalHeader />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-14">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 clay-pill-thick text-xs font-bold mb-4 shadow-sm select-none">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>ارتباط با پشتیبانی</span>
          </div>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-600 via-blue-600 to-cyan-500 dark:from-indigo-300 dark:via-blue-300 dark:to-cyan-200 leading-[1.3] mb-4"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            تماس با Dastyar AI
          </h1>

          <p
            className="text-base sm:text-lg text-[#525d75] dark:text-[#9aa5bc] leading-relaxed max-w-xl mx-auto"
            style={{ fontFamily: "'Vazirmatn', sans-serif" }}
          >
            برای سوالات، پیشنهادها، یا گزارش مشکلات، از راه‌های زیر با ما در تماس باشید. سریع‌ترین راه، ربات تلگرام است.
          </p>
        </div>

        {/* Contact Channels */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
            راه‌های تماس
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="mailto:support@dastyarai.com"
              className="p-5 rounded-2xl clay-surface hover:scale-[1.02] transition-transform flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl clay-btn flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs text-[#525d75] dark:text-[#9aa5bc] block mb-0.5">پشتیبانی ایمیل</span>
                <span className="font-bold text-sm sm:text-base text-[#0f1420] dark:text-white dir-ltr block truncate">
                  support@dastyarai.com
                </span>
              </div>
            </a>

            <a
              href="https://t.me/dastyarai_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl clay-surface hover:scale-[1.02] transition-transform flex items-center gap-4 group"
            >
              <div className="w-12 h-12 rounded-xl clay-btn flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-[#525d75] dark:text-[#9aa5bc] block mb-0.5">پشتیبانی سریع تلگرام</span>
                <span className="font-bold text-sm sm:text-base text-[#0f1420] dark:text-white dir-ltr block">
                  @dastyarai_bot
                </span>
              </div>
            </a>
          </div>
        </section>

        {/* Contact Form */}
        <section className="clay-card p-6 sm:p-8 rounded-3xl mb-8">
          <h2
            className="text-xl sm:text-2xl font-black text-[#0f1420] dark:text-white mb-6 flex items-center gap-3"
            style={{ fontFamily: "'Estedad', sans-serif" }}
          >
            <span className="w-2.5 h-6 bg-indigo-600 rounded-full" />
            فرم تماس
          </h2>

          {success ? (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                پیام شما دریافت شد. در اسرع وقت پاسخ می‌دهیم.
              </p>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="mt-4 px-6 py-2 clay-btn text-xs font-bold rounded-xl"
              >
                ارسال پیام دیگر
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs sm:text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#0f1420] dark:text-white mb-2">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: علی رضایی"
                  required
                  className="w-full px-4 py-3 rounded-xl clay-input text-sm text-[#0f1420] dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#0f1420] dark:text-white mb-2">
                  آدرس ایمیل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 rounded-xl clay-input text-sm text-[#0f1420] dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500/40 text-left"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#0f1420] dark:text-white mb-2">
                  متن پیام (حداقل ۱۰ کاراکتر) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="شرح پیام یا سوال خود را اینجا بنویسید..."
                  required
                  className="w-full px-4 py-3 rounded-xl clay-input text-sm text-[#0f1420] dark:text-white outline-hidden focus:ring-2 focus:ring-blue-500/40 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 clay-btn-primary font-bold text-white rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  style={{ fontFamily: "'Estedad', sans-serif" }}
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'در حال ارسال...' : 'ارسال پیام'}</span>
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
