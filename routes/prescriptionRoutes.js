import { Router } from 'express';
const router = Router();
import { getPatientDetails,getAllPatients,createPrescription, getPrescriptionById, updatePrescription, deletePrescription } from '../controllers/prescriptionController.js';
import { auth , checkRole} from '../middleware/authMiddleware.js';

router.get('/patient-details', auth, getPatientDetails);
router.get('/', auth, getAllPatients);
router.post('/', auth, checkRole('doctor'), createPrescription);
router.get('/:id', auth, getPrescriptionById);
router.put('/:id', auth, checkRole('doctor'), updatePrescription);
router.delete('/:id', auth, checkRole('doctor'), deletePrescription);

export default router;
