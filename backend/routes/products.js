const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Load products from JSON file
const getProducts = () => {
  const productsPath = path.join(__dirname, '..', '..', 'products.json');
  const data = fs.readFileSync(productsPath, 'utf8');
  return JSON.parse(data);
};

// Get single product by ID or get products by category
router.get('/:identifier', (req, res) => {
  const { identifier } = req.params;
  
  try {
    const allProducts = getProducts();
    
    // First, try to find a product with this exact ID
    const product = allProducts.find(p => p.id === identifier);
    
    if (product) {
      console.log(`Found product by ID: ${product.name}`);
      return res.json({
        success: true,
        product: product
      });
    }
    
    // If not found by ID, treat as category
    const categoryProducts = allProducts.filter(
      product => product.category.toLowerCase() === identifier.toLowerCase()
    );
    
    console.log(`Found ${categoryProducts.length} products in category: ${identifier}`);
    
    res.json({
      success: true,
      products: categoryProducts,
      count: categoryProducts.length
    });
  } catch (error) {
    console.error('Error loading products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load products',
      product: null
    });
  }
});

// --- IMAGE SCAN ENDPOINT ---
// Accepts multipart/form-data with field 'image' or JSON { imageBase64: "data:...,..." }
// Returns JSON always.
const tryRequire = (name) => {
  try { return require(name); } catch (e) { return null; }
};

router.post('/scan', upload.single('image'), async (req, res) => {
  try {
    let imgPath = null;
    let createdTmp = false;

    if (req.file && req.file.path) {
      imgPath = req.file.path;
    } else if (req.body && req.body.imageBase64) {
      // save base64 to temp file
      const m = req.body.imageBase64.match(/^data:(image\/\w+);base64,(.*)$/);
      const b64 = m ? m[2] : req.body.imageBase64;
      const ext = m ? m[1].split('/')[1] : 'png';
      const tmpDir = path.join(__dirname, '..', '..', 'uploads');
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      imgPath = path.join(tmpDir, `upload_${Date.now()}.${ext}`);
      fs.writeFileSync(imgPath, Buffer.from(b64, 'base64'));
      createdTmp = true;
    } else {
      return res.status(400).json({ success: false, message: 'No image provided. Send multipart/form-data (field "image") or JSON with imageBase64.' });
    }

    // try to use JS-based ZXing decoder and canvas
    const ZXing = tryRequire('@zxing/library');
    const canvasModule = tryRequire('canvas');

    if (!ZXing) {
      // If ZXing not installed, return helpful JSON but don't crash
      if (createdTmp && imgPath && fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      return res.status(501).json({
        success: false,
        message: 'Barcode decoding library not installed on server. To enable server decode, run: npm install @zxing/library canvas multer'
      });
    }

    if (!canvasModule) {
      if (createdTmp && imgPath && fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      return res.status(501).json({
        success: false,
        message: 'Canvas not installed. Please install canvas to enable server-side image decoding: npm install canvas (may require native libs).'
      });
    }

    const { loadImage, createCanvas } = canvasModule;
    const img = await loadImage(imgPath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);

    // Convert to luminance
    const luminances = new Uint8ClampedArray(img.width * img.height);
    for (let i = 0, j = 0; i < imageData.data.length; i += 4, j++) {
      const r = imageData.data[i], g = imageData.data[i+1], b = imageData.data[i+2];
      luminances[j] = (r + g + b) / 3;
    }

    const { RGBLuminanceSource, BinaryBitmap, HybridBinarizer, MultiFormatReader } = ZXing;

    try {
      const source = new RGBLuminanceSource(luminances, img.width, img.height);
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(source));
      const reader = new MultiFormatReader();
      const result = reader.decode(binaryBitmap);
      const text = result.getText ? result.getText() : String(result);

      // lookup product by id or barcode in products.json
      const getProductsForScan = () => {
        const productsPath = path.join(__dirname, '..', '..', 'products.json');
        if (!fs.existsSync(productsPath)) return [];
        const data = fs.readFileSync(productsPath, 'utf8');
        return JSON.parse(data);
      };
      const products = getProductsForScan();
      const found = products.find(p => p.id === text || p.barcode === text) || null;

      // cleanup temp file only if created by us (do not delete user-uploaded files if you want to keep them)
      if (createdTmp && imgPath && fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      if (req.file && req.file.path) {
        // optionally remove multer uploaded file too
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }

      return res.json({ success: true, decoded: text, product: found });
    } catch (err) {
      // decode failed
      if (createdTmp && imgPath && fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      if (req.file && req.file.path) {
        try { fs.unlinkSync(req.file.path); } catch(e) {}
      }
      return res.status(422).json({ success: false, message: 'Failed to decode barcode/QR from image.', error: String(err) });
    }
  } catch (err) {
    console.error('Scan endpoint error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error', error: String(err) });
  }
});

module.exports = router;
