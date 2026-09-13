import crypto from 'crypto';
import { db } from '../database/schema';

export interface SmsSendResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  devOtp?: string;
}

export interface SmsVerifyResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
}

export class SmsService {
  /**
   * Hashes OTP string using SHA-256
   */
  public static hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp.trim()).digest('hex');
  }

  /**
   * Normalizes phone number to E.164 international format (+91XXXXXXXXXX)
   */
  public static normalizePhoneNumber(phone: string): string {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned) return '';

    // If starts with +, keep as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // Default to India (+91) if 10 digits provided without country code
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }

    // If starts with 91 and length is 12, add +
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }

    return `+${cleaned}`;
  }

  /**
   * Validates if phone number matches E.164 standard (7-15 digits)
   */
  public static isValidPhoneNumber(phone: string): boolean {
    const normalized = this.normalizePhoneNumber(phone);
    const e164Regex = /^\+[1-9]\d{7,14}$/;
    return e164Regex.test(normalized);
  }

  /**
   * Transmits SMS via Fast2SMS (India), Twilio API, or generic HTTP SMS provider
   */
  private static async sendSmsViaProvider(toPhone: string, messageBody: string, rawOtp?: string): Promise<boolean> {
    const fast2SmsKey = process.env.FAST2SMS_API_KEY;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    // 1. Fast2SMS Provider (Instant Indian SMS delivery — 100% Free Trial)
    if (fast2SmsKey) {
      try {
        const tenDigit = toPhone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);
        console.log(`[Fast2SMS] 🚀 Dispatching real SMS OTP to +91 ${tenDigit}...`);

        // First try dedicated 'otp' route
        const otpPayload = {
          variables_values: rawOtp || '123456',
          route: 'otp',
          numbers: tenDigit,
        };

        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2SmsKey.trim(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(otpPayload),
        });

        const resData: any = await response.json().catch(() => null);
        console.log('[Fast2SMS OTP Route Response]', resData);

        if (resData && (resData.return === true || resData.status_code === 200)) {
          console.log(`✅ [Fast2SMS] Real SMS dispatched successfully to +91 ${tenDigit}!`);
          return true;
        }

        // Fallback to 'q' (Quick SMS route) if OTP route has template restrictions
        console.warn(`[Fast2SMS] Retrying via Quick SMS route for +91 ${tenDigit}...`);
        const quickPayload = {
          message: `Your CampusFound verification OTP is ${rawOtp || '123456'}. Valid for 5 minutes.`,
          language: 'english',
          route: 'q',
          numbers: tenDigit,
        };

        const quickResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2SmsKey.trim(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quickPayload),
        });

        const quickResData: any = await quickResponse.json().catch(() => null);
        console.log('[Fast2SMS Quick Route Response]', quickResData);

        if (quickResData && (quickResData.return === true || quickResData.status_code === 200)) {
          console.log(`✅ [Fast2SMS Quick Route] Real SMS successfully sent to +91 ${tenDigit}!`);
          return true;
        }

        console.error(`❌ [Fast2SMS Failed]:`, quickResData || resData);
      } catch (err: any) {
        console.error(`❌ [Fast2SMS Exception] ${err.message}`);
      }
    }

    // 2. Twilio Provider
    if (accountSid && authToken && fromPhone) {
      try {
        console.log(`[Twilio SMS] Dispatching SMS to ${toPhone}...`);
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const bodyParams = new URLSearchParams({
          To: toPhone,
          From: fromPhone,
          Body: messageBody,
        });

        const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        const resData: any = await response.json();
        if (response.ok && resData.sid) {
          console.log(`✅ [Twilio SMS] SMS successfully delivered! Message SID: ${resData.sid}`);
          return true;
        } else {
          console.error(`❌ [Twilio SMS Failed] Error: ${resData.message || response.statusText}`);
          return false;
        }
      } catch (err: any) {
        console.error(`❌ [Twilio SMS Exception] ${err.message}`);
        return false;
      }
    }

    // 3. Generic HTTP SMS Provider fallback
    const smsApiUrl = process.env.SMS_API_URL;
    const smsApiKey = process.env.SMS_API_KEY;
    if (smsApiUrl && smsApiKey) {
      try {
        console.log(`[HTTP SMS Provider] Dispatching SMS to ${toPhone}...`);
        const response = await fetch(smsApiUrl, {
          method: 'POST',
          headers: {
            'Authorization': smsApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ to: toPhone, message: messageBody }),
        });
        return response.ok;
      } catch (err: any) {
        console.error(`❌ [HTTP SMS Provider Exception] ${err.message}`);
        return false;
      }
    }

    return false;
  }

  /**
   * Generates a random 6-digit OTP, stores SHA-256 hash in DB, enforces 60s cooldown & 5-min expiry
   */
  public static async sendOtp(rawPhone: string): Promise<SmsSendResult> {
    const phone = this.normalizePhoneNumber(rawPhone);
    if (!this.isValidPhoneNumber(phone)) {
      return {
        success: false,
        message: 'Invalid phone number format. Please provide a valid phone number (e.g. +91 9876543210).'
      };
    }

    const now = Date.now();
    const COOLDOWN_MS = 60 * 1000; // 60 seconds resend cooldown
    const EXPIRY_MS = 5 * 60 * 1000; // 5 minutes OTP expiry

    // Check for recent OTP to enforce 60s resend cooldown
    const recentOtp = db.prepare(`
      SELECT * FROM otp_verifications 
      WHERE phone = ? AND verified = 0 
      ORDER BY createdAt DESC LIMIT 1
    `).get(phone) as any;

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

    // Invalidate previous unverified OTPs for this phone number
    db.prepare(`UPDATE otp_verifications SET verified = -1 WHERE phone = ? AND verified = 0`).run(phone);

    // Save hashed OTP in SQLite
    db.prepare(`
      INSERT INTO otp_verifications (id, phone, otpHash, expiresAt, attempts, verified, createdAt)
      VALUES (?, ?, ?, ?, 0, 0, ?)
    `).run(id, phone, otpHash, expiresAt, createdAt);

    const smsMessage = `Your CampusFind verification code is: ${rawOtp}. Valid for 5 minutes. Do not share this code with anyone.`;
    const smsSent = await this.sendSmsViaProvider(phone, smsMessage, rawOtp);

    console.log(`=======================================================`);
    console.log(`📱 [REAL SMS OTP GENERATED] Phone: ${phone}`);
    console.log(`🔑 OTP Code: ${rawOtp}`);
    console.log(`⏱️  Expires at: ${new Date(expiresAt).toLocaleTimeString()}`);
    console.log(`📡 SMS Provider Sent Status: ${smsSent ? 'SENT REAL SMS VIA FAST2SMS ✅' : 'LOGGED TO CONSOLE (Check Fast2SMS balance or console)'}`);
    console.log(`=======================================================`);

    return {
      success: true,
      message: smsSent 
        ? `Real verification SMS dispatched to ${phone}.`
        : `OTP generated for ${phone}. Check your SMS or terminal console.`,
      devOtp: !smsSent ? rawOtp : undefined,
    };
  }

  /**
   * Verifies incoming OTP against stored hash in SQLite.
   * Enforces 5-minute expiration and max 5 attempts limit.
   */
  public static verifyOtp(rawPhone: string, inputOtp: string): SmsVerifyResult {
    const phone = this.normalizePhoneNumber(rawPhone);
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
        message: 'Phone number verified successfully (Development Instant Access).'
      };
    }

    const record = db.prepare(`
      SELECT * FROM otp_verifications 
      WHERE phone = ? AND verified = 0 
      ORDER BY expiresAt DESC LIMIT 1
    `).get(phone) as any;

    if (!record) {
      return {
        success: false,
        message: 'No active OTP request found for this phone number. Please request a new OTP.'
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
        message: 'Phone number verified successfully.'
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
