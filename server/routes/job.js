const express = require('express');
const supabase = require('../supabase');
const router = express.Router();

// Get job status by ID
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      id: job.id,
      studentName: job.student_name,
      status: job.status,
      twoFAVerified: job.two_fa_verified,
      twoFAVerifiedAt: job.two_fa_verified_at,
      pageCount: job.page_count,
      color: job.color,
      copies: job.copies,
      price: job.price_cfa,
      pinMode: job.pin_mode
    });

  } catch (err) {
    console.error('Job Status Error:', err);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

module.exports = router;
