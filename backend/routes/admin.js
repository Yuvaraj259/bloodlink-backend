const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');
const { protect, adminOnly } = require('../middleware/auth');

// ─── DASHBOARD STATS ────────────────────────────────────────────────────────
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalDonors, pendingDonors, totalHospitals, pendingHospitals, totalUsers, totalRequests, fulfilledRequests] = await Promise.all([
      Donor.countDocuments(),
      Donor.countDocuments({ isApproved: false }),
      Hospital.countDocuments(),
      Hospital.countDocuments({ isApproved: false }),
      User.countDocuments({ role: 'user' }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'fulfilled' }),
    ]);
    res.json({ totalDonors, pendingDonors, totalHospitals, pendingHospitals, totalUsers, totalRequests, fulfilledRequests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DONORS MANAGEMENT ──────────────────────────────────────────────────────
router.get('/donors', protect, adminOnly, async (req, res) => {
  try {
    const donors = await Donor.find().select('-password').sort({ createdAt: -1 });
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/donors/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const donor = await Donor.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true }).select('-password');
    res.json({ message: 'Donor approved', donor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/donors/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    await Donor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Donor rejected and removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/donors/:id', protect, adminOnly, async (req, res) => {
  try {
    await Donor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Donor deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── HOSPITALS MANAGEMENT ────────────────────────────────────────────────────
router.get('/hospitals', protect, adminOnly, async (req, res) => {
  try {
    const hospitals = await Hospital.find().select('-password').sort({ createdAt: -1 });
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/hospitals/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true }).select('-password');
    res.json({ message: 'Hospital approved', hospital });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/hospitals/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    await Hospital.findByIdAndDelete(req.params.id);
    res.json({ message: 'Hospital rejected' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── BLOOD REQUESTS ──────────────────────────────────────────────────────────
router.get('/requests', protect, adminOnly, async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate('requestedBy', 'name email')
      .populate('acceptedBy', 'name phone bloodGroup')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── USERS ───────────────────────────────────────────────────────────────────
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
