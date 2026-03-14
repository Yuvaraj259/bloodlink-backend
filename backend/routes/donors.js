const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const { protect, adminOnly, hospitalOnly } = require('../middleware/auth');

// Search donors by blood group + city (within radius) - public
router.get('/search', async (req, res) => {
  try {
    const { bloodGroup, city, lat, lng } = req.query;
    const query = { isAvailable: true, isHidden: false };
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (city) query['location.city'] = { $regex: city, $options: 'i' };

    let donors = await Donor.find(query).select('name bloodGroup location.city isAvailable donationHistory gender age registeredBy');

    // Filter by ~10km radius if coords provided
    if (lat && lng) {
      const R = 6371;
      donors = donors.filter(d => {
        const dLat = d.location?.coordinates?.lat;
        const dLng = d.location?.coordinates?.lng;
        if (!dLat || !dLng) return true; // include if no coords
        const dR = (dLat - parseFloat(lat)) * Math.PI / 180;
        const dRLng = (dLng - parseFloat(lng)) * Math.PI / 180;
        const a = Math.sin(dR / 2) ** 2 + Math.cos(parseFloat(lat) * Math.PI / 180) * Math.cos(dLat * Math.PI / 180) * Math.sin(dRLng / 2) ** 2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return dist <= 10;
      });
    }

    res.json(donors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get donor details (requires contact permission request flow)
router.get('/:id/details', protect, async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).select('-password -email');
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get donor contact info (after permission granted)
router.get('/:id/contact', protect, async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).select('name phone email location bloodGroup');
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Donor profile (self)
router.get('/profile', protect, async (req, res) => {
  try {
    if (req.userType !== 'donor') return res.status(403).json({ message: 'Donor only' });
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update donor profile
router.put('/profile', protect, async (req, res) => {
  try {
    if (req.userType !== 'donor') return res.status(403).json({ message: 'Donor only' });
    const updates = req.body;
    delete updates.password;
    const donor = await Donor.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Hospital/bootcamp registers a donor
router.post('/register-by-entity', protect, hospitalOnly, async (req, res) => {
  try {
    const { name, email, phone, bloodGroup, age, gender, location } = req.body;
    const existing = await Donor.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Donor already registered' });
    const donor = await Donor.create({
      name, email, phone, bloodGroup, age, gender, location,
      registeredBy: req.user.type,
      registeredByEntity: req.userId,
      isApproved: true, // auto-approved if registered by hospital
      password: Math.random().toString(36).slice(-8), // temp password
    });
    res.status(201).json({ message: 'Donor registered successfully', donor: { ...donor.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Approve donor after blood received - hide for 3 months
router.post('/:id/approve-donation', protect, async (req, res) => {
  try {
    const hiddenUntil = new Date();
    hiddenUntil.setMonth(hiddenUntil.getMonth() + 3);
    const donor = await Donor.findByIdAndUpdate(req.params.id, {
      isHidden: true,
      hiddenUntil,
      lastDonationDate: new Date(),
    }, { new: true });
    res.json({ message: 'Donation approved. Donor hidden for 3 months.', donor });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Donor donation history
router.get('/history', protect, async (req, res) => {
  try {
    if (req.userType !== 'donor') return res.status(403).json({ message: 'Donor only' });
    const donor = await Donor.findById(req.userId).select('donationHistory name bloodGroup');
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
