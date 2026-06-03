const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabase');
const router = express.Router();

router.post('/verify', async (req, res) => {
  try {
    const { pin, shopId, twoFactorCode } = req.body;

    if (!pin || !shopId) {
      return res.status(400).json({ error: 'Missing pin or shopId' });
    }

    // Mock 2FA Validation
    // If code is not provided, we could return a specific status asking for it.
    // For this demo, we assume the frontend will pass '123456' as the mock code.
    if (!twoFactorCode || twoFactorCode !== '123456') {
      return res.status(403).json({ error: 'Invalid or missing 2FA code', requires2FA: true });
    }

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('shop_id', shopId)
      .eq('status', 'pending');

    if (error) throw error;

    let matchedJob = null;
    for (const job of jobs) {
      const isMatch = await bcrypt.compare(pin.toString(), job.pin_hash);
      if (isMatch) {
        matchedJob = job;
        break;
      }
    }

    if (!matchedJob) {
      return res.status(404).json({ error: 'Invalid PIN or job expired' });
    }

    res.json({
      id: matchedJob.id,
      studentName: matchedJob.student_name,
      pageCount: matchedJob.page_count,
      color: matchedJob.color,
      copies: matchedJob.copies,
      price: matchedJob.price_cfa,
      createdAt: matchedJob.created_at
    });

  } catch (err) {
    console.error('Pin Verify Error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Release job (Operator confirms print)
router.post('/release', async (req, res) => {
  try {
    const { jobId } = req.body;
    
    const { data: job, error } = await supabase
      .from('jobs')
      .update({ status: 'printing' })
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Job released for printing', job });
  } catch (err) {
    console.error('Release Error:', err);
    res.status(500).json({ error: 'Failed to release job' });
  }
});

module.exports = router;
