const express = require('express');
const supabase = require('../supabase');
const { getSignedUrl } = require('../services/storage');
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

    let fileUrl = null;
    if (job.file_path && job.file_path !== 'deleted') {
      fileUrl = await getSignedUrl(job.file_path);
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
      doubleSided: job.double_sided,
      price: job.price_cfa,
      pinMode: job.pin_mode,
      studentConfirmed: job.student_confirmed,
      fileUrl: fileUrl
    });

  } catch (err) {
    console.error('Job Status Error:', err);
    res.status(500).json({ error: 'Failed to fetch job status' });
  }
});

module.exports = router;
