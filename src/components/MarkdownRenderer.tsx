import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Copy,
  Check,
  Info,
  AlertTriangle,
  Lightbulb,
  AlertOctagon,
  FileCode,
  Download,
} from 'lucide-react';
import { isRtlText, toPersianDigits } from '../lib/persianUtils';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  usePersianDigits?: boolean;
}

// Safely extract string content from any nested ReactNode
function extractNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractNodeText).join(' ');
  }
  if (React.isValidElement(node) && node.props) {
    return extractNodeText((node.props as any).children);
  }
  return '';
}

// Smart formatter to break inline numbered principles/lists into distinct lines
function formatInlineListsAndPrinciples(text: string): string {
  if (!text) return '';

  // Separate code blocks to avoid formatting inside code
  const codeBlocks: string[] = [];
  let tempText = text.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
    codeBlocks.push(match);
    return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
  });

  // 1. If a line has a colon or intro followed immediately by inline numbered items (e.g. "... حیاتی است: ۱. ...")
  tempText = tempText.replace(/([:：]\s*)([۰-۹0-9]+[\.\-\)]\s+)/g, ':\n\n$2');

  // 2. If a numbered item follows a sentence ending (. or ! or ؟ or colon or parenthesis) on the same line
  tempText = tempText.replace(/([.!؟:：\)]|\b[a-zA-Z\u0600-\u06FF]+)[ \t]+([۰-۹0-9]+[\.\-\)]\s+[\u0600-\u06FFa-zA-Z])/g, (match, p1, p2) => {
    if (['.', '!', '؟', ':', '：', ')'].includes(p1.slice(-1))) {
      return `${p1}\n\n${p2}`;
    }
    return match;
  });

  // 3. Detect inline sequence of numbered items like "... ۱. متن اول ۲. متن دوم ۳. متن سوم" on the same line
  const lines = tempText.split('\n');
  const formattedLines = lines.map((line) => {
    // If line has multiple numbered items on the same line (e.g. "۱. ... ۲. ...")
    const matchCount = (line.match(/[ \t]+[۰-۹0-9]+[\.\-\)]\s+/g) || []).length;
    if (matchCount >= 1 && /[۰-۹0-9]+[\.\-\)]/.test(line)) {
      return line.replace(/([ \t]+)([۰-۹0-9]+[\.\-\)]\s+)/g, '\n\n$2');
    }
    return line;
  });

  tempText = formattedLines.join('\n');

  // Restore code blocks
  return tempText.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => codeBlocks[Number(index)] || '');
}

