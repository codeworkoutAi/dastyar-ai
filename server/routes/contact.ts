import express from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import db from '../db/database';
import { contactRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

    console.log(`[Contact API] Received contact message ${id} from ${trimmedEmail}`);

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
