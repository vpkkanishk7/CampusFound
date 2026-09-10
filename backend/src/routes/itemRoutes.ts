import { Router } from 'express';
import { getLostItems, getLostItemById, createLostItem, getFoundItems, getFoundItemById, createFoundItem } from '../controllers/itemController';
import { authenticateToken } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = Router();

// Lost Items
router.get('/lost', authenticateToken, getLostItems);
router.get('/lost/:id', authenticateToken, getLostItemById);
router.post('/lost', authenticateToken, upload.single('image'), createLostItem);

// Found Items
router.get('/found', authenticateToken, getFoundItems);
router.get('/found/:id', authenticateToken, getFoundItemById);
router.post('/found', authenticateToken, upload.single('image'), createFoundItem);

export default router;
