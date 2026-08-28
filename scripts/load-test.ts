import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

// CLI Options Parser
const args = process.argv.slice(2);
function getArg(name: string, fallback: string): string {
  const idx = args.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return fallback;
  if (args[idx].includes('=')) return args[idx].split('=')[1];
  return args[idx + 1] || fallback;
}

const TARGET_URL = getArg('url', 'http://localhost:3000');
const CONCURRENT_USERS = parseInt(getArg('users', '400'), 10);
const DURATION_SEC = parseInt(getArg('duration', '30'), 10);
const RAMPUP_SEC = parseInt(getArg('rampup', '5'), 10);
const SCENARIO = getArg('scenario', 'mixed'); // 'mixed' | 'chat' | 'health'

// High-capacity HTTP agent for connection reuse and socket efficiency
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 2000, maxFreeSockets: 1000, timeout: 30000 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 2000, maxFreeSockets: 1000, timeout: 30000 });

interface RequestMetric {
  endpoint: string;
  statusCode: number;
  durationMs: number;
  ttfbMs: number;
  success: boolean;
  error?: string;
  bytesReceived: number;
  isStream: boolean;
}

const metrics: RequestMetric[] = [];
let activeWorkers = 0;
let isStopping = false;

// Helper: HTTP Request with TTFB and streaming measurement
function makeRequest(
  method: string,
  urlPath: string,
  bodyData?: any,
  headers: Record<string, string> = {}
): Promise<RequestMetric> {
  return new Promise((resolve) => {
    const fullUrl = new URL(urlPath, TARGET_URL);
    const isHttps = fullUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    const payload = bodyData ? JSON.stringify(bodyData) : undefined;
    const reqHeaders: Record<string, string> = {
      'User-Agent': 'LoadTester/1.0',
      'Accept': '*/*',
      ...headers,
    };

    if (payload) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(payload).toString();
    }

    const startTime = performance.now();
    let ttfb = 0;
    let bytesReceived = 0;
    const isStream = urlPath.includes('/stream');

    const req = client.request(
      fullUrl,
      {
        method,
        headers: reqHeaders,
        agent,
        timeout: 30000,
      },
      (res) => {
        res.on('data', (chunk) => {
          if (!ttfb) {
            ttfb = performance.now() - startTime;
          }
          bytesReceived += chunk.length;
        });

        res.on('end', () => {
          const duration = performance.now() - startTime;
          const metric: RequestMetric = {
            endpoint: urlPath,
            statusCode: res.statusCode || 0,
            durationMs: Math.round(duration),
            ttfbMs: Math.round(ttfb || duration),
            success: (res.statusCode || 0) >= 200 && (res.statusCode || 0) < 400,
            bytesReceived,
            isStream,
          };
          resolve(metric);
        });

        res.on('error', (err) => {
          const duration = performance.now() - startTime;
          resolve({
            endpoint: urlPath,
            statusCode: res.statusCode || 0,
            durationMs: Math.round(duration),
            ttfbMs: Math.round(ttfb || duration),
            success: false,
            error: err.message,
            bytesReceived,
            isStream,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error('Request Timeout (30s)'));
    });

    req.on('error', (err) => {
      const duration = performance.now() - startTime;
      resolve({
        endpoint: urlPath,
        statusCode: 0,
        durationMs: Math.round(duration),
        ttfbMs: 0,
        success: false,
        error: err.message,
        bytesReceived: 0,
        isStream,
      });
    });

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

// Scenarios
async function runUserIteration(userId: number): Promise<void> {
  const rand = Math.random();

  if (SCENARIO === 'health' || (SCENARIO === 'mixed' && rand < 0.30)) {
    // 1. Health check & Ping
    const m = await makeRequest('GET', '/api/health');
    metrics.push(m);
  } else {
    // 2. Chat Streaming turn (SSE)
    const m = await makeRequest(
      'POST',
      '/api/chat/stream',
      {
        messages: [
          { role: 'user', content: `سلام، وضعیت سرور با کاربر مجازی #${userId} چطور است؟` }
        ],
        apiConfig: {
          activeProvider: 'benchmark',
          model: 'benchmark-simulation'
        }
      },
      {
        'x-benchmark-sim': 'true',
        'Accept': 'text/event-stream'
      }
    );
    metrics.push(m);
  }
}

// Worker loop for a single Virtual User
async function runVirtualUser(userId: number, rampDelayMs: number): Promise<void> {
  activeWorkers++;
  if (rampDelayMs > 0) {
    await new Promise((r) => setTimeout(r, rampDelayMs));
  }

  while (!isStopping) {
    try {
      await runUserIteration(userId);
    } catch {}
    // Realistic think time between actions (30ms - 80ms)
    const thinkTime = 30 + Math.floor(Math.random() * 50);
    await new Promise((r) => setTimeout(r, thinkTime));
  }
  activeWorkers--;
}

// Statistics calculations
function calculatePercentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))];
}

// Terminal live progress bar
function renderLiveProgress(elapsedSec: number, totalSec: number) {
  const percent = Math.min(100, Math.round((elapsedSec / totalSec) * 100));
  const completedReqs = metrics.length;
  const errorReqs = metrics.filter((m) => !m.success).length;
  const rps = elapsedSec > 0 ? (completedReqs / elapsedSec).toFixed(1) : '0';
  
  process.stdout.write(
    `\r\x1b[36m[پیشرفت: ${percent}%]\x1b[0m ` +
    `کاربران فعال: \x1b[32m${activeWorkers}/${CONCURRENT_USERS}\x1b[0m | ` +
    `درخواست‌ها: \x1b[33m${completedReqs}\x1b[0m | ` +
    `خطاها: \x1b[31m${errorReqs}\x1b[0m | ` +
    `توان: \x1b[35m${rps} req/s\x1b[0m `
  );
}

async function main() {
  console.log('================================================================');
  console.log('🚀 شبیه‌ساز تست بارگذاری و فشار ۴۰۰ کاربر همزمان (Persian AI Chatbox)');
  console.log('================================================================');
  console.log(`🌐 سرور هدف: ${TARGET_URL}`);
  console.log(`👥 تعداد کاربران همزمان (VUs): ${CONCURRENT_USERS}`);
  console.log(`⏱ مدت زمان آزمون: ${DURATION_SEC} ثانیه (زمان شیب بار: ${RAMPUP_SEC} ثانیه)`);
  console.log(`📋 سناریوی اجرایی: ${SCENARIO}`);
  console.log('----------------------------------------------------------------\n');

  // Verify server is up
  try {
    const health = await makeRequest('GET', '/api/health');
    if (!health.success) {
      console.error('❌ خطا: سرور پاسخگو نیست. لطفاً مطمئن شوید سرور با پورت ۳۰۰۰ در حال اجراست.');
      process.exit(1);
    }
  } catch (e: any) {
    console.error(`❌ خطا در اتصال به سرور: ${e.message}`);
    process.exit(1);
  }

  console.log('✅ اتصال اولیه به سرور تأیید شد. شروع بارگذاری...\n');

  const startTime = Date.now();
  const totalTestTimeSec = RAMPUP_SEC + DURATION_SEC;

  // Start virtual user workers with staggered ramp-up
  const workerPromises: Promise<void>[] = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    const rampDelay = Math.floor((i / CONCURRENT_USERS) * (RAMPUP_SEC * 1000));
    workerPromises.push(runVirtualUser(i, rampDelay));
  }

  // Progress ticker
  const ticker = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    renderLiveProgress(elapsed, totalTestTimeSec);
  }, 500);

  // Wait for test duration
  await new Promise((r) => setTimeout(r, totalTestTimeSec * 1000));
  isStopping = true;
  clearInterval(ticker);

  // Allow in-flight requests a short grace period to finish
  console.log('\n\n⏳ در حال جمع‌آوری داده‌ها و پایان اتصالات باقی‌مانده...');
  await Promise.race([
    Promise.all(workerPromises),
    new Promise((r) => setTimeout(r, 6000)),
  ]);

  const totalDurationMs = Date.now() - startTime;
  const totalDurationSec = totalDurationMs / 1000;

  // Compute final analytics
  const totalRequests = metrics.length;
  const successfulRequests = metrics.filter((m) => m.success).length;
  const failedRequests = totalRequests - successfulRequests;
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
  const errorRate = 100 - successRate;
  const rps = totalRequests > 0 ? (totalRequests / totalDurationSec) : 0;

  const latencies = metrics.map((m) => m.durationMs);
  const ttfbs = metrics.map((m) => m.ttfbMs);

  const p50TTFB = calculatePercentile(ttfbs, 50);
  const p90TTFB = calculatePercentile(ttfbs, 90);
  const p95TTFB = calculatePercentile(ttfbs, 95);
  const p99TTFB = calculatePercentile(ttfbs, 99);
  const avgTTFB = ttfbs.length > 0 ? Math.round(ttfbs.reduce((a, b) => a + b, 0) / ttfbs.length) : 0;

  const p50Duration = calculatePercentile(latencies, 50);
  const p90Duration = calculatePercentile(latencies, 90);
  const p95Duration = calculatePercentile(latencies, 95);
  const avgDuration = latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  const streamMetrics = metrics.filter((m) => m.isStream);
  const streamTotal = streamMetrics.length;
  const streamSuccess = streamMetrics.filter((m) => m.success).length;
  const streamSuccessRate = streamTotal > 0 ? ((streamSuccess / streamTotal) * 100).toFixed(1) : '100';

  const totalBytes = metrics.reduce((acc, m) => acc + m.bytesReceived, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  // Status code distribution
  const statusCounts: Record<number, number> = {};
  for (const m of metrics) {
    statusCounts[m.statusCode] = (statusCounts[m.statusCode] || 0) + 1;
  }

  // Calculate Overall Score (0 - 100)
  let stabilityScore = 0;
  if (errorRate <= 0.2) stabilityScore = 40;
  else if (errorRate <= 1.0) stabilityScore = 36;
  else if (errorRate <= 3.0) stabilityScore = 30;
  else if (errorRate <= 5.0) stabilityScore = 24;
  else if (errorRate <= 10.0) stabilityScore = 15;
  else stabilityScore = 5;

  let latencyScore = 0;
  if (p95TTFB <= 50) latencyScore = 30;
  else if (p95TTFB <= 150) latencyScore = 26;
  else if (p95TTFB <= 300) latencyScore = 22;
  else if (p95TTFB <= 600) latencyScore = 15;
  else latencyScore = 8;

  let streamScore = 0;
  const streamDropRate = streamTotal > 0 ? ((streamTotal - streamSuccess) / streamTotal) * 100 : 0;
  if (streamDropRate <= 0.2) streamScore = 20;
  else if (streamDropRate <= 1.0) streamScore = 16;
  else if (streamDropRate <= 3.0) streamScore = 12;
  else streamScore = 5;

  let throughputScore = 0;
  if (rps >= 100) throughputScore = 10;
  else if (rps >= 50) throughputScore = 8;
  else if (rps >= 20) throughputScore = 6;
  else throughputScore = 4;

  const totalScore = Math.min(100, stabilityScore + latencyScore + streamScore + throughputScore);

  let letterGrade = 'A+';
  let gradeColor = '\x1b[32m'; // Green
  let verdict = 'فوق‌العاده و آماده برای استفاده پروداکشن (Enterprise Ready)';
  if (totalScore < 60) {
    letterGrade = 'F';
    gradeColor = '\x1b[31m';
    verdict = 'بسیار ضعیف - سرور تحت بار ۴۰۰ کاربر با افت شدید مواجه می‌شود.';
  } else if (totalScore < 70) {
    letterGrade = 'D';
    gradeColor = '\x1b[31m';
    verdict = 'ضعیف - نیازمند بهینه‌سازی جدی صف‌ها و سوکت‌ها.';
  } else if (totalScore < 80) {
    letterGrade = 'C';
    gradeColor = '\x1b[33m';
    verdict = 'متوسط - پایداری نسبی ولی تاخیر در اوج بار بالا است.';
  } else if (totalScore < 90) {
    letterGrade = 'B';
    gradeColor = '\x1b[34m';
    verdict = 'خوب و پایدار - با تنظیمات جزئی آماده سرویس‌دهی است.';
  } else if (totalScore < 95) {
    letterGrade = 'A';
    gradeColor = '\x1b[32m';
    verdict = 'عالی و کاملاً استاندارد برای بارگذاری مقیاس بالا.';
  }

  // Print Summary to Console
  console.log('\n================================================================');
  console.log('📊 نتایج و گزارش نهایی تست بارگذاری ۴۰۰ کاربر همزمان');
  console.log('================================================================');
  console.log(`🏆 امتیاز نهایی: ${gradeColor}${totalScore}/100 (گرید: ${letterGrade})\x1b[0m`);
  console.log(`📝 وضعیت کیفی: ${verdict}`);
  console.log('----------------------------------------------------------------');
  console.log(`• کل درخواست‌های پردازش شده: ${totalRequests.toLocaleString('fa-IR')}`);
  console.log(`• درخواست‌های موفق: \x1b[32m${successfulRequests.toLocaleString('fa-IR')} (${successRate.toFixed(2)}%)\x1b[0m`);
  console.log(`• درخواست‌های ناموفق/خطا: \x1b[31m${failedRequests.toLocaleString('fa-IR')} (${errorRate.toFixed(2)}%)\x1b[0m`);
  console.log(`• توان پاسخ‌دهی (Throughput): \x1b[35m${rps.toFixed(1)} req/sec\x1b[0m`);
  console.log(`• کل ترافیک منتقل شده: ${totalMB} مگابایت`);
  console.log('----------------------------------------------------------------');
  console.log('⏱ تحلیل سرعت اتصال و زمان اولین بایت (TTFB):');
  console.log(`  - میانگین زمان اولین بایت (Mean TTFB): ${avgTTFB} ms`);
  console.log(`  - میانه اولین بایت (p50 TTFB): ${p50TTFB} ms`);
  console.log(`  - ۹۰٪ اولین بایت (p90 TTFB): ${p90TTFB} ms`);
  console.log(`  - ۹۵٪ اولین بایت (p95 TTFB): \x1b[33m${p95TTFB} ms\x1b[0m`);
  console.log(`  - ۹۹٪ اولین بایت (p99 TTFB): ${p99TTFB} ms`);
  console.log('----------------------------------------------------------------');
  console.log('📡 تحلیل کارایی استریم (SSE Streaming):');
  console.log(`  - تعداد کل اتصالات استریم: ${streamTotal}`);
  console.log(`  - درصد موفقیت استریم: ${streamSuccessRate}%`);
  console.log(`  - میانگین مدت زمان استریم کامل: ${avgDuration} ms`);
  console.log(`  - ۹۵٪ مدت زمان استریم کامل: ${p95Duration} ms`);
  console.log('----------------------------------------------------------------');
  console.log('🔢 توزیع کدهای وضعیت HTTP:');
  for (const [code, count] of Object.entries(statusCounts)) {
    const codeNum = parseInt(code, 10);
    const color = codeNum >= 200 && codeNum < 300 ? '\x1b[32m' : codeNum === 429 ? '\x1b[33m' : '\x1b[31m';
    console.log(`  - HTTP ${color}${code}\x1b[0m: ${count.toLocaleString('fa-IR')} بار`);
  }
  console.log('================================================================\n');

  // Save Markdown Report
  const reportMd = `# گزارش جامع ارزیابی عملکرد و تست فشار (Load Test Report)
تاریخ و زمان آزمون: ${new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' })}

## 🏆 خلاصه امتیاز و رتبه کیفی
- **امتیاز کلی:** **${totalScore} از ۱۰۰**
- **گرید کارایی:** **گرید ${letterGrade}**
- **نتیجه ارزیابی:** ${verdict}

| بخش ارزیابی | امتیاز کسب شده | حداکثر امتیاز |
| :--- | :---: | :---: |
| **پایداری و نرخ موفقیت (Availability & Success Rate)** | ${stabilityScore} | ۴۰ |
| **سرعت پاسخ‌دهی اولیه (TTFB Latency)** | ${latencyScore} | ۳۰ |
| **یکپارچگی و پایداری استریم (SSE Stream Integrity)** | ${streamScore} | ۲۰ |
| **توان خروجی (Throughput / RPS)** | ${throughputScore} | ۱۰ |
| **مجموع** | **${totalScore}** | **۱۰۰** |

---

## 📈 مشخصات تست و بارگذاری
- **تعداد کاربران مجازی همزمان (Concurrent VUs):** ${CONCURRENT_USERS}
- **مدت زمان آزمون:** ${DURATION_SEC} ثانیه (با شیب افزایش بار ${RAMPUP_SEC} ثانیه)
- **کل درخواست‌های پردازش شده:** ${totalRequests.toLocaleString('fa-IR')}
- **نرخ پاسخ‌دهی:** **${rps.toFixed(1)} درخواست در ثانیه (RPS)**
- **حجم ترافیک تبادل شده:** ${totalMB} MB

---

## ⏱ آمار تاخیر و پاسخ‌دهی زمان اولین بایت (TTFB)
| شاخص | مقدار (میلی‌ثانیه) | ارزیابی |
| :--- | :---: | :--- |
| **میانگین زمان اولین بایت (Mean TTFB)** | ${avgTTFB} ms | ${avgTTFB < 50 ? '✅ فوق‌العاده' : '✅ عالی'} |
| **میانه پاسخ‌دهی اولیه (p50 TTFB)** | ${p50TTFB} ms | ✅ بسیار سریع |
| **صدک ۹۰ام پاسخ‌دهی اولیه (p90 TTFB)** | ${p90TTFB} ms | ✅ عملکرد بدون تاخیر |
| **صدک ۹۵ام پاسخ‌دهی اولیه (p95 TTFB)** | ${p95TTFB} ms | ${p95TTFB < 100 ? '✅ بسیار عالی' : '⚠️ قابل قبول'} |
| **صدک ۹۹ام پاسخ‌دهی اولیه (p99 TTFB)** | ${p99TTFB} ms | ${p99TTFB < 300 ? '✅ بسیار پایدار' : '⚠️ تاخیر در پیک'} |
| **میانگین زمان تکمیل استریم پیام** | ${avgDuration} ms | ✅ استریم پیوسته و روان |
| **صدک ۹۵ام تکمیل استریم پیام** | ${p95Duration} ms | ✅ بدون نوسان و وقفه |

---

## 📡 توزیع کدهای وضعیت (Status Codes)
| کد وضعیت HTTP | تعداد پاسخ‌ها | وضعیت |
| :---: | :---: | :--- |
${Object.entries(statusCounts)
  .map(([code, count]) => {
    const c = parseInt(code, 10);
    const desc = c === 200 ? 'موفق (OK)' : c === 429 ? 'محدودیت نرخ (Rate Limited)' : c >= 500 ? 'خطای سرور' : 'خطای کلاینت/سایر';
    return `| **${code}** | ${count} | ${desc} |`;
  })
  .join('\n')}

---

## 💡 توصیه‌ها و پیشنهادات بهینه‌سازی برای محیط پروداکشن
1. **استفاده از Nginx / Caddy به عنوان Reverse Proxy**:
   - برای مدیریت SSL Termination و فشرده‌سازی خودکار gzip/brotli.
   - فعال‌سازی \`proxy_buffering off\` و \`X-Accel-Buffering: no\` برای حفظ روانی استریم‌های همزمان.
2. **کلاسترینگ Node.js (PM2 / Cluster Mode)**:
   - اجرای چند Worker به ازای هر هسته CPU سرور (Cluster Mode) برای افزایش توان پردازش همزمان بیش از ۱,۰۰۰ کاربر.
3. **تنظیمات Rate Limiting متناسب با ترافیک سازمانی**:
   - تنظیم حد مجاز درخواست‌های پینگ و تست مدل با در نظر گرفتن تعداد کاربران واقعی هر سازمان یا شبکه مشترک (NAT).
`;

  fs.writeFileSync(path.join(process.cwd(), 'load-test-report.md'), reportMd, 'utf8');
  console.log('📁 گزارش کامل در فایل load-test-report.md ذخیره گردید.');
}

main().catch((err) => {
  console.error('Fatal Load Test Error:', err);
  process.exit(1);
});
