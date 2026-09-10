import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../database/schema';
import { MatchingService } from '../services/MatchingService';

// --- LOST ITEMS ---

export const getLostItems = (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const items = db.prepare('SELECT * FROM lost_items ORDER BY createdAt DESC').all() as any[];
    const sanitized = items.map(item => {
      const copy = { 
        ...item, 
        type: 'lost', 
        date: item.dateLost,
        title: item.itemName,
        imageUrl: item.imageUrl || '',
        image_path: item.imageUrl || ''
      };
      delete copy.privateVerificationDetail;
      return copy;
    });
    res.json({ success: true, data: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLostItemById = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const item = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(req.params.id) as any;
    if (!item) {
      res.status(404).json({ success: false, message: 'Lost report not found' });
      return;
    }

    const copy = { 
      ...item, 
      type: 'lost', 
      date: item.dateLost,
      title: item.itemName,
      imageUrl: item.imageUrl || '',
      image_path: item.imageUrl || ''
    };
    if (req.user?.id !== item.userId) {
      delete copy.privateVerificationDetail;
    }
    res.json({ success: true, data: copy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createLostItem = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || 'u-1';
    const { title, itemName, category, brand, color, date, dateLost, location, description, privateDetails } = req.body;

    let imageUrl = req.body.imageUrl || req.body.image_path || '';
    if (req.file) {
      imageUrl = `/uploads/items/${req.file.filename}`;
    }

    const itemTitle = title || itemName;
    const itemDate = date || dateLost || new Date().toISOString().split('T')[0];

    if (!itemTitle || !category || !location || !description) {
      res.status(400).json({ success: false, message: 'Title, category, location, and description are required.' });
      return;
    }

    const id = `LF-${Math.floor(Math.random() * 9000) + 1000}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO lost_items (id, userId, itemName, category, brand, color, dateLost, location, description, imageUrl, privateVerificationDetail, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      itemTitle,
      category,
      brand || '',
      color || '',
      itemDate,
      location,
      description,
      imageUrl,
      privateDetails || 'Standard verification detail',
      'active',
      createdAt
    );

    let matchExplanation = null;
    try {
      matchExplanation = await MatchingService.runMatchingPipeline(id);
    } catch (e) {
      console.error('Matching pipeline notice:', e);
    }

    res.status(201).json({
      success: true,
      data: {
        id,
        userId,
        title: itemTitle,
        itemName: itemTitle,
        category,
        location,
        imageUrl,
        image_path: imageUrl,
        date: itemDate,
        description,
        type: 'lost',
        status: 'active'
      },
      matchExplanation
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FOUND ITEMS ---

export const getFoundItems = (_req: AuthenticatedRequest, res: Response): void => {
  try {
    const items = db.prepare('SELECT * FROM found_items ORDER BY createdAt DESC').all() as any[];
    const sanitized = items.map(item => {
      const copy = { 
        ...item, 
        type: 'found', 
        date: item.dateFound,
        title: item.itemName,
        imageUrl: item.imageUrl || '',
        image_path: item.imageUrl || ''
      };
      delete copy.privateFinderNote;
      return copy;
    });
    res.json({ success: true, data: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getFoundItemById = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const item = db.prepare('SELECT * FROM found_items WHERE id = ?').get(req.params.id) as any;
    if (!item) {
      res.status(404).json({ success: false, message: 'Found report not found' });
      return;
    }

    const copy = { 
      ...item, 
      type: 'found', 
      date: item.dateFound,
      title: item.itemName,
      imageUrl: item.imageUrl || '',
      image_path: item.imageUrl || ''
    };
    if (req.user?.id !== item.userId) {
      delete copy.privateFinderNote;
    }
    res.json({ success: true, data: copy });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createFoundItem = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id || 'u-1';
    const { title, itemName, category, brand, color, date, dateFound, location, description, contactMethod } = req.body;

    let imageUrl = req.body.imageUrl || req.body.image_path || '';
    if (req.file) {
      imageUrl = `/uploads/items/${req.file.filename}`;
    }

    const itemTitle = title || itemName;
    const itemDate = date || dateFound || new Date().toISOString().split('T')[0];

    if (!itemTitle || !category || !location || !description) {
      res.status(400).json({ success: false, message: 'Title, category, location, and description are required.' });
      return;
    }

    const id = `LF-${Math.floor(Math.random() * 9000) + 1000}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO found_items (id, userId, itemName, category, brand, color, dateFound, location, description, imageUrl, privateFinderNote, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      userId,
      itemTitle,
      category,
      brand || '',
      color || '',
      itemDate,
      location,
      description,
      imageUrl,
      `Contact via ${contactMethod || 'in-app'}`,
      'active',
      createdAt
    );

    res.status(201).json({
      success: true,
      data: {
        id,
        userId,
        title: itemTitle,
        itemName: itemTitle,
        category,
        location,
        imageUrl,
        image_path: imageUrl,
        date: itemDate,
        description,
        type: 'found',
        status: 'active'
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
