import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkBreaks from 'remark-breaks';
import rehypeKatex from 'rehype-katex';
import {
  CalendarBoldDuotoneIcon,
  SunBoldDuotoneIcon,
  MoonStarsBoldDuotoneIcon,
  GlobalBoldDuotoneIcon,
  PinBoldDuotoneIcon,
  NotesBoldDuotoneIcon,
  LightbulbBoldDuotoneIcon,
  CpuBoltBoldDuotoneIcon,
  StarsMinimalisticBoldDuotoneIcon,
  Code2BoldDuotoneIcon,
  ChartBoldDuotoneIcon,
  LockKeyholeBoldDuotoneIcon,
  MinimalisticMagnifierBoldDuotoneIcon,
  FolderBoldDuotoneIcon,
  ClockCircleBoldDuotoneIcon,
  CheckCircleBoldDuotoneIcon,
  CloseCircleBoldDuotoneIcon,
  DangerTriangleBoldDuotoneIcon,
  InfoCircleBoldDuotoneIcon,
  ChatRoundBoldDuotoneIcon,
  HeartBoldDuotoneIcon,
  VolumeLoudBoldDuotoneIcon,
  BuildingsBoldDuotoneIcon,
  DocumentTextBoldDuotoneIcon,
  CupBoldDuotoneIcon,
  MedalStarBoldDuotoneIcon,
  TagBoldDuotoneIcon,
  TagPriceBoldDuotoneIcon,
  LinkBoldDuotoneIcon,
  BellBoldDuotoneIcon,
  WalletBoldDuotoneIcon,
  Card2BoldDuotoneIcon,
  GamepadBoldDuotoneIcon,
  CityBoldDuotoneIcon,
  UsersGroupRoundedBoldDuotoneIcon,
  ScaleBoldDuotoneIcon,
  DiplomaBoldDuotoneIcon,
  TestTubeBoldDuotoneIcon,
  MedicalKitBoldDuotoneIcon,
  CameraBoldDuotoneIcon,
  ClapperboardBoldDuotoneIcon,
  MasksBoldDuotoneIcon,
  MusicNoteBoldDuotoneIcon,
  RocketBoldDuotoneIcon,
  ShieldCheckBoldDuotoneIcon,
} from '@solar-icons/react';
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
  stripReasoning?: boolean;
}

