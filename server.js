const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const cors = require('cors');
const http = require('http');
const ApiError = require('./utils/ApiError');
const globalError = require('./middleware/errorMiddleware');
const setupAdminJS = require('./admin');
const { generateAll } = require('./Services/fakerService');
const Chat= require ("./models/chatModel.js");
const { init } = require('./socket');
const i18n = require("i18n");

// Load environment variables
dotenv.config();

// Import passport configuration
require('./config/passport');

const app = express();

// Middleware
app.use(express.json({ limit: '20kb' }));
app.use(morgan('dev'));
app.use(cors());
app.use(mongoSanitize());

// Configure session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret',
  resave: false,
  saveUninitialized: true
}));

i18n.configure({
  locales: ["en", "ar"], // Supported languages
  directory: __dirname + "/locales", // Folder for JSON files
  defaultLocale: "en", // Default language
  queryParameter: "lang", // Query parameter for language switching
  autoReload: true, // Automatically reload language files when they change
  syncFiles: true, // Sync missing translations to all files
  cookie: "lang", // Name of the cookie to store language preference
});

module.exports = i18n;
// Initialize Passport and restore authentication state from the session
app.use(passport.initialize());
app.use(passport.session());
// Use i18n middleware
app.use(i18n.init);

// Rate limiting middleware
// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100,
//     message: 'Too many requests from this IP, please try again later',
//   })
// );

// MongoDB connection
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`Database connected: ${mongoose.connection.host}`);

    // Drop the 'email_1' index if it exists
    mongoose.connection.db.collection('lawyers').dropIndex('email_1', (err, result) => {
      if (err) {
        console.error('Error dropping index:', err);
      } else {
        console.log('Email index dropped:', result);
      }
    });

    // Optionally, you can call other functions here like generateAll()
    // generateAll();
  })
  .catch((error) => {
    console.error('Database connection error:', error);
    process.exit(1);
  });
// Create HTTP server
const server = http.createServer(app);

// Socket.io configuration
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['my-custom-header'],
    credentials: true,
  },
});

// Handle new connections
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('join', (lawyerId) => {
    socket.join(lawyerId);
    console.log(`Client joined room: ${lawyerId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
// Initialize Socket.io
init(server);

// Export a function to get the io instance
function getIo() {
  return io;
}

// Define routes
app.use('/api/v1/user', require('./routes/userRoutes'));
app.use('/api/v1/auth', require('./routes/authRoutes')); 
app.use('/api/v1/cases', require('./routes/caseRoutes'));
app.use('/api/v1/lawyers', require('./routes/lawyerRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/consultations', require('./routes/ConsultationRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/chat', require('./routes/chatRoutes'));
app.use('/api/v1/caseType', require('./routes/caseTypeRoutes'));
app.use('/api/v1/search', require('./routes/searchRoutes'));
app.use('/api/v1/specialLawyer', require('./routes/PannerRoutes'));
app.use('/api/v1/appointments', require('./routes/appointmentRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/locations',require('./routes/locationRoutes'));


app.use("/api/v1/help", require("./routes/helpRoutes"));



app.use('/api/v1/contact', require('./routes/contactUsRoutes'));
// Server static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// AdminJS setup and server start
setupAdminJS()
  .then(({ adminJs, router }) => {
   
    app.use(adminJs.options.rootPath, router);

    // 404 Handler
    app.all('*', (req, res, next) => {
      next(new ApiError(`Can't find this route: ${req.originalUrl}`, 400));
    });

    // Global error handling middleware for express
    app.use(globalError);

    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error setting up AdminJS:', error);
    process.exit(1);
  });

module.exports = { server, getIo };
