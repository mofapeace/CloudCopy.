const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabase');
const { generateCode, hashCode } = require('../services/twoFactorAuth');
const router = express.Router();

router.post('/verify', async (req, res) => {
  try {
    const { pin, shopId } = req.body;

    if (!pin || !shopId) {
      return res.status(400).json({ error: 'Missing pin or shopId' });
    }

    // Fetch jobs based on pin_mode
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .or(`and(shop_id.eq.${shopId},pin_mode.eq.open),and(shop_id.eq.${shopId},pin_mode.eq.locked)`);

    if (error) throw error;

    // Find matching PIN
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

    // Generate 2FA code
    const twoFACode = generateCode();
    const twoFAHash = hashCode(twoFACode);

    // Store 2FA code in job
    await supabase
      .from('jobs')
      .update({ two_fa_code: twoFAHash, two_fa_verified: false })
      .eq('id', matchedJob.id);

    // TODO: Send 2FA code to student (email, SMS, push notification, or in-app)
    // For now, log it (in production, implement proper channel)
    console.log(`🔐 2FA Code for job ${matchedJob.id}: ${twoFACode}`);

    res.json({
      id: matchedJob.id,
      studentName: matchedJob.student_name,
      pageCount: matchedJob.page_count,
      color: matchedJob.color,
      copies: matchedJob.copies,
      price: matchedJob.price_cfa,
      createdAt: matchedJob.created_at,
      twoFARequired: true,  // Signal that 2FA is needed
      twoFACode: twoFACode,  // Send code directly in app
      message: 'Student must confirm 2FA on their phone to release this job.'
    });

  } catch (err) {
    console.error('Pin Verify Error:', err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Confirm 2FA code (student enters code on their phone)
router.post('/confirm-2fa', async (req, res) => {
  try {
    const { jobId, twoFACode } = req.body;

    if (!jobId || !twoFACode) {
      return res.status(400).json({ error: 'Missing jobId or 2FA code' });
    }

    // Fetch job
    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (fetchError || !job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify 2FA code (simple SHA256 comparison)
    const crypto = require('crypto');
    const inputHash = crypto.createHash('sha256').update(twoFACode).digest('hex');
    
    if (inputHash !== job.two_fa_code) {
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }

    // Mark 2FA as verified
    await supabase
      .from('jobs')
      .update({ two_fa_verified: true, two_fa_verified_at: new Date().toISOString() })
      .eq('id', jobId);

    res.json({ 
      message: 'Student confirmed! Ready to print.',
      twoFAVerified: true 
    });

  } catch (err) {
    console.error('2FA Confirm Error:', err);
    res.status(500).json({ error: 'Failed to confirm 2FA' });
  }
});

// Release job for printing (operator starts print after 2FA confirmed)
router.post('/release', async (req, res) => {
  try {
    const { jobId } = req.body;
    
    // Check if 2FA verified
    const { data: currentJob, error: fetchError } = await supabase
      .from('jobs')
      .select('two_fa_verified')
      .eq('id', jobId)
      .single();
      
    if (fetchError) throw fetchError;
    if (!currentJob.two_fa_verified) {
      return res.status(403).json({ error: 'Student has not confirmed 2FA yet.' });
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
