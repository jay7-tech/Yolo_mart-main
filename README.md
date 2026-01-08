# Yolo Mart — Smart Retail Demo 🛒

**Yolo Mart** is a demo project that showcases a smart retail/checkout experience: a React frontend, an Express backend, live RFID scanning (simulated via terminal), barcode/QR decoding, Personalised preference AI analysation, simple OTP login (Twilio), and an AI/chat assistant placeholder.

---

## Features ✅

- Product browsing and details
- Cart management and preferences
- Allergen identifiers
- Personalised AI backed machine  
- Real-time RFID scan notifications via WebSocket
- Barcode/QR image scanning endpoint
- OTP-based phone verification (Twilio-ready, falls back to console)
- Demo AI/chat UI and recommendation components

---

## Tech stack 🔧

- Frontend: React + Vite, Tailwind
- Backend: Node.js + Express
- WebSocket: `ws`
- Barcode/QR decoding: `@zxing/library` (optional on server)

---

## Quickstart

### Prerequisites

- Node.js (18+ recommended)
- npm

### Backend

1. Install dependencies:

```bash
cd backend
npm install
```

2. (Optional) Configure environment variables in `backend/.env`:

```
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+91xxxxxxxxxx
PORT=3001
```

If Twilio vars are not set, OTPs will be generated and printed to the console for demo/testing.

3. Start the server:

```bash
node server.js
```

The server serves API endpoints, a WebSocket server for RFID broadcasts, and listens for simulated RFID input from the terminal.

**Simulate RFID:** type the RFID tag (digits/characters) in the backend terminal and press Enter — the server will broadcast an `RFID_SCAN` message to connected WebSocket clients.

### Frontend

1. Install dependencies:

```bash
cd react-part
npm install
```

2. Start the dev server:

```bash
npm run dev
```

Open the app at the URL printed by Vite (usually `http://localhost:5173`).

---

## APIs (selected)

- POST `/api/send-otp` — send or generate OTP for a phone
- POST `/api/verify-otp` — verify OTP
- POST `/api/preferences` — save user preferences
- GET `/api/preferences/:phone` — fetch user preferences
- GET `/api/product/:idOrCategory` — get product by ID or list by category
- POST `/api/product/scan` — upload image (multipart or base64) to decode barcode/QR and lookup product

---

## Data

- Product data lives in `products.json` at the repo root. Edit this file to add or modify demo products.
- Uploads (temporary) are saved to `uploads/` when using the image scan endpoint.

---

## Developer notes

- Server-side barcode decode requires `@zxing/library` and `canvas`. The endpoint will return helpful messages if these are not installed.
- `backend/services/rfidWatcher.js` reads from stdin — useful for manual testing and demos.

---

## Contributing ✨

Contributions welcome. Please open issues or PRs and include steps to reproduce or test your change.

---

## License

This repository does not include a license file—add one if you intend to reuse or publish the code.

---

Happy hacking! 🚀
