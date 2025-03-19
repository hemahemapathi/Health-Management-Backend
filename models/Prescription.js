import { Schema, model } from 'mongoose';

const prescriptionSchema = new Schema({
  patient: {
    type: Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    duration: String,
    instructions: String
  }],
  diagnosis: String,
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  notes: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, { timestamps: true });

export default model('Prescription', prescriptionSchema);
