import Prescription from '../models/Prescription.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import Doctor from '../models/Doctor.js';

export async function getPatientDetails(req, res) {
  try {
    const patient = await Patient.findOne({ user: req.user.userId })
      .populate({
        path: 'user',
        select: 'name email'
      });
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: patient._id,
        name: patient.user.name,
        email: patient.user.email,
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        medicalHistory: patient.medicalHistory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patient details',
      error: error.message
    });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('user', 'name email');
    
    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
};

export const createPrescription = async (req, res) => {
  try {
    // First find the patient document using the Patient model
    let patient = await Patient.findOne({ user: req.body.patientId });
    console.log("Looking up patient with user ID:", req.body.patientId);
    
    if (!patient) {
      // Try finding by direct Patient ID
      const patientById = await Patient.findById(req.body.patientId);
      if (!patientById) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }
      patient = patientById;
    }

    // Find the doctor document
    const doctor = await Doctor.findOne({ user: req.user.userId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const prescription = await Prescription.create({
      patient: patient._id,
      doctor: doctor._id,
      medications: req.body.medications,
      diagnosis: req.body.diagnosis,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      notes: req.body.notes,
      status: 'active'
    });

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name dateOfBirth');

    res.status(201).json({
      success: true,
      data: populatedPrescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating prescription',
      error: error.message
    });
  }
};

export const getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    const populatedPrescription = await Prescription.findById(req.params.id)
      .populate({
        path: 'doctor',
        select: '_id user specialization',
        populate: {
          path: 'user',
          select: 'name email'
        }
      })
      .populate({
        path: 'patient',
        select: '_id user dateOfBirth',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    if (!populatedPrescription.doctor?.user || !populatedPrescription.patient?.user) {
      return res.status(404).json({
        success: false,
        message: 'Associated doctor or patient not found'
      });
    }

    res.json({
      success: true,
      data: populatedPrescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching prescription',
      error: error.message
    });
  }
};


export async function updatePrescription(req, res) {
  try {
    const prescription = await Prescription.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: prescription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating prescription',
      error: error.message
    });
  }
};

export async function deletePrescription(req, res) {
  try {
    await Prescription.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting prescription',
      error: error.message
    });
  }
};