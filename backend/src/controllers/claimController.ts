import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { db } from '../database/schema';
import { CustomQueue } from '../dataStructures/Queue';
import { StringMatcher } from '../algorithms/StringMatcher';

// Global FIFO Claim Request Queue
const claimQueue = new CustomQueue<any>();

export const submitClaim = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const claimantId = req.user?.id || 'u-1';
    const { matchId, lostItemId, foundItemId, submittedDetail } = req.body;

    if (!submittedDetail) {
      res.status(400).json({ success: false, message: 'Private verification detail is required.' });
      return;
    }

    let verified = false;

    if (foundItemId) {
      // Direct claim on a found item
      const foundItem = db.prepare('SELECT * FROM found_items WHERE id = ?').get(foundItemId) as any;
      if (foundItem && foundItem.privateFinderNote) {
        const similarity = StringMatcher.calculateSimilarity(submittedDetail, foundItem.privateFinderNote);
        verified = similarity >= 0.4 || foundItem.privateFinderNote.toLowerCase().includes(submittedDetail.toLowerCase()) || submittedDetail.toLowerCase().includes(foundItem.privateFinderNote.toLowerCase());
      } else {
        verified = true; // Fallback if no private note exists
      }
    } else if (lostItemId) {
      // Match-based claim using lost item details
      const lostItem = db.prepare('SELECT * FROM lost_items WHERE id = ?').get(lostItemId) as any;
      if (lostItem && lostItem.privateVerificationDetail) {
        const similarity = StringMatcher.calculateSimilarity(submittedDetail, lostItem.privateVerificationDetail);
        verified = similarity >= 0.4 || lostItem.privateVerificationDetail.toLowerCase().includes(submittedDetail.toLowerCase());
      } else {
        verified = true; // Fallback verification
      }
    }

    const claimId = `claim-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO claims (id, matchId, claimantId, submittedDetail, verificationStatus, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(claimId, matchId || `m-${lostItemId || foundItemId}`, claimantId, submittedDetail, verified ? 'verified' : 'rejected', createdAt);

    // Enqueue claim request into FIFO Queue
    claimQueue.enqueue({ claimId, claimantId, verified, createdAt });

    res.json({
      success: true,
      verified,
      message: verified
        ? 'Ownership verified by backend! Contact request created.'
        : 'Verification failed. Submitted details did not match stored private records.',
      queuePosition: claimQueue.size()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestContact = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const requesterId = req.user?.id || 'u-1';
    const { matchId, finderId } = req.body;

    const id = `req-${Date.now()}`;
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO contact_requests (id, matchId, requesterId, finderId, status, createdAt)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(id, matchId, requesterId, finderId || 'u-2', createdAt);

    // Send Notification to Finder
    db.prepare(`
      INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
      VALUES (?, ?, ?, ?, 'claim_request', 0, ?)
    `).run(`n-${Date.now()}`, finderId || 'u-2', 'New Contact Request', 'A student has verified ownership of your found item and requested contact info.', createdAt);

    res.json({ success: true, message: 'Contact request sent to finder for authorization.', requestId: id });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approveContactRequest = (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE contact_requests SET status = "approved" WHERE id = ?').run(id);

    const request = db.prepare('SELECT * FROM contact_requests WHERE id = ?').get(id) as any;
    if (request) {
      const finder = db.prepare('SELECT phone, collegeEmail FROM users WHERE id = ?').get(request.finderId) as any;
      res.json({
        success: true,
        status: 'approved',
        message: 'Contact request approved. Phone and email shared with claimant.',
        contactInfo: finder || { phone: '9876543211', collegeEmail: 'finder@campus.edu' }
      });
      return;
    }
    res.json({ success: true, status: 'approved' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
