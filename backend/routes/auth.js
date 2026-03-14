const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');

const generateToken = (id, type) =>
  jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── USER REGISTER ──────────────────────────────────────────────────────────
router.post('/user/register', async (req, res) => {
  try {
    const { name, email, password, phone, bloodGroup, location } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const user = await User.create({ name, email, password, phone, bloodGroup, location });
    res.status(201).json({ token: generateToken(user._id, 'user'), user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── USER LOGIN ──────────────────────────────────────────────────────────────
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    res.json({ token: generateToken(user._id, 'user'), user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DONOR REGISTER ──────────────────────────────────────────────────────────
router.post('/donor/register', async (req, res) => {
  try {
    const { name, email, password, phone, bloodGroup, age, gender, location } = req.body;
    if (await Donor.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const donor = await Donor.create({ name, email, password, phone, bloodGroup, age, gender, location, registeredBy: 'self' });
    res.status(201).json({ token: generateToken(donor._id, 'donor'), donor: { ...donor.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── DONOR LOGIN ─────────────────────────────────────────────────────────────
router.post('/donor/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const donor = await Donor.findOne({ email });
    if (!donor || !(await donor.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    if (!donor.isApproved) return res.status(403).json({ message: 'Your account is pending admin approval' });
    res.json({ token: generateToken(donor._id, 'donor'), donor: { ...donor.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── HOSPITAL REGISTER ───────────────────────────────────────────────────────
router.post('/hospital/register', async (req, res) => {
  try {
    const { name, email, password, phone, type, address, city, state, pincode, licenseNumber, contactPerson } = req.body;
    if (await Hospital.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const hospital = await Hospital.create({ name, email, password, phone, type, address, city, state, pincode, licenseNumber, contactPerson });
    res.status(201).json({ message: 'Registration submitted for admin approval', hospital: { ...hospital.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── HOSPITAL LOGIN ──────────────────────────────────────────────────────────
router.post('/hospital/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hospital = await Hospital.findOne({ email });
    if (!hospital || !(await hospital.comparePassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    if (!hospital.isApproved) return res.status(403).json({ message: 'Your account is pending admin approval' });
    res.json({ token: generateToken(hospital._id, 'hospital'), hospital: { ...hospital.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN LOGIN ─────────────────────────────────────────────────────────────
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: 'admin' });
    if (!user || !(await user.comparePassword(password))) return res.status(401).json({ message: 'Invalid admin credentials' });
    res.json({ token: generateToken(user._id, 'user'), user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
