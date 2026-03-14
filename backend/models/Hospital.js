const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  type: { type: String, enum: ['hospital', 'bootcamp'], required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  pincode: String,
  coordinates: { lat: Number, lng: Number },
  licenseNumber: String,
  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  logo: String,
  contactPerson: String,
  website: String,
}, { timestamps: true });

hospitalSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

hospitalSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Hospital', hospitalSchema);
