# React Frontend — Yolo Mart (Quickstart)

This folder contains the React + Vite frontend for **Yolo Mart** — a demo smart-retail app featuring product browsing, cart, a chat assistant, and RFID/QR interaction support.

---

## Quick setup

1. Install dependencies:

```bash
cd react-part
npm install
```

2. Start the dev server:

```bash
npm run dev
```

Open the app at the URL shown by Vite (usually `http://localhost:5173`).

---

## Available scripts

- `npm run dev` — start Vite dev server (hot reload)
- `npm run build` — build production bundle
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint checks

---

## Notes & useful tips

- Barcode/QR scanning: the frontend uses camera-based scanning (`@zxing/library`) in `CameraScanner.jsx`. When uploading images to the backend scan endpoint (`/api/product/scan`), the server tries to decode using `@zxing/library` and `canvas` if available.

- WebSocket: the frontend listens for RFID scan events via WebSocket to update the UI in real-time.

- Simulating RFID scans: run the backend and type the RFID string in the backend terminal and press Enter; the backend will broadcast the scan.

- If Twilio SMS is not configured, OTP generation will fall back to console logging (see backend logs).

---

## Where to find things

- Main entry: `src/main.jsx`
- Core components: `src/components/` (Cart, CameraScanner, ChatBot, ProductList, Preferences, etc.)
- Environment & settings: `vite.config.js`, `postcss.config.js`, `tailwind.config.js`

---

## Contributing

Feel free to open issues or PRs. Keep changes scoped to either `backend/` or `react-part/` and add brief notes to the PR describing how to test your change.

---

**Happy hacking!** 🚀
