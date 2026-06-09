const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const { generatePin } = require('../services/pinGenerator');
const { getPriceRange, getExactPrice } = require('../services/pricing');
const { uploadDocument } = require('../services/storage');
const supabase = require('../supabase');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { 
      studentName, 
      color, 
      doubleSided, 
      copies, 
      shopId,       // For Open PIN: shop where they'll pick up (or null for any)
      targetShopId, // For Locked PIN: specific shop selected by Pro user
      user_email,
      isPro
    } = req.body;

    if (!file || !studentName || !shopId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Calculate pages
    let pageCount = 1;
    if (file.mimetype === 'application/pdf') {
      const pdfDoc = await PDFDocument.load(file.buffer);
      pageCount = pdfDoc.getPageCount();
    } else if (file.mimetype.startsWith('image/')) {
      pageCount = 1;
    }

    // 2. Upload file to storage
    const filePath = await uploadDocument(file);

    // 3. Generate PIN & Hash
    const { pin, hash } = await generatePin();

    // 4. Calculate price (range for Open, exact for Locked)
    const isColor = color === 'true';
    const isDoubleSided = doubleSided === 'true';
    const numCopies = parseInt(copies, 10) || 1;
    let colorPagesMap = [];
    try {
      if (req.body.colorPagesMap) colorPagesMap = JSON.parse(req.body.colorPagesMap);
    } catch (e) {}

    let priceData = {};
    let pinMode = 'open';

    if (isPro && targetShopId) {
      // Locked PIN: Pro student selected a specific shop
      pinMode = 'locked';
      const exactPrice = await getExactPrice(targetShopId, pageCount, isColor, isDoubleSided, numCopies, colorPagesMap);
      priceData = { price: exactPrice, priceMin: null, priceMax: null };
    } else {
      // Open PIN: Show price range
      const range = await getPriceRange(pageCount, isColor, isDoubleSided, numCopies, colorPagesMap);
      priceData = { price: null, priceMin: range.min, priceMax: range.max };
    }

    // For database storage, use exact price or average of range
    const priceCfa = priceData.price || Math.ceil((priceData.priceMin + priceData.priceMax) / 2);

    // 5. Save to database
    const { data: job, error } = await supabase.from('jobs').insert([{
      shop_id: targetShopId || shopId, // For Locked PIN: use target shop, else use initial shop
      user_email: user_email || null,
      raw_pin: pin,
      pin_hash: hash,
      student_name: studentName,
      file_path: filePath,
      page_count: pageCount,
      color: isColor,
      double_sided: isDoubleSided,
      copies: numCopies,
      price_cfa: priceCfa,
      pin_mode: pinMode  // 'open' or 'locked'
    }]).select().single();

    if (error) throw error;

    res.json({
      pin,
      priceMin: priceData.priceMin,
      priceMax: priceData.priceMax,
      price: priceData.price,
      pinMode,
      job_id: job.id
    });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

module.exports = router;
