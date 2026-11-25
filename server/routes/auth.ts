import express from 'express';
import bcrypt from 'bcryptjs';
import db, { syncDatabase } from '../db/database';
import { requireAuth, JWT_SECRET } from '../middleware/auth';
import { googleAuthLimiter } from '../middleware/rateLimiter';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import rateLimit from 'express-rate-limit';
import { telegramAuthSessions } from '../services/telegramAuthSessions';
import { grantWelcomeBonusIfEligible, getUserWallet, getUserTransactions, getUserUsageStats, getApiDollarRate } from '../services/walletService';
import { sendOtpSms, normalizePhoneNumber, isValidIranianMobile, sendWelcomeSms } from '../services/kavenegarService';

const router = express.Router();

// Rate limiters
const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 register attempts per window
  message: { error: 'تعداد تلاش‌های ثبت‌نام بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Limit each IP to 5 verify/login attempts per window
  message: { error: 'تعداد تلاش‌های ورود بیش از حد مجاز است. لطفاً ۵ دقیقه دیگر دوباره تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 OTP requests per window
  message: { error: 'تعداد درخواست‌های ارسال کد بیش از حد مجاز است. لطفاً ۱۰ دقیقه دیگر دوباره تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 verification attempts per window
  message: { error: 'تعداد تلاش‌های ناموفق ورود بیش از حد مجاز است. لطفاً کمی صبر کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 forgot password requests per window
  message: { error: 'تعداد درخواست‌های بازیابی بیش از حد مجاز است. لطفاً ۱۰ دقیقه دیگر دوباره تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 password reset attempts per window
  message: { error: 'تعداد تلاش‌های تغییر رمز بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر دوباره تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/otp/send (Phone OTP Request)
router.post('/otp/send', otpSendLimiter, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'شماره موبایل الزامی است.' });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    if (!isValidIranianMobile(normalizedPhone)) {
      return res.status(400).json({ error: 'شماره موبایل نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹' });
    }

    // Check cooling period: don't allow resending within 60 seconds
    const existingOtp = db.prepare('SELECT * FROM otps WHERE phone = ?').get(normalizedPhone) as any;
    if (existingOtp) {
      const expiresAt = new Date(existingOtp.expiresAt).getTime();
      const timeLeftSeconds = Math.round((expiresAt - Date.now()) / 1000);
      // Expiry is 120s from creation, so if remaining > 60s, it's inside the 60s cooldown
      if (timeLeftSeconds > 60) {
        return res.status(429).json({
          error: `لطفاً ${timeLeftSeconds - 60} ثانیه دیگر برای درخواست مجدد کد شکیبا باشید.`,
          retryAfter: timeLeftSeconds - 60
        });
      }
    }

    // Generate cryptographically secure 5-digit numeric OTP code
    const code = crypto.randomInt(10000, 100000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes

    // Upsert into otps table
    db.prepare(`
      INSERT INTO otps (phone, code, expiresAt)
      VALUES (?, ?, ?)
      ON CONFLICT(phone) DO UPDATE SET code = excluded.code, expiresAt = excluded.expiresAt
    `).run(normalizedPhone, code, expiresAt);
    syncDatabase();

    // Dispatch SMS via Kavenegar
    const smsResult = await sendOtpSms(normalizedPhone, code);
    if (!smsResult.success) {
      return res.status(500).json({ error: smsResult.error || 'خطا در ارسال پیامک کد تایید' });
    }

    res.json({
      success: true,
      message: 'کد تایید ورود پیامک شد.',
      expiresIn: 120
    });
  } catch (err) {
    console.error('[Auth API] Send OTP Error:', err);
    res.status(500).json({ error: 'خطای سرور در ارسال کد ورود' });
  }
});

// POST /api/auth/otp/verify (Verify OTP & Login/Register)
router.post('/otp/verify', otpVerifyLimiter, async (req, res) => {
  try {
    const { phone, code, promoCode, source, deviceFingerprint } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'شماره موبایل و کد تایید الزامی است.' });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedCode = code.toString().trim();

    const otpRow = db.prepare('SELECT * FROM otps WHERE phone = ?').get(normalizedPhone) as any;
    if (!otpRow) {
      return res.status(400).json({ error: 'کد تایید یافت نشد یا منقضی شده است. لطفاً مجدداً درخواست کد دهید.' });
    }

    // Check expiry
    if (new Date(otpRow.expiresAt).getTime() < Date.now()) {
      db.prepare('DELETE FROM otps WHERE phone = ?').run(normalizedPhone);
      syncDatabase();
      return res.status(400).json({ error: 'کد تایید منقضی شده است. لطفاً مجدداً کد دریافت کنید.' });
    }

    // Check match
    if (otpRow.code !== normalizedCode) {
      return res.status(400).json({ error: 'کد وارد شده نادرست است.' });
    }

    // Code is valid! Consume OTP
    db.prepare('DELETE FROM otps WHERE phone = ?').run(normalizedPhone);
    syncDatabase();

    // Check if user exists
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(normalizedPhone) as any;

    if (!user) {
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
      const { count } = countStmt.get() as { count: number };
      const role = count === 0 ? 'admin' : 'user';

      const maskedPhone = `${normalizedPhone.slice(0, 4)}***${normalizedPhone.slice(-4)}`;
      const defaultName = `کاربر ${maskedPhone}`;
      const defaultAvatar = `https://api.dicebear.com/9.x/shapes/svg?seed=${normalizedPhone}`;
      const userSource = (source && typeof source === 'string') ? source.slice(0, 32) : 'web';
      const userFingerprint = (deviceFingerprint && typeof deviceFingerprint === 'string') ? deviceFingerprint.slice(0, 128) : null;

      const insertStmt = db.prepare('INSERT INTO users (phone, name, avatar, role, source, deviceFingerprint) VALUES (?, ?, ?, ?, ?, ?)');
      const info = insertStmt.run(normalizedPhone, defaultName, defaultAvatar, role, userSource, userFingerprint);
      const userId = Number(info.lastInsertRowid);

      const bonusResult = grantWelcomeBonusIfEligible(userId, promoCode);

      user = {
        id: userId,
        phone: normalizedPhone,
        email: null,
        name: defaultName,
        avatar: defaultAvatar,
        role,
        walletBalance: bonusResult.newBalance,
        hasReceivedWelcomeBonus: bonusResult.granted
      };

      if (normalizedPhone) {
        sendWelcomeSms(normalizedPhone, bonusResult.granted, bonusResult.amount).catch(() => {});
      }
    } else {
      const wallet = getUserWallet(user.id);
      user.walletBalance = wallet.walletBalance;
      user.hasReceivedWelcomeBonus = wallet.hasReceivedWelcomeBonus;
    }

    syncDatabase();

    const token = jwt.sign(
      { id: user.id, phone: user.phone, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'ورود موفقیت‌آمیز',
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        walletBalance: user.walletBalance,
        hasReceivedWelcomeBonus: user.hasReceivedWelcomeBonus
      }
    });
  } catch (err) {
    console.error('[Auth API] Verify OTP Error:', err);
    res.status(500).json({ error: 'خطای سرور در تایید کد ورود' });
  }
});

