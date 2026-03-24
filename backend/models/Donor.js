const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const donorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  bloodGroup: { type: String, required: true, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male','Female','Other'] },
  location: {
    city: { type: String, required: true },
    state: String,
    address: String,
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  isAvailable: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false },     // Admin approval
  isHidden: { type: Boolean, default: false },        // Hidden after donation (3 months)
  hiddenUntil: { type: Date },                        // When to show again
  registeredBy: { type: String, enum: ['self', 'hospital', 'bootcamp'], default: 'self' },
  registeredByEntity: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  donationHistory: [{
    date: { type: Date, default: Date.now },
    hospitalName: String,
    certificateUrl: String,
    registeredByType: { type: String, enum: ['hospital', 'bootcamp', 'self'] },
  }],
  lastDonationDate: Date,
  healthCertificateUrl: String,   // Reference to the uploaded health certificate
  privacyLevel: { type: String, enum: ['public', 'private'], default: 'private' },
}, { timestamps: true });

donorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

donorSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Donor', donorSchema);
