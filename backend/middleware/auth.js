const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ message: 'Not authorized' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userType = decoded.type;
    req.userId = decoded.id;

    if (decoded.type === 'user') {
      req.user = await User.findById(decoded.id).select('-password');
    } else if (decoded.type === 'donor') {
      req.user = await Donor.findById(decoded.id).select('-password');
    } else if (decoded.type === 'hospital') {
      req.user = await Hospital.findById(decoded.id).select('-password');
    }

    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.userType !== 'user' || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};

const hospitalOnly = (req, res, next) => {
  if (req.userType !== 'hospital') {
    return res.status(403).json({ message: 'Hospital/Bootcamp access only' });
  }
  next();
};

module.exports = { protect, adminOnly, hospitalOnly };
