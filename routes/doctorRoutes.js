import express from 'express';
import {
  getAllDoctors,
  getDoctorById,
  getDoctorByUserId,
  updateDoctor,
  deleteDoctor,
  addRating,
  getDoctorAvailability,
  updateAvailability,
  getDoctorStats,
  getSpecializations,
  getDoctorDashboard,
  getDoctorProfile
} from '../controllers/doctorController.js';
import { auth, checkRole, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getAllDoctors);
router.get('/specializations', getSpecializations);

// Protected routes - Note the order is important!
// Routes with specific paths should come before routes with parameters
router.get('/dashboard', auth, checkRole('doctor'), getDoctorDashboard);
router.get('/profile', auth, checkRole('doctor'), getDoctorProfile);

// Routes with parameters
router.get('/:id', getDoctorById);
router.get('/user/:userId', getDoctorByUserId);
router.get('/:id/availability', getDoctorAvailability);
router.put('/:id', auth, updateDoctor);
router.delete('/:id', auth, deleteDoctor);
router.post('/:id/ratings', auth, addRating);
router.put('/:id/availability', auth, checkRole('doctor'), updateAvailability);
router.get('/:id/stats', auth, checkRole('doctor'), getDoctorStats);

// Admin routes
router.get('/admin/all', auth, checkRole('admin'), getAllDoctors);

// Routes that can be accessed by multiple roles
router.get('/dashboard/overview', auth, authorize('doctor', 'admin'), getDoctorStats);

export default router;
