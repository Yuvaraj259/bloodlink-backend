const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const Donor = require('../models/Donor');
const { protect, hospitalOnly } = require('../middleware/auth');

// Get all approved hospitals (emergency dashboard)
router.get('/', async (req, res) => {
  try {
    const hospitals = await Hospital.find({ isApproved: true, isActive: true })
      .select('-password -email');
    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hospital profile
router.get('/profile', protect, hospitalOnly, async (req, res) => {
  res.json(req.user);
});

// Update hospital profile
router.put('/profile', protect, hospitalOnly, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    const hospital = await Hospital.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(hospital);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get donors registered by this hospital
router.get('/my-donors', protect, hospitalOnly, async (req, res) => {
  try {
    const donors = await Donor.find({ registeredByEntity: req.userId }).select('-password');
    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
