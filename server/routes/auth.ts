import express from 'express';
import bcrypt from 'bcryptjs';
import db, { syncDatabase } from '../db/database';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth';
import { sendOtpSms } from '../services/kavenegar';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { telegramAuthSessions } from '../services/telegramAuthSessions';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'chatbox-secret-key-123';

// Rate limiters
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Limit each IP to 3 OTP requests per window
  message: { error: 'تعداد درخواست‌های پیامک بیش از حد مجاز است. لطفاً ۵ دقیقه دیگر دوباره تلاش کنید.' },
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

const forgotPasswordLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 forgot password requests per window
  message: { error: 'تعداد درخواست‌های بازیابی بیش از حد مجاز است. لطفاً ۱۰ دقیقه دیگر دوباره تلاش کنید.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^09\d{9}$/.test(phone)) {
      return res.status(400).json({ error: 'شماره موبایل نامعتبر است (مثال: 09123456789)' });
    }

    // Generate a 5-digit code
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString(); // 2 minutes

    // Save to DB
    const insertStmt = db.prepare('INSERT OR REPLACE INTO otps (phone, code, expiresAt) VALUES (?, ?, ?)');
    insertStmt.run(phone, code, expiresAt);

    // Send SMS
    const sent = await sendOtpSms(phone, code);

    if (sent) {
      res.json({ message: 'کد تایید ارسال شد' });
    } else {
      res.status(500).json({ error: 'خطا در ارسال پیامک' });
    }
  } catch (error) {
    console.error('[Auth API] Send OTP Error:', error);
    res.status(500).json({ error: 'خطای سرور در ارسال کد' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', verifyLimiter, async (req, res) => {
  try {
    const { phone, code, name, avatar } = req.body;

    if (!phone || !code) {
      return res.status(400).json({ error: 'شماره موبایل و کد تایید الزامی است' });
    }

    // Check OTP
    const otpStmt = db.prepare('SELECT * FROM otps WHERE phone = ?');
    const otpRecord = otpStmt.get(phone) as { code: string, expiresAt: string } | undefined;

    if (!otpRecord) {
      return res.status(400).json({ error: 'کد تاییدی برای این شماره یافت نشد' });
    }

    if (otpRecord.code !== code) {
      return res.status(400).json({ error: 'کد تایید اشتباه است' });
    }

    if (new Date(otpRecord.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'کد تایید منقضی شده است' });
    }

    // OTP is valid, clear it
    db.prepare('DELETE FROM otps WHERE phone = ?').run(phone);

    // Get or Create User
    const userStmt = db.prepare('SELECT * FROM users WHERE phone = ?');
    let user = userStmt.get(phone) as any;

    if (!user) {
      // Check if this is the first user
      const countStmt = db.prepare('SELECT COUNT(*) as count FROM users');
      const { count } = countStmt.get() as { count: number };
      const role = count === 0 ? 'admin' : 'user';

      const randomColors = '264653,2a9d8f,e9c46a,f4a261,e76f51';
      const defaultAvatar = avatar || `https://api.dicebear.com/9.x/shapes/svg?seed=${phone}`;

      const insertUserStmt = db.prepare('INSERT INTO users (phone, name, avatar, role) VALUES (?, ?, ?, ?)');
      const info = insertUserStmt.run(phone, name || '', defaultAvatar, role);

      user = { id: info.lastInsertRowid, phone, name, avatar: defaultAvatar, role };
    } else {
      // Update name and avatar if provided
      if (name || avatar) {
        db.prepare('UPDATE users SET name = COALESCE(?, name), avatar = COALESCE(?, avatar) WHERE id = ?').run(name, avatar, user.id);
        user.name = name || user.name;
        user.avatar = avatar || user.avatar;
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'ورود موفقیت‌آمیز',
      token,
      user: { id: user.id, phone: user.phone, name: user.name, avatar: user.avatar, role: user.role }
    });
  } catch (error) {
    console.error('[Auth API] Verify OTP Error:', error);
    res.status(500).json({ error: 'خطای سرور در تایید کد' });
  }
});

// POST /api/auth/register (Email)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, avatar } = req.body;

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

    const insertStmt = db.prepare('INSERT INTO users (email, passwordHash, name, avatar, role) VALUES (?, ?, ?, ?, ?)');
    const info = insertStmt.run(email, passwordHash, name || '', defaultAvatar, role);

    const token = jwt.sign(
      { id: info.lastInsertRowid, email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'ثبت‌نام موفقیت‌آمیز بود',
      token,
      user: { id: info.lastInsertRowid, email, name, avatar: defaultAvatar, role }
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

    res.json({
      message: 'ورود موفقیت‌آمیز',
      token,
      user: { id: user.id, email: user.email, phone: user.phone, name: user.name, avatar: user.avatar, role: user.role }
    });
  } catch (error) {
    console.error('[Auth API] Login Error:', error);
    res.status(500).json({ error: 'خطای سرور در ورود' });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
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

        const insertUserStmt = db.prepare('INSERT INTO users (email, googleId, name, avatar, role) VALUES (?, ?, ?, ?, ?)');
        const info = insertUserStmt.run(email, googleId, name, avatar, role);
        user = { id: info.lastInsertRowid, email, googleId, name, avatar, role };
      }
    }

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
  const userStmt = db.prepare('SELECT id, phone, email, name, avatar, role FROM users WHERE id = ?');
  const user = userStmt.get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
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

    const resetUrl = `${req.headers.origin}/?reset_token=${resetToken}`;
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
      console.warn('[Auth API] Neither RESEND_API_KEY nor SMTP credentials set. Reset link:', resetUrl);
    }

    res.json({ message: 'لینک بازیابی رمز عبور به ایمیل شما ارسال شد.' });
  } catch (error) {
    console.error('[Auth API] Forgot Password Error:', error);
    res.status(500).json({ error: 'خطای سرور در ارسال ایمیل بازیابی' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
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
