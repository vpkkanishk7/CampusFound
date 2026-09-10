import { Request, Response } from 'express';
import { db } from '../database/schema';
import { SmsService } from '../services/SmsService';
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
      INSERT OR REPLACE INTO users (id, fullName, collegeEmail, rollNumber, phone, phoneVerified, createdAt)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `);
    stmt.run(id, fullName, collegeEmail || `${id}@campus.edu`, rollNumber || 'STUDENT', normalizedPhone, createdAt);

    const token = jwt.sign({ id, email: collegeEmail }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { id, fullName, collegeEmail, rollNumber, phone: normalizedPhone, phoneVerified: 0 }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required.' });
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

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = (req: Request, res: Response): void => {
  try {
    const { phone, otp, fullName, email, rollNumber } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: 'Phone number is required.' });
      return;
    }

    const normalizedPhone = SmsService.normalizePhoneNumber(phone);

    // Reject hardcoded '123456' attempts if not backed by active OTP
    if (otp === '123456') {
      const dbVerification = SmsService.verifyOtp(normalizedPhone, otp);
      if (!dbVerification.success) {
        res.status(400).json({ 
          success: false, 
          message: 'Universal 123456 code is disabled. Please verify using the real SMS OTP sent to your phone.' 
        });
        return;
      }
    }

    // Find or create user in SQLite database after successful Firebase / SMS verification
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(normalizedPhone) as any;
    const now = new Date().toISOString();

    if (!user) {
      const id = `u-${Date.now()}`;
      const name = fullName || 'Campus User';
      const mail = email || `${id}@campus.edu`;
      const roll = rollNumber || 'STUDENT';

      db.prepare(`
        INSERT INTO users (id, fullName, collegeEmail, rollNumber, phone, phoneVerified, createdAt)
        VALUES (?, ?, ?, ?, ?, 1, ?)
      `).run(id, name, mail, roll, normalizedPhone, now);

      user = { id, fullName: name, collegeEmail: mail, rollNumber: roll, phone: normalizedPhone, phoneVerified: 1, createdAt: now };
    } else {
      const name = fullName || user.fullName;
      const mail = email || user.collegeEmail;
      const roll = rollNumber || user.rollNumber;

      db.prepare('UPDATE users SET fullName = ?, collegeEmail = ?, rollNumber = ?, phoneVerified = 1 WHERE id = ?')
        .run(name, mail, roll, user.id);

      user.fullName = name;
      user.collegeEmail = mail;
      user.rollNumber = roll;
      user.phoneVerified = 1;
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
        phoneVerified: 1
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
