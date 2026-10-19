import db from '../db/database';

export interface BazaarPayConfig {
  destination: string;
  token: string;
  enabled: boolean;
}

export interface BazaarPayInitOptions {
  amountToman: number;
  serviceName: string;
  phone?: string;
  redirectUrl: string;
}

export interface BazaarPayInitResult {
  success: boolean;
  checkoutToken?: string;
  paymentUrl?: string;
  error?: string;
}

export type BazaarPayPaymentStatus =
  | 'invalid_token'
  | 'unpaid'
  | 'paid_not_committed'
  | 'paid_not_committed_refunded'
  | 'paid_committed'
  | 'refunded'
  | 'timed_out'
  | 'unknown';

export interface BazaarPayTraceResult {
  success: boolean;
  status: BazaarPayPaymentStatus;
  error?: string;
}

export interface BazaarPayCommitResult {
  success: boolean;
  error?: string;
}

const BAZAARPAY_API_BASE = 'https://api.bazaar-pay.ir/badje/v1';

/**
 * Get current BazaarPay configuration from site_settings or environment variables
 */
export function getBazaarPayConfig(): BazaarPayConfig {
  let destination = (process.env.BAZAARPAY_DESTINATION || '').trim();
  let token = (process.env.BAZAARPAY_TOKEN || '').trim();
  let enabled = process.env.BAZAARPAY_ENABLED === 'true';

  try {
    const destRow = db.prepare("SELECT value FROM site_settings WHERE key = 'bazaarpay_destination'").get() as any;
    if (destRow && destRow.value && destRow.value.trim()) {
      destination = destRow.value.trim();
    }

    const tokenRow = db.prepare("SELECT value FROM site_settings WHERE key = 'bazaarpay_token'").get() as any;
    if (tokenRow && tokenRow.value && tokenRow.value.trim()) {
      token = tokenRow.value.trim();
    }

    const enabledRow = db.prepare("SELECT value FROM site_settings WHERE key = 'bazaarpay_enabled'").get() as any;
    if (enabledRow && enabledRow.value) {
      enabled = enabledRow.value === 'true' || enabledRow.value === '1';
    }
  } catch (err) {
    console.error('[BazaarPay] Error reading config from site_settings:', err);
  }

  // If destination is configured, it's considered usable
  const isConfigured = Boolean(destination && destination.length > 0);

  return { destination, token, enabled: enabled && isConfigured };
}

/**
 * Helper to build auth headers
 */
function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Fa-Chatbox/1.0.0 (Node.js)'
  };
  if (token && token.trim()) {
    headers['Authorization'] = `Token ${token.trim()}`;
  }
  return headers;
}

/**
 * Parse friendly Persian message from BazaarPay API error
 */
function parseErrorMessage(json: any, status: number): string {
  if (json?.detail) {
    return String(json.detail);
  }
  if (json?.non_field_errors && Array.isArray(json.non_field_errors)) {
    return json.non_field_errors.join('، ');
  }
  if (typeof json === 'object') {
    for (const key of Object.keys(json)) {
      if (Array.isArray(json[key])) {
        return `${key}: ${json[key].join('، ')}`;
      }
    }
  }
  if (status === 401 || status === 403) {
    return 'خطای احراز هویت درگاه بازارپی (توکن یا دسترسی نامعتبر است).';
  }
  if (status === 400) {
    return 'اطلاعات ارسالی به درگاه بازارپی نامعتبر است.';
  }
  return `خطا در برقراری ارتباط با بازارپی (کد خطا: ${status}).`;
}

/**
 * Initialize a checkout token and construct payment URL
 * Official Endpoint: POST /checkout/init/
 */
export async function initBazaarCheckout(options: BazaarPayInitOptions): Promise<BazaarPayInitResult> {
  const config = getBazaarPayConfig();

  if (!config.destination) {
    return {
      success: false,
      error: 'شناسه پذیرنده بازارپی (Destination) تنظیم نشده است.'
    };
  }

  // Convert Toman to Rials (1 Toman = 10 Rials)
  const amountRials = Math.round(options.amountToman) * 10;

  try {
    const payload = {
      amount: amountRials,
      destination: config.destination,
      service_name: options.serviceName || 'شارژ کیف پول چت‌باکس'
    };

    const res = await fetch(`${BAZAARPAY_API_BASE}/checkout/init/`, {
      method: 'POST',
      headers: getHeaders(config.token),
      body: JSON.stringify(payload)
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = parseErrorMessage(json, res.status);
      console.warn('[BazaarPay] Init checkout error:', res.status, json);
      return { success: false, error: errorMsg };
    }

    if (!json.checkout_token) {
      return {
        success: false,
        error: 'توکن پرداخت از سمت بازارپی دریافت نشد.'
      };
    }

    // Build the full redirect URL with query params
    const checkoutToken = json.checkout_token;
    const paymentBase = json.payment_url || `https://app.bazaar-pay.ir/payment?token=${checkoutToken}`;
    
    // Add redirect_url and phone query parameters according to official docs
    const urlObj = new URL(paymentBase);
    urlObj.searchParams.set('token', checkoutToken);
    if (options.redirectUrl) {
      urlObj.searchParams.set('redirect_url', options.redirectUrl);
    }
    if (options.phone) {
      urlObj.searchParams.set('phone', options.phone);
    }

    return {
      success: true,
      checkoutToken,
      paymentUrl: urlObj.toString()
    };

  } catch (err: any) {
    console.error('[BazaarPay] Exception during init checkout:', err);
    return {
      success: false,
      error: 'خطا در ارتباط با سرورهای بازارپی: ' + (err.message || 'شبکه در دسترس نیست')
    };
  }
}

/**
 * Trace payment status
 * Official Endpoint: POST /trace/
 */
export async function traceBazaarPayment(checkoutToken: string): Promise<BazaarPayTraceResult> {
  if (!checkoutToken) {
    return { success: false, status: 'invalid_token', error: 'توکن پرداخت ارائه نشده است.' };
  }

  const config = getBazaarPayConfig();

  try {
    const res = await fetch(`${BAZAARPAY_API_BASE}/trace/`, {
      method: 'POST',
      headers: getHeaders(config.token),
      body: JSON.stringify({ checkout_token: checkoutToken })
    });

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = parseErrorMessage(json, res.status);
      return { success: false, status: 'unknown', error: errorMsg };
    }

    const status: BazaarPayPaymentStatus = json.status || 'unknown';
    return {
      success: true,
      status
    };

  } catch (err: any) {
    console.error('[BazaarPay] Exception during trace:', err);
    return {
      success: false,
      status: 'unknown',
      error: 'خطا در استعلام وضعیت پرداخت بازارپی: ' + (err.message || '')
    };
  }
}

