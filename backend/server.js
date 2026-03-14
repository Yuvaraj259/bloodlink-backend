const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// FIX 1: Allow ALL origins - fixes phone CORS issue
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'], credentials: false },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  res.setHeader('Bypass-Tunnel-Reminder', 'true');
  next();
});

// FIX 2: Add database name to MongoDB URI
const rawUri = process.env.MONGO_URI || '';
const mongoUri = rawUri.includes('/bloodlink') ? rawUri : rawUri.replace('/?', '/bloodlink?').replace(/\/$/, '/bloodlink');
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB Connected to: bloodlink'))
  .catch(err => console.error('MongoDB Error:', err.message));

// FIX 3: Set io and connectedUsers BEFORE routes
const connectedUsers = {};
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/certificates', require('./routes/certificates'));

// Debug: see connected users
app.get('/api/debug/connections', (req, res) => {
  res.json({ count: Object.keys(connectedUsers).length, users: connectedUsers });
});

// FIX 4: Socket with full logging
io.on('connection', (socket) => {
  console.log('New socket:', socket.id, '| Total:', io.engine.clientsCount);

  socket.on('register', (userId) => {
    if (!userId) return;
    connectedUsers[userId.toString()] = socket.id;
    app.set('connectedUsers', connectedUsers);
    console.log('REGISTERED userId=' + userId + ' socketId=' + socket.id);
    socket.emit('registered', { userId, socketId: socket.id, status: 'ok' });
  });

  socket.on('donor_accept', ({ requestId, donorId, location }) => {
    io.emit('donor_accepted', { requestId, donorId, location });
    io.emit('request_accepted_' + requestId, { requestId, donorId, location });
  });

  socket.on('donor_decline', ({ requestId, donorId }) => {
    io.emit('donor_declined', { requestId, donorId });
    io.emit('request_declined_' + requestId, { requestId, donorId });
  });

  socket.on('donor_location_update', ({ requestId, userId, location }) => {
    // Broadcast to the specific request
    io.emit('location_updated_' + requestId, { userId, location });
    console.log(`Live Location: Request=${requestId} User=${userId} Lat=${location.lat} Lng=${location.lng}`);
  });

  socket.on('disconnect', (reason) => {
    for (const [uid, sid] of Object.entries(connectedUsers)) {
      if (sid === socket.id) {
        delete connectedUsers[uid];
        app.set('connectedUsers', connectedUsers);
        console.log('DISCONNECTED userId=' + uid + ' reason=' + reason);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server running on port ' + PORT));
