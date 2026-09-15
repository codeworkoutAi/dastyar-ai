# گزارش ارتقا و افزودن موتور تصویرسازی AlbedoBase XL (SDXL)

## ۱. افزودن موتور AlbedoBase XL (SDXL)
به درخواست کاربر، موتور قدرتمند و محبوب **AlbedoBase XL (SDXL)** به لیست موتورهای پردازش تصویر استودیو اضافه شد:
- **شناسه مدل:** `albedobase-xl`
- **ویژگی‌ها:** مبتنی بر معماری پیشرفته Stable Diffusion XL، تخصص ویژه در رندرهای فوق واقع‌گرایانه، چهره‌پردازی، بافت طبیعی پوست و نورپردازی سینمایی.
- **دسترسی:** رایگان (Free Tier) و بدون نیاز به API Key اختصاصی، در کنار Flux.1 و Sana انویدیا.
- **بهینه‌سازی پرامپت سرور:** اعمال کلمات کلیدی رندرینگ حرفه‌ای برای افزایش وضوح و بازتولید جزئیات پرتره در `server/services/utils.ts`.

---

## ۲. اصلاحات و تغییرات اعمال‌شده در فایل‌ها
1. **[`server/services/utils.ts`](file:///c:/Users/farha/Fa-Chatbox/server/services/utils.ts):**
   - پشتیبانی از موتور `albedobase-xl` در تابع `getPollinationsImageUrl` با اعمال بهینه‌سازی پرامپت و پارامتر مدل.
2. **[`src/components/ImageGenStudio.tsx`](file:///c:/Users/farha/Fa-Chatbox/src/components/ImageGenStudio.tsx):**
   - اضافه شدن کارت انتخاب موتور `AlbedoBase XL (SDXL)` در سایدبار تنظیمات استودیو با تگ «واقع‌گرایانه SDXL».

---

## ۳. وضعیت بیلد و استقرار
- تست بیلد با دستور `npm run build` با کد `0` و بدون هیچ خطایی تایید گردید.
