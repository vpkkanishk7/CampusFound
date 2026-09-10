import { Router } from 'express';
import { register, sendOtp, verifyOtp } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

export default router;
