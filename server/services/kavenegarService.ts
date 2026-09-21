/**
 * Kavenegar SMS & OTP Service
 * Handles SMS delivery and OTP lookup verification through Kavenegar REST API.
 */

import db from '../db/database';

const KAVENEGAR_API_KEY = (process.env.KAVENEGAR_API_KEY || '').trim();
const KAVENEGAR_SENDER = (process.env.KAVENEGAR_SENDER || '10004347').trim();

/**
 * Normalizes Persian/Arabic digits to standard ASCII English digits
 * and cleans up formatting (spaces, +98, 0098).
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  
  // Convert Persian and Arabic digits to English
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  
  let cleaned = rawPhone.toString().trim();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replaceAll(persianDigits[i], i.toString());
    cleaned = cleaned.replaceAll(arabicDigits[i], i.toString());
  }
  
  // Remove non-digit characters except leading +
  cleaned = cleaned.replace(/[^\d+]/g, '');
  
  // Normalize Iranian prefixes: +989... -> 09..., 00989... -> 09..., 989... -> 09...
  if (cleaned.startsWith('+98')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
    cleaned = '0' + cleaned;
  }
  
  return cleaned;
}

/**
 * Checks whether a phone number matches the valid Iranian mobile format: 09xxxxxxxxx
 */
export function isValidIranianMobile(phone: string): boolean {
  return /^09\d{9}$/.test(phone);
}

/**
 * Sends an OTP verification token using Kavenegar's lookup verify endpoint.
 * Bypasses SMS blacklist and delivers in seconds.
 * 
 * Template: "verify" (%token کد ورود به دستیار هوشمند)
 */
export async function sendOtpSms(phone: string, token: string): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const normalized = normalizePhoneNumber(phone);
  if (!isValidIranianMobile(normalized)) {
    return { success: false, error: 'شماره موبایل نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹' };
  }

  if (!KAVENEGAR_API_KEY) {
    console.warn('[Kavenegar] KAVENEGAR_API_KEY is not configured in .env. Mocking OTP send.');
    console.log(`[Kavenegar MOCK] OTP for ${normalized}: ${token}`);
    return { success: true, messageId: 999999 };
  }

  try {
    const template = process.env.KAVENEGAR_OTP_TEMPLATE || 'verify';
    const url = new URL(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/verify/lookup.json`);
    url.searchParams.set('receptor', normalized);
    url.searchParams.set('token', token);
    url.searchParams.set('template', template);

    console.log(`[Kavenegar] Sending OTP to ${normalized} via template: ${template}`);
    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json() as any;

    if (data.return?.status === 200 && Array.isArray(data.entries) && data.entries.length > 0) {
      console.log(`[Kavenegar] OTP sent successfully. Message ID: ${data.entries[0].messageid}`);
      return { success: true, messageId: data.entries[0].messageid };
    }

    const errMsg = data.return?.message || 'خطا در ارسال پیامک از طریق کاوه‌نگار';
    console.error('[Kavenegar] Verification lookup failed:', data.return);
    return { success: false, error: errMsg };
  } catch (err: any) {
    console.error('[Kavenegar] Network error in sendOtpSms:', err.message);
    return { success: false, error: 'خطای ارتباط با سرور پیامک' };
  }
}

/**
 * Sends a general SMS via Kavenegar's dedicated line.
 */
export async function sendGeneralSms(receptor: string, message: string): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const normalized = normalizePhoneNumber(receptor);
  if (!isValidIranianMobile(normalized)) {
    return { success: false, error: 'شماره موبایل نامعتبر است.' };
  }

  if (!KAVENEGAR_API_KEY) {
    console.warn('[Kavenegar] KAVENEGAR_API_KEY is not configured. Mocking SMS send.');
    console.log(`[Kavenegar MOCK SMS to ${normalized}]:\n${message}`);
    return { success: true, messageId: 999999 };
  }

  try {
    const url = new URL(`https://api.kavenegar.com/v1/${KAVENEGAR_API_KEY}/sms/send.json`);
    url.searchParams.set('receptor', normalized);
    url.searchParams.set('sender', KAVENEGAR_SENDER);
    url.searchParams.set('message', message);

    const res = await fetch(url.toString(), { method: 'GET' });
    const data = await res.json() as any;

    if (data.return?.status === 200 && Array.isArray(data.entries) && data.entries.length > 0) {
      return { success: true, messageId: data.entries[0].messageid };
    }

    console.error('[Kavenegar] General SMS failed:', data.return);
    return { success: false, error: data.return?.message || 'خطا در ارسال پیامک' };
  } catch (err: any) {
    console.error('[Kavenegar] Network error in sendGeneralSms:', err.message);
    return { success: false, error: 'خطای ارتباط با سرور پیامک' };
  }
}

/**
 * Sends an order confirmation and license delivery SMS to the customer.
 */
export async function sendOrderSuccessSms(params: {
  phone: string;
  orderId: string;
  productTitle: string;
  licenseKey?: string | null;
  isPlan?: boolean;
}): Promise<void> {
  if (!params.phone) return;
  const normalized = normalizePhoneNumber(params.phone);
  if (!isValidIranianMobile(normalized)) return;

  let message = `سفارش شما در دستیار هوشمند با موفقیت تایید شد.\n`;
  message += `شماره سفارش: ${params.orderId}\n`;
  message += `محصول: ${params.productTitle}\n`;

  if (params.isPlan) {
    message += `وضعیت: اعتبار بسته به کیف پول حساب شما اضافه شد.\n`;
  } else if (params.licenseKey) {
    message += `کد لایسنس: ${params.licenseKey}\n`;
  }

  message += `ورود و پشتیبانی: fa-chatbox.ir`;

  try {
    await sendGeneralSms(normalized, message);
  } catch (err) {
    console.error('[Kavenegar] Failed to send order success SMS:', err);
  }
}

/**
 * Looks up order details and dispatches a customer confirmation SMS if phone exists.
 */
export async function notifyOrderSuccessBySms(orderId: string, licenseId?: number | bigint | null): Promise<void> {
  try {
    const row = db.prepare(`
      SELECT o.id, o.userId, u.phone, p.title as productTitle, p.category as productCategory, l.key as licenseKey
      FROM orders o
      JOIN users u ON o.userId = u.id
      JOIN products p ON o.productId = p.id
      LEFT JOIN licenses l ON l.id = ?
      WHERE o.id = ?
    `).get(licenseId || null, orderId) as any;

    if (row && row.phone) {
      await sendOrderSuccessSms({
        phone: row.phone,
        orderId: row.id,
        productTitle: row.productTitle,
        licenseKey: row.licenseKey,
        isPlan: row.productCategory === 'plan'
      });
    }
  } catch (err) {
    console.error('[Kavenegar] notifyOrderSuccessBySms error:', err);
  }
}

