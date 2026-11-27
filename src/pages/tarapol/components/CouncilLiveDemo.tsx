import React, { useState } from 'react';
import { Sparkles, Cpu, CheckCircle2, Play, Users } from 'lucide-react';
import { DEMO_SCENARIOS } from '../data/tarapolContent';

export const CouncilLiveDemo: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(DEMO_SCENARIOS[0].id);
  const [isSwitching, setIsSwitching] = useState(false);

  const activeScenario = DEMO_SCENARIOS.find((s) => s.id === activeId) || DEMO_SCENARIOS[0];

  const handleSelect = (id: string) => {
    if (id === activeId) return;
    setIsSwitching(true);
    setActiveId(id);
    window.setTimeout(() => setIsSwitching(false), 200);
  };

  return (
    <section id="council-demo" className="py-4 scroll-mt-24 space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl clay-surface text-xs font-bold text-[var(--accent-primary)]">
          <Users size={14} />
          <span>قدرت تصمیم‌گیری جمعی</span>
        </span>
        <h2
          className="text-2xl sm:text-3xl font-black text-[var(--text-main)]"
          style={{ fontFamily: "'Estedad', sans-serif" }}
        >
          دو ذهن برتر، در خدمت یک پروژه
        </h2>
        <p className="text-sm text-[var(--text-muted)]">
          به‌جای اکتفا به یک پاسخ، تَراپُل سوال شما را هم‌زمان به مدل‌های وب می‌فرستد و جمع‌بندی نهایی را تحویل می‌دهد
        </p>
      </div>

      <div className="clay-card-elevated rounded-card p-5 sm:p-7 max-w-4xl mx-auto space-y-5">
        {/* Scenario Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-subtle">
          <div className="flex flex-wrap items-center gap-2">
            {DEMO_SCENARIOS.map((scenario) => {
              const isActive = scenario.id === activeId;
              return (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => handleSelect(scenario.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'clay-btn-primary text-white'
                      : 'clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <Play size={11} />
                  <span>{scenario.label}</span>
                </button>
              );
            })}
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            پیش‌نمایش خروجی شورا
          </span>
        </div>

        {/* User Prompt Box */}
        <div className="clay-surface-inset rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-[var(--text-main)]">
          {activeScenario.prompt}
        </div>

        {/* Side-by-Side Council Perspectives */}
        <div
          className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200 ${
            isSwitching ? 'opacity-50' : 'opacity-100'
          }`}
        >
          <div className="clay-surface rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-purple-600 dark:text-purple-400">
              <Cpu size={15} />
              <span>{activeScenario.qwenTitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              {activeScenario.qwenSummary}
            </p>
          </div>

          <div className="clay-surface rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[var(--accent-primary)]">
              <Sparkles size={15} />
              <span>{activeScenario.neonTitle}</span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
              {activeScenario.neonSummary}
            </p>
          </div>
        </div>

        {/* Unified Consensus */}
        <div className="clay-surface-inset rounded-2xl px-4 py-3 flex items-center gap-2.5 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{activeScenario.consensus}</span>
        </div>
      </div>
    </section>
  );
};
