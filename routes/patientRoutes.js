import { Router } from 'express';
const router = Router();
import { getDashboardData, getAppointments, createAppointment,cancelAppointment, getPrescriptions, getMedicalRecords,getAllPatients } from '../controllers/patientController.js';
import { auth, authorize, checkRole } from '../middleware/authMiddleware.js';

router.get('/', auth, checkRole('doctor'), getAllPatients);
router.get('/dashboard', auth, getDashboardData);
router.get('/appointments', auth, getAppointments);
router.post('/appointments', auth, createAppointment);
router.delete('/appointments/:id', auth, cancelAppointment);
router.get('/prescriptions', auth, getPrescriptions);
router.get('/medical-records', auth, getMedicalRecords);

export default router;
