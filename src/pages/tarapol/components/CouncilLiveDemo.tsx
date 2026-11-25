import React, { useState } from 'react';
import { Terminal, Sparkles, Cpu, CheckCircle2, Play } from 'lucide-react';
import { DEMO_SCENARIOS } from '../data/tarapolContent';

export const CouncilLiveDemo: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(DEMO_SCENARIOS[0].id);
  const [isSimulating, setIsSimulating] = useState(false);

  const activeScenario = DEMO_SCENARIOS.find((s) => s.id === activeId) || DEMO_SCENARIOS[0];

  const handleSelectScenario = (id: string) => {
    if (id === activeId) return;
    setIsSimulating(true);
    setActiveId(id);
    window.setTimeout(() => setIsSimulating(false), 260);
  };

  return (
    <div className="clay-card-elevated rounded-card p-4 sm:p-5 space-y-4">
      {/* Top Window Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl clay-surface flex items-center justify-center text-[var(--accent-primary)]">
            <Terminal size={16} />
          </div>
          <div>
            <div className="text-xs font-black text-[var(--text-main)]">
              شبیه‌ساز زنده شورای مدل‌ها
            </div>
            <div className="text-[10px] font-mono text-[var(--text-dim)]" dir="ltr">
              localhost:8765/v1 · Active
            </div>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-lg clay-surface text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          متصل
        </span>
      </div>

      {/* Scenario Switcher Pills */}
      <div className="flex flex-wrap items-center gap-2">
        {DEMO_SCENARIOS.map((scenario) => {
          const isActive = scenario.id === activeId;
          return (
            <button
              key={scenario.id}
              type="button"
              onClick={() => handleSelectScenario(scenario.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'clay-btn-primary text-white'
                  : 'clay-btn text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Play size={10} />
              <span>{scenario.label}</span>
            </button>
          );
        })}
      </div>

      {/* Inset Terminal Command */}
      <div
        className="clay-surface-inset rounded-xl p-3 font-mono text-[11px] sm:text-xs text-[var(--text-main)] leading-relaxed"
        dir="rtl"
      >
        <span className="text-[var(--accent-primary)] font-bold ml-1.5">$</span>
        {activeScenario.command}
      </div>

      {/* Split Council Output */}
      <div
        className={`space-y-3 transition-opacity duration-200 ${
          isSimulating ? 'opacity-50' : 'opacity-100'
        }`}
      >
        {/* Qwen4-Max Opinion */}
        <div className="clay-surface rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-purple-600 dark:text-purple-400">
            <Cpu size={14} />
            <span>{activeScenario.qwenTitle}</span>
          </div>
          <ul className="space-y-1 text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
            {activeScenario.qwenPoints.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-purple-500 mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Gemini 4 Neon Opinion */}
        <div className="clay-surface rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-[var(--accent-primary)]">
            <Sparkles size={14} />
            <span>{activeScenario.neonTitle}</span>
          </div>
          <ul className="space-y-1 text-[11px] sm:text-xs text-[var(--text-muted)] leading-relaxed">
            {activeScenario.neonPoints.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[var(--accent-primary)] mt-0.5">•</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Consensus Footer */}
        <div className="clay-surface-inset rounded-xl px-3 py-2.5 flex items-center gap-2 text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{activeScenario.consensus}</span>
        </div>
      </div>
    </div>
  );
};
