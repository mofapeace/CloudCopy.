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

    if (!file || !studentName) {
      return res.status(400).json({ error: 'Missing required fields: file and studentName are required' });
    }

    // 1. Calculate pages
    let pageCount = 1;
    if (file.mimetype === 'application/pdf') {
      try {
        const pdfDoc = await PDFDocument.load(file.buffer);
        pageCount = pdfDoc.getPageCount();
      } catch (pdfErr) {
        console.error('PDF parsing error:', pdfErr);
        // Default to 1 page if parsing fails
        pageCount = 1;
      }
    } else if (file.mimetype.startsWith('image/')) {
      pageCount = 1;
    }

    // 2. Upload file to storage
    let filePath;
    try {
      filePath = await uploadDocument(file);
    } catch (storageErr) {
      console.error('Storage upload error:', storageErr);
      return res.status(500).json({ error: 'Failed to upload file to storage', details: storageErr.message });
    }

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

    // Resolve shop IDs — convert empty strings to null
    const resolvedTargetShopId = (targetShopId && targetShopId.trim() !== '') ? targetShopId.trim() : null;
    const resolvedShopId = (shopId && shopId.trim() !== '') ? shopId.trim() : null;

    if (isPro === 'true' && resolvedTargetShopId) {
      // Locked PIN: Pro student selected a specific shop
      pinMode = 'locked';
      try {
        const exactPrice = await getExactPrice(resolvedTargetShopId, pageCount, isColor, isDoubleSided, numCopies, colorPagesMap);
        priceData = { price: exactPrice, priceMin: null, priceMax: null };
      } catch (priceErr) {
        console.error('Exact price error:', priceErr);
        // Fallback to range pricing
        const range = await getPriceRange(pageCount, isColor, isDoubleSided, numCopies, colorPagesMap);
        priceData = { price: null, priceMin: range.min, priceMax: range.max };
        pinMode = 'open';
      }
    } else {
      // Open PIN: Show price range
      const range = await getPriceRange(pageCount, isColor, isDoubleSided, numCopies, colorPagesMap);
      priceData = { price: null, priceMin: range.min, priceMax: range.max };
    }

    // For database storage, use exact price or average of range
    const priceCfa = priceData.price || Math.ceil((priceData.priceMin + priceData.priceMax) / 2);

    // Determine which shop_id to store (null is valid for open PIN)
    const finalShopId = resolvedTargetShopId || resolvedShopId || null;

    // 5. Save to database
    const jobRecord = {
      shop_id: finalShopId,
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
      pin_mode: pinMode
    };

    console.log('Inserting job record:', { ...jobRecord, pin_hash: '[REDACTED]', raw_pin: '[REDACTED]' });

    const { data: job, error } = await supabase.from('jobs').insert([jobRecord]).select().single();

    if (error) {
      console.error('Supabase job insert error:', error);
      return res.status(500).json({ error: 'Failed to save job to database', details: error.message });
    }

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
    res.status(500).json({ error: 'Failed to process upload', details: err.message });
  }
});

module.exports = router;