// POST /api/auth/register (Email)
router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { email, password, name, avatar, promoCode, source, deviceFingerprint } = req.body;

    if (!email || !email.includes('@') || !password || password.length < 6) {
      return res.status(400).json({ error: 'ایمیل معتبر و رمز عبور (حداقل ۶ کاراکتر) الزامی است.' });
    }

    const checkStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const existingUser = checkStmt.get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'این ایمیل قبلاً ثبت شده است.' });
    }

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
    const { count } = countStmt.get() as { count: number };
    const role = count === 0 ? 'admin' : 'user';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const randomColors = '264653,2a9d8f,e9c46a,f4a261,e76f51';
    const defaultAvatar = avatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${email}`;
    const userSource = (source && typeof source === 'string') 
      ? source.slice(0, 32) 
      : (email.endsWith('@bazaar.guest') ? 'bazaar' : 'web');
    const userFingerprint = (deviceFingerprint && typeof deviceFingerprint === 'string') ? deviceFingerprint.slice(0, 128) : null;

    const insertStmt = db.prepare('INSERT INTO users (email, passwordHash, name, avatar, role, source, deviceFingerprint) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const info = insertStmt.run(email, passwordHash, name || '', defaultAvatar, role, userSource, userFingerprint);
    syncDatabase();

    const userId = Number(info.lastInsertRowid);
    const bonusResult = grantWelcomeBonusIfEligible(userId, promoCode);

    const token = jwt.sign(
      { id: userId, email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'ثبت‌نام موفقیت‌آمیز بود',
      token,
      user: { 
        id: userId, 
        email, 
        name, 
        avatar: defaultAvatar, 
        role,
        walletBalance: bonusResult.newBalance,
        hasReceivedWelcomeBonus: bonusResult.granted
      }
    });
  } catch (error) {
    console.error('[Auth API] Register Error:', error);
    res.status(500).json({ error: 'خطای سرور در ثبت‌نام' });
  }
});

// POST /api/auth/login (Email)
router.post('/login', verifyLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as any;

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'ایمیل یا رمز عبور اشتباه است.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'ایمیل یا رمز عبور اشتباه است.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const wallet = getUserWallet(user.id);

    res.json({
      message: 'ورود موفقیت‌آمیز',
      token,
      user: { 
        id: user.id, 
        email: user.email, 
        phone: user.phone, 
        name: user.name, 
        avatar: user.avatar, 
        role: user.role,
        walletBalance: wallet.walletBalance,
        hasReceivedWelcomeBonus: wallet.hasReceivedWelcomeBonus
      }
    });
  } catch (error) {
    console.error('[Auth API] Login Error:', error);
    res.status(500).json({ error: 'خطای سرور در ورود' });
  }
});

// POST /api/auth/google
router.post('/google', googleAuthLimiter, async (req, res) => {
  try {
    const { credential, promoCode } = req.body;
    if (!credential) return res.status(400).json({ error: 'توکن گوگل دریافت نشد.' });

    // Validate token using Google's public endpoint (supports both ID Token and OAuth2 Access Token)
    let payload: any = null;

    // 1. Try validating as ID Token
    try {
      const idTokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (idTokenRes.ok) {
        payload = await idTokenRes.json();
      }
    } catch (e) {}

    // 2. If not an ID Token, try fetching user info with OAuth2 Access Token
    if (!payload || !payload.sub) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${credential}` }
        });
        if (userInfoRes.ok) {
          payload = await userInfoRes.json();
        }
      } catch (e) {}
    }

    if (!payload || !payload.sub) {
      return res.status(400).json({ error: 'توکن گوگل نامعتبر یا منقضی شده است.' });
    }

    // Security: Validate audience (aud) to prevent Cross-App Token Confusion
    const expectedClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    if (expectedClientId && payload.aud && payload.aud !== expectedClientId) {
      return res.status(400).json({ error: 'توکن گوگل معتبر است اما متعلق به این سامانه نیست.' });
    }

    const { sub: googleId, email, name, picture: avatar } = payload;

    // Check if user exists by googleId
    let user = db.prepare('SELECT * FROM users WHERE googleId = ?').get(googleId) as any;

    if (!user) {
      // Check if user exists by email to link accounts
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
      if (user) {
        db.prepare('UPDATE users SET googleId = ?, avatar = COALESCE(avatar, ?) WHERE id = ?').run(googleId, avatar, user.id);
        user.googleId = googleId;
        user.avatar = user.avatar || avatar;
      } else {
        // Create new user
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
        const { count } = countStmt.get() as { count: number };
        const role = count === 0 ? 'admin' : 'user';

        const insertUserStmt = db.prepare('INSERT INTO users (email, googleId, name, avatar, role, source) VALUES (?, ?, ?, ?, ?, ?)');
        const info = insertUserStmt.run(email, googleId, name, avatar, role, 'web');
        user = { id: Number(info.lastInsertRowid), email, googleId, name, avatar, role, source: 'web' };
        grantWelcomeBonusIfEligible(user.id, promoCode);
      }
    }

    const wallet = getUserWallet(user.id);
    user.walletBalance = wallet.walletBalance;
    user.hasReceivedWelcomeBonus = wallet.hasReceivedWelcomeBonus;

    syncDatabase();

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ message: 'ورود با گوگل موفقیت‌آمیز', token, user });

  } catch (error) {
    console.error('[Auth API] Google Login Error:', error);
    res.status(500).json({ error: 'خطای سرور در ورود با گوگل' });
  }
});

