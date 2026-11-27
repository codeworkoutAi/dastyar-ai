import React, { useState } from 'react';
import { Copy, Check, Code2, Cpu, ArrowLeft, Globe, Server } from 'lucide-react';
import { IDE_TABS } from '../data/tarapolContent';

export const IdeIntegrationTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('antigravity');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const currentIde = IDE_TABS.find((t) => t.id === activeTab);

  const handleCopy = (value: string, fieldKey: string) => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedField(fieldKey);
    window.setTimeout(() => setCopiedField(null), 1800);
  };

  return (
    <section id="ide-integration" className="py-4 scroll-mt-24 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl clay-surface text-xs font-bold text-[var(--accent-primary)]">
          <Code2 size={14} />
          <span>یکپارچگی استاندارد با تمام ادیتورها</span>
        </span>
        <h2
          className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          اتصال در کمتر از ۳ دقیقه با OpenAI Proxy و MCP
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          ادیتور مورد علاقه خود را انتخاب کنید تا تنظیمات آماده اتصال نمایش داده شود
        </p>
      </div>

      <div className="clay-card rounded-card p-5 sm:p-7 space-y-6">
        {/* Tab Bar */}
        <div className="clay-surface-inset rounded-2xl p-1.5 flex flex-wrap gap-1.5">
          {IDE_TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'clay-btn-primary text-white'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveTab('architecture')}
            className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'architecture'
                ? 'clay-btn-primary text-white'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            معماری جریان داده
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'architecture' ? (
          <div className="space-y-5">
            <p className="text-xs sm:text-sm text-[var(--text-muted)] text-center">
              کدهای شما هرگز از شبکه محلی سیستم خارج نمی‌شوند؛ تمام ارتباط بین محیط توسعه و مرورگر خودتان برقرار است:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {[
                {
                  step: '۱',
                  title: 'محیط توسعه (IDE)',
                  desc: 'Antigravity / Cursor / VS Code',
                  icon: Code2,
                },
                {
                  step: '۲',
                  title: 'پروکسی محلی',
                  desc: 'http://localhost:8765/v1',
                  icon: Server,
                },
                {
                  step: '۳',
                  title: 'پل ارتباطی و کانتکست',
                  desc: 'Smart Delta Sync (:8766)',
                  icon: Cpu,
                },
                {
                  step: '۴',
                  title: 'مرورگر شخصی شما',
                  desc: 'تب‌های Gemini / Qwen / DeepSeek',
                  icon: Globe,
                },
              ].map((node, index) => {
                const Icon = node.icon;
                return (
                  <div key={node.step} className="relative flex items-center gap-3 md:block">
                    <div className="clay-surface rounded-2xl p-4 space-y-2 w-full text-right">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-xl clay-surface-inset flex items-center justify-center text-[var(--accent-primary)]">
                          <Icon size={16} />
                        </span>
                        <span className="text-[11px] font-black text-[var(--text-dim)] tabular-nums">
                          مرحله {node.step}
                        </span>
                      </div>
                      <div className="text-sm font-black text-[var(--text-main)]">{node.title}</div>
                      <div className="text-xs text-[var(--text-muted)] font-mono" dir="ltr">
                        {node.desc}
                      </div>
                    </div>
                    {index < 3 && (
                      <div className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full clay-card items-center justify-center text-[var(--accent-primary)]">
                        <ArrowLeft size={12} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          currentIde && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Connection Config Box */}
              <div className="lg:col-span-6 clay-surface rounded-2xl p-4 sm:p-5 space-y-3.5">
                <div className="text-xs font-black text-[var(--text-main)]">
                  اطلاعات اتصال آماده کپی
                </div>

                {[
                  { key: 'baseUrl', label: 'Base URL', value: currentIde.baseUrl },
                  { key: 'apiKey', label: 'API Key', value: currentIde.apiKey },
                  { key: 'model', label: 'Model ID', value: currentIde.model },
                ].map((row) => (
                  <div
                    key={row.key}
                    className="clay-surface-inset rounded-xl px-3.5 py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-[var(--text-dim)] uppercase">
                        {row.label}
                      </div>
                      <div className="text-xs sm:text-sm font-mono text-[var(--text-main)] truncate" dir="ltr">
                        {row.value}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(row.value, `${currentIde.id}-${row.key}`)}
                      className="clay-btn px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[var(--text-main)] flex items-center gap-1 shrink-0 cursor-pointer"
                      aria-label={`کپی ${row.label}`}
                    >
                      {copiedField === `${currentIde.id}-${row.key}` ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span>کپی شد</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>کپی</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Setup Steps */}
              <div className="lg:col-span-6 space-y-3.5 text-right">
                <div className="text-sm font-black text-[var(--text-main)]">
                  {currentIde.subtitle}
                </div>
                <ol className="space-y-3">
                  {currentIde.steps.map((step, i) => (
                    <li key={i} className="clay-surface rounded-xl p-3.5 flex items-start gap-3">
                      <span className="w-6 h-6 rounded-lg clay-btn-primary text-white text-xs font-black flex items-center justify-center shrink-0 tabular-nums">
                        {i + 1}
                      </span>
                      <span className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
};
