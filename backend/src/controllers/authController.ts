import { Request, Response } from 'express';
import { db } from '../database/schema';
import { SmsService } from '../services/SmsService';
import { EmailService } from '../services/EmailService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'campus_find_dsa_secret_key_2026';

export const register = (req: Request, res: Response): void => {
  try {
    const { fullName, collegeEmail, rollNumber, phone } = req.body;
    if (!fullName || !phone) {
      res.status(400).json({ success: false, message: 'Full name and phone are required.' });
      return;
    }

    const normalizedPhone = SmsService.normalizePhoneNumber(phone);
    if (!SmsService.isValidPhoneNumber(normalizedPhone)) {
      res.status(400).json({ success: false, message: 'Please provide a valid phone number with country code.' });
      return;
    }

    const id = `u-${Date.now()}`;
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, fullName, collegeEmail, rollNumber, phone, phoneVerified, emailVerified, createdAt)
      VALUES (?, ?, ?, ?, ?, 1, 1, ?)
    `);
    stmt.run(id, fullName, collegeEmail || `${id}@campus.edu`, rollNumber || 'STUDENT', normalizedPhone, createdAt);

    const token = jwt.sign({ id, email: collegeEmail }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { id, fullName, collegeEmail, rollNumber, phone: normalizedPhone, phoneVerified: 1, emailVerified: 1 }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, phone } = req.body;

    // Prefer College Email for OTP dispatch (100% free & reliable)
    if (email) {
      const result = await EmailService.sendOtp(email, phone);
      if (!result.success) {
        res.status(400).json({ 
          success: false, 
          message: result.message, 
          cooldownSeconds: result.cooldownSeconds 
        });
        return;
      }

      res.json({ 
        success: true, 
        message: result.message,
        devOtp: result.devOtp 
      });
      return;
    }

    // Fallback if only phone provided
    if (!phone) {
      res.status(400).json({ success: false, message: 'Email address or phone number is required.' });
      return;
    }

    const result = await SmsService.sendOtp(phone);
    if (!result.success) {
      res.status(400).json({ 
        success: false, 
        message: result.message, 
        cooldownSeconds: result.cooldownSeconds 
      });
      return;
    }

    res.json({ 
      success: true, 
      message: result.message,
      devOtp: result.devOtp 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = (req: Request, res: Response): void => {
  try {
    const { email, phone, otp, fullName, rollNumber } = req.body;

    if (!email && !phone) {
      res.status(400).json({ success: false, message: 'Email or phone number is required.' });
      return;
    }

    if (!otp) {
      res.status(400).json({ success: false, message: 'OTP is required.' });
      return;
    }

    const normalizedPhone = phone ? SmsService.normalizePhoneNumber(phone) : '';
    const cleanEmail = (email || '').trim().toLowerCase();

    // Verify OTP using EmailService if email provided, else SmsService
    let dbVerification;
    if (cleanEmail) {
      dbVerification = EmailService.verifyOtp(cleanEmail, otp);
    } else {
      dbVerification = SmsService.verifyOtp(normalizedPhone, otp);
    }

    if (!dbVerification.success) {
      res.status(400).json({ 
        success: false, 
        message: dbVerification.message,
        attemptsRemaining: dbVerification.attemptsRemaining
      });
      return;
    }

    // Find or create user in SQLite database
    let user = null;
    if (cleanEmail) {
      user = db.prepare('SELECT * FROM users WHERE collegeEmail = ?').get(cleanEmail) as any;
    }
    if (!user && normalizedPhone) {
      user = db.prepare('SELECT * FROM users WHERE phone = ?').get(normalizedPhone) as any;
    }

    const now = new Date().toISOString();

    if (!user) {
      const id = `u-${Date.now()}`;
      const name = fullName || 'Campus Student';
      const mail = cleanEmail || (normalizedPhone ? `${normalizedPhone}@campus.edu` : `${id}@campus.edu`);
      const roll = rollNumber || 'STUDENT';
      const userPhone = normalizedPhone || '+910000000000';

      db.prepare(`
        INSERT INTO users (id, fullName, collegeEmail, rollNumber, phone, phoneVerified, emailVerified, createdAt)
        VALUES (?, ?, ?, ?, ?, 1, 1, ?)
      `).run(id, name, mail, roll, userPhone, now);

      user = { id, fullName: name, collegeEmail: mail, rollNumber: roll, phone: userPhone, phoneVerified: 1, emailVerified: 1, createdAt: now };
    } else {
      const name = fullName || user.fullName;
      const mail = cleanEmail || user.collegeEmail;
      const roll = rollNumber || user.rollNumber;
      const userPhone = normalizedPhone || user.phone;

      db.prepare('UPDATE users SET fullName = ?, collegeEmail = ?, rollNumber = ?, phone = ?, phoneVerified = 1, emailVerified = 1 WHERE id = ?')
        .run(name, mail, roll, userPhone, user.id);

      user.fullName = name;
      user.collegeEmail = mail;
      user.rollNumber = roll;
      user.phone = userPhone;
      user.phoneVerified = 1;
      user.emailVerified = 1;
    }

    const token = jwt.sign({ id: user.id, email: user.collegeEmail }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.collegeEmail,
        rollNumber: user.rollNumber,
        phone: user.phone,
        phoneVerified: 1,
        emailVerified: 1,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
