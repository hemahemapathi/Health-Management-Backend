import Appointment from '../models/Appointment.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import mongoose from 'mongoose';

// Get all appointments for a patient
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;

    const appointments = await Appointment.find({ 'patient._id': patientId })
      .populate('doctor', 'name specialization')
      .sort({ dateTime: -1 });

    res.status(200).json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

// Get all appointments for a doctor
export const getDoctorAppointments = async (req, res) => {
    try {
      const doctorId = req.user.id;
  
      const appointments = await Appointment.find({ doctor: doctorId })
        .populate('patient', 'name email phone')
        .sort({ dateTime: -1 });
  
      res.status(200).json({
        success: true,
        data: appointments
      });
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        error: error.message
      });
    }
};
  

// Get a specific appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findById(id)
    .populate('doctor', 'name specialization email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment details',
      error: error.message
    });
  }
};

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const { doctorId, dateTime, reason, patientId: bodyPatientId } = req.body;
    const patientId = req.user?.id || bodyPatientId;

    console.log('Received data:', { doctorId, dateTime, reason, patientId });
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);

    // Validate patient exists
    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required. Please ensure you are logged in.'
      });
    }

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Validate dateTime
    if (!dateTime) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
      });
    }

    // Parse the date
    let appointmentDate;
    try {
      appointmentDate = new Date(dateTime);
      if (isNaN(appointmentDate.getTime())) {
        throw new Error('Invalid date');
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format',
        error: error.message
      });
    }

    // Create new appointment with explicit values
    const appointmentData = {
      patient: patientId,
      doctor: doctorId,
      dateTime: appointmentDate,
      reason: reason || 'General checkup',
      status: 'scheduled'
    };

    console.log('Creating appointment with data:', appointmentData);

    const appointment = new Appointment(appointmentData);

    await appointment.save();

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
};


// Cancel an appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID'
      });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      patient: patientId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if appointment is already completed
    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment'
      });
    }

    // Check if appointment is already cancelled
    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    // Check if appointment is in the past
    if (new Date(appointment.dateTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a past appointment'
      });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
      error: error.message
    });
  }
};

// Get available time slots for a doctor on a specific date
export const getAvailableSlots = async (req, res) => {
  try {
    const { id } = req.params; // doctorId
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    // Validate doctor exists
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Generate all possible time slots (9 AM to 5 PM, 30-minute intervals)
    const allTimeSlots = [];
    const startHour = 9;
    const endHour = 17;
    
    for (let hour = startHour; hour < endHour; hour++) {
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allTimeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Get booked slots for the doctor on the specified date
    const selectedDate = new Date(date);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookedAppointments = await Appointment.find({
      doctor: id,
      dateTime: {
        $gte: selectedDate,
        $lt: nextDay
      },
      status: 'scheduled'
    });

    // Extract booked time slots
    const bookedTimeSlots = bookedAppointments.map(appointment => {
      const appointmentTime = new Date(appointment.dateTime);
      return `${appointmentTime.getHours().toString().padStart(2, '0')}:${appointmentTime.getMinutes().toString().padStart(2, '0')}`;
    });

    // Filter out booked slots
    const availableTimeSlots = allTimeSlots.filter(
      slot => !bookedTimeSlots.includes(slot)
    );

    res.status(200).json({
      success: true,
      data: availableTimeSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots',
      error: error.message
    });
  }
};



// Update appointment status (for doctors to mark as completed)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const doctorId = req.user.id;

    if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const appointment = await Appointment.findOne({
      _id: id,
      doctor: doctorId
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    if (notes) {
      appointment.notes = notes;
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
};
