import { Router } from 'express';
import { submitClaim, requestContact, approveContactRequest } from '../controllers/claimController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.post('/claims', authenticateToken, submitClaim);
router.post('/contact-requests', authenticateToken, requestContact);
router.put('/contact-requests/:id/approve', authenticateToken, approveContactRequest);

export default router;
