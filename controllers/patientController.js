import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';

export async function createAppointment(req, res) {
    try {
      const { doctorId, dateTime, reason } = req.body;
      const patientId = req.user.userId;
      
      // First find the doctor document
      const doctor = await Doctor.findOne({ user: doctorId });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }
  
      // Create appointment with doctor's _id
      const appointment = await Appointment.create({
        patient: patientId,
        doctor: doctor._id,
        dateTime,
        reason,
        status: 'scheduled'
      });
  
      // Populate doctor details
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('doctor', 'name specialization');
  
      res.status(201).json({
        success: true,
        data: populatedAppointment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating appointment',
        error: error.message
      });
    }
  }
  export async function getDashboardData(req, res) {
    try {
      const patientId = req.user.userId;
  
      // Get all appointments including past ones
      const appointments = await Appointment.find({
        patient: patientId
      })
      .populate('doctor', 'name specialization')
      .sort({ dateTime: 1 });
  
      // Get all prescriptions
      const prescriptions = await Prescription.find({
        patient: patientId
      })
      .populate('doctor', 'name')
      .sort({ createdAt: -1 });
  
      res.json({
        success: true,
        data: {
          appointments,
          prescriptions,
          stats: {
            appointmentsCount: appointments.length,
            prescriptionsCount: prescriptions.length,
            upcomingAppointments: appointments.filter(apt => apt.status === 'scheduled').length
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data',
        error: error.message
      });
    }
  }
  export async function getAppointments(req, res) {
    try {
      const appointments = await Appointment.find({
        patient: req.user.userId
      })
      .populate('doctor', 'name specialization')
      .sort({ dateTime: -1 });
  
      res.json({ 
        success: true, 
        data: appointments 
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching appointments',
        error: error.message
      });
    }
  }
  export async function cancelAppointment(req, res) {
    try {
      const appointment = await Appointment.findOneAndUpdate(
        {
          _id: req.params.id,
          patient: req.user.userId,
          status: 'scheduled'
        },
        { status: 'cancelled' },
        { new: true }
      ).populate('doctor', 'name specialization');
  
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found or already cancelled'
        });
      }
  
      res.json({
        success: true,
        data: appointment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cancelling appointment',
        error: error.message
      });
    }
  }
  export async function getMedicalRecords(req, res) {
    try {
      const patient = await Patient.findOne({ user: req.user.userId })
        .populate('medicalRecords.doctor', 'name specialization');
  
      res.json({
        success: true,
        data: patient.medicalRecords
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching medical records',
        error: error.message
      });
    }
  }
  
  export async function getPrescriptions(req, res) {
    try {
      const prescriptions = await Prescription.find({
        patient: req.user.userId
      })
      .populate('doctor', 'name specialization')
      .populate('medications')
      .sort({ createdAt: -1 });
  
      res.json({
        success: true,
        data: prescriptions,
        count: prescriptions.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching prescriptions',
        error: error.message
      });
    }
  }
  // Add this function to your patientController.js
export async function getAllPatients(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Number of patients per page
    const skip = (page - 1) * limit;
    const filter = req.query.filter || 'all';
    
    let query = {};
    
    // Apply filters if needed
    if (filter === 'recent') {
      // For recent patients, sort by creation date
      query = {};
    } else if (filter === 'appointments') {
      // For patients with upcoming appointments, you would need to join with appointments
      // This is a simplified version
      query = {};
    }
    
    // Find patients with pagination
    const patients = await Patient.find(query)
      .populate('user', 'name email profilePicture')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Count total patients for pagination
    const total = await Patient.countDocuments(query);
    
    res.json({
      success: true,
      data: patients,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching patients',
      error: error.message
    });
  }
};


  
    