const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');
const { protect } = require('../middleware/auth');

// Get current active request for donor
router.get('/active', protect, async (req, res) => {
  try {
    const request = await BloodRequest.findOne({
      acceptedBy: req.userId,
      status: 'accepted'
    });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Send emergency blood request
router.post('/', protect, async (req, res) => {
  try {
    const { patientName, bloodGroup, hospitalName, message, urgency, location, donorIds } = req.body;

    // Find nearby available donors (broad search for testing)
    let query = {};
    if (donorIds && Array.isArray(donorIds) && donorIds.length > 0) {
      query = { _id: { $in: donorIds } };
    } else {
      if (bloodGroup) query.bloodGroup = bloodGroup;
      if (location?.city) {
        const cityClean = location.city.trim();
        query['location.city'] = { $regex: cityClean, $options: 'i' };
      }
    }

    const donors = await Donor.find(query).limit(10);
    const fs = require('fs');
    fs.appendFileSync('sms_debug.log', `[${new Date().toISOString()}] REQUEST CREATED: Group=${bloodGroup}, City=${location?.city} | Query=${JSON.stringify(query)} | MATCHED: ${donors.length}\n`);
    console.log(`Found ${donors.length} donors for request`);

    const request = await BloodRequest.create({
      requestedBy: req.userId,
      patientName, bloodGroup, hospitalName, message, urgency, location,
      notifiedDonors: donors.map(d => d._id),
    });

    // Send SMS via Twilio if configured
    if (process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('your_')) {
      const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      for (const donor of donors) {
        try {
          let donorPhone = donor.phone.trim();
          if (donorPhone.length === 10 && !donorPhone.startsWith('+')) {
            donorPhone = `+91${donorPhone}`;
          }

          await twilio.messages.create({
            body: `BLOODLINK EMERGENCY: ${bloodGroup} blood needed at ${hospitalName || 'nearby hospital'}. Patient: ${patientName}. Are you available? Reply YES or NO. Request ID: ${request._id}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: donorPhone,
          });
          console.log(`SMS sent to donor ${donor.name} (${donorPhone})`);
          fs.appendFileSync('sms_debug.log', `[${new Date().toISOString()}] SMS SENT to ${donor.name} (${donorPhone})\n`);
        } catch (smsErr) {
          console.error('SMS error:', smsErr.message);
          fs.appendFileSync('sms_debug.log', `[${new Date().toISOString()}] SMS ERROR to ${donor.name}: ${smsErr.message}\n`);
        }
      }
    }

    // Emit socket to each donor
    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers') || {};

    console.log('Connected users map:', connectedUsers);

    const payload = {
      requestId: request._id,
      patientName,
      bloodGroup,
      hospitalName,
      message,
      urgency,
    };

    donors.forEach(donor => {
      const donorId = donor._id.toString();
      const donorSocketId = connectedUsers[donorId];
      console.log(`Donor ${donor.name} (${donorId}) socket: ${donorSocketId || 'OFFLINE'}`);

      if (donorSocketId) {
        // Online: send directly to their socket
        io.to(donorSocketId).emit('blood_request', payload);
        io.to(donorSocketId).emit(`request_${donorId}`, payload);
        console.log(`Sent to online donor: ${donor.name}`);
      } else {
        // Offline: broadcast (they may reconnect)
        io.emit(`request_${donorId}`, payload);
        io.emit('blood_request', payload); // broadcast as fallback
        console.log(`Broadcast for offline donor: ${donor.name}`);
      }
    });

    res.status(201).json({ request, notifiedCount: donors.length });
  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Donor accepts request
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const { location } = req.body;
    const request = await BloodRequest.findByIdAndUpdate(req.params.id, {
      status: 'accepted',
      acceptedBy: req.userId,
      acceptedAt: new Date(),
      donorLocation: location,
    }, { new: true });

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers') || {};

    const donor = await Donor.findById(req.userId);
    const donorContact = {
      _id: donor._id,
      name: donor.name,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      location: donor.location,
    };

    const payload = { donorId: req.userId, location, requestId: req.params.id, donor: donorContact };

    // Notify the user who sent the request
    const requesterId = request.requestedBy?.toString();
    const requesterSocket = connectedUsers[requesterId];
    if (requesterSocket) {
      io.to(requesterSocket).emit('donor_accepted', payload);
      io.to(requesterSocket).emit(`request_accepted_${req.params.id}`, payload);
    }
    io.emit('donor_accepted', payload);
    io.emit(`request_accepted_${req.params.id}`, payload);

    // Notify other donors that request is fulfilled (Atomic Broadcast)
    if (request.notifiedDonors) {
      const otherDonors = await Donor.find({
        _id: { $in: request.notifiedDonors, $ne: req.userId }
      });

      const twilioEnabled = process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('your_');
      const twilio = twilioEnabled ? require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;
      console.log(`[Atomic Broadcast] Notifying ${otherDonors.length} other donors about fulfillment. Twilio Enabled: ${!!twilio}`);
      for (const other of otherDonors) {
        // 1. Socket Notification
        const sid = connectedUsers[other._id.toString()];
        const fulfilledPayload = {
          requestId: req.params.id,
          message: 'A donor has been found. Thank you for your coordination!',
        };
        if (sid) {
          io.to(sid).emit('request_fulfilled_notify', fulfilledPayload);
          console.log(`   -> Notified online donor ${other.name} via socket.`);
        }

        // 2. SMS Notification
        if (twilio) {
          try {
            let otherPhone = other.phone.trim();
            if (otherPhone.length === 10 && !otherPhone.startsWith('+')) {
              otherPhone = `+91${otherPhone}`;
            }
            await twilio.messages.create({
              body: `BLOODLINK: A donor has been found. Thank you for your coordination!`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: otherPhone,
            });
            console.log(`   -> Sent fulfillment SMS to ${other.name} (${otherPhone})`);
            fs.appendFileSync('sms_debug.log', `[${new Date().toISOString()}] BROADCAST FULFILLED to ${other.name} (${otherPhone})\n`);
          } catch (smsErr) {
            console.error('Broadcast SMS error:', smsErr.message);
          }
        }
      }
    }

    res.json({ message: 'Accepted. Your location is being shared.', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Donor declines request
router.post('/:id/decline', protect, async (req, res) => {
  try {
    const request = await BloodRequest.findByIdAndUpdate(req.params.id, {
      $push: { declinedBy: req.userId },
    }, { new: true });

    const io = req.app.get('io');
    const connectedUsers = req.app.get('connectedUsers') || {};
    const payload = { donorId: req.userId, requestId: req.params.id };

    const requesterId = request.requestedBy?.toString();
    const requesterSocket = connectedUsers[requesterId];
    if (requesterSocket) {
      io.to(requesterSocket).emit('donor_declined', payload);
      io.to(requesterSocket).emit(`request_declined_${req.params.id}`, payload);
    }
    io.emit('donor_declined', payload);

    res.json({ message: 'Declined', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User marks request fulfilled (donation received)
router.post('/:id/fulfill', protect, async (req, res) => {
  try {
    const request = await BloodRequest.findByIdAndUpdate(req.params.id, {
      status: 'fulfilled',
      fulfilledAt: new Date(),
    }, { new: true });

    if (request.acceptedBy) {
      const hiddenUntil = new Date();
      hiddenUntil.setMonth(hiddenUntil.getMonth() + 3);
      await Donor.findByIdAndUpdate(request.acceptedBy, {
        isHidden: true,
        hiddenUntil,
        lastDonationDate: new Date(),
        $push: { donationHistory: { date: new Date(), hospitalName: request.hospitalName } },
      });
    }

    res.json({ message: 'Donation approved. Donor hidden for 3 months.', request });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's requests
router.get('/my', protect, async (req, res) => {
  try {
    const requests = await BloodRequest.find({ requestedBy: req.userId })
      .populate('acceptedBy', 'name bloodGroup phone location')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Test webhook endpoint
router.all('/test-webhook', async (req, res) => {
  const fs = require('fs');
  const testMsg = `[${new Date().toISOString()}] WEBHOOK TEST: Method=${req.method} Received ${JSON.stringify(req.body || req.query)}\n`;
  fs.appendFileSync('sms_debug.log', testMsg);
  console.log('Webhook test received:', req.method, req.body || req.query);
  res.json({ success: true, message: 'Webhook received via ' + req.method });
});

// Twilio SMS reply webhook
router.post('/sms-reply', async (req, res) => {
  console.log('[SMS-Webhook] Incoming Request:', req.body);
  const { Body, From } = req.body;
  const reply = Body?.trim().toUpperCase();

  const fs = require('fs');
  const logMsg = `[${new Date().toISOString()}] RAW SMS: From=${From} Body=${Body}\n`;
  fs.appendFileSync('sms_debug.log', logMsg);

  console.log(`SMS reply from ${From}: ${reply}`);

  // Find donor by phone number
  const Donor = require('../models/Donor');
  const phone = From.replace('+91', '').replace('+', '');
  const donor = await Donor.findOne({
    phone: { $regex: phone, $options: 'i' }
  });

  if (!donor) {
    fs.appendFileSync('sms_debug.log', `Donor not found for phone: ${phone}\n`);
    return res.send('<Response><Message>Donor not found</Message></Response>');
  }

  fs.appendFileSync('sms_debug.log', `Donor found: ${donor.name} (${donor._id})\n`);

  // Find their latest pending request
  const request = await BloodRequest.findOne({
    notifiedDonors: donor._id,
    status: 'pending'
  }).sort({ createdAt: -1 });

  if (!request) {
    fs.appendFileSync('sms_debug.log', `No pending request found for donor: ${donor._id}\n`);
    return res.send('<Response><Message>No active request found</Message></Response>');
  }

  fs.appendFileSync('sms_debug.log', `Request found: ${request._id}\n`);

  const io = req.app.get('io');
  const connectedUsers = req.app.get('connectedUsers') || {};

  if (reply === 'YES') {
    await BloodRequest.findByIdAndUpdate(request._id, {
      status: 'accepted',
      acceptedBy: donor._id,
      acceptedAt: new Date(),
      donorLocation: donor.location?.coordinates || null,
    });

    // Notify user on screen with donor contact (so frontend can show contact details immediately)
    const requesterId = request.requestedBy?.toString();
    const requesterSocket = connectedUsers[requesterId];

    const donorContact = {
      _id: donor._id,
      name: donor.name,
      phone: donor.phone,
      bloodGroup: donor.bloodGroup,
      location: donor.location,
    };

    const payload = {
      donorId: donor._id,
      requestId: request._id,
      donor: donorContact,
      location: donor.location?.coordinates ? { lat: donor.location.coordinates[1], lng: donor.location.coordinates[0] } : null
    };

    // Send to specific requester if online
    if (requesterSocket) {
      io.to(requesterSocket).emit('donor_accepted', payload);
      fs.appendFileSync('sms_debug.log', `Sent to requester socket: ${requesterSocket}\n`);
    }

    // Also emit to request-specific channel
    io.emit(`request_accepted_${request._id}`, payload);

    // Broadcast to all (fallback)
    io.emit('donor_accepted', payload);

    // Notify other donors that request is fulfilled (SMS Webhook Atomic Broadcast)
    if (request.notifiedDonors) {
      const otherDonors = await Donor.find({
        _id: { $in: request.notifiedDonors, $ne: donor._id }
      });

      const twilioEnabled = process.env.TWILIO_ACCOUNT_SID && !process.env.TWILIO_ACCOUNT_SID.includes('your_');
      const twilio = twilioEnabled ? require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;
      console.log(`[Atomic Broadcast] SMS-Reply: Notifying ${otherDonors.length} others. Twilio Enabled: ${!!twilio}`);
      for (const other of otherDonors) {
        // 1. Socket Notification
        const sid = connectedUsers[other._id.toString()];
        const fulfilledPayload = {
          requestId: request._id,
          message: 'A donor has been found. Thank you for your coordination!',
        };
        if (sid) {
          io.to(sid).emit('request_fulfilled_notify', fulfilledPayload);
          console.log(`   -> Notified donor ${other.name} via socket.`);
        }

        // 2. SMS Notification
        if (twilio) {
          try {
            let otherPhone = other.phone.trim();
            if (otherPhone.length === 10 && !otherPhone.startsWith('+')) {
              otherPhone = `+91${otherPhone}`;
            }
            await twilio.messages.create({
              body: `BLOODLINK: A donor has been found. Thank you for your coordination!`,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: otherPhone,
            });
            console.log(`   -> Sent fulfillment SMS to ${other.name} (${otherPhone})`);
            fs.appendFileSync('sms_debug.log', `[${new Date().toISOString()}] BROADCAST FULFILLED (via SMS accept) to ${other.name} (${otherPhone})\n`);
          } catch (smsErr) {
            console.error('Broadcast SMS error:', smsErr.message);
          }
        }
      }
    }

    fs.appendFileSync('sms_debug.log', `Emitted donor_accepted event and broadcasted fulfillment for request ${request._id}\n`);

    res.send('<Response><Message>Thank you! The patient has been notified. Please go to the hospital.</Message></Response>');

  } else if (reply === 'NO') {
    await BloodRequest.findByIdAndUpdate(request._id, {
      $push: { declinedBy: donor._id }
    });

    const payload = { donorId: donor._id, requestId: request._id };
    io.emit('donor_declined', payload);

    res.send('<Response><Message>Thank you for responding. We will find another donor.</Message></Response>');

  } else {
    res.send('<Response><Message>Please reply YES or NO only.</Message></Response>');
  }
});

module.exports = router;
