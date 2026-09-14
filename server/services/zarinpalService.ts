import db from '../db/database';

export interface ZarinpalConfig {
  merchantId: string;
  sandbox: boolean;
  enabled: boolean;
}

export interface PaymentRequestOptions {
  amountToman: number;
  description: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
}

export interface PaymentRequestResult {
  success: boolean;
  authority?: string;
  paymentUrl?: string;
  fee?: number;
  error?: string;
  isMock?: boolean;
}

export interface PaymentVerifyOptions {
  amountToman: number;
  authority: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  code?: number;
  refId?: string | number;
  cardPan?: string;
  cardHash?: string;
  fee?: number;
  alreadyVerified?: boolean;
  error?: string;
  isMock?: boolean;
}

/**
 * Get current Zarinpal configuration from site_settings or environment variables
 */
export function getZarinpalConfig(): ZarinpalConfig {
  let merchantId = process.env.ZARINPAL_MERCHANT_ID || '';
  let sandbox = process.env.ZARINPAL_SANDBOX === 'true';

  try {
    const merchantRow = db.prepare("SELECT value FROM site_settings WHERE key = 'zarinpal_merchant_id'").get() as any;
    if (merchantRow && merchantRow.value && merchantRow.value.trim()) {
      merchantId = merchantRow.value.trim();
    }

    const sandboxRow = db.prepare("SELECT value FROM site_settings WHERE key = 'zarinpal_sandbox'").get() as any;
    if (sandboxRow && sandboxRow.value) {
      sandbox = sandboxRow.value === 'true' || sandboxRow.value === '1';
    }
  } catch (err) {
    console.error('[ZarinPal] Error reading config from site_settings:', err);
  }

  const enabled = Boolean(merchantId && merchantId.length >= 30);

  return { merchantId, sandbox, enabled };
}

/**
 * Get API endpoints based on sandbox mode
 */
function getEndpoints(sandbox: boolean) {
  if (sandbox) {
    return {
      request: 'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      verify: 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
      startPay: 'https://sandbox.zarinpal.com/pg/StartPay/'
    };
  }
  return {
    request: 'https://api.zarinpal.com/pg/v4/payment/request.json',
    verify: 'https://api.zarinpal.com/pg/v4/payment/verify.json',
    startPay: 'https://www.zarinpal.com/pg/StartPay/'
  };
}

/**
 * Convert Zarinpal error code to Persian user-friendly message
 */
export function getZarinpalErrorMessage(code?: number): string {
  switch (code) {
    case -9:
      return 'خطای اعتبارسنجی داده‌های ارسالی به درگاه پرداخت.';
    case -10:
      return 'آی‌پی سرور در پنل زرین‌پال تأیید نشده است (Terminal IP not valid). لطفاً در پنل زرین‌پال > مدیریت درگاه، آی‌پی سرور را ثبت کنید.';
    case -11:
      return 'مرچنت درگاه در زرین‌پال غیرفعال است.';
    case -12:
      return 'تعداد تلاش‌ها بیش از حد مجاز است. لطفاً کمی بعد تلاش کنید.';
    case -15:
      return 'درگاه پرداخت در حال حاضر با مشکل موقت مواجه است.';
    case -16:
      return 'سطح دسترسی پذیرنده برای این عملیات مجاز نیست.';
    case -30:
      return 'پذیرنده اجازه دسترسی به تسویه اشتراکی شناور را ندارد.';
    case -31:
      return 'حساب بانکی پذیرنده هنوز مسدود یا تأیید نشده است.';
    case -32:
      return 'مبلغ وارد شده با اطلاعات صورتحساب همخوانی ندارد.';
    case -40:
      return 'پارامترهای ارسالی نامعتبر است.';
    case -50:
      return 'مبلغ پرداخت شده با مقدار اعتبارسنجی همخوانی ندارد.';
    case -51:
      return 'پرداخت ناموفق بود یا کاربر از پرداخت در درگاه انصراف داد.';
    case -52:
      return 'خطای غیرمنتظره در سرورهای شاپرک یا زرین‌پال.';
    case -53:
      return 'شناسه پرداخت (Authority) برای این مرچنت معتبر نیست.';
    case -54:
      return 'درخواست منقضی شده است.';
    default:
      return code ? `خطای درگاه زرین‌پال (کد: ${code})` : 'خطا در ارتباط با درگاه پرداخت.';
  }
}

/**
 * Create a new payment request (Authority) via Zarinpal REST API v4
 */
