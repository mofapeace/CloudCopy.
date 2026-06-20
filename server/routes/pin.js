const express = require('express');
const bcrypt = require('bcrypt');
const supabase = require('../supabase');
const { generateCode, hashCode } = require('../services/twoFactorAuth');
const { getSignedUrl } = require('../services/storage');
const router = express.Router();

router.post('/verify', async (req, res) => {
  try {
    const { pin, shopId } = req.body;

    if (!pin || !shopId) {
      return res.status(400).json({ error: 'Missing pin or shopId' });
    }

    // Fetch pending jobs that could match:
    // 1. Jobs locked to this specific shop
    // 2. Jobs with open PIN mode (shop_id is null — any shop can claim)
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .or(`shop_id.eq.${shopId},shop_id.is.null`);

    if (error) {
      console.error('PIN verify query error:', error);
      throw error;
    }

    // Find matching PIN
    let matchedJob = null;
    for (const job of (jobs || [])) {
      const isMatch = await bcrypt.compare(pin.toString(), job.pin_hash);
      if (isMatch) {
        matchedJob = job;
        break;
      }
    }

    if (!matchedJob) {
      return res.status(404).json({ error: 'Invalid PIN or job expired' });
    }

    // Re-use 2FA code if it already exists, otherwise generate one
    let twoFACode = matchedJob.two_fa_code;
    
    // We only generate a new code if one doesn't exist
    if (!twoFACode) {
      twoFACode = generateCode();
      
      // Store 2FA code in job and claim the job for this shop
      const updateData = { 
        two_fa_code: twoFACode, 
        two_fa_verified: false 
      };
      
      // If the job was open (no shop), claim it for this shop now
      if (!matchedJob.shop_id) {
        updateData.shop_id = shopId;
      }

      const { error: updateError } = await supabase
        .from('jobs')
        .update(updateData)
        .eq('id', matchedJob.id);
        
      if (updateError) {
        console.error('Failed to save 2FA code:', updateError);
        throw updateError;
      }
        
      console.log(`🔐 Generated NEW 2FA Code for job ${matchedJob.id}: ${twoFACode}`);
    } else {
      console.log(`🔐 Re-using existing 2FA Code for job ${matchedJob.id}: ${twoFACode}`);
    }
    


    console.log(`🔐 2FA Code for job ${matchedJob.id}: ${twoFACode}`);

    let fileUrl = null;
    if (matchedJob.file_path && matchedJob.file_path !== 'deleted') {
      fileUrl = await getSignedUrl(matchedJob.file_path);
    }

    res.json({
      id: matchedJob.id,
      studentName: matchedJob.student_name,
      pageCount: matchedJob.page_count,
      color: matchedJob.color,
      copies: matchedJob.copies,
      doubleSided: matchedJob.double_sided,
      price: matchedJob.price_cfa,
      createdAt: matchedJob.created_at,
      studentConfirmed: matchedJob.student_confirmed,
      fileUrl: fileUrl,
      twoFARequired: true,
      twoFACode: twoFACode,  // Send code directly in app for now
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

    // Verify 2FA code
    const { verifyCode } = require('../services/twoFactorAuth');
    
    if (!verifyCode(twoFACode, job.two_fa_code)) {
      return res.status(401).json({ error: 'Invalid 2FA code. Please try again.' });
    }

    // Mark 2FA as verified and student as confirmed
    await supabase
      .from('jobs')
      .update({ 
        two_fa_verified: true, 
        two_fa_verified_at: new Date().toISOString(),
        student_confirmed: true
      })
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
