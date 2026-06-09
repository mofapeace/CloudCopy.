const express = require('express');
const supabase = require('../supabase');
const { getSignedUrl } = require('../services/storage');
const { autoNuke } = require('../services/cleanup');
const router = express.Router();

// Polled by print-agent to get jobs in "printing" status
router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;

    // Fetch jobs that are:
    // 1. In 'printing' status (ready to print)
    // 2. Either Open PIN (any shop can print) OR Locked PIN for this specific shop
    // 3. 2FA verified
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'printing')
      .eq('two_fa_verified', true)
      .or(`pin_mode.eq.open,and(pin_mode.eq.locked,shop_id.eq.${shopId})`);

    if (error) throw error;

    const printableJobs = await Promise.all(jobs.map(async (job) => {
      let fileUrl = null;
      if (job.file_path && job.file_path !== 'deleted') {
        fileUrl = await getSignedUrl(job.file_path);
      }
      return {
        id: job.id,
        fileUrl,
        studentName: job.student_name,
        color: job.color,
        copies: job.copies,
        doubleSided: job.double_sided,
        pinMode: job.pin_mode
      };
    }));

    res.json(printableJobs);
  } catch (err) {
    console.error('Queue Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// Print-agent confirms job is printed
router.post('/printed', async (req, res) => {
  try {
    const { jobId } = req.body;
    
    await supabase
      .from('jobs')
      .update({ status: 'printed', printed_at: new Date().toISOString() })
      .eq('id', jobId);

    // Trigger auto-nuke for 10 mins from now
    autoNuke(jobId);

    res.json({ message: 'Marked as printed' });
  } catch (err) {
    console.error('Print Confirm Error:', err);
    res.status(500).json({ error: 'Failed to mark as printed' });
  }
});

module.exports = router;
