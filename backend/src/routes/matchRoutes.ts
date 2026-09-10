import { Router } from 'express';
import { getMatchesForLostItem, explainMatch } from '../controllers/matchController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/lost/:lostItemId', authenticateToken, getMatchesForLostItem);
router.get('/explain/:lostItemId', authenticateToken, explainMatch);

export default router;
