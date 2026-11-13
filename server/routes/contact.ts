import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import db, { syncDatabase } from '../db/database';
import { bot } from '../telegram/bot';
import { contactRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

router.post('/contact', contactRateLimiter, async (req, res) => {
  try {
    const { name, email, message } = req.body || {};

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedName) {
      return res.status(400).json({ error: 'لطفاً نام خود را وارد کنید.' });
    }

    if (!trimmedEmail || !EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ error: 'لطفاً یک آدرس ایمیل معتبر وارد کنید.' });
    }

    if (!trimmedMessage || trimmedMessage.length < 10) {
      return res.status(400).json({ error: 'متن پیام باید حداقل ۱۰ کاراکتر باشد.' });
    }

    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    // Save message to database
    db.prepare(`
      INSERT INTO contact_messages (id, name, email, message, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, trimmedName, trimmedEmail, trimmedMessage, createdAt);
    syncDatabase();

    console.log(`[Contact API] Received contact message ${id} from ${trimmedEmail}`);

    // Forward to Telegram Admin / Group if configured
    const adminId = process.env.TELEGRAM_ADMIN_ID;
    if (bot && adminId) {
      try {
        const safeName = escapeHtml(trimmedName);
        const safeEmail = escapeHtml(trimmedEmail);
        const safeMsg = escapeHtml(trimmedMessage);
        const tehranTime = new Date().toLocaleString('fa-IR', { timeZone: 'Asia/Tehran' });

        const tgText = `📬 <b>پیام جدید از فرم تماس سایت Dastyar AI</b>\n\n` +
          `👤 <b>نام فرستنده:</b> ${safeName}\n` +
          `📧 <b>ایمیل:</b> <code>${safeEmail}</code>\n` +
          `🕒 <b>زمان ارسال:</b> ${tehranTime}\n\n` +
          `💬 <b>متن پیام:</b>\n${safeMsg}`;

        await bot.telegram.sendMessage(adminId, tgText, { parse_mode: 'HTML' });
        console.log(`[Contact API] Forwarded contact message ${id} to Telegram admin (${adminId})`);
      } catch (tgErr) {
        console.warn('[Contact API] Failed to forward message to Telegram admin:', tgErr);
      }
    }

    // If SMTP is configured, attempt sending notification email
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
          }
        });

        await transporter.sendMail({
          from: `"Dastyar AI Contact" <${process.env.SMTP_EMAIL}>`,
          to: 'support@dastyarai.com',
          replyTo: trimmedEmail,
          subject: `پیام جدید از فرم تماس: ${trimmedName}`,
          text: `نام: ${trimmedName}\nایمیل: ${trimmedEmail}\nتاریخ: ${createdAt}\n\nپیام:\n${trimmedMessage}`
        });
      } catch (mailErr) {
        console.warn('[Contact API] Failed to forward email via SMTP:', mailErr);
      }
    }

    res.json({
      success: true,
      message: 'پیام شما دریافت شد. در اسرع وقت پاسخ می‌دهیم.'
    });
  } catch (error) {
    console.error('[Contact API] Error handling contact form:', error);
    res.status(500).json({ error: 'خطای سرور در ثبت پیام. لطفاً کمی بعد دوباره تلاش کنید.' });
  }
});

export default router;
