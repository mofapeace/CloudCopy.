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

    // Removed mock 2FA validation

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
      createdAt: matchedJob.created_at,
      studentConfirmed: matchedJob.student_confirmed
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
    
    // Check if student has confirmed
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('student_confirmed')
      .eq('id', jobId)
      .single();
      
    if (fetchError) throw fetchError;
    if (!currentJob.student_confirmed) {
      return res.status(403).json({ error: 'Student has not confirmed this print job yet.' });
    }

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
