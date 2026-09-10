import { db, initializeDatabase } from './schema';

export function seedDatabase() {
  initializeDatabase();

  // Check if data already seeded
  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  if (userCount > 0) return;

  const now = new Date().toISOString();

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, fullName, collegeEmail, rollNumber, phone, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('u-1', 'Alex Johnson', 'alex.j@campus.edu', 'CB.EN.U4CYS21020', '9876543210', now);
  insertUser.run('u-2', 'Priya Nair', 'priya.n@campus.edu', 'CB.EN.U4ECE21088', '9876543211', now);
  insertUser.run('u-3', 'Rahul Sharma', 'rahul.s@campus.edu', 'CB.EN.U4CSE21105', '9876543212', now);

  // 2. Seed Found Items
  const insertFound = db.prepare(`
    INSERT INTO found_items (id, userId, itemName, category, brand, color, dateFound, timeFound, location, description, imageUrl, privateFinderNote, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFound.run(
    'F-101',
    'u-2',
    'Black Casio Calculator',
    'Electronics',
    'Casio',
    'Black',
    '2026-08-20',
    '14:30',
    'Library',
    'Black scientific calculator found on table 4 near the reference section.',
    '/avvp-image.jpeg',
    'Found under desk 4 with a sticker on the back',
    'active',
    now
  );

  insertFound.run(
    'F-102',
    'u-3',
    'Blue Water Bottle',
    'Accessories',
    'Milton',
    'Blue',
    '2026-08-22',
    '12:15',
    'Canteen',
    'Blue stainless steel water bottle found near canteen billing counter.',
    '',
    'Slight dent on the lid',
    'active',
    now
  );

  insertFound.run(
    'F-103',
    'u-2',
    'Student ID Card',
    'ID Cards',
    'Amrita',
    'White/Red',
    '2026-08-23',
    '09:00',
    'Main Block',
    'Amrita student ID card found in corridor near Room 204.',
    '',
    'Handed to Security Desk',
    'active',
    now
  );

  // 3. Seed Lost Items
  const insertLost = db.prepare(`
    INSERT INTO lost_items (id, userId, itemName, category, brand, color, dateLost, timeLost, location, description, imageUrl, privateVerificationDetail, status, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertLost.run(
    'L-201',
    'u-1',
    'Black Casio Calculator',
    'Electronics',
    'Casio',
    'Black',
    '2026-08-20',
    '14:00',
    'Library',
    'Black Casio fx-991EX calculator left near library study area.',
    '',
    'Has a small scratch on the bottom right corner.',
    'active',
    now
  );

  console.log('✅ Database successfully initialized and seeded with campus data.');
}
