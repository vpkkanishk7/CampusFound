import crypto from 'crypto';
import dns from 'dns';
import nodemailer from 'nodemailer';
import { db } from '../database/schema';

// Force IPv4 resolution to prevent IPv6 EHOSTUNREACH errors on Windows networks
dns.setDefaultResultOrder('ipv4first');

export interface EmailSendResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  devOtp?: string;
}

export interface EmailVerifyResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
}

export class EmailService {
  /**
   * Hashes OTP string using SHA-256
   */
  public static hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp.trim()).digest('hex');
  }

  /**
   * Validates college email format
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test((email || '').trim().toLowerCase());
  }

  /**
   * Creates a Nodemailer transporter.
   * Connects via Google's direct secure SMTP port 465 with clean app password.
   */
  private static getTransporter() {
    const gmailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

    if (gmailUser && gmailPass) {
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: gmailUser.trim(),
          pass: gmailPass.replace(/\s+/g, ''),
        },
      });
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    return null;
  }

  /**
   * Transmits real email via Nodemailer
   */
  private static async sendEmailViaProvider(toEmail: string, otp: string): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) {
      return false;
    }

    try {
      console.log(`[Email Provider] 🚀 Dispatching real Email OTP to ${toEmail}...`);
      const info = await transporter.sendMail({
        from: `"AmritaFind - Lost & Found" <${process.env.GMAIL_USER || process.env.EMAIL_USER || 'no-reply@amrita.edu'}>`,
        to: toEmail,
        subject: `Your AmritaFind Verification OTP: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #991b1b; margin: 0;">AmritaFind</h2>
              <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Amrita Vishwa Vidyapeetham Lost &amp; Found Portal</p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
              <p style="color: #334155; font-size: 14px; margin: 0 0 10px 0;">Your one-time login verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #0f172a; font-family: monospace;">
                ${otp}
              </div>
              <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0;">Valid for 5 minutes. Do not share this code with anyone.</p>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
              If you did not request this login, please ignore this email.
            </p>
          </div>
        `,
      });

      console.log(`✅ [Email Provider] Real Email successfully delivered! Message ID: ${info.messageId}`);
      return true;
    } catch (err: any) {
      console.error(`❌ [Email Provider Error] ${err.message}`);
      return false;
    }
  }

  /**
   * Generates a random 6-digit OTP, stores SHA-256 hash in SQLite, enforces 60s cooldown & 5-min expiry
   */
  public static async sendOtp(rawEmail: string, contactPhone?: string): Promise<EmailSendResult> {
    const email = (rawEmail || '').trim().toLowerCase();
    if (!this.isValidEmail(email)) {
      return {
        success: false,
        message: 'Please provide a valid college email address (e.g. student@amrita.edu).'
      };
    }

    const now = Date.now();
    const COOLDOWN_MS = 60 * 1000; // 60 seconds resend cooldown
    const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes OTP expiry

    // Check for recent OTP to enforce 60s resend cooldown
    const recentOtp = db.prepare(`
      SELECT * FROM otp_verifications 
      WHERE (email = ? OR phone = ?) AND verified = 0 
      ORDER BY createdAt DESC LIMIT 1
    `).get(email, email) as any;

    if (recentOtp) {
      const createdAtMs = new Date(recentOtp.createdAt).getTime();
      const elapsedMs = now - createdAtMs;
      if (elapsedMs < COOLDOWN_MS) {
        const remainingSeconds = Math.ceil((COOLDOWN_MS - elapsedMs) / 1000);
        return {
          success: false,
          message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
          cooldownSeconds: remainingSeconds
        };
      }
    }

    // Generate fresh random 6-digit OTP (Cryptographically non-predictable)
    const rawOtp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = now + EXPIRY_MS;
    const id = `otp-${now}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();

    // Invalidate previous unverified OTPs for this email
    db.prepare(`UPDATE otp_verifications SET verified = -1 WHERE (email = ? OR phone = ?) AND verified = 0`).run(email, email);

    // Save hashed OTP in SQLite
    db.prepare(`
      INSERT INTO otp_verifications (id, phone, email, otpHash, expiresAt, attempts, verified, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, 0, ?)
    `).run(id, email, email, otpHash, expiresAt, createdAt);

    const emailSent = await this.sendEmailViaProvider(email, rawOtp);

    console.log(`=======================================================`);
    console.log(`📧 [REAL EMAIL OTP GENERATED] College Email: ${email}`);
    if (contactPhone) {
      console.log(`📱 [PERSONAL CONTACT PHONE] Phone: ${contactPhone}`);
    }
    console.log(`🔑 OTP Code: ${rawOtp}`);
    console.log(`⏱️  Expires at: ${new Date(expiresAt).toLocaleTimeString()}`);
    console.log(`📡 Email Provider Status: ${emailSent ? 'SENT VIA SMTP EMAIL ✅' : 'LOGGED TO CONSOLE / DEV (Configure GMAIL_USER & GMAIL_APP_PASSWORD in .env for live inbox delivery)'}`);
    console.log(`=======================================================`);

    return {
      success: true,
      message: emailSent
        ? `Verification code dispatched to ${email}. Check your inbox!`
        : `OTP generated for ${email}. Check your email or terminal console.`,
      devOtp: !emailSent ? rawOtp : undefined,
    };
  }

  /**
   * Verifies incoming OTP against stored hash in SQLite.
   * Enforces 5-minute expiration and max 5 attempts limit.
   */
  public static verifyOtp(rawEmail: string, inputOtp: string): EmailVerifyResult {
    const email = (rawEmail || '').trim().toLowerCase();
    const cleanOtp = (inputOtp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return {
        success: false,
        message: 'Please enter a valid 6-digit numeric OTP code.'
      };
    }

    // Allow development / demo OTP code '654321' in development mode or as instant access
    if (process.env.NODE_ENV !== 'production' && cleanOtp === '654321') {
      return {
        success: true,
        message: 'Email verified successfully (Development Instant Access).'
      };
    }

    const record = db.prepare(`
      SELECT * FROM otp_verifications 
      WHERE (email = ? OR phone = ?) AND verified = 0 
      ORDER BY expiresAt DESC LIMIT 1
    `).get(email, email) as any;

    if (!record) {
      return {
        success: false,
        message: 'No active OTP request found for this email. Please request a new OTP.'
      };
    }

    // Check expiry
    if (Date.now() > record.expiresAt) {
      db.prepare('UPDATE otp_verifications SET verified = -1 WHERE id = ?').run(record.id);
      return {
        success: false,
        message: 'OTP has expired (valid for 5 minutes). Please click "Resend OTP".'
      };
    }

    // Check max attempts (5)
    if (record.attempts >= 5) {
      db.prepare('UPDATE otp_verifications SET verified = -1 WHERE id = ?').run(record.id);
      return {
        success: false,
        message: 'Maximum OTP verification attempts (5) exceeded. Please request a new OTP.'
      };
    }

    // Verify SHA-256 OTP Hash
    const inputHash = this.hashOtp(cleanOtp);
    if (inputHash === record.otpHash) {
      db.prepare('UPDATE otp_verifications SET verified = 1 WHERE id = ?').run(record.id);
      return {
        success: true,
        message: 'Email verified successfully.'
      };
    } else {
      const newAttempts = record.attempts + 1;
      const remaining = 5 - newAttempts;
      db.prepare('UPDATE otp_verifications SET attempts = ? WHERE id = ?').run(newAttempts, record.id);

      if (remaining <= 0) {
        db.prepare('UPDATE otp_verifications SET verified = -1 WHERE id = ?').run(record.id);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. Please request a new OTP.'
        };
      }

      return {
        success: false,
        message: `Incorrect OTP entered. You have ${remaining} attempt(s) remaining.`,
        attemptsRemaining: remaining
      };
    }
  }
}
