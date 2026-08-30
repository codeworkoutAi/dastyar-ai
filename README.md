# Persian AI Chatbox 🚀

A highly polished, full-stack AI chat interface designed specifically for Persian-speaking users. It acts as a bridge to various AI models (like Gemini, OpenRouter, Custom Providers) providing real-time streaming, voice interactions, and deep file/image analysis within a strictly RTL, Persian-localized UI.

<div dir="rtl">

## 🌟 ویژگی‌های کلیدی (Key Features)

- **رابط کاربری بومی و فارسی (Persian-First UI):** طراحی کاملاً راست‌چین (RTL) با استفاده از تایپوگرافی اصیل ایرانی (فونت‌های `Vazirmatn` و `Mikhak`). تبدیل خودکار اعداد انگلیسی به فارسی برای تجربه خوانش بهتر.
- **معماری BYOK (Bring Your Own Key):** کاربران می‌توانند کلید API شخصی خود (Gemini, OpenRouter, Custom) را وارد کرده و بدون محدودیت از پلتفرم استفاده کنند.
- **تشخیص هوشمند نیت کاربر (Hybrid Intent Routing):** سیستمی ترکیبی از الگوریتم‌های قطعی و هوش مصنوعی که می‌فهمد کاربر چه زمانی نیاز به جستجو در وب، تولید تصویر یا نوشتن کد دارد.
- **وب‌گردی زنده (Live Web Search):** دریافت و استخراج لحظه‌ای اخبار، قیمت‌ها و مقالات از موتورهای جستجو و ترکیب آن با دانش مدل زبانی.
- **پشتیبانی کامل از فایل‌ها (Multimodal):** امکان آپلود تصاویر (تغییر سایز هوشمند برای جلوگیری از پر شدن حجم مرورگر)، فایل‌های PDF، اسناد متنی، کدها و داده‌های JSON/CSV.
- **پشتیبانی آفلاین و نصب (PWA):** امکان نصب روی دسکتاپ و موبایل با کشینگ هوشمند و سازگاری بالا.
- **تبدیل گفتار به متن و برعکس (Voice & TTS):** تعامل صوتی کاملاً بهینه شده برای زبان فارسی (fa-IR).

---

## 🧠 معماری مسیریابی هوشمند (Hybrid Intent Routing)

یکی از جذاب‌ترین بخش‌های معماری این پروژه، سیستم **Hybrid Router** است. مدل‌های زبانی رایگان (Free-Tier) در محیط واقعی (Production) ممکن است دستورات توسعه‌دهنده (مانند فرمت‌بندی JSON) را نادیده بگیرند؛ پدیده‌ای که به آن **توهم کنترل (Illusion of Control)** می‌گویند.

ما برای غلبه بر این توهم، سیستم **برنامه‌نویسی تدافعی (Defensive Programming)** را پیاده‌سازی کردیم:
1. **لایه Heuristics (قطعی):** ابتدا کلمات کلیدی حساس (مثل اخبار، قیمت، هواشناسی) بررسی می‌شوند تا بدون درگیر کردن هوش مصنوعی، وب‌سرچ فعال شود.
2. **لایه LLM Router (تحلیلی):** در صورت عدم وجود کلمات قطعی، یک کانتکست فشرده به مدل زبانی ارسال می‌شود تا نیت کاربر (Vision, Coding, Web Search) مشخص شود.
3. **گارد محافظ (Fallback Guard):** حتی اگر مدل‌های رایگان، ساختار JSON را متلاشی کنند، سیستم Crash نمی‌کند و تصمیم‌گیری به صورت امن هندل می‌شود.

برای مطالعه جزئیات فنی و دیاگرام‌های جریان داده (Mermaid)، **[مقاله کامل گزارش فنی معماری را در اینجا بخوانید](docs/hybrid-intent-routing.md)**.

---

## 🛠 تکنولوژی‌های استفاده شده (Tech Stack)

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Zustand, Lucide React.
- **Backend:** Express (Node.js) acting as an API proxy & streaming server.
- **Build System:** Vite & esbuild (bundling Express into `server.cjs`).
- **AI Integrations:** Google Gemini SDK, OpenRouter API, Custom LLM endpoints.

---

## 🚀 نحوه نصب و راه‌اندازی (Installation)

1. مخزن را کلون کنید:
   ```bash
   git clone https://github.com/lifeencoder/Fa-Chatbox.git
   cd Fa-Chatbox
   ```

2. پکیج‌ها را نصب کنید:
   ```bash
   npm install
   ```

3. سرور توسعه را اجرا کنید:
   ```bash
   npm run dev
   ```
   برنامه روی آدرس `http://localhost:3000` در دسترس خواهد بود.

4. برای بیلد نهایی و محیط پروداکشن:
   ```bash
   npm run build
   npm start
   ```

---

## 📂 ساختار فایل‌ها (File Structure)

- `src/` : کدهای فرانت‌اند (React)
  - `components/` : کامپوننت‌های رابط کاربری
  - `store/` : مدیریت State با Zustand (مانند `chatStore.ts`)
  - `lib/` : توابع کمکی، بهینه‌سازی توکن‌ها و لوکال استوریج
- `server/` : کدهای بک‌اند (Express)
  - `routes/` : API های استریم چت و تشخیص نیت (`intent.ts`)
  - `services/` : سرویس‌های جستجوی وب (SmartWebAgent)
- `docs/` : مستندات و مقالات فنی پروژه
- `AGENTS.md` : راهنما و قوانین مخصوص توسعه‌دهندگان هوش مصنوعی (AI Agents)

---

## 📜 لایسنس
این پروژه به صورت اوپن‌سورس و با هدف گسترش دسترسی کاربران ایرانی به ابزارهای مدرن هوش مصنوعی توسعه یافته است.

</div>