export async function requestZarinpalPayment(options: PaymentRequestOptions): Promise<PaymentRequestResult> {
  const config = getZarinpalConfig();

  if (!config.enabled) {
    return {
      success: false,
      error: 'درگاه پرداخت زرین‌پال فعال نیست یا کد مرچنت تنظیم نشده است.'
    };
  }

  const endpoints = getEndpoints(config.sandbox);

  try {
    const payload: any = {
      merchant_id: config.merchantId,
      amount: Math.round(options.amountToman),
      currency: 'IRT', // Tomans
      description: options.description || 'پرداخت فاکتور چت‌باکس هوشمند',
      callback_url: options.callbackUrl
    };

    if (options.mobile || options.email) {
      payload.metadata = {};
      if (options.mobile) payload.metadata.mobile = options.mobile;
      if (options.email) payload.metadata.email = options.email;
    }

    const response = await fetch(endpoints.request, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok && response.status !== 400) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const json = await response.json();

    if (json.data && json.data.code === 100 && json.data.authority) {
      return {
        success: true,
        authority: json.data.authority,
        paymentUrl: `${endpoints.startPay}${json.data.authority}`,
        fee: json.data.fee
      };
    }

    const errorCode = json.errors?.code || json.data?.code;
    const errorMsg = getZarinpalErrorMessage(errorCode);
    console.warn('[ZarinPal] Payment request error:', json);
    return {
      success: false,
      error: errorMsg
    };

  } catch (err: any) {
    console.error('[ZarinPal] Exception during payment request:', err);
    return {
      success: false,
      error: 'خطا در اتصال به سرور زرین‌پال: ' + (err.message || 'شبکه در دسترس نیست')
    };
  }
}

/**
 * Verify a payment via Zarinpal REST API v4
 */
export async function verifyZarinpalPayment(options: PaymentVerifyOptions): Promise<PaymentVerifyResult> {
  const config = getZarinpalConfig();

  if (!config.enabled) {
    return {
      success: false,
      error: 'درگاه پرداخت زرین‌پال فعال نیست.'
    };
  }

  const endpoints = getEndpoints(config.sandbox);

  try {
    const payload = {
      merchant_id: config.merchantId,
      amount: Math.round(options.amountToman),
      authority: options.authority
    };

    const response = await fetch(endpoints.verify, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const json = await response.json();

    // Code 100: Successful initial verification
    if (json.data && json.data.code === 100) {
      return {
        success: true,
        code: 100,
        refId: json.data.ref_id,
        cardPan: json.data.card_pan,
        cardHash: json.data.card_hash,
        fee: json.data.fee
      };
    }

    // Code 101: Already verified
    if (json.data && json.data.code === 101) {
      return {
        success: true,
        code: 101,
        refId: json.data.ref_id,
        cardPan: json.data.card_pan,
        cardHash: json.data.card_hash,
        fee: json.data.fee,
        alreadyVerified: true
      };
    }

    const errorCode = json.errors?.code || json.data?.code;
    return {
      success: false,
      code: errorCode,
      error: getZarinpalErrorMessage(errorCode)
    };

  } catch (err: any) {
    console.error('[ZarinPal] Exception during verification:', err);
    return {
      success: false,
      error: 'خطا در تأیید تراکنش زرین‌پال: ' + (err.message || '')
    };
  }
}

/**
 * Test merchant connectivity
 */
export async function testZarinpalMerchant(customMerchantId?: string, sandbox = false): Promise<{ valid: boolean; message: string }> {
  const config = getZarinpalConfig();
  const merchantId = (customMerchantId || config.merchantId || '').trim();

  if (!merchantId || merchantId.length < 30) {
    return { valid: false, message: 'کد مرچنت نامعتبر است. کد مرچنت باید ۳۶ کاراکتر باشد.' };
  }

  const endpoints = getEndpoints(sandbox);

  try {
    const testPayload = {
      merchant_id: merchantId,
      amount: 1000,
      currency: 'IRT',
      description: 'تست اتصال درگاه چت‌باکس',
      callback_url: 'https://example.com/test'
    };

    const response = await fetch(endpoints.request, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });

    const json = await response.json();

    if (json.data && json.data.code === 100) {
      return { valid: true, message: 'اتصال به زرین‌پال با موفقیت برقرار شد و مرچنت کاملاً معتبر است.' };
    }

    const errCode = json.errors?.code ?? json.data?.code;
    const rawMsg = json.errors?.message || '';

    if (rawMsg.toLowerCase().includes('terminal ip') || errCode === -10) {
      return {
        valid: false,
        message: 'کد مرچنت در زرین‌پال معتبر است، اما آی‌پی سرور (IP) در تنظیمات درگاه زرین‌پال ثبت نشده است (Terminal IP not valid). لطفاً در پنل زرین‌پال > درگاه‌های پرداخت، آی‌پی سرور خود را ثبت یا بررسی کنید.'
      };
    }
    if (errCode === -11) {
      return { valid: false, message: 'کد مرچنت درگاه در زرین‌پال غیرفعال است.' };
    }

    return { valid: false, message: getZarinpalErrorMessage(errCode) };
  } catch (err: any) {
    return { valid: false, message: 'خطا در ارتباط با زرین‌پال: ' + err.message };
  }
}