// Callout / Alert box detector for GitHub style [!NOTE], [!TIP], [!WARNING], [!CAUTION]
function getCalloutType(text: string): { type: 'note' | 'tip' | 'warning' | 'caution' | 'none'; title: string; cleanText: string } {
  const trimmed = text.trim();
  if (trimmed.startsWith('[!NOTE]') || trimmed.startsWith('[!اطلاعیه]')) {
    return { type: 'note', title: 'نکته / یادداشت', cleanText: trimmed.replace(/^\[!(NOTE|اطلاعیه)\]/i, '').trim() };
  }
  if (trimmed.startsWith('[!TIP]') || trimmed.startsWith('[!نکته]')) {
    return { type: 'tip', title: 'پیشنهاد و ترفند', cleanText: trimmed.replace(/^\[!(TIP|نکته)\]/i, '').trim() };
  }
  if (trimmed.startsWith('[!WARNING]') || trimmed.startsWith('[!هشدار]')) {
    return { type: 'warning', title: 'هشدار و توجه', cleanText: trimmed.replace(/^\[!(WARNING|هشدار)\]/i, '').trim() };
  }
  if (trimmed.startsWith('[!CAUTION]') || trimmed.startsWith('[!مهم]')) {
    return { type: 'caution', title: 'احتیاط و مراقبت', cleanText: trimmed.replace(/^\[!(CAUTION|مهم)\]/i, '').trim() };
  }
  return { type: 'none', title: '', cleanText: text };
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming,
  usePersianDigits = false,
}) => {
  const formattedContent = formatInlineListsAndPrinciples(content);
  const processedContent = usePersianDigits ? toPersianDigits(formattedContent) : formattedContent;
  const isOverallRtl = isRtlText(processedContent);

  return (
    <div
      className={`markdown-body text-inherit leading-relaxed ${isOverallRtl ? 'text-right' : 'text-left'} ${
        isStreaming ? 'streaming-cursor' : ''
      }`}
      dir={isOverallRtl ? 'rtl' : 'ltr'}
      style={{ unicodeBidi: 'isolate' }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkBreaks]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Paragraph formatting with robust recursive RTL detection and Callout support
          p({ children }) {
            const rawText = extractNodeText(children);
            const callout = getCalloutType(rawText);

            if (callout.type !== 'none') {
              const iconMap = {
                note: <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />,
                tip: <Lightbulb className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />,
                warning: <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />,
                caution: <AlertOctagon className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />,
              };
              const borderMap = {
                note: 'border-blue-500/30 bg-blue-500/5 text-inherit',
                tip: 'border-emerald-500/30 bg-emerald-500/5 text-inherit',
                warning: 'border-amber-500/30 bg-amber-500/5 text-inherit',
                caution: 'border-rose-500/30 bg-rose-500/5 text-inherit',
              };

              return (
                <div
                  className={`my-3 p-3.5 rounded-xl border-r-4 border ${borderMap[callout.type]} flex items-start gap-2.5 text-right`}
                  dir="rtl"
                >
                  {iconMap[callout.type]}
                  <div className="flex-1 text-[13px] leading-6">
                    <p className="font-bold text-[12px] opacity-90 mb-0.5">{callout.title}</p>
                    <p className="opacity-95">{callout.cleanText || children}</p>
                  </div>
                </div>
              );
            }

            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <p
                className={`mb-3.5 last:mb-0 leading-7 font-normal ${rtl ? 'text-right' : 'text-left'}`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {children}
              </p>
            );
          },

          // Code blocks with syntax copy header & react-syntax-highlighter
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            if (!inline && (match || codeString.includes('\n'))) {
              return <CodeBlock language={language} code={codeString} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-[0.88em] font-mono border border-subtle inline mx-1 break-words align-baseline isolate font-medium"
                dir="ltr"
                {...props}
              >
                <bdi>{children}</bdi>
              </code>
            );
          },

          // Headings with RTL alignment
          h1({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <h1
                className={`text-xl sm:text-2xl font-bold mt-5 mb-3 text-inherit border-b border-subtle pb-2.5 flex items-center gap-2 ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {children}
              </h1>
            );
          },
          h2({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <h2
                className={`text-lg sm:text-xl font-bold mt-4 mb-2.5 text-inherit border-b border-subtle/50 pb-1.5 ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {children}
              </h2>
            );
          },
          h3({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <h3
                className={`text-base sm:text-lg font-semibold mt-3.5 mb-2 text-inherit ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {children}
              </h3>
            );
          },
          h4({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <h4
                className={`text-sm sm:text-base font-semibold mt-3 mb-1.5 text-inherit ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {children}
              </h4>
            );
          },

          // Lists with correct adaptive RTL / LTR bullet / number alignment
          ul({ children }) {
            return (
              <ul
                className={`list-disc my-3 space-y-2 text-inherit opacity-95 marker:text-slate-400 dark:marker:text-slate-500 ${
                  isOverallRtl ? 'pr-6 pl-0 text-right' : 'pl-6 pr-0 text-left'
                }`}
                dir={isOverallRtl ? 'rtl' : 'ltr'}
              >
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol
                className={`list-decimal my-3 space-y-2 text-inherit opacity-95 font-normal marker:text-slate-400 dark:marker:text-slate-500 ${
                  isOverallRtl ? 'pr-6 pl-0 text-right' : 'pl-6 pr-0 text-left'
                }`}
                dir={isOverallRtl ? 'rtl' : 'ltr'}
              >
                {children}
              </ol>
            );
          },
          li({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <li
                className={`leading-7 my-1 ${rtl ? 'text-right' : 'text-left'}`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {children}
              </li>
            );
          },

          // Strong / Bold tags
          strong({ children }) {
            return <strong className="font-bold text-inherit">{children}</strong>;
          },

          // Emphasis / Italic (smaller caption & metadata formatting)
          em({ children }) {
            return (
              <em className="text-xs sm:text-[13px] text-zinc-500 dark:text-zinc-400 not-italic font-normal inline-block mt-1 leading-relaxed opacity-95">
                {children}
              </em>
            );
          },

          // Blockquotes styled as clean, uniform 4-corner rounded cards
          blockquote({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <blockquote
                className={`p-4 my-3 bg-black/[0.03] dark:bg-white/[0.04] border border-black/10 dark:border-white/10 rounded-2xl text-inherit opacity-95 shadow-xs transition-colors not-italic ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {children}
              </blockquote>
            );
          },

          // Tables forced to LTR / clean grid for numbers, headers, and code without reversed columns
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-subtle shadow-xs" dir="ltr">
                <table className="min-w-full divide-y divide-subtle text-sm text-left font-sans">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-black/5 dark:bg-white/5 font-bold text-inherit border-b border-subtle">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-subtle text-inherit">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-4 py-2.5 text-left font-bold text-inherit">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 text-left text-inherit opacity-90">{children}</td>;
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-[#1a73e8] dark:text-[#8ab4f8] hover:underline underline-offset-4 transition-opacity font-medium mx-0.5 inline-block"
              >
                {children}
              </a>
            );
          },

          // Divider
          hr() {
            return <hr className="my-4 border-subtle" />;
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const extension = language ? `.${language}` : '.txt';
    a.download = `code_snippet_${Date.now()}${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="my-4 rounded-xl overflow-hidden border border-subtle bg-[#1e1e1e] text-slate-300 shadow-xl"
      dir="ltr"
    >
      {/* Code Header (VSCode / Windows 11 style) */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#252526] border-b border-[#333333] select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-sky-400" />
          <span className="font-mono text-xs text-zinc-400 font-bold uppercase tracking-wider">
            {language || 'code'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-colors flex items-center gap-1 text-[11px]"
            title="دانلود فایل کد"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleCopy}
            className="clay-btn bg-white/5 hover:bg-white/10 border border-white/10 flex items-center gap-1.5 px-2.5 py-1 text-slate-200 text-[11px] rounded-lg transition-all cursor-pointer"
            aria-label="Copy code block"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400 font-bold" />
                <span className="text-emerald-400 font-sans font-bold">کپی شد ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 opacity-70" />
                <span className="font-sans font-medium">کپی کد</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content with Syntax Highlighting */}
      <div className="overflow-x-auto text-[13px] font-mono leading-relaxed bg-[#1e1e1e]">
        <SyntaxHighlighter
          language={language || 'typescript'}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '1rem',
            background: '#1e1e1e',
            fontSize: '13px',
            lineHeight: '1.6',
            fontFamily: "var(--font-mono), 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          }}
          showLineNumbers={code.split('\n').length > 3}
          lineNumberStyle={{
            minWidth: '2.5em',
            paddingRight: '1em',
            color: '#6e7681',
            textAlign: 'right',
            userSelect: 'none',
          }}
          wrapLongLines={false}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};