// Universal Solar Icon mapping for common emojis
const EMOJI_TO_SOLAR_ICON: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  // Economy & Finance
  '💰': { icon: WalletBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '💵': { icon: WalletBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🪙': { icon: WalletBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '💳': { icon: Card2BoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📈': { icon: ChartBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📉': { icon: ChartBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📊': { icon: ChartBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Sports & Entertainment
  '⚽': { icon: CupBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏀': { icon: CupBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏐': { icon: CupBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🎾': { icon: CupBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏆': { icon: MedalStarBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🥇': { icon: MedalStarBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🎮': { icon: GamepadBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Society, City & People
  '🏙️': { icon: CityBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌆': { icon: CityBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏢': { icon: BuildingsBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏛️': { icon: BuildingsBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏛': { icon: BuildingsBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '👥': { icon: UsersGroupRoundedBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Politics, Law & Judiciary
  '⚖️': { icon: ScaleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📜': { icon: DiplomaBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📄': { icon: NotesBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📝': { icon: NotesBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Science, Health & Medicine
  '🔬': { icon: TestTubeBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🧪': { icon: TestTubeBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🩺': { icon: MedicalKitBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏥': { icon: MedicalKitBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '💊': { icon: MedicalKitBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🧬': { icon: TestTubeBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Culture, Art, Cinema & Music
  '🎭': { icon: MasksBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🎬': { icon: ClapperboardBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🎨': { icon: CameraBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🎵': { icon: MusicNoteBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📻': { icon: VolumeLoudBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📺': { icon: ClapperboardBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🎥': { icon: CameraBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // News, Sources, Media & Links
  '📣': { icon: VolumeLoudBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📢': { icon: VolumeLoudBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📰': { icon: DocumentTextBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🗞️': { icon: DocumentTextBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🗞': { icon: DocumentTextBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏷️': { icon: TagPriceBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🏷': { icon: TagBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🔗': { icon: LinkBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🔔': { icon: BellBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Calendar & Dates
  '📅': { icon: CalendarBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🗓️': { icon: CalendarBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🗓': { icon: CalendarBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '☀️': { icon: SunBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌞': { icon: SunBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌙': { icon: MoonStarsBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌘': { icon: MoonStarsBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌍': { icon: GlobalBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌐': { icon: GlobalBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌎': { icon: GlobalBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌏': { icon: GlobalBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Pins & Flowers
  '📌': { icon: PinBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📍': { icon: PinBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌸': { icon: StarsMinimalisticBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌺': { icon: StarsMinimalisticBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌹': { icon: StarsMinimalisticBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌷': { icon: StarsMinimalisticBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Ideas, Tech & Coding
  '💡': { icon: LightbulbBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '⚡': { icon: CpuBoltBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '✨': { icon: StarsMinimalisticBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🌟': { icon: StarsMinimalisticBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '⭐': { icon: StarsMinimalisticBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '💻': { icon: Code2BoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🖥️': { icon: Code2BoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🤖': { icon: CpuBoltBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🚀': { icon: RocketBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🛡️': { icon: ShieldCheckBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🛡': { icon: ShieldCheckBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🔍': { icon: MinimalisticMagnifierBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🔎': { icon: MinimalisticMagnifierBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📁': { icon: FolderBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '📂': { icon: FolderBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Time
  '⏰': { icon: ClockCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '⏱️': { icon: ClockCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '⏳': { icon: ClockCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '⌛': { icon: ClockCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Security & Chat
  '🔒': { icon: LockKeyholeBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🔓': { icon: LockKeyholeBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🔑': { icon: LockKeyholeBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '💬': { icon: ChatRoundBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🗨️': { icon: ChatRoundBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '❤️': { icon: HeartBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  // Statuses
  '✅': { icon: CheckCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '✔️': { icon: CheckCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '❌': { icon: CloseCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '❎': { icon: CloseCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '⚠️': { icon: DangerTriangleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  '🚨': { icon: DangerTriangleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  'ℹ️': { icon: InfoCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' },
  'ℹ': { icon: InfoCircleBoldDuotoneIcon, color: 'text-zinc-500 dark:text-zinc-400' }
};

const EMOJI_REGEX = /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/gu;

type IconContext = 'heading' | 'body' | 'meta' | 'badge';

// Replace emojis recursively inside React children with context-aware Solar Icons
function replaceEmojisWithSolarIcons(node: React.ReactNode, context: IconContext = 'body'): React.ReactNode {
  if (typeof node === 'string') {
    const parts = node.split(EMOJI_REGEX);
    if (parts.length === 1) return node;

    // CRITICAL: DO NOT add colors. User prefers MONOCHROME and SMALL icons.
    // Size mappings per context
    let sizeClass = 'w-4 h-4 drop-shadow-none mx-0.5 opacity-60 grayscale';
    if (context === 'heading') {
      sizeClass = 'w-4 h-4 sm:w-5 sm:h-5 drop-shadow-none mx-1.5 mb-0.5 opacity-60 grayscale';
    } else if (context === 'meta' || context === 'badge') {
      sizeClass = 'w-3 h-3 max-w-[12px] max-h-[12px] opacity-50 mx-0.5 align-baseline grayscale';
    }

    return parts.map((part, index) => {
      const match = EMOJI_TO_SOLAR_ICON[part];
      if (match) {
        const IconComponent = match.icon;
        return (
          <span key={index} className="inline-flex items-center align-middle select-none pointer-events-none transition-transform hover:scale-110">
            {/* FORCE MONOCHROME: Overriding match.color with text-zinc-500 */}
            <IconComponent className={`${sizeClass} text-zinc-500 dark:text-zinc-400`} />
          </span>
        );
      } else if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]$/u.test(part)) {
        // Native Emojis that aren't in the Solar Icon map: Force them to be small & grayscale
        return (
          <span key={index} className="inline-block grayscale opacity-75 text-[0.85em] align-baseline mx-0.5">
            {part}
          </span>
        );
      }
      return part;
    });
  }

  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>
        {replaceEmojisWithSolarIcons(child, context)}
      </React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    if (node.type === 'code' || node.type === 'pre') {
      return node;
    }
    const children = (node.props as any)?.children;
    if (children) {
      return React.cloneElement(node as React.ReactElement<any>, {
        children: replaceEmojisWithSolarIcons(children, context)
      });
    }
  }

  return node;
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
function formatInlineListsAndPrinciples(text: string, stripReasoning = false): string {
  if (!text) return '';

  // 0. Pre-process <think> tags into ```reasoning code blocks (handles unclosed tags during streaming)
  let tempText = text.replace(/<think>([\s\S]*?)(<\/think>|$)/gi, (match, content) => {
    if (stripReasoning) return '';
    return `\n\n\`\`\`reasoning\n${content.trim()}\n\`\`\`\n\n`;
  });

  // Separate code blocks to avoid formatting inside code
  const codeBlocks: string[] = [];
  tempText = tempText.replace(/```[\s\S]*?```|`[^`]+`/g, (match) => {
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
    // Only split if the numbered item is preceded by actual text, NOT just spaces or blockquote marks
    // We avoid matching "^> 1." or "^ 1."
    const matchCount = (line.match(/(?<=[^\s>][ \t]+)([۰-۹0-9]+[\.\-\)]\s+)/g) || []).length;
    if (matchCount >= 1) {
      return line.replace(/(?<=[^\s>][ \t]+)([۰-۹0-9]+[\.\-\)]\s+)/g, '\n\n$1');
    }
    return line;
  });

  tempText = formattedLines.join('\n');

  // 4. Strip hallucinated HTML tags and system prompt tags outside of code blocks
  tempText = tempText.replace(/<\/?\*?(div|span|html|body|main|center|web_search_results|instructions)[^>]*>/gi, '');

  // 5. Strip empty indented lines (just spaces/tabs) to prevent hallucinated empty code blocks
  tempText = tempText.replace(/^[ \t]+$/gm, '');

  // 6. Remove redundant horizontal rules (---, ***, ___) that appear immediately after reasoning blocks
  // to prevent double lines (the details box border + the hr) and excessive vertical spacing.
  tempText = tempText.replace(/__CODE_BLOCK_(\d+)__\s*[-*_]{3,}\s*/g, '__CODE_BLOCK_$1__\n\n');

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

// Safely detects Persian poetry couplets (ابیات شعر فارسی) for authentic two-column Divan book presentation
function isValidHemistichPair(m1: string, m2: string): boolean {
  // Check Persian characters
  const persian1 = (m1.match(/[\u0600-\u06FF]/g) || []).length;
  const persian2 = (m2.match(/[\u0600-\u06FF]/g) || []).length;
  if (persian1 < 8 || persian2 < 8) return false;

  // Length limits for hemistich (typically 10 to 65 chars)
  if (m1.length < 10 || m1.length > 65 || m2.length < 10 || m2.length > 65) return false;

  // Ratio of lengths should be reasonably balanced (min/max >= 0.5)
  const ratio = Math.min(m1.length, m2.length) / Math.max(m1.length, m2.length);
  if (ratio < 0.5) return false;

  // Must not be list items, headers, code, or links
  if (/^[-*#\d\.\>\:\—\–]/i.test(m1) || /^[-*#\d\.\>\:\—\–]/i.test(m2)) return false;
  if (m1.endsWith(':') || m2.endsWith(':')) return false;
  if (/https?:\/\//i.test(m1) || /https?:\/\//i.test(m2)) return false;

  return true;
}

function parsePoeticCouplets(children: React.ReactNode): Array<{ first: string; second: string }> | null {
  const lines: string[] = [];

  const extractLines = (node: React.ReactNode) => {
    if (typeof node === 'string') {
      const parts = node.split(/\r?\n/);
      for (let i = 0; i < parts.length; i++) {
        if (i > 0) lines.push('');
        if (parts[i]) {
          if (lines.length === 0) lines.push(parts[i]);
          else lines[lines.length - 1] += parts[i];
        }
      }
    } else if (Array.isArray(node)) {
      node.forEach(extractLines);
    } else if (React.isValidElement(node)) {
      if (node.type === 'br') {
        lines.push('');
      } else if (node.props && (node.props as any).children) {
        extractLines((node.props as any).children);
      }
    }
  };

  extractLines(children);
  const cleanLines = lines.map(l => l.trim()).filter(Boolean);

  // Check Sub-case: A single line separated by ' / ' or ' // ' (e.g. "مصرع اول / مصرع دوم")
  if (cleanLines.length === 1) {
    const singleLine = cleanLines[0];
    const slashParts = singleLine.split(/\s*[\/]{1,2}\s*/);
    if (slashParts.length === 2) {
      const p1 = slashParts[0].trim();
      const p2 = slashParts[1].trim();
      if (isValidHemistichPair(p1, p2)) {
        return [{ first: p1, second: p2 }];
      }
    }
    return null;
  }

  // Must have at least 2 lines and an even number of lines
  if (cleanLines.length < 2 || cleanLines.length % 2 !== 0) {
    return null;
  }

  const couplets: Array<{ first: string; second: string }> = [];
  for (let i = 0; i < cleanLines.length; i += 2) {
    const m1 = cleanLines[i];
    const m2 = cleanLines[i + 1];
    if (!isValidHemistichPair(m1, m2)) {
      return null;
    }
    couplets.push({ first: m1, second: m2 });
  }

  return couplets.length > 0 ? couplets : null;
}

const PoeticBlock: React.FC<{ couplets: Array<{ first: string; second: string }> }> = ({ couplets }) => {
  return (
    <div className="my-2 select-text" dir="rtl">
      <div className="space-y-2">
        {couplets.map((couplet, idx) => (
          <div
            key={idx}
            className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-baseline sm:gap-x-6 py-0.5"
          >
            {/* مصرع اول */}
            <div className="text-right text-[15px] sm:text-[16px] text-inherit font-medium leading-relaxed tracking-wide">
              {couplet.first}
            </div>

            {/* نشانگر متوازن بین دو مصرع */}
            <div className="hidden sm:flex items-center justify-center opacity-40 text-xs select-none px-2">
              ✤
            </div>

            {/* مصرع دوم */}
            <div className="text-left sm:text-left text-[15px] sm:text-[16px] text-inherit font-medium leading-relaxed tracking-wide pt-1 sm:pt-0 pl-1 sm:pl-0 flex items-center justify-end sm:justify-start gap-2">
              <span className="sm:hidden opacity-30 text-[10px]">✤</span>
              <span>{couplet.second}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

let katexCssLoaded = false;
const loadKatexCss = () => {
  if (!katexCssLoaded) {
    katexCssLoaded = true;
    import('katex/dist/katex.min.css');
  }
};


export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({
  content,
  isStreaming = false,
  usePersianDigits = false,
  stripReasoning = false,
}) => {
  React.useEffect(() => {
    if (content && (content.includes('$') || content.includes('\\'))) {
      loadKatexCss();
    }
  }, [content]);

  const formattedContent = formatInlineListsAndPrinciples(content, stripReasoning);
  const processedContent = usePersianDigits ? toPersianDigits(formattedContent) : formattedContent;
  const isOverallRtl = isRtlText(processedContent);

  return (
    <div
      className={`markdown-body prose dark:prose-invert max-w-none prose-p:my-1.5 prose-p:leading-7 prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-table:my-2 prose-pre:my-2 prose-blockquote:my-2 prose-hr:my-3 prose-hr:border-zinc-200 dark:prose-hr:border-zinc-800/50 prose-a:text-blue-500 text-inherit leading-snug ${isOverallRtl ? 'text-right' : 'text-left'} ${
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
                    <p className="opacity-95">{replaceEmojisWithSolarIcons(callout.cleanText || children, 'body')}</p>
                  </div>
                </div>
              );
            }

            // Detect Source / Citation lines (e.g. "منبع: مهر • زمان انتشار: ...") and render as modern sleek pill
            const isSourceLine = rawText.includes('منبع:') || rawText.includes('منبع :') || rawText.includes('زمان انتشار:') || rawText.includes('Source:');
            if (isSourceLine) {
              const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
              return (
                <div
                  className={`my-2 inline-flex items-center flex-wrap gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-zinc-300/40 dark:border-white/10 text-xs text-zinc-400 font-normal shadow-xs backdrop-blur-xs select-none ${
                    rtl ? 'text-right' : 'text-left'
                  }`}
                  dir={rtl ? 'rtl' : 'ltr'}
                >
                  {replaceEmojisWithSolarIcons(children, 'meta')}
                </div>
              );
            }

            // Detect Persian Poetry Couplets (چیدمان اصیل دو ستونه کتاب شعر برای ابیات فارسی)
            const poeticCouplets = parsePoeticCouplets(children);
            if (poeticCouplets && poeticCouplets.length > 0) {
              return <PoeticBlock couplets={poeticCouplets} />;
            }

            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <p
                className={`!mt-0 !mb-3.5 last:!mb-0 leading-7 font-normal ${rtl ? 'text-right' : 'text-left'}`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {replaceEmojisWithSolarIcons(children, 'body')}
              </p>
            );
          },

          // Prevent default prose-pre from double-wrapping our CodeBlock or creating empty gray boxes
          pre({ children }) {
            return <>{children}</>;
          },

          // Code blocks with syntax copy header & react-syntax-highlighter
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');

            // In react-markdown v10+, the 'inline' prop is removed.
            // We deduce block mode by checking for a language class or multiline content.
            const isBlock = match || codeString.includes('\n');

            if (isBlock) {
              if (!codeString.trim()) return null; // Prevent completely empty block rendering
              
              if (language === 'poem' || language === 'poetry' || language === 'sher') {
                const poemLines = codeString.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                const couplets: Array<{ first: string; second: string }> = [];
                for (let i = 0; i < poemLines.length; i += 2) {
                  if (i + 1 < poemLines.length) {
                    couplets.push({ first: poemLines[i], second: poemLines[i + 1] });
                  } else {
                    couplets.push({ first: poemLines[i], second: '' });
                  }
                }
                return <PoeticBlock couplets={couplets} />;
              }

              if (language === 'reasoning') {
                  return (
                      <details className="my-4 rounded-xl border border-subtle bg-black/5 dark:bg-white/5 overflow-hidden group">
                          <summary className="cursor-pointer px-4 py-3 font-medium select-none flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors list-none [&::-webkit-details-marker]:hidden">
                              <span className="text-lg">🧠</span>
                              <span className="text-[14px] text-zinc-700 dark:text-zinc-300">فرآیند استدلال هوش مصنوعی (برای مشاهده کلیک کنید)</span>
                          </summary>
                          <div 
                              className="p-4 border-t border-subtle text-[13px] opacity-80 leading-relaxed font-mono whitespace-pre-wrap max-h-[400px] overflow-y-auto" 
                              style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
                          >
                              {codeString}
                          </div>
                      </details>
                  );
              }
              
              return <CodeBlock language={language} code={codeString} />;
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-slate-800 dark:text-slate-200 text-[0.88em] font-mono border border-subtle inline mx-1 break-words align-baseline isolate font-medium before:hidden after:hidden"
                dir="ltr"
                {...props}
              >
                <bdi>{children}</bdi>
              </code>
            );
          },

          // Headings with RTL alignment and Solar Icons support
          h1({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <h1
                className={`font-display !mt-3.5 !mb-2 text-base sm:text-lg font-bold text-inherit border-b border-subtle pb-1.5 flex items-center gap-2 ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {replaceEmojisWithSolarIcons(children, 'heading')}
              </h1>
            );
          },
          h2({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <h2
                className={`font-display !mt-3 !mb-2 text-sm sm:text-base font-bold text-inherit border-b border-subtle/50 pb-1 ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {replaceEmojisWithSolarIcons(children, 'heading')}
              </h2>
            );
          },
          h3({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <h3
                className={`font-display !mt-3.5 !mb-2 text-base sm:text-lg font-semibold text-inherit ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {replaceEmojisWithSolarIcons(children, 'heading')}
              </h3>
            );
          },
          h4({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <h4
                className={`font-display !mt-3 !mb-1.5 text-sm sm:text-base font-semibold text-inherit ${
                  rtl ? 'text-right' : 'text-left'
                }`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {replaceEmojisWithSolarIcons(children, 'heading')}
              </h4>
            );
          },

          // Lists with correct adaptive RTL / LTR bullet / number alignment & task lists
          ul({ className, children }: any) {
            const isTaskList = className?.includes('contains-task-list');
            return (
              <ul
                className={`${isTaskList ? 'list-none !pr-1 !pl-0' : 'list-disc ' + (isOverallRtl ? '!pr-6 !pl-0' : '!pl-6 !pr-0')} !my-3 space-y-2 text-inherit opacity-95 marker:text-slate-400 dark:marker:text-slate-500 ${
                  isOverallRtl ? 'text-right' : 'text-left'
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
                className={`list-decimal !my-3 space-y-2 text-inherit opacity-95 font-normal marker:text-slate-400 dark:marker:text-slate-500 ${
                  isOverallRtl ? '!pr-6 !pl-0 text-right' : '!pl-6 !pr-0 text-left'
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
                className={`leading-7 !my-1 !pl-0 ${rtl ? 'text-right' : 'text-left'}`}
                dir={rtl ? 'rtl' : 'ltr'}
              >
                {replaceEmojisWithSolarIcons(children, 'body')}
              </li>
            );
          },

          // Strong / Bold tags
          strong({ children }) {
            return <strong className="font-bold text-inherit">{replaceEmojisWithSolarIcons(children, 'body')}</strong>;
          },

          // Emphasis / Italic (smaller caption & metadata formatting)
          em({ children }) {
            return (
              <em className="text-xs sm:text-[12px] text-zinc-400 dark:text-zinc-400 not-italic font-normal inline-flex items-center flex-wrap gap-1 mt-1 leading-relaxed opacity-90">
                {replaceEmojisWithSolarIcons(children, 'meta')}
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

          // Tables dynamically adapt direction based on their content (Persian vs English)
          table({ children }) {
            const rawText = extractNodeText(children);
            const rtl = rawText ? isRtlText(rawText) : isOverallRtl;
            return (
              <div className="overflow-x-auto my-4 rounded-xl border border-subtle shadow-xs" dir={rtl ? 'rtl' : 'ltr'}>
                <table className={`min-w-full divide-y divide-subtle text-sm font-sans ${rtl ? 'text-right' : 'text-left'}`}>
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
            return <th className="px-4 py-2.5 font-bold text-inherit !text-start">{replaceEmojisWithSolarIcons(children)}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2.5 text-inherit opacity-90 !text-start">{replaceEmojisWithSolarIcons(children)}</td>;
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

          // Images (AI Generative or Web)
          img({ src, alt }) {
            return (
              <span className="block w-full max-w-2xl mx-auto my-6 animate-fadeIn">
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  className="w-full h-auto object-cover rounded-2xl shadow-lg border border-black/10 dark:border-white/10 transition-transform duration-300 hover:scale-[1.01]"
                />
                {alt && (
                  <span className="block text-center text-[13px] text-zinc-500 dark:text-zinc-400 mt-2.5 italic font-sans opacity-80">
                    {alt}
                  </span>
                )}
              </span>
            );
          },

          // Task list checkbox
          input({ type, checked, ...props }: any) {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled
                  className="rounded-md accent-blue-600 dark:accent-blue-500 w-4 h-4 ml-2 mr-1 align-middle cursor-default"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },

          // Divider
          hr: () => <hr className="!my-4 border-t border-zinc-200 dark:border-zinc-800/60 first:hidden" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
});

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code', e);
    }
  };

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        fallbackCopy(code);
      });
    } else {
      fallbackCopy(code);
    }
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
