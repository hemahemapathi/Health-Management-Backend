import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const { sign, verify } = jwt;

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }
    
    // Determine role based on email domain
    let role;
    if (email.endsWith('@patients.com')) {
      role = 'patient';
    } else if (email.endsWith('@doctors.com')) {
      role = 'doctor';
    } else if (email.endsWith('@admin.com')) {
      role = 'admin';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid email domain. Use @patients.com, @doctors.com, or @admin.com'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create the user
    const user = new User({
      name,
      email,
      password, // This will be hashed by the pre-save hook in the User model
      role
    });
    
    await user.save();
    console.log(`User created with ID: ${user._id}`);

    // Create corresponding role-specific document with default values
    try {
      if (role === 'doctor') {
        const doctorData = {
          user: user._id,
          specialization: req.body.specialization || 'General Practice',
          qualifications: req.body.qualifications || ['MD'],
          experience: req.body.experience || 0,
          consultationFee: req.body.consultationFee || 50,
          availability: [
            {
              day: "Monday",
              startTime: "09:00",
              endTime: "17:00"
            },
            {
              day: "Tuesday",
              startTime: "09:00",
              endTime: "17:00"
            },
            {
              day: "Wednesday",
              startTime: "09:00",
              endTime: "17:00"
            }
          ],
          ratings: []
        };
        
        console.log('Creating doctor profile with data:', doctorData);
        const doctor = await Doctor.create(doctorData);
        console.log(`Doctor profile created with ID: ${doctor._id}`);
      } else if (role === 'patient') {
        const patientData = {
          user: user._id,
          dateOfBirth: req.body.dateOfBirth || new Date(),
          bloodGroup: req.body.bloodGroup || 'Not Specified',
          allergies: ['No known allergies'],
          medicalHistory: [{
            condition: 'General Health',
            diagnosedDate: new Date(),
            notes: 'Initial health record'
          }]
        };
        
        console.log('Creating patient profile with data:', patientData);
        const patient = await Patient.create(patientData);
        console.log(`Patient profile created with ID: ${patient._id}`);
      }
    } catch (profileError) {
      // If creating the profile fails, delete the user to maintain data integrity
      console.error('Error creating profile:', profileError);
      await User.findByIdAndDelete(user._id);
      throw new Error(`Failed to create ${role} profile: ${profileError.message}`);
    }

    // Generate token for the new user
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
}


export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Determine role based on email domain
    let role;
    if (email.endsWith('@patients.com')) {
      role = 'patient';
    } else if (email.endsWith('@doctors.com')) {
      role = 'doctor';
    } else if (email.endsWith('@admin.com')) {
      role = 'admin';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid email domain. Use @patients.com, @doctors.com, or @admin.com'
      });
    }

    // Find user by email only first
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - User not found'
      });
    }
    
    // Check if role matches
    if (user.role !== role) {
      return res.status(401).json({
        success: false,
        message: `Invalid credentials - Email domain doesn't match user role`
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials - Password incorrect'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
}


export async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    
    const decoded = verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    
    const accessToken = sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    res.status(200).json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
}

export async function logout(req, res) {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
}



export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID not found in token" });
    }
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If the user is a doctor, get the doctor ID
    let doctorId = null;
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: userId });
      if (doctor) {
        doctorId = doctor._id;
      }
    }
    
    // If the user is a patient, get the patient ID
    let patientId = null;
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (patient) {
        patientId = patient._id;
      }
    }
    
    res.status(200).json({
      ...user.toObject(),
      doctorId,
      patientId
    });
  } catch (error) {
    console.error("Error in getUserProfile:", error);
    res.status(500).json({ message: error.message });
  }
};