// POST /api/auth/telegram/session
router.post('/telegram/session', (req, res) => {
  try {
    const sessionToken = crypto.randomBytes(16).toString('hex');
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'FaChatBox_bot';

    telegramAuthSessions.set(sessionToken, {
      token: sessionToken,
      status: 'pending',
      createdAt: Date.now()
    });

    const botUrl = `https://t.me/${botUsername}?start=auth_${sessionToken}`;
    res.json({ token: sessionToken, botUrl });
  } catch (err) {
    console.error('[Auth API] Telegram Session Error:', err);
    res.status(500).json({ error: 'خطا در ایجاد نشست ورود با تلگرام' });
  }
});

// GET /api/auth/telegram/check
router.get('/telegram/check', (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'توکن نامعتبر است' });
    }

    const session = telegramAuthSessions.get(token);
    if (!session || Date.now() - session.createdAt > 5 * 60 * 1000) {
      return res.json({ status: 'expired' });
    }

    if (session.status === 'authenticated') {
      return res.json({
        status: 'authenticated',
        token: session.jwtToken,
        user: session.user
      });
    }

    res.json({ status: 'pending' });
  } catch (err) {
    console.error('[Auth API] Telegram Check Error:', err);
    res.status(500).json({ error: 'خطا در بررسی وضعیت نشست تلگرام' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: any, res) => {
  const userStmt = db.prepare('SELECT id, phone, email, name, avatar, role, walletBalance, hasReceivedWelcomeBonus FROM users WHERE id = ?');
  let user = userStmt.get(req.user.id) as any;

  if (!user) {
    return res.status(404).json({ error: 'کاربر یافت نشد.' });
  }

  // Grant welcome bonus if eligible and not received yet
  if (!user.hasReceivedWelcomeBonus) {
    const bonus = grantWelcomeBonusIfEligible(user.id);
    if (bonus.granted) {
      user.walletBalance = bonus.newBalance;
      user.hasReceivedWelcomeBonus = 1;
    }
  }

  res.json({ user });
});

// GET /api/auth/wallet
router.get('/wallet', requireAuth, (req: any, res) => {
  try {
    const userId = req.user.id;
    const wallet = getUserWallet(userId);
    const sellingRate = getApiDollarRate();
    const stats = getUserUsageStats(userId);
    const transactions = getUserTransactions(userId, 100);

    res.json({
      walletBalance: wallet.walletBalance,
      hasReceivedWelcomeBonus: wallet.hasReceivedWelcomeBonus,
      sellingRate,
      stats,
      transactions
    });
  } catch (err) {
    console.error('[Auth API] Get Wallet Error:', err);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات کیف پول' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'ایمیل الزامی است.' });

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email) as any;

    if (!user) {
      // Return 200 even if not found to prevent email enumeration
      return res.json({ message: 'اگر ایمیل معتبر باشد، لینک بازیابی ارسال خواهد شد.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    db.prepare('UPDATE users SET resetToken = ?, resetTokenExpiry = ? WHERE id = ?').run(resetToken, resetTokenExpiry, user.id);
    syncDatabase();

    const configuredUrl = (process.env.APP_URL || process.env.WEBSITE_URL || process.env.WEB_URL || '').replace(/\/+$/, '');
    let safeAppUrl = configuredUrl;
    if (!safeAppUrl) {
      const host = req.get('host');
      const origin = req.headers.origin;
      if (origin && host && (origin === `https://${host}` || origin === `http://${host}`)) {
        safeAppUrl = origin;
      } else {
        const proto = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        safeAppUrl = `${proto}://${host}`;
      }
    }
    const resetUrl = `${safeAppUrl}/?reset_token=${resetToken}`;
    const senderEmail = process.env.FROM_EMAIL || 'info@dastyarai.com';
    const mailHtml = `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; text-align: right; background-color: #f9fafb; border-radius: 16px;">
        <h2 style="color: #2563eb;">بازیابی رمز عبور</h2>
        <p style="color: #4b5563; font-size: 16px;">شما درخواست بازیابی رمز عبور داده‌اید. برای تغییر رمز عبور خود روی دکمه زیر کلیک کنید:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">تغییر رمز عبور</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">این لینک تا ۱۵ دقیقه دیگر منقضی می‌شود.</p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
      </div>
    `;

    // 1. Prioritize Resend API if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      console.log(`[Auth API] Sending password reset email via Resend API to: ${user.email}`);
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `دستیار هوشمند <${senderEmail}>`,
          to: [user.email],
          subject: 'بازیابی رمز عبور - دستیار هوشمند',
          html: mailHtml
        })
      });

      if (!resendRes.ok) {
        const errorData = await resendRes.json().catch(() => ({}));
        console.error('[Auth API] Resend API error:', errorData);
        throw new Error('Resend API failed to send email');
      }
    } 
    // 2. Fallback to SMTP (Gmail / Custom SMTP)
    else if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      console.log(`[Auth API] Sending password reset email via SMTP to: ${user.email}`);
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      });

      await transporter.sendMail({
        from: `"دستیار هوشمند" <${senderEmail}>`,
        to: user.email,
        subject: 'بازیابی رمز عبور - دستیار هوشمند',
        html: mailHtml
      });
    } else {
      console.warn('[Auth API] Neither RESEND_API_KEY nor SMTP credentials set. Password reset requested for email:', user.email);
    }

    res.json({ message: 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد.' });
  } catch (error) {
    console.error('[Auth API] Forgot Password Error:', error);
    res.status(500).json({ error: 'خطای سرور در ارسال ایمیل بازیابی' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', resetPasswordLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'توکن نامعتبر یا رمز عبور کوتاه است (حداقل ۶ کاراکتر).' });
    }

    const stmt = db.prepare('SELECT * FROM users WHERE resetToken = ?');
    const user = stmt.get(token) as any;

    if (!user) {
      return res.status(400).json({ error: 'لینک بازیابی نامعتبر است.' });
    }

    if (new Date(user.resetTokenExpiry) < new Date()) {
      return res.status(400).json({ error: 'لینک بازیابی منقضی شده است.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    db.prepare('UPDATE users SET passwordHash = ?, resetToken = NULL, resetTokenExpiry = NULL WHERE id = ?').run(passwordHash, user.id);
    syncDatabase();

    res.json({ message: 'رمز عبور با موفقیت تغییر کرد. اکنون می‌توانید وارد شوید.' });
  } catch (error) {
    console.error('[Auth API] Reset Password Error:', error);
    res.status(500).json({ error: 'خطای سرور در تغییر رمز عبور' });
  }
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req: any, res) => {
  try {
    const { name, email, avatar } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'نام و نام خانوادگی نمی‌تواند خالی باشد.' });
    }

    // Check if email is already taken by someone else
    if (email && email.trim() !== '') {
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.trim(), userId);
      if (existingUser) {
        return res.status(400).json({ error: 'این ایمیل توسط کاربر دیگری استفاده شده است.' });
      }
    }

    // Get existing user to keep old avatar if not provided
    const user = db.prepare('SELECT avatar FROM users WHERE id = ?').get(userId) as any;
    const newAvatar = avatar ? avatar.trim() : user.avatar;

    db.prepare('UPDATE users SET name = ?, email = ?, avatar = ? WHERE id = ?').run(
      name.trim(), 
      email && email.trim() !== '' ? email.trim() : null, 
      newAvatar, 
      userId
    );
    syncDatabase();

    res.json({ message: 'پروفایل با موفقیت بروزرسانی شد.' });
  } catch (error) {
    console.error('[Auth API] Update Profile Error:', error);
    res.status(500).json({ error: 'خطای سرور در بروزرسانی پروفایل.' });
  }
});

// PUT /api/auth/password
router.put('/password', requireAuth, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'رمز عبور فعلی و رمز عبور جدید (حداقل ۶ کاراکتر) الزامی است.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

    if (!user.passwordHash) {
      return res.status(400).json({ error: 'شما با شماره موبایل ثبت‌نام کرده‌اید و رمز عبور ندارید.' });
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(400).json({ error: 'رمز عبور فعلی اشتباه است.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(passwordHash, userId);
    syncDatabase();

    res.json({ message: 'رمز عبور با موفقیت تغییر کرد.' });
  } catch (error) {
    console.error('[Auth API] Update Password Error:', error);
    res.status(500).json({ error: 'خطای سرور در تغییر رمز عبور.' });
  }
});
export default router;