/**
 * Commit payment (Two-Phase Commit finalization)
 * Official Endpoint: POST /commit/
 * Must be called within 10 minutes of payment or amount is refunded!
 */
export async function commitBazaarPayment(checkoutToken: string): Promise<BazaarPayCommitResult> {
  if (!checkoutToken) {
    return { success: false, error: 'توکن پرداخت ارائه نشده است.' };
  }

  const config = getBazaarPayConfig();

  try {
    const res = await fetch(`${BAZAARPAY_API_BASE}/commit/`, {
      method: 'POST',
      headers: getHeaders(config.token),
      body: JSON.stringify({ checkout_token: checkoutToken })
    });

    // 204 No Content is the expected success response from BazaarPay
    if (res.status === 204 || res.ok) {
      return { success: true };
    }

    const json = await res.json().catch(() => ({}));
    const errorMsg = parseErrorMessage(json, res.status);
    console.warn('[BazaarPay] Commit error:', res.status, json);
    return { success: false, error: errorMsg };

  } catch (err: any) {
    console.error('[BazaarPay] Exception during commit:', err);
    return {
      success: false,
      error: 'خطا در ثبت نهایی تراکنش بازارپی: ' + (err.message || '')
    };
  }
}

/**
 * Refund a payment (full or partial)
 * Official Endpoint: POST /refund/
 */
export async function refundBazaarPayment(checkoutToken: string, amountToman?: number): Promise<{ success: boolean; error?: string }> {
  const config = getBazaarPayConfig();

  try {
    const payload: any = { checkout_token: checkoutToken };
    if (amountToman && amountToman > 0) {
      payload.amount = Math.round(amountToman) * 10;
    }

    const res = await fetch(`${BAZAARPAY_API_BASE}/refund/`, {
      method: 'POST',
      headers: getHeaders(config.token),
      body: JSON.stringify(payload)
    });

    if (res.status === 204 || res.ok) {
      return { success: true };
    }

    const json = await res.json().catch(() => ({}));
    return { success: false, error: parseErrorMessage(json, res.status) };

  } catch (err: any) {
    return { success: false, error: err.message || 'خطا در استرداد تراکنش' };
  }
}

/**
 * Test connectivity and credentials with BazaarPay
 */
export async function testBazaarPayMerchant(
  customDestination?: string,
  customToken?: string
): Promise<{ valid: boolean; message: string }> {
  const config = getBazaarPayConfig();
  const destination = (customDestination || config.destination || '').trim();
  const token = (customToken !== undefined ? customToken : config.token || '').trim();

  if (!destination) {
    return {
      valid: false,
      message: 'شناسه پذیرنده بازارپی (Destination) وارد نشده است.'
    };
  }

  try {
    // Attempt an init request with minimal amount (10,000 Rials = 1,000 Tomans)
    const testPayload = {
      amount: 10000,
      destination,
      service_name: 'تست اتصال چت‌باکس هوشمند'
    };

    const res = await fetch(`${BAZAARPAY_API_BASE}/checkout/init/`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(testPayload)
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json.checkout_token) {
      return {
        valid: true,
        message: 'اتصال به بازارپی با موفقیت برقرار شد و شناسه مرچنت کاملاً معتبر و فعال است.'
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        valid: false,
        message: 'خطای احراز هویت بازارپی: توکن اهراز هویت نامعتبر است یا هنوز دسترسی برای این مرچنت فعال نشده است.'
      };
    }

    const errorMsg = parseErrorMessage(json, res.status);
    return {
      valid: false,
      message: `پاسخ سرور بازارپی (${res.status}): ${errorMsg}`
    };

  } catch (err: any) {
    return {
      valid: false,
      message: 'خطا در برقراری ارتباط اینترنتی با سرورهای بازارپی: ' + (err.message || '')
    };
  }
}
