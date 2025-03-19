import { Router } from 'express';
const router = Router();
import { login, register, logout, refreshToken, getUserProfile } from '../controllers/authController.js';
import { auth } from '../middleware/authMiddleware.js';

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/profile', auth, getUserProfile);
router.get('/verify', auth, (req, res) => {
  res.json({ success: true, user: req.user });
});

export default router;