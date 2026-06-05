const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const { generatePin } = require('../services/pinGenerator');
const { calculatePrice } = require('../services/pricing');
const { uploadDocument } = require('../services/storage');
const supabase = require('../supabase');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { studentName, color, doubleSided, copies, shopId } = req.body;

    if (!file || !studentName || !shopId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Calculate pages
    let pageCount = 1;
    if (file.mimetype === 'application/pdf') {
      const pdfDoc = await PDFDocument.load(file.buffer);
      pageCount = pdfDoc.getPageCount();
    } else if (file.mimetype.startsWith('image/')) {
      pageCount = 1; // Images count as 1 page
    }

    // 2. Upload file to storage
    const filePath = await uploadDocument(file);

    // 3. Generate PIN & Hash
    const { pin, hash } = await generatePin();

    // 4. Calculate price
    const isColor = color === 'true';
    const isDoubleSided = doubleSided === 'true';
    const numCopies = parseInt(copies, 10) || 1;
    let colorPagesMap = [];
    try {
      if (req.body.colorPagesMap) colorPagesMap = JSON.parse(req.body.colorPagesMap);
    } catch (e) {}

    const priceCfa = calculatePrice(pageCount, isColor, isDoubleSided, numCopies, colorPagesMap);

    // 5. Save to database
    const { data: job, error } = await supabase.from('jobs').insert([{
      shop_id: shopId,
      pin_hash: hash,
      student_name: studentName,
      file_path: filePath,
      page_count: pageCount,
      color: isColor,
      double_sided: isDoubleSided,
      copies: numCopies,
      price_cfa: priceCfa
    }]).select().single();

    if (error) throw error;

    res.json({
      pin,
      price: priceCfa,
      job_id: job.id
    });

  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: 'Failed to process upload' });
  }
});

module.exports = router;
