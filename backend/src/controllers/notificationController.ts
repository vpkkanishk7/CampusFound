import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../database/schema';

export const getNotifications = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const userId = req.user?.id || 'u-1';
    const notifications = db.prepare('SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC').all(userId) as any[];
    res.json({
      success: true,
      data: notifications.map(n => ({
        ...n,
        isRead: Boolean(n.isRead)
      }))
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotificationRead = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ?').run(id);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
