import Database from 'better-sqlite3';
import path from 'path';

// Primary Single SQLite Database File
export const DB_PATH = path.resolve(__dirname, '../../campus_find.db');

console.log(`=======================================================`);
console.log(`📌 PRIMARY DATABASE LOCATION: ${DB_PATH}`);
console.log(`=======================================================`);

export const db = new Database(DB_PATH);

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      collegeEmail TEXT NOT NULL UNIQUE,
      rollNumber TEXT NOT NULL,
      phone TEXT NOT NULL,
      phoneVerified INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lost_items (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      itemName TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      color TEXT,
      dateLost TEXT NOT NULL,
      timeLost TEXT,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      imageUrl TEXT,
      privateVerificationDetail TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS found_items (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      itemName TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT,
      color TEXT,
      dateFound TEXT NOT NULL,
      timeFound TEXT,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      imageUrl TEXT,
      privateFinderNote TEXT,
      status TEXT DEFAULT 'active',
      createdAt TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      lostItemId TEXT NOT NULL,
      foundItemId TEXT NOT NULL,
      matchScore REAL NOT NULL,
      reasons TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS claims (
      id TEXT PRIMARY KEY,
      matchId TEXT NOT NULL,
      claimantId TEXT NOT NULL,
      submittedDetail TEXT NOT NULL,
      verificationStatus TEXT DEFAULT 'pending',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contact_requests (
      id TEXT PRIMARY KEY,
      matchId TEXT NOT NULL,
      requesterId TEXT NOT NULL,
      finderId TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      isRead INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      otpHash TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      verified INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);

  // Migration check: Ensure phoneVerified column exists on existing users table
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
    const hasPhoneVerified = tableInfo.some(col => col.name === 'phoneVerified');
    if (!hasPhoneVerified) {
      db.exec("ALTER TABLE users ADD COLUMN phoneVerified INTEGER DEFAULT 0");
    }
  } catch (err) {
    console.error('Migration warning (phoneVerified):', err);
  }
}
