const express = require('express');
const cors = require('cors');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Import services
const WebSocketServer = require('./services/websocket');
const RFIDWatcher = require('./services/rfidWatcher');

// Initialize Twilio
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Store OTPs temporarily
const otpStore = {};

// Send OTP endpoint - TWILIO MODE
app.post('/api/send-otp', async (req, res) => {
  const { phone } = req.body;
  
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid phone number' 
    });
  }
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with 5-minute expiry
  otpStore[phone] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000
  };
  
  try {
    // Send OTP via Twilio SMS
    const message = await twilioClient.messages.create({
      body: `Your NutriScan verification code is: ${otp}. Valid for 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phone}` // Indian phone numbers
    });
    
    console.log(`\n${'='.repeat(40)}`);
    console.log(`📱 SMS sent to +91${phone}`);
    console.log(`📨 Message SID: ${message.sid}`);
    console.log(`🔐 OTP: ${otp} (for logging only)`);
    console.log(`⏰ Valid for 5 minutes`);
    console.log(`${'='.repeat(40)}\n`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully via SMS'
    });
  } catch (error) {
    console.error('❌ Twilio Error:', error.message);
    
    // Fallback to console log in case of Twilio error
    console.log(`\n${'='.repeat(40)}`);
    console.log(`⚠️ SMS FAILED - DEMO MODE`);
    console.log(`📱 Phone: ${phone}`);
    console.log(`🔐 OTP: ${otp}`);
    console.log(`⏰ Valid for 5 minutes`);
    console.log(`${'='.repeat(40)}\n`);
    
    res.json({ 
      success: true, 
      message: 'OTP generated (SMS failed, check console)',
      otp: otp // Send OTP in response as fallback
    });
  }
});

// Verify OTP endpoint
app.post('/api/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  
  const stored = otpStore[phone];
  
  if (!stored) {
    return res.status(400).json({ 
      success: false, 
      message: 'OTP not found. Please request a new OTP.' 
    });
  }
  
  if (Date.now() > stored.expiresAt) {
    delete otpStore[phone];
    return res.status(400).json({ 
      success: false, 
      message: 'OTP expired. Please request a new one.' 
    });
  }
  
  if (stored.otp === otp) {
    delete otpStore[phone];
    console.log(`✅ OTP verified successfully for ${phone}`);
    return res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });
  }
  
  res.status(400).json({ 
    success: false, 
    message: 'Invalid OTP. Please try again.' 
  });
});

// Import and use routes
const preferencesRouter = require('./routes/preferences');
const productsRouter = require('./routes/products');

app.use('/api/preferences', preferencesRouter);
app.use('/api/product', productsRouter);

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);

// Load products helper
const getProducts = () => {
  const fs = require('fs');
  const productsPath = path.join(__dirname, '..', 'products.json');
  const data = fs.readFileSync(productsPath, 'utf8');
  return JSON.parse(data);
};

// Find product by RFID
const findProductByRFID = (rfid) => {
  const products = getProducts();
  return products.find(p => p.rfid === rfid);
};

// RFID scan callback
const handleRFIDScan = (rfid) => {
  console.log(`Processing RFID: ${rfid}`);
  const product = findProductByRFID(rfid);
  
  if (product) {
    console.log(`✅ Product found: ${product.name}`);
    wsServer.broadcastRFIDScan(rfid, product);
  } else {
    console.log(`❌ No product found with RFID: ${rfid}`);
  }
};

// Start RFID watcher
const rfidWatcher = new RFIDWatcher(handleRFIDScan);
rfidWatcher.start();

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server running`);
  console.log(`📡 RFID watcher monitoring (terminal input mode)`);
  console.log(`📱 Twilio SMS enabled`);
  console.log(`${'='.repeat(50)}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  rfidWatcher.stop();
  process.exit(0);
});