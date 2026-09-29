const fs = require('fs');
const filePath = 'src/components/ImageGenStudio.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const target = `  img.onerror = () => {
  if (isSettled) return;
  // If direct CDN or proxy fails, attempt one fresh seed retry
  const separator = rawUrl.includes('?') ? '&' : '?';
  const fallbackUrl = \`\${rawUrl.replace(/seed=\\d+/, '')}\${separator}seed=\${Math.floor(Math.random() * 10000000)}\`;
  const fallbackProxy = toSafeImageUrl(fallbackUrl);
  const lastTry = new Image();
  lastTry.onload = () => {
  if (isSettled) return;
  isSettled = true;
  clearTimeout(timer);
  resolve(fallbackProxy);
  };
  lastTry.onerror = () => {
  if (isSettled) return;
  isSettled = true;
  clearTimeout(timer);
  reject(new Error('خطا در دریافت فایل تصویر از سرور. لطفاً مجدداً دکمه تولید را بزنید.'));
  };
  lastTry.src = fallbackProxy;
  };`;

const replacement = `  img.onerror = () => {
  if (isSettled) return;
  
  // First fallback: try direct URL bypassing proxy (useful if server backend is blocked but client VPN works)
  const directTry = new Image();
  directTry.onload = () => {
  if (isSettled) return;
  isSettled = true;
  clearTimeout(timer);
  resolve(rawUrl);
  };
  directTry.onerror = () => {
  if (isSettled) return;
  // Second fallback: fresh seed retry through proxy
  const separator = rawUrl.includes('?') ? '&' : '?';
  const fallbackUrl = \`\${rawUrl.replace(/seed=\\d+/, '')}\${separator}seed=\${Math.floor(Math.random() * 10000000)}\`;
  const fallbackProxy = toSafeImageUrl(fallbackUrl);
  const lastTry = new Image();
  lastTry.onload = () => {
  if (isSettled) return;
  isSettled = true;
  clearTimeout(timer);
  resolve(fallbackProxy);
  };
  lastTry.onerror = () => {
  if (isSettled) return;
  isSettled = true;
  clearTimeout(timer);
  reject(new Error('خطا در دریافت فایل تصویر. اگر از ایران متصل هستید، ممکن است به فیلترشکن نیاز داشته باشید.'));
  };
  lastTry.src = fallbackProxy;
  };
  directTry.src = rawUrl;
  };`;

// Strip spaces to compare
const stripSpaces = (str) => str.replace(/\s+/g, '');
const strippedTarget = stripSpaces(target);
const strippedContent = stripSpaces(content);

if (strippedContent.includes(strippedTarget)) {
  // We need to replace safely. Since we stripped, let's use indexOf in stripped to find boundaries?
  // Safer: just use regex with flex spacing
  const regexPattern = target.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/\s+/g, '\\s+');
  const regex = new RegExp(regexPattern);
  if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('SUCCESS');
  } else {
    console.log('REGEX_FAILED');
  }
} else {
  console.log('NOT_FOUND');
}
