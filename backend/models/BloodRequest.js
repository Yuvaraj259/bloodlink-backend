const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  hospitalName: String,
  message: String,
  urgency: { type: String, enum: ['critical', 'urgent', 'normal'], default: 'urgent' },
  location: {
    city: String,
    coordinates: { lat: Number, lng: Number },
  },
  userLocation: {
    lat: Number,
    lng: Number,
    address: String
  },
  status: { type: String, enum: ['pending', 'accepted', 'fulfilled', 'cancelled'], default: 'pending' },
  notifiedDonors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donor' }],
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
  acceptedAt: Date,
  donorLocation: { lat: Number, lng: Number },
  fulfilledAt: Date,
  declinedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Donor' }],
}, { timestamps: true });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
