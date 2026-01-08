// CameraScanner.jsx
// React component (default export) that provides the UI the user requested.
// Behavior tuned for the efficient flow: "scan → detect id → open existing product page".
// When a barcode/QR is decoded the component will immediately close and navigate to
// `/product/<decoded-id>` so your existing product page and add-to-cart flow handle the rest.

import React, { useEffect, useRef, useState } from 'react';

// Vite uses import.meta.env for env vars. Use VITE_API_URL in .env if you want to override.
// Fallback to localhost:3001 for local backend.
const BACKEND_BASE = import.meta?.env?.VITE_API_URL || 'http://localhost:3001';

// Default export
export default function CameraScanner({
  openOnClickSelector = '#camera-icon', // selector of camera icon to auto-bind
  onAddToCart = null, // optional callback(product) => void (not used for redirect flow)
  productLookupUrl = `${BACKEND_BASE}/api/product`, // kept for fallback server upload endpoint
}) {

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState('choose'); // choose | scanning | result
  const [decodedId, setDecodedId] = useState(null);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const zxReaderRef = useRef(null);

  // Bind camera icon click if selector exists
  useEffect(() => {
    const el = document.querySelector(openOnClickSelector);
    if (el) {
      const onClick = (e) => { e.preventDefault(); openScanner(); };
      el.addEventListener('click', onClick);
      return () => el.removeEventListener('click', onClick);
    }
  }, [openOnClickSelector]);

  // expose open function globally (optional)
  useEffect(() => {
    window.openScanner = () => openScanner();
    return () => { try { delete window.openScanner } catch(e){} };
  }, []);

  // allow external close event
  useEffect(() => {
    const handler = () => { closeScanner(); };
    window.addEventListener('scanner-close', handler);
    return () => window.removeEventListener('scanner-close', handler);
  }, []);

  async function openScanner() {
    setOpen(true);
    setStep('choose');
    setDecodedId(null);
    setError(null);
  }

  function closeScanner() {
    stopCamera();
    setOpen(false);
  }

  // Close scanner and navigate to the product page for the given id
  function openProductById(id) {
    try { closeScanner(); } catch(e) { console.warn('closeScanner failed', e); }
    const productUrl = `/product/${encodeURIComponent(id)}`;
    // Default: full navigation to product page (works in all setups)
    window.location.href = productUrl;
    // If you prefer client-side routing with react-router, replace by using `navigate()`.
  }

  // Start camera and scanning
  async function startCameraAndScan() {
    setStep('scanning');
    setDecodedId(null);
    setError(null);

    // lazy-load @zxing/library in browser
    let ZXing;
    try {
      ZXing = await import('@zxing/library');
    } catch (e) {
      console.error('Please install @zxing/library to enable in-browser scanning:', e);
      setError('Decoder library not available. Install @zxing/library.');
      return;
    }

    const codeReader = new ZXing.BrowserMultiFormatReader();
    zxReaderRef.current = codeReader;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // start decoding continuously until a code is found
      codeReader.decodeFromVideoElementContinuously(videoRef.current, (result, err) => {
        if (result) {
          const text = result.getText ? result.getText() : String(result);
          console.log('Decoded text:', text);
          setDecodedId(text);
          stopCamera();
          try { codeReader.reset(); } catch(e){}
          openProductById(text);
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
          console.debug('ZXing decode error (non-fatal):', err);
        }
      });
    } catch (err) {
      console.error('Camera start failed', err);
      setError('Unable to access camera: ' + String(err));
    }
  }

  function stopCamera() {
    try {
      if (zxReaderRef.current) {
        try { zxReaderRef.current.reset(); } catch(e){}
        zxReaderRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        try { videoRef.current.pause(); videoRef.current.srcObject = null; } catch(e){}
      }
    } catch (e) {
      console.warn('Error stopping camera', e);
    }
  }

  // Handle file upload and decode client-side using ZXing
  async function handleFileUpload(file) {
    setError(null);
    setStep('scanning');
    try {
      const ZXing = await import('@zxing/library');
      // read file into an <img> then draw to canvas and decode
      const img = document.createElement('img');
      const url = URL.createObjectURL(file);
      img.src = url;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      // Upload image to backend scan endpoint for server decoding (resilient to empty/non-JSON)
  async function uploadImageToServer(file) {
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(productLookupUrl + '/scan', { method: 'POST', body: form });

    // Try to parse JSON safely
    const text = await res.text();
    let j = null;
    if (text && text.trim().length > 0) {
      try {
        j = JSON.parse(text);
      } catch (parseErr) {
        console.warn('Server response not JSON:', parseErr, 'raw:', text);
      }
    }

    if (!res.ok) {
      // If server rejected, prefer server JSON message if any
      const msg = j && j.message ? j.message : `Server returned ${res.status} ${res.statusText}`;
      setError('Upload to server failed: ' + msg);
      return;
    }

    if (j && j.success && j.decoded) {
      setDecodedId(j.decoded);
      openProductById(j.decoded);
    } else if (j && j.success === false && j.message) {
      setError('Upload to server failed: ' + j.message);
    } else {
      setError('Upload to server failed: server returned unexpected response.');
      console.warn('uploadImageToServer: unexpected server response', { res, text, parsed: j });
    }
  } catch (e) {
    console.error('Upload to server failed', e);
    setError('Upload to server failed: ' + String(e));
  }
}


      // Browser reader
      const reader = new ZXing.BrowserMultiFormatReader();
      try {
        // decodeFromCanvas is available in some builds; attempt it
        const result = await reader.decodeFromCanvas(canvas);
        const text = result.getText ? result.getText() : String(result);
        setDecodedId(text);
        openProductById(text);
      } catch (e) {
        // fallback: upload to backend for server-side decode
        console.warn('Client decode failed, will attempt server-side decode', e);
        await uploadImageToServer(file);
      }

    } catch (e) {
      console.error('File decode error', e);
      setError('Decoding failed: ' + String(e));
    }
  }

  // Upload image to backend scan endpoint for server decoding
  async function uploadImageToServer(file) {
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(productLookupUrl + '/scan', { method: 'POST', body: form });
      const j = await res.json();
      if (j && j.success && j.decoded) {
        setDecodedId(j.decoded);
        openProductById(j.decoded);
      } else {
        setError(j && j.message ? j.message : 'Server decode failed');
      }
    } catch (e) {
      console.error('Upload to server failed', e);
      setError('Upload to server failed: ' + String(e));
    }
  }

  function onChooseFileClick() {
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const f = e.target.files && e.target.files[0];
    if (f) handleFileUpload(f);
  }

  // UI
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[92%] max-w-4xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left column: controls */}
        <div className="col-span-1 p-2">
          <h3 className="text-xl font-semibold">Scan / Upload Image</h3>
          <p className="text-sm text-muted-foreground mb-2">Choose an option below to supply a product image or scan directly with camera.</p>

          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <h4 className="font-medium">1) Upload image</h4>
              <p className="text-sm mt-1">Upload a photo of the product or barcode from your device.</p>
              <div className="mt-2 flex gap-2">
                <button onClick={onChooseFileClick} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Choose file</button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-medium">2) Capture / Scan</h4>
              <p className="text-sm mt-1">Open camera and point at the barcode or QR. Detection happens automatically.</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => startCameraAndScan()} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200">Open Camera</button>
                <button onClick={() => { stopCamera(); setStep('choose'); }} className="px-3 py-2 rounded border">Stop</button>
              </div>
            </div>

            <div className="border rounded-lg p-3">
              <h4 className="font-medium">3) Result</h4>
              <p className="text-sm mt-1">Detected ID: {decodedId ? <strong>{decodedId}</strong> : <span className="text-muted-foreground">None</span>}</p>
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
          </div>

          <div className="mt-4 flex justify-between">
            <div />
            <button onClick={closeScanner} className="px-3 py-2 rounded bg-red-50 border">Close</button>
          </div>
        </div>

        {/* Middle column: camera preview */}
        <div className="col-span-1 p-2 flex flex-col items-center justify-center">
          <h4 className="font-medium mb-2">Camera</h4>
          <div className="w-full h-64 bg-black rounded overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-contain" playsInline muted />
            {!streamRef.current && (
              <div className="absolute text-white/70">Camera stopped</div>
            )}
          </div>
          <p className="text-sm mt-2">While camera is active, the component will automatically detect barcodes/QR codes.</p>
        </div>

        {/* Right column: minimal product hint (not used for redirect flow) */}
        <div className="col-span-1 p-2">
          <h4 className="font-medium">Product</h4>
          <div className="mt-3">
            <div className="border rounded-lg p-4 text-sm text-muted-foreground">Detected ID will open the product page automatically. Use upload or capture to scan.</div>
            {decodedId && (
              <div className="mt-3 p-2 bg-yellow-50 rounded">Decoded ID: <strong>{decodedId}</strong></div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/*
Usage notes:
- Paste this file to: src/components/CameraScanner.jsx
- Add a camera icon/button in your header with id="camera-icon".
- Place <CameraScanner openOnClickSelector="#camera-icon" /> near root (App.jsx or _app.jsx).
- Install dependency in frontend: npm install @zxing/library
- Optionally use server-side fallback: replace productLookupUrl + install backend packages and use /api/product/scan
*/
