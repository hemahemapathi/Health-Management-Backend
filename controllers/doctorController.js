import Doctor from '../models/Doctor.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js'

// Get all doctors with pagination
export const getAllDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const specialization = req.query.specialization;
    
    let query = {};
    if (specialization) {
      query.specialization = specialization;
    }
    
    const doctors = await Doctor.find(query)
      .populate('user', 'name email profilePicture')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
      
    const total = await Doctor.countDocuments(query);
    
    res.status(200).json({
      doctors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor by ID
export const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(id)
      .populate('user', 'name email profilePicture')
      .populate('ratings.patient', 'name');
      
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor by user ID
export const getDoctorByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const doctor = await Doctor.findOne({ user: userId })
      .populate('user', 'name email profilePicture')
      .populate('ratings.patient', 'name');
      
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Update doctor profile
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if the logged-in user is the doctor or an admin
    // First, try to get the user ID from various possible properties in the token
    const userId = req.user.id || req.user._id || req.user.userId || req.user.sub;
    
    // If we're updating a doctor profile and the user is a doctor, allow it
    // This assumes that doctors can only update their own profile
    if (req.user.role === 'doctor' && doctor._id.toString() === id) {
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      ).populate('user', 'name email profilePicture');
      
      return res.status(200).json(updatedDoctor);
    }
    
    // If user ID is available, check if it matches the doctor's user ID
    if (userId && userId === doctor.user.toString()) {
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      ).populate('user', 'name email profilePicture');
      
      return res.status(200).json(updatedDoctor);
    }
    
    // If user is admin, allow the update
    if (req.user.role === 'admin') {
      const updatedDoctor = await Doctor.findByIdAndUpdate(
        id,
        { $set: updates },
        { new: true }
      ).populate('user', 'name email profilePicture');
      
      return res.status(200).json(updatedDoctor);
    }
    
    // If none of the above conditions are met, deny access
    return res.status(403).json({ message: 'Not authorized to update this profile' });
    
  } catch (error) {
    console.error("Error in updateDoctor:", error);
    res.status(500).json({ message: error.message });
  }
};



// Delete doctor profile
export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if the logged-in user is the doctor or an admin
    if (req.user.id !== doctor.user.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this profile' });
    }
    
    await Doctor.findByIdAndDelete(id);
    
    // Update user role if needed
    await User.findByIdAndUpdate(doctor.user, { role: 'user' });
    
    res.status(200).json({ message: 'Doctor profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add rating and review
export const addRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { patientId, rating, review } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Check if patient has already rated this doctor
    const existingRating = doctor.ratings.find(
      r => r.patient.toString() === patientId
    );
    
    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.review = review;
      existingRating.date = new Date();
    } else {
      // Add new rating
      doctor.ratings.push({
        patient: patientId,
        rating,
        review,
        date: new Date()
      });
    }
    
    await doctor.save();
    
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get doctor's availability
export const getDoctorAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    res.status(200).json(doctor.availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update doctor's availability
export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { availability } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // First, try to get the user ID from various possible properties in the token
    const userId = req.user.id || req.user._id || req.user.userId || req.user.sub;
    
    // If we're updating availability and the user is a doctor, allow it
    // This assumes that doctors can only update their own availability
    if (req.user.role === 'doctor' && doctor._id.toString() === id) {
      doctor.availability = availability;
      await doctor.save();
      return res.status(200).json(doctor);
    }
    
    // If user ID is available, check if it matches the doctor's user ID
    if (userId && userId === doctor.user.toString()) {
      doctor.availability = availability;
      await doctor.save();
      return res.status(200).json(doctor);
    }
    
    // If user is admin, allow the update
    if (req.user.role === 'admin') {
      doctor.availability = availability;
      await doctor.save();
      return res.status(200).json(doctor);
    }
    
    // If none of the above conditions are met, deny access
    return res.status(403).json({ message: 'Not authorized to update availability' });
    
  } catch (error) {
    console.error("Error in updateAvailability:", error);
    res.status(500).json({ message: error.message });
  }
};


// Get doctor dashboard stats
export const getDoctorStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }
    
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Calculate average rating
    let averageRating = 0;
    if (doctor.ratings.length > 0) {
      const totalRating = doctor.ratings.reduce((sum, item) => sum + item.rating, 0);
      averageRating = totalRating / doctor.ratings.length;
    }
    
    // Get recent reviews
    const recentReviews = doctor.ratings
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);
    
    // You would typically get appointment stats from your Appointment model
    // This is a placeholder
    const stats = {
      averageRating,
      totalReviews: doctor.ratings.length,
      recentReviews,
      // Add more stats as needed
    };
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specializations list
export const getSpecializations = async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization');
    res.status(200).json(specializations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export async function getDoctorDashboard(req, res) {
  try {
    // Get the user ID from the authenticated user
    const userId = req.user.id || req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    
    // Find the doctor document associated with this user
    // Note: We're not validating userId as an ObjectId because it's coming from the token
    const doctor = await Doctor.findOne({ user: userId })
      .populate('user', 'name email')
      .select('specialization qualifications experience consultationFee availability ratings');
    
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found for this user" });
    }
    
    // Get total appointments
    const totalAppointments = await Appointment.countDocuments({ doctor: doctor._id });
    
    // Calculate average rating
    let averageRating = 0;
    if (doctor.ratings && doctor.ratings.length > 0) {
      const totalRating = doctor.ratings.reduce((sum, item) => sum + item.rating, 0);
      averageRating = (totalRating / doctor.ratings.length).toFixed(1);
    }
    
    // For now, return mock data for other stats
    const dashboardData = {
      doctor,
      stats: {
        totalPatients: 24,
        upcomingAppointments: 8,
        completedAppointments: 156,
        pendingPrescriptions: 3,
        totalAppointments,
        averageRating: averageRating || 'No ratings yet'
      },
      recentAppointments: [
        { id: 1, patientName: 'John Doe', date: '2023-08-15', time: '10:00 AM', status: 'Confirmed' },
        { id: 2, patientName: 'Jane Smith', date: '2023-08-16', time: '2:30 PM', status: 'Pending' },
        { id: 3, patientName: 'Robert Johnson', date: '2023-08-17', time: '11:15 AM', status: 'Confirmed' }
      ]
    };
    
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error in getDoctorDashboard:", error);
    res.status(500).json({ message: error.message });
  }
}

export const getDoctorProfile = async (req, res) => {
  try {
    // Get the user ID from the authenticated user
    const userId = req.user.id || req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    
    // Find the doctor document associated with this user
    // Note: We're not validating userId as an ObjectId because it's coming from the token
    const doctor = await Doctor.findOne({ user: userId })
      .populate('user', 'name email profilePicture')
      .populate('ratings.patient', 'name');
      
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found for this user' });
    }
    
    res.status(200).json(doctor);
  } catch (error) {
    console.error("Error in getDoctorProfile:", error);
    res.status(500).json({ message: error.message });
  }
};


