import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateOfBirth: Date,
  bloodGroup: String,
  allergies: [String],
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],

  medicalRecords: [{
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    diagnosis: String,
    Treatment: String,
    prescription: String,
    notes: String,
    attachments: [String],
    date:{
        type:Date,
        default:Date.now
    }
  }],
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  }
}, { timestamps: true });

export default mongoose.model('Patient', patientSchema);
