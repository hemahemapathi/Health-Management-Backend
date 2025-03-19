import express from 'express';
import { 
  getPatientAppointments,
  getAppointmentById,
  getAvailableSlots,
  getDoctorAppointments,
  updateAppointmentStatus,
  createAppointment 
} from '../controllers/appointmentController.js';
import { auth, checkRole, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();



// Patient routes
router.get('/patients/appointments', auth, checkRole('patient'), getPatientAppointments);
router.get('/patients/appointments/:id', auth, checkRole('patient'), getAppointmentById);
router.post('/patients/appointments', auth, checkRole('patient'), createAppointment);

// Doctor routes
router.get('/doctors/appointments', auth, checkRole('doctor'), getDoctorAppointments);
router.patch('/doctors/appointments/:id', auth, checkRole('doctor'), updateAppointmentStatus);

// Available slots route - accessible by both patients and doctors
router.get('/doctors/:id/available-slots', auth, authorize('patient', 'doctor'), getAvailableSlots);

export default router;
